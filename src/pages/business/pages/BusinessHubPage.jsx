// src/pages/business/pages/BusinessHubPage.jsx
// Businesses Hub
// --------------
// Business-owned layout that matches Community look/feel.
// - Fixed, no-window-scroll layout (internal panel scrolling)
// - Left: tabbed list (Business Posts / Businesses) with Community-style filter row + pinned footer counts
// - Right: detail pane (BusinessPostDetailPanel)
// - Businesses tab uses a professional directory card (same styling language as Post cards)

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BusinessDirectoryCard } from '../components/BusinessDirectoryCard';

import {
    useNavigate, useNavigationType } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Fab,
    Fade,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';

import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AddBusinessRoundedIcon from '@mui/icons-material/AddBusinessRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../../components/Header/Header';

import { AnimatePresence, motion } from 'framer-motion';

import SearchInput from '../../../components/SearchInput';
import UserCardPopover from '../../../components/UserCardPopover';

import BusinessPostCard from '../components/BusinessPostCard';
import BusinessPostDetailPanel from '../components/BusinessPostDetailModal';
import BusinessDetailPanel from '../components/BusinessDetailPanel';
import SwipeableRightDrawer from '../../../components/SwipeableRightDrawer';
import SwipeableBottomDrawer from '../../../components/SwipeableBottomDrawer';
import BusinessFilterBar from '../components/BusinessFilterBar';
import BusinessesMapTab from '../components/BusinessesMapTab';
import CreateBusinessPostDialog from '../components/CreateBusinessPostDialog';
import BusinessDiscoverTab from '../components/BusinessDiscoverTab';
import BusinessPublicPage from '../pages/BusinessPublicPage';

import { fetchPublishedBusinesses, fetchBusinessPosts, fetchMyBusinesses, fetchBusinessCategoryCounts, fetchBusinessLocationCounts, fetchBusinessPostLocationCounts } from '../api/businessApi';
import { useActiveAccount } from '../../../components/AccountContext';
import { useAuth } from '../../../components/AuthModalContext';
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import useRateLimit from '../../../utils/useRateLimit';
import { secureFetch } from '../../../utils/secureFetch';
import useSubheaderScrollHide from '../../../utils/useSubheaderScrollHide';
import RateLimitDialog from '../../../components/RateLimitDialog';
import PulsingDots from '../../../components/PulsingDots';
import NetworkErrorState from '../../../components/NetworkErrorState';
import { ensureListStaggerKeyframes, getListStaggerSx } from '../../../themes/theme';
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    getCountyCenter,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from '../../../utils/geoRadius';

const RIGHT_WIDTH = { xs: '40%', lg: '35%' };
const PAGE_SIZE = 25;
const TAB_FADE_MS = 160;

const HUB_STATE_KEY = 'll-business-hub-state';


const BUSINESS_SORT_OPTIONS = [
    { value: 'any', label: 'Any' },
    { value: 'most_reviewed', label: 'Most Reviewed' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'a_z', label: 'A-Z' },
    { value: 'z_a', label: 'Z-A' },
];

