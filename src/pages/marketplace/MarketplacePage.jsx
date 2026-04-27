// src/pages/marketplace/MarketplacePage.jsx
// Full-page container — restyled to match professional design language.
// All business logic preserved: feed, filters, tabs, CRUD, flag, saved items,
// infinite scroll, right panel, overlays, auth resolution.
//
// FIX: Added accountCacheKey to filters so account changes trigger re-fetch.
//      Ensured view is properly included and propagated through the full chain.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, Stack, Typography, useMediaQuery } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IconButton from "@mui/material/IconButton";
import TuneIcon from "@mui/icons-material/Tune";
import Tooltip from "@mui/material/Tooltip";
import { useNavigationType, useLocation } from "react-router-dom";

import { secureFetch } from "../../utils/secureFetch";
import { useAuth } from "../../components/AuthModalContext";
import { useActiveAccount } from "../../components/AccountContext";
import { ReportDialog } from "../../components/ActionBar";
import MarketplaceFilters from "./components/MarketplaceFilters";
import MarketplaceRightPanel from "./components/MarketplaceRightPanel";
import { BrowsePanel } from "./components/MarketplaceRightPanel";
import MarketplaceOverlays from "./components/MarketplaceOverlays";
import ListingCard from "./components/ListingCard";
import useMarketplaceFeed from "./hooks/useMarketplaceFeed";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import useRateLimit from "../../utils/useRateLimit";
// Continuous subheader scroll-hide (Facebook-style tracking)
import useSubheaderScrollHide from "../../utils/useSubheaderScrollHide";
import RateLimitDialog from "../../components/RateLimitDialog";
import PulsingDots from "../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../components/NetworkErrorState";
import SearchInput from "../../components/SearchInput";
import { ensureListStaggerKeyframes, getListStaggerSx } from "../../themes/theme";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../components/Header/Header";
import SwipeableRightDrawer from "../../components/SwipeableRightDrawer";
import SwipeableBottomDrawer from "../../components/SwipeableBottomDrawer";
import {
    toggleFavorite,
    toggleRepost,
    deleteListing,
    markListingSold,
    relistListing,
    flagListing,
} from "./api/marketplace";
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    getCountyCenter,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from "../../utils/geoRadius";

const RIGHT_WIDTH = { xs: "40%", lg: "35%" };

/* ── Session-storage helpers for back-nav restore ─── */
const MKT_STATE_KEY = "ll-marketplace-hub-state";

