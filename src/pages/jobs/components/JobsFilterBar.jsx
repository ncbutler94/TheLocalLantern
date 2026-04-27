// src/pages/jobs/components/JobsFilterBar.jsx
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
import CityCountySelect from "../../../components/CityCountySelect";
import SavedFiltersMenu from "../../community/SavedFiltersMenu";
import useSavedFilters from "../../community/useSavedFilters";
import {
    RADIUS_OPTIONS,
    STATEWIDE,
    RADIUS_VALUE_WHEN_NO_COUNTY,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from "../../../utils/geoRadius";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AgricultureRoundedIcon from "@mui/icons-material/AgricultureRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";

/**
 * JobsFilterBar
 * - Community-style single filter row (matches EventsFilters pattern)
 * - Uses FormControl + Select + InputLabel with pill-shaped inputs
 * - Category dropdown uses DB-driven categories + counts
 *   - Shows icon + label + count badge
 *   - Disables (grays) categories with 0 results
 *
 * NOTE:
 * The underlying filters shape still uses arrays for jobTypes/workModes.
 * Job type + Arrangement are single-select dropdowns:
 *   - "All" => []
 *   - Specific => [value]
 */
const CATEGORY_ICON_BY_SLUG = {
    "administrative-office": BusinessCenterRoundedIcon,
    "accounting-finance": AccountBalanceRoundedIcon,
    "sales-business-development": TrendingUpRoundedIcon,
    "customer-service-support": SupportAgentRoundedIcon,
    "marketing-creative-communications": CampaignRoundedIcon,
    "technology-data": MemoryRoundedIcon,
    healthcare: LocalHospitalRoundedIcon,
    "education-childcare": SchoolRoundedIcon,
    "skilled-trades-maintenance": HandymanRoundedIcon,
    "construction-contracting": ConstructionRoundedIcon,
    "manufacturing-production": PrecisionManufacturingRoundedIcon,
    "warehouse-transportation-logistics": LocalShippingRoundedIcon,
    "hospitality-food-service": RestaurantRoundedIcon,
    "retail-merchandising": StorefrontRoundedIcon,
    "cleaning-security-general-labor": CleaningServicesRoundedIcon,
    "professional-services": GavelRoundedIcon,
    "government-public-safety-community": GppGoodRoundedIcon,
    "nonprofit-social-services": VolunteerActivismRoundedIcon,
    "agriculture-outdoor-environmental": AgricultureRoundedIcon,
    other: CategoryRoundedIcon,
};

const normalizeStr = (v) => String(v ?? "").trim();
const normalizeKey = (v) => normalizeStr(v).toLowerCase();

const getCategoryIcon = (cat) => {
    const slug = normalizeKey(cat?.slug || "");
    if (slug && CATEGORY_ICON_BY_SLUG[slug]) return CATEGORY_ICON_BY_SLUG[slug];

    const name = normalizeKey(cat?.name || "");
    if (!name) return CategoryRoundedIcon;

    if (name.includes("administrative") || name.includes("office")) return BusinessCenterRoundedIcon;
    if (name.includes("accounting") || name.includes("finance")) return AccountBalanceRoundedIcon;
    if (name.includes("sales") || name.includes("business development")) return TrendingUpRoundedIcon;
    if (name.includes("customer service") || name.includes("support")) return SupportAgentRoundedIcon;
    if (name.includes("marketing") || name.includes("creative") || name.includes("communications")) return CampaignRoundedIcon;
    if (name.includes("technology") || name.includes("data") || name.includes("it")) return MemoryRoundedIcon;
    if (name.includes("health")) return LocalHospitalRoundedIcon;
    if (name.includes("education") || name.includes("childcare")) return SchoolRoundedIcon;
    if (name.includes("trades") || name.includes("maintenance")) return HandymanRoundedIcon;
    if (name.includes("construction")) return ConstructionRoundedIcon;
    if (name.includes("manufacturing") || name.includes("production")) return PrecisionManufacturingRoundedIcon;
    if (name.includes("warehouse") || name.includes("logistics") || name.includes("transportation")) return LocalShippingRoundedIcon;
    if (name.includes("hospitality") || name.includes("food")) return RestaurantRoundedIcon;
    if (name.includes("retail") || name.includes("merchandising")) return StorefrontRoundedIcon;
    if (name.includes("cleaning") || name.includes("security") || name.includes("general labor")) return CleaningServicesRoundedIcon;
    if (name.includes("professional")) return GavelRoundedIcon;
    if (name.includes("government") || name.includes("public safety")) return GppGoodRoundedIcon;
    if (name.includes("nonprofit") || name.includes("social services")) return VolunteerActivismRoundedIcon;
    if (name.includes("agriculture") || name.includes("outdoor") || name.includes("environment")) return AgricultureRoundedIcon;

    return CategoryRoundedIcon;
};

const buildFallbackCategories = () => [
    { slug: "administrative-office", name: "Administrative & Office", count: 0 },
    { slug: "accounting-finance", name: "Accounting & Finance", count: 0 },
    { slug: "sales-business-development", name: "Sales & Business Development", count: 0 },
    { slug: "customer-service-support", name: "Customer Service & Support", count: 0 },
    { slug: "marketing-creative-communications", name: "Marketing, Creative & Communications", count: 0 },
    { slug: "technology-data", name: "Technology & Data", count: 0 },
    { slug: "healthcare", name: "Healthcare", count: 0 },
    { slug: "education-childcare", name: "Education & Childcare", count: 0 },
    { slug: "skilled-trades-maintenance", name: "Skilled Trades & Maintenance", count: 0 },
    { slug: "construction-contracting", name: "Construction & Contracting", count: 0 },
    { slug: "manufacturing-production", name: "Manufacturing & Production", count: 0 },
    { slug: "warehouse-transportation-logistics", name: "Warehouse, Transportation & Logistics", count: 0 },
    { slug: "hospitality-food-service", name: "Hospitality & Food Service", count: 0 },
    { slug: "retail-merchandising", name: "Retail & Merchandising", count: 0 },
    { slug: "cleaning-security-general-labor", name: "Cleaning, Security & General Labor", count: 0 },
    { slug: "professional-services", name: "Professional Services", count: 0 },
    { slug: "government-public-safety-community", name: "Government, Public Safety & Community", count: 0 },
    { slug: "nonprofit-social-services", name: "Nonprofit & Social Services", count: 0 },
    { slug: "agriculture-outdoor-environmental", name: "Agriculture, Outdoor & Environmental", count: 0 },
    { slug: "other", name: "Other", count: 0 },
];

const VIEW_OPTIONS = [
    { value: "all", label: "All Jobs", icon: VisibilityRoundedIcon },
    { value: "saved", label: "Saved Jobs", icon: BookmarkBorderRoundedIcon },
    { value: "applied", label: "Applied Jobs", icon: AssignmentTurnedInRoundedIcon },
];

const MY_LISTINGS_STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "all", label: "All" },
];

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "expiring", label: "Expiring Soon" },
];

