// src/pages/community/CommunityPanel.jsx
//
// Left-side Community panel containing:
//  - Filter controls (CommunityFilter) in a collapsible section
//  - Post list (PostList) or Groups list (GroupsList) inside its own scroll container
//  - Fixed bottom status bar showing “Displaying X out of Y posts/groups”
//
// UPDATE 2025-12-19:
//  - Scroll list back to TOP whenever filters/search execute (driven by scrollResetKey).
//  - Skips first mount so “return to where I left off” doesn’t get overridden.
//
// UPDATE 2025-12-23:
//  - Professional skeleton loading UI whenever the POST list is about to change due to
//    a search/filter action (driven by scrollResetKey).
//
// UPDATE 2026-01-09:
//  - Fix Groups view: render GroupsList (not post cards) and show accurate group counts.
//  - “New Group” button triggers onNewGroup when provided.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Fab,
    Fade,
    IconButton,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import TuneIcon from '@mui/icons-material/Tune';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';

import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SignalWifiStatusbarConnectedNoInternet4RoundedIcon from '@mui/icons-material/SignalWifiStatusbarConnectedNoInternet4Rounded';

import CommunityFilter from './CommunityFilter';
import PostList from './PostList';
import NewsList from './NewsList';
import useNewsArticles from './useNewsArticles';
import NetworkErrorState from '../../components/NetworkErrorState';
import GroupsList from '../community/groups/GroupsList';
import SearchInput from '../../components/SearchInput';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../components/Header/Header';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import useSubheaderScrollHide from '../../utils/useSubheaderScrollHide';
import { useActiveAccount } from '../../components/AccountContext';
import { useAuth } from '../../components/AuthModalContext';
import CommunityDiscoverTab from './components/CommunityDiscoverTab';
import InlineComposer from './components/InlineComposer';
import { RADIUS_OPTIONS, RADIUS_VALUE_WHEN_NO_COUNTY } from '../../utils/geoRadius';

const MIN_REFRESH_MS = 350;
const TAB_FADE_MS = 160;
const GROUPS_PAGE_SIZE = 25;

const prefersReducedMotion = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
};

function smoothScrollToTop(el, { duration = 520 } = {}) {
    if (!el) return;

    // Respect reduced motion preferences.
    if (prefersReducedMotion()) {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        return;
    }

    const startTop = el.scrollTop || 0;
    if (startTop <= 0) return;

    const start = nowMs();
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const tick = () => {
        const elapsed = nowMs() - start;
        const p = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(p);
        const nextTop = Math.max(0, Math.round(startTop * (1 - eased)));
        el.scrollTop = nextTop;
        if (p < 1) {
            el.__llScrollRaf = window.requestAnimationFrame(tick);
        } else {
            el.__llScrollRaf = null;
        }
    };

    // Cancel any in-flight animation on this element.
    if (el.__llScrollRaf) {
        try { window.cancelAnimationFrame(el.__llScrollRaf); } catch { /* ignore */ }
        el.__llScrollRaf = null;
    }

    el.__llScrollRaf = window.requestAnimationFrame(tick);
}

const nowMs = () => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }
    return Date.now();
};


const normalizeErrorMessage = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (value instanceof Error) return String(value.message || '').trim();
    if (typeof value === 'object') {
        const directMessage = String(
            value.message
            || value.error
            || value.details
            || value.reason
            || value.statusText
            || ''
        ).trim();
        if (directMessage) return directMessage;
    }
    return String(value).trim();
};

function FeedCardSkeleton() {
    return (
        <Box
            sx={(t) => ({
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(t.palette.text.primary, 0.08),
                bgcolor: t.palette.background.paper,
                boxShadow: t.custom.shadows.xs,
                overflow: 'hidden',
                px: { xs: 1.25, sm: 1.5 },
                py: { xs: 1.25, sm: 1.5 },
                height: { xs: 164, sm: 176 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            })}
        >
            {/* Top row */}
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                <Skeleton variant="circular" width={56} height={56} />

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Skeleton height={18} width="70%" />
                            <Skeleton height={14} width="42%" sx={{ mt: 0.4 }} />
                        </Box>

                        <Skeleton
                            variant="rounded"
                            width={120}
                            height={32}
                            sx={{ borderRadius: 999, flexShrink: 0 }}
                        />
                    </Box>

                    {/* Middle content lines */}
                    <Box sx={{ mt: 1.1 }}>
                        <Skeleton height={14} width="96%" />
                        <Skeleton height={14} width="88%" sx={{ mt: 0.45 }} />
                    </Box>
                </Box>
            </Box>

            {/* Bottom chips */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1.3 }}>
                <Skeleton variant="rounded" width={88} height={26} sx={{ borderRadius: 999 }} />
                <Skeleton variant="rounded" width={78} height={26} sx={{ borderRadius: 999 }} />
                <Skeleton variant="rounded" width={108} height={26} sx={{ borderRadius: 999 }} />
            </Box>
        </Box>
    );
}

/* ── Stable default references (defined OUTSIDE the component to avoid
   new object/array identity on every render, which can cause infinite
   useEffect loops when these appear in dependency arrays). ──────────── */
const EMPTY_ARRAY = [];

const NOOP = () => {};

/**
 * GroupsSentinel
 * -------------
 * Invisible div placed after the groups list. Uses IntersectionObserver to
 * detect when the user has scrolled (or the list is short enough) that the
 * sentinel is in view, then reveals more already-loaded groups or fetches
 * the next page from the server.
 *
 * This replaces the old "auto-fill" useEffect which would eagerly load
 * pages until the container overflowed, causing an immediate 25→50 jump.
 */
const GroupsSentinel = React.memo(function GroupsSentinel({
                                                              groups,
                                                              groupsRenderCount,
                                                              setGroupsRenderCount,
                                                              groupsHasMore,
                                                              onLoadMoreGroups,
                                                              scrollBoxRef,
                                                          }) {
    const sentinelRef = React.useRef(null);
    const lastTriggerRef = React.useRef(0);
    const userHasScrolledRef = React.useRef(false);

    // Only arm the sentinel after the user has scrolled at least once.
    // This prevents the immediate 25→50 jump on mount when groups
    // don't create enough height to overflow the container.
    React.useEffect(() => {
        const root = scrollBoxRef?.current || null;
        if (!root) return;

        const onScroll = () => {
            if (root.scrollTop > 10) {
                userHasScrolledRef.current = true;
            }
        };

        root.addEventListener('scroll', onScroll, { passive: true });
        return () => root.removeEventListener('scroll', onScroll);
    }, [scrollBoxRef]);

    React.useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const root = scrollBoxRef?.current || null;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry || !entry.isIntersecting) return;

                // Don't trigger until the user has actually scrolled
                if (!userHasScrolledRef.current) return;

                // Throttle: don't trigger more than once per 800ms
                const now = Date.now();
                if (now - lastTriggerRef.current < 800) return;
                lastTriggerRef.current = now;

                const totalLoaded = Array.isArray(groups) ? groups.length : 0;

                // First: reveal more already-loaded groups
                if (groupsRenderCount < totalLoaded) {
                    setGroupsRenderCount((c) => Math.min(c + GROUPS_PAGE_SIZE, totalLoaded));
                    return;
                }

                // All loaded groups revealed — fetch more from server
                const hasMore = typeof groupsHasMore === 'boolean' ? groupsHasMore : false;
                if (!hasMore) return;
                if (typeof onLoadMoreGroups !== 'function') return;

                setGroupsRenderCount((c) => c + GROUPS_PAGE_SIZE);
                onLoadMoreGroups();
            },
            {
                root,
                rootMargin: '0px 0px 200px 0px', // trigger 200px before reaching the sentinel
                threshold: 0,
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [groups, groupsRenderCount, groupsHasMore, onLoadMoreGroups, setGroupsRenderCount, scrollBoxRef]);

    // Don't render the sentinel if there's nothing more to show
    const totalLoaded = Array.isArray(groups) ? groups.length : 0;
    const hasMoreToReveal = groupsRenderCount < totalLoaded;
    const hasMoreFromServer = typeof groupsHasMore === 'boolean' ? groupsHasMore : false;
    if (!hasMoreToReveal && !hasMoreFromServer) return null;

    return <div ref={sentinelRef} style={{ height: 1, width: '100%' }} />;
});

