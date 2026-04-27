// src/pages/jobs/components/JobsRightPanel.jsx
import React, { useState, useEffect } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Chip, LinearProgress, Popover, Stack, Tab, Tabs, Typography } from "@mui/material";

import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";

import JobDetailPanel from "./JobDetailPanel";
import JobsMapView from "./JobsMapView";
import { getCategoryInfo } from "../utils/jobHelpers";
import { getDiscoverStaggerSx } from "../../../themes/theme";

/**
 * DiscoverContent
 * Replaces the "coming soon" placeholder with live job stats, top categories, and tips.
 */
export function DiscoverContent({ jobs, categories, onSelectCategory, activeCategory, locationCity, locationCounty, locationStatewide }) {
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    const totalJobs = safeJobs.length;

    const [revealed, setRevealed] = useState(false);

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
            : locationStatewide
                ? "statewide"
                : "across Alabama";

    // Count new jobs (< 48hrs)
    const newCount = safeJobs.filter((j) => {
        const d = j?.createdAt || j?.created_at;
        if (!d) return false;
        return Date.now() - new Date(d).getTime() < 48 * 60 * 60 * 1000;
    }).length;

    // Count unique employers/companies
    const employerSet = new Set();
    safeJobs.forEach((j) => {
        const company = (j?.company || j?.companyName || j?.company_name || "").trim().toLowerCase();
        if (company) employerSet.add(company);
    });
    const employerCount = employerSet.size;

    // Top categories from current jobs
    const catCounts = {};
    safeJobs.forEach((j) => {
        const slug = j?.category || j?.categoryName || "";
        if (slug) catCounts[slug] = (catCounts[slug] || 0) + 1;
    });
    const topCats = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([slug, count]) => ({ slug, count, ...getCategoryInfo(slug) }));

    const [tipAnchor, setTipAnchor] = useState(null);

    // Build sections array for stagger indexing
    let sectionIdx = 0;

    return (
        <Box sx={{ position: "absolute", inset: 0, overflowY: "auto", p: 2 }}>
            <Stack spacing={2.5}>
                {/* Header */}
                <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>
                                Jobs Overview
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                                Quick snapshot of the job board {locationLabel}.
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
                                    Tips for Job Seekers
                                </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Click the <strong>Apply</strong> button on any card to submit your application and resume directly.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Use the <strong>Map tab</strong> to find jobs near you.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Filter by category and job type to narrow your search.
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.45 }}>
                                {"\u2022"} Use the <strong>city and county filters</strong> to narrow jobs to your area.
                            </Typography>
                        </Stack>
                    </Popover>
                </Box>

                {/* Quick stats */}
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                    <StatCard icon={<WorkOutlineRoundedIcon sx={{ fontSize: 20 }} />}
                              label="Total Jobs" value={totalJobs} color="primary" />
                    <StatCard icon={<NewReleasesRoundedIcon sx={{ fontSize: 20 }} />}
                              label="New (48hr)" value={newCount} color="success" />
                    <StatCard icon={<BusinessRoundedIcon sx={{ fontSize: 20 }} />}
                              label="Employers" value={employerCount} color="info" />
                    <StatCard icon={<TrendingUpRoundedIcon sx={{ fontSize: 20 }} />}
                              label="Categories" value={Object.keys(catCounts).length} color="warning" />
                </Box>

                {/* Top categories */}
                {topCats.length > 0 ? (
                    <Box sx={{ ...getDiscoverStaggerSx(sectionIdx++, revealed) }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 13, mb: 1 }}>Popular Categories</Typography>
                        <Stack spacing={0.75}>
                            {topCats.map((cat) => {
                                const CatIcon = cat.Icon;
                                const pct = totalJobs > 0 ? Math.round((cat.count / totalJobs) * 100) : 0;
                                const isActive = activeCategory === cat.slug;
                                return (
                                    <Box
                                        key={cat.slug}
                                        onClick={() => {
                                            if (typeof onSelectCategory === "function") onSelectCategory(cat.slug);
                                        }}
                                        sx={(t) => ({
                                            display: "flex", alignItems: "center", gap: 1, p: 1,
                                            borderRadius: 2, cursor: "pointer",
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
                                        {CatIcon ? <CatIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} /> : null}
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: 700, fontSize: 12, overflow: "hidden",
                                                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>{cat.name}</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", flexShrink: 0, ml: 0.5 }}>
                                                    {cat.count}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate" value={pct}
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

function StatCard({ icon, label, value, color = "primary" }) {
    return (
        <Box sx={(t) => ({
            borderRadius: 2.5, p: 1.25,
            border: "1px solid", borderColor: alpha(t.palette[color]?.main || t.palette.primary.main, 0.15),
            bgcolor: alpha(t.palette[color]?.main || t.palette.primary.main, 0.04),
            display: "flex", flexDirection: "column", gap: 0.25,
        })}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ color: `${color}.main`, display: "flex", alignItems: "center" }}>{icon}</Box>
                <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1, color: `${color}.dark` }}>{value}</Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1.2 }}>{label}</Typography>
        </Box>
    );
}

export default function JobsRightPanel({
                                           activeTab,
                                           onTabChange,
                                           selectedJob,
                                           selectedJobId,
                                           user,
                                           onCloseDetail,
                                           onJobDeleted,
                                           onJobEdit,
                                           onOpenUserCard,
                                           onReport,
                                           onShare,
                                           onApply,
                                           onRenew,
                                           onSuccess,
                                           loggedInUser,
                                           activeAccount,
                                           jobs,
                                           onSelectJob,
                                           focusJobId,
                                           focusStatewide,
                                           onFocusJobHandled,
                                           categories,
                                           onSelectCategory,
                                           onSelectJobType,
                                           activeCategory,
                                           activeJobType,
                                           locationCity,
                                           locationCounty,
                                           locationStatewide,
                                           mapJobs,
                                           mapCenter,
                                           mapZoom,
                                       }) {
    const handleTabChange = (_, newVal) => {
        if (typeof onTabChange === "function") onTabChange(newVal);
    };

    return (
        <Box
            sx={(t) => ({
                position: "relative",
                height: "100%",
                p: 0,
                overflow: "hidden",
                border: "1px solid",
                borderColor: alpha(t.palette.primary.main, 0.12),
                borderRadius: 3,
                bgcolor: t.palette.background.paper,
                backdropFilter: "none",
                backgroundImage: "none",
                boxShadow: `0 14px 44px ${alpha(t.palette.text.primary, 0.08)}`,
                display: "flex",
                flexDirection: "column",
            })}
        >
            {/* Tab bar */}
            <Box sx={{ flexShrink: 0, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={(t) => ({
                        minHeight: 42,
                        bgcolor: t.palette.background.paper,
                        "& .MuiTab-root": {
                            minHeight: 42, textTransform: "none", fontWeight: 700,
                            fontSize: 13.5, py: 0,
                            color: t.palette.text.secondary,
                            "&.Mui-selected": { color: t.palette.primary.main, fontWeight: 950 },
                        },
                        "& .MuiTabs-indicator": { height: 2.5, borderRadius: 999, bgcolor: t.palette.primary.main },
                    })}
                >
                    <Tab value="discover" icon={<ExploreOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Discover" />
                    <Tab value="detail" icon={<WorkOutlineRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Job Detail" />
                    <Tab value="map" icon={<MapOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Map" />
                </Tabs>
            </Box>

            {/* Tab content */}
            <Box sx={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden", bgcolor: "background.paper" }}>
                {activeTab === "discover" && (
                    <DiscoverContent
                        jobs={jobs}
                        categories={categories}
                        onSelectCategory={onSelectCategory}
                        activeCategory={activeCategory}
                        locationCity={locationCity}
                        locationCounty={locationCounty}
                        locationStatewide={locationStatewide}
                    />
                )}

                {activeTab === "detail" && (
                    <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                        <JobDetailPanel
                            jobId={selectedJobId || selectedJob?.id}
                            job={selectedJob}
                            user={user}
                            onClose={onCloseDetail}
                            onDeleted={onJobDeleted}
                            onEdit={onJobEdit}
                            onOpenUserCard={onOpenUserCard}
                            onReport={onReport}
                            onShare={onShare}
                            onApply={onApply}
                            onRenew={onRenew}
                            onSuccess={onSuccess}
                            loggedInUser={loggedInUser}
                            activeAccount={activeAccount}
                        />
                    </Box>
                )}

                {activeTab === "map" && (
                    <Box sx={{ position: "absolute", inset: 0 }}>
                        <JobsMapView
                            jobs={mapJobs || jobs}
                            onSelectJob={(job) => {
                                if (typeof onSelectJob === "function") onSelectJob(job);
                            }}
                            selectedJobId={selectedJobId}
                            focusJobId={focusJobId}
                            focusStatewide={focusStatewide}
                            onFocusJobHandled={onFocusJobHandled}
                            center={mapCenter}
                            zoomLevel={mapZoom}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
