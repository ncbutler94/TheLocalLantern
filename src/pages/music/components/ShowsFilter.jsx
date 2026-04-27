import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Box,
    CircularProgress,
    Collapse,
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

import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import WeekendRoundedIcon from "@mui/icons-material/WeekendRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PianoRoundedIcon from "@mui/icons-material/PianoRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import FestivalRoundedIcon from "@mui/icons-material/FestivalRounded";
import NightlifeRoundedIcon from "@mui/icons-material/NightlifeRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import AlbumRoundedIcon from "@mui/icons-material/AlbumRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import SavedFiltersMenu from "../../community/SavedFiltersMenu";
import useSavedFilters from "../../community/useSavedFilters";

const VIEW_OPTIONS = [
    { value: "all", label: "All" },
    { value: "mine", label: "My Events" },
    { value: "going", label: "Going" },
    { value: "interested", label: "Interested" },
    { value: "friends-going", label: "Friends Going" },
    { value: "friends-interested", label: "Friends Interested" },
];

const DATE_PRESETS = [
    { value: "all", label: "All Upcoming", icon: EventAvailableRoundedIcon },
    { value: "today", label: "Today", icon: TodayRoundedIcon },
    { value: "weekend", label: "This Weekend", icon: WeekendRoundedIcon },
    { value: "week", label: "This Week", icon: DateRangeRoundedIcon },
    { value: "month", label: "This Month", icon: CalendarMonthRoundedIcon },
    { value: "year", label: "This Year", icon: CalendarMonthRoundedIcon },
    { value: "past", label: "Past Events", icon: HistoryRoundedIcon },
];

const SORT_OPTIONS = [
    { value: "soonest", label: "Upcoming" },
    { value: "trending", label: "Trending" },
    { value: "recent", label: "Recently Added" },
];

const ALL_CATEGORIES_LABEL = "All Categories";

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function toTitleLabel(value) {
    return normalizeStr(value)
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getCategoryIcon(categoryLabel) {
    const value = normalizeStr(categoryLabel).toLowerCase();

    if (!value) return MusicNoteRoundedIcon;
    if (value.includes("dj") || value.includes("dance") || value.includes("club") || value.includes("party")) {
        return NightlifeRoundedIcon;
    }
    if (value.includes("band") || value.includes("showcase") || value.includes("lineup")) {
        return QueueMusicRoundedIcon;
    }
    if (value.includes("concert") || value.includes("live") || value.includes("performance") || value.includes("show")) {
        return MicRoundedIcon;
    }
    if (value.includes("acoustic") || value.includes("piano") || value.includes("keys") || value.includes("classical")) {
        return PianoRoundedIcon;
    }
    if (value.includes("festival") || value.includes("fair") || value.includes("outdoor")) {
        return FestivalRoundedIcon;
    }
    if (value.includes("jam") || value.includes("session") || value.includes("sound") || value.includes("audio")) {
        return GraphicEqRoundedIcon;
    }
    if (value.includes("album") || value.includes("release") || value.includes("record")) {
        return AlbumRoundedIcon;
    }
    if (value.includes("celebration") || value.includes("holiday") || value.includes("special")) {
        return CelebrationRoundedIcon;
    }
    if (value.includes("choir") || value.includes("worship") || value.includes("gospel") || value.includes("hymn")) {
        return LibraryMusicRoundedIcon;
    }

    return MusicNoteRoundedIcon;
}

function CountBadge({ count, loading = false }) {
    if (loading) {
        return <CircularProgress size={14} sx={{ color: "primary.main" }} />;
    }
    const isLoaded = count !== null && count !== undefined;

    return (
        <Typography
            component="span"
            sx={(theme) => ({
                fontSize: '0.75rem',
                fontWeight: 700,
                visibility: isLoaded ? 'visible' : 'hidden',
                color: count > 0 ? "primary.main" : "text.secondary",
                bgcolor: count > 0 ? alpha(theme.palette.primary.main, 0.1) : "action.hover",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                minWidth: 28,
                textAlign: "center",
            })}
        >
            {isLoaded ? count : '0'}
        </Typography>
    );
}

function CategoryRow({ icon: IconComp, label, count = null, muted = false, loading = false }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                {IconComp ? (
                    <IconComp
                        sx={{
                            fontSize: 20,
                            flexShrink: 0,
                            color: muted ? "text.disabled" : "primary.main",
                            opacity: muted ? 0.45 : 1,
                        }}
                    />
                ) : null}

                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: muted ? "text.disabled" : "inherit",
                    }}
                >
                    {label}
                </Typography>
            </Box>

            <CountBadge count={count} loading={loading} />
        </Box>
    );
}

