import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Box,
    Collapse,
    FormControl,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Typography,
    CircularProgress,
    Chip,
    Stack,
    Button,
    IconButton,
    Tooltip,
} from "@mui/material";

import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";

import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import SportsSoccerRoundedIcon from "@mui/icons-material/SportsSoccerRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import ChurchRoundedIcon from "@mui/icons-material/ChurchRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import SavedFiltersMenu from "../../community/SavedFiltersMenu";
import useSavedFilters from "../../community/useSavedFilters";
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    RADIUS_VALUE_WHEN_NO_COUNTY,
} from "../../../utils/geoRadius";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

/**
 * EventsFilters
 * ------------
 * Aligns with the Community filters layout:
 *   Search | View | Category | Sort by | Date range | County/City (right)
 *
 * Updates:
 * - Adds debounced search input at top of filter bar
 * - View dropdown: All Events, My Events
 * - Category dropdown:
 *    - category-specific icons for actual categories
 *    - NO icon for the "All Event Categories" value (matches Community)
 *    - shows backend counts + disables 0-count categories
 * - City/County use CityCountySelect (same component/pattern you use elsewhere)
 */

// ── CONSTANTS: defined OUTSIDE the component to avoid re-creation on every render ──
// This prevents the infinite-loop bug (Maximum update depth exceeded).

const VIEW_OPTIONS = [
    { value: "all", label: "All", icon: VisibilityRoundedIcon },
    { value: "mine", label: "My Events", icon: PersonRoundedIcon },
    { value: "following", label: "Following", icon: PeopleOutlineRoundedIcon },
    { value: "going", label: "Going", icon: EventAvailableRoundedIcon },
    { value: "interested", label: "Interested", icon: FavoriteRoundedIcon },
    { value: "friends-going", label: "Friends Going", icon: Diversity3RoundedIcon },
    { value: "friends-interested", label: "Friends Interested", icon: Diversity3RoundedIcon },
];

const DATE_PRESETS = [
    { value: "today", label: "Today" },
    { value: "weekend", label: "This Weekend" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "past", label: "Past Events" },
    { value: "custom", label: "Custom" },
];

const SORT_OPTIONS = [
    { value: "soonest", label: "Upcoming" },
    { value: "trending", label: "Most Popular" },
    { value: "recent", label: "Recently Added" },
];

/** Sort options that make sense for past events (no "Upcoming") */
const PAST_SORT_OPTIONS = [
    { value: "recent", label: "Recently Added" },
    { value: "trending", label: "Trending" },
];

const ALL_COUNTIES_LABEL = "All Counties";
const ALL_CITIES_LABEL = "All Cities";
const ALL_CATEGORIES_LABEL = "All Categories";

// ── Stable default prop values (MUST be outside the component) ──
const EMPTY_SELECTED_DATES = [];

const EVENT_CATEGORY_OPTIONS = [
    { id: "music-nightlife", label: "Music" },
    { id: "arts-culture", label: "Arts & Culture" },
    { id: "food-drink", label: "Food & Drink" },
    { id: "community-social", label: "Community & Social" },
    { id: "family-kids", label: "Family & Kids" },
    { id: "sports-recreation", label: "Sports & Recreation" },
    { id: "outdoors-nature", label: "Outdoors & Nature" },
    { id: "education-workshops", label: "Education & Workshops" },
    { id: "business-networking", label: "Business & Networking" },
    { id: "health-wellness", label: "Health & Wellness" },
    { id: "faith-spiritual", label: "Faith & Spiritual" },
    { id: "volunteer-fundraising", label: "Volunteer & Fundraising" },
    { id: "government-civic", label: "Government & Civic" },
    { id: "markets-shopping", label: "Markets & Shopping" },
    { id: "holidays-seasonal", label: "Holidays & Seasonal" },
    { id: "other", label: "Other" },
];

