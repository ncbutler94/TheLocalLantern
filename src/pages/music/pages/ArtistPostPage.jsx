import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { alpha as alphaMui } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme as useThemeEvt } from "@mui/material/styles";
import MobileActionSheet from "../../../components/MobileActionSheet";
import SuccessSnackbar from "../../../components/SuccessSnackbar";
import { secureFetch } from "../../../utils/secureFetch";
import {
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    RadioGroup,
    FormControlLabel,
    Radio,
    Tab,
    Tabs,
    TextField,
    Stack,
    Tooltip,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
} from "@mui/material";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

// Category icons
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
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

// Action bar icons
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import BlockIcon from "@mui/icons-material/Block";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import UserCardPopover from "../../../components/UserCardPopover";
import ShareEventDialog from "../../../components/ShareEventDialog";

const alphaColor = (color, a) => alphaMui(color, a);
const toStr = (v) => (v == null ? "" : String(v));

/** Returns true when the avatar URL is empty or points to a generic placeholder image. */
function isDefaultAvatar(url) {
    const s = String(url || '').trim().toLowerCase();
    if (!s || s === 'null' || s === 'undefined') return true;
    return (
        s.includes('default_avatar') ||
        s.includes('default_business') ||
        s.includes('default_logo') ||
        s.includes('default-avatar') ||
        s.includes('placeholder')
    );
}

// Lantern gold for hover/active states
// Lantern gold for hover/active states — uses theme secondary.main

const EVENT_CATEGORY_ICONS = {
    "music-nightlife": MusicNoteRoundedIcon,
    "arts-culture": TheaterComedyRoundedIcon,
    "food-drink": RestaurantRoundedIcon,
    "community-social": PeopleAltRoundedIcon,
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

const CATEGORY_LABELS = {
    "music-nightlife": "Concerts",
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

const EVENT_FALLBACK_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect width='100%25' height='100%25' fill='%23f0f2e8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23b0b8a0' font-family='Arial' font-size='16'%3ENo photo%3C/text%3E%3C/svg%3E";

/* ─────────────────────────────────────────────────────────────────────────────
   Date/Time helpers
   ───────────────────────────────────────────────────────────────────────────── */

function isDateOnlyValue(raw, event) {
    const s = toStr(raw).trim();
    if (!s) return true;
    const startHasTime = event?.startHasTime ?? event?.start_has_time;
    if (startHasTime === false) return true;
    if (startHasTime === true) return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
    if (s.includes(" 00:00:00") || s.includes("T00:00:00")) return true;
    return false;
}

function parseDateTimeLocal(raw, event) {
    const s = toStr(raw).trim();
    if (!s) return { dateObj: null, hours: 0, minutes: 0, isDateOnly: true };
    const dateOnly = isDateOnlyValue(s, event);

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, day] = s.split("-").map(Number);
        return { dateObj: new Date(y, m - 1, day), hours: 0, minutes: 0, isDateOnly: true };
    }

    const mysqlMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (mysqlMatch) {
        const [, y, m, day, hh, mm] = mysqlMatch.map(Number);
        return { dateObj: new Date(y, m - 1, day, hh, mm), hours: hh, minutes: mm, isDateOnly: dateOnly };
    }

    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (isoMatch) {
        const [, y, m, day, hh, mm] = isoMatch.map(Number);
        return { dateObj: new Date(y, m - 1, day, hh, mm), hours: hh, minutes: mm, isDateOnly: dateOnly };
    }

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return { dateObj: null, hours: 0, minutes: 0, isDateOnly: true };
    return { dateObj: d, hours: d.getHours(), minutes: d.getMinutes(), isDateOnly: dateOnly };
}

function isSameDay(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayLabel(d) {
    if (!d) return "";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (isSameDay(d0, today)) return "Today";
    if (isSameDay(d0, tomorrow)) return "Tomorrow";
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

function formatTimeFromParts(hours, minutes) {
    const h = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";
    return `${h}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function buildWhenLabel(event) {
    const rawStart = event?.startAt || event?.start_at;
    const rawEnd = event?.endAt || event?.end_at;
    const startParsed = parseDateTimeLocal(rawStart, event);
    const endParsed = parseDateTimeLocal(rawEnd, { ...event, startHasTime: event?.endHasTime ?? event?.end_has_time });

    if (!startParsed.dateObj) return "";
    const startDay = formatDayLabel(startParsed.dateObj);
    const showStartTime = !startParsed.isDateOnly;
    const startTime = showStartTime ? formatTimeFromParts(startParsed.hours, startParsed.minutes) : "";

    if (!endParsed.dateObj) return showStartTime ? `${startDay} · ${startTime}` : startDay;

    const endDay = formatDayLabel(endParsed.dateObj);
    const showEndTime = !endParsed.isDateOnly;
    const endTime = showEndTime ? formatTimeFromParts(endParsed.hours, endParsed.minutes) : "";

    if (isSameDay(startParsed.dateObj, endParsed.dateObj)) {
        if (showStartTime && showEndTime) return `${startDay} · ${startTime} – ${endTime}`;
        if (!showStartTime && showEndTime) return `${startDay} · ${endTime}`;
        return startDay;
    }

    const left = showStartTime ? `${startDay} · ${startTime}` : startDay;
    const right = showEndTime ? `${endDay} · ${endTime}` : endDay;
    return `${left} – ${right}`;
}

function formatLocationLabel(event) {
    const scope = toStr(event?.locationScope || event?.location_scope).toLowerCase();
    const city = toStr(event?.city).trim();
    const county = toStr(event?.county).trim();
    if (scope === "statewide" || (!city && !county)) return "Alabama (Statewide)";
    const countyLabel = county ? `${county} County` : "";
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || "Alabama (Statewide)";
}

function pickMainPhoto(event) {
    const direct = toStr(event?.mainPhotoUrl || event?.main_photo_url || event?.photoUrl || event?.photo_url).trim();
    if (direct) return direct;
    const arr = event?.photos || event?.photoUrls || event?.photo_urls;
    if (Array.isArray(arr) && arr.length) {
        const first = typeof arr[0] === "string" ? arr[0] : arr[0]?.url;
        return toStr(first).trim() || "";
    }
    return "";
}

function slugToLabel(slug) {
    if (!slug) return "";
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getCategoryInfo(event) {
    const slug = toStr(event?.category || event?.categorySlug || event?.category_slug).trim().toLowerCase();
    const subcategorySlug = toStr(event?.subcategory || event?.subcategorySlug || event?.subcategory_slug).trim().toLowerCase();
    const subcategoryLabel = toStr(event?.subcategoryLabel || event?.subcategory_label).trim();
    const categoryLabel = toStr(event?.categoryLabel || event?.category_label).trim() || CATEGORY_LABELS[slug] || "";

    let displayLabel = categoryLabel;
    if (subcategorySlug) {
        displayLabel = subcategoryLabel || slugToLabel(subcategorySlug);
    }

    return {
        slug,
        label: displayLabel,
        categoryLabel,
        subcategorySlug,
        subcategoryLabel
    };
}

function formatCount(count) {
    const num = Number(count) || 0;
    if (num < 1000) return num > 0 ? String(num) : "0";
    if (num < 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    if (num < 1000000) return `${Math.round(num / 1000)}k`;
    if (num < 10000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    return `${Math.round(num / 1000000)}M`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   API helpers
   ───────────────────────────────────────────────────────────────────────────── */

async function postEngagement(eventId, type, action = "toggle", accountHeaders = {}) {
    try {
        const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/engagement`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...accountHeaders },
            body: JSON.stringify({ type, action }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function postReport(eventId, reason, details, accountHeaders = {}) {
    try {
        const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/report`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...accountHeaders },
            body: JSON.stringify({ reason, details }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function deleteEvent(eventId, accountHeaders = {}) {
    try {
        const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}`, {
            method: "DELETE",
            credentials: "include",
            headers: { ...accountHeaders },
        });
        return res.ok;
    } catch {
        return false;
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Report Dialog
   ───────────────────────────────────────────────────────────────────────────── */

function ReportEventDialog({ open, onClose, onSubmit }) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const resetDialog = () => {
        onClose();
        setTimeout(() => {
            setReason("");
            setDetails("");
            setSubmitted(false);
            setSubmitting(false);
        }, 250);
    };

    const handleSubmit = async () => {
        if (!reason) return;
        setSubmitting(true);
        await onSubmit({ reason, details });
        setSubmitting(false);
        setSubmitted(true);
    };

    return (
        <Dialog
            open={open}
            onClose={resetDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: "hidden",
                },
            }}
        >
            {submitted ? (
                <>
                    <DialogContent sx={{ textAlign: "center", py: 5, px: 3 }}>
                        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                            <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "success.main" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                            Thank you for your report
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.5 }}>
                            We take reports seriously and will review this event. If it violates our community guidelines, we'll take appropriate action.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button
                            onClick={resetDialog}
                            fullWidth
                            variant="contained"
                            disableElevation
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, py: 1 }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <FlagOutlinedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                            Report event
                        </Box>
                        <IconButton size="small" onClick={resetDialog} aria-label="Close">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 0, pb: 1 }}>
                        <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                            Why are you reporting this event? Your report is anonymous.
                        </Typography>
                        <RadioGroup
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        >
                            {[
                                { value: "spam", label: "Spam or scam" },
                                { value: "misleading", label: "Misleading information" },
                                { value: "inappropriate", label: "Inappropriate content" },
                                { value: "cancelled", label: "Event was cancelled" },
                                { value: "duplicate", label: "Duplicate event" },
                                { value: "wrong-location", label: "Wrong location" },
                                { value: "harassment", label: "Harassment or hate" },
                                { value: "other", label: "Other" },
                            ].map((opt) => (
                                <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<Radio size="small" />}
                                    label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                    sx={{
                                        mx: 0,
                                        py: 0.25,
                                        px: 1,
                                        borderRadius: 2,
                                        "&:hover": { bgcolor: "action.hover" },
                                    }}
                                />
                            ))}
                        </RadioGroup>

                        <TextField
                            multiline
                            minRows={3}
                            maxRows={6}
                            fullWidth
                            placeholder="Add any additional details that might help us review this report…"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            inputProps={{ maxLength: 1000 }}
                            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                        />
                        <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                            {details.length}/1000
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <Button
                            onClick={resetDialog}
                            sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disableElevation
                            disabled={!reason || submitting}
                            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{
                                fontWeight: 700,
                                textTransform: "none",
                                borderRadius: 2,
                                px: 3,
                            }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Delete Confirmation Dialog
   ───────────────────────────────────────────────────────────────────────────── */