const JOB_TYPE_OPTIONS = [
    { value: "All", label: "All" },
    { value: "FT", label: "Full-time" },
    { value: "PT", label: "Part-time" },
    { value: "Contract", label: "Contract" },
    { value: "Temp", label: "Temporary" },
];

const WORK_MODE_OPTIONS = [
    { value: "All", label: "All" },
    { value: "On-site", label: "On-site" },
    { value: "Hybrid", label: "Hybrid" },
    { value: "Remote", label: "Remote" },
];

const SALARY_RANGE_OPTIONS = [
    { value: "All", label: "All" },
    { value: "0-25000", label: "Under $25k" },
    { value: "25000-40000", label: "$25k – $40k" },
    { value: "40000-60000", label: "$40k – $60k" },
    { value: "60000-80000", label: "$60k – $80k" },
    { value: "80000-100000", label: "$80k – $100k" },
    { value: "100000-150000", label: "$100k – $150k" },
    { value: "150000-0", label: "$150k+" },
];

const ALL_CATEGORIES_LABEL = "All Categories";

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
            borderRadius: 2.5,
            overflow: "auto",
            backgroundImage: "none",
            border: "1px solid",
            borderColor: alpha(t.palette.primary.main, 0.12),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            maxHeight: 340,
            '& .MuiMenuItem-root': {
                minHeight: 42,
                fontSize: '0.875rem',
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
                '& .MuiMenuItem-root': {
                    minHeight: 48,
                    fontSize: '1rem',
                    fontWeight: 600,
                },
            },
        }),
    },
};