const EVENT_CATEGORY_ICON = {
    "music-nightlife": MusicNoteRoundedIcon,
    "arts-culture": TheaterComedyRoundedIcon,
    "food-drink": RestaurantRoundedIcon,
    "community-social": PeopleAltRoundedIcon,
    "family-kids": ChildCareRoundedIcon,
    "sports-recreation": SportsSoccerRoundedIcon,
    "outdoors-nature": ParkRoundedIcon,
    "education-workshops": SchoolRoundedIcon,
    "business-networking": BusinessCenterRoundedIcon,
    "health-wellness": SpaRoundedIcon,
    "faith-spiritual": ChurchRoundedIcon,
    "volunteer-fundraising": VolunteerActivismRoundedIcon,
    "government-civic": AccountBalanceRoundedIcon,
    "markets-shopping": StorefrontRoundedIcon,
    "holidays-seasonal": CelebrationRoundedIcon,
    other: CategoryRoundedIcon,
};

const normalizeStr = (v) => String(v ?? "").trim();

function CategoryRow({ icon: IconComp, label, muted = false }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            {IconComp ? (
                <IconComp
                    sx={{
                        fontSize: 20,
                        flexShrink: 0,
                        opacity: muted ? 0.35 : 1,
                        color: muted ? "text.disabled" : "primary.main",
                    }}
                />
            ) : null}

            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

/*
 * ─── STABLE OBJECTS DEFINED OUTSIDE THE COMPONENT ───
 * Prevents infinite re-render loops caused by useMemo([theme]) producing
 * new references when useTheme() returns a new object each render.
 */
const sharedMenuProps = {
    disableScrollLock: true,
    PaperProps: {
        sx: (t) => ({
            mt: 0.75,
            bgcolor: "background.paper",
            backgroundImage: "none",
            maxHeight: 340,
            borderRadius: 2.5,
            border: "1px solid",
            borderColor: alpha(t.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            "& .MuiMenuItem-root": {
                minHeight: 42,
                fontSize: "0.875rem",
                fontWeight: 600,
            },
            ['@media (max-width:1023px)']: {
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
                "& .MuiMenuItem-root": {
                    minHeight: 48,
                    fontSize: '1rem',
                    fontWeight: 600,
                },
            },
        }),
    },
};

const selectPillSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === "dark";
            const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: "saturate(140%) blur(10px)",
        minHeight: 40,
        "& fieldset": {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === "dark" ? 0.18 : 0.14),
        },
        "&:hover fieldset": {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.22),
        },
        "&.Mui-focused fieldset": {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    "& .MuiInputLabel-root": {
        color: "text.secondary",
        fontWeight: 600,
        fontSize: "0.875rem",
    },
    "& .MuiSelect-select": {
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 1,
        minHeight: "unset",
        minWidth: 0,
        fontSize: "0.875rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        paddingRight: "40px !important",
    },
    "& .MuiInputBase-input": {
        fontWeight: 700,
        letterSpacing: "-0.01em",
    },
};