export default function CommunityPanel(props) {
    const {
        // auth/user
        user = null,

        // refetch callback after post mutations
        onMutate = null,

        // POST list props
        posts = EMPTY_ARRAY,
        hoveredId = null,
        setHoveredId = NOOP,
        selectedPostId = null,
        onSelectPost = null,
        onSelectPostId = null,
        selectable = true,
        isLoading = false,
        isLoadingMore = false,
        error = '',
        postsError = '',
        communityError = '',
        communityFeedError = '',

        // optional GROUP error props
        groupsError = '',
        groupError = '',


        // GROUP list props
        groups = EMPTY_ARRAY,
        groupsForCounts = null,
        isGroupsLoading = false,
        isGroupsLoadingMore = false,
        groupsTotalCount = null,
        groupsHasMore = null,
        onLoadMoreGroups = null,
        selectedGroupId = null,
        onSelectGroup = null,

        // navigation/callbacks
        onLocationClick = null,
        onCardClick = null,
        onNewPost = null,
        onInlineCompose = null, // NEW: called when inline composer is tapped (mobile Feed)
        onNewGroup = null,

        // mobile: open Discover/Map panels
        onOpenDiscover = null,
        onOpenMap = null,

        // business account restriction
        isBusinessAccount: isBusinessAccountProp = false,

        // filter UI (search always visible; advanced filters collapsible)
        showFilters = false,
        onToggleFilters = null,

        // paging + totals (posts)
        totalCount = null,
        hasMoreExternal = null,
        onLoadMore = null,

        // filters
        selectedView = 'all',
        onViewChange = NOOP,

        // left-side tabs (posts vs groups)
        leftMode = null,
        onLeftModeChange = null,

        // News mode props
        newsCategory = 'all',
        onNewsCategoryChange = null,
        newsDateRange = 'week',
        onNewsDateRangeChange = null,
        selectedNewsArticleId = null,
        onSelectNewsArticle = null,

        // groups scope (all vs mine)
        groupView = 'all',
        onGroupViewChange = null,

        // groups member-type filter (all / owner / admin / member)
        groupMemberType = 'all',
        onGroupMemberTypeChange = null,

        // Whether the viewer is on their personal account (groups/posts membership requires personal)
        isOnPersonalAccount = true,

        searchTerm = '',
        onSearchTermChange = NOOP,
        onSearchClick = NOOP,
        onClearClick = NOOP,

        filteredCities = EMPTY_ARRAY,
        filteredCounties = EMPTY_ARRAY,
        selectedCity = '',
        onCityChange = NOOP,
        selectedCounty = '',
        onCountyChange = NOOP,

        selectedRadius,
        onRadiusChange = NOOP,

        selectedSubtype = '',
        subtypes = EMPTY_ARRAY,
        onSubtypeChange = NOOP,

        // post category counts for filter (e.g., { announcement: 5, discussion: 12, ... })
        postCategoryCounts = null,

        // location counts for county/city badge display
        locationCounts = null,

        selectedSort = 'random',
        sortOptions = EMPTY_ARRAY,
        onSortChange = NOOP,

        selectedDateRange = 'all',
        dateRangeOptions = EMPTY_ARRAY,
        onDateRangeChange = NOOP,

        // triggers scroll-to-top in the list box when it changes
        scrollResetKey = '',

        // scroll position to restore when returning from PostPage (0 = no restore)
        restoreScrollTop = 0,

        // bumped when groups filters are cleared, to reset groups render count
        groupsClearSeq = 0,
    } = props || {};

    const navigate = useNavigate();
    const panelTheme = useTheme();
    const isMobilePanel = useMediaQuery('(max-width:1439px)');
    // True phone breakpoint: matches the page's bottom-nav threshold (<900px).
    // Below this, the compact phone header (pill tabs + tiny search/map icons) is used as-is.
    const isPhonePanel = useMediaQuery('(max-width:899px)');
    // Tablet/laptop range: header menu has moved to the top, but we still haven't
    // hit the full desktop two-column layout (≥1440px). In this range we promote
    // the search bar, filters button, and map button to labeled controls so they
    // aren't hidden behind tiny icons (see image 1 issue).
    const isTabletPanel = isMobilePanel && !isPhonePanel;
    // Narrow end of the tablet range (900–1099px): on these widths the toolbar
    // is tight, so Filters / Map collapse to icon-only to keep the row on one line.
    const isNarrowTabletPanel = useMediaQuery('(min-width:900px) and (max-width:1099px)');
    const tabFadeMs = panelTheme.custom?.motion?.contentFade?.durationMs ?? TAB_FADE_MS;

    // Derive account state from the hook — covers both business and artist accounts
    const { isBusinessAccount: _cpBiz, isArtistAccount: _cpArt, activeAccount: _cpAcct } = useActiveAccount();
    const _cpAcctType = String(_cpAcct?.type || _cpAcct?.account_type || _cpAcct?.accountType || '').toLowerCase();
    const isBusinessAccount = _cpBiz || isBusinessAccountProp || _cpAcctType === 'business';
    const isNonPersonalAccount = _cpBiz || _cpArt || _cpAcctType === 'business' || _cpAcctType === 'artist';

    const viewerUser = user?.user || user || null;
    const { openLoginPopup } = useAuth();

    const redirectToLogin = () => {
        openLoginPopup();
    };

    const fadeTimerRef = useRef(null);
    const [contentVisible, setContentVisible] = useState(true);
    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);

    // ── Mobile: inline discover view (like ServicesPage pattern) ──
    // 'list' = normal posts/groups list, 'discover' = inline discover content
    const [mobileDiscoverView, setMobileDiscoverView] = useState('list');

    // Mobile full-screen filter overlay
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used `useSubheaderScrollHide` to translateY the subheader
    // and reclaim its vertical space via negative margin-bottom. That caused
    // two layout motions to happen at once (the bar moving + content pulling
    // up behind it), producing the jerky up/down shifting users reported.
    //
    // The subheader is now `position: sticky` underneath the global header and
    // fades in/out via `opacity: calc(1 - var(--ll-nav-offset, 0))`. That same
    // CSS variable is what the Header writes on scroll, so the subheader fades
    // in lockstep with the top app bar and no layout reflow occurs.
    //
    // The translate hook is intentionally left disabled (rather than deleted)
    // in case we want to reintroduce a hybrid motion later. Desktop never used
    // it anyway.
    const mobileHeaderRef = useRef(null);
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-community-scroll]',
        enabled: false,
    });
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-discover-scroll]',
        enabled: false,
    });

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll container uses `padding-top: calc(var(--ll-nav-height) +
    // var(--ll-subheader-height))` to reserve space below the floating
    // chrome on initial paint. Because this subheader can grow/shrink (filter
    // chips, composer expanding, etc.), a hard-coded fallback isn't enough —
    // we measure the real height via ResizeObserver and write it to the CSS
    // var so the reserved space always matches reality. Mobile only; on
    // desktop the subheader is part of the flex flow and the var is cleared.
    useLayoutEffect(() => {
        if (!isMobilePanel) {
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
    }, [isMobilePanel]);

    useEffect(() => {
        return () => {
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        };
    }, []);


    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

    useEffect(() => {
        setLocalSearchTerm(searchTerm || '');
    }, [searchTerm]);

    const triggerSearch = useCallback(
        (mode = 'manual') => {
            if (typeof onSearchClick !== 'function') return;
            const term = String(localSearchTerm || '').trim();
            onSearchClick(mode, term);
        },
        [onSearchClick, localSearchTerm]
    );

    // ── Pull-to-refresh (mobile only, not on discover/map) ──
    const { pullRef: communityPullRef, pullIndicator } = usePullToRefresh({
        onRefresh: () => triggerSearch('manual'),
        disabled: !isMobilePanel || mobileDiscoverView === 'discover',
    });

    const [filtersOpenLocal, setFiltersOpenLocal] = useState(Boolean(showFilters));
    const filtersOpen = (typeof showFilters === 'boolean') ? Boolean(showFilters) : filtersOpenLocal;

    useEffect(() => {
        if (typeof showFilters !== 'boolean') return;
        setFiltersOpenLocal(Boolean(showFilters));
    }, [showFilters]);

    const toggleFilters = useCallback(() => {
        if (typeof onToggleFilters === 'function') {
            onToggleFilters();
            return;
        }
        setFiltersOpenLocal((v) => !v);
    }, [onToggleFilters]);

    // Title Case helper
    const toTitleCase = (str) => String(str || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    // Active filter chips for mobile — removable inline chips
    const activeFilterChips = useMemo(() => {
        const chips = [];
        // Show applied search term as a removable chip
        const appliedTerm = String(searchTerm || '').trim();
        if (appliedTerm) {
            const truncated = appliedTerm.length > 24 ? appliedTerm.slice(0, 24) + '…' : appliedTerm;
            chips.push({
                key: 'search',
                label: `"${truncated}"`,
                onRemove: () => {
                    setLocalSearchTerm('');
                    if (typeof onSearchTermChange === 'function') onSearchTermChange('');
                    if (typeof onSearchClick === 'function') onSearchClick('manual', '');
                },
            });
        }

        // View — posts mode only, active when not 'all'
        const VIEW_LABELS = { all: 'All Posts', trending: 'Trending', mine: 'My Posts', following: 'Following' };
        const viewNorm = String(selectedView || '').trim().toLowerCase();
        const leftModeNorm = String(leftMode ?? '').trim().toLowerCase();
        const isPostsMode = leftModeNorm === 'posts' ||
            (!['groups', 'group', 'news'].includes(leftModeNorm) &&
                !['groups', 'group', 'news'].includes(viewNorm));
        if (isPostsMode && viewNorm && viewNorm !== 'all' && VIEW_LABELS[viewNorm]) {
            chips.push({
                key: 'view',
                label: `View: ${VIEW_LABELS[viewNorm]}`,
                onRemove: () => { if (typeof onViewChange === 'function') onViewChange('all'); },
            });
        }

        if (selectedSubtype) chips.push({ key: 'subtype', label: toTitleCase(selectedSubtype), onRemove: () => { if (typeof onSubtypeChange === 'function') onSubtypeChange(''); } });
        if (selectedCity) chips.push({ key: 'city', label: toTitleCase(selectedCity), onRemove: () => { if (typeof onCityChange === 'function') onCityChange(''); } });
        if (selectedCounty) chips.push({ key: 'county', label: `${toTitleCase(selectedCounty)} County`, onRemove: () => { if (typeof onCountyChange === 'function') onCountyChange(''); } });

        // Radius — only meaningful when county is set and user chose a specific radius
        if (selectedCounty && selectedRadius != null &&
            String(selectedRadius) !== String(RADIUS_VALUE_WHEN_NO_COUNTY) &&
            String(selectedRadius) !== '0') {
            const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(selectedRadius));
            if (opt) {
                chips.push({
                    key: 'radius',
                    label: `Radius: ${opt.label}`,
                    onRemove: () => { if (typeof onRadiusChange === 'function') onRadiusChange(RADIUS_VALUE_WHEN_NO_COUNTY); },
                });
            }
        }

        if (selectedSort && selectedSort !== 'random') chips.push({ key: 'sort', label: `Sort: ${toTitleCase(selectedSort)}`, onRemove: () => { if (typeof onSortChange === 'function') onSortChange('random'); } });
        if (selectedDateRange && selectedDateRange !== 'all') chips.push({ key: 'dateRange', label: toTitleCase(selectedDateRange.replace(/_/g, ' ')), onRemove: () => { if (typeof onDateRangeChange === 'function') onDateRangeChange('all'); } });

        // News-mode-specific chips
        if (leftModeNorm === 'news') {
            if (newsCategory && newsCategory !== 'all') {
                chips.push({
                    key: 'news-category',
                    label: `Category: ${toTitleCase(newsCategory)}`,
                    onRemove: () => { if (typeof onNewsCategoryChange === 'function') onNewsCategoryChange('all'); },
                });
            }
            if (newsDateRange && newsDateRange !== 'week') {
                chips.push({
                    key: 'news-date',
                    label: `Date: ${toTitleCase(newsDateRange)}`,
                    onRemove: () => { if (typeof onNewsDateRangeChange === 'function') onNewsDateRangeChange('week'); },
                });
            }
        }

        // Groups-mode-specific chips
        const isGroupsMode = ['groups', 'group'].includes(leftModeNorm) ||
            ['groups', 'group'].includes(viewNorm);
        if (isGroupsMode) {
            const GROUP_VIEW_LABELS = { all: 'All Groups', mine: 'My Groups', following: 'People I Follow' };
            if (groupView && groupView !== 'all' && GROUP_VIEW_LABELS[groupView]) {
                chips.push({
                    key: 'group-view',
                    label: `View: ${GROUP_VIEW_LABELS[groupView]}`,
                    onRemove: () => { if (typeof onGroupViewChange === 'function') onGroupViewChange('all'); },
                });
            }
            if (groupMemberType && groupMemberType !== 'all') {
                chips.push({
                    key: 'member-type',
                    label: `Role: ${toTitleCase(groupMemberType)}`,
                    onRemove: () => { if (typeof onGroupMemberTypeChange === 'function') onGroupMemberTypeChange('all'); },
                });
            }
        }

        return chips;
    }, [searchTerm, selectedView, leftMode, selectedSubtype, selectedCity, selectedCounty,
        selectedRadius, selectedSort, selectedDateRange,
        newsCategory, newsDateRange, groupView, groupMemberType,
        onSearchTermChange, onSearchClick, onViewChange, onSubtypeChange, onCityChange, onCountyChange,
        onRadiusChange, onSortChange, onDateRangeChange,
        onNewsCategoryChange, onNewsDateRangeChange, onGroupViewChange, onGroupMemberTypeChange]);

    const effectiveLeftMode = useMemo(() => {
        const norm = String(leftMode ?? '').trim().toLowerCase();
        if (norm === 'groups' || norm === 'posts' || norm === 'news') return norm;

        // Backward-compat: older code used View="Groups".
        const v = String(selectedView ?? '').trim().toLowerCase();
        if (v === 'groups' || v === 'group') return 'groups';
        return 'posts';
    }, [leftMode, selectedView]);

    const isGroupsView = effectiveLeftMode === 'groups';
    const isNewsView = effectiveLeftMode === 'news';

    // ── News mode data ──
    // Only fetches when isNewsView is true (lazy).
    // Wires to the same search bar + county/city filters used by posts.
    const news = useNewsArticles({
        enabled: isNewsView,
        selectedCity,
        selectedCounty,
        newsCategory,
        newsDateRange,
        searchQuery: searchTerm,
    });

    // Fade the *content* (filters + list + footer) when switching between
    // Community Feed and Groups. The top header row stays static.


    useEffect(() => {
        // If parent isn't controlling filter open state, default to closed on tab switches
        // to keep the left panel compact and predictable.
        if (typeof showFilters === 'boolean') return;
        setFiltersOpenLocal(false);
    }, [isGroupsView, showFilters]);

    const postPanelError = useMemo(
        () => normalizeErrorMessage(error) || normalizeErrorMessage(postsError) || normalizeErrorMessage(communityError) || normalizeErrorMessage(communityFeedError),
        [communityError, communityFeedError, error, postsError]
    );
    const groupsPanelError = useMemo(
        () => normalizeErrorMessage(groupsError) || normalizeErrorMessage(groupError) || normalizeErrorMessage(error),
        [error, groupError, groupsError]
    );
    const panelError = isNewsView ? null : (isGroupsView ? groupsPanelError : postPanelError);
    const listLoading = isNewsView ? false : (isGroupsView ? Boolean(isGroupsLoading) : Boolean(isLoading));

    const scrollBoxRef = useRef(null);

    // Cancel any in-flight smooth scroll animation when unmounting.
    useEffect(() => {
        return () => {
            const el = scrollBoxRef.current;
            if (el && el.__llScrollRaf) {
                try { window.cancelAnimationFrame(el.__llScrollRaf); } catch { /* ignore */ }
                el.__llScrollRaf = null;
            }
        };
    }, []);

    // Guard against "auto-draining" pagination in Groups view.
    // We only want to load the next page when the USER scrolls near the bottom.
    const lastGroupsLoadMsRef = useRef(0);

    // ── Progressive rendering for groups (display GROUPS_PAGE_SIZE at a time) ──
    // Similar to PostList's renderCount pattern: we may have more groups loaded
    // in memory than we show. Scrolling reveals the next chunk before fetching
    // more from the server.
    const [groupsRenderCount, setGroupsRenderCount] = useState(GROUPS_PAGE_SIZE);

    // Reset render count when filters change (detected via groups shrinking)
    const prevGroupsLenForRenderRef = useRef(0);
    useEffect(() => {
        const nextLen = Array.isArray(groups) ? groups.length : 0;
        if (nextLen < prevGroupsLenForRenderRef.current) {
            // Filters changed — list shrank — reset to first page
            setGroupsRenderCount(GROUPS_PAGE_SIZE);
        }
        prevGroupsLenForRenderRef.current = nextLen;
    }, [groups]);

    // Also reset on explicit clear
    useEffect(() => {
        setGroupsRenderCount(GROUPS_PAGE_SIZE);
    }, [groupsClearSeq]);

    // The groups that are actually rendered (capped by groupsRenderCount)
    const visibleGroups = useMemo(() => {
        const all = Array.isArray(groups) ? groups : [];
        return all.slice(0, groupsRenderCount);
    }, [groups, groupsRenderCount]);

    const handleGroupsScroll = useCallback(
        (e) => {
            if (!isGroupsView) return;

            if (isGroupsLoading || isGroupsLoadingMore) return;

            const el = e?.currentTarget;
            if (!el) return;

            const thresholdPx = 260;
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - thresholdPx;
            if (!nearBottom) return;

            const now = Date.now();
            if (now - (lastGroupsLoadMsRef.current || 0) < 700) return;
            lastGroupsLoadMsRef.current = now;

            const totalLoaded = Array.isArray(groups) ? groups.length : 0;
            const currentlyShown = groupsRenderCount;

            // First: reveal more already-loaded groups before fetching from server
            if (currentlyShown < totalLoaded) {
                setGroupsRenderCount((c) => Math.min(c + GROUPS_PAGE_SIZE, totalLoaded));
                return;
            }

            // All loaded groups are revealed — fetch more from server
            const hasMore = typeof groupsHasMore === 'boolean' ? groupsHasMore : false;
            if (!hasMore) return;
            if (typeof onLoadMoreGroups !== 'function') return;

            // Pre-expand render count so newly fetched groups are immediately visible
            setGroupsRenderCount((c) => c + GROUPS_PAGE_SIZE);
            onLoadMoreGroups();
        },
        [
            groups,
            groupsHasMore,
            groupsRenderCount,
            isGroupsLoading,
            isGroupsLoadingMore,
            isGroupsView,
            onLoadMoreGroups,
        ]
    );

    // NOTE: We intentionally do NOT auto-fill when 25 groups don't create overflow.
    // The user wants exactly 25 displayed at a time. More are loaded when they scroll
    // to the bottom and trigger handleGroupsScroll.

    // Skip first mount so returning from PostPage can restore scroll position.
    const didInitScrollRef = useRef(false);

    // Skeleton "refresh" state (POSTS only)
    const didInitRefreshRef = useRef(false);
    const refreshStartRef = useRef(0);
    const refreshStopTimerRef = useRef(null);
    const [listRefreshing, setListRefreshing] = useState(false);

    useEffect(() => {
        return () => {
            if (refreshStopTimerRef.current) {
                clearTimeout(refreshStopTimerRef.current);
                refreshStopTimerRef.current = null;
            }
        };
    }, []);

    // Scroll list to top on filter/search actions. Only run skeleton refresh in post mode.
    useEffect(() => {
        if (!didInitScrollRef.current) {
            didInitScrollRef.current = true;
        } else {
            const el = scrollBoxRef.current;
            if (el) smoothScrollToTop(el, { duration: 560 });
        }

        if (isGroupsView) {
            // No post skeleton refresh in groups view.
            setListRefreshing(false);
            return;
        }

        // Refresh shimmer: skip first mount to avoid flashing on initial render/restore
        if (!didInitRefreshRef.current) {
            didInitRefreshRef.current = true;
            return;
        }

        refreshStartRef.current = nowMs();
        setListRefreshing(true);

        if (refreshStopTimerRef.current) {
            clearTimeout(refreshStopTimerRef.current);
            refreshStopTimerRef.current = null;
        }
    }, [scrollResetKey, isGroupsView]);

    // ── Scroll position restoration when returning from PostPage ──
    // Uses the direct ref (no querySelector) and useLayoutEffect for pre-paint application.
    // A rAF loop keeps re-applying until content is tall enough and scrollTop sticks.
    const restoreScrollTopRef = useRef(restoreScrollTop);
    restoreScrollTopRef.current = restoreScrollTop;

    useLayoutEffect(() => {
        const top = restoreScrollTopRef.current;
        if (!(top > 0)) return;

        // Apply immediately (pre-paint) if the element has enough content already.
        const el = scrollBoxRef.current;
        if (el) {
            el.scrollTop = top;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const top = restoreScrollTopRef.current;
        if (!(top > 0)) return undefined;

        let rafId = null;
        let tries = 0;
        const maxTries = 300;           // ~5 seconds at 60 fps
        let consecutiveHolds = 0;
        const requiredHolds = 10;       // must stick for 10 frames

        const tick = () => {
            tries += 1;
            const el = scrollBoxRef.current;
            if (el) {
                el.scrollTop = top;

                if (Math.abs(el.scrollTop - top) < 2) {
                    consecutiveHolds += 1;
                    if (consecutiveHolds >= requiredHolds) {
                        // Success — clear stored position
                        try { sessionStorage.removeItem('ll:community:scrollTop'); } catch { /* ignore */ }
                        restoreScrollTopRef.current = 0;
                        return;
                    }
                } else {
                    consecutiveHolds = 0;
                }
            }
            if (tries < maxTries) {
                rafId = window.requestAnimationFrame(tick);
            }
        };

        rafId = window.requestAnimationFrame(tick);

        return () => {
            if (rafId) {
                try { window.cancelAnimationFrame(rafId); } catch { /* ignore */ }
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Also re-apply scroll position whenever the posts array changes (content grows).
    useEffect(() => {
        const top = restoreScrollTopRef.current;
        if (!(top > 0)) return;
        const el = scrollBoxRef.current;
        if (el) {
            el.scrollTop = top;
        }
    }, [posts]);

    // Stop post skeleton refresh after loading finishes (min duration)
    useEffect(() => {
        if (isGroupsView) return;
        if (!listRefreshing) return;
        if (listLoading) return;

        const elapsed = nowMs() - (refreshStartRef.current || 0);
        const remaining = Math.max(0, MIN_REFRESH_MS - elapsed);

        if (refreshStopTimerRef.current) {
            clearTimeout(refreshStopTimerRef.current);
            refreshStopTimerRef.current = null;
        }

        refreshStopTimerRef.current = setTimeout(() => {
            setListRefreshing(false);
            refreshStopTimerRef.current = null;
        }, remaining);
    }, [isGroupsView, listRefreshing, listLoading, posts]);

    // Footer stats come from PostList (posts). For groups we derive from groups array.
    const [displayStats, setDisplayStats] = useState(() => ({
        displayed: 0,
        displaying: 0,
        total: Number.isFinite(Number(totalCount)) ? Number(totalCount) : null,
    }));

    useEffect(() => {
        if (Number.isFinite(Number(totalCount))) {
            setDisplayStats((prev) => ({ ...prev, total: Number(totalCount) }));
        }
    }, [totalCount]);

    const handleDisplayStatsChange = useCallback((next) => {
        const displayed = Number(next?.displayed ?? next?.displaying ?? 0);
        // FIX: Only accept PostList's reported total if we don't already have
        // an authoritative totalCount from the X-Total-Count header.
        // Previously, PostList could report total=list.length (e.g. 25) before
        // the header value (e.g. 170) propagated, and that stale value would
        // persist in displayStats.total, causing "25 out of 25".
        const reportedTotal = next?.total != null ? Number(next.total) : null;

        setDisplayStats((prev) => ({
            displayed,
            displaying: displayed,
            // Prefer the authoritative totalCount prop; only fall back to
            // PostList's reported total if we truly have nothing better.
            total: Number.isFinite(Number(totalCount))
                ? Number(totalCount)
                : (Number.isFinite(reportedTotal) ? reportedTotal : prev.total),
        }));
    }, [totalCount]);

    // Use visibleGroups (render-capped) for the "displayed" count in the footer,
    // but keep the full groups array length available for total fallback.
    const groupsCount = useMemo(() => (Array.isArray(visibleGroups) ? visibleGroups.length : 0), [visibleGroups]);
    const groupsLoadedCount = useMemo(() => (Array.isArray(groups) ? groups.length : 0), [groups]);

    const effectiveTotal = useMemo(() => {
        if (isGroupsView) {
            const n = Number(groupsTotalCount);
            // If the server says 0 but we already have items rendered (common when total header isn't present),
            // prefer the client count so the footer doesn't show "0 of 0" while cards are visible.
            if (Number.isFinite(n) && n > 0) return n;
            // Fall back to full loaded count (not visible count) so total reflects
            // all groups we know about, not just the render-capped slice.
            return groupsLoadedCount;
        }
        // FIX: totalCount (from X-Total-Count header via CommunityPage) is the
        // single source of truth. Only fall back to displayStats.total when totalCount
        // is genuinely unavailable (null). Never let displayStats.total override a
        // valid totalCount — that was the root cause of "25 out of 25".
        if (Number.isFinite(Number(totalCount))) return Number(totalCount);
        if (Number.isFinite(Number(displayStats.total))) return Number(displayStats.total);
        return null;
    }, [displayStats.total, groupsCount, groupsLoadedCount, isGroupsView, totalCount, groupsTotalCount]);

    const effectiveDisplayed = useMemo(() => {
        if (isGroupsView) {
            // In Groups mode we are paging locally; "displayed" should be how many cards are currently rendered.
            return groupsCount;
        }

        const n = Number(displayStats.displayed ?? displayStats.displaying ?? 0);
        if (Number.isFinite(n) && n > 0) return n;

        const count = Array.isArray(posts) ? posts.length : 0;
        return Math.min(count, 50);
    }, [displayStats.displayed, displayStats.displaying, groupsCount, isGroupsView, posts]);

    const footerMode = useMemo(() => {
        const total = Number.isFinite(Number(effectiveTotal)) ? Number(effectiveTotal) : null;
        const shown = Number.isFinite(Number(effectiveDisplayed)) ? Number(effectiveDisplayed) : 0;

        if (panelError) return 'counts';
        if (listLoading || listRefreshing) return 'loading';
        // If we have something rendered, always show counts.
        if (shown > 0) return 'counts';
        // shown=0 but total>0 means data hasn't propagated to the display yet — keep loading
        if (total !== null && total > 0) return 'loading';
        if (total === null) return 'loading';
        return 'counts';
    }, [effectiveDisplayed, effectiveTotal, listLoading, listRefreshing, panelError]);

    const footerText = useMemo(() => {
        // News mode: show article count from the news hook, not post count.
        if (isNewsView) {
            if (news.loading) return 'Loading\u2026';
            const n = news.articles?.length || 0;
            if (n === 0) return 'No articles';
            return `Displaying ${n.toLocaleString()} article${n === 1 ? '' : 's'}`;
        }
        if (footerMode === 'loading') return 'Loading\u2026';

        const noun = isGroupsView ? 'groups' : 'posts';
        const singularNoun = isGroupsView ? 'group' : 'post';

        // When on a non-personal account viewing "My Posts" or "My Groups",
        // always show 0 — the data isn't scoped to this account.
        if (!isOnPersonalAccount) {
            if (isGroupsView && groupView === 'mine') return `No ${noun} match your filters`;
            if (!isGroupsView && selectedView === 'mine') return `No ${noun} match your filters`;
        }

        const shown = Number.isFinite(Number(effectiveDisplayed)) ? Number(effectiveDisplayed) : 0;
        const totalNum = Number.isFinite(Number(effectiveTotal)) ? Number(effectiveTotal) : 0;

        if (panelError) return isGroupsView ? 'Unable to load groups' : 'Unable to load posts';

        if (isGroupsView) {
            const more = typeof groupsHasMore === 'boolean' ? groupsHasMore : false;
            if (shown === 0) {
                const locLabel = selectedCity && selectedCounty ? `${toTitleCase(selectedCity)}, ${toTitleCase(selectedCounty)} County`
                    : selectedCity ? toTitleCase(selectedCity)
                        : selectedCounty ? `${toTitleCase(selectedCounty)} County`
                            : '';
                return locLabel ? `No ${noun} found in ${locLabel}` : `No ${noun} match your filters`;
            }
            if (totalNum > 0) {
                const clamped = Math.min(shown, totalNum);
                return 'Displaying ' + clamped.toLocaleString() + ' out of ' + totalNum.toLocaleString() + ' ' + (totalNum === 1 ? singularNoun : noun);
            }
            // FIX: When we have no server total, check if the loaded count is a
            // multiple of the page size — if so, there are very likely more pages.
            const likelyMore = more || (shown > 0 && shown % GROUPS_PAGE_SIZE === 0);
            return likelyMore
                ? 'Displaying ' + shown.toLocaleString() + '+ ' + noun
                : 'Displaying ' + shown.toLocaleString() + ' ' + (shown === 1 ? singularNoun : noun);
        }

        // FIX: For community posts, only show "X out of Y" when totalNum comes from
        // an authoritative source (the X-Total-Count header via totalCount prop).
        // If totalNum === shown AND totalCount prop is null/undefined, it means we're
        // using the list.length fallback — don't display a misleading "25 out of 25"
        // when there might be 170+ posts.
        const hasAuthoritativeTotal = Number.isFinite(Number(totalCount)) && Number(totalCount) > 0;
        const total = totalNum > 0 ? totalNum : shown;
        const clamped = total > 0 ? Math.min(shown, total) : 0;
        if (shown === 0) {
            const locLabel = selectedCity && selectedCounty ? `${toTitleCase(selectedCity)}, ${toTitleCase(selectedCounty)} County`
                : selectedCity ? toTitleCase(selectedCity)
                    : selectedCounty ? `${toTitleCase(selectedCounty)} County`
                        : '';
            return locLabel ? `No ${noun} found in ${locLabel}` : `No ${noun} match your filters`;
        }

        if (hasAuthoritativeTotal) {
            return 'Displaying ' + clamped.toLocaleString() + ' out of ' + total.toLocaleString() + ' ' + (total === 1 ? singularNoun : noun);
        }

        // No authoritative total yet — just show how many are displayed without
        // a misleading "out of" count. Append "+" if we loaded a full page (likely more).
        const likelyMore = shown > 0 && shown % 25 === 0;
        return likelyMore
            ? 'Displaying ' + shown.toLocaleString() + '+ ' + noun
            : 'Displaying ' + shown.toLocaleString() + ' out of ' + shown.toLocaleString() + ' ' + (shown === 1 ? singularNoun : noun);
    }, [effectiveDisplayed, effectiveTotal, footerMode, isGroupsView, isNewsView, news.loading, news.articles, groupsHasMore, panelError, isOnPersonalAccount, groupView, selectedView, totalCount, selectedCity, selectedCounty]);

    const handlePostCardClick = useCallback((post) => {
        if (!post) return;
        if (typeof onCardClick === 'function') {
            onCardClick(post);
            return;
        }
        if (post.id != null) {
            navigate(`/posts/${encodeURIComponent(String(post.id))}`, {
                state: { from: 'community' },
            });
        }
    }, [navigate, onCardClick]);

    const handleCreateClick = useCallback(() => {
        // ✅ Require login to create anything.
        if (!viewerUser) {
            redirectToLogin();
            return;
        }

        // Non-personal accounts: show dialog instead of being disabled
        if (isNonPersonalAccount) {
            setAccountSwitchOpen(true);
            return;
        }

        if (isGroupsView) {
            if (typeof onNewGroup === 'function') onNewGroup();
            return;
        }
        if (typeof onNewPost === 'function') onNewPost();
    }, [isGroupsView, onNewGroup, onNewPost, viewerUser, redirectToLogin, isNonPersonalAccount]);

    const requestModeSwitch = useCallback(
        (next) => {
            const current = isGroupsView ? 'groups' : (isNewsView ? 'news' : 'posts');
            const rawNext = String(next || '').toLowerCase();
            const norm = (rawNext === 'groups' || rawNext === 'news') ? rawNext : 'posts';
            if (norm === current) return;

            // If leaving Posts view, clear any selected post.
            if ((norm === 'groups' || norm === 'news') && selectedPostId) {
                if (typeof onSelectPost === 'function') onSelectPost(null);
                else if (typeof onSelectPostId === 'function') onSelectPostId(null);
            }

            // If leaving Groups view, clear any selected group.
            if (norm !== 'groups' && typeof onSelectGroup === 'function' && selectedGroupId) {
                onSelectGroup(null);
            }

            if (typeof onLeftModeChange !== 'function') return;

            // Fade out current content, switch, then fade in the new content.
            setContentVisible(false);
            if (fadeTimerRef.current) {
                clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }

            fadeTimerRef.current = setTimeout(() => {
                fadeTimerRef.current = null;
                onLeftModeChange(norm);
                // Next frame ensures the new content mounts before we fade it in.
                requestAnimationFrame(() => setContentVisible(true));
            }, tabFadeMs);
        },
        [
            isGroupsView,
            isNewsView,
            onLeftModeChange,
            onSelectGroup,
            onSelectPost,
            onSelectPostId,
            selectedGroupId,
            selectedPostId,
            tabFadeMs,
        ]
    );

    return (
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
            {/* Section header row */}
            <Box
                ref={mobileHeaderRef}
                sx={{
                    flexShrink: 0,
                    px: 1,
                    pt: 0.5,
                    pb: 0.5,
                    // Tablet/laptop (900–1439px): tight vertical padding — every px
                    // matters on short laptop screens where the feed is already cramped.
                    '@media (min-width: 900px) and (max-width: 1439px)': {
                        px: 1.25,
                        pt: 0.5,
                        pb: 0.5,
                        rowGap: 0.5,
                    },
                    '@media (min-width: 1440px)': {
                        px: 2,
                        pt: 1.25,
                        pb: 0.75,
                    },
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    // Mobile/tablet: the subheader is FIXED in the viewport
                    // directly below the global header — it doesn't take flex
                    // layout space. This lets the scroll box below go edge-to-
                    // edge so content flows behind the chrome as the user
                    // scrolls. The subheader fades in sync with the global
                    // header via `--ll-nav-offset`; content is always there
                    // underneath, just revealed as opacity drops.
                    // On desktop the subheader remains part of the flex flow.
                    position: isMobilePanel ? 'fixed' : 'relative',
                    top: isMobilePanel ? 'var(--ll-nav-height, 52px)' : 'auto',
                    left: isMobilePanel ? 0 : 'auto',
                    right: isMobilePanel ? 0 : 'auto',
                    zIndex: (t) => isMobilePanel ? (t.zIndex.appBar) : 2,
                    bgcolor: (t) => t.palette.background.paper,
                    ...(isMobilePanel && {
                        opacity: 'calc(1 - var(--ll-nav-offset, 0))',
                        // Disable pointer events when effectively hidden so taps
                        // fall through to the feed beneath. Shared CSS var is set
                        // by Header.jsx so all chrome (header, bottom nav, this
                        // subheader) flips together at the same offset threshold.
                        pointerEvents: 'var(--ll-nav-pointer-events, auto)',
                        transition: 'none',
                        willChange: 'opacity',
                        // Frosted-glass feel so feed content scrolling beneath
                        // stays legible as the bar fades out.
                        backdropFilter: 'saturate(140%) blur(10px)',
                        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
                        backgroundColor: (t) => alpha(t.palette.background.paper, 0.85),
                    }),
                }}
            >

                {/* Segmented control — mobile: Feed · Groups + search icon; desktop: full tabs with icons */}
                <Box
                    role="tablist"
                    aria-label="Community view"
                    sx={{
                        flex: '1 1 100%',
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        maxWidth: '100%',
                        // Tablet/laptop: tabs shrink to their natural width so the
                        // search bar + Filters/Map/New Post toolbar sits on the
                        // same row. Saves a full row of vertical space.
                        '@media (min-width: 900px) and (max-width: 1439px)': {
                            flex: '0 0 auto',
                            overflowX: 'visible',
                            maxWidth: 'none',
                        },
                        '@media (min-width: 1440px)': {
                            flex: '0 0 auto',
                            justifyContent: 'center',
                            overflowX: 'visible',
                            maxWidth: 520,
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0,
                            borderRadius: 0,
                            width: '100%',
                            '@media (min-width: 900px)': {
                                width: 'fit-content',
                            },
                            border: 'none',
                            backgroundColor: 'transparent',
                        }}
                    >
                        {(() => {
                            const current = isGroupsView ? 'groups' : (isNewsView ? 'news' : 'posts');

                            // Desktop: icon+label tabs (unchanged)
                            const desktopSegmentSx = (active) => (t) => ({
                                borderRadius: 999,
                                textTransform: 'none',
                                fontFamily: t.typography.fontFamily,
                                fontWeight: active ? 950 : 700,
                                letterSpacing: '-0.01em',
                                fontSize: 13.5,
                                lineHeight: 1,
                                '& .MuiButton-startIcon': { marginRight: 0.9, marginLeft: 0 },
                                height: 38,
                                minHeight: 38,
                                px: 1.75,
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

                            // Mobile: compact text-only pill chips
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

                            const segmentSx = (active) => isMobilePanel ? mobilePillSx(active) : desktopSegmentSx(active);

                            return (
                                <>
                                    {/* Discover tab — toggles inline discover view */}
                                    {typeof onOpenDiscover === 'function' && (
                                        <Button
                                            role="tab"
                                            aria-selected={mobileDiscoverView === 'discover'}
                                            onClick={() => setMobileDiscoverView((v) => {
                                                if (v === 'discover') {
                                                    return 'list';
                                                }
                                                return 'discover';
                                            })}
                                            variant="text"
                                            disableElevation
                                            sx={segmentSx(mobileDiscoverView === 'discover')}
                                            startIcon={<ExploreRoundedIcon sx={{ fontSize: '22px !important' }} />}
                                        >
                                            Discover
                                        </Button>
                                    )}

                                    {/* Feed tab */}
                                    <Button
                                        role="tab"
                                        aria-selected={current === 'posts' && !(isMobilePanel && mobileDiscoverView === 'discover')}
                                        onClick={() => {
                                            if (isMobilePanel && mobileDiscoverView === 'discover') { setMobileDiscoverView('list'); if (current === 'posts') return; }
                                            requestModeSwitch('posts');
                                        }}
                                        variant="text"
                                        disableElevation
                                        sx={segmentSx(current === 'posts' && !(isMobilePanel && mobileDiscoverView === 'discover'))}
                                        startIcon={
                                            <DynamicFeedRoundedIcon
                                                sx={(t) => {
                                                    const isActive = current === 'posts' && !(isMobilePanel && mobileDiscoverView === 'discover');
                                                    return {
                                                        fontSize: '22px !important',
                                                        opacity: isActive ? 1 : 0.72,
                                                        color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                                    };
                                                }}
                                            />
                                        }
                                    >
                                        Feed
                                    </Button>

                                    {/* Groups tab */}
                                    <Button
                                        role="tab"
                                        aria-selected={current === 'groups' && !(isMobilePanel && mobileDiscoverView === 'discover')}
                                        onClick={() => {
                                            if (isMobilePanel && mobileDiscoverView === 'discover') { setMobileDiscoverView('list'); if (current === 'groups') return; }
                                            requestModeSwitch('groups');
                                        }}
                                        variant="text"
                                        disableElevation
                                        sx={segmentSx(current === 'groups' && !(isMobilePanel && mobileDiscoverView === 'discover'))}
                                        startIcon={
                                            <GroupsRoundedIcon
                                                sx={(t) => {
                                                    const isActive = current === 'groups' && !(isMobilePanel && mobileDiscoverView === 'discover');
                                                    return {
                                                        fontSize: '22px !important',
                                                        opacity: isActive ? 1 : 0.72,
                                                        color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                                    };
                                                }}
                                            />
                                        }
                                    >
                                        Groups
                                    </Button>

                                    {/* News tab */}
                                    {/*
                                     * HIDDEN 2026-04-18: The news feature is parked
                                     * while we evolve the editorial direction (see
                                     * docs/editorial-philosophy). Infrastructure is
                                     * intentionally preserved — routes, services,
                                     * cron, UI components — so flipping this flag
                                     * back to 'true' restores the tab instantly.
                                     * Set REACT_APP_NEWS_FEATURE_ENABLED=true to
                                     * show. Backend cron also gated on
                                     * RSS_CRON_ENABLED=true (default off).
                                     */}
                                    {String(process.env.REACT_APP_NEWS_FEATURE_ENABLED || 'false').toLowerCase() === 'true' && (
                                        <Button
                                            role="tab"
                                            aria-selected={current === 'news' && !(isMobilePanel && mobileDiscoverView === 'discover')}
                                            onClick={() => {
                                                if (isMobilePanel && mobileDiscoverView === 'discover') { setMobileDiscoverView('list'); if (current === 'news') return; }
                                                requestModeSwitch('news');
                                            }}
                                            variant="text"
                                            disableElevation
                                            sx={segmentSx(current === 'news' && !(isMobilePanel && mobileDiscoverView === 'discover'))}
                                            startIcon={
                                                <NewspaperRoundedIcon
                                                    sx={(t) => {
                                                        const isActive = current === 'news' && !(isMobilePanel && mobileDiscoverView === 'discover');
                                                        return {
                                                            fontSize: '22px !important',
                                                            opacity: isActive ? 1 : 0.72,
                                                            color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                                        };
                                                    }}
                                                />
                                            }
                                        >
                                            News
                                        </Button>
                                    )}

                                    {/* Map tab — desktop only (mobile: accessed via filter drawer).
                                        Hidden in Discover mode — only sub tabs show there. */}
                                    {!isMobilePanel && !isGroupsView && mobileDiscoverView !== 'discover' && typeof onOpenMap === 'function' && (
                                        <Button
                                            role="tab"
                                            aria-selected={false}
                                            onClick={onOpenMap}
                                            variant="text"
                                            disableElevation
                                            sx={segmentSx(false)}
                                            startIcon={<MapRoundedIcon sx={{ fontSize: '22px !important' }} />}
                                        >
                                            Map
                                        </Button>
                                    )}
                                </>
                            );
                        })()}
                    </Box>

                    {/* Phone-only: compact Map + Search icons at end of tab row.
                        On tablet/laptop (900–1439px) these are replaced by the
                        labeled search bar + Filters + Map buttons rendered below. */}
                    {isPhonePanel && mobileDiscoverView !== 'discover' && (
                        <Box sx={{ display: 'flex', '@media (min-width: 900px)': { display: 'none' }, alignItems: 'center', gap: 0.25, ml: 'auto', flexShrink: 0 }}>
                            {/* Map icon */}
                            {!isGroupsView && typeof onOpenMap === 'function' && (
                                <IconButton
                                    onClick={onOpenMap}
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
                            )}
                            {/* Search/filter icon */}
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

                {/* Search — fills remaining space.
                    Phone (<900px): uses the compact search icon in the tab row above.
                    Tablet/laptop (900–1439px) + desktop (≥1440px): full search input inline.
                    Hidden at any width when Discover is active — Discover has its own nav
                    and the user asked for just the sub tabs up top in that mode. */}
                {mobileDiscoverView !== 'discover' && (
                    <Box sx={{ flex: '1 1 auto', minWidth: 200, display: 'none', '@media (min-width: 900px)': { display: 'block' } }}>
                        <SearchInput
                            placeholder={isGroupsView ? 'Search groups...' : (isNewsView ? 'Search news...' : 'Search posts...')}
                            value={localSearchTerm}
                            onChange={(e) => {
                                const next = e?.target?.value ?? '';
                                setLocalSearchTerm(next);
                                onSearchTermChange(next);
                            }}
                            inputProps={{ maxLength: 100 }}
                            onSearch={() => triggerSearch('manual')}
                            onClear={() => {
                                setLocalSearchTerm('');
                                onSearchTermChange('');
                                if (typeof onSearchClick === 'function') {
                                    onSearchClick('manual', '');
                                }
                            }}
                        />
                    </Box>
                )}

                {/* Tablet/laptop (900–1439px): labeled Filters + Map buttons sit next to the search bar.
                    At the narrow end (900–1099px) labels collapse to keep the toolbar on one row.
                    Desktop (≥1440px): filters are always expanded in the panel below and the Map
                    button lives in the tab row — so these are hidden there. */}
                {isTabletPanel && mobileDiscoverView !== 'discover' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, '@media (min-width: 1440px)': { display: 'none' }, '@media (max-width: 899px)': { display: 'none' } }}>
                        <Tooltip title={isNarrowTabletPanel ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                            {isNarrowTabletPanel ? (
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
                        {!isGroupsView && typeof onOpenMap === 'function' && (
                            <Tooltip title={isNarrowTabletPanel ? 'Map' : ''}>
                                {isNarrowTabletPanel ? (
                                    <IconButton
                                        onClick={onOpenMap}
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
                                        onClick={onOpenMap}
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
                    </Box>
                )}

                {/* New Post/Group — icon-only at narrow desktop, full button when wide.
                    Hidden in News mode since users can't create news items.
                    Also hidden at any width when Discover is active — only sub tabs show there. */}
                {!isNewsView && mobileDiscoverView !== 'discover' && (
                    <Tooltip title={isGroupsView ? 'New Group' : 'New Post'}>
                        <IconButton
                            onClick={handleCreateClick}
                            size="small"
                            sx={(t) => ({
                                display: 'none',
                                '@media (min-width: 1440px)': { display: 'inline-flex' },
                                '@media (min-width: 1500px)': { display: 'none' },
                                width: 38, height: 38, borderRadius: 999,
                                bgcolor: t.palette.primary.main,
                                color: t.palette.primary.contrastText,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                            })}
                            aria-label={isGroupsView ? 'New Group' : 'New Post'}
                        >
                            {isGroupsView ? <GroupAddRoundedIcon sx={{ fontSize: 20 }} /> : <EditRoundedIcon sx={{ fontSize: 20 }} />}
                        </IconButton>
                    </Tooltip>
                )}
                {!isNewsView && mobileDiscoverView !== 'discover' && (
                    <Button
                        onClick={handleCreateClick}
                        variant="contained"
                        size="small"
                        startIcon={isGroupsView ? <GroupAddRoundedIcon /> : <EditRoundedIcon />}
                        sx={(t) => ({
                            display: 'none',
                            // Visible on tablet/laptop (900–1439px) and on wide desktop (≥1500px).
                            // At 1440–1499px the icon-only variant above is used.
                            '@media (min-width: 900px) and (max-width: 1439px)': {
                                display: 'inline-flex',
                            },
                            '@media (min-width: 1500px)': { display: 'inline-flex' },
                            borderRadius: 999, textTransform: 'none', fontWeight: 900,
                            px: 2.5, height: 38, whiteSpace: 'nowrap',
                            bgcolor: t.palette.primary.main,
                            color: t.palette.primary.contrastText,
                            boxShadow: 'none',
                            '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.85), boxShadow: 'none' },
                        })}
                    >
                        {isGroupsView ? 'New Group' : 'New Post'}
                    </Button>
                )}

                {/* Active filter chips — nested inside mobileHeaderRef so they
                    slide with the subheader on scroll. Matches pattern used on
                    Marketplace/Music/Services. */}
                {isMobilePanel && mobileDiscoverView !== 'discover' && activeFilterChips.length > 0 && (
                    <Box sx={{
                        // Full-width row below the inline header row
                        flexBasis: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 0.25,
                        pt: 0.5,
                        // Tablet: tighter row so chips don't eat vertical space.
                        // The Filters button already shows the count, so this row is secondary.
                        '@media (min-width: 900px) and (max-width: 1439px)': {
                            pt: 0.25,
                            gap: 0.375,
                        },
                        flexWrap: 'wrap',
                    }}>
                        {activeFilterChips.slice(0, 3).map((chip) => (
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
                        {activeFilterChips.length > 3 && (
                            <Chip
                                label={`+${activeFilterChips.length - 3} more`}
                                size="small"
                                onClick={() => setMobileFilterDrawerOpen(true)}
                                sx={(t) => ({
                                    height: 26,
                                    borderRadius: 999,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                    color: t.palette.primary.main,
                                    cursor: 'pointer',
                                })}
                            />
                        )}
                    </Box>
                )}

            </Box>

            {/* Account switch dialog — shown when non-personal account taps New Post/Group */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, fontWeight: 900, fontSize: 17, pr: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SwapHorizRoundedIcon sx={{ color: 'primary.main' }} />
                        Switch Account
                    </Box>
                    <IconButton size="small" onClick={() => setAccountSwitchOpen(false)} aria-label="Close" sx={{ width: 32, height: 32 }}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {isGroupsView
                            ? 'Groups are designed for a personal experience. Switch to your personal account to join groups, vote on polls, and participate in discussions.'
                            : 'Community posts are for personal accounts. Switch to your personal profile to create a post, or visit Business Posts to share updates from your business page.'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
                    <Button variant="contained" onClick={() => setAccountSwitchOpen(false)} disableElevation sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, px: 3 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Content (filters + list + footer): fades when switching the top tabs */}
            <Fade in={contentVisible} timeout={tabFadeMs} appear={false}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                    }}
                >
                    {/* ── Mobile: inline Discover view (like ServicesPage pattern) ── */}
                    {isMobilePanel && mobileDiscoverView === 'discover' && (
                        <>
                            <Divider sx={{ borderColor: 'divider' }} />
                            <Box
                                data-discover-scroll
                                sx={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: 'auto',
                                    WebkitOverflowScrolling: 'touch',
                                    overscrollBehavior: 'contain',
                                    position: 'relative',
                                    zIndex: 1,
                                    bgcolor: 'background.paper',
                                    // Reserve space at the top for the floating AppBar +
                                    // section header (Discover/Feed/Groups + search) so the
                                    // first part of the cover image isn't hidden behind
                                    // them on initial paint. Mirrors the Feed/Groups scroll
                                    // padding below. Cleared on desktop where the chrome
                                    // is part of the flex flow.
                                    '@media (max-width: 1439px)': {
                                        paddingTop: 'var(--ll-subheader-height, 52px)',
                                    },
                                    '@media (max-width: 899px)': {
                                        paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                    },
                                }}>
                                <CommunityDiscoverTab />
                            </Box>
                        </>
                    )}

                    {/* Normal content — hidden when mobile discover view is active */}
                    {(!isMobilePanel || mobileDiscoverView !== 'discover') && (
                        <>
                            {/* Filters section — desktop only (mobile uses full-screen filter drawer).
                                Container is always visible on desktop; the internal "Filters" button
                                inside CommunityFilter controls whether the field grid is expanded. */}
                            {!isMobilePanel && (
                                <Box sx={{
                                    flexShrink: 0,
                                    px: 1,
                                    pt: 1,
                                    '@media (min-width: 1440px)': { px: 1.5, pt: 1.5 },
                                    pb: 0.75,
                                    // Short-height desktops: minimize vertical padding so the
                                    // filter panel doesn't eat so much of the feed's space.
                                    '@media (min-width: 1440px) and (max-height: 820px)': {
                                        px: 1,
                                        pt: 0.5,
                                        pb: 0.25,
                                    },
                                }}>
                                    <CommunityFilter
                                        showAdvancedFilters
                                        showSearchInput={false}
                                        mode={isGroupsView ? 'groups' : (isNewsView ? 'news' : 'posts')}
                                        newsCategory={newsCategory}
                                        onNewsCategoryChange={onNewsCategoryChange}
                                        newsDateRange={newsDateRange}
                                        onNewsDateRangeChange={onNewsDateRangeChange}
                                        groupView={groupView}
                                        onGroupViewChange={onGroupViewChange}
                                        selectedView={selectedView}
                                        view={selectedView}
                                        onViewChange={onViewChange}
                                        searchTerm={localSearchTerm}
                                        onSearchTermChange={onSearchTermChange}
                                        onSearchClick={onSearchClick}
                                        onClearClick={onClearClick}
                                        filteredCities={filteredCities}
                                        filteredCounties={filteredCounties}
                                        selectedCity={selectedCity}
                                        onCityChange={onCityChange}
                                        selectedCounty={selectedCounty}
                                        onCountyChange={onCountyChange}
                                        selectedRadius={selectedRadius}
                                        onRadiusChange={onRadiusChange}
                                        selectedSubtype={selectedSubtype}
                                        groupsForCounts={Array.isArray(groupsForCounts) ? groupsForCounts : groups}
                                        subtypes={subtypes}
                                        onSubtypeChange={onSubtypeChange}
                                        postCategoryCounts={postCategoryCounts}
                                        locationCounts={locationCounts}
                                        selectedSort={selectedSort}
                                        sortOptions={sortOptions}
                                        onSortChange={onSortChange}
                                        selectedDateRange={selectedDateRange}
                                        dateRangeOptions={dateRangeOptions}
                                        onDateRangeChange={onDateRangeChange}
                                        groupMemberType={groupMemberType}
                                        onGroupMemberTypeChange={onGroupMemberTypeChange}
                                    />
                                    {/* Mobile-only: Clear Filters button inside the filter panel */}
                                    <Box sx={{ display: 'flex', '@media (min-width: 1440px)': { display: 'none' }, justifyContent: 'flex-end', mt: 1 }}>
                                        <Button
                                            onClick={() => { if (typeof onClearClick === 'function') onClearClick(); }}
                                            disabled={typeof onClearClick !== 'function'}
                                            size="small"
                                            startIcon={<RestartAltRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 12,
                                                px: 1.5,
                                                height: 32,
                                                color: t.palette.text.secondary,
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.text.primary, 0.12),
                                                bgcolor: alpha(t.palette.text.primary, 0.03),
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.06),
                                                    borderColor: alpha(t.palette.text.primary, 0.18),
                                                },
                                            })}
                                        >
                                            Clear Filters
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            <Divider sx={{
                                borderColor: 'divider',
                                ...(isMobilePanel ? {
                                    transition: 'opacity 0.22s ease',
                                    opacity: 1,
                                } : {}),
                            }} />

                            {/* List area (scrolls) */}
                            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                <Box
                                    ref={(node) => { scrollBoxRef.current = node; communityPullRef(node); }}
                                    data-community-scroll
                                    onScroll={(e) => { handleGroupsScroll(e); }}
                                    sx={{
                                        height: '100%',
                                        overflowY: 'scroll',
                                        scrollbarGutter: 'auto',
                                        px: 0,
                                        py: 0.5,
                                        // Mobile/tablet: reserve space at the top and bottom
                                        // for the floating chrome so the first/last items of
                                        // content don't sit under the header or bottom nav
                                        // on initial paint. As the user scrolls, content
                                        // flows UP past the top padding zone — the chrome
                                        // fades as they go, revealing content that was
                                        // already in the DOM the whole time. No layout
                                        // shift means no scroll-position jumps.
                                        '@media (max-width: 1439px)': {
                                            paddingTop: 'var(--ll-subheader-height, 52px)',
                                        },
                                        '@media (max-width: 899px)': {
                                            paddingBottom: 'var(--ll-bottom-nav-height, 56px)',
                                        },
                                        '@media (min-width: 1440px)': {
                                            scrollbarGutter: 'stable',
                                            px: 1.25,
                                            py: 1,
                                        },
                                        // Short-height desktops: trim padding to give the feed
                                        // every pixel of vertical space we can.
                                        '@media (min-width: 1440px) and (max-height: 820px)': {
                                            px: 1,
                                            py: 0.5,
                                        },
                                        WebkitOverflowScrolling: 'touch',
                                        overscrollBehavior: 'contain',
                                    }}
                                >
                                    {pullIndicator}

                                    {/* Inline composer — mobile, Feed (posts) view only,
                                        and ONLY for personal accounts (business/artist accounts
                                        can't create community posts, so we don't tease them with
                                        a composer that would just show a "switch account" dialog). */}
                                    {isMobilePanel && !isGroupsView && !isNewsView && !isNonPersonalAccount && typeof onInlineCompose === 'function' && (
                                        <InlineComposer
                                            viewerUser={viewerUser}
                                            defaultCounty={selectedCounty || viewerUser?.county || ''}
                                            defaultCity={selectedCity || viewerUser?.city || ''}
                                            isLoggedIn={Boolean(viewerUser)}
                                            isNonPersonalAccount={isNonPersonalAccount}
                                            onRequireLogin={redirectToLogin}
                                            onRequireAccountSwitch={() => setAccountSwitchOpen(true)}
                                            onCompose={onInlineCompose}
                                        />
                                    )}

                                    {panelError ? (
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
                                    ) : isNewsView ? (
                                        <NewsList
                                            articles={news.articles}
                                            loading={news.loading}
                                            selectedArticleId={selectedNewsArticleId}
                                            onSelectArticle={(article) => {
                                                if (typeof onSelectNewsArticle === 'function') {
                                                    onSelectNewsArticle(article);
                                                }
                                            }}
                                            emptyMessage={
                                                news.error
                                                    ? news.error
                                                    : (selectedCity || selectedCounty)
                                                        ? 'No news articles match this location and category. Try broadening your filters.'
                                                        : 'No news available yet. Try a different category or location.'
                                            }
                                        />
                                    ) : isGroupsView ? (
                                        <>
                                            <GroupsList
                                                groups={visibleGroups}
                                                user={user}
                                                isLoading={isGroupsLoading}
                                                totalCount={groupsTotalCount}
                                                hasMore={typeof groupsHasMore === 'boolean' ? groupsHasMore : null}
                                                isLoadingMore={isGroupsLoadingMore}
                                                // Infinite scroll handled by CommunityPanel (onScroll) to prevent
                                                // loading every page on mount.
                                                onLoadMore={null}
                                                selectedGroupId={selectedGroupId}
                                                onSelectGroup={onSelectGroup}
                                                groupView={groupView}
                                                isOnPersonalAccount={isOnPersonalAccount}
                                                emptyHeadline={
                                                    selectedCity && selectedCounty ? `No groups found in ${toTitleCase(selectedCity)}, ${toTitleCase(selectedCounty)} County`
                                                        : selectedCity ? `No groups found in ${toTitleCase(selectedCity)}`
                                                            : selectedCounty ? `No groups found in ${toTitleCase(selectedCounty)} County`
                                                                : null
                                                }
                                                emptySubtitle={
                                                    (selectedCity || selectedCounty)
                                                        ? 'Try browsing all counties or adjusting your other filters.'
                                                        : null
                                                }
                                            />

                                            {/* Groups “load more” affordance: show gray skeleton cards while paging */}
                                            {Boolean(isGroupsLoadingMore) && (
                                                <Box sx={{ pt: 1, pb: 0.5 }}>
                                                    <Box
                                                        sx={{
                                                            display: 'grid',
                                                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                                            gap: 1,
                                                        }}
                                                    >
                                                        {Array.from({ length: 6 }).map((_, idx) => (
                                                            <FeedCardSkeleton key={`group-skel-${idx}`} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Sentinel: triggers load-more when visible (handles short lists that don't overflow) */}
                                            {!isGroupsLoading && !isGroupsLoadingMore && (
                                                <GroupsSentinel
                                                    groups={groups}
                                                    groupsRenderCount={groupsRenderCount}
                                                    setGroupsRenderCount={setGroupsRenderCount}
                                                    groupsHasMore={groupsHasMore}
                                                    onLoadMoreGroups={onLoadMoreGroups}
                                                    scrollBoxRef={scrollBoxRef}
                                                />
                                            )}
                                        </>
                                    ) : !isOnPersonalAccount && selectedView === 'mine' ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                flex: 1,
                                                minHeight: '50vh',
                                                height: '100%',
                                                py: 6,
                                                px: 2,
                                            }}
                                        >
                                            <Stack spacing={1.5} alignItems="center">
                                                <Box sx={(t) => ({
                                                    width: 64, height: 64, borderRadius: '50%',
                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                                })}>
                                                    <PersonRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                                </Box>
                                                <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                                                    Personal Account Required
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, lineHeight: 1.55 }}>
                                                    Switch to your personal account to see your posts. Community posts are tied to your personal profile.
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <PostList
                                            isRefreshing={listRefreshing}
                                            user={user}
                                            posts={posts}
                                            loading={isLoading}
                                            hoveredId={hoveredId}
                                            setHoveredId={setHoveredId}
                                            onLocationClick={onLocationClick}
                                            onCardClick={handlePostCardClick}
                                            query={searchTerm}
                                            view={selectedView}
                                            selectedId={selectedPostId}
                                            selectable={selectable}
                                            totalCount={totalCount}
                                            hasMoreExternal={hasMoreExternal}
                                            onLoadMore={onLoadMore}
                                            onDisplayStatsChange={handleDisplayStatsChange}
                                            onMutate={onMutate}
                                            isLoadingMore={isLoadingMore}
                                            isBusinessAccount={isBusinessAccount}
                                            emptyHeadline={
                                                selectedCity && selectedCounty ? `No posts found in ${toTitleCase(selectedCity)}, ${toTitleCase(selectedCounty)} County`
                                                    : selectedCity ? `No posts found in ${toTitleCase(selectedCity)}`
                                                        : selectedCounty ? `No posts found in ${toTitleCase(selectedCounty)} County`
                                                            : null
                                            }
                                            emptySubtitle={
                                                (selectedCity || selectedCounty)
                                                    ? 'Try browsing all counties or adjusting your other filters.'
                                                    : null
                                            }
                                        />
                                    )}
                                </Box>
                            </Box>

                            {/* Fixed bottom status bar — desktop only (matches BusinessHub) */}
                            <Box
                                sx={{
                                    flexShrink: 0,
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                    px: 1.5,
                                    py: 1,
                                    display: 'none', '@media (min-width: 1440px)': { display: 'flex' },
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: (t) => t.palette.background.paper,
                                    backgroundImage: 'none',
                                    backdropFilter: 'none',
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        fontWeight: 800,
                                        color: 'text.secondary',
                                        width: '100%',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        minHeight: 22,
                                    }}
                                >
                                    {footerText}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </Fade>

            {/* ═══ Mobile full-screen filter drawer ═══ */}
            {isMobilePanel && (
                <Drawer
                    anchor="bottom"
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
                            placeholder={isGroupsView ? 'Search groups…' : (isNewsView ? 'Search news…' : 'Search posts…')}
                            value={localSearchTerm}
                            onChange={(e) => {
                                const next = e?.target?.value ?? '';
                                setLocalSearchTerm(next);
                                onSearchTermChange(next);
                            }}
                            inputProps={{ maxLength: 100, autoFocus: true }}
                            onSearch={() => { triggerSearch('manual'); setMobileFilterDrawerOpen(false); }}
                            onClear={() => {
                                setLocalSearchTerm('');
                                onSearchTermChange('');
                                if (typeof onSearchClick === 'function') {
                                    onSearchClick('manual', '');
                                }
                            }}
                        />
                    </Box>

                    {/* Filter controls — scrollable */}
                    <Box sx={{ flex: 1, overflow: 'auto', px: 2, pt: 1, pb: 2 }}>
                        <CommunityFilter
                            showAdvancedFilters
                            showSearchInput={false}
                            forceVerticalLocation
                            mode={isGroupsView ? 'groups' : (isNewsView ? 'news' : 'posts')}
                            newsCategory={newsCategory}
                            onNewsCategoryChange={onNewsCategoryChange}
                            newsDateRange={newsDateRange}
                            onNewsDateRangeChange={onNewsDateRangeChange}
                            groupView={groupView}
                            onGroupViewChange={onGroupViewChange}
                            selectedView={selectedView}
                            view={selectedView}
                            onViewChange={onViewChange}
                            searchTerm={localSearchTerm}
                            onSearchTermChange={onSearchTermChange}
                            onSearchClick={onSearchClick}
                            onClearClick={onClearClick}
                            filteredCities={filteredCities}
                            filteredCounties={filteredCounties}
                            selectedCity={selectedCity}
                            onCityChange={onCityChange}
                            selectedCounty={selectedCounty}
                            onCountyChange={onCountyChange}
                            selectedSubtype={selectedSubtype}
                            groupsForCounts={Array.isArray(groupsForCounts) ? groupsForCounts : groups}
                            subtypes={subtypes}
                            onSubtypeChange={onSubtypeChange}
                            postCategoryCounts={postCategoryCounts}
                            locationCounts={locationCounts}
                            selectedSort={selectedSort}
                            sortOptions={sortOptions}
                            onSortChange={onSortChange}
                            selectedDateRange={selectedDateRange}
                            dateRangeOptions={dateRangeOptions}
                            onDateRangeChange={onDateRangeChange}
                            groupMemberType={groupMemberType}
                            onGroupMemberTypeChange={onGroupMemberTypeChange}
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
                                if (typeof onClearClick === 'function') onClearClick();
                            }}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800, color: 'text.secondary', px: 2 }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                triggerSearch('manual');
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
                </Drawer>
            )}

            {/* Mobile FAB removed — create action now lives in the global Header (+) menu */}
        </Box>
    );
}