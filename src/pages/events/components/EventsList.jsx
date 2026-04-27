import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EventCard from "./EventCard";
import PulsingDots from "../../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../../components/NetworkErrorState";

/**
 * EventsList (Community PostList layout)
 * ------------------------------------
 * - Responsive grid: 1 column on xs, 2 columns on sm+, 3 on lg+
 * - Infinite scroll (IntersectionObserver)
 * - Smooth transitions: cards stay visible during refresh with gentle opacity dim,
 *   new cards stagger in, empty/skeleton states cross-fade.
 * - Passes user to EventCard for auth-gated actions
 */

/* ── Card animation variants (staggered entrance) ──────── */
const gridVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.045,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] },
    },
};

// ── Stable default prop values (MUST be outside the component) ──
// Prevents infinite re-render loops from new array references on every render.
const EMPTY_SELECTED_DATES = [];
const EMPTY_FRIENDS_MAP = {};

export default function EventsList({
                                       events,
                                       friendsGoingMap = EMPTY_FRIENDS_MAP,
                                       activeView = "all",
                                       onSelectEvent,
                                       isLoading = false,
                                       isRefreshing = false,
                                       isLoadingMore = false,
                                       error = null,
                                       hasMore = false,
                                       onLoadMore,
                                       datePreset = null,
                                       customStartDate = null,
                                       selectedDates = EMPTY_SELECTED_DATES,
                                       totalCount = null,
                                       onCreateEvent,
                                       user,
                                       onEngagementChange,
                                       onEditEvent,
                                       onDeleteEvent,
                                       onRefresh,
                                       onLocationClick,
                                       onCommentEvent,
                                       onHoverEvent,
                                       selectedEventId,
                                       emptyHeadline,
                                       emptySubtitle,
                                   }) {
    const theme = useTheme();
    const mt = theme.custom?.motion || {};
    const safeEvents = Array.isArray(events) ? events : [];
    const showInitialSkeletons = Boolean(isLoading) && safeEvents.length === 0;
    const showEmpty = !isLoading && !error && safeEvents.length === 0;

    // Network / connectivity error — show friendly offline state instead of list
    const networkDown = isNetworkError(error) && safeEvents.length === 0;

    // Show calendar prompt when Custom is selected but no dates chosen
    const showCalendarPrompt = datePreset === "custom" && (!customStartDate && selectedDates.length === 0);

    // Check if there are NO events in the database at all
    const hasNoEventsAtAll = totalCount === 0;

    // Bump grid key when the SET of event IDs changes (new/removed events)
    // to re-trigger stagger entrance. Sorting the IDs before comparing means
    // a simple re-order (e.g. switching sort mode) won't cause a full remount/flash.
    const [gridKey, setGridKey] = useState(0);
    const prevEventIdSetRef = useRef("");

    useEffect(() => {
        const sortedIds = safeEvents
            .map((e) => e.id)
            .filter(Boolean)
            .sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
            .join(",");
        if (sortedIds && sortedIds !== prevEventIdSetRef.current) {
            setGridKey((k) => k + 1);
        }
        prevEventIdSetRef.current = sortedIds;
    }, [safeEvents]);

    const sentinelRef = useRef(null);

    const rootEl = useMemo(() => {
        if (typeof document === "undefined") return null;
        return (
            document.querySelector("[data-events-scroll]") ||
            document.querySelector("[data-community-scroll]") ||
            null
        );
    }, []);

    useEffect(() => {
        const sentinelEl = sentinelRef.current;
        if (!sentinelEl) return undefined;

        if (typeof onLoadMore !== "function") return undefined;
        if (!hasMore) return undefined;

        const canAutoLoad = typeof window !== "undefined" && "IntersectionObserver" in window;
        if (!canAutoLoad) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting) return;
                if (isLoading || isRefreshing || isLoadingMore) return;
                onLoadMore();
            },
            { root: rootEl || null, rootMargin: "700px 0px 700px 0px", threshold: 0.01 }
        );

        observer.observe(sentinelEl);
        return () => observer.disconnect();
    }, [hasMore, isLoading, isRefreshing, isLoadingMore, onLoadMore, rootEl]);

    // Shared grid sx
    const gridSx = {
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
        gap: 2,
    };

    // Has events to show (even stale ones during refresh)
    const hasCards = safeEvents.length > 0;

    // Transition string using theme tokens
    const gentleTransition = `opacity ${mt.gentle || 320}ms ${mt.ease || "ease"}, filter ${mt.gentle || 320}ms ${mt.ease || "ease"}`;

    return (
        <Stack spacing={1.25} sx={{ minHeight: "100%" }}>
            {/* Network offline — friendly centered state */}
            {networkDown ? (
                <NetworkErrorState onRetry={onRefresh} />
            ) : error ? (
                <Alert
                    severity="error"
                    sx={(t) => ({
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: alpha(t.palette.error.main, 0.3),
                    })}
                >
                    {typeof error === "string" ? error : "Failed to load events. Please try again."}
                </Alert>
            ) : null}

            {/* Calendar prompt when Custom is selected but no dates chosen */}
            <AnimatePresence mode="wait">
                {showCalendarPrompt && !isLoading ? (
                    <Box
                        key="calendar-prompt"
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "50vh",
                            p: { xs: 3, md: 4 },
                            textAlign: "center",
                        }}
                    >
                        <CalendarTodayRoundedIcon
                            sx={{
                                fontSize: 56,
                                color: "primary.main",
                                mb: 2.5,
                                opacity: 0.85,
                            }}
                        />
                        <Typography sx={{ fontWeight: 950, fontSize: 20, mb: 1.25 }}>
                            Select Dates on Calendar
                        </Typography>
                        <Typography sx={{ fontSize: 15, opacity: 0.7, lineHeight: 1.6, maxWidth: 340 }}>
                            Click on dates in the calendar on the right to filter events for specific days.
                        </Typography>
                    </Box>
                ) : null}
            </AnimatePresence>

            {/* Initial loading */}
            <AnimatePresence mode="wait">
                {showInitialSkeletons && !showCalendarPrompt ? (
                    <Box
                        key="initial-loading"
                        component={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}
                    >
                        <PulsingDots />
                    </Box>
                ) : null}
            </AnimatePresence>

            {/* Empty state - only when NOT showing calendar prompt */}
            <AnimatePresence mode="wait">
                {showEmpty && !isRefreshing && !showCalendarPrompt ? (
                    <Box
                        key="empty-state"
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: 1,
                            minHeight: 0,
                            height: "100%",
                            p: { xs: 3, md: 4 },
                            textAlign: "center",
                        }}
                    >
                        {hasNoEventsAtAll ? (
                            <>
                                <Box sx={(t) => ({
                                    width: 64, height: 64, borderRadius: '50%',
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                })}>
                                    <EventRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 950, fontSize: 17, mt: 1.5 }}>
                                    {emptyHeadline || 'No Events Yet'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, mt: 1.5 }}>
                                    {emptySubtitle || 'Be the first to create an event and let your community know what\u2019s happening!'}
                                </Typography>
                                {typeof onCreateEvent === "function" ? (
                                    <Button
                                        variant="contained"
                                        startIcon={<AddRoundedIcon />}
                                        onClick={onCreateEvent}
                                        sx={(t) => ({
                                            mt: 2,
                                            borderRadius: 999,
                                            textTransform: "none",
                                            fontWeight: 950,
                                            px: 3,
                                            py: 1,
                                            fontSize: 15,
                                            color: t.palette.common.white,
                                            boxShadow: "none",
                                            "&:hover": { boxShadow: "none" },
                                        })}
                                    >
                                        Create an Event
                                    </Button>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Box sx={(t) => ({
                                    width: 64, height: 64, borderRadius: '50%',
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                                })}>
                                    <SearchOffRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 950, fontSize: 17, mt: 1.5 }}>
                                    {emptyHeadline || 'No Events Found'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380, mt: 1.5 }}>
                                    {emptySubtitle || 'Try adjusting your filters or expanding the date range to find more events.'}
                                </Typography>
                            </>
                        )}
                    </Box>
                ) : null}
            </AnimatePresence>

            {/*
              Events grid — STAYS VISIBLE during refresh with a gentle opacity dim.
              When new data arrives, cards stagger-animate in via framer-motion variants.
            */}
            {!showInitialSkeletons && !showCalendarPrompt && hasCards ? (
                <Box sx={{ position: "relative" }}>
                    {/* Refreshing overlay */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "center",
                            pt: 10,
                            opacity: isRefreshing ? 1 : 0,
                            pointerEvents: isRefreshing ? "auto" : "none",
                            transition: gentleTransition,
                        }}
                    >
                        <PulsingDots />
                    </Box>

                    {/* Grid wrapper — dims smoothly during refresh */}
                    <Box
                        key={`grid-${gridKey}`}
                        component={motion.div}
                        variants={gridVariants}
                        initial="hidden"
                        animate="visible"
                        sx={{
                            ...gridSx,
                            opacity: isRefreshing ? 0.45 : 1,
                            filter: isRefreshing ? "saturate(0.6)" : "saturate(1)",
                            transition: gentleTransition,
                        }}
                    >
                        {safeEvents.map((evt) => (
                            <motion.div
                                key={evt.id ?? `${evt.title || "event"}_${evt.startAt || ""}`}
                                variants={cardVariants}
                            >
                                <EventCard
                                    event={evt}
                                    user={user}
                                    activeView={activeView}
                                    initialFriendsGoing={friendsGoingMap[String(evt.id || evt.event_id)] || null}
                                    onClick={() => onSelectEvent?.(evt)}
                                    selected={selectedEventId != null && String(evt.id || evt.event_id) === String(selectedEventId)}
                                    onEngagementChange={onEngagementChange}
                                    onEdit={onEditEvent}
                                    onDelete={onDeleteEvent}
                                    onRefresh={onRefresh}
                                    onLocationClick={onLocationClick}
                                    onHover={onHoverEvent}
                                    onComment={() => {
                                        onCommentEvent?.(evt);
                                        try {
                                            window.dispatchEvent(new CustomEvent("ll:event:focus-comment"));
                                        } catch {
                                            // ignore
                                        }
                                    }}
                                />
                            </motion.div>
                        ))}

                        {/* Loading more */}
                        {Boolean(isLoadingMore) ? (
                            <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', py: 2 }}>
                                <PulsingDots sx={{ py: 2 }} />
                            </Box>
                        ) : null}
                    </Box>
                </Box>
            ) : null}

            {/* Invisible sentinel to trigger paging */}
            {typeof onLoadMore === "function" && safeEvents.length > 0 && !showCalendarPrompt ? (
                <Box ref={sentinelRef} sx={{ height: 1 }} />
            ) : null}

            {/* Small helper text */}
            {(hasMore || isLoadingMore) && safeEvents.length > 0 && !showCalendarPrompt ? (
                <Typography
                    variant="body2"
                    sx={{
                        opacity: isLoadingMore ? 0.65 : 0,
                        textAlign: "center",
                        transition: `opacity ${mt.slow || 220}ms ${mt.ease || "ease"}`,
                    }}
                >
                    Loading more&hellip;
                </Typography>
            ) : null}
        </Stack>
    );
}