const POST_SORT_OPTIONS = [
    { value: 'any', label: 'Any' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Most Popular' },
];

function normalizeCountMap(raw) {
    if (!raw || typeof raw !== 'object') return {};
    const next = {};
    Object.entries(raw).forEach(([key, value]) => {
        const n = Number(value);
        next[String(key)] = Number.isFinite(n) && n >= 0 ? n : 0;
    });
    return next;
}

function pickCategoryCounts(payload) {
    return normalizeCountMap(
        payload?.categoryCounts ||
        payload?.category_counts ||
        payload?.counts ||
        payload?.categoryTotals ||
        payload?.category_totals ||
        {}
    );
}

function pickCategoryTotal(payload, fallback = 0) {
    const candidates = [
        payload?.categoryTotal,
        payload?.category_total,
        payload?.filteredTotal,
        payload?.filtered_total,
        payload?.total,
        fallback,
    ];
    for (const value of candidates) {
        const n = Number(value);
        if (Number.isFinite(n) && n >= 0) return n;
    }
    return 0;
}


function saveHubState(state) {
    try {
        sessionStorage.setItem(HUB_STATE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

function loadHubState() {
    try {
        const raw = sessionStorage.getItem(HUB_STATE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearHubState() {
    try {
        sessionStorage.removeItem(HUB_STATE_KEY);
    } catch {
        // ignore
    }
}

export default function BusinessHubPage({ user = null }) {
    const navigate = useNavigate();
    const navType = useNavigationType();
    const hubTheme = useTheme();
    const isMobile = useMediaQuery('(max-width:1439px)');
    // Phone-only: matches the global header's <md breakpoint where the bottom nav appears.
    // Below this, the compact phone header (pill tabs + tiny search/map icons) is used as-is.
    const isPhoneBiz = useMediaQuery('(max-width:899px)');
    // Tablet/laptop range: header menu moved to the top but we're still below the
    // ≥1440 breakpoint where the inline filter bar + right panel appear. In this range
    // we promote the search bar + labeled Filters / Map / Add Business buttons so the
    // tools don't hide in a cramped icon cluster. Mirrors CommunityPanel treatment.
    const isTabletBiz = isMobile && !isPhoneBiz;
    // Narrow end of tablet (900–1099): Filters / Map / Add collapse to icons to keep
    // everything on one row.
    const isNarrowTabletBiz = useMediaQuery('(min-width:900px) and (max-width:1099px)');
    const viewer = user?.user || user || null;

    // Page-level content fade-in (matches community)
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Mobile detail overlay
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [mobileMapOpen, setMobileMapOpen] = useState(false);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);
    // Track what the mobile detail drawer should show ('post' | 'business' | 'discover')
    const [mobileDrawerMode, setMobileDrawerMode] = useState('post');

    // Mobile full-screen business page overlay (slides in from right, covers everything)
    const [mobileBusinessPageOpen, setMobileBusinessPageOpen] = useState(false);
    const [mobileBusinessSlug, setMobileBusinessSlug] = useState(null);
    const [mobileBusinessFromMap, setMobileBusinessFromMap] = useState(false);

    // ── Close mobile detail drawer on browser back button ──
    useEffect(() => {
        if (!mobileDetailOpen) return;
        window.history.pushState({ mobileDetail: true }, '');
        const handlePopState = () => setMobileDetailOpen(false);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileDetailOpen]);

    // ── Close mobile business page overlay on browser back button ──
    useEffect(() => {
        if (!mobileBusinessPageOpen) return;
        window.history.pushState({ mobileBusinessPage: true }, '');
        const handlePopState = () => { setMobileBusinessPageOpen(false); setMobileBusinessSlug(null); setMobileBusinessFromMap(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileBusinessPageOpen]);

    // ── Close mobile map drawer on browser back button ──
    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ mobileMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);

    // ── Mobile: inline discover view (like ServicesPage pattern) ──
    // 'list' = normal businesses/posts list, 'discover' = inline discover content
    const [mobileView, setMobileView] = useState('list');

    // Mobile secondary-header continuous scroll-hide: the hook below attaches to
    // this ref and translates the header proportionally with scroll delta on
    // mobile. The negative margin-bottom it applies keeps the content below
    // tracking smoothly (no maxHeight thrash).
    const mobileHeaderRef = useRef(null);

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll container reserves space via `padding-top: calc(header +
    // subheader)` so content doesn't sit under the floating chrome on
    // initial paint. ResizeObserver keeps the CSS var in sync with the
    // real height (filter chips, wrapping, etc.). Phone only — the phone
    // subheader is the only one that floats; on tablet/desktop it's in
    // flex flow.
    useLayoutEffect(() => {
        if (!isPhoneBiz) {
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
    }, [isPhoneBiz]);

    // Note: Previously this page observed the body class `ll-mobile-nav-hidden`
    // and expanded the container when the global app nav hid on scroll. With
    // continuous scroll-hide (see Header.jsx `--ll-nav-offset`), the global
    // bars slide out of the viewport via transform but the container stays
    // at its normal size — this eliminates the mid-scroll layout shift.

    // Mobile full-screen filter overlay
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

    // Tab-switch content fade (matches CommunityPanel behavior)
    const tabFadeMs = hubTheme.custom?.motion?.contentFade?.durationMs ?? TAB_FADE_MS;
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

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // Pick up post-deleted flag from PostPage/DetailModal navigation
    const postDeletedOnMount = useRef(false);
    useEffect(() => {
        try {
            if (sessionStorage.getItem('ll:business:postDeletedSuccess') === '1') {
                sessionStorage.removeItem('ll:business:postDeletedSuccess');
                // Clear the hub's cached state so the deleted post doesn't reappear
                sessionStorage.removeItem(HUB_STATE_KEY);
                postDeletedOnMount.current = true;
                showSuccess('Post deleted successfully');
            }
        } catch {}
    }, [showSuccess]);

    // Pick up a generic toast handoff from navigation (e.g. BusinessPostPage
    // redirects here after a successful "Hide posts from this business"
    // action and stashes the message in sessionStorage).
    useEffect(() => {
        try {
            const msg = sessionStorage.getItem('ll:toast:next');
            if (msg) {
                sessionStorage.removeItem('ll:toast:next');
                showSuccess(msg);
            }
        } catch {}
    }, [showSuccess]);

    // Active account identity — so fetchBusinessPosts sends the right
    // activeBusinessId / activeArtistId for per-account viewerLiked/viewerReposted.
    const { activeBusinessId, activeArtistId, accountCacheKey, isBusinessAccount, activeAccount, getAccountPayload, getAccountParams, getAccountHeaders } = useActiveAccount();
    const { openLoginPopup } = useAuth();
    const isArtistAccount = String(activeAccount?.type || activeAccount?.account_type || activeAccount?.accountType || '').toLowerCase() === 'artist';
    const isNonPersonalAccount = isBusinessAccount || isArtistAccount;

    /* ---------- business post rate limiting ---------- */
    const { checkLimit: checkPostLimit, recordAction: recordPost } = useRateLimit('community-post', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 15,
    });
    /* ---------- business draft creation rate limiting ---------- */
    const { checkLimit: checkDraftCreateLimit } = useRateLimit('business-draft-create', {
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
    // ── Stable refs for context functions that may return new references each
    //    render.  Using refs in effects avoids infinite update loops caused by
    //    unstable identity in dependency arrays. ──
    const getAccountParamsRef = useRef(getAccountParams);
    getAccountParamsRef.current = getAccountParams;
    const getAccountHeadersRef = useRef(getAccountHeaders);
    getAccountHeadersRef.current = getAccountHeaders;
    const getAccountPayloadRef = useRef(getAccountPayload);
    getAccountPayloadRef.current = getAccountPayload;

    // Stabilize account IDs — useActiveAccount() may return new values on each
    // render even when the actual IDs haven't changed.  Using refs prevents
    // loadPosts/loadBusinesses/refreshActive from being recreated and triggering
    // the "Maximum update depth exceeded" infinite loop.
    const activeBusinessIdRef = useRef(activeBusinessId);
    activeBusinessIdRef.current = activeBusinessId;
    const activeArtistIdRef = useRef(activeArtistId);
    activeArtistIdRef.current = activeArtistId;
    const viewerIdRef = useRef(null);
    viewerIdRef.current = viewer?.id || null;

    // UserCardPopover state for post card avatar clicks
    const [userCardAnchor, setUserCardAnchor] = useState(null);
    const [userCardUser, setUserCardUser] = useState(null);

    const [restored] = useState(() => {
        const saved = loadHubState();
        if (!saved) return null;
        if (saved.accountCacheKey && saved.accountCacheKey !== accountCacheKey) return null;
        return saved;
    });

    // Measure header bottom so fixed layout doesn't overlap app chrome
    const [chromeTop, setChromeTop] = useState(0);

    // Match Community behavior: prevent window scroll (panels scroll internally) + prevent scrollbar jump
    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        const STYLE_ID = 'll-business-noshift-style';
        const BODY_CLASS = 'll-business-fixed-layout';

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.type = 'text/css';
            styleEl.appendChild(
                document.createTextNode(
                    `
                    body.${BODY_CLASS} {
                      padding-right: var(--ll-business-scrollbar-comp, 0px) !important;
                      overflow: hidden !important;
                    }
                    html.${BODY_CLASS} {
                      padding-right: var(--ll-business-scrollbar-comp, 0px) !important;
                      overflow: hidden !important;
                    }
                  `
                )
            );
            document.head.appendChild(styleEl);
        }

        body.classList.add(BODY_CLASS);
        html.classList.add(BODY_CLASS);

        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlPaddingRight = html.style.paddingRight;
        const prevBodyPaddingRight = body.style.paddingRight;
        const prevCssVarBody = body.style.getPropertyValue('--ll-business-scrollbar-comp');
        const prevCssVarHtml = html.style.getPropertyValue('--ll-business-scrollbar-comp');

        const scrollbarWidth = window.innerWidth - html.clientWidth;
        const comp = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0px';

        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';

        html.style.setProperty('--ll-business-scrollbar-comp', comp);
        body.style.setProperty('--ll-business-scrollbar-comp', comp);

        html.style.paddingRight = comp;
        body.style.paddingRight = comp;

        return () => {
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;

            if (prevCssVarHtml) html.style.setProperty('--ll-business-scrollbar-comp', prevCssVarHtml);
            else html.style.removeProperty('--ll-business-scrollbar-comp');

            if (prevCssVarBody) body.style.setProperty('--ll-business-scrollbar-comp', prevCssVarBody);
            else body.style.removeProperty('--ll-business-scrollbar-comp');

            body.classList.remove(BODY_CLASS);
            html.classList.remove(BODY_CLASS);
        };
    }, []);

    // Measure header height so fixed container sits below it
    useLayoutEffect(() => {
        const measure = () => {
            const header =
                document.querySelector('header.MuiAppBar-root') ||
                document.querySelector('header') ||
                document.querySelector('.site-header') ||
                document.getElementById('header') ||
                null;

            const h = header ? header.getBoundingClientRect().bottom : 0;
            setChromeTop(h);
        };

        measure();
        let raf2 = null;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(measure);
        });

        window.addEventListener('resize', measure);
        return () => {
            cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            window.removeEventListener('resize', measure);
        };
    }, []);

    const isAdmin = Boolean(
        viewer?.is_admin ||
        viewer?.isAdmin ||
        String(viewer?.role || '').toLowerCase() === 'admin' ||
        String(viewer?.account_type || '').toLowerCase() === 'admin'
    );

    const isPopNavigation = navType === 'POP';

    const [tab, setTab] = useState(() => restored?.tab || 'businesses');

    // Search behavior (Community-like): type, press Search to apply
    const [searchTerm, setSearchTerm] = useState(() => restored?.searchTerm || '');
    const [appliedSearch, setAppliedSearch] = useState(() => restored?.appliedSearch || '');

    // Filters open by default
    const [filtersOpen, setFiltersOpen] = useState(() => {
        if (restored?.filtersOpen != null) return restored.filtersOpen;
        // On mobile, default filters to collapsed so the list is visible (matches Community)
        if (typeof window !== 'undefined' && window.innerWidth < 1440) return false;
        return true;
    });

    // Ensure filters stay closed on mobile — covers edge cases where
    // useMediaQuery returns false on first render then flips to true
    useEffect(() => {
        if (isMobile && filtersOpen) {
            setFiltersOpen(false);
        }
    }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

    const [postFilters, setPostFilters] = useState(() => {
        if (restored?.postFilters) {
            return {
                view: restored.postFilters.view || 'all',
                categoryKey: restored.postFilters.categoryKey || '',
                postType: restored.postFilters.postType || '',
                entityType: restored.postFilters.entityType || '',
                city: restored.postFilters.city || '',
                county: restored.postFilters.county || '',
                radius: restored.postFilters.radius || STATEWIDE,
                businessSort: restored.postFilters.businessSort || 'any',
                postSort: restored.postFilters.postSort || 'newest',
                dateRange: restored.postFilters.dateRange || 'all',
            };
        }
        return {
            view: 'all',
            categoryKey: '',
            postType: '',
            entityType: '',
            city: '',
            county: '',
            radius: STATEWIDE,
            businessSort: 'any',
            postSort: 'newest',
            dateRange: 'all',
        };
    });

    const [myBusinessIds, setMyBusinessIds] = useState([]);

    const [posts, setPosts] = useState(() => restored?.posts || []);
    const [businesses, setBusinesses] = useState(() => restored?.businesses || []);

    const [postsTotal, setPostsTotal] = useState(() => restored?.postsTotal ?? null);
    const [businessesTotal, setBusinessesTotal] = useState(() => restored?.businessesTotal ?? null);

    const [businessCategoryCounts, setBusinessCategoryCounts] = useState(() => restored?.businessCategoryCounts || {});
    const [businessCategoryTotal, setBusinessCategoryTotal] = useState(() => restored?.businessCategoryTotal ?? 0);
    const [businessCategoryCountsLoading, setBusinessCategoryCountsLoading] = useState(false);
    const [postCategoryCounts, setPostCategoryCounts] = useState(() => restored?.postCategoryCounts || {});
    const [postCategoryTotal, setPostCategoryTotal] = useState(() => restored?.postCategoryTotal ?? 0);
    const [postCategoryCountsLoading, setPostCategoryCountsLoading] = useState(false);

    // Location counts for county/city badge display (per tab)
    const [businessLocationCounts, setBusinessLocationCounts] = useState(null);
    const [postLocationCounts, setPostLocationCounts] = useState(null);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate the county filter with the viewer's
    // home_county from their profile. Product decision (2026-04): fresh
    // loads should start statewide, and narrower defaults should be
    // opt-in via the "Apply automatically when I open this tab" checkbox
    // on a saved filter (see SavedFiltersMenu + BusinessFilterBar's
    // auto-apply effect).
    //
    // The ref and effect are kept as a no-op so any surrounding code that
    // checks `appliedHomeDefaultRef.current` keeps its semantics — they
    // mean "past the first-load bootstrap", not literally "applied a
    // home county".
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!viewer) return;
        appliedHomeDefaultRef.current = true;
    }, [viewer]);

    // ── Radius expansion: compute list of counties within the selected radius ──
    const expandedCounties = useMemo(
        () => countiesWithinRadius(postFilters.county, postFilters.radius),
        [postFilters.county, postFilters.radius]
    );

    // ── Map center/zoom — driven by county + radius selection ──
    const AL_CENTER = useMemo(() => [32.69, -86.79], []);
    const AL_ZOOM = 7;
    const [mapCenter, setMapCenter] = useState(AL_CENTER);
    const [mapZoom, setMapZoom] = useState(AL_ZOOM);

    useEffect(() => {
        if (postFilters.county) {
            const center = getCountyCenter(postFilters.county);
            if (center) {
                setMapCenter(center);
                const r = String(postFilters.radius);
                let zoom = 10;
                if (r === STATEWIDE)    zoom = AL_ZOOM;
                else if (r === '100')   zoom = 7.5;
                else if (r === '50')    zoom = 8;
                else if (r === '25')    zoom = 9;
                setMapZoom(zoom);
            }
        } else {
            setMapCenter(AL_CENTER);
            setMapZoom(AL_ZOOM);
        }
    }, [postFilters.county, postFilters.radius, AL_CENTER]);

    const [postsHasMore, setPostsHasMore] = useState(false);
    const [loadingMorePosts, setLoadingMorePosts] = useState(false);
    const [businessesHasMore, setBusinessesHasMore] = useState(false);
    const [loadingMoreBusinesses, setLoadingMoreBusinesses] = useState(false);

    const [loading, setLoading] = useState(() => !restored);
    const [error, setError] = useState('');

    // Create business post dialog
    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
    const [deferEmpty, setDeferEmpty] = useState(() => !restored);

    const [selectedId, setSelectedId] = useState(() => restored?.selectedId || null);
    const [hoveredId, setHoveredId] = useState(null);

    // Right panel tab state (Map / Details)
    const [rightTab, setRightTab] = useState('discover');

    // Focus item on map (when clicking location on a card)
    const [focusMapItemId, setFocusMapItemId] = useState(null);

    // Follow state for directory cards — keyed by business ID, fetched per-account
    const [followingBizIds, setFollowingBizIds] = useState(new Set());

    // Fetch follow states from API when businesses load or active account changes
    const prevAccountKeyRef = useRef(accountCacheKey);
    useEffect(() => {
        const ids = businesses.map((b) => b?.id).filter(Boolean);
        if (!ids.length || !viewer?.id) {
            setFollowingBizIds((prev) => (prev.size === 0 ? prev : new Set()));
            return;
        }
        let cancelled = false;
        const params = new URLSearchParams();
        params.set('target_ids', ids.join(','));
        params.set('target_type', 'business');
        // Spread account params (activeBusinessId / activeArtistId) so
        // resolveActorScope on the backend knows which account is asking.
        const acctParams = getAccountParamsRef.current();
        for (const [k, v] of Object.entries(acctParams)) {
            if (v != null) params.set(k, String(v));
        }
        secureFetch(`/api/users/follow-states?${params.toString()}`, {
            credentials: 'include',
            headers: { ...getAccountHeadersRef.current() },
        })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (cancelled || !data?.following) return;
                const nextSet = new Set();
                for (const [id, val] of Object.entries(data.following)) {
                    if (val) nextSet.add(Number(id));
                }
                setFollowingBizIds(nextSet);
            })
            .catch(() => {});
        prevAccountKeyRef.current = accountCacheKey;
        return () => { cancelled = true; };
    }, [businesses, accountCacheKey, viewer?.id]); // eslint-disable-line react-hooks/exhaustive-deps
    // NOTE: activeBusinessId and activeArtistId are read from refs inside the
    // effect (via getAccountParamsRef) to avoid infinite loops. accountCacheKey
    // already covers account identity changes.

    // Restore scroll position after first render with restored data (only on back navigation)
    const restoredScrollRef = useRef(isPopNavigation ? (restored?.scrollTop ?? null) : null);

    useEffect(() => {
        if (restoredScrollRef.current != null) {
            const scrollTop = restoredScrollRef.current;
            restoredScrollRef.current = null;
            // Wait for DOM to render the restored items, then restore scroll
            requestAnimationFrame(() => {
                const el = document.querySelector('[data-business-scroll]');
                if (el) el.scrollTop = scrollTop;
            });
        } else if (navType !== 'POP') {
            // Fresh navigation from menu — scroll to top
            requestAnimationFrame(() => {
                const el = document.querySelector('[data-business-scroll]');
                if (el) el.scrollTop = 0;
            });
        }
    }, []);

    // Persist hub state to sessionStorage so navigation away and back restores it.
    // Writes immediately on first mount (so the state is never missing if the user
    // navigates away quickly), then debounces subsequent writes to avoid blocking
    // the main thread during rapid input.
    const isFirstSaveRef = useRef(true);
    useEffect(() => {
        const doSave = () => {
            const scrollEl = document.querySelector('[data-business-scroll]');
            const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
            saveHubState({
                tab,
                searchTerm,
                appliedSearch,
                filtersOpen,
                postFilters,
                posts,
                businesses,
                postsTotal,
                businessesTotal,
                businessCategoryCounts,
                businessCategoryTotal,
                postCategoryCounts,
                postCategoryTotal,
                selectedId,
                scrollTop,
                accountCacheKey,
            });
        };

        // First save is immediate so state is persisted before any quick navigation
        if (isFirstSaveRef.current) {
            isFirstSaveRef.current = false;
            doSave();
            return;
        }

        const timer = setTimeout(doSave, 300);
        return () => clearTimeout(timer);
    }, [tab, searchTerm, appliedSearch, filtersOpen, postFilters, posts, businesses, postsTotal, businessesTotal, businessCategoryCounts, businessCategoryTotal, postCategoryCounts, postCategoryTotal, selectedId, accountCacheKey]);

    // Also save scroll position on scroll so it's captured even between state changes
    useEffect(() => {
        const el = document.querySelector('[data-business-scroll]');
        if (!el) return;
        let rafId = null;
        const onScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                try {
                    const raw = sessionStorage.getItem(HUB_STATE_KEY);
                    if (raw) {
                        const state = JSON.parse(raw);
                        state.scrollTop = el.scrollTop;
                        sessionStorage.setItem(HUB_STATE_KEY, JSON.stringify(state));
                    }
                } catch {
                    // ignore
                }
            });
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [loading]); // re-attach when loading changes (scroll element may remount)

    const loadMoreRef = useRef(null);

    const loadPosts = useCallback(async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            setPostCategoryCountsLoading(true);
            const resp = await fetchBusinessPosts({
                limit: PAGE_SIZE,
                offset: 0,
                q: appliedSearch || '',
                view: postFilters.view,
                sort: postFilters.postSort || 'newest',
                city: postFilters.city,
                county: postFilters.county,
                counties: expandedCounties,
                categoryKey: postFilters.categoryKey,
                type: postFilters.postType || '',
                entityType: postFilters.entityType || '',
                dateRange: postFilters.dateRange || 'all',
                activeBusinessId: activeBusinessIdRef.current || null,
                activeArtistId: activeArtistIdRef.current || null,
            });

            const items = Array.isArray(resp?.items) ? resp.items : [];
            setPosts(items);

            const totalNum = Number(resp?.total);
            const total = Number.isFinite(totalNum) && totalNum >= 0 ? totalNum : items.length;
            setPostsTotal(total);
            setPostsHasMore(items.length < total);

            // Fetch category counts with all filters EXCEPT categoryKey
            const responseCounts = pickCategoryCounts(resp);
            if (Object.keys(responseCounts).length > 0 && !postFilters.categoryKey) {
                setPostCategoryCounts(responseCounts);
                setPostCategoryTotal(pickCategoryTotal(resp, total));
            } else {
                try {
                    const countsResp = await fetchBusinessPosts({
                        limit: 0,
                        offset: 0,
                        q: appliedSearch || '',
                        view: postFilters.view,
                        sort: postFilters.postSort || 'newest',
                        city: postFilters.city,
                        county: postFilters.county,
                        counties: expandedCounties,
                        categoryKey: '',
                        type: postFilters.postType || '',
                        entityType: postFilters.entityType || '',
                        dateRange: postFilters.dateRange || 'all',
                        activeBusinessId: activeBusinessIdRef.current || null,
                        activeArtistId: activeArtistIdRef.current || null,
                    });
                    const unfilteredCounts = pickCategoryCounts(countsResp);
                    if (Object.keys(unfilteredCounts).length > 0) {
                        setPostCategoryCounts(unfilteredCounts);
                        setPostCategoryTotal(pickCategoryTotal(countsResp));
                    } else {
                        setPostCategoryCounts(pickCategoryCounts(resp));
                        setPostCategoryTotal(pickCategoryTotal(resp, total));
                    }
                } catch {
                    setPostCategoryCounts(pickCategoryCounts(resp));
                    setPostCategoryTotal(pickCategoryTotal(resp, total));
                }
            }
        } catch (e) {
            setError(String(e?.message || 'Failed to load business posts.'));
            setPosts([]);
            setPostsTotal(0);
            setPostsHasMore(false);
            setPostCategoryCounts({});
            setPostCategoryTotal(0);
        } finally {
            setPostCategoryCountsLoading(false);
            setLoading(false);
        }
    }, [appliedSearch, postFilters.view, postFilters.postSort, postFilters.city, postFilters.county, postFilters.categoryKey, postFilters.postType, postFilters.entityType, postFilters.dateRange, expandedCounties]);

    // Listen for business post edit/delete events to refresh the list immediately
    // Preserve scroll position so the user doesn't lose their place
    useEffect(() => {
        const silentRefresh = async () => {
            const scrollEl = document.querySelector('[data-business-scroll]');
            const savedTop = scrollEl ? scrollEl.scrollTop : 0;
            await loadPosts({ silent: true });
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const el = document.querySelector('[data-business-scroll]');
                    if (el) el.scrollTop = savedTop;
                });
            });
        };

        const onUpdated = async () => {
            await silentRefresh();
            showSuccess('Post updated successfully');
        };

        const onDeleted = async (e) => {
            const delId = e?.detail?.postId ?? null;
            if (delId != null) {
                setSelectedId((prev) => (prev != null && String(prev) === String(delId)) ? null : prev);
            }
            await loadPosts({ silent: true });
            showSuccess('Post deleted successfully');
        };

        // If we arrived here after a post was deleted, force an immediate refresh
        if (postDeletedOnMount.current) {
            postDeletedOnMount.current = false;
            loadPosts({ silent: true });
        }

        window.addEventListener('ll:businessPost:updated', onUpdated);
        window.addEventListener('ll:businessPost:refresh', silentRefresh);
        window.addEventListener('ll:businessPost:deleted', onDeleted);
        return () => {
            window.removeEventListener('ll:businessPost:updated', onUpdated);
            window.removeEventListener('ll:businessPost:refresh', silentRefresh);
            window.removeEventListener('ll:businessPost:deleted', onDeleted);
        };
    }, [loadPosts, showSuccess]);

    const loadBusinesses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (viewerIdRef.current) {
                try {
                    const myBizResp = await fetchMyBusinesses();
                    const myBizIds = (Array.isArray(myBizResp?.businesses) ? myBizResp.businesses : [])
                        .map((b) => b?.id)
                        .filter(Boolean);
                    setMyBusinessIds(myBizIds);
                } catch {
                    setMyBusinessIds([]);
                }
            } else {
                setMyBusinessIds([]);
            }

            const resp = await fetchPublishedBusinesses({
                limit: PAGE_SIZE,
                offset: 0,
                q: appliedSearch || '',
                city: postFilters.city,
                county: postFilters.county,
                counties: expandedCounties,
                categoryKey: postFilters.categoryKey,
                sort: postFilters.businessSort || 'any',
                view: postFilters.view || 'all',
                entityType: postFilters.entityType || '',
            });
            const items = Array.isArray(resp?.items) ? resp.items : (Array.isArray(resp) ? resp : []);
            setBusinesses(items);

            const totalNum = Number(resp?.total);
            const total = Number.isFinite(totalNum) && totalNum >= 0 ? totalNum : items.length;
            setBusinessesTotal(total);
            setBusinessesHasMore(items.length < total);

            const responseCounts = pickCategoryCounts(resp);
            if (Object.keys(responseCounts).length > 0 && !postFilters.categoryKey && !postFilters.entityType && (!postFilters.view || postFilters.view === 'all')) {
                setBusinessCategoryCounts(responseCounts);
                setBusinessCategoryTotal(pickCategoryTotal(resp, total));
            } else {
                setBusinessCategoryCountsLoading(true);
                try {
                    const countsResp = await fetchPublishedBusinesses({
                        limit: 0,
                        offset: 0,
                        q: appliedSearch || '',
                        city: postFilters.city,
                        county: postFilters.county,
                        counties: expandedCounties,
                        categoryKey: '',
                        sort: postFilters.businessSort || 'any',
                        view: postFilters.view || 'all',
                        entityType: postFilters.entityType || '',
                    });
                    const unfilteredCounts = pickCategoryCounts(countsResp);
                    if (Object.keys(unfilteredCounts).length > 0) {
                        setBusinessCategoryCounts(unfilteredCounts);
                        setBusinessCategoryTotal(pickCategoryTotal(countsResp));
                    } else {
                        const fallbackResp = await fetchBusinessCategoryCounts({
                            q: appliedSearch || '',
                            city: postFilters.city,
                            county: postFilters.county,
                            counties: expandedCounties,
                        });
                        setBusinessCategoryCounts(pickCategoryCounts(fallbackResp));
                        setBusinessCategoryTotal(pickCategoryTotal(fallbackResp, total));
                    }
                } catch {
                    setBusinessCategoryCounts({});
                    setBusinessCategoryTotal(total);
                } finally {
                    setBusinessCategoryCountsLoading(false);
                }
            }
        } catch (e) {
            setError(String(e?.message || 'Failed to load businesses.'));
            setBusinesses([]);
            setBusinessesTotal(0);
            setBusinessCategoryCounts({});
            setBusinessCategoryTotal(0);
        } finally {
            setLoading(false);
        }
    }, [appliedSearch, postFilters.city, postFilters.county, postFilters.categoryKey, postFilters.businessSort, postFilters.view, postFilters.entityType, expandedCounties]);

    // When a user blocks or hides a business, gracefully remove its posts
    // and directory entry from local state instead of reloading everything
    // (which flashes the loading state and can trigger infinite scroll oddly).
    useEffect(() => {
        const onBlockOrHide = (e) => {
            const targetId = Number(e?.detail?.userId || e?.detail?.businessId || 0);
            const targetType = e?.detail?.targetType || '';
            if (!targetId) return;

            // Some sources (e.g. BusinessDetailPanel) unmount before they can
            // render their own snackbar, so they include `toastMessage` on the
            // event detail for us to render here.
            const toastMessage = e?.detail?.toastMessage;
            if (toastMessage) {
                try { showSuccess(toastMessage); } catch { /* */ }
            }

            // Filter posts from the blocked/hidden business out of state
            setPosts((prev) => {
                const next = prev.filter((p) => {
                    const pBizId = Number(
                        p?.businessId || p?.businessPageId || p?.business_id ||
                        p?.business_page_id || p?.pageId || p?.page_id || 0
                    );
                    const pUserId = Number(
                        p?.authorUserId || p?.author_user_id || p?.user_id || p?.userId || 0
                    );
                    // Remove if the post belongs to the hidden/blocked entity
                    if (pBizId && pBizId === targetId) return false;
                    if (targetType === 'personal' && pUserId && pUserId === targetId) return false;
                    return true;
                });
                // Update the total to reflect removed posts
                setPostsTotal((t) => Math.max(0, t - (prev.length - next.length)));
                return next;
            });

            // Also filter from the businesses directory list
            if (targetType === 'business' || !targetType) {
                setBusinesses((prev) => {
                    const next = prev.filter((b) => {
                        const bId = Number(b?.id || b?.business_id || 0);
                        return bId !== targetId;
                    });
                    setBusinessesTotal((t) => Math.max(0, t - (prev.length - next.length)));
                    return next;
                });
            }
        };
        window.addEventListener('ll:user:blocked-changed', onBlockOrHide);
        window.addEventListener('ll:user:hidden-changed', onBlockOrHide);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', onBlockOrHide);
            window.removeEventListener('ll:user:hidden-changed', onBlockOrHide);
        };
    }, [showSuccess]);

    // Listen for business review changes and update the businesses array
    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d?.businessId) return;
            setBusinesses((prev) => prev.map((b) => {
                if (String(b.id) !== String(d.businessId)) return b;
                return {
                    ...b,
                    rating: d.averageRating,
                    avg_rating: d.averageRating,
                    review_count: d.reviewCount,
                    reviewCount: d.reviewCount,
                };
            }));
        };
        window.addEventListener('ll:business:review-changed', handler);
        return () => window.removeEventListener('ll:business:review-changed', handler);
    }, []);

    const loadMorePosts = useCallback(async () => {
        if (loadingMorePosts || !postsHasMore) return;
        setLoadingMorePosts(true);
        try {
            const currentCount = Array.isArray(posts) ? posts.length : 0;
            const resp = await fetchBusinessPosts({
                limit: PAGE_SIZE,
                offset: currentCount,
                q: appliedSearch || '',
                view: postFilters.view,
                sort: postFilters.postSort || 'newest',
                city: postFilters.city,
                county: postFilters.county,
                counties: expandedCounties,
                categoryKey: postFilters.categoryKey,
                type: postFilters.postType || '',
                entityType: postFilters.entityType || '',
                dateRange: postFilters.dateRange || 'all',
                activeBusinessId: activeBusinessIdRef.current || null,
                activeArtistId: activeArtistIdRef.current || null,
            });
            const nextItems = Array.isArray(resp?.items) ? resp.items : [];
            if (nextItems.length) {
                setPosts((prev) => {
                    const existing = new Set((Array.isArray(prev) ? prev : []).map((p) => String(p?.id)));
                    const merged = (Array.isArray(prev) ? prev : []).slice();
                    nextItems.forEach((p) => { if (p?.id && !existing.has(String(p.id))) merged.push(p); });
                    return merged;
                });
            }
            const totalNum = Number(resp?.total);
            if (Number.isFinite(totalNum) && totalNum >= 0) setPostsTotal(totalNum);
            setPostsHasMore(currentCount + nextItems.length < (Number.isFinite(totalNum) ? totalNum : Number(postsTotal) || 0));
        } catch {
            // keep current
        } finally {
            setLoadingMorePosts(false);
        }
    }, [loadingMorePosts, postsHasMore, posts, appliedSearch, postFilters.view, postFilters.postSort, postFilters.city, postFilters.county, postFilters.categoryKey, postFilters.postType, postFilters.entityType, postFilters.dateRange, postsTotal, expandedCounties]);

    const loadMoreBusinesses = useCallback(async () => {
        if (loadingMoreBusinesses || !businessesHasMore) return;
        setLoadingMoreBusinesses(true);
        try {
            const currentCount = Array.isArray(businesses) ? businesses.length : 0;
            const resp = await fetchPublishedBusinesses({
                limit: PAGE_SIZE,
                offset: currentCount,
                q: appliedSearch || '',
                city: postFilters.city,
                county: postFilters.county,
                counties: expandedCounties,
                categoryKey: postFilters.categoryKey,
                sort: postFilters.businessSort || 'any',
                view: postFilters.view || 'all',
                entityType: postFilters.entityType || '',
            });
            const nextItems = Array.isArray(resp?.items) ? resp.items : (Array.isArray(resp) ? resp : []);
            if (nextItems.length) {
                setBusinesses((prev) => {
                    const existing = new Set((Array.isArray(prev) ? prev : []).map((b) => String(b?.id)));
                    const merged = (Array.isArray(prev) ? prev : []).slice();
                    nextItems.forEach((b) => { if (b?.id && !existing.has(String(b.id))) merged.push(b); });
                    return merged;
                });
            }
            const totalNum = Number(resp?.total);
            if (Number.isFinite(totalNum) && totalNum >= 0) setBusinessesTotal(totalNum);
            setBusinessesHasMore(currentCount + nextItems.length < (Number.isFinite(totalNum) ? totalNum : Number(businessesTotal) || 0));
        } catch {
            // keep current
        } finally {
            setLoadingMoreBusinesses(false);
        }
    }, [loadingMoreBusinesses, businessesHasMore, businesses, appliedSearch, postFilters.city, postFilters.county, postFilters.categoryKey, postFilters.businessSort, postFilters.view, postFilters.entityType, businessesTotal, expandedCounties]);

    // Infinite scroll: load more when near bottom
    loadMoreRef.current = tab === 'posts' ? loadMorePosts : loadMoreBusinesses;
    useEffect(() => {
        const el = document.querySelector('[data-business-scroll]');
        if (!el) return;
        const onScroll = () => {
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
                const fn = loadMoreRef.current;
                if (fn) fn();
            }
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
    }, [tab, loading]);

    const refreshActive = useCallback(async () => {
        if (tab === 'posts') await loadPosts();
        else await loadBusinesses();
    }, [tab, loadPosts, loadBusinesses]);

    // ── Mobile pull-to-refresh ──────────────────────────────────────────
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartRef = useRef(null);
    const pullScrollRef = useRef(null);
    const PULL_THRESHOLD = 70;

    const handlePullTouchStart = useCallback((e) => {
        if (!isMobile || pullRefreshing) return;
        const el = e.currentTarget;
        if (el.scrollTop > 5) { pullStartRef.current = null; return; }
        pullStartRef.current = e.touches[0].clientY;
        pullScrollRef.current = el;
    }, [isMobile, pullRefreshing]);

    const handlePullTouchMove = useCallback((e) => {
        if (!isMobile || pullRefreshing || pullStartRef.current == null) return;
        const el = pullScrollRef.current;
        if (el && el.scrollTop > 5) { pullStartRef.current = null; setPullDistance(0); return; }
        const dy = e.touches[0].clientY - pullStartRef.current;
        if (dy > 0) setPullDistance(Math.min(dy * 0.45, 120));
        else setPullDistance(0);
    }, [isMobile, pullRefreshing]);

    const handlePullTouchEnd = useCallback(() => {
        if (!isMobile || pullRefreshing) return;
        if (pullDistance >= PULL_THRESHOLD) {
            setPullRefreshing(true);
            setPullDistance(0);
            refreshActive();
            setTimeout(() => setPullRefreshing(false), 1200);
        } else {
            setPullDistance(0);
        }
        pullStartRef.current = null;
    }, [isMobile, pullRefreshing, pullDistance, refreshActive]);

    const skipInitialFetchRef = useRef(
        Boolean(restored && (restored.posts?.length || restored.businesses?.length)) &&
        restored?.accountCacheKey === accountCacheKey
    );

    // Inject list stagger keyframes once
    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used `useSubheaderScrollHide` to translateY + negative
    // margin-bottom the subheader, reclaiming its vertical space as the user
    // scrolled. That produced jerky layout shifts (bar moving + content pulling
    // up behind it). The subheader is now `position: sticky` directly beneath
    // the global header and fades via `opacity: calc(1 - var(--ll-nav-offset))`.
    // See Header.jsx — the same CSS var drives every piece of chrome so they
    // all fade together in lockstep. Hooks disabled (not removed) in case we
    // want to reintroduce a hybrid motion later.
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-business-scroll]',
        enabled: false,
    });

    // ── Same thing, but for the Discover tab's own scroll container ──
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-discover-scroll]',
        enabled: false,
    });

    // ── Location counts for county/city badge display ──
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                if (tab === 'posts') {
                    const data = await fetchBusinessPostLocationCounts({
                        q: appliedSearch || '',
                        type: postFilters.postType || '',
                        county: postFilters.county || '',
                        city: postFilters.city || '',
                        categoryKey: postFilters.categoryKey || '',
                        view: postFilters.view || 'all',
                        entityType: postFilters.entityType || '',
                        dateRange: postFilters.dateRange || 'all',
                        sort: postFilters.postSort || 'newest',
                    });
                    if (!cancelled) setPostLocationCounts(data);
                } else {
                    const data = await fetchBusinessLocationCounts({
                        q: appliedSearch || '',
                        county: postFilters.county || '',
                        city: postFilters.city || '',
                        categoryKey: postFilters.categoryKey || '',
                        view: postFilters.view || 'all',
                        entityType: postFilters.entityType || '',
                        sort: postFilters.businessSort || 'any',
                    });
                    if (!cancelled) setBusinessLocationCounts(data);
                }
            } catch {
                if (!cancelled) {
                    if (tab === 'posts') setPostLocationCounts({ counties: {}, cities: {} });
                    else setBusinessLocationCounts({ counties: {}, cities: {} });
                }
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [tab, appliedSearch, postFilters.county, postFilters.city, postFilters.postType, postFilters.categoryKey, postFilters.view, postFilters.entityType, postFilters.dateRange, postFilters.postSort, postFilters.businessSort]);

    // Keep empty state hidden until the first fetch completes, preventing a flash of "No businesses"
    useEffect(() => {
        if (!loading && deferEmpty) {
            const t = setTimeout(() => setDeferEmpty(false), 220);
            return () => clearTimeout(t);
        }
    }, [loading, deferEmpty]);

    useEffect(() => {
        if (skipInitialFetchRef.current) {
            skipInitialFetchRef.current = false;
            return;
        }
        void refreshActive();
    }, [refreshActive]);

    // Re-fetch data when the active account changes (e.g. switching from
    // personal to business account).  The account IDs are read from refs
    // inside the fetch callbacks to avoid recreating them on every render.
    const prevAccountCacheKeyRef = useRef(accountCacheKey);
    useEffect(() => {
        if (prevAccountCacheKeyRef.current === accountCacheKey) return;
        prevAccountCacheKeyRef.current = accountCacheKey;
        void refreshActive();
    }, [accountCacheKey, refreshActive]);

    const handleTabChange = useCallback((_e, next) => {
        const v = next === 'businesses' ? 'businesses' : 'posts';

        // Fade out current content, switch, then fade in new content.
        setContentVisible(false);
        if (fadeTimerRef.current) {
            clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
        }

        fadeTimerRef.current = setTimeout(() => {
            fadeTimerRef.current = null;
            setTab(v);
            setSelectedId(null);
            setRightTab('discover');
            // Preserve search and filters across tab switches — they share
            // common fields (county, city, category, search) so the user's
            // selections stay intact when toggling between Posts and Businesses.
            // Filters only reset via the explicit Reset button or a new session.

            // Reset scroll to top when switching tabs
            requestAnimationFrame(() => {
                const el = document.querySelector('[data-business-scroll]');
                if (el) el.scrollTop = 0;
                setContentVisible(true);
            });
        }, tabFadeMs);
    }, [tabFadeMs]);

    const handleSearch = useCallback(() => {
        setAppliedSearch(String(searchTerm || '').trim());
        setSelectedId(null);
        requestAnimationFrame(() => {
            const el = document.querySelector('[data-business-scroll]');
            if (el) el.scrollTop = 0;
        });
    }, [searchTerm]);

    const handleClear = useCallback(() => {
        setSearchTerm('');
        setAppliedSearch('');
        setSelectedId(null);
        requestAnimationFrame(() => {
            const el = document.querySelector('[data-business-scroll]');
            if (el) el.scrollTop = 0;
        });
    }, []);

    const handleClearFilters = useCallback(() => {
        setPostFilters({
            view: 'all',
            categoryKey: '',
            postType: '',
            entityType: '',
            city: '',
            county: '',
            radius: STATEWIDE,
            businessSort: 'any',
            postSort: 'newest',
            dateRange: 'all',
        });
        setSearchTerm('');
        setAppliedSearch('');
        setSelectedId(null);
        requestAnimationFrame(() => {
            const el = document.querySelector('[data-business-scroll]');
            if (el) el.scrollTop = 0;
        });
    }, []);

    // Saved filters restore: update BOTH the search input state AND
    // appliedSearch so the input reflects the restored term and the
    // fetch re-runs with it. Called by BusinessFilterBar's apply handler.
    const handleSavedSearchQueryChange = useCallback((val) => {
        const next = String(val || '').trim();
        setSearchTerm(next);
        setAppliedSearch(next);
        setSelectedId(null);
    }, []);

    const handleSearchKeyDown = useCallback(
        (e) => {
            if (e?.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        },
        [handleSearch]
    );

    const activeCriteria = useMemo(() => {
        const items = [];
        const activeSearch = String(appliedSearch || '').trim();
        if (activeSearch) items.push(`Search: ${activeSearch}`);
        if (postFilters.categoryKey) items.push(`Category: ${postFilters.categoryKey.replace(/_/g, ' ')}`);
        if (postFilters.entityType) items.push(`Type: ${postFilters.entityType.charAt(0).toUpperCase() + postFilters.entityType.slice(1)}`);
        if (postFilters.city) items.push(`City: ${postFilters.city}`);
        if (postFilters.county) items.push(`County: ${postFilters.county}`);
        if (tab === 'posts' && postFilters.postType) items.push(`Type: ${postFilters.postType}`);
        if (tab === 'posts' && postFilters.dateRange && postFilters.dateRange !== 'all') items.push(`Date: ${postFilters.dateRange.replace(/_/g, ' ')}`);

        return items;
    }, [appliedSearch, postFilters, tab]);

    // Title Case helper
    const toTitleCase = (str) => String(str || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // Structured filter chips for mobile — each with a key and remove handler
    const activeFilterChips = useMemo(() => {
        const chips = [];
        // Show applied search term as a removable chip
        const appliedTerm = String(appliedSearch || '').trim();
        if (appliedTerm) {
            const truncated = appliedTerm.length > 24 ? appliedTerm.slice(0, 24) + '…' : appliedTerm;
            chips.push({
                key: 'search',
                label: `"${truncated}"`,
                onRemove: () => {
                    setSearchTerm('');
                    setAppliedSearch('');
                },
            });
        }
        if (postFilters.categoryKey) chips.push({ key: 'category', label: toTitleCase(postFilters.categoryKey.replace(/_/g, ' ')), onRemove: () => setPostFilters((p) => ({ ...p, categoryKey: '' })) });
        if (postFilters.city) chips.push({ key: 'city', label: toTitleCase(postFilters.city), onRemove: () => setPostFilters((p) => ({ ...p, city: '' })) });
        if (postFilters.county) chips.push({ key: 'county', label: `${toTitleCase(postFilters.county)} County`, onRemove: () => setPostFilters((p) => ({ ...p, county: '', city: '', radius: STATEWIDE })) });
        if (postFilters.county && !isCountyOnly(postFilters.radius)) chips.push({ key: 'radius', label: radiusLabel(postFilters.radius), onRemove: () => setPostFilters((p) => ({ ...p, radius: DEFAULT_RADIUS_WHEN_COUNTY_SELECTED })) });
        if (postFilters.entityType) chips.push({ key: 'entityType', label: toTitleCase(postFilters.entityType), onRemove: () => setPostFilters((p) => ({ ...p, entityType: '' })) });
        if (tab === 'posts' && postFilters.postType) chips.push({ key: 'postType', label: toTitleCase(postFilters.postType), onRemove: () => setPostFilters((p) => ({ ...p, postType: '' })) });
        if (tab === 'posts' && postFilters.dateRange && postFilters.dateRange !== 'all') chips.push({ key: 'dateRange', label: toTitleCase(postFilters.dateRange.replace(/_/g, ' ')), onRemove: () => setPostFilters((p) => ({ ...p, dateRange: 'all' })) });
        const sortKey = tab === 'posts' ? postFilters.postSort : postFilters.businessSort;
        const sortDefault = tab === 'posts' ? 'newest' : 'any';
        if (sortKey && sortKey !== sortDefault) chips.push({ key: 'sort', label: `Sort: ${toTitleCase(sortKey)}`, onRemove: () => setPostFilters((p) => ({ ...p, [tab === 'posts' ? 'postSort' : 'businessSort']: sortDefault })) });
        return chips;
    }, [postFilters, tab, appliedSearch]);

    const filteredPosts = useMemo(() => {
        const q = String(appliedSearch || '').trim().toLowerCase();
        if (!q) return posts;
        return (Array.isArray(posts) ? posts : []).filter((p) => {
            const hay = [p?.title, p?.pageName, p?.body].map((v) => String(v || '').toLowerCase()).join(' ');
            return hay.includes(q);
        });
    }, [posts, appliedSearch]);

    const filteredBusinesses = useMemo(() => {
        let list = Array.isArray(businesses) ? businesses : [];

        // If "My Businesses" view is selected, filter to only show user's businesses
        // Client-side search filter (in addition to server-side)
        const q = String(appliedSearch || '').trim().toLowerCase();
        if (q) {
            list = list.filter((b) => {
                const hay = [b?.name, b?.slug, b?.category, b?.category_key, b?.city, b?.county, b?.description]
                    .map((v) => String(v || '').toLowerCase())
                    .join(' ');
                return hay.includes(q);
            });
        }

        return list;
    }, [businesses, appliedSearch]);

    const leftItems = tab === 'posts' ? filteredPosts : filteredBusinesses;

    const footerText = useMemo(() => {
        // Show "Loading..." while data is being fetched
        if (loading) return 'Loading\u2026';

        const entityType = (postFilters.entityType || '').toLowerCase();
        const entityLabel = entityType === 'nonprofit' ? 'nonprofit' : entityType === 'organization' ? 'organization' : '';
        const noun = tab === 'posts'
            ? (entityLabel ? `${entityLabel} posts` : 'posts')
            : (entityLabel ? `${entityLabel}s` : 'businesses');
        const singularNoun = tab === 'posts'
            ? (entityLabel ? `${entityLabel} post` : 'post')
            : (entityLabel || 'business');
        const shown = leftItems.length;

        const rawTotal = tab === 'posts' ? postsTotal : businessesTotal;
        const total = Number(rawTotal);

        if (shown === 0) {
            const locCity = postFilters.city ? toTitleCase(postFilters.city) : '';
            const locCounty = postFilters.county ? `${toTitleCase(postFilters.county)} County` : '';
            const locLabel = locCity && locCounty ? `${locCity}, ${locCounty}`
                : locCity || locCounty || '';
            return locLabel ? `No ${noun} found in ${locLabel}` : `No ${noun} match your filters`;
        }

        if (Number.isFinite(total) && total > 0) {
            const clamped = Math.min(shown, total);
            const displayNoun = total === 1 ? singularNoun : noun;
            return `Displaying ${clamped.toLocaleString()} out of ${total.toLocaleString()} ${displayNoun}`;
        }
        const displayNoun = shown === 1 ? singularNoun : noun;
        return `Displaying ${shown.toLocaleString()} ${displayNoun}`;
    }, [leftItems.length, tab, postsTotal, businessesTotal, loading, postFilters.entityType]);

    const selectedPost = useMemo(() => {
        if (tab !== 'posts') return null;
        if (selectedId == null) return null;
        return filteredPosts.find((p) => String(p?.id) === String(selectedId)) || null;
    }, [filteredPosts, selectedId, tab]);

    const selectedBusiness = useMemo(() => {
        if (tab !== 'businesses') return null;
        if (selectedId == null) return null;
        return filteredBusinesses.find((b) => String(b?.id) === String(selectedId)) || null;
    }, [filteredBusinesses, selectedId, tab]);

    const handleShare = useCallback(() => {
        // TODO: wire business share dialog (same UX as community)
    }, []);

    // When an item is selected from the map popup card, switch to Details tab
    const handleMapSelectItem = useCallback((item) => {
        if (!item?.id) return;
        if (isMobile && tab === 'businesses') {
            const slug = item?.slug || item?.handle || item?.id;
            if (slug) {
                setMobileBusinessFromMap(true);
                setMobileBusinessSlug(slug);
                setMobileBusinessPageOpen(true);
                setSelectedId(item.id); // preserve so pin stays focused on return
                return;
            }
        }
        setSelectedId(item.id);
        setRightTab('details');
        if (isMobile) {
            setMobileDrawerMode(tab === 'posts' ? 'post' : 'business');
            setMobileDetailOpen(true);
        }
    }, [isMobile, tab]);

    // When selecting from left panel cards, also switch to Details tab
    const handleCardSelect = useCallback((id) => {
        if (isMobile && tab === 'businesses') {
            // Open full-screen business page overlay on mobile (slides in from right)
            const biz = filteredBusinesses.find((b) => String(b?.id) === String(id));
            const slug = biz?.slug || biz?.handle || biz?.id;
            if (slug) {
                setMobileBusinessFromMap(false);
                setMobileBusinessSlug(slug);
                setMobileBusinessPageOpen(true);
                return;
            }
        }
        setSelectedId(id);
        setRightTab('details');
        if (isMobile) {
            setMobileDrawerMode('post');
            setMobileDetailOpen(true);
        }
    }, [isMobile, tab, filteredBusinesses]);

    // When clicking the location on a directory card or post card, pan to pin on map.
    // On mobile: open the map drawer first, then delay the flyTo so the drawer
    // slide-up animation finishes before the map starts moving (matches Community).
    const handleLocationClick = useCallback((biz) => {
        if (!biz?.id) return;

        if (window.innerWidth < 1440) {
            // Mobile — open map drawer, then focus after animation
            if (mobileMapOpen) {
                // Drawer already open — fly immediately
                setFocusMapItemId(biz.id);
            } else {
                setMobileMapOpen(true);
                setTimeout(() => {
                    setFocusMapItemId(biz.id);
                }, 380);
            }
        } else {
            // Desktop — just switch to map tab in the right panel
            setFocusMapItemId(biz.id);
            setRightTab('map');
        }
    }, [mobileMapOpen]);

    // "Submit a Page" — check draft & pending counts, then navigate to setup.
    const handleSubmitPage = useCallback(async () => {
        if (!viewer) {
            openLoginPopup('Log in to create content on The Local Lantern');
            return;
        }
        if (isNonPersonalAccount) {
            setAccountSwitchOpen(true);
            return;
        }
        // Rate-limit check (in-memory burst guard)
        const rl = checkDraftCreateLimit();
        if (!rl.allowed) {
            setRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'business drafts' });
            setRateLimitOpen(true);
            return;
        }
        // Check draft & pending counts before navigating
        try {
            setDraftLimitChecking(true);
            const resp = await fetchMyBusinesses();
            const list = Array.isArray(resp?.businesses) ? resp.businesses : [];
            const draftCount = list.filter((b) => b.status === 'draft').length;
            const pendingCount = list.filter((b) => b.status === 'pending_approval').length;
            if (draftCount >= 5) {
                setDraftLimitMessage('You already have 5 business page drafts. Please finish or delete an existing draft before starting a new one.');
                setDraftLimitDialogOpen(true);
                return;
            }
            if (pendingCount >= 5) {
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
    }, [navigate, isNonPersonalAccount, viewer, openLoginPopup, checkDraftCreateLimit]);

    const handleOpenCreatePost = useCallback(() => {
        const result = checkPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'posts' });
            setRateLimitOpen(true);
            return;
        }
        setCreatePostOpen(true);
    }, [checkPostLimit]);

    // ── Listen for create actions from the global Header create menu ──
    const handleOpenCreatePostRef = useRef(handleOpenCreatePost);
    handleOpenCreatePostRef.current = handleOpenCreatePost;

    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};
            if (action !== 'businessPost') return;

            if (blocked === 'rateLimit') {
                setRateLimitInfo({ retryAfterSec: retryAfterSec || 10, reason: reason || 'cooldown', actionLabel: 'posts' });
                setRateLimitOpen(true);
                return;
            }

            handleOpenCreatePostRef.current();
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => {
            window.removeEventListener('ll:header:create', handleHeaderCreate);
        };
    }, []);

    const handleCloseCreatePost = useCallback(() => {
        setCreatePostOpen(false);
    }, []);

    const handlePostCreated = useCallback(() => {
        recordPost();
        setCreatePostOpen(false);
        showSuccess('Your post has been published!');
        // loadPosts will be triggered by the 'll:businessPost:refresh' event
        // dispatched from the dialog, which is already listened for above.
    }, [showSuccess]);

    // When clicking the user profile area on a post card, open the UserCardPopover
    const handleOpenUserCard = useCallback((anchorEl, userData) => {
        setUserCardAnchor(anchorEl);
        setUserCardUser(userData || null);
    }, []);

    // Stable ref for followingBizIds to prevent handleFollowBusiness from
    // being recreated whenever the Set changes (which would cascade to child re-renders).
    const followingBizIdsRef = useRef(followingBizIds);
    followingBizIdsRef.current = followingBizIds;

    // Follow/unfollow a business (optimistic + API call, account-aware)
    // Uses getAccountPayload() to send { business_id, account_type } in body
    // and getAccountHeaders() for x-account-type / x-business-id headers,
    // matching ActionBar's pattern so resolveActorScope correctly identifies the actor.
    const handleFollowBusiness = useCallback(async (biz) => {
        if (!biz?.id) return;
        const bizId = Number(biz.id);
        const wasFollowing = followingBizIdsRef.current.has(bizId);
        // Optimistic toggle
        setFollowingBizIds((prev) => {
            const next = new Set(prev);
            if (wasFollowing) next.delete(bizId);
            else next.add(bizId);
            return next;
        });
        try {
            const payload = {
                target_id: bizId,
                target_type: 'business',
                action: wasFollowing ? 'unfollow' : 'follow',
                ...getAccountPayloadRef.current(),
            };
            const res = await secureFetch('/api/follows/toggle', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAccountHeadersRef.current(),
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                // rollback
                setFollowingBizIds((prev) => {
                    const next = new Set(prev);
                    if (wasFollowing) next.add(bizId);
                    else next.delete(bizId);
                    return next;
                });
            } else {
                const data = await res.json().catch(() => null);
                const nowFollowing = data?.following ?? data?.isFollowing ?? !wasFollowing;
                // Sync with server truth
                setFollowingBizIds((prev) => {
                    const next = new Set(prev);
                    if (nowFollowing) next.add(bizId);
                    else next.delete(bizId);
                    return next;
                });
                // Broadcast change so other components (detail panel, etc.) sync
                window.dispatchEvent(new CustomEvent('ll:business:follow-changed', {
                    detail: { businessId: bizId, isFollowing: nowFollowing, source: 'hub' },
                }));
            }
        } catch {
            // rollback
            setFollowingBizIds((prev) => {
                const next = new Set(prev);
                if (wasFollowing) next.add(bizId);
                else next.delete(bizId);
                return next;
            });
        }
    }, []);

    // Listen for follow changes from detail panel or other sources (not from this component)
    useEffect(() => {
        const handler = (e) => {
            const { businessId, isFollowing: nowFollowing, source } = e.detail || {};
            if (!businessId || source === 'hub') return; // ignore our own events
            setFollowingBizIds((prev) => {
                const next = new Set(prev);
                if (nowFollowing) next.add(Number(businessId));
                else next.delete(Number(businessId));
                return next;
            });
        };
        window.addEventListener('ll:business:follow-changed', handler);
        return () => window.removeEventListener('ll:business:follow-changed', handler);
    }, []);

    // Combined items for the map (both posts and businesses depending on active tab)
    const mapItems = useMemo(() => {
        if (tab === 'posts') return filteredPosts;
        return filteredBusinesses;
    }, [tab, filteredPosts, filteredBusinesses]);

    // Build popup content map for post pins (like CommunityPage's popupContentById).
    // When tab=posts, the map should show BusinessPostCard popups instead of
    // BusinessMapPopupCard (directory) popups.
    // Stable ref for viewer to avoid popupContentById recreating on every render
    // when the parent passes a new `user` object reference with the same data.
    const viewerRef = useRef(viewer);
    viewerRef.current = viewer;

    const popupContentById = useMemo(() => {
        if (tab !== 'posts') return null;
        const currentViewer = viewerRef.current;
        const map = new Map();
        (filteredPosts || []).forEach((p) => {
            if (p?.id == null) return;
            const idStr = String(p.id);
            const node = (
                <BusinessPostCard
                    key={`popup-${idStr}`}
                    post={p}
                    user={currentViewer}
                    selectable={false}
                    onSelect={(post) => handleCardSelect(post?.id)}
                    onOpenUserCard={handleOpenUserCard}
                    onLocationClick={handleLocationClick}
                />
            );
            map.set(idStr, node);
            map.set(p.id, node);
            const idNum = Number(idStr);
            if (Number.isFinite(idNum)) map.set(idNum, node);
        });
        return map;
    }, [tab, filteredPosts, handleCardSelect, handleOpenUserCard, handleLocationClick]);

    // Determine if the user card target is "self" (the viewer's own business)
    const isSelfUserCard = useMemo(() => {
        if (!userCardUser || !viewer) return false;
        const cardBizId = userCardUser.business_id;
        const cardSlug = (userCardUser.business_slug || userCardUser.handle || '').toLowerCase();
        const acctSlug = (activeAccount?.slug || activeAccount?.handle || '').toLowerCase();
        // If viewer is acting as the same business (ID match)
        if (isBusinessAccount && activeBusinessId && cardBizId && String(activeBusinessId) === String(cardBizId)) return true;
        // Slug match
        if (isBusinessAccount && cardSlug && acctSlug && cardSlug === acctSlug) return true;
        // Owner match (personal account)
        if (userCardUser.id && viewer.id && String(userCardUser.id) === String(viewer.id)) return true;
        return false;
    }, [userCardUser, viewer, isBusinessAccount, activeBusinessId, activeAccount?.slug, activeAccount?.handle]);

    return (
        <>
            <Box
                sx={{
                    position: 'fixed',
                    // Track global nav offset so the container expands to fill the
                    // viewport as the app bar + bottom nav slide away. Mirrors
                    // CommunityPage so the floating subheader (Business pill +
                    // search) fades in lockstep with the AppBar via `--ll-nav-offset`.
                    top: `calc(${chromeTop}px * (1 - var(--ll-nav-offset, 0)))`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    '@media (max-width: 899px)': {
                        bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px * (1 - var(--ll-nav-offset, 0)))`,
                    },
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    p: 0,
                    pt: 0,
                    boxSizing: 'border-box',
                    bgcolor: 'background.paper',
                    '@media (min-width: 1024px)': {
                        p: 1.25,
                        pt: 0.75,
                        bgcolor: 'background.default',
                    },
                    '@media (min-width: 1440px)': {
                        flexDirection: 'row',
                        gap: 1.25,
                        p: 1.25,
                        pt: 0.75,
                        bgcolor: 'background.default',
                    },
                    opacity: pageVisible ? 1 : 0,
                    transform: 'none',
                    transition: (t) => {
                        const fade =
                            t.custom.motion.contentFade?.transition
                            ?? `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`;
                        return fade;
                    },
                }}
            >
                {/* LEFT PANEL */}
                <Box sx={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1, height: '100%', overflow: 'hidden', p: 0,
                    transition: (theme) =>
                        theme.transitions.create(['opacity', 'flex-basis', 'width', 'transform'], {
                            duration: 300,
                            easing: theme.transitions.easing.easeInOut,
                        }),
                }}>
                    <Box
                        sx={{
                            height: '100%',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 0,
                            border: 'none',
                            borderColor: 'transparent',
                            bgcolor: (t) => t.palette.background.paper,
                            '@media (min-width: 1024px)': {
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                            },
                            '@media (min-width: 1440px)': {
                                borderRadius: 3,
                                border: '1px solid',
                                borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                            },
                            backdropFilter: 'none',
                            backgroundImage: 'none',
                            boxShadow: 'none',
                        }}
                    >
                        {/* ═══ PHONE HEADER: Search + Filter icon + Tabs + Chips (< 900px only) ═══ */}
                        {isPhoneBiz && (
                            <Box
                                ref={mobileHeaderRef}
                                sx={{
                                    flexShrink: 0,
                                    // Fixed in viewport directly below the global header.
                                    // Doesn't take layout space — the scroll container below
                                    // reserves space via padding-top. Fades via `--ll-nav-offset`
                                    // in sync with the rest of the chrome.
                                    position: 'fixed',
                                    top: 'var(--ll-nav-height, 52px)',
                                    left: 0,
                                    right: 0,
                                    zIndex: (t) => t.zIndex.appBar,
                                    opacity: 'calc(1 - var(--ll-nav-offset, 0))',
                                    pointerEvents: 'var(--ll-nav-pointer-events, auto)',
                                    transition: 'none',
                                    willChange: 'opacity',
                                    backdropFilter: 'saturate(140%) blur(10px)',
                                    WebkitBackdropFilter: 'saturate(140%) blur(10px)',
                                    backgroundColor: (t) => alpha(t.palette.background.paper, 0.85),
                                }}
                            >
                                {/* Row 1: Text pills (Discover / Businesses / Posts) + Map & Search icons */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: 1.25,
                                    pt: 0.75,
                                    pb: 0.5,
                                    overflowX: 'auto',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollbarWidth: 'none',
                                    '&::-webkit-scrollbar': { display: 'none' },
                                }}>
                                    {(() => {
                                        const mobilePillSx = (active) => (t) => ({
                                            borderRadius: 999,
                                            textTransform: 'none',
                                            fontFamily: t.typography.fontFamily,
                                            fontWeight: active ? 800 : 600,
                                            letterSpacing: '0.01em',
                                            fontSize: 11.5,
                                            lineHeight: 1,
                                            '& .MuiButton-startIcon': { display: 'none' },
                                            height: 28,
                                            minHeight: 28,
                                            px: 1.25,
                                            py: 0,
                                            flexDirection: 'row',
                                            gap: 0,
                                            color: active ? t.palette.primary.main : t.palette.text.secondary,
                                            backgroundColor: active ? alpha(t.palette.primary.main, 0.08) : 'transparent',
                                            border: '1px solid',
                                            borderColor: active ? alpha(t.palette.primary.main, 0.18) : 'transparent',
                                            boxShadow: 'none',
                                            whiteSpace: 'nowrap',
                                            flexShrink: 0,
                                            transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                            '&:hover': {
                                                backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                color: active ? t.palette.primary.main : t.palette.text.primary,
                                            },
                                        });
                                        return (
                                            <>
                                                <Button role="tab" aria-selected={mobileView === 'discover'} onClick={() => setMobileView((v) => v === 'discover' ? 'list' : 'discover')} variant="text" disableElevation sx={mobilePillSx(mobileView === 'discover')}>
                                                    Discover
                                                </Button>
                                                <Button role="tab" aria-selected={tab === 'businesses' && mobileView !== 'discover'} onClick={() => { if (mobileView === 'discover') setMobileView('list'); handleTabChange(null, 'businesses'); }} variant="text" disableElevation sx={mobilePillSx(tab === 'businesses' && mobileView !== 'discover')}>
                                                    Businesses
                                                </Button>
                                                <Button role="tab" aria-selected={tab === 'posts' && mobileView !== 'discover'} onClick={() => { if (mobileView === 'discover') setMobileView('list'); handleTabChange(null, 'posts'); }} variant="text" disableElevation sx={mobilePillSx(tab === 'posts' && mobileView !== 'discover')}>
                                                    Posts
                                                </Button>
                                            </>
                                        );
                                    })()}

                                    {/* Map + Search icons pushed right */}
                                    {mobileView !== 'discover' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto', flexShrink: 0 }}>
                                            <IconButton
                                                onClick={() => setMobileMapOpen(true)}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 32,
                                                    height: 32,
                                                    color: t.palette.text.secondary,
                                                    transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                                    '&:hover': { color: 'primary.main' },
                                                })}
                                                aria-label="Map"
                                            >
                                                <MapRoundedIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => setMobileFilterDrawerOpen(true)}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 32,
                                                    height: 32,
                                                    color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.secondary,
                                                    transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                                    '&:hover': { color: 'primary.main' },
                                                })}
                                                aria-label="Search & Filter"
                                            >
                                                <SearchRoundedIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>

                            </Box>
                        )}

                        {/* ═══ TABLET / DESKTOP HEADER: Full controls (≥ 900px) ═══ */}
                        {!isPhoneBiz && (
                            <Box
                                sx={{
                                    flexShrink: 0,
                                    px: 1.5,
                                    pt: 0.45,
                                    pb: 0.45,
                                    // Tablet (900–1439): tight row gap so wrapped rows don't inflate height.
                                    '@media (min-width: 900px) and (max-width: 1439px)': {
                                        px: 1.25,
                                        pt: 0.5,
                                        pb: 0.5,
                                        rowGap: 0.5,
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {/* Segmented control */}
                                <Box role="tablist" aria-label="Businesses view" sx={{ flex: '0 0 auto', display: 'flex' }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}>
                                        {(() => {
                                            const segmentSx = (active) => (t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontFamily: t.typography.fontFamily,
                                                fontWeight: active ? 950 : 700,
                                                letterSpacing: '-0.01em',
                                                fontSize: 13.5,
                                                lineHeight: 1,
                                                '& .MuiButton-startIcon': { marginRight: 0.9 },
                                                height: 38,
                                                px: 1.75,
                                                color: active ? t.palette.primary.main : t.palette.text.secondary,
                                                backgroundColor: active ? alpha(t.palette.primary.main, 0.08) : 'transparent',
                                                border: '1px solid',
                                                borderColor: active ? alpha(t.palette.primary.main, 0.2) : 'transparent',
                                                boxShadow: 'none',
                                                flexShrink: 0,
                                                transition: `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                                '&:hover': {
                                                    backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    color: active ? t.palette.primary.main : t.palette.text.primary,
                                                },
                                                '&:focus-visible': {
                                                    outline: 'none',
                                                    boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}`,
                                                },
                                            });
                                            // On tablet, isDiscoverView means the Discover pill is selected;
                                            // the Businesses / Posts pills should appear inactive in that state.
                                            const isDiscoverView = isTabletBiz && mobileView === 'discover';
                                            return (
                                                <>
                                                    {/* Tablet-only: Discover tab on the left, matches the phone and Community pattern.
                                                        No icon on tablet — matches Community's text-only pill style. */}
                                                    {isTabletBiz && (
                                                        <Button
                                                            role="tab"
                                                            aria-selected={isDiscoverView}
                                                            onClick={() => setMobileView((v) => v === 'discover' ? 'list' : 'discover')}
                                                            variant="text"
                                                            disableElevation
                                                            sx={segmentSx(isDiscoverView)}
                                                        >
                                                            Discover
                                                        </Button>
                                                    )}
                                                    <Button
                                                        role="tab"
                                                        aria-selected={tab === 'businesses' && !isDiscoverView}
                                                        onClick={() => { if (mobileView === 'discover') setMobileView('list'); handleTabChange(null, 'businesses'); }}
                                                        variant="text"
                                                        disableElevation
                                                        sx={segmentSx(tab === 'businesses' && !isDiscoverView)}
                                                        startIcon={isTabletBiz ? null : <StorefrontRoundedIcon sx={(t) => ({ fontSize: '22px !important', opacity: (tab === 'businesses' && !isDiscoverView) ? 1 : 0.72, color: (tab === 'businesses' && !isDiscoverView) ? t.palette.primary.main : t.palette.text.secondary })} />}
                                                    >
                                                        Businesses
                                                    </Button>
                                                    <Button
                                                        role="tab"
                                                        aria-selected={tab === 'posts' && !isDiscoverView}
                                                        onClick={() => { if (mobileView === 'discover') setMobileView('list'); handleTabChange(null, 'posts'); }}
                                                        variant="text"
                                                        disableElevation
                                                        sx={segmentSx(tab === 'posts' && !isDiscoverView)}
                                                        startIcon={isTabletBiz ? null : <DynamicFeedRoundedIcon sx={(t) => ({ fontSize: '22px !important', opacity: (tab === 'posts' && !isDiscoverView) ? 1 : 0.72, color: (tab === 'posts' && !isDiscoverView) ? t.palette.primary.main : t.palette.text.secondary })} />}
                                                    >
                                                        Posts
                                                    </Button>
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </Box>

                                {/* Search — fills remaining space.
                                    Hidden at any width when Discover is active — only sub tabs up top. */}
                                {mobileView !== 'discover' && (
                                    <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
                                        <SearchInput
                                            placeholder={tab === 'posts' ? 'Search posts...' : 'Search businesses...'}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e?.target?.value ?? '')}
                                            onSearch={handleSearch}
                                            onClear={handleClear}
                                            inputProps={{ onKeyDown: handleSearchKeyDown }}
                                        />
                                    </Box>
                                )}

                                {/* Action buttons — flat siblings for proper flex-wrap */}

                                {/* Tablet-only: Filters button (opens the filter drawer, same as phone).
                                    At desktop (≥1440) the inline BusinessFilterBar renders below, so no
                                    Filters button needed there. At narrow tablet (900–1099) this collapses
                                    to an icon with a count badge to keep the toolbar on one row.
                                    Hidden when tablet is in Discover view (matches phone pattern). */}
                                {isTabletBiz && mobileView !== 'discover' && (
                                    <Tooltip title={isNarrowTabletBiz ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                                        {isNarrowTabletBiz ? (
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
                                )}

                                {/* Tablet-only: Map button (opens the full-screen map overlay). */}
                                {isTabletBiz && mobileView !== 'discover' && (
                                    <Tooltip title={isNarrowTabletBiz ? 'Map' : ''}>
                                        {isNarrowTabletBiz ? (
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
                                )}

                                {/* Add Business / New Post — icon-only at narrow widths, full label at wide.
                                    Icon-only: narrow tablet (900–1099) + narrow desktop (1440–1499).
                                    Full label: wide tablet (1100–1439) + wide desktop (≥1500).
                                    Hidden at any width when Discover is active — only sub tabs up top. */}
                                {mobileView !== 'discover' && (
                                    <Tooltip title={tab === 'posts' && isBusinessAccount ? 'New Post' : 'List Business'}>
                                        <IconButton
                                            onClick={tab === 'posts' && isBusinessAccount ? handleOpenCreatePost : handleSubmitPage}
                                            size="small"
                                            sx={(t) => ({
                                                display: 'none',
                                                // Narrow tablet: icon-only 38px to match the taller tab pills.
                                                '@media (min-width: 900px) and (max-width: 1099px)': {
                                                    display: 'inline-flex',
                                                    width: 38, height: 38,
                                                },
                                                // Narrow desktop: original 38px icon-only.
                                                '@media (min-width: 1440px) and (max-width: 1499px)': {
                                                    display: 'inline-flex',
                                                    width: 38, height: 38,
                                                },
                                                borderRadius: 999,
                                                bgcolor: t.palette.primary.main,
                                                color: t.palette.primary.contrastText,
                                                boxShadow: 'none',
                                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                                            })}
                                            aria-label={tab === 'posts' && isBusinessAccount ? 'New Post' : 'List Business'}
                                        >
                                            {tab === 'posts' && isBusinessAccount ? <EditNoteRoundedIcon sx={{ fontSize: 20 }} /> : <AddBusinessRoundedIcon sx={{ fontSize: 20 }} />}
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {mobileView !== 'discover' && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={tab === 'posts' && isBusinessAccount ? <EditNoteRoundedIcon /> : <AddBusinessRoundedIcon />}
                                        onClick={tab === 'posts' && isBusinessAccount ? handleOpenCreatePost : handleSubmitPage}
                                        sx={(t) => ({
                                            display: 'none',
                                            // Wide tablet: full label at 38px to match the tab pill height.
                                            '@media (min-width: 1100px) and (max-width: 1439px)': {
                                                display: 'inline-flex',
                                            },
                                            // Wide desktop: original full-size button.
                                            '@media (min-width: 1500px)': { display: 'inline-flex' },
                                            borderRadius: 999, textTransform: 'none', fontWeight: 900,
                                            px: 2.5, height: 38, whiteSpace: 'nowrap',
                                            bgcolor: t.palette.primary.main,
                                            color: t.palette.primary.contrastText,
                                            boxShadow: 'none',
                                            '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                                        })}
                                    >
                                        {tab === 'posts' && isBusinessAccount ? 'New Post' : 'List Business'}
                                    </Button>
                                )}
                                {isAdmin && mobileView !== 'discover' ? (
                                    <Button variant="outlined" onClick={() => navigate('/business/admin/applications')} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, height: 38 }}>
                                        Admin
                                    </Button>
                                ) : null}

                                {/* Active filter chips — nested inside mobileHeaderRef so they
                                    slide with the subheader on scroll. Matches pattern used on
                                    Community/Marketplace/Music/Services. */}
                                {activeFilterChips.length > 0 && mobileView !== 'discover' && (
                                    <Box sx={{
                                        display: { xs: 'flex', lg: 'none' },
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 1.5,
                                        pt: 0.5,
                                        pb: 0.5,
                                        // Tablet: tighter — the Filters button already surfaces the count
                                        // so this row is secondary info for quick individual removal.
                                        '@media (min-width: 900px) and (max-width: 1439px)': {
                                            pt: 0.25,
                                            pb: 0.25,
                                            gap: 0.375,
                                        },
                                        flexWrap: 'wrap',
                                    }}>
                                        {activeFilterChips.map((chip) => (
                                            <Chip
                                                key={chip.key}
                                                label={chip.label}
                                                size="small"
                                                onDelete={chip.onRemove}
                                                sx={(t) => ({
                                                    height: 26,
                                                    maxWidth: 160,
                                                    borderRadius: 999,
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                    color: t.palette.primary.main,
                                                    border: '1px solid',
                                                    borderColor: alpha(t.palette.primary.main, 0.2),
                                                    '& .MuiChip-label': {
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    },
                                                    '& .MuiChip-deleteIcon': {
                                                        color: alpha(t.palette.primary.main, 0.5),
                                                        fontSize: 16,
                                                        '&:hover': { color: t.palette.primary.main },
                                                    },
                                                })}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* Content (filters + list + footer): fades when switching tabs */}
                        <Fade in={contentVisible} timeout={tabFadeMs} appear={false}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                                {/* ── Mobile: inline Discover view ── */}
                                {isMobile && mobileView === 'discover' && (
                                    <>
                                        <Box data-discover-scroll sx={{
                                            flex: 1,
                                            minHeight: 0,
                                            overflow: 'auto',
                                            WebkitOverflowScrolling: 'touch',
                                            overscrollBehavior: 'contain',
                                            position: 'relative',
                                            zIndex: 1,
                                            bgcolor: 'background.paper',
                                            // Reserve space at the top for the floating AppBar +
                                            // section header so the cover image isn't hidden
                                            // behind them on initial paint.
                                            '@media (max-width: 1439px)': {
                                                paddingTop: 'var(--ll-subheader-height, 52px)',
                                            },
                                            '@media (max-width: 899px)': {
                                                paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                            },
                                        }}>
                                            <BusinessDiscoverTab />
                                        </Box>
                                    </>
                                )}

                                {/* Normal content — hidden when mobile discover view is active */}
                                {(!isMobile || mobileView !== 'discover') && (
                                    <>

                                        {/* Filters — desktop only (mobile uses full-screen filter drawer).
                                            Always visible on desktop to match EventsPage pattern. */}
                                        {!isMobile ? (
                                            <Box sx={{
                                                px: 1, pt: 1,
                                                '@media (min-width: 1440px)': { px: 1.5, pt: 1.5 },
                                                pb: 0.75,
                                            }}>
                                                <BusinessFilterBar
                                                    value={postFilters}
                                                    searchQuery={appliedSearch}
                                                    onChange={(next) => {
                                                        setPostFilters(next);
                                                        setSelectedId(null);
                                                        // Scroll list back to top when any filter changes
                                                        requestAnimationFrame(() => {
                                                            const el = document.querySelector('[data-business-scroll]');
                                                            if (el) el.scrollTop = 0;
                                                        });
                                                    }}
                                                    disabled={loading}
                                                    showPostTypeFilter={tab === 'posts'}
                                                    sortValue={tab === 'posts' ? postFilters.postSort : postFilters.businessSort}
                                                    sortOptions={tab === 'posts' ? POST_SORT_OPTIONS : BUSINESS_SORT_OPTIONS}
                                                    sortLabel="Sort By"
                                                    categoryCountsOverride={tab === 'posts' ? postCategoryCounts : businessCategoryCounts}
                                                    totalCountOverride={tab === 'posts' ? postCategoryTotal : businessCategoryTotal}
                                                    countsLoadingOverride={tab === 'posts' ? postCategoryCountsLoading : businessCategoryCountsLoading}
                                                    dateRangeValue={postFilters.dateRange || 'all'}
                                                    locationCounts={tab === 'posts' ? postLocationCounts : businessLocationCounts}
                                                    viewer={viewer}
                                                    onSearchQueryChange={handleSavedSearchQueryChange}
                                                />
                                            </Box>
                                        ) : null}

                                        <Divider sx={{ borderColor: (t) => alpha(t.palette.primary.main, 0.10) }} />

                                        {/* Content + footer pinned */}
                                        <Box
                                            sx={{
                                                flex: 1,
                                                minHeight: 0,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <Box
                                                data-business-scroll
                                                onTouchStart={isMobile ? handlePullTouchStart : undefined}
                                                onTouchMove={isMobile ? handlePullTouchMove : undefined}
                                                onTouchEnd={isMobile ? handlePullTouchEnd : undefined}
                                                sx={{
                                                    flex: 1,
                                                    minHeight: 0,
                                                    overflowY: 'auto',
                                                    scrollbarGutter: 'stable',
                                                    px: 0, pt: 0.5,
                                                    '@media (min-width: 1440px)': { px: 1.25, pt: 1.5 },
                                                    pb: 1,
                                                    // Mobile/tablet: reserve space under the floating
                                                    // global header + subheader so the first piece of
                                                    // content starts below the chrome on initial paint.
                                                    // As the user scrolls, content flows UP past this
                                                    // band and the chrome fades; content is always
                                                    // there, just revealed as opacity drops.
                                                    '@media (max-width: 1439px)': {
                                                        paddingTop: 'var(--ll-subheader-height, 52px)',
                                                    },
                                                    '@media (max-width: 899px)': {
                                                        paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                                    },
                                                    WebkitOverflowScrolling: 'touch',
                                                    overscrollBehavior: 'contain',
                                                }}
                                            >
                                                {/* Pull-to-refresh indicator (mobile only) */}
                                                {isMobile && (pullDistance > 0 || pullRefreshing) && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: pullRefreshing ? 56 : Math.max(pullDistance, 0), overflow: 'hidden', transition: pullRefreshing ? 'height 0.2s ease' : 'none' }}>
                                                        <CircularProgress size={24} thickness={4} sx={{ opacity: pullRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }} />
                                                    </Box>
                                                )}
                                                {error ? (
                                                    <Box
                                                        sx={{
                                                            minHeight: '50vh',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            px: 2,
                                                            pb: 7,
                                                        }}
                                                    >
                                                        <NetworkErrorState onRetry={() => window.location.reload()} />
                                                    </Box>
                                                ) : null}

                                                {loading ? (
                                                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                                                        <PulsingDots />
                                                    </Box>
                                                ) : null}

                                                {!loading && !error && !deferEmpty && leftItems.length === 0 ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            textAlign: 'center',
                                                            flex: 1,
                                                            minHeight: 0,
                                                            height: '100%',
                                                            px: 2,
                                                        }}
                                                    >
                                                        <Stack spacing={1.5} alignItems="center">
                                                            <Box sx={(t) => ({
                                                                width: 64, height: 64, borderRadius: '50%',
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                                            })}>
                                                                {tab === 'posts' ? (
                                                                    <DynamicFeedRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                                                ) : (
                                                                    <StorefrontRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                                                )}
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                                                                {(() => {
                                                                    const locCity = postFilters.city ? toTitleCase(postFilters.city) : '';
                                                                    const locCounty = postFilters.county ? `${toTitleCase(postFilters.county)} County` : '';
                                                                    const locLabel = locCity && locCounty ? `${locCity}, ${locCounty}`
                                                                        : locCity || locCounty || '';

                                                                    if (tab === 'posts') {
                                                                        const noun = postFilters.entityType === 'organization' ? 'Organization'
                                                                            : postFilters.entityType === 'nonprofit' ? 'Nonprofit'
                                                                                : 'Business';
                                                                        return locLabel
                                                                            ? `No ${noun} Posts in ${locLabel}`
                                                                            : `No ${noun} Posts Yet`;
                                                                    }
                                                                    const noun = postFilters.entityType === 'organization' ? 'Organizations'
                                                                        : postFilters.entityType === 'nonprofit' ? 'Nonprofits'
                                                                            : 'Businesses';
                                                                    return locLabel
                                                                        ? `No ${noun} Found in ${locLabel}`
                                                                        : `No ${noun} Found`;
                                                                })()}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, lineHeight: 1.6 }}>
                                                                {(() => {
                                                                    const hasLocation = Boolean(postFilters.city || postFilters.county);
                                                                    if (hasLocation) return 'Try browsing all counties or adjusting your other filters.';
                                                                    const noun = postFilters.entityType === 'organization' ? 'organization'
                                                                        : postFilters.entityType === 'nonprofit' ? 'nonprofit'
                                                                            : 'business';
                                                                    if (tab === 'posts') {
                                                                        return `Do you own a local ${noun}? List your ${noun} on The Local Lantern and start sharing updates with your community!`;
                                                                    }
                                                                    return `Do you own a local ${noun}? List your ${noun} on The Local Lantern and start connecting with your community!`;
                                                                })()}
                                                            </Typography>
                                                            {!postFilters.city && !postFilters.county && (
                                                                <Button
                                                                    variant="contained"
                                                                    startIcon={<AddBusinessRoundedIcon />}
                                                                    onClick={handleSubmitPage}
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
                                                                    {draftLimitChecking ? 'Checking…' : 'List Business'}
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                ) : null}

                                                {!loading ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            width: '100%',
                                                            overflowX: 'hidden',
                                                            pb: 7,
                                                        }}
                                                    >
                                                        {tab === 'posts'
                                                            ? filteredPosts.map((p, idx) => (
                                                                <Box key={p.id} sx={(t) => ({
                                                                    flex: '0 0 100%',
                                                                    mx: 0, my: 0,
                                                                    minWidth: 0,
                                                                    maxWidth: '100%',
                                                                    borderBottom: `1px solid ${alpha(t.palette.divider, 0.1)}`,
                                                                    '&:last-child': { borderBottom: 'none' },
                                                                    // Tablet/laptop + desktop (≥900): two-column grid. In this mode the
                                                                    // grid spacing separates cards so the between-row divider becomes
                                                                    // redundant. Phone (<900) stays single-column with dividers.
                                                                    // display:flex makes the card fill the wrapper's row-stretched height
                                                                    // so cards in the same row are the same height regardless of content.
                                                                    '@media (min-width: 900px)': {
                                                                        flex: '0 0 calc(50% - 16px)',
                                                                        mx: 1,
                                                                        my: 1,
                                                                        borderBottom: 'none',
                                                                        '&:last-child': { borderBottom: 'none' },
                                                                        display: 'flex',
                                                                        '& > *': { flex: 1, width: '100%' },
                                                                    },
                                                                    ...getListStaggerSx(idx),
                                                                })}>
                                                                    <BusinessPostCard
                                                                        post={p}
                                                                        user={viewer}
                                                                        hoveredId={hoveredId}
                                                                        setHoveredId={setHoveredId}
                                                                        selectedId={selectedId}
                                                                        selectable
                                                                        onSelect={(post) => handleCardSelect(post?.id)}
                                                                        onOpenUserCard={handleOpenUserCard}
                                                                        onLocationClick={handleLocationClick}
                                                                        onShare={handleShare}
                                                                        flat={isPhoneBiz}
                                                                    />
                                                                </Box>
                                                            ))
                                                            : filteredBusinesses.map((b, idx) => {
                                                                const isSelected = selectedId != null && String(selectedId) === String(b?.id);
                                                                const isHovered = hoveredId != null && String(hoveredId) === String(b?.id);
                                                                return (
                                                                    <Box key={b.id} sx={(t) => ({
                                                                        flex: '0 0 100%',
                                                                        mx: 0, my: 0,
                                                                        minWidth: 0,
                                                                        maxWidth: '100%',
                                                                        borderBottom: `1px solid ${alpha(t.palette.divider, 0.1)}`,
                                                                        '&:last-child': { borderBottom: 'none' },
                                                                        // Tablet/laptop + desktop (≥900): two-column grid.
                                                                        // display:flex makes the card fill the wrapper's row-stretched height
                                                                        // so cards in the same row are the same height regardless of content.
                                                                        '@media (min-width: 900px)': {
                                                                            flex: '0 0 calc(50% - 16px)',
                                                                            mx: 1,
                                                                            my: 1,
                                                                            borderBottom: 'none',
                                                                            '&:last-child': { borderBottom: 'none' },
                                                                            display: 'flex',
                                                                            '& > *': { flex: 1, width: '100%' },
                                                                        },
                                                                        ...getListStaggerSx(idx),
                                                                    })}>
                                                                        <BusinessDirectoryCard
                                                                            business={b}
                                                                            selected={isSelected}
                                                                            hovered={isHovered}
                                                                            onSelect={() => handleCardSelect(b.id)}
                                                                            onHover={(id) => setHoveredId(id)}
                                                                            onLocationClick={handleLocationClick}
                                                                            onOpenUserCard={handleOpenUserCard}
                                                                            onFollow={handleFollowBusiness}
                                                                            isFollowing={followingBizIds.has(b.id)}
                                                                            flat={isPhoneBiz}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                    </Box>
                                                ) : null}

                                                {(tab === 'posts' ? loadingMorePosts : loadingMoreBusinesses) ? (
                                                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 2 }}>
                                                        <PulsingDots sx={{ py: 2 }} />
                                                    </Box>
                                                ) : null}

                                                <Box sx={{ height: 72 }} />
                                            </Box>

                                            {/* Footer count bar (pinned to bottom of the left panel) — desktop only */}
                                            <Box
                                                sx={(t) => ({
                                                    flexShrink: 0,
                                                    px: 1.25,
                                                    py: 0.9,
                                                    borderTop: '1px solid',
                                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                                    bgcolor: t.palette.background.paper,
                                                    backdropFilter: 'none',
                                                    display: 'none', '@media (min-width: 1440px)': { display: 'flex' },
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                })}
                                            >
                                                <Typography variant="body2" sx={{ fontWeight: 850, color: 'text.secondary' }}>
                                                    {footerText}
                                                </Typography>
                                            </Box>
                                        </Box>

                                    </>
                                )}

                            </Box>
                        </Fade>
                    </Box>
                </Box>

                {/* RIGHT PANEL */}
                <Box
                    sx={{
                        width: RIGHT_WIDTH,
                        flex: '0 0 auto',
                        height: '100%',
                        display: 'none', '@media (min-width: 1440px)': { display: 'flex' },
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={(t) => ({
                            position: 'relative',
                            flex: 1,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            bgcolor: t.palette.background.paper,
                            backdropFilter: 'none',
                            backgroundImage: 'none',
                            boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.08)}`,
                            overflow: 'hidden',
                        })}
                    >
                        {/* Tab header */}
                        <Box
                            sx={(t) => ({
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 50,
                                '@media (min-width: 1440px)': { height: 56 },
                                display: 'flex',
                                alignItems: 'center',
                                px: 1,
                                bgcolor: t.palette.background.paper,
                                backgroundImage: 'none',
                                backdropFilter: 'none',
                                borderBottom: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.12),
                                zIndex: 10,
                            })}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'nowrap', width: '100%' }}>
                                {[
                                    { label: 'Discover', value: 'discover', Icon: ExploreRoundedIcon },
                                    { label: tab === 'posts' ? 'Post Detail' : 'Business Detail', value: 'details', Icon: tab === 'posts' ? ArticleRoundedIcon : StorefrontRoundedIcon },
                                    { label: 'Map', value: 'map', Icon: MapRoundedIcon },
                                ].map((tItem) => {
                                    const isActive = rightTab === tItem.value;
                                    return (
                                        <Button
                                            key={tItem.value}
                                            type="button"
                                            disableElevation
                                            disableRipple
                                            variant="text"
                                            onClick={() => {
                                                setRightTab(tItem.value);
                                                // When switching to map with a selected card, focus its pin
                                                if (tItem.value === 'map' && selectedId != null) {
                                                    setFocusMapItemId(selectedId);
                                                }
                                            }}
                                            startIcon={<tItem.Icon sx={{ fontSize: 17 }} />}
                                            sx={(theme) => ({
                                                flex: 1,
                                                minHeight: 'unset',
                                                px: 0.75, py: 0.85,
                                                '@media (min-width: 1440px)': { px: 1.25, py: 1.1 },
                                                borderRadius: 0,
                                                textTransform: 'none',
                                                fontWeight: isActive ? 950 : 700,
                                                fontSize: 13.5,
                                                letterSpacing: '-0.01em',
                                                justifyContent: 'center',
                                                '& .MuiButton-startIcon': { mr: 0.5 },
                                                color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                                                backgroundColor: 'transparent',
                                                borderBottom: '2px solid',
                                                borderColor: isActive ? theme.palette.primary.main : 'transparent',
                                                transition: (t) => `color ${t.custom.motion.base}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                    color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                                                    borderColor: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2),
                                                },
                                            })}
                                        >
                                            {tItem.label}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>

                        {/* Tab content */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 50,
                                '@media (min-width: 1440px)': { top: 56 },
                                left: 0,
                                right: 0,
                                bottom: 0,
                                overflowY: 'auto',
                            }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {rightTab === 'discover' ? (
                                    <Box
                                        key="tab-discover"
                                        component={motion.div}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        sx={{ height: '100%', position: 'relative' }}
                                    >
                                        <BusinessDiscoverTab />
                                    </Box>
                                ) : null}
                                {rightTab === 'map' ? (
                                    <Box
                                        key="tab-map"
                                        component={motion.div}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        sx={{ height: '100%' }}
                                    >
                                        <BusinessesMapTab
                                            items={mapItems}
                                            onSelectItem={handleMapSelectItem}
                                            focusItemId={focusMapItemId}
                                            onFocusItemHandled={() => setFocusMapItemId(null)}
                                            hoveredCardId={hoveredId}
                                            popupContentById={popupContentById}
                                            mode={tab}
                                            center={mapCenter}
                                            zoomLevel={mapZoom}
                                        />
                                    </Box>
                                ) : null}
                                {rightTab === 'details' ? (
                                    <Box
                                        key="tab-details"
                                        component={motion.div}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        sx={{ height: '100%' }}
                                    >
                                        {tab === 'posts' ? (
                                            <BusinessPostDetailPanel
                                                embedded
                                                post={selectedPost}
                                                emptyLabel="Select a business post"
                                                onViewPage={(slug, postId) => {
                                                    if (!slug) return;
                                                    if (postId) {
                                                        navigate(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}`, { state: { from: 'businessHub' } });
                                                    } else {
                                                        navigate(`/${encodeURIComponent(slug)}`, { state: { from: 'businesses' } });
                                                    }
                                                }}
                                                user={viewer}
                                                onShare={handleShare}
                                                onCommentSuccess={showSuccess}
                                            />
                                        ) : (
                                            <BusinessDetailPanel
                                                business={selectedBusiness}
                                                emptyLabel="Select a business"
                                                user={viewer}
                                                isOwnBusiness={selectedBusiness?.id && myBusinessIds.includes(selectedBusiness.id)}
                                                isFollowing={selectedBusiness?.id ? followingBizIds.has(Number(selectedBusiness.id)) : false}
                                                onFollow={handleFollowBusiness}
                                                onDeselect={() => { setSelectedId(null); loadBusinesses(); }}
                                                onViewPage={(slug) => {
                                                    if (!slug) return;
                                                    navigate(`/${encodeURIComponent(slug)}`, { state: { from: 'businesses' } });
                                                }}
                                                onLocationClick={handleLocationClick}
                                                onReviewChange={(bizId, count, avg) => {
                                                    setBusinesses((prev) =>
                                                        prev.map((b) =>
                                                            String(b.id) === String(bizId)
                                                                ? { ...b, review_count: count, avg_rating: avg }
                                                                : b
                                                        )
                                                    );
                                                }}
                                            />
                                        )}
                                    </Box>
                                ) : null}
                            </AnimatePresence>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <UserCardPopover
                anchorEl={userCardAnchor}
                onClose={() => { setUserCardAnchor(null); setUserCardUser(null); }}
                user={userCardUser}
                isSelf={isSelfUserCard}
                viewProfileOnly={isSelfUserCard}
                onViewProfile={(u) => {
                    const slug = u?.business_slug || u?.handle;
                    if (slug) navigate(`/${slug}`, { state: { from: 'businesses' } });
                }}
            />

            {/* Mobile FAB removed — create action now lives in the global Header (+) menu */}

            {/* ═══ Mobile full-screen detail drawer (slides in from right, covers everything) ═══ */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileDetailOpen}
                    onClose={() => setMobileDetailOpen(false)}
                    transitionDuration={{ enter: 300, exit: 240 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            borderRadius: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        },
                    }}
                    ModalProps={{ keepMounted: false }}
                    sx={{ zIndex: (t) => t.zIndex.drawer + 5 }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                >
                    {/* Back bar */}
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
                            {mobileDrawerMode === 'post' ? 'Post Detail' : 'Business Detail'}
                        </Typography>
                    </Box>

                    {/* Detail content */}
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                        {mobileDrawerMode === 'post' ? (
                            <BusinessPostDetailPanel
                                embedded
                                post={selectedPost}
                                emptyLabel="Select a business post"
                                onViewPage={(slug, postId) => {
                                    if (!slug) return;
                                    setMobileDetailOpen(false);
                                    if (postId) {
                                        navigate(`/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}`, { state: { from: 'businessHub' } });
                                    } else {
                                        navigate(`/${encodeURIComponent(slug)}`, { state: { from: 'businesses' } });
                                    }
                                }}
                                user={viewer}
                                onShare={handleShare}
                                onCommentSuccess={showSuccess}
                            />
                        ) : (
                            <BusinessDetailPanel
                                business={selectedBusiness}
                                emptyLabel="Select a business"
                                user={viewer}
                                isOwnBusiness={selectedBusiness?.id && myBusinessIds.includes(selectedBusiness.id)}
                                isFollowing={selectedBusiness?.id ? followingBizIds.has(Number(selectedBusiness.id)) : false}
                                onFollow={handleFollowBusiness}
                                onDeselect={() => { setMobileDetailOpen(false); setSelectedId(null); loadBusinesses(); }}
                                onViewPage={(slug) => {
                                    if (!slug) return;
                                    setMobileDetailOpen(false);
                                    navigate(`/${encodeURIComponent(slug)}`, { state: { from: 'businesses' } });
                                }}
                                onLocationClick={(biz) => {
                                    setMobileDetailOpen(false);
                                    handleLocationClick(biz);
                                }}
                                onReviewChange={(bizId, count, avg) => {
                                    setBusinesses((prev) =>
                                        prev.map((b) =>
                                            String(b.id) === String(bizId)
                                                ? { ...b, review_count: count, avg_rating: avg }
                                                : b
                                        )
                                    );
                                }}
                            />
                        )}
                    </Box>
                </SwipeableRightDrawer>
            )}

            {/* ═══ Mobile full-screen business page overlay (slides in from right, covers everything) ═══ */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileBusinessPageOpen}
                    onClose={() => { setMobileBusinessPageOpen(false); setMobileBusinessSlug(null); if (mobileBusinessFromMap && selectedId) setFocusMapItemId(selectedId); setMobileBusinessFromMap(false); }}
                    transitionDuration={{ enter: 300, exit: 240 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            borderRadius: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            // Position fixed at top:0 so it covers the app bar and bottom nav.
                            // BUT — top:0 also means we're above the body's
                            // env(safe-area-inset-top) padding, so we have to add it back
                            // here, otherwise the back bar sits under the iOS notch / time.
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pt: 'env(safe-area-inset-top, 0px)',
                        },
                    }}
                    ModalProps={{ keepMounted: false }}
                    sx={{ zIndex: (t) => t.zIndex.modal + 10 }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                >
                    {/* Back bar — slim, fixed at top */}
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
                            onClick={() => { setMobileBusinessPageOpen(false); setMobileBusinessSlug(null); if (mobileBusinessFromMap && selectedId) setFocusMapItemId(selectedId); setMobileBusinessFromMap(false); }}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36 }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                            {mobileBusinessFromMap ? 'Back to Map' : 'Back to Businesses'}
                        </Typography>
                    </Box>

                    {/* Full BusinessPublicPage rendered inline */}
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                        {mobileBusinessSlug && (
                            <BusinessPublicPage
                                user={viewer}
                                embedded
                                embeddedSlug={mobileBusinessSlug}
                                onBack={() => { setMobileBusinessPageOpen(false); setMobileBusinessSlug(null); if (mobileBusinessFromMap && selectedId) setFocusMapItemId(selectedId); setMobileBusinessFromMap(false); }}
                            />
                        )}
                    </Box>
                </SwipeableRightDrawer>
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
                            placeholder={tab === 'posts' ? 'Search posts…' : 'Search businesses…'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e?.target?.value ?? '')}
                            onSearch={() => { handleSearch(); setMobileFilterDrawerOpen(false); }}
                            onClear={handleClear}
                            inputProps={{ onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); setMobileFilterDrawerOpen(false); } }, autoFocus: true }}
                        />
                    </Box>

                    {/* Filter controls — scrollable */}
                    <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                        <BusinessFilterBar
                            value={postFilters}
                            searchQuery={appliedSearch}
                            onChange={(next) => {
                                setPostFilters(next);
                                setSelectedId(null);
                            }}
                            disabled={loading}
                            showPostTypeFilter={tab === 'posts'}
                            sortValue={tab === 'posts' ? postFilters.postSort : postFilters.businessSort}
                            sortOptions={tab === 'posts' ? POST_SORT_OPTIONS : BUSINESS_SORT_OPTIONS}
                            sortLabel="Sort By"
                            categoryCountsOverride={tab === 'posts' ? postCategoryCounts : businessCategoryCounts}
                            totalCountOverride={tab === 'posts' ? postCategoryTotal : businessCategoryTotal}
                            countsLoadingOverride={tab === 'posts' ? postCategoryCountsLoading : businessCategoryCountsLoading}
                            dateRangeValue={postFilters.dateRange || 'all'}
                            locationCounts={tab === 'posts' ? postLocationCounts : businessLocationCounts}
                            viewer={viewer}
                            onSearchQueryChange={handleSavedSearchQueryChange}
                        />
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
                                handleClearFilters();
                            }}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                handleSearch();
                                setMobileFilterDrawerOpen(false);
                                requestAnimationFrame(() => {
                                    const el = document.querySelector('[data-business-scroll]');
                                    if (el) el.scrollTop = 0;
                                });
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

            {/* ── Mobile map — truly fullscreen with back bar (matches Community) ── */}
            {isMobile && (
                <SwipeableBottomDrawer
                    open={mobileMapOpen}
                    onClose={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }}
                    transitionDuration={{ enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            borderRadius: 0,
                            overflow: 'hidden',
                            bottom: 0,
                            zIndex: (t) => t.zIndex.drawer + 2,
                        },
                    }}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    slotProps={{ backdrop: { sx: { bottom: 0 } } }}
                >
                    {/* Back bar — slim, fixed at top, with search/filter icon */}
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 0.5,
                            py: 0.25,
                            minHeight: 46,
                            borderBottom: activeFilterChips.length > 0 ? 'none' : '1px solid',
                            borderColor: alpha(t.palette.divider, 0.1),
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <IconButton
                            onClick={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36 }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                            Business Map
                        </Typography>
                        {/* Search / filter icon — opens filter panel */}
                        <IconButton
                            onClick={() => setMobileMapFilterOpen(true)}
                            size="small"
                            aria-label="Search & Filter"
                            sx={(t) => ({
                                width: 36,
                                height: 36,
                                borderRadius: 999,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: alpha(t.palette.primary.main, 0.16),
                                },
                            })}
                        >
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {/* ── Active filter chips (removable, showing what's selected) ── */}
                    {activeFilterChips.length > 0 && (
                        <Box
                            sx={(t) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                                flexShrink: 0,
                                bgcolor: t.palette.background.paper,
                                borderBottom: '1px solid',
                                borderColor: alpha(t.palette.divider, 0.1),
                                '&::-webkit-scrollbar': { display: 'none' },
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            })}
                        >
                            {activeFilterChips.map((chip) => (
                                <Chip
                                    key={chip.key}
                                    label={chip.label}
                                    size="small"
                                    onDelete={chip.onRemove}
                                    sx={(t) => ({
                                        height: 26,
                                        maxWidth: 160,
                                        borderRadius: 999,
                                        fontWeight: 700,
                                        fontSize: 11,
                                        flexShrink: 0,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.primary.main, 0.2),
                                        '& .MuiChip-label': {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                        '& .MuiChip-deleteIcon': {
                                            color: alpha(t.palette.primary.main, 0.5),
                                            fontSize: 16,
                                            '&:hover': { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Box>
                    )}

                    {/* ── Map content ── */}
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <BusinessesMapTab
                            items={mapItems}
                            onSelectItem={(item) => {
                                handleMapSelectItem(item);
                            }}
                            focusItemId={focusMapItemId}
                            onFocusItemHandled={() => setFocusMapItemId(null)}
                            hoveredCardId={hoveredId}
                            popupContentById={popupContentById}
                            mode={tab}
                            center={mapCenter}
                            zoomLevel={mapZoom}
                        />
                    </Box>

                    {/* ── Mobile map filter drawer — slides up from bottom ── */}
                    <Drawer
                        anchor="bottom"
                        open={mobileMapFilterOpen}
                        onClose={() => setMobileMapFilterOpen(false)}
                        transitionDuration={{ enter: 280, exit: 220 }}
                        ModalProps={{ keepMounted: false }}
                        PaperProps={{
                            sx: (t) => ({
                                maxHeight: '85dvh',
                                '@supports not (max-height: 1dvh)': {
                                    maxHeight: '85vh',
                                },
                                borderTopLeftRadius: 20,
                                borderTopRightRadius: 20,
                                bgcolor: t.palette.background.paper,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }),
                        }}
                    >
                        {/* Filter drawer header */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2,
                                py: 1.5,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                flexShrink: 0,
                            }}
                        >
                            <TuneIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>
                                Search & Filter
                            </Typography>
                            <IconButton
                                onClick={() => setMobileMapFilterOpen(false)}
                                size="small"
                                aria-label="Close filters"
                                sx={{ width: 34, height: 34, borderRadius: 999 }}
                            >
                                <CloseRoundedIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Box>

                        {/* Search input */}
                        <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                            <SearchInput
                                placeholder={tab === 'posts' ? 'Search posts…' : 'Search businesses…'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e?.target?.value ?? '')}
                                onSearch={() => { handleSearch(); setMobileMapFilterOpen(false); }}
                                onClear={handleClear}
                                inputProps={{
                                    onKeyDown: (e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearch();
                                            setMobileMapFilterOpen(false);
                                        }
                                    },
                                    autoFocus: true,
                                }}
                            />
                        </Box>

                        {/* Filter controls — scrollable */}
                        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                            <BusinessFilterBar
                                value={postFilters}
                                searchQuery={appliedSearch}
                                onChange={(next) => {
                                    setPostFilters(next);
                                    setSelectedId(null);
                                }}
                                disabled={loading}
                                showPostTypeFilter={tab === 'posts'}
                                sortValue={tab === 'posts' ? postFilters.postSort : postFilters.businessSort}
                                sortOptions={tab === 'posts' ? POST_SORT_OPTIONS : BUSINESS_SORT_OPTIONS}
                                sortLabel="Sort By"
                                categoryCountsOverride={tab === 'posts' ? postCategoryCounts : businessCategoryCounts}
                                totalCountOverride={tab === 'posts' ? postCategoryTotal : businessCategoryTotal}
                                countsLoadingOverride={tab === 'posts' ? postCategoryCountsLoading : businessCategoryCountsLoading}
                                dateRangeValue={postFilters.dateRange || 'all'}
                                locationCounts={tab === 'posts' ? postLocationCounts : businessLocationCounts}
                                viewer={viewer}
                                onSearchQueryChange={handleSavedSearchQueryChange}
                            />
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
                                onClick={handleClearFilters}
                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    handleSearch();
                                    setMobileMapFilterOpen(false);
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
                    </Drawer>
                </SwipeableBottomDrawer>
            )}

            {/* Create Business Post Dialog */}
            {isBusinessAccount && activeBusinessId && (
                <CreateBusinessPostDialog
                    open={createPostOpen}
                    onClose={handleCloseCreatePost}
                    businessId={activeBusinessId}
                    businessName={activeAccount?.name || activeAccount?.businessName || 'your business'}
                    businessCity={activeAccount?.city || ''}
                    businessCounty={activeAccount?.county || ''}
                    onPostCreated={handlePostCreated}
                />
            )}

            {/* Account switch dialog — shown when non-personal account taps Submit a Page */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
                    <InfoOutlinedIcon color="primary" />
                    Personal account required
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ lineHeight: 1.5 }}>
                        Business pages can only be created from a personal account. Please switch to your personal profile to submit a business page.
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
        </>
    );
}