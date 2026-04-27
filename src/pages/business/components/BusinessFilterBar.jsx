// src/pages/business/components/BusinessFilterBar.jsx
//
// BusinessFilterBar
// -----------------
// Filter bar for the Business directory.
// - Search: debounced text input searching business name, about, etc.
// - View: All / Following (both tabs)
// - Category: with counts and icons
// - Post Type: when in Business Posts tab
// - Sort: with icon in renderValue
// - Date Posted: with icon in renderValue (posts tab)
// - County / City: uses shared CityCountySelect component
//
// Layout matches ServicesFilters: flex-wrap on ALL breakpoints so filters
// gracefully wrap to new rows instead of colliding.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box,
    FormControl,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Typography,
    CircularProgress,
    Collapse,
    Chip,
    Stack,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';

import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';

import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import UpdateRoundedIcon from '@mui/icons-material/UpdateRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StorefrontIcon from '@mui/icons-material/Storefront';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import YardIcon from '@mui/icons-material/Yard';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SchoolIcon from '@mui/icons-material/School';
import PetsIcon from '@mui/icons-material/Pets';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BuildIcon from '@mui/icons-material/Build';
import CategoryIcon from '@mui/icons-material/Category';

import CityCountySelect from '../../../components/CityCountySelect';
import SavedFiltersMenu from '../../community/SavedFiltersMenu';
import useSavedFilters from '../../community/useSavedFilters';
import { fetchBusinessCategories } from '../api/businessApi';
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    RADIUS_VALUE_WHEN_NO_COUNTY,
} from '../../../utils/geoRadius';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';

// ── CONSTANTS: defined OUTSIDE the component to avoid re-creation on every render ──
// This prevents the infinite-loop bug (Maximum update depth exceeded).

const VIEW_OPTIONS = [
    { value: 'all', label: 'All', icon: VisibilityRoundedIcon },
    { value: 'following', label: 'Following', icon: PeopleOutlineRoundedIcon },
];

const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All time', icon: ListAltRoundedIcon },
    { value: 'today', label: 'Today', icon: UpdateRoundedIcon },
    { value: 'week', label: 'This week', icon: UpdateRoundedIcon },
    { value: 'month', label: 'This month', icon: UpdateRoundedIcon },
];

const POST_TYPE_OPTIONS = [
    { value: '', label: 'All Types', icon: ListAltRoundedIcon },
    { value: 'announcement', label: 'Announcements', icon: CampaignRoundedIcon },
    { value: 'deal', label: 'Deals', icon: LocalOfferRoundedIcon },
    { value: 'update', label: 'Updates', icon: UpdateRoundedIcon },
];

const ALL_COUNTIES_LABEL = 'All Counties';
const ALL_CITIES_LABEL = 'All Cities';

const ENTITY_TYPE_OPTIONS = [
    { value: '', label: 'All', icon: ListAltRoundedIcon },
    { value: 'business', label: 'Business', icon: StorefrontRoundedIcon },
    { value: 'organization', label: 'Organization', icon: GroupsRoundedIcon },
    { value: 'nonprofit', label: 'Nonprofit', icon: VolunteerActivismIcon },
];

// ── Stable default prop values (MUST be outside the component) ──
const EMPTY_SX = {};
const EMPTY_SORT_OPTIONS = [];

const safeStr = (v) => String(v ?? '').trim();

const formatCount = (num) => {
    const n = Number(num) || 0;
    if (n < 10000) return String(n);
    if (n < 1000000) {
        const k = Math.round(n / 1000);
        return `${k}k`;
    }
    const m = n / 1000000;
    if (m >= 10) return `${Math.round(m)}M`;
    return `${m.toFixed(1).replace(/\.0$/, '')}M`;
};

const BUSINESS_CATEGORY_ICON = {
    food_drink: RestaurantIcon,
    shopping_retail: StorefrontIcon,
    automotive: DirectionsCarIcon,
    home_services: HomeRepairServiceIcon,
    home_garden: YardIcon,
    health_wellness: MedicalServicesIcon,
    beauty_personal_care: ContentCutIcon,
    fitness_recreation: FitnessCenterIcon,
    professional_services: BusinessCenterIcon,
    education_childcare: SchoolIcon,
    pets_animals: PetsIcon,
    travel_lodging: TravelExploreIcon,
    arts_entertainment: TheaterComedyIcon,
    community_nonprofit: VolunteerActivismIcon,
    technology_repair: BuildIcon,
    other: CategoryIcon,
};

