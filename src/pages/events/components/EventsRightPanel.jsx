import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { alpha } from "@mui/material/styles";
import {
    Box,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    Paper,
    Popover,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";

import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import LocalActivityRoundedIcon from "@mui/icons-material/LocalActivityRounded";

// Discover panel icons
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";

// Event category icons (same as EventsFilters)
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import PeopleAltRoundedIconCat from "@mui/icons-material/PeopleAltRounded";
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

// Import the new EventDetailPanel component
import EventDetailPanel from "./EventDetailPanel";
import EventCard from "./EventCard";
import EventsMapTab from "./EventsMapTab";
import { getDiscoverStaggerSx } from "../../../themes/theme";

/**
 * EventsRightPanel
 * ----------------
 * Community-style right rail for Events:
 * - Tabs: Discover / Trending / Details
 * - Details renders inline (desktop-friendly).
 *
 * IMPORTANT:
 * - Keep page state (selected event, active tab) in EventsPage.
 */

const HEADER_H = { xs: 50, md: 56 };
const TAB_ITEMS = [
    { label: "Discover", value: "discover" },
    { label: "Calendar", value: "calendar" },
    { label: "Event Detail", value: "details" },
    { label: "Map", value: "map" },
];

// Event category icon map (mirrors EventsFilters)
const EVENT_CATEGORY_ICON = {
    "music-nightlife": MusicNoteRoundedIcon,
    "arts-culture": TheaterComedyRoundedIcon,
    "food-drink": RestaurantRoundedIcon,
    "community-social": PeopleAltRoundedIconCat,
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

const EVENT_CATEGORY_LABELS = {
    "music-nightlife": "Music",
    "arts-culture": "Arts & Culture",
    "food-drink": "Food & Drink",
    "community-social": "Community & Social",
    "family-kids": "Family & Kids",
    "sports-recreation": "Sports & Recreation",
    "outdoors-nature": "Outdoors & Nature",
    "education-workshops": "Education & Workshops",
    "business-networking": "Business & Networking",
    "health-wellness": "Health & Wellness",
    "faith-spiritual": "Faith & Spiritual",
    "volunteer-fundraising": "Volunteer & Fundraising",
    "government-civic": "Government & Civic",
    "markets-shopping": "Markets & Shopping",
    "holidays-seasonal": "Holidays & Seasonal",
    other: "Other",
};

function DiscoverStatCard({ icon, label, value, color = "primary" }) {
    return (
        <Box
            sx={(t) => ({
                borderRadius: 2.5,
                p: 1.25,
                border: "1px solid",
                borderColor: alpha(
                    t.palette[color]?.main || t.palette.primary.main,
                    0.15
                ),
                bgcolor: alpha(
                    t.palette[color]?.main || t.palette.primary.main,
                    0.04
                ),
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                transition: "all 280ms cubic-bezier(.2,.8,.2,1)",
            })}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ color: `${color}.main`, display: "flex", alignItems: "center" }}>
                    {icon}
                </Box>
                <Typography
                    sx={{
                        fontWeight: 950,
                        fontSize: 22,
                        lineHeight: 1,
                        color: `${color}.dark`,
                        transition: "all 280ms cubic-bezier(.2,.8,.2,1)",
                    }}
                >
                    {value}
                </Typography>
            </Box>
            <Typography
                variant="caption"
                sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1.2 }}
            >
                {label}
            </Typography>
        </Box>
    );
}

