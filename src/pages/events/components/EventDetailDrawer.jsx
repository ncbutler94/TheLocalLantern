import React, { useEffect, useMemo, useState } from "react";
import { alpha } from "@mui/material/styles";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    Stack,
    Typography,
    useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../../components/Header/Header";

import {
    fetchEventById,
    fetchEventEngagementSummary,
    updateEventEngagement,
} from "../api/eventsApi";

/**
 * EventDetailDrawer
 * - Fetches full event details from GET /api/events/:id
 * - Uses engagement embedded in that response when present
 * - Falls back to GET /api/events/:id/engagement/summary if missing
 * - Allows auth-gated engagement actions (Interested / RSVP / Share)
 */

function extractEngagementFromEvent(evt) {
    const counts = evt?.engagement?.counts;
    const score = evt?.engagement?.score;

    if (!counts || typeof counts !== "object") return null;

    return {
        eventId: evt?.id,
        counts: {
            interested: Number(counts.interested || 0),
            rsvp: Number(counts.rsvp || 0),
            share: Number(counts.share || 0),
        },
        score: Number(score || 0),
    };
}

export default function EventDetailDrawer({
                                              open,
                                              onClose,
                                              event,
                                              user,
                                              onRequireAuth,
                                          }) {
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [fullEvent, setFullEvent] = useState(null);

    const [engagement, setEngagement] = useState(null);
    const [isEngLoading, setIsEngLoading] = useState(false);
    const [engError, setEngError] = useState("");
    const [engBusyType, setEngBusyType] = useState("");

    const eventId = event?.id;
    const canEngage = Boolean(user);

    const displayEvent = fullEvent || event;

    const embeddedEngagement = useMemo(
        () => extractEngagementFromEvent(fullEvent),
        [fullEvent]
    );

    useEffect(() => {
        let isActive = true;

        async function load() {
            if (!open) return;

            if (!eventId) {
                setFullEvent(null);
                setError("");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError("");

            try {
                const data = await fetchEventById(eventId);
                if (!isActive) return;
                setFullEvent(data);

                const embedded = extractEngagementFromEvent(data);
                if (embedded) {
                    setEngagement(embedded);
                }
            } catch (err) {
                if (!isActive) return;
                setError(err?.response?.data?.message || err?.message || "Failed to load event.");
                setFullEvent(null);
                setEngagement(null);
            } finally {
                if (!isActive) return;
                setIsLoading(false);
            }
        }

        load();

        return () => {
            isActive = false;
        };
    }, [open, eventId]);

    useEffect(() => {
        let isActive = true;

        async function loadEngFallback() {
            if (!open) return;
            if (!eventId) return;

            // If engagement came with the event details, do nothing.
            if (embeddedEngagement) return;

            setIsEngLoading(true);
            setEngError("");

            try {
                const data = await fetchEventEngagementSummary(eventId);
                if (!isActive) return;

                setEngagement({
                    eventId,
                    counts: {
                        interested: Number(data?.counts?.interested || 0),
                        rsvp: Number(data?.counts?.rsvp || 0),
                        share: Number(data?.counts?.share || 0),
                    },
                    score: Number(data?.score || 0),
                });
            } catch (err) {
                if (!isActive) return;
                setEngError(
                    err?.response?.data?.message || err?.message || "Failed to load engagement."
                );
                setEngagement(null);
            } finally {
                if (!isActive) return;
                setIsEngLoading(false);
            }
        }

        loadEngFallback();

        return () => {
            isActive = false;
        };
    }, [open, eventId, embeddedEngagement]);

    const handleEngage = async (type) => {
        if (!eventId) return;

        if (!canEngage) {
            if (onRequireAuth) onRequireAuth();
            return;
        }

        try {
            setEngBusyType(type);
            setEngError("");
            const data = await updateEventEngagement(eventId, {
                type,
                action: "toggle",
            });

            setEngagement((prev) => ({
                ...(prev || { eventId }),
                counts: {
                    interested: Number(data?.counts?.interested || 0),
                    rsvp: Number(data?.counts?.rsvp || 0),
                    share: Number(data?.counts?.share || 0),
                },
                score: Number(data?.score || 0),
            }));
        } catch (err) {
            setEngError(
                err?.response?.data?.message || err?.message || "Failed to update engagement."
            );
        } finally {
            setEngBusyType("");
        }
    };

    return (
        <Drawer
            anchor={isMobile ? "bottom" : "right"}
            open={Boolean(open)}
            onClose={onClose}
            PaperProps={{
                sx: (t) => ({
                    width: isMobile ? "100%" : 420,
                    height: isMobile ? "70vh" : "100%",
                    borderTopLeftRadius: isMobile ? 16 : 0,
                    borderTopRightRadius: isMobile ? 16 : 0,
                    pb: isMobile ? `${MOBILE_BOTTOM_NAV_HEIGHT}px` : 0,

                    bgcolor: alpha(t.palette.background.paper, 0.96),
                    backgroundImage: "none",
                    backdropFilter: "saturate(140%) blur(10px)",
                    border: "1px solid",
                    borderColor: alpha(t.palette.primary.main, 0.12),
                    boxShadow: `0 18px 54px ${alpha(t.palette.text.primary, 0.16)}`,
                    overflow: "hidden",
                }),
            }}
        >
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {/* Sticky header */}
                <Box
                    sx={(t) => ({
                        position: "sticky",
                        top: 0,
                        zIndex: 5,
                        px: 2.25,
                        pt: 1.75,
                        pb: 1.25,
                        bgcolor: alpha(t.palette.background.paper, 0.96),
                        backgroundImage: "none",
                        backdropFilter: "saturate(140%) blur(10px)",
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.12),
                    })}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                            Event Details
                        </Typography>

                        <IconButton
                            aria-label="Close"
                            onClick={onClose}
                            size="small"
                            sx={(t) => ({
                                color: t.palette.text.secondary,
                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.10) },
                            })}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>

                {/* Scroll body */}
                <Box sx={{ p: 2.25, flex: 1, minHeight: 0, overflowY: "auto" }}>
                    <Divider sx={{ mb: 1.5 }} />

                    {error ? (
                        <Alert severity="error" sx={{ borderRadius: 2, mb: 1.5 }}>
                            {error}
                        </Alert>
                    ) : null}

                    {isLoading ? (
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 2 }}>
                            <CircularProgress size={18} />
                            <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                Loading…
                            </Typography>
                        </Stack>
                    ) : null}

                    {!isLoading && displayEvent ? (
                        <Stack spacing={1}>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                {displayEvent.title || "Untitled event"}
                            </Typography>

                            {displayEvent.startLabel || displayEvent.startAt ? (
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                    {displayEvent.startLabel || displayEvent.startAt}
                                </Typography>
                            ) : null}

                            {displayEvent.endAt ? (
                                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                    Ends: {String(displayEvent.endAt)}
                                </Typography>
                            ) : null}

                            {displayEvent.locationScope ? (
                                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                    {displayEvent.locationScope === "statewide"
                                        ? "Statewide"
                                        : displayEvent.locationScope === "county"
                                            ? displayEvent.county || "County"
                                            : displayEvent.city || "City"}
                                </Typography>
                            ) : null}

                            {displayEvent.venueName ? (
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                    Venue: {displayEvent.venueName}
                                </Typography>
                            ) : null}

                            {displayEvent.includeExactAddress && displayEvent.venueAddress ? (
                                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                    Address: {displayEvent.venueAddress}
                                </Typography>
                            ) : null}

                            {displayEvent.description ? (
                                <Typography
                                    variant="body2"
                                    sx={{ opacity: 0.9, whiteSpace: "pre-wrap" }}
                                >
                                    {displayEvent.description}
                                </Typography>
                            ) : null}

                            <Divider sx={{ my: 0.5 }} />

                            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                Engagement
                            </Typography>

                            {engError ? (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>
                                    {engError}
                                </Alert>
                            ) : null}

                            {isEngLoading ? (
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        Loading engagement…
                                    </Typography>
                                </Stack>
                            ) : (
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleEngage("interested")}
                                            disabled={engBusyType === "interested"}
                                            sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999 }}
                                        >
                                            {engBusyType === "interested" ? "…" : "Interested"}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleEngage("rsvp")}
                                            disabled={engBusyType === "rsvp"}
                                            sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999 }}
                                        >
                                            {engBusyType === "rsvp" ? "…" : "RSVP"}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => handleEngage("share")}
                                            disabled={engBusyType === "share"}
                                            sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999 }}
                                        >
                                            {engBusyType === "share" ? "…" : "Share"}
                                        </Button>
                                    </Stack>

                                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                                        Interested: {engagement?.counts?.interested ?? 0} • RSVP:{" "}
                                        {engagement?.counts?.rsvp ?? 0} • Shares:{" "}
                                        {engagement?.counts?.share ?? 0}
                                    </Typography>

                                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                        Trending score: {engagement?.score ?? 0}
                                    </Typography>

                                    {!canEngage ? (
                                        <Typography variant="caption" sx={{ opacity: 0.75 }}>
                                            Login to engage.
                                        </Typography>
                                    ) : null}
                                </Stack>
                            )}
                        </Stack>
                    ) : null}

                    {!isLoading && !displayEvent ? (
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            No event selected.
                        </Typography>
                    ) : null}
                </Box>
            </Box>
        </Drawer>
    );
}
