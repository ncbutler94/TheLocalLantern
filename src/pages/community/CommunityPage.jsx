// src/pages/community/CommunityPage.jsx
// Fixed, no-window-scroll layout with a tabbed right-hand panel (Trending / Map / Posts),
// UPDATED (Trending):
//   • Right panel now shows category-level trending summaries (counts) based ONLY on the
//     selected location (county/city). Changing location updates Trending; other filters
//     don't affect it.
//   • Clicking a summary clears all filters, applies that category, sets View→Trending,
//     runs the search, and switches to the Posts tab.
// UPDATED (Sorting):
//   • Trending is now a View mode (View → Trending). Feed fetch uses sort=trending internally.
//   • When sort=trending yields no scored posts, the list should be empty (backend enforces score > 0).
//
// UPDATE 2025-12-19:
//   • Scroll the left post list back to top whenever a search/filter action executes,
//     including right-side Trending selection. (driven via scrollResetKey)

import React, {
    useState,
    useMemo,
    useEffect,
    useLayoutEffect,
    useCallback,
    useReducer,
    useRef,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Drawer,
    Fab,
    IconButton,
    Slide,
    Typography,
} from '@mui/material';
import { useTheme, alpha as alphaColor } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloseIcon from '@mui/icons-material/Close';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import GroupsIcon from '@mui/icons-material/Groups';
// Slice 2e: NewspaperRoundedIcon for the News-mode right-panel empty state.
// Matches the iconography used by the community-post empty state
// (ForumIcon) so both panels feel like the same family.
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../components/Header/Header';
import postsIcon from '../../assets/posts_icon.png';
import groupIcon from '../../assets/group_icon.png';
import defaultGroups from '../../assets/default_groups.png';

import CommunityPanel from './CommunityPanel';
import CommunityNewsDetailPanel from './components/CommunityNewsDetailPanel';
import CommunityFilter from './CommunityFilter';
import { PostCard } from './PostList';
import PostDetailModal from './PostDetailModal';
import SwipeableRightDrawer from '../../components/SwipeableRightDrawer';
import SwipeableBottomDrawer from '../../components/SwipeableBottomDrawer';
import useCommunityData from './hooks/useCommunityData';
import useGroupsData from './hooks/useGroupsData';
import CommunityRightPanel from './components/CommunityRightPanel';
import CommunityOverlays from './components/CommunityOverlays';
import SuccessSnackbar, { useSuccessSnackbar } from '../../components/SuccessSnackbar';
import { useActiveAccount } from '../../components/AccountContext';
import useRateLimit from '../../utils/useRateLimit';
import RateLimitDialog from '../../components/RateLimitDialog';
import { secureFetch } from '../../utils/secureFetch';
import GroupPage from './groups/groupPage/GroupPage';

import cityData from '../../data/alabamaCities.json';
import countyData from '../../data/alabamaCounties.json';
import cityCountyMap from '../../data/cityCountyMap.json';
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
    RADIUS_VALUE_WHEN_NO_COUNTY,
} from '../../utils/geoRadius';

// Trending lantern icon (left of title)

// --- Census GeoJSON helpers (cities/counties) ---
// Our Alabama Census files are GeoJSON FeatureCollections.
// Cities are Points; Counties are Polygons/MultiPolygons.
// This normalizes them into simple arrays: { name, coordinates:[lat,lng] } for use in dropdowns and flyTo.
function featureToLatLng(feature) {
    if (!feature || !feature.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    // Polygon: [ [ [lng,lat], ... ] , ... ]
    // MultiPolygon: [ [ [ [lng,lat], ... ] , ... ] , ... ]
    const allRings = [];
    if (type === 'Polygon' && Array.isArray(coordinates)) {
        for (const ring of coordinates) {
            if (Array.isArray(ring)) allRings.push(ring);
        }
    } else if (type === 'MultiPolygon' && Array.isArray(coordinates)) {
        for (const poly of coordinates) {
            if (!Array.isArray(poly)) continue;
            for (const ring of poly) {
                if (Array.isArray(ring)) allRings.push(ring);
            }
        }
    } else {
        return null;
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const ring of allRings) {
        for (const pt of ring) {
            if (!Array.isArray(pt) || pt.length < 2) continue;
            const [lng, lat] = pt;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        }
    }

    if (!Number.isFinite(minLat) || !Number.isFinite(maxLat) || !Number.isFinite(minLng) || !Number.isFinite(maxLng)) {
        return null;
    }

    return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

function normalizeGeoJsonList(geo, nameKey = 'NAME') {
    const features = Array.isArray(geo) ? geo : (geo?.features || []);
    if (!Array.isArray(features)) return [];

    const out = [];
    for (const f of features) {
        const name = String(f?.properties?.[nameKey] || '').trim();
        if (!name) continue;
        const latLng = featureToLatLng(f);
        if (!latLng) continue;
        out.push({ name, coordinates: latLng });
    }
    return out;
}


const api = process.env.REACT_APP_API_URL || '';

const GROUPS_ENDPOINTS = ['/api/groups', '/api/community/groups'];


const GROUPS_PAGE_SIZE = 25;
const DEFAULT_CENTER = [32.69, -86.79113];
const DEFAULT_ZOOM = 7.0;

/** Right panel width (normal vs expanded on Posts tab) */
const RIGHT_WIDTH = { xs: '40%', lg: '35%' };
const RIGHT_WIDTH_EXPANDED = { xs: '48%', lg: '44%' };

const BOTTOM_GUTTER_PX = 0;
const APP_BACKGROUND = 'background.default';

const HEADER_H = { xs: 50, lg: 56 };

// Keep group avatars consistent across Overview + Group Posts tabs
const GROUP_AVATAR_SIZE = 76;
const DEFAULT_GROUP_AVATAR_SCALE = 1.18;

// Keep zoom below street-label level (OSM street names typically appear at >= 15).
// Address pins should still be “neighborhood-level” so users can orient without exposing exact street detail.
// Zoom levels: county shows broad area, city zooms a touch further.
const ZOOM_BY_LEVEL = { city: 9, county: 8 };

/* ---------- slug helpers ---------- */
const SLUG_MAP = {
    announcements: 'announcement',
    'volunteer-help': 'volunteer-requests',
    'volunteer-help-requests': 'volunteer-requests',
    recommendation: 'recommendations-tips',
};
const normalizeSubtype = (s) => SLUG_MAP[s] ?? s;

// Keep category ids consistent (legacy support)
const normalizeCategory = (v) => {
    const s = String(v || '').trim().toLowerCase();
    if (s === 'community-chat' || s === 'community_chat' || s === 'community chat') return 'discussion';
    return s;
};

/* ---------- reducer ---------- */

// ── Stable constants: extracted outside component to prevent infinite re-render loops. ──
// Inline array/object literals in JSX props create new references every render,
// which can trigger child re-renders and — when passed through to hooks with deps — loops.
const GROUPS_SORT_OPTIONS = Object.freeze([
    { value: 'random', label: 'Any' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'most_active', label: 'Most Active' },
    { value: 'most_members', label: 'Most Members' },
]);
const POSTS_SORT_OPTIONS = Object.freeze([
    { value: 'random', label: 'Any' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Most Popular' },
]);
const POSTS_DATE_RANGE_OPTIONS = Object.freeze([
    { value: 'all', label: 'All time' },
    { value: '24h', label: 'Past 24h' },
    { value: '7d', label: 'Past week' },
    { value: '30d', label: 'Past month' },
]);
const EMPTY_ARRAY = Object.freeze([]);

const initialFilters = {
    search: '',
    appliedSearch: '',
    view: 'all',
    subtype: '',
    sort: 'newest',
    dateRange: 'all',
    city: '',
    county: '',
    radius: STATEWIDE,  // default when no county selected; reset to '0' when county is chosen
};
function filterReducer(state, { type, value }) {
    return { ...state, [type]: value };
}

/* ---------- category colors/labels ---------- */
const buildCategoryMeta = (theme) => {
    const c = theme.custom.categories;
    return {
        announcement:          { color: c.announcement, label: 'Announcements', noun: 'announcements' },
        announcements:         { color: c.announcement, label: 'Announcements', noun: 'announcements' },
        discussion:            { color: c.discussion,   label: 'Discussions',   noun: 'discussions' },
        tips:                  { color: c.tips,         label: 'Tips',          noun: 'tips' },
        recommendations:       { color: c.tips,         label: 'Recommendations', noun: 'recommendations' },
        'recommendations-tips':{ color: c.tips,         label: 'Tips/Recommendations', noun: 'posts' },
        'help-requests':       { color: c.helpRequests, label: 'Help Requests', noun: 'requests' },
        volunteers:            { color: c.helpRequests, label: 'Volunteers',    noun: 'volunteers' },
        'volunteer-requests':  { color: c.helpRequests, label: 'Volunteer/Help', noun: 'posts' },
        'lost-found':          { color: c.lostFound,    label: 'Lost & Found',  noun: 'items' },
        'lost-and-found':      { color: c.lostFound,    label: 'Lost & Found',  noun: 'items' },
        'public-safety-alerts':{ color: c.safety,       label: 'Safety Alerts', noun: 'alerts' },
    };
};

const deriveSplitCategory = (post) => {
    let cat = normalizeCategory(post?.category);
    if (cat === 'recommendations-tips') {
        const rt = String(post?.rec_type || '').toLowerCase();
        if (rt === 'tip' || rt === 'tips') return 'tips';
        if (rt === 'recommendation' || rt === 'recommendations' || rt === 'business') return 'recommendations';
        return 'recommendations';
    }
    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests') {
        const kind = String(post?.request_kind || post?.requestKind || post?.help_type || '').toLowerCase();
        if (['help', 'request', 'help-request', 'help_request', 'need', 'ask'].includes(kind)) return 'help-requests';
        if (['volunteer', 'volunteering', 'offer', 'offers'].includes(kind)) return 'volunteers';
        return 'help-requests';
    }
    return cat || 'announcement';
};

/* ---------- community page state/cache (return from PostPage without losing place) ---------- */
const COMMUNITY_STATE_KEY = 'll:community:state';
const COMMUNITY_DATA_KEY = 'll:community:data';

function safeParseJson(str) {
    if (!str || typeof str !== 'string') return null;
    try {
        return JSON.parse(str);
    } catch {
        return null;
    }
}

function readCommunityState() {
    try {
        const raw = sessionStorage.getItem(COMMUNITY_STATE_KEY);
        const data = safeParseJson(raw);
        if (!data || typeof data !== 'object') return null;

        const filters = data.filters && typeof data.filters === 'object' ? data.filters : null;
        const sanitizedFilters = filters
            ? {
                search: String(filters.search ?? ''),
                appliedSearch: String(filters.appliedSearch ?? ''),
                view: String(filters.view ?? 'all'),
                subtype: String(filters.subtype ?? ''),
                sort: String(filters.sort ?? 'newest'),
                dateRange: String(filters.dateRange ?? 'all'),
                city: String(filters.city ?? ''),
                county: String(filters.county ?? ''),
            }
            : null;

        const center = Array.isArray(data.center) && data.center.length === 2 ? data.center : null;
        const zoomLevel = Number.isFinite(Number(data.zoomLevel)) ? Number(data.zoomLevel) : null;

        // Only restore the selected post when explicitly returning from PostPage
        // (restore or navigatedToPost flag set).  On a hard refresh / account switch
        // the flags won't be present, so we keep selectedPost null to avoid stale
        // ActionBar flash issues from a previous session.
        let restoredSelectedPost = null;
        try {
            const isBackNav =
                sessionStorage.getItem('ll:community:restore') === '1' ||
                sessionStorage.getItem('ll:community:navigatedToPost') === '1';
            if (isBackNav && data.selectedPost && typeof data.selectedPost === 'object' && data.selectedPost.id != null) {
                restoredSelectedPost = data.selectedPost;
            }
        } catch { /* ignore */ }

        return {
            filters: sanitizedFilters,
            leftMode: typeof data.leftMode === 'string' ? data.leftMode : null,
            groupView: typeof data.groupView === 'string' ? data.groupView : null,
            activeTab: typeof data.activeTab === 'string' ? data.activeTab : null,
            detailExpanded: Boolean(data.detailExpanded),
            showFilters: data.showFilters == null ? null : Boolean(data.showFilters),
            selectedPost: restoredSelectedPost,
            selectedGroup: data.selectedGroup && typeof data.selectedGroup === 'object' ? data.selectedGroup : null,
            openedPopupId: null,
            center,
            zoomLevel,
            savedPostsFilters: data.savedPostsFilters && typeof data.savedPostsFilters === 'object' ? data.savedPostsFilters : null,
            savedGroupsFilters: data.savedGroupsFilters && typeof data.savedGroupsFilters === 'object' ? data.savedGroupsFilters : null,
        };
    } catch {
        return null;
    }
}

function writeCommunityState(payload) {
    try {
        sessionStorage.setItem(COMMUNITY_STATE_KEY, JSON.stringify(payload));
    } catch {
        // ignore
    }
}

function readCommunityData() {
    try {
        const raw = sessionStorage.getItem(COMMUNITY_DATA_KEY);
        const data = safeParseJson(raw);
        if (!data || typeof data !== 'object') return null;
        const posts = Array.isArray(data.posts) ? data.posts : null;
        const points = data.points && typeof data.points === 'object' ? data.points : null;
        return posts || points ? { posts: posts || [], points: points || null } : null;
    } catch {
        return null;
    }
}

function writeCommunityData(payload) {
    try {
        sessionStorage.setItem(COMMUNITY_DATA_KEY, JSON.stringify(payload));
    } catch {
        // ignore
    }
}


function normalizePostCategoryForCounts(post) {
    const cat = String(post?.category || '').trim().toLowerCase();
    if (!cat) return '';

    if (cat === 'community-chat' || cat === 'community_chat' || cat === 'community chat') {
        return 'discussion';
    }
    if (cat === 'volunteer') {
        return 'volunteers';
    }
    if (cat === 'recommendations-tips' || cat === 'tips' || cat === 'tip') {
        return 'recommendations';
    }
    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests') {
        const kind = String(post?.request_kind || post?.requestKind || '').toLowerCase();
        if (kind === 'volunteer' || kind === 'offer' || kind === 'offering') {
            return 'volunteers';
        }
        return 'help-requests';
    }

    return cat;
}

function buildPostCategoryCounts(posts) {
    const counts = {};
    (Array.isArray(posts) ? posts : []).forEach((post) => {
        const normalizedCat = normalizePostCategoryForCounts(post);
        if (!normalizedCat) return;
        counts[normalizedCat] = (counts[normalizedCat] || 0) + 1;
    });
    return counts;
}

/**
 * PopupPostCardWrapper
 * --------------------
 * Thin wrapper that renders a PostCard for the map popup.
 * It reads volatile visual-only values (hoveredId, selectedId) from refs
 * so that the parent popupContentById Map does NOT need to be rebuilt
 * every time those values change — which previously caused an infinite
 * re-render loop (new Map → CommunityMapView effect → setState → new Map …).
 *
 * The wrapper subscribes to the ref values via a lightweight state sync:
 * CommunityPage bumps a counter whenever hoveredId / openedPopupId / selectedPostId
 * change, and this component re-reads the refs on that tick.
 */
const PopupPostCardWrapper = React.memo(function PopupPostCardWrapper({
                                                                          post,
                                                                          user,
                                                                          onMutate,
                                                                          currentView,
                                                                          onOpenUserCard,
                                                                          onLocationClick,
                                                                          onCardClick,
                                                                          setHoveredId,
                                                                          hoveredIdRef,
                                                                          selectedPostIdRef,
                                                                          openedPopupIdRef,
                                                                          isBusinessAccount,
                                                                          isArtistAccount,
                                                                      }) {
    // Re-read refs each render (triggered by visualTick changing)
    const hId = hoveredIdRef.current;
    const selId = selectedPostIdRef.current;
    const popId = openedPopupIdRef.current;

    return (
        <PostCard
            key={`popup-${post.id}`}
            post={post}
            user={user}
            onMutate={onMutate}
            currentView={currentView}
            showTopAccent={false}
            onOpenUserCard={onOpenUserCard}
            onLocationClick={onLocationClick}
            onCardClick={onCardClick}
            hoveredId={hId}
            setHoveredId={setHoveredId}
            selectable
            selectedId={popId != null ? popId : selId}
            isBusinessAccount={isBusinessAccount}
            isArtistAccount={isArtistAccount}
        />
    );
});

export default function CommunityPage() {

    const theme = useTheme();
    const isMobile = useMediaQuery('(max-width:1439px)');
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const [mobileMapOpen, setMobileMapOpen] = useState(false);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);
    // Track what the mobile detail drawer should show ('discover' | 'post' | 'group')
    // This is independent of activeTab so the tab-validation effect can't reset it.
    const [mobileDrawerMode, setMobileDrawerMode] = useState('post');
    // ── Group page fullscreen slide-in overlay ──
    const [groupPageOpen, setGroupPageOpen] = useState(false);
    const [groupPageUsername, setGroupPageUsername] = useState(null);
    const CATEGORY_META = useMemo(() => buildCategoryMeta(theme), [theme]);

    /* ---------- routing (needed early for restore logic) ---------- */
    const loc = useLocation();
    const navigate = useNavigate();

    /* ---------- Security: handle expired auth tokens ---------- */
    // ── Close mobile detail drawer on browser back button ──
    // Pushes a history entry when the drawer opens so pressing back closes it
    // instead of navigating away and leaving a frozen overlay.
    useEffect(() => {
        if (!mobileDetailOpen) return;
        window.history.pushState({ mobileDetail: true }, '');
        const handlePopState = () => setMobileDetailOpen(false);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileDetailOpen]);

    // ── Close mobile map drawer on browser back button ──
    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ mobileMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); setSelectedPost(null); setOpenedPopupId(null); setMobileDetailOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);

    // Listen for the TOKEN_EXPIRED event dispatched by secureFetch / axiosInstance.
    // Redirect to login so the user can re-authenticate.
    useEffect(() => {
        const onTokenExpired = () => {
            try {
                sessionStorage.setItem('ll:returnTo', window.location.pathname + window.location.search);
            } catch { /* ignore */ }
            navigate('/login?reason=session_expired', { replace: true });
        };
        window.addEventListener('auth:token-expired', onTokenExpired);
        return () => window.removeEventListener('auth:token-expired', onTokenExpired);
    }, [navigate]);

    /* ---------- business/artist account detection ---------- */
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const isOnPersonalAccount = !isBusinessAccount && !isArtistAccount;

    /* ---------- post rate limiting ---------- */
    const { checkLimit: checkPostLimit, recordAction: recordPost } = useRateLimit('community-post', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 15,
    });
    /* ---------- group creation rate limiting ---------- */
    const { checkLimit: checkGroupLimit, recordAction: recordGroup } = useRateLimit('community-group', {
        burstMax: 2,
        burstWindowMs: 60_000,
        maxPerHour: 5,
    });
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'posts',
    });

    /* ---------- window/body scroll lock + header measurement ---------- */
    const [chromeTop, setChromeTop] = useState(0);

    // Note: Previously the container's top/bottom expanded when the mobile nav
    // bars were hidden (via body class `ll-mobile-nav-hidden`). That caused the
    // container to resize mid-scroll, which produced jarring layout shifts
    // while the bars animated. With continuous scroll-hide (see Header.jsx
    // `--ll-nav-offset`), the bars slide out of the viewport via transform but
    // the Community container stays at its normal size — this eliminates the
    // layout thrash and lets the internal scroll proceed smoothly.

// Subtle mount fade to make navigation feel smoother.
    const [pageVisible, setPageVisible] = useState(false);
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

// ✅ NEW: bump this whenever we need to force-refresh the X-Total-Count header
// (ex: after Hide/Block actions that don't change the queryKey)
    const [countRefreshSeq, bumpCountRefreshSeq] = useReducer((n) => n + 1, 0);

