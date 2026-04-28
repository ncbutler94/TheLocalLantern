import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import {Box, Button, Chip, CircularProgress, Divider, Drawer, Snackbar, Tooltip, useMediaQuery, Typography} from "@mui/material";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import TuneIcon from "@mui/icons-material/Tune";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import IconButton from "@mui/material/IconButton";
import SearchInput from "../../components/SearchInput";
// Continuous subheader scroll-hide (Facebook-style tracking)
import useSubheaderScrollHide from "../../utils/useSubheaderScrollHide";

import { secureFetch } from "../../utils/secureFetch";
import { topInsetSx } from "../../utils/safeArea";
import { useAuth } from "../../components/AuthModalContext";
import { useActiveAccount } from "../../components/AccountContext";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../components/Header/Header";
import EventsHeader from "./components/EventsHeader";
import EventsFilters from "./components/EventsFilters";
import EventsList from "./components/EventsList";
import EventsRightPanel from "./components/EventsRightPanel";
import EventDetailPanel from "./components/EventDetailPanel";
import SwipeableRightDrawer from "../../components/SwipeableRightDrawer";
import SwipeableBottomDrawer from "../../components/SwipeableBottomDrawer";
import EventsMapTab from "./components/EventsMapTab";
import CreateEditEventModal from "./modals/CreateEditEventModal";
import useEventsFeed from "./hooks/useEventsFeed";
import { fetchEventCategoryCounts, fetchEvents, fetchBatchFriendsGoing } from "./api/eventsApi";
import PulsingDots from "../../components/PulsingDots";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import useRateLimit from "../../utils/useRateLimit";
import RateLimitDialog from "../../components/RateLimitDialog";
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    getCountyCenter,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from "../../utils/geoRadius";

const RIGHT_WIDTH = { xs: "40%", lg: "35%" };

/* ── Session-storage helpers (mirrors BusinessHubPage pattern) ─── */
const EVENTS_HUB_STATE_KEY = "ll-events-hub-state";

function saveEventsHubState(state) {
    try {
        sessionStorage.setItem(EVENTS_HUB_STATE_KEY, JSON.stringify(state));
    } catch {
        // ignore
    }
}

