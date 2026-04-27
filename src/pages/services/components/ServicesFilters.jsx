import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Box,
    Collapse,
    CircularProgress,
    FormControl,
    InputLabel,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Typography,
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

import SortRoundedIcon from "@mui/icons-material/SortRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import GrassRoundedIcon from "@mui/icons-material/GrassRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import PlumbingRoundedIcon from "@mui/icons-material/PlumbingRounded";
import ElectricalServicesRoundedIcon from "@mui/icons-material/ElectricalServicesRounded";
import HvacRoundedIcon from "@mui/icons-material/HvacRounded";
import FormatPaintRoundedIcon from "@mui/icons-material/FormatPaintRounded";
import CarpenterRoundedIcon from "@mui/icons-material/CarpenterRounded";
import PestControlRoundedIcon from "@mui/icons-material/PestControlRounded";
import RoofingRoundedIcon from "@mui/icons-material/RoofingRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import SavedFiltersMenu from "../../community/SavedFiltersMenu";
import useSavedFilters from "../../community/useSavedFilters";
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from "../../../utils/geoRadius";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

const ALL_COUNTIES_LABEL = "All Counties";
const ALL_CITIES_LABEL = "All Cities";
const ALL_CATEGORIES_LABEL = "All Categories";

const DEFAULT_VIEW_OPTIONS = [
    { value: "all", label: "All", icon: VisibilityRoundedIcon },
    { value: "mine", label: "My Services", icon: PersonRoundedIcon },
];

const SORT_OPTIONS = [
    { value: "any", label: "Any" },
    { value: "a-z", label: "A–Z" },
    { value: "z-a", label: "Z–A" },
    { value: "most-reviewed", label: "Most Reviewed" },
    { value: "highest-rated", label: "Highest Rated" },
];

const REQUESTS_SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
];

const PRICING_OPTIONS = [
    { value: "any", label: "All" },
    { value: "fixed", label: "Flat Rate" },
    { value: "hourly", label: "Hourly" },
    { value: "quote", label: "Quote Based" },
    { value: "free", label: "Free" },
];

const URGENCY_OPTIONS = [
    { value: "", label: "Any" },
    { value: "asap", label: "ASAP" },
    { value: "within_week", label: "This Week" },
    { value: "within_month", label: "This Month" },
    { value: "flexible", label: "Flexible" },
];

const BUDGET_TYPE_OPTIONS = [
    { value: "", label: "Any" },
    { value: "hourly", label: "Hourly" },
    { value: "flat", label: "Flat Rate" },
    { value: "flexible", label: "Flexible" },
    { value: "not_sure", label: "Not Sure" },
];

function normalizeLabel(value) {
    return String(value || "").trim();
}

function normalizeCategoryOption(option) {
    if (typeof option === "string") {
        const label = normalizeLabel(option);
        return { value: label, label, count: null };
    }

    if (!option || typeof option !== "object") {
        return null;
    }

    const value =
        normalizeLabel(option.slug) ||
        normalizeLabel(option.value) ||
        normalizeLabel(option.id) ||
        normalizeLabel(option.name) ||
        normalizeLabel(option.label);

    if (!value) return null;

    const label =
        normalizeLabel(option.label) ||
        normalizeLabel(option.name) ||
        normalizeLabel(option.title) ||
        value;

    const rawCount = option.count ?? option.total ?? option.listingCount ?? option.listings_count ?? null;
    const count = Number.isFinite(Number(rawCount)) ? Number(rawCount) : null;

    return { value, label, count };
}


function getServiceCategoryIcon(label) {
    const normalized = normalizeLabel(label).toLowerCase();

    if (!normalized) return HandymanRoundedIcon;
    if (normalized.includes("all categor")) return HandymanRoundedIcon;
    if (normalized.includes("handyman") || normalized.includes("home repair")) return HandymanRoundedIcon;
    if (normalized.includes("lawn") || normalized.includes("landscap") || normalized.includes("yard")) return GrassRoundedIcon;
    if (normalized.includes("clean")) return CleaningServicesRoundedIcon;
    if (normalized.includes("plumb")) return PlumbingRoundedIcon;
    if (normalized.includes("electric")) return ElectricalServicesRoundedIcon;
    if (normalized.includes("hvac") || normalized.includes("climate") || normalized.includes("air") || normalized.includes("heat")) {
        return HvacRoundedIcon;
    }
    if (normalized.includes("paint") || normalized.includes("drywall")) return FormatPaintRoundedIcon;
    if (normalized.includes("carpent") || normalized.includes("wood")) return CarpenterRoundedIcon;
    if (normalized.includes("pest")) return PestControlRoundedIcon;
    if (normalized.includes("roof")) return RoofingRoundedIcon;
    if (normalized.includes("moving") || normalized.includes("haul") || normalized.includes("delivery") || normalized.includes("junk")) {
        return LocalShippingRoundedIcon;
    }
    if (normalized.includes("beauty") || normalized.includes("salon") || normalized.includes("barber")) return ContentCutRoundedIcon;
    return BuildRoundedIcon;
}