export default function EventsFilters({
                                          // search
                                          query,
                                          onQueryChange,

                                          // location
                                          city,
                                          onCityChange,
                                          county,
                                          onCountyChange,

                                          // radius
                                          radius,
                                          onRadiusChange,

                                          // view (NEW)
                                          view = "all",
                                          onViewChange,

                                          // category
                                          category,
                                          onCategoryChange,

                                          // date + sort
                                          datePreset,
                                          onDatePresetChange,
                                          sort,
                                          onSortChange,

                                          // kept for compatibility
                                          onClearFilters,
                                          onPreviewDetail,

                                          // in-bar reset icon handler (falls back to onClearFilters)
                                          onClearAll = null,

                                          // UI
                                          showSearchInput = false,
                                          showAdvancedFilters = true,

                                          // backend-driven counts for categories
                                          categoryCounts = null,
                                          categoryCountsLoading = false,

                                          // Custom date range from calendar
                                          customStartDate = null,
                                          customEndDate = null,
                                          selectedDates = EMPTY_SELECTED_DATES,

                                          // NEW: Flag for custom date with no dates selected
                                          isCustomWithNoDates = false,

                                          // NEW: Hide categories with 0 count instead of graying them out
                                          hideEmptyCategories = false,

                                          // NEW: Hide the category dropdown entirely (e.g. Music page locks to concerts)
                                          hideCategoryDropdown = false,

                                          // Location counts for county/city badge display
                                          locationCounts = null,

                                          /* saved filters (slice 3) */
                                          viewer = null,
                                          committedQuery = "",
                                          onCommittedQueryChange = null,
                                          showSavedFilters = true,
                                      }) {

    const safeQuery = normalizeStr(query);

    const safeCity = normalizeStr(city);
    const safeCounty = normalizeStr(county);

    // CityCountySelect uses "All Counties" / "All Cities" sentinel option values.
    // Our Events API expects empty string when no filter is applied, so we translate.
    const countyValueForUi = safeCounty || ALL_COUNTIES_LABEL;
    const cityValueForUi = safeCity || ALL_CITIES_LABEL;

    const safeView = normalizeStr(view) || "all";
    const safeCategory = normalizeStr(category);
    const safeDatePreset = normalizeStr(datePreset) || "year";
    const safeSort = normalizeStr(sort) || "soonest";

    const countsMap = useMemo(() => {
        const raw = categoryCounts && typeof categoryCounts === "object" ? categoryCounts : {};
        const out = new Map();
        EVENT_CATEGORY_OPTIONS.forEach((c) => {
            const key = normalizeStr(c.id).toLowerCase();
            // If custom with no dates, show 0 for all categories
            if (isCustomWithNoDates) {
                out.set(c.id, 0);
            } else {
                const n = Number(raw[key] ?? raw[c.id] ?? 0);
                out.set(c.id, Number.isFinite(n) ? n : 0);
            }
        });
        return out;
    }, [categoryCounts, isCustomWithNoDates]);

    const activeSortOptions = safeDatePreset === "past" ? PAST_SORT_OPTIONS : SORT_OPTIONS;

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    //
    // On mobile the field grid stays expanded. On desktop it starts
    // collapsed; users see a compact row with a "Filters" toggle button,
    // active-filter chips, and a reset icon.
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [userExpanded, setUserExpanded] = useState(null);

    const fieldsExpanded = useMemo(() => {
        if (!isDesktop) return true;
        if (userExpanded !== null) return userExpanded;
        return false;
    }, [isDesktop, userExpanded]);

    // Defaults for "active" detection
    const DEFAULT_DATE_PRESET = "year";
    const DEFAULT_SORT = "soonest";

    const activeFilterChips = useMemo(() => {
        const chips = [];

        // View
        if (safeView && safeView !== "all") {
            const opt = VIEW_OPTIONS.find((o) => o.value === safeView);
            if (opt) {
                chips.push({
                    key: "view",
                    label: `View: ${opt.label}`,
                    onClear: () => { if (typeof onViewChange === "function") onViewChange("all"); },
                });
            }
        }

        // Category
        if (safeCategory) {
            const cat = EVENT_CATEGORY_OPTIONS.find((c) => c.id === safeCategory);
            chips.push({
                key: "category",
                label: `Category: ${cat?.label || safeCategory}`,
                onClear: () => { if (typeof onCategoryChange === "function") onCategoryChange(""); },
            });
        }

        // Date preset — "year" is the default; "custom" gets a special label
        if (safeDatePreset && safeDatePreset !== DEFAULT_DATE_PRESET) {
            const opt = DATE_PRESETS.find((d) => d.value === safeDatePreset);
            if (opt) {
                chips.push({
                    key: "date",
                    label: `When: ${opt.label}`,
                    onClear: () => { if (typeof onDatePresetChange === "function") onDatePresetChange(DEFAULT_DATE_PRESET); },
                });
            }
        }

        // Sort
        if (safeSort && safeSort !== DEFAULT_SORT) {
            const opt = activeSortOptions.find((o) => o.value === safeSort);
            if (opt) {
                chips.push({
                    key: "sort",
                    label: `Sort: ${opt.label}`,
                    onClear: () => { if (typeof onSortChange === "function") onSortChange(DEFAULT_SORT); },
                });
            }
        }

        // County
        if (safeCounty) {
            chips.push({
                key: "county",
                label: `County: ${safeCounty}`,
                onClear: () => {
                    if (typeof onCountyChange === "function") onCountyChange("");
                    if (typeof onCityChange === "function") onCityChange("");
                },
            });
        }

        // City
        if (safeCity) {
            chips.push({
                key: "city",
                label: `City: ${safeCity}`,
                onClear: () => { if (typeof onCityChange === "function") onCityChange(""); },
            });
        }

        // Radius — only when a county is set and non-default
        if (safeCounty && radius != null &&
            String(radius) !== String(RADIUS_VALUE_WHEN_NO_COUNTY) &&
            String(radius) !== "0") {
            const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(radius));
            if (opt) {
                chips.push({
                    key: "radius",
                    label: `Radius: ${opt.label}`,
                    onClear: () => {
                        if (typeof onRadiusChange === "function") onRadiusChange(RADIUS_VALUE_WHEN_NO_COUNTY);
                    },
                });
            }
        }

        return chips;
    }, [
        safeView, onViewChange,
        safeCategory, onCategoryChange,
        safeDatePreset, onDatePresetChange,
        safeSort, activeSortOptions, onSortChange,
        safeCounty, safeCity, radius,
        onCountyChange, onCityChange, onRadiusChange,
    ]);

    const handleClearAll = useCallback(() => {
        if (typeof onClearAll === "function") return onClearAll();
        if (typeof onClearFilters === "function") return onClearFilters();
    }, [onClearAll, onClearFilters]);

    const filterCardSx = (t) => ({
        p: isDesktop
            ? { xs: 1.5, md: 1 }
            : { xs: 1.5, md: 1.25 },
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        rowGap: { xs: 2, md: 1.25 },
        alignItems: "center",
        border: isDesktop ? "none" : "1px solid",
        borderColor: alpha(t.palette.primary.main, 0.14),
        borderRadius: 2.5,
        bgcolor: isDesktop ? "transparent" : alpha(t.palette.background.default, 0.92),
        color: t.palette.text.primary,
        backgroundImage: isDesktop
            ? "none"
            : `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(
                t.palette.primary.main,
                0.01
            )} 100%)`,
        boxShadow: isDesktop
            ? "none"
            : `0 10px 28px ${alpha(t.palette.text.primary, 0.06)}, inset 0 0 0 1px ${alpha(
                t.palette.primary.main,
                0.08
            )}`,
    });

    const handleViewChange = useCallback(
        (val) => {
            if (typeof onViewChange === "function") onViewChange(val);
        },
        [onViewChange]
    );

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Snapshot of current filter state to persist. Keys MUST match the
    // backend service's ALLOWED_KEYS.events schema — see
    // savedFiltersService.js.
    //
    // Intentionally omits customStartDate / customEndDate / selectedDates:
    // those are ad-hoc picks that go stale when saved. A filter saved as
    // datePreset='custom' with no dates simply falls back to an empty range
    // on apply (page already handles this).
    const currentFilterPayload = useMemo(() => ({
        view:       safeView || "all",
        category:   safeCategory,
        datePreset: safeDatePreset || "month",
        sort:       normalizeStr(sort) || "soonest",
        city:       safeCity,
        county:     safeCounty,
        radius:     normalizeStr(radius),
        search:     String(committedQuery || query || "").trim(),
    }), [
        safeView, safeCategory, safeDatePreset, sort,
        safeCity, safeCounty, radius, committedQuery, query,
    ]);

    // Apply a saved filter. Route each field through the existing setter
    // props so the page sees the changes the same way it would from any
    // other interaction. Missing keys fall back to the current value so
    // we don't accidentally wipe fields the payload didn't include.
    const handleApplySavedFilter = useCallback((filter) => {
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        // Search: update BOTH the input (query) and the applied term
        // (committedQuery) so the UI reflects the term AND the fetch
        // re-runs with it. Handled via the parent's dedicated callback.
        let nextSearchTerm = null;
        if ('search' in payload) {
            nextSearchTerm = String(payload.search || "");
            if (typeof onQueryChange === "function") onQueryChange(nextSearchTerm);
            if (typeof onCommittedQueryChange === "function") {
                onCommittedQueryChange(nextSearchTerm);
            }
        }

        if (typeof onViewChange === "function" && 'view' in payload) {
            onViewChange(payload.view || "all");
        }
        if (typeof onCityChange === "function" && 'city' in payload) {
            onCityChange(payload.city || "");
        }
        if (typeof onCountyChange === "function" && 'county' in payload) {
            onCountyChange(payload.county || "");
        }
        if (typeof onRadiusChange === "function" && 'radius' in payload) {
            onRadiusChange(payload.radius);
        }
        if (typeof onCategoryChange === "function" && 'category' in payload) {
            onCategoryChange(payload.category || "");
        }
        if (typeof onDatePresetChange === "function" && 'datePreset' in payload) {
            onDatePresetChange(payload.datePreset || "month");
        }
        if (typeof onSortChange === "function" && 'sort' in payload) {
            onSortChange(payload.sort || "soonest");
        }
    }, [
        onQueryChange, onCommittedQueryChange,
        onViewChange, onCityChange, onCountyChange, onRadiusChange,
        onCategoryChange, onDatePresetChange, onSortChange,
    ]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'events',
        viewer: viewer || null,
    });

    // First-load-only: flip permanently the first time auto-apply fires.
    const autoAppliedRef = useRef(false);

    // Capture URL filter params ONCE at mount (during render, via lazy ref).
    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'q', 'search', 'view', 'category', 'subcategory',
            'sort', 'datePreset', 'range', 'start', 'end',
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
        if (autoAppliedRef.current) return;
        if (!savedDefaultFilter) return;
        if (hadUrlFiltersOnLoadRef.current) {
            autoAppliedRef.current = true;
            return;
        }
        autoAppliedRef.current = true;
        handleApplySavedFilter(savedDefaultFilter);
    }, [savedDefaultFilter, handleApplySavedFilter]);

    return (
        <Box
            sx={(t) => ({
                p: isDesktop
                    ? { xs: 1, md: 0.75 }
                    : { xs: 1, md: 1.25 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.12),
                bgcolor: alpha(t.palette.background.paper, 0.62),
                color: t.palette.text.primary,
                backdropFilter: "saturate(140%) blur(10px)",
                backgroundImage: "none",
                boxShadow: t.custom.shadows.md,
            })}
        >
            {showSearchInput ? (
                <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>Search</Typography>
                    <Box
                        sx={(t) => ({
                            px: 1.25,
                            py: 1,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: alpha(t.palette.text.primary, 0.10),
                            bgcolor: "background.paper",
                            color: "text.secondary",
                            fontSize: '0.875rem',
                        })}
                    >
                        {safeQuery ? `Query: ${safeQuery}` : "Search is shown in the header."}
                    </Box>
                </Box>
            ) : null}

            {/*
             * Desktop-only compact row: "Filters" dropdown button + active
             * filter chips + reset icon. On mobile the field grid renders
             * directly below.
             */}
            {isDesktop && Boolean(showAdvancedFilters) && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 1,
                    }}
                >
                    <Button
                        size="small"
                        variant={fieldsExpanded ? "contained" : "outlined"}
                        color="primary"
                        startIcon={<TuneRoundedIcon />}
                        endIcon={fieldsExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                        onClick={() => setUserExpanded(!fieldsExpanded)}
                        sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: 999,
                            flexShrink: 0,
                            px: 1.75,
                            height: 34,
                        }}
                    >
                        Filters
                        {activeFilterChips.length > 0 && !fieldsExpanded ? ` (${activeFilterChips.length})` : ""}
                    </Button>

                    {activeFilterChips.length > 0 && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{
                                flexWrap: "wrap",
                                rowGap: 0.75,
                                alignItems: "center",
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
                                        fontSize: "0.8125rem",
                                        fontWeight: 600,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.22),
                                        "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        },
                                        "& .MuiChip-deleteIcon": {
                                            fontSize: 16,
                                            color: alpha(t.palette.primary.main, 0.55),
                                            "&:hover": { color: t.palette.primary.main },
                                        },
                                    })}
                                />
                            ))}
                        </Stack>
                    )}

                    <Tooltip title="Clear filters" arrow>
                        <span style={{ marginLeft: "auto" }}>
                            <IconButton
                                onClick={handleClearAll}
                                disabled={activeFilterChips.length === 0}
                                size="small"
                                aria-label="Clear filters"
                                sx={(t) => ({
                                    width: 34,
                                    height: 34,
                                    borderRadius: 999,
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.text.primary, 0.12),
                                    backgroundColor: alpha(t.palette.text.primary, 0.03),
                                    color: t.palette.text.secondary,
                                    "&:hover": {
                                        backgroundColor: alpha(t.palette.primary.main, 0.08),
                                        borderColor: alpha(t.palette.primary.main, 0.3),
                                        color: t.palette.primary.main,
                                    },
                                    "&.Mui-disabled": { opacity: 0.4 },
                                })}
                            >
                                <RestartAltRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            )}

            <Collapse in={Boolean(showAdvancedFilters) && fieldsExpanded} timeout={200} unmountOnExit>
                <Box sx={(t) => ({ ...filterCardSx(t), mt: isDesktop ? 1 : 0 })}>
                    {/* Saved filters bookmark — first child. On mobile it
                        takes the full row and right-aligns so it reads as
                        a deliberate "controls" row instead of floating in
                        the corner. On desktop it sits inline as a chip. */}
                    {showSavedFilters && (
                        <Box
                            sx={{
                                flex: { xs: "1 1 100%", sm: "0 0 auto" },
                                display: "flex",
                                alignItems: "center",
                                alignSelf: "center",
                                justifyContent: { xs: "flex-end", sm: "flex-start" },
                            }}
                        >
                            <SavedFiltersMenu
                                tab="events"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {/* View */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 120px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>View</InputLabel>
                            <Select
                                label="View"
                                value={VIEW_OPTIONS.some((o) => o.value === safeView) ? safeView : "all"}
                                onChange={(e) => handleViewChange(e.target.value)}
                                MenuProps={sharedMenuProps}
                                sx={selectPillSx}
                                renderValue={(val) => {
                                    const opt = VIEW_OPTIONS.find((o) => o.value === val) || VIEW_OPTIONS[0];
                                    const IconComp = opt.icon || VisibilityRoundedIcon;
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                            <IconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {VIEW_OPTIONS.map((opt) => {
                                    const IconComp = opt.icon || VisibilityRoundedIcon;
                                    return (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={opt.label} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Category */}
                    {!hideCategoryDropdown && (
                        <Box sx={{ flex: { xs: "1 1 45%", sm: "2 0 180px" } }}>
                            <FormControl size="small" fullWidth sx={selectPillSx}>
                                <InputLabel id="events-category-label" shrink>
                                    Category
                                </InputLabel>

                                <Select
                                    id="events-category-select"
                                    labelId="events-category-label"
                                    label="Category"
                                    value={safeCategory}
                                    onChange={(e) => onCategoryChange?.(e.target.value)}
                                    displayEmpty
                                    renderValue={(val) => {
                                        const v = normalizeStr(val);
                                        if (!v) {
                                            // Show total count for "All Categories"
                                            const totalCount = isCustomWithNoDates
                                                ? 0
                                                : Array.from(countsMap.values()).reduce((a, b) => a + b, 0);
                                            return (
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
                                                    <CalendarMonthRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                                                        {ALL_CATEGORIES_LABEL}
                                                    </Typography>
                                                    <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                        {categoryCountsLoading ? (
                                                            <CircularProgress size={14} sx={{ color: "primary.main" }} />
                                                        ) : (
                                                            <Typography
                                                                component="span"
                                                                sx={(t) => ({
                                                                    ml: "auto",
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700,
                                                                    color: totalCount > 0 ? "primary.main" : "text.secondary",
                                                                    bgcolor: totalCount > 0 ? alpha(t.palette.primary.main, 0.1) : "action.hover",
                                                                    px: 0.75,
                                                                    py: 0.25,
                                                                    borderRadius: 1,
                                                                    minWidth: 28,
                                                                    textAlign: "center",
                                                                    lineHeight: 1.4,
                                                                })}
                                                            >
                                                                {totalCount}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        }

                                        const label = EVENT_CATEGORY_OPTIONS.find((c) => c.id === v)?.label || v;
                                        const IconComp = EVENT_CATEGORY_ICON[v] || CategoryRoundedIcon;
                                        const count = isCustomWithNoDates ? 0 : Number(countsMap.get(v) || 0);
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
                                                <IconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                                                    {label}
                                                </Typography>
                                                <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                    {categoryCountsLoading ? (
                                                        <CircularProgress size={14} sx={{ color: "primary.main" }} />
                                                    ) : (
                                                        <Typography
                                                            component="span"
                                                            sx={(t) => ({
                                                                ml: "auto",
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                color: count > 0 ? "primary.main" : "text.secondary",
                                                                bgcolor: count > 0 ? alpha(t.palette.primary.main, 0.1) : "action.hover",
                                                                px: 0.75,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                minWidth: 28,
                                                                textAlign: "center",
                                                                lineHeight: 1.4,
                                                            })}
                                                        >
                                                            {count}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    }}
                                    MenuProps={sharedMenuProps}
                                    sx={selectPillSx}
                                >
                                    <MenuItem value="">
                                        <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                            <CalendarMonthRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={ALL_CATEGORIES_LABEL} />
                                        {(() => {
                                            const totalCount = isCustomWithNoDates
                                                ? 0
                                                : Array.from(countsMap.values()).reduce((a, b) => a + b, 0);
                                            return (
                                                <Box sx={{ ml: 1, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {categoryCountsLoading ? (
                                                        <CircularProgress size={14} sx={{ color: "primary.main" }} />
                                                    ) : (
                                                        <Typography
                                                            component="span"
                                                            sx={(t) => ({
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                color: totalCount > 0 ? "primary.main" : "text.secondary",
                                                                bgcolor: totalCount > 0 ? alpha(t.palette.primary.main, 0.1) : "action.hover",
                                                                px: 0.75,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                minWidth: 28,
                                                                textAlign: "center",
                                                            })}
                                                        >
                                                            {totalCount}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })()}
                                    </MenuItem>

                                    {EVENT_CATEGORY_OPTIONS.map((c) => {
                                        const ct = isCustomWithNoDates ? 0 : Number(countsMap.get(c.id) || 0);
                                        const disabled = categoryCountsLoading ? false : ct <= 0;
                                        const IconComp = EVENT_CATEGORY_ICON[c.id] || CategoryRoundedIcon;

                                        // When hideEmptyCategories is on, skip zero-count categories entirely
                                        if (hideEmptyCategories && !categoryCountsLoading && ct <= 0) return null;

                                        return (
                                            <MenuItem
                                                key={c.id}
                                                value={c.id}
                                                disabled={disabled}
                                                sx={{
                                                    opacity: disabled ? 0.5 : 1,
                                                    "&.Mui-disabled": {
                                                        opacity: 0.5,
                                                    },
                                                }}
                                            >
                                                <ListItemIcon
                                                    sx={{
                                                        minWidth: 28,
                                                        color: disabled ? "text.disabled" : "primary.main",
                                                    }}
                                                >
                                                    <IconComp fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={c.label}
                                                    sx={{
                                                        color: disabled ? "text.disabled" : "inherit",
                                                    }}
                                                />
                                                <Box sx={{ ml: 1, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {categoryCountsLoading ? (
                                                        <CircularProgress size={14} sx={{ color: disabled ? "text.disabled" : "primary.main" }} />
                                                    ) : (
                                                        <Typography
                                                            component="span"
                                                            sx={(t) => ({
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                color: disabled
                                                                    ? "text.disabled"
                                                                    : ct > 0
                                                                        ? "primary.main"
                                                                        : "text.secondary",
                                                                bgcolor: disabled
                                                                    ? "transparent"
                                                                    : ct > 0
                                                                        ? alpha(t.palette.primary.main, 0.1)
                                                                        : "action.hover",
                                                                px: 0.75,
                                                                py: 0.25,
                                                                borderRadius: 1,
                                                                minWidth: 28,
                                                                textAlign: "center",
                                                            })}
                                                        >
                                                            {ct}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Sort */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 140px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                label="Sort by"
                                value={activeSortOptions.some((o) => o.value === safeSort) ? safeSort : activeSortOptions[0]?.value || "recent"}
                                onChange={(e) => onSortChange?.(e.target.value)}
                                MenuProps={sharedMenuProps}
                                sx={selectPillSx}
                                renderValue={(val) => {
                                    const opt = activeSortOptions.find((o) => o.value === val) || activeSortOptions[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                            <SortRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt?.label || val}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {activeSortOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Date range */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 150px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>Date range</InputLabel>
                            <Select
                                label="Date range"
                                value={DATE_PRESETS.some((o) => o.value === safeDatePreset) ? safeDatePreset : "year"}
                                onChange={(e) => onDatePresetChange?.(e.target.value)}
                                MenuProps={sharedMenuProps}
                                sx={selectPillSx}
                                renderValue={(val) => {
                                    let displayLabel;
                                    // Show selected dates when custom is active
                                    if (val === "custom" && selectedDates.length > 0) {
                                        // Parse "YYYY-MM-DD" as local date (not UTC) to avoid off-by-one timezone bugs
                                        const parseLocalDate = (d) => {
                                            if (!d) return null;
                                            const [y, m, day] = String(d).split("-").map(Number);
                                            return new Date(y, m - 1, day);
                                        };
                                        const formatDate = (d) => {
                                            if (!d) return "";
                                            const date = parseLocalDate(d);
                                            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                        };

                                        // Check if dates are consecutive (range mode) or individual (pick mode)
                                        const sortedDates = [...selectedDates].sort();
                                        const isConsecutive = sortedDates.length > 1 && sortedDates.every((d, i) => {
                                            if (i === 0) return true;
                                            const prev = parseLocalDate(sortedDates[i - 1]);
                                            const curr = parseLocalDate(d);
                                            const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
                                            return diffDays === 1;
                                        });

                                        if (isConsecutive && sortedDates.length > 1) {
                                            displayLabel = `${formatDate(sortedDates[0])} – ${formatDate(sortedDates[sortedDates.length - 1])}`;
                                        } else if (sortedDates.length === 1) {
                                            displayLabel = formatDate(sortedDates[0]);
                                        } else {
                                            displayLabel = `${sortedDates.length} dates selected`;
                                        }
                                    } else {
                                        displayLabel = DATE_PRESETS.find((o) => o.value === val)?.label || "Custom";
                                    }
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                            <DateRangeRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {displayLabel}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {DATE_PRESETS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* County + City + Radius */}
                    <Box sx={{ flex: "1 1 100%", minWidth: 0, display: "flex", flexWrap: "wrap", gap: 1, rowGap: { xs: 2, md: 1 } }}>
                        <Box sx={{ flex: { xs: "1 1 100%", md: "2 1 0%" }, minWidth: 0 }}>
                            <CityCountySelect
                                county={countyValueForUi}
                                setCounty={(v) => {
                                    const next = v === ALL_COUNTIES_LABEL ? "" : v;
                                    onCountyChange?.(next);
                                }}
                                city={cityValueForUi}
                                setCity={(v) => {
                                    const next = v === ALL_CITIES_LABEL ? "" : v;
                                    onCityChange?.(next);
                                }}
                                allCountyValue={ALL_COUNTIES_LABEL}
                                allCityValue={ALL_CITIES_LABEL}
                                countyCounts={locationCounts?.counties || null}
                                cityCounts={locationCounts?.cities || null}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                selectSx={selectPillSx}
                                filterMode
                                menuProps={sharedMenuProps}
                                slotProps={{ popper: { style: { zIndex: 1400 }, disablePortal: false } }}
                            />
                        </Box>

                        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0%" }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectPillSx} disabled={!safeCounty}>
                                <InputLabel id="events-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="events-radius-select"
                                    labelId="events-radius-label"
                                    label="Radius"
                                    value={String(safeCounty ? (radius ?? "0") : STATEWIDE)}
                                    onChange={(e) => onRadiusChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(val));
                                        const label = !safeCounty ? "All Alabama" : (opt?.label || "County only");
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <ExploreRoundedIcon fontSize="small" />
                                                <Typography component="span" sx={{ fontSize: 14 }}>{label}</Typography>
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

                    {/* (hidden) keep compatibility with old callbacks */}
                    <Box sx={{ display: "none" }}>
                        <Typography component="button" type="button" onClick={onPreviewDetail}>
                            Preview
                        </Typography>
                        <Typography component="button" type="button" onClick={onClearFilters}>
                            Clear
                        </Typography>
                        <Typography component="button" type="button" onClick={onQueryChange}>
                            Query {safeQuery}
                        </Typography>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
