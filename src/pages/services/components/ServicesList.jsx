// src/pages/services/components/ServicesList.jsx
import React, { useEffect, useRef } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Button, Stack, Typography } from "@mui/material";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import AddIcon from "@mui/icons-material/Add";
import ServiceCard from "./ServiceCard";
import { ensureListStaggerKeyframes, getListStaggerSx } from "../../../themes/theme";
import PulsingDots from "../../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../../components/NetworkErrorState";

/**
 * ServicesList
 *
 * Mirrors JobsList exactly:
 * - 2-column flex layout on md+
 * - Infinite scroll sentinel
 * - Skeleton loading states
 * - Rich empty state with CTA
 * - Staggered fade-in animation on new results
 */
export default function ServicesList({
                                         items,
                                         isLoading,
                                         isEmpty,
                                         onClickService,
                                         hasMore = false,
                                         onLoadMore,
                                         emptyTitle,
                                         emptyMessage,
                                         selectedServiceId,
                                         showStatus,
                                         onEditService,
                                         onDeleteService,
                                         onOpenUserCard,
                                         onReport,
                                         onShare,
                                         onLocationClick,
                                         onRequestQuote,
                                         onFavorite,
                                         onHoverService,
                                         user,
                                         activeAccount,
                                         totalCount,
                                         onCreateService,
                                         isMyMode = false,
                                         error,
                                         onRefresh,
                                         skipStagger = false,
                                     }) {
    const sentinelRef = useRef(null);

    // ── Stable refs for callbacks used inside IntersectionObserver ──
    // Storing onLoadMore in a ref prevents the observer effect from
    // tearing down and re-creating every time the parent renders a new
    // function reference.  Without this, a new observer would fire its
    // callback immediately when the sentinel is already visible, the
    // parent would setState → re-render → new function → new observer
    // → fires again → infinite loop.
    const onLoadMoreRef = useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;

    const isLoadingRef = useRef(isLoading);
    isLoadingRef.current = isLoading;

    // Inject list stagger keyframes once
    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // Infinite scroll — deps are ONLY the boolean `hasMore` so the
    // observer is set up once (per hasMore transition) and reads the
    // latest callback / loading state from refs.
    useEffect(() => {
        if (!hasMore) return;

        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && !isLoadingRef.current && typeof onLoadMoreRef.current === "function") {
                    onLoadMoreRef.current();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [hasMore]);

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
            <Box sx={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                <PulsingDots />
            </Box>
        );
    }

    if (isEmpty) {
        return (
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <EmptyState
                    title={emptyTitle}
                    message={emptyMessage}
                    isMyMode={isMyMode}
                    onCreateService={onCreateService}
                    totalCount={totalCount}
                />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
                {(Array.isArray(items) ? items : []).map((service, idx) => (
                    <Box
                        key={service.id}
                        sx={{
                            display: "flex",
                            flex: {
                                xs: "0 0 100%",
                                sm: "0 0 100%",
                                md: "0 0 calc(50% - 16px)",
                                lg: "0 0 calc(50% - 16px)",
                                xl: "0 0 calc(50% - 16px)",
                            },
                            mx: { xs: 0, md: 1 },
                            my: { xs: 0, md: 1 },
                            minWidth: 0,
                            maxWidth: "100%",
                            ...(skipStagger ? {} : getListStaggerSx(idx)),
                        }}
                    >
                        <ServiceCard
                            service={service}
                            onClick={onClickService}
                            selected={selectedServiceId != null && String(service.id) === String(selectedServiceId)}
                            showStatus={showStatus}
                            onEdit={onEditService}
                            onDelete={onDeleteService}
                            onOpenUserCard={onOpenUserCard}
                            onReport={onReport}
                            onShare={onShare}
                            onLocationClick={onLocationClick}
                            onRequestQuote={onRequestQuote}
                            onFavorite={onFavorite}
                            onHover={onHoverService}
                            user={user}
                            activeAccount={activeAccount}
                        />
                    </Box>
                ))}
            </Box>

            {/* Infinite scroll sentinel */}
            {hasMore && typeof onLoadMore === "function" ? (
                <Box ref={sentinelRef}>
                    {isLoading ? (
                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', py: 2 }}>
                            <PulsingDots sx={{ py: 2 }} />
                        </Box>
                    ) : null}
                </Box>
            ) : null}
        </Box>
    );
}

function EmptyState({ title, message, isMyMode, onCreateService, totalCount }) {
    const isAbsolutelyEmpty = totalCount === 0 || totalCount === undefined;
    const isFilteredEmpty = !isAbsolutelyEmpty;

    const resolvedTitle = title || (isMyMode
        ? "No Services Posted Yet"
        : isFilteredEmpty
            ? "No Services Found"
            : "No Services Yet");

    const resolvedMessage = message || (isMyMode
        ? "Services you offer will appear here. Get started by creating your first service listing!"
        : isFilteredEmpty
            ? "Try adjusting your filters or searching with fewer keywords."
            : "Be the first to offer a service and help your community!");

    const showCreateButton = typeof onCreateService === "function" && !isFilteredEmpty;

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
                    {isMyMode ? (
                        <HandymanRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
                    ) : (
                        <BuildRoundedIcon sx={{ fontSize: 32, color: "primary.main" }} />
                    )}
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
                        onClick={onCreateService}
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
                        Offer a Service
                    </Button>
                ) : null}
            </Stack>
        </Box>
    );
}