function DeleteEventDialog({ open, onClose, onConfirm, deleting }) {
    return (
        <Dialog
            open={open}
            onClose={(_, r) => {
                if (r === "backdropClick" || r === "escapeKeyDown") return;
                onClose();
            }}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { position: "relative" } }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                Delete Event
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this event? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={deleting} sx={{ textTransform: "none" }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onConfirm}
                    disabled={deleting}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                >
                    {deleting ? "Deleting..." : "Delete Event"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Event State Cache (sync across cards)
   ───────────────────────────────────────────────────────────────────────────── */

const EVENT_ENGAGEMENT_EVT = "ll:event:engagement-changed";
const EVENT_DELETED_EVT = "ll:event:deleted";
const EVENT_EDITED_EVT = "ll:event:edited";

function getEventStateCache() {
    if (typeof window === "undefined") return {};
    if (!window.__llEventEngagementState) window.__llEventEngagementState = {};
    return window.__llEventEngagementState;
}

function readCachedState(eventId) {
    return getEventStateCache()[String(eventId)] || null;
}

function writeCachedState(eventId, patch) {
    const cache = getEventStateCache();
    const key = String(eventId);
    cache[key] = { ...(cache[key] || {}), ...patch, t: Date.now() };
}

function broadcast(eventId, patch) {
    writeCachedState(eventId, patch);
    try {
        window.dispatchEvent(new CustomEvent(EVENT_ENGAGEMENT_EVT, { detail: { eventId, ...patch } }));
    } catch {
        // ignore
    }
}

function broadcastDeleted(eventId) {
    try {
        window.dispatchEvent(new CustomEvent(EVENT_DELETED_EVT, { detail: { eventId } }));
    } catch {
        // ignore
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Location Display Component
   ───────────────────────────────────────────────────────────────────────────── */

function LocationDisplay({ addressStr, locationLabel, onClick }) {
    if (!addressStr && !locationLabel) return null;

    const interactive = typeof onClick === "function";

    return (
        <Box
            sx={{
                display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25,
                ...(interactive ? {
                    cursor: "pointer",
                    borderRadius: 1,
                    px: 0.5,
                    mx: -0.5,
                    transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                    "&:hover .loc-icon, &:hover .loc-text": { color: "secondary.main" },
                } : {}),
            }}
            onClick={interactive ? (e) => { e.stopPropagation(); onClick(); } : undefined}
        >
            {addressStr ? (
                <Stack direction="row" spacing={0.5} alignItems="flex-start">
                    <LocationOnRoundedIcon className="loc-icon" sx={{ fontSize: 15, color: "primary.main", mt: 0.1, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                    <Typography className="loc-text" sx={{ fontSize: 12, color: "primary.main", fontWeight: 700, textAlign: "right", lineHeight: 1.2, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}>
                        {addressStr}
                    </Typography>
                </Stack>
            ) : null}
            {locationLabel ? (
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {!addressStr && <LocationOnRoundedIcon className="loc-icon" sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />}
                    <Typography className="loc-text" sx={{ fontSize: 12, color: "primary.main", fontWeight: 700, whiteSpace: "nowrap", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}>
                        {locationLabel}
                    </Typography>
                </Stack>
            ) : null}
        </Box>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Friends Engagement Dialog (Going / Interested tabs)
   ───────────────────────────────────────────────────────────────────────────── */

function FriendsEngagementDialog({ open, onClose, eventId }) {
    const [tab, setTab] = useState(0);
    const [goingFriends, setGoingFriends] = useState([]);
    const [interestedFriends, setInterestedFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!open || !eventId) return;
        let cancelled = false;
        setLoading(true);
        setGoingFriends([]);
        setInterestedFriends([]);
        setSearchTerm("");
        setTab(0);
        Promise.all([
            secureFetch(`/api/events/${encodeURIComponent(eventId)}/friends-going?type=rsvp`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
            secureFetch(`/api/events/${encodeURIComponent(eventId)}/friends-going?type=interested`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]).then(([goingData, intData]) => {
            if (cancelled) return;
            setGoingFriends(Array.isArray(goingData?.friends) ? goingData.friends : []);
            setInterestedFriends(Array.isArray(intData?.friends) ? intData.friends : []);
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, eventId]);

    const rawList = tab === 0 ? goingFriends : interestedFriends;
    const filteredList = searchTerm.trim()
        ? rawList.filter((f) => {
            const q = searchTerm.toLowerCase();
            const full = `${f.first_name || ""} ${f.last_name || ""} ${f.handle || ""}`.toLowerCase();
            return full.includes(q);
        })
        : rawList;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    height: { xs: "80vh", sm: 520 },
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                },
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, pt: 2, pb: 0.5 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 17 }}>Friends Engaged</Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => { setTab(v); setSearchTerm(""); }}
                variant="fullWidth"
                sx={{
                    minHeight: 40,
                    px: 2,
                    "& .MuiTab-root": { textTransform: "none", fontWeight: 800, fontSize: 13, minHeight: 40 },
                }}
            >
                <Tab label={`Going (${goingFriends.length})`} />
                <Tab label={`Interested (${interestedFriends.length})`} />
            </Tabs>

            {/* Search */}
            {!loading && rawList.length > 5 && (
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": { borderRadius: 2.5, fontSize: 13, bgcolor: "action.hover" },
                        }}
                    />
                </Box>
            )}

            {/* Scrollable list */}
            <Box sx={{ flex: 1, overflow: "auto", px: 1.5, pt: 1, pb: 2 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : filteredList.length === 0 ? (
                    <Typography sx={{ textAlign: "center", py: 3, color: "text.secondary", fontSize: 13 }}>
                        {searchTerm.trim()
                            ? "No matching friends"
                            : tab === 0
                                ? "No friends going yet"
                                : "No friends interested yet"}
                    </Typography>
                ) : (
                    <List disablePadding>
                        {filteredList.map((friend) => {
                            const name = `${toStr(friend.first_name || friend.firstName)} ${toStr(friend.last_name || friend.lastName)}`.trim() || friend.name || "User";
                            const handle = toStr(friend.handle);
                            const avatar = friend.avatar_url || friend.profile_picture || "";
                            return (
                                <ListItemButton
                                    key={friend.id}
                                    onClick={() => { if (handle) window.location.assign(`/${handle}`); }}
                                    sx={{ borderRadius: 2, py: 0.75, px: 1 }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                        <Avatar src={avatar} sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 800 }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography sx={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>{name}</Typography>}
                                        secondary={handle ? <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.2 }}>@{handle}</Typography> : null}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Dialog>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Event Edit History Dialog
   ───────────────────────────────────────────────────────────────────────────── */

function formatHistoryDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    }).format(d);
}

function formatHistoryTime(raw) {
    if (!raw) return "";
    const [hh, mm] = String(raw).split(":").map(Number);
    if (!Number.isFinite(hh)) return String(raw);
    const h = hh % 12 || 12;
    const ampm = hh < 12 ? "AM" : "PM";
    return `${h}:${String(mm || 0).padStart(2, "0")} ${ampm}`;
}

function formatHistoryDateOnly(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

const HISTORY_CATEGORY_LABELS = {
    "music-nightlife": "Concerts",
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

function catLabel(slug) {
    return HISTORY_CATEGORY_LABELS[slug] || slug || "";
}

function scopeLabel(scope) {
    if (scope === "statewide") return "Alabama (Statewide)";
    if (scope === "county") return "County-wide";
    if (scope === "city") return "City";
    return scope || "";
}

function buildDiffItems(prevSnap, snap) {
    const items = [];
    const s = (v) => (v == null ? "" : String(v).trim());

    if (s(snap.title) !== s(prevSnap.title)) {
        items.push({ label: "Title", from: s(prevSnap.title) || "(empty)", to: s(snap.title) || "(empty)" });
    }
    if (s(snap.category) !== s(prevSnap.category)) {
        items.push({ label: "Category", from: catLabel(s(prevSnap.category)) || "(none)", to: catLabel(s(snap.category)) || "(none)" });
    }
    if (s(snap.subcategory) !== s(prevSnap.subcategory)) {
        items.push({ label: "Subcategory", from: s(prevSnap.subcategory) || "(none)", to: s(snap.subcategory) || "(none)" });
    }
    if (s(snap.description) !== s(prevSnap.description)) {
        items.push({ label: "Description", changed: true });
    }
    if (s(snap.venue_name) !== s(prevSnap.venue_name)) {
        items.push({ label: "Venue", from: s(prevSnap.venue_name) || "(none)", to: s(snap.venue_name) || "(none)" });
    }
    if (s(snap.venue_address) !== s(prevSnap.venue_address)) {
        items.push({ label: "Venue address", from: s(prevSnap.venue_address) || "(none)", to: s(snap.venue_address) || "(none)" });
    }
    if (s(snap.address) !== s(prevSnap.address)) {
        items.push({ label: "Address", from: s(prevSnap.address) || "(none)", to: s(snap.address) || "(none)" });
    }
    if (s(snap.location_scope) !== s(prevSnap.location_scope)) {
        items.push({ label: "Location scope", from: scopeLabel(s(prevSnap.location_scope)) || "(none)", to: scopeLabel(s(snap.location_scope)) || "(none)" });
    }
    if (s(snap.city) !== s(prevSnap.city)) {
        items.push({ label: "City", from: s(prevSnap.city) || "(none)", to: s(snap.city) || "(none)" });
    }
    if (s(snap.county) !== s(prevSnap.county)) {
        items.push({ label: "County", from: s(prevSnap.county) || "(none)", to: s(snap.county) || "(none)" });
    }
    if (s(snap.timezone) !== s(prevSnap.timezone)) {
        items.push({ label: "Timezone", from: s(prevSnap.timezone) || "(none)", to: s(snap.timezone) || "(none)" });
    }
    const prevStart = s(snap.start_at) !== s(prevSnap.start_at);
    const prevStartTime = s(snap.start_time) !== s(prevSnap.start_time);
    if (prevStart) {
        items.push({ label: "Start date", from: formatHistoryDateOnly(prevSnap.start_at) || "(none)", to: formatHistoryDateOnly(snap.start_at) || "(none)" });
    }
    if (prevStartTime) {
        items.push({ label: "Start time", from: formatHistoryTime(prevSnap.start_time) || "(none)", to: formatHistoryTime(snap.start_time) || "(none)" });
    }
    const prevEnd = s(snap.end_at) !== s(prevSnap.end_at);
    const prevEndTime = s(snap.end_time) !== s(prevSnap.end_time);
    if (prevEnd) {
        items.push({ label: "End date", from: formatHistoryDateOnly(prevSnap.end_at) || "(none)", to: formatHistoryDateOnly(snap.end_at) || "(none)" });
    }
    if (prevEndTime) {
        items.push({ label: "End time", from: formatHistoryTime(prevSnap.end_time) || "(none)", to: formatHistoryTime(snap.end_time) || "(none)" });
    }
    // Photo changes
    const prevPhotos = Array.isArray(prevSnap.photos) ? prevSnap.photos : [];
    const curPhotos = Array.isArray(snap.photos) ? snap.photos : [];
    const prevSet = new Set(prevPhotos);
    const curSet = new Set(curPhotos);
    const added = curPhotos.filter((u) => !prevSet.has(u));
    const removed = prevPhotos.filter((u) => !curSet.has(u));
    if (added.length > 0 || removed.length > 0 || prevPhotos.length !== curPhotos.length) {
        const parts = [];
        if (added.length > 0) parts.push(`${added.length} added`);
        if (removed.length > 0) parts.push(`${removed.length} removed`);
        if (parts.length === 0 && prevPhotos.length !== curPhotos.length) parts.push("reordered");
        items.push({ label: "Photos", changed: true, detail: parts.join(", "), photoAdded: added, photoRemoved: removed });
    }
    // Coordinates
    const latChanged = String(snap.latitude ?? "") !== String(prevSnap.latitude ?? "");
    const lngChanged = String(snap.longitude ?? "") !== String(prevSnap.longitude ?? "");
    if (latChanged || lngChanged) {
        items.push({ label: "Map pin", changed: true });
    }
    return items;
}

function HistoryDiffChip({ label, from, to, changed, detail, photoAdded, photoRemoved }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, py: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Chip
                    label={label}
                    size="small"
                    sx={{
                        height: 22,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 1.5,
                        bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
                        color: "primary.dark",
                        border: "none",
                        flexShrink: 0,
                        mt: 0.1,
                        "& .MuiChip-label": { px: 1 },
                    }}
                />
                {changed ? (
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", lineHeight: 1.5, pt: 0.15 }}>
                        {detail || "Updated"}
                    </Typography>
                ) : (
                    <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: "break-word" }}>
                        <Box component="span" sx={{ textDecoration: "line-through", opacity: 0.55 }}>{from}</Box>
                        <Box component="span" sx={{ mx: 0.5, color: "text.disabled" }}>→</Box>
                        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>{to}</Box>
                    </Typography>
                )}
            </Box>
            {/* Photo thumbnails */}
            {(photoAdded?.length > 0 || photoRemoved?.length > 0) && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pl: 0.5, mt: 0.5 }}>
                    {(photoRemoved || []).slice(0, 4).map((url, i) => (
                        <Box key={`rm-${i}`} sx={{ position: "relative", width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "2px solid", borderColor: "error.main", opacity: 0.6 }}>
                            <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.35)" }}>
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                            </Box>
                        </Box>
                    ))}
                    {(photoAdded || []).slice(0, 4).map((url, i) => (
                        <Box key={`add-${i}`} sx={{ position: "relative", width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "2px solid", borderColor: "success.main" }}>
                            <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.2)" }}>
                                <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

function EventEditHistoryDialog({ open, onClose, rows, loading, error, currentEvent }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { position: "relative" } }}
            onClick={(e) => e.stopPropagation()}
        >
            <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                Edit History
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                )}
                {!loading && error && (
                    <Typography color="error" sx={{ py: 2, textAlign: "center" }}>{error}</Typography>
                )}
                {!loading && !error && rows.length === 0 && (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: "center", fontSize: 14 }}>
                        This event was edited, but detailed version history is not available for edits made before history tracking was enabled.
                    </Typography>
                )}
                {!loading && !error && rows.length > 0 && (
                    <Box sx={{ position: "relative", pl: 2.5 }}>
                        {/* Vertical timeline line */}
                        <Box sx={{
                            position: "absolute", left: 5, top: 10, bottom: 10, width: 2,
                            bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12),
                            borderRadius: 1,
                        }} />

                        {rows.map((row, idx) => {
                            const snap = row.snapshot || {};
                            const isOriginal = idx === rows.length - 1 && row.version === 1;
                            const isLatest = idx === 0;

                            // For the latest edit, compare the snapshot (state before edit) against
                            // the current live event state (state after edit).
                            // For older edits, compare against the next row's snapshot (which is
                            // the state before the following edit = the state after this edit).
                            let diffItems = [];
                            if (!isOriginal) {
                                if (isLatest && currentEvent) {
                                    // Build a snapshot-shaped object from the live event for comparison
                                    const liveSnap = {
                                        title: currentEvent.title || "",
                                        description: currentEvent.description || "",
                                        address: currentEvent.address || currentEvent.street_address || currentEvent.venueAddress || currentEvent.venue_address || "",
                                        start_at: currentEvent.start_at || currentEvent.startAt || "",
                                        start_time: currentEvent.start_time || currentEvent.startTime || "",
                                        end_at: currentEvent.end_at || currentEvent.endAt || "",
                                        end_time: currentEvent.end_time || currentEvent.endTime || "",
                                        timezone: currentEvent.timezone || "",
                                        location_scope: currentEvent.location_scope || currentEvent.locationScope || "",
                                        city: currentEvent.city || "",
                                        county: currentEvent.county || "",
                                        venue_name: currentEvent.venue_name || currentEvent.venueName || "",
                                        venue_address: currentEvent.venue_address || currentEvent.venueAddress || "",
                                        category: currentEvent.category || currentEvent.categorySlug || currentEvent.category_slug || "",
                                        subcategory: currentEvent.subcategory || currentEvent.subcategorySlug || currentEvent.subcategory_slug || "",
                                        latitude: currentEvent.latitude != null ? Number(currentEvent.latitude) : null,
                                        longitude: currentEvent.longitude != null ? Number(currentEvent.longitude) : null,
                                        photos: Array.isArray(currentEvent.photos)
                                            ? currentEvent.photos.map((p) => (typeof p === "string" ? p : p?.url || p?.photo_url || "")).filter(Boolean)
                                            : [],
                                    };
                                    diffItems = buildDiffItems(snap, liveSnap);
                                } else {
                                    const prevRow = rows[idx + 1];
                                    const prevSnap = prevRow?.snapshot || {};
                                    diffItems = buildDiffItems(prevSnap, snap);
                                }
                            }

                            return (
                                <Box key={row.id || idx} sx={{ position: "relative", pb: idx < rows.length - 1 ? 2.5 : 0, pt: idx === 0 ? 0 : 0 }}>
                                    {/* Timeline dot */}
                                    <Box sx={{
                                        position: "absolute", left: -20, top: 4,
                                        width: 12, height: 12, borderRadius: "50%",
                                        bgcolor: isOriginal ? "grey.400" : isLatest ? "secondary.main" : "primary.main",
                                        border: "2px solid",
                                        borderColor: "background.paper",
                                        boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                        zIndex: 1,
                                    }} />

                                    {/* Version header */}
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                        <Typography sx={{
                                            fontWeight: 800,
                                            fontSize: 13,
                                            color: isOriginal ? "text.secondary" : "text.primary",
                                        }}>
                                            {isOriginal ? "Original" : isLatest ? "Latest edit" : `Version ${row.version}`}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>
                                            {formatHistoryDate(row.edited_at)}
                                        </Typography>
                                    </Stack>

                                    {/* Diff items */}
                                    {!isOriginal && diffItems.length > 0 && (
                                        <Box sx={{
                                            bgcolor: (t) => alphaColor(t.palette.primary.main, 0.025),
                                            border: "1px solid",
                                            borderColor: (t) => alphaColor(t.palette.primary.main, 0.08),
                                            borderRadius: 2,
                                            px: 1.5,
                                            py: 1,
                                        }}>
                                            {diffItems.map((item, i) => (
                                                <HistoryDiffChip key={i} {...item} />
                                            ))}
                                        </Box>
                                    )}

                                    {/* Fallback if no diff items detected */}
                                    {!isOriginal && diffItems.length === 0 && (
                                        <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", pl: 0.5 }}>
                                            Event details updated
                                        </Typography>
                                    )}

                                    {/* Original version summary */}
                                    {isOriginal && (
                                        <Box sx={{
                                            bgcolor: (t) => alphaColor(t.palette.grey[500], 0.04),
                                            border: "1px solid",
                                            borderColor: (t) => alphaColor(t.palette.grey[500], 0.08),
                                            borderRadius: 2,
                                            px: 1.5,
                                            py: 1,
                                        }}>
                                            {snap.title && (
                                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.primary", mb: 0.25 }}>
                                                    {toStr(snap.title)}
                                                </Typography>
                                            )}
                                            <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.4 }}>
                                                {[
                                                    catLabel(snap.category),
                                                    snap.city || snap.county || scopeLabel(snap.location_scope),
                                                    snap.venue_name,
                                                ].filter(Boolean).join(" · ") || "Original event created"}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
                <Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   EventCard Component
   ───────────────────────────────────────────────────────────────────────────── */

export default function EventCard({ event, onClick, onComment, user, activeView = "all", onEngagementChange, onEdit, onDelete, onLocationClick, onHover, compact = false, selected = false, initialFriendsGoing = null }) {
    const auth = useAuth();
    const viewer = user || auth?.user || null;

    // Get active account context
    const { activeAccount, activeAccountType } = useActiveAccount();

    // Stable key for re-fetch when account changes
    const accountKey = `${activeAccountType || 'personal'}-${activeAccount?.id || 0}`;

    // Build account headers for engagement API calls (scoped to active account).
    // IMPORTANT: useMemo prevents a new object reference on every render, which
    // would cause any useEffect that captures accountHeaders to re-fire endlessly.
    const accountHeaders = useMemo(() => {
        const type = String(activeAccountType || '').toLowerCase();
        const id = activeAccount?.id;
        if (type === 'business' && id) return { 'x-account-type': 'business', 'x-business-id': String(id) };
        if (type === 'artist' && id) return { 'x-account-type': 'artist', 'x-artist-id': String(id) };
        return {};
    }, [accountKey]);

    const [isHovered, setIsHovered] = useState(false);
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
    const evtTheme = useThemeEvt();
    const isMobileEvt = useMediaQuery(evtTheme.breakpoints.down('md'));
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

    // 3-dot menu state
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const menuOpen = Boolean(menuAnchorEl);

    // Edit-limit state (5 edits per 24h window)
    const [editLimitReached, setEditLimitReached] = useState(false);
    const [editLimitMsg, setEditLimitMsg] = useState("");
    const [editLimitLoading, setEditLimitLoading] = useState(false);
    const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false);

    // Edit history dialog state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    const safeEvent = event || {};
    const eventId = safeEvent.id || safeEvent.event_id;
    const title = toStr(safeEvent.title) || "Untitled event";
    const whenLabel = buildWhenLabel(safeEvent);
    const locationLabel = formatLocationLabel(safeEvent);
    const addressStr = toStr(safeEvent.address || safeEvent.venue_address || safeEvent.venueAddress).trim();
    const categoryInfo = getCategoryInfo(safeEvent);

    const organizer = safeEvent.organizer || null;

    // Business account that created the event (if any)
    const eventBusinessAccountId = safeEvent.business_account_id || safeEvent.businessAccountId || null;
    const isBusinessEvent = Boolean(eventBusinessAccountId);

    // Artist account that created the event (if any)
    const eventArtistAccountId = safeEvent.artist_account_id || safeEvent.artistAccountId || null;
    const isArtistEvent = Boolean(eventArtistAccountId);

    // Artist sub-type ('music' | 'artist') for the host avatar fallback.
    // Prefer any field the backend already attached; otherwise fetch
    // /api/music/artists/:id (mirrors ArtistAdminConsole pattern).
    const initialEventArtistProfileType = String(
        safeEvent.artist_account_profile_type || safeEvent.artistAccountProfileType ||
        safeEvent.artist_profile_type || safeEvent.artistProfileType || ""
    ).toLowerCase();
    const [fetchedEventArtistProfileType, setFetchedEventArtistProfileType] = useState("");
    useEffect(() => {
        if (!isArtistEvent || !eventArtistAccountId) {
            setFetchedEventArtistProfileType("");
            return;
        }
        if (initialEventArtistProfileType === "artist" || initialEventArtistProfileType === "music") {
            setFetchedEventArtistProfileType("");
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await secureFetch(
                    `/api/music/artists/${encodeURIComponent(String(eventArtistAccountId))}`,
                    { credentials: "include", headers: { Accept: "application/json" } }
                );
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.artist || data || {};
                const pt = String(entity?.profile_type || entity?.profileType || "").toLowerCase();
                if (!cancelled) setFetchedEventArtistProfileType(pt === "artist" ? "artist" : "music");
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [isArtistEvent, eventArtistAccountId, initialEventArtistProfileType]);
    const eventArtistProfileType = (initialEventArtistProfileType === "artist" || initialEventArtistProfileType === "music")
        ? initialEventArtistProfileType
        : (fetchedEventArtistProfileType || "music");
    const isVisualArtistEvent = isArtistEvent && eventArtistProfileType === "artist";

    // Resolve display info: prefer business profile when event was created by a business
    const businessAccountName = toStr(safeEvent.businessAccountName || safeEvent.business_account_name);
    const businessAccountSlug = toStr(safeEvent.businessAccountSlug || safeEvent.business_account_slug || safeEvent.business_account_handle);
    const businessAccountAvatar = toStr(safeEvent.businessAccountAvatar || safeEvent.business_account_avatar);

    const organizerLabel = (() => {
        if (isBusinessEvent && businessAccountName) return businessAccountName;
        const fromParts = `${toStr(organizer?.firstName || organizer?.first_name)} ${toStr(organizer?.lastName || organizer?.last_name)}`.trim();
        return toStr(safeEvent.organizerLabel || safeEvent.organizer_label) || fromParts || "Organizer";
    })();

    const handleLabel = (() => {
        if (isBusinessEvent && businessAccountSlug) return businessAccountSlug;
        return toStr(organizer?.handle || organizer?.username || safeEvent.organizerHandle || safeEvent.organizer_handle);
    })();

    const artistAccountAvatar = toStr(safeEvent.artistAccountAvatar || safeEvent.artist_account_avatar);

    const avatarUrl = (() => {
        let raw;
        if (isBusinessEvent) {
            // Business event: use business avatar only — never fall back to personal profile pic
            raw = businessAccountAvatar || "";
        } else if (isArtistEvent) {
            // Artist event: use artist avatar only — never fall back to personal profile pic
            raw = artistAccountAvatar || "";
        } else {
            // Personal event: use organizer's personal avatar
            raw = toStr(organizer?.avatarUrl || organizer?.avatar_url || organizer?.profile_picture || safeEvent.avatarUrl) || "";
        }
        return isDefaultAvatar(raw) ? "" : raw;
    })();
    const mainPhoto = pickMainPhoto(safeEvent);
    const photosCount = Number(safeEvent.photosCount || safeEvent.photos_count || 0) || (Array.isArray(safeEvent.photos) ? safeEvent.photos.length : 0);
    const organizerId = organizer?.id || organizer?.user_id || safeEvent.organizerId || safeEvent.organizer_id || safeEvent.user_id;

    // Verified check — works for business, artist, or personal organizers
    const organizerIsVerified = Boolean(
        safeEvent.is_verified === true || safeEvent.is_verified === 1 || safeEvent.is_verified === "1" ||
        safeEvent.isVerified === true || safeEvent.isVerified === 1 || safeEvent.isVerified === "1" ||
        organizer?.is_verified === true || organizer?.is_verified === 1 || organizer?.is_verified === "1" ||
        organizer?.isVerified === true || organizer?.isVerified === 1 || organizer?.isVerified === "1"
    );

    // Edit info
    const editCount = Number(safeEvent.editCount || safeEvent.edit_count || 0);
    const isEdited = editCount > 0 || Boolean(
        safeEvent.editedAt || safeEvent.edited_at ||
        (safeEvent.updatedAt && safeEvent.createdAt && String(safeEvent.updatedAt) !== String(safeEvent.createdAt))
    );

    const openHistory = useCallback((e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryError("");
        setHistoryRows([]);
        secureFetch(`/api/events/${encodeURIComponent(String(eventId))}/edits`, { credentials: "include", cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
            .then((data) => setHistoryRows(Array.isArray(data) ? data : []))
            .catch((err) => setHistoryError(err?.message || "Failed to load edit history"))
            .finally(() => setHistoryLoading(false));
    }, [eventId]);

    // Initial engagement state
    const engagementCounts = safeEvent.engagement?.counts || {};
    const initialRsvpCount = Number(engagementCounts.rsvp || safeEvent.rsvpCount || safeEvent.rsvp_count || 0);
    const initialInterestedCount = Number(engagementCounts.interested || safeEvent.interestedCount || safeEvent.interested_count || 0);
    const initialShareCount = Number(engagementCounts.share || safeEvent.shareCount || safeEvent.share_count || 0);
    const initialLikeCount = Number(engagementCounts.like || safeEvent.likeCount || safeEvent.like_count || 0);
    const initialCommentCount = Number(engagementCounts.comment || engagementCounts.comments || safeEvent.commentCount || safeEvent.comment_count || safeEvent.comments_count || 0);

    const viewerEngagement = safeEvent.viewerEngagement || safeEvent.viewer_engagement || {};
    const initialHasRsvpd = Boolean(viewerEngagement.rsvp || safeEvent.viewerRsvp || safeEvent.viewer_rsvp);
    const initialIsInterested = Boolean(viewerEngagement.interested || safeEvent.viewerInterested || safeEvent.viewer_interested);
    const initialHasLiked = Boolean(viewerEngagement.like || safeEvent.viewerLiked || safeEvent.viewer_liked);
    const initialHasReposted = Boolean(viewerEngagement.repost || safeEvent.viewerRepost || safeEvent.viewer_repost);
    const initialRepostCount = Number(engagementCounts.repost || safeEvent.repostCount || safeEvent.repost_count || 0);

    const [hasRsvpd, setHasRsvpd] = useState(initialHasRsvpd);
    const [isInterested, setIsInterested] = useState(initialIsInterested);
    const [hasLiked, setHasLiked] = useState(initialHasLiked);
    const [hasReposted, setHasReposted] = useState(initialHasReposted);
    const [rsvpCount, setRsvpCount] = useState(initialRsvpCount);
    const [interestedCount, setInterestedCount] = useState(initialInterestedCount);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [repostCount, setRepostCount] = useState(initialRepostCount);
    const [shareCount, setShareCount] = useState(initialShareCount);
    const [commentCount, setCommentCount] = useState(initialCommentCount);

    const [rsvpBusy, setRsvpBusy] = useState(false);
    const [interestedBusy, setInterestedBusy] = useState(false);
    const [likeBusy, setLikeBusy] = useState(false);
    const [repostBusy, setRepostBusy] = useState(false);

    const [reportOpen, setReportOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [toast, setToast] = useState({ open: false, msg: "" });

    // "Friends going" — people you follow who RSVP'd
    // If parent provided initialFriendsGoing (batch-fetched), use it directly.
    const [friendsGoing, setFriendsGoing] = useState(() =>
        Array.isArray(initialFriendsGoing) ? initialFriendsGoing.slice(0, 10) : []
    );
    const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
    // Drives the smooth slide-open animation for the friends row.
    const [friendsLoaded, setFriendsLoaded] = useState(Array.isArray(initialFriendsGoing));

    // ── Card readiness tracking ──
    // The card renders its engagement zone immediately using inline counts
    // from the events API. Per-card async fetches silently refresh data.
    // friendsLoaded drives the smooth slide-in animation for the friends row.

    // Sync from cache
    useEffect(() => {
        const cached = readCachedState(eventId);
        if (cached) {
            if (cached.hasRsvpd != null) setHasRsvpd(cached.hasRsvpd);
            if (cached.isInterested != null) setIsInterested(cached.isInterested);
            if (cached.hasLiked != null) setHasLiked(cached.hasLiked);
            if (cached.hasReposted != null) setHasReposted(cached.hasReposted);
            if (cached.rsvpCount != null) setRsvpCount(cached.rsvpCount);
            if (cached.interestedCount != null) setInterestedCount(cached.interestedCount);
            if (cached.likeCount != null) setLikeCount(cached.likeCount);
            if (cached.repostCount != null) setRepostCount(cached.repostCount);
            if (cached.commentCount != null) setCommentCount(cached.commentCount);
        }
    }, [eventId]);

    // Listen for global engagement changes
    useEffect(() => {
        const handler = (e) => {
            const d = e?.detail;
            if (!d || String(d.eventId) !== String(eventId)) return;
            if (d.hasRsvpd != null) setHasRsvpd(d.hasRsvpd);
            if (d.isInterested != null) setIsInterested(d.isInterested);
            if (d.hasLiked != null) setHasLiked(d.hasLiked);
            if (d.hasReposted != null) setHasReposted(d.hasReposted);
            if (d.rsvpCount != null) setRsvpCount(d.rsvpCount);
            if (d.interestedCount != null) setInterestedCount(d.interestedCount);
            if (d.likeCount != null) setLikeCount(d.likeCount);
            if (d.repostCount != null) setRepostCount(d.repostCount);
            if (d.commentCount != null) setCommentCount(d.commentCount);
        };
        window.addEventListener(EVENT_ENGAGEMENT_EVT, handler);
        return () => window.removeEventListener(EVENT_ENGAGEMENT_EVT, handler);
    }, [eventId]);

    // Fetch engagement summary (with viewer engagement scoped to active account).
    // Re-fetches when account changes so viewer state updates correctly.
    // The card already shows inline counts — this fetch silently refreshes them.
    useEffect(() => {
        if (!eventId) {
            return;
        }
        let cancelled = false;
        secureFetch(`/api/events/${encodeURIComponent(eventId)}/engagement/summary`, {
            credentials: "include",
            headers: { ...accountHeaders },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                const counts = data.counts || data;
                const cc = Number(counts.comment || counts.comments || counts.comment_count || counts.comments_count || 0);
                if (cc > 0) setCommentCount(cc);
                const lc = Number(counts.like || counts.likes || 0);
                if (lc > 0) setLikeCount((prev) => Math.max(prev, lc));
                const sc = Number(counts.share || counts.shares || 0);
                if (sc > 0) setShareCount((prev) => Math.max(prev, sc));
                const rc = Number(counts.repost || counts.reposts || 0);
                if (rc > 0) setRepostCount((prev) => Math.max(prev, rc));

                // Update viewer engagement from account-scoped response
                const ve = data.viewerEngagement || {};
                setHasRsvpd(Boolean(ve.rsvp));
                setIsInterested(Boolean(ve.interested));
                setHasLiked(Boolean(ve.like));
                setHasReposted(Boolean(ve.repost));
            })
            .catch(() => {
                // silent — card already shows inline data
            });
        return () => { cancelled = true; };
    }, [eventId, accountKey]);

    // Fetch "friends going" — people viewer follows who RSVP'd to this event.
    // SKIP if parent already provided batch data via initialFriendsGoing.
    // The card stays fully visible while this runs. friendsLoaded drives
    // the smooth slide-open animation for the friends row.
    const viewerIdForFriends = viewer?.id || viewer?.user_id || null;

    // Stabilize initialFriendsGoing via a ref so the useEffect below doesn't
    // re-fire when the parent rebuilds the friendsGoingMap state (new array ref
    // but same content). This prevents an infinite update loop.
    const initialFriendsGoingRef = useRef(initialFriendsGoing);
    initialFriendsGoingRef.current = initialFriendsGoing;

    // Sync from parent batch data when it arrives/changes — separate from the
    // fetch effect so it doesn't retrigger network requests.
    const prevBatchRef = useRef(initialFriendsGoing);
    useEffect(() => {
        const batch = initialFriendsGoingRef.current;
        if (Array.isArray(batch) && batch !== prevBatchRef.current) {
            prevBatchRef.current = batch;
            setFriendsGoing(batch.slice(0, 10));
            setFriendsLoaded(true);
        }
    });

    useEffect(() => {
        // If parent provided batch data, use it and skip the per-card fetch
        if (Array.isArray(initialFriendsGoingRef.current)) {
            setFriendsGoing(initialFriendsGoingRef.current.slice(0, 10));
            setFriendsLoaded(true);
            return;
        }

        if (!eventId || !viewerIdForFriends) {
            setFriendsLoaded(true);
            return;
        }
        let cancelled = false;
        setFriendsLoaded(false);
        secureFetch(`/api/events/${encodeURIComponent(eventId)}/friends-going`, {
            credentials: "include",
            headers: { ...accountHeaders },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled) return;
                if (data) {
                    const list = Array.isArray(data.friends) ? data.friends : Array.isArray(data) ? data : [];
                    setFriendsGoing(list.slice(0, 10));
                }
            })
            .catch(() => {
                // silent — card already renders without friends data
            })
            .finally(() => {
                if (!cancelled) setFriendsLoaded(true);
            });
        return () => { cancelled = true; };
    }, [eventId, accountKey, viewerIdForFriends, accountHeaders]);

    // Determine ownership - is the viewer the creator of this event?
    // ── Ownership detection (mirrors JobCard / PostList pattern) ──
    // Step 1: Does the logged-in user own this event? (user ID match)
    const viewerId = Number(viewer?.id || viewer?.user_id || 0);
    const eventUserId = Number(organizerId || 0);
    const isPersonalOwner = Boolean(viewerId && eventUserId && viewerId === eventUserId);

    // Step 2: Determine which account type created this event and whether
    // the currently active account matches.
    const eventPosterHandle = toStr(
        safeEvent.posterHandle || safeEvent.poster_handle ||
        organizer?.handle || organizer?.username ||
        safeEvent.organizerHandle || safeEvent.organizer_handle
    ).toLowerCase();
    const activeSlug = toStr(activeAccount?.slug || activeAccount?.handle || "").toLowerCase();
    const activeType = (activeAccount?.type || activeAccountType || "personal").toLowerCase();

    const isOnCorrectAccount = (() => {
        if (!isPersonalOwner) return false;

        // Event was created by a business account
        if (isBusinessEvent && eventBusinessAccountId) {
            return activeType === "business" && String(activeAccount?.id) === String(eventBusinessAccountId);
        }
        // Event was created by an artist account
        if (isArtistEvent && eventArtistAccountId) {
            return activeType === "artist" && String(activeAccount?.id) === String(eventArtistAccountId);
        }
        // Personal event — active account must be personal
        if (activeType === "personal" || activeType === "user") return true;
        // Fallback: slug match (for older events without business/artist IDs)
        if (activeSlug && eventPosterHandle && activeSlug === eventPosterHandle) return true;
        return false;
    })();
    const isConnectedButWrongAccount = isPersonalOwner && !isOnCorrectAccount;

    // Show edit/delete/boost ONLY when on the correct account.
    // If the user owns the event but is on a different account, they see the
    // same menu as any other viewer (Copy link + Report).
    const showOwnerActions = isOnCorrectAccount;

    // Resolve the display name of the account that created the event (for tooltips)
    const eventPosterName = (() => {
        if (isBusinessEvent && businessAccountName) return businessAccountName;
        if (isArtistEvent) {
            const artName = toStr(safeEvent.artistAccountName || safeEvent.artist_account_name || organizerLabel);
            if (artName) return artName;
        }
        return toStr(safeEvent.posterName || safeEvent.poster_name || organizerLabel);
    })();

    // Tooltip for disabled edit/delete when on wrong account
    const disabledTooltip = isConnectedButWrongAccount
        ? `Log in to "${eventPosterName || "the original account"}" to edit`
        : "";

    const deleteDisabledTooltip = isConnectedButWrongAccount
        ? `Log in to "${eventPosterName || "the original account"}" to delete`
        : "";

    const isSelf = isPersonalOwner;

    const openAuthUI = useCallback((e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        try {
            if (auth && typeof auth.open === 'function') auth.open();
            else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
            else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
            else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
        } catch {
            // ignore
        }
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch {
            // ignore
        }
    }, [auth]);

    const requireAuth = useCallback(
        (cb) => {
            if (viewer && (viewer.id || viewer.user_id || viewer.handle)) return cb?.();
            openAuthUI();
            return undefined;
        },
        [viewer, openAuthUI]
    );

    // ── Moderation placeholder: show a compact card when user is blocked or hidden ──
    const moderationReason = safeEvent._moderationReason;
    if (moderationReason === 'blocked' || moderationReason === 'hidden') {
        const isBlocked = moderationReason === 'blocked';
        return (
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: (t) => alphaMui(t.palette.grey[100], 0.6),
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    textAlign: 'center',
                }}
            >
                {isBlocked ? (
                    <BlockIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                ) : (
                    <VisibilityOffIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                )}
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {isBlocked
                        ? "This event is by a user you have blocked."
                        : "This event is by a user whose posts you have hidden."}
                </Typography>
                <Button
                    size="small"
                    variant="text"
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                    onClick={() => {
                        window.location.assign('/social?tab=safety');
                    }}
                >
                    Manage blocked &amp; hidden users
                </Button>
            </Card>
        );
    }

    const handleActivate = () => {
        if (typeof onClick === "function") onClick();
    };

    const handleOrganizerClick = (e) => {
        e.stopPropagation();
        setPopoverAnchorEl(e.currentTarget);
    };

    const handlePopoverClose = () => setPopoverAnchorEl(null);

    const handleViewProfile = (u) => {
        handlePopoverClose();
        const profilePath = u?.handle || handleLabel || organizerId;
        if (profilePath) window.location.assign(`/${profilePath}`);
    };

    // 3-dot menu handlers
    const handleMenuOpen = (e) => {
        e.stopPropagation();
        if (isMobileEvt) { setMobileSheetOpen(true); } else { setMenuAnchorEl(e.currentTarget); }

        // Check edit-limit when the menu opens (only for owners)
        if (isPersonalOwner && eventId) {
            setEditLimitLoading(true);
            secureFetch(`/api/events/${encodeURIComponent(String(eventId))}/edit-limit`, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                headers: { Accept: "application/json" },
            })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data && data.ok === false) {
                        setEditLimitReached(true);
                        setEditLimitMsg(
                            data.message || "You can edit an event up to 5 times within a 24-hour window."
                        );
                    } else {
                        setEditLimitReached(false);
                        setEditLimitMsg("");
                    }
                })
                .catch(() => {
                    setEditLimitReached(false);
                    setEditLimitMsg("");
                })
                .finally(() => setEditLimitLoading(false));
        }
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleEditClick = () => {
        handleMenuClose();
        if (editLimitReached) {
            setEditLimitDialogOpen(true);
            return;
        }
        if (isOnCorrectAccount && typeof onEdit === "function") {
            onEdit(safeEvent);
        }
    };

    const handleDeleteClick = () => {
        handleMenuClose();
        if (isOnCorrectAccount) {
            setDeleteDialogOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        const ok = await deleteEvent(eventId, accountHeaders);
        setDeleting(false);
        setDeleteDialogOpen(false);

        if (ok) {
            setToast({ open: true, msg: "Event deleted successfully" });
            broadcastDeleted(eventId);
            if (typeof onDelete === "function") {
                onDelete(eventId);
            }
        } else {
            setToast({ open: true, msg: "Could not delete event. Please try again." });
        }
    };

    const handleReportFromMenu = () => {
        handleMenuClose();
        requireAuth(() => setReportOpen(true));
    };

    const handleCopyLink = () => {
        handleMenuClose();
        const url = `${window.location.origin}/events?event=${safeEvent.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setToast({ open: true, msg: "Link copied to clipboard" });
        }).catch(() => {
            setToast({ open: true, msg: "Could not copy link." });
        });
    };

    // Action handlers
    const handleRsvpClick = (e) => {
        e.stopPropagation();
        requireAuth(async () => {
            if (rsvpBusy) return;
            setRsvpBusy(true);
            const nextRsvp = !hasRsvpd;
            const newCount = Math.max(0, rsvpCount + (nextRsvp ? 1 : -1));
            setHasRsvpd(nextRsvp);
            setRsvpCount(newCount);
            broadcast(eventId, { hasRsvpd: nextRsvp, rsvpCount: newCount });

            const result = await postEngagement(eventId, "rsvp", "toggle", accountHeaders);
            if (result) {
                const serverDidSet = result.didSet;
                const serverCount = result.counts?.rsvp ?? newCount;
                setHasRsvpd(serverDidSet);
                setRsvpCount(serverCount);
                broadcast(eventId, { hasRsvpd: serverDidSet, rsvpCount: serverCount });
                onEngagementChange?.({ eventId, type: "rsvp", didSet: serverDidSet, counts: result.counts });
            }
            setRsvpBusy(false);
        });
    };

    const handleInterestedClick = (e) => {
        e.stopPropagation();
        requireAuth(async () => {
            if (interestedBusy) return;
            setInterestedBusy(true);
            const nextInterested = !isInterested;
            const newCount = Math.max(0, interestedCount + (nextInterested ? 1 : -1));
            setIsInterested(nextInterested);
            setInterestedCount(newCount);
            broadcast(eventId, { isInterested: nextInterested, interestedCount: newCount });

            const result = await postEngagement(eventId, "interested", "toggle", accountHeaders);
            if (result) {
                const serverDidSet = result.didSet;
                const serverCount = result.counts?.interested ?? newCount;
                setIsInterested(serverDidSet);
                setInterestedCount(serverCount);
                broadcast(eventId, { isInterested: serverDidSet, interestedCount: serverCount });
                onEngagementChange?.({ eventId, type: "interested", didSet: serverDidSet, counts: result.counts });
            }
            setInterestedBusy(false);
        });
    };

    const handleLikeClick = (e) => {
        e.stopPropagation();
        requireAuth(async () => {
            if (likeBusy) return;
            setLikeBusy(true);
            const nextLiked = !hasLiked;
            const newCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
            setHasLiked(nextLiked);
            setLikeCount(newCount);
            broadcast(eventId, { hasLiked: nextLiked, likeCount: newCount });

            const result = await postEngagement(eventId, "like", "toggle", accountHeaders);
            if (result) {
                const serverDidSet = result.didSet;
                const serverCount = result.counts?.like ?? newCount;
                setHasLiked(serverDidSet);
                setLikeCount(serverCount);
                broadcast(eventId, { hasLiked: serverDidSet, likeCount: serverCount });
                onEngagementChange?.({ eventId, type: "like", didSet: serverDidSet, counts: result.counts });
            }
            setLikeBusy(false);
        });
    };

    const handleRepostClick = (e) => {
        e.stopPropagation();
        requireAuth(async () => {
            if (repostBusy) return;
            setRepostBusy(true);
            const nextReposted = !hasReposted;
            const newCount = Math.max(0, repostCount + (nextReposted ? 1 : -1));
            setHasReposted(nextReposted);
            setRepostCount(newCount);
            broadcast(eventId, { hasReposted: nextReposted, repostCount: newCount });

            const result = await postEngagement(eventId, "repost", "toggle", accountHeaders);
            if (result) {
                const serverDidSet = result.didSet;
                const serverCount = result.counts?.repost ?? newCount;
                setHasReposted(serverDidSet);
                setRepostCount(serverCount);
                broadcast(eventId, { hasReposted: serverDidSet, repostCount: serverCount });
                onEngagementChange?.({ eventId, type: "repost", didSet: serverDidSet, counts: result.counts });
            }
            setRepostBusy(false);
        });
    };

    const handleCommentClick = (e) => {
        e.stopPropagation();
        if (typeof onComment === "function") {
            onComment();
        } else if (typeof onClick === "function") {
            onClick();
        }
    };

    const handleShareClick = (e) => {
        e.stopPropagation();
        setShareDialogOpen(true);
    };

    const handleShareDialogClose = () => {
        setShareDialogOpen(false);
    };

    const handleShared = async () => {
        setShareDialogOpen(false);
        await postEngagement(eventId, "share", "set", accountHeaders);
        setShareCount((c) => {
            const next = c + 1;
            broadcast(eventId, { shareCount: next });
            return next;
        });
    };

    const submitReport = async ({ reason, details }) => {
        const ok = await postReport(eventId, reason, details, accountHeaders);
        if (!ok) {
            setToast({ open: true, msg: "Could not send report. Please try again." });
        }
    };

    const CategoryIcon = categoryInfo.slug ? (EVENT_CATEGORY_ICONS[categoryInfo.slug] || CategoryRoundedIcon) : null;
    const hasPhoto = Boolean(mainPhoto);
    const imageSrc = hasPhoto ? mainPhoto : EVENT_FALLBACK_IMG;

    // Compact action-bar pill styling (mirrors ListingCard)
    const pillSx = {
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        cursor: "pointer",
        userSelect: "none",
        transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
        "&:hover": {
            bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
        },
        "&:active": {
            transform: "scale(0.97)",
        },
    };

    const countSx = { fontSize: 12.5, fontWeight: 700, color: "text.secondary", lineHeight: 1 };

    return (
        <>
            <Card
                elevation={0}
                role="button"
                tabIndex={0}
                onClick={handleActivate}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleActivate(); } }}
                onMouseEnter={() => { setIsHovered(true); onHover?.(eventId ?? null); }}
                onMouseLeave={() => { setIsHovered(false); onHover?.(null); }}
                sx={(t) => ({
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    isolation: "isolate",
                    borderRadius: "14px",
                    border: "1px solid",
                    borderColor: selected
                        ? alphaColor(t.palette.secondary.main, 0.55)
                        : alphaColor(t.palette.text.primary, 0.08),
                    bgcolor: t.palette.background.paper,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: selected
                        ? t.custom.shadows.md
                        : t.custom.shadows.xs,
                    transition: `box-shadow ${t.custom.motion.slow}ms cubic-bezier(0.4,0,0.2,1), border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.slow}ms cubic-bezier(0.4,0,0.2,1)`,
                    transform: "translateY(0)",
                    ...(isHovered && !selected ? {
                        boxShadow: `0 12px 36px ${alphaColor(t.palette.text.primary, 0.12)}`,
                    } : {}),
                    "&:focus-visible": { outline: `2px solid ${alphaColor(t.palette.primary.main, 0.45)}`, outlineOffset: 2 },
                })}
            >
                {/* ═══════════ HERO IMAGE AREA ═══════════ */}
                {hasPhoto ? (
                    <Box
                        sx={{
                            position: "relative",
                            aspectRatio: compact ? "16 / 8" : "16 / 9",
                            overflow: "hidden",
                            bgcolor: (t) => alphaColor(t.palette.primary.main, 0.06),
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            component="img"
                            src={imageSrc}
                            alt={title}
                            loading="lazy"
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                transition: (t) => `transform ${t.custom.motion.slow}ms cubic-bezier(0.4,0,0.2,1)`,
                                transform: isHovered ? "scale(1.04)" : "scale(1)",
                            }}
                        />

                        {/* ── Photo count badge (bottom-right on image) ── */}
                        {photosCount > 1 && (
                            <Stack
                                direction="row"
                                spacing={0.4}
                                alignItems="center"
                                sx={{
                                    position: "absolute",
                                    bottom: 10,
                                    right: 10,
                                    zIndex: 3,
                                    bgcolor: (t) => alphaColor(t.palette.common.black, 0.55),
                                    backdropFilter: "blur(4px)",
                                    borderRadius: 999,
                                    px: 0.9,
                                    py: 0.3,
                                }}
                            >
                                <CameraAltRoundedIcon sx={{ fontSize: 13, color: "common.white" }} />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white", lineHeight: 1 }}>
                                    {photosCount}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                ) : (
                    /* ═══════════ NO-PHOTO DECORATIVE HEADER ═══════════ */
                    <Box
                        sx={(t) => ({
                            position: "relative",
                            overflow: "hidden",
                            flexShrink: 0,
                            aspectRatio: compact ? "16 / 8" : "16 / 9",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.75,
                            background: `linear-gradient(160deg, ${alphaColor(t.palette.primary.main, 0.04)} 0%, ${alphaColor(t.palette.primary.main, 0.09)} 40%, ${alphaColor(t.palette.primary.main, 0.03)} 100%)`,
                            // Subtle dot pattern
                            "&::before": {
                                content: '""',
                                position: "absolute",
                                inset: 0,
                                backgroundImage: `radial-gradient(${alphaColor(t.palette.primary.main, 0.06)} 1px, transparent 1px)`,
                                backgroundSize: "18px 18px",
                                pointerEvents: "none",
                            },
                        })}
                    >
                        {/* Large category icon */}
                        <Box
                            sx={(t) => ({
                                width: 68,
                                height: 68,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: alphaColor(t.palette.background.paper, 0.9),
                                border: `2px solid ${alphaColor(t.palette.primary.main, 0.18)}`,
                                boxShadow: `0 0 0 6px ${alphaColor(t.palette.primary.main, 0.06)}, 0 4px 16px ${alphaColor(t.palette.primary.main, 0.1)}`,
                                position: "relative",
                                zIndex: 1,
                            })}
                        >
                            {CategoryIcon ? (
                                <CategoryIcon sx={{ fontSize: 34, color: "primary.main" }} />
                            ) : (
                                <CalendarTodayRoundedIcon sx={{ fontSize: 34, color: "primary.main" }} />
                            )}
                        </Box>
                    </Box>
                )}

                {/* ═══════════ CARD BODY ═══════════ */}
                <Box sx={{ px: 1.75, pt: 1.25, pb: 0.75, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    {/* Date line — inside card body */}
                    {whenLabel && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                mb: 0.5,
                            }}
                        >
                            <CalendarTodayRoundedIcon sx={{ fontSize: 13, color: "primary.main" }} />
                            <Typography
                                sx={{
                                    fontWeight: 800,
                                    fontSize: { xs: 11, sm: 11.5 },
                                    lineHeight: 1,
                                    color: "text.secondary",
                                    letterSpacing: "-0.1px",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {whenLabel}
                            </Typography>
                        </Box>
                    )}

                    {/* Title + 3-dot row */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                        <Typography
                            sx={{
                                flex: 1,
                                fontWeight: 950,
                                color: "text.primary",
                                lineHeight: 1.2,
                                fontSize: { xs: 14, sm: 15 },
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                            }}
                        >
                            {title}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            aria-label="More options"
                            sx={{ flexShrink: 0, mt: -0.5, mr: -0.75, color: "text.secondary" }}
                        >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Category chip — JobCard style */}
                    {categoryInfo.label && (
                        <Chip
                            size="small"
                            icon={CategoryIcon ? <CategoryIcon sx={{ fontSize: 14 }} /> : undefined}
                            label={categoryInfo.label}
                            sx={(t) => ({
                                alignSelf: "flex-start",
                                mt: 0.75,
                                height: 24,
                                borderRadius: 999,
                                fontWeight: 800,
                                fontSize: 11,
                                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                border: "1px solid",
                                borderColor: alphaColor(t.palette.primary.main, 0.25),
                                "& .MuiChip-label": { px: 0.9, lineHeight: 1, whiteSpace: "normal" },
                                "& .MuiChip-icon": { ml: 0.5, color: t.palette.primary.main },
                            })}
                        />
                    )}

                    {/* Location */}
                    {locationLabel && (
                        <Box
                            sx={{
                                display: "flex", alignItems: "center", gap: 0.4, mt: 0.6,
                                alignSelf: "flex-start",
                                ...(typeof onLocationClick === "function" ? {
                                    cursor: "pointer",
                                    borderRadius: 1,
                                    px: 0.5,
                                    mx: -0.5,
                                    transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    "&:hover .evt-loc-icon, &:hover .evt-loc-text": { color: "secondary.main" },
                                } : {}),
                            }}
                            onClick={typeof onLocationClick === "function" ? (e) => { e.stopPropagation(); onLocationClick(safeEvent); } : undefined}
                        >
                            <LocationOnRoundedIcon className="evt-loc-icon" sx={{ fontSize: 13, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                            <Typography className="evt-loc-text" sx={{ fontSize: 11.5, fontWeight: 700, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}>
                                {locationLabel}
                            </Typography>
                        </Box>
                    )}

                    {/* Organizer row — below location */}
                    <Box
                        onClick={handleOrganizerClick}
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            alignSelf: "flex-start",
                            gap: 0.75,
                            minWidth: 0,
                            flex: "0 1 auto",
                            cursor: "pointer",
                            borderRadius: 2,
                            p: 0.5,
                            mt: 0.5,
                            transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            "&:hover": { bgcolor: (t) => alphaColor(t.palette.text.primary, 0.04) },
                        }}
                    >
                        <Avatar
                            src={avatarUrl || undefined}
                            alt={organizerLabel}
                            sx={(t) => ({
                                width: 30,
                                height: 30,
                                border: "2px solid",
                                borderColor: alphaColor(t.palette.primary.main, 0.12),
                                bgcolor: alphaColor(t.palette.primary.main, 0.06),
                                color: t.palette.primary.main,
                                flexShrink: 0,
                            })}
                        >
                            {isBusinessEvent ? <StorefrontRoundedIcon sx={{ fontSize: 20 }} /> :
                                isArtistEvent
                                    ? (isVisualArtistEvent
                                        ? <PaletteRoundedIcon sx={{ fontSize: 20 }} />
                                        : <MusicNoteRoundedIcon sx={{ fontSize: 20 }} />)
                                    : <PersonRoundedIcon sx={{ fontSize: 20 }} />}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                sx={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    letterSpacing: 0.2,
                                    textTransform: "none",
                                    color: "text.secondary",
                                    lineHeight: 1,
                                    mb: 0.3,
                                }}
                            >
                                Posted by
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        color: (t) => alphaColor(t.palette.text.primary, 0.78),
                                        lineHeight: 1.1,
                                        fontSize: 12,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 1,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {organizerLabel}
                                </Typography>
                                {organizerIsVerified ? (
                                    <Tooltip title="Verified" arrow>
                                        <VerifiedRoundedIcon sx={{ fontSize: 13, color: "primary.main", flexShrink: 0 }} />
                                    </Tooltip>
                                ) : null}
                                {isEdited && (
                                    <>
                                        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, lineHeight: 1 }}>•</Typography>
                                        <Typography
                                            variant="caption"
                                            onClick={openHistory}
                                            sx={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                color: "primary.main",
                                                "&:hover": { textDecoration: "underline" },
                                            }}
                                        >
                                            Edited
                                        </Typography>
                                    </>
                                )}
                            </Stack>
                            {handleLabel && (
                                <Typography sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.1, mt: 0.1 }}>
                                    @{handleLabel}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* ═══════════ ENGAGEMENT ZONE ═══════════ */}
                <Box>
                    {/* ═══════════ FRIENDS GOING — smooth slide-open ═══════════ */}
                    {/* Always rendered when friends exist; animated via max-height
                        so the card grows smoothly instead of jumping taller. */}
                    <Box
                        sx={(t) => ({
                            overflow: "hidden",
                            maxHeight: (friendsLoaded && friendsGoing.length > 0) ? 60 : 0,
                            opacity: (friendsLoaded && friendsGoing.length > 0) ? 1 : 0,
                            transition: `max-height ${t.custom.motion.gentle}ms ${t.custom.motion.ease}, opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                        })}
                    >
                        {friendsGoing.length > 0 && (() => {
                            // Filter friends based on the active view filter
                            const filteredFriends = activeView === "friends-interested"
                                ? friendsGoing.filter((f) => (f.engagement_type || f.engagementType || "") === "interested")
                                : activeView === "friends-going"
                                    ? friendsGoing.filter((f) => (f.engagement_type || f.engagementType || "rsvp") === "rsvp")
                                    : friendsGoing;

                            if (filteredFriends.length === 0) return null;

                            return (
                                <Box sx={{ px: 1.5, pt: 0.5, pb: 0.25 }}>
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 1,
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: 1,
                                            cursor: "pointer",
                                            transition: "background-color 0.15s",
                                            "&:hover": { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.06) },
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setFriendsDialogOpen(true); }}
                                    >
                                        {/* Stacked avatars — up to 3 */}
                                        <Box sx={{ display: "flex", flexShrink: 0 }}>
                                            {filteredFriends.slice(0, 3).map((friend, idx) => (
                                                <Avatar
                                                    key={friend.id || idx}
                                                    src={friend.avatarUrl || friend.avatar_url || friend.profile_picture || undefined}
                                                    alt={toStr(friend.firstName || friend.first_name)}
                                                    sx={(t) => ({
                                                        width: 24,
                                                        height: 24,
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        border: "2px solid",
                                                        borderColor: t.palette.background.paper,
                                                        bgcolor: alphaColor(t.palette.primary.main, 0.12),
                                                        color: "primary.main",
                                                        ml: idx > 0 ? "-8px" : 0,
                                                        zIndex: 3 - idx,
                                                        position: "relative",
                                                    })}
                                                >
                                                    <PersonRoundedIcon sx={{ fontSize: 16 }} />
                                                </Avatar>
                                            ))}
                                        </Box>

                                        {/* Label */}
                                        <Typography
                                            sx={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "text.secondary",
                                                lineHeight: 1.25,
                                                minWidth: 0,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {(() => {
                                                const MAX_NAMES = 3;
                                                const names = filteredFriends.slice(0, MAX_NAMES).map((f) =>
                                                    toStr(f?.firstName || f?.first_name || f?.name || "Someone").split(" ")[0]
                                                );
                                                const remaining = filteredFriends.length - MAX_NAMES;

                                                // Determine verb from the filtered list
                                                const hasGoing = filteredFriends.some((f) => (f.engagement_type || f.engagementType || "rsvp") === "rsvp");
                                                const verb = hasGoing ? "going" : "interested";

                                                // Build the name string with proper grammar
                                                let nameStr;
                                                if (remaining > 0) {
                                                    nameStr = `${names.join(", ")} +${remaining} more`;
                                                } else if (names.length === 2) {
                                                    nameStr = `${names[0]} and ${names[1]}`;
                                                } else if (names.length === 3) {
                                                    nameStr = `${names[0]}, ${names[1]}, and ${names[2]}`;
                                                } else {
                                                    nameStr = names[0] || "Someone";
                                                }

                                                // Grammar: "is" for 1 person, "are" for 2+
                                                const connector = filteredFriends.length === 1 ? "is" : "are";

                                                return `${nameStr} ${connector} ${verb}`;
                                            })()}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })()}
                    </Box>

                    {/* ═══════════ RSVP / INTERESTED / EDIT BUTTONS ═══════════ */}
                    <Stack direction="row" spacing={0.75} sx={{ px: 1.5, pt: 0.25, pb: 1.25, alignItems: "center" }}>
                        <Button
                            variant={hasRsvpd ? "contained" : "outlined"}
                            size="small"
                            disabled={rsvpBusy}
                            startIcon={hasRsvpd ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : <EventAvailableRoundedIcon sx={{ fontSize: 16 }} />}
                            onClick={handleRsvpClick}
                            sx={(t) => ({
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 11.5,
                                py: 0.4,
                                px: 1.5,
                                minHeight: 0,
                                lineHeight: 1.4,
                                transition: `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                ...(hasRsvpd
                                    ? {
                                        bgcolor: t.palette.secondary.main,
                                        color: t.palette.secondary.contrastText,
                                        boxShadow: t.custom.shadows.xs,
                                        "&:hover": { bgcolor: t.palette.secondary.dark, boxShadow: t.custom.shadows.sm },
                                    }
                                    : {
                                        borderColor: alphaColor(t.palette.text.primary, 0.14),
                                        color: t.palette.secondary.main,
                                        "&:hover": { bgcolor: alphaColor(t.palette.secondary.main, 0.04), borderColor: alphaColor(t.palette.secondary.main, 0.34), boxShadow: t.custom.shadows.xs },
                                    }),
                            })}
                        >
                            {hasRsvpd ? "Going" : "RSVP"}{rsvpCount > 0 ? ` (${formatCount(rsvpCount)})` : ""}
                        </Button>

                        <Button
                            variant={isInterested ? "contained" : "outlined"}
                            size="small"
                            disabled={interestedBusy}
                            startIcon={isInterested ? <StarRoundedIcon sx={{ fontSize: 16 }} /> : <StarBorderRoundedIcon sx={{ fontSize: 16 }} />}
                            onClick={handleInterestedClick}
                            sx={(t) => ({
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 11.5,
                                py: 0.4,
                                px: 1.5,
                                minHeight: 0,
                                lineHeight: 1.4,
                                transition: `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                ...(isInterested
                                    ? {
                                        bgcolor: t.palette.primary.main,
                                        color: t.palette.primary.contrastText,
                                        boxShadow: t.custom.shadows.xs,
                                        "&:hover": { bgcolor: t.palette.primary.dark, boxShadow: t.custom.shadows.sm },
                                    }
                                    : {
                                        borderColor: alphaColor(t.palette.text.primary, 0.14),
                                        color: t.palette.text.secondary,
                                        "&:hover": { bgcolor: alphaColor(t.palette.primary.main, 0.04), borderColor: alphaColor(t.palette.primary.main, 0.34), color: t.palette.primary.main, boxShadow: t.custom.shadows.xs },
                                    }),
                            })}
                        >
                            Interested{interestedCount > 0 ? ` (${formatCount(interestedCount)})` : ""}
                        </Button>
                    </Stack>

                    {/* ═══════════ COMPACT ICON ACTION BAR ═══════════ */}
                    <Box sx={(t) => ({ px: 1.5, py: 0.75, borderTop: { xs: "none", sm: "1px solid" }, borderColor: { xs: "transparent", sm: alphaColor(t.palette.text.primary, 0.06) } })}>
                        <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                            {/* Like */}
                            <Tooltip title={hasLiked ? "Unlike" : "Like"}>
                                <Box onClick={handleLikeClick} sx={pillSx}>
                                    {hasLiked
                                        ? <FavoriteRoundedIcon sx={{ fontSize: 22, color: "secondary.main" }} />
                                        : <FavoriteBorderRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                    }
                                    {likeCount > 0 && (
                                        <Typography sx={{ ...countSx, color: hasLiked ? "secondary.main" : "text.secondary" }}>
                                            {formatCount(likeCount)}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>

                            {/* Comment */}
                            <Tooltip title="Comment">
                                <Box onClick={handleCommentClick} sx={pillSx}>
                                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                    {commentCount > 0 && (
                                        <Typography sx={countSx}>{formatCount(commentCount)}</Typography>
                                    )}
                                </Box>
                            </Tooltip>

                            {/* Repost */}
                            <Tooltip title={hasReposted ? "Undo Repost" : "Repost"}>
                                <Box onClick={handleRepostClick} sx={pillSx}>
                                    <RepeatRoundedIcon sx={{ fontSize: 22, color: hasReposted ? "secondary.main" : "text.secondary" }} />
                                    {repostCount > 0 && (
                                        <Typography sx={{ ...countSx, color: hasReposted ? "secondary.main" : "text.secondary" }}>
                                            {formatCount(repostCount)}
                                        </Typography>
                                    )}
                                </Box>
                            </Tooltip>

                            {/* Share */}
                            <Tooltip title="Share">
                                <Box onClick={handleShareClick} sx={pillSx}>
                                    <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                </Box>
                            </Tooltip>
                        </Box>
                    </Box>
                </Box>
            </Card>

            {/* 3-dot Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                disableScrollLock
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alphaMui(t.palette.text.primary, 0.15)}`,
                        minWidth: 200,
                        py: 0.5,
                    },
                }}
            >
                {/* Copy Link - always visible */}
                <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon>
                        <LinkRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>

                {showOwnerActions && <Divider sx={{ my: 0.5 }} />}

                {showOwnerActions && (
                    <MenuItem
                        onClick={handleEditClick}
                        disabled={!isOnCorrectAccount}
                        sx={{ py: 1, opacity: isOnCorrectAccount ? 1 : 0.5 }}
                    >
                        <ListItemIcon>
                            <EditIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Edit" />
                    </MenuItem>
                )}

                {showOwnerActions && (
                    <Tooltip
                        title={deleteDisabledTooltip}
                        placement="left"
                        arrow
                        disableHoverListener={isOnCorrectAccount}
                        componentsProps={{
                            tooltip: {
                                sx: {
                                    fontSize: 13,
                                    fontWeight: 600,
                                    px: 1.25,
                                    py: 0.75,
                                    maxWidth: 240,
                                },
                            },
                        }}
                    >
                        <span>
                            <MenuItem
                                onClick={handleDeleteClick}
                                disabled={!isOnCorrectAccount}
                                sx={{ py: 1, opacity: isOnCorrectAccount ? 1 : 0.5, color: isOnCorrectAccount ? "error.main" : undefined }}
                            >
                                <ListItemIcon sx={{ color: isOnCorrectAccount ? "error.main" : undefined }}>
                                    <DeleteIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Delete" />
                            </MenuItem>
                        </span>
                    </Tooltip>
                )}

                {/* Report - visible when not on the owning account */}
                {!isOnCorrectAccount && <Divider sx={{ my: 0.5 }} />}
                {!isOnCorrectAccount && (
                    <MenuItem onClick={handleReportFromMenu} sx={{ py: 1 }}>
                        <ListItemIcon>
                            <FlagOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Report" />
                    </MenuItem>
                )}
            </Menu>

            {isMobileEvt && (
                <MobileActionSheet
                    open={mobileSheetOpen}
                    onClose={() => setMobileSheetOpen(false)}
                    items={[
                        { icon: <LinkRoundedIcon />, label: 'Copy link', onClick: handleCopyLink },
                        showOwnerActions && isOnCorrectAccount && { icon: <EditIcon />, label: 'Edit event', onClick: handleEditClick },
                        showOwnerActions && isOnCorrectAccount && { icon: <DeleteIcon />, label: 'Delete event', onClick: handleDeleteClick, color: 'error' },
                        !isOnCorrectAccount && { divider: true },
                        !isOnCorrectAccount && { icon: <FlagOutlinedIcon />, label: 'Report event', onClick: handleReportFromMenu },
                    ].filter(Boolean)}
                />
            )}

            <UserCardPopover
                anchorEl={popoverAnchorEl}
                onClose={handlePopoverClose}
                user={organizer ? {
                    id: organizerId,
                    handle: handleLabel,
                    firstName: organizer?.firstName || organizer?.first_name,
                    lastName: organizer?.lastName || organizer?.last_name,
                    profile_picture: avatarUrl,
                    avatar_url: avatarUrl,
                    ...(isBusinessEvent && eventBusinessAccountId ? {
                        account_type: 'business',
                        business_id: eventBusinessAccountId,
                        business_name: businessAccountName || organizerLabel,
                        business_slug: businessAccountSlug || handleLabel,
                        business_avatar_url: businessAccountAvatar || avatarUrl,
                    } : {}),
                    ...(isArtistEvent && eventArtistAccountId ? {
                        account_type: 'artist',
                        artist_id: eventArtistAccountId,
                        artist_name: organizerLabel,
                        artist_handle: handleLabel,
                        artist_avatar_url: avatarUrl,
                    } : {}),
                } : null}
                isSelf={isSelf}
                following={false}
                onViewProfile={handleViewProfile}
            />

            <ReportEventDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />

            <DeleteEventDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                deleting={deleting}
            />

            {viewer ? (
                <ShareEventDialog
                    open={shareDialogOpen}
                    onClose={handleShareDialogClose}
                    event={safeEvent}
                    viewer={viewer}
                    onShared={handleShared}
                />
            ) : (
                <Dialog
                    open={shareDialogOpen}
                    onClose={handleShareDialogClose}
                    maxWidth="xs"
                    fullWidth
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
                >
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                        Share Event
                        <IconButton size="small" onClick={handleShareDialogClose} aria-label="Close">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pb: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LinkRoundedIcon />}
                            onClick={() => {
                                const url = `${window.location.origin}/events?event=${safeEvent.id}`;
                                navigator.clipboard.writeText(url).then(() => {
                                    setToast({ open: true, msg: "Link copied to clipboard" });
                                }).catch(() => {
                                    setToast({ open: true, msg: "Could not copy link." });
                                });
                                handleShareDialogClose();
                            }}
                            sx={{ justifyContent: "flex-start", textTransform: "none", fontWeight: 600, borderRadius: 2, py: 1.25, mb: 2.5 }}
                        >
                            Copy link
                        </Button>
                        <Box sx={{ textAlign: "center", py: 1 }}>
                            <PersonRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.5 }}>
                                Want to share with friends on Lantern?
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.5, mb: 2 }}>
                                Log in or create an account to follow people and share events directly with them.
                            </Typography>
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={() => { handleShareDialogClose(); openAuthUI(); }}
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, px: 4, py: 1 }}
                            >
                                Log in or sign up
                            </Button>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}

            <FriendsEngagementDialog
                open={friendsDialogOpen}
                onClose={() => setFriendsDialogOpen(false)}
                eventId={eventId}
            />

            {/* Edit History Dialog */}
            <EventEditHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                rows={historyRows}
                loading={historyLoading}
                error={historyError}
                currentEvent={safeEvent}
            />

            {/* Edit Limit Reached Dialog */}
            <Dialog
                open={editLimitDialogOpen}
                onClose={() => setEditLimitDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { position: "relative" } }}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                    Edit Limit Reached
                    <IconButton aria-label="Close" onClick={() => setEditLimitDialogOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        {editLimitMsg || "You've reached the edit limit (5 edits per 24 hours). Please try again later."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditLimitDialogOpen(false)} variant="contained" sx={{ fontWeight: 700 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            <SuccessSnackbar open={toast.open} onClose={() => setToast({ open: false, msg: "" })} message={toast.msg} />
        </>
    );
}
