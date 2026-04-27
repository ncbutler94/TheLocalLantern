// src/pages/marketplace/components/MarketplaceFilters.jsx
//
// Restyled to match BusinessFilterBar pattern:
//  - White outer container with border + shadow
//  - Inner bordered container with subtle gradient bg
//  - Category dropdown uses IconRow with counts (label stays OUTSIDE the dropdown)
//  - Condition / Status / Sort / County+City inline

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

import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ChildFriendlyRoundedIcon from "@mui/icons-material/ChildFriendlyRounded";
import PedalBikeRoundedIcon from "@mui/icons-material/PedalBikeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import HikingRoundedIcon from "@mui/icons-material/HikingRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import CheckroomRoundedIcon from "@mui/icons-material/CheckroomRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import YardRoundedIcon from "@mui/icons-material/YardRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import ChairRoundedIcon from "@mui/icons-material/ChairRounded";
import FaceRetouchingNaturalRoundedIcon from "@mui/icons-material/FaceRetouchingNaturalRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import SavedFiltersMenu from "../../community/SavedFiltersMenu";
import useSavedFilters from "../../community/useSavedFilters";
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    RADIUS_VALUE_WHEN_NO_COUNTY,
} from "../../../utils/geoRadius";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

// ─── Data ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
    { id: "Appliances", label: "Appliances" },
    { id: "Arts & Crafts", label: "Arts & Crafts" },
    { id: "Automotive", label: "Automotive" },
    { id: "Baby & Kids", label: "Baby & Kids" },
    { id: "Bikes & Scooters", label: "Bikes & Scooters" },
    { id: "Books & Media", label: "Books & Media" },
    { id: "Camping & Outdoors", label: "Camping & Outdoors" },
    { id: "Cell Phones", label: "Cell Phones" },
    { id: "Clothing & Shoes", label: "Clothing & Shoes" },
    { id: "Collectibles", label: "Collectibles" },
    { id: "Computers & Tablets", label: "Computers & Tablets" },
    { id: "Electronics", label: "Electronics" },
    { id: "Farm & Garden", label: "Farm & Garden" },
    { id: "Free Stuff", label: "Free Stuff" },
    { id: "Furniture", label: "Furniture" },
    { id: "Health & Beauty", label: "Health & Beauty" },
    { id: "Home Improvement", label: "Home Improvement" },
    { id: "Household", label: "Household" },
    { id: "Jewelry & Accessories", label: "Jewelry & Accessories" },
    { id: "Musical Instruments", label: "Musical Instruments" },
    { id: "Office Supplies", label: "Office Supplies" },
    { id: "Pet Supplies", label: "Pet Supplies" },
    { id: "Sporting Goods", label: "Sporting Goods" },
    { id: "Tickets", label: "Tickets" },
    { id: "Tools", label: "Tools" },
    { id: "Toys & Games", label: "Toys & Games" },
    { id: "Video Games", label: "Video Games" },
    { id: "Other", label: "Other" },
];

const CATEGORY_ICONS = {
    Appliances: KitchenRoundedIcon,
    "Arts & Crafts": PaletteRoundedIcon,
    Automotive: DirectionsCarRoundedIcon,
    "Baby & Kids": ChildFriendlyRoundedIcon,
    "Bikes & Scooters": PedalBikeRoundedIcon,
    "Books & Media": MenuBookRoundedIcon,
    "Camping & Outdoors": HikingRoundedIcon,
    "Cell Phones": SmartphoneRoundedIcon,
    "Clothing & Shoes": CheckroomRoundedIcon,
    Collectibles: EmojiEventsRoundedIcon,
    "Computers & Tablets": LaptopRoundedIcon,
    Electronics: DevicesRoundedIcon,
    "Farm & Garden": YardRoundedIcon,
    "Free Stuff": VolunteerActivismRoundedIcon,
    Furniture: ChairRoundedIcon,
    "Health & Beauty": FaceRetouchingNaturalRoundedIcon,
    "Home Improvement": HandymanRoundedIcon,
    Household: HomeRoundedIcon,
    "Jewelry & Accessories": DiamondRoundedIcon,
    "Musical Instruments": MusicNoteRoundedIcon,
    "Office Supplies": BusinessCenterRoundedIcon,
    "Pet Supplies": PetsRoundedIcon,
    "Sporting Goods": FitnessCenterRoundedIcon,
    Tickets: ConfirmationNumberRoundedIcon,
    Tools: ConstructionRoundedIcon,
    "Toys & Games": SmartToyRoundedIcon,
    "Video Games": SportsEsportsRoundedIcon,
    Other: CategoryRoundedIcon,
};