function DiscoverPanel({ events, categoryCounts, onSelectCategory, activeCategory, locationCity, locationCounty, onLocationClick }) {
    const safeEvents = Array.isArray(events) ? events : [];
    const totalEvents = safeEvents.length;
    const [tipAnchor, setTipAnchor] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const locSnapshotRef = useRef({ topLocations: [], maxLocCount: 1 });

    useEffect(() => {
        let cancelled = false;
        setRevealed(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { if (!cancelled) setRevealed(true); });
        });
        return () => { cancelled = true; };
    }, []);

    // Build location-aware subtitle
    const locationLabel = locationCity
        ? `in ${locationCity}${locationCounty ? `, ${locationCounty} County` : ""}`
        : locationCounty
            ? `in ${locationCounty} County`
            : "across Alabama";

    // Today's events
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const todayCount = safeEvents.filter((e) => {
        const startAt = e?.startAt || e?.start_at || "";
        return String(startAt).startsWith(todayStr);
    }).length;

    // This week (next 7 days)
    const weekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const thisWeekCount = safeEvents.filter((e) => {
        const startAt = e?.startAt || e?.start_at;
        if (!startAt) return false;
        const t = new Date(startAt).getTime();
        return t >= Date.now() && t <= weekFromNow;
    }).length;

    // Unique categories count
    const catSet = new Set();
    safeEvents.forEach((e) => {
        const cat = e?.category || e?.categoryId || e?.category_id || "";
        if (cat) catSet.add(cat);
    });

    // Build category list from categoryCounts (API) or from events as fallback
    const catEntries = (() => {
        const countsObj =
            categoryCounts && typeof categoryCounts === "object" ? categoryCounts : {};
        if (Object.keys(countsObj).length > 0) {
            return Object.entries(countsObj)
                .filter(([, count]) => Number(count) > 0)
                .sort((a, b) => Number(b[1]) - Number(a[1]))
                .slice(0, 8)
                .map(([id, count]) => ({ id, count: Number(count) }));
        }
        const counts = {};
        safeEvents.forEach((e) => {
            const cat = e?.category || e?.categoryId || e?.category_id || "";
            if (cat) counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([id, count]) => ({ id, count }));
    })();

    const maxCatCount =
        catEntries.length > 0 ? Math.max(...catEntries.map((c) => c.count)) : 1;

    // Popular locations breakdown — stable snapshot
    // Only refresh when no city/county filter is active so the list
    // doesn't collapse to one entry when the user filters by location.
    const currentLocationMap = {};
    safeEvents.forEach((e) => {
        const eCity = String(e?.city || "").trim();
        const eCounty = String(e?.county || "").trim();
        const scope = String(e?.locationScope || e?.location_scope || "").toLowerCase();
        let label = "";
        if (eCity && eCounty) label = `${eCity}, ${eCounty} County`;
        else if (eCounty) label = `${eCounty} County`;
        else if (eCity) label = eCity;
        else if (scope === "statewide") label = "Alabama (Statewide)";
        if (label) {
            if (!currentLocationMap[label]) {
                currentLocationMap[label] = { count: 0, city: eCity, county: eCounty };
            }
            currentLocationMap[label].count += 1;
        }
    });
    const currentTopLocations = Object.entries(currentLocationMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6)
        .map(([label, data]) => ({ label, count: data.count, city: data.city, county: data.county }));

    // Update snapshot only when no location filter is active, or on first load
    const hasLocationFilter = Boolean(locationCity || locationCounty);
    if (currentTopLocations.length > 0 && (!hasLocationFilter || locSnapshotRef.current.topLocations.length === 0)) {
        locSnapshotRef.current = {
            topLocations: currentTopLocations,
            maxLocCount: currentTopLocations.length > 0 ? Math.max(...currentTopLocations.map((l) => l.count)) : 1,
        };
    }

    const topLocations = locSnapshotRef.current.topLocations;
    const maxLocCount = locSnapshotRef.current.maxLocCount;

    let sectionIdx = 0;

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2.5}>
                {/* Header */}
                <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>
                                Events Overview
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.45 }}
                            >
                                Quick snapshot of what&rsquo;s happening {locationLabel}.
                            </Typography>
                        </Box>
                        <Chip
                            icon={<TipsAndUpdatesRoundedIcon sx={{ fontSize: 15 }} />}
                            label="Tip"
                            size="small"
                            onClick={(e) => setTipAnchor(e.currentTarget)}
                            sx={(t) => ({
                                height: 26,
                                borderRadius: 999,
                                fontWeight: 800,
                                fontSize: 11,
                                cursor: "pointer",
                                bgcolor: alpha(t.palette.warning.main, 0.10),
                                color: t.palette.warning.dark,
                                border: "1px solid",
                                borderColor: alpha(t.palette.warning.main, 0.25),
                                "& .MuiChip-icon": { ml: 0.5, color: t.palette.warning.main },
                                "& .MuiChip-label": { px: 0.75 },
                                "&:hover": { bgcolor: alpha(t.palette.warning.main, 0.16) },
                            })}
                        />
                    </Box>

                    {/* Tip popover */}
                    <Popover
                        open={Boolean(tipAnchor)}
                        anchorEl={tipAnchor}
                        onClose={() => setTipAnchor(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        PaperProps={{
                            sx: (t) => ({
                                borderRadius: 3,
                                p: 1.5,
                                maxWidth: 300,
                                border: "1px solid",
                                borderColor: alpha(t.palette.warning.main, 0.25),
                                bgcolor: t.palette.background.paper,
                                backgroundImage: `linear-gradient(135deg, ${alpha(t.palette.warning.light, 0.18)} 0%, ${alpha(t.palette.warning.main, 0.08)} 100%)`,
                                boxShadow: `0 12px 36px ${alpha(t.palette.text.primary, 0.14)}`,
                            }),
                        }}
                    >
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                                <TipsAndUpdatesRoundedIcon sx={{ fontSize: 18, color: "warning.main" }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 13, color: "warning.dark" }}>
                                    Tips for Event Seekers
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Click a <strong>category above</strong> to filter the events list instantly.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Use the <strong>Calendar</strong> tab to pick specific dates or a date range.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Check the <strong>Map</strong> tab to see events near you on a map.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Use the <strong>city and county filters</strong> to narrow events to your area.
                            </Typography>
                        </Stack>
                    </Popover>
                </Box>

                {/* Quick stats grid */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <DiscoverStatCard
                        icon={<EventRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Total Events"
                        value={totalEvents}
                        color="primary"
                    />
                    <DiscoverStatCard
                        icon={<TodayRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Happening Today"
                        value={todayCount}
                        color="success"
                    />
                    <DiscoverStatCard
                        icon={<DateRangeRoundedIcon sx={{ fontSize: 20 }} />}
                        label="This Week"
                        value={thisWeekCount}
                        color="info"
                    />
                    <DiscoverStatCard
                        icon={<CategoryRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Categories"
                        value={catSet.size}
                        color="warning"
                    />
                </Box>

                {/* Popular categories */}
                {catEntries.length > 0 ? (
                    <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>
                            Popular Categories
                        </Typography>
                        <Stack spacing={0.75}>
                            {catEntries.map((cat) => {
                                const CatIcon =
                                    EVENT_CATEGORY_ICON[cat.id] || CategoryRoundedIcon;
                                const label =
                                    EVENT_CATEGORY_LABELS[cat.id] || cat.id;
                                const pct =
                                    maxCatCount > 0
                                        ? Math.round((cat.count / maxCatCount) * 100)
                                        : 0;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <Box
                                        key={cat.id}
                                        onClick={() => {
                                            if (typeof onSelectCategory === "function") {
                                                onSelectCategory(cat.id);
                                            }
                                        }}
                                        sx={(t) => ({
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            borderRadius: 2,
                                            cursor: "pointer",
                                            border: "1px solid",
                                            borderColor: isActive
                                                ? alpha(t.palette.primary.main, 0.35)
                                                : alpha(t.palette.text.primary, 0.06),
                                            bgcolor: isActive
                                                ? alpha(t.palette.primary.main, 0.07)
                                                : "transparent",
                                            transition: "all 220ms cubic-bezier(.2,.8,.2,1)",
                                            "&:hover": {
                                                bgcolor: alpha(
                                                    t.palette.primary.main,
                                                    isActive ? 0.1 : 0.04
                                                ),
                                                borderColor: alpha(
                                                    t.palette.primary.main,
                                                    isActive ? 0.4 : 0.15
                                                ),
                                            },
                                        })}
                                    >
                                        <CatIcon
                                            sx={{
                                                fontSize: 18,
                                                color: "primary.main",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    mb: 0.25,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {label}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: "text.secondary",
                                                        flexShrink: 0,
                                                        ml: 0.5,
                                                    }}
                                                >
                                                    {cat.count}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={(t) => ({
                                                    height: 4,
                                                    borderRadius: 999,
                                                    bgcolor: alpha(
                                                        t.palette.primary.main,
                                                        0.08
                                                    ),
                                                    "& .MuiLinearProgress-bar": {
                                                        borderRadius: 999,
                                                        bgcolor: t.palette.primary.main,
                                                        transition: "transform 400ms cubic-bezier(.2,.8,.2,1)",
                                                    },
                                                })}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                ) : null}

                {/* Popular Locations */}
                {topLocations.length > 0 ? (
                    <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>
                            Popular Locations
                        </Typography>
                        <Stack spacing={0.75}>
                            {topLocations.map((loc) => {
                                const pct = maxLocCount > 0 ? Math.round((loc.count / maxLocCount) * 100) : 0;
                                const isActive =
                                    (loc.city && loc.city === locationCity) ||
                                    (!loc.city && loc.county && loc.county === locationCounty) ||
                                    (!loc.city && !loc.county && loc.label === "Alabama (Statewide)" && !locationCity && !locationCounty);
                                return (
                                    <Box
                                        key={loc.label}
                                        onClick={() => onLocationClick?.({ city: loc.city, county: loc.county, label: loc.label })}
                                        sx={(t) => ({
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            borderRadius: 2,
                                            border: "1px solid",
                                            borderColor: isActive
                                                ? alpha(t.palette.primary.main, 0.35)
                                                : alpha(t.palette.text.primary, 0.06),
                                            bgcolor: isActive
                                                ? alpha(t.palette.primary.main, 0.06)
                                                : "transparent",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                            "&:hover": {
                                                bgcolor: isActive
                                                    ? alpha(t.palette.primary.main, 0.1)
                                                    : alpha(t.palette.text.primary, 0.04),
                                                borderColor: isActive
                                                    ? alpha(t.palette.primary.main, 0.4)
                                                    : alpha(t.palette.text.primary, 0.12),
                                            },
                                        })}
                                    >
                                        <MapRoundedIcon sx={{ fontSize: 16, color: "info.main", flexShrink: 0 }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 700,
                                                        fontSize: 12,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {loc.label}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ fontWeight: 800, color: "text.secondary", flexShrink: 0, ml: 0.5 }}
                                                >
                                                    {loc.count}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={(t) => ({
                                                    height: 4,
                                                    borderRadius: 999,
                                                    bgcolor: alpha(t.palette.info.main, 0.08),
                                                    "& .MuiLinearProgress-bar": {
                                                        borderRadius: 999,
                                                        bgcolor: t.palette.info.main,
                                                        transition: "transform 400ms cubic-bezier(.2,.8,.2,1)",
                                                    },
                                                })}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                ) : null}

            </Stack>
        </Box>
    );
}

// Calendar helper functions
function getMonthDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }

    // Add the days of the month
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(year, month, d));
    }

    return days;
}

function formatDateKey(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function isDateInRange(date, startDate, endDate) {
    if (!date) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (startDate && endDate) {
        const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
        return d >= Math.min(s, e) && d <= Math.max(s, e);
    }

    if (startDate) {
        return isSameDay(date, startDate);
    }

    return false;
}

function CalendarPanel({
                           selectedDates = [],
                           onDatesChange,
                           events = [],
                           allEvents = [],
                           onSearchDates,
                       }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectionMode, setSelectionMode] = useState("range"); // "range" or "multiple"
    const [rangeStart, setRangeStart] = useState(null);
    const [rangeEnd, setRangeEnd] = useState(null);
    const [multipleDates, setMultipleDates] = useState([]);
    const [hoverDate, setHoverDate] = useState(null);

    // Month/Year picker state
    const [pickerAnchor, setPickerAnchor] = useState(null);
    const [pickerYear, setPickerYear] = useState(viewDate.getFullYear());

    const monthDays = useMemo(() => getMonthDays(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

    // Count events per day for the current month
    // Use allEvents (unfiltered by custom date range) so badges always show,
    // falling back to events if allEvents is empty
    const eventCountsByDay = useMemo(() => {
        const counts = new Map();
        const source = Array.isArray(allEvents) && allEvents.length > 0 ? allEvents : (Array.isArray(events) ? events : []);

        source.forEach((e) => {
            const startAt = e?.startAt || e?.start_at;
            if (!startAt) return;

            const dateKey = String(startAt).split("T")[0].split(" ")[0];
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
        });

        return counts;
    }, [events, allEvents]);

    const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleOpenPicker = (event) => {
        setPickerAnchor(event.currentTarget);
        setPickerYear(viewDate.getFullYear());
    };

    const handleClosePicker = () => {
        setPickerAnchor(null);
    };

    const handleSelectMonth = (monthIndex) => {
        setViewDate(new Date(pickerYear, monthIndex, 1));
        handleClosePicker();
    };

    const handlePrevYear = () => {
        setPickerYear((y) => y - 1);
    };

    const handleNextYear = () => {
        setPickerYear((y) => y + 1);
    };

    const handleDayClick = (day) => {
        if (!day) return;

        const dateKey = formatDateKey(day);

        if (selectionMode === "multiple") {
            // Toggle date in multiple selection
            const exists = multipleDates.some((d) => d === dateKey);
            let newDates;

            if (exists) {
                newDates = multipleDates.filter((d) => d !== dateKey);
            } else {
                newDates = [...multipleDates, dateKey].sort();
            }

            setMultipleDates(newDates);

            if (typeof onDatesChange === "function") {
                const startDate = newDates.length > 0 ? newDates[0] : null;
                const endDate = newDates.length > 0 ? newDates[newDates.length - 1] : null;
                onDatesChange(newDates, startDate, endDate);
            }
        } else {
            // Range selection mode
            if (!rangeStart || (rangeStart && rangeEnd)) {
                // Start new range
                setRangeStart(day);
                setRangeEnd(null);

                if (typeof onDatesChange === "function") {
                    onDatesChange([dateKey], dateKey, dateKey);
                }
            } else {
                // Complete the range
                setRangeEnd(day);

                const start = rangeStart < day ? rangeStart : day;
                const end = rangeStart < day ? day : rangeStart;

                // Generate all dates in range
                const dates = [];
                const current = new Date(start);
                while (current <= end) {
                    dates.push(formatDateKey(current));
                    current.setDate(current.getDate() + 1);
                }

                if (typeof onDatesChange === "function") {
                    onDatesChange(dates, formatDateKey(start), formatDateKey(end));
                }
            }
        }
    };

    const handleClearSelection = () => {
        setRangeStart(null);
        setRangeEnd(null);
        setMultipleDates([]);
        if (typeof onDatesChange === "function") {
            onDatesChange([], null, null);
        }
    };

    const handleModeChange = (newMode) => {
        if (newMode === selectionMode) return;

        // Clear selection when switching modes
        setSelectionMode(newMode);
        setRangeStart(null);
        setRangeEnd(null);
        setMultipleDates([]);
        if (typeof onDatesChange === "function") {
            onDatesChange([], null, null);
        }
    };

    const handleRemoveDate = (dateKey) => {
        const newDates = multipleDates.filter((d) => d !== dateKey);
        setMultipleDates(newDates);

        if (typeof onDatesChange === "function") {
            const startDate = newDates.length > 0 ? newDates[0] : null;
            const endDate = newDates.length > 0 ? newDates[newDates.length - 1] : null;
            onDatesChange(newDates, startDate, endDate);
        }
    };

    const isInSelection = (day) => {
        if (!day) return false;
        const dateKey = formatDateKey(day);

        if (selectionMode === "multiple") {
            return multipleDates.includes(dateKey);
        }

        // Range mode
        const effectiveEnd = rangeEnd || (hoverDate && rangeStart && !rangeEnd ? hoverDate : null);

        if (rangeStart && effectiveEnd) {
            return isDateInRange(day, rangeStart, effectiveEnd);
        }

        if (rangeStart) {
            return isSameDay(day, rangeStart);
        }

        return false;
    };

    const isStartOfSelection = (day) => {
        if (!day || selectionMode === "multiple") return false;
        if (!rangeStart) return false;
        const effectiveEnd = rangeEnd || hoverDate;
        if (!effectiveEnd) return isSameDay(day, rangeStart);
        const start = rangeStart < effectiveEnd ? rangeStart : effectiveEnd;
        return isSameDay(day, start);
    };

    const isEndOfSelection = (day) => {
        if (!day || selectionMode === "multiple") return false;
        if (!rangeStart) return false;
        const effectiveEnd = rangeEnd || hoverDate;
        if (!effectiveEnd) return isSameDay(day, rangeStart);
        const end = rangeStart < effectiveEnd ? effectiveEnd : rangeStart;
        return isSameDay(day, end);
    };

    // Format selected dates for display
    const selectedDisplay = useMemo(() => {
        if (selectionMode === "multiple") {
            return multipleDates.map((dateKey) => {
                const [y, m, d] = dateKey.split("-").map(Number);
                const date = new Date(y, m - 1, d);
                return {
                    key: dateKey,
                    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                };
            });
        }

        // Range mode
        if (!rangeStart) return [];

        const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        if (rangeEnd && !isSameDay(rangeStart, rangeEnd)) {
            const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
            const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;
            return [{ key: "range", label: `${fmt(start)} – ${fmt(end)}`, isRange: true }];
        }

        return [{ key: formatDateKey(rangeStart), label: fmt(rangeStart) }];
    }, [selectionMode, multipleDates, rangeStart, rangeEnd]);

    const hasSelection = selectedDisplay.length > 0;

    return (
        <Box sx={{ p: { xs: 1.25, md: 1.75 } }}>
            {/* Header */}
            <Typography sx={{ fontWeight: 950, mb: 1.5 }}>Calendar</Typography>

            {/* Selection mode toggle */}
            <Box
                sx={(t) => ({
                    display: "flex",
                    p: 0.5,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: alpha(t.palette.primary.main, 0.06),
                    border: "1px solid",
                    borderColor: alpha(t.palette.primary.main, 0.1),
                })}
            >
                <Button
                    size="small"
                    onClick={() => handleModeChange("range")}
                    sx={(t) => ({
                        flex: 1,
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: 12,
                        borderRadius: 1.5,
                        py: 0.75,
                        bgcolor: selectionMode === "range" ? "background.paper" : "transparent",
                        color: selectionMode === "range" ? t.palette.primary.main : t.palette.text.secondary,
                        boxShadow: selectionMode === "range" ? (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.08)}` : "none",
                        "&:hover": {
                            bgcolor: selectionMode === "range" ? "background.paper" : alpha(t.palette.primary.main, 0.08),
                        },
                    })}
                >
                    Date Range
                </Button>
                <Button
                    size="small"
                    onClick={() => handleModeChange("multiple")}
                    sx={(t) => ({
                        flex: 1,
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: 12,
                        borderRadius: 1.5,
                        py: 0.75,
                        bgcolor: selectionMode === "multiple" ? "background.paper" : "transparent",
                        color: selectionMode === "multiple" ? t.palette.primary.main : t.palette.text.secondary,
                        boxShadow: selectionMode === "multiple" ? (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.08)}` : "none",
                        "&:hover": {
                            bgcolor: selectionMode === "multiple" ? "background.paper" : alpha(t.palette.primary.main, 0.08),
                        },
                    })}
                >
                    Pick Dates
                </Button>
            </Box>

            {/* Month navigation */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <IconButton size="small" onClick={handlePrevMonth}>
                    <ChevronLeftRoundedIcon />
                </IconButton>
                <Button
                    onClick={handleOpenPicker}
                    sx={{
                        textTransform: "none",
                        fontWeight: 900,
                        fontSize: 15,
                        color: "text.primary",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        "&:hover": {
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                        },
                    }}
                >
                    {monthName}
                </Button>
                <IconButton size="small" onClick={handleNextMonth}>
                    <ChevronRightRoundedIcon />
                </IconButton>
            </Stack>

            {/* Month/Year Picker Popover */}
            <Popover
                open={Boolean(pickerAnchor)}
                anchorEl={pickerAnchor}
                onClose={handleClosePicker}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                transformOrigin={{ vertical: "top", horizontal: "center" }}
                slotProps={{
                    paper: {
                        sx: (t) => ({
                            mt: 1,
                            borderRadius: 2.5,
                            boxShadow: (t) => `0 8px 32px ${alpha(t.palette.text.primary, 0.12)}`,
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.12),
                            overflow: "hidden",
                        }),
                    },
                }}
            >
                <Box sx={{ p: 2, minWidth: 260 }}>
                    {/* Year navigation */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                        <IconButton size="small" onClick={handlePrevYear}>
                            <ChevronLeftRoundedIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{pickerYear}</Typography>
                        <IconButton size="small" onClick={handleNextYear}>
                            <ChevronRightRoundedIcon />
                        </IconButton>
                    </Stack>

                    {/* Month grid */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 0.75,
                        }}
                    >
                        {MONTHS.map((m, idx) => {
                            const isCurrentMonth = viewDate.getMonth() === idx && viewDate.getFullYear() === pickerYear;
                            const isThisMonth = today.getMonth() === idx && today.getFullYear() === pickerYear;

                            return (
                                <Button
                                    key={m}
                                    onClick={() => handleSelectMonth(idx)}
                                    size="small"
                                    sx={(t) => ({
                                        textTransform: "none",
                                        fontWeight: isCurrentMonth ? 900 : 600,
                                        fontSize: 13,
                                        py: 1,
                                        borderRadius: 1.5,
                                        color: isCurrentMonth ? "background.paper" : isThisMonth ? t.palette.primary.main : "text.primary",
                                        bgcolor: isCurrentMonth ? t.palette.primary.main : "transparent",
                                        border: isThisMonth && !isCurrentMonth ? "1px solid" : "none",
                                        borderColor: alpha(t.palette.primary.main, 0.3),
                                        "&:hover": {
                                            bgcolor: isCurrentMonth
                                                ? t.palette.primary.dark
                                                : alpha(t.palette.primary.main, 0.08),
                                        },
                                    })}
                                >
                                    {m}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>
            </Popover>

            {/* Calendar grid */}
            <Box
                sx={(t) => ({
                    border: "1px solid",
                    borderColor: alpha(t.palette.primary.main, 0.12),
                    borderRadius: 2.5,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                })}
            >
                {/* Day headers */}
                <Box
                    sx={(t) => ({
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        bgcolor: alpha(t.palette.primary.main, 0.04),
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.08),
                    })}
                >
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <Box
                            key={d}
                            sx={{
                                py: 0.75,
                                textAlign: "center",
                                fontSize: 11,
                                fontWeight: 900,
                                color: "text.secondary",
                            }}
                        >
                            {d}
                        </Box>
                    ))}
                </Box>

                {/* Days grid */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                    }}
                >
                    {monthDays.map((day, idx) => {
                        const dateKey = day ? formatDateKey(day) : null;
                        const eventCount = dateKey ? (eventCountsByDay.get(dateKey) || 0) : 0;
                        const isToday = day && isSameDay(day, today);
                        const isPast = day && day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const inSelection = isInSelection(day);
                        const isStart = isStartOfSelection(day);
                        const isEnd = isEndOfSelection(day);
                        const isMultipleSelected = selectionMode === "multiple" && inSelection;

                        return (
                            <Box
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                onMouseEnter={() => day && selectionMode === "range" && rangeStart && !rangeEnd && setHoverDate(day)}
                                onMouseLeave={() => setHoverDate(null)}
                                sx={(t) => ({
                                    position: "relative",
                                    aspectRatio: "1",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: day ? "pointer" : "default",
                                    borderRight: (idx + 1) % 7 !== 0 ? "1px solid" : "none",
                                    borderBottom: idx < monthDays.length - 7 ? "1px solid" : "none",
                                    borderColor: alpha(t.palette.divider, 0.5),
                                    bgcolor: isMultipleSelected
                                        ? alpha(t.palette.primary.main, 0.15)
                                        : inSelection && selectionMode === "range"
                                            ? alpha(t.palette.primary.main, isStart || isEnd ? 0.2 : 0.08)
                                            : "transparent",
                                    borderRadius: isMultipleSelected
                                        ? 1
                                        : isStart && isEnd ? 1 : isStart ? "8px 0 0 8px" : isEnd ? "0 8px 8px 0" : 0,
                                    transition: "background-color 100ms ease",
                                    "&:hover": day ? {
                                        bgcolor: inSelection
                                            ? alpha(t.palette.primary.main, 0.25)
                                            : alpha(t.palette.primary.main, 0.06),
                                    } : {},
                                })}
                            >
                                {day ? (
                                    <>
                                        <Typography
                                            sx={(t) => ({
                                                fontSize: 13,
                                                fontWeight: isToday ? 900 : inSelection ? 800 : 600,
                                                color: isPast && !inSelection
                                                    ? "text.disabled"
                                                    : isToday
                                                        ? t.palette.primary.main
                                                        : inSelection
                                                            ? t.palette.primary.main
                                                            : "text.primary",
                                                lineHeight: 1,
                                            })}
                                        >
                                            {day.getDate()}
                                        </Typography>

                                        {/* Event count indicator */}
                                        {eventCount > 0 ? (
                                            <Box
                                                sx={(t) => ({
                                                    position: "absolute",
                                                    bottom: 2,
                                                    minWidth: 14,
                                                    height: 14,
                                                    px: 0.4,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: 0.75,
                                                    bgcolor: inSelection
                                                        ? alpha(t.palette.primary.main, 0.15)
                                                        : alpha(t.palette.secondary.main, 0.15),
                                                })}
                                            >
                                                <Typography
                                                    sx={(t) => ({
                                                        fontSize: 9,
                                                        fontWeight: 900,
                                                        color: inSelection ? t.palette.primary.main : t.palette.secondary.main,
                                                        lineHeight: 1,
                                                    })}
                                                >
                                                    {eventCount}
                                                </Typography>
                                            </Box>
                                        ) : null}

                                        {/* Today indicator ring */}
                                        {isToday ? (
                                            <Box
                                                sx={(t) => ({
                                                    position: "absolute",
                                                    inset: 4,
                                                    border: "2px solid",
                                                    borderColor: alpha(t.palette.primary.main, 0.3),
                                                    borderRadius: 1,
                                                    pointerEvents: "none",
                                                })}
                                            />
                                        ) : null}
                                    </>
                                ) : null}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Selected dates display */}
            {hasSelection ? (
                <Box
                    sx={(t) => ({
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(t.palette.primary.main, 0.06),
                        border: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.15),
                    })}
                >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "text.secondary" }}>
                            {selectionMode === "multiple" ? "Selected Dates" : "Date Range"}
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <Button
                                size="small"
                                onClick={handleClearSelection}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    minWidth: "auto",
                                    px: 1,
                                    py: 0.25,
                                    color: "text.secondary",
                                }}
                            >
                                Clear All
                            </Button>
                            {typeof onSearchDates === "function" && (
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<SearchRoundedIcon sx={{ fontSize: 14 }} />}
                                    onClick={onSearchDates}
                                    sx={(t) => ({
                                        textTransform: "none",
                                        fontWeight: 800,
                                        fontSize: 11,
                                        minWidth: "auto",
                                        px: 1.5,
                                        py: 0.4,
                                        borderRadius: 999,
                                        bgcolor: t.palette.primary.main,
                                        color: t.palette.common.white,
                                        boxShadow: "none",
                                        "&:hover": {
                                            bgcolor: alpha(t.palette.primary.main, 0.88),
                                            boxShadow: "none",
                                        },
                                        "& .MuiButton-startIcon": { mr: 0.4 },
                                    })}
                                >
                                    Search
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {selectedDisplay.map((item) => (
                            <Box
                                key={item.key}
                                sx={(t) => ({
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: 1.5,
                                    bgcolor: "background.paper",
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.2),
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: t.palette.primary.main,
                                })}
                            >
                                <EventRoundedIcon sx={{ fontSize: 14 }} />
                                {item.label}
                                {selectionMode === "multiple" && !item.isRange ? (
                                    <Box
                                        component="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveDate(item.key);
                                        }}
                                        sx={(t) => ({
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 16,
                                            height: 16,
                                            ml: 0.25,
                                            borderRadius: "50%",
                                            border: "none",
                                            bgcolor: alpha(t.palette.primary.main, 0.1),
                                            color: t.palette.primary.main,
                                            cursor: "pointer",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            transition: "background-color 100ms ease",
                                            "&:hover": {
                                                bgcolor: alpha(t.palette.primary.main, 0.2),
                                            },
                                        })}
                                    >
                                        ×
                                    </Box>
                                ) : null}
                            </Box>
                        ))}
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={(t) => ({
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(t.palette.grey[500], 0.04),
                        border: "1px dashed",
                        borderColor: alpha(t.palette.grey[500], 0.2),
                        textAlign: "center",
                    })}
                >
                    <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>
                        {selectionMode === "range"
                            ? "Click a date to filter events, or click two dates to select a range."
                            : "Click dates to add them to your selection."}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5 }}>
                        Numbers show how many events are on each day.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default function EventsRightPanel({
                                             rightWidth,
                                             activeTab,
                                             onTabChange,
                                             selectedEvent,
                                             events,
                                             allEvents,
                                             user,
                                             onRequireAuth,
                                             onSelectEvent,
                                             onClearSelection,
                                             selectedDates = [],
                                             onDatesChange,
                                             onSearchDates,
                                             focusEventId,
                                             onFocusEventHandled,
                                             focusCommentInput = false,
                                             onFocusCommentHandled,
                                             hoveredCardId,
                                             city,
                                             county,
                                             onCityChange,
                                             onCountyChange,
                                             // New props for Discover panel
                                             categoryCounts,
                                             onSelectCategory,
                                             activeCategory,
                                             // Mobile: hide the internal tab bar (tabs are in the parent page)
                                             hideTabs = false,
                                         }) {
    const safeTab = TAB_ITEMS.some((t) => t.value === activeTab)
        ? activeTab
        : "discover";

    const contentScrollRef = useRef(null);

    // Scroll the right panel content to top when selected event changes
    useEffect(() => {
        if (selectedEvent && contentScrollRef.current) {
            contentScrollRef.current.scrollTop = 0;
        }
    }, [selectedEvent]);

    return (
        <Box
            sx={(t) => ({
                position: "relative",
                height: "100%",
                p: 0,
                overflow: "hidden",
                border: hideTabs ? "none" : "1px solid",
                borderColor: hideTabs ? "transparent" : alpha(t.palette.primary.main, 0.12),
                borderRadius: hideTabs ? 0 : 3,
                bgcolor: hideTabs ? "transparent" : alpha(t.palette.background.paper, 0.92),
                backdropFilter: hideTabs ? "none" : "saturate(140%) blur(10px)",
                backgroundImage: "none",
                boxShadow: hideTabs ? "none" : `0 14px 44px ${alpha(t.palette.text.primary, 0.08)}`,
                width: rightWidth,
                flex: "0 0 auto",
            })}
        >
            {/* Tabs header */}
            {!hideTabs && (
                <Box
                    sx={(t) => ({
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: { xs: HEADER_H.xs, md: HEADER_H.md },
                        display: "flex",
                        alignItems: "center",
                        px: 1,
                        bgcolor: alpha(t.palette.background.paper, 0.96),
                        backgroundImage: "none",
                        backdropFilter: "saturate(140%) blur(8px)",
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.12),
                        zIndex: 10,
                    })}
                >
                    <Box sx={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "nowrap", width: "100%" }}>
                        {TAB_ITEMS.map((tItem) => {
                            const isActive = String(safeTab) === String(tItem.value);
                            const iconMap = {
                                discover: ExploreRoundedIcon,
                                calendar: CalendarMonthRoundedIcon,
                                map: MapRoundedIcon,
                                details: EventRoundedIcon,
                            };
                            const IconComp = iconMap[tItem.value] || null;
                            return (
                                <Button
                                    key={tItem.value}
                                    type="button"
                                    disableElevation
                                    disableRipple
                                    variant="text"
                                    onClick={() =>
                                        (typeof onTabChange === "function" ? onTabChange(tItem.value) : undefined)
                                    }
                                    startIcon={IconComp ? <IconComp sx={{ fontSize: 17 }} /> : undefined}
                                    sx={(theme) => ({
                                        flex: 1,
                                        minHeight: "unset",
                                        px: { xs: 0.75, md: 1.25 },
                                        py: { xs: 0.85, md: 1.1 },
                                        borderRadius: 0,
                                        textTransform: "none",
                                        fontWeight: isActive ? 950 : 700,
                                        fontSize: 13.5,
                                        letterSpacing: "-0.01em",
                                        justifyContent: "center",
                                        "& .MuiButton-startIcon": { mr: 0.5 },
                                        color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                                        backgroundColor: "transparent",
                                        borderBottom: "2px solid",
                                        borderColor: isActive ? theme.palette.primary.main : "transparent",
                                        transition: "color 150ms ease, border-color 150ms ease",
                                        "&:hover": {
                                            backgroundColor: "transparent",
                                            color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                                            borderColor: isActive ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2),
                                        },
                                    })}
                                >
                                    {tItem.label}
                                </Button>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {/* Content */}
            <Box
                ref={contentScrollRef}
                sx={{
                    position: "absolute",
                    top: hideTabs ? 0 : { xs: HEADER_H.xs, md: HEADER_H.md },
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflowY: "auto",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {safeTab === "discover" ? (
                        <Box
                            key="tab-discover"
                            component={motion.div}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                        >
                            <DiscoverPanel
                                events={events}
                                categoryCounts={categoryCounts}
                                onSelectCategory={onSelectCategory}
                                activeCategory={activeCategory}
                                locationCity={city}
                                locationCounty={county}
                                onLocationClick={({ city: locCity, county: locCounty, label }) => {
                                    if (label === "Alabama (Statewide)") {
                                        // Already showing statewide (no filters) → no-op, or reset
                                        onCityChange?.("");
                                        onCountyChange?.("");
                                    } else {
                                        // Toggle: if same location is already active, clear it
                                        const cityMatch = locCity && locCity === city;
                                        const countyOnlyMatch = !locCity && locCounty && locCounty === county && !city;
                                        if (cityMatch || countyOnlyMatch) {
                                            onCityChange?.("");
                                            onCountyChange?.("");
                                        } else {
                                            onCityChange?.(locCity || "");
                                            onCountyChange?.(locCounty || "");
                                        }
                                    }
                                }}
                            />
                        </Box>
                    ) : null}
                    {safeTab === "calendar" ? (
                        <Box
                            key="tab-calendar"
                            component={motion.div}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                        >
                            <CalendarPanel
                                selectedDates={selectedDates}
                                onDatesChange={onDatesChange}
                                events={events}
                                allEvents={allEvents}
                                onSearchDates={onSearchDates}
                            />
                        </Box>
                    ) : null}
                    {safeTab === "map" ? (
                        <Box
                            key="tab-map"
                            component={motion.div}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                            sx={{ height: "100%" }}
                        >
                            <EventsMapTab events={events} onSelectEvent={onSelectEvent} focusEventId={focusEventId} onFocusEventHandled={onFocusEventHandled} hoveredCardId={hoveredCardId} />
                        </Box>
                    ) : null}
                    {safeTab === "details" ? (
                        <Box
                            key="tab-details"
                            component={motion.div}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                            sx={{ height: "100%" }}
                        >
                            <EventDetailPanel
                                event={selectedEvent}
                                user={user}
                                onRequireAuth={onRequireAuth}
                                onClearSelection={onClearSelection}
                                focusCommentInput={focusCommentInput}
                                onFocusCommentHandled={onFocusCommentHandled}
                            />
                        </Box>
                    ) : null}
                </AnimatePresence>
            </Box>
        </Box>
    );
}