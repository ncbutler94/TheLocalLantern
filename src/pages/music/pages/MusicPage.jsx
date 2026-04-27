import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
import { secureFetch } from "../../../utils/secureFetch";
import { alpha, useTheme } from "@mui/material/styles";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Chip,
    Fade,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../../components/Header/Header";
import { useAuth } from "../../../components/AuthModalContext";
import UserCardPopover from "../../../components/UserCardPopover";
import SearchInput from "../../../components/SearchInput";
import usePullToRefresh from "../../../hooks/usePullToRefresh";

import ArtistDiscoverTab from "../components/ArtistDiscoverTab";
import ArtistsDirectoryContainer from "../components/ArtistsDirectoryContainer";
import MusicPostsList from "../components/MusicPostsList";
import MusicRightPanel from "../components/MusicRightPanel";
import MusicPostDetailPanel from "../components/MusicPostDetailPanel";
import EventDetailPanel from "../../events/components/EventDetailPanel";
import ArtistDetailPanel from "../components/ArtistDetailPanel";
import SwipeableRightDrawer from "../../../components/SwipeableRightDrawer";
import SwipeableBottomDrawer from "../../../components/SwipeableBottomDrawer";
import ArtistsFilter from "../components/ArtistsFilter";
import ArtistProfilePage from "../pages/ArtistProfilePage";
import PulsingDots from "../../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../../components/NetworkErrorState";

import { serializeArtistsList } from "../api/artistSerializer";
import { fetchArtistLocationCounts, fetchPostLocationCounts, fetchMyArtistAccounts } from "../api/artists";
import { fetchEventLocationCounts, fetchEventSubcategoryCounts, fetchEventCategories } from "../../events/api/eventsApi";

import { useActiveAccount } from "../../../components/AccountContext";
import EventsList from "../../events/components/EventsList";
import ShowsFilter from "../components/ShowsFilter";
import CreateEditEventModal from "../../events/modals/CreateEditEventModal";
import CreateArtistPostDialog from "../components/CreateArtistPostDialog";
import useEventsFeed from "../../events/hooks/useEventsFeed";
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import useRateLimit from '../../../utils/useRateLimit';
import RateLimitDialog from '../../../components/RateLimitDialog';
import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
// Continuous subheader scroll-hide (Facebook-style tracking)
import useSubheaderScrollHide from '../../../utils/useSubheaderScrollHide';
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from '../../../utils/geoRadius';

/**
 * MusicPage
 * - Fixed, contained layout like CommunityPage
 * - Tabs: Artists | Posts | Shows
 * - Posts tab shows all artist posts with ActionBar, UserCardPopover, click-to-detail
 * - ArtistsFilter shared between Artists and Posts tabs (Posts filter shown by default)
 * - Scroll position + filters preserved when navigating to/from ArtistPostPage
 */

const RIGHT_WIDTH = { xs: "40%", lg: "35%" };
const BOTTOM_GUTTER_PX = 0;
const APP_BACKGROUND = "background.default";
const TAB_FADE_MS = 160;

// Session storage key for persisting page state across navigations
const STATE_KEY = "ll:music:pageState";