const CONDITIONS = [
    { value: "All", label: "All" },
    { value: "New", label: "New" },
    { value: "Like New", label: "Like New" },
    { value: "Good", label: "Good" },
    { value: "Fair", label: "Fair" },
    { value: "For parts", label: "For Parts" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "price_low", label: "Price: Low → High" },
    { value: "price_high", label: "Price: High → Low" },
    { value: "popular", label: "Most Popular" },
];

const YARD_SALES_SORT_OPTIONS = [
    { value: "any", label: "Any" },
    { value: "newest", label: "Newest" },
    { value: "upcoming", label: "Upcoming" },
];

const STATUS_OPTIONS = [
    { value: "available", label: "Available" },
    { value: "sold", label: "Sold" },
    { value: "all", label: "All" },
];

// View options — "My Listings" only shown when user has listings (controlled via hasMyListings prop)
const VIEW_OPTIONS_BASE = [
    { value: "all", label: "All", icon: VisibilityRoundedIcon },
    { value: "mine", label: "My Listings", icon: PersonRoundedIcon, requiresAuth: true, requiresListings: true },
    { value: "saved", label: "Saved", icon: BookmarkRoundedIcon, requiresAuth: true },
    { value: "following", label: "Following", icon: PeopleOutlineRoundedIcon, requiresAuth: true },
];

const ALL_CATEGORIES_LABEL = "All Categories";
const ALL_COUNTIES_LABEL = "All Counties";
const ALL_CITIES_LABEL = "All Cities";

// Format numbers: under 10k show full number, 10k+ use "k" format
const formatCount = (num) => {
    const n = Number(num) || 0;
    if (n < 10000) return String(n);
    if (n < 1000000) return `${Math.round(n / 1000)}k`;
    const m = n / 1000000;
    return m >= 10 ? `${Math.round(m)}M` : `${m.toFixed(1).replace(/\.0$/, "")}M`;
};

// ─── Styling: matches BusinessFilterBar exactly ─────────────────────────────

const CONTROL_SX = {
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
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "text.secondary",
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
};

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

/**
 * IconRow – matches the BusinessFilterBar / CommunityFilter pattern.
 * Icon + label on the left, optional (count) on the right.
 */