// All categories — must match CATEGORY_OPTIONS in BusinessAdminPage so every
// category always appears in the filter dropdown (with a 0 count when empty).
const ALL_CATEGORIES = [
    { key: 'food_drink', label: 'Food & Drink' },
    { key: 'shopping_retail', label: 'Shopping & Retail' },
    { key: 'automotive', label: 'Automotive' },
    { key: 'home_services', label: 'Home Services' },
    { key: 'home_garden', label: 'Home & Garden' },
    { key: 'health_wellness', label: 'Health & Wellness' },
    { key: 'beauty_personal_care', label: 'Beauty & Personal Care' },
    { key: 'fitness_recreation', label: 'Fitness & Recreation' },
    { key: 'professional_services', label: 'Professional Services' },
    { key: 'education_childcare', label: 'Education & Childcare' },
    { key: 'pets_animals', label: 'Pets & Animals' },
    { key: 'travel_lodging', label: 'Travel & Lodging' },
    { key: 'arts_entertainment', label: 'Arts & Entertainment' },
    { key: 'community_nonprofit', label: 'Community & Nonprofit' },
    { key: 'technology_repair', label: 'Technology & Repair' },
    { key: 'other', label: 'Other' },
];

// ── Stable style constants: defined OUTSIDE the component (frozen) to avoid
// re-creation on every render. Uses MUI callback-sx `(theme) => …` so no
// useTheme() / useMemo is needed — MUI caches the result internally.
// This matches the CommunityFilter pattern and prevents the "flash" on
// dropdown selection that useMemo-based sx objects can cause.

const sharedMenuProps = Object.freeze({
    disableScrollLock: true,
    disablePortal: false,
    style: { zIndex: 1400 },
    PaperProps: {
        sx: (t) => ({
            mt: 0.75,
            borderRadius: 2.5,
            overflow: 'auto',
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            maxHeight: 340,
            '& .MuiMenuItem-root': {
                minHeight: 42,
                fontSize: '0.875rem',
                fontWeight: 600,
            },
            [t.breakpoints.down('md')]: {
                position: 'fixed',
                top: '0 !important',
                left: '0 !important',
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                height: '100%',
                borderRadius: 0,
                border: 'none',
                mt: 0,
                boxShadow: 'none',
                '& .MuiMenuItem-root': {
                    minHeight: 48,
                    fontSize: '1rem',
                    fontWeight: 600,
                },
            },
        }),
    },
});

const selectSx = Object.freeze({
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40,
        overflow: 'hidden',
        '& fieldset': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.14),
        },
        '&:hover fieldset': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.28 : 0.22),
        },
        '&.Mui-focused fieldset': {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    '& .MuiInputLabel-root': {
        color: 'text.secondary',
        fontWeight: 600,
        fontSize: '0.875rem',
    },
    '& .MuiSelect-select': {
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 'unset',
        minWidth: 0,
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
});

const STABLE_IDS = {
    viewLabelId: 'll-biz-filter-view-label',
    viewSelectId: 'll-biz-filter-view-select',
    catLabelId: 'll-biz-filter-category-label',
    catSelectId: 'll-biz-filter-category-select',
    postTypeLabelId: 'll-biz-filter-posttype-label',
    postTypeSelectId: 'll-biz-filter-posttype-select',
    sortLabelId: 'll-biz-filter-sort-label',
    sortSelectId: 'll-biz-filter-sort-select',
    dateRangeLabelId: 'll-biz-filter-date-range-label',
    dateRangeSelectId: 'll-biz-filter-date-range-select',
    entityTypeLabelId: 'll-biz-filter-entity-type-label',
    entityTypeSelectId: 'll-biz-filter-entity-type-select',
};

// ── Session filter persistence ──
// Keeps filter selections in sessionStorage so navigating away and back
// restores the user's last-used filters instead of resetting to defaults.
const BIZ_FILTER_KEY = 'll-biz-filter-state';
const FILTER_FIELDS = ['categoryKey', 'view', 'county', 'city', 'radius', 'entityType', 'postType', 'dateRange', 'businessSort', 'postSort'];

export function clearSavedBusinessFilters() {
    try { sessionStorage.removeItem(BIZ_FILTER_KEY); } catch { /* */ }
}

