// src/pages/marketplace/components/MarketplaceRightPanel.jsx
// Tabbed right rail — Discover | Listing Details | Map
//
// The Discover tab is a "Marketplace Overview" dashboard showing:
//   1. Marketplace Snapshot — key stats (total, new today, free, yard sales, sellers)
//   2. Popular Categories — stable-order rows with progress bars
//
// Stats and categories react to active filters with a smooth fade transition.
// Every clickable element in the overview sets a filter on the left panel.

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import { alpha } from "@mui/material/styles";
import {
    Box,
    Button,
    Chip,
    LinearProgress,
    Popover,
    Stack,
    Typography,
} from "@mui/material";

// Tab icons
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";

// Stat / section icons
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";

import { getDiscoverStaggerSx } from "../../../themes/theme";

// Category icons — same map used in ListingCard / MarketplaceFilters
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

import MarketplaceListingDetailPanel from "./MarketplaceListingDetailPanel";
import MarketplaceMapView from "./MarketplaceMapView";

// ─── Constants ──────────────────────────────────────────────────────────────

const HEADER_H = { xs: 50, md: 56 };

const TAB_ITEMS = [
    { label: "Discover", value: "browse" },
    { label: "Listing Details", value: "details" },
    { label: "Map", value: "map" },
];

const ICON_MAP = {
    browse: ExploreRoundedIcon,
    details: ArticleRoundedIcon,
    map: MapRoundedIcon,
};

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
    "Yard Sales": LocalMallRoundedIcon,
    Other: CategoryRoundedIcon,
};

const MS_24H = 24 * 60 * 60 * 1000;

// ── Framer-motion variants (hoisted to module scope to prevent infinite re-renders) ──
const TAB_MOTION_INITIAL = { opacity: 0, y: 10 };
const TAB_MOTION_ANIMATE = { opacity: 1, y: 0 };
const TAB_MOTION_EXIT = { opacity: 0, y: -8 };
const TAB_MOTION_TRANSITION = { duration: 0.18, ease: "easeOut" };

// ─── Helpers ────────────────────────────────────────────────────────────────

function getListingPriceModel(l) {
    return l?.priceModel || l?.price_model || "fixed";
}

function getListingCreatedMs(l) {
    const d = l?.createdAt || l?.created_at;
    return d ? new Date(d).getTime() : 0;
}

function getUniqueSellers(items) {
    const seen = new Set();
    items.forEach((l) => {
        const s = l?.seller || l?.user || {};
        const id = s?.id || s?.user_id || s?.userId;
        if (id) seen.add(String(id));
    });
    return seen.size;
}


// ─── StatCard ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, onClick }) {
    const safeColor = color || "primary";
    const clickable = typeof onClick === "function";
    return (
        <Box
            onClick={clickable ? onClick : undefined}
            sx={(t) => ({
                borderRadius: 2.5,
                p: 1.25,
                border: "1px solid",
                borderColor: alpha(t.palette[safeColor]?.main || t.palette.primary.main, 0.15),
                bgcolor: alpha(t.palette[safeColor]?.main || t.palette.primary.main, 0.04),
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                cursor: clickable ? "pointer" : "default",
                transition: "all 150ms ease",
                ...(clickable ? {
                    "&:hover": {
                        bgcolor: alpha(t.palette[safeColor]?.main || t.palette.primary.main, 0.09),
                        borderColor: alpha(t.palette[safeColor]?.main || t.palette.primary.main, 0.28),
                        transform: "translateY(-1px)",
                        boxShadow: `0 4px 12px ${alpha(t.palette[safeColor]?.main || t.palette.primary.main, 0.12)}`,
                    },
                } : {}),
            })}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ color: `${safeColor}.main`, display: "flex", alignItems: "center" }}>
                    {icon}
                </Box>
                <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1, color: `${safeColor}.dark` }}>
                    {value}
                </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1.2 }}>
                {label}
            </Typography>
        </Box>
    );
}