/*
 * ─── STABLE OBJECTS DEFINED OUTSIDE THE COMPONENT ───
 * Prevents infinite re-render loops caused by new object references
 * on every render feeding into useEffect deps or child prop comparisons.
 */
const sharedMenuProps = {
    disableScrollLock: true,
    PaperProps: {
        sx: (theme) => ({
            mt: 0.75,
            borderRadius: 2.5,
            overflow: "auto",
            backgroundImage: "none",
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(theme.palette.text.primary, 0.12)}`,
            maxHeight: 340,
            '& .MuiMenuItem-root': {
                minHeight: 42,
                fontSize: '0.875rem',
                fontWeight: 600,
            },
        }),
    },
};

const selectSx = {
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
            borderWidth: 1,
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
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
};

/* ── icon map for view options (matches CommunityFilter) ── */
function getViewIcon(value) {
    const v = String(value || "").toLowerCase().trim();
    if (v === "following") return PeopleOutlineRoundedIcon;
    if (v === "mine" || v === "my") return PersonRoundedIcon;
    return VisibilityRoundedIcon;
}

export default function ServicesFilters({
                                            filters,
                                            onChangeFilters,
                                            categories = [],
                                            categoriesLoading = false,
                                            showAdvancedFilters = true,
                                            sort = "any",
                                            onChangeSort,
                                            view = "all",
                                            onChangeView,
                                            viewOptions = DEFAULT_VIEW_OPTIONS,
                                            hidePricing = false,
                                            hideCoverage = false,
                                            isRequestsMode = false,
                                            // Location counts — passed through to CityCountySelect
                                            locationCounts,

                                            /* saved filters (slice 3) */
                                            viewer = null,
                                            search = "",
                                            onSearchChange = null,
                                            showSavedFilters = true,

                                            /* Collapse-by-default UI */
                                            onClearAll = null,
                                            activeChips = null,
                                        }) {

    const safeFilters = filters && typeof filters === "object" ? filters : {};
    const safeCategory = normalizeLabel(safeFilters.category);
    const safePriceModel = normalizeLabel(safeFilters.priceModel) || "any";
    const safeCounty = normalizeLabel(safeFilters.county);
    const safeCity = normalizeLabel(safeFilters.city);
    const safeSort = normalizeLabel(sort) || "any";
    const safeView = normalizeLabel(view) || "all";
    const safeUrgency = normalizeLabel(safeFilters.urgency);
    const safeBudgetType = normalizeLabel(safeFilters.budgetType);

    const activeSortOptions = isRequestsMode ? REQUESTS_SORT_OPTIONS : SORT_OPTIONS;

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [userExpanded, setUserExpanded] = useState(null);

    const fieldsExpanded = useMemo(() => {
        if (!isDesktop) return true;
        if (userExpanded !== null) return userExpanded;
        return false;
    }, [isDesktop, userExpanded]);

    const chipsList = Array.isArray(activeChips) ? activeChips : [];

    const handleClearAllCallback = useCallback(() => {
        if (typeof onClearAll === "function") onClearAll();
    }, [onClearAll]);

    const categoryOptions = categories
        .map(normalizeCategoryOption)
        .filter(Boolean)
        .filter((option, index, arr) => arr.findIndex((item) => item.value === option.value) === index);

    const selectedViewOption =
        (Array.isArray(viewOptions) ? viewOptions : DEFAULT_VIEW_OPTIONS).find((option) => option.value === safeView) ||
        (Array.isArray(viewOptions) ? viewOptions : DEFAULT_VIEW_OPTIONS)[0] ||
        DEFAULT_VIEW_OPTIONS[0];

    const filterCardSx = (t) => ({
        mt: isDesktop ? 1 : 0,
        p: isDesktop ? { xs: 1.5, md: 1 } : { xs: 1.5, md: 1.4 },
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        rowGap: { xs: 2, md: 1.25 },
        alignItems: 'center',
        overflow: 'visible',
        border: isDesktop ? 'none' : '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.14),
        borderRadius: 3,
        bgcolor: isDesktop ? 'transparent' : alpha(t.palette.background.default, 0.92),
        backgroundImage: isDesktop ? 'none' : `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(
            t.palette.primary.main,
            0.01,
        )} 100%)`,
        boxShadow: isDesktop ? 'none' : `0 10px 28px ${alpha(t.palette.text.primary, 0.06)}, inset 0 0 0 1px ${alpha(
            t.palette.primary.main,
            0.08,
        )}`,
    });

    const setFilterValue = useCallback((key, value) => {
        if (typeof onChangeFilters !== 'function') return;
        onChangeFilters((prev) => {
            const safePrev = prev && typeof prev === 'object' ? prev : {};
            return { ...safePrev, [key]: value };
        });
    }, [onChangeFilters]);

    // ── Stable callbacks for CityCountySelect ──
    // These use useCallback so they don't create new references every render,
    // which would feed into CityCountySelect's useEffect deps and cause infinite loops.
    const handleSetCounty = useCallback((value) => {
        if (typeof onChangeFilters !== 'function') return;
        onChangeFilters((prev) => {
            const safePrev = prev && typeof prev === 'object' ? prev : {};
            const normalized = value === ALL_COUNTIES_LABEL ? '' : value;
            return {
                ...safePrev,
                county: normalized,
                radius: normalized ? DEFAULT_RADIUS_WHEN_COUNTY_SELECTED : STATEWIDE,
            };
        });
    }, [onChangeFilters]);

    const handleSetCity = useCallback((value) => {
        if (typeof onChangeFilters !== 'function') return;
        onChangeFilters((prev) => {
            const safePrev = prev && typeof prev === 'object' ? prev : {};
            return { ...safePrev, city: value === ALL_CITIES_LABEL ? '' : value };
        });
    }, [onChangeFilters]);

    const renderCountPill = (count) => {
        const isLoaded = Number.isFinite(count);
        return (
            <Typography
                component="span"
                sx={(theme) => ({
                    ml: 'auto',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    visibility: isLoaded ? 'visible' : 'hidden',
                    color: count > 0 ? 'primary.main' : 'text.secondary',
                    bgcolor: count > 0 ? alpha(theme.palette.primary.main, 0.1) : 'action.hover',
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

    // Snapshot of current filter state. Keys MUST match the backend
    // service's ALLOWED_KEYS.services schema (see savedFiltersService.js).
    const currentFilterPayload = useMemo(() => ({
        view:       safeView || 'all',
        sort:       safeSort || 'any',
        category:   safeCategory || '',
        priceModel: safePriceModel || 'any',
        urgency:    safeUrgency || '',
        budgetType: safeBudgetType || '',
        city:       safeCity || '',
        county:     safeCounty || '',
        radius:     normalizeLabel(safeFilters.radius),
        search:     String(search || '').trim(),
    }), [
        safeView, safeSort, safeCategory, safePriceModel,
        safeUrgency, safeBudgetType, safeCity, safeCounty,
        safeFilters, search,
    ]);

    // Apply a saved filter. Services has a split shape:
    //   - `filters` object (category, priceModel, city, county, radius,
    //     urgency, budgetType)
    //   - separate `view` and `sort` props
    //   - `search` lives on the parent page
    // We build one functional update for the filters object so we don't
    // wipe fields the payload didn't include, then call the view/sort/
    // search callbacks separately.
    const handleApplySavedFilter = useCallback((filter) => {
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        if ('search' in payload && typeof onSearchChange === 'function') {
            onSearchChange(String(payload.search || ''));
        }
        if ('view' in payload && typeof onChangeView === 'function') {
            onChangeView(payload.view || 'all');
        }
        if ('sort' in payload && typeof onChangeSort === 'function') {
            onChangeSort(payload.sort || 'any');
        }

        if (typeof onChangeFilters === 'function') {
            onChangeFilters((prev) => {
                const next = { ...(prev && typeof prev === 'object' ? prev : {}) };
                if ('category' in payload)   next.category   = payload.category || '';
                if ('priceModel' in payload) next.priceModel = payload.priceModel || 'any';
                if ('urgency' in payload)    next.urgency    = payload.urgency || '';
                if ('budgetType' in payload) next.budgetType = payload.budgetType || '';
                if ('city' in payload)       next.city       = payload.city || '';
                if ('county' in payload)     next.county     = payload.county || '';
                if ('radius' in payload)     next.radius     = payload.radius;
                return next;
            });
        }
    }, [onSearchChange, onChangeView, onChangeSort, onChangeFilters]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'services',
        viewer: viewer || null,
    });

    const autoAppliedRef = useRef(false);

    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'q', 'search', 'view', 'sort', 'category',
            'priceModel', 'urgency', 'budgetType',
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
                p: isDesktop ? { xs: 1, md: 0.75 } : { xs: 1, md: 1.25 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.12),
                bgcolor: alpha(t.palette.background.paper, 0.62),
                backdropFilter: 'saturate(140%) blur(10px)',
                backgroundImage: 'none',
                boxShadow: t.custom.shadows.md,
                overflow: 'visible',
                display: showAdvancedFilters ? 'block' : 'none',
            })}
        >
            {isDesktop && (
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                        size="small"
                        variant={fieldsExpanded ? 'contained' : 'outlined'}
                        color="primary"
                        startIcon={<TuneRoundedIcon />}
                        endIcon={fieldsExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                        onClick={() => setUserExpanded(!fieldsExpanded)}
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
                        {chipsList.length > 0 && !fieldsExpanded ? ` (${chipsList.length})` : ''}
                    </Button>

                    {chipsList.length > 0 && (
                        <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ flexWrap: 'wrap', rowGap: 0.75, alignItems: 'center', flex: 1, minWidth: 0 }}
                        >
                            {chipsList.map((chip) => (
                                <Chip
                                    key={chip.key}
                                    label={chip.label}
                                    size="small"
                                    onDelete={typeof chip.onRemove === 'function' ? chip.onRemove : (typeof chip.onClear === 'function' ? chip.onClear : undefined)}
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
                                onClick={handleClearAllCallback}
                                disabled={typeof onClearAll !== 'function' || chipsList.length === 0}
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

            <Collapse in={Boolean(showAdvancedFilters) && (!isDesktop || fieldsExpanded)} timeout={200} unmountOnExit sx={{ overflow: 'visible' }}>
                <Box sx={filterCardSx}>
                    {/* Saved filters bookmark — first child. On mobile it
                        takes the full row and right-aligns so it reads as
                        a deliberate "controls" row. On desktop it sits
                        inline as a chip. */}
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
                                tab="services"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {typeof onChangeView === 'function' && Array.isArray(viewOptions) && viewOptions.length > 0 ? (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 130px' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectSx}>
                                <InputLabel>View</InputLabel>
                                <Select
                                    label="View"
                                    value={selectedViewOption?.value || 'all'}
                                    onChange={(event) => onChangeView(event.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option =
                                            (viewOptions || []).find((item) => item.value === value) || selectedViewOption || DEFAULT_VIEW_OPTIONS[0];
                                        const IconComp = option.icon || getViewIcon(value);

                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.875rem',
                                                        fontWeight: 600,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {(viewOptions || []).map((option) => {
                                        const IconComp = option.icon || getViewIcon(option.value);
                                        return (
                                            <MenuItem key={option.value} value={option.value}>
                                                <ListItemIcon sx={{ minWidth: 26, color: 'primary.main' }}>
                                                    <IconComp fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={option.label} />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    ) : null}

                    <Box sx={{ flex: { xs: '1 1 100%', sm: '2 0 180px' }, minWidth: 0 }}>
                        <FormControl size="small" fullWidth sx={selectSx}>
                            <InputLabel shrink>Category</InputLabel>
                            <Select
                                label="Category"
                                value={safeCategory}
                                onChange={(event) => setFilterValue('category', event.target.value)}
                                displayEmpty
                                MenuProps={sharedMenuProps}
                                renderValue={(value) => {
                                    const currentValue = normalizeLabel(value);
                                    const option = categoryOptions.find((item) => item.value === currentValue) || null;
                                    const label = option?.label || ALL_CATEGORIES_LABEL;
                                    // When "All Categories" is selected, show sum of all category counts
                                    const totalListingCount = categoryOptions.reduce((sum, o) => sum + (Number.isFinite(o.count) ? o.count : 0), 0);
                                    const count = option?.count ?? totalListingCount;
                                    const IconComp = getServiceCategoryIcon(label);

                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%' }}>
                                            <IconComp sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {label}
                                            </Typography>
                                            {categoriesLoading ? <CircularProgress size={14} sx={{ ml: 'auto' }} /> : renderCountPill(count)}
                                        </Box>
                                    );
                                }}
                            >
                                <MenuItem value="">
                                    <ListItemIcon sx={{ minWidth: 30, color: 'primary.main' }}>
                                        <HandymanRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={ALL_CATEGORIES_LABEL} />
                                    {categoriesLoading ? <CircularProgress size={14} /> : renderCountPill(
                                        categoryOptions.reduce((sum, o) => sum + (Number.isFinite(o.count) ? o.count : 0), 0)
                                    )}
                                </MenuItem>
                                {categoryOptions.map((option) => {
                                    const IconComp = getServiceCategoryIcon(option.label);
                                    const hasAnyCounts = categoryOptions.some((o) => Number.isFinite(o.count) && o.count > 0);
                                    const disabled = hasAnyCounts && Number.isFinite(option.count) && option.count <= 0;
                                    return (
                                        <MenuItem key={option.value} value={option.value} disabled={disabled} sx={{ opacity: disabled ? 0.5 : 1, '&.Mui-disabled': { opacity: 0.5 } }}>
                                            <ListItemIcon sx={{ minWidth: 30, color: disabled ? 'text.disabled' : 'primary.main' }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={option.label} sx={{ color: disabled ? 'text.disabled' : 'inherit' }} />
                                            {renderCountPill(option.count)}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 120px' }, minWidth: 0 }}>
                        <FormControl size="small" fullWidth sx={selectSx}>
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                label="Sort by"
                                value={safeSort}
                                onChange={(event) => {
                                    if (typeof onChangeSort === 'function') {
                                        onChangeSort(event.target.value);
                                    }
                                }}
                                MenuProps={sharedMenuProps}
                                renderValue={(value) => {
                                    const option = activeSortOptions.find((item) => item.value === value) || activeSortOptions[0];
                                    return (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                            <SortRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {option.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {activeSortOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {!hidePricing ? (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 100px' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectSx}>
                                <InputLabel>Pricing</InputLabel>
                                <Select
                                    label="Pricing"
                                    value={safePriceModel}
                                    onChange={(event) => setFilterValue('priceModel', event.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = PRICING_OPTIONS.find((item) => item.value === value) || PRICING_OPTIONS[0];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <AttachMoneyRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {PRICING_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    ) : null}

                    {/* ── Requests-only: Timeline (urgency) dropdown ── */}
                    {isRequestsMode && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 100px' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectSx}>
                                <InputLabel shrink>Timeline</InputLabel>
                                <Select
                                    label="Timeline"
                                    value={safeUrgency}
                                    onChange={(event) => setFilterValue('urgency', event.target.value)}
                                    displayEmpty
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = URGENCY_OPTIONS.find((item) => item.value === value) || URGENCY_OPTIONS[0];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <ScheduleRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {URGENCY_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* ── Requests-only: Budget Type dropdown ── */}
                    {isRequestsMode && (
                        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 0 100px' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectSx}>
                                <InputLabel shrink>Budget</InputLabel>
                                <Select
                                    label="Budget"
                                    value={safeBudgetType}
                                    onChange={(event) => setFilterValue('budgetType', event.target.value)}
                                    displayEmpty
                                    MenuProps={sharedMenuProps}
                                    renderValue={(value) => {
                                        const option = BUDGET_TYPE_OPTIONS.find((item) => item.value === value) || BUDGET_TYPE_OPTIONS[0];
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                <AttachMoneyRoundedIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {option.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {BUDGET_TYPE_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    <Box sx={{ flex: '1 1 100%', minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 1, rowGap: { xs: 2, md: 1 } }}>
                        <Box sx={{ flex: { xs: '1 1 100%', md: '2 1 0%' }, minWidth: 0 }}>
                            <CityCountySelect
                                county={safeCounty || ALL_COUNTIES_LABEL}
                                setCounty={handleSetCounty}
                                city={safeCity || ALL_CITIES_LABEL}
                                setCity={handleSetCity}
                                allCountyValue={ALL_COUNTIES_LABEL}
                                allCityValue={ALL_CITIES_LABEL}
                                countyCounts={locationCounts?.counties}
                                cityCounts={locationCounts?.cities}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                selectSx={selectSx}
                                filterMode
                                menuProps={sharedMenuProps}
                            />
                        </Box>

                        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0%' }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectSx} disabled={!safeCounty}>
                                <InputLabel id="services-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="services-radius-select"
                                    labelId="services-radius-label"
                                    label="Radius"
                                    value={String(safeCounty ? (safeFilters.radius ?? "0") : STATEWIDE)}
                                    onChange={(e) => {
                                        if (typeof onChangeFilters !== 'function') return;
                                        onChangeFilters((prev) => {
                                            const safePrev = prev && typeof prev === 'object' ? prev : {};
                                            return { ...safePrev, radius: e.target.value };
                                        });
                                    }}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(val));
                                        const label = !safeCounty ? "All Alabama" : (opt?.label || "County only");
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                </Box>
            </Collapse>
        </Box>
    );
}