function savePageState(state) {
    try {
        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

function loadPageState() {
    try {
        const raw = sessionStorage.getItem(STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function shuffleArray(items) {
    const arr = Array.isArray(items) ? items.slice() : [];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Stable tab metadata — defined outside component to avoid recreation on every render
// NOTE: internal key "artists" remains the musicians tab (renaming the key would touch
// 14+ references). Label + icon are what users see, so we change those instead.
// NOTE 2: the "shows" (Events) tab used to live here but was removed — events have
// their own top-level nav and surface on individual artist profiles instead.
// All shows-related state/effects/fetchers are kept dormant in this file so
// we can re-enable the tab by re-adding it to TAB_META + the tab iterator.
const TAB_META = {
    artists: { label: "Music", icon: MusicNoteRoundedIcon },
    visualArtists: { label: "Artists", icon: PaletteRoundedIcon },
    posts: { label: "Posts", icon: ForumRoundedIcon },
};

// Stable view options for posts filter — defined outside to prevent new array refs on every render.
// Combines two orthogonal concepts into one control:
//   • 'all'       → no filter
//   • 'music'     → only posts from musicians (profile_type=music)
//   • 'artist'    → only posts from visual artists (profile_type=artist)
//   • 'following' → only posts from artists the viewer follows
// The Posts tab's genre/category dropdown is only shown when 'music' or
// 'artist' is selected — the two lists are different (music genres vs art
// categories) so a blended feed can't present a meaningful single list.
const POSTS_VIEW_OPTIONS = [
    { value: "all", label: "All Posts" },
    { value: "music", label: "Music" },
    { value: "artist", label: "Artists" },
    { value: "following", label: "Following" },
];

// Stable no-op callback — defined outside to prevent new function refs on every render
const NOOP = () => {};

// Stable inputProps for search — defined outside to prevent new object refs on every render
const SEARCH_INPUT_PROPS = { maxLength: 100 };

function extractEventCategories(event) {
    const categories = [];

    const pushCategory = (slug, name) => {
        const safeSlug = String(slug || "").trim();
        const safeName = String(name || "").trim();
        if (!safeSlug && !safeName) return;
        categories.push({
            value: safeSlug || safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            label: safeName || safeSlug,
        });
    };

    const rawCategories = [
        ...(Array.isArray(event?.categories) ? event.categories : []),
        ...(Array.isArray(event?.event_categories) ? event.event_categories : []),
    ];

    rawCategories.forEach((category) => {
        if (typeof category === "string") {
            pushCategory(category, category);
            return;
        }
        if (category && typeof category === "object") {
            pushCategory(
                category.slug || category.category_slug || category.value || category.id,
                category.name || category.category_name || category.label || category.title
            );
        }
    });

    pushCategory(
        event?.categorySlug || event?.category_slug || event?.category || event?.event_category_slug,
        event?.categoryName || event?.category_name || event?.event_category_name
    );

    pushCategory(
        event?.subcategorySlug || event?.subcategory_slug || event?.event_subcategory_slug || event?.subcategory,
        event?.subcategoryName || event?.subcategory_name || event?.event_subcategory_name || event?.subcategory_label
    );

    const deduped = [];
    const seen = new Set();
    categories.forEach((category) => {
        const key = String(category.value || "").toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        deduped.push(category);
    });

    return deduped;
}

export default function MusicPage({ user }) {
    const auth = useAuth();
    const viewer = user || auth?.user || null;
    const navigate = useNavigate();
    const location = useLocation();
    const navType = useNavigationType();
    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:1439px)');
    // Phone-only breakpoint (matches Community/Business/Events pattern). Below this, the
    // compact phone header (pill tabs + tiny icon cluster) is used as-is.
    const isPhoneMusic = useMediaQuery('(max-width:899px)');
    // Tablet/laptop range (900–1439): header controls are promoted to full labeled buttons
    // (search bar, Filters, Map, Create) instead of hiding in tiny icon cluster.
    const isTabletMusic = isMobile && !isPhoneMusic;
    // Narrow end of tablet (900–1099): Filters / Map / Create collapse to icons
    // to keep the toolbar on one row.
    const isNarrowTabletMusic = useMediaQuery('(min-width:900px) and (max-width:1099px)');

    // ── Mobile-specific state (community page pattern) ──
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [mobileMapOpen, setMobileMapOpen] = useState(false);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

    // ── Close mobile detail drawer on browser back button ──
    useEffect(() => {
        if (!mobileDetailOpen) return;
        window.history.pushState({ musicDetail: true }, '');
        const handlePopState = () => setMobileDetailOpen(false);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileDetailOpen]);

    // ── Close mobile map drawer on browser back button ──
    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ musicMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);

    // Track what the mobile detail drawer should show ('discover' | 'artist' | 'post' | 'show')
    const [mobileDrawerMode, setMobileDrawerMode] = useState('discover');
    // Mobile: inline discover view (like CommunityPanel pattern)
    // 'list' = normal tab content, 'discover' = inline ArtistDiscoverTab
    const [mobileDiscoverView, setMobileDiscoverView] = useState('list');

    // Note: Previously this page observed the body class `ll-mobile-nav-hidden`
    // to expand the container when the global nav hid on scroll. With the
    // continuous scroll-hide system (Header.jsx + `--ll-nav-offset`), the
    // global bars slide via transform and the container stays at its normal
    // size — no mid-scroll layout shift needed.

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used `useSubheaderScrollHide` to translateY the
    // subheader and reclaim its vertical space via negative margin-bottom.
    // That produced jerky content shifts. The subheader is now
    // `position: sticky` under the global header and fades via
    // `opacity: calc(1 - var(--ll-nav-offset))`. Same CSS var as Header.jsx.
    const mobileHeaderRef = useRef(null);
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-music-scroll]',
        enabled: false,
    });

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll container reserves space via `padding-top: calc(header +
    // subheader)` so content doesn't sit under the floating chrome on
    // initial paint. ResizeObserver keeps the CSS var in sync with the
    // real height (filter chips, wrapping, etc.). Mobile only.
    useLayoutEffect(() => {
        if (!isMobile) {
            document.documentElement.style.removeProperty('--ll-subheader-height');
            return;
        }
        const el = mobileHeaderRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const apply = () => {
            const h = el.getBoundingClientRect().height;
            if (h > 0) {
                document.documentElement.style.setProperty('--ll-subheader-height', `${Math.ceil(h)}px`);
            }
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty('--ll-subheader-height');
        };
    }, [isMobile]);

    // ── Listen for auth:token-expired from secureFetch / axiosInstance ──
    useEffect(() => {
        const handleTokenExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    const { activeAccountType, activeArtistId, activeAccountName } = useActiveAccount();
    const isOnArtistAccount = String(activeAccountType || "").toLowerCase() === "artist";
    const isOnBusinessAccount = String(activeAccountType || "").toLowerCase() === "business";
    const isNonPersonalAccount = isOnArtistAccount || isOnBusinessAccount;

    /* ---------- rate limiting for artist posts + shows ---------- */
    const { checkLimit: checkPostLimit, recordAction: recordPost } = useRateLimit('community-post', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 15,
    });
    const { checkLimit: checkEventLimit, recordAction: recordEventCreate } = useRateLimit('event-create', {
        burstMax: 3,
        burstWindowMs: 120_000,
        maxPerHour: 10,
    });
    /* ---------- artist draft creation rate limiting ---------- */
    const { checkLimit: checkArtistDraftLimit } = useRateLimit('artist-draft-create', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 10,
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'posts',
    });

    // ── Draft / pending-review limit dialog ──
    const [draftLimitDialogOpen, setDraftLimitDialogOpen] = useState(false);
    const [draftLimitMessage, setDraftLimitMessage] = useState('');
    const [draftLimitChecking, setDraftLimitChecking] = useState(false);

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // Detect if we're returning from a post detail page (POP = browser back, or legacy PUSH with state)
    const isPopNavigation = navType === "POP";
    const cameFromPostDetail = location?.state?.from === "music-post-detail";

    const [chromeTop, setChromeTop] = useState(0);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const STYLE_ID = "ll-music-fixed-layout-style";
        const BODY_CLASS = "ll-music-fixed-layout";

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = STYLE_ID;
            styleEl.type = "text/css";
            styleEl.appendChild(
                document.createTextNode(`
html.${BODY_CLASS}, body.${BODY_CLASS} {
  overflow: hidden !important;
  padding-right: var(--ll-music-scrollbar-comp, 0px) !important;
}
`)
            );
            document.head.appendChild(styleEl);
        }

        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlPaddingRight = html.style.paddingRight;
        const prevBodyPaddingRight = body.style.paddingRight;
        const prevCssVarHtml = html.style.getPropertyValue("--ll-music-scrollbar-comp");
        const prevCssVarBody = body.style.getPropertyValue("--ll-music-scrollbar-comp");

        const applyScrollbarComp = () => {
            const scrollbarWidth = window.innerWidth - html.clientWidth;
            const comp = scrollbarWidth > 0 ? `${scrollbarWidth}px` : "0px";
            html.style.setProperty("--ll-music-scrollbar-comp", comp);
            body.style.setProperty("--ll-music-scrollbar-comp", comp);
            html.style.paddingRight = comp;
            body.style.paddingRight = comp;
        };

        const measureHeader = () => {
            const header =
                document.querySelector("header.MuiAppBar-root") ||
                document.querySelector("header") ||
                document.querySelector(".site-header") ||
                document.getElementById("header") ||
                null;
            const h = header ? header.getBoundingClientRect().bottom : 0;
            setChromeTop(h);
        };

        html.classList.add(BODY_CLASS);
        body.classList.add(BODY_CLASS);
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        applyScrollbarComp();
        measureHeader();

        let raf2 = null;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                applyScrollbarComp();
                measureHeader();
            });
        });

        const handleResize = () => {
            applyScrollbarComp();
            measureHeader();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            window.removeEventListener("resize", handleResize);

            html.classList.remove(BODY_CLASS);
            body.classList.remove(BODY_CLASS);
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;

            if (prevCssVarHtml) html.style.setProperty("--ll-music-scrollbar-comp", prevCssVarHtml);
            else html.style.removeProperty("--ll-music-scrollbar-comp");

            if (prevCssVarBody) body.style.setProperty("--ll-music-scrollbar-comp", prevCssVarBody);
            else body.style.removeProperty("--ll-music-scrollbar-comp");
        };
    }, []);

    // ── Restore state if returning from post detail ──────────────────────
    const savedStateRef = useRef(loadPageState());
    const ss = savedStateRef.current;

    const [activeTab, setActiveTab] = useState(() => {
        const saved = ss?.activeTab || "artists";
        // The "shows" (Events) tab was retired; fall back so users with
        // stale saved state don't land on an invisible tab.
        return saved === "shows" ? "artists" : saved;
    });
    const [searchQuery, setSearchQuery] = useState(ss?.searchQuery || "");
    const [searchInput, setSearchInput] = useState(ss?.searchQuery || "");

    // Tab-switch content fade (matches CommunityPanel / BusinessHubPage behavior)
    const musicTheme = useTheme();
    const tabFadeMs = musicTheme.custom?.motion?.contentFade?.durationMs ?? TAB_FADE_MS;
    const fadeTimerRef = useRef(null);
    const [contentVisible, setContentVisible] = useState(true);

    useEffect(() => {
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        };
    }, []);

    // Artists filter state
    const [showArtistFilters, setShowArtistFilters] = useState(() => ss?.showArtistFilters ?? true);
    const [artistView, setArtistView] = useState(ss?.artistView || "all");
    const [artistGenre, setArtistGenre] = useState(ss?.artistGenre || "");
    const [artistSort, setArtistSort] = useState(ss?.artistSort || "any");
    const [artistCounty, setArtistCounty] = useState(ss?.artistCounty || "All Counties");
    const [artistRadius, setArtistRadius] = useState(ss?.artistRadius || STATEWIDE);
    const [artistCity, setArtistCity] = useState(ss?.artistCity || "All Cities");

    // Posts filter state (shared ArtistsFilter component)
    const [showPostFilters, setShowPostFilters] = useState(() => ss?.showPostFilters ?? true);
    const [postView, setPostView] = useState(ss?.postView || "all");
    const [postGenre, setPostGenre] = useState(ss?.postGenre || "");
    const [postSort, setPostSort] = useState(ss?.postSort || "newest");
    const [postCounty, setPostCounty] = useState(ss?.postCounty || "All Counties");
    const [postRadius, setPostRadius] = useState(ss?.postRadius || STATEWIDE);
    const [postCity, setPostCity] = useState(ss?.postCity || "All Cities");

    // The Posts tab's genre/category dropdown is only meaningful when the
    // profile-type scope is 'music' or 'artist' (the two lists differ:
    // music genres vs art categories). When the scope flips to something
    // else — 'all' or 'following' — the existing selection would be a
    // stale filter the user can't see or clear, so clear it here.
    useEffect(() => {
        if (postView !== "music" && postView !== "artist" && postGenre) {
            setPostGenre("");
        }
    }, [postView, postGenre]);

    // Events (shows) filter state — uses EventsFilters
    const [showShowFilters, setShowShowFilters] = useState(() => ss?.showShowFilters ?? true);
    const [showView, setShowView] = useState(ss?.showView || "all");
    const [showCategory, setShowCategory] = useState(ss?.showCategory || "");
    const [showDatePreset, setShowDatePreset] = useState(ss?.showDatePreset || "upcoming");
    const [showSort, setShowSort] = useState(ss?.showSort || "soonest");
    const [showCounty, setShowCounty] = useState(ss?.showCounty || "All Counties");
    const [showRadius, setShowRadius] = useState(ss?.showRadius || STATEWIDE);
    const [showCity, setShowCity] = useState(ss?.showCity || "All Cities");


    const [artistStats, setArtistStats] = useState({ shown: 0, total: 0, loading: true });
    const [hasAnyArtists, setHasAnyArtists] = useState(null);
    const [artistFetchError, setArtistFetchError] = useState(null);
    // Mirror of the music-artist stats for the Visual Artists tab. Kept as a
    // separate slice so a filter change on one tab can't hide the empty-state
    // on the other. The directory component reports its counts via
    // onStatsChange; we use that to decide when to show the empty UI below.
    const [visualArtistStats, setVisualArtistStats] = useState({ shown: 0, total: 0, loading: true });
    const [hasAnyVisualArtists, setHasAnyVisualArtists] = useState(null);
    const [visualArtistFetchError, setVisualArtistFetchError] = useState(null);

    const [selectedArtist, setSelectedArtist] = useState(ss?.selectedArtist || null);
    const [rightTab, setRightTab] = useState(ss?.rightTab || "discover");
    const [mapViewResetKey, setMapViewResetKey] = useState(0);
    const [allArtists, setAllArtists] = useState([]);
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    // Posts tab state
    const [musicPostsRaw, setMusicPostsRaw] = useState([]);
    const [musicPosts, setMusicPosts] = useState([]);
    const [musicPostsLoading, setMusicPostsLoading] = useState(false);
    const [musicPostsError, setMusicPostsError] = useState("");
    const [musicPostsTotal, setMusicPostsTotal] = useState(0);
    const [musicPostsHasMore, setMusicPostsHasMore] = useState(false);
    const [loadingMoreMusicPosts, setLoadingMoreMusicPosts] = useState(false);
    const [postsHoveredId, setPostsHoveredId] = useState(null);
    const [selectedPost, setSelectedPost] = useState(ss?.selectedPost || null);
    const [postStats, setPostStats] = useState({ shown: 0, total: 0, loading: false });
    const [focusPostId, setFocusPostId] = useState(null);

    // Shows tab state
    const [selectedShow, setSelectedShow] = useState(null);
    const [createShowOpen, setCreateShowOpen] = useState(false);
    const [showSelectedDates, setShowSelectedDates] = useState([]);

    // Artist post creation dialog (from Music hub posts tab)
    const [createArtistPostOpen, setCreateArtistPostOpen] = useState(false);

    // Account switch dialog — shown when non-personal account tries to create artist
    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
    const [postsRefreshKey, setPostsRefreshKey] = useState(0);
    const [artistsRefreshKey, setArtistsRefreshKey] = useState(0);

    // Location counts for filter badge display (county/city)
    const [artistLocationCounts, setArtistLocationCounts] = useState(null);
    const [postLocationCounts, setPostLocationCounts] = useState(null);
    const [showLocationCounts, setShowLocationCounts] = useState(null);

    // Music subcategories fetched from the categories API + backend-driven counts
    const [musicSubcategories, setMusicSubcategories] = useState([]);
    const [subcategoryCounts, setSubcategoryCounts] = useState({});
    const [subcategoryCountsLoading, setSubcategoryCountsLoading] = useState(false);

    const [pageVisible, setPageVisible] = useState(false);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate county/radius on all three sub-tab
    // state groups (artist*, post*, show*) from the viewer's
    // home_county. Product decision (2026-04): fresh loads should start
    // statewide, and narrower defaults should be opt-in via the
    // "Apply automatically when I open this tab" checkbox on a saved
    // filter (see SavedFiltersMenu + ArtistsFilter's auto-apply effect).
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!viewer) return;
        appliedHomeDefaultRef.current = true;
    }, [viewer]);

    // Scroll position ref for the posts list container
    const postsScrollRef = useRef(null);
    // Scroll ref for the shared scroll area (artists + shows tabs)
    const mainScrollRef = useRef(null);
    const pendingScrollRestore = useRef((cameFromPostDetail || isPopNavigation) ? (ss?.scrollTop ?? null) : null);

    // Tab booleans (needed early for scroll logic; also used later in JSX)
    const isArtistsTab = activeTab === "artists";
    const isPostsTab = activeTab === "posts";
    const isShowsTab = activeTab === "shows";

    // Build a key that changes whenever any filter changes (per-tab)
    const filterResetKey = isArtistsTab
        ? `artists|${artistView}|${artistGenre}|${artistSort}|${artistCounty}|${artistCity}|${searchQuery}`
        : isPostsTab
            ? `posts|${postView}|${postGenre}|${postSort}|${postCounty}|${postCity}|${searchQuery}`
            : `shows|${showView}|${showCategory}|${showDatePreset}|${showSort}|${showCounty}|${showCity}|${searchQuery}`;

    // Smooth scroll helper (matches CommunityPanel)
    const smoothScrollToTop = useCallback((el, duration = 520) => {
        if (!el) return;
        const start = el.scrollTop;
        if (start <= 0) return;
        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.scrollTop = start * (1 - ease);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, []);

    // Scroll list to top when filters change (card stagger animation handles the visual transition)
    const didInitScrollRef = useRef(false);
    useEffect(() => {
        if (!didInitScrollRef.current) {
            didInitScrollRef.current = true;
            return;
        }
        const el = isPostsTab ? postsScrollRef.current : mainScrollRef.current;
        if (el) smoothScrollToTop(el, 520);
    }, [filterResetKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Reset scroll to top on fresh navigation (not returning from post detail)
    useEffect(() => {
        if (cameFromPostDetail || isPopNavigation) return;
        requestAnimationFrame(() => {
            if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0;
            if (postsScrollRef.current) postsScrollRef.current.scrollTop = 0;
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear the from-post-detail location state so it doesn't re-trigger on refresh
    useEffect(() => {
        if (cameFromPostDetail && location?.state?.from) {
            const nextState = { ...(location.state || {}) };
            delete nextState.from;
            navigate(location.pathname, {
                replace: true,
                state: Object.keys(nextState).length ? nextState : undefined,
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (activeTab !== "artists") {
            setSelectedArtist(null);
        }
        if (activeTab !== "shows") {
            setSelectedShow(null);
        }
    }, [activeTab]);

    const previousActiveTabRef = useRef(activeTab);

    useEffect(() => {
        const previousTab = previousActiveTabRef.current;
        if (previousTab !== activeTab) {
            setRightTab("discover");
            setMapViewResetKey((prev) => prev + 1);
            previousActiveTabRef.current = activeTab;
            // Reset scroll position to top so the new tab doesn't inherit stale scrollHeight
            const scrollEl = mainScrollRef.current;
            if (scrollEl) scrollEl.scrollTop = 0;
            // Reset search and filters when switching tabs
            setSearchQuery("");
            setSearchInput("");
            if (activeTab === "artists") {
                setArtistView("all");
                setArtistGenre("");
                setArtistSort("any");
                setArtistCounty("All Counties");
                setArtistRadius(STATEWIDE);
                setArtistCity("All Cities");
            } else if (activeTab === "posts") {
                setPostView("all");
                setPostGenre("");
                setPostSort("newest");
                setPostCounty("All Counties");
                setPostRadius(STATEWIDE);
                setPostCity("All Cities");
            } else if (activeTab === "shows") {
                setShowView("all");
                setShowCategory("");
                setShowDatePreset("upcoming");
                setShowSort("soonest");
                setShowCounty("All Counties");
                setShowRadius(STATEWIDE);
                setShowCity("All Cities");
                setShowSelectedDates([]);
            }
        }
    }, [activeTab]);

    useEffect(() => {
        const handleArtistLocationMapOpen = (event) => {
            const artist = event?.detail?.artist || null;
            if (!artist) return;
            setSelectedArtist(artist);
            setSelectedPost(null);
            setSelectedShow(null);
            setMapViewResetKey((prev) => prev + 1);
            setRightTab("map");
            // Mobile: open the map drawer; delay handled by MusicMapView's Recenter
            if (window.innerWidth < 1440) {
                const alreadyOpen = mobileMapOpen;
                setMobileMapOpen(true);
                if (!alreadyOpen) {
                    // Delay the map reset key so Recenter fires after the drawer animation
                    setTimeout(() => setMapViewResetKey((prev) => prev + 1), 380);
                }
            }
        };

        window.addEventListener("ll:music:artist-location-click", handleArtistLocationMapOpen);
        return () => {
            window.removeEventListener("ll:music:artist-location-click", handleArtistLocationMapOpen);
        };
    }, [mobileMapOpen]);

    useEffect(() => {
        let active = true;
        if (activeTab !== "artists") {
            setHasAnyArtists(null);
            return () => { active = false; };
        }

        (async () => {
            setArtistFetchError(null);
            try {
                const res = await secureFetch("/api/music/artists?limit=1", { credentials: "include", headers: getAccountHeaders() });
                if (!res.ok) throw new Error("Request failed");
                const data = await res.json();
                if (!active) return;
                const list = Array.isArray(data?.items) ? data.items : [];
                setHasAnyArtists(list.length > 0);
            } catch (err) {
                if (!active) return;
                setArtistFetchError(err);
                setHasAnyArtists(true);
            }
        })();

        return () => { active = false; };
    }, [activeTab]);

    // Fetch artists with coordinates for the map view. Runs on BOTH the Music
    // ("artists") tab and the Visual Artists ("visualArtists") tab, each
    // scoped to the right profile_type so the map never mixes musicians and
    // visual artists. Without the ?type= filter the map would return all
    // artists and misrepresent whichever tab the user was on.
    useEffect(() => {
        let active = true;
        const isArtistsView = activeTab === "artists" || activeTab === "visualArtists";
        if (!isArtistsView) return () => { active = false; };

        const mapProfileType = (activeTab === "visualArtists") ? "artist" : "music";

        (async () => {
            try {
                const url = `/api/music/artists?limit=500&type=${mapProfileType}`;
                const res = await secureFetch(url, { credentials: "include", headers: getAccountHeaders() });
                if (!res.ok) return;
                const data = await res.json();
                if (!active) return;
                const raw = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                setAllArtists(serializeArtistsList(raw));
            } catch {
                // ignore
            }
        })();

        return () => { active = false; };
    }, [activeTab, artistsRefreshKey]);

    // Fetch music posts when Posts tab is active (reacts to filter changes)
    useEffect(() => {
        let active = true;
        if (activeTab !== "posts") return () => { active = false; };

        setMusicPostsLoading(true);
        setMusicPostsError("");

        (async () => {
            try {
                const params = new URLSearchParams();
                params.set("limit", "25");
                params.set("offset", "0");
                if (searchQuery) params.set("q", searchQuery);
                if (postSort === "oldest") params.set("sort", "oldest");
                if (postSort === "newest") params.set("sort", "newest");
                // postView is a 4-way control combining subscription scope and
                // profile-type scope:
                //   'all'       → no filter (default)
                //   'music'     → profileType=music (musicians only)
                //   'artist'    → profileType=artist (visual artists only)
                //   'following' → view=following (artists the viewer follows)
                if (postView === "music") params.set("profileType", "music");
                else if (postView === "artist") params.set("profileType", "artist");
                else if (postView === "following") params.set("view", "following");

                const url = `/api/music/posts?${params.toString()}`;
                const res = await secureFetch(url, { credentials: "include", headers: getAccountHeaders() });

                if (!active) return;
                if (!res.ok) throw new Error("Failed to fetch posts");

                const data = await res.json();
                if (!active) return;

                const rawPosts = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data?.posts)
                        ? data.posts
                        : Array.isArray(data)
                            ? data
                            : [];

                const total = Number(data?.total ?? data?.totalCount ?? rawPosts.length);
                setMusicPostsRaw(rawPosts);
                setMusicPostsTotal(total);
                setMusicPostsHasMore(rawPosts.length < total);
            } catch (err) {
                if (!active) return;
                setMusicPostsError(err?.message || "Failed to load posts");
                setMusicPostsRaw([]);
                setMusicPostsHasMore(false);
            } finally {
                if (active) setMusicPostsLoading(false);
            }
        })();

        return () => { active = false; };
    }, [activeTab, searchQuery, postSort, postView, postsRefreshKey]);

    // Client-side filter raw posts by county/city/genre (backend may not support all params)
    useEffect(() => {
        let filtered = Array.isArray(musicPostsRaw) ? musicPostsRaw.slice() : [];
        const countyVal = postCounty === "All Counties" ? "" : postCounty;
        const cityVal = postCity === "All Cities" ? "" : postCity;

        if (countyVal) {
            filtered = filtered.filter((p) =>
                String(p.county || "").toLowerCase() === countyVal.toLowerCase()
            );
        }
        if (cityVal) {
            filtered = filtered.filter((p) =>
                String(p.city || "").toLowerCase() === cityVal.toLowerCase()
            );
        }
        if (postGenre) {
            filtered = filtered.filter((p) => {
                const genres = Array.isArray(p.artistGenres) ? p.artistGenres : [];
                return genres.some((g) =>
                    String(g).toLowerCase() === postGenre.toLowerCase()
                );
            });
        }
        if (postSort === "popular") {
            filtered.sort((a, b) => {
                const aCount = Number(a.likeCount ?? a.like_count ?? 0);
                const bCount = Number(b.likeCount ?? b.like_count ?? 0);
                return bCount - aCount;
            });
        } else if (postSort === "any") {
            filtered = shuffleArray(filtered);
        }

        setMusicPosts(filtered);
    }, [musicPostsRaw, postCounty, postCity, postGenre, postSort]);

    // Load more music posts (infinite scroll)
    const loadMoreMusicPosts = useCallback(async () => {
        if (loadingMoreMusicPosts || !musicPostsHasMore) return;
        setLoadingMoreMusicPosts(true);
        try {
            const currentCount = Array.isArray(musicPostsRaw) ? musicPostsRaw.length : 0;
            const params = new URLSearchParams();
            params.set("limit", "25");
            params.set("offset", String(currentCount));
            if (searchQuery) params.set("q", searchQuery);
            if (postSort === "oldest") params.set("sort", "oldest");
            if (postView === "music") params.set("profileType", "music");
            else if (postView === "artist") params.set("profileType", "artist");
            else if (postView === "following") params.set("view", "following");

            const res = await secureFetch(`/api/music/posts?${params.toString()}`, { credentials: "include", headers: getAccountHeaders() });
            if (!res.ok) return;

            const data = await res.json();
            const nextRaw = Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.posts)
                    ? data.posts
                    : Array.isArray(data)
                        ? data
                        : [];

            if (nextRaw.length) {
                setMusicPostsRaw((prev) => {
                    const existing = new Set((Array.isArray(prev) ? prev : []).map((p) => String(p?.id)));
                    const merged = (Array.isArray(prev) ? prev : []).slice();
                    nextRaw.forEach((p) => { if (p?.id && !existing.has(String(p.id))) merged.push(p); });
                    return merged;
                });
            }
            const total = Number(data?.total ?? data?.totalCount ?? (currentCount + nextRaw.length));
            setMusicPostsTotal(total);
            setMusicPostsHasMore(currentCount + nextRaw.length < total);
        } catch {
            // keep current
        } finally {
            setLoadingMoreMusicPosts(false);
        }
    }, [loadingMoreMusicPosts, musicPostsHasMore, musicPostsRaw, searchQuery, postSort, postView]);

    // Infinite scroll for music posts
    useEffect(() => {
        const el = postsScrollRef.current;
        if (!el || activeTab !== "posts") return;
        const onScroll = () => {
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
                loadMoreMusicPosts();
            }
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [activeTab, loadMoreMusicPosts]);

    // Restore scroll position after posts load when returning from detail page
    useEffect(() => {
        if (pendingScrollRestore.current == null) return;
        if (musicPostsLoading || musicPosts.length === 0) return;

        const scrollTop = pendingScrollRestore.current;
        pendingScrollRestore.current = null;

        requestAnimationFrame(() => {
            const el = postsScrollRef.current;
            if (el) el.scrollTop = scrollTop;
        });
    }, [musicPostsLoading, musicPosts.length]);

    // ── Continuously persist hub state to sessionStorage ─────────────────
    // Mirrors BusinessHubPage pattern: save on every state change so back-nav
    // always has a fresh snapshot (not just from the manual saveCurrentState call).

    // County change handlers that auto-reset radius
    const handleArtistCountyChange = (v) => {
        setArtistCounty(v);
        if (!v || v === "All Counties") setArtistRadius(STATEWIDE);
        else setArtistRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED);
    };
    const handlePostCountyChange = (v) => {
        setPostCounty(v);
        if (!v || v === "All Counties") setPostRadius(STATEWIDE);
        else setPostRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED);
    };
    const handleShowCountyChange = (v) => {
        setShowCounty(v);
        if (!v || v === "All Counties") setShowRadius(STATEWIDE);
        else setShowRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED);
    };


    useEffect(() => {
        const scrollTop = postsScrollRef.current?.scrollTop || 0;
        savePageState({
            activeTab,
            searchQuery,
            artistView,
            artistGenre,
            artistSort,
            artistCounty,
            artistRadius,
            artistCity,
            postView,
            postGenre,
            postSort,
            postCounty,
            postRadius,
            postCity,
            showView,
            showCategory,
            showDatePreset,
            showSort,
            showCounty,
            showRadius,
            showCity,
            showArtistFilters,
            showPostFilters,
            showShowFilters,
            rightTab,
            selectedPost,
            selectedArtist,
            scrollTop,
        });
    }, [activeTab, searchQuery, artistView, artistGenre, artistSort, artistCounty, artistCity, postView, postGenre, postSort, postCounty, postCity, showView, showCategory, showDatePreset, showSort, showCounty, showCity, showArtistFilters, showPostFilters, showShowFilters, rightTab, selectedPost, selectedArtist]);

    // Also save scroll position on scroll so it's captured even between state changes
    useEffect(() => {
        const el = postsScrollRef.current;
        if (!el) return;
        let rafId = null;
        const onScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                try {
                    const raw = sessionStorage.getItem(STATE_KEY);
                    if (raw) {
                        const state = JSON.parse(raw);
                        state.scrollTop = el.scrollTop;
                        sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
                    }
                } catch {
                    // ignore
                }
            });
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => {
            el.removeEventListener("scroll", onScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [musicPostsLoading]); // re-attach when loading changes (scroll element may remount)

    // State is continuously persisted by the save effect above, so no need to
    // clear after mount — the save effect always overwrites with current values.
    // Removing the old removeItem call fixes a race condition where navigating
    // away before the next save effect could leave sessionStorage empty.

    // ── Location counts for Artists tab ──────────────────────────────────
    const apiArtistCounty = artistCounty === "All Counties" ? "" : artistCounty;
    const apiArtistCity = artistCity === "All Cities" ? "" : artistCity;

    useEffect(() => {
        if (!isArtistsTab) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const data = await fetchArtistLocationCounts({
                    q: searchQuery || "",
                    genre: artistGenre || "",
                    county: apiArtistCounty || "",
                    city: apiArtistCity || "",
                    view: artistView || "all",
                    sort: artistSort || "any",
                });
                if (!cancelled) setArtistLocationCounts(data);
            } catch {
                if (!cancelled) setArtistLocationCounts({ counties: {}, cities: {} });
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isArtistsTab, searchQuery, artistGenre, apiArtistCounty, apiArtistCity, artistView, artistSort]);

    // ── Location counts for Posts tab ────────────────────────────────────
    const apiPostCounty = postCounty === "All Counties" ? "" : postCounty;
    const apiPostCity = postCity === "All Cities" ? "" : postCity;

    useEffect(() => {
        if (!isPostsTab) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const data = await fetchPostLocationCounts({
                    q: searchQuery || "",
                    genre: postGenre || "",
                    county: apiPostCounty || "",
                    city: apiPostCity || "",
                    view: postView || "all",
                    sort: postSort || "newest",
                });
                if (!cancelled) setPostLocationCounts(data);
            } catch {
                if (!cancelled) setPostLocationCounts({ counties: {}, cities: {} });
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isPostsTab, searchQuery, postGenre, apiPostCounty, apiPostCity, postView, postSort]);

    // ── Location counts for Shows tab ────────────────────────────────────
    const apiShowCounty = showCounty === "All Counties" ? "" : showCounty;
    const apiShowCity = showCity === "All Cities" ? "" : showCity;

    useEffect(() => {
        if (!isShowsTab) return;
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const datePreset = showDatePreset === "all" ? "upcoming" : showDatePreset;
                const data = await fetchEventLocationCounts({
                    q: searchQuery || "",
                    category: "music-nightlife",
                    range: datePreset,
                    posterType: "",
                    county: apiShowCounty || "",
                    city: apiShowCity || "",
                    view: showView || "all",
                    sort: showSort || "soonest",
                });
                if (!cancelled) setShowLocationCounts(data);
            } catch {
                if (!cancelled) setShowLocationCounts({ counties: {}, cities: {} });
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isShowsTab, searchQuery, showDatePreset, showCategory, apiShowCounty, apiShowCity, showView, showSort]);

    // ── Fetch music subcategories from categories API (once) ─────────
    useEffect(() => {
        if (!isShowsTab) return;
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchEventCategories();
                const cats = Array.isArray(data?.categories) ? data.categories : [];
                const musicCat = cats.find(
                    (c) => String(c?.slug || "").toLowerCase() === "music-nightlife" || String(c?.slug || "").toLowerCase() === "music"
                );
                const subs = Array.isArray(musicCat?.subcategories) ? musicCat.subcategories : [];
                if (!cancelled) {
                    setMusicSubcategories(
                        subs.map((s) => ({
                            value: String(s.slug || "").trim(),
                            label: String(s.label || s.name || s.slug || "").trim(),
                        })).filter((s) => s.value)
                    );
                }
            } catch {
                // ignore
            }
        })();
        return () => { cancelled = true; };
    }, [isShowsTab]);

    // ── Fetch subcategory counts from backend ────────────────────────
    useEffect(() => {
        if (!isShowsTab) return;
        let cancelled = false;
        setSubcategoryCountsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const datePreset = showDatePreset === "all" ? "upcoming" : showDatePreset;
                const data = await fetchEventSubcategoryCounts({
                    parentCategory: "music-nightlife",
                    q: searchQuery || "",
                    range: datePreset,
                    county: apiShowCounty || "",
                    city: (showCity === "All Cities" ? "" : showCity) || "",
                    view: showView || "all",
                    start: "",
                    end: "",
                });
                if (!cancelled) {
                    setSubcategoryCounts(data?.counts && typeof data.counts === "object" ? data.counts : {});
                }
            } catch {
                if (!cancelled) setSubcategoryCounts({});
            } finally {
                if (!cancelled) setSubcategoryCountsLoading(false);
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isShowsTab, searchQuery, showDatePreset, apiShowCounty, showCity, showView]);

    // ── Shows feed (concerts category) ─────────────────────────────────

    const showsFilters = useMemo(() => {
        const countyVal = showCounty === "All Counties" ? "" : showCounty;
        const cityVal = showCity === "All Cities" ? "" : showCity;

        const filters = {
            category: "music-nightlife",
            subcategory: showCategory || "",
            query: isShowsTab ? searchQuery : "",
            sort: showSort || "soonest",
            county: countyVal,
            city: cityVal,
            view: showView,
            includeStatewide: true,
        };

        // When calendar dates are selected, override datePreset to custom range
        if (showSelectedDates.length > 0) {
            const sorted = [...showSelectedDates].sort();
            filters.datePreset = "custom";
            filters.start = sorted[0];
            filters.end = sorted[sorted.length - 1];
        } else {
            filters.datePreset = showDatePreset === "all" ? "upcoming" : showDatePreset;
        }

        return filters;
    }, [isShowsTab, searchQuery, showSort, showDatePreset, showCounty, showCity, showSelectedDates, showView, showCategory]);

    const {
        events: showEvents,
        totalCount: showsTotalCount,
        isLoading: showsLoading,
        isRefreshing: showsRefreshing,
        isLoadingMore: showsLoadingMore,
        hasMore: showsHasMore,
        refresh: refreshShows,
        loadMore: loadMoreShows,
        error: showsError,
    } = useEventsFeed({ filters: showsFilters });

    // ── Pull-to-refresh (mobile only) ──
    const { pullRef: musicPullRef, pullIndicator } = usePullToRefresh({
        onRefresh: () => {
            if (isShowsTab) { refreshShows(); }
            else if (isPostsTab) { window.dispatchEvent(new CustomEvent('ll:musicPost:refresh')); }
            else { setArtistsRefreshKey((k) => k + 1); }
        },
        disabled: !isMobile,
    });

    const visibleShowEvents = useMemo(() => {
        return Array.isArray(showEvents) ? showEvents : [];
    }, [showEvents]);

    const showCategoryOptions = useMemo(() => {
        // Use API-fetched subcategories as the canonical list with backend-driven counts
        if (musicSubcategories.length > 0) {
            return musicSubcategories.map((sub) => ({
                value: sub.value,
                label: sub.label,
                count: Number(subcategoryCounts[sub.value.toLowerCase()] || 0),
            }));
        }
        // Fallback: no subcategories fetched yet — return empty
        return [];
    }, [musicSubcategories, subcategoryCounts]);


    const tabMeta = TAB_META;

    // Stable search handlers — defined with useCallback to avoid new refs on every render
    const handleSearchChange = useCallback((e) => {
        setSearchInput(e?.target?.value ?? e ?? "");
    }, []);

    const handleSearchSubmit = useCallback(() => {
        setSearchQuery(searchInput);
    }, [searchInput]);

    const handleSearchClear = useCallback(() => {
        setSearchInput("");
        setSearchQuery("");
    }, []);

    // Saved filters restore: update BOTH the input (searchInput) and the
    // committed term (searchQuery) so the input reflects the restored term
    // AND the fetch re-runs with it. Called by ArtistsFilter's apply.
    const handleSavedSearchChange = useCallback((val) => {
        const next = String(val || "");
        setSearchQuery(next);
        setSearchInput(next);
    }, []);

    // Stable display-stats handler to avoid infinite re-render loops.
    // setPostStats is already a stable state setter, but wrapping in useCallback
    // with a ref-based guard provides extra safety against duplicate calls.
    const handlePostDisplayStatsChange = useCallback((stats) => {
        setPostStats((prev) => {
            if (
                prev.shown === stats.shown &&
                prev.total === stats.total &&
                prev.loading === stats.loading
            ) {
                return prev; // Return same reference — no re-render
            }
            return stats;
        });
    }, []);

    // Fade out → switch tab → fade in (matches CommunityPanel / BusinessHubPage behavior)
    const handleTabSwitch = useCallback((nextTab) => {
        if (nextTab === activeTab) return;

        setContentVisible(false);
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
        }

        fadeTimerRef.current = setTimeout(() => {
            fadeTimerRef.current = null;
            setActiveTab(nextTab);
            requestAnimationFrame(() => setContentVisible(true));
        }, tabFadeMs);
    }, [activeTab, tabFadeMs]);

    const handleTogglePostFilters = () => setShowPostFilters((v) => !v);
    const handleToggleShowFilters = () => setShowShowFilters((v) => !v);
    const handleToggleArtistFilters = () => setShowArtistFilters((v) => !v);

    const handleClearPostFilters = () => {
        setPostView("all");
        setPostGenre("");
        setPostSort("newest");
        setPostCounty("All Counties");
        setPostRadius(STATEWIDE);
        setPostCity("All Cities");
        setSearchQuery("");
        setSearchInput("");
    };

    const handleClearArtistFilters = () => {
        setArtistView("all");
        setArtistGenre("");
        setArtistSort("any");
        setArtistCounty("All Counties");
        setArtistRadius(STATEWIDE);
        setArtistCity("All Cities");
        setSearchQuery("");
        setSearchInput("");
    };

    const handleClearShowFilters = () => {
        setShowView("all");
        setShowCategory("");
        setShowDatePreset("upcoming");
        setShowSort("soonest");
        setShowCounty("All Counties");
        setShowRadius(STATEWIDE);
        setShowCity("All Cities");
        setShowSelectedDates([]);
        setSearchQuery("");
        setSearchInput("");
    };

    const handleShowDatesChange = (dates) => {
        const safeDates = Array.isArray(dates) ? dates : [];
        setShowSelectedDates(safeDates);
        if (safeDates.length > 0) {
            setShowDatePreset("custom");
        } else {
            // When calendar selection is cleared, reset date preset back to "upcoming"
            // so the filter doesn't stay on "custom" (which has no start/end and shows all events)
            setShowDatePreset("upcoming");
        }
    };

    const handleOpenUserCard = (el, u) => {
        setUserAnchor(el);

        // Detect if u is an artist post (has artistId/artist_id + artistHandle/artist_handle)
        // or an artist-typed account (account_type === 'artist')
        const isArtist = Boolean(
            u?.account_type === 'artist' ||
            u?.artist_id ||
            u?.artistId ||
            ((u?.artistHandle || u?.artist_handle) && (u?.artistName || u?.artist_name))
        );

        // Detect if u is a business post / business account
        const isBusiness = !isArtist && Boolean(
            u?.account_type === 'business' ||
            u?.business_id ||
            u?.businessId ||
            ((u?.businessSlug || u?.business_slug) && (u?.businessName || u?.business_name))
        );

        if (isArtist) {
            setUserForCard({
                id: Number(u.artist_id || u.artistId || u.id) || u.id,
                account_type: 'artist',
                artist_id: Number(u.artist_id || u.artistId || u.id) || 0,
                artist_name: u.artist_name || u.artistName || u.name || '',
                artist_handle: u.artist_handle || u.artistHandle || u.handle || '',
                artist_avatar_url: u.artist_avatar_url || u.artistAvatarUrl || u.avatar_url || '',
                handle: u.artist_handle || u.artistHandle || u.handle || '',
                first_name: u.artist_name || u.artistName || u.name || '',
                last_name: '',
                avatar_url: u.artist_avatar_url || u.artistAvatarUrl || u.avatar_url || '',
                // Pass the owning user_id so the popover can distinguish
                // "viewing your own artist profile" from "viewing someone else's artist"
                owner_user_id: Number(u.owner_user_id || u.ownerUserId || u.user_id || u.userId || 0) || 0,
            });
        } else if (isBusiness) {
            setUserForCard({
                id: Number(u.business_id || u.businessId || u.id) || u.id,
                account_type: 'business',
                business_id: Number(u.business_id || u.businessId || u.id) || 0,
                business_name: u.business_name || u.businessName || u.name || '',
                business_slug: u.business_slug || u.businessSlug || u.handle || '',
                business_avatar_url: u.business_avatar_url || u.businessAvatarUrl || u.avatar_url || '',
                handle: u.business_slug || u.businessSlug || u.handle || '',
                first_name: u.business_name || u.businessName || u.name || '',
                last_name: '',
                avatar_url: u.business_avatar_url || u.businessAvatarUrl || u.avatar_url || '',
            });
        } else {
            // Personal user
            setUserForCard({
                id: u?.id || u?.user_id || u?.userId,
                handle: u?.handle,
                first_name: u?.first_name || u?.firstName,
                last_name: u?.last_name || u?.lastName,
                avatar_url: u?.avatar_url || u?.avatarUrl || u?.profile_picture,
                profile_picture: u?.profile_picture,
                home_city: u?.home_city || u?.city,
                home_county: u?.home_county || u?.county,
                state: u?.state,
                country: u?.country,
            });
        }
    };

    const handleCloseUserCard = () => {
        setUserAnchor(null);
        setUserForCard(null);
    };

    const handleViewUserProfile = (u) => {
        if (u?.account_type === 'business' || u?.business_id) {
            const slug = u?.business_slug || u?.handle;
            if (slug) { window.location.assign(`/${slug}`); return; }
        }
        if (u?.account_type === 'artist' || u?.artist_id) {
            const artHandle = u?.artist_handle || u?.handle;
            if (artHandle) { window.location.assign(`/${artHandle}`); return; }
        }
        const key = u?.handle || u?.id;
        if (!key) return;
        window.location.assign(`/${key}`);
    };

    const handleOpenCreate = async () => {
        if (!viewer || !viewer.id) {
            auth?.requireAuth?.();
            return;
        }
        if (isNonPersonalAccount) {
            setAccountSwitchOpen(true);
            return;
        }
        // Rate-limit check (in-memory burst guard)
        const rl = checkArtistDraftLimit();
        if (!rl.allowed) {
            setRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'artist drafts' });
            setRateLimitOpen(true);
            return;
        }
        // Check draft & pending counts before navigating
        try {
            setDraftLimitChecking(true);
            const resp = await fetchMyArtistAccounts();
            const list = Array.isArray(resp?.artists) ? resp.artists : [];
            const draftCount = list.filter((a) => a.status === 'draft').length;
            const pendingCount = list.filter((a) => a.status === 'pending_approval').length;
            if (draftCount >= 5) {
                setDraftLimitMessage('You already have 5 artist page drafts. Please finish or delete an existing draft before starting a new one.');
                setDraftLimitDialogOpen(true);
                return;
            }
            if (pendingCount >= 5) {
                setDraftLimitMessage('You already have 5 artist pages waiting for review. Please wait for some to be approved before submitting more.');
                setDraftLimitDialogOpen(true);
                return;
            }
        } catch {
            // If the check fails, let them through — backend will enforce
        } finally {
            setDraftLimitChecking(false);
        }
        // Pass profile type based on which tab triggered the create action.
        // Music tab ("artists" key) → music profile; new Artists tab ("visualArtists") → visual-artist profile.
        const profileType = (activeTab === "visualArtists") ? "artist" : "music";
        navigate(`/artists/setup?type=${profileType}`);
    };

    const handleSelectArtist = (artist) => {
        if (artist && window.innerWidth < 1440) {
            // Mobile: open full-screen artist profile in drawer
            setSelectedArtist(artist);
            setSelectedPost(null);
            setMobileDrawerMode('artist');
            setMobileDetailOpen(true);
            return;
        }
        setSelectedArtist(artist || null);
        setSelectedPost(null);
        if (artist) {
            // Desktop: show in right panel detail tab
            setRightTab("detail");
        }
    };

    const handleSelectPost = (post) => {
        setSelectedPost(post || null);
        setSelectedArtist(null);
        if (post) {
            setRightTab("post-detail");
            // Mobile: open post detail in full-screen drawer
            if (window.innerWidth < 1440) {
                setMobileDrawerMode('post');
                setMobileDetailOpen(true);
            }
        }
    };

    const handlePostLocationClick = useCallback((post) => {
        if (!post) return;
        setSelectedPost(post);
        setRightTab("map");
        setFocusPostId(post.id);
        // Mobile: open map drawer with delayed focus so animation finishes first
        if (window.innerWidth < 1440) {
            const alreadyOpen = mobileMapOpen;
            setMobileMapOpen(true);
            if (!alreadyOpen) {
                // Re-set focusPostId after delay so Recenter fires after drawer animation
                setTimeout(() => setFocusPostId(post.id), 380);
            }
        }
    }, [mobileMapOpen]);

    const handleFocusPostHandled = useCallback(() => {
        setFocusPostId(null);
    }, []);

    const handleSelectShow = (event) => {
        setSelectedShow(event || null);
        setSelectedArtist(null);
        setSelectedPost(null);
        if (event) {
            setRightTab("show-detail");
            // Mobile: open detail in drawer
            if (window.innerWidth < 1440) {
                setMobileDrawerMode('show');
                setMobileDetailOpen(true);
            }
        }
    };

    const handleClearShow = () => {
        setSelectedShow(null);
    };

    const handleOpenCreateShow = () => {
        if (!viewer || !viewer.id) {
            auth?.requireAuth?.();
            return;
        }
        const result = checkEventLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'event creation' });
            setRateLimitOpen(true);
            return;
        }
        setCreateShowOpen(true);
    };

    const handleCloseCreateShow = () => setCreateShowOpen(false);

    const handleShowSaved = () => {
        recordEventCreate();
        setCreateShowOpen(false);
        refreshShows();
    };

    const handleOpenCreateArtistPost = () => {
        if (!viewer || !viewer.id) {
            auth?.requireAuth?.();
            return;
        }
        const result = checkPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'posts' });
            setRateLimitOpen(true);
            return;
        }
        setCreateArtistPostOpen(true);
    };

    const handleCloseCreateArtistPost = () => setCreateArtistPostOpen(false);

    const handleArtistPostCreated = () => {
        recordPost();
        setCreateArtistPostOpen(false);
        // Trigger posts list refresh
        setPostsRefreshKey((k) => k + 1);
        showSuccess('Your post has been published!');
    };

    // ── Listen for create actions from the global Header create (+) menu ──
    const handleOpenCreateArtistPostRef = useRef(handleOpenCreateArtistPost);
    handleOpenCreateArtistPostRef.current = handleOpenCreateArtistPost;

    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};
            if (action !== 'artistPost') return;

            if (blocked === 'rateLimit') {
                setRateLimitInfo({ retryAfterSec: retryAfterSec || 10, reason: reason || 'cooldown', actionLabel: 'posts' });
                setRateLimitOpen(true);
                return;
            }

            handleOpenCreateArtistPostRef.current();
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => window.removeEventListener('ll:header:create', handleHeaderCreate);
    }, []);

    // When a user hides (reports) a post, remove it from the local list immediately
    const handlePostHidden = useCallback((postId) => {
        if (!postId) return;
        // Deselect if the hidden post was selected
        setSelectedPost((prev) => (prev && prev.id === postId) ? null : prev);
        setMusicPostsRaw((prev) =>
            (Array.isArray(prev) ? prev : []).filter((p) => p?.id !== postId)
        );
        setMusicPostsTotal((t) => Math.max(0, t - 1));
    }, []);

    // When a user blocks or reports an artist, refresh both the artists directory and posts feed
    const handleArtistBlocked = useCallback(() => {
        // Deselect any currently selected post/artist — they may belong to the blocked user
        setSelectedPost(null);
        // Refresh the posts feed so posts from blocked/reported artist vanish
        setPostsRefreshKey((k) => k + 1);
        // Refresh the artists directory so blocked/reported artists vanish
        setArtistsRefreshKey((k) => k + 1);
    }, []);

    // Listen for global block/hide events (e.g. from UserCardPopover) to refresh lists
    useEffect(() => {
        const onBlockChanged = (e) => {
            const blocked = Boolean(e?.detail?.blocked);
            if (blocked) {
                setSelectedPost(null);
                setSelectedArtist(null);
                setPostsRefreshKey((k) => k + 1);
                setArtistsRefreshKey((k) => k + 1);
            }
        };
        const onHiddenChanged = (e) => {
            const hidden = Boolean(e?.detail?.hidden);
            if (hidden) {
                setSelectedPost(null);
                setPostsRefreshKey((k) => k + 1);
                setArtistsRefreshKey((k) => k + 1);
            }
        };
        window.addEventListener('ll:user:blocked-changed', onBlockChanged);
        window.addEventListener('ll:user:hidden-changed', onHiddenChanged);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', onBlockChanged);
            window.removeEventListener('ll:user:hidden-changed', onHiddenChanged);
        };
    }, []);

    // When a user clicks "Hide posts from this artist" on a post card,
    // immediately remove all posts by that artist from the local list.
    // The backend hide was already submitted by the card component.
    const handleHideArtistPosts = useCallback((artistId) => {
        if (!artistId) return;
        const aid = Number(artistId);
        // Deselect if the selected post belongs to the hidden artist
        setSelectedPost((prev) => {
            if (!prev) return prev;
            const pAid = Number(prev.artist_id || prev.artistId || 0);
            return pAid === aid ? null : prev;
        });
        setMusicPostsRaw((prev) =>
            (Array.isArray(prev) ? prev : []).filter((p) => {
                const pArtistId = Number(p?.artist_id || p?.artistId || 0);
                return pArtistId !== aid;
            })
        );
        // Refresh the posts feed from the server to get accurate counts
        setPostsRefreshKey((k) => k + 1);
    }, []);

    const handleShowUpdate = (eventIdOrEvent, patch) => {
        // EventDetailPanel calls onEventUpdate(eventId, patch) for engagement changes (comments, likes, etc.)
        // Only replace selectedShow if a full event object is passed (e.g. from edit modal).
        if (eventIdOrEvent && typeof eventIdOrEvent === "object" && eventIdOrEvent.id) {
            setSelectedShow(eventIdOrEvent);
            // Full event mutation (edit) — refresh the list
            refreshShows();
        } else if (patch && typeof patch === "object") {
            // Minor engagement patch (comment count, like count, etc.) — just merge locally.
            // Don't refreshShows() here: the engagement broadcast system already updates EventCards,
            // and a full list refresh causes a loading flicker.
            setSelectedShow((prev) => (prev ? { ...prev, ...patch } : prev));
        }
    };

    // Navigate to ArtistPostPage, saving current state for restore on return
    const saveCurrentState = useCallback(() => {
        const scrollTop = postsScrollRef.current?.scrollTop || 0;
        savePageState({
            activeTab,
            searchQuery,
            artistView,
            artistGenre,
            artistSort,
            artistCounty,
            artistCity,
            postView,
            postGenre,
            postSort,
            postCounty,
            postCity,
            showView,
            showCategory,
            showDatePreset,
            showSort,
            showCounty,
            showCity,
            showArtistFilters,
            showPostFilters,
            showShowFilters,
            rightTab,
            selectedPost,
            selectedArtist,
            scrollTop,
        });
    }, [activeTab, searchQuery, artistView, artistGenre, artistSort, artistCounty, artistCity, postView, postGenre, postSort, postCounty, postCity, showView, showCategory, showDatePreset, showSort, showCounty, showCity, showArtistFilters, showPostFilters, showShowFilters, rightTab, selectedPost, selectedArtist]);

    const handleViewPost = (post) => {
        if (!post) return;
        const handle = post.artistHandle || post.artist_handle || post.handle || "";
        const pid = post.id;
        if (!handle || !pid) return;

        saveCurrentState();

        navigate(`/${encodeURIComponent(handle)}/posts/${encodeURIComponent(pid)}`, {
            state: { from: "music", post },
        });
    };

    const selectedArtistId =
        selectedArtist?.id ?? selectedArtist?.handle ?? selectedArtist?.artist_id ?? null;
    const selectedPostId = selectedPost?.id ?? null;

    const filtersOpen = isArtistsTab ? showArtistFilters : isPostsTab ? showPostFilters : isShowsTab ? showShowFilters : false;

    // Active filter chips for mobile — removable inline chips below search
    const activeFilterChips = useMemo(() => {
        const chips = [];
        // Show applied search term as a removable chip
        const appliedTerm = String(searchQuery || "").trim();
        if (appliedTerm) {
            const truncated = appliedTerm.length > 24 ? appliedTerm.slice(0, 24) + "…" : appliedTerm;
            chips.push({
                key: "search",
                label: `"${truncated}"`,
                onRemove: () => {
                    setSearchInput("");
                    setSearchQuery("");
                },
            });
        }
        if (isArtistsTab) {
            if (artistGenre) chips.push({ key: 'genre', label: artistGenre.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setArtistGenre("") });
            if (artistCounty && artistCounty !== "All Counties") chips.push({ key: 'county', label: `${artistCounty} County`, onRemove: () => { setArtistCounty("All Counties"); setArtistRadius(STATEWIDE); } });
            if (artistCounty && artistCounty !== "All Counties" && !isCountyOnly(artistRadius)) chips.push({ key: 'radius', label: radiusLabel(artistRadius), onRemove: () => setArtistRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED) });
            if (artistCity && artistCity !== "All Cities") chips.push({ key: 'city', label: artistCity, onRemove: () => setArtistCity("All Cities") });
            if (artistView && artistView !== "all") chips.push({ key: 'view', label: artistView.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setArtistView("all") });
            if (artistSort && artistSort !== "any") chips.push({ key: 'sort', label: `Sort: ${artistSort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setArtistSort("any") });
        } else if (isPostsTab) {
            if (postGenre) chips.push({ key: 'genre', label: postGenre.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setPostGenre("") });
            if (postCounty && postCounty !== "All Counties") chips.push({ key: 'county', label: `${postCounty} County`, onRemove: () => { setPostCounty("All Counties"); setPostRadius(STATEWIDE); } });
            if (postCounty && postCounty !== "All Counties" && !isCountyOnly(postRadius)) chips.push({ key: 'radius', label: radiusLabel(postRadius), onRemove: () => setPostRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED) });
            if (postCity && postCity !== "All Cities") chips.push({ key: 'city', label: postCity, onRemove: () => setPostCity("All Cities") });
            if (postView && postView !== "all") chips.push({ key: 'view', label: postView.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setPostView("all") });
            if (postSort && postSort !== "newest") chips.push({ key: 'sort', label: `Sort: ${postSort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setPostSort("newest") });
        } else if (isShowsTab) {
            if (showCategory) chips.push({ key: 'category', label: showCategory.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setShowCategory("") });
            if (showCounty && showCounty !== "All Counties") chips.push({ key: 'county', label: `${showCounty} County`, onRemove: () => { setShowCounty("All Counties"); setShowRadius(STATEWIDE); } });
            if (showCounty && showCounty !== "All Counties" && !isCountyOnly(showRadius)) chips.push({ key: 'radius', label: radiusLabel(showRadius), onRemove: () => setShowRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED) });
            if (showCity && showCity !== "All Cities") chips.push({ key: 'city', label: showCity, onRemove: () => setShowCity("All Cities") });
            if (showView && showView !== "all") chips.push({ key: 'view', label: showView.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setShowView("all") });
            if (showSort && showSort !== "soonest") chips.push({ key: 'sort', label: `Sort: ${showSort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setShowSort("soonest") });
            if (showDatePreset && showDatePreset !== "upcoming") chips.push({ key: 'date', label: showDatePreset.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setShowDatePreset("upcoming") });
        }
        return chips;
    }, [searchQuery, isArtistsTab, isPostsTab, isShowsTab, artistGenre, artistCounty, artistCity, artistView, artistSort, postGenre, postCounty, postCity, postView, postSort, showCategory, showCounty, showCity, showView, showSort, showDatePreset]);

    const showFooter = activeTab === "artists" || activeTab === "posts" || activeTab === "shows";
    const footerText = (() => {
        if (activeTab === "artists") {
            if (artistStats.loading) return "Loading artists\u2026";
            const total = Number(artistStats.total || 0);
            const shown = Number(artistStats.shown || 0);
            if (shown === 0 && total > 0) return "Loading artists\u2026";
            if (shown === 0) return "No artists match your filters";
            return `Displaying ${Math.min(shown, total).toLocaleString()} out of ${total.toLocaleString()} artist${total !== 1 ? "s" : ""}`;
        }
        if (activeTab === "posts") {
            if (postStats.loading || musicPostsLoading) return "Loading posts\u2026";
            const total = Number(postStats.total || 0);
            const shown = Number(postStats.shown || 0);
            if (shown === 0 && total > 0) return "Loading posts\u2026";
            if (shown === 0) return "No posts match your filters";
            return `Displaying ${Math.min(shown, total).toLocaleString()} out of ${total.toLocaleString()} post${total !== 1 ? "s" : ""}`;
        }
        if (activeTab === "shows") {
            if (showsLoading) return "Loading events\u2026";
            const total = Number(showsTotalCount || 0);
            const shown = visibleShowEvents.length;
            if (shown === 0) return "No events match your filters";
            return `Displaying ${Math.min(shown, total).toLocaleString()} out of ${total.toLocaleString()} event${total !== 1 ? "s" : ""}`;
        }
        return "";
    })();

    const showArtistsEmpty =
        activeTab === "artists" &&
        artistStats &&
        !artistStats.loading &&
        Number(artistStats.shown || 0) === 0;

    const showVisualArtistsEmpty =
        activeTab === "visualArtists" &&
        visualArtistStats &&
        !visualArtistStats.loading &&
        Number(visualArtistStats.shown || 0) === 0;

    return (
        <Box
            sx={{
                position: "fixed",
                // Track global nav offset so the container expands to fill the
                // viewport as the app bar + bottom nav slide away. Mirrors
                // CommunityPage so the floating subheader (Discover/Music tabs
                // + search) fades in lockstep with the AppBar via `--ll-nav-offset`.
                top: `calc(${chromeTop}px * (1 - var(--ll-nav-offset, 0)))`,
                left: 0,
                right: 0,
                bottom: `${BOTTOM_GUTTER_PX}px`,
                "@media (max-width: 899px)": {
                    bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px * (1 - var(--ll-nav-offset, 0)))`,
                },
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                p: 0,
                pt: 0,
                boxSizing: "border-box",
                bgcolor: 'background.paper',
                "@media (min-width: 1024px)": {
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: APP_BACKGROUND,
                },
                "@media (min-width: 1440px)": {
                    flexDirection: "row",
                    gap: 1.25,
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: APP_BACKGROUND,
                },
                opacity: pageVisible ? 1 : 0,
                transform: "none",
                transition: [
                    "opacity 180ms ease",
                    "transform 180ms ease",
                ].join(", "),
            }}
        >
            {/* LEFT PANEL */}
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    position: "relative",
                    zIndex: 1,
                    height: "100%",
                    p: 0,
                    transition: (theme) =>
                        theme.transitions.create(["opacity", "flex-basis", "width", "transform"], {
                            duration: 300,
                            easing: theme.transitions.easing.easeInOut,
                        }),
                }}
            >
                <Box
                    sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 0,
                        border: "none",
                        borderColor: "transparent",
                        bgcolor: (t) => t.palette.background.paper,
                        "@media (min-width: 1024px)": {
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                        },
                        "@media (min-width: 1440px)": {
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                        },
                        backdropFilter: "none",
                        backgroundImage: "none",
                        boxShadow: "none",
                    }}
                >
                    {/* Header row */}
                    <Box
                        ref={mobileHeaderRef}
                        sx={(t) => ({
                            flexShrink: 0,
                            px: 1, pt: 0.35, pb: 0.35,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 1,
                            flexWrap: "nowrap",
                            overflow: "hidden",
                            // Tablet/laptop (900–1439) + desktop (≥1440): allow chrome to wrap
                            // on a second line so search + Filters/Map/Create fit.
                            "@media (min-width: 900px)": {
                                px: 1.25, pt: 0.5, pb: 0.5,
                                rowGap: 0.5,
                                flexWrap: "wrap",
                                overflow: "visible",
                            },
                            "@media (min-width: 1440px)": {
                                px: 1.5, pt: 0.45, pb: 0.45,
                            },
                            // Mobile (<1440px): fixed in viewport directly below the
                            // global header. Doesn't take layout space — the scroll
                            // container reserves space via padding-top. Fades via
                            // `--ll-nav-offset` in sync with the rest of the chrome.
                            ...(isMobile ? {
                                position: "fixed",
                                top: "var(--ll-nav-height, 52px)",
                                left: 0,
                                right: 0,
                                zIndex: t.zIndex.appBar,
                                opacity: "calc(1 - var(--ll-nav-offset, 0))",
                                pointerEvents: "var(--ll-nav-pointer-events, auto)",
                                transition: "none",
                                willChange: "opacity",
                                backdropFilter: "saturate(140%) blur(10px)",
                                WebkitBackdropFilter: "saturate(140%) blur(10px)",
                                backgroundColor: alpha(t.palette.background.paper, 0.85),
                            } : {}),
                        })}
                    >
                        {/* Segmented tabs */}
                        <Box role="tablist" aria-label="Music tabs" sx={{ flex: "0 0 auto", display: "flex", justifyContent: "flex-start", alignItems: "center", overflow: "auto", WebkitOverflowScrolling: "touch", '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', maxWidth: '100%', width: "100%", "@media (min-width: 900px)": { width: "auto" }, "@media (min-width: 1440px)": { maxWidth: 520 } }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, "@media (min-width: 900px)": { gap: 0.5 }, width: "100%" }}>
                                {/* Discover tab — mobile only, toggles inline discover view */}
                                {isMobile && (
                                    <Button
                                        role="tab"
                                        aria-selected={mobileDiscoverView === 'discover'}
                                        onClick={() => setMobileDiscoverView((v) => v === 'discover' ? 'list' : 'discover')}
                                        variant="text"
                                        disableElevation
                                        startIcon={<ExploreRoundedIcon sx={{ fontSize: '22px !important' }} />}
                                        sx={(t2) => {
                                            const isDiscoverActive = mobileDiscoverView === 'discover';
                                            return {
                                                borderRadius: 999,
                                                textTransform: "none",
                                                fontFamily: t2.typography.fontFamily,
                                                fontWeight: isDiscoverActive ? 800 : 600,
                                                letterSpacing: "0.01em",
                                                fontSize: 10,
                                                lineHeight: 1,
                                                height: 28,
                                                minHeight: 28,
                                                px: 1,
                                                // Tablet/laptop: match other pages at 38px, text-only pill.
                                                "@media (min-width: 900px)": {
                                                    fontSize: 13.5,
                                                    height: 38,
                                                    minHeight: 38,
                                                    px: 1.75,
                                                    letterSpacing: "-0.01em",
                                                    fontWeight: isDiscoverActive ? 950 : 700,
                                                },
                                                py: 0,
                                                flexDirection: "row",
                                                gap: 0,
                                                color: isDiscoverActive ? t2.palette.primary.main : t2.palette.text.secondary,
                                                backgroundColor: isDiscoverActive ? alpha(t2.palette.primary.main, 0.08) : "transparent",
                                                border: "1px solid",
                                                borderColor: isDiscoverActive ? alpha(t2.palette.primary.main, 0.18) : "transparent",
                                                boxShadow: "none",
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                                transition: `all ${t2.custom.motion.base}ms ${t2.custom.motion.ease}`,
                                                "& .MuiButton-startIcon": { display: "none" },
                                                "&:hover": {
                                                    backgroundColor: isDiscoverActive ? alpha(t2.palette.primary.main, 0.1) : alpha(t2.palette.text.primary, 0.04),
                                                    color: isDiscoverActive ? t2.palette.primary.main : t2.palette.text.primary,
                                                },
                                            };
                                        }}
                                    >
                                        Discover
                                    </Button>
                                )}

                                {["artists", "visualArtists", "posts"].map((key) => {
                                    const meta = tabMeta[key];
                                    const IconComp = meta.icon;
                                    const active = activeTab === key && !(isMobile && mobileDiscoverView === 'discover');

                                    return (
                                        <Button
                                            key={key}
                                            role="tab"
                                            aria-selected={active ? "true" : "false"}
                                            onClick={() => {
                                                if (isMobile && mobileDiscoverView === 'discover') { setMobileDiscoverView('list'); if (activeTab === key) return; }
                                                handleTabSwitch(key);
                                            }}
                                            variant="text"
                                            disableElevation
                                            startIcon={
                                                <IconComp
                                                    sx={(t2) => ({
                                                        fontSize: 18, '@media (min-width: 1440px)': { fontSize: 22 },
                                                        opacity: active ? 1 : 0.72,
                                                        color: active ? t2.palette.primary.main : t2.palette.text.secondary,
                                                    })}
                                                />
                                            }
                                            sx={(t2) => ({
                                                borderRadius: 999,
                                                textTransform: "none",
                                                fontFamily: t2.typography.fontFamily,
                                                fontWeight: active ? (isMobile ? 800 : 950) : (isMobile ? 600 : 700),
                                                letterSpacing: isMobile ? "0.01em" : "-0.01em",
                                                fontSize: 10,
                                                lineHeight: 1,
                                                height: 28,
                                                minHeight: 28,
                                                px: 1,
                                                // Tablet/laptop (900–1439) + desktop (≥1440): full-size pill (38px).
                                                '@media (min-width: 900px)': { fontSize: 13.5, height: 38, minHeight: 38, px: 1.75, letterSpacing: "-0.01em", fontWeight: active ? 950 : 700 },
                                                py: 0,
                                                flexDirection: "row",
                                                gap: 0,
                                                color: active ? t2.palette.primary.main : t2.palette.text.secondary,
                                                backgroundColor: active ? alpha(t2.palette.primary.main, 0.08) : "transparent",
                                                border: "1px solid",
                                                borderColor: active ? alpha(t2.palette.primary.main, isMobile ? 0.18 : 0.2) : "transparent",
                                                boxShadow: "none",
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                                transition: `all ${t2.custom.motion.base}ms ${t2.custom.motion.ease}`,
                                                // Tab icons only appear at true desktop (≥1440). Tablet is text-only,
                                                // matching Community/Business/Events pattern.
                                                "& .MuiButton-startIcon": { display: "none", marginRight: 0, marginLeft: 0, "@media (min-width: 1440px)": { display: "flex", marginRight: 0.9 } },
                                                "&:hover": {
                                                    backgroundColor: active
                                                        ? alpha(t2.palette.primary.main, 0.1)
                                                        : alpha(t2.palette.text.primary, 0.04),
                                                    color: active ? t2.palette.primary.main : t2.palette.text.primary,
                                                },
                                            })}
                                        >
                                            {meta.label}
                                        </Button>
                                    );
                                })}

                                {/* Phone: Map + Search icons pushed right.
                                    Tablet/laptop promotes these to labeled buttons below. */}
                                {isPhoneMusic && mobileDiscoverView !== 'discover' && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto", flexShrink: 0 }}>
                                        <IconButton
                                            onClick={() => setMobileMapOpen(true)}
                                            size="small"
                                            sx={(t2) => ({
                                                width: 32, height: 32,
                                                color: t2.palette.text.secondary,
                                                transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                                "&:hover": { color: "primary.main" },
                                            })}
                                            aria-label="Map"
                                        >
                                            <MapRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            size="small"
                                            sx={(t2) => ({
                                                width: 32, height: 32,
                                                color: activeFilterChips.length > 0 ? t2.palette.primary.main : t2.palette.text.secondary,
                                                transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                                "&:hover": { color: "primary.main" },
                                            })}
                                            aria-label="Search & Filter"
                                        >
                                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Search row — tablet/laptop + desktop (mobile uses filter drawer).
                            Hidden at any width when Discover is active. */}
                        {mobileDiscoverView !== 'discover' && (
                            <Box
                                sx={(t) => ({
                                    flex: "1 1 auto",
                                    minWidth: 200,
                                    ml: 0.75, mt: 0, mb: 0, order: 0,
                                    display: "none", "@media (min-width: 900px)": { display: "flex" },
                                    alignItems: "center",
                                    gap: 0.5,
                                    "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled)": { color: t.palette.common.white },
                                    "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled):hover": { color: t.palette.common.white },
                                })}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <SearchInput
                                        placeholder={
                                            isArtistsTab ? "Search music..." : activeTab === "visualArtists" ? "Search artists..." : isPostsTab ? "Search posts..." : isShowsTab ? "Search events..." : "Search..."
                                        }
                                        value={searchInput}
                                        onChange={handleSearchChange}
                                        inputProps={SEARCH_INPUT_PROPS}
                                        onSearch={handleSearchSubmit}
                                        onClear={handleSearchClear}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Tablet/laptop (900–1439): labeled Filters + Map buttons.
                            At narrow tablet (900–1099) they collapse to icon-only to save space.
                            Hidden at any width in Discover mode. */}
                        {isTabletMusic && mobileDiscoverView !== 'discover' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                {/* Filters */}
                                <Tooltip title={isNarrowTabletMusic ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                                    {isNarrowTabletMusic ? (
                                        <IconButton
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                border: '1px solid',
                                                color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.primary,
                                                borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.text.primary, 0.18),
                                                bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                position: 'relative',
                                                '&:hover': {
                                                    bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.5) : alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label={`Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length} active)` : ''}`}
                                        >
                                            <FilterListRoundedIcon sx={{ fontSize: 18 }} />
                                            {activeFilterChips.length > 0 && (
                                                <Box sx={(t) => ({
                                                    position: 'absolute',
                                                    top: -2, right: -2,
                                                    minWidth: 16, height: 16,
                                                    px: 0.5,
                                                    borderRadius: 999,
                                                    bgcolor: t.palette.primary.main,
                                                    color: t.palette.primary.contrastText,
                                                    fontSize: 10,
                                                    fontWeight: 900,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    lineHeight: 1,
                                                })}>
                                                    {activeFilterChips.length}
                                                </Box>
                                            )}
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<FilterListRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                px: 1.75,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.primary,
                                                borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.text.primary, 0.18),
                                                bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                '&:hover': {
                                                    bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.5) : alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Filters"
                                        >
                                            Filters{activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}
                                        </Button>
                                    )}
                                </Tooltip>

                                {/* Map */}
                                <Tooltip title={isNarrowTabletMusic ? 'Map' : ''}>
                                    {isNarrowTabletMusic ? (
                                        <IconButton
                                            onClick={() => setMobileMapOpen(true)}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                border: '1px solid',
                                                color: t.palette.text.primary,
                                                borderColor: alpha(t.palette.text.primary, 0.18),
                                                bgcolor: 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                                    borderColor: alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Map"
                                        >
                                            <MapRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => setMobileMapOpen(true)}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<MapRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                px: 1.75,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                color: t.palette.text.primary,
                                                borderColor: alpha(t.palette.text.primary, 0.18),
                                                bgcolor: 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                                    borderColor: alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Map"
                                        >
                                            Map
                                        </Button>
                                    )}
                                </Tooltip>
                            </Box>
                        )}

                        {/* Tablet/laptop + desktop: create buttons (Create Music Page / Create Artist Page / New Post / Create Event).
                            At narrow tablet (900–1099) these collapse to icon-only to keep the row on one line.
                            Hidden at any width in Discover mode. */}
                        {mobileDiscoverView !== 'discover' && (
                            <Box
                                sx={{
                                    display: "none", "@media (min-width: 900px)": { display: "flex" },
                                    alignItems: "center",
                                    gap: 1.25,
                                    flexShrink: 0,
                                    ml: "auto",
                                }}
                            >
                                {isOnArtistAccount && (isPostsTab || isShowsTab) && (
                                    <Button
                                        onClick={
                                            isShowsTab ? handleOpenCreateShow
                                                : handleOpenCreateArtistPost
                                        }
                                        variant="contained"
                                        size="small"
                                        startIcon={isPostsTab ? <EditRoundedIcon /> : <AddRoundedIcon />}
                                        sx={(t) => ({
                                            borderRadius: 999, textTransform: "none", fontWeight: 950,
                                            px: 1.35, height: 38, minWidth: 132,
                                            justifyContent: "center", whiteSpace: "nowrap",
                                            borderWidth: 1, borderColor: alpha(t.palette.primary.main, 0.18),
                                            color: t.palette.common.white, backgroundColor: t.palette.primary.main,
                                            boxShadow: "none",
                                            "&:hover": { borderColor: alpha(t.palette.primary.main, 0.22), backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                                        })}
                                    >
                                        {isShowsTab ? "Create Event" : "New Post"}
                                    </Button>
                                )}
                                {isArtistsTab && (
                                    <Button
                                        onClick={handleOpenCreate}
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddRoundedIcon />}
                                        sx={(t) => ({
                                            borderRadius: 999, textTransform: "none", fontWeight: 950,
                                            px: 1.35, height: 38, minWidth: 132,
                                            justifyContent: "center", whiteSpace: "nowrap",
                                            borderWidth: 1, borderColor: alpha(t.palette.primary.main, 0.18),
                                            color: t.palette.common.white, backgroundColor: t.palette.primary.main,
                                            boxShadow: "none",
                                            "&:hover": { borderColor: alpha(t.palette.primary.main, 0.22), backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                                        })}
                                    >
                                        Create Music Page
                                    </Button>
                                )}
                                {activeTab === "visualArtists" && (
                                    <Button
                                        onClick={handleOpenCreate}
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddRoundedIcon />}
                                        sx={(t) => ({
                                            borderRadius: 999, textTransform: "none", fontWeight: 950,
                                            px: 1.35, height: 38, minWidth: 132,
                                            justifyContent: "center", whiteSpace: "nowrap",
                                            borderWidth: 1, borderColor: alpha(t.palette.primary.main, 0.18),
                                            color: t.palette.common.white, backgroundColor: t.palette.primary.main,
                                            boxShadow: "none",
                                            "&:hover": { borderColor: alpha(t.palette.primary.main, 0.22), backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                                        })}
                                    >
                                        Create Artist Page
                                    </Button>
                                )}
                            </Box>
                        )}

                        {/* Active filter chips — nested inside mobileHeaderRef so they
                            slide with the subheader on scroll. Parent is flex-nowrap, so we
                            force `width: 100%` + flexShrink: 0 to pin the chips on their own
                            line below the header pills. */}
                        {isMobile && activeFilterChips.length > 0 && mobileDiscoverView !== 'discover' && (
                            <Box sx={{
                                width: '100%',
                                flexShrink: 0,
                                display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, pb: 0.75, flexWrap: 'wrap',
                            }}>
                                {activeFilterChips.slice(0, 3).map((chip) => (
                                    <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                          sx={(t) => ({ height: 26, maxWidth: 160, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2), '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, '& .MuiChip-deleteIcon': { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, '&:hover': { color: t.palette.primary.main } } })} />
                                ))}
                                {activeFilterChips.length > 3 && (
                                    <Chip label={`+${activeFilterChips.length - 3} more`} size="small" onClick={() => setMobileFilterDrawerOpen(true)}
                                          sx={(t) => ({ height: 26, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.06), color: t.palette.primary.main, cursor: 'pointer' })} />
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Content (filters + list + footer): fades when switching tabs */}
                    <Fade in={contentVisible} timeout={tabFadeMs} appear={false}>
                        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>

                            {/* ── Mobile: inline Discover view (like CommunityPanel pattern) ── */}
                            {isMobile && mobileDiscoverView === 'discover' && (
                                <>
                                    <Box sx={{
                                        flex: 1,
                                        minHeight: 0,
                                        overflow: 'auto',
                                        WebkitOverflowScrolling: 'touch',
                                        overscrollBehavior: 'contain',
                                        position: 'relative',
                                        zIndex: 1,
                                        bgcolor: 'background.paper',
                                        // Reserve space for the floating AppBar + section header
                                        // so the cover image isn't hidden behind them on initial paint.
                                        '@media (max-width: 1439px)': {
                                            paddingTop: 'var(--ll-subheader-height, 52px)',
                                        },
                                        '@media (max-width: 899px)': {
                                            paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                        },
                                    }}>
                                        <ArtistDiscoverTab />
                                    </Box>
                                </>
                            )}

                            {/* Normal content — hidden when mobile discover view is active */}
                            {(!isMobile || mobileDiscoverView !== 'discover') && (
                                <>

                                    {/* Filters section — desktop only (mobile uses full-screen filter drawer).
                                        Container always mounts on desktop; the internal "Filters" button
                                        inside ArtistsFilter/ShowsFilter controls field-grid expansion. */}
                                    {!isMobile && (
                                        <Box sx={{ px: 1, pt: 1, '@media (min-width: 1440px)': { px: 1.5, pt: 1.5 }, pb: 0.75, position: "relative", zIndex: 3 }}>
                                            {isArtistsTab ? (
                                                <ArtistsFilter
                                                    view={artistView}
                                                    onViewChange={setArtistView}
                                                    genre={artistGenre}
                                                    onGenreChange={setArtistGenre}
                                                    sort={artistSort}
                                                    onSortChange={setArtistSort}
                                                    county={artistCounty}
                                                    onCountyChange={handleArtistCountyChange}
                                                    radius={artistRadius} onRadiusChange={setArtistRadius}
                                                    city={artistCity}
                                                    onCityChange={setArtistCity}
                                                    searchQuery={searchQuery}
                                                    locationCounts={artistLocationCounts}
                                                    viewer={viewer}
                                                    subTab="artists"
                                                    profileType="music"
                                                    onSearchQueryChange={handleSavedSearchChange}
                                                    onClearAll={handleClearArtistFilters}
                                                />
                                            ) : activeTab === "visualArtists" ? (
                                                <ArtistsFilter
                                                    view={artistView}
                                                    onViewChange={setArtistView}
                                                    genre={artistGenre}
                                                    onGenreChange={setArtistGenre}
                                                    sort={artistSort}
                                                    onSortChange={setArtistSort}
                                                    county={artistCounty}
                                                    onCountyChange={handleArtistCountyChange}
                                                    radius={artistRadius} onRadiusChange={setArtistRadius}
                                                    city={artistCity}
                                                    onCityChange={setArtistCity}
                                                    searchQuery={searchQuery}
                                                    locationCounts={artistLocationCounts}
                                                    viewer={viewer}
                                                    subTab="artists"
                                                    profileType="artist"
                                                    onSearchQueryChange={handleSavedSearchChange}
                                                    onClearAll={handleClearArtistFilters}
                                                />
                                            ) : isPostsTab ? (
                                                <ArtistsFilter
                                                    view={postView}
                                                    onViewChange={setPostView}
                                                    viewOptions={POSTS_VIEW_OPTIONS}
                                                    genre={postGenre}
                                                    onGenreChange={setPostGenre}
                                                    sort={postSort}
                                                    onSortChange={setPostSort}
                                                    county={postCounty}
                                                    onCountyChange={handlePostCountyChange}
                                                    radius={postRadius} onRadiusChange={setPostRadius}
                                                    city={postCity}
                                                    onCityChange={setPostCity}
                                                    searchQuery={searchQuery}
                                                    locationCounts={postLocationCounts}
                                                    viewer={viewer}
                                                    subTab="posts"
                                                    profileType={postView === "artist" ? "artist" : "music"}
                                                    hideGenre={postView !== "music" && postView !== "artist"}
                                                    onSearchQueryChange={handleSavedSearchChange}
                                                    onClearAll={handleClearPostFilters}
                                                />
                                            ) : isShowsTab ? (
                                                <ShowsFilter
                                                    view={showView}
                                                    onViewChange={setShowView}
                                                    datePreset={showDatePreset}
                                                    onDatePresetChange={(val) => {
                                                        setShowDatePreset(val);
                                                        if (val !== "custom") setShowSelectedDates([]);
                                                    }}
                                                    sort={showSort}
                                                    onSortChange={setShowSort}
                                                    category={showCategory}
                                                    onCategoryChange={setShowCategory}
                                                    categoryOptions={showCategoryOptions}
                                                    totalCount={showsTotalCount}
                                                    countsLoading={subcategoryCountsLoading || showsLoading || showsRefreshing}
                                                    county={showCounty}
                                                    onCountyChange={handleShowCountyChange}
                                                    radius={showRadius} onRadiusChange={setShowRadius}
                                                    city={showCity}
                                                    onCityChange={setShowCity}
                                                    locationCounts={showLocationCounts}
                                                    viewer={viewer}
                                                    searchQuery={searchQuery}
                                                    onSearchQueryChange={handleSavedSearchChange}
                                                    onClearAll={handleClearShowFilters}
                                                />
                                            ) : null}
                                        </Box>
                                    )}

                                    <Divider sx={{ borderColor: "divider" }} />

                                    {/* Scroll list area */}
                                    <Box
                                        ref={(node) => {
                                            if (isPostsTab) postsScrollRef.current = node;
                                            mainScrollRef.current = node;
                                            musicPullRef(node);
                                        }}
                                        {...(isShowsTab ? { "data-events-scroll": "" } : {})}
                                        data-music-scroll
                                        sx={{
                                            flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
                                            scrollbarGutter: "stable",
                                            px: 0.75, pt: 1.35, '@media (min-width: 1440px)': { px: 1.25, pt: 1.5 }, pb: 1,
                                            // Mobile/tablet: reserve space under the floating chrome
                                            // so the first/last items don't sit under the header or
                                            // bottom nav on initial paint.
                                            "@media (max-width: 1439px)": {
                                                paddingTop: "var(--ll-subheader-height, 52px)",
                                            },
                                            "@media (max-width: 899px)": {
                                                paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                            },
                                            position: "relative", zIndex: 1,
                                            borderRadius: "0 0 12px 12px",
                                            display: "flex", flexDirection: "column",
                                        }}
                                    >
                                        {pullIndicator}
                                        {/* ARTISTS TAB */}
                                        {activeTab === "artists" ? (
                                            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                                {artistStats?.loading ? (
                                                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                                                        <PulsingDots />
                                                    </Box>
                                                ) : null}
                                                <Box sx={{ display: showArtistsEmpty || artistStats?.loading ? "none" : "flex", flex: 1, flexDirection: "column", minHeight: 0, height: "100%" }}>
                                                    <ArtistsDirectoryContainer
                                                        defaultAvatarSrc=""
                                                        type="music"
                                                        query={searchQuery}
                                                        city={apiArtistCity}
                                                        county={apiArtistCounty}
                                                        genre={artistGenre}
                                                        view={artistView}
                                                        onSelectArtist={handleSelectArtist}
                                                        onOpenUserCard={handleOpenUserCard}
                                                        selectedArtistId={selectedArtistId}
                                                        onStatsChange={setArtistStats}
                                                        refreshKey={artistsRefreshKey}
                                                    />
                                                </Box>
                                                {showArtistsEmpty && isNetworkError(artistFetchError) ? (
                                                    <Box sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
                                                        <NetworkErrorState onRetry={() => window.location.reload()} />
                                                    </Box>
                                                ) : showArtistsEmpty ? (
                                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", px: 2, height: "100%", minHeight: "50vh" }}>
                                                        <Stack spacing={1.5} alignItems="center">
                                                            <Box sx={(t) => ({
                                                                width: 64, height: 64, borderRadius: '50%',
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                                            })}>
                                                                <MusicNoteRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 950, fontSize: 17 }}>No music artists found</Typography>
                                                            {hasAnyArtists ? (
                                                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>Try adjusting your filters.</Typography>
                                                            ) : null}
                                                            {/* Always surface the Create CTA — whether the directory is empty
                                                                overall or just empty under the current filters, we want to
                                                                invite the viewer to add their own profile. */}
                                                            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, lineHeight: 1.6 }}>
                                                                Are you a music artist wanting to showcase your work to{' '}
                                                                {artistCounty && artistCounty !== 'All Counties'
                                                                    ? `${artistCounty} County`
                                                                    : viewer?.home_county || viewer?.county
                                                                        ? `${String(viewer.home_county || viewer.county).replace(/ County$/i, '')} County`
                                                                        : 'your community'}
                                                                ? Create your artist profile and start connecting with local fans!
                                                            </Typography>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddRoundedIcon />}
                                                                onClick={handleOpenCreate}
                                                                disabled={draftLimitChecking}
                                                                sx={(t) => ({
                                                                    mt: 1,
                                                                    borderRadius: 999,
                                                                    textTransform: 'none',
                                                                    fontWeight: 950,
                                                                    fontSize: 15,
                                                                    px: 3,
                                                                    py: 1,
                                                                    bgcolor: t.palette.primary.main,
                                                                    color: t.palette.common.white,
                                                                    boxShadow: 'none',
                                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' },
                                                                })}
                                                            >
                                                                {draftLimitChecking ? 'Checking…' : 'Create Music Profile'}
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                ) : null}
                                            </Box>
                                        ) : null}

                                        {/* VISUAL ARTISTS TAB — renders the same directory component as Music,
                                            filtered by profile_type='artist'. Reuses the Music tab's search/
                                            city/county/view state for simplicity; skips genre since painters
                                            don't currently use the musical-genre taxonomy. Empty-state mirrors
                                            the Music tab's pattern but uses a palette icon + visual-artist
                                            copy, with the Create button resolving to a visual-artist profile
                                            via handleOpenCreate (which branches on activeTab). */}
                                        {activeTab === "visualArtists" ? (
                                            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                                {visualArtistStats?.loading ? (
                                                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                                                        <PulsingDots />
                                                    </Box>
                                                ) : null}
                                                <Box sx={{ display: showVisualArtistsEmpty || visualArtistStats?.loading ? "none" : "flex", flex: 1, flexDirection: "column", minHeight: 0, height: "100%" }}>
                                                    <ArtistsDirectoryContainer
                                                        defaultAvatarSrc=""
                                                        type="artist"
                                                        query={searchQuery}
                                                        city={apiArtistCity}
                                                        county={apiArtistCounty}
                                                        genre=""
                                                        view={artistView}
                                                        onSelectArtist={handleSelectArtist}
                                                        onOpenUserCard={handleOpenUserCard}
                                                        selectedArtistId={selectedArtistId}
                                                        onStatsChange={setVisualArtistStats}
                                                        refreshKey={artistsRefreshKey}
                                                    />
                                                </Box>
                                                {showVisualArtistsEmpty && isNetworkError(visualArtistFetchError) ? (
                                                    <Box sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
                                                        <NetworkErrorState onRetry={() => window.location.reload()} />
                                                    </Box>
                                                ) : showVisualArtistsEmpty ? (
                                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", px: 2, height: "100%", minHeight: "50vh" }}>
                                                        <Stack spacing={1.5} alignItems="center">
                                                            <Box sx={(t) => ({
                                                                width: 64, height: 64, borderRadius: '50%',
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                                            })}>
                                                                <PaletteRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 950, fontSize: 17 }}>No visual artists found</Typography>
                                                            {hasAnyVisualArtists ? (
                                                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>Try adjusting your filters.</Typography>
                                                            ) : null}
                                                            {/* Always surface the Create CTA — whether the directory is empty
                                                                overall or just empty under the current filters, we want to
                                                                invite the viewer to add their own profile. */}
                                                            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, lineHeight: 1.6 }}>
                                                                Are you a visual artist wanting to showcase your work to{' '}
                                                                {artistCounty && artistCounty !== 'All Counties'
                                                                    ? `${artistCounty} County`
                                                                    : viewer?.home_county || viewer?.county
                                                                        ? `${String(viewer.home_county || viewer.county).replace(/ County$/i, '')} County`
                                                                        : 'your community'}
                                                                ? Create your artist profile and start connecting with local fans!
                                                            </Typography>
                                                            <Button
                                                                variant="contained"
                                                                startIcon={<AddRoundedIcon />}
                                                                onClick={handleOpenCreate}
                                                                disabled={draftLimitChecking}
                                                                sx={(t) => ({
                                                                    mt: 1,
                                                                    borderRadius: 999,
                                                                    textTransform: 'none',
                                                                    fontWeight: 950,
                                                                    fontSize: 15,
                                                                    px: 3,
                                                                    py: 1,
                                                                    bgcolor: t.palette.primary.main,
                                                                    color: t.palette.common.white,
                                                                    boxShadow: 'none',
                                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' },
                                                                })}
                                                            >
                                                                {draftLimitChecking ? 'Checking…' : 'Create Artist Profile'}
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                ) : null}
                                            </Box>
                                        ) : null}

                                        {/* POSTS TAB */}
                                        {activeTab === "posts" ? (
                                            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                                {musicPostsError && isNetworkError(musicPostsError) ? (
                                                    <Box sx={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
                                                        <NetworkErrorState onRetry={() => window.location.reload()} />
                                                    </Box>
                                                ) : musicPostsError ? (
                                                    <Alert severity="error" sx={{ mb: 1.5 }}>{musicPostsError}</Alert>
                                                ) : null}
                                                {musicPostsLoading ? (
                                                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                                                        <PulsingDots />
                                                    </Box>
                                                ) : null}
                                                {!musicPostsLoading ? (
                                                    <>
                                                        <MusicPostsList
                                                            posts={musicPosts}
                                                            loading={musicPostsLoading}
                                                            user={viewer}
                                                            hoveredId={postsHoveredId}
                                                            setHoveredId={setPostsHoveredId}
                                                            onCardClick={handleSelectPost}
                                                            onOpenUserCard={handleOpenUserCard}
                                                            onLocationClick={handlePostLocationClick}
                                                            onPostHidden={handlePostHidden}
                                                            onHideArtistPosts={handleHideArtistPosts}
                                                            selectedId={selectedPostId}
                                                            selectable
                                                            onDisplayStatsChange={handlePostDisplayStatsChange}
                                                            totalCount={musicPostsTotal}
                                                            loadingComponent={<PulsingDots />}
                                                        />
                                                        {loadingMoreMusicPosts ? (
                                                            <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", py: 3, minHeight: 80 }}>
                                                                <PulsingDots />
                                                            </Box>
                                                        ) : null}
                                                    </>
                                                ) : null}
                                            </Box>
                                        ) : null}

                                        {/* EVENTS TAB */}
                                        {activeTab === "shows" ? (
                                            <Box sx={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                                                {(showsLoading || showsRefreshing) && visibleShowEvents.length === 0 ? (
                                                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                                                        <PulsingDots />
                                                    </Box>
                                                ) : !showsLoading && !showsRefreshing && visibleShowEvents.length === 0 && !showsError ? (
                                                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", px: 2, height: "100%", minHeight: "50vh" }}>
                                                        <Stack spacing={1.5} alignItems="center">
                                                            <Box sx={(t) => ({
                                                                width: 64, height: 64, borderRadius: '50%',
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                                            })}>
                                                                <EventAvailableRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 950, fontSize: 17 }}>No Events Yet</Typography>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>
                                                                {isOnArtistAccount
                                                                    ? "Create your first event to share with fans."
                                                                    : "No events have been posted yet. Check back soon!"}
                                                            </Typography>
                                                            {isOnArtistAccount ? (
                                                                <Button
                                                                    onClick={handleOpenCreateShow}
                                                                    variant="contained"
                                                                    size="small"
                                                                    startIcon={<AddRoundedIcon />}
                                                                    sx={(t) => ({
                                                                        mt: 1.5,
                                                                        borderRadius: 999,
                                                                        textTransform: "none",
                                                                        fontWeight: 950,
                                                                        fontSize: 15,
                                                                        px: 3,
                                                                        py: 1,
                                                                        color: t.palette.common.white,
                                                                        boxShadow: "none",
                                                                        "&:hover": { boxShadow: "none" },
                                                                    })}
                                                                >
                                                                    Create Event
                                                                </Button>
                                                            ) : null}
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <EventsList
                                                        events={visibleShowEvents}
                                                        onSelectEvent={handleSelectShow}
                                                        isLoading={showsLoading}
                                                        isRefreshing={showsRefreshing}
                                                        isLoadingMore={showsLoadingMore}
                                                        error={showsError}
                                                        hasMore={showsHasMore}
                                                        onLoadMore={loadMoreShows}
                                                        totalCount={showsTotalCount}
                                                        onCreateEvent={isOnArtistAccount ? handleOpenCreateShow : undefined}
                                                        user={viewer}
                                                        onRefresh={refreshShows}
                                                        loadingComponent={<PulsingDots />}
                                                    />
                                                )}
                                            </Box>
                                        ) : null}
                                    </Box>

                                    {/* Footer — desktop only */}
                                    {showFooter ? (
                                        <Box
                                            sx={{
                                                flexShrink: 0, borderTop: "1px solid",
                                                borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                                                px: 1.25, py: 1,
                                                display: "none", alignItems: "center", justifyContent: "center",
                                                '@media (min-width: 1440px)': { px: 1.5, display: "flex" },
                                                bgcolor: (t) => t.palette.background.paper,
                                                backgroundImage: "none",
                                                backdropFilter: "none",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: 13, fontWeight: 800, color: "text.secondary",
                                                    width: "100%", textAlign: "center",
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: 22,
                                                }}
                                            >
                                                {footerText}
                                            </Typography>
                                        </Box>
                                    ) : null}

                                </>
                            )}

                        </Box>
                    </Fade>
                </Box>
            </Box>

            {/* RIGHT PANEL — Desktop only (mobile uses drawers) */}
            <Box
                sx={{
                    width: RIGHT_WIDTH, flexShrink: 0, height: "100%",
                    minHeight: 260,
                    display: "none",
                    '@media (min-width: 1440px)': { minHeight: "auto", display: "block" },
                }}
            >
                <MusicRightPanel
                    rightWidth="100%"
                    artist={selectedArtist}
                    artists={allArtists}
                    post={selectedPost}
                    posts={musicPosts}
                    show={selectedShow}
                    user={viewer}
                    activeTab={activeTab}
                    onOpenUserCard={handleOpenUserCard}
                    onSelectArtist={handleSelectArtist}
                    onSelectPost={handleSelectPost}
                    onPostLocationClick={handlePostLocationClick}
                    onViewPost={handleViewPost}
                    onSavePageState={saveCurrentState}
                    onShowUpdate={handleShowUpdate}
                    onClearShow={handleClearShow}
                    onRequireAuth={auth?.requireAuth}
                    rightTab={rightTab}
                    onRightTabChange={setRightTab}
                    concertEvents={visibleShowEvents}
                    onSelectShow={handleSelectShow}
                    selectedDates={showSelectedDates}
                    onDatesChange={handleShowDatesChange}
                    focusPostId={focusPostId}
                    onFocusPostHandled={handleFocusPostHandled}
                    hoveredPostId={postsHoveredId}
                    onCommentSuccess={showSuccess}
                    trendingCity={
                        isArtistsTab ? (artistCity === "All Cities" ? "" : artistCity)
                            : isPostsTab ? (postCity === "All Cities" ? "" : postCity)
                                : (showCity === "All Cities" ? "" : showCity)
                    }
                    trendingCounty={
                        isArtistsTab ? (artistCounty === "All Counties" ? "" : artistCounty)
                            : isPostsTab ? (postCounty === "All Counties" ? "" : postCounty)
                                : (showCounty === "All Counties" ? "" : showCounty)
                    }
                />
            </Box>

            {/* ── Mobile detail drawer (slides from right, full width) ── */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileDetailOpen}
                    onClose={() => setMobileDetailOpen(false)}
                    ModalProps={{
                        keepMounted: false,
                        // Artist mode: ensure modal backdrop covers everything including header/bottom nav
                        ...(mobileDrawerMode === 'artist' || mobileDrawerMode === 'post' ? { sx: { zIndex: 1400 } } : {}),
                    }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                    transitionDuration={{ enter: 280, exit: 220 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            pb: 0,
                            // Artist mode: full screen over everything (header + bottom nav).
                            ...(mobileDrawerMode === 'artist'
                                    ? { height: '100dvh', top: 0, mb: 0, zIndex: 1400 }
                                    : mobileDrawerMode === 'show'
                                        ? { height: '100dvh', top: 0, mb: 0 }
                                        : mobileDrawerMode === 'post'
                                            ? { height: '100dvh', top: 0, mb: 0, zIndex: 1400 }
                                            : {
                                                // Under the new fade scheme the bottom nav fades
                                                // in place rather than translating away, so the
                                                // drawer can sit flush against the nav at all
                                                // times — no growth/shrink cycle needed. The nav
                                                // itself becomes non-interactive (pointer-events:
                                                // none) when effectively invisible, so content
                                                // behind it is still tappable even if chrome is
                                                // faded out visually.
                                                mb: `${MOBILE_BOTTOM_NAV_HEIGHT}px`,
                                                height: `calc(100% - ${MOBILE_BOTTOM_NAV_HEIGHT}px)`,
                                                top: 0,
                                            }
                            ),
                        },
                    }}
                >
                    {/* Artist detail: show full ArtistProfilePage in mobile drawer */}
                    {mobileDrawerMode === 'artist' && selectedArtist ? (
                        <>
                            {/* Back bar — slim, fixed at top (matching BusinessHubPage) */}
                            <Box
                                sx={(t) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 0.5,
                                    py: 0.25,
                                    minHeight: 46,
                                    borderBottom: '1px solid',
                                    borderColor: alpha(t.palette.divider, 0.1),
                                    bgcolor: t.palette.background.paper,
                                    flexShrink: 0,
                                })}
                            >
                                <IconButton
                                    onClick={() => setMobileDetailOpen(false)}
                                    size="small"
                                    aria-label="Back"
                                    sx={{ width: 36, height: 36 }}
                                >
                                    <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                                </IconButton>
                                <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                                    Artist Page
                                </Typography>
                            </Box>

                            {/* Full ArtistProfilePage rendered inline */}
                            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                                <ArtistProfilePage
                                    artistData={selectedArtist}
                                    user={viewer}
                                    embedded
                                    onBack={() => setMobileDetailOpen(false)}
                                />
                            </Box>
                        </>
                    ) : mobileDrawerMode === 'show' && selectedShow ? (
                        <>
                            {/* Back bar for event detail — matches community page post detail */}
                            <Box
                                sx={(t) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.5,
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: t.palette.background.paper,
                                    backdropFilter: 'none',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    paddingTop: 'max(8px, env(safe-area-inset-top))',
                                })}
                            >
                                <IconButton onClick={() => setMobileDetailOpen(false)} size="small" sx={{ mr: 0.5 }}>
                                    <ArrowBackRoundedIcon />
                                </IconButton>
                            </Box>

                            {/* EventDetailPanel rendered directly — no tabs */}
                            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                                <EventDetailPanel
                                    event={selectedShow}
                                    user={viewer}
                                    onRequireAuth={auth?.requireAuth}
                                    onClearSelection={() => setMobileDetailOpen(false)}
                                    onEventUpdate={handleShowUpdate}
                                    onSuccess={showSuccess}
                                />
                            </Box>
                        </>
                    ) : (
                        <>
                            {/* Sticky header bar with back button (posts / shows / discover) */}
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.5,
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: (t) => t.palette.background.paper,
                                    backdropFilter: 'none',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    paddingTop: 'max(8px, env(safe-area-inset-top))',
                                }}
                            >
                                <IconButton onClick={() => setMobileDetailOpen(false)} size="small" sx={{ mr: 0.5 }}>
                                    <ArrowBackRoundedIcon />
                                </IconButton>
                                <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                                    {mobileDrawerMode === 'discover' ? 'Discover' : ''}
                                </Typography>
                            </Box>

                            {/* Content area */}
                            <Box
                                sx={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: 'auto',
                                    WebkitOverflowScrolling: 'touch',
                                    overscrollBehavior: 'contain',
                                    bgcolor: 'background.paper',
                                }}
                            >
                                {/* Post detail: render MusicPostDetailPanel directly for cleaner mobile experience */}
                                {mobileDrawerMode === 'post' && selectedPost ? (
                                    <MusicPostDetailPanel
                                        post={selectedPost}
                                        user={viewer}
                                        onViewPost={handleViewPost}
                                        onLocationClick={handlePostLocationClick}
                                        onCommentSuccess={showSuccess}
                                        onBack={() => setMobileDetailOpen(false)}
                                    />
                                ) : (
                                    <MusicRightPanel
                                        rightWidth="100%"
                                        artist={selectedArtist}
                                        artists={allArtists}
                                        post={selectedPost}
                                        posts={musicPosts}
                                        show={selectedShow}
                                        user={viewer}
                                        activeTab={activeTab}
                                        onOpenUserCard={handleOpenUserCard}
                                        onSelectArtist={handleSelectArtist}
                                        onSelectPost={handleSelectPost}
                                        onPostLocationClick={handlePostLocationClick}
                                        onViewPost={handleViewPost}
                                        onSavePageState={saveCurrentState}
                                        onShowUpdate={handleShowUpdate}
                                        onClearShow={handleClearShow}
                                        onRequireAuth={auth?.requireAuth}
                                        rightTab={rightTab}
                                        onRightTabChange={setRightTab}
                                        hideTabs
                                        concertEvents={visibleShowEvents}
                                        onSelectShow={handleSelectShow}
                                        selectedDates={showSelectedDates}
                                        onDatesChange={handleShowDatesChange}
                                        focusPostId={focusPostId}
                                        onFocusPostHandled={handleFocusPostHandled}
                                        hoveredPostId={postsHoveredId}
                                        onCommentSuccess={showSuccess}
                                        trendingCity={
                                            isArtistsTab ? (artistCity === "All Cities" ? "" : artistCity)
                                                : isPostsTab ? (postCity === "All Cities" ? "" : postCity)
                                                    : (showCity === "All Cities" ? "" : showCity)
                                        }
                                        trendingCounty={
                                            isArtistsTab ? (artistCounty === "All Counties" ? "" : artistCounty)
                                                : isPostsTab ? (postCounty === "All Counties" ? "" : postCounty)
                                                    : (showCounty === "All Counties" ? "" : showCounty)
                                        }
                                    />
                                )}
                            </Box>
                        </>
                    )}
                </SwipeableRightDrawer>
            )}

            {/* ── Mobile map — fullscreen with back bar ── */}
            {isMobile && (
                <SwipeableBottomDrawer
                    open={mobileMapOpen}
                    onClose={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }}
                    transitionDuration={{ enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            borderRadius: 0, overflow: 'hidden', bottom: 0,
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bottom: 0 } } }}
                    sx={{ zIndex: (t) => t.zIndex.drawer + 2 }}
                >
                    {/* Back bar */}
                    <Box sx={(t) => ({
                        display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 0.25, minHeight: 46,
                        borderBottom: activeFilterChips.length > 0 ? 'none' : '1px solid',
                        borderColor: alpha(t.palette.divider, 0.1), bgcolor: t.palette.background.paper, flexShrink: 0,
                    })}>
                        <IconButton onClick={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }} size="small" aria-label="Back" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>Music Map</Typography>
                        <IconButton onClick={() => setMobileMapFilterOpen(true)} size="small" aria-label="Search & Filter"
                                    sx={(t) => ({ width: 36, height: 36, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: 'primary.main', '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.16) } })}>
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {activeFilterChips.length > 0 && (
                        <Box sx={(t) => ({
                            display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5,
                            flexWrap: 'nowrap', overflowX: 'auto', flexShrink: 0,
                            bgcolor: t.palette.background.paper, borderBottom: '1px solid', borderColor: alpha(t.palette.divider, 0.1),
                            '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
                        })}>
                            {activeFilterChips.map((chip) => (
                                <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                      sx={(t) => ({ height: 26, maxWidth: 160, borderRadius: 999, fontWeight: 700, fontSize: 11, flexShrink: 0,
                                          bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main,
                                          border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2),
                                          '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                                          '& .MuiChip-deleteIcon': { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, '&:hover': { color: t.palette.primary.main } },
                                      })} />
                            ))}
                        </Box>
                    )}

                    <Box sx={{
                        flex: 1, overflow: 'hidden',
                        '& > * > [role="tablist"], & > * > .MuiTabs-root, & > * > .MuiBox-root:first-of-type:has([role="tab"])': { display: 'none' },
                        '& .leaflet-container': { borderRadius: '0 !important' },
                        '& > *': { borderRadius: '0 !important', border: 'none !important', margin: '0 !important', padding: '0 !important' },
                        '& > * > *': { borderRadius: '0 !important', border: 'none !important', margin: '0 !important', padding: '0 !important' },
                    }}>
                        <MusicRightPanel
                            rightWidth="100%"
                            artist={selectedArtist} artists={allArtists}
                            post={selectedPost} posts={musicPosts}
                            show={selectedShow} user={viewer}
                            activeTab={activeTab} onOpenUserCard={handleOpenUserCard}
                            onSelectArtist={handleSelectArtist} onSelectPost={handleSelectPost}
                            onPostLocationClick={handlePostLocationClick} onViewPost={handleViewPost}
                            onSavePageState={saveCurrentState} onShowUpdate={handleShowUpdate}
                            onClearShow={handleClearShow} onRequireAuth={auth?.requireAuth}
                            rightTab="map" onRightTabChange={() => {}} hideTabs
                            concertEvents={visibleShowEvents} onSelectShow={handleSelectShow}
                            selectedDates={showSelectedDates} onDatesChange={handleShowDatesChange}
                            focusPostId={focusPostId} onFocusPostHandled={handleFocusPostHandled}
                            hoveredPostId={postsHoveredId} onCommentSuccess={showSuccess}
                            trendingCity={
                                isArtistsTab ? (artistCity === "All Cities" ? "" : artistCity)
                                    : isPostsTab ? (postCity === "All Cities" ? "" : postCity)
                                        : (showCity === "All Cities" ? "" : showCity)
                            }
                            trendingCounty={
                                isArtistsTab ? (artistCounty === "All Counties" ? "" : artistCounty)
                                    : isPostsTab ? (postCounty === "All Counties" ? "" : postCounty)
                                        : (showCounty === "All Counties" ? "" : showCounty)
                            }
                        />
                    </Box>

                    <Drawer anchor="bottom" open={mobileMapFilterOpen} onClose={() => setMobileMapFilterOpen(false)}
                            transitionDuration={{ enter: 280, exit: 220 }} ModalProps={{ keepMounted: false }}
                            PaperProps={{ sx: (t) => ({ maxHeight: '85dvh', '@supports not (max-height: 1dvh)': { maxHeight: '85vh' },
                                    borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: t.palette.background.paper,
                                    overflow: 'hidden', display: 'flex', flexDirection: 'column' }) }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                            <TuneIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                            <IconButton onClick={() => setMobileMapFilterOpen(false)} size="small" sx={{ width: 34, height: 34, borderRadius: 999 }}>
                                <CloseRoundedIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Box>
                        <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                            <SearchInput
                                placeholder={isArtistsTab ? 'Search artists…' : isPostsTab ? 'Search posts…' : 'Search events…'}
                                value={searchInput} onChange={handleSearchChange}
                                inputProps={{ ...SEARCH_INPUT_PROPS, autoFocus: true }}
                                onSearch={() => { handleSearchSubmit(); setMobileMapFilterOpen(false); }}
                                onClear={handleSearchClear} />
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                            {isArtistsTab ? (
                                <ArtistsFilter view={artistView} onViewChange={setArtistView}
                                               genre={artistGenre} onGenreChange={setArtistGenre}
                                               sort={artistSort} onSortChange={setArtistSort}
                                               county={artistCounty} onCountyChange={handleArtistCountyChange}
                                               radius={artistRadius} onRadiusChange={setArtistRadius}
                                               city={artistCity} onCityChange={setArtistCity}
                                               searchQuery={searchQuery} locationCounts={artistLocationCounts}
                                               viewer={viewer}
                                               subTab="artists"
                                               profileType="music"
                                               onSearchQueryChange={handleSavedSearchChange}
                                               onClearAll={handleClearArtistFilters} />
                            ) : activeTab === "visualArtists" ? (
                                <ArtistsFilter view={artistView} onViewChange={setArtistView}
                                               genre={artistGenre} onGenreChange={setArtistGenre}
                                               sort={artistSort} onSortChange={setArtistSort}
                                               county={artistCounty} onCountyChange={handleArtistCountyChange}
                                               radius={artistRadius} onRadiusChange={setArtistRadius}
                                               city={artistCity} onCityChange={setArtistCity}
                                               searchQuery={searchQuery} locationCounts={artistLocationCounts}
                                               viewer={viewer}
                                               subTab="artists"
                                               profileType="artist"
                                               onSearchQueryChange={handleSavedSearchChange}
                                               onClearAll={handleClearArtistFilters} />
                            ) : isPostsTab ? (
                                <ArtistsFilter view={postView} onViewChange={setPostView} viewOptions={POSTS_VIEW_OPTIONS}
                                               genre={postGenre} onGenreChange={setPostGenre}
                                               sort={postSort} onSortChange={setPostSort}
                                               county={postCounty} onCountyChange={handlePostCountyChange}
                                               radius={postRadius} onRadiusChange={setPostRadius}
                                               city={postCity} onCityChange={setPostCity}
                                               searchQuery={searchQuery} locationCounts={postLocationCounts}
                                               viewer={viewer}
                                               subTab="posts"
                                               profileType={postView === "artist" ? "artist" : "music"}
                                               hideGenre={postView !== "music" && postView !== "artist"}
                                               onSearchQueryChange={handleSavedSearchChange}
                                               onClearAll={handleClearPostFilters} />
                            ) : isShowsTab ? (
                                <ShowsFilter view={showView} onViewChange={setShowView}
                                             datePreset={showDatePreset} onDatePresetChange={(val) => { setShowDatePreset(val); if (val !== "custom") setShowSelectedDates([]); }}
                                             sort={showSort} onSortChange={setShowSort}
                                             category={showCategory} onCategoryChange={setShowCategory}
                                             categoryOptions={showCategoryOptions} totalCount={showsTotalCount}
                                             countsLoading={subcategoryCountsLoading || showsLoading || showsRefreshing}
                                             county={showCounty} onCountyChange={handleShowCountyChange}
                                             radius={showRadius} onRadiusChange={setShowRadius}
                                             city={showCity} onCityChange={setShowCity} locationCounts={showLocationCounts}
                                             viewer={viewer}
                                             searchQuery={searchQuery}
                                             onSearchQueryChange={handleSavedSearchChange}
                                             onClearAll={handleClearShowFilters} />
                            ) : null}
                        </Box>
                        <Box sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                            <Button onClick={isArtistsTab ? handleClearArtistFilters : isShowsTab ? handleClearShowFilters : handleClearPostFilters}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}>Reset</Button>
                            <Button variant="contained" onClick={() => { handleSearchSubmit(); setMobileMapFilterOpen(false); }}
                                    sx={(t) => ({ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, height: 42, bgcolor: t.palette.primary.main, color: t.palette.common.white, boxShadow: 'none', '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' } })}>
                                Show Results
                            </Button>
                        </Box>
                    </Drawer>
                </SwipeableBottomDrawer>
            )}

            {/* ═══ Mobile full-screen filter drawer ═══ */}
            {isMobile && (
                <SwipeableBottomDrawer
                    open={mobileFilterDrawerOpen}
                    onClose={() => setMobileFilterDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            height: '100%',
                            borderRadius: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: {} } }}
                >
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                        <IconButton onClick={() => setMobileFilterDrawerOpen(false)} size="small" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                    </Box>

                    {/* Search input */}
                    <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                        <SearchInput
                            placeholder={isArtistsTab ? 'Search artists…' : isPostsTab ? 'Search posts…' : 'Search events…'}
                            value={searchInput}
                            onChange={handleSearchChange}
                            inputProps={{ ...SEARCH_INPUT_PROPS, autoFocus: true }}
                            onSearch={() => { handleSearchSubmit(); setMobileFilterDrawerOpen(false); }}
                            onClear={handleSearchClear}
                        />
                    </Box>

                    {/* Filter controls — scrollable */}
                    <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                        {isArtistsTab ? (
                            <ArtistsFilter
                                view={artistView}
                                onViewChange={setArtistView}
                                genre={artistGenre}
                                onGenreChange={setArtistGenre}
                                sort={artistSort}
                                onSortChange={setArtistSort}
                                county={artistCounty}
                                onCountyChange={handleArtistCountyChange}
                                radius={artistRadius} onRadiusChange={setArtistRadius}
                                city={artistCity}
                                onCityChange={setArtistCity}
                                searchQuery={searchQuery}
                                locationCounts={artistLocationCounts}
                                viewer={viewer}
                                subTab="artists"
                                onSearchQueryChange={handleSavedSearchChange}
                                onClearAll={handleClearArtistFilters}
                            />
                        ) : isPostsTab ? (
                            <ArtistsFilter
                                view={postView}
                                onViewChange={setPostView}
                                viewOptions={POSTS_VIEW_OPTIONS}
                                genre={postGenre}
                                onGenreChange={setPostGenre}
                                sort={postSort}
                                onSortChange={setPostSort}
                                county={postCounty}
                                onCountyChange={handlePostCountyChange}
                                radius={postRadius} onRadiusChange={setPostRadius}
                                city={postCity}
                                onCityChange={setPostCity}
                                searchQuery={searchQuery}
                                locationCounts={postLocationCounts}
                                viewer={viewer}
                                subTab="posts"
                                profileType={postView === "artist" ? "artist" : "music"}
                                hideGenre={postView !== "music" && postView !== "artist"}
                                onSearchQueryChange={handleSavedSearchChange}
                                onClearAll={handleClearPostFilters}
                            />
                        ) : isShowsTab ? (
                            <ShowsFilter
                                view={showView}
                                onViewChange={setShowView}
                                datePreset={showDatePreset}
                                onDatePresetChange={(val) => {
                                    setShowDatePreset(val);
                                    if (val !== "custom") setShowSelectedDates([]);
                                }}
                                sort={showSort}
                                onSortChange={setShowSort}
                                category={showCategory}
                                onCategoryChange={setShowCategory}
                                categoryOptions={showCategoryOptions}
                                totalCount={showsTotalCount}
                                countsLoading={subcategoryCountsLoading || showsLoading || showsRefreshing}
                                county={showCounty}
                                onCountyChange={handleShowCountyChange}
                                radius={showRadius} onRadiusChange={setShowRadius}
                                city={showCity}
                                onCityChange={setShowCity}
                                locationCounts={showLocationCounts}
                                viewer={viewer}
                                searchQuery={searchQuery}
                                onSearchQueryChange={handleSavedSearchChange}
                                onClearAll={handleClearShowFilters}
                            />
                        ) : null}
                    </Box>

                    {/* Sticky bottom actions */}
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <Button
                            onClick={() => {
                                if (isArtistsTab) handleClearArtistFilters();
                                else if (isShowsTab) handleClearShowFilters();
                                else handleClearPostFilters();
                            }}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                handleSearchSubmit();
                                setMobileFilterDrawerOpen(false);
                            }}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                px: 3,
                                height: 42,
                                bgcolor: t.palette.primary.main,
                                color: t.palette.common.white,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' },
                            })}
                        >
                            Show Results
                        </Button>
                    </Box>
                </SwipeableBottomDrawer>
            )}

            <CreateEditEventModal
                open={createShowOpen}
                onClose={handleCloseCreateShow}
                user={viewer}
                onSaved={handleShowSaved}
                defaultCategorySlug="music-nightlife"
            />
            {isOnArtistAccount && activeArtistId && (
                <CreateArtistPostDialog
                    open={createArtistPostOpen}
                    onClose={handleCloseCreateArtistPost}
                    artistId={activeArtistId}
                    artistName={activeAccountName || "your artist"}
                    onPostCreated={handleArtistPostCreated}
                />
            )}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={handleCloseUserCard}
                user={userForCard}
                onViewProfile={handleViewUserProfile}
                onBlock={handleArtistBlocked}
                onReport={handleArtistBlocked}
            />

            {/* Account switch dialog — shown when non-personal account taps Create Artist */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
                    <InfoOutlinedIcon color="primary" />
                    Personal account required
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ lineHeight: 1.5 }}>
                        Artist pages can only be created from a personal account. Please switch to your personal profile to create an artist page.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAccountSwitchOpen(false)} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rate limit dialog */}
            <RateLimitDialog
                open={rateLimitOpen}
                onClose={() => setRateLimitOpen(false)}
                retryAfterSec={rateLimitInfo.retryAfterSec}
                reason={rateLimitInfo.reason}
                actionLabel={rateLimitInfo.actionLabel}
            />

            {/* Draft / pending-review limit dialog */}
            <Dialog open={draftLimitDialogOpen} onClose={() => setDraftLimitDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Limit Reached</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                        {draftLimitMessage}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDraftLimitDialogOpen(false)} variant="contained" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            <SuccessSnackbar {...successSnackbarProps} />
        </Box>
    );
}

function PlaceholderBlock({ title, subtitle }) {
    return (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle || "Coming next."}</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Placeholder content.</Typography>
            </Box>
        </Paper>
    );
}