// ─── SectionHeader ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle, color }) {
    const safeColor = color || "primary";
    return (
        <Box sx={{ mb: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
                <Box
                    sx={(t) => ({
                        width: 26,
                        height: 26,
                        borderRadius: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(t.palette[safeColor]?.main || t.palette.primary.main, 0.1),
                        color: `${safeColor}.main`,
                        flexShrink: 0,
                    })}
                >
                    {icon}
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
                    {title}
                </Typography>
            </Box>
            {subtitle ? (
                <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontWeight: 600, fontSize: 11, pl: "34px", lineHeight: 1.3 }}
                >
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════════════════════
//  BrowsePanel — "Marketplace Overview" dashboard
// ═══════════════════════════════════════════════════════════════════════════

export function BrowsePanel({
                                items,
                                categoryCounts,
                                activeCity,
                                activeCounty,
                                onSelectCategory,
                                onSelectPriceModel,
                                onSelectSort,
                            }) {
    const safeItems = Array.isArray(items) ? items : [];
    const totalListings = safeItems.length;
    const now = Date.now();

    // Build location-aware subtitle
    const locationLabel = (() => {
        const c = String(activeCity || "").trim();
        const co = String(activeCounty || "").trim();
        const countyLabel = co ? (co.toLowerCase().includes("county") ? co : `${co} County`) : "";
        if (c && countyLabel) return `${c}, ${countyLabel}`;
        if (c) return c;
        if (countyLabel) return countyLabel;
        return "across Alabama";
    })();

    const [tipAnchor, setTipAnchor] = useState(null);
    const [revealed, setRevealed] = useState(true);
    const prevLocationRef = React.useRef(locationLabel);
    const locationChanged = prevLocationRef.current !== locationLabel;
    if (locationChanged) prevLocationRef.current = locationLabel;

    // ── Derived stats ──────────────────────────────────────────────────

    const newCount = safeItems.filter(
        (l) => now - getListingCreatedMs(l) < MS_24H && getListingCreatedMs(l) > 0
    ).length;

    const freeCount = safeItems.filter((l) => getListingPriceModel(l) === "free").length;

    const yardSalesCount = safeItems.filter(
        (l) => String(l?.category || "").toLowerCase() === "yard sales"
    ).length;

    const activeSellers = getUniqueSellers(safeItems);

    // ── Categories (stable order via ref) ────────────────────────────

    const catOrderRef = React.useRef([]);

    const rawCatCounts = (() => {
        const countsObj = categoryCounts && typeof categoryCounts === "object" ? categoryCounts : {};
        if (Object.keys(countsObj).length > 0) {
            const out = {};
            Object.entries(countsObj).forEach(([name, cnt]) => {
                if (Number(cnt) > 0) out[name] = Number(cnt);
            });
            return out;
        }
        const counts = {};
        safeItems.forEach((l) => {
            const cat = l?.category || "";
            if (cat) counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    })();

    // Build a stable key from the data so we can fade when filters change
    const dataKey = `${totalListings}-${Object.keys(rawCatCounts).sort().join(",")}-${newCount}-${freeCount}-${yardSalesCount}`;

    // Track whether we have received real data at least once.
    // The fade transition should only play when switching between two sets of
    // real data (i.e. a filter change), NOT on the initial empty→loaded transition.
    const hasHadDataRef = React.useRef(totalListings > 0);
    const prevDataKeyRef2 = React.useRef(dataKey);

    useEffect(() => {
        // If we haven't had any real data yet, just record when we do and skip the fade.
        if (!hasHadDataRef.current) {
            if (totalListings > 0) {
                hasHadDataRef.current = true;
                prevDataKeyRef2.current = dataKey;
            }
            return;
        }

        // If the dataKey hasn't actually changed, skip.
        if (prevDataKeyRef2.current === dataKey) return;
        prevDataKeyRef2.current = dataKey;

        // Real filter change — play the fade transition
        let cancelled = false;
        setRevealed(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (!cancelled) setRevealed(true);
            });
        });
        return () => { cancelled = true; };
    }, [dataKey, totalListings]);

    // Re-sort category order when filter data changes
    const currentNames = Object.keys(rawCatCounts);
    const prevDataKeyRef = React.useRef(dataKey);
    if (prevDataKeyRef.current !== dataKey || catOrderRef.current.length === 0) {
        prevDataKeyRef.current = dataKey;
        if (currentNames.length > 0) {
            catOrderRef.current = [...currentNames].sort(
                (a, b) => (rawCatCounts[b] || 0) - (rawCatCounts[a] || 0)
            );
        }
    }
    // Add any new categories that weren't in the current snapshot
    currentNames.forEach((n) => {
        if (!catOrderRef.current.includes(n)) catOrderRef.current.push(n);
    });

    const catEntries = catOrderRef.current
        .filter((name) => (rawCatCounts[name] || 0) > 0)
        .slice(0, 8)
        .map((name) => ({ name, count: rawCatCounts[name] || 0 }));

    const maxCatCount = catEntries.length > 0 ? Math.max(...catEntries.map((c) => c.count)) : 1;

    // ── Section index for stagger ──────────────────────────────────────

    let sectionIdx = 0;

    // ── Render ──────────────────────────────────────────────────────────

    return (
        <Box sx={{ p: 2, pb: 4 }}>
            <Stack spacing={2.5}>

                {/* ════════════ Header ════════════ */}
                <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.25 }}>
                                Marketplace Overview
                            </Typography>
                            <Typography
                                key={locationLabel}
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    lineHeight: 1.4,
                                    fontSize: 12.5,
                                    ...(locationChanged ? {
                                        animation: "overviewFadeIn 280ms ease both",
                                        "@keyframes overviewFadeIn": {
                                            "from": { opacity: 0, transform: "translateY(3px)" },
                                            "to": { opacity: 1, transform: "translateY(0)" },
                                        },
                                    } : {}),
                                }}
                            >
                                Quick snapshot of the marketplace in {locationLabel}.
                            </Typography>
                        </Box>
                        <Chip
                            icon={<TipsAndUpdatesRoundedIcon sx={{ fontSize: 15 }} />}
                            label="Tips"
                            size="small"
                            onClick={(e) => setTipAnchor(e.currentTarget)}
                            sx={(t) => ({
                                height: 26, borderRadius: 999, fontWeight: 800, fontSize: 11, cursor: "pointer",
                                bgcolor: alpha(t.palette.warning.main, 0.1),
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
                                borderRadius: 3, p: 1.5, maxWidth: 300,
                                border: "1px solid", borderColor: alpha(t.palette.warning.main, 0.25),
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
                                    Buyer Tips
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} <strong>Bookmark</strong> listings to find them later in Saved.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Click any stat or category below to <strong>filter the feed</strong>.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Tap a highlighted listing to see full details and <strong>message the seller</strong>.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Check <strong>&ldquo;Free Stuff&rdquo;</strong> and <strong>&ldquo;Yard Sales&rdquo;</strong> for the best local deals.
                            </Typography>
                        </Stack>
                    </Popover>
                </Box>

                {/* ════════════ 1. Marketplace Snapshot ════════════ */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <StatCard icon={<StorefrontRoundedIcon sx={{ fontSize: 20 }} />} label="Total Listings" value={totalListings} color="primary" />
                    <StatCard
                        icon={<NewReleasesRoundedIcon sx={{ fontSize: 20 }} />}
                        label="New Today"
                        value={newCount}
                        color="success"
                        onClick={newCount > 0 && typeof onSelectSort === "function" ? () => onSelectSort("newest") : undefined}
                    />
                    <StatCard
                        icon={<VolunteerActivismRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Free Items"
                        value={freeCount}
                        color="info"
                        onClick={freeCount > 0 && typeof onSelectPriceModel === "function" ? () => onSelectPriceModel("free") : undefined}
                    />
                    <StatCard
                        icon={<LocalMallRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Yard Sales"
                        value={yardSalesCount}
                        color="warning"
                        onClick={yardSalesCount > 0 && typeof onSelectCategory === "function" ? () => onSelectCategory("Yard Sales") : undefined}
                    />
                    {activeSellers > 0 ? (
                        <StatCard icon={<PeopleRoundedIcon sx={{ fontSize: 20 }} />} label="Active Sellers" value={activeSellers} color="primary" />
                    ) : null}
                </Box>

                {/* ════════════ 2. Popular Categories ════════════ */}
                {catEntries.length > 0 ? (
                    <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                        <Box sx={{ mb: 1.25 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2 }}>
                                Popular Categories
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ color: "text.secondary", fontWeight: 600, fontSize: 11, lineHeight: 1.3, mt: 0.25, display: "block" }}
                            >
                                Tap to filter by category
                            </Typography>
                        </Box>
                        <Stack spacing={0.75}>
                            {catEntries.map((cat) => {
                                const CatIcon = CATEGORY_ICONS[cat.name] || CategoryRoundedIcon;
                                const pct = maxCatCount > 0 ? Math.round((cat.count / maxCatCount) * 100) : 0;
                                return (
                                    <Box
                                        key={cat.name}
                                        onClick={() => { if (typeof onSelectCategory === "function") onSelectCategory(cat.name); }}
                                        sx={(t) => ({
                                            display: "flex", alignItems: "center", gap: 1, p: 1, borderRadius: 2,
                                            cursor: "pointer",
                                            border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06),
                                            transition: "all 150ms ease",
                                            "&:hover": {
                                                bgcolor: alpha(t.palette.primary.main, 0.04),
                                                borderColor: alpha(t.palette.primary.main, 0.15),
                                            },
                                        })}
                                    >
                                        <CatIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {cat.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", flexShrink: 0, ml: 0.5 }}>
                                                    {cat.count}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={(t) => ({
                                                    height: 4, borderRadius: 999,
                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                    "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: t.palette.primary.main },
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

// ═══════════════════════════════════════════════════════════════════════════
//  MarketplaceRightPanel
// ═══════════════════════════════════════════════════════════════════════════

export default function MarketplaceRightPanel({
                                                  rightWidth,
                                                  activeTab,
                                                  onTabChange,
                                                  hideTabs,
                                                  pageTab,
                                                  selectedListingId,
                                                  user,
                                                  onRequireAuth,
                                                  onSelectListing,
                                                  onClearSelection,
                                                  onFavorite,
                                                  onRepost,
                                                  onEdit,
                                                  onDelete,
                                                  onMarkSold,
                                                  onRelist,
                                                  onFlag,
                                                  // Browse panel props
                                                  items,
                                                  categoryCounts,
                                                  activeCity,
                                                  activeCounty,
                                                  onSelectCategory,
                                                  onSelectPriceModel,
                                                  onSelectSort,
                                                  // Map panel props
                                                  isMapLoading,
                                                  focusListingId,
                                                  onFocusListingHandled,
                                                  mapCenter,
                                                  mapZoom,
                                              }) {
    const isYardSales = !hideTabs && pageTab === "yard-sales";
    const visibleTabs = isYardSales ? TAB_ITEMS.filter((t) => t.value !== "browse") : TAB_ITEMS;
    const safeTab = visibleTabs.some((t) => t.value === activeTab) ? activeTab : visibleTabs[0]?.value || "browse";

    return (
        <Box
            sx={(t) => ({
                position: "relative",
                height: "100%",
                p: 0,
                overflow: "hidden",
                border: { xs: "none", md: "1px solid" },
                borderColor: { xs: "transparent", md: alpha(t.palette.primary.main, 0.12) },
                borderRadius: { xs: 0, md: 3 },
                bgcolor: t.palette.background.paper,
                backdropFilter: "none",
                backgroundImage: "none",
                boxShadow: { xs: "none", md: `0 14px 44px ${alpha(t.palette.text.primary, 0.08)}` },
                width: rightWidth,
                flex: "0 0 auto",
            })}
        >
            {/* Tab header */}
            {!hideTabs && (
                <Box
                    sx={(t) => ({
                        position: "absolute",
                        top: 0, left: 0, right: 0,
                        height: { xs: HEADER_H.xs, md: HEADER_H.md },
                        display: "flex",
                        alignItems: "center",
                        px: 1,
                        bgcolor: t.palette.background.paper,
                        backdropFilter: "none",
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.12),
                        zIndex: 10,
                    })}
                >
                    <Box sx={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "nowrap", width: "100%" }}>
                        {visibleTabs.map((tItem) => {
                            const isActive = safeTab === tItem.value;
                            const IconComp = ICON_MAP[tItem.value] || null;
                            return (
                                <Button
                                    key={tItem.value}
                                    type="button"
                                    disableElevation
                                    disableRipple
                                    variant="text"
                                    onClick={() => onTabChange?.(tItem.value)}
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
                sx={{
                    position: "absolute",
                    top: hideTabs ? 0 : { xs: HEADER_H.xs, md: HEADER_H.md },
                    left: 0, right: 0, bottom: 0,
                    overflowY: safeTab === "map" ? "hidden" : "auto",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {safeTab === "browse" ? (
                        <Box
                            key="tab-browse"
                            component={motion.div}
                            initial={TAB_MOTION_INITIAL}
                            animate={TAB_MOTION_ANIMATE}
                            exit={TAB_MOTION_EXIT}
                            transition={TAB_MOTION_TRANSITION}
                        >
                            <BrowsePanel
                                items={items}
                                categoryCounts={categoryCounts}
                                activeCity={activeCity}
                                activeCounty={activeCounty}
                                onSelectCategory={onSelectCategory}
                                onSelectPriceModel={onSelectPriceModel}
                                onSelectSort={onSelectSort}
                            />
                        </Box>
                    ) : null}

                    {safeTab === "details" ? (
                        <Box
                            key="tab-details"
                            component={motion.div}
                            initial={TAB_MOTION_INITIAL}
                            animate={TAB_MOTION_ANIMATE}
                            exit={TAB_MOTION_EXIT}
                            transition={TAB_MOTION_TRANSITION}
                            sx={{ height: "100%" }}
                        >
                            <MarketplaceListingDetailPanel
                                listingId={selectedListingId}
                                onClearSelection={onClearSelection}
                                user={user}
                                onRequireAuth={onRequireAuth}
                                onFavorite={onFavorite}
                                onRepost={onRepost}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onMarkSold={onMarkSold}
                                onRelist={onRelist}
                                onFlag={onFlag}
                            />
                        </Box>
                    ) : null}

                    {safeTab === "map" ? (
                        <Box
                            key="tab-map"
                            component={motion.div}
                            initial={TAB_MOTION_INITIAL}
                            animate={TAB_MOTION_ANIMATE}
                            exit={TAB_MOTION_EXIT}
                            transition={TAB_MOTION_TRANSITION}
                            sx={{ height: "100%", position: "relative" }}
                        >
                            <MarketplaceMapView
                                items={items}
                                isLoading={isMapLoading}
                                onSelectListing={onSelectListing}
                                selectedListingId={selectedListingId}
                                focusListingId={focusListingId}
                                onFocusListingHandled={onFocusListingHandled}
                                center={mapCenter}
                                zoomLevel={mapZoom}
                            />
                        </Box>
                    ) : null}
                </AnimatePresence>
            </Box>
        </Box>
    );
}

MarketplaceRightPanel.propTypes = {
    rightWidth: PropTypes.object.isRequired,
    activeTab: PropTypes.string.isRequired,
    onTabChange: PropTypes.func.isRequired,
    hideTabs: PropTypes.bool,
    selectedListingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    user: PropTypes.object,
    onRequireAuth: PropTypes.func,
    onSelectListing: PropTypes.func,
    onClearSelection: PropTypes.func,
    onFavorite: PropTypes.func,
    onRepost: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onMarkSold: PropTypes.func,
    onRelist: PropTypes.func,
    onFlag: PropTypes.func,
    items: PropTypes.array,
    categoryCounts: PropTypes.object,
    activeCity: PropTypes.string,
    activeCounty: PropTypes.string,
    onSelectCategory: PropTypes.func,
    onSelectCondition: PropTypes.func,
    onSelectPriceModel: PropTypes.func,
    onSelectCity: PropTypes.func,
    onSelectCounty: PropTypes.func,
    onSelectSort: PropTypes.func,
    isMapLoading: PropTypes.bool,
    focusListingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onFocusListingHandled: PropTypes.func,
};

MarketplaceRightPanel.defaultProps = {
    hideTabs: false,
    selectedListingId: null,
    user: null,
    onRequireAuth: undefined,
    onSelectListing: undefined,
    onClearSelection: undefined,
    onFavorite: undefined,
    onRepost: undefined,
    onEdit: undefined,
    onDelete: undefined,
    onMarkSold: undefined,
    onRelist: undefined,
    onFlag: undefined,
    items: [],
    categoryCounts: {},
    activeCity: "",
    activeCounty: "",
    onSelectCategory: undefined,
    onSelectCondition: undefined,
    onSelectPriceModel: undefined,
    onSelectCity: undefined,
    onSelectCounty: undefined,
    onSelectSort: undefined,
    isMapLoading: false,
    focusListingId: null,
    onFocusListingHandled: undefined,
};
