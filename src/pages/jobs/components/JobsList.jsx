// src/pages/jobs/components/JobsList.jsx
import React, { useEffect, useRef } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Box, Button, Stack, Typography } from "@mui/material";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import AddIcon from "@mui/icons-material/Add";
import JobCard from "./JobCard";
import PulsingDots from "../../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../../components/NetworkErrorState";
import { ensureListStaggerKeyframes, getListStaggerSx } from "../../../themes/theme";

/**
 * JobsList
 *
 * Props:
 * - items: array of job objects
 * - isLoading: boolean
 * - isEmpty: boolean
 * - onClickJob?: (job) => void
 * - hasMore?: boolean
 * - onLoadMore?: () => void
 * - emptyTitle?: string
 * - emptyMessage?: string
 * - selectedJobId?: number|string|null — highlight the selected card
 * - showStatus?: boolean — pass to JobCard (My Jobs mode)
 * - onEditJob?: (job) => void
 * - onDeleteJob?: (job) => void
 * - totalCount?: number — total matching jobs (for empty state logic)
 * - onCreateJob?: () => void — opens Create Job modal
 * - isMyMode?: boolean
 * - onApply?: (job) => void — opens Apply dialog
 * - filters?: object — active filters for contextual empty states
 * - search?: string — active search term
 * - viewMode?: string — "all" | "saved" | "applied" | "mine"
 */
