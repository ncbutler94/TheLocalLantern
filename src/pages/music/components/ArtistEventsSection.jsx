/**
 * ArtistEventsSection
 * Location: src/pages/music/components/ArtistEventsSection.jsx
 *
 * Displays events created by the artist's owner on the artist profile.
 * Uses the shared EventCard component in a 2-column grid – matching
 * the business profile events layout.
 *
 * Fetches from GET /api/events?organizerUserId=X&sort=soonest&range=upcoming
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Button, Chip, CircularProgress, Collapse, FormControl,
    IconButton, InputLabel, MenuItem, Select, Skeleton, Stack,
    Tooltip, Typography,
} from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import TuneIcon from "@mui/icons-material/Tune";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SortIcon from "@mui/icons-material/Sort";

import { useActiveAccount } from "../../../components/AccountContext";
import { fetchEvents } from "../../events/api/eventsApi";
import EventCard from "../../events/components/EventCard";
import CreateEditEventModal from "../../events/modals/CreateEditEventModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPastEvent(event) {
    if (!event?.startAt && !event?.start_at) return false;
    const start = new Date(event.startAt || event.start_at);
    return start < new Date();
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ArtistEventsSection({ artist, canManage, user }) {
    const navigate = useNavigate();
    const { accountCacheKey } = useActiveAccount();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & sort state – matches business profile pattern
    const [filterRange, setFilterRange] = useState("upcoming");
    const [sortBy, setSortBy] = useState("soonest");
    const [showFilters, setShowFilters] = useState(false);
    const [createEventOpen, setCreateEventOpen] = useState(false);

    const ownerUserId = artist?.owner_user_id || artist?.ownerUserId;
    const artistId = artist?.id;
    const artistHandle = artist?.handle || "";

    useEffect(() => {
        if (!artistId && !ownerUserId) { setLoading(false); return; }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const params = {
                    sort: "soonest",
                    range: "all",
                    limit: 50,
                    includeTotal: 1,
                };
                if (artistId) params.artistAccountId = artistId;
                if (ownerUserId) params.organizerUserId = ownerUserId;

                const data = await fetchEvents(params);
                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                if (!cancelled) setEvents(items);
            } catch {
                if (!cancelled) setEvents([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [artistId, ownerUserId, accountCacheKey]);

    // ── Client-side filter + sort (matching business profile) ──
    const sortedEvents = (() => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let filtered = events;

        if (filterRange === "upcoming") {
            filtered = events.filter((e) => !isPastEvent(e));
        } else if (filterRange === "past") {
            filtered = events.filter((e) => isPastEvent(e));
        } else if (filterRange === "week") {
            filtered = events.filter((e) => {
                const s = new Date(e.startAt || e.start_at || 0);
                return s >= startOfWeek && s < endOfWeek;
            });
        } else if (filterRange === "month") {
            filtered = events.filter((e) => {
                const s = new Date(e.startAt || e.start_at || 0);
                return s >= startOfMonth && s <= endOfMonth;
            });
        }

        const sorted = [...filtered];
        if (sortBy === "soonest") {
            sorted.sort((a, b) => new Date(a.startAt || a.start_at || 0) - new Date(b.startAt || b.start_at || 0));
        } else if (sortBy === "latest") {
            sorted.sort((a, b) => new Date(b.startAt || b.start_at || 0) - new Date(a.startAt || a.start_at || 0));
        } else if (sortBy === "az") {
            sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        }
        return sorted;
    })();

    const hasEvents = sortedEvents.length > 0;

    const handleEventClick = (evt) => {
        // Save scroll position and active tab so the artist profile can restore it on return
        try {
            const storeKey = artistHandle || artistId;
            sessionStorage.setItem(
                `ll:artistProfile:${storeKey}:scrollY`,
                String(window.scrollY || 0)
            );
            sessionStorage.setItem(
                `ll:artistProfile:${storeKey}:activeTab`,
                "2"
            );
            sessionStorage.setItem(
                `ll:artistProfile:${storeKey}:restore`,
                "1"
            );
        } catch {
            // ignore
        }

        navigate(`/events/${evt.id}`, {
            state: {
                fromEvents: true,
                fromArtist: {
                    handle: artistHandle,
                    name: artist?.name || "",
                    id: artistId,
                },
            },
        });
    };

    return (
        <Box>
            {/* ── Header ── */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: "primary.main" }}><EventRoundedIcon /></Box>
                    <Typography variant="h6" fontWeight={700}>Events</Typography>
                    {events.length > 0 && (
                        <Chip label={sortedEvents.length} size="small" sx={{ fontWeight: 600 }} />
                    )}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
                        <IconButton
                            size="small"
                            onClick={() => setShowFilters(!showFilters)}
                            color={showFilters ? "primary" : "default"}
                        >
                            {showFilters ? <TuneIcon /> : <TuneOutlinedIcon />}
                        </IconButton>
                    </Tooltip>
                    {showFilters && (filterRange !== "upcoming" || sortBy !== "soonest") && (
                        <Tooltip title="Clear filters">
                            <IconButton
                                size="small"
                                onClick={() => { setFilterRange("upcoming"); setSortBy("soonest"); }}
                                color="default"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {canManage && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setCreateEventOpen(true)}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                        >
                            Create Event
                        </Button>
                    )}
                </Stack>
            </Stack>

            {/* ── Collapsible filters ── */}
            <Collapse in={showFilters}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ mb: 2, pb: 2, borderBottom: "1px solid", borderColor: "divider" }}
                >
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={filterRange}
                            label="Time Range"
                            onChange={(e) => setFilterRange(e.target.value)}
                        >
                            <MenuItem value="upcoming">Upcoming</MenuItem>
                            <MenuItem value="week">This Week</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="past">Past Events</MenuItem>
                            <MenuItem value="all">All Events</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                            value={sortBy}
                            label="Sort By"
                            onChange={(e) => setSortBy(e.target.value)}
                            startAdornment={<SortIcon sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }} />}
                        >
                            <MenuItem value="soonest">Soonest First</MenuItem>
                            <MenuItem value="latest">Latest First</MenuItem>
                            <MenuItem value="az">A–Z</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Collapse>

            {/* ── Events grid ── */}
            {loading ? (
                <Stack spacing={2}>
                    {[0, 1, 2].map((i) => (
                        <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 2 }} />
                    ))}
                </Stack>
            ) : hasEvents ? (
                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                    gap: 2,
                }}>
                    {sortedEvents.map((evt) => (
                        <EventCard
                            key={evt.id}
                            event={evt}
                            user={user}
                            onClick={() => handleEventClick(evt)}
                        />
                    ))}
                </Box>
            ) : events.length === 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 6, color: "text.secondary" }}>
                    <EventRoundedIcon sx={{ fontSize: 56, color: "text.disabled" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>No events yet</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 300 }}>
                        {canManage
                            ? "Create your first event to let fans know where to find you."
                            : "This artist hasn\u2019t posted any events yet."}
                    </Typography>
                    {canManage && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setCreateEventOpen(true)}
                            sx={{ mt: 1, textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                        >
                            Create Event
                        </Button>
                    )}
                </Box>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 5, color: "text.secondary" }}>
                    <EventRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                        {filterRange === "upcoming" ? "No upcoming events"
                            : filterRange === "past" ? "No past events"
                                : "No events found"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                        {filterRange === "past"
                            ? "Past events will appear here."
                            : filterRange !== "all"
                                ? "Try changing the date range in the filter."
                                : "Check back soon for upcoming events."}
                    </Typography>
                    {filterRange !== "all" && (
                        <Button
                            variant="outlined"
                            onClick={() => setFilterRange("all")}
                            sx={{ textTransform: "none", fontWeight: 700, mt: 1 }}
                        >
                            Show All Events
                        </Button>
                    )}
                </Box>
            )}

            {/* Create Event Modal */}
            {canManage && (
                <CreateEditEventModal
                    open={createEventOpen}
                    onClose={() => setCreateEventOpen(false)}
                    user={user}
                    onSaved={() => {
                        setCreateEventOpen(false);
                        // Refetch events
                        if (!artistId && !ownerUserId) return;
                        (async () => {
                            try {
                                const params = {
                                    sort: "soonest",
                                    range: "all",
                                    limit: 50,
                                    includeTotal: 1,
                                };
                                if (artistId) params.artistAccountId = artistId;
                                if (ownerUserId) params.organizerUserId = ownerUserId;
                                const data = await fetchEvents(params);
                                const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                                setEvents(items);
                            } catch {
                                // silent
                            }
                        })();
                    }}
                />
            )}
        </Box>
    );
}