function loadEventsHubState() {
    try {
        const raw = sessionStorage.getItem(EVENTS_HUB_STATE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearEventsHubState() {
    try {
        sessionStorage.removeItem(EVENTS_HUB_STATE_KEY);
    } catch {
        // ignore
    }
}

function locationPrioritySort(items, city, county) {
    const list = Array.isArray(items) ? items.slice() : [];
    const cityStr = String(city || "").trim().toLowerCase();
    const countyStr = String(county || "").trim().toLowerCase();

    if (!cityStr && !countyStr) return list;

    const scoreFor = (e) => {
        const scope = String(e?.locationScope || "").toLowerCase();
        const eCity = String(e?.city || "").trim().toLowerCase();
        const eCounty = String(e?.county || "").trim().toLowerCase();

        if (cityStr && eCity && eCity === cityStr) return 3;
        if (countyStr && eCounty && eCounty === countyStr) return 2;
        if (scope === "statewide") return 1;
        return 0;
    };

    return list
        .map((e, idx) => ({ e, idx, s: scoreFor(e) }))
        .sort((a, b) => (b.s - a.s) || (a.idx - b.idx))
        .map((x) => x.e);
}

export default function EventsPage({ user }) {

    // Some routes may not pass the user prop even when the user is authenticated.
    // Fall back to /users/profile so Create/Edit modals work consistently.
    const [resolvedUser, setResolvedUser] = useState(user || null);

    useEffect(() => {
        if (user) setResolvedUser(user);
    }, [user]);

    useEffect(() => {
        let isMounted = true;

        const loadMe = async () => {
            if (user) return;
            try {
                const res = await secureFetch('/users/profile', { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json();
                if (!isMounted) return;
                if (data && (data.id || data.user_id)) setResolvedUser(data);
            } catch (e) {
                // ignore - page can still be browsed without auth
            }
        };

        loadMe();

        return () => {
            isMounted = false;
        };
    }, [user]);

    const { openLoginPopup } = useAuth();
    const { activeAccountType, activeAccount } = useActiveAccount();
    const accountKey = `${activeAccountType || 'personal'}-${activeAccount?.id || 0}`;

    const location = useLocation();
    const navigate = useNavigate();
    const navType = useNavigationType();

    // ── Listen for auth:token-expired from secureFetch / axiosInstance ──
    useEffect(() => {
        const handleTokenExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    const isMdUp = useMediaQuery("(min-width:1440px)");
    // Phone-only: matches the global header's <md breakpoint where the bottom nav appears.
    // Below this, the compact phone header (pill tabs + tiny icon cluster) is used as-is.
    const isPhoneEvents = useMediaQuery("(max-width:899px)");
    // Tablet/laptop range (900–1439): header menu moved to the top but we're still below
    // the ≥1440 breakpoint where EventsHeader + the inline filter bar appear. In this range
    // we promote the search bar + labeled Filters / Map / Calendar / Create Event buttons
    // so the tools don't hide in a cramped icon cluster. Mirrors Community/Business treatment.
    const isTabletEvents = !isMdUp && !isPhoneEvents;
    // Narrow end of tablet (900–1099): Filters / Map / Calendar / Create Event collapse
    // to icons to keep the toolbar on one row.
    const isNarrowTabletEvents = useMediaQuery("(min-width:900px) and (max-width:1099px)");

    // ── Restore saved state from sessionStorage (populated before navigating away) ──
    const isPopNavigation = navType === "POP";
    const [restored] = useState(() => {
        const saved = loadEventsHubState();
        if (!saved) return null;
        if (saved.accountKey && saved.accountKey !== `${activeAccountType || 'personal'}-${activeAccount?.id || 0}`) return null;
        return saved;
    });

    // ── Snackbar for moderation redirect from EventPostPage ──
    const [moderationSnack, setModerationSnack] = useState("");

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // Pick up event-deleted flag from EventPostPage navigation
    const eventDeletedOnMount = useRef(false);
    useEffect(() => {
        try {
            if (sessionStorage.getItem('ll:events:eventDeletedSuccess') === '1') {
                sessionStorage.removeItem('ll:events:eventDeletedSuccess');
                sessionStorage.removeItem(EVENTS_HUB_STATE_KEY);
                eventDeletedOnMount.current = true;
                showSuccess('Event deleted successfully');
            }
        } catch {}
    }, [showSuccess]);

    useEffect(() => {
        if (location?.state?.moderationRedirect) {
            const reason = location?.state?.reason;
            if (reason === 'blocked') {
                setModerationSnack("That event is by a user you have blocked.");
            } else if (reason === 'hidden') {
                setModerationSnack("That event is by a user whose posts you have hidden.");
            }
            // Clear the state so it doesn't re-trigger on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    // ── Global moderation state: blocked & hidden user IDs for the active account ──
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [hiddenUserIds, setHiddenUserIds] = useState(() => new Set());
    // Entity-specific sets — block/hide only a specific business or artist, not all accounts
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [hiddenBusinessIds, setHiddenBusinessIds] = useState(() => new Set());
    const [hiddenArtistIds, setHiddenArtistIds] = useState(() => new Set());

    // Fetch moderation state on mount and when active account changes
    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || !active) return;
                const data = await res.json();

                const blocked = Array.isArray(data?.blocked_user_ids)
                    ? new Set(data.blocked_user_ids.map(Number).filter(Number.isFinite))
                    : new Set();
                const hidden = Array.isArray(data?.hidden_post_user_ids)
                    ? new Set(data.hidden_post_user_ids.map(Number).filter(Number.isFinite))
                    : new Set();

                // Entity-specific IDs
                const blockedBiz = Array.isArray(data?.blocked_business_ids)
                    ? new Set(data.blocked_business_ids.map(Number).filter(Number.isFinite))
                    : new Set();
                const blockedArt = Array.isArray(data?.blocked_artist_ids)
                    ? new Set(data.blocked_artist_ids.map(Number).filter(Number.isFinite))
                    : new Set();
                const hiddenBiz = Array.isArray(data?.hidden_post_business_ids)
                    ? new Set(data.hidden_post_business_ids.map(Number).filter(Number.isFinite))
                    : new Set();
                const hiddenArt = Array.isArray(data?.hidden_post_artist_ids)
                    ? new Set(data.hidden_post_artist_ids.map(Number).filter(Number.isFinite))
                    : new Set();

                if (active) {
                    setBlockedUserIds(blocked);
                    setHiddenUserIds(hidden);
                    setBlockedBusinessIds(blockedBiz);
                    setBlockedArtistIds(blockedArt);
                    setHiddenBusinessIds(hiddenBiz);
                    setHiddenArtistIds(hiddenArt);
                }
            } catch {
                // Non-critical — events still display without filtering
            }
        })();

        return () => { active = false; };
    }, [accountKey]);

    // Also update in real-time when user hides/blocks someone from a UserCardPopover
    const handleUserExcluded = useCallback((e) => {
        const userId = Number(e?.detail?.userId);
        if (!userId || !Number.isFinite(userId)) return;
        const targetType = String(e?.detail?.targetType || 'personal').toLowerCase();

        if (e.type === 'll:user:blocked-changed') {
            const blocked = Boolean(e?.detail?.blocked);
            if (targetType === 'business') {
                setBlockedBusinessIds((prev) => { const next = new Set(prev); if (blocked) next.add(userId); else next.delete(userId); return next; });
            } else if (targetType === 'artist') {
                setBlockedArtistIds((prev) => { const next = new Set(prev); if (blocked) next.add(userId); else next.delete(userId); return next; });
            } else {
                setBlockedUserIds((prev) => { const next = new Set(prev); if (blocked) next.add(userId); else next.delete(userId); return next; });
            }
        }
        if (e.type === 'll:user:hidden-changed') {
            const hidden = Boolean(e?.detail?.hidden);
            if (targetType === 'business') {
                setHiddenBusinessIds((prev) => { const next = new Set(prev); if (hidden) next.add(userId); else next.delete(userId); return next; });
            } else if (targetType === 'artist') {
                setHiddenArtistIds((prev) => { const next = new Set(prev); if (hidden) next.add(userId); else next.delete(userId); return next; });
            } else {
                setHiddenUserIds((prev) => { const next = new Set(prev); if (hidden) next.add(userId); else next.delete(userId); return next; });
            }
        }
    }, []);

    useEffect(() => {
        window.addEventListener('ll:user:hidden-changed', handleUserExcluded);
        window.addEventListener('ll:user:blocked-changed', handleUserExcluded);
        return () => {
            window.removeEventListener('ll:user:hidden-changed', handleUserExcluded);
            window.removeEventListener('ll:user:blocked-changed', handleUserExcluded);
        };
    }, [handleUserExcluded]);

    const [chromeTop, setChromeTop] = useState(0);
    const isBackNav = isPopNavigation || Boolean(location?.state?.fromEventPost);
    const [pageVisible, setPageVisible] = useState(() => isBackNav);

    const [query, setQuery] = useState(() => restored?.query || "");
    // committedQuery is the value that actually triggers API calls.
    // `query` is just the live text in the input — it does NOT trigger fetches.
    const [committedQuery, setCommittedQuery] = useState(() => restored?.query || "");
    const [view, setView] = useState(() => restored?.view || "all");
    const [city, setCity] = useState(() => restored?.city || "");
    const [county, setCounty] = useState(() => restored?.county || "");
    const [radius, setRadius] = useState(() => restored?.radius || STATEWIDE);
    const [category, setCategory] = useState(() => restored?.category || "");
    const [datePreset, setDatePreset] = useState(() => restored?.datePreset || "month");
    const [sort, setSort] = useState(() => restored?.sort || "soonest");

    // When switching to "past", auto-switch sort away from "Upcoming" (soonest)
    const handleDatePresetChange = useCallback((value) => {
        setDatePreset(value);
        if (value === "past" && sort === "soonest") {
            setSort("recent");
        }
        scrollEventsToTop();
    }, [sort]);

    // ── Scroll list back to top when any filter changes ──
    const scrollEventsToTop = useCallback(() => {
        requestAnimationFrame(() => {
            const el = document.querySelector("[data-events-scroll]");
            if (el) el.scrollTop = 0;
        });
    }, []);

    // Wrapper callbacks that scroll to top on filter change
    const handleViewChange = useCallback((v) => { setView(v); scrollEventsToTop(); }, [scrollEventsToTop]);
    const handleCityChange = useCallback((v) => { setCity(v); scrollEventsToTop(); }, [scrollEventsToTop]);
    const handleCountyChange = useCallback((v) => {
        setCounty(v);
        if (!v) setRadius(STATEWIDE);
        else setRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED);
        scrollEventsToTop();
    }, [scrollEventsToTop]);

    const handleRadiusChange = useCallback((v) => { setRadius(v); scrollEventsToTop(); }, [scrollEventsToTop]);

    // ── Radius expansion ──
    const expandedCounties = useMemo(
        () => countiesWithinRadius(county, radius),
        [county, radius]
    );

    // ── Map center/zoom — driven by county + radius selection ──
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

    const handleCategoryChange = useCallback((v) => { setCategory(v); scrollEventsToTop(); }, [scrollEventsToTop]);
    const handleSortChange = useCallback((v) => { setSort(v); scrollEventsToTop(); }, [scrollEventsToTop]);

    // When location filters change, clear overview-driven selections (category)
    const prevEvtLocationRef = useRef({
        city: restored?.city || "",
        county: restored?.county || "",
    });
    useEffect(() => {
        const prev = prevEvtLocationRef.current;
        if (prev.city !== city || prev.county !== county) {
            setCategory("");
        }
        prevEvtLocationRef.current = { city, county };
    }, [city, county]);

    // Custom date range from calendar
    const [customStartDate, setCustomStartDate] = useState(() => restored?.customStartDate || null);
    const [customEndDate, setCustomEndDate] = useState(() => restored?.customEndDate || null);
    const [selectedDates, setSelectedDates] = useState(() => restored?.selectedDates?.length ? restored.selectedDates : []);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate the county filter with the viewer's
    // home_county from their profile. Product decision (2026-04): fresh
    // loads should start statewide, and narrower defaults should be
    // opt-in via the "Apply automatically when I open this tab" checkbox
    // on a saved filter (see SavedFiltersMenu + EventsFilters' auto-apply
    // effect).
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!resolvedUser) return;
        appliedHomeDefaultRef.current = true;
    }, [resolvedUser]);

    const [showFilters, setShowFilters] = useState(() => {
        if (restored?.showFilters != null) return restored.showFilters;
        return !isMdUp ? false : true;
    });

    // ── Mobile: continuous subheader scroll-hide + filter drawer ──
    // The subheader translates with scroll via `useSubheaderScrollHide` (hook
    // call below, after `mobileView` is declared). No threshold state, no
    // maxHeight collapse.
    const mobileHeaderRef = useRef(null);
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

    // Note: Previously this page observed the body class `ll-mobile-nav-hidden`
    // to expand the container when the global nav hid on scroll. With the
    // continuous scroll-hide system (Header.jsx + `--ll-nav-offset`), the
    // global bars slide via transform and the container stays at its normal
    // size — no mid-scroll layout shift needed.

    // ── Mobile: inline discover view (like BusinessHubPage pattern) ──
    // 'list' = normal events list, 'discover' = inline discover content
    const [mobileView, setMobileView] = useState('list');

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used `useSubheaderScrollHide` to translateY the
    // subheader and reclaim its vertical space via negative margin-bottom —
    // which produced jerky content shifts as the bar moved and the feed
    // pulled up behind it. The subheader is now `position: sticky` under
    // the global header and fades via `opacity: calc(1 - var(--ll-nav-offset))`.
    // See Header.jsx — the same CSS var drives every piece of chrome so they
    // all fade together in lockstep.
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-events-scroll]',
        enabled: false,
    });

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll container reserves space via `padding-top: calc(header +
    // subheader)` so content doesn't sit under the floating chrome on
    // initial paint. ResizeObserver keeps the CSS var in sync with the
    // real height (filter chips, wrapping, etc.). Phone only.
    useLayoutEffect(() => {
        if (!isPhoneEvents) {
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
    }, [isPhoneEvents]);

    // ── Filters & data feed (must be before pull-to-refresh which references refresh) ──
    const includeStatewide = !city && !county;
    const isCustomWithNoDates = datePreset === "custom" && selectedDates.length === 0;

    const filters = useMemo(
        () => ({
            query: committedQuery,
            view,
            city,
            county,
            counties: expandedCounties,
            category,
            datePreset,
            sort,
            includeStatewide,
            start: datePreset === "custom" ? customStartDate : "",
            end: datePreset === "custom" ? customEndDate : "",
        }),
        [committedQuery, view, city, county, expandedCounties, category, datePreset, sort, customStartDate, customEndDate]
    );

    const {
        events,
        totalCount,
        isLoading,
        isRefreshing,
        isLoadingMore,
        error,
        hasMore,
        loadMore,
        refresh,
        locationCounts: eventLocationCounts,
    } = useEventsFeed({ filters });

    // ── Mobile pull-to-refresh ──────────────────────────────────────────
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartRef = useRef(null);
    const pullScrollRef = useRef(null);
    const PULL_THRESHOLD = 70;

    const handlePullTouchStart = useCallback((e) => {
        if (isMdUp || pullRefreshing) return;
        const el = e.currentTarget;
        if (el.scrollTop > 5) { pullStartRef.current = null; return; }
        pullStartRef.current = e.touches[0].clientY;
        pullScrollRef.current = el;
    }, [isMdUp, pullRefreshing]);

    const handlePullTouchMove = useCallback((e) => {
        if (isMdUp || pullRefreshing || pullStartRef.current == null) return;
        const el = pullScrollRef.current;
        if (el && el.scrollTop > 5) { pullStartRef.current = null; setPullDistance(0); return; }
        const dy = e.touches[0].clientY - pullStartRef.current;
        if (dy > 0) {
            setPullDistance(Math.min(dy * 0.45, 120));
        } else {
            setPullDistance(0);
        }
    }, [isMdUp, pullRefreshing]);

    const handlePullTouchEnd = useCallback(() => {
        if (isMdUp || pullRefreshing) return;
        if (pullDistance >= PULL_THRESHOLD) {
            setPullRefreshing(true);
            setPullDistance(0);
            refresh();
            setTimeout(() => setPullRefreshing(false), 1200);
        } else {
            setPullDistance(0);
        }
        pullStartRef.current = null;
    }, [isMdUp, pullRefreshing, pullDistance, refresh]);

    // Active filter chips for mobile — removable inline chips (mirrors CommunityPanel)
    const activeFilterChips = useMemo(() => {
        const chips = [];
        // Show applied search term as a removable chip
        const appliedTerm = String(committedQuery || "").trim();
        if (appliedTerm) {
            const truncated = appliedTerm.length > 24 ? appliedTerm.slice(0, 24) + "…" : appliedTerm;
            chips.push({
                key: "search",
                label: `"${truncated}"`,
                onRemove: () => {
                    setQuery("");
                    setCommittedQuery("");
                },
            });
        }
        if (category) chips.push({ key: "category", label: category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => handleCategoryChange("") });
        if (city) chips.push({ key: "city", label: city, onRemove: () => handleCityChange("") });
        if (county) chips.push({ key: "county", label: `${county} County`, onRemove: () => handleCountyChange("") });
        if (county && !isCountyOnly(radius)) chips.push({ key: "radius", label: radiusLabel(radius), onRemove: () => setRadius(DEFAULT_RADIUS_WHEN_COUNTY_SELECTED) });
        if (view && view !== "all") chips.push({ key: "view", label: view.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => handleViewChange("all") });
        if (sort && sort !== "soonest") chips.push({ key: "sort", label: `Sort: ${sort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => handleSortChange("soonest") });
        if (datePreset && datePreset !== "month") chips.push({ key: "datePreset", label: datePreset === "custom" && selectedDates.length > 0 ? `${selectedDates.length} Dates` : datePreset.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => { handleDatePresetChange("month"); } });
        return chips;
    }, [committedQuery, category, city, county, radius, view, sort, datePreset, selectedDates]);

    const [createOpen, setCreateOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailOrigin, setDetailOrigin] = useState(null); // 'calendar' | 'map' | null
    const [mobileMapOpen, setMobileMapOpen] = useState(false);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);
    const [skipMapTransition, setSkipMapTransition] = useState(false);
    const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);

    // ── Close mobile drawers on browser back button ──
    useEffect(() => {
        if (!detailOpen) return;
        window.history.pushState({ eventDetail: true }, '');
        const handlePopState = () => { setDetailOpen(false); setDetailOrigin(null); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [detailOpen]);

    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ eventMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);

    useEffect(() => {
        if (!mobileCalendarOpen) return;
        window.history.pushState({ eventCalendar: true }, '');
        const handlePopState = () => setMobileCalendarOpen(false);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileCalendarOpen]);
    const [selectedEvent, setSelectedEvent] = useState(() => restored?.selectedEvent || null);
    const [rightTab, setRightTab] = useState(() => restored?.rightTab || "discover");
    const [focusEventId, setFocusEventId] = useState(null);
    const [focusCommentInput, setFocusCommentInput] = useState(false);
    const [hoveredEventId, setHoveredEventId] = useState(null);

    // Category counts for the filter dropdown
    const [categoryCounts, setCategoryCounts] = useState(() => restored?.categoryCounts || {});
    const [categoryCountsLoading, setCategoryCountsLoading] = useState(false);

    // Fetch category counts when filter criteria change (but NOT when category changes)
    useEffect(() => {
        // If custom date is selected but no dates chosen, don't fetch - show zeros
        if (isCustomWithNoDates) {
            setCategoryCounts({});
            setCategoryCountsLoading(false);
            return;
        }

        let isMounted = true;

        const loadCounts = async () => {
            setCategoryCountsLoading(true);
            try {
                const params = {
                    q: committedQuery || undefined,
                    city: city || undefined,
                    county: county || undefined,
                    range: datePreset || "month",
                    view: view || "all",
                    includeStatewide: includeStatewide ? "1" : "0",
                };

                // Add custom date range if applicable
                if (datePreset === "custom" && customStartDate) {
                    params.start = customStartDate;
                }
                if (datePreset === "custom" && customEndDate) {
                    params.end = customEndDate;
                }

                // Remove undefined values
                Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

                const data = await fetchEventCategoryCounts(params);
                if (!isMounted) return;
                setCategoryCounts(data?.counts || {});
            } catch (err) {
                if (!isMounted) return;
                setCategoryCounts({});
            } finally {
                if (isMounted) setCategoryCountsLoading(false);
            }
        };

        loadCounts();

        return () => {
            isMounted = false;
        };
    }, [committedQuery, city, county, datePreset, view, includeStatewide, isCustomWithNoDates, customStartDate, customEndDate]);

    // All events (unfiltered by category — drives overview panel stats)
    const [allEvents, setAllEvents] = useState([]);

    useEffect(() => {
        if (isCustomWithNoDates) {
            setAllEvents([]);
            return;
        }

        let isMounted = true;

        const loadAllEvents = async () => {
            try {
                const params = {
                    q: committedQuery || undefined,
                    city: city || undefined,
                    county: county || undefined,
                    range: datePreset || "month",
                    sort: sort || "soonest",
                    view: view || "all",
                    includeStatewide: includeStatewide ? "1" : "0",
                    limit: 200,
                };
                if (datePreset === "custom" && customStartDate) params.start = customStartDate;
                if (datePreset === "custom" && customEndDate) params.end = customEndDate;
                Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);

                const data = await fetchEvents(params);
                if (!isMounted) return;
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.events) ? data.events : Array.isArray(data) ? data : [];
                setAllEvents(items);
            } catch {
                if (isMounted) setAllEvents([]);
            }
        };

        loadAllEvents();

        return () => { isMounted = false; };
    }, [committedQuery, city, county, datePreset, sort, view, includeStatewide, isCustomWithNoDates, customStartDate, customEndDate]);

    const canCreate = Boolean(resolvedUser && (resolvedUser.id || resolvedUser.user_id));

    /* ---------- event creation rate limiting ---------- */
    const { checkLimit: checkEventLimit, recordAction: recordEventCreate } = useRateLimit('event-create', {
        burstMax: 3,
        burstWindowMs: 120_000,   // 3 events per 2 minutes
        maxPerHour: 10,           // 10 events per hour
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'event creation',
    });

    // Serialized keys for Set-based deps — prevents useMemo from re-running
    // when Sets are replaced with referentially-new but value-identical instances.
    const blockedKey = useMemo(() => [...blockedUserIds].sort().join(","), [blockedUserIds]);
    const hiddenKey = useMemo(() => [...hiddenUserIds].sort().join(","), [hiddenUserIds]);
    const blockedBizKey = useMemo(() => [...blockedBusinessIds].sort().join(","), [blockedBusinessIds]);
    const blockedArtKey = useMemo(() => [...blockedArtistIds].sort().join(","), [blockedArtistIds]);
    const hiddenBizKey = useMemo(() => [...hiddenBusinessIds].sort().join(","), [hiddenBusinessIds]);
    const hiddenArtKey = useMemo(() => [...hiddenArtistIds].sort().join(","), [hiddenArtistIds]);

    // Filter out events from blocked/hidden users entirely so they never appear in the feed.
    // Track how many were removed so we can adjust the displayed total count.
    const { displayEvents, filteredOutCount } = useMemo(() => {
        if (isCustomWithNoDates) {
            return { displayEvents: [], filteredOutCount: 0 };
        }
        const sorted = locationPrioritySort(events, city, county);
        const hasAnyFilter = blockedUserIds.size > 0 || hiddenUserIds.size > 0 ||
            blockedBusinessIds.size > 0 || blockedArtistIds.size > 0 ||
            hiddenBusinessIds.size > 0 || hiddenArtistIds.size > 0;
        if (!hasAnyFilter) {
            return { displayEvents: sorted, filteredOutCount: 0 };
        }

        let removed = 0;
        const visible = sorted.filter((evt) => {
            const evtBizId = Number(evt?.businessAccountId || 0);
            const evtArtId = Number(evt?.artistAccountId || 0);

            // Check entity-specific blocks/hides first
            if (evtBizId > 0) {
                if (blockedBusinessIds.has(evtBizId) || hiddenBusinessIds.has(evtBizId)) {
                    removed += 1;
                    return false;
                }
            }
            if (evtArtId > 0) {
                if (blockedArtistIds.has(evtArtId) || hiddenArtistIds.has(evtArtId)) {
                    removed += 1;
                    return false;
                }
            }

            // Personal block/hide — only apply if the event is NOT from a business or artist
            const orgId = Number(
                evt?.organizer?.id || evt?.organizer?.user_id ||
                evt?.organizerId || evt?.organizer_id || evt?.user_id || 0
            );
            if (orgId && evtBizId <= 0 && evtArtId <= 0) {
                if (blockedUserIds.has(orgId) || hiddenUserIds.has(orgId)) {
                    removed += 1;
                    return false;
                }
            }
            return true;
        });
        return { displayEvents: visible, filteredOutCount: removed };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, city, county, isCustomWithNoDates, blockedKey, hiddenKey, blockedBizKey, blockedArtKey, hiddenBizKey, hiddenArtKey]);

    // Compute display total - 0 when custom with no dates.
    // When blocked/hidden filtering is active, we can't reliably adjust the server total
    // (it changes as pages load), so we pass the raw total to EventsList (only used for
    // empty-state check) and handle the status bar text separately below.
    const displayTotalCount = isCustomWithNoDates ? 0 : totalCount;
    const hasBlockedFiltering = filteredOutCount > 0;

    // ── Batch friends-going: fetch for ALL visible events at once ──
    // Cards won't render until this completes, so PulsingDots shows instead.
    const [friendsGoingMap, setFriendsGoingMap] = useState({});
    const [friendsDataReady, setFriendsDataReady] = useState(false);
    const friendsBatchRef = useRef(0);

    // Derive a stable key from the SET of event IDs (sorted) so that
    // re-ordering the same events (e.g. changing sort) doesn't re-fetch.
    const displayEventIds = useMemo(
        () => displayEvents.map((e) => e.id || e.event_id).filter(Boolean),
        [displayEvents]
    );
    const displayEventIdSetKey = useMemo(
        () => [...displayEventIds].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)).join(","),
        [displayEventIds]
    );

    useEffect(() => {
        // No events yet or still loading — not ready
        if (displayEventIds.length === 0) {
            setFriendsDataReady(false);
            setFriendsGoingMap({});
            return;
        }

        // No logged-in user — skip friends fetch, mark ready immediately
        const viewerId = resolvedUser?.id || resolvedUser?.user_id;
        if (!viewerId) {
            setFriendsDataReady(true);
            setFriendsGoingMap({});
            return;
        }

        const batchId = ++friendsBatchRef.current;
        setFriendsDataReady(false);

        const ids = displayEventIds.slice(0, 50); // cap to avoid too many parallel requests

        fetchBatchFriendsGoing(ids)
            .then((map) => {
                if (friendsBatchRef.current !== batchId) return;
                setFriendsGoingMap(map || {});
                setFriendsDataReady(true);
            })
            .catch(() => {
                if (friendsBatchRef.current !== batchId) return;
                setFriendsGoingMap({});
                setFriendsDataReady(true);
            });
    }, [displayEventIdSetKey, resolvedUser, accountKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // The feed is fully ready when events have loaded AND friends data is fetched
    const feedFullyReady = !isLoading && !isRefreshing && displayEvents.length > 0 && friendsDataReady;

    // Auto-load more pages when most loaded events were from blocked/hidden users,
    // leaving few visible results while the server still has more pages available.
    useEffect(() => {
        if (
            hasMore &&
            !isLoading &&
            !isRefreshing &&
            !isLoadingMore &&
            filteredOutCount > 0 &&
            displayEvents.length < 6 &&
            events.length > 0
        ) {
            loadMore();
        }
    }, [hasMore, isLoading, isRefreshing, isLoadingMore, filteredOutCount, displayEvents.length, events.length, loadMore]);

    // ── Persist hub state to sessionStorage so back-navigation can restore it ──
    useEffect(() => {
        const scrollEl = document.querySelector("[data-events-scroll]");
        const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
        saveEventsHubState({
            query: committedQuery,
            view,
            city,
            county,
            radius,
            category,
            datePreset,
            sort,
            customStartDate,
            customEndDate,
            selectedDates,
            showFilters,
            selectedEvent,
            rightTab,
            categoryCounts,
            scrollTop,
            accountKey,
        });
    }, [committedQuery, view, city, county, category, datePreset, sort, customStartDate, customEndDate, selectedDates, showFilters, selectedEvent, rightTab, categoryCounts, accountKey]);

    // Also save scroll position on scroll so it's captured even between state changes
    useEffect(() => {
        const el = document.querySelector("[data-events-scroll]");
        if (!el) return;
        let rafId = null;
        const onScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                try {
                    const raw = sessionStorage.getItem(EVENTS_HUB_STATE_KEY);
                    if (raw) {
                        const state = JSON.parse(raw);
                        state.scrollTop = el.scrollTop;
                        sessionStorage.setItem(EVENTS_HUB_STATE_KEY, JSON.stringify(state));
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
    }, [isLoading]); // re-attach when loading changes (scroll element may remount)

    // Restore scroll position after first render with restored data (only on back navigation).
    // Phase 1: try immediately on mount (works if data is already cached / synchronous).
    // Phase 2: try again once displayEvents arrive from the hook re-fetch.
    const restoredScrollRef = useRef(isPopNavigation ? (restored?.scrollTop ?? null) : null);
    const scrollRestoredRef = useRef(false);

    useEffect(() => {
        if (restoredScrollRef.current != null && !scrollRestoredRef.current) {
            const scrollTop = restoredScrollRef.current;
            // Wait for DOM to render the restored items, then restore scroll
            requestAnimationFrame(() => {
                const el = document.querySelector("[data-events-scroll]");
                if (el && el.scrollHeight > el.clientHeight) {
                    el.scrollTop = scrollTop;
                    scrollRestoredRef.current = true;
                    restoredScrollRef.current = null;
                }
            });
        } else if (!isPopNavigation) {
            // Fresh navigation — scroll to top
            requestAnimationFrame(() => {
                const el = document.querySelector("[data-events-scroll]");
                if (el) el.scrollTop = 0;
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Phase 2: once hook data arrives, restore scroll if Phase 1 didn't succeed
    useEffect(() => {
        if (restoredScrollRef.current == null || scrollRestoredRef.current) return;
        if (!displayEvents.length) return;
        const scrollTop = restoredScrollRef.current;
        // Double-rAF ensures React has finished painting the new cards
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = document.querySelector("[data-events-scroll]");
                if (el) {
                    el.scrollTop = scrollTop;
                    scrollRestoredRef.current = true;
                    restoredScrollRef.current = null;
                }
            });
        });
    }, [displayEvents.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear restored state after initial mount so subsequent navigations are fresh
    useEffect(() => {
        if (restored) clearEventsHubState();
    }, [restored]);

    // ── Restore selected event when returning from EventPostPage ──
    // Handles both POP (browser back) and PUSH (navigate("/events")) returns.
    const eventReturnRestoredRef = useRef(false);
    useEffect(() => {
        if (eventReturnRestoredRef.current) return;
        let savedId;
        try {
            savedId = sessionStorage.getItem("ll:events:returnEventId");
        } catch { /* ignore */ }
        if (!savedId) return;
        // Wait until events have loaded before consuming the flag
        if (isLoading || displayEvents.length === 0) return;
        // Now that data is ready, consume the flag and restore
        eventReturnRestoredRef.current = true;
        try { sessionStorage.removeItem("ll:events:returnEventId"); } catch { /* ignore */ }
        // If we already have a selectedEvent from POP restore, skip
        if (selectedEvent) return;
        const match = displayEvents.find((e) => String(e.id || e.event_id) === savedId);
        if (match) {
            setSelectedEvent(match);
            setRightTab("details");
        }
    }, [isLoading, displayEvents, selectedEvent]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        const STYLE_ID = 'll-events-noshift-style';
        const BODY_CLASS = 'll-events-fixed-layout';

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.type = 'text/css';
            styleEl.appendChild(
                document.createTextNode(
                    `
                    body.${BODY_CLASS} {
                      padding-right: var(--ll-events-scrollbar-comp, 0px) !important;
                      overflow: hidden !important;
                    }
                    html.${BODY_CLASS} {
                      padding-right: var(--ll-events-scrollbar-comp, 0px) !important;
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
        const prevCssVarBody = body.style.getPropertyValue('--ll-events-scrollbar-comp');
        const prevCssVarHtml = html.style.getPropertyValue('--ll-events-scrollbar-comp');

        const scrollbarWidth = window.innerWidth - html.clientWidth;
        const comp = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0px';

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        html.style.setProperty('--ll-events-scrollbar-comp', comp);
        body.style.setProperty('--ll-events-scrollbar-comp', comp);

        html.style.paddingRight = comp;
        body.style.paddingRight = comp;

        const measure = () => {
            const header =
                document.querySelector("header.MuiAppBar-root") ||
                document.querySelector("header") ||
                document.querySelector(".site-header") ||
                document.getElementById("header") ||
                null;

            const headerBottom = header ? header.getBoundingClientRect().bottom : 0;

            // When no header is rendered (e.g. fullscreen mobile pages
            // that hide the AppBar), fall back to the iOS safe-area
            // inset so floating subheaders / back buttons don't end up
            // jammed under the status bar / notch. Reads env() via a
            // temporary hidden probe since CSS env() values aren't
            // directly accessible from JS.
            let safeAreaInset = 0;
            if (headerBottom === 0) {
                const probe = document.createElement("div");
                probe.style.cssText =
                    "position:fixed;top:-100px;left:0;width:1px;height:1px;" +
                    "padding-top:env(safe-area-inset-top, 0px);" +
                    "visibility:hidden;pointer-events:none;";
                document.body.appendChild(probe);
                try {
                    safeAreaInset = parseFloat(getComputedStyle(probe).paddingTop) || 0;
                } finally {
                    document.body.removeChild(probe);
                }
            }

            setChromeTop(Math.max(headerBottom, safeAreaInset));
        };

        measure();

        let raf2 = null;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(measure);
        });

        window.addEventListener("resize", measure);

        return () => {
            window.removeEventListener("resize", measure);
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);

            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;

            if (prevCssVarHtml) html.style.setProperty('--ll-events-scrollbar-comp', prevCssVarHtml);
            else html.style.removeProperty('--ll-events-scrollbar-comp');

            if (prevCssVarBody) body.style.setProperty('--ll-events-scrollbar-comp', prevCssVarBody);
            else body.style.removeProperty('--ll-events-scrollbar-comp');

            body.classList.remove(BODY_CLASS);
            html.classList.remove(BODY_CLASS);
        };
    }, []);

    // ── Ref for current filter values so callbacks don't need state deps ──
    const filtersRef = useRef({ query: committedQuery, city, county, datePreset, view, sort, includeStatewide, customStartDate, customEndDate });
    filtersRef.current = { query: committedQuery, city, county, datePreset, view, sort, includeStatewide, customStartDate, customEndDate };

    const refreshCategoryCounts = useCallback(async () => {
        const f = filtersRef.current;
        try {
            const params = {
                q: f.query || undefined,
                city: f.city || undefined,
                county: f.county || undefined,
                range: f.datePreset || "month",
                view: f.view || "all",
                includeStatewide: f.includeStatewide ? "1" : "0",
            };
            if (f.datePreset === "custom" && f.customStartDate) params.start = f.customStartDate;
            if (f.datePreset === "custom" && f.customEndDate) params.end = f.customEndDate;
            Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
            const data = await fetchEventCategoryCounts(params);
            setCategoryCounts(data?.counts || {});
        } catch {
            // ignore
        }
    }, []);

    const handleOpenCreate = useCallback(() => {
        if (!canCreate) {
            openLoginPopup();
            return;
        }
        const result = checkEventLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'event creation' });
            setRateLimitOpen(true);
            return;
        }
        setEditingEvent(null);
        setCreateOpen(true);
    }, [canCreate, openLoginPopup, checkEventLimit]);

    const handleCloseCreate = useCallback(() => {
        setCreateOpen(false);
        setEditingEvent(null);
    }, []);

    // ── Listen for create actions from the global Header create (+) menu ──
    const handleOpenCreateRef = useRef(handleOpenCreate);
    handleOpenCreateRef.current = handleOpenCreate;

    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};
            if (action !== 'event') return;

            if (blocked === 'rateLimit') {
                setRateLimitInfo({ retryAfterSec: retryAfterSec || 10, reason: reason || 'cooldown', actionLabel: 'event creation' });
                setRateLimitOpen(true);
                return;
            }

            handleOpenCreateRef.current();
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => window.removeEventListener('ll:header:create', handleHeaderCreate);
    }, []);

    const handleSelectEvent = useCallback((evt) => {
        if (!evt) return;
        const eventId = evt.id || evt.event_id;

        if (isMdUp) {
            setSelectedEvent(evt);
            setRightTab("details");
            setDetailOpen(false);
            return;
        }

        // Mobile: open fullscreen detail drawer (matches map/calendar drawer pattern)
        setSelectedEvent(evt);
        setDetailOpen(true);
    }, [isMdUp]);

    const handleCloseDetail = useCallback(() => {
        setDetailOpen(false);
        setFocusCommentInput(false);
        setDetailOrigin(null);

        if (!isMdUp) {
            setSelectedEvent(null);
        }
    }, [isMdUp]);

    const handleClearSelection = useCallback(() => {
        setSelectedEvent(null);
        setRightTab("discover");
    }, []);

    const handleLocationClick = useCallback((evt) => {
        if (!evt) return;
        const id = String(evt.id || evt.event_id || "");

        if (!isMdUp) {
            // Mobile — open the map drawer, then focus after animation
            if (mobileMapOpen) {
                // Drawer already open — fly immediately
                setFocusEventId(id);
            } else {
                setMobileMapOpen(true);
                setTimeout(() => {
                    setFocusEventId(id);
                }, 380);
            }
        } else {
            // Desktop — switch to map tab in right panel
            setRightTab("map");
            setFocusEventId(id);
        }
    }, [isMdUp, mobileMapOpen]);

    const handleCommentEvent = useCallback((evt) => {
        if (!evt) return;
        const eventId = evt.id || evt.event_id;

        if (isMdUp) {
            setSelectedEvent(evt);
            setFocusCommentInput(true);
            setRightTab("details");
        } else {
            // Mobile: open fullscreen detail drawer with comment focus
            setSelectedEvent(evt);
            setFocusCommentInput(true);
            setDetailOpen(true);
        }
    }, [isMdUp]);

    const handleClearAll = useCallback(() => {
        setQuery("");
        setCommittedQuery("");
        setView("all");
        setCity("");
        setCounty("");
        setRadius(STATEWIDE);
        setCategory("");
        setDatePreset("month");
        setSort("soonest");
        setCustomStartDate(null);
        setCustomEndDate(null);
        setSelectedDates([]);
        refresh();
        scrollEventsToTop();
    }, [refresh, scrollEventsToTop]);

    // Saved filters restore: update BOTH the input (query) and the
    // applied term (committedQuery) so the input reflects the term AND
    // the fetch re-runs with it. Called by EventsFilters' apply handler.
    const handleSavedSearchQueryChange = useCallback((val) => {
        const next = String(val || "");
        setQuery(next);
        setCommittedQuery(next);
    }, []);

    const handleSearch = useCallback(() => {
        setCommittedQuery(query);
        scrollEventsToTop();
    }, [query, scrollEventsToTop]);

    const handleToggleFilters = useCallback(() => {
        setShowFilters((v) => !v);
    }, []);

    // Called from Discover panel when user clicks a category row
    const handleSelectCategory = useCallback((cat) => {
        setCategory(cat || "");
        scrollEventsToTop();
    }, [scrollEventsToTop]);

    const handleDatesChange = useCallback((dates, start, end) => {
        setSelectedDates(dates || []);
        setCustomStartDate(start || null);
        setCustomEndDate(end || null);

        // Auto-switch to custom preset when dates are selected
        if (dates && dates.length > 0) {
            setDatePreset("custom");
        }
    }, []);

    // Called when user clicks "Search" in the calendar panel
    const handleSearchDates = useCallback(() => {
        // Close the mobile calendar drawer if open
        setMobileCalendarOpen(false);
        scrollEventsToTop();
    }, [scrollEventsToTop]);

    const handleSaved = useCallback(() => {
        const wasEditing = Boolean(editingEvent);
        if (!wasEditing) recordEventCreate();
        setCreateOpen(false);
        setEditingEvent(null);
        refresh();
        refreshCategoryCounts();
        // Only show success for creates here — edits fire ll:event:edited which handles the message
        if (!wasEditing) {
            showSuccess('Event created successfully');
        }
    }, [refresh, refreshCategoryCounts, editingEvent, showSuccess]);

    // Handle edit event from EventCard
    const handleEditEvent = useCallback((evt) => {
        if (!canCreate) {
            openLoginPopup();
            return;
        }
        setEditingEvent(evt);
        setCreateOpen(true);
    }, [canCreate, openLoginPopup]);

    // Handle delete event from EventCard
    const handleDeleteEvent = useCallback((eventId) => {
        // If the deleted event is currently selected, clear selection
        setSelectedEvent((prev) => {
            if (prev && (prev.id === eventId || prev.event_id === eventId)) {
                setRightTab("discover");
                return null;
            }
            return prev;
        });
        // Refresh the list
        refresh();
        refreshCategoryCounts();
        showSuccess('Event deleted successfully');
    }, [refresh, refreshCategoryCounts, showSuccess]);

    // Handle refresh from EventCard (after edit/delete)
    const handleRefresh = useCallback(() => {
        refresh();
    }, [refresh]);

    // Listen for custom events dispatched by EventDetailPanel / EventPostPage
    useEffect(() => {
        const onDeleted = (e) => {
            const delId = e?.detail?.eventId ?? null;
            if (delId != null) {
                setSelectedEvent((prev) => {
                    if (prev && (String(prev.id) === String(delId) || String(prev.event_id) === String(delId))) {
                        setRightTab("discover");
                        return null;
                    }
                    return prev;
                });
            }
            refresh();
            refreshCategoryCounts();
            showSuccess('Event deleted successfully');
        };

        const onEditRequest = (e) => {
            const evt = e?.detail?.event;
            if (evt && (evt.id || evt.event_id)) {
                setEditingEvent(evt);
                setCreateOpen(true);
            }
        };

        const onEdited = () => {
            refresh();
            refreshCategoryCounts();
            showSuccess('Event updated successfully');
        };

        // If we arrived here after an event was deleted from EventPostPage, force refresh
        if (eventDeletedOnMount.current) {
            eventDeletedOnMount.current = false;
            refresh();
            refreshCategoryCounts();
        }

        window.addEventListener('ll:event:deleted', onDeleted);
        window.addEventListener('ll:event:edit-request', onEditRequest);
        window.addEventListener('ll:event:edited', onEdited);
        return () => {
            window.removeEventListener('ll:event:deleted', onDeleted);
            window.removeEventListener('ll:event:edit-request', onEditRequest);
            window.removeEventListener('ll:event:edited', onEdited);
        };
    }, [refresh, refreshCategoryCounts, showSuccess]);

    const handleHoverEvent = useCallback((id) => {
        setHoveredEventId(id);
    }, []);

    return (
        <Box
            sx={{
                position: "fixed",
                // Track global nav offset so the container expands to fill the
                // viewport as the app bar + bottom nav slide away. Mirrors
                // CommunityPage so the floating subheader (Events pill + search)
                // fades in lockstep with the AppBar via `--ll-nav-offset`.
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
                transition: [
                    "opacity 280ms cubic-bezier(.2,.8,.2,1)",
                    "transform 280ms cubic-bezier(.2,.8,.2,1)",
                ].join(", "),
            }}
        >
            {/* Left panel */}
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    position: "relative",
                    height: "100%",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={(t) => ({
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 0,
                        border: "none",
                        borderColor: "transparent",
                        bgcolor: t.palette.background.paper,
                        "@media (min-width: 1024px)": {
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                        },
                        "@media (min-width: 1440px)": {
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                        },
                        color: t.palette.text.primary,
                        fontFamily: t.typography.fontFamily,
                        backdropFilter: "none",
                        backgroundImage: "none",
                        boxShadow: "none",
                        overflow: "hidden",
                    })}
                >
                    {/* ═══ Desktop: keep EventsHeader as-is ═══ */}
                    {isMdUp && (
                        <>
                            <EventsHeader
                                canCreate={canCreate}
                                onCreateEvent={handleOpenCreate}
                                query={query}
                                onQueryChange={setQuery}
                                onSearch={handleSearch}
                                onClear={handleClearAll}
                                showFilters={showFilters}
                                onToggleFilters={handleToggleFilters}
                                onResetFilters={handleClearAll}
                            />

                            {/* Filter container is always visible on desktop;
                                the internal "Filters" toggle inside EventsFilters
                                controls whether the field grid is expanded. */}
                            <Box sx={{ flexShrink: 0, px: 1.5, pt: 1.5, pb: 0.75, position: "relative", zIndex: 10 }}>
                                <EventsFilters
                                    query={query}
                                    onQueryChange={setQuery}
                                    view={view}
                                    onViewChange={handleViewChange}
                                    city={city}
                                    onCityChange={handleCityChange}
                                    county={county}
                                    onCountyChange={handleCountyChange}
                                    radius={radius}
                                    onRadiusChange={handleRadiusChange}
                                    category={category}
                                    onCategoryChange={handleCategoryChange}
                                    datePreset={datePreset}
                                    onDatePresetChange={handleDatePresetChange}
                                    sort={sort}
                                    onSortChange={handleSortChange}
                                    onClearFilters={handleClearAll}
                                    onClearAll={handleClearAll}
                                    onPreviewDetail={handleSearch}
                                    showSearchInput={false}
                                    showAdvancedFilters
                                    categoryCounts={categoryCounts}
                                    categoryCountsLoading={categoryCountsLoading}
                                    locationCounts={eventLocationCounts}
                                    customStartDate={customStartDate}
                                    customEndDate={customEndDate}
                                    selectedDates={selectedDates}
                                    isCustomWithNoDates={isCustomWithNoDates}
                                    viewer={resolvedUser}
                                    committedQuery={committedQuery}
                                    onCommittedQueryChange={handleSavedSearchQueryChange}
                                />
                            </Box>
                        </>
                    )}

                    {/* ═══ PHONE HEADER: Compact row with tabs + Calendar/Map/Search icons (< 900px only) ═══ */}
                    {/* In-flow at the top of the scroll container — scrolls away with content
                        when the user pulls up, and reappears when they scroll back down.
                        Frosted-glass background keeps content legible as it slides under the
                        global AppBar on its way out. Opacity fades in lockstep with the
                        AppBar via --ll-nav-offset so both pieces of chrome hide as a unit. */}
                    {isPhoneEvents && (
                        <Box
                            ref={mobileHeaderRef}
                            sx={{
                                flexShrink: 0,
                                backdropFilter: "saturate(140%) blur(10px)",
                                WebkitBackdropFilter: "saturate(140%) blur(10px)",
                                backgroundColor: (t) => alpha(t.palette.background.paper, 0.85),
                                opacity: "calc(1 - var(--ll-nav-offset, 0))",
                                pointerEvents: "var(--ll-nav-pointer-events, auto)",
                                transition: "none",
                                willChange: "opacity",
                            }}
                        >
                            {/* Segmented tabs — text pills: Overview, Events + Calendar, Map, Search icons */}
                            <Box
                                role="tablist"
                                aria-label="Events view"
                                sx={{
                                    flex: "0 0 auto",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    overflowX: "auto",
                                    WebkitOverflowScrolling: "touch",
                                    scrollbarWidth: "none",
                                    "&::-webkit-scrollbar": { display: "none" },
                                    maxWidth: "100%",
                                    px: 1,
                                    pt: 0.75,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, p: 0, width: "100%" }}>
                                    {(() => {
                                        const mobilePillSx = (active) => (t) => ({
                                            borderRadius: 999,
                                            textTransform: "none",
                                            fontFamily: t.typography.fontFamily,
                                            fontWeight: active ? 800 : 600,
                                            letterSpacing: "0.01em",
                                            fontSize: 11.5,
                                            lineHeight: 1,
                                            "& .MuiButton-startIcon": { display: "none" },
                                            height: 28,
                                            minHeight: 28,
                                            px: 1.25,
                                            py: 0,
                                            flexDirection: "row",
                                            gap: 0,
                                            color: active ? t.palette.primary.main : t.palette.text.secondary,
                                            backgroundColor: active ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                            border: "1px solid",
                                            borderColor: active ? alpha(t.palette.primary.main, 0.18) : "transparent",
                                            boxShadow: "none",
                                            whiteSpace: "nowrap",
                                            flexShrink: 0,
                                            transition: `all ${t.custom?.motion?.base || 160}ms ${t.custom?.motion?.ease || "ease"}`,
                                            "&:hover": {
                                                backgroundColor: active ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                color: active ? t.palette.primary.main : t.palette.text.primary,
                                            },
                                        });

                                        return (
                                            <>
                                                {/* Overview tab */}
                                                <Button
                                                    role="tab"
                                                    aria-selected={mobileView === 'discover'}
                                                    onClick={() => setMobileView((v) => v === 'discover' ? 'list' : 'discover')}
                                                    variant="text"
                                                    disableElevation
                                                    sx={mobilePillSx(mobileView === 'discover')}
                                                >
                                                    Overview
                                                </Button>

                                                {/* Events tab */}
                                                <Button
                                                    role="tab"
                                                    aria-selected={mobileView !== 'discover'}
                                                    onClick={() => { if (mobileView === 'discover') setMobileView('list'); }}
                                                    variant="text"
                                                    disableElevation
                                                    sx={mobilePillSx(mobileView !== 'discover')}
                                                >
                                                    Events
                                                </Button>
                                            </>
                                        );
                                    })()}

                                    {/* Calendar, Map, Search icons pushed right */}
                                    {mobileView !== 'discover' && (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto", flexShrink: 0 }}>
                                            <IconButton
                                                onClick={() => setMobileCalendarOpen(true)}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 32,
                                                    height: 32,
                                                    color: t.palette.text.secondary,
                                                    transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                                                    "&:hover": { color: "primary.main" },
                                                })}
                                                aria-label="Calendar"
                                            >
                                                <CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => setMobileMapOpen(true)}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 32,
                                                    height: 32,
                                                    color: t.palette.text.secondary,
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
                                                sx={(t) => ({
                                                    width: 32,
                                                    height: 32,
                                                    color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.secondary,
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
                        </Box>
                    )}

                    {/* ═══ TABLET / LAPTOP HEADER: Full controls (900–1439px) ═══ */}
                    {isTabletEvents && (
                        <Box
                            sx={{
                                flexShrink: 0,
                                px: 1.25,
                                pt: 0.5,
                                pb: 0.5,
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
                            {/* Segmented tabs — text pills: Overview, Events */}
                            <Box role="tablist" aria-label="Events view" sx={{ flex: "0 0 auto", display: "flex" }}>
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
                                                    aria-selected={mobileView === 'discover'}
                                                    onClick={() => setMobileView((v) => v === 'discover' ? 'list' : 'discover')}
                                                    variant="text"
                                                    disableElevation
                                                    sx={segmentSx(mobileView === 'discover')}
                                                >
                                                    Overview
                                                </Button>
                                                <Button
                                                    role="tab"
                                                    aria-selected={mobileView !== 'discover'}
                                                    onClick={() => { if (mobileView === 'discover') setMobileView('list'); }}
                                                    variant="text"
                                                    disableElevation
                                                    sx={segmentSx(mobileView !== 'discover')}
                                                >
                                                    Events
                                                </Button>
                                            </>
                                        );
                                    })()}
                                </Box>
                            </Box>

                            {/* Search — fills remaining space. Hidden in Discover. */}
                            {mobileView !== 'discover' && (
                                <Box sx={{ flex: "1 1 auto", minWidth: 200 }}>
                                    <SearchInput
                                        placeholder="Search events..."
                                        value={query}
                                        onChange={(e) => setQuery(e?.target?.value ?? '')}
                                        onSearch={handleSearch}
                                        onClear={handleClearAll}
                                    />
                                </Box>
                            )}

                            {/* Filters button — opens the mobile filter drawer (same used by phone).
                                At narrow tablet (900–1099) collapses to icon with active-count badge. */}
                            {mobileView !== 'discover' && (
                                <Tooltip title={isNarrowTabletEvents ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                                    {isNarrowTabletEvents ? (
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

                            {/* Calendar button */}
                            {mobileView !== 'discover' && (
                                <Tooltip title={isNarrowTabletEvents ? 'Calendar' : ''}>
                                    {isNarrowTabletEvents ? (
                                        <IconButton
                                            onClick={() => setMobileCalendarOpen(true)}
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
                                            aria-label="Calendar"
                                        >
                                            <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => setMobileCalendarOpen(true)}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<CalendarMonthRoundedIcon sx={{ fontSize: '18px !important' }} />}
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
                                            aria-label="Calendar"
                                        >
                                            Calendar
                                        </Button>
                                    )}
                                </Tooltip>
                            )}

                            {/* Map button */}
                            {mobileView !== 'discover' && (
                                <Tooltip title={isNarrowTabletEvents ? 'Map' : ''}>
                                    {isNarrowTabletEvents ? (
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

                            {/* Create Event — icon-only at narrow tablet, labeled at wider tablet. */}
                            {canCreate && mobileView !== 'discover' && (
                                <Tooltip title={isNarrowTabletEvents ? 'Create Event' : ''}>
                                    {isNarrowTabletEvents ? (
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
                                            aria-label="Create Event"
                                        >
                                            <EventRoundedIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={handleOpenCreate}
                                            variant="contained"
                                            size="small"
                                            startIcon={<EventRoundedIcon />}
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
                                            Create Event
                                        </Button>
                                    )}
                                </Tooltip>
                            )}
                        </Box>
                    )}

                    {/* Active filter chips — mobile only */}
                    {activeFilterChips.length > 0 && !isMdUp && mobileView !== 'discover' && (
                        <Box sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1.5,
                            pt: 0.5,
                            pb: 0.5,
                            flexWrap: "wrap",
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
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.2),
                                        "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        },
                                        "& .MuiChip-deleteIcon": {
                                            color: alpha(t.palette.primary.main, 0.5),
                                            fontSize: 16,
                                            "&:hover": { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Box>
                    )}

                    <Divider sx={{ borderColor: "divider" }} />

                    {/* ── Mobile: inline Discover view (like BusinessHubPage pattern) ── */}
                    {!isMdUp && mobileView === 'discover' && (
                        <Box data-discover-scroll sx={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'contain',
                            bgcolor: 'background.paper',
                            // Reserve space for the floating AppBar + section header
                            // so the cover image isn't hidden behind them on initial paint.
                            '@media (max-width: 1439px)': {
                                paddingTop: 'var(--ll-subheader-height, 52px)',
                            },
                            // Phone: subheader is in-flow, no reservation needed.
                            '@media (max-width: 899px)': {
                                paddingTop: 0,
                                paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                            },
                        }}>
                            <EventsRightPanel
                                rightWidth="100%"
                                activeTab="discover"
                                onTabChange={() => {}}
                                selectedEvent={null}
                                events={displayEvents}
                                allEvents={allEvents}
                                user={resolvedUser}
                                onRequireAuth={openLoginPopup}
                                onSelectEvent={(evt) => {
                                    setMobileView('list');
                                    handleSelectEvent(evt);
                                }}
                                onClearSelection={handleClearSelection}
                                selectedDates={selectedDates}
                                onDatesChange={handleDatesChange}
                                onEditEvent={handleEditEvent}
                                onDeleteEvent={handleDeleteEvent}
                                onRefresh={handleRefresh}
                                focusEventId={null}
                                onFocusEventHandled={() => {}}
                                focusCommentInput={false}
                                onFocusCommentHandled={() => {}}
                                hoveredCardId={hoveredEventId}
                                city={city}
                                county={county}
                                onCityChange={handleCityChange}
                                onCountyChange={handleCountyChange}
                                radius={radius}
                                onRadiusChange={handleRadiusChange}
                                categoryCounts={categoryCounts}
                                onSelectCategory={(cat) => {
                                    handleSelectCategory(cat);
                                    setMobileView('list');
                                }}
                                activeCategory={category}
                                hideTabs
                            />
                        </Box>
                    )}

                    {/* Normal content — hidden when mobile discover view is active */}
                    {(isMdUp || mobileView !== 'discover') && (
                        <>
                            {/* Results list: matched to Community panel spacing */}
                            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
                                {/* ── Centered PulsingDots until events + friends data are fully ready ── */}
                                {(!feedFullyReady && !isCustomWithNoDates && !error && (isLoading || isRefreshing || (displayEvents.length > 0 && !friendsDataReady))) ? (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 5,
                                        }}
                                    >
                                        <PulsingDots />
                                    </Box>
                                ) : null}

                                <Box
                                    data-events-scroll
                                    onTouchStart={!isMdUp ? handlePullTouchStart : undefined}
                                    onTouchMove={!isMdUp ? handlePullTouchMove : undefined}
                                    onTouchEnd={!isMdUp ? handlePullTouchEnd : undefined}
                                    sx={{
                                        height: "100%",
                                        overflowY: "scroll",
                                        scrollbarGutter: "stable",
                                        px: 0.75, pt: 1.35,
                                        "@media (min-width: 1440px)": { px: 1.25, pt: 1.5 },
                                        pb: 1,
                                        // Mobile/tablet: reserve space under the floating
                                        // global header + subheader so the first piece of
                                        // content starts below the chrome on initial paint.
                                        // As the user scrolls, content flows UP past this
                                        // band and the chrome fades; content is always
                                        // there, just revealed as opacity drops.
                                        "@media (max-width: 1439px)": {
                                            paddingTop: "var(--ll-subheader-height, 52px)",
                                        },
                                        // Phone: subheader is in-flow, no reservation needed.
                                        "@media (max-width: 899px)": {
                                            paddingTop: 0,
                                            paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                        },
                                        // Hide list content while PulsingDots is showing
                                        opacity: (!feedFullyReady && !isCustomWithNoDates && !error && (isLoading || isRefreshing || (displayEvents.length > 0 && !friendsDataReady))) ? 0 : 1,
                                        transition: (t) => `opacity ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}`,
                                        WebkitOverflowScrolling: "touch",
                                        overscrollBehavior: "contain",
                                    }}
                                >
                                    {/* Pull-to-refresh indicator (mobile only) */}
                                    {!isMdUp && (pullDistance > 0 || pullRefreshing) && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: pullRefreshing ? 56 : Math.max(pullDistance, 0),
                                                overflow: 'hidden',
                                                transition: pullRefreshing ? 'height 0.2s ease' : 'none',
                                            }}
                                        >
                                            <CircularProgress
                                                size={24}
                                                thickness={4}
                                                sx={{
                                                    opacity: pullRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1),
                                                    transition: pullRefreshing ? 'none' : 'opacity 0.1s ease',
                                                }}
                                            />
                                        </Box>
                                    )}
                                    <EventsList
                                        events={displayEvents}
                                        friendsGoingMap={friendsGoingMap}
                                        activeView={view}
                                        onSelectEvent={handleSelectEvent}
                                        isLoading={isLoading && !isCustomWithNoDates}
                                        isRefreshing={isRefreshing && !isCustomWithNoDates}
                                        isLoadingMore={isLoadingMore}
                                        error={error}
                                        hasMore={hasMore && !isCustomWithNoDates}
                                        onLoadMore={loadMore}
                                        sort={sort}
                                        datePreset={datePreset}
                                        customStartDate={customStartDate}
                                        selectedDates={selectedDates}
                                        totalCount={displayTotalCount}
                                        onCreateEvent={handleOpenCreate}
                                        user={resolvedUser}
                                        isCustomWithNoDates={isCustomWithNoDates}
                                        onEditEvent={handleEditEvent}
                                        onDeleteEvent={handleDeleteEvent}
                                        onRefresh={handleRefresh}
                                        onLocationClick={handleLocationClick}
                                        onCommentEvent={handleCommentEvent}
                                        onHoverEvent={handleHoverEvent}
                                        selectedEventId={selectedEvent?.id}
                                        emptyHeadline={
                                            city && county ? `No events found in ${city}, ${county} County`
                                                : city ? `No events found in ${city}`
                                                    : county ? `No events found in ${county} County`
                                                        : null
                                        }
                                        emptySubtitle={
                                            (city || county)
                                                ? "Try browsing all counties or adjusting your other filters."
                                                : null
                                        }
                                    />
                                </Box>
                            </Box>

                            {/* Fixed bottom status bar (Community-style) — desktop only */}
                            <Box
                                sx={(t) => ({
                                    flexShrink: 0,
                                    borderTop: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                    px: 1.25, py: 0.5,
                                    display: "none",
                                    "@media (min-width: 1440px)": { display: "flex", px: 1.5, py: 1 },
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: t.palette.background.paper,
                                    backgroundImage: "none",
                                    backdropFilter: "none",
                                    pb: 1,
                                })}
                            >
                                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.secondary", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: 22 }}>
                                    {(() => {
                                        // Build location-aware empty label
                                        const locationLabel = city && county
                                            ? `${city}, ${county} County`
                                            : city ? city
                                                : county ? `${county} County`
                                                    : '';
                                        const noEventsMsg = locationLabel
                                            ? `No events found in ${locationLabel}`
                                            : "No events match your filters";

                                        // If custom with no dates, show 0 out of 0
                                        if (isCustomWithNoDates) {
                                            return noEventsMsg;
                                        }

                                        const shown = Array.isArray(displayEvents) ? displayEvents.length : 0;
                                        const total = Number.isFinite(Number(displayTotalCount)) ? Number(displayTotalCount) : null;

                                        if ((isLoading || isRefreshing) && shown === 0) return "Loading\u2026";

                                        // Data propagation gap: total arrived but cards haven't rendered yet
                                        if (shown === 0 && total != null && total > 0) return "Loading\u2026";

                                        if (shown === 0) return noEventsMsg;

                                        if (total != null && total > 0) {
                                            const clamped = Math.min(shown, total);
                                            const displayNoun = total === 1 ? "event" : "events";
                                            return "Displaying " + clamped.toLocaleString() + " out of " + total.toLocaleString() + " " + displayNoun;
                                        }

                                        return hasMore
                                            ? "Displaying " + shown.toLocaleString() + "+ events"
                                            : "Displaying " + shown.toLocaleString() + " event" + (shown !== 1 ? "s" : "");
                                    })()}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Box>

            {/* Right panel */}
            {isMdUp ? (
                <EventsRightPanel
                    rightWidth={RIGHT_WIDTH}
                    activeTab={rightTab}
                    onTabChange={setRightTab}
                    selectedEvent={selectedEvent}
                    events={displayEvents}
                    allEvents={allEvents}
                    user={resolvedUser}
                    onRequireAuth={openLoginPopup}
                    onSelectEvent={handleSelectEvent}
                    onClearSelection={handleClearSelection}
                    selectedDates={selectedDates}
                    onDatesChange={handleDatesChange}
                    onSearchDates={handleSearchDates}
                    onEditEvent={handleEditEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onRefresh={handleRefresh}
                    focusEventId={focusEventId}
                    onFocusEventHandled={() => setFocusEventId(null)}
                    focusCommentInput={focusCommentInput}
                    onFocusCommentHandled={() => setFocusCommentInput(false)}
                    hoveredCardId={hoveredEventId}
                    city={city}
                    county={county}
                    onCityChange={handleCityChange}
                    onCountyChange={handleCountyChange}
                    radius={radius}
                    onRadiusChange={handleRadiusChange}
                    categoryCounts={categoryCounts}
                    onSelectCategory={handleSelectCategory}
                    activeCategory={category}
                />
            ) : null}

            {/* ═══ Mobile fullscreen event detail drawer (matches map/calendar drawer pattern) ═══ */}
            {!isMdUp && (
                <SwipeableRightDrawer
                    open={detailOpen}
                    onClose={handleCloseDetail}
                    transitionDuration={{ enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            width: "100%",
                            height: "100%",
                            borderRadius: 0,
                            overflow: "hidden",
                            zIndex: (t) => t.zIndex.drawer + 2,
                        },
                    }}
                    ModalProps={{ keepMounted: false }}
                >
                    {/* Back bar — slim, fixed at top (matches map/calendar drawer) */}
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 0.5,
                            py: 0.25,
                            minHeight: 46,
                            borderBottom: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.1),
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <IconButton
                            onClick={() => {
                                if (detailOrigin === 'calendar' || detailOrigin === 'map') {
                                    // Open map instantly (no slide-up) behind the detail,
                                    // then close the detail so it slides away to reveal the map.
                                    setSkipMapTransition(true);
                                    setMobileMapOpen(true);
                                    requestAnimationFrame(() => {
                                        setDetailOpen(false);
                                        setFocusCommentInput(false);
                                        setSelectedEvent(null);
                                        setDetailOrigin(null);
                                        // Restore normal map transitions after the detail finishes closing
                                        setTimeout(() => setSkipMapTransition(false), 300);
                                    });
                                } else {
                                    handleCloseDetail();
                                }
                            }}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36 }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: 15,
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {(detailOrigin === 'calendar' || detailOrigin === 'map')
                                ? "Back to Map"
                                : "Event Details"}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        <EventDetailPanel
                            event={selectedEvent}
                            user={resolvedUser}
                            onRequireAuth={openLoginPopup}
                            onClearSelection={() => {
                                handleCloseDetail();
                                handleClearSelection();
                            }}
                            focusCommentInput={focusCommentInput}
                            onFocusCommentHandled={() => setFocusCommentInput(false)}
                        />
                    </Box>
                </SwipeableRightDrawer>
            )}

            <CreateEditEventModal
                open={createOpen}
                onClose={handleCloseCreate}
                eventToEdit={editingEvent}
                user={resolvedUser}
                onSaved={handleSaved}
            />

            {/* ── Mobile map — truly fullscreen with back bar (matches CommunityPage) ── */}
            {!isMdUp && (
                <SwipeableBottomDrawer
                    open={mobileMapOpen}
                    onClose={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }}
                    transitionDuration={skipMapTransition ? { enter: 0, exit: 260 } : { enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            height: "100dvh",
                            "@supports not (height: 1dvh)": { height: "100vh" },
                            borderRadius: 0,
                            overflow: "hidden",
                            bottom: 0,
                            zIndex: (t) => t.zIndex.drawer + 2,
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bottom: 0 } } }}
                >
                    {/* Back bar — slim, fixed at top, with search/filter icon */}
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 0.5,
                            py: 0.25,
                            minHeight: 46,
                            borderBottom: activeFilterChips.length > 0 ? "none" : "1px solid",
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
                            Events Map
                        </Typography>
                        <IconButton
                            onClick={() => setMobileMapFilterOpen(true)}
                            size="small"
                            aria-label="Search & Filter"
                            sx={(t) => ({
                                width: 36, height: 36, borderRadius: 999,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: "primary.main",
                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.16) },
                            })}
                        >
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {/* Active filter chips */}
                    {activeFilterChips.length > 0 && (
                        <Box sx={(t) => ({
                            display: "flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.5,
                            flexWrap: "nowrap", overflowX: "auto", flexShrink: 0,
                            bgcolor: t.palette.background.paper,
                            borderBottom: "1px solid", borderColor: alpha(t.palette.divider, 0.1),
                            "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
                        })}>
                            {activeFilterChips.map((chip) => (
                                <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                      sx={(t) => ({
                                          height: 26, maxWidth: 160, borderRadius: 999, fontWeight: 700, fontSize: 11, flexShrink: 0,
                                          bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main,
                                          border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2),
                                          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                                          "& .MuiChip-deleteIcon": { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, "&:hover": { color: t.palette.primary.main } },
                                      })}
                                />
                            ))}
                        </Box>
                    )}

                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        <EventsMapTab
                            events={displayEvents}
                            onSelectEvent={(e) => {
                                setMobileMapOpen(false);
                                setDetailOrigin('map');
                                handleSelectEvent(e);
                            }}
                            hoveredCardId={hoveredEventId}
                            focusEventId={focusEventId}
                            onFocusEventHandled={() => setFocusEventId(null)}
                            center={mapCenter}
                            zoomLevel={mapZoom}
                        />
                    </Box>

                    {/* Mobile map filter drawer */}
                    <Drawer
                        anchor="bottom"
                        open={mobileMapFilterOpen}
                        onClose={() => setMobileMapFilterOpen(false)}
                        transitionDuration={{ enter: 280, exit: 220 }}
                        ModalProps={{ keepMounted: false }}
                        PaperProps={{ sx: (t) => ({
                                maxHeight: "85dvh", "@supports not (max-height: 1dvh)": { maxHeight: "85vh" },
                                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                                bgcolor: t.palette.background.paper, overflow: "hidden",
                                display: "flex", flexDirection: "column",
                            }) }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                            <TuneIcon sx={{ fontSize: 22, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                            <IconButton onClick={() => setMobileMapFilterOpen(false)} size="small" sx={{ width: 34, height: 34, borderRadius: 999 }}>
                                <CloseRoundedIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Box>
                        <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                            <SearchInput
                                placeholder="Search events…"
                                value={query}
                                onChange={(e) => setQuery(e?.target?.value ?? "")}
                                inputProps={{ maxLength: 100, autoFocus: true }}
                                onSearch={() => { handleSearch(); setMobileMapFilterOpen(false); }}
                                onClear={() => { setQuery(""); setCommittedQuery(""); }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, overflow: "auto", px: 2, pt: 1, pb: 2 }}>
                            <EventsFilters
                                query={query} onQueryChange={setQuery}
                                view={view} onViewChange={handleViewChange}
                                city={city} onCityChange={handleCityChange}
                                county={county} onCountyChange={handleCountyChange}
                                radius={radius}
                                onRadiusChange={handleRadiusChange}
                                category={category} onCategoryChange={handleCategoryChange}
                                datePreset={datePreset} onDatePresetChange={handleDatePresetChange}
                                sort={sort} onSortChange={handleSortChange}
                                onClearFilters={handleClearAll} onPreviewDetail={handleSearch}
                                showSearchInput={false} showAdvancedFilters
                                categoryCounts={categoryCounts} categoryCountsLoading={categoryCountsLoading}
                                locationCounts={eventLocationCounts}
                                customStartDate={customStartDate} customEndDate={customEndDate}
                                selectedDates={selectedDates} isCustomWithNoDates={isCustomWithNoDates}
                                viewer={resolvedUser}
                                committedQuery={committedQuery}
                                onCommittedQueryChange={handleSavedSearchQueryChange}
                            />
                        </Box>
                        <Box sx={(t) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                            <Button onClick={handleClearAll} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary", px: 2 }}>Reset</Button>
                            <Button variant="contained" onClick={() => { handleSearch(); setMobileMapFilterOpen(false); }}
                                    sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, height: 42, bgcolor: t.palette.primary.main, color: t.palette.common.white, boxShadow: "none", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" } })}>
                                Show Results
                            </Button>
                        </Box>
                    </Drawer>
                </SwipeableBottomDrawer>
            )}

            {/* ── Mobile Calendar drawer — fullscreen with back bar ── */}
            {!isMdUp && (
                <SwipeableBottomDrawer
                    open={mobileCalendarOpen}
                    onClose={() => setMobileCalendarOpen(false)}
                    PaperProps={{
                        sx: {
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            borderRadius: 0,
                            overflow: "hidden",
                            bottom: 0,
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bottom: 0 } } }}
                    sx={{ zIndex: (t) => t.zIndex.drawer + 2 }}
                >
                    {/* Back bar */}
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 0.5,
                            py: 0.25,
                            // Reserve space for the iOS status bar / Dynamic Island.
                            // This drawer is height:100dvh, so without this the back
                            // arrow lands behind the system clock on notched devices.
                            ...topInsetSx({ basePadding: 4, baseMinHeight: 46 }),
                            borderBottom: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.1),
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <IconButton
                            onClick={() => setMobileCalendarOpen(false)}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36 }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                            Events Calendar
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        <EventsRightPanel
                            rightWidth="100%"
                            activeTab="calendar"
                            onTabChange={() => {}}
                            selectedEvent={null}
                            events={displayEvents}
                            allEvents={allEvents}
                            user={resolvedUser}
                            onRequireAuth={openLoginPopup}
                            onSelectEvent={(evt) => {
                                setMobileCalendarOpen(false);
                                setDetailOrigin('calendar');
                                handleSelectEvent(evt);
                            }}
                            onClearSelection={handleClearSelection}
                            selectedDates={selectedDates}
                            onDatesChange={handleDatesChange}
                            onSearchDates={handleSearchDates}
                            onEditEvent={handleEditEvent}
                            onDeleteEvent={handleDeleteEvent}
                            onRefresh={handleRefresh}
                            focusEventId={null}
                            onFocusEventHandled={() => {}}
                            focusCommentInput={false}
                            onFocusCommentHandled={() => {}}
                            hoveredCardId={hoveredEventId}
                            city={city}
                            county={county}
                            onCityChange={handleCityChange}
                            onCountyChange={handleCountyChange}
                            radius={radius}
                            onRadiusChange={handleRadiusChange}
                            categoryCounts={categoryCounts}
                            onSelectCategory={handleSelectCategory}
                            activeCategory={category}
                            hideTabs
                        />
                    </Box>
                </SwipeableBottomDrawer>
            )}

            {/* ═══ Mobile full-screen filter drawer (matches CommunityPanel) ═══ */}
            {!isMdUp && (
                <SwipeableBottomDrawer
                    open={mobileFilterDrawerOpen}
                    onClose={() => setMobileFilterDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            height: '100%',
                            borderRadius: 0,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: {} } }}
                >
                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                        <IconButton onClick={() => setMobileFilterDrawerOpen(false)} size="small" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                    </Box>

                    {/* Search input */}
                    <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0 }}>
                        <SearchInput
                            placeholder="Search events…"
                            value={query}
                            onChange={(e) => setQuery(e?.target?.value ?? "")}
                            inputProps={{ maxLength: 100, autoFocus: true }}
                            onSearch={() => { handleSearch(); setMobileFilterDrawerOpen(false); }}
                            onClear={() => {
                                setQuery("");
                                setCommittedQuery("");
                            }}
                        />
                    </Box>

                    {/* Filter controls — scrollable */}
                    <Box sx={{ flex: 1, overflow: "auto", px: 2, pt: 1, pb: 2 }}>
                        <EventsFilters
                            query={query}
                            onQueryChange={setQuery}
                            view={view}
                            onViewChange={handleViewChange}
                            city={city}
                            onCityChange={handleCityChange}
                            county={county}
                            onCountyChange={handleCountyChange}
                            radius={radius}
                            onRadiusChange={handleRadiusChange}
                            category={category}
                            onCategoryChange={handleCategoryChange}
                            datePreset={datePreset}
                            onDatePresetChange={handleDatePresetChange}
                            sort={sort}
                            onSortChange={handleSortChange}
                            onClearFilters={handleClearAll}
                            onPreviewDetail={handleSearch}
                            showSearchInput={false}
                            showAdvancedFilters
                            categoryCounts={categoryCounts}
                            categoryCountsLoading={categoryCountsLoading}
                            locationCounts={eventLocationCounts}
                            customStartDate={customStartDate}
                            customEndDate={customEndDate}
                            selectedDates={selectedDates}
                            isCustomWithNoDates={isCustomWithNoDates}
                            viewer={resolvedUser}
                            committedQuery={committedQuery}
                            onCommittedQueryChange={handleSavedSearchQueryChange}
                        />
                    </Box>

                    {/* Sticky bottom actions */}
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            borderTop: "1px solid",
                            borderColor: "divider",
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <Button
                            onClick={() => { handleClearAll(); }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary", px: 2 }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                handleSearch();
                                setMobileFilterDrawerOpen(false);
                            }}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 900,
                                px: 3,
                                height: 42,
                                bgcolor: t.palette.primary.main,
                                color: t.palette.common.white,
                                boxShadow: "none",
                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" },
                            })}
                        >
                            Show Results
                        </Button>
                    </Box>
                </SwipeableBottomDrawer>
            )}

            <Snackbar
                open={Boolean(moderationSnack)}
                autoHideDuration={5000}
                onClose={() => setModerationSnack("")}
                message={moderationSnack}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />

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