const IconRow = ({ icon: IconComp, label, muted = false, count = null, loading = false }) => (
    <Box
        sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            minWidth: 0,
            width: "100%",
            justifyContent: "space-between",
        }}
    >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            {IconComp ? (
                <IconComp
                    sx={{
                        fontSize: 20,
                        flexShrink: 0,
                        opacity: muted ? 0.45 : 1,
                        color: muted ? "text.secondary" : "primary.main",
                    }}
                />
            ) : (
                <Box sx={{ width: 20, height: 20, flexShrink: 0 }} />
            )}
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: muted ? "text.disabled" : "inherit",
                }}
            >
                {label}
            </Typography>
        </Box>
        <Box sx={{ minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {loading ? (
                <CircularProgress size={14} sx={{ color: 'primary.main' }} />
            ) : (
                <Typography
                    component="span"
                    sx={(t) => ({
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        visibility: count === null ? 'hidden' : 'visible',
                        color: muted
                            ? "text.disabled"
                            : count > 0
                                ? "primary.main"
                                : "text.secondary",
                        bgcolor: muted
                            ? "transparent"
                            : count > 0
                                ? alpha(t.palette.primary.main, 0.1)
                                : "action.hover",
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        minWidth: 28,
                        textAlign: "center",
                    })}
                >
                    {count !== null ? formatCount(count) : '0'}
                </Typography>
            )}
        </Box>
    </Box>
);

// ─── Component ──────────────────────────────────────────────────────────────

export default function MarketplaceFilters({
                                               category,
                                               onCategoryChange,
                                               condition,
                                               onConditionChange,
                                               sort,
                                               onSortChange,
                                               status,
                                               onStatusChange,
                                               city,
                                               onCityChange,
                                               county,
                                               onCountyChange,

                                               // radius
                                               radius,
                                               onRadiusChange,

                                               // View dropdown
                                               view = "all",
                                               onViewChange,
                                               hasMyListings = false,
                                               isLoggedIn = false,

                                               categoryCounts = {},
                                               categoryCountsLoading = false,

                                               locationCounts,

                                               showAdvancedFilters = true,

                                               // "marketplace" (default) or "yard-sales"
                                               mode = "marketplace",

                                               /* saved filters (slice 3) */
                                               viewer = null,
                                               searchQuery = "",
                                               onSearchQueryChange = null,
                                               showSavedFilters = true,

                                               /* in-bar reset handler */
                                               onClearAll = null,
                                           }) {
    const safeCategory = category || "";
    const safeCondition = condition || "All";
    const safeSort = sort || (mode === "yard-sales" ? "any" : "newest");
    const safeStatus = status || "available";
    const safeView = String(view || "all").toLowerCase().trim();
    const isYardSales = mode === "yard-sales";
    const activeSortOptions = isYardSales ? YARD_SALES_SORT_OPTIONS : SORT_OPTIONS;

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    //
    // Mobile keeps the field grid always-expanded (matches today's mobile
    // drawer UX). Desktop starts collapsed; compact row shows Filters
    // toggle + active chips + reset icon.
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [userExpanded, setUserExpanded] = useState(null);

    const fieldsExpanded = useMemo(() => {
        if (!isDesktop) return true;
        if (userExpanded !== null) return userExpanded;
        return false;
    }, [isDesktop, userExpanded]);

    const handleClearAll = useCallback(() => {
        if (typeof onClearAll === "function") onClearAll();
    }, [onClearAll]);

    // Build active view options — hide "My Listings" if user has none
    const viewOptions = useMemo(() => {
        return VIEW_OPTIONS_BASE.filter((opt) => {
            if (opt.requiresAuth && !isLoggedIn) return false;
            if (opt.requiresListings && !hasMyListings) return false;
            return true;
        });
    }, [isLoggedIn, hasMyListings]);

    // ── Active-filter chips for the desktop toggle row ──
    // Each chip dismisses that one filter. Yard-sales mode has fewer visible
    // dimensions, so some chips are suppressed there.
    const activeFilterChips = useMemo(() => {
        const chips = [];

        // View — active when not "all"
        if (safeView && safeView !== "all") {
            const opt = viewOptions.find((o) => o.value === safeView);
            if (opt) {
                chips.push({
                    key: "view",
                    label: `View: ${opt.label}`,
                    onClear: () => { if (typeof onViewChange === "function") onViewChange("all"); },
                });
            }
        }

        // Category (only when set & not locked to yard-sales)
        if (!isYardSales && safeCategory) {
            const cat = CATEGORIES.find((c) => c.id === safeCategory);
            chips.push({
                key: "category",
                label: `Category: ${cat?.label || safeCategory}`,
                onClear: () => { if (typeof onCategoryChange === "function") onCategoryChange(""); },
            });
        }

        // Condition — skipped in yard-sales mode
        if (!isYardSales && safeCondition && safeCondition !== "All") {
            chips.push({
                key: "condition",
                label: `Condition: ${safeCondition}`,
                onClear: () => { if (typeof onConditionChange === "function") onConditionChange("All"); },
            });
        }

        // Status — skipped in yard-sales mode (always "available" there)
        if (!isYardSales && safeStatus && safeStatus !== "available") {
            const opt = STATUS_OPTIONS.find((o) => o.value === safeStatus);
            if (opt) {
                chips.push({
                    key: "status",
                    label: `Status: ${opt.label}`,
                    onClear: () => { if (typeof onStatusChange === "function") onStatusChange("available"); },
                });
            }
        }

        // Sort — default differs by mode
        const defaultSort = isYardSales ? "any" : "newest";
        if (safeSort && safeSort !== defaultSort) {
            const opt = activeSortOptions.find((o) => o.value === safeSort);
            if (opt) {
                chips.push({
                    key: "sort",
                    label: `Sort: ${opt.label}`,
                    onClear: () => { if (typeof onSortChange === "function") onSortChange(defaultSort); },
                });
            }
        }

        // County
        if (county) {
            chips.push({
                key: "county",
                label: `County: ${county}`,
                onClear: () => {
                    if (typeof onCountyChange === "function") onCountyChange("");
                    if (typeof onCityChange === "function") onCityChange("");
                },
            });
        }

        // City
        if (city) {
            chips.push({
                key: "city",
                label: `City: ${city}`,
                onClear: () => { if (typeof onCityChange === "function") onCityChange(""); },
            });
        }

        // Radius — only meaningful when a county is selected
        if (county && radius != null &&
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
        safeView, viewOptions, onViewChange,
        isYardSales, safeCategory, onCategoryChange,
        safeCondition, onConditionChange,
        safeStatus, onStatusChange,
        safeSort, activeSortOptions, onSortChange,
        county, city, radius,
        onCountyChange, onCityChange, onRadiusChange,
    ]);

    const countyValueForUi = county || ALL_COUNTIES_LABEL;
    const cityValueForUi = city || ALL_CITIES_LABEL;

    // Compute total count across all categories
    const totalCount = useMemo(() => {
        if (!categoryCounts || typeof categoryCounts !== "object") return 0;
        return Object.values(categoryCounts).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }, [categoryCounts]);

    const getCategoryCount = (catId) => {
        const raw = categoryCounts && typeof categoryCounts === "object" ? categoryCounts[catId] : 0;
        const n = Number(raw);
        return Number.isFinite(n) ? n : 0;
    };

    // Build the category label for the renderValue display
    const categoryLabel = useMemo(() => {
        if (!safeCategory) return ALL_CATEGORIES_LABEL;
        const c = CATEGORIES.find((x) => x.id === safeCategory);
        return c?.label || "Category";
    }, [safeCategory]);

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Snapshot of current filter state. Keys MUST match the backend
    // service's ALLOWED_KEYS.marketplace schema.
    const currentFilterPayload = useMemo(() => ({
        view:      safeView || "all",
        sort:      safeSort || (mode === "yard-sales" ? "any" : "newest"),
        category:  safeCategory || "",
        condition: safeCondition || "All",
        status:    safeStatus || "available",
        city:      String(city || "").trim(),
        county:    String(county || "").trim(),
        radius:    String(radius || "").trim(),
        search:    String(searchQuery || "").trim(),
    }), [
        safeView, safeSort, safeCategory, safeCondition, safeStatus,
        city, county, radius, searchQuery, mode,
    ]);

    // Apply a saved filter. Marketplace has flat callbacks (one per
    // field), no unified filter object.
    const handleApplySavedFilter = useCallback((filter) => {
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        if ('search' in payload && typeof onSearchQueryChange === 'function') {
            onSearchQueryChange(String(payload.search || ""));
        }
        if ('view' in payload && typeof onViewChange === 'function') {
            onViewChange(payload.view || "all");
        }
        if ('sort' in payload && typeof onSortChange === 'function') {
            onSortChange(payload.sort || (mode === "yard-sales" ? "any" : "newest"));
        }
        if ('category' in payload && typeof onCategoryChange === 'function') {
            onCategoryChange(payload.category || "");
        }
        if ('condition' in payload && typeof onConditionChange === 'function') {
            onConditionChange(payload.condition || "All");
        }
        if ('status' in payload && typeof onStatusChange === 'function') {
            onStatusChange(payload.status || "available");
        }
        if ('city' in payload && typeof onCityChange === 'function') {
            onCityChange(payload.city || "");
        }
        if ('county' in payload && typeof onCountyChange === 'function') {
            onCountyChange(payload.county || "");
        }
        if ('radius' in payload && typeof onRadiusChange === 'function') {
            onRadiusChange(payload.radius);
        }
    }, [
        onSearchQueryChange, onViewChange, onSortChange, onCategoryChange,
        onConditionChange, onStatusChange, onCityChange, onCountyChange, onRadiusChange, mode,
    ]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'marketplace',
        viewer: viewer || null,
    });

    const autoAppliedRef = useRef(false);

    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'q', 'search', 'view', 'sort', 'category',
            'condition', 'status',
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
            sx={{
                position: "relative",
                zIndex: 1,
                p: isDesktop ? { xs: 1, md: 0.75 } : 1,
                '@media (min-width: 1024px)': isDesktop ? {} : { p: 1.25 },
                bgcolor: "background.paper",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: (t) => t.custom.shadows.md,
                // Hide entirely when parent explicitly sets showAdvancedFilters=false
                display: showAdvancedFilters ? "block" : "none",
            }}
        >
            {/*
             * Desktop-only compact row: "Filters" toggle + active chips + reset.
             * Mobile skips this; field grid shows directly below.
             */}
            {isDesktop && (
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

            <Collapse in={!isDesktop || fieldsExpanded} timeout={200}>
                {/* Inner field grid — border/bg/shadow stripped on desktop
                    so it reads as a single surface with the outer container */}
                <Box
                    sx={(t) => ({
                        mt: isDesktop ? 1 : 0,
                        p: isDesktop ? { xs: 1.5, md: 1 } : { xs: 1.5, md: 1.5 },
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
                        backgroundImage: isDesktop
                            ? "none"
                            : `linear-gradient(180deg, ${alpha(
                                t.palette.primary.main,
                                0.04
                            )} 0%, ${alpha(t.palette.primary.main, 0.01)} 100%)`,
                        boxShadow: isDesktop
                            ? "none"
                            : `0 10px 28px ${alpha(
                                t.palette.text.primary,
                                0.06
                            )}, inset 0 0 0 1px ${alpha(t.palette.primary.main, 0.08)}`,
                    })}
                >
                    {/* Saved filters bookmark — first child. On mobile it
                        takes the full row and right-aligns so it reads as
                        a deliberate "controls" row. On desktop it sits
                        inline as a chip. */}
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
                                tab="marketplace"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {/* View — hidden in yard-sales mode */}
                    {!isYardSales && (
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 120px" } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>View</InputLabel>
                                <Select
                                    label="View"
                                    value={viewOptions.some((o) => o.value === safeView) ? safeView : "all"}
                                    onChange={(e) => onViewChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = viewOptions.find((o) => o.value === val) || viewOptions[0];
                                        const IconComp = opt?.icon || VisibilityRoundedIcon;
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                                <IconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.875rem",
                                                        fontWeight: 600,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {opt?.label || "All"}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {viewOptions.map((opt) => {
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
                    )}

                    {/* Category dropdown — hidden in yard-sales mode */}
                    {!isYardSales && (
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "2 0 180px" } }}>
                            <FormControl
                                size="small"
                                fullWidth
                                sx={CONTROL_SX}
                            >
                                <InputLabel id="mkt-filter-cat-label" shrink>
                                    Category
                                </InputLabel>
                                <Select
                                    id="mkt-filter-cat-select"
                                    labelId="mkt-filter-cat-label"
                                    value={safeCategory}
                                    label="Category"
                                    displayEmpty
                                    onChange={(e) => onCategoryChange?.(e.target.value)}
                                    renderValue={(selected) => {
                                        if (!selected) {
                                            return (
                                                <IconRow
                                                    icon={ShoppingCartRoundedIcon}
                                                    label={ALL_CATEGORIES_LABEL}
                                                    count={totalCount}
                                                    loading={categoryCountsLoading}
                                                />
                                            );
                                        }
                                        const IconComp =
                                            CATEGORY_ICONS[selected] || CategoryRoundedIcon;
                                        const count = getCategoryCount(selected);
                                        return (
                                            <IconRow
                                                icon={IconComp}
                                                label={categoryLabel}
                                                count={count}
                                                loading={categoryCountsLoading}
                                            />
                                        );
                                    }}
                                    MenuProps={sharedMenuProps}
                                >
                                    {/* "All Categories" option */}
                                    <MenuItem value="">
                                        <IconRow
                                            icon={ShoppingCartRoundedIcon}
                                            label={ALL_CATEGORIES_LABEL}
                                            count={totalCount}
                                            loading={categoryCountsLoading}
                                        />
                                    </MenuItem>

                                    {CATEGORIES.map((c) => {
                                        const ct = getCategoryCount(c.id);
                                        const isEmpty = !categoryCountsLoading && ct === 0;
                                        const IconComp =
                                            CATEGORY_ICONS[c.id] || CategoryRoundedIcon;

                                        return (
                                            <MenuItem
                                                key={c.id}
                                                value={c.id}
                                                disabled={isEmpty}
                                            >
                                                <IconRow
                                                    icon={IconComp}
                                                    label={c.label}
                                                    muted={isEmpty}
                                                    count={ct}
                                                    loading={categoryCountsLoading}
                                                />
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Condition — hidden in yard-sales mode */}
                    {!isYardSales && (
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 110px" } }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX}>
                                <InputLabel>Condition</InputLabel>
                                <Select
                                    label="Condition"
                                    value={safeCondition}
                                    onChange={(e) => onConditionChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = CONDITIONS.find((o) => o.value === val) || CONDITIONS[0];
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                                <NewReleasesRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {opt.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {CONDITIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Status — hidden in yard-sales mode */}
                    {!isYardSales && (
                        <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 110px" } }}>
                            <FormControl
                                size="small"
                                fullWidth
                                sx={CONTROL_SX}
                            >
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={safeStatus}
                                    onChange={(e) => onStatusChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = STATUS_OPTIONS.find((o) => o.value === val) || STATUS_OPTIONS[0];
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {opt.label}
                                                </Typography>
                                            </Box>
                                        );
                                    }}
                                >
                                    {STATUS_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Sort */}
                    <Box sx={{ flex: { xs: "1 1 100%", sm: "1 0 150px" } }}>
                        <FormControl
                            size="small"
                            fullWidth
                            sx={CONTROL_SX}
                        >
                            <InputLabel>Sort by</InputLabel>
                            <Select
                                label="Sort by"
                                value={
                                    activeSortOptions.some((o) => o.value === safeSort)
                                        ? safeSort
                                        : activeSortOptions[0]?.value || "newest"
                                }
                                onChange={(e) => onSortChange?.(e.target.value)}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = activeSortOptions.find((o) => o.value === val) || activeSortOptions[0];
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
                                {activeSortOptions.map((opt) => (
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
                                countyCounts={locationCounts?.counties}
                                cityCounts={locationCounts?.cities}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                selectSx={CONTROL_SX}
                                filterMode
                            />
                        </Box>

                        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0%" }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={CONTROL_SX} disabled={!county}>
                                <InputLabel id="marketplace-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="marketplace-radius-select"
                                    labelId="marketplace-radius-label"
                                    label="Radius"
                                    value={String(county ? (radius ?? "0") : STATEWIDE)}
                                    onChange={(e) => onRadiusChange?.(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = RADIUS_OPTIONS.find((o) => String(o.value) === String(val));
                                        const label = !county ? "All Alabama" : (opt?.label || "County only");
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
                </Box>
            </Collapse>
        </Box>
    );
}