function saveMktState(state) {
    try { sessionStorage.setItem(MKT_STATE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function loadMktState() {
    try {
        const raw = sessionStorage.getItem(MKT_STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function clearMktState() {
    try { sessionStorage.removeItem(MKT_STATE_KEY); } catch { /* ignore */ }
}

// ─── Empty-state message builder (outside component to avoid re-creation) ──
function getEmptyStateMessages({ view, query, category, condition, status, priceModel, city, county }) {
    // 1) View-specific messages (mine / saved / following) take priority
    if (view === "mine") {
        return {
            headline: "You haven\u2019t listed anything yet",
            subtitle: "Sell an item to see it appear here.",
        };
    }
    if (view === "saved") {
        return {
            headline: "No saved listings yet",
            subtitle: "Tap the bookmark icon on any listing to save it here for quick access.",
        };
    }
    if (view === "following") {
        // Even within "following", location/category context can refine the message
        const locationParts = [city, county].filter(Boolean);
        if (locationParts.length > 0) {
            return {
                headline: `No listings from people you follow in ${locationParts.join(", ")}`,
                subtitle: "Try removing the location filter or follow more people in this area.",
            };
        }
        if (category) {
            return {
                headline: `No ${category} listings from people you follow`,
                subtitle: "Try a different category or follow more sellers.",
            };
        }
        return {
            headline: "No listings from people you follow",
            subtitle: "Follow people to see their marketplace listings here.",
        };
    }

    // 2) "all" view — build context-aware messages from active filters
    const hasQuery = Boolean(query && query.trim());
    const hasCategory = Boolean(category);
    const hasCity = Boolean(city);
    const hasCounty = Boolean(county);
    const hasCondition = condition && condition !== "All";
    const hasStatus = status && status !== "available" && status !== "all";
    const hasPriceModel = Boolean(priceModel);

    const activeFilterCount = [hasQuery, hasCategory, hasCity, hasCounty, hasCondition, hasStatus, hasPriceModel].filter(Boolean).length;

    // Search query active
    if (hasQuery && activeFilterCount === 1) {
        return {
            headline: `No results for \u201c${query.trim()}\u201d`,
            subtitle: "Try different keywords or check your spelling.",
        };
    }

    // Location-only filters
    if (hasCity && !hasCounty && activeFilterCount === 1) {
        return {
            headline: `No listings found in ${city}`,
            subtitle: "Try expanding your search to the full county or browse all of Alabama.",
        };
    }
    if (hasCounty && !hasCity && activeFilterCount === 1) {
        return {
            headline: `No listings found in ${county} County`,
            subtitle: "Try browsing all counties or adjusting your other filters.",
        };
    }
    if (hasCity && hasCounty && activeFilterCount === 2) {
        return {
            headline: `No listings found in ${city}, ${county} County`,
            subtitle: "Try removing the city filter to see all listings in the county.",
        };
    }

    // Category-only filter
    if (hasCategory && activeFilterCount === 1) {
        return {
            headline: `No ${category} listings available`,
            subtitle: "Check back soon or try a different category.",
        };
    }

    // Category + location combo
    if (hasCategory && (hasCity || hasCounty)) {
        const locationLabel = hasCity && hasCounty
            ? `${city}, ${county} County`
            : hasCity ? city : `${county} County`;
        return {
            headline: `No ${category} listings in ${locationLabel}`,
            subtitle: "Try removing the location or category filter to see more results.",
        };
    }

    // Search + location combo
    if (hasQuery && (hasCity || hasCounty)) {
        const locationLabel = hasCity && hasCounty
            ? `${city}, ${county} County`
            : hasCity ? city : `${county} County`;
        return {
            headline: `No results for \u201c${query.trim()}\u201d in ${locationLabel}`,
            subtitle: "Try broader search terms or remove the location filter.",
        };
    }

    // Search + category combo
    if (hasQuery && hasCategory) {
        return {
            headline: `No ${category} listings matching \u201c${query.trim()}\u201d`,
            subtitle: "Try different keywords or browse all categories.",
        };
    }

    // Condition filter active
    if (hasCondition && activeFilterCount === 1) {
        return {
            headline: `No \u201c${condition}\u201d condition listings found`,
            subtitle: "Try selecting a different condition or view all conditions.",
        };
    }

    // Sold status filter
    if (hasStatus && status === "sold") {
        return {
            headline: "No sold listings to show",
            subtitle: "Switch back to \u201cAvailable\u201d to see active listings.",
        };
    }

    // Multiple filters active — generic but still helpful
    if (activeFilterCount >= 2) {
        return {
            headline: "No listings match your filters",
            subtitle: "Try removing some filters to see more results.",
        };
    }

    // Default — no filters active, just genuinely empty
    return {
        headline: "No Listings Found",
        subtitle: "Try adjusting your filters or search query, or list your own item.",
    };
}

export default function MarketplacePage({ user }) {
    // ─── Auth resolution ──────────────────────────────────────────────
    const [resolvedUser, setResolvedUser] = useState(user || null);

    useEffect(() => {
        if (user) setResolvedUser(user);
    }, [user]);

    useEffect(() => {
        let isMounted = true;
        const loadMe = async () => {
            if (user) return;
            try {
                const res = await secureFetch("/users/profile", { credentials: "include" });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;
                if (data && (data.id || data.user_id)) setResolvedUser(data);
            } catch (_e) {
                // browsable without auth
            }
        };
        loadMe();
        return () => { isMounted = false; };
    }, [user]);

    const { openLoginPopup } = useAuth();
    const { activeBusinessId, activeArtistId, accountCacheKey, isBusinessAccount, isArtistAccount, activeAccount } = useActiveAccount();
    const isNonPersonalAccount = isBusinessAccount || isArtistAccount || (() => {
        const t = String(activeAccount?.type || activeAccount?.account_type || '').toLowerCase();
        return t === 'business' || t === 'artist';
    })();
    const isMdUp = useMediaQuery("(min-width:1440px)");
    const isMobile = !isMdUp;
    // Phone-only breakpoint (matches Community/Business/Events/Music/Jobs pattern). Below this,
    // the compact phone header (pill tabs + tiny icon cluster) is used as-is.
    const isPhoneMarket = useMediaQuery("(max-width:899px)");
    // Tablet/laptop range (900–1439): header controls are promoted to labeled buttons
    // (Filters drawer opener, Map, Sell Item) matching other pages.
    const isTabletMarket = isMobile && !isPhoneMarket;
    // Narrow end of tablet (900–1099): Filters / Map / Sell Item collapse to icons
    // to keep the toolbar on one row.
    const isNarrowTabletMarket = useMediaQuery("(min-width:900px) and (max-width:1099px)");

    // ── Mobile-specific state (community page pattern) ──
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [mobileMapOpen, setMobileMapOpen] = useState(false);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

    // ── Close mobile detail drawer on browser back button ──
    useEffect(() => {
        if (!mobileDetailOpen) return;
        window.history.pushState({ mobileDetail: true }, '');
        const handlePopState = () => { setMobileDetailOpen(false); setMobileDetailFromMap(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileDetailOpen]);

    // ── Close mobile map drawer on browser back button ──
    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ marketplaceMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);

    // Note: Previously this page observed the body class `ll-mobile-nav-hidden`
    // to expand the container when the global nav hid on scroll. With the
    // continuous scroll-hide system (Header.jsx + `--ll-nav-offset`), the
    // global bars slide via transform and the container stays at its normal
    // size — no mid-scroll layout shift needed.

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used `useSubheaderScrollHide` to translateY the
    // subheader + its filter-chip row and reclaim their vertical space
    // via negative margin-bottom. That produced jerky content shifts.
    // The subheader is now `position: sticky` under the global header
    // and fades via `opacity: calc(1 - var(--ll-nav-offset))`. Same CSS
    // var as Header.jsx so all chrome fades in lockstep.
    const mobileHeaderRef = useRef(null);
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-marketplace-scroll]',
        enabled: false,
    });

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll container reserves space via `padding-top: calc(header +
    // subheader)` so content doesn't sit under the floating chrome on
    // initial paint. ResizeObserver keeps the CSS var in sync with the
    // real height (filter chips, wrapping, etc.). Phone only.
    useLayoutEffect(() => {
        if (!isPhoneMarket) {
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
    }, [isPhoneMarket]);

    // Track what the mobile detail drawer shows ('discover' | 'listing')
    const [mobileDrawerMode, setMobileDrawerMode] = useState('discover');

    // Track whether the mobile detail drawer was opened from the map
    const [mobileDetailFromMap, setMobileDetailFromMap] = useState(false);

    // Mobile: inline overview view (matches JobsPage discover pattern)
    // 'list' = normal listings feed, 'overview' = inline BrowsePanel
    const [mobileOverviewView, setMobileOverviewView] = useState('list');

    // ─── Back-nav restore ─────────────────────────────────────────────
    const navType = useNavigationType();
    const isPopNavigation = navType === "POP";
    const location = useLocation();
    const sellerFilter = location?.state?.sellerFilter || null;
    const [restored] = useState(() => {
        if (sellerFilter) return null; // seller filter from profile takes priority
        const saved = loadMktState();
        if (!saved) return null;
        if (saved.accountCacheKey && saved.accountCacheKey !== accountCacheKey) return null;
        return saved;
    });

    // ─── Chrome layout ────────────────────────────────────────────────
    const [chromeTop, setChromeTop] = useState(0);
    const [pageVisible, setPageVisible] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        const STYLE_ID = 'll-marketplace-noshift-style';
        const BODY_CLASS = 'll-marketplace-fixed-layout';

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.type = 'text/css';
            styleEl.appendChild(
                document.createTextNode(
                    `
                    body.${BODY_CLASS} { padding-right: var(--ll-marketplace-scrollbar-comp, 0px) !important; overflow: hidden !important; }
                    html.${BODY_CLASS} { padding-right: var(--ll-marketplace-scrollbar-comp, 0px) !important; overflow: hidden !important; }
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
        const prevCssVarBody = body.style.getPropertyValue('--ll-marketplace-scrollbar-comp');
        const prevCssVarHtml = html.style.getPropertyValue('--ll-marketplace-scrollbar-comp');

        const scrollbarWidth = window.innerWidth - html.clientWidth;
        const comp = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0px';

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        html.style.setProperty('--ll-marketplace-scrollbar-comp', comp);
        body.style.setProperty('--ll-marketplace-scrollbar-comp', comp);

        html.style.paddingRight = comp;
        body.style.paddingRight = comp;

        const measure = () => {
            const header =
                document.querySelector("header.MuiAppBar-root") ||
                document.querySelector("header") ||
                document.querySelector(".site-header") ||
                document.getElementById("header") ||
                null;
            setChromeTop(header ? header.getBoundingClientRect().bottom : 0);
        };

        measure();
        let raf2 = null;
        const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(measure); });
        window.addEventListener("resize", measure);

        return () => {
            window.removeEventListener("resize", measure);
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);

            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;

            if (prevCssVarHtml) html.style.setProperty('--ll-marketplace-scrollbar-comp', prevCssVarHtml);
            else html.style.removeProperty('--ll-marketplace-scrollbar-comp');

            if (prevCssVarBody) body.style.setProperty('--ll-marketplace-scrollbar-comp', prevCssVarBody);
            else body.style.removeProperty('--ll-marketplace-scrollbar-comp');

            body.classList.remove(BODY_CLASS);
            html.classList.remove(BODY_CLASS);
        };
    }, []);

    // ─── View state (replaces old pageTab) ───────────────────────────
    const [view, setView] = useState(() => restored?.view || "all");

    // ─── Page tab: "marketplace" or "yard-sales" ─────────────────────
    const [pageTab, setPageTab] = useState(() => restored?.pageTab || "marketplace");
    const isYardSalesTab = pageTab === "yard-sales";

    // Yard-sales sort default is "any"
    const [yardSort, setYardSort] = useState(() => restored?.yardSort || "any");
    const [yardCity, setYardCity] = useState(() => restored?.yardCity || "");
    const [yardCounty, setYardCounty] = useState(() => restored?.yardCounty || "");
    const [yardQuery, setYardQuery] = useState(() => restored?.yardQuery || "");
    const [yardSearchInput, setYardSearchInput] = useState(() => restored?.yardQuery || "");

    // ─── Filter state ─────────────────────────────────────────────────
    const [query, setQuery] = useState(() => sellerFilter?.query || restored?.query || "");
    const [searchInput, setSearchInput] = useState(() => sellerFilter?.query || restored?.query || "");
    const [category, setCategory] = useState(() => restored?.category || "");
    const [condition, setCondition] = useState(() => restored?.condition || "All");
    const [sort, setSort] = useState(() => restored?.sort || "newest");
    const [status, setStatus] = useState(() => sellerFilter?.status || restored?.status || "available");
    const [priceModel, setPriceModel] = useState(() => restored?.priceModel || "");
    const [city, setCity] = useState(() => restored?.city || "");
    const [county, setCounty] = useState(() => restored?.county || "");
    const [radius, setRadius] = useState(() => restored?.radius || STATEWIDE);
    const [showFilters, setShowFilters] = useState(() => restored?.showFilters != null ? restored.showFilters : true);

    const includeStatewide = true;

    // ── Radius expansion ──
    const expandedCounties = useMemo(
        () => countiesWithinRadius(county, radius),
        [county, radius]
    );

    // ── Map center/zoom — driven by county + radius ──
    const AL_CENTER = useMemo(() => [32.69, -86.79], []);
    const AL_ZOOM = 7;
    const [mapCenter, setMapCenter] = useState(AL_CENTER);
    const [mapZoom, setMapZoom] = useState(AL_ZOOM);

    useEffect(() => {
        if (county) {
            const center = getCountyCenter(county);
            if (center) {
                setMapCenter(center);
                const r = String(radius);
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
    }, [county, radius, AL_CENTER]);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate both `county` and `yardCounty` from the
    // viewer's home_county. Product decision (2026-04): fresh loads
    // should start statewide, and narrower defaults should be opt-in
    // via the "Apply automatically when I open this tab" checkbox on a
    // saved filter (see SavedFiltersMenu + MarketplaceFilters' auto-apply
    // effect).
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!resolvedUser) return;
        appliedHomeDefaultRef.current = true;
    }, [resolvedUser]);

    // Clear seller filter from location state after consuming it (prevents re-apply on back-nav)
    useEffect(() => {
        if (sellerFilter) {
            try { window.history.replaceState({}, ""); } catch { /* */ }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Memoize filters so useMarketplaceFeed gets a stable reference.
    // accountCacheKey ensures re-fetch when the user switches accounts.
    const filters = useMemo(
        () => ({
            query,
            category,
            condition,
            sort,
            status,
            priceModel,
            city,
            county,
            counties: expandedCounties,
            includeStatewide,
            view,
            accountCacheKey,
            excludeCategory: "Yard Sales",
        }),
        [query, category, condition, sort, status, priceModel, city, county, expandedCounties, view, accountCacheKey]
    );

    // Yard-sales filters — always forces category to "Yard Sales"
    const yardFilters = useMemo(
        () => ({
            query: yardQuery,
            category: "Yard Sales",
            condition: "All",
            sort: yardSort === "any" ? "newest" : yardSort,
            status: "available",
            priceModel: "",
            city: yardCity,
            county: yardCounty,
            includeStatewide,
            view: "all",
            accountCacheKey,
        }),
        [yardQuery, yardSort, yardCity, yardCounty, accountCacheKey]
    );

    // ─── Feed ─────────────────────────────────────────────────────────
    const {
        items, totalCount, isLoadingInitial, isRefreshing, isLoadingMore, error,
        hasMore, loadMore, refresh, categoryCounts, categoryCountsLoading,
        locationCounts, locationCountsLoading,
    } = useMarketplaceFeed(filters);

    // ─── Yard Sales Feed ──────────────────────────────────────────────
    const {
        items: yardItems, totalCount: yardTotalCount,
        isLoadingInitial: yardIsLoadingInitial, isRefreshing: yardIsRefreshing,
        isLoadingMore: yardIsLoadingMore, error: yardError,
        hasMore: yardHasMore, loadMore: yardLoadMore, refresh: yardRefresh,
        locationCounts: yardLocationCounts, locationCountsLoading: yardLocationCountsLoading,
    } = useMarketplaceFeed(yardFilters);

    // ─── Active feed — pick marketplace or yard-sales based on pageTab ──
    const activeItems = isYardSalesTab ? yardItems : items;
    const activeTotalCount = isYardSalesTab ? yardTotalCount : totalCount;
    const activeIsLoadingInitial = isYardSalesTab ? yardIsLoadingInitial : isLoadingInitial;
    const activeIsRefreshing = isYardSalesTab ? yardIsRefreshing : isRefreshing;
    const activeIsLoadingMore = isYardSalesTab ? yardIsLoadingMore : isLoadingMore;
    const activeError = isYardSalesTab ? yardError : error;
    const activeHasMore = isYardSalesTab ? yardHasMore : hasMore;
    const activeLoadMore = isYardSalesTab ? yardLoadMore : loadMore;
    const activeRefresh = isYardSalesTab ? yardRefresh : refresh;

    // ── Mobile pull-to-refresh ──────────────────────────────────────────
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartRef = useRef(null);
    const pullScrollElRef = useRef(null);
    const PULL_THRESHOLD = 70;

    const handlePullTouchStart = useCallback((e) => {
        if (!isMobile || pullRefreshing) return;
        const el = e.currentTarget;
        if (el.scrollTop > 5) { pullStartRef.current = null; return; }
        pullStartRef.current = e.touches[0].clientY;
        pullScrollElRef.current = el;
    }, [isMobile, pullRefreshing]);

    const handlePullTouchMove = useCallback((e) => {
        if (!isMobile || pullRefreshing || pullStartRef.current == null) return;
        const el = pullScrollElRef.current;
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
            if (typeof activeRefresh === 'function') activeRefresh();
            setTimeout(() => setPullRefreshing(false), 1200);
        } else {
            setPullDistance(0);
        }
        pullStartRef.current = null;
    }, [isMobile, pullRefreshing, pullDistance, activeRefresh]);

    // ─── UI state ─────────────────────────────────────────────────────
    const [selectedListingId, setSelectedListingId] = useState(() => restored?.selectedListingId || null);
    const [rightTab, setRightTab] = useState(() => restored?.rightTab || "browse");
    const [focusListingId, setFocusListingId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editListingId, setEditListingId] = useState(null);
    const [editInitialListing, setEditInitialListing] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [flagDialogOpen, setFlagDialogOpen] = useState(false);
    const [flagTarget, setFlagTarget] = useState(null);
    const [hasMyListings, setHasMyListings] = useState(false);
    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);

    const scrollRef = useRef(null);
    const sentinelRef = useRef(null);

    const canCreate = Boolean(resolvedUser && (resolvedUser.id || resolvedUser.user_id));

    /* ---------- listing creation rate limiting ---------- */
    const { checkLimit: checkListingLimit, recordAction: recordListingCreate } = useRateLimit('listing-create', {
        burstMax: 3,
        burstWindowMs: 60_000,    // 3 listings per minute
        maxPerHour: 15,           // 15 listings per hour
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'listings',
    });

    // Pick up listing-deleted flag from ListingDetail navigation
    const listingDeletedOnMount = useRef(false);
    useEffect(() => {
        try {
            if (sessionStorage.getItem('ll:marketplace:listingDeletedSuccess') === '1') {
                sessionStorage.removeItem('ll:marketplace:listingDeletedSuccess');
                sessionStorage.removeItem(MKT_STATE_KEY);
                listingDeletedOnMount.current = true;
                showSuccess('Listing deleted successfully');
            }
        } catch {}
    }, [showSuccess]);

    // ─── Check if user has any listings (for View dropdown "My Listings" option) ──
    useEffect(() => {
        if (!canCreate) { setHasMyListings(false); return; }
        let active = true;
        secureFetch("/api/marketplace/listings?onlyMine=1&limit=1", { credentials: "include" })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (active && data) setHasMyListings(Array.isArray(data.items) && data.items.length > 0);
            })
            .catch(() => {});
        return () => { active = false; };
    }, [canCreate, accountCacheKey]);

    // ─── Infinite scroll ──────────────────────────────────────────────
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && activeHasMore && !activeIsLoadingInitial && !activeIsRefreshing && !activeIsLoadingMore) activeLoadMore(); },
            { root: scrollRef.current, rootMargin: "200px" }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [activeHasMore, activeIsLoadingInitial, activeIsRefreshing, activeIsLoadingMore, activeLoadMore]);

    const handleCountyChange = useCallback((v) => {
        setCounty(v);
        if (!v) setRadius(STATEWIDE);
        else setRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED);
    }, []);

    // ─── Persist hub state to sessionStorage for back-nav restore ─────
    useEffect(() => {
        const scrollTop = scrollRef.current?.scrollTop || 0;
        saveMktState({
            view, query, category, condition, sort, status, priceModel,
            city, county, radius, showFilters, selectedListingId, rightTab,
            scrollTop, accountCacheKey, pageTab,
            yardSort, yardCity, yardCounty, yardQuery,
        });
    }, [view, query, category, condition, sort, status, priceModel, city, county, showFilters, selectedListingId, rightTab, accountCacheKey, pageTab, yardSort, yardCity, yardCounty, yardQuery]);

    // Save scroll position continuously so it's captured between state changes.
    // (Scroll-hide for the mobile subheader is handled by useSubheaderScrollHide
    //  above — this effect is purely about persisting scrollTop for back-nav.)
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        let rafId = null;
        const onScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                try {
                    const raw = sessionStorage.getItem(MKT_STATE_KEY);
                    if (raw) {
                        const state = JSON.parse(raw);
                        state.scrollTop = el.scrollTop;
                        sessionStorage.setItem(MKT_STATE_KEY, JSON.stringify(state));
                    }
                } catch { /* ignore */ }
            });
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => { el.removeEventListener("scroll", onScroll); if (rafId) cancelAnimationFrame(rafId); };
    }, [activeIsLoadingInitial]);

    // Restore scroll position on back-nav (two-phase: mount + data arrival)
    const restoredScrollRef = useRef(restored && isPopNavigation ? (restored.scrollTop ?? null) : null);
    const scrollRestoredRef = useRef(false);

    useEffect(() => {
        if (restoredScrollRef.current != null && !scrollRestoredRef.current) {
            const scrollTop = restoredScrollRef.current;
            requestAnimationFrame(() => {
                const el = scrollRef.current;
                if (el && el.scrollHeight > el.clientHeight) {
                    el.scrollTop = scrollTop;
                    scrollRestoredRef.current = true;
                    restoredScrollRef.current = null;
                }
            });
        } else if (!isPopNavigation) {
            requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Phase 2: restore scroll once data arrives from the hook
    const showingCount = Array.isArray(activeItems) ? activeItems.length : 0;
    useEffect(() => {
        if (restoredScrollRef.current == null || scrollRestoredRef.current) return;
        if (!showingCount) return;
        const scrollTop = restoredScrollRef.current;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = scrollRef.current;
                if (el) {
                    el.scrollTop = scrollTop;
                    scrollRestoredRef.current = true;
                    restoredScrollRef.current = null;
                }
            });
        });
    }, [showingCount]); // eslint-disable-line react-hooks/exhaustive-deps

    // State is continuously persisted by the save effect, so no need to
    // clear after mount — avoids a race condition where navigating away
    // before the next save could leave sessionStorage empty.

    // ─── View change handler ─────────────────────────────────────────
    const handleViewChange = useCallback((newView) => {
        const requiresAuth = ["mine", "saved", "following"].includes(newView);
        if (requiresAuth && !canCreate) { openLoginPopup(); return; }
        setView(newView);
    }, [canCreate, openLoginPopup]);

    // Saved filters restore: update BOTH the input (searchInput) and the
    // committed term (query) so the input reflects the restored term
    // AND the fetch re-runs with it. Called by MarketplaceFilters' apply.
    const handleSavedSearchChange = useCallback((val) => {
        const next = String(val || "");
        setQuery(next);
        setSearchInput(next);
    }, []);

    // ─── Handlers (useCallback-wrapped to prevent infinite re-render loops) ───
    const handleOpenCreate = useCallback(() => {
        if (!canCreate) { openLoginPopup(); return; }
        if (isNonPersonalAccount) { setAccountSwitchOpen(true); return; }
        const result = checkListingLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'listings' });
            setRateLimitOpen(true);
            return;
        }
        setEditMode(false); setEditListingId(null); setEditInitialListing(null); setCreateOpen(true);
    }, [canCreate, openLoginPopup, isNonPersonalAccount, checkListingLimit]);

    const handleCloseCreate = useCallback(() => { setCreateOpen(false); setEditMode(false); setEditListingId(null); setEditInitialListing(null); }, []);

    const handleCreated = useCallback(() => { recordListingCreate(); handleCloseCreate(); activeRefresh(); showSuccess("Listing created!"); }, [recordListingCreate, handleCloseCreate, activeRefresh, showSuccess]);
    const handleUpdated = useCallback(() => { handleCloseCreate(); activeRefresh(); showSuccess("Listing updated!"); window.dispatchEvent(new CustomEvent('ll:marketplace:listing:updated')); }, [handleCloseCreate, activeRefresh, showSuccess]);

    const handleSelectListing = useCallback((listing) => {
        const id = listing?.id;
        setSelectedListingId(id);
        if (isMdUp) setRightTab("details");
        // Mobile: open detail in drawer
        if (!isMdUp && id) {
            setMobileDrawerMode('listing');
            setMobileDetailFromMap(mobileMapOpen);
            setMobileDetailOpen(true);
        }
        // Record a view when user clicks a listing card
        if (id) {
            secureFetch(`/api/marketplace/listings/${id}/view`, {
                method: "POST",
                credentials: "include",
            }).catch(() => {});
        }
    }, [isMdUp, mobileMapOpen]);

    const handleClearSelection = useCallback(() => { setSelectedListingId(null); setRightTab("browse"); }, []);

    const handleShowOnMap = useCallback((listing) => {
        if (!listing) return;
        setRightTab("map");
        setFocusListingId(String(listing.id || ""));
        // Mobile: open map drawer with delayed focus so animation finishes first
        if (!isMdUp) {
            const alreadyOpen = mobileMapOpen;
            setMobileMapOpen(true);
            if (!alreadyOpen) {
                setTimeout(() => setFocusListingId(String(listing.id || "")), 380);
            }
        }
    }, [isMdUp, mobileMapOpen]);

    const handleFavorite = useCallback(async (listing) => {
        if (!canCreate) { openLoginPopup(); return; }
        try { await toggleFavorite(listing.id, { businessId: activeBusinessId, artistId: activeArtistId }); activeRefresh(); } catch (_err) { /* silent */ }
    }, [canCreate, openLoginPopup, activeBusinessId, activeArtistId, activeRefresh]);

    const handleRepost = useCallback(async (listing) => {
        if (!canCreate) { openLoginPopup(); return; }
        try { await toggleRepost(listing.id, { businessId: activeBusinessId, artistId: activeArtistId }); activeRefresh(); showSuccess(listing.isReposted ? "Repost removed" : "Reposted!"); } catch (_err) { /* silent */ }
    }, [canCreate, openLoginPopup, activeBusinessId, activeArtistId, activeRefresh, showSuccess]);

    const handleContact = useCallback((listing) => {
        if (!canCreate) { openLoginPopup(); return; }
        setSelectedListingId(listing?.id); setRightTab("details");
    }, [canCreate, openLoginPopup]);

    const handleEdit = useCallback((listing) => {
        if (!canCreate) { openLoginPopup(); return; }
        setEditMode(true); setEditListingId(listing?.id); setEditInitialListing(listing); setCreateOpen(true);
    }, [canCreate, openLoginPopup]);

    const handleDelete = useCallback((listing) => { setDeleteTarget(listing); setDeleteOpen(true); }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            await deleteListing(deleteTarget.id);
            setDeleteOpen(false); setDeleteTarget(null);
            setSelectedListingId((prev) => prev === deleteTarget.id ? null : prev);
            setRightTab((prev) => prev); // no-op to preserve; actual clear handled by selectedListingId
            activeRefresh(); showSuccess("Listing deleted successfully");
        } catch (_err) { /* silent */ }
    }, [deleteTarget, activeRefresh, showSuccess]);

    const handleMarkSold = useCallback(async (listing) => {
        try { await markListingSold(listing.id, { businessId: activeBusinessId, artistId: activeArtistId }); activeRefresh(); showSuccess("Marked as sold!"); } catch (_err) { /* silent */ }
    }, [activeBusinessId, activeArtistId, activeRefresh, showSuccess]);

    const handleRelist = useCallback(async (listing) => {
        try { await relistListing(listing.id); activeRefresh(); showSuccess("Relisted!"); } catch (_err) { /* silent */ }
    }, [activeRefresh, showSuccess]);

    const handleFlag = useCallback((listing) => {
        if (!canCreate) { openLoginPopup(); return; }
        setFlagTarget(listing); setFlagDialogOpen(true);
    }, [canCreate, openLoginPopup]);

    const handleFlagSubmit = useCallback(async ({ reason, details }) => {
        if (!flagTarget) return;
        setFlagDialogOpen(false);
        try { await flagListing(flagTarget.id, { reason, details }); showSuccess("Report submitted. Thank you."); }
        catch (_err) { showSuccess("Could not submit report. Please try again."); }
        setFlagTarget(null);
    }, [flagTarget, showSuccess]);

    const handleClearAll = useCallback(() => {
        if (isYardSalesTab) {
            setYardSearchInput(""); setYardQuery(""); setYardSort("any"); setYardCity(""); setYardCounty(""); yardRefresh();
        } else {
            setSearchInput(""); setQuery(""); setCategory(""); setCondition("All"); setSort("newest"); setStatus("available"); setPriceModel(""); setCity(""); setCounty(""); setRadius(STATEWIDE); setView("all"); refresh();
        }
    }, [isYardSalesTab, refresh, yardRefresh]);

    // Active filter chips for mobile
    const activeFilterChips = useMemo(() => {
        const chips = [];
        if (isYardSalesTab) {
            if (yardCounty) chips.push({ key: 'county', label: `${yardCounty} County`, onRemove: () => setYardCounty("") });
            if (yardCity) chips.push({ key: 'city', label: yardCity, onRemove: () => setYardCity("") });
            if (yardSort && yardSort !== "any") chips.push({ key: 'sort', label: `Sort: ${yardSort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setYardSort("any") });
        } else {
            if (category) chips.push({ key: 'category', label: category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setCategory("") });
            if (county) chips.push({ key: 'county', label: `${county} County`, onRemove: () => { setCounty(""); setRadius(STATEWIDE); } });
            if (county && !isCountyOnly(radius)) chips.push({ key: 'radius', label: radiusLabel(radius), onRemove: () => setRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED) });
            if (city) chips.push({ key: 'city', label: city, onRemove: () => setCity("") });
            if (condition && condition !== "All") chips.push({ key: 'condition', label: condition, onRemove: () => setCondition("All") });
            if (sort && sort !== "newest") chips.push({ key: 'sort', label: `Sort: ${sort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setSort("newest") });
            if (view && view !== "all") chips.push({ key: 'view', label: view.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setView("all") });
        }
        return chips;
    }, [isYardSalesTab, category, county, radius, city, condition, sort, view, yardCounty, yardCity, yardSort]);
    const handleSellerFilter = useCallback(({ query: sellerQuery, status: sellerStatus }) => {
        setSearchInput(sellerQuery || "");
        setQuery(sellerQuery || "");
        setStatus(sellerStatus || "available");
        setCategory("");
        setCondition("All");
        setPriceModel("");
        setCity("");
        setCounty("");
        setView("all");
        setSelectedListingId(null);
        setRightTab("browse");
    }, []);
    const handleSearch = useCallback(() => {
        if (isYardSalesTab) { setYardQuery(yardSearchInput); }
        else { setQuery(searchInput); }
    }, [isYardSalesTab, searchInput, yardSearchInput]);
    const handleToggleFilters = useCallback(() => { setShowFilters((v) => !v); }, []);
    const handleSelectCategory = useCallback((cat) => { setCategory(cat || ""); setView("all"); }, []);
    const handleSelectCondition = useCallback((cond) => { setCondition(cond || "All"); setView("all"); }, []);
    const handleSelectPriceModel = useCallback((model) => { setPriceModel((prev) => prev === model ? "" : model); setView("all"); }, []);
    const handleSelectCity = useCallback((c) => { setCity(c || ""); setView("all"); }, []);
    const handleSelectCounty = useCallback((co) => { setCounty(co || ""); setView("all"); }, []);
    const handleSelectSort = useCallback((s) => { setSort(s || "newest"); setView("all"); }, []);
    const handleFocusListingHandled = useCallback(() => { setFocusListingId(null); }, []);

    // ─── Render helpers ───────────────────────────────────────────────
    const isLoading = activeIsLoadingInitial;
    const totalDisplay = Number.isFinite(Number(activeTotalCount)) ? Number(activeTotalCount) : null;

    const statusText = (() => {
        if ((isLoading || activeIsRefreshing) && showingCount === 0) return "Loading\u2026";
        if (showingCount === 0 && totalDisplay > 0) return "Loading\u2026";
        if (showingCount === 0) return isYardSalesTab ? "No yard sales match your filters" : "No listings match your filters";
        if (totalDisplay !== null) {
            const clamped = Math.min(showingCount, totalDisplay);
            return "Displaying " + clamped.toLocaleString() + " out of " + totalDisplay.toLocaleString() + " listing" + (totalDisplay !== 1 ? "s" : "");
        }
        return "Displaying " + showingCount.toLocaleString() + " out of " + showingCount.toLocaleString() + " listing" + (showingCount !== 1 ? "s" : "");
    })();

    const cardProps = (listing) => ({
        listing,
        selected: selectedListingId === listing.id,
        onSelect: handleSelectListing,
        onFavorite: handleFavorite,
        onRepost: handleRepost,
        onContact: handleContact,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onFlag: handleFlag,
        onMarkSold: handleMarkSold,
        onRelist: handleRelist,
        onShowOnMap: handleShowOnMap,
        user: resolvedUser,
    });

    // ─── JSX ──────────────────────────────────────────────────────────
    return (
        <Box
            sx={{
                position: "fixed",
                // Track global nav offset so the container expands to fill the
                // viewport as the app bar + bottom nav slide away. Mirrors
                // CommunityPage so the floating subheader (Marketplace pill +
                // search) fades in lockstep with the AppBar via `--ll-nav-offset`.
                top: `calc(${chromeTop}px * (1 - var(--ll-nav-offset, 0)))`,
                left: 0,
                right: 0,
                bottom: 0,
                "@media (max-width: 899px)": {
                    bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px * (1 - var(--ll-nav-offset, 0)))`,
                },
                overflow: "hidden",
                display: "flex",
                alignItems: "stretch",
                flexDirection: "column",
                gap: 0,
                p: 0,
                pt: 0,
                boxSizing: "border-box",
                bgcolor: "background.paper",
                "@media (min-width: 1024px)": {
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: "background.default",
                },
                "@media (min-width: 1440px)": {
                    flexDirection: "row",
                    gap: 1.25,
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: "background.default",
                },
                opacity: pageVisible ? 1 : 0,
                transform: "none",
                transition: (t) => [
                    `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                    `transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                ].join(", "),
            }}
        >
            {/* ──── Left panel ──── */}
            <Box sx={{ flex: 1, minWidth: 0, position: "relative", height: "100%", overflow: "hidden" }}>
                <Box
                    sx={(t) => ({
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        border: "none",
                        borderColor: "transparent",
                        borderRadius: 0,
                        bgcolor: t.palette.background.paper,
                        "@media (min-width: 1024px)": {
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            borderRadius: 3,
                        },
                        "@media (min-width: 1440px)": {
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            borderRadius: 3,
                        },
                        backdropFilter: "none",
                        backgroundImage: "none",
                        boxShadow: "none",
                        overflow: "hidden",
                    })}
                >
                    {/* Phone header (<900px): compact tab pills + Map/Search icons + filter chips */}
                    {isPhoneMarket && (
                        <Box
                            ref={mobileHeaderRef}
                            sx={{
                                flexShrink: 0,
                                // Fixed in viewport directly below the global header.
                                // Doesn't take layout space — the scroll container reserves
                                // space via padding-top. Fades via `--ll-nav-offset` in sync
                                // with the rest of the chrome.
                                position: "fixed",
                                top: "var(--ll-nav-height, 52px)",
                                left: 0,
                                right: 0,
                                zIndex: (t) => t.zIndex.appBar,
                                opacity: "calc(1 - var(--ll-nav-offset, 0))",
                                pointerEvents: "var(--ll-nav-pointer-events, auto)",
                                transition: "none",
                                willChange: "opacity",
                                backdropFilter: "saturate(140%) blur(10px)",
                                WebkitBackdropFilter: "saturate(140%) blur(10px)",
                                backgroundColor: (t) => alpha(t.palette.background.paper, 0.85),
                            }}
                        >
                            {/* Mobile tab row — text pills + utility icons */}
                            <Box
                                sx={(t) => ({
                                    px: 1,
                                    pt: 0.75,
                                    pb: 0.35,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                })}
                            >
                                <Box sx={{ flex: "0 0 auto", display: "flex", overflow: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", '&::-webkit-scrollbar': { display: 'none' }, maxWidth: '100%' }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0 }}>
                                        {(() => {
                                            const mobilePillSx = (active) => (t2) => ({
                                                borderRadius: 999, textTransform: "none",
                                                fontFamily: t2.typography.fontFamily,
                                                fontWeight: active ? 800 : 600,
                                                letterSpacing: "0.01em",
                                                fontSize: 11.5, lineHeight: 1,
                                                height: 28, minHeight: 28, px: 1.25, py: 0,
                                                flexDirection: "row", gap: 0,
                                                color: active ? t2.palette.primary.main : t2.palette.text.secondary,
                                                backgroundColor: active ? alpha(t2.palette.primary.main, 0.08) : "transparent",
                                                border: "1px solid",
                                                borderColor: active ? alpha(t2.palette.primary.main, 0.18) : "transparent",
                                                boxShadow: "none", whiteSpace: 'nowrap', flexShrink: 0,
                                                transition: `all ${t2.custom.motion.base}ms ${t2.custom.motion.ease}`,
                                                "& .MuiButton-startIcon": { display: "none" },
                                                "&:hover": {
                                                    backgroundColor: active ? alpha(t2.palette.primary.main, 0.1) : alpha(t2.palette.text.primary, 0.04),
                                                    color: active ? t2.palette.primary.main : t2.palette.text.primary,
                                                },
                                            });
                                            return (
                                                <>
                                                    <Button role="tab" aria-selected={mobileOverviewView === 'overview'} onClick={() => setMobileOverviewView((v) => v === 'overview' ? 'list' : 'overview')} variant="text" disableElevation sx={mobilePillSx(mobileOverviewView === 'overview')}>
                                                        Overview
                                                    </Button>
                                                    <Button role="tab" aria-selected={pageTab === 'marketplace' && mobileOverviewView !== 'overview'} onClick={() => { setPageTab('marketplace'); if (mobileOverviewView === 'overview') setMobileOverviewView('list'); }} variant="text" disableElevation sx={mobilePillSx(pageTab === 'marketplace' && mobileOverviewView !== 'overview')}>
                                                        Marketplace
                                                    </Button>
                                                    <Button role="tab" aria-selected={pageTab === 'yard-sales' && mobileOverviewView !== 'overview'} onClick={() => { setPageTab('yard-sales'); if (mobileOverviewView === 'overview') setMobileOverviewView('list'); }} variant="text" disableElevation sx={mobilePillSx(pageTab === 'yard-sales' && mobileOverviewView !== 'overview')}>
                                                        Yard Sales
                                                    </Button>
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </Box>

                                {/* Map + Search icons pushed right */}
                                {mobileOverviewView !== 'overview' && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto", flexShrink: 0 }}>
                                        <IconButton onClick={() => setMobileMapOpen(true)} size="small"
                                                    sx={(t) => ({ width: 32, height: 32, color: t.palette.text.secondary, transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`, "&:hover": { color: "primary.main" } })}
                                                    aria-label="Map">
                                            <MapRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                        <IconButton onClick={() => setMobileFilterDrawerOpen(true)} size="small"
                                                    sx={(t) => ({ width: 32, height: 32, color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.secondary, transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`, "&:hover": { color: "primary.main" } })}
                                                    aria-label="Search & Filter">
                                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </Box>
                                )}
                            </Box>

                            {/* Active filter chips — nested inside mobileHeaderRef so they
                                slide with the subheader on scroll. Gated on overview view
                                because chips belong with the normal feed layout. */}
                            {activeFilterChips.length > 0 && mobileOverviewView !== 'overview' && (
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, pb: 0.75, flexWrap: 'wrap',
                                }}>
                                    {activeFilterChips.slice(0, 3).map((chip) => (
                                        <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                              sx={(t) => ({ height: 26, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2), '& .MuiChip-deleteIcon': { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, '&:hover': { color: t.palette.primary.main } } })} />
                                    ))}
                                    {activeFilterChips.length > 3 && (
                                        <Chip label={`+${activeFilterChips.length - 3} more`} size="small" onClick={() => setMobileFilterDrawerOpen(true)}
                                              sx={(t) => ({ height: 26, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.06), color: t.palette.primary.main, cursor: 'pointer' })} />
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Tablet/laptop header (900–1439): pill tabs + search + Filters/Map/Sell Item.
                        Tabs: Overview + Marketplace + Yard Sales (38px, matches other pages).
                        All chrome hidden at any width when Overview mode is active. */}
                    {isTabletMarket && (
                        <Box
                            sx={{
                                flexShrink: 0,
                                px: 1.25, pt: 0.5, pb: 0.5,
                                rowGap: 0.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: 1,
                                flexWrap: "wrap",
                                position: "relative",
                                zIndex: 2,
                                bgcolor: "background.paper",
                            }}
                        >
                            {/* Segmented tabs — Overview + Marketplace + Yard Sales */}
                            <Box role="tablist" aria-label="Marketplace view" sx={{ flex: "0 0 auto", display: "flex" }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    {(() => {
                                        const segmentSx = (active) => (t) => ({
                                            borderRadius: 999,
                                            textTransform: "none",
                                            fontFamily: t.typography.fontFamily,
                                            fontWeight: active ? 950 : 700,
                                            letterSpacing: "-0.01em",
                                            fontSize: 13.5,
                                            lineHeight: 1,
                                            height: 38,
                                            px: 1.75,
                                            color: active ? t.palette.primary.main : t.palette.text.secondary,
                                            backgroundColor: active ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                            border: "1px solid",
                                            borderColor: active ? alpha(t.palette.primary.main, 0.2) : "transparent",
                                            boxShadow: "none",
                                            flexShrink: 0,
                                            whiteSpace: "nowrap",
                                            transition: `all ${t.custom?.motion?.base || 160}ms ${t.custom?.motion?.ease || "ease"}`,
                                            "&:hover": {
                                                backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                color: active ? t.palette.primary.main : t.palette.text.primary,
                                            },
                                            "&:focus-visible": {
                                                outline: "none",
                                                boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}`,
                                            },
                                        });
                                        return (
                                            <>
                                                <Button
                                                    role="tab"
                                                    aria-selected={mobileOverviewView === 'overview'}
                                                    onClick={() => setMobileOverviewView((v) => v === 'overview' ? 'list' : 'overview')}
                                                    variant="text"
                                                    disableElevation
                                                    sx={segmentSx(mobileOverviewView === 'overview')}
                                                >
                                                    Overview
                                                </Button>
                                                <Button
                                                    role="tab"
                                                    aria-selected={pageTab === 'marketplace' && mobileOverviewView !== 'overview'}
                                                    onClick={() => { setPageTab('marketplace'); if (mobileOverviewView === 'overview') setMobileOverviewView('list'); }}
                                                    variant="text"
                                                    disableElevation
                                                    sx={segmentSx(pageTab === 'marketplace' && mobileOverviewView !== 'overview')}
                                                >
                                                    Marketplace
                                                </Button>
                                                <Button
                                                    role="tab"
                                                    aria-selected={pageTab === 'yard-sales' && mobileOverviewView !== 'overview'}
                                                    onClick={() => { setPageTab('yard-sales'); if (mobileOverviewView === 'overview') setMobileOverviewView('list'); }}
                                                    variant="text"
                                                    disableElevation
                                                    sx={segmentSx(pageTab === 'yard-sales' && mobileOverviewView !== 'overview')}
                                                >
                                                    Yard Sales
                                                </Button>
                                            </>
                                        );
                                    })()}
                                </Box>
                            </Box>

                            {/* Search — fills remaining space. Hidden in Overview. */}
                            {mobileOverviewView !== 'overview' && (
                                <Box sx={{ flex: "1 1 auto", minWidth: 200 }}>
                                    <SearchInput
                                        placeholder={isYardSalesTab ? "Search yard sales…" : "Search listings…"}
                                        value={isYardSalesTab ? yardSearchInput : searchInput}
                                        onChange={(e) => {
                                            const v = e?.target?.value ?? "";
                                            if (isYardSalesTab) setYardSearchInput(v);
                                            else setSearchInput(v);
                                        }}
                                        inputProps={{ maxLength: 100 }}
                                        onSearch={handleSearch}
                                        onClear={() => {
                                            if (isYardSalesTab) { setYardSearchInput(""); setYardQuery(""); }
                                            else { setSearchInput(""); setQuery(""); }
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Filters button — opens the same mobile filter drawer used by phone.
                                At narrow tablet (900–1099) collapses to icon with count badge. */}
                            {mobileOverviewView !== 'overview' && (
                                <Tooltip title={isNarrowTabletMarket ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                                    {isNarrowTabletMarket ? (
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

                            {/* Map button */}
                            {mobileOverviewView !== 'overview' && (
                                <Tooltip title={isNarrowTabletMarket ? 'Map' : ''}>
                                    {isNarrowTabletMarket ? (
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

                            {/* Sell Item / Post Yard Sale — icon-only at narrow tablet, labeled at wider tablet */}
                            {mobileOverviewView !== 'overview' && (
                                <Tooltip title={isNarrowTabletMarket ? (isYardSalesTab ? 'Post Yard Sale' : 'Sell Item') : ''}>
                                    {isNarrowTabletMarket ? (
                                        <IconButton
                                            onClick={handleOpenCreate}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                bgcolor: t.palette.primary.main,
                                                color: t.palette.primary.contrastText,
                                                boxShadow: 'none',
                                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                                            })}
                                            aria-label={isYardSalesTab ? 'Post Yard Sale' : 'Sell Item'}
                                        >
                                            {isYardSalesTab ? <LocalMallRoundedIcon sx={{ fontSize: 20 }} /> : <AddRoundedIcon sx={{ fontSize: 20 }} />}
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={handleOpenCreate}
                                            variant="contained"
                                            size="small"
                                            startIcon={isYardSalesTab ? <LocalMallRoundedIcon /> : <AddRoundedIcon />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 900,
                                                px: 2.5,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                bgcolor: t.palette.primary.main,
                                                color: t.palette.primary.contrastText,
                                                boxShadow: 'none',
                                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                                            })}
                                        >
                                            {isYardSalesTab ? 'Post Yard Sale' : 'Sell Item'}
                                        </Button>
                                    )}
                                </Tooltip>
                            )}

                            {/* Active filter chips — hidden in Overview mode */}
                            {activeFilterChips.length > 0 && mobileOverviewView !== 'overview' && (
                                <Box sx={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap',
                                }}>
                                    {activeFilterChips.slice(0, 6).map((chip) => (
                                        <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                              sx={(t) => ({ height: 26, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2), '& .MuiChip-deleteIcon': { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, '&:hover': { color: t.palette.primary.main } } })} />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}

                    {!isMobile && (
                        /* Desktop: tabs + search + actions — single row */
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 1.25, pb: 0.75, flexWrap: 'wrap' }}>
                            {/* Page tabs — left side */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                {[
                                    { key: 'marketplace', label: 'Marketplace', icon: StorefrontRoundedIcon },
                                    { key: 'yard-sales', label: 'Yard Sales', icon: LocalMallRoundedIcon },
                                ].map((tab) => {
                                    const active = pageTab === tab.key;
                                    const TabIcon = tab.icon;
                                    return (
                                        <Button
                                            key={tab.key}
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => setPageTab(tab.key)}
                                            variant="text"
                                            disableElevation
                                            startIcon={<TabIcon sx={{ fontSize: 18 }} />}
                                            sx={(t2) => ({
                                                borderRadius: 999, textTransform: "none",
                                                fontFamily: t2.typography.fontFamily,
                                                fontWeight: active ? 800 : 600,
                                                letterSpacing: "0.01em",
                                                fontSize: 13, lineHeight: 1,
                                                height: 34, minHeight: 34, px: 2, py: 0,
                                                color: active ? t2.palette.primary.main : t2.palette.text.secondary,
                                                backgroundColor: active ? alpha(t2.palette.primary.main, 0.08) : "transparent",
                                                border: "1px solid",
                                                borderColor: active ? alpha(t2.palette.primary.main, 0.18) : "transparent",
                                                boxShadow: "none",
                                                transition: `all ${t2.custom.motion.base}ms ${t2.custom.motion.ease}`,
                                                "& .MuiButton-startIcon": { mr: 0.5 },
                                                "&:hover": {
                                                    backgroundColor: active ? alpha(t2.palette.primary.main, 0.1) : alpha(t2.palette.text.primary, 0.04),
                                                    color: active ? t2.palette.primary.main : t2.palette.text.primary,
                                                },
                                            })}
                                        >
                                            {tab.label}
                                        </Button>
                                    );
                                })}
                            </Box>

                            {/* Search — fills remaining space */}
                            <Box sx={{ flex: '1 1 auto', minWidth: 200 }}>
                                <SearchInput
                                    placeholder={isYardSalesTab ? "Search yard sales…" : "Search listings…"}
                                    value={isYardSalesTab ? yardSearchInput : searchInput}
                                    onChange={(e) => {
                                        const v = e?.target?.value ?? "";
                                        if (isYardSalesTab) setYardSearchInput(v);
                                        else setSearchInput(v);
                                    }}
                                    inputProps={{ maxLength: 100 }}
                                    onSearch={handleSearch}
                                    onClear={() => {
                                        if (isYardSalesTab) { setYardSearchInput(""); setYardQuery(""); }
                                        else { setSearchInput(""); setQuery(""); }
                                    }}
                                />
                            </Box>

                            {/* Action buttons — right side */}
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={isYardSalesTab ? <LocalMallRoundedIcon /> : <AddRoundedIcon />}
                                onClick={handleOpenCreate}
                                sx={(t) => ({
                                    borderRadius: 999, textTransform: 'none', fontWeight: 900,
                                    px: 2.5, height: 38, whiteSpace: 'nowrap',
                                    bgcolor: t.palette.primary.main,
                                    color: t.palette.primary.contrastText,
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                                })}
                            >
                                {isYardSalesTab ? "Post Yard Sale" : "Sell Item"}
                            </Button>
                        </Box>
                    )}

                    {/* ── Mobile: inline Overview view (matches JobsPage discover pattern) ── */}
                    {isMobile && mobileOverviewView === 'overview' && (
                        <>
                            <Divider sx={{ borderColor: 'divider' }} />
                            <Box sx={{
                                flex: 1,
                                minHeight: 0,
                                overflow: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                                position: 'relative',
                                zIndex: 1,
                                bgcolor: 'background.paper',
                                // Reserve space for the floating section header (Overview/Marketplace/Yard Sales)
                                // so the first piece of content starts below it on initial paint.
                                '@media (max-width: 1439px)': {
                                    paddingTop: 'var(--ll-subheader-height, 52px)',
                                },
                                '@media (max-width: 899px)': {
                                    paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                },
                            }}>
                                <BrowsePanel
                                    items={activeItems}
                                    categoryCounts={categoryCounts}
                                    activeCity={city}
                                    activeCounty={county}
                                    onSelectCategory={(cat) => {
                                        handleSelectCategory(cat);
                                        setMobileOverviewView('list');
                                    }}
                                    onSelectPriceModel={(model) => {
                                        handleSelectPriceModel(model);
                                        setMobileOverviewView('list');
                                    }}
                                    onSelectSort={(s) => {
                                        handleSelectSort(s);
                                        setMobileOverviewView('list');
                                    }}
                                />
                            </Box>
                        </>
                    )}

                    {/* ── Normal content — hidden when mobile overview view is active ── */}
                    {(!(isMobile && mobileOverviewView === 'overview')) && (
                        <>
                            {/* Filters — desktop only (mobile uses full-screen filter drawer) */}
                            {!isMobile && (
                                <Box sx={{ px: 1.25, pt: 1.25, '@media (min-width: 1440px)': { px: 1.5, pt: 1.5 }, pb: 0.75 }}>
                                    <MarketplaceFilters
                                        mode={isYardSalesTab ? "yard-sales" : "marketplace"}
                                        view={view} onViewChange={handleViewChange}
                                        hasMyListings={hasMyListings}
                                        isLoggedIn={canCreate}
                                        category={isYardSalesTab ? "Yard Sales" : category} onCategoryChange={setCategory}
                                        condition={isYardSalesTab ? "All" : condition} onConditionChange={setCondition}
                                        sort={isYardSalesTab ? yardSort : sort} onSortChange={isYardSalesTab ? setYardSort : setSort}
                                        status={isYardSalesTab ? "available" : status} onStatusChange={setStatus}
                                        city={isYardSalesTab ? yardCity : city} onCityChange={isYardSalesTab ? setYardCity : setCity}
                                        county={isYardSalesTab ? yardCounty : county} onCountyChange={isYardSalesTab ? setYardCounty : handleCountyChange}
                                        radius={radius} onRadiusChange={setRadius}
                                        categoryCounts={categoryCounts}
                                        categoryCountsLoading={categoryCountsLoading}
                                        locationCounts={isYardSalesTab ? yardLocationCounts : locationCounts}
                                        showAdvancedFilters={showFilters}
                                        viewer={resolvedUser}
                                        searchQuery={query}
                                        onSearchQueryChange={handleSavedSearchChange}
                                        onClearAll={handleClearAll}
                                    />
                                </Box>
                            )}

                            <Divider sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.12) })} />

                            {/* Listing grid */}
                            <Box ref={scrollRef} data-marketplace-scroll
                                 onTouchStart={isMobile ? handlePullTouchStart : undefined}
                                 onTouchMove={isMobile ? handlePullTouchMove : undefined}
                                 onTouchEnd={isMobile ? handlePullTouchEnd : undefined}
                                 sx={{
                                     flex: 1,
                                     minWidth: 0,
                                     overflowY: "auto",
                                     overflowX: "hidden",
                                     scrollbarGutter: "stable",
                                     p: 0,
                                     pb: 2,
                                     '@media (min-width: 1440px)': { p: 2, pb: 3 },
                                     // Mobile/tablet: reserve space under the floating chrome
                                     // so the first/last items don't sit under the header or
                                     // bottom nav on initial paint.
                                     "@media (max-width: 1439px)": {
                                         paddingTop: "var(--ll-subheader-height, 52px)",
                                     },
                                     "@media (max-width: 899px)": {
                                         paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                     },
                                     WebkitOverflowScrolling: "touch",
                                     overscrollBehavior: "contain"
                                 }}>

                                {/* Pull-to-refresh indicator (mobile only) */}
                                {isMobile && (pullDistance > 0 || pullRefreshing) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: pullRefreshing ? 56 : Math.max(pullDistance, 0), overflow: 'hidden', transition: pullRefreshing ? 'height 0.2s ease' : 'none' }}>
                                        <CircularProgress size={24} thickness={4} sx={{ opacity: pullRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }} />
                                    </Box>
                                )}

                                {/* Network error — friendly centered state */}
                                {/* Also catch errors whose message contains raw HTML (e.g. 404 page served when offline/unreachable) */}
                                {activeError && !isLoading && (isNetworkError(activeError) || /<!doctype|<html/i.test(activeError.message || "")) && showingCount === 0 && (
                                    <NetworkErrorState onRetry={activeRefresh} />
                                )}

                                {/* Non-network errors — standard alert */}
                                {activeError && !isLoading && !isNetworkError(activeError) && !/<!doctype|<html/i.test(activeError.message || "") && (
                                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                        {(() => {
                                            const msg = activeError.message || "";
                                            // Guard against any HTML/tags leaking into the display
                                            if (/<[a-z][\s\S]*>/i.test(msg)) return "Something went wrong. Please check your connection and try again.";
                                            return msg || "Something went wrong.";
                                        })()}
                                    </Alert>
                                )}

                                {(isLoading || activeIsRefreshing) && showingCount === 0 && !activeError && (
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                        <PulsingDots />
                                    </Box>
                                )}

                                {!isLoading && !activeIsRefreshing && showingCount === 0 && !activeError && (() => {
                                    const emptyMsg = isYardSalesTab
                                        ? getEmptyStateMessages({ view: "all", query: yardQuery, category: "Yard Sales", condition: "All", status: "available", priceModel: "", city: yardCity, county: yardCounty })
                                        : getEmptyStateMessages({ view, query, category, condition, status, priceModel, city, county });
                                    return (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                textAlign: "center",
                                                flex: 1,
                                                minHeight: "50vh",
                                                height: "100%",
                                                py: 6,
                                                px: 2,
                                            }}
                                        >
                                            <Stack spacing={1.5} alignItems="center">
                                                <Box sx={(t) => ({ width: 64, height: 64, borderRadius: "50%", bgcolor: alpha(t.palette.primary.main, 0.08), display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 0.5 })}>
                                                    <ShoppingCartRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
                                                </Box>
                                                <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                                                    {emptyMsg.headline}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 380, lineHeight: 1.55 }}>
                                                    {emptyMsg.subtitle}
                                                </Typography>
                                                {(view === "all" || isYardSalesTab) && (
                                                    <Button variant="contained" size="small" startIcon={isYardSalesTab ? <LocalMallRoundedIcon /> : <AddRoundedIcon />} onClick={handleOpenCreate}
                                                            sx={(t) => ({ mt: 1, textTransform: "none", fontWeight: 950, borderRadius: 999, px: 3,
                                                                background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                                                                boxShadow: `0 6px 16px ${alpha(t.palette.primary.main, 0.25)}`,
                                                                "&:hover": { boxShadow: `0 8px 20px ${alpha(t.palette.primary.main, 0.3)}` },
                                                            })}>
                                                        {isYardSalesTab ? "Post Yard Sale" : "List an Item"}
                                                    </Button>
                                                )}
                                                {view !== "all" && (
                                                    <Button variant="outlined" size="small" startIcon={<ShoppingCartRoundedIcon />} onClick={() => setView("all")}
                                                            sx={{ mt: 1, textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>
                                                        Browse Marketplace
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Box>
                                    );
                                })()}

                                {showingCount > 0 && (
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: { xs: 0, sm: 2 } }}>
                                        {activeItems.map((listing, idx) => (
                                            <React.Fragment key={listing.id}>
                                                {idx > 0 && (
                                                    <Box
                                                        sx={(t) => ({
                                                            gridColumn: "1 / -1",
                                                            display: { xs: "block", sm: "none" },
                                                            height: 8,
                                                            bgcolor: alpha(t.palette.text.primary, 0.06),
                                                            borderTop: "1px solid",
                                                            borderBottom: "1px solid",
                                                            borderColor: alpha(t.palette.text.primary, 0.08),
                                                        })}
                                                    />
                                                )}
                                                <Box sx={{ ...getListStaggerSx(idx) }}>
                                                    <ListingCard {...cardProps(listing)} />
                                                </Box>
                                            </React.Fragment>
                                        ))}
                                        {activeIsLoadingMore && (
                                            <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", py: 2 }}>
                                                <PulsingDots />
                                            </Box>
                                        )}
                                        <Box ref={sentinelRef} sx={{ height: 1, gridColumn: "1 / -1" }} />
                                    </Box>
                                )}
                            </Box>

                            {/* Status bar — desktop only */}
                            <Box
                                sx={(t) => ({
                                    flexShrink: 0,
                                    px: 1.25, py: 1,
                                    bgcolor: t.palette.background.paper,
                                    backgroundImage: "none",
                                    backdropFilter: "none",
                                    borderTop: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                    display: "none", "@media (min-width: 1440px)": { display: "flex", px: 1.5 }, alignItems: "center", justifyContent: "center",
                                })}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 13, color: "text.secondary", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: 22 }}>
                                    {statusText}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>

            {/* ──── Right panel — Desktop only ──── */}
            {isMdUp && (
                <MarketplaceRightPanel
                    rightWidth={RIGHT_WIDTH}
                    activeTab={rightTab}
                    onTabChange={setRightTab}
                    selectedListingId={selectedListingId}
                    user={resolvedUser}
                    onRequireAuth={openLoginPopup}
                    onSelectListing={handleSelectListing}
                    onClearSelection={handleClearSelection}
                    onFavorite={handleFavorite}
                    onRepost={handleRepost}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMarkSold={handleMarkSold}
                    onRelist={handleRelist}
                    onFlag={handleFlag}
                    onSellerFilter={handleSellerFilter}
                    items={activeItems}
                    categoryCounts={categoryCounts}
                    activeCity={city}
                    activeCounty={county}
                    onSelectCategory={handleSelectCategory}
                    onSelectCondition={handleSelectCondition}
                    onSelectPriceModel={handleSelectPriceModel}
                    onSelectCity={handleSelectCity}
                    onSelectCounty={handleSelectCounty}
                    onSelectSort={handleSelectSort}
                    isMapLoading={isLoading || activeIsRefreshing}
                    focusListingId={focusListingId}
                    onFocusListingHandled={handleFocusListingHandled}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                />
            )}

            {/* ── Mobile detail drawer (slides from right, full screen) ── */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileDetailOpen}
                    onClose={() => { setMobileDetailOpen(false); setMobileDetailFromMap(false); }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                    transitionDuration={{ enter: 280, exit: 220 }}
                    sx={{ zIndex: (t) => t.zIndex.drawer + 3 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            height: '100%',
                            top: 0,
                            bottom: 0,
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 0,
                        },
                    }}
                >
                    <Box
                        sx={(t) => ({
                            display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.75,
                            borderBottom: '1px solid', borderColor: 'divider',
                            bgcolor: t.palette.background.paper,
                            backdropFilter: 'none',
                            position: 'sticky', top: 0, zIndex: 10,
                            paddingTop: 'max(6px, env(safe-area-inset-top))',
                            flexShrink: 0,
                        })}
                    >
                        <IconButton onClick={() => {
                            setMobileDetailOpen(false);
                            setMobileDetailFromMap(false);
                        }} size="small" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {mobileDetailFromMap ? "Back to Map" : "Listing Details"}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', bgcolor: 'background.paper' }}>
                        <MarketplaceRightPanel
                            rightWidth={{ xs: "100%" }}
                            activeTab="details"
                            onTabChange={setRightTab}
                            hideTabs
                            selectedListingId={selectedListingId}
                            user={resolvedUser}
                            onRequireAuth={openLoginPopup}
                            onSelectListing={handleSelectListing}
                            onClearSelection={handleClearSelection}
                            onFavorite={handleFavorite}
                            onRepost={handleRepost}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onMarkSold={handleMarkSold}
                            onRelist={handleRelist}
                            onFlag={handleFlag}
                            onSellerFilter={handleSellerFilter}
                            items={activeItems}
                            categoryCounts={categoryCounts}
                            activeCity={city}
                            activeCounty={county}
                            onSelectCategory={handleSelectCategory}
                            onSelectCondition={handleSelectCondition}
                            onSelectPriceModel={handleSelectPriceModel}
                            onSelectCity={handleSelectCity}
                            onSelectCounty={handleSelectCounty}
                            onSelectSort={handleSelectSort}
                            isMapLoading={isLoading || activeIsRefreshing}
                            focusListingId={focusListingId}
                            onFocusListingHandled={handleFocusListingHandled}
                            mapCenter={mapCenter}
                            mapZoom={mapZoom}
                        />
                    </Box>
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
                    <Box sx={(t) => ({
                        display: 'flex', alignItems: 'center', gap: 1, px: 0.5, py: 0.25, minHeight: 46,
                        borderBottom: activeFilterChips.length > 0 ? 'none' : '1px solid',
                        borderColor: alpha(t.palette.divider, 0.1), bgcolor: t.palette.background.paper, flexShrink: 0,
                    })}>
                        <IconButton onClick={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }} size="small" aria-label="Back" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>{isYardSalesTab ? "Yard Sales Map" : "Marketplace Map"}</Typography>
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

                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <MarketplaceRightPanel
                            rightWidth={{ xs: "100%" }}
                            activeTab="map" onTabChange={() => {}} hideTabs
                            selectedListingId={selectedListingId} user={resolvedUser}
                            onRequireAuth={openLoginPopup} onSelectListing={handleSelectListing}
                            onClearSelection={handleClearSelection} onFavorite={handleFavorite}
                            onRepost={handleRepost} onEdit={handleEdit} onDelete={handleDelete}
                            onMarkSold={handleMarkSold} onRelist={handleRelist} onFlag={handleFlag}
                            onSellerFilter={handleSellerFilter} items={activeItems}
                            categoryCounts={categoryCounts} activeCity={city} activeCounty={county}
                            onSelectCategory={handleSelectCategory} onSelectCondition={handleSelectCondition}
                            onSelectPriceModel={handleSelectPriceModel} onSelectCity={handleSelectCity}
                            onSelectCounty={handleSelectCounty} onSelectSort={handleSelectSort}
                            isMapLoading={isLoading || activeIsRefreshing}
                            focusListingId={focusListingId} onFocusListingHandled={handleFocusListingHandled}
                            mapCenter={mapCenter}
                            mapZoom={mapZoom}
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
                                placeholder={isYardSalesTab ? "Search yard sales…" : "Search marketplace…"}
                                value={isYardSalesTab ? yardSearchInput : searchInput}
                                onChange={(e) => { const v = e?.target?.value ?? ""; if (isYardSalesTab) setYardSearchInput(v); else setSearchInput(v); }}
                                inputProps={{ maxLength: 100, autoFocus: true }}
                                onSearch={() => { handleSearch(); setMobileMapFilterOpen(false); }}
                                onClear={() => { if (isYardSalesTab) { setYardSearchInput(""); setYardQuery(""); } else { setSearchInput(""); setQuery(""); } }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                            <MarketplaceFilters
                                mode={isYardSalesTab ? "yard-sales" : "marketplace"}
                                view={view} onViewChange={handleViewChange} hasMyListings={hasMyListings} isLoggedIn={canCreate}
                                category={isYardSalesTab ? "Yard Sales" : category} onCategoryChange={setCategory}
                                condition={isYardSalesTab ? "All" : condition} onConditionChange={setCondition}
                                sort={isYardSalesTab ? yardSort : sort} onSortChange={isYardSalesTab ? setYardSort : setSort}
                                status={isYardSalesTab ? "available" : status} onStatusChange={setStatus}
                                city={isYardSalesTab ? yardCity : city} onCityChange={isYardSalesTab ? setYardCity : setCity}
                                county={isYardSalesTab ? yardCounty : county} onCountyChange={isYardSalesTab ? setYardCounty : handleCountyChange}
                                radius={radius} onRadiusChange={setRadius}
                                categoryCounts={categoryCounts} categoryCountsLoading={categoryCountsLoading}
                                locationCounts={isYardSalesTab ? yardLocationCounts : locationCounts} showAdvancedFilters={true}
                                viewer={resolvedUser}
                                searchQuery={query}
                                onSearchQueryChange={handleSavedSearchChange}
                                onClearAll={handleClearAll}
                            />
                        </Box>
                        <Box sx={(t) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                            <Button onClick={handleClearAll} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}>Reset</Button>
                            <Button variant="contained" onClick={() => { handleSearch(); setMobileMapFilterOpen(false); }}
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
                            borderRadius: 0, overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: {} } }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                        <IconButton onClick={() => setMobileFilterDrawerOpen(false)} size="small" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                    </Box>

                    <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                        <SearchInput
                            placeholder={isYardSalesTab ? "Search yard sales…" : "Search marketplace…"}
                            value={isYardSalesTab ? yardSearchInput : searchInput}
                            onChange={(e) => {
                                const v = e?.target?.value ?? "";
                                if (isYardSalesTab) setYardSearchInput(v);
                                else setSearchInput(v);
                            }}
                            inputProps={{ maxLength: 100, autoFocus: true }}
                            onSearch={() => { handleSearch(); setMobileFilterDrawerOpen(false); }}
                            onClear={() => {
                                if (isYardSalesTab) { setYardSearchInput(""); setYardQuery(""); }
                                else { setSearchInput(""); setQuery(""); }
                            }}
                        />
                    </Box>

                    <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                        <MarketplaceFilters
                            mode={isYardSalesTab ? "yard-sales" : "marketplace"}
                            view={view} onViewChange={handleViewChange}
                            hasMyListings={hasMyListings}
                            isLoggedIn={canCreate}
                            category={isYardSalesTab ? "Yard Sales" : category} onCategoryChange={setCategory}
                            condition={isYardSalesTab ? "All" : condition} onConditionChange={setCondition}
                            sort={isYardSalesTab ? yardSort : sort} onSortChange={isYardSalesTab ? setYardSort : setSort}
                            status={isYardSalesTab ? "available" : status} onStatusChange={setStatus}
                            city={isYardSalesTab ? yardCity : city} onCityChange={isYardSalesTab ? setYardCity : setCity}
                            county={isYardSalesTab ? yardCounty : county} onCountyChange={isYardSalesTab ? setYardCounty : handleCountyChange}
                            radius={radius} onRadiusChange={setRadius}
                            categoryCounts={categoryCounts}
                            categoryCountsLoading={categoryCountsLoading}
                            locationCounts={isYardSalesTab ? yardLocationCounts : locationCounts}
                            showAdvancedFilters={true}
                            viewer={resolvedUser}
                            searchQuery={query}
                            onSearchQueryChange={handleSavedSearchChange}
                            onClearAll={handleClearAll}
                        />
                    </Box>

                    <Box
                        sx={(t) => ({
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: 1.5, px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider',
                            bgcolor: t.palette.background.paper, flexShrink: 0,
                        })}
                    >
                        <Button onClick={handleClearAll} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}>
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => { handleSearch(); setMobileFilterDrawerOpen(false); }}
                            sx={(t) => ({
                                borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 3, height: 42,
                                bgcolor: t.palette.primary.main, color: t.palette.common.white, boxShadow: 'none',
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' },
                            })}
                        >
                            Show Results
                        </Button>
                    </Box>
                </SwipeableBottomDrawer>
            )}

            {/* ──── Overlays ──── */}
            <MarketplaceOverlays
                user={resolvedUser}
                createOpen={createOpen}
                onCloseCreate={handleCloseCreate}
                onCreated={handleCreated}
                onUpdated={handleUpdated}
                editMode={editMode}
                editListingId={editListingId}
                editInitialListing={editInitialListing}
                forceYardSale={isYardSalesTab && !editMode}
                deleteOpen={deleteOpen}
                onCloseDelete={() => { setDeleteOpen(false); setDeleteTarget(null); }}
                onConfirmDelete={handleConfirmDelete}
                deleteTitle={deleteTarget?.title || ""}
            />

            {/* ──── Flag / Report dialog ──── */}
            <ReportDialog
                open={flagDialogOpen}
                onClose={() => { setFlagDialogOpen(false); setFlagTarget(null); }}
                onSubmit={handleFlagSubmit}
                title="Report Listing"
            />

            {/* Account switch dialog — shown when non-personal account taps Sell */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
                    <InfoOutlinedIcon color="primary" />
                    Personal account required
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ lineHeight: 1.5 }}>
                        Marketplace listings can only be created from a personal account. Please switch to your personal profile to sell an item or post a yard sale.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAccountSwitchOpen(false)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}>
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

            <SuccessSnackbar {...successSnackbarProps} />
        </Box>
    );
}
