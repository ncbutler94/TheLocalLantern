// src/pages/services/components/RequestsOverviewPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { alpha } from "@mui/material/styles";
import {
    Box,
    Chip,
    LinearProgress,
    Popover,
    Stack,
    Typography,
} from "@mui/material";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import { getServiceCategoryInfo } from "../utils/serviceHelpers";
import { getDiscoverStaggerSx } from "../../../themes/theme";

/* ── Stat card (matches Events DiscoverStatCard) ── */
function StatCard({ icon, label, value, color = "primary", onClick }) {
    return (
        <Box
            onClick={onClick}
            sx={(t) => ({
                borderRadius: 2.5,
                p: 1.25,
                border: "1px solid",
                borderColor: alpha(t.palette[color]?.main || t.palette.primary.main, 0.15),
                bgcolor: alpha(t.palette[color]?.main || t.palette.primary.main, 0.04),
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                cursor: onClick ? "pointer" : "default",
                transition: "all 120ms ease",
                ...(onClick ? {
                    "&:hover": {
                        bgcolor: alpha(t.palette[color]?.main || t.palette.primary.main, 0.08),
                        borderColor: alpha(t.palette[color]?.main || t.palette.primary.main, 0.25),
                    },
                } : {}),
            })}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ color: `${color}.main`, display: "flex", alignItems: "center" }}>
                    {icon}
                </Box>
                <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1, color: `${color}.dark` }}>
                    {value}
                </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1.2 }}>
                {label}
            </Typography>
        </Box>
    );
}

/**
 * RequestsOverviewPanel
 *
 * Shows a snapshot of community service requests — categories, urgency,
 * location scope. Clicking a category or urgency chip activates filters.
 */
export default function RequestsOverviewPanel({
                                                  requestItems,
                                                  activeCategory = "",
                                                  activeUrgency = "",
                                                  locationCity = "",
                                                  locationCounty = "",
                                                  locationStatewide = false,
                                                  onSelectCategory,
                                                  onSelectUrgency,
                                              }) {
    const safeItems = Array.isArray(requestItems) ? requestItems : [];
    const total = safeItems.length;

    const [revealed, setRevealed] = useState(false);
    const [tipAnchor, setTipAnchor] = useState(null);

    // Build a stable key from the data so we can fade when filters change
    const dataKey = `${total}-${locationCity}-${locationCounty}-${locationStatewide}`;
    const prevDataKeyRef = useRef(dataKey);

    // Always trigger reveal on mount + when data changes
    useEffect(() => {
        const isDataChange = prevDataKeyRef.current !== dataKey;
        prevDataKeyRef.current = dataKey;

        let cancelled = false;
        setRevealed(false);
        // Use a small setTimeout to ensure the opacity:0 frame renders first,
        // especially when wrapped inside <Fade> which may delay paint.
        const timer = setTimeout(() => {
            if (!cancelled) setRevealed(true);
        }, 50);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [dataKey]);

    // Build location-aware subtitle
    const locationLabel = locationCity
        ? `in ${locationCity}${locationCounty ? `, ${locationCounty} County` : ""}`
        : locationCounty
            ? `in ${locationCounty} County`
            : locationStatewide
                ? "statewide"
                : "across Alabama";

    // Status counts
    const openCount = safeItems.filter((r) => r.status === "open").length;
    const asapCount = safeItems.filter((r) => r.urgency === "asap").length;

    // Category counts
    const catMap = {};
    safeItems.forEach((r) => {
        const slug = r.categorySlug || r.category_slug || "";
        if (slug) catMap[slug] = (catMap[slug] || 0) + 1;
    });
    const catEntries = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([slug, count]) => ({ slug, count }));
    const maxCatCount = catEntries.length > 0 ? Math.max(...catEntries.map((c) => c.count)) : 1;
    const uniqueCatCount = Object.keys(catMap).length;

    let sectionIdx = 0;

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2.5}>
                {/* Header */}
                <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>
                                Requests Overview
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                                See what your community is looking for {locationLabel}.
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
                                bgcolor: (t) => alpha(t.palette.warning.light, 0.18),
                                boxShadow: `0 12px 36px ${alpha(t.palette.text.primary, 0.14)}`,
                            }),
                        }}
                    >
                        <Stack spacing={0.75}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                                <TipsAndUpdatesRoundedIcon sx={{ fontSize: 18, color: "warning.main" }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 13, color: "warning.dark" }}>
                                    Tips for Providers
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Click a <strong>category above</strong> to filter requests instantly.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} <strong>ASAP</strong> requests are time-sensitive. Respond quickly!
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Click any request card to view details and <strong>submit a response</strong>.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Use the <strong>city and county filters</strong> to narrow requests to your service area.
                            </Typography>
                        </Stack>
                    </Popover>
                </Box>

                {/* Quick stats grid */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <StatCard
                        icon={<InboxRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Total Requests"
                        value={total}
                        color="primary"
                    />
                    <StatCard
                        icon={<LockOpenRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Open"
                        value={openCount}
                        color="success"
                    />
                    <StatCard
                        icon={<BoltRoundedIcon sx={{ fontSize: 20 }} />}
                        label="ASAP"
                        value={asapCount}
                        color="error"
                        onClick={asapCount > 0 && typeof onSelectUrgency === "function" ? () => onSelectUrgency(activeUrgency === "asap" ? "" : "asap") : undefined}
                    />
                    <StatCard
                        icon={<CategoryRoundedIcon sx={{ fontSize: 20 }} />}
                        label="Categories"
                        value={uniqueCatCount}
                        color="warning"
                    />
                </Box>

                {/* Popular Categories */}
                {catEntries.length > 0 && (
                    <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>
                            Popular Categories
                        </Typography>
                        <Stack spacing={0.75}>
                            {catEntries.map((cat) => {
                                const info = getServiceCategoryInfo(cat.slug);
                                const CatIcon = info?.Icon || CategoryRoundedIcon;
                                const label = info?.name || cat.slug;
                                const pct = maxCatCount > 0 ? Math.round((cat.count / maxCatCount) * 100) : 0;
                                const isActive = activeCategory === cat.slug;
                                return (
                                    <Box
                                        key={cat.slug}
                                        onClick={() => {
                                            if (typeof onSelectCategory === "function") onSelectCategory(cat.slug);
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
                                            transition: "all 120ms ease",
                                            "&:hover": {
                                                bgcolor: alpha(t.palette.primary.main, isActive ? 0.1 : 0.04),
                                                borderColor: alpha(t.palette.primary.main, isActive ? 0.4 : 0.15),
                                            },
                                        })}
                                    >
                                        <CatIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {label}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", flexShrink: 0, ml: 0.5 }}>
                                                    {cat.count}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={pct}
                                                sx={(t) => ({
                                                    height: 4,
                                                    borderRadius: 999,
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
                )}

            </Stack>
        </Box>
    );
}