/** Load saved filter state — call from parent's useState initializer for zero-cost restore */
export function loadSavedBusinessFilters() {
    try {
        const raw = sessionStorage.getItem(BIZ_FILTER_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        const out = {};
        for (const k of FILTER_FIELDS) {
            const v = safeStr(parsed[k]);
            if (v) out[k] = v;
        }
        return Object.keys(out).length ? out : null;
    } catch { return null; }
}

function saveFilterState(val) {
    try {
        const slim = {};
        for (const k of FILTER_FIELDS) {
            const v = safeStr(val?.[k]);
            if (v) slim[k] = v;
        }
        if (Object.keys(slim).length) {
            sessionStorage.setItem(BIZ_FILTER_KEY, JSON.stringify(slim));
        } else {
            sessionStorage.removeItem(BIZ_FILTER_KEY);
        }
    } catch { /* storage full / private mode */ }
}

export default function BusinessFilterBar({
                                              value,
                                              onChange,
                                              disabled = false,
                                              sx = EMPTY_SX,
                                              showPostTypeFilter = false,
                                              sortValue = 'any',
                                              sortOptions = EMPTY_SORT_OPTIONS,
                                              dateRangeValue = 'all',
                                              categoryCountsOverride = null,
                                              totalCountOverride = null,
                                              countsLoadingOverride = false,
                                              locationCounts = null,
                                              /* saved filters (slice 3) */
                                              viewer = null,
                                              searchQuery = '',
                                              onSearchQueryChange = null,
                                              showSavedFilters = true,
                                              /* reset-all handler — called by the in-bar reset icon */
                                              onClearAll = null,
                                          }) {

    const categoryKey = safeStr(value?.categoryKey || '');
    const postType = safeStr(value?.postType || '');
    const viewValue = safeStr(value?.view || 'all');
    const countyValue = safeStr(value?.county || '');
    const cityValue = safeStr(value?.city || '');
    const radiusValue = safeStr(value?.radius || RADIUS_VALUE_WHEN_NO_COUNTY);

    const countyValueForUi = countyValue || ALL_COUNTIES_LABEL;
    const cityValueForUi = cityValue || ALL_CITIES_LABEL;

    const [loadingCats, setLoadingCats] = useState(false);
    const [, setCatsError] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        let alive = true;
        setLoadingCats(true);
        setCatsError('');

        fetchBusinessCategories()
            .then((data) => {
                if (!alive) return;
                const apiCats = Array.isArray(data?.categories) ? data.categories : [];
                // Merge: use ALL_CATEGORIES as the base so every category always
                // appears, but prefer API-provided labels when available.
                const apiMap = new Map(apiCats.map((c) => [String(c?.key), c]));
                const merged = ALL_CATEGORIES.map((base) => apiMap.get(base.key) || base);
                // Append any API-only categories not in the hardcoded list
                apiCats.forEach((c) => {
                    if (!ALL_CATEGORIES.some((b) => b.key === String(c?.key))) {
                        merged.push(c);
                    }
                });
                setCategories(merged);
            })
            .catch((e) => {
                if (!alive) return;
                // On failure, still show the full list so the dropdown isn't empty
                setCategories(ALL_CATEGORIES);
                setCatsError(String(e?.message || 'Failed to load categories.'));
            })
            .finally(() => {
                if (!alive) return;
                setLoadingCats(false);
            });

        return () => { alive = false; };
    }, []);

    const overrideCounts = categoryCountsOverride && typeof categoryCountsOverride === 'object' ? categoryCountsOverride : null;
    const overrideTotal = Number(totalCountOverride);
    const hasOverrideTotal = Number.isFinite(overrideTotal) && overrideTotal >= 0;
    const effectiveCounts = overrideCounts || {};
    const effectiveTotal = hasOverrideTotal ? overrideTotal : 0;
    const countsLoading = Boolean(countsLoadingOverride);

    const getCategoryCount = (key) => {
        const k = safeStr(key);
        const raw = effectiveCounts && typeof effectiveCounts === 'object' ? effectiveCounts[k] : 0;
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0;
    };

    const categoryLabel = useMemo(() => {
        if (!categoryKey) return 'All Categories';
        const c = (Array.isArray(categories) ? categories : []).find((x) => String(x?.key) === categoryKey);
        return c?.label || 'Category';
    }, [categories, categoryKey]);

    const pendingRef = useRef(null);
    const flushRef = useRef(null);

    const setPatch = (patch) => {
        const base = pendingRef.current ?? value;
        const merged = { ...base, ...patch };
        pendingRef.current = merged;

        if (!flushRef.current) {
            flushRef.current = Promise.resolve().then(() => {
                const final = pendingRef.current;
                pendingRef.current = null;
                flushRef.current = null;
                saveFilterState(final);
                onChange?.(final);
            });
        }
    };

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    //
    // On mobile the field grid stays expanded (matches today's behavior).
    // On desktop the grid starts collapsed; users see a compact row with a
    // "Filters" toggle button, active-filter chips, and a reset icon.
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [userExpanded, setUserExpanded] = useState(null);

    const fieldsExpanded = useMemo(() => {
        if (!isDesktop) return true;                  // mobile: always open
        if (userExpanded !== null) return userExpanded;
        return false;                                 // desktop default: collapsed
    }, [isDesktop, userExpanded]);

    // Active (non-default) filter chips
    const activeFilterChips = useMemo(() => {
        const chips = [];

        // View — default 'all'
        if (viewValue && viewValue !== 'all') {
            const opt = VIEW_OPTIONS.find((o) => o.value === viewValue);
            if (opt) {
                chips.push({
                    key: 'view',
                    label: `View: ${opt.label}`,
                    onClear: () => setPatch({ view: 'all' }),
                });
            }
        }

        // Category
        if (categoryKey) {
            const cat = (Array.isArray(categories) ? categories : []).find((c) => String(c?.key) === String(categoryKey));
            const label = cat?.label || categoryKey;
            chips.push({
                key: 'category',
                label: `Category: ${label}`,
                onClear: () => setPatch({ categoryKey: '' }),
            });
        }

        // Post type (posts tab only)
        if (showPostTypeFilter && postType) {
            const opt = POST_TYPE_OPTIONS.find((o) => o.value === postType);
            if (opt) {
                chips.push({
                    key: 'post-type',
                    label: `Type: ${opt.label}`,
                    onClear: () => setPatch({ postType: '' }),
                });
            }
        }

        // Entity type
        const entityType = safeStr(value?.entityType || '');
        if (entityType) {
            const opt = ENTITY_TYPE_OPTIONS.find((o) => o.value === entityType);
            if (opt) {
                chips.push({
                    key: 'entity-type',
                    label: `Entity: ${opt.label}`,
                    onClear: () => setPatch({ entityType: '' }),
                });
            }
        }

        // County
        if (countyValue) {
            chips.push({
                key: 'county',
                label: `County: ${countyValue}`,
                onClear: () => setPatch({ county: '', city: '' }),
            });
        }

        // City
        if (cityValue) {
            chips.push({
                key: 'city',
                label: `City: ${cityValue}`,
                onClear: () => setPatch({ city: '' }),
            });
        }

        // Radius — only when county is set and non-default
        if (countyValue && radiusValue && String(radiusValue) !== String(RADIUS_VALUE_WHEN_NO_COUNTY) && String(radiusValue) !== '0') {
            const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(radiusValue));
            if (opt) {
                chips.push({
                    key: 'radius',
                    label: `Radius: ${opt.label}`,
                    onClear: () => setPatch({ radius: RADIUS_VALUE_WHEN_NO_COUNTY }),
                });
            }
        }

        // Sort — default 'any' (businessSort) or 'newest' (postSort)
        const sortField = showPostTypeFilter ? 'postSort' : 'businessSort';
        const sortDefault = showPostTypeFilter ? 'newest' : 'any';
        const currentSort = safeStr(value?.[sortField]) || sortDefault;
        if (currentSort && currentSort !== sortDefault) {
            const opt = (Array.isArray(sortOptions) ? sortOptions : []).find((o) => o.value === currentSort);
            if (opt) {
                chips.push({
                    key: 'sort',
                    label: `Sort: ${opt.label}`,
                    onClear: () => setPatch({ [sortField]: sortDefault }),
                });
            }
        }

        // Date range — default 'all'
        const currentDateRange = safeStr(value?.dateRange) || 'all';
        if (currentDateRange && currentDateRange !== 'all') {
            const opt = DATE_RANGE_OPTIONS.find((o) => o.value === currentDateRange);
            if (opt) {
                chips.push({
                    key: 'date',
                    label: `Date: ${opt.label}`,
                    onClear: () => setPatch({ dateRange: 'all' }),
                });
            }
        }

        return chips;
        // setPatch is intentionally not a dependency — it's a stable closure
        // over refs + props, and rerunning this memo when a click handler
        // fires isn't desirable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        viewValue, categoryKey, categories, postType, showPostTypeFilter,
        countyValue, cityValue, radiusValue,
        value, sortOptions,
    ]);

    const renderCountPill = (count) => {
        const isLoaded = Number.isFinite(count);
        return (
            <Typography
                component="span"
                sx={(t) => ({
                    ml: 'auto',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    visibility: isLoaded ? 'visible' : 'hidden',
                    color: count > 0 ? 'primary.main' : 'text.secondary',
                    bgcolor: count > 0 ? alpha(t.palette.primary.main, 0.1) : 'action.hover',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    minWidth: 28,
                    textAlign: 'center',
                    lineHeight: 1.4,
                })}
            >
                {isLoaded ? count : '\u200B'}
            </Typography>
        );
    };

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Snapshot of the current filter state. Keys MUST match the backend
    // service's ALLOWED_KEYS.business schema — unknown keys are silently
    // stripped, so a typo here = a field that appears to save but is
    // actually dropped on write.
    //
    // We capture BOTH sorts (postSort + businessSort) because the Business
    // Hub shares one `value` across the Posts and Businesses sub-tabs, and
    // the user expects switching sub-tabs after applying a saved filter to
    // show the sort they had there.
    const currentFilterPayload = useMemo(() => ({
        view:         viewValue || 'all',
        categoryKey:  categoryKey,
        postType:     safeStr(value?.postType || ''),
        entityType:   safeStr(value?.entityType || ''),
        postSort:     safeStr(value?.postSort || 'newest'),
        businessSort: safeStr(value?.businessSort || 'any'),
        dateRange:    safeStr(value?.dateRange || dateRangeValue || 'all'),
        city:         cityValue,
        county:       countyValue,
        radius:       radiusValue,
        search:       String(searchQuery || '').trim(),
    }), [
        viewValue, categoryKey, value, dateRangeValue,
        cityValue, countyValue, radiusValue, searchQuery,
    ]);

    // Apply a saved filter. We build one merged patch and fire a single
    // setPatch — this coalesces into one onChange call to the parent
    // (BusinessHubPage), which then does its own fetch. Search goes
    // through its own callback since it's tracked separately from `value`.
    const handleApplySavedFilter = useCallback((filter) => {
        // Accept either `payload` or `payload_json` — defensive against
        // backend shape variations.
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        // Build the merged patch. We coerce missing keys to sensible
        // empties so applying a filter that was saved without a county
        // actually clears the current county (otherwise `'county' in payload`
        // being false would leave the stale value in place).
        const patch = {
            view:         'view' in payload ? (payload.view || 'all') : (viewValue || 'all'),
            categoryKey:  'categoryKey' in payload ? (payload.categoryKey || '') : categoryKey,
            postType:     'postType' in payload ? (payload.postType || '') : safeStr(value?.postType || ''),
            entityType:   'entityType' in payload ? (payload.entityType || '') : safeStr(value?.entityType || ''),
            postSort:     'postSort' in payload ? (payload.postSort || 'newest') : safeStr(value?.postSort || 'newest'),
            businessSort: 'businessSort' in payload ? (payload.businessSort || 'any') : safeStr(value?.businessSort || 'any'),
            dateRange:    'dateRange' in payload ? (payload.dateRange || 'all') : safeStr(value?.dateRange || 'all'),
            city:         'city' in payload ? (payload.city || '') : cityValue,
            county:       'county' in payload ? (payload.county || '') : countyValue,
            radius:       'radius' in payload ? payload.radius : radiusValue,
        };
        setPatch(patch);

        // Search is tracked outside `value` on the Business Hub, so route
        // it through its own callback. If the saved filter didn't include
        // a search term, leave the user's current search alone.
        if ('search' in payload && typeof onSearchQueryChange === 'function') {
            onSearchQueryChange(String(payload.search || ''));
        }
    }, [
        viewValue, categoryKey, cityValue, countyValue, radiusValue,
        value, onSearchQueryChange,
    ]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    // Pull the default filter for the `business` tab. Used only for
    // auto-apply — the SavedFiltersMenu component below has its own
    // useSavedFilters call for the dropdown's full list. Two small GETs
    // is fine; if it becomes a perf issue, lift to a shared context.
    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'business',
        viewer: viewer || null,
    });

    // "First load only" — flip permanently the first time auto-apply fires,
    // regardless of later tab switches or remounts within the session.
    const autoAppliedRef = useRef(false);

    // Capture URL filter params ONCE at mount (during render, via lazy ref).
    // By the time the default filter loads, the app may have synced its
    // state to the URL, so reading window.location.search later would
    // give a false positive.
    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'search', 'q', 'view', 'category', 'categoryKey', 'postType',
            'entityType', 'sort', 'postSort', 'businessSort', 'dateRange',
            'city', 'county', 'counties', 'radius',
        ];
        let has = false;
        try {
            if (typeof window !== 'undefined' && window.location?.search) {
                const sp = new URLSearchParams(window.location.search);
                has = FILTER_URL_KEYS.some((k) => sp.has(k));
            }
        } catch { /* treat as no-filters */ }
        hadUrlFiltersOnLoadRef.current = has;
    }

    useEffect(() => {
        if (autoAppliedRef.current) return;           // already fired — never again
        if (!savedDefaultFilter) return;              // no default set, or still loading
        if (hadUrlFiltersOnLoadRef.current) {         // URL had explicit filters — respect them
            autoAppliedRef.current = true;            // but still lock out future auto-apply
            return;
        }
        autoAppliedRef.current = true;
        handleApplySavedFilter(savedDefaultFilter);
    }, [savedDefaultFilter, handleApplySavedFilter]);

    return (
        <Box
            sx={(t) => ({
                p: isDesktop ? { xs: 1, md: 0.75 } : { xs: 1, md: 1.25 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.12),
                bgcolor: alpha(t.palette.background.paper, 0.62),
                backdropFilter: 'saturate(140%) blur(10px)',
                backgroundImage: 'none',
                boxShadow: t.custom.shadows.md,
                overflow: 'visible',
                position: 'relative',
                zIndex: 2,
                ...sx,
            })}
        >
            {/*
             * Desktop-only compact row: "Filters" dropdown button + active
             * filter chips + reset icon. On mobile, the field grid shows
             * directly below (no toggle needed).
             */}
            {isDesktop && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                    }}
                >
                    <Button
                        size="small"
                        variant={fieldsExpanded ? 'contained' : 'outlined'}
                        color="primary"
                        startIcon={<TuneRoundedIcon />}
                        endIcon={fieldsExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                        onClick={() => setUserExpanded(!fieldsExpanded)}
                        disabled={disabled}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 999,
                            flexShrink: 0,
                            px: 1.75,
                            height: 34,
                        }}
                    >
                        Filters
                        {activeFilterChips.length > 0 && !fieldsExpanded ? ` (${activeFilterChips.length})` : ''}
                    </Button>

                    {activeFilterChips.length > 0 && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                                flexWrap: 'wrap',
                                rowGap: 0.75,
                                alignItems: 'center',
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {activeFilterChips.map((chip) => (
                                <Chip
                                    key={chip.key}
                                    label={chip.label}
                                    size="small"
                                    onDelete={chip.onClear}
                                    sx={(t) => ({
                                        height: 28,
                                        maxWidth: 240,
                                        borderRadius: 999,
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.primary.main, 0.22),
                                        '& .MuiChip-label': {
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                        '& .MuiChip-deleteIcon': {
                                            fontSize: 16,
                                            color: alpha(t.palette.primary.main, 0.55),
                                            '&:hover': { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Stack>
                    )}

                    <Tooltip title="Clear filters" arrow>
                        <span style={{ marginLeft: 'auto' }}>
                            <IconButton
                                onClick={() => { if (typeof onClearAll === 'function') onClearAll(); }}
                                disabled={typeof onClearAll !== 'function' || activeFilterChips.length === 0 || disabled}
                                size="small"
                                aria-label="Clear filters"
                                sx={(t) => ({
                                    width: 34,
                                    height: 34,
                                    borderRadius: 999,
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.text.primary, 0.12),
                                    backgroundColor: alpha(t.palette.text.primary, 0.03),
                                    color: t.palette.text.secondary,
                                    '&:hover': {
                                        backgroundColor: alpha(t.palette.primary.main, 0.08),
                                        borderColor: alpha(t.palette.primary.main, 0.3),
                                        color: t.palette.primary.main,
                                    },
                                    '&.Mui-disabled': { opacity: 0.4 },
                                })}
                            >
                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            )}

            <Collapse in={fieldsExpanded} timeout={200} unmountOnExit>
                <Box
                    sx={(t) => ({
                        mt: isDesktop ? 1 : 0,
                        p: isDesktop ? { xs: 1.5, md: 1 } : { xs: 1.5, md: 1.3 },
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        rowGap: { xs: 2, md: 1.25 },
                        alignItems: 'center',
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                        border: isDesktop ? 'none' : '1px solid',
                        borderColor: alpha(t.palette.primary.main, 0.12),
                        borderRadius: 3,
                        bgcolor: isDesktop ? 'transparent' : alpha(t.palette.background.default, 0.9),
                        backgroundImage: isDesktop
                            ? 'none'
                            : `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.035)} 0%, ${alpha(
                                t.palette.primary.main,
                                0.01,
                            )} 100%)`,
                        boxShadow: isDesktop
                            ? 'none'
                            : `0 10px 22px ${alpha(t.palette.text.primary, 0.05)}, inset 0 0 0 1px ${alpha(
                                t.palette.primary.main,
                                0.05,
                            )}`,
                    })}
                >
                    {/* Saved filters bookmark — on mobile it takes the full row
                    and right-aligns, so it reads as a deliberate "controls"
                    row instead of floating awkwardly in the corner. On
                    desktop it sits inline with the other filter chips. */}
                    {showSavedFilters && (
                        <Box
                            sx={{
                                flex: { xs: '1 1 100%', sm: '0 0 auto' },
                                display: 'flex',
                                alignItems: 'center',
                                alignSelf: 'center',
                                justifyContent: { xs: 'flex-end', sm: 'flex-start' },
                            }}
                        >
                            <SavedFiltersMenu
                                tab="business"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {/* View dropdown (All / Following) */}
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 120px' } }}>
                        <FormControl size="small" fullWidth sx={selectSx} disabled={disabled}>
                            <InputLabel id={STABLE_IDS.viewLabelId}>View</InputLabel>
                            <Select
                                id={STABLE_IDS.viewSelectId}
                                labelId={STABLE_IDS.viewLabelId}
                                value={viewValue || 'all'}
                                label="View"
                                onChange={(e) => setPatch({ view: String(e.target.value || 'all') })}
                                MenuProps={sharedMenuProps}
                                renderValue={(selected) => {
                                    const opt = VIEW_OPTIONS.find((o) => o.value === selected) || VIEW_OPTIONS[0];
                                    const IconComp = opt.icon;
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                                            <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {VIEW_OPTIONS.map((o) => {
                                    const IconComp = o.icon;
                                    return (
                                        <MenuItem key={o.value} value={o.value}>
                                            <ListItemIcon sx={{ minWidth: 26, color: 'primary.main' }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={o.label} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Category dropdown */}
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '2 0 220px' } }}>
                        <FormControl size="small" fullWidth sx={selectSx} disabled={disabled || loadingCats}>
                            <InputLabel id={STABLE_IDS.catLabelId} shrink>Category</InputLabel>
                            <Select
                                id={STABLE_IDS.catSelectId}
                                labelId={STABLE_IDS.catLabelId}
                                value={categoryKey || ''}
                                label="Category"
                                displayEmpty
                                onChange={(e) => setPatch({ categoryKey: String(e.target.value || '') })}
                                MenuProps={sharedMenuProps}
                                renderValue={(selected) => {
                                    const sel = safeStr(selected);
                                    if (!sel) {
                                        const IconComp = StorefrontRoundedIcon;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%', overflow: 'hidden' }}>
                                                <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                    All Categories
                                                </Typography>
                                                <Box sx={{ ml: 'auto', flexShrink: 0, minWidth: 36, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    {countsLoading ? <CircularProgress size={14} /> : renderCountPill(effectiveTotal)}
                                                </Box>
                                            </Box>
                                        );
                                    }
                                    const IconComp = BUSINESS_CATEGORY_ICON[sel] || CategoryIcon;
                                    const selCount = getCategoryCount(sel);
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%', overflow: 'hidden' }}>
                                            <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                {categoryLabel}
                                            </Typography>
                                            <Box sx={{ ml: 'auto', flexShrink: 0, minWidth: 36, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                {countsLoading ? <CircularProgress size={14} /> : renderCountPill(selCount)}
                                            </Box>
                                        </Box>
                                    );
                                }}
                            >
                                <MenuItem value="">
                                    <ListItemIcon sx={{ minWidth: 30, color: 'primary.main' }}>
                                        <StorefrontRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="All Categories" />
                                    {countsLoading ? <CircularProgress size={14} /> : renderCountPill(effectiveTotal)}
                                </MenuItem>

                                {(Array.isArray(categories) ? categories : []).map((c) => {
                                    const key = safeStr(c?.key);
                                    const label = safeStr(c?.label);
                                    const ct = getCategoryCount(key);
                                    const countsLoaded = overrideCounts != null;
                                    const isEmpty = countsLoaded && ct <= 0;
                                    const IconComp = BUSINESS_CATEGORY_ICON[key] || CategoryIcon;

                                    return (
                                        <MenuItem key={key} value={key} disabled={isEmpty}>
                                            <ListItemIcon sx={{ minWidth: 30, color: isEmpty ? 'text.disabled' : 'primary.main', opacity: isEmpty ? 0.45 : 1 }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={label}
                                                sx={{ '& .MuiListItemText-primary': { color: isEmpty ? 'text.disabled' : 'inherit' } }}
                                            />
                                            {renderCountPill(ct)}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Entity Type dropdown */}
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1.5 0 130px' } }}>
                        <FormControl size="small" fullWidth sx={selectSx} disabled={disabled}>
                            <InputLabel id={STABLE_IDS.entityTypeLabelId} shrink>Listed As</InputLabel>
                            <Select
                                id={STABLE_IDS.entityTypeSelectId}
                                labelId={STABLE_IDS.entityTypeLabelId}
                                value={safeStr(value?.entityType || '')}
                                label="Listed As"
                                displayEmpty
                                onChange={(e) => setPatch({ entityType: String(e.target.value || '') })}
                                MenuProps={sharedMenuProps}
                                renderValue={(selected) => {
                                    const opt = ENTITY_TYPE_OPTIONS.find((o) => o.value === selected) || ENTITY_TYPE_OPTIONS[0];
                                    const IconComp = opt.icon;
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                                            <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {ENTITY_TYPE_OPTIONS.map((o) => {
                                    const IconComp = o.icon;
                                    return (
                                        <MenuItem key={o.value} value={o.value}>
                                            <ListItemIcon sx={{ minWidth: 26, color: 'primary.main' }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={o.label} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Post Type dropdown - only shown on Business Posts tab */}
                    {showPostTypeFilter && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1.5 0 140px' } }}>
                            <FormControl size="small" fullWidth sx={selectSx} disabled={disabled}>
                                <InputLabel id={STABLE_IDS.postTypeLabelId} shrink>Type</InputLabel>
                                <Select
                                    id={STABLE_IDS.postTypeSelectId}
                                    labelId={STABLE_IDS.postTypeLabelId}
                                    value={postType || ''}
                                    label="Type"
                                    displayEmpty
                                    onChange={(e) => setPatch({ postType: String(e.target.value || '') })}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(selected) => {
                                        const opt = POST_TYPE_OPTIONS.find((o) => o.value === selected) || POST_TYPE_OPTIONS[0];
                                        const IconComp = opt.icon;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                                                <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                    {opt.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {POST_TYPE_OPTIONS.map((o) => {
                                        const IconComp = o.icon;
                                        return (
                                            <MenuItem key={o.value} value={o.value}>
                                                <ListItemIcon sx={{ minWidth: 26, color: 'primary.main' }}>
                                                    <IconComp fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={o.label} />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Sort dropdown */}
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 140px' } }}>
                        <FormControl size="small" fullWidth sx={selectSx} disabled={disabled}>
                            <InputLabel id={STABLE_IDS.sortLabelId}>Sort by</InputLabel>
                            <Select
                                id={STABLE_IDS.sortSelectId}
                                labelId={STABLE_IDS.sortLabelId}
                                value={safeStr(sortValue || 'any') || 'any'}
                                label="Sort by"
                                onChange={(e) => setPatch({ [showPostTypeFilter ? 'postSort' : 'businessSort']: String(e.target.value || 'any') })}
                                MenuProps={sharedMenuProps}
                                renderValue={(selected) => {
                                    const opt = (Array.isArray(sortOptions) ? sortOptions : []).find((o) => o.value === selected) || (sortOptions[0] || { label: 'Any' });
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                                            <SortRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {(Array.isArray(sortOptions) ? sortOptions : []).map((o) => (
                                    <MenuItem key={String(o.value)} value={String(o.value)}>
                                        {String(o.label)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Date Posted dropdown - only on Business Posts tab */}
                    {showPostTypeFilter && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 140px' } }}>
                            <FormControl size="small" fullWidth sx={selectSx} disabled={disabled}>
                                <InputLabel id={STABLE_IDS.dateRangeLabelId}>Date Posted</InputLabel>
                                <Select
                                    id={STABLE_IDS.dateRangeSelectId}
                                    labelId={STABLE_IDS.dateRangeLabelId}
                                    value={safeStr(value?.dateRange || dateRangeValue || 'all') || 'all'}
                                    label="Date Posted"
                                    onChange={(e) => setPatch({ dateRange: String(e.target.value || 'all') })}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(selected) => {
                                        const opt = DATE_RANGE_OPTIONS.find((o) => o.value === selected) || DATE_RANGE_OPTIONS[0];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, overflow: 'hidden' }}>
                                                <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                                    {opt.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {DATE_RANGE_OPTIONS.map((o) => (
                                        <MenuItem key={o.value} value={o.value}>
                                            {o.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* County + City + Radius — same row on desktop, stacked on mobile */}
                    <Box
                        sx={{
                            flex: '1 1 100%',
                            minWidth: 0,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1,
                            // Match the outer filter row's mobile rowGap so Radius
                            // doesn't crowd up against City when these wrap.
                            rowGap: { xs: 2, md: 1 },
                        }}
                    >
                        <Box sx={{ flex: { xs: '1 1 100%', md: '2 1 0%' }, minWidth: 0 }}>
                            <CityCountySelect
                                county={countyValueForUi}
                                setCounty={(v) => {
                                    const next = v === ALL_COUNTIES_LABEL ? '' : v;
                                    setPatch({ county: next });
                                }}
                                city={cityValueForUi}
                                setCity={(v) => {
                                    const next = v === ALL_CITIES_LABEL ? '' : v;
                                    setPatch({ city: next });
                                }}
                                onCityCountyChange={({ city, county }) => {
                                    setPatch({
                                        city: city === ALL_CITIES_LABEL ? '' : city,
                                        county: county === ALL_COUNTIES_LABEL ? '' : county,
                                    });
                                }}
                                allCountyValue={ALL_COUNTIES_LABEL}
                                allCityValue={ALL_CITIES_LABEL}
                                countyCounts={locationCounts?.counties || null}
                                cityCounts={locationCounts?.cities || null}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                disabled={disabled}
                                selectSx={selectSx}
                                filterMode
                                menuProps={sharedMenuProps}
                            />
                        </Box>

                        {/* Radius — beside County+City on desktop, own row on mobile */}
                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0%' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectSx} disabled={disabled || !countyValue}>
                                <InputLabel id="biz-filter-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="biz-filter-radius-select"
                                    labelId="biz-filter-radius-label"
                                    label="Radius"
                                    value={String(countyValue ? (radiusValue ?? '0') : STATEWIDE)}
                                    onChange={(e) => setPatch({ radius: e.target.value })}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(val));
                                        const label = !countyValue
                                            ? 'All Alabama'
                                            : (opt?.label || 'County only');
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <ExploreRoundedIcon fontSize="small" />
                                                <Typography component="span" sx={{ fontSize: 14 }}>
                                                    {label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {RADIUS_OPTIONS.map((opt) => (
                                        <MenuItem key={String(opt.value)} value={String(opt.value)}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