const selectPillSx = {
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
};

const filterCardSx = (t) => ({
    p: { xs: 1.5, md: 1.15 }, '@media (min-width: 1024px)': { p: 1.4 },
    display: "flex",
    flexWrap: "wrap",
    gap: 1.25,
    rowGap: { xs: 2, md: 1.5 },
    alignItems: "center",
    border: "1px solid",
    borderColor: alpha(t.palette.primary.main, 0.14),
    borderRadius: 3,
    bgcolor: alpha(t.palette.background.default, 0.92),
    backgroundImage: `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.04)} 0%, ${alpha(
        t.palette.primary.main,
        0.01
    )} 100%)`,
    boxShadow: `0 10px 28px ${alpha(t.palette.text.primary, 0.06)}, inset 0 0 0 1px ${alpha(
        t.palette.primary.main,
        0.08
    )}`,
    "&::-webkit-scrollbar": { display: "none" },
    scrollbarWidth: "none",
});

export default function JobsFilterBar({
                                          filters,
                                          onChangeFilters,
                                          compactChrome = false,

                                          // DB-driven categories + counts
                                          categories = [],
                                          categoriesLoading = false,
                                          categoriesError = null,

                                          // My Jobs mode
                                          isMyMode = false,
                                          myJobsStatus = "active",
                                          onMyJobsStatusChange,

                                          // View control
                                          view = "all",
                                          onViewChange,

                                          // Sort control
                                          sort = "newest",
                                          onSortChange,

                                          // UI
                                          showAdvancedFilters = true,

                                          // Location counts for county/city badge display
                                          locationCounts = null,

                                          /* saved filters (slice 3) */
                                          viewer = null,
                                          search = "",
                                          onSearchChange = null,
                                          showSavedFilters = true,

                                          /* reset-all handler — called by in-bar reset icon */
                                          onClearAll = null,
                                      }) {
    const { jobTypes, workModes, category, city, county, radius, statewideOnly, salaryRange } = filters;

    const safeJobTypes = Array.isArray(jobTypes) ? jobTypes : [];
    const safeWorkModes = Array.isArray(workModes) ? workModes : [];
    const selectedJobType = safeJobTypes.length ? String(safeJobTypes[0]) : "All";
    const selectedWorkArrangement = safeWorkModes.length ? String(safeWorkModes[0]) : "All";
    const selectedSalaryRange = String(salaryRange || "All");
    const locationDisabled = Boolean(statewideOnly);

    const safeView = VIEW_OPTIONS.some((o) => o.value === view) ? view : "all";

    const activeSortOptions = isMyMode
        ? SORT_OPTIONS
        : SORT_OPTIONS.filter((o) => o.value !== "expiring");

    const safeSort = activeSortOptions.some((o) => o.value === sort) ? sort : "newest";

    // ───────────────────────────────────────────────────────────────────────
    // Collapse-by-default + active-filter chips (desktop only).
    //
    // Mobile keeps the field grid always-expanded (matches today's mobile
    // drawer UX). On desktop the grid starts collapsed; users see a compact
    // row with the "Filters" toggle, active chips, and a reset icon.
    // ───────────────────────────────────────────────────────────────────────
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const [userExpanded, setUserExpanded] = useState(null);

    const fieldsExpanded = useMemo(() => {
        if (!isDesktop) return true;
        if (userExpanded !== null) return userExpanded;
        return false;
    }, [isDesktop, userExpanded]);

    // Desktop-aware filter-grid styling. Strips the inner box's redundant
    // border/background/shadow on desktop (container already provides them)
    // to avoid the box-in-a-box look.
    const reactiveFilterCardSx = useCallback(
        (t) => ({
            p: isDesktop ? { xs: 1.5, md: 1 } : { xs: 1.5, md: 1.15 },
            display: "flex",
            flexWrap: "wrap",
            gap: 1.25,
            rowGap: { xs: 2, md: 1.25 },
            alignItems: "center",
            border: isDesktop ? "none" : "1px solid",
            borderColor: alpha(t.palette.primary.main, 0.14),
            borderRadius: 3,
            bgcolor: isDesktop ? "transparent" : alpha(t.palette.background.default, 0.92),
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
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
        }),
        [isDesktop]
    );

    // ── Active-filter chips for the compact toggle row (desktop only) ──
    // Each chip dismisses just that one filter. "My Jobs" mode has slightly
    // different semantics; we treat its status dropdown like any other chip.
    const activeFilterChips = useMemo(() => {
        const chips = [];

        // View — only when not "all" AND not in My Jobs mode (mode is controlled elsewhere)
        if (!isMyMode && safeView && safeView !== "all") {
            const opt = VIEW_OPTIONS.find((o) => o.value === safeView);
            if (opt) {
                chips.push({
                    key: "view",
                    label: `View: ${opt.label}`,
                    onClear: () => { if (typeof onViewChange === "function") onViewChange("all"); },
                });
            }
        }

        // Sort — active when not the default
        const DEFAULT_SORT = "newest";
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

        // Category
        if (category) {
            const catList = Array.isArray(categories) ? categories : [];
            const cat = catList.find((r) => r?.slug === category || r?.id === category);
            chips.push({
                key: "category",
                label: `Category: ${cat?.name || category}`,
                onClear: () => {
                    if (typeof onChangeFilters === "function") {
                        onChangeFilters({ ...filters, category: "" });
                    }
                },
            });
        }

        // Job type (single-select UX; first non-All value shown)
        if (safeJobTypes.length && selectedJobType !== "All") {
            const opt = JOB_TYPE_OPTIONS.find((o) => o.value === selectedJobType);
            chips.push({
                key: "job-type",
                label: `Type: ${opt?.label || selectedJobType}`,
                onClear: () => {
                    if (typeof onChangeFilters === "function") {
                        onChangeFilters({ ...filters, jobTypes: [] });
                    }
                },
            });
        }

        // Work arrangement
        if (safeWorkModes.length && selectedWorkArrangement !== "All") {
            const opt = WORK_MODE_OPTIONS.find((o) => o.value === selectedWorkArrangement);
            chips.push({
                key: "work-mode",
                label: `Work: ${opt?.label || selectedWorkArrangement}`,
                onClear: () => {
                    if (typeof onChangeFilters === "function") {
                        onChangeFilters({ ...filters, workModes: [] });
                    }
                },
            });
        }

        // Salary range
        if (selectedSalaryRange && selectedSalaryRange !== "All") {
            const opt = SALARY_RANGE_OPTIONS.find((o) => o.value === selectedSalaryRange);
            chips.push({
                key: "salary",
                label: `Salary: ${opt?.label || selectedSalaryRange}`,
                onClear: () => {
                    if (typeof onChangeFilters === "function") {
                        onChangeFilters({ ...filters, salaryRange: "All" });
                    }
                },
            });
        }

        // County
        if (county) {
            chips.push({
                key: "county",
                label: `County: ${county}`,
                onClear: () => {
                    if (typeof onChangeFilters === "function") {
                        onChangeFilters({ ...filters, county: "", city: "" });
                    }
                },
            });
        }

        // City
        if (city) {
            chips.push({
                key: "city",
                label: `City: ${city}`,
                onClear: () => {
                    if (typeof onChangeFilters === "function") {
                        onChangeFilters({ ...filters, city: "" });
                    }
                },
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
                        if (typeof onChangeFilters === "function") {
                            onChangeFilters({ ...filters, radius: RADIUS_VALUE_WHEN_NO_COUNTY });
                        }
                    },
                });
            }
        }

        // My Jobs status — only shown when in My Jobs mode
        if (isMyMode && myJobsStatus && myJobsStatus !== "active") {
            const opt = MY_LISTINGS_STATUS_OPTIONS.find((o) => o.value === myJobsStatus);
            if (opt) {
                chips.push({
                    key: "my-status",
                    label: `Status: ${opt.label}`,
                    onClear: () => {
                        if (typeof onMyJobsStatusChange === "function") onMyJobsStatusChange("active");
                    },
                });
            }
        }

        return chips;
    }, [
        isMyMode, safeView, onViewChange,
        safeSort, activeSortOptions, onSortChange,
        category, categories, filters, onChangeFilters,
        safeJobTypes, selectedJobType, safeWorkModes, selectedWorkArrangement, selectedSalaryRange,
        county, city, radius,
        myJobsStatus, onMyJobsStatusChange,
    ]);

    const handleClearAll = useCallback(() => {
        if (typeof onClearAll === "function") onClearAll();
    }, [onClearAll]);

    const rows = useMemo(() => {
        const arr = Array.isArray(categories) ? categories : [];
        if (!arr.length) return buildFallbackCategories();

        return arr
            .map((c) => ({
                id: c.id,
                slug: normalizeStr(c.slug),
                name: normalizeStr(c.name),
                count: Number(c.count) || 0,
                sortOrder: Number(c.sortOrder) || 0,
            }))
            .sort((a, b) => {
                const ao = Number(a.sortOrder) || 0;
                const bo = Number(b.sortOrder) || 0;
                if (ao !== bo) return ao - bo;
                return String(a.name).localeCompare(String(b.name));
            });
    }, [categories]);

    const totalCount = useMemo(
        () => rows.reduce((sum, c) => sum + Number(c.count || 0), 0),
        [rows]
    );

    const selectedCategoryValue = useMemo(() => {
        const v = normalizeStr(category);
        if (!v || v === "All") return "";

        const found =
            rows.find((r) => normalizeKey(r.slug) === normalizeKey(v)) ||
            rows.find((r) => normalizeKey(r.name) === normalizeKey(v)) ||
            null;

        return found ? (found.slug || found.name) : v;
    }, [category, rows]);

    /* ─────────────── saved filters (slice 3) ─────────────── */

    // Snapshot of current filter state. Keys MUST match the backend
    // service's ALLOWED_KEYS.jobs schema (see savedFiltersService.js).
    const currentFilterPayload = useMemo(() => ({
        view:          safeView || "all",
        sort:          safeSort || "newest",
        category:      normalizeStr(category) || "",
        jobTypes:      safeJobTypes,
        workModes:     safeWorkModes,
        salaryRange:   selectedSalaryRange === "All" ? "" : String(salaryRange || ""),
        statewideOnly: Boolean(statewideOnly),
        city:          normalizeStr(city),
        county:        normalizeStr(county),
        radius:        normalizeStr(radius),
        search:        String(search || "").trim(),
    }), [
        safeView, safeSort, category, safeJobTypes, safeWorkModes,
        salaryRange, selectedSalaryRange, statewideOnly,
        city, county, radius, search,
    ]);

    // Apply a saved filter. Jobs uses a single `filters` object for most
    // fields, so we build one merged patch and fire a single
    // onChangeFilters call. View, sort, and search go through their own
    // callbacks.
    const handleApplySavedFilter = useCallback((filter) => {
        const payload =
            (filter && (filter.payload ?? filter.payload_json)) || {};

        // Search: update BOTH the input and applied term via the parent's
        // dedicated callback.
        if ('search' in payload && typeof onSearchChange === "function") {
            onSearchChange(String(payload.search || ""));
        }

        if ('view' in payload && typeof onViewChange === "function") {
            onViewChange(payload.view || "all");
        }
        if ('sort' in payload && typeof onSortChange === "function") {
            onSortChange(payload.sort || "newest");
        }

        // Build the filters patch. Merge with current so fields missing
        // from the payload don't get wiped.
        if (typeof onChangeFilters === "function") {
            onChangeFilters((prev) => {
                const next = { ...(prev || {}) };
                if ('category' in payload)      next.category      = payload.category || "All";
                if ('jobTypes' in payload)      next.jobTypes      = Array.isArray(payload.jobTypes) ? payload.jobTypes : [];
                if ('workModes' in payload)     next.workModes     = Array.isArray(payload.workModes) ? payload.workModes : [];
                if ('salaryRange' in payload)   next.salaryRange   = payload.salaryRange || "";
                if ('statewideOnly' in payload) next.statewideOnly = Boolean(payload.statewideOnly);
                if ('city' in payload)          next.city          = payload.city || "";
                if ('county' in payload)        next.county        = payload.county || "";
                if ('radius' in payload)        next.radius        = payload.radius;
                return next;
            });
        }
    }, [onSearchChange, onViewChange, onSortChange, onChangeFilters]);

    /* ─────────────── auto-apply default on first load ─────────────── */

    const { defaultFilter: savedDefaultFilter } = useSavedFilters({
        tab: 'jobs',
        viewer: viewer || null,
    });

    const autoAppliedRef = useRef(false);

    // Capture URL filter params ONCE at mount (during render, via lazy ref).
    const hadUrlFiltersOnLoadRef = useRef(null);
    if (hadUrlFiltersOnLoadRef.current === null) {
        const FILTER_URL_KEYS = [
            'q', 'search', 'view', 'sort', 'category',
            'jobType', 'jobTypes', 'workMode', 'workModes',
            'salaryRange', 'statewideOnly',
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
                position: "relative",
                zIndex: 2,
                p: isDesktop
                    ? (compactChrome ? { xs: 0.95, md: 0.75 } : { xs: 1, md: 0.85 })
                    : (compactChrome ? 0.95 : 1),
                '@media (min-width: 1024px)': isDesktop ? {} : { p: compactChrome ? 1.1 : 1.25 },
                bgcolor: alpha(t.palette.background.paper, 0.62),
                color: t.palette.text.primary,
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.12),
                backdropFilter: "saturate(140%) blur(10px)",
                backgroundImage: "none",
                boxShadow: t.custom.shadows.md,
            })}
        >
            {/*
             * Desktop-only compact row: "Filters" toggle + active chips + reset.
             * Mobile skips this; fields are always expanded below.
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

            <Collapse in={Boolean(showAdvancedFilters) && fieldsExpanded} timeout={200} unmountOnExit>
                <Box sx={(t) => ({ ...reactiveFilterCardSx(t), mt: isDesktop ? 1 : 0 })}>
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
                                tab="jobs"
                                viewer={viewer || null}
                                currentPayload={currentFilterPayload}
                                onApply={handleApplySavedFilter}
                            />
                        </Box>
                    )}

                    {/* View (hidden in My Listings mode — controlled by top-level chip) */}
                    {typeof onViewChange === "function" && !isMyMode && (
                        <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 120px" } }}>
                            <FormControl size="small" fullWidth sx={selectPillSx}>
                                <InputLabel>View</InputLabel>
                                <Select
                                    label="View"
                                    value={safeView}
                                    onChange={(e) => onViewChange(e.target.value)}
                                    MenuProps={sharedMenuProps}
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
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    <IconComp sx={{ fontSize: 18, color: "primary.main" }} />
                                                    {opt.label}
                                                </Box>
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* My Listings status sub-filter (only in My Listings mode) */}
                    {isMyMode && typeof onMyJobsStatusChange === "function" && (
                        <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 100px" } }}>
                            <FormControl size="small" fullWidth sx={selectPillSx}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={myJobsStatus || "active"}
                                    onChange={(e) => onMyJobsStatusChange(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                >
                                    {MY_LISTINGS_STATUS_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Category */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "2 0 180px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel shrink>Category</InputLabel>
                            <Select
                                label="Category"
                                value={selectedCategoryValue}
                                onChange={(e) => {
                                    const next = normalizeStr(e?.target?.value || "");
                                    onChangeFilters((prev) => ({
                                        ...prev,
                                        category: next || "All",
                                    }));
                                }}
                                displayEmpty
                                renderValue={(val) => {
                                    const v = normalizeStr(val);
                                    if (!v) {
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%", overflow: "hidden" }}>
                                                <WorkOutlineRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                                                    {ALL_CATEGORIES_LABEL}
                                                </Typography>
                                                <Box sx={{ ml: "auto", flexShrink: 0, width: 32, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                    {categoriesLoading ? (
                                                        <CircularProgress size={14} sx={{ color: "primary.main" }} />
                                                    ) : (
                                                        <Typography
                                                            component="span"
                                                            sx={(t) => ({
                                                                ml: "auto",
                                                                fontSize: "0.75rem",
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

                                    const found =
                                        rows.find((r) => normalizeKey(r.slug) === normalizeKey(v)) ||
                                        rows.find((r) => normalizeKey(r.name) === normalizeKey(v)) ||
                                        null;

                                    if (!found) return v;

                                    const IconComp = getCategoryIcon(found);
                                    const count = Number(found.count || 0);
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%", overflow: "hidden" }}>
                                            <IconComp sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                                                {found.name}
                                            </Typography>
                                            <Box sx={{ ml: "auto", flexShrink: 0, width: 32, display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                {categoriesLoading ? (
                                                    <CircularProgress size={14} sx={{ color: "primary.main" }} />
                                                ) : (
                                                    <Typography
                                                        component="span"
                                                        sx={(t) => ({
                                                            ml: "auto",
                                                            fontSize: '0.75rem',
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
                            >
                                {/* All Categories */}
                                <MenuItem value="">
                                    <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>
                                        <WorkOutlineRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={ALL_CATEGORIES_LABEL} />
                                    <Box sx={{ ml: 1, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {categoriesLoading ? (
                                            <CircularProgress size={14} sx={{ color: "primary.main" }} />
                                        ) : (
                                            <Typography
                                                component="span"
                                                sx={(t) => ({
                                                    fontSize: '0.75rem',
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
                                </MenuItem>

                                {rows.map((c) => {
                                    const ct = Number(c.count || 0);
                                    const disabled = categoriesLoading ? false : ct <= 0;
                                    const IconComp = getCategoryIcon(c);

                                    return (
                                        <MenuItem
                                            key={c.id || c.slug || c.name}
                                            value={c.slug || c.name}
                                            disabled={disabled}
                                            sx={{
                                                opacity: disabled ? 0.5 : 1,
                                                "&.Mui-disabled": { opacity: 0.5 },
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
                                                primary={c.name}
                                                sx={{ color: disabled ? "text.disabled" : "inherit" }}
                                            />
                                            <Box sx={{ ml: 1, minWidth: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {categoriesLoading ? (
                                                    <CircularProgress size={14} sx={{ color: disabled ? "text.disabled" : "primary.main" }} />
                                                ) : (
                                                    <Typography
                                                        component="span"
                                                        sx={(t) => ({
                                                            fontSize: '0.75rem',
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

                    {/* Sort */}
                    {typeof onSortChange === "function" && (
                        <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 130px" } }}>
                            <FormControl size="small" fullWidth sx={selectPillSx}>
                                <InputLabel>Sort by</InputLabel>
                                <Select
                                    label="Sort by"
                                    value={safeSort}
                                    onChange={(e) => onSortChange(e.target.value)}
                                    MenuProps={sharedMenuProps}
                                    renderValue={(val) => {
                                        const opt = activeSortOptions.find((o) => o.value === val) || activeSortOptions[0];
                                        return (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
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
                    )}

                    {/* Job type */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 110px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>Job type</InputLabel>
                            <Select
                                label="Job type"
                                value={selectedJobType}
                                onChange={(e) => {
                                    const next = normalizeStr(e?.target?.value || "All");
                                    onChangeFilters((prev) => ({
                                        ...prev,
                                        jobTypes: next === "All" ? [] : [next],
                                    }));
                                }}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = JOB_TYPE_OPTIONS.find((o) => o.value === val) || JOB_TYPE_OPTIONS[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                            <ScheduleRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {JOB_TYPE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Arrangement */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 120px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>Arrangement</InputLabel>
                            <Select
                                label="Arrangement"
                                value={selectedWorkArrangement}
                                onChange={(e) => {
                                    const next = normalizeStr(e?.target?.value || "All");
                                    onChangeFilters((prev) => ({
                                        ...prev,
                                        workModes: next === "All" ? [] : [next],
                                    }));
                                }}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = WORK_MODE_OPTIONS.find((o) => o.value === val) || WORK_MODE_OPTIONS[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                            <LaptopRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {WORK_MODE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Salary range */}
                    <Box sx={{ flex: { xs: "1 1 45%", sm: "1 0 120px" } }}>
                        <FormControl size="small" fullWidth sx={selectPillSx}>
                            <InputLabel>Salary</InputLabel>
                            <Select
                                label="Salary"
                                value={selectedSalaryRange}
                                onChange={(e) => {
                                    const next = normalizeStr(e?.target?.value || "All");
                                    onChangeFilters((prev) => ({
                                        ...prev,
                                        salaryRange: next === "All" ? "" : next,
                                    }));
                                }}
                                MenuProps={sharedMenuProps}
                                renderValue={(val) => {
                                    const opt = SALARY_RANGE_OPTIONS.find((o) => o.value === val) || SALARY_RANGE_OPTIONS[0];
                                    return (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {opt.label}
                                            </Typography>
                                        </Box>
                                    );
                                }}
                            >
                                {SALARY_RANGE_OPTIONS.map((opt) => (
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
                                city={city || "All Cities"}
                                setCity={(val) => {
                                    const next = typeof val === "string" ? val : "";
                                    const normalized = (next === "All Cities" || !next.trim()) ? "" : next;
                                    onChangeFilters((prev) => ({ ...prev, city: normalized }));
                                }}
                                county={county || "All Counties"}
                                setCounty={(val) => {
                                    const next = typeof val === "string" ? val : "";
                                    const normalized = (next === "All Counties" || !next.trim()) ? "" : next;
                                    onChangeFilters((prev) => ({
                                        ...prev,
                                        county: normalized,
                                        radius: normalized ? DEFAULT_RADIUS_WHEN_COUNTY_SELECTED : STATEWIDE,
                                    }));
                                }}
                                allCountyValue="All Counties"
                                allCityValue="All Cities"
                                countyCounts={locationCounts?.counties || null}
                                cityCounts={locationCounts?.cities || null}
                                disabled={locationDisabled}
                                countyDisabled={locationDisabled}
                                cityDisabled={locationDisabled}
                                countyRequired={false}
                                cityRequired={false}
                                emptyCountyLabel="County"
                                emptyCityLabel="City"
                                selectSx={selectPillSx}
                                filterMode
                            />
                        </Box>

                        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0%" }, minWidth: 0 }}>
                            <FormControl size="small" fullWidth sx={selectPillSx} disabled={locationDisabled || !county}>
                                <InputLabel id="jobs-radius-label" shrink>
                                    Radius
                                </InputLabel>
                                <Select
                                    id="jobs-radius-select"
                                    labelId="jobs-radius-label"
                                    label="Radius"
                                    value={String(county ? (radius ?? "0") : STATEWIDE)}
                                    onChange={(e) => onChangeFilters((prev) => ({ ...prev, radius: e.target.value }))}
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