// Lock window scrolling for this fixed-layout page *without* causing a scrollbar width jump.
// We do this in a layout effect so the measurement + styles land before the first paint.
    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        // Prevent the "page shifts when dialogs/menus open" effect.
        // MUI scroll-lock will try to add padding-right to <body> to compensate for the scrollbar.
        // On this fixed-layout page we already compensate, so we override any additional padding.
        const STYLE_ID = 'll-community-noshift-style';
        const BODY_CLASS = 'll-community-fixed-layout';

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.type = 'text/css';
            styleEl.appendChild(
                document.createTextNode(
                    `
                    body.${BODY_CLASS} {
                      padding-right: var(--ll-community-scrollbar-comp, 0px) !important;
                      overflow: hidden !important;
                    }
                    html.${BODY_CLASS} {
                      padding-right: var(--ll-community-scrollbar-comp, 0px) !important;
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
        const prevCssVarBody = body.style.getPropertyValue('--ll-community-scrollbar-comp');
        const prevCssVarHtml = html.style.getPropertyValue('--ll-community-scrollbar-comp');

        // Compensate for scrollbar removal to prevent the "jitter" layout shift.
        const scrollbarWidth = window.innerWidth - html.clientWidth;

        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';

        // Apply to BOTH html and body so fixed/sticky app chrome (like the Header/AppBar)
        // doesn't shift when the scrollbar is removed on this fixed-layout page.
        const comp = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '0px';
        html.style.setProperty('--ll-community-scrollbar-comp', comp);
        body.style.setProperty('--ll-community-scrollbar-comp', comp);

        // Keep the original inline styles for backward compatibility,
        // but the CSS rule above will prevent MUI from stacking extra padding.
        html.style.paddingRight = comp;
        body.style.paddingRight = comp;

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

        // Measure immediately (before paint) + once more on the next frame for safety
        // (fonts / AppBar settling can slightly change height).
        measure();
        let raf2 = null;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(measure);
        });

        window.addEventListener('resize', measure);

        return () => {
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            window.removeEventListener('resize', measure);

            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;

            if (prevCssVarHtml) html.style.setProperty('--ll-community-scrollbar-comp', prevCssVarHtml);
            else html.style.removeProperty('--ll-community-scrollbar-comp');

            if (prevCssVarBody) body.style.setProperty('--ll-community-scrollbar-comp', prevCssVarBody);
            else body.style.removeProperty('--ll-community-scrollbar-comp');

            body.classList.remove(BODY_CLASS);
            html.classList.remove(BODY_CLASS);
        };
    }, []);

    /* ---------- refs ---------- */
    const mapRef = useRef(null);
    const detailScrollRef = useRef(null);
    const lastMarkerLatLngByIdRef = useRef({});
    const refetchTimerRef = useRef(null);
    const latestRefetchRef = useRef(null);
    const reopenPopupTimerRef = useRef(null);

    // Groups: allow join action handler to call the latest hook functions without TDZ issues
    const joinGroupRef = useRef(null);
    const refetchGroupsRef = useRef(null);

    // Debounce refs for search efficiency
    const autoSearchTimerRef = useRef(null);
    const searchDebounceRef = useRef(null);

    useEffect(() => {
        return () => {
            if (refetchTimerRef.current) {
                clearTimeout(refetchTimerRef.current);
                refetchTimerRef.current = null;
            }
            if (reopenPopupTimerRef.current) {
                clearTimeout(reopenPopupTimerRef.current);
                reopenPopupTimerRef.current = null;
            }
            if (autoSearchTimerRef.current) {
                clearTimeout(autoSearchTimerRef.current);
                autoSearchTimerRef.current = null;
            }
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = null;
            }
        };
    }, []);

    const scheduleRefetch = useCallback(() => {
        if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);

        refetchTimerRef.current = setTimeout(() => {
            refetchTimerRef.current = null;
            if (typeof latestRefetchRef.current === 'function') {
                latestRefetchRef.current();
            }
        }, 0);
    }, []);

    const handlePostMutate = useCallback(() => {
        // Force-refresh the feed after edits/deletes/etc so the list reflects server truth
        // (important for fields derived from joins like expires_at).
        try {
            scheduleRefetch();
            bumpCountRefreshSeq();
        } catch {
            // ignore
        }
    }, [scheduleRefetch, bumpCountRefreshSeq]);

// Keep Community list in sync with edits/deletes/mark-found from dialogs (profile page or community page).
    useEffect(() => {
        const refresh = () => {
            try {
                scheduleRefetch();
                bumpCountRefreshSeq();
            } catch {
                // ignore
            }
        };

        const onUpdated = (e) => {
            refresh();
            if (!e?.detail?.commentCountOnly) {
                showSuccess('Post updated successfully');
            }
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:deleted', refresh);
        window.addEventListener('ll:communityPost:markedFound', refresh);
        window.addEventListener('ll:communityPost:resolved', refresh);
        window.addEventListener('ll:communityPost:unresolved', refresh);

        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:deleted', refresh);
            window.removeEventListener('ll:communityPost:markedFound', refresh);
            window.removeEventListener('ll:communityPost:resolved', refresh);
            window.removeEventListener('ll:communityPost:unresolved', refresh);
        };
    }, [scheduleRefetch, bumpCountRefreshSeq]);



    /* ---------- user ---------- */
    const [user, setUser] = useState(null);
    useEffect(() => {
        const ac = new AbortController();
        let alive = true;
        secureFetch('/users/profile', { signal: ac.signal, credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((u) => {
                if (alive) setUser(u?.user || null);
            })
            .catch((err) => {
                if (err?.name !== 'AbortError' && alive) setUser(null);
            });
        return () => {
            alive = false;
            ac.abort();
        };
    }, []);


    const handleJoinSelectedGroup = useCallback(async (groupOrId) => {
        // Block joining on business/artist accounts
        if (isBusinessAccount || isArtistAccount) {
            setSwitchAccountDialog({ open: true, message: 'Groups are designed for a personal experience. Switch to your personal account to join groups, vote on polls, and participate in discussions.' });
            return;
        }

        const viewer = user?.user || user || null;

        if (!viewer) {
            try {
                sessionStorage.setItem('ll:returnTo', window.location.pathname + window.location.search);
            } catch {
                // ignore
            }
            navigate('/login');
            return;
        }

        const gid = (groupOrId && typeof groupOrId === 'object')
            ? (groupOrId.id ?? groupOrId.group_id ?? null)
            : groupOrId;

        const gidStr = gid != null ? String(gid) : '';
        if (!gidStr) return;

        const fn = joinGroupRef.current;
        if (typeof fn !== 'function') return;

        try {
            const result = await fn(gidStr);

            // Notify page state to patch selectedGroup + refresh list, without coupling to hook closure order.
            let status = String(result?.status || result?.membership_status || '').toLowerCase();
            if (!status) {
                if (result?.is_member || result?.isMember) status = 'joined';
                else if (result?.has_requested || result?.hasRequested) status = 'pending';
            }

            window.dispatchEvent(new CustomEvent('ll:group:membershipChanged', {
                detail: { groupId: gidStr, status: status || null },
            }));
        } catch (err) {
            // Soft fail for now (later we can show a toast)
            // eslint-disable-next-line no-console
            console.error(err);
        }
    }, [navigate, user, isBusinessAccount, isArtistAccount]);

    /* ---------- UI: active tab + selection ---------- */
    const initialCommunityState = useMemo(() => {
        try {
            if (sessionStorage.getItem('ll:community:forceRefresh') === '1') return null;
        } catch {
            // ignore
        }
        return readCommunityState();
    }, []);
    const initialCommunityData = useMemo(() => {
        try {
            if (sessionStorage.getItem('ll:community:forceRefresh') === '1') return null;
        } catch {
            // ignore
        }
        return readCommunityData();
    }, []);

    // Capture restore intent during render (before any effects can clear the flag).
    // This ref is the single source of truth for "should we restore state" across all effects.
    const shouldRestoreRef = useRef(null);
    // Capture the saved scroll position during render — BEFORE the persist effect
    // can overwrite it with 0 when the component remounts.
    const savedScrollTopRef = useRef(null);
    if (shouldRestoreRef.current === null) {
        let restoreIntent = Boolean(loc?.state?.restoreCommunity);
        if (!restoreIntent) {
            try {
                restoreIntent = sessionStorage.getItem('ll:community:restore') === '1';
            } catch {
                // ignore
            }
        }
        // Also check the navigatedToPost flag (set when clicking View Post Page)
        if (!restoreIntent) {
            try {
                restoreIntent = sessionStorage.getItem('ll:community:navigatedToPost') === '1';
            } catch {
                // ignore
            }
        }
        shouldRestoreRef.current = restoreIntent;

        // Snapshot the scroll position NOW (during render) so the persist effect
        // can't clobber it with 0 before the restore effect reads it.
        if (restoreIntent) {
            try {
                savedScrollTopRef.current = Number(sessionStorage.getItem('ll:community:scrollTop') || 0);
            } catch {
                savedScrollTopRef.current = 0;
            }
        }
    }

    useEffect(() => {
        try {
            sessionStorage.removeItem('ll:community:restore');
        } catch {
            // ignore
        }
    }, []);


    /* ---------- persist + restore left list scroll position ---------- */
    useEffect(() => {
        // Keep the current community URL around so PostPage (or auth redirects) can navigate back precisely.
        try {
            sessionStorage.setItem('ll:community:url', window.location.pathname + window.location.search);
        } catch {
            // ignore
        }
    }, [loc?.pathname, loc?.search]);

    useEffect(() => {
        // Persist left list scroll as the user browses, so auth redirects can return them to the exact spot.
        const el = document.querySelector('[data-community-scroll]');
        if (!el) return undefined;

        const onScroll = () => {
            try {
                sessionStorage.setItem('ll:community:scrollTop', String(el.scrollTop || 0));
            } catch {
                // ignore
            }
        };

        el.addEventListener('scroll', onScroll, { passive: true });

        // Only snapshot the current (zero) scrollTop on a fresh visit.
        // When restoring, skip this so we don't overwrite the saved position
        // before the restore effect can read it.
        if (!shouldRestoreRef.current) {
            onScroll();
        }

        return () => {
            try {
                el.removeEventListener('scroll', onScroll);
            } catch {
                // ignore
            }
        };
    }, []);

    useEffect(() => {
        // Clean up the navigatedToPost flag. The actual scroll restoration is handled
        // by CommunityPanel via the restoreScrollTop prop, since it owns the scroll ref.
        try { sessionStorage.removeItem('ll:community:navigatedToPost'); } catch { /* ignore */ }
    }, []);


// ✅ If we just deleted a post from PostPage, do a one-time "hard refresh" of Community
// so we don't restore a stale selectedPost from sessionStorage.
    useEffect(() => {
        let pendingDeleteId = null;
        let force = false;
        let postDeleted = false;

        try {
            pendingDeleteId = sessionStorage.getItem('ll:community:pendingDeleteId');
            force = sessionStorage.getItem('ll:community:forceRefresh') === '1';
            postDeleted = sessionStorage.getItem('ll:community:postDeletedSuccess') === '1';
        } catch {
            pendingDeleteId = null;
            force = false;
            postDeleted = false;
        }

        if (!pendingDeleteId && !force) return;

        try {
            sessionStorage.removeItem('ll:community:pendingDeleteId');
            sessionStorage.removeItem('ll:community:forceRefresh');
            sessionStorage.removeItem('ll:community:postDeletedSuccess');
            sessionStorage.removeItem(COMMUNITY_STATE_KEY);
            sessionStorage.removeItem(COMMUNITY_DATA_KEY);
        } catch {
            // ignore
        }

        if (postDeleted) {
            showSuccess('Post deleted successfully');
        }

        const deletedIdStr = pendingDeleteId != null ? String(pendingDeleteId) : null;

        // Clear the right-side selected detail and any open map popup.
        setSelectedPost(null);
        setOpenedPopupId(null);

        // Purge cached popup data for that post.
        if (deletedIdStr) {
            setPopupPostCache((prev) => {
                const next = { ...(prev || {}) };
                delete next[deletedIdStr];
                return next;
            });
        }

        // Purge it from cached data + paged rows too (so it can't appear selected from cache).
        if (deletedIdStr) {
            setCachedData((prev) => {
                const oldPosts = Array.isArray(prev?.posts) ? prev.posts : [];
                const nextPosts = oldPosts.filter((p) => String(p?.id ?? '') !== deletedIdStr);
                const nextPoints = prev?.points || null;
                return { posts: nextPosts, points: nextPoints };
            });

            setPagedPosts((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.filter((p) => String(p?.id ?? '') !== deletedIdStr);
            });

            setTotalCount((prev) => {
                const n = Number(prev);
                return Number.isFinite(n) && n > 0 ? Math.max(0, n - 1) : prev;
            });
        }

        // Finally, refetch fresh data.
        try {
            scheduleRefetch();
        } catch {
            // ignore
        }
    }, [scheduleRefetch]);

    const [activeTab, setActiveTab] = useState(() => {
        const saved = initialCommunityState?.activeTab;
        // If a selectedPost is being restored, ensure we show the posts tab
        // so the detail panel is visible.
        if (initialCommunityState?.selectedPost) return 'posts';
        if (saved && typeof saved === 'string') return saved;
        return 'discover';
    });
    const activeTabRef = useRef(
        initialCommunityState?.selectedPost
            ? 'posts'
            : (initialCommunityState?.activeTab || 'discover')
    );
    const setActiveTabSafe = useCallback((nextTab) => {
        activeTabRef.current = nextTab;
        setActiveTab(nextTab);
    }, []);

    const [selectedPost, setSelectedPost] = useState(initialCommunityState?.selectedPost || null);

    const [selectedGroup, setSelectedGroup] = useState(initialCommunityState?.selectedGroup || null);

// Groups Overview: description expand/collapse
    const [showFullGroupDescription, setShowFullGroupDescription] = useState(false);
    useEffect(() => {
        setShowFullGroupDescription(false);
    }, [selectedGroup?.id]);

// Group right-panel feed (when a group is selected)
    const [groupPosts, setGroupPosts] = useState([]);
    const [groupPostsLoading, setGroupPostsLoading] = useState(false);
    const [groupPostsError, setGroupPostsError] = useState('');
    const [selectedGroupPostId, setSelectedGroupPostId] = useState(null);

    const selectedGroupPostDetail = useMemo(() => {
        if (!selectedGroupPostId) return null;
        const raw = groupPosts.find((p) => (p?.id ?? p?.post_id) === selectedGroupPostId) || null;
        if (!raw) return null;

        const visRaw = String(selectedGroup?.visibility || selectedGroup?.privacy || '').trim().toLowerCase();
        const isPrivate = Boolean(selectedGroup?.is_private ?? selectedGroup?.isPrivate) || (visRaw && visRaw !== 'public');

        return {
            ...raw,
            __ll_group_post: true,
            __ll_group_is_private: isPrivate,
        };
    }, [groupPosts, selectedGroupPostId, selectedGroup]);


    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isCreateGroupPostOpen, setIsCreateGroupPostOpen] = useState(false);
    const [switchAccountDialog, setSwitchAccountDialog] = useState({ open: false, message: '' });
    const selectedPostId = selectedPost?.id ?? null;

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

// ✅ Scroll the right-side post detail pane to TOP whenever a different post is selected
// This prevents the detail view from staying scrolled down when switching posts.
    useEffect(() => {
        if (activeTabRef.current !== 'posts') return;
        const el = detailScrollRef.current;
        if (el) el.scrollTo({ top: 8, left: 0, behavior: 'auto' });
    }, [selectedPostId, activeTab]);

// ✅ Scroll the right-side detail pane to TOP when a group post is selected
// Prevents the detail overlay from inheriting the list's scroll position.
    useEffect(() => {
        if (!selectedGroupPostId) return;
        const el = detailScrollRef.current;
        if (el) el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [selectedGroupPostId]);


    const fetchGroupPosts = useCallback(async (groupId) => {
        const idStr = groupId != null ? String(groupId) : '';
        if (!idStr) {
            setGroupPosts([]);
            setGroupPostsLoading(false);
            setGroupPostsError('');
            return;
        }

        setGroupPostsLoading(true);
        setGroupPostsError('');
        try {
            const params = new URLSearchParams({ limit: '25', offset: '0' });

            // Pass active account IDs so the backend returns correct viewerLiked/viewerReposted
            if (isBusinessAccount && activeBusinessId) {
                params.set('activeBusinessId', String(activeBusinessId));
            } else if (isArtistAccount && activeArtistId) {
                params.set('activeArtistId', String(activeArtistId));
            }

            const res = await secureFetch(`/api/groups/${encodeURIComponent(idStr)}/posts?${params.toString()}`, {
                credentials: 'include',
            });
            if (!res.ok) {
                const msg = `Failed to load group posts (${res.status}).`;
                setGroupPosts([]);
                setGroupPostsError(msg);
                return;
            }
            const data = await res.json();
            const arr = Array.isArray(data) ? data : [];
            setGroupPosts(arr);

            let total = null;
            try {
                const headerVal = Number(res.headers.get('x-total-count') || res.headers.get('X-Total-Count'));
                if (Number.isFinite(headerVal)) total = headerVal;
            } catch {
                // ignore
            }
            const count = Number.isFinite(Number(total)) ? Number(total) : arr.length;

            // Keep the group list + selected group counts consistent everywhere.
            try {
                window.dispatchEvent(new CustomEvent('ll:group:postsChanged', { detail: { groupId: idStr, count } }));
            } catch {
                // ignore
            }

            setSelectedGroup((prev) => {
                if (!prev || prev.id == null) return prev;
                if (String(prev.id) !== idStr) return prev;
                return { ...prev, __ll_posts_count: count, post_count: count, posts_count: count };
            });
        } catch {
            setGroupPosts([]);
            setGroupPostsError('Failed to load group posts.');
        } finally {
            setGroupPostsLoading(false);
        }
    }, [isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const handleViewGroupPostPage = useCallback(
        (postId) => {
            if (!postId) return;

            try {
                sessionStorage.setItem('ll:community:url', `${loc.pathname}${loc.search}`);
                sessionStorage.setItem('ll:community:navigatedToPost', '1');
                const listEl = document.querySelector('[data-community-scroll]');
                if (listEl) sessionStorage.setItem('ll:community:scrollTop', String(listEl.scrollTop || 0));
                const rightEl = document.querySelector('[data-post-detail-scroll]');
                const rightTop = rightEl?.scrollTop || 0;
                sessionStorage.setItem('ll:community:rightScrollTop', String(rightTop));
                sessionStorage.setItem('ll:community:returnToGroupPosts', '1');
                if (selectedGroup) {
                    sessionStorage.setItem('ll:community:selectedGroup', JSON.stringify(selectedGroup));
                }
                // Save the currently selected post ID so we can restore the detail panel
                sessionStorage.setItem('ll:community:selectedGroupPostId', String(postId));
            } catch {
                // ignore
            }

            const gid = selectedGroup?.id ?? null;
            const gname = selectedGroup?.name ?? '';
            navigate(`/posts/${encodeURIComponent(postId)}`, {
                state: {
                    from: 'community',
                    fromCommunity: true,
                    groupContext: gid ? { id: gid, name: gname } : null,
                },
            });
        },
        [navigate, loc.pathname, loc.search, selectedGroup?.id, selectedGroup?.name]
    );

    const handleOpenCreateGroupPost = useCallback(() => {
        const gid = selectedGroup?.id ?? null;
        if (!gid) return;

        // Block post creation on business/artist accounts
        if (isBusinessAccount || isArtistAccount) {
            setSwitchAccountDialog({ open: true, message: 'Switch to your personal account to create posts in groups.' });
            return;
        }

        const viewer = user?.user || user || null;
        if (!viewer) {
            try {
                sessionStorage.setItem('ll:returnTo', window.location.pathname + window.location.search);
            } catch {
                // ignore
            }
            navigate('/login');
            return;
        }

        const isMember = Boolean(selectedGroup?.is_member ?? selectedGroup?.isMember);
        if (!isMember) {
            setSwitchAccountDialog({ open: true, message: 'You must join this group before you can post.' });
            return;
        }

        const result = checkPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'group posts' });
            setRateLimitOpen(true);
            return;
        }

        setIsCreateGroupPostOpen(true);
    }, [navigate, selectedGroup, user, isBusinessAccount, isArtistAccount]);

    const handleGroupPostCreated = useCallback(async () => {
        const gid = selectedGroup?.id ?? null;
        recordPost();
        setIsCreateGroupPostOpen(false);
        showSuccess('Your group post has been published!');
        // After creating a post, return the right panel back to the feed.
        setSelectedGroupPostId(null);
        // Switch to the posts tab so the user sees the new post
        setActiveTabSafe('posts');
        if (!gid) return;

        try {
            await fetchGroupPosts(gid);
        } catch {
            // ignore
        }

        // refetchGroups is defined later (via useGroupsData), so use the ref to avoid TDZ issues.
        const safeRefetchGroups = refetchGroupsRef.current;
        if (typeof safeRefetchGroups === 'function') {
            try {
                await safeRefetchGroups();
            } catch {
                // ignore
            }
        }
    }, [fetchGroupPosts, selectedGroup?.id, refetchGroupsRef, setActiveTabSafe, showSuccess]);

    // If the selected group changes, reset the right-panel post detail state.
    useEffect(() => {
        setSelectedGroupPostId(null);
    }, [selectedGroup?.id]);



// Left-side mode tabs (Community Posts vs Groups vs News)
    //
    // FEATURE FLAG 2026-04-18: 'news' mode is gated on
    // REACT_APP_NEWS_FEATURE_ENABLED. When the flag is off, any stale state
    // pointing at 'news' (from URL, saved filters, localStorage, etc.) is
    // coerced back to 'posts' so the user doesn't land on an unreachable tab.
    const NEWS_ENABLED = String(process.env.REACT_APP_NEWS_FEATURE_ENABLED || 'false').toLowerCase() === 'true';
    const [leftMode, setLeftMode] = useState(() => {
        const fromState = String(initialCommunityState?.leftMode || '').toLowerCase();
        if (fromState === 'groups' || fromState === 'posts') return fromState;
        if (fromState === 'news') return NEWS_ENABLED ? 'news' : 'posts';
        // Backward-compat: older code used View="groups".
        const legacyView = String(initialCommunityState?.filters?.view || '').toLowerCase();
        if (legacyView === 'groups' || legacyView === 'group') return 'groups';
        return 'posts';
    });

    // News mode: currently selected article (shown in right panel)
    const [selectedNewsArticle, setSelectedNewsArticle] = useState(null);
    // News mode: currently selected category filter (All / Sports / Politics / ...)
    const [newsCategory, setNewsCategory] = useState('all');
    const [newsDateRange, setNewsDateRange] = useState('week');

    const [groupView, setGroupView] = useState(() => {
        const gv = String(initialCommunityState?.groupView || '').toLowerCase();
        if (gv === 'mine' || gv === 'following') return gv;
        return 'all';
    });
    const [groupMemberType, setGroupMemberType] = useState('all');
    const isGroupsView = leftMode === 'groups';
    const isNewsView = leftMode === 'news';

    // ── Account-scoped following IDs (for "People I Follow" groups filter) ──
    // Stored as a sorted comma-separated string so it's a stable primitive
    // that won't trigger infinite re-render loops when used in hook deps.
    const [followingIdsStr, setFollowingIdsStr] = useState('');
    const followingFetchedRef = useRef('');

    useEffect(() => {
        // Only fetch when the groups tab is showing "following" view
        if (!isGroupsView || groupView !== 'following') return;
        if (!user) {
            setFollowingIdsStr('');
            return;
        }

        const viewer = user?.user || user || null;
        if (!viewer) {
            setFollowingIdsStr('');
            return;
        }

        const who = viewer?.public_id || viewer?.id || viewer?.handle;
        if (!who) {
            setFollowingIdsStr('');
            return;
        }

        // Build account-scoped query params (same pattern as SocialHome.fetchSocial)
        const params = new URLSearchParams();
        const isAccountScoped = (isBusinessAccount && activeBusinessId && activeBusinessId !== 'personal')
            || (isArtistAccount && activeArtistId && activeArtistId !== 'personal');

        if (isAccountScoped) {
            if (isBusinessAccount) {
                params.set('account_id', String(activeBusinessId));
                params.set('account_type', 'business');
            } else if (isArtistAccount) {
                params.set('account_id', String(activeArtistId));
                params.set('account_type', 'artist');
            }
        }
        const queryStr = params.toString();
        const suffix = queryStr ? `?${queryStr}` : '';

        // Build a cache key to avoid refetching when nothing changed
        const cacheKey = `${who}|${isBusinessAccount ? activeBusinessId : ''}|${isArtistAccount ? activeArtistId : ''}`;
        if (followingFetchedRef.current === cacheKey && followingIdsStr) return;

        let alive = true;
        const ac = new AbortController();

        const headers = {};
        if (isAccountScoped) {
            if (isBusinessAccount) {
                headers['x-account-type'] = 'business';
                headers['x-business-id'] = String(activeBusinessId);
            } else if (isArtistAccount) {
                headers['x-account-type'] = 'artist';
                headers['x-artist-id'] = String(activeArtistId);
            }
        }

        // Try the same endpoints SocialHome uses
        const urls = isAccountScoped
            ? [
                `/api/follows/social/${encodeURIComponent(who)}${suffix}`,
            ]
            : [
                `/users/social/${encodeURIComponent(who)}${suffix}`,
                `/api/users/social/${encodeURIComponent(who)}${suffix}`,
                `/api/follows/social/${encodeURIComponent(who)}${suffix}`,
            ];

        const tryFetch = async () => {
            for (const url of urls) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const res = await secureFetch(url, {
                        credentials: 'include',
                        signal: ac.signal,
                        headers,
                    });
                    if (!res.ok) continue;
                    // eslint-disable-next-line no-await-in-loop
                    const data = await res.json();
                    if (!alive) return;
                    const followingArr = Array.isArray(data?.following) ? data.following : [];
                    // Only include personal user accounts — businesses and artists
                    // can't join groups, so their entity IDs are irrelevant for the
                    // groups following_ids filter and would accidentally match
                    // unrelated users who happen to share those numeric IDs.
                    const ids = followingArr
                        .filter((u) => {
                            const t = String(u?.account_type || 'user').toLowerCase();
                            return t === 'user' || t === 'personal' || t === '';
                        })
                        .map((u) => Number(u?.id))
                        .filter((id) => Number.isFinite(id) && id > 0)
                        .sort((a, b) => a - b);
                    const str = ids.join(',');
                    followingFetchedRef.current = cacheKey;
                    setFollowingIdsStr(str);
                    return;
                } catch (err) {
                    if (err?.name === 'AbortError') return;
                    // try next url
                }
            }
            if (alive) {
                followingFetchedRef.current = cacheKey;
                setFollowingIdsStr('');
            }
        };

        tryFetch();

        return () => {
            alive = false;
            ac.abort();
        };
    }, [isGroupsView, groupView, user, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, followingIdsStr]);


    // ✅ Default the right panel to Discover on every page load (not Trending),
    // unless we are restoring state from PostPage. (Groups mode is unaffected.)
    const didInitDefaultRightTabRef = useRef(false);
    useEffect(() => {
        if (didInitDefaultRightTabRef.current) return;
        didInitDefaultRightTabRef.current = true;

        // If we're restoring from PostPage, keep the saved tab and detail state.
        // Also check sessionStorage for saved state (handles browser back button which
        // doesn't set the explicit restore flag).
        if (shouldRestoreRef.current) return;
        try {
            if (sessionStorage.getItem(COMMUNITY_STATE_KEY)) return;
        } catch { /* ignore */ }

        if (isGroupsView) return;
        setActiveTabSafe('discover');
        setDetailExpanded(false);
    }, [isGroupsView, setActiveTabSafe]);

    const handleViewCommunityPage = useCallback(() => {
        // Switch the left panel back to Community Feed and show the Posts tab.
        setLeftMode('posts');
        setGroupView('all');
        setSelectedGroup(null);
        setSelectedGroupPostId(null);
        setActiveTabSafe('posts');
        setDetailExpanded(false);
        setOpenedPopupId(null);
        setSelectedPost(null);
    }, [setActiveTabSafe, setSelectedPost]);


    const handleViewGroupPage = useCallback((groupArg) => {
        const g = groupArg || selectedGroup;
        const gUsername = g?.group_username || g?.groupUsername;
        const gid = gUsername || (g?.id ?? g?.group_id ?? g?.groupId);
        if (!gid) return;

        setGroupPageUsername(String(gid));
        setGroupPageOpen(true);
    }, [selectedGroup]);

    const closeGroupPage = useCallback(() => {
        setGroupPageOpen(false);
        // Small delay before clearing username so the slide-out animation keeps content
        setTimeout(() => setGroupPageUsername(null), 300);
    }, []);
    /* ---------- persist + restore RIGHT (group posts) scroll position ---------- */
    useEffect(() => {
        // Persist right panel (group posts feed) scroll so we can return from the Group Post Page
        // without losing where the user was in the list.
        const el = document.querySelector('[data-post-detail-scroll]');
        if (!el) return undefined;

        const onScroll = () => {
            try {
                sessionStorage.setItem('ll:community:rightScrollTop', String(el.scrollTop || 0));
            } catch {
                // ignore
            }
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        return () => {
            try {
                el.removeEventListener('scroll', onScroll);
            } catch {
                // ignore
            }
        };
    }, [activeTab, leftMode]);

    useEffect(() => {
        // Restore the right panel scroll when returning from a group post page.
        let shouldRestore = false;
        try {
            shouldRestore =
                Boolean(loc?.state?.restoreGroupPosts) ||
                sessionStorage.getItem('ll:community:returnToGroupPosts') === '1';
        } catch {
            shouldRestore = Boolean(loc?.state?.restoreGroupPosts);
        }

        if (!shouldRestore) return;

        // Clear the one-shot restore flag.
        try {
            sessionStorage.removeItem('ll:community:returnToGroupPosts');
        } catch {
            // ignore
        }

        // Ensure we're in Groups -> Posts feed view.
        setLeftMode('groups');
        setActiveTabSafe('posts');

        // Always restore selected group from sessionStorage when restore flag is set
        try {
            const raw = sessionStorage.getItem('ll:community:selectedGroup');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    setSelectedGroup(parsed);
                }
            }
        } catch {
            // ignore
        }

        // Restore selected post for detail panel
        try {
            const savedPostId = sessionStorage.getItem('ll:community:selectedGroupPostId');
            if (savedPostId) {
                setSelectedGroupPostId(Number(savedPostId) || null);
                sessionStorage.removeItem('ll:community:selectedGroupPostId');
            } else {
                setSelectedGroupPostId(null);
            }
        } catch {
            setSelectedGroupPostId(null);
        }

        let top = 0;
        try {
            top = Number(sessionStorage.getItem('ll:community:rightScrollTop') || 0);
        } catch {
            top = 0;
        }
        if (!(top > 0)) return;

        let tries = 0;
        const tick = () => {
            tries += 1;
            const el = document.querySelector('[data-post-detail-scroll]');
            if (el) {
                el.scrollTop = top;
                return;
            }
            if (tries < 24) window.requestAnimationFrame(tick);
        };

        window.requestAnimationFrame(tick);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loc?.pathname, loc?.search, loc?.state, loc?.key]);

    const isFlagTrue = (v) => v === true || v === 1 || v === '1';

// Ensure the right-panel tab selection stays valid when switching between Posts and Groups.
    useEffect(() => {
        const allowed = isGroupsView ? ['overview', 'posts'] : ['discover', 'posts', 'map'];
        const current = String(activeTabRef.current || '').toLowerCase();
        if (!allowed.includes(current)) {
            setActiveTabSafe(isGroupsView ? 'overview' : 'discover');
            setDetailExpanded(false);
        }
    }, [isGroupsView, setActiveTabSafe]);


// Load group posts whenever the selected group changes (groups tab)
    useEffect(() => {
        if (!isGroupsView) return;
        const gid = selectedGroup?.id ?? null;
        setSelectedGroupPostId(null);
        if (!gid) {
            setGroupPosts([]);
            setGroupPostsLoading(false);
            setGroupPostsError('');
            return;
        }
        void fetchGroupPosts(gid);
    }, [isGroupsView, selectedGroup?.id, fetchGroupPosts, activeBusinessId, activeArtistId]);

// Keep the right panel tabs aligned with the left mode + selection
    useEffect(() => {
        // Keep the right-panel tab value valid for the current mode,
        // but don't "lock" the user to a tab.
        if (isGroupsView) {
            const allowed = new Set(['overview', 'posts']);
            const current = activeTabRef.current;

            if (!allowed.has(current)) {
                // Default when entering Groups — always start on Overview
                setActiveTabSafe('overview');
                setDetailExpanded(false);
            }
            return;
        }

        // Leaving Groups: ensure we don't stay on "overview"
        if (activeTabRef.current === 'overview') {
            setActiveTabSafe('discover');
        }
    }, [isGroupsView, selectedGroup?.id, setActiveTabSafe]);



// Keeping this state so we don't disrupt your existing sizing logic.
// (The button is repurposed to "View Post Page".)
    const [detailExpanded, setDetailExpanded] = useState(Boolean(initialCommunityState?.detailExpanded));

    const clearSelection = useCallback(() => {
        setSelectedPost(null);
    }, []);

    /* ✅ Show/Hide filters state (so header button works) */
    // Restore the user's last filter-visibility preference.
    // Precedence: session state > localStorage > viewport-aware default.
    // On short-height laptops (< 820px) we default filters collapsed so the
    // feed isn't squeezed — users can expand via the tune button in the header.
    const FILTERS_PREF_KEY = 'community:showFilters';
    const [showFilters, setShowFilters] = useState(() => {
        if (initialCommunityState?.showFilters != null) {
            return Boolean(initialCommunityState.showFilters);
        }
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = window.localStorage.getItem(FILTERS_PREF_KEY);
                if (stored === 'true') return true;
                if (stored === 'false') return false;
            }
        } catch (_) { /* ignore storage errors (private mode, etc.) */ }
        // First visit: collapsed on mobile and on short-height desktops; expanded otherwise.
        if (isMobile) return false;
        if (typeof window !== 'undefined' && window.innerHeight && window.innerHeight < 820) {
            return false;
        }
        return true;
    });
    const handleToggleFilters = useCallback(() => {
        setShowFilters((v) => {
            const next = !v;
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(FILTERS_PREF_KEY, String(next));
                }
            } catch (_) { /* ignore */ }
            return next;
        });
    }, []);

    /* ---------- filters ---------- */
    const [filters, dispatch] = useReducer(filterReducer, initialCommunityState?.filters || initialFilters);
    const {
        search,
        appliedSearch,
        view,
        subtype,
    } = filters;

    // ── Save/restore filters when switching between Posts ↔ Groups tabs ──
    // Each tab remembers its own filter state so switching doesn't reset them.
    // Initialized from session so they survive page navigation (unmount/remount).
    const savedPostsFiltersRef = useRef(initialCommunityState?.savedPostsFilters || null);
    const savedGroupsFiltersRef = useRef(initialCommunityState?.savedGroupsFilters || null);
// If a cached session state restores legacy View="groups", convert it into left tab mode.
    useEffect(() => {
        const v = String(view || '').toLowerCase();
        if (v === 'groups' || v === 'group') {
            setLeftMode('groups');
            dispatch({ type: 'view', value: 'all' });
        }
    }, [view]);

// ✅ Keep right-panel tabs valid for the current left mode (prevents "disabled" feeling when value doesn't match).
    useEffect(() => {
        const v = String(activeTabRef.current || activeTab || '').toLowerCase();

        if (isGroupsView) {
            if (v !== 'overview' && v !== 'posts') {
                setActiveTabSafe('overview');
            }
        } else {
            if (v === 'overview') {
                setActiveTabSafe('discover');
            }
        }
    }, [isGroupsView, activeTab, setActiveTabSafe]);


    const {
        sort,
        dateRange,
        city: selectedCity,
        county: selectedCounty,
        radius: selectedRadius,
    } = filters;

    // ── Radius expansion: compute list of counties within the selected radius ──
    // Returns [] when no county (means "no county filter"), or [county] for county-only,
    // or [county, neighbor1, neighbor2, ...] for expanded radius.
    const expandedCounties = useMemo(
        () => countiesWithinRadius(selectedCounty, selectedRadius),
        [selectedCounty, selectedRadius]
    );

    // Helper: apply expanded county list to a URLSearchParams object.
    // Uses `counties=X,Y,Z` when radius expands beyond a single county,
    // otherwise falls back to the standard `county=X` param.
    const applyCountyParams = useCallback((params) => {
        if (expandedCounties.length > 1) {
            params.set('counties', expandedCounties.join(','));
        } else if (selectedCounty) {
            params.set('county', selectedCounty);
        }
    }, [expandedCounties, selectedCounty]);

    // ── Location counts for county/city badge display ──
    const [communityLocationCounts, setCommunityLocationCounts] = useState(null);

    // Reset location counts immediately when switching tabs so stale data doesn't linger
    const prevIsGroupsViewRef = useRef(isGroupsView);
    useEffect(() => {
        if (prevIsGroupsViewRef.current !== isGroupsView) {
            prevIsGroupsViewRef.current = isGroupsView;
            setCommunityLocationCounts(null);
        }
    }, [isGroupsView]);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const countyParam = String(selectedCounty || '').trim();
                const cityParam = String(selectedCity || '').trim();
                const searchParam = String(appliedSearch || '').trim();
                const subtypeParam = String(subtype || '').trim();
                const sortParam = String(sort || '').trim();
                // Compute the effective view inline (apiView is defined later in the component)
                const effectiveView = (!isOnPersonalAccount && view === 'mine') ? 'all' : view;
                const viewParam = String(effectiveView || '').trim();
                const dateRangeParam = String(dateRange || '').trim();

                let url;
                if (isGroupsView) {
                    const params = new URLSearchParams();
                    if (searchParam) params.set('q', searchParam);
                    if (countyParam) params.set('county', countyParam);
                    if (cityParam) params.set('city', cityParam);
                    if (subtypeParam) params.set('category', subtypeParam);
                    if (sortParam) params.set('sort', sortParam);
                    if (isOnPersonalAccount && groupView === 'mine') params.set('mine', '1');
                    if (groupView === 'following' && followingIdsStr) params.set('following_ids', followingIdsStr);
                    if (groupMemberType && groupMemberType !== 'all') params.set('member_type', groupMemberType);
                    url = `/api/groups/location-counts?${params.toString()}`;
                } else {
                    const params = new URLSearchParams();
                    if (searchParam) params.set('search', searchParam);
                    if (countyParam) params.set('county', countyParam);
                    if (cityParam) params.set('city', cityParam);
                    if (subtypeParam) params.set('subtype', subtypeParam);
                    if (viewParam && viewParam !== 'all') params.set('view', viewParam);
                    if (dateRangeParam && dateRangeParam !== 'all') params.set('dateRange', dateRangeParam);
                    url = `/api/community/location-counts?${params.toString()}`;
                }

                const res = await secureFetch(url, { credentials: 'include' });
                const data = await res.json().catch(() => ({}));
                if (!cancelled) {
                    setCommunityLocationCounts({
                        counties: data?.counties && typeof data.counties === 'object' ? data.counties : {},
                        cities: data?.cities && typeof data.cities === 'object' ? data.cities : {},
                    });
                }
            } catch {
                if (!cancelled) setCommunityLocationCounts({ counties: {}, cities: {} });
            }
        }, 180);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [isGroupsView, appliedSearch, subtype, selectedCounty, selectedCity, view, isOnPersonalAccount, dateRange, sort, groupView, followingIdsStr, groupMemberType]);

    /* ---------- people you may know (right rail) ---------- */
    const [peopleYouMayKnow, setPeopleYouMayKnow] = useState([]);
    const [peopleYouMayKnowLoading, setPeopleYouMayKnowLoading] = useState(false);

    const fetchPeopleYouMayKnow = useCallback(async () => {
        setPeopleYouMayKnowLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCity) params.set('city', selectedCity);
            if (selectedCounty) params.set('county', selectedCounty);
            params.set('limit', '3');

            const res = await secureFetch(`/api/community/people-you-may-know?${params.toString()}`, { credentials: 'include' });
            const data = res.ok ? await res.json() : null;

            setPeopleYouMayKnow(Array.isArray(data?.people) ? data.people : []);
        } catch {
            setPeopleYouMayKnow([]);
        } finally {
            setPeopleYouMayKnowLoading(false);
        }
    }, [selectedCity, selectedCounty]);


    const [randomSeed, setRandomSeed] = useState(() => String(Date.now()));

    const groupsQueryKey = useMemo(
        () =>
            JSON.stringify({
                q: String(appliedSearch || ''),
                category: String(isGroupsView ? (subtype || '') : ''),
                sort: String(sort || 'newest'),
                dateRange: String(dateRange || 'all'),
                city: String(selectedCity || ''),
                county: String(selectedCounty || ''),
                mine: Boolean(isOnPersonalAccount && isGroupsView && groupView === 'mine'),
                followingUserIds: isGroupsView && groupView === 'following' ? (followingIdsStr || '0') : '',
                memberType: String(isGroupsView ? (groupMemberType || 'all') : 'all'),
                randomSeed: String(randomSeed || ''),
            }),
        [appliedSearch, isGroupsView, subtype, sort, dateRange, selectedCity, selectedCounty, groupView, followingIdsStr, randomSeed, isOnPersonalAccount, groupMemberType]
    );


    useEffect(() => {
        const mode = String(sort || '').trim().toLowerCase();
        if (mode === 'random') {
            setRandomSeed((prev) => (prev ? prev : String(Date.now())));
        } else {
            setRandomSeed('');
        }
    }, [sort]);

// ✅ NEW: bump this whenever a search/filter action executes (even if queryKey doesn't change)
    const [scrollToTopSeq, bumpScrollToTopSeq] = useReducer((n) => n + 1, 0);

    // Groups list: force a visible loading/skeleton state when filters are cleared
    const [groupsClearSeq, bumpGroupsClearSeq] = useReducer((n) => n + 1, 0);

    // Handle new post creation - refresh list and scroll to top so user sees their new post
    useEffect(() => {
        const handlePostCreated = () => {
            try {
                bumpScrollToTopSeq();
                scheduleRefetch();
                bumpCountRefreshSeq();
                showSuccess('Your post has been published!');
            } catch {
                // ignore
            }
        };

        window.addEventListener('ll:communityPost:created', handlePostCreated);
        return () => {
            window.removeEventListener('ll:communityPost:created', handlePostCreated);
        };
    }, [scheduleRefetch, bumpCountRefreshSeq, bumpScrollToTopSeq]);


    // Groups paging (fast infinite scroll)
    const [groupTotalCount, setGroupTotalCount] = useState(null);
    const [pagedGroups, setPagedGroups] = useState([]);
    const [isGroupsLoadingMore, setIsGroupsLoadingMore] = useState(false);
    const lastGroupsQueryKeyRef = useRef('');
    // Ref mirrors pagedGroups so fetchNextGroupsPage can read the latest count
    // without needing pagedGroups in its dependency array (prevents infinite loops).
    const pagedGroupsRef = useRef(pagedGroups);
    pagedGroupsRef.current = pagedGroups;


    const [center, setCenter] = useState(initialCommunityState?.center || DEFAULT_CENTER);
    const [zoomLevel, setZoomLevel] = useState(initialCommunityState?.zoomLevel || DEFAULT_ZOOM);
    const [openedPopupId, setOpenedPopupId] = useState(initialCommunityState?.openedPopupId ?? null);

    // ✅ One-shot reset when returning from PostPage after a moderation action (hide/block).
    // We want to:
    //   • Unselect the post detail
    //   • Default the right panel back to Trending
    //   • Ensure the left mode is Community Posts
    useEffect(() => {
        // Don't reset if we're restoring group posts view
        let isRestoring = false;
        try {
            isRestoring =
                Boolean(loc?.state?.restoreGroupPosts) ||
                sessionStorage.getItem('ll:community:returnToGroupPosts') === '1';
        } catch {
            isRestoring = false;
        }
        if (isRestoring) return;

        let shouldReset = false;
        try {
            shouldReset =
                sessionStorage.getItem('ll:community:returnToTrending') === '1' ||
                sessionStorage.getItem('ll:community:clearSelection') === '1';
        } catch {
            shouldReset = false;
        }

        if (!shouldReset) return;

        try {
            sessionStorage.removeItem('ll:community:returnToTrending');
            sessionStorage.removeItem('ll:community:clearSelection');
        } catch {
            // ignore
        }

        setSelectedPost(null);
        setOpenedPopupId(null);
        setDetailExpanded(false);
        setLeftMode('posts');
        setSelectedGroup(null);
        setSelectedGroupPostId(null);
        setActiveTabSafe('discover');
    }, [loc?.key, setActiveTabSafe, setLeftMode]);



// ✅ Keep the GROUP posts panel in sync after edits.
    // We patch in-memory first (instant UI), and if the payload is partial/oddly-shaped
    // we fall back to refetching the group feed so the preview + detail are guaranteed fresh.
    useEffect(() => {
        const mergePreferDefined = (base, patch) => {
            if (!patch || typeof patch !== 'object') return base;
            const out = { ...(base && typeof base === 'object' ? base : {}) };
            Object.entries(patch).forEach(([k, v]) => {
                if (v !== undefined) out[k] = v;
            });
            return out;
        };

        const unwrapPostFromDetail = (detail) => {
            if (!detail || typeof detail !== 'object') return null;
            const dPost = detail.post;
            if (!dPost) return null;
            if (dPost && typeof dPost === 'object') {
                // Common shapes: { post: {...} } or { post: { post: {...} } }
                if (dPost.post && typeof dPost.post === 'object') return dPost.post;
                if (dPost.data && typeof dPost.data === 'object') return dPost.data;
                return dPost;
            }
            return null;
        };

        let refetchTimer = null;

        const onUpdated = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const post = unwrapPostFromDetail(detail);
            const pid =
                post?.id ??
                post?.post_id ??
                detail.postId ??
                detail.id ??
                detail?.post?.id ??
                null;
            if (pid == null) return;
            const idStr = String(pid);

            // Persist edited badge for group preview cards (mirrors PostList behavior).
            try {
                const n = Number(pid);
                if (Number.isFinite(n) && n > 0) {
                    window.localStorage.setItem(`ll.communityPost.edited.${n}`, '1');
                }
            } catch {
                // ignore
            }

            // Patch groupPosts if this post is currently loaded in the right panel.
            let didPatch = false;
            setGroupPosts((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                if (!arr.length) return prev;

                let changed = false;
                const next = arr.map((p) => {
                    const curId = p?.id ?? p?.post_id ?? null;
                    if (curId == null) return p;
                    if (String(curId) !== idStr) return p;
                    changed = true;
                    return mergePreferDefined(p, post || detail);
                });

                didPatch = changed;
                return changed ? next : prev;
            });

            // If we couldn't patch (post not in the current list) OR the payload is likely partial,
            // refetch the group feed so the preview & derived selected detail update for sure.
            const forceRefresh = Boolean(detail?.forceRefresh || detail?.refresh || detail?.refetch);
            const seemsPartial = !post || (post && typeof post === 'object' && post.title == null && post.description == null);
            const shouldRefetch = Boolean((!didPatch && selectedGroup?.id) || forceRefresh || seemsPartial);

            if (shouldRefetch && selectedGroup?.id) {
                if (refetchTimer) window.clearTimeout(refetchTimer);
                refetchTimer = window.setTimeout(() => {
                    fetchGroupPosts(selectedGroup.id);
                }, 220);
            }
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        return () => {
            if (refetchTimer) window.clearTimeout(refetchTimer);
            window.removeEventListener('ll:communityPost:updated', onUpdated);
        };
    }, [fetchGroupPosts, selectedGroup?.id]);


// ✅ When the currently-selected post is deleted (from PostPage or list),
// clear the detail pane and return the right panel back to Trending.
    useEffect(() => {
        const onDeleted = (e) => {
            const delId = e?.detail?.postId ?? e?.detail?.id ?? e?.detail?.post?.id ?? null;
            if (delId == null) return;

            showSuccess('Post deleted successfully');

            const delStr = String(delId);
            const deletedGroupId =
                e?.detail?.groupId ??
                e?.detail?.group_id ??
                e?.detail?.group?.id ??
                e?.detail?.group?.group_id ??
                null;

            const selectedGroupIdNow = selectedGroup?.id ?? selectedGroup?.group_id ?? selectedGroup?.groupId ?? null;
            const selectedGroupIdStr = selectedGroupIdNow != null ? String(selectedGroupIdNow) : null;

            const selectedGroupPostIdStr = selectedGroupPostId != null ? String(selectedGroupPostId) : null;
            const isGroupPostDelete =
                (deletedGroupId != null && selectedGroupIdStr != null && String(deletedGroupId) === selectedGroupIdStr) ||
                (selectedGroupPostIdStr != null && selectedGroupPostIdStr === String(delId));

            // If the deleted post is a GROUP post we are currently viewing in the right panel,
            // clear the detail panel and refresh the group feed so it disappears from the list.
            if (isGroupPostDelete) {
                setSelectedGroupPostId(null);

                setGroupPosts((prev) => {
                    const arr = Array.isArray(prev) ? prev : [];
                    return arr.filter((p) => String(p?.id ?? p?.post_id ?? '') !== delStr);
                });

                if (selectedGroupIdStr) {
                    void fetchGroupPosts(selectedGroupIdStr);
                }

                const safeRefetchGroups = refetchGroupsRef.current;
                if (typeof safeRefetchGroups === 'function') {
                    try {
                        void safeRefetchGroups();
                    } catch {
                        // ignore
                    }
                }
            }

            const selectedStr = selectedPost?.id != null ? String(selectedPost.id) : null;
            const openedStr = openedPopupId != null ? String(openedPopupId) : null;

            // If the deleted post is what we're currently showing (or what the map popup has open),
            // clear the selection and go back to Trending.
            if ((selectedStr && delStr === selectedStr) || (openedStr && delStr === openedStr)) {
                setSelectedPost(null);
                setOpenedPopupId(null);
                setDetailExpanded(false);
                setActiveTabSafe('discover');
            }

            // Immediately remove the deleted post from the paged list and decrement
            // the total count so the footer ("Displaying X out of Y") updates instantly
            // without waiting for the API refetch to complete.
            setPagedPosts((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                return arr.filter((p) => String(p?.id ?? '') !== delStr);
            });
            setTotalCount((prev) => {
                if (prev == null) return prev;
                const n = Number(prev);
                return Number.isFinite(n) && n > 0 ? n - 1 : 0;
            });
            // Also update cached data so switching views doesn't flash the deleted post
            setCachedData((prev) => {
                const posts = Array.isArray(prev?.posts) ? prev.posts.filter((p) => String(p?.id ?? '') !== delStr) : [];
                return { ...prev, posts };
            });
        };

        window.addEventListener('ll:communityPost:deleted', onDeleted);
        return () => window.removeEventListener('ll:communityPost:deleted', onDeleted);
    }, [selectedPost, openedPopupId, setActiveTabSafe, selectedGroup?.id, selectedGroupPostId, fetchGroupPosts]);
    const [hoveredId, setHoveredId] = useState(null);

    const [popupPostCache, setPopupPostCache] = useState(() => ({}));

    const [cachedData, setCachedData] = useState(() => initialCommunityData || { posts: [], points: null });


// (event sync) This listener is defined later, after paging state is initialized.
    const popupFetchInFlightRef = useRef(new Set());

    // Stable refs so useCallbacks can read latest values without re-creating
    const popupPostCacheRef = useRef(popupPostCache);
    useEffect(() => { popupPostCacheRef.current = popupPostCache; }, [popupPostCache]);

    const selectedPostRef = useRef(selectedPost);
    useEffect(() => { selectedPostRef.current = selectedPost; }, [selectedPost]);

    // ── Refs for volatile visual-only values used inside popupContentById ──
    // These change frequently (hover, selection) but should NOT cause the
    // popup Map to be rebuilt — that triggers CommunityMapView effects and
    // can cause an infinite re-render loop.
    const hoveredIdRef = useRef(hoveredId);
    useEffect(() => { hoveredIdRef.current = hoveredId; }, [hoveredId]);

    const selectedPostIdRef = useRef(selectedPostId);
    useEffect(() => { selectedPostIdRef.current = selectedPostId; }, [selectedPostId]);

    const openedPopupIdRef = useRef(openedPopupId);
    useEffect(() => { openedPopupIdRef.current = openedPopupId; }, [openedPopupId]);

    const postsSourceRef = useRef(null);

// Persist CommunityPage UI state so returning from PostPage restores the screen
    useEffect(() => {
        writeCommunityState({
            filters,
            leftMode,
            groupView,
            activeTab,
            detailExpanded,
            showFilters,
            selectedPost,
            selectedGroup,
            openedPopupId,
            center,
            zoomLevel,
            savedPostsFilters: savedPostsFiltersRef.current,
            savedGroupsFilters: savedGroupsFiltersRef.current,
        });
    }, [filters, leftMode, groupView, activeTab, detailExpanded, showFilters, selectedPost, selectedGroup, openedPopupId, center, zoomLevel]);

    /* ---------- city⇄county helpers ---------- */
    const cityToCounty = useMemo(() => {
        const m = {};
        cityCountyMap.forEach(({ name, county }) => {
            m[name] = county.replace(/ County$/, '');
        });
        return m;
    }, []);


    // Normalize Census GeoJSON imports into simple arrays used by the UI.
    const cityList = useMemo(() => normalizeGeoJsonList(cityData, 'NAME').sort((a, b) => a.name.localeCompare(b.name)), []);
    const countyList = useMemo(() => normalizeGeoJsonList(countyData, 'NAME').sort((a, b) => a.name.localeCompare(b.name)), []);
    const availableCities = useMemo(
        () =>
            selectedCounty
                ? cityList.filter((c) => cityToCounty[c.name] === selectedCounty).map((c) => c.name).sort((a, b) => a.localeCompare(b))
                : cityList.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
        [selectedCounty, cityToCounty]
    );
    const availableCounties = useMemo(() => countyList.map((c) => c.name).sort((a, b) => a.localeCompare(b)), [countyList]);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate the county filter with the viewer's
    // home_county from their profile. Product decision (2026-04): fresh
    // loads should start statewide, and narrower defaults should be
    // opt-in via the "Apply automatically when I open this tab" checkbox
    // on a saved filter (see SavedFiltersMenu + CommunityFilter's
    // auto-apply effect).
    //
    // The ref and effect are kept as a no-op so the surrounding
    // `appliedHomeDefaultRef.current` checks elsewhere in this file keep
    // their semantics — they mean "past the first-load bootstrap", not
    // literally "applied a home county".
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!user) return;
        appliedHomeDefaultRef.current = true;
    }, [user]);

    /* ---------- pan/zoom when city/county/radius filters change ---------- */
    useEffect(() => {
        if (selectedCity) {
            // City overrides radius — always zoom tight
            const obj = cityList.find((c) => c.name === selectedCity);
            if (obj) {
                setCenter(obj.coordinates);
                setZoomLevel(13);
            }
        } else if (selectedCounty) {
            const obj = countyList.find((c) => c.name === selectedCounty);
            if (obj) {
                setCenter(obj.coordinates);

                // Adjust zoom based on radius so the map shows the filtered area.
                // Larger radius → wider view → lower zoom number.
                const r = String(selectedRadius);
                let zoom = 10; // county-only default
                if (r === STATEWIDE)    zoom = DEFAULT_ZOOM;
                else if (r === '100')   zoom = 7.5;
                else if (r === '50')    zoom = 8;
                else if (r === '25')    zoom = 9;
                // r === '0' → zoom stays 10 (county level)
                setZoomLevel(zoom);
            }
        } else {
            setCenter(DEFAULT_CENTER);
            setZoomLevel(DEFAULT_ZOOM);
        }
    }, [selectedCity, selectedCounty, selectedRadius]);

    /* ---------- fetch posts & marker geojson ---------- */
    // When on a business/artist account, "My Posts" and "Following" views are not
    // applicable — the backend resolves these against the personal user's data.
    const apiView = (!isOnPersonalAccount && view === 'mine') ? 'all' : view;
    const apiSort = sort;

    const queryKey = useMemo(
        () =>
            JSON.stringify({
                search: appliedSearch,
                view: apiView,
                subtype: normalizeSubtype(subtype),
                sort: apiSort,
                dateRange,
                city: selectedCity,
                county: selectedCounty,
                radius: selectedRadius,
                randomSeed: randomSeed || '',
            }),
        [appliedSearch, apiView, subtype, apiSort, dateRange, selectedCity, selectedCounty, selectedRadius, randomSeed]
    );

// ✅ NEW: this is what triggers CommunityPanel to scroll the list to top
    const scrollResetKey = useMemo(
        () => `${queryKey}|${scrollToTopSeq}`,
        [queryKey, scrollToTopSeq]
    );

    const [totalCount, setTotalCount] = useState(null);
    const [pagedPosts, setPagedPosts] = useState([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const lastQueryKeyRef = useRef(queryKey);

// Keep Community caches + the embedded detail pane in sync immediately after edits/mark-found.
// This also patches pagedPosts in-place (important when the edited post is beyond page 0).
    useEffect(() => {
        const getPostFromEvent = (e) => {
            const direct = e?.detail?.post;
            if (direct && typeof direct === 'object') return direct;

            const raw = e?.detail?.raw || e?.detail?.data || null;
            if (raw && typeof raw === 'object') return raw;

            if (typeof e?.detail === 'string') {
                try {
                    return JSON.parse(e.detail);
                } catch {
                    return null;
                }
            }
            return null;
        };

        const patchSessionCache = (updated) => {
            try {
                const idStr = updated?.id != null ? String(updated.id) : '';
                if (!idStr) return;

                const raw = sessionStorage.getItem(COMMUNITY_DATA_KEY);
                const data = safeParseJson(raw);
                if (!data || typeof data !== 'object') return;

                if (Array.isArray(data.posts)) {
                    const nextPosts = data.posts.map((p) => (p && String(p.id) === idStr ? { ...p, ...updated } : p));
                    if (nextPosts.some((p) => p && String(p.id) === idStr)) {
                        writeCommunityData({ ...data, posts: nextPosts, ts: Date.now() });
                    }
                }
            } catch {
                // ignore
            }
        };

        const onUpdated = (e) => {
            const updated = getPostFromEvent(e);
            const idStr = updated?.id != null ? String(updated.id) : '';
            if (!idStr) return;

            // Patch paged posts too. Important: when you have loaded additional pages,
            // a normal `refetch()` only refreshes page 0, so posts beyond page 0 can
            // stay stale unless we patch them by id.
            setPagedPosts((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                if (!arr.length) return prev;
                let changed = false;
                const next = arr.map((p) => {
                    if (!p || p.id == null) return p;
                    if (String(p.id) !== idStr) return p;
                    changed = true;
                    return { ...p, ...updated };
                });
                return changed ? next : prev;
            });

            // Patch cached list payload used on return-to-community.
            patchSessionCache(updated);

            // Patch in-memory cache used as a fallback when the list is empty (avoid showing stale images).
            setCachedData((prev) => {
                const oldPosts = Array.isArray(prev?.posts) ? prev.posts : [];
                const nextPosts = oldPosts.map((p) => (p && String(p.id) === idStr ? { ...p, ...updated } : p));
                const did = nextPosts.some((p) => p && String(p.id) === idStr);
                return did ? { ...(prev || {}), posts: nextPosts } : prev;
            });

            // Patch popup cache + embedded detail post (right panel) if we're currently viewing it.
            setPopupPostCache((prev) => ({
                ...(prev || {}),
                [idStr]: { ...(prev?.[idStr] || {}), ...updated },
            }));

            setSelectedPost((prev) => {
                if (!prev || prev.id == null) return prev;
                return String(prev.id) === idStr ? { ...prev, ...updated } : prev;
            });
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:markedFound', onUpdated);
        window.addEventListener('ll:communityPost:resolved', onUpdated);
        window.addEventListener('ll:communityPost:unresolved', onUpdated);

        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:markedFound', onUpdated);
            window.removeEventListener('ll:communityPost:resolved', onUpdated);
            window.removeEventListener('ll:communityPost:unresolved', onUpdated);
        };
    }, []);

    const communityDataParams = useMemo(() => ({
        randomSeed,
        search: appliedSearch,
        view: apiView,
        subtype: normalizeSubtype(subtype),
        sort: apiSort,
        dateRange,
        city: selectedCity,
        county: selectedCounty,
        counties: expandedCounties,
        activeBusinessId: isBusinessAccount ? activeBusinessId : null,
        activeArtistId: isArtistAccount ? activeArtistId : null,
    }), [randomSeed, appliedSearch, apiView, subtype, apiSort, dateRange, selectedCity, selectedCounty, expandedCounties, isBusinessAccount, activeBusinessId, isArtistAccount, activeArtistId]);

    const { posts: communityPosts, points, totalCount: hookTotalCount, isLoading, error: communityError = '', refetch } = useCommunityData(communityDataParams);



    // ── Stabilized params for useGroupsData (prevents infinite re-render loops). ──
    // Without useMemo, the params object is recreated every render with a new reference,
    // which triggers the hook's internal useEffect, which calls setState, which triggers
    // another render → infinite loop.
    const groupsDataParams = useMemo(() => ({
        city: selectedCity || '',
        county: selectedCounty || '',
        counties: expandedCounties,
        q: appliedSearch || '',
        category: isGroupsView ? subtype : '',
        sort,
        dateRange,
        randomSeed,
        mine: isOnPersonalAccount && isGroupsView && groupView === 'mine',
        followingUserIds: isGroupsView && groupView === 'following' ? (followingIdsStr || '0') : '',
        memberType: isGroupsView ? (groupMemberType || 'all') : 'all',
        enabled: isGroupsView,
        limit: GROUPS_PAGE_SIZE,
        offset: 0,
        includeTotal: true,
    }), [selectedCity, selectedCounty, expandedCounties, appliedSearch, isGroupsView, subtype, sort, dateRange, randomSeed, groupView, followingIdsStr, isOnPersonalAccount, groupMemberType]);

    const { groups: rawGroups, isLoading: isGroupsLoading, totalCount: groupsTotalFromHook, error: groupsHookError = '', refetch: refetchGroups, createGroup, joinGroup } = useGroupsData(groupsDataParams);

    // Keep refs updated so callbacks defined earlier can access the latest functions
    joinGroupRef.current = joinGroup;
    refetchGroupsRef.current = refetchGroups;


    // Reset groups paging whenever the groups query changes
    useEffect(() => {
        if (lastGroupsQueryKeyRef.current !== groupsQueryKey) {
            lastGroupsQueryKeyRef.current = groupsQueryKey;
            setPagedGroups([]);
            setGroupTotalCount(null);
            setIsGroupsLoadingMore(false);
        }
    }, [groupsQueryKey]);

    // Sync page-0 groups into the paged list (ALWAYS cap to page size for the first page)
    useEffect(() => {
        const headRaw = Array.isArray(rawGroups) ? rawGroups : [];
        const head = headRaw.slice(0, GROUPS_PAGE_SIZE);

        setPagedGroups((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return head;

            // Keep the first page in sync with the latest head results (but never exceed the page size).
            const rest = prev.slice(head.length);

            // Bail out (return same ref) if the head IDs haven't actually changed.
            // This prevents unnecessary new array references that cascade through
            // fetchNextGroupsPage → CommunityPanel auto-load effect → infinite loop.
            const prevHead = prev.slice(0, head.length);
            if (
                prevHead.length === head.length &&
                prevHead.every((g, i) => g?.id != null && head[i]?.id != null && String(g.id) === String(head[i].id))
            ) {
                return prev;
            }

            return [...head, ...rest];
        });

        // Keep total count from server (header) in sync for accurate footer + paging.
        // IMPORTANT: avoid Number(null) => 0 (which would break infinite scroll).
        if (groupsTotalFromHook != null) {
            const n = Number(groupsTotalFromHook);
            if (Number.isFinite(n) && n >= 0) {
                setGroupTotalCount(n);
            }
        }

        // If the hook couldn't supply a total count header but it returned items,
        // ensure we don't show "0 of 0" in the footer.
        if (head.length > 0) {
            setGroupTotalCount((prev) => {
                const n = Number(prev);
                if (Number.isFinite(n) && n > 0) return prev;
                return prev;
            });
        }
    }, [rawGroups, groupsTotalFromHook]);

    useEffect(() => {
        if (groupsTotalFromHook == null) return;
        const n = Number(groupsTotalFromHook);
        if (!Number.isFinite(n)) return;

        // Some endpoints omit X-Total-Count; in those cases the hook may surface 0.
        // Only accept 0 when the first page is actually empty.
        if (n === 0) {
            const headLen = Array.isArray(rawGroups) ? rawGroups.length : 0;
            if (headLen === 0) setGroupTotalCount(0);
            return;
        }

        setGroupTotalCount(n);
    }, [groupsTotalFromHook, rawGroups]);


// Separate fetch used ONLY for category counts/facets so the category dropdown doesn't go "wonky"
// when a category is selected (the list fetch becomes category-filtered).
    const groupsCountsParams = useMemo(() => ({
        city: selectedCity || '',
        county: selectedCounty || '',
        counties: expandedCounties,
        q: appliedSearch || '',
        category: '',
        sort,
        dateRange,
        randomSeed,
        mine: isOnPersonalAccount && isGroupsView && groupView === 'mine',
        followingUserIds: isGroupsView && groupView === 'following' ? (followingIdsStr || '0') : '',
        enabled: isGroupsView,
    }), [selectedCity, selectedCounty, expandedCounties, appliedSearch, sort, dateRange, randomSeed, isGroupsView, groupView, followingIdsStr, isOnPersonalAccount]);

    const { groups: rawGroupsForCounts } = useGroupsData(groupsCountsParams);

// NOTE: We intentionally avoid client-side search filtering here.
// The server already applies search/category/location filters and returns X-Total-Count.
// Additional client-side filtering can make the footer totals incorrect.
    const groups = useMemo(() => (Array.isArray(pagedGroups) ? pagedGroups : []), [pagedGroups]);

    // Keep selectedGroup in sync with the latest list payload (so join/request updates reflect immediately).
    useEffect(() => {
        const gid = selectedGroup?.id ?? null;
        if (!gid) return;

        const match = (Array.isArray(groups) ? groups : []).find((g) => g && g.id != null && String(g.id) === String(gid)) || null;
        if (!match) return;

        // Avoid needless state churn.
        if (selectedGroup === match) return;
        setSelectedGroup(match);
    }, [groups, selectedGroup]);

    // When a membership action completes, refresh the selected group + switch tabs appropriately.
    useEffect(() => {
        const onMembershipChanged = async (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const gidStr = detail.groupId != null ? String(detail.groupId) : '';
            if (!gidStr) return;

            const status = String(detail.status || '').toLowerCase();

            setSelectedGroup((prev) => {
                if (!prev || prev.id == null) return prev;
                if (String(prev.id) !== gidStr) return prev;
                if (status === 'joined') {
                    return { ...prev, is_member: true, isMember: true, has_requested: false, hasRequested: false };
                }
                if (status === 'pending') {
                    return { ...prev, has_requested: true, hasRequested: true, is_member: false, isMember: false };
                }
                return prev;
            });

            // Patch the paged group list in-place so the UI updates instantly
            // without reloading/reordering the list (prevents the "jump" feeling after Join).
            setPagedGroups((prev) => {
                const arr = Array.isArray(prev) ? prev : [];
                if (!arr.length) return prev;

                return arr.map((g) => {
                    if (!g || g.id == null) return g;
                    if (String(g.id) !== gidStr) return g;

                    if (status === 'joined') {
                        return { ...g, is_member: true, isMember: true, has_requested: false, hasRequested: false };
                    }
                    if (status === 'pending') {
                        return { ...g, has_requested: true, hasRequested: true, is_member: false, isMember: false };
                    }
                    return g;
                });
            });

// If they joined and can now view posts, switch to Group Posts.
            if (status === 'joined') {
                setActiveTabSafe('posts');
                try {
                    const gidNow = selectedGroup?.id ?? gidStr;
                    if (gidNow) await fetchGroupPosts(gidNow);
                } catch {
                    // ignore
                }
            }
        };

        window.addEventListener('ll:group:membershipChanged', onMembershipChanged);
        return () => window.removeEventListener('ll:group:membershipChanged', onMembershipChanged);
    }, [fetchGroupPosts, selectedGroup?.id, setActiveTabSafe]);

    // When a group is created from the CreateGroupModal, refresh the list and
    // optionally select the newly created group.
    useEffect(() => {
        const onCreated = async (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const created = detail.group && typeof detail.group === 'object' ? detail.group : null;

            // Reset paging so the new group (newest-first) is guaranteed to appear in the head.
            setPagedGroups([]);
            setGroupTotalCount(null);
            setIsGroupsLoadingMore(false);

            try {
                await refetchGroupsRef.current?.();
            } catch {
                // ignore
            }

            if (created) {
                setSelectedGroup(created);
                setSelectedPost(null);
                // If they can see the feed immediately, go to Group Posts. Otherwise, go to Overview.
                const vis = String(created.visibility || '').toLowerCase();
                const isPrivateLike = vis === 'private' || vis === 'hidden' || isFlagTrue(created.is_private ?? created.isPrivate);
                const isMember = isFlagTrue(created.is_member ?? created.isMember);
                setActiveTabSafe('overview');
            }
        };

        window.addEventListener('ll:groups:created', onCreated);
        return () => window.removeEventListener('ll:groups:created', onCreated);
    }, [isFlagTrue, setActiveTabSafe]);
// When filters change, reset paging + totals
    useEffect(() => {
        if (lastQueryKeyRef.current !== queryKey) {
            lastQueryKeyRef.current = queryKey;
            setPagedPosts([]);
            setTotalCount(null);
            setIsLoadingMore(false);
        }
    }, [queryKey]);

// Keep paged posts in sync with the primary fetch (page 0).
// Always replace the head (first page) with the latest communityPosts.
// Appended pages (from load-more) are preserved beyond the head.
    useEffect(() => {
        const live = Array.isArray(communityPosts) ? communityPosts : [];
        setPagedPosts((prev) => {
            if (!Array.isArray(prev) || prev.length === 0) return live;
            if (live.length === 0) return prev;
            // Always replace the head portion with fresh data.
            // Keep any extra pages that were appended via load-more.
            const appended = prev.length > live.length ? prev.slice(live.length) : [];
            return [...live, ...appended];
        });
    }, [communityPosts]);

// Sync total count from useCommunityData hook (already fetches with includeTotal=1).
// This eliminates a redundant second API call that previously fetched limit=1 just for the header.
//
// FIX: Instead of syncing hookTotalCount → totalCount via state (which always
// causes a one-render flash where totalCount is stale), we derive a
// `resolvedTotalCount` that immediately prefers hookTotalCount.
// The local `totalCount` state is only used as a fallback for values set by
// fetchNextPage (which reads X-Total-Count on subsequent page loads).
    useEffect(() => {
        if (hookTotalCount != null) {
            const n = Number(hookTotalCount);
            if (Number.isFinite(n)) setTotalCount(n);
        }
    }, [hookTotalCount, countRefreshSeq]);

    // Derived value: use hookTotalCount immediately (no render delay), fall back
    // to totalCount state (which fetchNextPage may have updated from later pages).
    const resolvedTotalCount = useMemo(() => {
        if (hookTotalCount != null) {
            const n = Number(hookTotalCount);
            if (Number.isFinite(n)) return n;
        }
        return totalCount;
    }, [hookTotalCount, totalCount]);

    const fetchNextPage = useCallback(async () => {
        if (isLoadingMore) return;
        const currentCount = Array.isArray(pagedPosts) ? pagedPosts.length : 0;
        if (Number.isFinite(Number(resolvedTotalCount)) && currentCount >= Number(resolvedTotalCount)) return;

        setIsLoadingMore(true);
        try {
            const params = new URLSearchParams();
            if (appliedSearch) params.set('search', appliedSearch);
            if (apiView) params.set('view', apiView);
            const st = normalizeSubtype(subtype);
            if (st) params.set('subtype', st);
            if (apiSort) params.set('sort', apiSort);
            if (dateRange) params.set('dateRange', dateRange);
            if (selectedCity) params.set('city', selectedCity);
            applyCountyParams(params);

            params.set('limit', String(GROUPS_PAGE_SIZE));
            params.set('offset', String(currentCount));
            params.set('includeTotal', '1');

            const res = await secureFetch(`/api/community?${params.toString()}`, { credentials: 'include' });
            if (!res.ok) return;
            const headerVal = Number(res.headers.get('x-total-count'));
            if (Number.isFinite(headerVal)) setTotalCount(headerVal);

            const next = await res.json();
            const nextArr = Array.isArray(next) ? next : [];

            if (nextArr.length) {
                setPagedPosts((prev) => {
                    const base = Array.isArray(prev) ? prev : [];
                    const existing = new Set(base.map((p) => String(p?.id ?? '')));
                    const merged = base.slice();
                    for (const p of nextArr) {
                        const idStr = String(p?.id ?? '');
                        if (!idStr) continue;
                        if (existing.has(idStr)) continue;
                        existing.add(idStr);
                        merged.push(p);
                    }
                    return merged;
                });
            }
        } finally {
            setIsLoadingMore(false);
        }
    }, [
        isLoadingMore,
        pagedPosts,
        resolvedTotalCount,
        appliedSearch,
        apiView,
        subtype,
        apiSort,
        dateRange,
        selectedCity,
        selectedCounty,
        applyCountyParams,
    ]);

    const fetchNextGroupsPage = useCallback(async () => {
        if (isGroupsLoadingMore) return;
        const currentCount = Array.isArray(pagedGroupsRef.current) ? pagedGroupsRef.current.length : 0;
        const total = Number.isFinite(Number(groupTotalCount)) ? Number(groupTotalCount) : null;
        if (total != null && currentCount >= total) return;

        setIsGroupsLoadingMore(true);
        try {
            const params = new URLSearchParams();
            if (appliedSearch) params.set('q', appliedSearch);
            applyCountyParams(params);
            if (selectedCity) params.set('city', selectedCity);
            if (isGroupsView && subtype) params.set('category', subtype);
            if (sort) params.set('sort', sort);
            if (dateRange) params.set('dateRange', dateRange);
            if (String(sort || '').trim().toLowerCase() === 'random' && randomSeed) params.set('randomSeed', randomSeed);
            if (isOnPersonalAccount && isGroupsView && groupView === 'mine') params.set('mine', '1');
            if (isGroupsView && groupView === 'following') params.set('following_ids', followingIdsStr || '0');
            if (isGroupsView && groupMemberType && groupMemberType !== 'all') params.set('member_type', groupMemberType);

            params.set('limit', String(GROUPS_PAGE_SIZE));
            params.set('offset', String(currentCount));
            // Only request an expensive COUNT(*) when we don't already know the grand total.
            if (groupTotalCount == null) params.set('includeTotal', '1');

            const suffix = params.toString() ? `?${params.toString()}` : '';
            const candidateUrls = GROUPS_ENDPOINTS.map((base) => `${base}${suffix}`);

            let res = null;
            for (let i = 0; i < candidateUrls.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                const r = await secureFetch(candidateUrls[i], {
                    method: 'GET',
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
                if (r.status === 404 && i < candidateUrls.length - 1) continue;
                res = r;
                break;
            }

            if (!res || !res.ok) return;

            const headerStr = res.headers.get('x-total-count') || res.headers.get('X-Total-Count');
            if (headerStr != null && String(headerStr).trim() !== '') {
                const headerVal = Number(headerStr);
                if (Number.isFinite(headerVal)) {
                    // Never allow a later page request to shrink the total (that breaks infinite scroll).
                    setGroupTotalCount((prev) => {
                        if (prev == null) return headerVal;
                        const p = Number(prev);
                        return Number.isFinite(p) ? Math.max(p, headerVal) : headerVal;
                    });
                }
            }

            const data = await res.json().catch(() => null);
            const nextArr = Array.isArray(data) ? data : (Array.isArray(data?.groups) ? data.groups : []);

            if (nextArr.length) {
                setPagedGroups((prev) => {
                    const base = Array.isArray(prev) ? prev : [];
                    const existing = new Set(base.map((g) => String(g?.id ?? g?.group_id ?? '')));
                    const merged = base.slice();
                    for (const g of nextArr) {
                        const idStr = String(g?.id ?? g?.group_id ?? '');
                        if (!idStr) continue;
                        if (existing.has(idStr)) continue;
                        existing.add(idStr);
                        merged.push(g);
                    }
                    return merged;
                });
            }
        } finally {
            setIsGroupsLoadingMore(false);
        }
    }, [appliedSearch, dateRange, followingIdsStr, groupMemberType, groupTotalCount, groupView, isGroupsLoadingMore, isGroupsView, isOnPersonalAccount, randomSeed, selectedCity, selectedCounty, sort, subtype]);


// Cache the latest results so returning from PostPage can render instantly (no empty list flash)
// BUT: never use cache for trending view (must reflect only true trending).
    useEffect(() => {
        if (view === 'trending') return;
        const live = Array.isArray(communityPosts) ? communityPosts : null;
        const pts = points && typeof points === 'object' ? points : null;
        if ((live && live.length) || (pts && (pts.features || pts.type))) {
            const payload = { posts: live || [], points: pts || null, ts: Date.now() };
            writeCommunityData(payload);
            setCachedData({ posts: payload.posts, points: payload.points });
        }
    }, [communityPosts, points, view]);

    const postsSource = useMemo(() => {
        const live = Array.isArray(pagedPosts) ? pagedPosts : [];
        if (live.length) return live;

        if (view === 'trending') return [];

        const cached = Array.isArray(cachedData?.posts) ? cachedData.posts : [];
        return cached;
    }, [pagedPosts, cachedData, view]);

    useEffect(() => { postsSourceRef.current = postsSource; }, [postsSource]);

    // Keep selectedPost in sync with refetched postsSource after returning from PostPage
    // or after account switch.  Merges ALL fresh fields (counts, edited content, viewer flags)
    // from the feed data so the detail pane reflects accurate numbers and edits.
    useEffect(() => {
        if (!selectedPost || selectedPost.id == null) return;
        const idStr = String(selectedPost.id);
        const fresh = (postsSource || []).find((p) => p && String(p.id) === idStr);
        if (!fresh) return;

        // Check if anything meaningful changed — avoids infinite update loops
        const oldLiked = Boolean(selectedPost.viewerLiked ?? selectedPost.viewer_liked);
        const newLiked = Boolean(fresh.viewerLiked ?? fresh.viewer_liked);
        const oldReposted = Boolean(selectedPost.viewerReposted ?? selectedPost.viewer_reposted);
        const newReposted = Boolean(fresh.viewerReposted ?? fresh.viewer_reposted);
        const oldLikes = Number(selectedPost.likesCount ?? selectedPost.likes_count ?? selectedPost.like_count ?? 0);
        const newLikes = Number(fresh.likesCount ?? fresh.likes_count ?? fresh.like_count ?? 0);
        const oldReposts = Number(selectedPost.repostsCount ?? selectedPost.reposts_count ?? selectedPost.repost_count ?? 0);
        const newReposts = Number(fresh.repostsCount ?? fresh.reposts_count ?? fresh.repost_count ?? 0);
        const oldComments = Number(selectedPost.commentsCount ?? selectedPost.comments_count ?? selectedPost.comment_count ?? 0);
        const newComments = Number(fresh.commentsCount ?? fresh.comments_count ?? fresh.comment_count ?? 0);
        const oldDesc = String(selectedPost.description ?? selectedPost.body ?? selectedPost.content ?? '');
        const newDesc = String(fresh.description ?? fresh.body ?? fresh.content ?? '');
        const oldEdited = String(selectedPost.edited_at ?? selectedPost.updated_at ?? '');
        const newEdited = String(fresh.edited_at ?? fresh.updated_at ?? '');

        const changed =
            oldLiked !== newLiked ||
            oldReposted !== newReposted ||
            oldLikes !== newLikes ||
            oldReposts !== newReposts ||
            oldComments !== newComments ||
            oldDesc !== newDesc ||
            oldEdited !== newEdited;

        if (changed) {
            setSelectedPost((prev) => (prev && String(prev.id) === idStr ? { ...prev, ...fresh } : prev));
        }
    }, [postsSource, selectedPost, activeBusinessId, activeArtistId]);

    // ── On account switch, check if the selected post's author is blocked/hidden ──
    // on the NEW account.  If so, deselect so the user doesn't see a post from someone
    // they blocked on this account.  If not blocked/hidden, keep it selected.
    const prevModCheckAcctRef = useRef({ activeBusinessId, activeArtistId });
    useEffect(() => {
        const prev = prevModCheckAcctRef.current;
        prevModCheckAcctRef.current = { activeBusinessId, activeArtistId };

        // Only run on actual account change
        if (prev.activeBusinessId === activeBusinessId && prev.activeArtistId === activeArtistId) return;

        // Nothing selected → nothing to check
        if (!selectedPost || selectedPost.id == null) return;

        const authorId = Number(
            selectedPost.user_id ?? selectedPost.userId ?? selectedPost.author_id ?? selectedPost.owner_id ?? 0
        );
        if (!authorId || !Number.isFinite(authorId)) return;

        let cancelled = false;

        (async () => {
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (isBusinessAccount && activeBusinessId) {
                    headers['x-account-type'] = 'business';
                    headers['x-business-id'] = String(activeBusinessId);
                } else if (isArtistAccount && activeArtistId) {
                    headers['x-account-type'] = 'artist';
                    headers['x-artist-id'] = String(activeArtistId);
                } else {
                    headers['x-account-type'] = 'personal';
                }
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers,
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                if (cancelled) return;

                const blockedIds = new Set(
                    (Array.isArray(data.blocked_user_ids) ? data.blocked_user_ids : [])
                        .map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
                );
                const hiddenIds = new Set(
                    [
                        ...(Array.isArray(data.hidden_user_ids) ? data.hidden_user_ids : []),
                        ...(Array.isArray(data.hidden_post_user_ids) ? data.hidden_post_user_ids : []),
                    ].map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
                );

                if (blockedIds.has(authorId) || hiddenIds.has(authorId)) {
                    setSelectedPost(null);
                }
            } catch {
                // On error, leave the selection as-is (fail-open is acceptable here)
            }
        })();

        return () => { cancelled = true; };
    }, [activeBusinessId, activeArtistId, isBusinessAccount, isArtistAccount, selectedPost]);

    /* ------------------------------------------------------------------
     * Keep map popup + totals in sync when user hides/blocks from popovers
     * (especially while viewing the Map tab popup).
     * ------------------------------------------------------------------ */
    const getOwnerIdForPostId = useCallback((postId) => {
        const idStr = postId != null ? String(postId) : '';
        if (!idStr) return null;

        // prefer selected post
        const curSelected = selectedPostRef.current;
        if (curSelected && curSelected.id != null && String(curSelected.id) === idStr) {
            const n = Number(curSelected.user_id ?? curSelected.userId ?? curSelected.author_id ?? curSelected.owner_id ?? 0);
            return Number.isFinite(n) && n > 0 ? n : null;
        }

        const cached = popupPostCacheRef.current?.[idStr];
        if (cached && typeof cached === 'object') {
            const n = Number(cached.user_id ?? cached.userId ?? cached.author_id ?? cached.owner_id ?? 0);
            return Number.isFinite(n) && n > 0 ? n : null;
        }

        const fromList = (postsSourceRef.current || []).find((p) => p && p.id != null && String(p.id) === idStr);
        if (fromList) {
            const n = Number(fromList.user_id ?? fromList.userId ?? fromList.author_id ?? fromList.owner_id ?? 0);
            return Number.isFinite(n) && n > 0 ? n : null;
        }

        return null;
    }, []); // stable — reads postsSource, popupPostCache, selectedPost via refs

    useEffect(() => {
        const handleHideOrBlock = (e) => {
            const detail = e?.detail || {};
            const userIdNum = Number(detail.userId || 0);
            const targetType = detail.targetType || '';
            if (!Number.isFinite(userIdNum) || userIdNum <= 0) return;

            const opened = openedPopupId != null ? String(openedPopupId) : null;
            const selectedIdStr = selectedPost?.id != null ? String(selectedPost.id) : null;

            const openedOwner = opened ? getOwnerIdForPostId(opened) : null;
            const selectedOwner = selectedIdStr ? getOwnerIdForPostId(selectedIdStr) : null;

            const shouldClearOpened = opened && openedOwner && Number(openedOwner) === userIdNum;
            const shouldClearSelected = selectedIdStr && selectedOwner && Number(selectedOwner) === userIdNum;

            if (shouldClearOpened) {
                setOpenedPopupId(null);
            }
            if (shouldClearSelected) {
                setSelectedPost(null);
            }

            // Gracefully filter posts from the hidden/blocked user out of state
            // instead of triggering a full refetch (which flashes loading state).
            const matchesUser = (p) => {
                const pUserId = Number(p?.user_id ?? p?.userId ?? p?.author_id ?? p?.owner_id ?? 0);
                const pBizId = Number(p?.business_id ?? p?.businessId ?? 0);
                const pArtId = Number(p?.artist_id ?? p?.artistId ?? 0);
                if (pUserId && pUserId === userIdNum) return true;
                if ((targetType === 'business' || !targetType) && pBizId && pBizId === userIdNum) return true;
                if ((targetType === 'artist' || !targetType) && pArtId && pArtId === userIdNum) return true;
                return false;
            };

            setPagedPosts((prev) => {
                const next = prev.filter((p) => !matchesUser(p));
                const removed = prev.length - next.length;
                if (removed > 0) {
                    setTotalCount((t) => (t != null ? Math.max(0, t - removed) : t));
                }
                return next;
            });

            setGroupPosts((prev) => prev.filter((p) => !matchesUser(p)));
        };

        window.addEventListener('ll:user:hidden-changed', handleHideOrBlock);
        window.addEventListener('ll:user:blocked-changed', handleHideOrBlock);

        // Hide single post — gracefully remove from state
        const handleHiddenPost = (e) => {
            const detail = e?.detail || {};
            const pid = detail.postId != null ? String(detail.postId) : null;
            const hidden = Boolean(detail.hidden);

            if (hidden && pid) {
                if (openedPopupId != null && String(openedPopupId) === pid) setOpenedPopupId(null);
                if (selectedPost?.id != null && String(selectedPost.id) === pid) setSelectedPost(null);

                setPagedPosts((prev) => {
                    const next = prev.filter((p) => p?.id != null && String(p.id) !== pid);
                    const removed = prev.length - next.length;
                    if (removed > 0) {
                        setTotalCount((t) => (t != null ? Math.max(0, t - removed) : t));
                    }
                    return next;
                });

                setGroupPosts((prev) => prev.filter((p) => p?.id != null && String(p.id) !== pid));
            }
        };

        window.addEventListener('ll:post:hidden-changed', handleHiddenPost);

        return () => {
            window.removeEventListener('ll:user:hidden-changed', handleHideOrBlock);
            window.removeEventListener('ll:user:blocked-changed', handleHideOrBlock);
            window.removeEventListener('ll:post:hidden-changed', handleHiddenPost);
        };
    }, [openedPopupId, selectedPost, getOwnerIdForPostId]);

// Build marker GeoJSON from the SAME source used by the post list (pagedPosts / cache).
// This keeps the map immediately consistent after an edit, even when the edited post
// is beyond the first fetched page.
    const computedPoints = useMemo(() => {
        const arr = Array.isArray(postsSource) ? postsSource : [];
        const features = arr
            .filter((p) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
            .map((p) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [Number(p.longitude), Number(p.latitude)],
                },
                properties: {
                    id: p.id,
                    // Map marker layer still expects the legacy Discussion slug (community-chat)
                    // for icon selection + multi-post arrow grouping. Keep UI posts as "discussion",
                    // but provide legacy slug to the map.
                    category: (() => {
                        const raw = String(p.category || '').trim().toLowerCase();
                        const normalized = normalizeCategory(raw);
                        return normalized === 'discussion' ? 'community-chat' : normalized;
                    })(),
                    user_id:  p.user_id ?? p.userId ?? p.author_id ?? p.authorId ?? p.owner_id ?? p.ownerId ?? null,
                },
            }));
        return { type: 'FeatureCollection', features };
    }, [postsSource]);

    const pointsSource = useMemo(() => {
        if (computedPoints?.features?.length) return computedPoints;

        // Fallback to hook/cached points if list is empty (ex: initial load, or user cleared filters).
        const liveHas = points && (Array.isArray(points.features) ? points.features.length > 0 : true);
        if (liveHas) return points;
        if (view === 'trending') return points;
        return cachedData?.points || points;
    }, [computedPoints, points, cachedData, view]);

    latestRefetchRef.current = refetch;

    const normalizePanelErrorMessage = useCallback((value) => {
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
    }, []);

    const isLikelyNetworkError = useCallback((value) => {
        const msg = normalizePanelErrorMessage(value).toLowerCase();
        if (!msg) return false;
        return (
            msg.includes('failed to fetch')
            || msg.includes('network error')
            || msg.includes('network request failed')
            || msg.includes('load failed')
            || msg.includes('err_connection')
            || msg.includes('internet disconnected')
            || msg.includes('unable to connect')
            || msg.includes('backend')
            || msg.includes('fetch')
        );
    }, [normalizePanelErrorMessage]);

    const backendConnectionError = useMemo(() => {
        const normalizedCommunityError = normalizePanelErrorMessage(communityError);
        if (isLikelyNetworkError(normalizedCommunityError)) {
            return normalizedCommunityError || 'Unable to connect to the server. Please check your connection and try again.';
        }

        const normalizedGroupsError = normalizePanelErrorMessage(groupsHookError);
        if (isLikelyNetworkError(normalizedGroupsError)) {
            return normalizedGroupsError || 'Unable to connect to the server. Please check your connection and try again.';
        }

        return '';
    }, [communityError, groupsHookError, isLikelyNetworkError, normalizePanelErrorMessage]);

    /* ---------- list filter ---------- */
    // NOTE: We intentionally avoid client-side filtering here.
    // The server already applies search/category/location/dateRange and returns X-Total-Count.
    // Extra client filters can make the footer totals inaccurate.
    const filteredPosts = useMemo(() => (Array.isArray(postsSource) ? postsSource : []), [postsSource]);

    const filteredPostsRef = useRef(filteredPosts);
    useEffect(() => { filteredPostsRef.current = filteredPosts; }, [filteredPosts]);

    const [postCategoryCounts, setPostCategoryCounts] = useState(() => buildPostCategoryCounts(filteredPosts));

    useEffect(() => {
        if (isGroupsView) return undefined;

        const controller = new AbortController();

        const loadPostCategoryCounts = async () => {
            try {
                const limit = 200;
                let offset = 0;
                let total = null;
                const combined = [];

                while (!controller.signal.aborted) {
                    const params = new URLSearchParams();
                    if (appliedSearch) params.set('search', appliedSearch);
                    if (apiView) params.set('view', apiView);
                    if (apiSort) params.set('sort', apiSort);
                    if (dateRange) params.set('dateRange', dateRange);
                    if (selectedCity) params.set('city', selectedCity);
                    applyCountyParams(params);
                    params.set('limit', String(limit));
                    params.set('offset', String(offset));
                    params.set('includeTotal', '1');

                    const res = await secureFetch(`/api/community?${params.toString()}`, {
                        credentials: 'include',
                        signal: controller.signal,
                    });

                    if (!res.ok) throw new Error('Unable to load category counts.');

                    const pageRows = await res.json().catch(() => []);
                    const page = Array.isArray(pageRows) ? pageRows : [];
                    combined.push(...page);

                    if (total == null) {
                        const totalHeader = Number(res.headers.get('x-total-count') || res.headers.get('X-Total-Count'));
                        total = Number.isFinite(totalHeader) ? totalHeader : null;
                    }

                    if (page.length < limit) break;
                    offset += page.length;
                    if (total != null && offset >= total) break;
                }

                if (!controller.signal.aborted) {
                    setPostCategoryCounts(buildPostCategoryCounts(combined));
                }
            } catch (err) {
                if (err?.name === 'AbortError') return;
                setPostCategoryCounts(buildPostCategoryCounts(filteredPostsRef.current));
            }
        };

        loadPostCategoryCounts();

        return () => controller.abort();
    }, [appliedSearch, apiSort, apiView, dateRange, isGroupsView, selectedCity, selectedCounty]);

    /* ---------- selection + map helpers ---------- */
    const getPointLatLngById = useCallback(
        (id) => {
            const idStr = id != null ? String(id) : '';
            if (!idStr) return null;
            const feat = pointsSource?.features?.find((f) => String(f?.properties?.id) === idStr);
            const coords = feat?.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return null;
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return [lat, lng];
        },
        [pointsSource]
    );

    const hasFullPhotoPayload = (p) => {
        if (!p || typeof p !== 'object') return false;

        const photos = p.photos;
        if (Array.isArray(photos) && photos.length > 0) return true;
        if (typeof photos === 'string' && photos.trim() && photos !== 'null') return true;

        if (Array.isArray(p.community_photos) && p.community_photos.length > 0) return true;

        const pj = p.photos_json;
        if (typeof pj === 'string' && pj.trim() && pj !== 'null') return true;

        // Single cover-only fields do NOT count as "full payload"
        return false;
    };

    const ensurePopupPostLoaded = useCallback(
        async (id, { force = false } = {}) => {
            const idStr = id != null ? String(id) : '';
            if (!idStr) return;

            // Guard: only hit the API for numeric post IDs
            const idNum = Number(idStr);
            if (!Number.isFinite(idNum) || idNum <= 0) return;

            const cached = popupPostCacheRef.current?.[idStr];
            if (!force && cached && hasFullPhotoPayload(cached)) return;

            const curSelected = selectedPostRef.current;
            if (!force && curSelected && String(curSelected.id) === idStr && hasFullPhotoPayload(curSelected)) return;

            const fromList = (filteredPostsRef.current || []).find((p) => String(p?.id) === idStr) || null;
            if (!force && fromList && hasFullPhotoPayload(fromList)) return;

            if (popupFetchInFlightRef.current.has(idStr)) return;

            popupFetchInFlightRef.current.add(idStr);
            try {
                const res = await secureFetch(`/api/community/${encodeURIComponent(idStr)}`, {
                    credentials: 'include',
                });
                if (!res.ok) return;
                const data = await res.json();
                if (!data || data.id == null) return;

                setPopupPostCache((prev) => {
                    const next = { ...(prev || {}) };
                    next[idStr] = data;
                    return next;
                });

                setSelectedPost((prev) => {
                    if (!prev || prev.id == null) return prev;
                    return String(prev.id) === idStr ? data : prev;
                });
            } catch {
                // ignore
            } finally {
                popupFetchInFlightRef.current.delete(idStr);
            }
        },
        [] // stable — reads filteredPosts, popupPostCache, selectedPost via refs
    );

// ✅ Restore selection when returning from Post Page:
// If we have a selectedPostId (restored from sessionStorage), ensure we have the latest post
// even if it is not present in the first page of the left list yet.
    useEffect(() => {
        if (selectedPostId == null) return;
        // Guard: only fetch if selectedPostId is a positive integer.
        // Prevents "Invalid post id" 400 errors when a stale/invalid value is restored.
        const idNum = Number(selectedPostId);
        if (!Number.isFinite(idNum) || idNum <= 0) return;
        // Don't try to load a post when we're not in posts-related left mode.
        if (leftMode !== 'posts' && leftMode !== 'groups') return;
        const idStr = String(idNum);
        void ensurePopupPostLoaded(idStr);
    }, [selectedPostId, ensurePopupPostLoaded, leftMode]);

    useEffect(() => {
        if (activeTab !== 'posts') return;
        if (selectedPostId == null) return;
        const idNum = Number(selectedPostId);
        if (!Number.isFinite(idNum) || idNum <= 0) return;
        if (leftMode !== 'posts' && leftMode !== 'groups') return;
        const idStr = String(idNum);
        void ensurePopupPostLoaded(idStr);
    }, [activeTab, selectedPostId, ensurePopupPostLoaded, leftMode]);



    const focusMapForPost = useCallback(
        (post, latLngOverride) => {
            const p = post || {};
            const idStr = p?.id != null ? String(p.id) : null;

            // ✅ Check for statewide posts FIRST - zoom out to show entire state
            const cityRaw = String(p?.city || '').trim().toLowerCase();
            const countyRaw = String(p?.county || '').trim().toLowerCase();
            const isStatewidePost = (
                (!cityRaw && !countyRaw) ||
                (cityRaw === 'statewide' || countyRaw === 'statewide') ||
                (cityRaw === 'all cities' && countyRaw === 'all counties')
            ) || Boolean(p?.statewide ?? p?.is_statewide ?? p?.isStatewide);

            if (isStatewidePost) {
                try {
                    if (mapRef?.current && typeof mapRef.current.setView === 'function') {
                        mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
                    }
                } catch {
                    // ignore
                }
                setCenter(DEFAULT_CENTER);
                setZoomLevel(DEFAULT_ZOOM);
                return;
            }

            // Small offset ensures Recenter dedup doesn't skip when clicking nearby pins.
            // The actual popup-aware positioning is handled by Recenter's getNorthPanTarget (300px).
            const POPUP_LAT_OFFSET = 0.005;

            // Use county zoom when post only has county, city zoom when it has a city
            const cityVal = String(p.city || '').trim().toLowerCase();
            const hasCity = !!cityVal &&
                cityVal !== 'all cities' && cityVal !== 'statewide';
            const countyVal = String(p.county || '').trim().toLowerCase();
            const hasCounty = !!countyVal &&
                countyVal !== 'all counties' && countyVal !== 'statewide';

            // Statewide posts: stay at default zoom, don't fly anywhere
            if (!hasCity && !hasCounty) {
                setCenter(DEFAULT_CENTER);
                setZoomLevel(DEFAULT_ZOOM);
                return;
            }

            const postZoom = hasCity ? ZOOM_BY_LEVEL.city : ZOOM_BY_LEVEL.county;

            if (
                latLngOverride &&
                Number.isFinite(latLngOverride.lat) &&
                Number.isFinite(latLngOverride.lng)
            ) {
                // If the caller already applied a north-pan offset (markerLat/markerLng present),
                // use the raw marker position + our lat offset instead of double-offsetting.
                const baseLat = Number.isFinite(latLngOverride.markerLat) ? latLngOverride.markerLat : latLngOverride.lat;
                const baseLng = Number.isFinite(latLngOverride.markerLng) ? latLngOverride.markerLng : latLngOverride.lng;
                setCenter([baseLat + POPUP_LAT_OFFSET, baseLng]);
                setZoomLevel(postZoom);
                return;
            }

            if (idStr) {
                const pt = getPointLatLngById(idStr);
                if (pt) {
                    setCenter([pt[0] + POPUP_LAT_OFFSET, pt[1]]);
                    setZoomLevel(postZoom);
                    return;
                }
            }

            const lat = Number(p.latitude ?? p.lat);
            const lng = Number(p.longitude ?? p.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                setCenter([lat + POPUP_LAT_OFFSET, lng]);
                setZoomLevel(postZoom);
                return;
            }

            if (p.city) {
                const cityObj = cityList.find((c) => c.name === p.city);
                if (cityObj?.coordinates) {
                    setCenter([cityObj.coordinates[0] + POPUP_LAT_OFFSET, cityObj.coordinates[1]]);
                    setZoomLevel(ZOOM_BY_LEVEL.city);
                    return;
                }
            }

            if (p.county) {
                const countyName = String(p.county).replace(/ County$/i, '');
                const countyObj = countyList.find((c) => c.name === countyName);
                if (countyObj?.coordinates) {
                    setCenter([countyObj.coordinates[0] + POPUP_LAT_OFFSET, countyObj.coordinates[1]]);
                    setZoomLevel(ZOOM_BY_LEVEL.county);
                    return;
                }
            }

            // ✅ Fallback: if no location info found, show entire state
            setCenter(DEFAULT_CENTER);
            setZoomLevel(DEFAULT_ZOOM);
        },
        [getPointLatLngById, cityList, countyList]
    );

    const handleLocationClick = useCallback(
        (arg1, arg2, levelArg) => {
            setActiveTabSafe('map');
            setDetailExpanded(false);

            if (arg1 && typeof arg1 === 'object' && arg1.id != null) {
                setSelectedPost((prev) => {
                    const prevId = prev?.id;
                    const nextId = arg1.id;
                    return prevId != null && String(prevId) === String(nextId) ? prev : arg1;
                });
            }

            // Mobile: open the fullscreen map drawer first, then delay the fly-to
            // so the slide-up animation finishes before the map starts moving.
            const isMobileNow = window.innerWidth < 1440;
            if (isMobileNow && !mobileMapOpen) {
                setMobileMapOpen(true);

                // Delay map actions until after the drawer slide-up animation (~350ms)
                const DRAWER_ANIM_MS = 380;
                setTimeout(() => {
                    if (typeof arg1 === 'number' && typeof arg2 === 'number') {
                        const level = levelArg || 'city';
                        setCenter([arg1, arg2]);
                        setZoomLevel(ZOOM_BY_LEVEL[level] ?? ZOOM_BY_LEVEL.city);
                        setOpenedPopupId(null);
                        return;
                    }

                    const post = arg1 || {};
                    const lcCity = String(post?.city || '').trim().toLowerCase();
                    const lcCounty = String(post?.county || '').trim().toLowerCase();
                    const isStatewidePost = (
                        (!lcCity && !lcCounty) ||
                        (lcCity === 'statewide' || lcCounty === 'statewide') ||
                        (lcCity === 'all cities' && lcCounty === 'all counties')
                    ) || Boolean(post?.statewide ?? post?.is_statewide ?? post?.isStatewide);

                    if (isStatewidePost) {
                        try {
                            if (mapRef?.current && typeof mapRef.current.setView === 'function') {
                                mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
                            }
                        } catch { /* ignore */ }
                        setCenter(DEFAULT_CENTER);
                        setZoomLevel(DEFAULT_ZOOM);
                        setOpenedPopupId(null);
                        return;
                    }
                    const idStr = post?.id != null ? String(post.id) : null;
                    if (idStr) void ensurePopupPostLoaded(idStr);
                    focusMapForPost(post);
                    setOpenedPopupId(idStr);
                }, DRAWER_ANIM_MS);
                return;
            }

            // Desktop path (or mobile map already open) — immediate
            if (typeof arg1 === 'number' && typeof arg2 === 'number') {
                const level = levelArg || 'city';
                setCenter([arg1, arg2]);
                setZoomLevel(ZOOM_BY_LEVEL[level] ?? ZOOM_BY_LEVEL.city);
                setOpenedPopupId(null);
                return;
            }

            const post = arg1 || {};

            const lcCity = String(post?.city || '').trim().toLowerCase();
            const lcCounty = String(post?.county || '').trim().toLowerCase();
            const isStatewidePost = (
                (!lcCity && !lcCounty) ||
                (lcCity === 'statewide' || lcCounty === 'statewide') ||
                (lcCity === 'all cities' && lcCounty === 'all counties')
            ) || Boolean(post?.statewide ?? post?.is_statewide ?? post?.isStatewide);

            // If the post is statewide, clicking the location should zoom out to the default Alabama view.
            // NOTE: User-driven map zoom/pan may not update `center/zoomLevel` state, so we also
            // reset the Leaflet instance directly via mapRef when available.
            if (isStatewidePost) {
                try {
                    if (mapRef?.current && typeof mapRef.current.setView === 'function') {
                        mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
                    }
                } catch {
                    // ignore
                }

                setCenter(DEFAULT_CENTER);
                setZoomLevel(DEFAULT_ZOOM);
                setOpenedPopupId(null);
                return;
            }
            const idStr = post?.id != null ? String(post.id) : null;
            if (idStr) void ensurePopupPostLoaded(idStr);
            focusMapForPost(post);
            setOpenedPopupId(idStr);
        },
        [ensurePopupPostLoaded, focusMapForPost, setActiveTabSafe, mobileMapOpen]
    );

    // Track which photo index to open the post detail to (when a user
    // taps a specific photo in the post card rather than the body/title).
    const [selectedPostInitialPhoto, setSelectedPostInitialPhoto] = useState(0);

    const onCardClick = useCallback(
        (post, photoIndex = 0) => {
            if (!post) return;

            // Mobile: open post detail in a slide-in drawer (using PostDetailModal embedded)
            // But NOT if the map drawer is open — the map has its own internal detail drawer
            // and opening both causes a blank screen when dismissing.
            if (window.innerWidth < 1440 && post.id != null && !mobileMapOpen) {
                setSelectedPost(post);
                setSelectedPostInitialPhoto(Number.isFinite(photoIndex) ? photoIndex : 0);
                setMobileDrawerMode('post');
                setMobileDetailOpen(true);
                return;
            }

            setSelectedPost(post);
            setSelectedPostInitialPhoto(Number.isFinite(photoIndex) ? photoIndex : 0);
            setActiveTabSafe('posts');
            setDetailExpanded(false);

            const idStr = post?.id != null ? String(post.id) : null;

            // Statewide posts have no map marker — don't try to open a popup
            const cVal = String(post?.city || '').trim().toLowerCase();
            const coVal = String(post?.county || '').trim().toLowerCase();
            const isStw = (!cVal && !coVal) ||
                cVal === 'statewide' || coVal === 'statewide' ||
                (cVal === 'all cities' && coVal === 'all counties') ||
                Boolean(post?.statewide ?? post?.is_statewide ?? post?.isStatewide);

            if (isStw) {
                setOpenedPopupId(null);
            } else {
                setOpenedPopupId(idStr);
            }

            if (idStr && !isStw) void ensurePopupPostLoaded(idStr);
            focusMapForPost(post);
        },
        [ensurePopupPostLoaded, focusMapForPost, setActiveTabSafe, navigate, mobileMapOpen]
    );

    const handleMarkerClick = useCallback(
        (id, latLng) => {
            const idStr = id != null ? String(id) : null;
            if (!idStr) return;

            if (latLng && Number.isFinite(latLng.lat) && Number.isFinite(latLng.lng)) {
                lastMarkerLatLngByIdRef.current[idStr] = { lat: latLng.lat, lng: latLng.lng };
            }

            const fromList = (filteredPosts || []).find((p) => String(p?.id) === idStr) || null;
            const fromCache = popupPostCache?.[idStr] || null;
            const post = fromList || fromCache || { id: idStr };
            if (fromList || fromCache) setSelectedPost(post);

            setOpenedPopupId(idStr);
            void ensurePopupPostLoaded(idStr);
            focusMapForPost(post, latLng);
        },
        [filteredPosts, popupPostCache, ensurePopupPostLoaded, focusMapForPost]
    );

    /* ---------- deep-link: /community?post=:id ---------- */
    /* ---------- user mini card (used by PostCard in the map popup) ---------- */
    const viewerUser = user?.user || user || null;

    const openLoginPopup = useCallback(
        (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            try {
                window.dispatchEvent(new CustomEvent('open-login'));
                window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                window.dispatchEvent(new CustomEvent('open-login-popup'));
            } catch {
                // ignore
            }
            try {
                navigate('/login');
            } catch {
                // ignore
            }
        },
        [navigate]
    );

    const openAuthUI = useCallback(() => {
        openLoginPopup();
    }, [openLoginPopup]);

    const requireAuth = useCallback(
        (cb) => {
            if (viewerUser) return cb?.();
            openAuthUI();
            return undefined;
        },
        [viewerUser, openAuthUI]
    );

    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const closeUserCard = useCallback(() => {
        setUserAnchor(null);
        setUserForCard(null);
    }, []);

    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());






    const hydrateTargetFromPublic = useCallback(
        async (target) => {
            if (!target) return null;
            const handleOrId = target.handle || target.id;
            if (!handleOrId) return null;

            const urls = [
                `${api}/users/public/${encodeURIComponent(handleOrId)}`,
                `/users/public/${encodeURIComponent(handleOrId)}`,
                `/api/users/public/${encodeURIComponent(handleOrId)}`,
            ].filter(Boolean);

            for (const u of urls) {
                try {
                    const res = await secureFetch(u, { credentials: 'include' });
                    if (!res.ok) continue;
                    const data = await res.json();
                    const profile = data?.profile || data?.user || data;
                    if (!profile) continue;

                    // Ensure we have the numeric id
                    setUserForCard((prev) => {
                        if (!prev) return prev;
                        if (!prev.id && profile.id) return { ...prev, id: profile.id };
                        return prev;
                    });

                    // Am *I* in the target's followers?
                    const sjRaw = profile.social_json;
                    let sj = {};
                    if (typeof sjRaw === 'string') {
                        try {
                            sj = JSON.parse(sjRaw || '{}');
                        } catch {
                            sj = {};
                        }
                    } else if (sjRaw && typeof sjRaw === 'object') {
                        sj = sjRaw;
                    }
                    const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                    const isF = !!viewerUser?.id && followers.includes(Number(viewerUser.id));
                    if (profile.id && isF) {
                        setServerFollowingSet((old) => {
                            const next = new Set(old);
                            next.add(Number(profile.id));
                            return next;
                        });
                    }

                    return profile;
                } catch {
                    // try next
                }
            }

            return null;
        },
        [viewerUser?.id]
    );

    const handleOpenUserCard = useCallback(
        (anchorEl, author) => {
            if (!anchorEl) return;

            setUserAnchor(anchorEl);
            setUserForCard({
                id: author?.id, // may be undefined; we'll hydrate from /users/public
                first_name: author?.first_name,
                last_name: author?.last_name,
                handle: author?.handle,
                avatar_url: author?.avatar_url,
            });

            // Fire-and-forget hydration to resolve id + following
            void hydrateTargetFromPublic(author);
        },
        [hydrateTargetFromPublic]
    );


    const handleGroupPostUserClick = useCallback(
        (e, post) => {
            if (!e || !post) return;
            const anchorEl = e.currentTarget;
            if (!anchorEl) return;

            const author = {
                id: post?.user_id ?? post?.author_id ?? post?.user?.id ?? post?.uid ?? null,
                first_name: post?.first_name ?? post?.firstName ?? '',
                last_name: post?.last_name ?? post?.lastName ?? '',
                handle: post?.handle ?? '',
                avatar_url: post?.profile_picture ?? post?.avatar_url ?? post?.avatarUrl ?? '',
                public_id: post?.public_id ?? post?.publicId ?? null,
            };

            handleOpenUserCard(anchorEl, author);
        },
        [handleOpenUserCard]
    );

    const handleViewProfile = useCallback((u) => {
        const slug = u?.handle || u?.id;
        if (!slug) return;
        window.location.assign(`/${slug}`);
    }, []);

    const postFollow = useCallback(async (targetId) => {
        const payload = { target_id: targetId, action: 'follow' };
        const urls = [`${api}/users/follow`, '/api/users/follow', '/users/follow'].filter(Boolean);
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) return true;
            } catch {
                // try next
            }
        }
        return false;
    }, []);

    const handleFollow = useCallback(
        async (targetUser) => {
            const tid0 = Number(targetUser?.id || userForCard?.id);
            const handle0 = targetUser?.handle || userForCard?.handle;
            if (!tid0 && !handle0) return;

            // Don't allow following yourself
            const selfId = Number(viewerUser?.id);
            if (selfId && tid0 && selfId === tid0) return;

            requireAuth(async () => {
                // Ensure numeric id via hydration if needed
                let tid = tid0;
                if (!tid && handle0) {
                    const p = await hydrateTargetFromPublic({ handle: handle0 });
                    if (p?.id) tid = Number(p.id);
                }
                if (!tid) return;

                // Optimistic UI flip
                setLocallyFollowed((prev) => {
                    const next = new Set(prev);
                    next.add(tid);
                    return next;
                });

                const ok = await postFollow(tid);
                if (ok) {
                    setServerFollowingSet((prev) => {
                        const next = new Set(prev);
                        next.add(tid);
                        return next;
                    });
                } else {
                    // rollback optimistic
                    setLocallyFollowed((prev) => {
                        const next = new Set(prev);
                        next.delete(tid);
                        return next;
                    });
                }
            });
        },
        [requireAuth, userForCard?.handle, userForCard?.id, viewerUser?.id, hydrateTargetFromPublic, postFollow]
    );

    const isSelfForCard = useMemo(() => {
        if (!viewerUser || !userForCard) return false;
        const idMatch =
            viewerUser.id != null && userForCard.id != null && Number(viewerUser.id) === Number(userForCard.id);
        const handleMatch =
            viewerUser.handle &&
            userForCard.handle &&
            String(viewerUser.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || handleMatch;
    }, [viewerUser, userForCard]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    const popupContentById = useMemo(() => {
        const map = new Map();

        const addPost = (post) => {
            if (!post || post.id == null) return;
            const idStr = String(post.id);
            const node = (
                <PopupPostCardWrapper
                    key={`popup-${idStr}`}
                    post={post}
                    user={user}
                    onMutate={handlePostMutate}
                    currentView={view}
                    onOpenUserCard={handleOpenUserCard}
                    onLocationClick={handleLocationClick}
                    onCardClick={onCardClick}
                    setHoveredId={setHoveredId}
                    hoveredIdRef={hoveredIdRef}
                    selectedPostIdRef={selectedPostIdRef}
                    openedPopupIdRef={openedPopupIdRef}
                    isBusinessAccount={isBusinessAccount}
                    isArtistAccount={isArtistAccount}
                />
            );
            map.set(idStr, node);
            map.set(post.id, node);
            const idNum = Number(idStr);
            if (Number.isFinite(idNum)) map.set(idNum, node);
            map.set(`post-${idStr}`, node);
            map.set(`p${idStr}`, node);
            map.set(`c${idStr}`, node);
        };

        (filteredPosts || []).forEach(addPost);
        Object.values(popupPostCache || {}).forEach(addPost);

        return map;
        // ── IMPORTANT: hoveredId, selectedPostId, openedPopupId are intentionally
        // EXCLUDED from this dependency array.  They are read via refs inside
        // PopupPostCardWrapper so that this Map is NOT rebuilt on every hover /
        // selection change.  Rebuilding the Map was the root cause of the
        // "Maximum update depth exceeded" infinite loop — each new Map triggered
        // CommunityMapView effects → setState → re-render → new Map → loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredPosts, popupPostCache, user, view, handleOpenUserCard, handlePostMutate, handleLocationClick, onCardClick, isBusinessAccount, isArtistAccount]);


    const handlePopupClose = useCallback((closingId) => {
        // Only clear if the popup being closed is still the currently opened one.
        // This prevents a race condition when switching pins: click B fires first
        // (setting openedPopupId to B), then Leaflet closes popup A asynchronously
        // which would incorrectly reset openedPopupId to null.
        setOpenedPopupId((prev) => {
            if (closingId == null) return null;
            const closingStr = String(closingId);
            const prevStr = prev != null ? String(prev) : null;
            if (prevStr === closingStr) return null;
            return prev;
        });
    }, []);

    /* ---------- new-post flow ---------- */
    const [stepOneOpen, setStepOneOpen] = useState(false);
    const [stepTwoOpen, setStepTwoOpen] = useState(false);
    const [stepOneData, setStepOneData] = useState(null);
    const openStepOne = () => {
        const result = checkPostLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'posts' });
            setRateLimitOpen(true);
            return;
        }
        setStepOneOpen(true);
    };
    const handleCategoryChosen = (d) => {
        setStepOneData(d);
        setStepOneOpen(false);
        setStepTwoOpen(true);
    };

    /* ---------- server categories ---------- */
    const [categories, setCategories] = useState([]);
    useEffect(() => {
        const ac = new AbortController();
        let alive = true;
        secureFetch('/api/community/categories', { signal: ac.signal })
            .then((r) => r.json())
            .then((data) => {
                if (alive) setCategories(data);
            })
            .catch(() => {});
        return () => {
            alive = false;
            ac.abort();
        };
    }, []);




    /* ---------- header navigation reset ---------- */
    // When the user re-clicks "Community" in the header while already on Community,
    // clear selection and scroll to top — but preserve filters and tab state.
    const headerResetToken = useMemo(() => {
        const token = loc?.state?.llCommunityReset;
        if (token == null) return null;
        return String(token);
    }, [loc?.state?.llCommunityReset]);

    const lastHeaderResetTokenRef = useRef(() => {
        try {
            return sessionStorage.getItem('ll:community:lastResetToken') || null;
        } catch {
            return null;
        }
    });
    // Unwrap the initializer (useRef doesn't call functions like useState)
    if (typeof lastHeaderResetTokenRef.current === 'function') {
        lastHeaderResetTokenRef.current = lastHeaderResetTokenRef.current();
    }

    useEffect(() => {
        if (!headerResetToken) return;
        if (lastHeaderResetTokenRef.current === headerResetToken) return;
        lastHeaderResetTokenRef.current = headerResetToken;

        // Persist so we don't re-consume the same token after unmount/remount
        try {
            sessionStorage.setItem('ll:community:lastResetToken', headerResetToken);
        } catch {
            // ignore
        }

        // Clear selection state but keep filters, tabs, and UI preferences intact
        setSelectedPost(null);
        setOpenedPopupId(null);
        setHoveredId(null);

        // If we were deep-linked with ?post=, remove it so nothing is selected.
        try {
            const s = new URLSearchParams(loc.search);
            if (s.has('post')) {
                s.delete('post');
                const qs = s.toString();
                navigate(qs ? `/community?${qs}` : '/community', {
                    replace: true,
                    state: { ...(loc.state || {}), llCommunityReset: headerResetToken },
                });
            }
        } catch {
            // ignore
        }

        // Scroll lists to top + refetch with current filters.
        bumpScrollToTopSeq();
        scheduleRefetch();
    }, [headerResetToken, loc.search, loc.state, navigate, scheduleRefetch, bumpScrollToTopSeq]);

    const deepPostId = useMemo(() => {
        const s = new URLSearchParams(loc.search);
        const id = s.get('post');
        return id ? String(id) : null;
    }, [loc.search]);

    useEffect(() => {
        if (!deepPostId) return;
        const found = (postsSource || []).find((p) => String(p.id) === deepPostId);
        if (found) {
            setSelectedPost(found);
            setActiveTabSafe('posts');
            setDetailExpanded(false);
        }
    }, [deepPostId, postsSource, setActiveTabSafe]);

    /* ---------- search handler (manual vs auto) ---------- */

    const handleOpenNewGroup = useCallback(() => {
        const result = checkGroupLimit();
        if (!result.allowed) {
            setRateLimitInfo({ retryAfterSec: result.retryAfterSec, reason: result.reason, actionLabel: 'groups' });
            setRateLimitOpen(true);
            return;
        }
        setIsCreateGroupOpen(true);
    }, [checkGroupLimit]);

    // ── Listen for create actions from the global Header create (+) menu ──
    const openStepOneRef = useRef(openStepOne);
    openStepOneRef.current = openStepOne;
    const handleOpenNewGroupRef = useRef(handleOpenNewGroup);
    handleOpenNewGroupRef.current = handleOpenNewGroup;

    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};

            // Only handle community-related actions
            if (action !== 'communityPost' && action !== 'group') return;

            if (blocked === 'account') {
                setSwitchAccountDialog({
                    open: true,
                    message: action === 'group'
                        ? 'Groups are designed for a personal experience. Switch to your personal account to create a group.'
                        : 'Community posts are for personal accounts. Switch to your personal profile to create a post.',
                });
                return;
            }

            if (blocked === 'rateLimit') {
                setRateLimitInfo({
                    retryAfterSec: retryAfterSec || 10,
                    reason: reason || 'cooldown',
                    actionLabel: action === 'group' ? 'groups' : 'posts',
                });
                setRateLimitOpen(true);
                return;
            }

            if (action === 'communityPost') {
                openStepOneRef.current();
            } else if (action === 'group') {
                handleOpenNewGroupRef.current();
            }
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => {
            window.removeEventListener('ll:header:create', handleHeaderCreate);
        };
    }, []);

    const handleCreateGroup = useCallback(
        async ({ name, groupUsername, category, description, visibility, county, city, imageUrl, imageObjectPath, isStatewide, rulesHtml, inviteUserIds }) => {
            const created = await createGroup({ name, groupUsername, category, description, visibility, county, city, imageUrl, imageObjectPath, isStatewide, rulesHtml, inviteUserIds });

            // Record the action so the rate limiter tracks it
            recordGroup();

            try {
                await refetchGroups();
            } catch {
                // ignore
            }

            if (created) {
                setSelectedGroup(created);
                setSelectedPost(null);
                setActiveTabSafe('posts');
            }

            setIsCreateGroupOpen(false);
        },
        [createGroup, refetchGroups, recordGroup]
    );

    const handleSearchClick = useCallback(
        (mode, term) => {
            // ✅ always scroll list to top when a search/filter action runs
            bumpScrollToTopSeq();

            clearSelection();
            // Don't force the right panel back to Trending on every search.
            // Users should be able to stay on Posts/Map while refining filters.
            setDetailExpanded(false);

            if (mode === 'manual') {
                // Immediate — user clicked Search button or hit Enter.
                // Cancel any pending auto-search so we don't double-fire.
                if (autoSearchTimerRef.current) {
                    clearTimeout(autoSearchTimerRef.current);
                    autoSearchTimerRef.current = null;
                }
                // If the caller passes an explicit term (e.g. '' on clear), use it.
                // Otherwise fall back to the current search state value.
                const appliedTerm = term != null ? String(term) : search;
                dispatch({ type: 'appliedSearch', value: appliedTerm });
                scheduleRefetch();
            } else {
                // 'auto' — fired by filter dropdown changes.
                // Debounce 200ms so rapid successive filter changes (e.g. View + Sort
                // changed in quick succession) coalesce into a single API call.
                if (autoSearchTimerRef.current) clearTimeout(autoSearchTimerRef.current);
                autoSearchTimerRef.current = setTimeout(() => {
                    autoSearchTimerRef.current = null;
                    scheduleRefetch();
                }, 200);
            }

            // Groups: DO NOT call refetchGroups() here.
            // Calling refetch immediately after dispatch/setState causes a 1-step "lag"
            // because the hook still has the previous params in its closure.
            // useGroupsData refetches automatically on the next render when deps change.
        },
        [search, clearSelection, scheduleRefetch]
    );

    useEffect(() => {
        fetchPeopleYouMayKnow();
    }, [fetchPeopleYouMayKnow]);

    const locationLabel = useMemo(() => {
        if (selectedCity) return selectedCity;
        if (selectedCounty) return `${selectedCounty} County`.replace(/ County County$/, ' County');
        return 'Alabama';
    }, [selectedCity, selectedCounty]);

    // Active filter chips for mobile map overlay — shows what's currently selected, with × to remove
    const activeMapFilterChips = useMemo(() => {
        const chips = [];
        const term = String(appliedSearch || '').trim();
        if (term) {
            const truncated = term.length > 24 ? term.slice(0, 24) + '…' : term;
            chips.push({
                key: 'search',
                label: `"${truncated}"`,
                onRemove: () => {
                    dispatch({ type: 'search', value: '' });
                    dispatch({ type: 'appliedSearch', value: '' });
                    handleSearchClick('manual', '');
                },
            });
        }
        if (subtype) {
            const meta = CATEGORY_META[subtype] || CATEGORY_META[normalizeSubtype(subtype)];
            const label = meta?.label || subtype.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            chips.push({
                key: 'category',
                label,
                onRemove: () => {
                    dispatch({ type: 'subtype', value: '' });
                    handleSearchClick('auto');
                },
            });
        }
        if (selectedCity) {
            chips.push({
                key: 'city',
                label: selectedCity,
                onRemove: () => {
                    dispatch({ type: 'city', value: '' });
                    handleSearchClick('auto');
                },
            });
        }
        if (selectedCounty) {
            chips.push({
                key: 'county',
                label: `${selectedCounty} County`,
                onRemove: () => {
                    dispatch({ type: 'county', value: '' });
                    dispatch({ type: 'city', value: '' });
                    dispatch({ type: 'radius', value: STATEWIDE });
                    handleSearchClick('auto');
                },
            });
        }
        // Show radius chip only when a county is selected AND radius expands beyond it
        if (selectedCounty && !isCountyOnly(selectedRadius)) {
            chips.push({
                key: 'radius',
                label: radiusLabel(selectedRadius),
                onRemove: () => {
                    dispatch({ type: 'radius', value: DEFAULT_RADIUS_WHEN_COUNTY_SELECTED });
                    handleSearchClick('auto');
                },
            });
        }
        if (view && view !== 'all') {
            const viewLabel = view === 'trending' ? 'Trending' : view === 'mine' ? 'My Posts' : view === 'following' ? 'Following' : view.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            chips.push({
                key: 'view',
                label: viewLabel,
                onRemove: () => {
                    dispatch({ type: 'view', value: 'all' });
                    if (sort === 'trending') dispatch({ type: 'sort', value: 'newest' });
                    handleSearchClick('auto');
                },
            });
        }
        if (dateRange && dateRange !== 'all') {
            const drLabel = dateRange === '24h' ? 'Past 24h' : dateRange === '7d' ? 'Past week' : dateRange === '30d' ? 'Past month' : dateRange;
            chips.push({
                key: 'dateRange',
                label: drLabel,
                onRemove: () => {
                    dispatch({ type: 'dateRange', value: 'all' });
                    handleSearchClick('auto');
                },
            });
        }
        if (sort && sort !== 'newest' && sort !== 'trending') {
            const sortLabel = sort === 'oldest' ? 'Oldest' : sort === 'popular' ? 'Most Popular' : sort === 'random' ? 'Any' : sort.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            chips.push({
                key: 'sort',
                label: `Sort: ${sortLabel}`,
                onRemove: () => {
                    dispatch({ type: 'sort', value: 'newest' });
                    handleSearchClick('auto');
                },
            });
        }
        return chips;
    }, [appliedSearch, subtype, selectedCity, selectedCounty, view, dateRange, sort, CATEGORY_META, handleSearchClick]);

    const rightWidth = activeTab === 'posts' && detailExpanded ? RIGHT_WIDTH_EXPANDED : RIGHT_WIDTH;

    const rightTabs = useMemo(() => {
        if (isGroupsView) return [
            { label: 'Group Overview', value: 'overview' },
            { label: 'Group Posts', value: 'posts' },
        ];
        return [
            { label: 'Discover', value: 'discover' },
            { label: 'Posts', value: 'posts' },
            { label: 'Map', value: 'map' },
        ];
    }, [isGroupsView]);

    const handleRightTabChange = useCallback((nextTab) => {
        const v = String(nextTab || '').toLowerCase();
        if (!v) return;

        setActiveTabSafe(v);
        if (v !== 'posts') setDetailExpanded(false);

        if (v === 'map') {
            const idStr =
                selectedPost?.id != null
                    ? String(selectedPost.id)
                    : openedPopupId != null
                        ? String(openedPopupId)
                        : null;

            if (idStr) {
                const post =
                    selectedPost ||
                    popupPostCache?.[idStr] ||
                    (filteredPosts || []).find((p) => String(p?.id) === idStr) ||
                    { id: idStr };

                // ✅ Check if post is statewide - if so, just zoom out without opening popup
                const stwCity = String(post?.city || '').trim().toLowerCase();
                const stwCounty = String(post?.county || '').trim().toLowerCase();
                const isStatewidePost = (
                    (!stwCity && !stwCounty) ||
                    (stwCity === 'statewide' || stwCounty === 'statewide') ||
                    (stwCity === 'all cities' && stwCounty === 'all counties')
                ) || Boolean(post?.statewide ?? post?.is_statewide ?? post?.isStatewide);

                if (isStatewidePost) {
                    // Statewide posts have no marker, so clear any popup and just show the whole state
                    setOpenedPopupId(null);
                    focusMapForPost(post);
                    return;
                }

                if (reopenPopupTimerRef.current) {
                    clearTimeout(reopenPopupTimerRef.current);
                    reopenPopupTimerRef.current = null;
                }

                setOpenedPopupId(null);
                reopenPopupTimerRef.current = setTimeout(() => {
                    reopenPopupTimerRef.current = null;
                    setOpenedPopupId(idStr);
                }, 0);

                void ensurePopupPostLoaded(idStr);

                const savedLatLng = lastMarkerLatLngByIdRef.current[idStr];

                const lat = Number(post?.latitude ?? post?.lat);
                const lng = Number(post?.longitude ?? post?.lng);

                const latLngForFocus =
                    savedLatLng && Number.isFinite(savedLatLng.lat) && Number.isFinite(savedLatLng.lng)
                        ? savedLatLng
                        : (Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);

                if (latLngForFocus) {
                    focusMapForPost(post, latLngForFocus);
                } else {
                    focusMapForPost(post);
                }
            }
        }
    }, [
        ensurePopupPostLoaded,
        filteredPosts,
        focusMapForPost,
        openedPopupId,
        popupPostCache,
        selectedPost,
        setActiveTabSafe,
        isGroupsView
    ]);

    return (
        <Box
            sx={{
                position: 'fixed',
                // Track global nav offset so the container expands to fill the
                // viewport as the app bar + bottom nav slide away.
                top: `calc(${chromeTop}px * (1 - var(--ll-nav-offset, 0)))`,
                left: 0,
                right: 0,
                bottom: `${BOTTOM_GUTTER_PX}px`,
                '@media (max-width: 899px)': {
                    bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px * (1 - var(--ll-nav-offset, 0)))`,
                },
                overflow: 'hidden',
                overscrollBehavior: 'contain',
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
                    bgcolor: APP_BACKGROUND,
                },
                '@media (min-width: 1440px)': {
                    flexDirection: 'row',
                    gap: 1.25,
                    p: 1.25,
                    pt: 0.75,
                    bgcolor: APP_BACKGROUND,
                },
                opacity: pageVisible ? 1 : 0,
                transform: 'none',
                transition: (t) =>
                    t.custom.motion.contentFade?.transition
                    ?? `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
            }}
        >
            {/* Left: filters + list */}
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    position: 'relative',
                    zIndex: 1,
                    height: '100%',
                    overflow: 'hidden',
                    p: 0,
                    transition: (theme) =>
                        theme.transitions.create(['opacity', 'flex-basis', 'width', 'transform'], {
                            duration: 300,
                            easing: theme.transitions.easing.easeInOut,
                        }),
                }}
            >
                <CommunityPanel
                    onSelectGroup={(g) => {
                        const raw = g;

                        // GroupsList may send either the full group object OR just the id.
                        const next =
                            (raw && typeof raw === 'object')
                                ? raw
                                : ((Array.isArray(groups) ? groups : []).find((x) => x && x.id != null && String(x.id) === String(raw)) || null);

                        // Mobile: skip preview, open fullscreen group page overlay
                        if (window.innerWidth < 1440 && next) {
                            handleViewGroupPage(next);
                            return;
                        }

                        setSelectedGroup(next);
                        setSelectedPost(null);
                        setOpenedPopupId(null);
                        setDetailExpanded(false);

                        if (!next) {
                            setActiveTabSafe('overview');
                            return;
                        }

                        const vis = String(next.visibility || '').toLowerCase();
                        const isPrivateLike = vis === 'private' || vis === 'hidden' || isFlagTrue(next.is_private ?? next.isPrivate);
                        const isMember = isFlagTrue(next.is_member ?? next.isMember);

                        // Always start on Group Overview when selecting a group
                        setActiveTabSafe('overview');

                        // Desktop: group overview panel opens on the right
                    }}
                    selectedGroupId={selectedGroup?.id || null}
                    isGroupsLoading={isGroupsLoading}
                    groups={groups}
                    groupsTotalCount={groupTotalCount}
                    groupsHasMore={
                        Number.isFinite(Number(groupTotalCount))
                            ? (Array.isArray(groups) ? groups.length < Number(groupTotalCount) : false)
                            // FIX: When groupTotalCount is null (X-Total-Count header missing),
                            // use a heuristic: if we loaded a number of groups that's a multiple
                            // of the page size, there are very likely more pages available.
                            : (Array.isArray(groups) && groups.length > 0 && groups.length % GROUPS_PAGE_SIZE === 0 ? true : null)
                    }
                    isGroupsLoadingMore={isGroupsLoadingMore}
                    onLoadMoreGroups={fetchNextGroupsPage}
                    groupsForCounts={rawGroupsForCounts}
                    onNewGroup={handleOpenNewGroup}
                    leftMode={leftMode}
                    onLeftModeChange={(mode) => {
                        const next = String(mode || 'posts').trim().toLowerCase();
                        if (next !== 'posts' && next !== 'groups' && next !== 'news') return;
                        // FEATURE FLAG 2026-04-18: silently drop 'news' switches
                        // when the feature is parked. Belt-and-suspenders with
                        // the hidden tab button in CommunityPanel.
                        if (next === 'news' && !NEWS_ENABLED) return;
                        if (next === leftMode) return; // no-op if already on this tab

                        // ── Save current tab's filters before switching ──
                        const currentFiltersSnapshot = { ...filters };
                        if (leftMode === 'posts') {
                            savedPostsFiltersRef.current = currentFiltersSnapshot;
                        } else if (leftMode === 'groups') {
                            savedGroupsFiltersRef.current = currentFiltersSnapshot;
                        }
                        // News mode uses its own category state internally; no filter snapshot needed.

                        setLeftMode(next);

                        // Reset counts so stale data doesn't flash
                        setCommunityLocationCounts(null);
                        setPostCategoryCounts(buildPostCategoryCounts([]));

                        // Clear any selected article when leaving News mode
                        if (leftMode === 'news') {
                            setSelectedNewsArticle(null);
                        }

                        // News mode: don't touch the community filters; it has its own scope logic
                        if (next === 'news') {
                            setSelectedPost(null);
                            setDetailExpanded(false);
                            return;
                        }

                        // ── Restore saved filters for the target tab (or use defaults) ──
                        // Fresh tab entries default to statewide (no county).

                        if (next === 'groups') {
                            const saved = savedGroupsFiltersRef.current;
                            if (saved) {
                                // Restore previously saved groups filters
                                Object.entries(saved).forEach(([key, val]) => {
                                    dispatch({ type: key, value: val });
                                });
                            } else {
                                // First time entering groups — use defaults
                                dispatch({ type: 'search', value: '' });
                                dispatch({ type: 'appliedSearch', value: '' });
                                dispatch({ type: 'subtype', value: '' });
                                dispatch({ type: 'county', value: '' });
                                dispatch({ type: 'city', value: '' });
                                dispatch({ type: 'radius', value: STATEWIDE });
                                dispatch({ type: 'dateRange', value: 'all' });
                                dispatch({ type: 'view', value: 'all' });
                                dispatch({ type: 'sort', value: 'random' });
                            }

                            setGroupView('all');
                            setGroupMemberType('all');
                            setActiveTabSafe('overview');
                            setDetailExpanded(false);
                        } else {
                            const saved = savedPostsFiltersRef.current;
                            if (saved) {
                                // Restore previously saved posts filters
                                Object.entries(saved).forEach(([key, val]) => {
                                    dispatch({ type: key, value: val });
                                });
                            } else {
                                // First time entering posts — use defaults
                                dispatch({ type: 'search', value: '' });
                                dispatch({ type: 'appliedSearch', value: '' });
                                dispatch({ type: 'subtype', value: '' });
                                dispatch({ type: 'county', value: '' });
                                dispatch({ type: 'city', value: '' });
                                dispatch({ type: 'radius', value: STATEWIDE });
                                dispatch({ type: 'dateRange', value: 'all' });
                                dispatch({ type: 'view', value: 'all' });
                                dispatch({ type: 'sort', value: 'newest' });
                            }
                        }
                    }}
                    groupView={groupView}
                    isOnPersonalAccount={isOnPersonalAccount}
                    onGroupViewChange={(val) => {
                        const next = String(val || 'all').trim().toLowerCase();
                        const normalized = (next === 'mine' || next === 'following') ? next : 'all';
                        setGroupView(normalized);
                        handleSearchClick('auto');
                    }}
                    groupMemberType={groupMemberType}
                    onGroupMemberTypeChange={setGroupMemberType}
                    user={user}
                    showTopAccent={false}
                    posts={filteredPosts}
                    isLoading={isLoading}
                    error={!isGroupsView ? backendConnectionError : ''}
                    groupsError={isGroupsView ? backendConnectionError : ''}
                    postListError={!isGroupsView ? backendConnectionError : ''}
                    totalCount={resolvedTotalCount}
                    hasMoreExternal={Number.isFinite(Number(resolvedTotalCount)) ? filteredPosts.length < Number(resolvedTotalCount) : null}
                    onLoadMore={fetchNextPage}
                    isLoadingMore={isLoadingMore}
                    hoveredId={hoveredId}
                    setHoveredId={setHoveredId}
                    onLocationClick={handleLocationClick}
                    onCardClick={onCardClick}
                    selectedView={view}
                    onViewChange={(val) => {
                        const nextView = String(val || 'all').trim().toLowerCase() || 'all';
                        dispatch({ type: 'view', value: nextView });

                        // When switching to Trending, reset dateRange and sort so the
                        // feed matches what the TrendingSummaryPanel shows (which fetches
                        // from /api/community/trending/summary with ONLY city, county,
                        // and window — no dateRange/sort filters). Without this reset,
                        // stale filters (e.g. dateRange=today) would restrict trending
                        // results and show a different set of posts than the panel.
                        if (nextView === 'trending') {
                            dispatch({ type: 'dateRange', value: 'all' });
                            dispatch({ type: 'sort', value: 'trending' });
                            dispatch({ type: 'search', value: '' });
                            dispatch({ type: 'appliedSearch', value: '' });
                        } else if (sort === 'trending') {
                            // Leaving trending — reset sort back to default
                            // so useCommunityData's isTrending flag doesn't stay true
                            // (it checks BOTH view AND sort for 'trending').
                            dispatch({ type: 'sort', value: isGroupsView ? 'random' : 'newest' });
                        }

                        handleSearchClick('auto');
                    }}
                    searchTerm={search}
                    onSearchTermChange={(val) => {
                        dispatch({ type: 'search', value: val });
                        // NOTE: Search is intentionally NOT auto-applied on typing.
                        // The backend uses LIKE '%term%' which triggers full table scans —
                        // auto-firing on every keystroke would be expensive under load.
                        // Users press Enter or click Search to apply.
                    }}
                    onSearchClick={handleSearchClick}
                    onClearClick={() => {
                        // ✅ always scroll list to top on clear
                        bumpScrollToTopSeq();

                        // Cancel any pending debounced searches
                        if (autoSearchTimerRef.current) {
                            clearTimeout(autoSearchTimerRef.current);
                            autoSearchTimerRef.current = null;
                        }
                        if (searchDebounceRef.current) {
                            clearTimeout(searchDebounceRef.current);
                            searchDebounceRef.current = null;
                        }

                        // ✅ show groups skeleton while clearing (Groups tab only)
                        bumpGroupsClearSeq();

                        clearSelection();
                        setDetailExpanded(false);
                        dispatch({ type: 'search', value: '' });
                        dispatch({ type: 'appliedSearch', value: '' });
                        dispatch({ type: 'view', value: 'all' });
                        dispatch({ type: 'subtype', value: '' });
                        dispatch({ type: 'sort', value: isGroupsView ? 'random' : 'newest' });
                        dispatch({ type: 'dateRange', value: 'all' });
                        dispatch({ type: 'county', value: '' });
                        dispatch({ type: 'city', value: '' });
                        dispatch({ type: 'radius', value: STATEWIDE });
                        if (isGroupsView) setGroupView('all');
                        if (isGroupsView) setGroupMemberType('all');
                        if (!isGroupsView) setRandomSeed(String(Date.now()));

                        // Clear saved filter snapshot so switching tabs won't restore stale pre-clear filters
                        if (isGroupsView) savedGroupsFiltersRef.current = null;
                        else savedPostsFiltersRef.current = null;

                        scheduleRefetch();
                        if (isGroupsView) {
                            try { refetchGroups(); } catch { /* ignore */ }
                        }
                        fetchPeopleYouMayKnow();
                    }}
                    filteredCities={availableCities}
                    filteredCounties={availableCounties}
                    tempCity={selectedCity}
                    selectedCity={selectedCity}
                    onCityChange={(val) => {
                        dispatch({ type: 'city', value: val });
                        if (val) dispatch({ type: 'county', value: cityToCounty[val] || '' });
                        handleSearchClick('auto');
                    }}
                    selectedCounty={selectedCounty}
                    onCountyChange={(val) => {
                        dispatch({ type: 'county', value: val });
                        if (!val) {
                            dispatch({ type: 'city', value: '' });
                            dispatch({ type: 'radius', value: STATEWIDE });
                        } else {
                            dispatch({ type: 'radius', value: DEFAULT_RADIUS_WHEN_COUNTY_SELECTED });
                        }
                        handleSearchClick('auto');
                    }}
                    selectedRadius={selectedRadius}
                    onRadiusChange={(val) => {
                        dispatch({ type: 'radius', value: val });
                        handleSearchClick('auto');
                    }}
                    selectedSubtype={subtype}
                    subtypes={categories}
                    postCategoryCounts={postCategoryCounts}
                    locationCounts={communityLocationCounts}
                    onSubtypeChange={(val) => {
                        dispatch({ type: 'subtype', value: val });
                        handleSearchClick('auto');
                    }}
                    selectedSort={sort}
                    sortOptions={isGroupsView ? GROUPS_SORT_OPTIONS : POSTS_SORT_OPTIONS}
                    onSortChange={(val) => {
                        const nextSort = String(val || 'random').trim().toLowerCase();
                        dispatch({ type: 'sort', value: nextSort });
                        if (nextSort === 'random') setRandomSeed(String(Date.now()));
                        handleSearchClick('auto');
                    }}
                    selectedDateRange={dateRange}
                    dateRangeOptions={isGroupsView ? EMPTY_ARRAY : POSTS_DATE_RANGE_OPTIONS}
                    onDateRangeChange={(val) => {
                        dispatch({ type: 'dateRange', value: val });
                        handleSearchClick('auto');
                    }}
                    showFilters={showFilters}
                    onToggleFilters={handleToggleFilters}
                    onOpenDiscover={isMobile ? () => {
                        // CommunityPanel handles inline discover view internally on mobile
                    } : null}
                    onOpenMap={isMobile && !isGroupsView ? () => {
                        setMobileMapOpen(true);
                    } : null}
                    onNewPost={openStepOne}
                    selectedPostId={selectedPostId}
                    selectable={true}
                    // ✅ NEW: triggers scroll-to-top behavior in CommunityPanel
                    scrollResetKey={scrollResetKey}
                    // Scroll position to restore when returning from PostPage
                    restoreScrollTop={savedScrollTopRef.current || 0}
                    groupsClearSeq={groupsClearSeq}
                    // ✅ Disable new posts for business accounts
                    isBusinessAccount={isBusinessAccount}

                    // ── News mode ──
                    newsCategory={newsCategory}
                    onNewsCategoryChange={(next) => setNewsCategory(String(next || 'all'))}
                    newsDateRange={newsDateRange}
                    onNewsDateRangeChange={(next) => setNewsDateRange(String(next || 'week'))}
                    selectedNewsArticleId={selectedNewsArticle?.id || null}
                    onSelectNewsArticle={(article) => {
                        setSelectedNewsArticle(article);
                        if (isMobile) setMobileDetailOpen(true);
                    }}
                />
            </Box>

            {/* Desktop right panel — hidden on mobile (shown in drawer instead) */}
            <Box sx={{ display: 'none', '@media (min-width: 1440px)': { display: 'contents' } }}>
                {isNewsView ? (
                    // Slice 2e: match the community-post right-panel chrome so
                    // News and Posts tabs feel like siblings. The container
                    // styling here mirrors CommunityRightPanel's root Box
                    // (soft primary-tinted border, 92% paper bg, backdrop
                    // blur, rounded corners, soft shadow) and the empty-state
                    // mirrors its "Select a post" block (76×76 rounded icon
                    // badge, bold 18 headline, 14 secondary line).
                    <Box
                        sx={{
                            flex: `0 0 ${rightWidth}px`,
                            width: rightWidth,
                            maxWidth: rightWidth,
                            minWidth: rightWidth,
                            position: 'relative',
                            height: '100%',
                            p: 0,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: (t) => alphaColor(t.palette.primary.main, 0.12),
                            borderRadius: 3,
                            bgcolor: (t) => alphaColor(t.palette.background.paper, 0.92),
                            backdropFilter: 'saturate(140%) blur(10px)',
                            backgroundImage: 'none',
                            boxShadow: (t) => `0 14px 44px ${alphaColor(t.palette.text.primary, 0.08)}`,
                        }}
                    >
                        {selectedNewsArticle ? (
                            <CommunityNewsDetailPanel
                                article={selectedNewsArticle}
                                onBack={() => setSelectedNewsArticle(null)}
                            />
                        ) : (
                            <Box
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    p: 4,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: '100%',
                                        maxWidth: 420,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1.1,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 76,
                                            height: 76,
                                            borderRadius: '18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: (t) => alphaColor(t.palette.text.primary, 0.03),
                                            border: (t) => `1px solid ${alphaColor(t.palette.text.primary, 0.06)}`,
                                            // CommunityRightPanel uses t.custom.shadows.xs here. We
                                            // fall back gracefully if that custom shadow token
                                            // isn't defined in this tree (harmless — the icon
                                            // badge still reads clearly from the bg + border).
                                            boxShadow: (t) => t?.custom?.shadows?.xs || 'none',
                                        }}
                                    >
                                        <NewspaperRoundedIcon
                                            sx={{ fontSize: 42, color: 'primary.main', opacity: 0.9 }}
                                        />
                                    </Box>

                                    <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                                        Select an article
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontSize: 14, lineHeight: 1.45 }}
                                    >
                                        Click any news headline on the left to see the preview here.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <CommunityRightPanel
                        rightWidth={rightWidth}
                        isGroupsView={isGroupsView}
                        activeTab={activeTab}
                        rightTabs={rightTabs}
                        HEADER_H={HEADER_H}
                        navigate={navigate}
                        onTabChange={handleRightTabChange}
                        handleViewGroupPage={handleViewGroupPage}
                        handleViewGroupPostPage={handleViewGroupPostPage}
                        handleOpenCreateGroupPost={handleOpenCreateGroupPost}
                        handleSearchClick={handleSearchClick}
                        // map props (required by CommunityRightPanel)
                        handleJoinSelectedGroup={handleJoinSelectedGroup}
                        locationLabel={locationLabel}
                        peopleYouMayKnow={peopleYouMayKnow}
                        peopleYouMayKnowLoading={peopleYouMayKnowLoading}
                        CATEGORY_META={CATEGORY_META}
                        activeTabRef={activeTabRef}
                        detailScrollRef={detailScrollRef}
                        pointsSource={pointsSource}
                        mapRef={mapRef}
                        center={center}
                        zoomLevel={zoomLevel}
                        onMarkerClick={handleMarkerClick}
                        hoveredId={hoveredId}
                        openedPopupId={openedPopupId}
                        popupContentById={popupContentById}
                        posts={filteredPosts}
                        onPopupClose={handlePopupClose}
                        isLoading={isLoading}
                        selectedPost={selectedPost}
                        selectedGroup={selectedGroup}
                        groupPosts={groupPosts}
                        groupPostsLoading={groupPostsLoading}
                        groupPostsError={groupPostsError}
                        selectedGroupPostDetail={selectedGroupPostDetail}
                        setSelectedGroupPostId={setSelectedGroupPostId}
                        setSelectedGroup={setSelectedGroup}
                        setSelectedPost={setSelectedPost}
                        setOpenedPopupId={setOpenedPopupId}
                        setDetailExpanded={setDetailExpanded}
                        setActiveTabSafe={setActiveTabSafe}
                        setShowFullGroupDescription={setShowFullGroupDescription}
                        showFullGroupDescription={showFullGroupDescription}
                        defaultGroups={defaultGroups}
                        groupIcon={groupIcon}
                        postsIcon={postsIcon}
                        user={user}
                        handleGroupPostUserClick={handleGroupPostUserClick}
                    />
                )}
            </Box>

            {/* ── Mobile detail drawer (slides from right, full width, free-flowing content) ── */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileDetailOpen}
                    onClose={() => setMobileDetailOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                    transitionDuration={{ enter: 280, exit: 220 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            // Fullscreen — cover the bottom nav bar
                            pb: 0,
                            height: '100%',
                            top: 0,
                        },
                    }}
                >
                    {/* Sticky header bar with back button */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: (t) => alphaColor(t.palette.background.paper, 0.85),
                            backdropFilter: 'saturate(140%) blur(10px)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            // Note: safe-area top inset is already applied by
                            // SwipeableRightDrawer's Paper (default behavior),
                            // so we do NOT add it again here — that produces
                            // a doubled gap above the back button.
                        }}
                    >
                        <IconButton onClick={() => setMobileDetailOpen(false)} size="small" sx={{ mr: 0.5 }}>
                            <ArrowBackRoundedIcon />
                        </IconButton>
                    </Box>

                    {/* Content area — free-flowing, no container boxes */}
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
                        {/* Post detail: render PostDetailModal directly for cleaner mobile experience */}
                        {mobileDrawerMode === 'post' && selectedPost ? (
                            <PostDetailModal
                                user={user}
                                embedded
                                post={selectedPost}
                                initialPhotoIndex={selectedPostInitialPhoto}
                            />
                        ) : null}

                        {/* News article detail — shown when in news mode with a selected article */}
                        {isNewsView && selectedNewsArticle ? (
                            <CommunityNewsDetailPanel
                                article={selectedNewsArticle}
                                showBackButton={false}
                                onBack={() => setMobileDetailOpen(false)}
                            />
                        ) : null}
                    </Box>
                </SwipeableRightDrawer>
            )}

            {/* ── Mobile map — fullscreen with back bar ── */}
            {isMobile && (
                <SwipeableBottomDrawer
                    open={mobileMapOpen}
                    onClose={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); setSelectedPost(null); setOpenedPopupId(null); setMobileDetailOpen(false); }}
                    transitionDuration={{ enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            // Truly fullscreen — cover the bottom nav bar
                            height: '100dvh',
                            '@supports not (height: 1dvh)': {
                                height: '100vh',
                            },
                            borderRadius: 0,
                            overflow: 'hidden',
                            bottom: 0,
                            // Ensure it layers above the bottom nav
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
                            borderBottom: activeMapFilterChips.length > 0 ? 'none' : '1px solid',
                            borderColor: alphaColor(t.palette.divider, 0.1),
                            bgcolor: t.palette.background.paper,
                            flexShrink: 0,
                        })}
                    >
                        <IconButton
                            onClick={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); setSelectedPost(null); setOpenedPopupId(null); setMobileDetailOpen(false); }}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36 }}
                        >
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                            Community Map
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
                                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: alphaColor(t.palette.primary.main, 0.16),
                                },
                            })}
                        >
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {/* ── Active filter chips (removable, showing what's selected) ── */}
                    {activeMapFilterChips.length > 0 && (
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
                                borderColor: alphaColor(t.palette.divider, 0.1),
                                '&::-webkit-scrollbar': { display: 'none' },
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            })}
                        >
                            {activeMapFilterChips.map((chip) => (
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
                                        bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: '1px solid',
                                        borderColor: alphaColor(t.palette.primary.main, 0.2),
                                        '& .MuiChip-label': {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                        '& .MuiChip-deleteIcon': {
                                            color: alphaColor(t.palette.primary.main, 0.5),
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
                        <CommunityRightPanel
                            rightWidth="100%"
                            isGroupsView={isGroupsView}
                            activeTab="map"
                            rightTabs={rightTabs}
                            hideTabs
                            HEADER_H={HEADER_H}
                            navigate={navigate}
                            onTabChange={() => {}}
                            handleViewGroupPage={handleViewGroupPage}
                            handleViewGroupPostPage={handleViewGroupPostPage}
                            handleOpenCreateGroupPost={handleOpenCreateGroupPost}
                            handleSearchClick={handleSearchClick}
                            handleJoinSelectedGroup={handleJoinSelectedGroup}
                            locationLabel={locationLabel}
                            peopleYouMayKnow={peopleYouMayKnow}
                            peopleYouMayKnowLoading={peopleYouMayKnowLoading}
                            CATEGORY_META={CATEGORY_META}
                            activeTabRef={activeTabRef}
                            detailScrollRef={detailScrollRef}
                            pointsSource={pointsSource}
                            mapRef={mapRef}
                            center={center}
                            zoomLevel={zoomLevel}
                            onMarkerClick={(id, latLng) => {
                                handleMarkerClick(id, latLng);
                                // Show popup card on the map instead of navigating away
                                if (id != null) {
                                    setOpenedPopupId(String(id));
                                    void ensurePopupPostLoaded(String(id));
                                }
                            }}
                            hoveredId={hoveredId}
                            openedPopupId={openedPopupId}
                            popupContentById={popupContentById}
                            posts={filteredPosts}
                            onPopupClose={handlePopupClose}
                            isLoading={isLoading}
                            selectedPost={selectedPost}
                            selectedGroup={selectedGroup}
                            groupPosts={groupPosts}
                            groupPostsLoading={groupPostsLoading}
                            groupPostsError={groupPostsError}
                            selectedGroupPostDetail={selectedGroupPostDetail}
                            setSelectedGroupPostId={setSelectedGroupPostId}
                            setSelectedGroup={setSelectedGroup}
                            setSelectedPost={setSelectedPost}
                            setOpenedPopupId={setOpenedPopupId}
                            setDetailExpanded={setDetailExpanded}
                            setActiveTabSafe={setActiveTabSafe}
                            setShowFullGroupDescription={setShowFullGroupDescription}
                            showFullGroupDescription={showFullGroupDescription}
                            defaultGroups={defaultGroups}
                            groupIcon={groupIcon}
                            postsIcon={postsIcon}
                            user={user}
                            handleGroupPostUserClick={handleGroupPostUserClick}
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
                            <TuneRoundedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
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

                        {/* Filter content — reuses CommunityFilter */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                p: 1.5,
                            }}
                        >
                            <CommunityFilter
                                mode={isGroupsView ? 'groups' : 'posts'}
                                view={view}
                                selectedView={view}
                                onViewChange={(val) => {
                                    const nextView = String(val || 'all').trim().toLowerCase() || 'all';
                                    dispatch({ type: 'view', value: nextView });
                                    if (nextView === 'trending') {
                                        dispatch({ type: 'dateRange', value: 'all' });
                                        dispatch({ type: 'sort', value: 'trending' });
                                        dispatch({ type: 'search', value: '' });
                                        dispatch({ type: 'appliedSearch', value: '' });
                                    } else if (sort === 'trending') {
                                        dispatch({ type: 'sort', value: isGroupsView ? 'random' : 'newest' });
                                    }
                                    handleSearchClick('auto');
                                }}
                                searchTerm={search}
                                onSearchTermChange={(val) => {
                                    dispatch({ type: 'search', value: val });
                                }}
                                onSearchClick={(mode, term) => {
                                    handleSearchClick(mode, term);
                                    if (mode === 'manual') setMobileMapFilterOpen(false);
                                }}
                                onClearClick={() => {
                                    dispatch({ type: 'search', value: '' });
                                    dispatch({ type: 'appliedSearch', value: '' });
                                    dispatch({ type: 'subtype', value: '' });
                                    dispatch({ type: 'dateRange', value: 'all' });
                                    dispatch({ type: 'view', value: 'all' });
                                    dispatch({ type: 'sort', value: 'newest' });
                                    dispatch({ type: 'radius', value: STATEWIDE });
                                    handleSearchClick('manual', '');
                                }}
                                filteredCities={availableCities}
                                filteredCounties={availableCounties}
                                selectedCity={selectedCity}
                                onCityChange={(val) => {
                                    dispatch({ type: 'city', value: val });
                                    if (val) dispatch({ type: 'county', value: cityToCounty[val] || '' });
                                    handleSearchClick('auto');
                                }}
                                selectedCounty={selectedCounty}
                                onCountyChange={(val) => {
                                    dispatch({ type: 'county', value: val });
                                    if (!val) {
                                        dispatch({ type: 'city', value: '' });
                                        dispatch({ type: 'radius', value: STATEWIDE });
                                    } else {
                                        dispatch({ type: 'radius', value: DEFAULT_RADIUS_WHEN_COUNTY_SELECTED });
                                    }
                                    handleSearchClick('auto');
                                }}
                                selectedRadius={selectedRadius}
                                onRadiusChange={(val) => {
                                    dispatch({ type: 'radius', value: val });
                                    handleSearchClick('auto');
                                }}
                                selectedSubtype={subtype}
                                subtypes={categories}
                                postCategoryCounts={postCategoryCounts}
                                locationCounts={communityLocationCounts}
                                onSubtypeChange={(val) => {
                                    dispatch({ type: 'subtype', value: val });
                                    handleSearchClick('auto');
                                }}
                                selectedSort={sort}
                                sortOptions={isGroupsView ? GROUPS_SORT_OPTIONS : POSTS_SORT_OPTIONS}
                                onSortChange={(val) => {
                                    const nextSort = String(val || 'random').trim().toLowerCase();
                                    dispatch({ type: 'sort', value: nextSort });
                                    if (nextSort === 'random') setRandomSeed(String(Date.now()));
                                    handleSearchClick('auto');
                                }}
                                selectedDateRange={dateRange}
                                dateRangeOptions={isGroupsView ? EMPTY_ARRAY : POSTS_DATE_RANGE_OPTIONS}
                                onDateRangeChange={(val) => {
                                    dispatch({ type: 'dateRange', value: val });
                                    handleSearchClick('auto');
                                }}
                                showAdvancedFilters
                                forceVerticalLocation
                            />
                        </Box>

                        {/* Apply / Done button at bottom */}
                        <Box
                            sx={(t) => ({
                                px: 2,
                                py: 1.5,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                flexShrink: 0,
                                bgcolor: t.palette.background.paper,
                            })}
                        >
                            <Button
                                variant="contained"
                                fullWidth
                                disableElevation
                                onClick={() => {
                                    handleSearchClick('manual', search);
                                    setMobileMapFilterOpen(false);
                                }}
                                sx={{
                                    borderRadius: 999,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    fontSize: 15,
                                    py: 1.25,
                                }}
                            >
                                Apply Filters
                            </Button>
                        </Box>
                    </Drawer>
                </SwipeableBottomDrawer>
            )}

            <CommunityOverlays
                userAnchor={userAnchor}
                closeUserCard={closeUserCard}
                userForCard={userForCard}
                isSelfForCard={isSelfForCard}
                isFollowingForCard={isFollowingForCard}
                handleFollow={handleFollow}
                handleViewProfile={handleViewProfile}
                stepOneOpen={stepOneOpen}
                stepTwoOpen={stepTwoOpen}
                stepOneData={stepOneData}
                setStepOneOpen={setStepOneOpen}
                setStepTwoOpen={setStepTwoOpen}
                setStepOneData={setStepOneData}
                handleCategoryChosen={handleCategoryChosen}
                refetch={(...args) => { recordPost(); refetch(...args); window.dispatchEvent(new CustomEvent('ll:communityPost:created')); }}
                categories={categories}
                isCreateGroupOpen={isCreateGroupOpen}
                setIsCreateGroupOpen={setIsCreateGroupOpen}
                handleCreateGroup={handleCreateGroup}
                selectedCounty={selectedCounty}
                selectedCity={selectedCity}
                isCreateGroupPostOpen={isCreateGroupPostOpen}
                setIsCreateGroupPostOpen={setIsCreateGroupPostOpen}
                selectedGroup={selectedGroup}
                handleGroupPostCreated={handleGroupPostCreated}
            />

            {/* Switch account dialog (replaces window.alert for non-personal accounts) */}
            <Dialog
                open={switchAccountDialog.open}
                onClose={() => setSwitchAccountDialog({ open: false, message: '' })}
                maxWidth="xs"
                fullWidth
                disableScrollLock
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        fontWeight: 900,
                        fontSize: 17,
                        pr: 1.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SwapHorizRoundedIcon sx={{ color: 'primary.main' }} />
                        Switch Account
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setSwitchAccountDialog({ open: false, message: '' })}
                        aria-label="Close"
                        sx={{ width: 32, height: 32 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {switchAccountDialog.message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
                    <Button
                        variant="contained"
                        onClick={() => setSwitchAccountDialog({ open: false, message: '' })}
                        disableElevation
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 3,
                        }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Rate limit dialog ── */}
            <RateLimitDialog
                open={rateLimitOpen}
                onClose={() => setRateLimitOpen(false)}
                retryAfterSec={rateLimitInfo.retryAfterSec}
                reason={rateLimitInfo.reason}
                actionLabel={rateLimitInfo.actionLabel}
            />

            {/* ── Success confirmation snackbar ── */}
            <SuccessSnackbar {...successSnackbarProps} />

            {/* ── Group page fullscreen slide-in overlay ── */}
            {isMobile ? (
                <SwipeableRightDrawer
                    open={groupPageOpen}
                    onClose={closeGroupPage}
                    onOpen={() => {}}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                    transitionDuration={{ enter: 280, exit: 220 }}
                    sx={{ zIndex: 1200 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            bgcolor: 'background.default',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            top: 0,
                            overflow: 'hidden',
                        },
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            overflow: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'contain',
                        }}
                    >
                        {groupPageUsername && <GroupPage groupUsername={groupPageUsername} onClose={closeGroupPage} />}
                    </Box>
                </SwipeableRightDrawer>
            ) : (
                <Dialog
                    open={groupPageOpen}
                    onClose={closeGroupPage}
                    fullScreen
                    TransitionComponent={Slide}
                    TransitionProps={{ direction: 'left' }}
                    sx={{ zIndex: 1200 }}
                    PaperProps={{
                        sx: {
                            bgcolor: 'background.default',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        },
                    }}
                >
                    <Box sx={{ flex: 1, overflow: 'auto' }}>
                        {groupPageUsername && <GroupPage groupUsername={groupPageUsername} onClose={closeGroupPage} />}
                    </Box>
                </Dialog>
            )}

        </Box>
    );
}