// ── Stable style constants outside the component (no useTheme needed) ──
const sharedMenuProps = Object.freeze({
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
});

const controlSx = Object.freeze({
    "& .MuiOutlinedInput-root": {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === "dark";
            const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: "saturate(140%) blur(10px)",
        minHeight: 40,
        overflow: "hidden",
        "& fieldset": {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === "dark" ? 0.18 : 0.14),
        },
        "&:hover fieldset": {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === "dark" ? 0.28 : 0.22),
        },
        "&.Mui-focused fieldset": {
            borderWidth: 1,
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
        fontSize: "0.875rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
    },
    "& .MuiInputBase-input": {
        fontWeight: 700,
        letterSpacing: "-0.01em",
    },
});

export default function ShowsFilter({
                                        view = "all",
                                        onViewChange,
                                        datePreset = "all",
                                        onDatePresetChange,
                                        category = "",
                                        onCategoryChange,
                                        categoryOptions = [],
                                        totalCount = 0,
                                        countsLoading = false,
                                        sort = "any",
                                        onSortChange,
                                        county = "All Counties",
                                        onCountyChange,
                                        city = "All Cities",
                                        onCityChange,
                                        // Radius is tracked by the page but not exposed in
                                        // this filter's UI yet. We still accept + restore it
                                        // via saved filters so the page's radius state stays
                                        // in sync when a filter is applied.
                                        radius,
                                        onRadiusChange,
                                        showAdvancedFilters = true,

                                        // Location counts for county/city badge display
                                        locationCounts = null,

                                        /* saved filters (slice 3) */
                                        viewer = null,
                                        searchQuery = "",
                                        onSearchQueryChange = null,
                                        showSavedFilters = true,

                                        /* in-bar reset handler */
                                        onClearAll = null,
                                    }) {

    const safeView = VIEW_OPTIONS.some((option) => option.value === view) ? view : "all";
    const safeDatePreset = DATE_PRESETS.some((preset) => preset.value === datePreset) ? datePreset : "all";
    const safeSort = SORT_OPTIONS.some((option) => option.value === sort) ? sort : "soonest";

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

    const countyNorm = (county && county !== "All Counties") ? String(county) : "";
    const cityNorm = (city && city !== "All Cities") ? String(city) : "";

    const handleClearAllCallback = useCallback(() => {
        if (typeof onClearAll === "function") onClearAll();
    }, [onClearAll]);

    const normalizedCategoryOptions = useMemo(() => {
        return (Array.isArray(categoryOptions) ? categoryOptions : [])
            .map((option) => {
                if (typeof option === "string") {
                    return {
                        value: normalizeStr(option),
                        label: toTitleLabel(option),
                        count: 0,
                    };
                }

                if (option && typeof option === "object") {
                    const rawValue = normalizeStr(option.value ?? option.slug ?? option.id ?? "");
                    const rawLabel = normalizeStr(option.label ?? option.name ?? option.title ?? option.value ?? option.slug ?? option.id ?? "");

                    return {
                        value: rawValue,
                        label: rawLabel || toTitleLabel(rawValue),
                        count: Number(option.count || 0),
                    };
                }

                return null;
            })
            .filter((option) => option && option.value && option.label);
    }, [categoryOptions]);

    const activeFilterChips = useMemo(() => {
        const chips = [];

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

        if (safeDatePreset && safeDatePreset !== "all") {
            const opt = DATE_PRESETS.find((o) => o.value === safeDatePreset);
            if (opt) {
                chips.push({
                    key: "datePreset",
                    label: `When: ${opt.label}`,
                    onClear: () => { if (typeof onDatePresetChange === "function") onDatePresetChange("all"); },
                });
            }
        }

        if (category) {
            const opt = normalizedCategoryOptions.find((o) => o.value === category);
            chips.push({
                key: "category",
                label: `Category: ${opt?.label || category}`,
                onClear: () => { if (typeof onCategoryChange === "function") onCategoryChange(""); },
            });
        }

        if (safeSort && safeSort !== "soonest") {
            const opt = SORT_OPTIONS.find((o) => o.value === safeSort);
            if (opt) {
                chips.push({
                    key: "sort",
                    label: `Sort: ${opt.label}`,
                    onClear: () => { if (typeof onSortChange === "function") onSortChange("soonest"); },
                });
            }
        }

        if (countyNorm) {
            chips.push({
                key: "county",
                label: `County: ${countyNorm}`,
                onClear: () => {
                    if (typeof onCountyChange === "function") onCountyChange("All Counties");
                    if (typeof onCityChange === "function") onCityChange("All Cities");
                },
            });
        }

        if (cityNorm) {
            chips.push({
                key: "city",
                label: `City: ${cityNorm}`,
                onClear: () => { if (typeof onCityChange === "function") onCityChange("All Cities"); },
            });
        }

        return chips;
    }, [
        safeView, onViewChange,
        safeDatePreset, onDatePresetChange,
        category, normalizedCategoryOptions, onCategoryChange,
        safeSort, onSortChange,
        countyNorm, cityNorm, onCountyChange, onCityChange,
    ]);

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Snapshot of current filter state. Keys MUST match the backend
    // service's ALLOWED_KEYS.shows schema (see savedFiltersService.js).
    const currentFilterPayload = useMemo(() => {
        const normalizedCity = city === "All Cities" ? "" : String(city || "").trim();
        const normalizedCounty = county === "All Counties" ? "" : String(county || "").trim();
        const normalizedRadius = String(radius || "").trim();

        return {
            view:       safeView || "all",
            datePreset: safeDatePreset || "all",
            sort:       safeSort || "soonest",
            category:   String(category || "").trim(),
            city:       normalizedCity,
            county:     normalizedCounty,
            radius:     normalizedRadius,
            search:     String(searchQuery || "").trim(),
        };
    }, [safeView, safeDatePreset, safeSort, category, city, county, radius, searchQuery]);

    const handleApplySavedFilter = useCallback((filter) => {
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        if ('search' in payload && typeof onSearchQueryChange === 'function') {
            onSearchQueryChange(String(payload.search || ""));
        }
        if ('view' in payload && typeof onViewChange === 'function') {
            onViewChange(payload.view || "all");
        }
        if ('datePreset' in payload && typeof onDatePresetChange === 'function') {
            onDatePresetChange(payload.datePreset || "all");
        }
        if ('sort' in payload && typeof onSortChange === 'function') {
            onSortChange(payload.sort || "soonest");
        }
        if ('category' in payload && typeof onCategoryChange === 'function') {
            onCategoryChange(payload.category || "");
        }
        if ('city' in payload && typeof onCityChange === 'function') {
            // Pass raw string; the CityCountySelect normalizes "" to
            // "All Cities" on display.
            onCityChange(payload.city || "");
        }
        if ('county' in payload && typeof onCountyChange === 'function') {
            onCountyChange(payload.county || "");
        }
        if ('radius' in payload && typeof onRadiusChange === 'function') {
            onRadiusChange(payload.radius);
        }
    }, [
        onSearchQueryChange, onViewChange, onDatePresetChange, onSortChange,
        onCategoryChange, onCityChange, onCountyChange, onRadiusChange,
    ]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'shows',
        viewer: viewer || null,
    });

    const autoAppliedRef = useRef(false);

    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'q', 'search', 'view', 'sort', 'category',
            'datePreset', 'city', 'county', 'counties', 'radius',
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
                p: isDesktop ? { xs: 1, md: 0.75 } : 1,
                '@media (min-width: 1024px)': isDesktop ? {} : { p: 1.25 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.12),
                bgcolor: alpha(t.palette.background.paper, 0.62),
                color: t.palette.text.primary,
                backdropFilter: "saturate(140%) blur(10px)",
                backgroundImage: "none",
                boxShadow: t.custom?.shadows?.md || "none",
                display: showAdvancedFilters ? "block" : "none",
            })}
        >
            {isDesktop && (
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
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
                            sx={{ flexWrap: "wrap", rowGap: 0.75, alignItems: "center", flex: 1, minWidth: 0 }}
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
                                onClick={handleClearAllCallback}
                                disabled={typeof onClearAll !== "function" || activeFilterChips.length === 0}
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

            <Collapse in={Boolean(showAdvancedFilters) && (!isDesktop || fieldsExpanded)} timeout={200} unmountOnExit>
                <Box
                    sx={(t) => ({
                        mt: isDesktop ? 1 : 0,
                        p: isDesktop ? { xs: 1.5, md: 1 } : { xs: 1.5, md: 1.5 },
                        '@media (min-width: 1024px)': isDesktop ? {} : { p: 1.5 },
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1,
                        rowGap: { xs: 2, md: 1.25 },
                        alignItems: "center",
                        "&::-webkit-scrollbar": { display: "none" },
                        scrollbarWidth: "none",
                        border: isDesktop ? "none" : "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.14),
                        borderRadius: 2.5,
                        bgcolor: isDesktop ? "transparent" : alpha(t.palette.background.default, 0.92),
                        color: t.palette.text.primary,
                        backgroundImage: isDesktop ? "none" : `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(
                            t.palette.primary.main,
                            0.01
                        )} 100%)`,
                        boxShadow: isDesktop ? "none" : `0 10px 28px ${alpha(t.palette.text.primary, 0.06)}, inset 0 0 0 1px ${alpha(
                            t.palette.primary.main,
                            0.08
                        )}`,
                    })}
                >
                    {/* Saved filters bookmark — first child. Full-width
                        right-aligned row on mobile, inline chip on desktop. */}
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
                                tab="shows"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 120px" } }}>
                        <FormControl size="small" fullWidth sx={controlSx}>
                            <InputLabel>View</InputLabel>
                            <Select
                                label="View"
                                value={safeView}
                                onChange={(event) => onViewChange?.(event.target.value)}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = VIEW_OPTIONS.find((o) => o.value === val) || VIEW_OPTIONS[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                            <MusicNoteRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {VIEW_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ flex: { xs: "1 1 100%", sm: "2 0 180px" } }}>
                        <FormControl size="small" fullWidth sx={controlSx}>
                            <InputLabel id="music-shows-category-label" shrink>
                                Category
                            </InputLabel>
                            <Select
                                id="music-shows-category-select"
                                labelId="music-shows-category-label"
                                label="Category"
                                value={category}
                                onChange={(event) => onCategoryChange?.(event.target.value)}
                                MenuProps={sharedMenuProps}
                                displayEmpty
                                renderValue={(selectedValue) => {
                                    const selected = normalizeStr(selectedValue);
                                    if (!selected) {
                                        return (
                                            <CategoryRow
                                                icon={MusicNoteRoundedIcon}
                                                label={ALL_CATEGORIES_LABEL}
                                                count={Number(totalCount || 0)}
                                                loading={countsLoading}
                                            />
                                        );
                                    }

                                    const found = normalizedCategoryOptions.find((option) => option.value === selected);
                                    const label = found?.label || toTitleLabel(selected);
                                    const IconComp = getCategoryIcon(label);

                                    return (
                                        <CategoryRow
                                            icon={IconComp}
                                            label={label}
                                            count={Number(found?.count || 0)}
                                            loading={countsLoading}
                                        />
                                    );
                                }}
                            >
                                <MenuItem value="">
                                    <CategoryRow
                                        icon={MusicNoteRoundedIcon}
                                        label={ALL_CATEGORIES_LABEL}
                                        count={Number(totalCount || 0)}
                                        loading={countsLoading}
                                    />
                                </MenuItem>

                                {normalizedCategoryOptions.map((option) => {
                                    const IconComp = getCategoryIcon(option.label);
                                    const disabled = !countsLoading && Number(option.count || 0) <= 0;

                                    return (
                                        <MenuItem key={option.value} value={option.value} disabled={disabled}>
                                            <CategoryRow
                                                icon={IconComp}
                                                label={option.label}
                                                count={Number(option.count || 0)}
                                                muted={disabled}
                                                loading={countsLoading}
                                            />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 140px" } }}>
                        <FormControl size="small" fullWidth sx={controlSx}>
                            <InputLabel>Date Range</InputLabel>
                            <Select
                                label="Date Range"
                                value={safeDatePreset}
                                onChange={(event) => onDatePresetChange?.(event.target.value)}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = DATE_PRESETS.find((o) => o.value === val) || DATE_PRESETS[0];
                                    const IconComp = opt.icon || DateRangeRoundedIcon;
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
                                {DATE_PRESETS.map((preset) => {
                                    const IconComp = preset.icon;

                                    return (
                                        <MenuItem key={preset.value} value={preset.value}>
                                            <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                                <IconComp fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary={preset.label} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 130px" } }}>
                        <FormControl size="small" fullWidth sx={controlSx}>
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                label="Sort by"
                                value={safeSort}
                                onChange={(event) => onSortChange?.(event.target.value)}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = SORT_OPTIONS.find((o) => o.value === val) || SORT_OPTIONS[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                            <SortRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                            <SortRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={option.label} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ flex: "1 1 100%", minWidth: 0 }}>
                        <CityCountySelect
                            county={county}
                            setCounty={onCountyChange}
                            city={city}
                            setCity={onCityChange}
                            countyCounts={locationCounts?.counties || null}
                            cityCounts={locationCounts?.cities || null}
                            allCountyValue="All Counties"
                            allCityValue="All Cities"
                            emptyCountyLabel="County"
                            emptyCityLabel="City"
                            sx={{ mt: 0 }}
                            selectSx={controlSx}
                            filterMode
                        />
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}