export default function JobsList({
                                     items,
                                     isLoading,
                                     isEmpty,
                                     error,
                                     onClickJob,
                                     hasMore = false,
                                     onLoadMore,
                                     emptyTitle,
                                     emptyMessage,
                                     selectedJobId,
                                     showStatus,
                                     onEditJob,
                                     onDeleteJob,
                                     onOpenUserCard,
                                     onReport,
                                     onRenew,
                                     onShare,
                                     onApply,
                                     onSave,
                                     user,
                                     activeAccount,
                                     onLocationClick,
                                     totalCount,
                                     onCreateJob,
                                     isMyMode = false,
                                     onRefresh,
                                     filters,
                                     search,
                                     viewMode,
                                 }) {
    const sentinelRef = useRef(null);
    const theme = useTheme();
    const isMobileScreen = useMediaQuery(theme.breakpoints.down("md"));

    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // Infinite scroll: observe a sentinel element at the bottom
    useEffect(() => {
        if (!hasMore || !onLoadMore || isLoading) return;

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    onLoadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, onLoadMore, isLoading]);

    // Network / connectivity error — show friendly offline state
    if (isNetworkError(error) && (!Array.isArray(items) || items.length === 0)) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 0, height: "100%" }}>
                <NetworkErrorState onRetry={onRefresh} />
            </Box>
        );
    }

    if (isLoading && (!Array.isArray(items) || items.length === 0)) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 240, width: "100%", height: "100%" }}>
                <PulsingDots />
            </Box>
        );
    }

    if (isEmpty) {
        return (
            <EmptyState
                title={emptyTitle}
                message={emptyMessage}
                isMyMode={isMyMode}
                onCreateJob={onCreateJob}
                totalCount={totalCount}
                filters={filters}
                search={search}
                viewMode={viewMode}
            />
        );
    }

    return (
        <Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%", alignItems: "stretch", justifyContent: "flex-start", overflowX: "hidden" }}>
                {(Array.isArray(items) ? items : []).map((job, idx) => (
                    <Box
                        key={job.id}
                        sx={(t) => ({
                            display: "flex",
                            flex: {
                                xs: "0 0 100%",
                                sm: "0 0 100%",
                                md: "0 0 calc(50% - 16px)",
                                lg: "0 0 calc(50% - 16px)",
                                xl: "0 0 calc(50% - 16px)",
                            },
                            // Mobile: no margin, edge-to-edge with bottom divider
                            mx: { xs: 0, md: 1 },
                            my: { xs: 0, md: 1 },
                            minWidth: 0,
                            maxWidth: "100%",
                            borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.1)}`, md: "none" },
                            "&:last-child": { borderBottom: { xs: "none", md: "none" } },
                            ...getListStaggerSx(idx),
                        })}
                    >
                        <JobCard
                            job={job}
                            onClick={onClickJob}
                            selected={selectedJobId != null && String(job.id) === String(selectedJobId)}
                            showStatus={showStatus}
                            onEdit={onEditJob}
                            onDelete={onDeleteJob}
                            onOpenUserCard={onOpenUserCard}
                            onReport={onReport}
                            onRenew={onRenew}
                            onShare={onShare}
                            onApply={onApply}
                            onSave={onSave}
                            user={user}
                            activeAccount={activeAccount}
                            onLocationClick={onLocationClick}
                            flat={isMobileScreen}
                        />
                    </Box>
                ))}
            </Box>

            {/* Infinite scroll sentinel + loading */}
            {hasMore && typeof onLoadMore === "function" ? (
                <Box ref={sentinelRef}>
                    {isLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                            <PulsingDots />
                        </Box>
                    ) : null}
                </Box>
            ) : null}
        </Box>
    );
}

/* ── (empty state messages are now provided by parent via emptyTitle / emptyMessage) ── */

function EmptyState({ title, message, isMyMode, onCreateJob, totalCount, filters, search, viewMode }) {
    // Determine if there are truly zero jobs (no results at all, not just filtered to zero)
    const isAbsolutelyEmpty = totalCount === 0 || totalCount === undefined;

    // Check active filter/search context
    const hasSearch = Boolean(String(search || "").trim());
    const hasCategory = Boolean(filters?.category && filters.category !== "All");
    const hasJobType = Boolean(Array.isArray(filters?.jobTypes) && filters.jobTypes.length > 0);
    const hasWorkMode = Boolean(Array.isArray(filters?.workModes) && filters.workModes.length > 0);
    const hasCounty = Boolean(String(filters?.county || "").trim());
    const hasCity = Boolean(String(filters?.city || "").trim());
    const hasAnyFilter = hasSearch || hasCategory || hasJobType || hasWorkMode || hasCounty || hasCity;

    const isSavedMode = viewMode === "saved";
    const isAppliedMode = viewMode === "applied";

    // ── Pick the right icon ──
    let IconComp = WorkRoundedIcon;
    if (isSavedMode) {
        IconComp = BookmarkBorderRoundedIcon;
    } else if (isAppliedMode) {
        IconComp = AssignmentTurnedInRoundedIcon;
    } else if (hasSearch) {
        IconComp = SearchOffRoundedIcon;
    } else if (hasAnyFilter && !isAbsolutelyEmpty) {
        IconComp = TuneRoundedIcon;
    }

    // Use parent-provided title/message (from getJobEmptyStateMessages), with fallbacks
    const resolvedTitle = title || (isMyMode ? "No Jobs Posted Yet" : "No Jobs Yet");
    const resolvedMessage = message || "Try adjusting your filters or searching with fewer keywords.";

    const showCreateButton = typeof onCreateJob === "function" && isAbsolutelyEmpty && !isSavedMode && !isAppliedMode;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                flex: 1,
                minHeight: 0,
                height: "100%",
                py: 4,
                px: 2,
            }}
        >
            <Stack spacing={1.5} alignItems="center">
                <Box sx={(t) => ({
                    width: 64, height: 64, borderRadius: "50%",
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 0.5,
                })}>
                    <IconComp sx={{ fontSize: 32, color: "primary.main" }} />
                </Box>

                <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                    {resolvedTitle}
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 380 }}>
                    {resolvedMessage}
                </Typography>

                {showCreateButton ? (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onCreateJob}
                        sx={(t) => ({
                            mt: 1.5,
                            borderRadius: 999,
                            textTransform: "none",
                            fontWeight: 950,
                            fontSize: 15,
                            px: 3,
                            py: 1,
                            color: t.palette.common.white,
                            boxShadow: "none",
                            "&:hover": { boxShadow: "none" },
                        })}
                    >
                        Create a Job
                    </Button>
                ) : null}
            </Stack>
        </Box>
    );
}
