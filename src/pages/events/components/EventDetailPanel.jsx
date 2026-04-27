import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from "../../../utils/commentBlockUtils";
import { useNavigate } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    ClickAwayListener,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    IconButton,
    InputAdornment,
    Link,
    List,
    ListItemButton,
    ListItemAvatar,
    ListItemIcon,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Popper,
    Radio,
    RadioGroup,
    FormControlLabel,
    Stack,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

// Icons
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PersonIcon from "@mui/icons-material/Person";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import EditIcon from "@mui/icons-material/Edit";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import BlockIcon from "@mui/icons-material/Block";

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
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

// Action icons
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";

import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";

import { fetchEventById, updateEventEngagement } from "../api/eventsApi";
import UserCardPopover from "../../../components/UserCardPopover";
import ShareEventDialog from "../../../components/ShareEventDialog";
import ShareDialog from "../../../components/ShareDialog";
import AccountAvatar from "../../../components/AccountAvatar";
import { useActiveAccount } from "../../../components/AccountContext";
import CommentImageAttachments, { uploadFilesToGCS } from "../../../components/CommentImageAttachments";
import CommentImages from "../../../components/CommentImages";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import RichTextDisplay from "../../../components/RichTextDisplay";
import useRateLimit from "../../../utils/useRateLimit";
import RateLimitDialog from "../../../components/RateLimitDialog";
import SuccessSnackbar, { useSuccessSnackbar } from "../../../components/SuccessSnackbar";
import { checkProfanity } from "../../../utils/profanityCheck";
import SmartMenu from "../../../components/SmartMenu";

/**
 * Scan a single image File object for NSFW content via the backend.
 * Returns { safe: true } or { safe: false, message: '...' }.
 */
async function scanImageFile(file) {
    try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await secureFetch('/api/community/moderate-image', {
            method: 'POST',
            credentials: 'include',
            body: fd,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            if (data && data.safe === false) return { safe: false, message: data.message || 'This image was flagged as inappropriate and cannot be uploaded.' };
            return { safe: false, message: 'Unable to verify image safety. Please try a different image.' };
        }
        if (data && data.safe === false) return { safe: false, message: data.message || 'This image was flagged as inappropriate and cannot be uploaded.' };
        return { safe: true };
    } catch {
        return { safe: false, message: 'Unable to verify image safety. Please check your connection and try again.' };
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   @Mention helpers (shared across comment + reply TextFields)
   ───────────────────────────────────────────────────────────────────────────── */

const MENTION_RE_MATCH = /(?:^|\s)@([a-zA-Z0-9_]{1,30})$/;

function getMentionMatch(text, cursorIndex) {
    if (!text || cursorIndex <= 0) return null;
    const before = text.slice(0, cursorIndex);
    const m = before.match(MENTION_RE_MATCH);
    if (!m) return null;
    const query = m[1];
    const start = before.lastIndexOf("@" + query);
    return { query, start, end: cursorIndex };
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl) return null;
    const mirror = document.createElement("div");
    const cs = window.getComputedStyle(textareaEl);
    [
        "font", "fontSize", "fontFamily", "fontWeight", "fontStyle",
        "letterSpacing", "wordSpacing", "lineHeight", "textTransform",
        "padding", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom",
        "border", "borderWidth", "boxSizing", "width", "whiteSpace", "overflowWrap", "wordWrap",
    ].forEach((p) => { mirror.style[p] = cs[p]; });
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "-9999px";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";

    const textBefore = textareaEl.value.slice(0, caretIndex);
    mirror.textContent = textBefore;
    const span = document.createElement("span");
    span.textContent = "|";
    mirror.appendChild(span);
    document.body.appendChild(mirror);
    const spanRect = span.getBoundingClientRect();
    const taRect = textareaEl.getBoundingClientRect();
    const offsetX = spanRect.left - mirror.getBoundingClientRect().left;
    const offsetY = spanRect.top - mirror.getBoundingClientRect().top;
    document.body.removeChild(mirror);

    const x = taRect.left + offsetX;
    const y = taRect.top + offsetY - textareaEl.scrollTop + 20;

    return { getBoundingClientRect: () => ({ top: y, bottom: y, left: x, right: x, width: 0, height: 0 }) };
}

function MentionAccountBadge({ item }) {
    if (!item) return null;
    const type = String(item.account_type || "").toLowerCase();
    const profileType = String(item.profile_type || item.profileType || "").toLowerCase();
    const isVisualArtistMention = type === "artist" && profileType === "artist";
    return (
        <>
            {type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {type === "artist" && !isVisualArtistMention && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {isVisualArtistMention && <PaletteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
        </>
    );
}

function renderMentionPopper({ open, anchorEl, results, loading, activeIdx, onSelect, onClose }) {
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1500 }}
                modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}>
            <ClickAwayListener onClickAway={onClose}>
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 0.75,
                        borderRadius: 2,
                        overflow: 'hidden',
                        width: { xs: '100%', sm: 420 },
                        boxShadow: (t) => t.custom.shadows.lg,
                    }}
                >
                    <List dense disablePadding>
                        {loading ? (
                            <ListItem sx={{ py: 1 }}>
                                <ListItemText
                                    primary="Searching…"
                                    primaryTypographyProps={{ fontWeight: 800 }}
                                />
                            </ListItem>
                        ) : null}

                        {!loading && !results.length ? (
                            <ListItem sx={{ py: 1 }}>
                                <ListItemText
                                    primary="No users found"
                                    primaryTypographyProps={{ fontWeight: 800 }}
                                />
                            </ListItem>
                        ) : null}

                        {!loading
                            ? results.slice(0, 4).map((u, i) => {
                                const handle = u.handle || u.username || '';
                                const label = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                                const avatar = u.avatar_url || u.profile_picture || '';
                                return (
                                    <ListItemButton
                                        key={u.id || i}
                                        selected={i === activeIdx}
                                        onMouseDown={(e) => { e.preventDefault(); onSelect(u); }}
                                        sx={{ py: 1, px: 1.5 }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 44 }}>
                                            <Avatar src={avatar || undefined} sx={{ width: 32, height: 32, ...(!avatar ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
                                                {!avatar ? <PersonRoundedIcon fontSize="small" /> : null}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={<Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                                                    {label}
                                                </Typography>
                                                <MentionAccountBadge item={u} />
                                            </Box>}
                                            secondary={handle ? `@${handle}` : ''}
                                            secondaryTypographyProps={{ noWrap: true }}
                                        />
                                    </ListItemButton>
                                );
                            })
                            : null}
                    </List>
                </Paper>
            </ClickAwayListener>
        </Popper>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Constants & Helpers
   ───────────────────────────────────────────────────────────────────────────── */
const COMMENT_MAX_CHARS = 15000;
const COMMENT_PREVIEW_CHARS = 200;

/** Max visual indent depth — deeper replies flatten with a "Replying to" label */
const MAX_VISUAL_DEPTH = 2;
/** How many replies to show per comment before "Show more replies" */
const INITIAL_REPLIES_SHOWN = 5;
/** How many top-level comments to show initially */
const INITIAL_COMMENTS_SHOWN = 20;
/** How many more top-level comments per "Load more" click */
const COMMENTS_LOAD_MORE = 20;
const REPLY_BATCH = 25;
const DESCRIPTION_PREVIEW_LINES = 4;
const DESC_MAX_HEIGHT = 130;

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

const FLAG_REASONS = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment" },
    { value: "hate", label: "Hate speech" },
    { value: "nudity", label: "Nudity" },
    { value: "misinformation", label: "Misinformation" },
    { value: "illegal", label: "Illegal content" },
    { value: "other", label: "Other" },
];

function slugToLabel(slug) {
    if (!slug) return "";
    return slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function getCategoryInfo(event) {
    const slug = toStr(event?.category || event?.categorySlug).trim().toLowerCase();
    const subcategorySlug = toStr(event?.subcategory || event?.subcategorySlug).trim().toLowerCase();
    const subcategoryLabel = toStr(event?.subcategoryLabel).trim();
    const categoryLabel = toStr(event?.categoryLabel).trim() || CATEGORY_LABELS[slug] || "";

    let displayLabel = categoryLabel;
    if (subcategorySlug) {
        displayLabel = subcategoryLabel || slugToLabel(subcategorySlug);
    }

    return { slug, label: displayLabel, categoryLabel, subcategorySlug };
}

function formatCount(count) {
    const num = Number(count) || 0;
    if (num < 1000) return num > 0 ? String(num) : "";
    if (num < 10000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    if (num < 1000000) return `${Math.round(num / 1000)}k`;
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
}

const timeAgo = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return "";
    const diffMs = Math.max(0, Date.now() - d.getTime());

    const s = Math.floor(diffMs / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${h === 1 ? "hr" : "hrs"} ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}${w === 1 ? "wk" : "wks"} ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}${mo === 1 ? "mo" : "mos"} ago`;
    const y = Math.floor(dys / 365);
    return `${y}${y === 1 ? "yr" : "yrs"} ago`;
};

function formatEventDate(event) {
    const rawStart = event?.startAt || event?.start_at;
    if (!rawStart) return null;

    const s = toStr(rawStart).trim();
    let dateObj;

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split("-").map(Number);
        dateObj = new Date(y, m - 1, d);
    } else {
        const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, y, m, d] = match.map(Number);
            dateObj = new Date(y, m - 1, d);
        } else {
            dateObj = new Date(s);
        }
    }

    if (!dateObj || Number.isNaN(dateObj.getTime())) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const eventDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    let dayLabel;
    if (eventDate.getTime() === today.getTime()) {
        dayLabel = "Today";
    } else if (eventDate.getTime() === tomorrow.getTime()) {
        dayLabel = "Tomorrow";
    } else {
        dayLabel = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(dateObj);
    }

    return dayLabel;
}

function formatEventTime(event) {
    const startTime = event?.startTime || event?.start_time;
    const endTime = event?.endTime || event?.end_time;
    const startHasTime = event?.startHasTime !== false && startTime;

    if (!startHasTime) return null;

    const formatTime = (t) => {
        if (!t) return null;
        const [hh, mm] = String(t).split(":").map(Number);
        const h = hh % 12 || 12;
        const ampm = hh >= 12 ? "PM" : "AM";
        return `${h}:${String(mm).padStart(2, "0")} ${ampm}`;
    };

    const start = formatTime(startTime);
    const end = formatTime(endTime);

    if (start && end) return `${start} – ${end}`;
    if (start) return start;
    return null;
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

function getEventPhotos(event) {
    if (!event) return [];
    const photos = event?.photos || [];
    if (Array.isArray(photos) && photos.length > 0) {
        return photos.map((p) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
    }
    const mainPhoto = event?.mainPhotoUrl || event?.main_photo_url || event?.photoUrl;
    if (mainPhoto) return [mainPhoto];
    return [];
}


/* ── Render comment text with embedded links and @mentions ── */
const renderCommentText = (text) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;

    const urlRe = /https?:\/\/[^\s<>\"')\]]+|www\.[^\s<>\"')\]]+/gi;
    const mentionRe = /@([a-zA-Z0-9_]{2,30})/g;
    const matches = [];

    let m;
    while ((m = urlRe.exec(raw)) !== null) {
        let url = m[0];
        while (url.length > 1 && /[.,;:!?)>\]}]$/.test(url)) url = url.slice(0, -1);
        matches.push({ type: 'url', start: m.index, end: m.index + url.length, value: url });
    }
    while ((m = mentionRe.exec(raw)) !== null) {
        const start = m.index;
        const before = start > 0 ? raw[start - 1] : '';
        if (before && /[a-zA-Z_.]/.test(before)) continue;
        matches.push({ type: 'mention', start, end: start + m[0].length, value: m[1] });
    }
    if (matches.length === 0) return raw;

    matches.sort((a, b) => a.start - b.start || b.end - a.end);
    const filtered = [];
    let lastEnd = 0;
    for (const match of matches) {
        if (match.start >= lastEnd) { filtered.push(match); lastEnd = match.end; }
    }

    const out = [];
    let pos = 0;
    let key = 0;
    for (const match of filtered) {
        if (match.start > pos) out.push(raw.slice(pos, match.start));
        if (match.type === 'url') {
            const href = match.value.startsWith('www.') ? `https://${match.value}` : match.value;
            const displayUrl = match.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
            out.push(
                <Link key={`url_${key++}_${match.start}`} href={href} target="_blank" rel="noopener noreferrer" underline="hover"
                      sx={{ fontWeight: 600, display: 'inline', color: 'primary.main', wordBreak: 'break-all', cursor: 'pointer' }}>
                    {displayUrl}
                </Link>
            );
        } else {
            out.push(
                <Link key={`mention_${key++}_${match.start}`} component="span" underline="hover"
                      sx={{ p: 0, fontWeight: 900, display: 'inline', color: 'primary.main', cursor: 'pointer' }}>
                    @{match.value}
                </Link>
            );
        }
        pos = match.end;
    }
    if (pos < raw.length) out.push(raw.slice(pos));
    return out;
};

function normalizeComments(raw) {
    const src = Array.isArray(raw) ? raw : raw?.comments || raw?.data || [];

    // Recursive function to normalize a comment node and its replies
    const normalizeNode = (c, idx) => {
        const isBizComment = Boolean(c.business_id || (c.account_type && String(c.account_type).toLowerCase() === 'business'));
        const isArtComment = Boolean(c.artist_id || (c.account_type && String(c.account_type).toLowerCase() === 'artist'));
        // The backend GET route flattens the display avatar into avatar_url
        // regardless of account type. Populate the specific avatar fields so
        // ThreadedCommentItem's avatar resolution finds them.
        const rawAvatar = c.avatar_url ?? c.user?.avatar_url ?? c.profile_picture ?? "";

        const node = {
            id: c.id ?? c.comment_id ?? c._id ?? `c_${idx}`,
            parentId: c.parent_id ?? c.parentId ?? c.reply_to ?? null,
            user_id: c.user_id ?? c.userId ?? c.user?.id ?? null,
            public_id: c.public_id ?? c.user_public_id ?? c.user?.public_id ?? null,
            text: String(c.text ?? c.content ?? c.body ?? c.comment ?? "").trim(),
            first_name: c.first_name ?? c.author_first_name ?? c.user?.first_name ?? "",
            last_name: c.last_name ?? c.author_last_name ?? c.user?.last_name ?? "",
            handle: c.handle ?? c.user?.handle ?? c.username ?? "",
            avatar: rawAvatar,
            created_at: c.created_at ?? c.date_created ?? c.posted_at ?? c.time ?? "",
            likes: Number(c.likes ?? c.likes_count ?? c.like_count ?? c.likeCount ?? 0),
            viewer_liked: Boolean(c.viewer_liked ?? c.liked ?? false),
            viewer_flagged: Boolean(c.viewer_flagged ?? false),
            liked_by_author: Boolean(c.liked_by_author ?? c.likedByAuthor ?? c.liked_by_post_author ?? c.likedByPostAuthor ?? c.author_liked ?? c.authorLiked ?? false),
            reply_count: Number(c.reply_count ?? 0),
            is_removed: Boolean(c.is_removed ?? c.removed ?? false),
            removed_reason: String(c.removed_reason ?? ""),
            removed_at: c.removed_at ?? null,
            is_pinned: Boolean(c.is_pinned ?? c.pinned ?? false),
            pinned_at: c.pinned_at ?? null,
            pinned_by: c.pinned_by ?? null,
            // Account identity — needed for ownership checks and display
            business_id: c.business_id ?? null,
            business_name: c.business_name ?? null,
            business_slug: c.business_slug ?? null,
            business_avatar_url: c.business_avatar_url ?? (isBizComment ? (c.account_avatar_url || null) : null),
            artist_id: c.artist_id ?? null,
            artist_name: c.artist_name ?? null,
            artist_handle: c.artist_handle ?? null,
            artist_avatar_url: c.artist_avatar_url ?? (isArtComment ? (c.account_avatar_url || null) : null),
            // Artist sub-type ('music' | 'artist') passed through so the
            // avatar fallback can pick palette (visual artist) vs music-note
            // (musician). Backend sets this per-comment from music_artists.profile_type.
            profile_type: c.profile_type ?? c.profileType ?? null,
            // Denormalized account identity (fallback when JOINs aren't available)
            account_type: c.account_type ?? (c.business_id ? 'business' : c.artist_id ? 'artist' : 'personal'),
            account_handle: c.account_handle ?? null,
            account_name: c.account_name ?? null,
            // Always preserve account_avatar_url from the server — it contains the
            // denormalized business/artist avatar that was current at comment creation time.
            // For ALL account types, fall back to rawAvatar — the backend flattens the
            // display avatar into avatar_url regardless of account type, so rawAvatar
            // already holds the correct business/artist profile pic when present.
            account_avatar_url: c.account_avatar_url ?? rawAvatar ?? null,
            images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
            image: c.image ?? (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null),
            // Recursively normalize nested replies if they exist (backend sends pre-built tree)
            replies: Array.isArray(c.replies) ? c.replies.map((r, i) => normalizeNode(r, i)) : [],
        };
        return node;
    };

    // If backend already sent a tree (items have replies arrays), just normalize and return
    const hasNestedReplies = src.some(c => Array.isArray(c.replies) && c.replies.length > 0);
    if (hasNestedReplies) {
        const roots = src.map((c, idx) => normalizeNode(c, idx));
        roots.sort((a, b) => {
            const ap = a.is_pinned ? 1 : 0;
            const bp = b.is_pinned ? 1 : 0;
            if (bp !== ap) return bp - ap;
            return 0;
        });
        return roots;
    }

    // Otherwise, build tree from flat list (fallback for flat responses)
    const items = src.map((c, idx) => normalizeNode(c, idx));

    const byId = new Map();
    items.forEach((n) => byId.set(String(n.id), n));
    const roots = [];
    items.forEach((n) => {
        const pid = n.parentId ? String(n.parentId) : null;
        if (pid && byId.has(pid)) {
            byId.get(pid).replies.push(n);
        } else {
            roots.push(n);
        }
    });
    roots.sort((a, b) => {
        const ap = a.is_pinned ? 1 : 0;
        const bp = b.is_pinned ? 1 : 0;
        if (bp !== ap) return bp - ap;
        return 0;
    });
    return roots;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Event Engagement Sync (shared with EventCard via CustomEvent)
   ───────────────────────────────────────────────────────────────────────────── */
const EVENT_ENGAGEMENT_EVT = "ll:event:engagement-changed";

const NEW_COMMENT_FADE_KEYFRAMES = `@keyframes commentFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
const NEW_COMMENT_FADE_SX = {
    animation: "commentFadeIn 0.45s ease-out both",
};
let _commentFadeInjected = false;
function ensureCommentFadeKeyframes() {
    if (_commentFadeInjected) return;
    _commentFadeInjected = true;
    const style = document.createElement("style");
    style.textContent = NEW_COMMENT_FADE_KEYFRAMES;
    document.head.appendChild(style);
}

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

function broadcastEngagement(eventId, patch) {
    writeCachedState(eventId, patch);
    try {
        window.dispatchEvent(new CustomEvent(EVENT_ENGAGEMENT_EVT, { detail: { eventId, ...patch } }));
    } catch {
        // ignore
    }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero Image with Fade & Title Overlay
   ───────────────────────────────────────────────────────────────────────────── */
function HeroImage({ photo, title }) {
    const [loaded, setLoaded] = useState(false);
    const [photoPopupOpen, setPhotoPopupOpen] = useState(false);

    if (!photo) return null;

    return (
        <>
            <Box sx={{ mb: 2 }}>
                {/* Image container */}
                <Box
                    sx={{
                        position: "relative",
                        mx: -2,
                        mt: -2,
                        width: "calc(100% + 32px)",
                        overflow: "hidden",
                        cursor: "pointer",
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                    }}
                    onClick={() => setPhotoPopupOpen(true)}
                >
                    <Box
                        component="img"
                        src={photo}
                        alt=""
                        onLoad={() => setLoaded(true)}
                        sx={{
                            width: "100%",
                            height: { xs: 220, sm: 280 },
                            objectFit: "cover",
                            display: "block",
                            opacity: loaded ? 1 : 0,
                            transition: "opacity 0.4s ease-in-out",
                        }}
                    />
                </Box>
                {/* Title below image */}
                <Typography
                    sx={{
                        fontWeight: 950,
                        fontSize: { xs: 22, sm: 26 },
                        lineHeight: 1.2,
                        color: "text.primary",
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                        mt: 2,
                        px: 0.5,
                    }}
                >
                    {title || "Untitled Event"}
                </Typography>
            </Box>

            {/* Photo popup */}
            <Dialog
                open={photoPopupOpen}
                onClose={() => setPhotoPopupOpen(false)}
                maxWidth="md"
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: "common.black",
                        m: 1,
                    },
                }}
            >
                <IconButton
                    size="small"
                    onClick={() => setPhotoPopupOpen(false)}
                    aria-label="Close"
                    sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        bgcolor: (t) => alpha(t.palette.common.black, 0.5),
                        color: "common.white",
                        "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.7) },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
                <Box
                    component="img"
                    src={photo}
                    alt={title || "Event photo"}
                    sx={{
                        display: "block",
                        width: "100%",
                        maxHeight: "85vh",
                        objectFit: "contain",
                    }}
                />
            </Dialog>
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Additional Photos Gallery (shown below, smaller)
   ───────────────────────────────────────────────────────────────────────────── */
function AdditionalPhotosGallery({ photos }) {
    const [selectedIndex, setSelectedIndex] = useState(null);

    // Skip the first photo (cover) and show the rest
    const additionalPhotos = photos.slice(1);

    if (additionalPhotos.length === 0) return null;

    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5 }}>
                More Photos
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    gap: 1,
                }}
            >
                {additionalPhotos.map((photo, idx) => (
                    <Box
                        key={idx}
                        onClick={() => setSelectedIndex(idx)}
                        sx={{
                            position: "relative",
                            paddingBottom: "100%",
                            borderRadius: 2,
                            overflow: "hidden",
                            cursor: "pointer",
                            "&:hover": {
                                "& img": {
                                    transform: "scale(1.05)",
                                },
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src={photo}
                            alt=""
                            sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.2s ease",
                            }}
                        />
                    </Box>
                ))}
            </Box>

            {/* Lightbox Dialog */}
            <Dialog
                open={selectedIndex !== null}
                onClose={() => setSelectedIndex(null)}
                maxWidth="md"
                fullWidth
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        bgcolor: "common.black",
                        overflow: "hidden",
                    },
                }}
            >
                <Box sx={{ position: "relative" }}>
                    <IconButton
                        onClick={() => setSelectedIndex(null)}
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            zIndex: 10,
                            bgcolor: (t) => alpha(t.palette.background.paper, 0.9),
                            "&:hover": { bgcolor: "common.white" },
                        }}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                    {selectedIndex !== null && (
                        <Box
                            component="img"
                            src={additionalPhotos[selectedIndex]}
                            alt=""
                            sx={{
                                width: "100%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                                display: "block",
                            }}
                        />
                    )}
                    {additionalPhotos.length > 1 && selectedIndex !== null && (
                        <>
                            <IconButton
                                onClick={() => setSelectedIndex((i) => (i === 0 ? additionalPhotos.length - 1 : i - 1))}
                                sx={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.9),
                                    "&:hover": { bgcolor: "common.white" },
                                }}
                                size="small"
                            >
                                <ChevronLeftRoundedIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => setSelectedIndex((i) => (i === additionalPhotos.length - 1 ? 0 : i + 1))}
                                sx={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.9),
                                    "&:hover": { bgcolor: "common.white" },
                                }}
                                size="small"
                            >
                                <ChevronRightRoundedIcon />
                            </IconButton>
                            <Box
                                sx={{
                                    position: "absolute",
                                    bottom: 12,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    bgcolor: (t) => alpha(t.palette.common.black, 0.6),
                                    color: "common.white",
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                {selectedIndex + 1} / {additionalPhotos.length}
                            </Box>
                        </>
                    )}
                </Box>
            </Dialog>
        </Box>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Flag Comment Dialog
   ───────────────────────────────────────────────────────────────────────────── */
function FlagCommentDialog({ open, onClose, onSubmit, loading, initialReason = "spam" }) {
    const [reason, setReason] = useState(initialReason);
    const [details, setDetails] = useState("");
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!open) {
            const tid = setTimeout(() => {
                setReason(initialReason);
                setDetails("");
                setSubmitted(false);
            }, 200);
            return () => clearTimeout(tid);
        }
    }, [open, initialReason]);

    return (
        <Dialog
            open={open}
            onClose={(_e, r) => {
                if (r === "backdropClick" || r === "escapeKeyDown") return;
                onClose();
            }}
            maxWidth="xs"
            fullWidth
            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
            PaperProps={{ sx: { borderRadius: 3, position: "relative" } }}
        >
            <DialogTitle sx={{ fontWeight: 900, pr: 7 }}>
                {submitted ? "Report submitted" : "Report Comment"}
                <IconButton size="small" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            {submitted ? (
                <>
                    <DialogContent>
                        <Box sx={{ textAlign: "center", py: 2 }}>
                            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "success.light", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 28, color: "success.dark" }} />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Thank you for reporting</Typography>
                            <Typography variant="body2" color="text.secondary">Your report helps keep our community safe. We&apos;ll review this comment and take appropriate action.</Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="contained" onClick={onClose} sx={{ textTransform: "none", fontWeight: 600 }}>Done</Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Why are you reporting this comment?
                        </Typography>
                        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
                            {FLAG_REASONS.map((r) => (
                                <FormControlLabel
                                    key={r.value}
                                    value={r.value}
                                    control={<Radio size="small" />}
                                    label={r.label}
                                    sx={{ "& .MuiFormControlLabel-label": { fontSize: 14 } }}
                                />
                            ))}
                        </RadioGroup>
                        <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            maxRows={4}
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            label="Details (optional)"
                            variant="outlined"
                            sx={{ mt: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none" }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => onSubmit({ reason, details, setSubmitted })}
                            disabled={!reason || loading}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                        >
                            {loading ? "Submitting..." : "Submit Report"}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Threaded Comment Item (PostDetailModal style)

/* ═══════════════════════════════════════════════════════════════════════════
   Threaded Comment Item (depth-capped, reply-batched, with "Replying to")
   ═══════════════════════════════════════════════════════════════════════════ */
function ThreadedCommentItem({
                                 node, depth, expanded, setExpanded, viewerAvatarUrl, viewerLabel,
                                 eventOwner, eventBusinessAccountId, eventArtistAccountId,
                                 likeComment, submitReply, openFlag, viewerId,
                                 onDelete, onTogglePinConfirm, onRequireAuth,
                                 replyToName, replyToHandle, replyToAvatar, onOpenUserCard,
                                 onScrollToComment, highlightedCommentId, parentCommentId,
                                 blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles,
                                 onShareComment, newCommentIds,
                             }) {
    const [replyText, setReplyText] = useState("");
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [posting, setPosting] = useState(false);
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyImageUrls, setReplyImageUrls] = useState([]);
    const [replyError, setReplyError] = useState('');
    const [showFullText, setShowFullText] = useState(false);
    const [visibleReplies, setVisibleReplies] = useState(INITIAL_REPLIES_SHOWN);

    const [liked, setLiked] = useState(Boolean(node.viewer_liked));
    const [likes, setLikes] = useState(Number(node.likes || 0));

    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const openMenu = (e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };
    const closeMenu = (e) => { if (e) e.stopPropagation(); setMenuAnchor(null); };

    useEffect(() => {
        setLiked(Boolean(node.viewer_liked));
        setLikes(Number(node.likes || 0));
    }, [node.viewer_liked, node.likes]);

    // ── Reply @mention state ──
    const [rpMentionOpen, setRpMentionOpen] = useState(false);
    const [rpMentionQuery, setRpMentionQuery] = useState("");
    const [rpMentionResults, setRpMentionResults] = useState([]);
    const [rpMentionLoading, setRpMentionLoading] = useState(false);
    const [rpMentionActiveIdx, setRpMentionActiveIdx] = useState(0);
    const [rpMentionAnchorEl, setRpMentionAnchorEl] = useState(null);
    const rpInputRef = useRef(null);
    const rpMentionCaretRef = useRef(0);
    const rpMentionStartRef = useRef(0);
    const rpMentionEndRef = useRef(0);
    const rpAbortRef = useRef(null);

    const closeRpMention = () => { setRpMentionOpen(false); setRpMentionResults([]); setRpMentionQuery(""); setRpMentionActiveIdx(0); };

    // Dismiss reply mention dropdown on scroll
    useEffect(() => {
        if (!rpMentionOpen) return;
        const onScroll = () => closeRpMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [rpMentionOpen]);

    const insertRpMention = (user) => {
        const handle = user.handle || user.username || "";
        const before = replyText.slice(0, rpMentionStartRef.current);
        const after = replyText.slice(rpMentionEndRef.current);
        const next = before + "@" + handle + " " + after;
        setReplyText(next);
        closeRpMention();
        setTimeout(() => { const el = rpInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!rpMentionOpen || !rpMentionQuery) { setRpMentionResults([]); return; }
        const ctrl = new AbortController();
        rpAbortRef.current?.abort();
        rpAbortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setRpMentionLoading(true);
                const res = await axios.get("/api/community/users/search", { params: { q: rpMentionQuery, limit: 8 }, signal: ctrl.signal });
                if (!ctrl.signal.aborted) { setRpMentionResults(Array.isArray(res.data) ? res.data : []); setRpMentionActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setRpMentionResults([]); }
            finally { if (!ctrl.signal.aborted) setRpMentionLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [rpMentionOpen, rpMentionQuery]);

    const handleRpChange = (e) => {
        const val = e.target.value;
        setReplyText(val);
        if (replyError) setReplyError('');
        const cursor = e.target.selectionStart || 0;
        rpMentionCaretRef.current = cursor;
        const match = getMentionMatch(val, cursor);
        if (match) {
            rpMentionStartRef.current = match.start;
            rpMentionEndRef.current = match.end;
            setRpMentionQuery(match.query);
            setRpMentionAnchorEl(getMentionAnchorVirtualEl(e.target, cursor));
            if (!rpMentionOpen) setRpMentionOpen(true);
        } else { closeRpMention(); }
    };

    const handleRpKeyDown = (e) => {
        if (rpMentionOpen && rpMentionResults.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setRpMentionActiveIdx((i) => (i + 1) % rpMentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setRpMentionActiveIdx((i) => (i - 1 + rpMentionResults.length) % rpMentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertRpMention(rpMentionResults[rpMentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeRpMention(); return; }
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleReplySubmit(); }
    };

    const isExpanded = Boolean(expanded[node.id]);
    const replies = node.replies || [];
    const hasReplies = replies.length > 0;

    // ── Account-aware ownership ──
    const { isBusinessAccount: isBA, isArtistAccount: isAA, activeAccount: activeAcct_tci, activeBusinessId: aBizId, activeArtistId: aArtId } = useActiveAccount();

    // Authoritative viewer profile_type for the reply-composer avatar fallback.
    // Mirrors ArtistAdminConsole — fetches the active artist row and reads
    // profile_type directly.
    const [fetchedReplyProfileType, setFetchedReplyProfileType] = useState('');
    useEffect(() => {
        const artistId = Number(aArtId || 0);
        if (!isAA || !artistId) {
            setFetchedReplyProfileType('');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await secureFetch(
                    `/api/music/artists/${encodeURIComponent(String(artistId))}`,
                    { credentials: 'include', headers: { Accept: 'application/json' } }
                );
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.artist || data || {};
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (!cancelled) setFetchedReplyProfileType(pt === 'artist' ? 'artist' : 'music');
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [isAA, aArtId]);

    // Sub-type for artist viewers. Fetched value wins over context/localStorage.
    const viewerProfileType = (() => {
        if (!isAA) return 'music';
        const fromFetched = String(fetchedReplyProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        const fromCtx = String(activeAcct_tci?.profile_type || activeAcct_tci?.profileType || '').toLowerCase();
        if (fromCtx === 'artist' || fromCtx === 'music') return fromCtx;
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (raw) {
                const parsed = JSON.parse(raw);
                const stored = String(parsed?.profile_type || parsed?.profileType || '').toLowerCase();
                if (stored === 'artist' || stored === 'music') return stored;
            }
        } catch { /* ignore */ }
        return 'music';
    })();

    const commentBizId = Number(node.business_id || 0);
    const commentArtId = Number(node.artist_id || 0);

    const isOwnComment = (() => {
        if (viewerId == null || node.user_id == null || String(viewerId) !== String(node.user_id)) return false;
        if (commentBizId > 0) return isBA && Number(aBizId) === commentBizId;
        if (commentArtId > 0) return isAA && Number(aArtId) === commentArtId;
        return !isBA && !isAA;
    })();

    const isEventOwner = (() => {
        if (viewerId == null || eventOwner?.id == null || String(viewerId) !== String(eventOwner.id)) return false;
        if (eventBusinessAccountId) return isBA && Number(aBizId) === Number(eventBusinessAccountId);
        if (eventArtistAccountId) return isAA && Number(aArtId) === Number(eventArtistAccountId);
        return !isBA && !isAA;
    })();

    const canPin = isEventOwner && depth === 0;
    const canDelete = isOwnComment || isEventOwner;
    const isPinned = Boolean(node.is_pinned);

    const isCommentByOrganizer = (() => {
        if (eventBusinessAccountId) {
            return commentBizId > 0 && Number(commentBizId) === Number(eventBusinessAccountId);
        }
        if (eventArtistAccountId) {
            return commentArtId > 0 && Number(commentArtId) === Number(eventArtistAccountId);
        }
        return eventOwner?.id != null && node.user_id != null &&
            String(node.user_id) === String(eventOwner.id) && !commentBizId && !commentArtId;
    })();

    // ── Account-aware display name / avatar / handle ──
    // Mirrors PostDetailModal logic: when a comment was made by a business
    // or artist account, show that account's name, avatar, and handle
    // instead of the personal user profile.
    const isBusinessComment = Boolean(node.business_id || node.business_name || node.account_type === 'business');
    const isArtistComment = Boolean(node.artist_id || node.artist_name || node.account_type === 'artist');

    const displayName = node.business_name
        ? node.business_name
        : node.artist_name
            ? node.artist_name
            : node.account_name
                ? node.account_name
                : (`${node.first_name || ""} ${node.last_name || ""}`.trim() || node.handle || "User");

    const displayHandle = node.business_slug
        ? node.business_slug
        : node.artist_handle
            ? node.artist_handle
            : node.account_handle
                ? node.account_handle
                : (node.handle || "");

    // For business/artist: use their specific avatar, then account_avatar_url (denormalized at creation).
    // NEVER fall back to node.avatar — that's the personal profile pic from the users table.
    // For normal users: use node.avatar (personal pic).
    const avatarUrl = (() => {
        let raw;
        if (isBusinessComment) {
            raw = (node.business_avatar_url || node.account_avatar_url || '').trim();
        } else if (isArtistComment) {
            raw = (node.artist_avatar_url || node.account_avatar_url || '').trim();
        } else {
            raw = node.avatar || "";
        }
        return isDefaultAvatar(raw) ? "" : raw;
    })();
    // Use the viewer's LIVE avatar for their own comments so profile pic changes show immediately.
    const displayAvatarUrl = (isOwnComment && viewerAvatarUrl) ? viewerAvatarUrl : avatarUrl;
    const hasCommentAvatar = !!displayAvatarUrl;

    // Default avatar icon for business/artist comments. For artist commenters,
    // distinguish musicians (music note) from visual artists (palette) using
    // the profile_type field returned by the comments API. Tolerant of missing
    // field — defaults to music-note fallback.
    const commentProfileType = String(node?.profile_type || node?.profileType || "").toLowerCase();
    const isVisualArtistComment = isArtistComment && commentProfileType === "artist";
    const DefaultAvatarIcon = isBusinessComment
        ? StorefrontOutlinedIcon
        : isArtistComment
            ? (isVisualArtistComment ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;
    const createdLabel = timeAgo(node.created_at);
    const deleteLabel = depth > 0 ? "Delete Reply" : "Delete Comment";

    const needsTruncate = node.text.length > COMMENT_PREVIEW_CHARS;
    const displayText = needsTruncate && !showFullText ? `${node.text.slice(0, COMMENT_PREVIEW_CHARS)}...` : node.text;
    const hasAnyMenuItems = canPin || canDelete || (!isOwnComment && viewerId);

    // Depth-capped indent — after MAX_VISUAL_DEPTH, stop adding padding so replies don't keep shifting right
    const shouldIndent = depth > 0 && depth <= MAX_VISUAL_DEPTH;
    const indentPl = shouldIndent ? { xs: 1.5, sm: 2 } : 0;
    const indentMl = shouldIndent ? { xs: 0.5, sm: 1 } : 0;
    const showBorderLeft = shouldIndent;
    const avatarSize = depth === 0 ? 40 : depth === 1 ? 36 : 32;
    const replyAvatarSize = depth >= 2 ? 24 : 28;

    const handleToggleExpand = () => { setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] })); };
    const handleReplySubmit = async () => {
        const hasImages = replyFiles.length > 0 || replyImageUrls.length > 0;
        if (!replyText.trim() && !hasImages) return;

        const txt = replyText.trim();

        // Client-side profanity check
        if (txt) {
            const profResult = checkProfanity(txt);
            if (!profResult.clean) {
                setReplyError('Your reply contains inappropriate language. Please revise and try again.');
                return;
            }
        }

        // Client-side image moderation check (scan each file before uploading)
        if (replyFiles.length > 0) {
            for (const file of replyFiles) {
                const result = await scanImageFile(file);
                if (!result.safe) {
                    setReplyError(result.message);
                    return;
                }
            }
        }

        setReplyError('');
        setPosting(true);
        await submitReply(node.id, txt, { files: replyFiles, imageUrls: replyImageUrls });
        setReplyText(""); setReplyFiles([]); setReplyImageUrls([]); setShowReplyBox(false); setPosting(false);
        closeRpMention();
        setExpanded((prev) => ({ ...prev, [node.id]: true }));
    };

    const shownReplies = replies.slice(0, visibleReplies);
    const hasMoreReplies = replies.length > visibleReplies;
    const remainingReplies = replies.length - visibleReplies;

    const childProps = {
        expanded, setExpanded, viewerAvatarUrl, viewerLabel, eventOwner,
        eventBusinessAccountId, eventArtistAccountId,
        likeComment, submitReply, openFlag, viewerId, onDelete, onTogglePinConfirm, onRequireAuth,
        replyToName: displayName, replyToHandle: displayHandle, replyToAvatar: avatarUrl, onOpenUserCard,
        onScrollToComment, highlightedCommentId, parentCommentId: node.id,
        blockedUserIds, blockedHandles, onShareComment, newCommentIds,
    };

    const commentUserObj = {
        id: node.user_id, handle: displayHandle,
        first_name: node.first_name, last_name: node.last_name,
        profile_picture: avatarUrl, avatar_url: avatarUrl,
        ...(isBusinessComment ? {
            business_id: node.business_id,
            business_name: node.business_name || node.account_name,
            business_slug: node.business_slug || node.account_handle,
            business_avatar_url: node.business_avatar_url || node.account_avatar_url,
            account_type: 'business',
        } : {}),
        ...(isArtistComment ? {
            artist_id: node.artist_id,
            artist_name: node.artist_name || node.account_name,
            artist_handle: node.artist_handle || node.account_handle,
            artist_avatar_url: node.artist_avatar_url || node.account_avatar_url,
            account_type: 'artist',
        } : {}),
        ...(node.account_type ? { account_type: node.account_type } : {}),
    };
    const handleAvatarNameClick = (e) => { onOpenUserCard?.(e.currentTarget, commentUserObj); };

    // Blocked user check
    const cUserId = Number(node.user_id || 0);
    const cBizId = Number(node.business_id || 0);
    const cArtId = Number(node.artist_id || 0);
    const cHandle = (node.handle || node.business_slug || node.artist_handle || node.account_handle || '').toLowerCase().trim();
    const isBlockedUser =
        isCommentBlocked(node, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles });
    const [showBlockedContent, setShowBlockedContent] = useState(false);
    const showPlaceholder = isBlockedUser && !showBlockedContent;
    const showBlockedLabel = isBlockedUser && !showPlaceholder;

    if (showPlaceholder) {
        const blockedLabel = depth > 0 ? 'Reply from a blocked user' : 'Comment from a blocked user';
        return (
            <>
                <Box id={`comment-${node.id}`} sx={{ pl: indentPl, borderLeft: showBorderLeft ? (t) => `2px solid ${alpha(t.palette.text.primary, 0.08)}` : "none", ml: indentMl }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', py: 1, px: 1.5, bgcolor: (t) => alpha(t.palette.text.primary, 0.03), borderRadius: 2, my: 0.5 }}>
                        <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{blockedLabel}</Typography>
                        <Link component="button" type="button" underline="hover" onClick={() => setShowBlockedContent(true)}
                              sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Show</Link>
                    </Box>
                    {hasReplies && !isExpanded && (
                        <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                              sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 600, color: "primary.main" }}>
                            Show replies ({replies.length})
                        </Link>
                    )}
                </Box>
                {hasReplies && isExpanded && (
                    <Box sx={{ pl: indentPl, ml: indentMl }}>
                        {shownReplies.map((reply) => (<ThreadedCommentItem key={reply.id} node={reply} depth={depth + 1} {...childProps} />))}
                    </Box>
                )}
            </>
        );
    }

    // Removed comment — hide entirely
    if (node.is_removed) {
        return null;
    }

    // Normal comment
    return (
        <>
            <Box id={`comment-${node.id}`} sx={{ pl: indentPl, borderLeft: showBorderLeft ? (t) => `2px solid ${alpha(t.palette.text.primary, 0.08)}` : "none", ml: indentMl, ...(String(highlightedCommentId) === String(node.id) ? { bgcolor: (t) => alpha('#A87822', 0.08), borderRadius: 2.5, border: '2px solid', borderColor: (t) => `${alpha('#A87822', 0.45)}`, boxShadow: (t) => `0 0 16px ${alpha('#A87822', 0.15)}`, px: 1.5, my: 0.5, transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease' } : {}), ...(newCommentIds && newCommentIds.has(String(node.id)) ? NEW_COMMENT_FADE_SX : {}) }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", py: 1.25 }}>
                    <AccountAvatar
                        src={displayAvatarUrl}
                        alt={displayName}
                        accountType={isBusinessComment ? 'business' : isArtistComment ? 'artist' : 'user'}
                        profileType={isArtistComment ? (isVisualArtistComment ? 'artist' : 'music') : undefined}
                        size={avatarSize}
                        onClick={handleAvatarNameClick}
                        sx={{ cursor: "pointer" }}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Replying to [Name]'s comment */}
                        {depth > 0 && replyToName && (
                            <Typography variant="caption"
                                        sx={{ color: "text.secondary", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
                            >
                                <Box component="span" sx={{ color: "primary.main" }}>↳</Box>
                                Replying to {replyToName}&apos;s{" "}
                                <Box component="span"
                                     onClick={(e) => { e.stopPropagation(); if (parentCommentId && onScrollToComment) onScrollToComment(parentCommentId); }}
                                     sx={{ color: "primary.main", fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                >comment</Box>
                            </Typography>
                        )}

                        {/* Name row + menu */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "nowrap" }}>
                            <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.25 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                                    <Typography variant="subtitle2" onClick={handleAvatarNameClick}
                                                sx={{ fontWeight: 700, cursor: "pointer", fontSize: depth >= 2 ? 13 : 14, "&:hover": { textDecoration: "underline" } }} noWrap
                                    >{displayName}</Typography>
                                    {isCommentByOrganizer && (
                                        <Chip size="small" label="Author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alpha(t.palette.primary.main, 0.10), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.24), "& .MuiChip-label": { px: 0.5 } })} />
                                    )}
                                    {isPinned && depth === 0 && (
                                        <Chip size="small" icon={<PushPinRoundedIcon sx={{ fontSize: 11 }} />} label="Pinned"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alpha(t.palette.secondary.main, 0.10), color: t.palette.secondary.main, border: "1px solid", borderColor: alpha(t.palette.secondary.main, 0.24), "& .MuiChip-icon": { ml: "2px", mr: "0px", color: t.palette.secondary.main }, "& .MuiChip-label": { px: 0.5 } })} />
                                    )}
                                    {createdLabel ? (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.disabled" }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", fontSize: 11 }}>{createdLabel}</Typography>
                                        </>
                                    ) : null}
                                    {Boolean(node.liked_by_author) && !isCommentByOrganizer && (
                                        <Chip size="small" icon={<FavoriteRoundedIcon sx={{ fontSize: 10 }} />} label="by author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alpha(t.palette.error.main, 0.08), color: t.palette.error.main, border: '1px solid', borderColor: alpha(t.palette.error.main, 0.18), '& .MuiChip-icon': { ml: '2px', mr: '-2px', color: t.palette.error.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                    {showBlockedLabel && (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                                                {depth > 0 ? 'Reply made by a blocked user' : 'Comment made by a blocked user'}
                                            </Typography>
                                            <Link component="button" type="button" underline="hover"
                                                  onClick={(e) => { e.stopPropagation(); setShowBlockedContent(false); }}
                                                  sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ml: 0.25 }}>Hide</Link>
                                        </>
                                    )}
                                </Box>
                                {displayHandle && (
                                    <Typography variant="caption" onClick={handleAvatarNameClick}
                                                sx={{ color: "text.secondary", fontSize: 11, lineHeight: 1.2, mt: 0.1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                    >@{displayHandle}</Typography>
                                )}
                            </Box>

                            {/* Unpin quick-action + 3-dot menu */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 'auto' }}>
                                {canPin && isPinned && depth === 0 ? (
                                    <Tooltip title="Unpin comment" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={() => onTogglePinConfirm?.(node.id, true)}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                                                border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.28)}`,
                                                '&:hover': { bgcolor: (t) => alpha(t.palette.warning.main, 0.16) },
                                            }}
                                        >
                                            <PushPinRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                                {hasAnyMenuItems ? (
                                    <Box>
                                        <IconButton size="small" onClick={openMenu} sx={{ border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.10)}`, background: "background.paper" }}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                        <SmartMenu anchorEl={menuAnchor} open={menuOpen} onClose={closeMenu}
                                                   onClick={(e) => e.stopPropagation()}
                                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                                   transformOrigin={{ vertical: "top", horizontal: "right" }}
                                                   slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 170, boxShadow: (t) => `0 18px 50px ${alpha(t.palette.text.primary, 0.16)}` } } }}
                                        >
                                            {canPin && (
                                                <MenuItem onClick={(e) => { closeMenu(e); onTogglePinConfirm?.(node.id, isPinned); }}>
                                                    <ListItemIcon><PushPinRoundedIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary={isPinned ? "Unpin comment" : "Pin comment"} />
                                                </MenuItem>
                                            )}
                                            {canDelete && (
                                                <MenuItem onClick={(e) => { closeMenu(e); onDelete?.(node.id, depth > 0); }} sx={{ color: "error.main" }}>
                                                    <ListItemIcon sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary={deleteLabel} />
                                                </MenuItem>
                                            )}
                                            {!isOwnComment && viewerId && (
                                                <MenuItem onClick={(e) => { closeMenu(e); openFlag?.(node.id); }}>
                                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary="Report" />
                                                </MenuItem>
                                            )}
                                        </SmartMenu>
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>

                        {/* Text */}
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.55, fontSize: depth >= 2 ? 13 : 14 }}>{renderCommentText(displayText)}</Typography>
                        {(node.images?.length > 0 || node.image) ? (
                            <CommentImages images={node.images} image={node.image} />
                        ) : null}
                        {needsTruncate && (
                            <Link component="button" type="button" underline="hover" onClick={() => setShowFullText((v) => !v)}
                                  sx={{ fontSize: 12, fontWeight: 700, p: 0, mt: 0.25 }}
                            >{showFullText ? "Show less" : "Show more"}</Link>
                        )}

                        {/* Like / Reply */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.75 }}>
                            <Link component="button" type="button" underline="none"
                                  onClick={() => { if (!viewerId) { onRequireAuth?.(); return; } likeComment?.(node.id, liked); }}
                                  sx={{ fontSize: 13, fontWeight: liked ? 900 : 700, color: liked ? "primary.main" : "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}
                            >{liked ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />} {likes > 0 ? likes : "Like"}</Link>
                            <Link component="button" type="button" underline="none"
                                  onClick={() => { if (!viewerId) { onRequireAuth?.(); return; } setShowReplyBox((v) => !v); }}
                                  sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}
                            ><ReplyRoundedIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} /> Reply</Link>
                            {onShareComment && (
                                <Link component="button" type="button" underline="none"
                                      onClick={() => onShareComment(node)}
                                      sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}
                                >
                                    <ShareOutlinedIcon sx={{ fontSize: 14 }} /> Share
                                </Link>
                            )}
                        </Box>

                        {/* Reply composer */}
                        {showReplyBox && (
                            <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "flex-start" }}>
                                <AccountAvatar
                                    src={viewerAvatarUrl}
                                    alt={viewerLabel}
                                    accountType={isBA ? 'business' : isAA ? 'artist' : 'user'}
                                    profileType={isAA ? viewerProfileType : undefined}
                                    size={replyAvatarSize}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <TextField fullWidth multiline minRows={1} maxRows={4}
                                               value={replyText} onChange={handleRpChange}
                                               onKeyDown={handleRpKeyDown} placeholder={`Reply to ${displayName}... (type @ to mention)`}
                                               variant="outlined"
                                               inputRef={rpInputRef}
                                               disabled={posting}
                                               error={Boolean(replyError)}
                                               helperText={replyError}
                                               sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, alignItems: "flex-end" } }}
                                               inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                               InputProps={{
                                                   endAdornment: (
                                                       <InputAdornment position="end" sx={{ alignSelf: "flex-end", pb: 0.25 }}>
                                                           <IconButton aria-label="Send reply" onClick={handleReplySubmit}
                                                                       disabled={posting || (!replyText.trim() && replyFiles.length === 0 && replyImageUrls.length === 0)}
                                                                       sx={{ ml: 0.5, bgcolor: "primary.main", color: "common.white", width: 32, height: 32, flexShrink: 0, "&:hover": { bgcolor: "primary.dark" }, "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled", opacity: 1 } }}
                                                           >{posting ? <CircularProgress size={16} sx={{ color: "common.white" }} /> : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}</IconButton>
                                                       </InputAdornment>
                                                   ),
                                               }}
                                    />
                                    {/* Reply image + GIF attachments */}
                                    <CommentImageAttachments
                                        files={replyFiles}
                                        urls={replyImageUrls}
                                        onFilesChange={async (newFiles) => {
                                            if (replyError) setReplyError('');
                                            // Block GIF uploads — use the GIF button instead
                                            const gifFile = newFiles.find((f) => f.type === 'image/gif' || f.name?.toLowerCase().endsWith('.gif'));
                                            if (gifFile) {
                                                setReplyError('GIF files cannot be uploaded here. Please use the GIF button instead.');
                                                return;
                                            }
                                            const added = newFiles.filter((f) => !replyFiles.includes(f));
                                            for (const file of added) {
                                                const result = await scanImageFile(file);
                                                if (!result.safe) {
                                                    setReplyError(result.message);
                                                    setReplyFiles((prev) => prev.filter((pf) => pf !== file));
                                                    return;
                                                }
                                            }
                                            setReplyFiles(newFiles);
                                        }}
                                        onUrlsChange={(u) => { setReplyImageUrls(u); if (replyError) setReplyError(''); }}
                                        maxImages={4}
                                        disabled={posting}
                                    />
                                    {renderMentionPopper({ open: rpMentionOpen, anchorEl: rpMentionAnchorEl, results: rpMentionResults, loading: rpMentionLoading, activeIdx: rpMentionActiveIdx, onSelect: insertRpMention, onClose: closeRpMention })}
                                </Box>
                            </Box>
                        )}

                        {/* Show/Hide replies toggle */}
                        {hasReplies && !isExpanded && (
                            <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                                  sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 600, color: "primary.main" }}
                            >Show replies ({replies.length})</Link>
                        )}
                        {hasReplies && isExpanded && (
                            <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                                  sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 600, color: "primary.main" }}
                            >Hide replies</Link>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Replies rendered OUTSIDE the indented box so padding doesn't stack */}
            {hasReplies && isExpanded && (
                <Box sx={{ pl: indentPl, ml: indentMl }}>
                    {shownReplies.map((reply) => (<ThreadedCommentItem key={reply.id} node={reply} depth={depth + 1} {...childProps} />))}
                    {hasMoreReplies && (
                        <Link component="button" type="button" underline="hover"
                              onClick={() => setVisibleReplies((n) => n + INITIAL_REPLIES_SHOWN)}
                              sx={{ mt: 0.75, mb: 0.5, p: 0, fontSize: 13, fontWeight: 700, color: "primary.main" }}
                        >Show {Math.min(INITIAL_REPLIES_SHOWN, remainingReplies)} more {remainingReplies === 1 ? "reply" : "replies"}</Link>
                    )}
                </Box>
            )}
        </>
    );
}
/* ─────────────────────────────────────────────────────────────────────────────
   Event Comments Section
   ───────────────────────────────────────────────────────────────────────────── */
function EventCommentsSection({ eventId, user, eventOwner, eventBusinessAccountId, eventArtistAccountId, onRequireAuth, onCommentCountChange, onOpenUserCard, focusCommentInput, onFocusCommentHandled, scrollToCommentId: scrollToCommentIdProp = null, highlightCommentId: highlightCommentIdProp = null }) {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [visibleCount, setVisibleCount] = useState(INITIAL_COMMENTS_SHOWN);
    const [commentSort, setCommentSort] = useState('popular');
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const highlightTimerRef = useRef(0);

    // Success toast for comment actions
    const { showSuccess, snackbarProps: commentSuccessSnackbarProps } = useSuccessSnackbar();

    // Share comment dialog state
    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);
    const handleShareComment = useCallback((commentNode) => {
        setShareCommentTarget(commentNode);
        setShareCommentDialogOpen(true);
    }, []);

    const [commentText, setCommentText] = useState("");
    const [posting, setPosting] = useState(false);
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentImageUrls, setCommentImageUrls] = useState([]);
    const [commentError, setCommentError] = useState('');
    const commentInputRef = useRef(null);

    // Rate limiting for comments & replies
    const { checkLimit: checkCommentLimit, recordAction: recordComment } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [commentRateLimitOpen, setCommentRateLimitOpen] = useState(false);
    const [commentRateLimitInfo, setCommentRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });

    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, commentId: null, isReply: false });
    const [pinConfirm, setPinConfirm] = useState({ open: false, commentId: null, mode: "pin", willReplace: false });
    const [flagState, setFlagState] = useState({ open: false, commentId: null });
    const [flagLoading, setFlagLoading] = useState(false);
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());
    const newCommentTimerRef = useRef(0);

    // Track blocked users for comment placeholders
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());

    useEffect(() => {
        if (!user?.id) return;
        let active = true;
        (async () => {
            try {
                // Build account headers so moderation state is scoped to the active account
                let acctHeaders = {};
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        const t = String(parsed?.type || '').toLowerCase();
                        if (t === 'business' && parsed?.id) acctHeaders = { 'x-account-type': 'business', 'x-business-id': String(parsed.id) };
                        else if (t === 'artist' && parsed?.id) acctHeaders = { 'x-account-type': 'artist', 'x-artist-id': String(parsed.id) };
                    }
                } catch { /* ignore */ }

                const res = await secureFetch('/api/users/moderation-state', { credentials: 'include', headers: { Accept: 'application/json', ...acctHeaders } });
                if (!res.ok || !active) return;
                const data = await res.json();
                const sets = parseBlockedSets(data);
                if (!active) return;
                setBlockedUserIds(sets.blockedUserIds);
                setBlockedBusinessIds(sets.blockedBusinessIds);
                setBlockedArtistIds(sets.blockedArtistIds);
                if (sets.blockedUserIds.size > 0) {
                    const handles = new Set();
                    await Promise.all(
                        Array.from(sets.blockedUserIds).slice(0, 50).map(async (uid) => {
                            try {
                                const r = await secureFetch(`/api/users/public/${uid}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                                if (!r.ok) return;
                                const d = await r.json();
                                const h = (d?.profile?.handle || d?.handle || '').toLowerCase().trim();
                                if (h) handles.add(h);
                            } catch { /* skip */ }
                        })
                    );
                    if (active && handles.size > 0) setBlockedHandles(handles);
                }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [user?.id]);

    useEffect(() => {
        const onBlockedChanged = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
    }, []);

    // ── Comment @mention state ──
    const [cmMentionOpen, setCmMentionOpen] = useState(false);
    const [cmMentionQuery, setCmMentionQuery] = useState("");
    const [cmMentionResults, setCmMentionResults] = useState([]);
    const [cmMentionLoading, setCmMentionLoading] = useState(false);
    const [cmMentionActiveIdx, setCmMentionActiveIdx] = useState(0);
    const [cmMentionAnchorEl, setCmMentionAnchorEl] = useState(null);
    const cmMentionCaretRef = useRef(0);
    const cmMentionStartRef = useRef(0);
    const cmMentionEndRef = useRef(0);
    const cmAbortRef = useRef(null);

    const closeCmMention = () => { setCmMentionOpen(false); setCmMentionResults([]); setCmMentionQuery(""); setCmMentionActiveIdx(0); };

    // Dismiss comment mention dropdown on scroll
    useEffect(() => {
        if (!cmMentionOpen) return;
        const onScroll = () => closeCmMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [cmMentionOpen]);

    const insertCmMention = (user) => {
        const handle = user.handle || user.username || "";
        const before = commentText.slice(0, cmMentionStartRef.current);
        const after = commentText.slice(cmMentionEndRef.current);
        const next = before + "@" + handle + " " + after;
        setCommentText(next);
        closeCmMention();
        setTimeout(() => { const el = commentInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!cmMentionOpen || !cmMentionQuery) { setCmMentionResults([]); return; }
        const ctrl = new AbortController();
        cmAbortRef.current?.abort();
        cmAbortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setCmMentionLoading(true);
                const res = await axios.get("/api/community/users/search", { params: { q: cmMentionQuery, limit: 8 }, signal: ctrl.signal });
                if (!ctrl.signal.aborted) { setCmMentionResults(Array.isArray(res.data) ? res.data : []); setCmMentionActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setCmMentionResults([]); }
            finally { if (!ctrl.signal.aborted) setCmMentionLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [cmMentionOpen, cmMentionQuery]);

    const handleCmChange = (e) => {
        const val = e.target.value;
        setCommentText(val);
        if (commentError) setCommentError('');
        const cursor = e.target.selectionStart || 0;
        cmMentionCaretRef.current = cursor;
        const match = getMentionMatch(val, cursor);
        if (match) {
            cmMentionStartRef.current = match.start;
            cmMentionEndRef.current = match.end;
            setCmMentionQuery(match.query);
            setCmMentionAnchorEl(getMentionAnchorVirtualEl(e.target, cursor));
            if (!cmMentionOpen) setCmMentionOpen(true);
        } else { closeCmMention(); }
    };

    const handleCmKeyDown = (e) => {
        if (cmMentionOpen && cmMentionResults.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setCmMentionActiveIdx((i) => (i + 1) % cmMentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setCmMentionActiveIdx((i) => (i - 1 + cmMentionResults.length) % cmMentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertCmMention(cmMentionResults[cmMentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeCmMention(); return; }
        }
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitComment(); }
    };

    // Stable ref so the polling closure always sees the latest callback.
    const focusHandledRef = useRef(onFocusCommentHandled);
    focusHandledRef.current = onFocusCommentHandled;

    // Auto-focus comment input when triggered from the card's comment button.
    // Polls until the composer textarea exists, scrolls into view with "instant"
    // (so it doesn't fight with focus), then calls .focus() multiple times to
    // ensure it sticks even after React re-renders or layout shifts.
    useEffect(() => {
        if (!focusCommentInput) return;

        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 40;
        const interval = 150;
        let timerId = null;

        const doFocus = (el) => {
            if (!el || cancelled) return;
            try { el.focus(); } catch { /* ignore */ }
        };

        const tryFocus = () => {
            if (cancelled) return;
            attempts += 1;

            const composerEl = document.getElementById("event-comments-composer");
            const inputEl =
                commentInputRef.current ||
                (composerEl && composerEl.querySelector("textarea, input[type='text']"));

            if (composerEl && inputEl) {
                // Use instant scroll so it doesn't interfere with focus
                composerEl.scrollIntoView({ behavior: "instant", block: "center" });

                // Focus immediately
                doFocus(inputEl);

                // Re-focus after a tick (React may re-render and blur)
                setTimeout(() => doFocus(inputEl), 50);

                // Re-focus again after scroll/layout fully settles
                setTimeout(() => doFocus(inputEl), 300);

                // One last attempt in case a late re-render stole focus
                setTimeout(() => doFocus(inputEl), 600);

                // Clear the flag only after we found the element
                if (typeof focusHandledRef.current === "function") {
                    focusHandledRef.current();
                }
                return;
            }

            if (attempts < maxAttempts) {
                timerId = setTimeout(tryFocus, interval);
            } else {
                if (typeof focusHandledRef.current === "function") {
                    focusHandledRef.current();
                }
            }
        };

        timerId = setTimeout(tryFocus, 200);

        return () => {
            cancelled = true;
            if (timerId) clearTimeout(timerId);
        };
    }, [focusCommentInput]);

    const viewerId = user?.id || user?.user_id || null;

    // ── Active account context for commenting under the right identity ──
    const { activeAccount, activeAccountType, getAccountHeaders, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey } = useActiveAccount();

    // Build fresh account headers from localStorage to avoid stale closure issues
    // parseFreshAccount: reads ll:activeAccount and resolves numeric IDs
    // for business and artist accounts (mirrors AccountContext.deriveAccountFields).
    const parseFreshAccount = () => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || !parsed.id) return null;
            const t = String(parsed.type || '').toLowerCase();

            if (t === 'business') {
                const bizId = Number(parsed.id);
                if (!Number.isFinite(bizId) || bizId <= 0) return null;
                return { ...parsed, type: 'business', numericId: bizId };
            }
            if (t === 'artist') {
                let artId = null;
                const rawArtId = parsed.artistId ?? parsed.artist_id ?? null;
                if (rawArtId != null) {
                    artId = Number(rawArtId) || null;
                } else {
                    const idStr = String(parsed.id || '');
                    if (idStr.startsWith('artist:')) {
                        const n = Number(idStr.replace('artist:', ''));
                        artId = Number.isFinite(n) && n > 0 ? n : null;
                    } else {
                        const n = Number(parsed.id);
                        artId = Number.isFinite(n) && n > 0 ? n : null;
                    }
                }
                if (!artId) return null;
                return { ...parsed, type: 'artist', numericId: artId };
            }
            return null; // personal — no account identity needed
        } catch { return null; }
    };

    const freshAccountHeaders = () => {
        const fa = parseFreshAccount();
        if (!fa) return {};
        if (fa.type === 'business') return { 'x-account-type': 'business', 'x-business-id': String(fa.numericId) };
        if (fa.type === 'artist') return { 'x-account-type': 'artist', 'x-artist-id': String(fa.numericId) };
        return {};
    };

    const acctType = (activeAccountType || "personal").toLowerCase();
    const isOnBusinessOrArtist = acctType === "business" || acctType === "artist";

    // Fetch active account avatar + profile_type when not in context.
    // For artist accounts ALWAYS fetch so profile_type is authoritative
    // (mirrors ArtistAdminConsole's pattern). Business accounts can
    // short-circuit when avatar is already populated.
    const [fetchedAccountAvatar, setFetchedAccountAvatar] = useState("");
    const [fetchedAccountProfileType, setFetchedAccountProfileType] = useState("");
    useEffect(() => {
        if (!isOnBusinessOrArtist) {
            setFetchedAccountAvatar("");
            setFetchedAccountProfileType("");
            return;
        }
        const existingAvatar = String(activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || "").trim();
        const hasAvatar = existingAvatar && !existingAvatar.includes("default_avatar") && !existingAvatar.includes("default_business") && !existingAvatar.includes("default_logo");
        if (isBusinessAccount && hasAvatar) {
            setFetchedAccountAvatar("");
            setFetchedAccountProfileType("");
            return;
        }
        let active = true;
        (async () => {
            try {
                let url = "";
                if (isBusinessAccount) {
                    const slug = String(activeAccount?.slug || activeAccount?.handle || "").trim();
                    if (!slug || /^\d+$/.test(slug)) return;
                    url = `/api/business/${encodeURIComponent(slug)}`;
                } else if (isArtistAccount && activeArtistId) {
                    url = `/api/music/artists/${encodeURIComponent(String(activeArtistId))}`;
                }
                if (!url) return;
                const res = await secureFetch(url, { credentials: "include", headers: { Accept: "application/json" } });
                if (!res.ok || !active) return;
                const data = await res.json();
                const entity = data?.business || data?.artist || data || {};
                const av = String(entity?.avatar_url || entity?.avatarUrl || entity?.logo_url || entity?.logoUrl || "").trim();
                const pt = String(entity?.profile_type || entity?.profileType || "").toLowerCase();
                if (!active) return;
                const okAv = av && !av.includes("default_avatar") && !av.includes("default_business") && !av.includes("default_logo");
                if (okAv) setFetchedAccountAvatar(av);
                if (isArtistAccount) setFetchedAccountProfileType(pt === "artist" ? "artist" : "music");
                // Patch localStorage so Header + other consumers pick up the
                // right values. Overwrite unconditionally so stale cached
                // values get corrected.
                try {
                    const stored = JSON.parse(localStorage.getItem("ll:activeAccount") || "{}");
                    if (stored && typeof stored === "object") {
                        let dirty = false;
                        if (okAv && stored.avatar_url !== av) {
                            stored.avatar_url = av;
                            dirty = true;
                        }
                        if (isArtistAccount) {
                            const normalized = pt === "artist" ? "artist" : "music";
                            if (stored.profile_type !== normalized || stored.profileType !== normalized) {
                                stored.profile_type = normalized;
                                stored.profileType = normalized;
                                dirty = true;
                            }
                        }
                        if (dirty) localStorage.setItem("ll:activeAccount", JSON.stringify(stored));
                    }
                } catch { /* ignore */ }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [isOnBusinessOrArtist, isBusinessAccount, isArtistAccount, activeArtistId, activeAccount?.slug, activeAccount?.handle, activeAccount?.avatar_url, activeAccount?.avatarUrl, activeAccount?.logo_url, activeAccount?.logoUrl]);

    // Artist sub-type (musician vs visual artist) for the composer avatar
    // fallback. Fetched value from /api/music/artists/:id is authoritative —
    // mirrors ArtistAdminConsole. Falls back to context, then localStorage.
    const viewerProfileType = (() => {
        if (!isArtistAccount) return 'music';
        const fromFetched = String(fetchedAccountProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        const fromCtx = String(activeAccount?.profile_type || activeAccount?.profileType || '').toLowerCase();
        if (fromCtx === 'artist' || fromCtx === 'music') return fromCtx;
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (raw) {
                const parsed = JSON.parse(raw);
                const stored = String(parsed?.profile_type || parsed?.profileType || '').toLowerCase();
                if (stored === 'artist' || stored === 'music') return stored;
            }
        } catch { /* ignore */ }
        return 'music';
    })();

    const viewerAvatarUrl = (() => {
        let raw = "";
        if (isOnBusinessOrArtist && activeAccount) {
            if (fetchedAccountAvatar) raw = fetchedAccountAvatar;
                // For business/artist accounts: ONLY use their dedicated avatar or
                // logo. Do NOT fall back to profile_picture — that pulls the
            // personal user's photo onto the wrong identity.
            else raw = activeAccount.avatar_url || activeAccount.avatarUrl || activeAccount.logo_url || activeAccount.logoUrl || activeAccount.logo || "";
        } else {
            raw = user?.avatar_url || user?.profile_picture || user?.avatarUrl || user?.avatar || "";
        }
        return isDefaultAvatar(raw) ? "" : raw;
    })();

    const viewerHandle = (() => {
        if (isOnBusinessOrArtist && activeAccount) {
            return activeAccount.handle || activeAccount.slug || "";
        }
        return user?.handle || user?.username || "";
    })();

    const viewerLabel = (() => {
        if (isOnBusinessOrArtist && activeAccount) {
            const acctName = activeAccount.name || activeAccount.business_name || activeAccount.artist_name || "";
            if (acctName) return acctName;
        }
        const first = user?.first_name || user?.firstName || user?.First_name || user?.FirstName || "";
        const last = user?.last_name || user?.lastName || user?.Last_name || user?.LastName || "";
        const full = `${first} ${last}`.trim();
        if (full) return full;
        return user?.name || user?.displayName || user?.display_name || user?.handle || user?.username || "You";
    })();

    // Helper: update a comment anywhere in the tree
    const updateCommentInTree = useCallback((currentThreads, commentId, updater) => {
        const updateNode = (node) => {
            if (String(node.id) === String(commentId)) {
                return updater(node);
            }
            if (node.replies && node.replies.length > 0) {
                return { ...node, replies: node.replies.map(updateNode) };
            }
            return node;
        };
        return currentThreads.map(updateNode);
    }, []);

    // Helper: add a reply to a parent comment
    const addReplyToTree = useCallback((currentThreads, parentId, newReply) => {
        const updateNode = (node) => {
            if (String(node.id) === String(parentId)) {
                return { ...node, replies: [...(node.replies || []), newReply], reply_count: (node.reply_count || 0) + 1 };
            }
            if (node.replies && node.replies.length > 0) {
                return { ...node, replies: node.replies.map(updateNode) };
            }
            return node;
        };
        return currentThreads.map(updateNode);
    }, []);

    // Helper: remove a comment from the tree
    const removeCommentFromTree = useCallback((currentThreads, commentId) => {
        const removeNode = (nodes) => {
            return nodes
                .filter((node) => String(node.id) !== String(commentId))
                .map((node) => {
                    if (node.replies && node.replies.length > 0) {
                        return { ...node, replies: removeNode(node.replies) };
                    }
                    return node;
                });
        };
        return removeNode(currentThreads);
    }, []);

    // Helper: toggle pin status in the tree
    const togglePinInTree = useCallback((currentThreads, commentId, shouldPin) => {
        let updated = currentThreads.map((node) => ({
            ...node,
            is_pinned: shouldPin && String(node.id) === String(commentId)
                ? true
                : String(node.id) === String(commentId)
                    ? !node.is_pinned
                    : shouldPin ? false : node.is_pinned,
        }));
        updated.sort((a, b) => {
            const ap = a.is_pinned ? 1 : 0;
            const bp = b.is_pinned ? 1 : 0;
            if (bp !== ap) return bp - ap;
            return 0;
        });
        return updated;
    }, []);

    // Stable ref for onCommentCountChange to avoid refetch loops when the
    // callback identity changes (e.g. parent passes an inline arrow function
    // whose reference updates every render).
    const onCommentCountChangeRef = useRef(onCommentCountChange);
    onCommentCountChangeRef.current = onCommentCountChange;

    useEffect(() => {
        let isMounted = true;

        const loadComments = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                // Pass active account as query params so backend can scope viewer_liked
                const qp = new URLSearchParams();
                if (activeBusinessId) qp.set('activeBusinessId', activeBusinessId);
                else if (activeArtistId) qp.set('activeArtistId', activeArtistId);
                const qs = qp.toString() ? `?${qp.toString()}` : '';

                const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/comments${qs}`, {
                    credentials: "include",
                    headers: { ...freshAccountHeaders() },
                });
                if (!res.ok) throw new Error("Failed to load comments");
                const data = await res.json();
                if (!isMounted) return;
                let normalized = normalizeComments(data);

                // ── Enrich comments that have business_id/artist_id but are
                //    missing display fields (backend may not JOIN those tables) ──
                // Collect all business/artist IDs that need enrichment (including in replies)
                // For businesses: backend rejects numeric IDs at /api/business/:slug,
                // so we collect slugs (from account_handle or business_slug) to look up.
                // For artists: /api/music/artists/:id accepts numeric IDs directly.
                const bizSlugsToFetch = new Map(); // slug → bizId
                const artIdsToFetch = new Set();
                const walkTree = (nodes) => {
                    for (const n of nodes) {
                        if (n.business_id) {
                            const slug = (n.business_slug || n.account_handle || '').trim();
                            if (slug) bizSlugsToFetch.set(slug, Number(n.business_id));
                        }
                        if (n.artist_id) {
                            artIdsToFetch.add(Number(n.artist_id));
                        }
                        if (n.replies?.length) walkTree(n.replies);
                    }
                };
                walkTree(normalized);

                // Batch-fetch business/artist display info
                const bizInfoMap = new Map(); // keyed by bizId
                const artInfoMap = new Map();

                await Promise.all([
                    ...Array.from(bizSlugsToFetch.entries()).slice(0, 20).map(async ([slug, bizId]) => {
                        try {
                            const r = await secureFetch(`/api/business/${encodeURIComponent(slug)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                            if (!r.ok) return;
                            const d = await r.json();
                            bizInfoMap.set(bizId, {
                                business_name: d?.name || '',
                                business_slug: d?.slug || slug,
                                business_avatar_url: d?.avatar_url || d?.logo_url || '',
                            });
                        } catch { /* skip */ }
                    }),
                    ...Array.from(artIdsToFetch).slice(0, 20).map(async (artId) => {
                        try {
                            const r = await secureFetch(`/api/music/artists/${encodeURIComponent(artId)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                            if (!r.ok) return;
                            const d = await r.json();
                            artInfoMap.set(artId, {
                                artist_name: d?.name || '',
                                artist_handle: d?.handle || '',
                                artist_avatar_url: d?.avatar_url || '',
                            });
                        } catch { /* skip */ }
                    }),
                ]);

                if (!isMounted) return;

                // Apply enrichment to the tree
                if (bizInfoMap.size > 0 || artInfoMap.size > 0) {
                    const enrichNode = (n) => {
                        let enriched = n;
                        const nBizId = Number(n.business_id || 0);
                        const nArtId = Number(n.artist_id || 0);

                        if (nBizId > 0 && bizInfoMap.has(nBizId)) {
                            const info = bizInfoMap.get(nBizId);
                            enriched = {
                                ...enriched,
                                business_name: enriched.business_name || info.business_name,
                                business_slug: enriched.business_slug || info.business_slug,
                                // Always overwrite avatar with canonical value from API
                                business_avatar_url: info.business_avatar_url || '',
                                account_type: 'business',
                                account_name: enriched.account_name || info.business_name,
                                account_handle: enriched.account_handle || info.business_slug,
                                account_avatar_url: info.business_avatar_url || '',
                            };
                        }
                        if (nArtId > 0 && artInfoMap.has(nArtId)) {
                            const info = artInfoMap.get(nArtId);
                            enriched = {
                                ...enriched,
                                artist_name: enriched.artist_name || info.artist_name,
                                artist_handle: enriched.artist_handle || info.artist_handle,
                                // Always overwrite avatar with canonical value from API
                                artist_avatar_url: info.artist_avatar_url || '',
                                account_type: 'artist',
                                account_name: enriched.account_name || info.artist_name,
                                account_handle: enriched.account_handle || info.artist_handle,
                                account_avatar_url: info.artist_avatar_url || '',
                            };
                        }
                        if (enriched.replies?.length) {
                            enriched = { ...enriched, replies: enriched.replies.map(enrichNode) };
                        }
                        return enriched;
                    };
                    normalized = normalized.map(enrichNode);
                }

                setThreads(normalized);
                onCommentCountChangeRef.current?.(normalized.length);
            } catch {
                if (!isMounted) return;
                setThreads([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadComments();
        return () => { isMounted = false; };
    }, [eventId, accountCacheKey, activeBusinessId, activeArtistId]);

    const submitComment = async () => {
        if (!user) {
            onRequireAuth?.();
            return;
        }
        if (!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0) return;

        const textToSubmit = commentText.trim();

        // Client-side profanity check
        if (textToSubmit) {
            const profResult = checkProfanity(textToSubmit);
            if (!profResult.clean) {
                setCommentError('Your comment contains inappropriate language. Please revise and try again.');
                return;
            }
        }

        // Client-side image moderation check (scan each file before uploading)
        if (commentFiles.length > 0) {
            for (const file of commentFiles) {
                const result = await scanImageFile(file);
                if (!result.safe) {
                    setCommentError(result.message);
                    return;
                }
            }
        }

        setCommentError('');

        // Rate limit check
        const rlResult = checkCommentLimit();
        if (!rlResult.allowed) {
            setCommentRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setCommentRateLimitOpen(true);
            return;
        }

        setPosting(true);

        // Read active account fresh from localStorage to avoid stale closures
        // (mirrors PostDetailModal pattern)
        const fa = parseFreshAccount();
        const fIsBiz = fa?.type === 'business';
        const fIsArt = fa?.type === 'artist';
        const faId = fa?.numericId || null;

        const userId = user?.id || user?.user_id || null;

        // Resolve handle for the active account
        const freshHandle = fIsBiz
            ? (fa.slug || fa.handle || '')
            : fIsArt
                ? (fa.slug || fa.handle || '')
                : '';

        let displayFirstName = "";
        let displayLastName = "";
        let displayAvatar = viewerAvatarUrl;
        let displayHandleVal = freshHandle || viewerHandle;

        if ((fIsBiz || fIsArt) && fa) {
            displayFirstName = fa.name || activeAccount?.name || "";
            displayLastName = "";
            displayAvatar = fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || activeAccount?.logo_url || "";
        } else {
            const userFirstName = user?.first_name || user?.firstName || "";
            const userLastName = user?.last_name || user?.lastName || "";
            displayFirstName = userFirstName;
            displayLastName = userLastName;

            if (!displayFirstName && !displayLastName) {
                const fullName = user?.name || user?.displayName || user?.display_name || "";
                if (fullName) {
                    const parts = fullName.trim().split(" ");
                    displayFirstName = parts[0] || "";
                    displayLastName = parts.slice(1).join(" ") || "";
                }
            }

            if (!displayFirstName && !displayLastName && displayHandleVal) {
                displayFirstName = displayHandleVal;
            }
        }

        // Create optimistic comment with full account identity fields
        const optimisticComment = {
            id: `temp_${Date.now()}`,
            parentId: null,
            user_id: userId,
            public_id: user.public_id,
            text: textToSubmit,
            first_name: displayFirstName,
            last_name: displayLastName,
            handle: displayHandleVal,
            avatar: displayAvatar,
            created_at: new Date().toISOString(),
            likes: 0,
            viewer_liked: false,
            viewer_flagged: false,
            reply_count: 0,
            is_removed: false,
            removed_reason: "",
            removed_at: null,
            is_pinned: false,
            pinned_at: null,
            pinned_by: null,
            business_id: fIsBiz ? faId : null,
            artist_id: fIsArt ? faId : null,
            account_type: fIsBiz ? 'business' : fIsArt ? 'artist' : 'personal',
            // Business display fields (used by ThreadedCommentItem)
            ...(fIsBiz ? {
                business_name: fa.name || activeAccount?.name || '',
                business_slug: fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '',
                business_avatar_url: fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
                account_name: fa.name || activeAccount?.name || '',
                account_handle: fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '',
                account_avatar_url: fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
            } : {}),
            // Artist display fields (used by ThreadedCommentItem)
            ...(fIsArt ? {
                artist_name: fa.name || activeAccount?.name || '',
                artist_handle: fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '',
                artist_avatar_url: fa.avatar_url || activeAccount?.avatar_url || '',
                account_name: fa.name || activeAccount?.name || '',
                account_handle: fa.handle || activeAccount?.handle || '',
                account_avatar_url: fa.avatar_url || activeAccount?.avatar_url || '',
            } : {}),
            replies: [],
            images: [
                ...commentImageUrls,
                ...commentFiles.map((f) => URL.createObjectURL(f)),
            ],
        };

        // Optimistically add the comment
        setThreads((prev) => {
            const newThreads = [optimisticComment, ...prev];
            onCommentCountChange?.(newThreads.length);
            return newThreads;
        });
        recordComment();
        setCommentText("");
        setCommentFiles([]);
        setCommentImageUrls([]);
        ensureCommentFadeKeyframes();
        const newCid = String(optimisticComment.id);
        setNewCommentIds((prev) => new Set(prev).add(newCid));
        // Clear the fade-in flag after animation completes
        if (newCommentTimerRef.current) clearTimeout(newCommentTimerRef.current);
        newCommentTimerRef.current = setTimeout(() => setNewCommentIds(new Set()), 2000);

        // Build POST body with account identity fields (matches PostDetailModal)
        const payload = {
            content: textToSubmit,
            ...(fIsBiz ? {
                business_id: faId,
                account_type: 'business',
                account_id: faId,
                account_handle: fa.slug || fa.handle || '',
                account_name: fa.name || '',
                account_avatar_url: fa.avatar_url || fa.logo_url || '',
            } : {}),
            ...(fIsArt ? {
                artist_id: faId,
                account_type: 'artist',
                account_id: faId,
                account_handle: fa.slug || fa.handle || '',
                account_name: fa.name || '',
                account_avatar_url: fa.avatar_url || '',
            } : {}),
        };

        try {
            // Upload local files to GCS first, then merge with any existing GIF URLs
            let allImageUrls = [...commentImageUrls];
            if (commentFiles.length > 0) {
                const uploadedUrls = await uploadFilesToGCS(commentFiles);
                allImageUrls = [...allImageUrls, ...uploadedUrls];
            }
            if (allImageUrls.length > 0) {
                payload.image_urls = allImageUrls;
            }

            // Update optimistic comment images with final GCS URLs
            if (allImageUrls.length > 0) {
                setThreads((prev) =>
                    prev.map((c) =>
                        c.id === optimisticComment.id ? { ...c, images: allImageUrls } : c
                    )
                );
            }

            const acctHdrs = freshAccountHeaders();
            const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/comments`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...acctHdrs },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newComment = await res.json();
                const normalizedComment = normalizeComments([newComment])[0];
                if (normalizedComment) {
                    // Overlay account fields from localStorage onto server response
                    // to ensure the display uses the correct business/artist identity
                    // (server may not return all denormalized fields)
                    const enriched = {
                        ...normalizedComment,
                        ...(fIsBiz ? {
                            business_id: faId,
                            business_name: normalizedComment.business_name || fa.name || activeAccount?.name || '',
                            business_slug: normalizedComment.business_slug || freshHandle || '',
                            business_avatar_url: normalizedComment.business_avatar_url || fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || '',
                            account_type: 'business',
                            account_name: normalizedComment.account_name || fa.name || activeAccount?.name || '',
                            account_handle: normalizedComment.account_handle || freshHandle || '',
                            account_avatar_url: normalizedComment.account_avatar_url || fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || '',
                            handle: normalizedComment.account_handle || normalizedComment.business_slug || freshHandle || '',
                        } : {}),
                        ...(fIsArt ? {
                            artist_id: faId,
                            artist_name: normalizedComment.artist_name || fa.name || activeAccount?.name || '',
                            artist_handle: normalizedComment.artist_handle || freshHandle || '',
                            artist_avatar_url: normalizedComment.artist_avatar_url || fa.avatar_url || activeAccount?.avatar_url || '',
                            account_type: 'artist',
                            account_name: normalizedComment.account_name || fa.name || activeAccount?.name || '',
                            account_handle: normalizedComment.account_handle || freshHandle || '',
                            account_avatar_url: normalizedComment.account_avatar_url || fa.avatar_url || activeAccount?.avatar_url || '',
                            handle: normalizedComment.account_handle || normalizedComment.artist_handle || freshHandle || '',
                        } : {}),
                    };
                    // In-place swap: update the optimistic comment with server data
                    // instead of remove+re-add to avoid re-mount flicker.
                    // Do NOT update newCommentIds here — the timer will clean it up.
                    // Swapping IDs in the set causes sortedThreads to recalc and
                    // restarts the CSS animation, producing the jitter/flash.
                    setThreads((prev) =>
                        prev.map((c) =>
                            c.id === optimisticComment.id ? { ...enriched, id: optimisticComment.id } : c
                        )
                    );
                }
            } else {
                // Revert on failure
                setThreads((prev) => {
                    const newThreads = prev.filter((c) => c.id !== optimisticComment.id);
                    onCommentCountChange?.(newThreads.length);
                    return newThreads;
                });
            }
        } catch {
            // Revert on failure
            setThreads((prev) => {
                const newThreads = prev.filter((c) => c.id !== optimisticComment.id);
                onCommentCountChange?.(newThreads.length);
                return newThreads;
            });
        } finally {
            setPosting(false);
        }
    };

    const submitReply = async (parentId, text, { files: replyFileList = [], imageUrls: replyUrlList = [] } = {}) => {
        if (!user) {
            onRequireAuth?.();
            return;
        }

        // Rate limit check
        const rlResult = checkCommentLimit();
        if (!rlResult.allowed) {
            setCommentRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setCommentRateLimitOpen(true);
            return;
        }

        // Read active account fresh from localStorage (mirrors PostDetailModal)
        const fa = parseFreshAccount();
        const fIsBiz = fa?.type === 'business';
        const fIsArt = fa?.type === 'artist';
        const faId = fa?.numericId || null;

        const userId = user?.id || user?.user_id || null;

        // Resolve handle for the active account
        const freshHandle = fIsBiz
            ? (fa?.slug || fa?.handle || activeAccount?.slug || activeAccount?.handle || '')
            : fIsArt
                ? (fa?.slug || fa?.handle || activeAccount?.slug || activeAccount?.handle || '')
                : '';

        const viewerFirstName = (fIsBiz || fIsArt)
            ? (fa?.name || activeAccount?.name || '').split(' ')[0] || user?.first_name || ''
            : (user?.first_name || user?.firstName || '');
        const viewerLastName = (fIsBiz || fIsArt)
            ? (fa?.name || activeAccount?.name || '').split(' ').slice(1).join(' ')
            : (user?.last_name || user?.lastName || '');
        const replyViewerAvatar = (fIsBiz || fIsArt)
            ? (fa?.avatar_url || fa?.logo_url || activeAccount?.avatar_url || activeAccount?.logo_url || viewerAvatarUrl)
            : viewerAvatarUrl;
        const replyViewerHandle = fIsBiz
            ? (fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '')
            : fIsArt
                ? (fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '')
                : (user?.handle || user?.username || '');

        // Create optimistic reply with full account identity fields
        const optimisticReply = {
            id: `temp_reply_${Date.now()}`,
            parentId: parentId,
            parent_id: parentId,
            user_id: userId,
            public_id: user.public_id,
            text: text,
            first_name: viewerFirstName,
            last_name: viewerLastName,
            handle: replyViewerHandle,
            avatar: replyViewerAvatar,
            created_at: new Date().toISOString(),
            likes: 0,
            viewer_liked: false,
            viewer_flagged: false,
            reply_count: 0,
            is_removed: false,
            removed_reason: "",
            removed_at: null,
            is_pinned: false,
            pinned_at: null,
            pinned_by: null,
            business_id: fIsBiz ? faId : null,
            artist_id: fIsArt ? faId : null,
            account_type: fIsBiz ? 'business' : fIsArt ? 'artist' : 'personal',
            ...(fIsBiz ? {
                business_name: fa.name || activeAccount?.name || '',
                business_slug: fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '',
                business_avatar_url: fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
                account_name: fa.name || activeAccount?.name || '',
                account_handle: fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '',
                account_avatar_url: fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
            } : {}),
            ...(fIsArt ? {
                artist_name: fa.name || activeAccount?.name || '',
                artist_handle: fa.slug || fa.handle || activeAccount?.slug || activeAccount?.handle || '',
                artist_avatar_url: fa.avatar_url || activeAccount?.avatar_url || '',
                account_name: fa.name || activeAccount?.name || '',
                account_handle: fa.handle || activeAccount?.handle || '',
                account_avatar_url: fa.avatar_url || activeAccount?.avatar_url || '',
            } : {}),
            replies: [],
            images: replyUrlList.length > 0 ? [...replyUrlList] : [],
        };

        // Optimistically add the reply
        setThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        recordComment();
        ensureCommentFadeKeyframes();
        const newRid = String(optimisticReply.id);
        setNewCommentIds((prev) => new Set(prev).add(newRid));
        // Clear the fade-in flag after animation completes
        if (newCommentTimerRef.current) clearTimeout(newCommentTimerRef.current);
        newCommentTimerRef.current = setTimeout(() => setNewCommentIds(new Set()), 2000);

        // Build POST body with account identity fields
        const payload = {
            content: text,
            parent_id: parentId,
            ...(fIsBiz ? {
                business_id: faId,
                account_type: 'business',
                account_id: faId,
                account_handle: fa.slug || fa.handle || '',
                account_name: fa.name || '',
                account_avatar_url: fa.avatar_url || fa.logo_url || '',
            } : {}),
            ...(fIsArt ? {
                artist_id: faId,
                account_type: 'artist',
                account_id: faId,
                account_handle: fa.slug || fa.handle || '',
                account_name: fa.name || '',
                account_avatar_url: fa.avatar_url || '',
            } : {}),
        };

        try {
            // Upload local files to GCS first, then merge with any existing GIF URLs
            let allImageUrls = [...replyUrlList];
            if (replyFileList.length > 0) {
                const uploadedUrls = await uploadFilesToGCS(replyFileList);
                allImageUrls = [...allImageUrls, ...uploadedUrls];
            }
            if (allImageUrls.length > 0) {
                payload.image_urls = allImageUrls;
            }

            // Update optimistic reply images with final GCS URLs
            if (allImageUrls.length > 0) {
                const updateImages = (nodes) => nodes.map((n) => {
                    if (n.id === optimisticReply.id) return { ...n, images: allImageUrls };
                    if (n.replies?.length) return { ...n, replies: updateImages(n.replies) };
                    return n;
                });
                setThreads((prev) => updateImages(prev));
            }

            const acctHdrs = freshAccountHeaders();
            const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/comments`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...acctHdrs },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newReply = await res.json();
                const normalizedReply = normalizeComments([newReply])[0];
                if (normalizedReply) {
                    // Enrich with account fields (server may not return all denormalized fields)
                    const enrichedReply = {
                        ...normalizedReply,
                        ...(fIsBiz ? {
                            business_id: faId,
                            business_name: normalizedReply.business_name || fa.name || activeAccount?.name || '',
                            business_slug: normalizedReply.business_slug || freshHandle || '',
                            business_avatar_url: normalizedReply.business_avatar_url || fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || '',
                            account_type: 'business',
                            account_name: normalizedReply.account_name || fa.name || activeAccount?.name || '',
                            account_handle: normalizedReply.account_handle || freshHandle || '',
                            account_avatar_url: normalizedReply.account_avatar_url || fa.avatar_url || fa.logo_url || activeAccount?.avatar_url || '',
                            handle: normalizedReply.account_handle || normalizedReply.business_slug || freshHandle || '',
                        } : {}),
                        ...(fIsArt ? {
                            artist_id: faId,
                            artist_name: normalizedReply.artist_name || fa.name || activeAccount?.name || '',
                            artist_handle: normalizedReply.artist_handle || freshHandle || '',
                            artist_avatar_url: normalizedReply.artist_avatar_url || fa.avatar_url || activeAccount?.avatar_url || '',
                            account_type: 'artist',
                            account_name: normalizedReply.account_name || fa.name || activeAccount?.name || '',
                            account_handle: normalizedReply.account_handle || freshHandle || '',
                            account_avatar_url: normalizedReply.account_avatar_url || fa.avatar_url || activeAccount?.avatar_url || '',
                            handle: normalizedReply.account_handle || normalizedReply.artist_handle || freshHandle || '',
                        } : {}),
                    };
                    setThreads((prev) => {
                        const withoutOptimistic = removeCommentFromTree(prev, optimisticReply.id);
                        return addReplyToTree(withoutOptimistic, parentId, enrichedReply);
                    });
                }
            } else {
                // Revert on failure
                setThreads((prev) => removeCommentFromTree(prev, optimisticReply.id));
            }
        } catch {
            // Revert on failure
            setThreads((prev) => removeCommentFromTree(prev, optimisticReply.id));
        }
    };

    const deleteComment = async (commentId) => {
        if (!user) return;

        // Store current state for potential rollback
        const previousThreads = threads;

        // Optimistically remove the comment
        setThreads((prev) => {
            const newThreads = removeCommentFromTree(prev, commentId);
            onCommentCountChange?.(newThreads.length);
            return newThreads;
        });

        try {
            const res = await secureFetch(`/api/events/comments/${encodeURIComponent(commentId)}`, {
                method: "DELETE",
                credentials: "include",
                headers: { ...freshAccountHeaders() },
            });
            if (!res.ok) {
                // Revert on failure
                setThreads(previousThreads);
                onCommentCountChange?.(previousThreads.length);
            } else {
                // Notify profile engagement tabs so deleted comments are removed from the Comments tab
                try { window.dispatchEvent(new CustomEvent('ll:comment:deleted', { detail: { commentId: Number(commentId), eventId: Number(eventId) } })); } catch { /* ignore */ }
            }
        } catch {
            // Revert on failure
            setThreads(previousThreads);
            onCommentCountChange?.(previousThreads.length);
        }
    };

    const likeComment = async (commentId, currentlyLiked) => {
        if (!user) {
            onRequireAuth?.();
            return;
        }

        // Optimistic update via the threads tree (source of truth — syncs to local state via useEffect)
        setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
            ...node,
            viewer_liked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, node.likes - 1) : node.likes + 1,
            ...(isViewerEventOwner ? { liked_by_author: !currentlyLiked } : {}),
        })));

        try {
            const method = currentlyLiked ? "DELETE" : "POST";
            const res = await secureFetch(`/api/events/comments/${encodeURIComponent(commentId)}/like`, {
                method,
                credentials: "include",
                headers: { ...freshAccountHeaders() },
            });
            if (!res.ok) {
                // Revert on failure
                setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                    ...node,
                    viewer_liked: currentlyLiked,
                    likes: currentlyLiked ? node.likes + 1 : Math.max(0, node.likes - 1),
                    ...(isViewerEventOwner ? { liked_by_author: currentlyLiked } : {}),
                })));
            }
        } catch {
            // Revert on failure
            setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                ...node,
                viewer_liked: currentlyLiked,
                likes: currentlyLiked ? node.likes + 1 : Math.max(0, node.likes - 1),
                ...(isViewerEventOwner ? { liked_by_author: currentlyLiked } : {}),
            })));
        }
    };

    const togglePin = async (commentId, shouldUnpin) => {
        if (!user) return;

        // Store current state for potential rollback
        const previousThreads = threads;

        // Optimistically update pin status
        setThreads((prev) => togglePinInTree(prev, commentId, !shouldUnpin));

        const action = shouldUnpin ? "unpin" : "pin";
        try {
            const res = await secureFetch(`/api/events/comments/${encodeURIComponent(commentId)}/${action}`, {
                method: "POST",
                credentials: "include",
                headers: { ...freshAccountHeaders() },
            });
            if (!res.ok) {
                // Revert on failure
                setThreads(previousThreads);
            }
        } catch {
            // Revert on failure
            setThreads(previousThreads);
        }
    };

    const flagComment = async (commentId, reason, details, setSubmitted) => {
        if (!user) return;
        setFlagLoading(true);

        // Optimistically update the flagged state
        setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
            ...node,
            viewer_flagged: true,
        })));

        const urls = [
            `/api/events/comments/${encodeURIComponent(commentId)}/flag`,
            `/api/community/posts/comments/${encodeURIComponent(commentId)}/flag`,
            `/api/posts/comments/${encodeURIComponent(commentId)}/flag`,
        ];

        let success = false;
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json", ...freshAccountHeaders() },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    success = true;
                    break;
                }
            } catch {
                // try next endpoint
            }
        }

        if (success) {
            if (typeof setSubmitted === "function") setSubmitted(true);
        } else {
            // Revert on failure
            setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                ...node,
                viewer_flagged: false,
            })));
            setFlagState({ open: false, commentId: null });
        }

        setFlagLoading(false);
    };

    const pinnedTopLevel = useMemo(() => threads.find((t) => Boolean(t.is_pinned)) || null, [threads]);
    const pinnedTopLevelId = pinnedTopLevel?.id != null ? String(pinnedTopLevel.id) : null;
    const isViewerEventOwner = viewerId != null && eventOwner?.id != null && String(viewerId) === String(eventOwner.id);

    const requestDelete = useCallback((commentId, isReply = false) => {
        setDeleteConfirm({ open: true, commentId, isReply });
    }, []);

    const requestTogglePinConfirm = useCallback((commentId, currentlyPinned) => {
        if (!user) {
            onRequireAuth?.();
            return;
        }
        togglePin(commentId, currentlyPinned);
    }, [user, togglePin, onRequireAuth]);

    const scrollToComment = useCallback((commentId) => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHighlightedCommentId(String(commentId));
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 2200);
        }
    }, []);

    // Auto-scroll to a specific comment when opened from profile comment click
    const hasAutoScrolledEvt = useRef(false);
    const autoScrollTimerEvtRef = useRef(0);
    useEffect(() => {
        const targetId = scrollToCommentIdProp ?? highlightCommentIdProp;
        if (!targetId || loading || !threads.length) return;
        if (hasAutoScrolledEvt.current) return;
        hasAutoScrolledEvt.current = true;

        // If the target is a reply, expand its parent thread
        const findParentThread = (threadList, tid) => {
            for (const thread of threadList) {
                if (String(thread.id) === String(tid)) return null;
                if (Array.isArray(thread.replies)) {
                    const found = thread.replies.some(function search(r) {
                        if (String(r.id) === String(tid)) return true;
                        return Array.isArray(r.replies) && r.replies.some(search);
                    });
                    if (found) return thread.id;
                }
            }
            return null;
        };

        const parentId = findParentThread(threads, targetId);
        if (parentId) {
            setExpanded((prev) => ({ ...prev, [parentId]: true }));
        }

        let attempts = 0;
        const maxAttempts = 25;

        const tryScroll = () => {
            attempts += 1;
            const el = document.getElementById(`comment-${targetId}`);
            if (el) {
                let scrollParent = el.parentElement;
                while (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
                    const style = window.getComputedStyle(scrollParent);
                    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && scrollParent.scrollHeight > scrollParent.clientHeight + 10) {
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                if (scrollParent && scrollParent !== document.documentElement && scrollParent !== document.body) {
                    const containerRect = scrollParent.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    const offset = elRect.top - containerRect.top - 12;
                    scrollParent.scrollTo({ top: scrollParent.scrollTop + offset, behavior: 'smooth' });
                } else {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                setHighlightedCommentId(String(targetId));
                clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 2200);
                return;
            }
            if (attempts < maxAttempts) {
                autoScrollTimerEvtRef.current = setTimeout(tryScroll, 350);
            }
        };

        autoScrollTimerEvtRef.current = setTimeout(tryScroll, 600);
    }, [scrollToCommentIdProp, highlightCommentIdProp, loading, threads]);

    // Reset auto-scroll flag when event changes — but only if no scroll target is pending
    useEffect(() => {
        if (scrollToCommentIdProp || highlightCommentIdProp) return;
        hasAutoScrolledEvt.current = false;
        if (autoScrollTimerEvtRef.current) { clearTimeout(autoScrollTimerEvtRef.current); autoScrollTimerEvtRef.current = 0; }
    }, [eventId, scrollToCommentIdProp, highlightCommentIdProp]);

    const sortedThreads = useMemo(() => {
        const arr = [...threads];
        arr.sort((a, b) => {
            const ap = a.is_pinned ? 1 : 0;
            const bp = b.is_pinned ? 1 : 0;
            if (bp !== ap) return bp - ap;
            // Boosted (newly posted) comments appear at top, right after pinned
            if (newCommentIds.size > 0) {
                const aBoost = newCommentIds.has(String(a.id)) ? 1 : 0;
                const bBoost = newCommentIds.has(String(b.id)) ? 1 : 0;
                if (aBoost !== bBoost) return bBoost - aBoost;
            }
            if (commentSort === 'popular') {
                const al = Number(a.likes || 0);
                const bl = Number(b.likes || 0);
                if (bl !== al) return bl - al;
            }
            const ad = new Date(a.created_at || 0).getTime();
            const bd = new Date(b.created_at || 0).getTime();
            return bd - ad;
        });
        return arr;
    }, [threads, commentSort, newCommentIds]);

    const threadsToShow = sortedThreads.slice(0, visibleCount);
    const hasMore = sortedThreads.length > visibleCount;

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Comments
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Link component="button" type="button" underline="none" onClick={() => setCommentSort('popular')}
                          sx={{ fontSize: 12, fontWeight: commentSort === 'popular' ? 800 : 600, color: commentSort === 'popular' ? 'primary.main' : 'text.secondary', cursor: 'pointer', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: commentSort === 'popular' ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
                        Popular
                    </Link>
                    <Link component="button" type="button" underline="none" onClick={() => setCommentSort('newest')}
                          sx={{ fontSize: 12, fontWeight: commentSort === 'newest' ? 800 : 600, color: commentSort === 'newest' ? 'primary.main' : 'text.secondary', cursor: 'pointer', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: commentSort === 'newest' ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent', '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) } }}>
                        Newest
                    </Link>
                </Box>
            </Box>

            {/* Composer - matching PostDetailModal style */}
            {user ? (
                <Box
                    id="event-comments-composer"
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2, flexWrap: "nowrap" }}
                >
                    <AccountAvatar
                        src={viewerAvatarUrl}
                        alt={viewerLabel}
                        accountType={isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : 'user'}
                        profileType={isArtistAccount ? viewerProfileType : undefined}
                        size={44}
                    />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={6}
                            value={commentText}
                            inputRef={commentInputRef}
                            onChange={handleCmChange}
                            onKeyDown={handleCmKeyDown}
                            label={`Leave a comment as ${viewerLabel}`}
                            placeholder="Write your comment… (type @ to mention)"
                            variant="outlined"
                            disabled={posting}
                            error={Boolean(commentError)}
                            helperText={commentError}
                            inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ alignSelf: "flex-end", pb: 0.25 }}>
                                        <IconButton
                                            aria-label="Send comment"
                                            onClick={submitComment}
                                            disabled={posting || (!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0)}
                                            sx={(t) => ({
                                                ml: 0.5,
                                                bgcolor: "primary.main",
                                                color: "common.white",
                                                width: 38,
                                                height: 38,
                                                borderRadius: 2,
                                                boxShadow: `0 10px 18px ${alpha(t.palette.primary.main, 0.18)}`,
                                                "&:hover": {
                                                    bgcolor: "primary.dark",
                                                    boxShadow: `0 14px 26px ${alpha(t.palette.primary.main, 0.22)}`,
                                                },
                                                "&.Mui-disabled": {
                                                    bgcolor: "action.disabledBackground",
                                                    color: "action.disabled",
                                                    boxShadow: "none",
                                                    opacity: 1,
                                                },
                                            })}
                                        >
                                            {posting ? (
                                                <CircularProgress size={18} sx={{ color: "common.white" }} />
                                            ) : (
                                                <ArrowForwardRoundedIcon />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {/* Image + GIF attachment toolbar & previews */}
                        <CommentImageAttachments
                            files={commentFiles}
                            urls={commentImageUrls}
                            onFilesChange={async (newFiles) => {
                                if (commentError) setCommentError('');
                                // Block GIF uploads — use the GIF button instead
                                const gifFile = newFiles.find((f) => f.type === 'image/gif' || f.name?.toLowerCase().endsWith('.gif'));
                                if (gifFile) {
                                    setCommentError('GIF files cannot be uploaded here. Please use the GIF button instead.');
                                    return;
                                }
                                const added = newFiles.filter((f) => !commentFiles.includes(f));
                                for (const file of added) {
                                    const result = await scanImageFile(file);
                                    if (!result.safe) {
                                        setCommentError(result.message);
                                        setCommentFiles((prev) => prev.filter((pf) => pf !== file));
                                        return;
                                    }
                                }
                                setCommentFiles(newFiles);
                            }}
                            onUrlsChange={(u) => { setCommentImageUrls(u); if (commentError) setCommentError(''); }}
                            maxImages={4}
                            disabled={posting}
                        />
                        {renderMentionPopper({ open: cmMentionOpen, anchorEl: cmMentionAnchorEl, results: cmMentionResults, loading: cmMentionLoading, activeIdx: cmMentionActiveIdx, onSelect: insertCmMention, onClose: closeCmMention })}
                    </Box>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    You need to{" "}
                    <Link
                        component="button"
                        underline="hover"
                        onClick={onRequireAuth}
                        sx={{
                            verticalAlign: "baseline",
                            display: "inline",
                            font: "inherit",
                            border: "none",
                            p: 0,
                            cursor: "pointer",
                        }}
                    >
                        log in
                    </Link>{" "}
                    to comment.
                </Typography>
            )}

            <Divider sx={{ mb: 1.5 }} />

            {/* Comments list */}
            {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : threads.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        No comments yet. Be the first!
                    </Typography>
                </Box>
            ) : (
                <>
                    {threadsToShow.map((node) => (
                        <ThreadedCommentItem
                            key={node.id}
                            node={node}
                            depth={0}
                            expanded={expanded}
                            setExpanded={setExpanded}
                            viewerAvatarUrl={viewerAvatarUrl}
                            viewerLabel={viewerLabel}
                            eventOwner={eventOwner}
                            eventBusinessAccountId={eventBusinessAccountId}
                            eventArtistAccountId={eventArtistAccountId}
                            likeComment={likeComment}
                            submitReply={submitReply}
                            openFlag={(id) => setFlagState({ open: true, commentId: id })}
                            viewerId={viewerId}
                            onDelete={requestDelete}
                            onTogglePinConfirm={requestTogglePinConfirm}
                            onRequireAuth={onRequireAuth}
                            onOpenUserCard={onOpenUserCard}
                            onScrollToComment={scrollToComment}
                            highlightedCommentId={highlightedCommentId}
                            blockedUserIds={blockedUserIds}
                            blockedBusinessIds={blockedBusinessIds}
                            blockedArtistIds={blockedArtistIds}
                            blockedHandles={blockedHandles}
                            onShareComment={handleShareComment}
                            newCommentIds={newCommentIds}
                        />
                    ))}

                    {hasMore && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                            <Button
                                variant="text"
                                onClick={() => setVisibleCount((n) => n + COMMENTS_LOAD_MORE)}
                                sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}
                            >
                                Load more comments
                            </Button>
                        </Box>
                    )}
                </>
            )}

            {/* Delete Confirm Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, commentId: null, isReply: false })}
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Delete {deleteConfirm.isReply ? "Reply" : "Comment"}?
                    <IconButton size="small" onClick={() => setDeleteConfirm({ open: false, commentId: null, isReply: false })}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirm({ open: false, commentId: null, isReply: false })} sx={{ textTransform: "none" }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            const wasReply = deleteConfirm.isReply;
                            deleteComment(deleteConfirm.commentId);
                            setDeleteConfirm({ open: false, commentId: null, isReply: false });
                            showSuccess(wasReply ? 'Reply deleted successfully' : 'Comment deleted successfully');
                        }}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Flag Dialog */}
            <FlagCommentDialog
                open={flagState.open}
                onClose={() => setFlagState({ open: false, commentId: null })}
                onSubmit={({ reason, details, setSubmitted }) => flagComment(flagState.commentId, reason, details, setSubmitted)}
                loading={flagLoading}
            />

            {/* Share Comment dialog */}
            <ShareDialog
                contentType="comment"
                open={shareCommentDialogOpen}
                onClose={() => { setShareCommentDialogOpen(false); setShareCommentTarget(null); }}
                comment={shareCommentTarget}
                post={{ id: eventId, type: 'event' }}
                viewer={user}
                sx={{ zIndex: 100001 }}
            />
            <SuccessSnackbar {...commentSuccessSnackbarProps} />

            {/* Rate limit dialog for comments */}
            <RateLimitDialog
                open={commentRateLimitOpen}
                onClose={() => setCommentRateLimitOpen(false)}
                retryAfterSec={commentRateLimitInfo.retryAfterSec}
                reason={commentRateLimitInfo.reason}
                actionLabel="comments"
                sx={{ zIndex: 100001 }}
            />
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
                            const avatarSrc = friend.avatar_url || friend.profile_picture || undefined;
                            return (
                                <ListItemButton
                                    key={friend.id}
                                    onClick={() => { if (handle) window.location.assign(`/${handle}`); }}
                                    sx={{ borderRadius: 2, py: 0.75, px: 1 }}
                                >
                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                        <Avatar src={avatarSrc} sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 800 }}>
                                            <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                        </Avatar>
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
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function formatHTime(raw) {
    if (!raw) return "";
    const [hh, mm] = String(raw).split(":").map(Number);
    if (!Number.isFinite(hh)) return String(raw);
    const h = hh % 12 || 12;
    return `${h}:${String(mm || 0).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
}

function formatHDateOnly(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

const H_CAT = { "music-nightlife": "Concerts", "arts-culture": "Arts & Culture", "food-drink": "Food & Drink", "community-social": "Community & Social", "family-kids": "Family & Kids", "sports-recreation": "Sports & Recreation", "outdoors-nature": "Outdoors & Nature", "education-workshops": "Education & Workshops", "business-networking": "Business & Networking", "health-wellness": "Health & Wellness", "faith-spiritual": "Faith & Spiritual", "volunteer-fundraising": "Volunteer & Fundraising", "government-civic": "Government & Civic", "markets-shopping": "Markets & Shopping", "holidays-seasonal": "Holidays & Seasonal", other: "Other" };
function hCatLabel(slug) { return H_CAT[slug] || slug || ""; }
function hScopeLabel(scope) { if (scope === "statewide") return "Alabama (Statewide)"; if (scope === "county") return "County-wide"; return scope || ""; }

function buildHistoryDiffs(prevSnap, snap) {
    const items = [];
    const s = (v) => (v == null ? "" : String(v).trim());
    if (s(snap.title) !== s(prevSnap.title)) items.push({ label: "Title", from: s(prevSnap.title) || "(empty)", to: s(snap.title) || "(empty)" });
    if (s(snap.category) !== s(prevSnap.category)) items.push({ label: "Category", from: hCatLabel(s(prevSnap.category)) || "(none)", to: hCatLabel(s(snap.category)) || "(none)" });
    if (s(snap.subcategory) !== s(prevSnap.subcategory)) items.push({ label: "Subcategory", from: s(prevSnap.subcategory) || "(none)", to: s(snap.subcategory) || "(none)" });
    if (s(snap.description) !== s(prevSnap.description)) items.push({ label: "Description", changed: true });
    if (s(snap.venue_name) !== s(prevSnap.venue_name)) items.push({ label: "Venue", from: s(prevSnap.venue_name) || "(none)", to: s(snap.venue_name) || "(none)" });
    if (s(snap.venue_address) !== s(prevSnap.venue_address)) items.push({ label: "Venue address", from: s(prevSnap.venue_address) || "(none)", to: s(snap.venue_address) || "(none)" });
    if (s(snap.address) !== s(prevSnap.address)) items.push({ label: "Address", from: s(prevSnap.address) || "(none)", to: s(snap.address) || "(none)" });
    if (s(snap.location_scope) !== s(prevSnap.location_scope)) items.push({ label: "Location scope", from: hScopeLabel(s(prevSnap.location_scope)) || "(none)", to: hScopeLabel(s(snap.location_scope)) || "(none)" });
    if (s(snap.city) !== s(prevSnap.city)) items.push({ label: "City", from: s(prevSnap.city) || "(none)", to: s(snap.city) || "(none)" });
    if (s(snap.county) !== s(prevSnap.county)) items.push({ label: "County", from: s(prevSnap.county) || "(none)", to: s(snap.county) || "(none)" });
    if (s(snap.timezone) !== s(prevSnap.timezone)) items.push({ label: "Timezone", from: s(prevSnap.timezone) || "(none)", to: s(snap.timezone) || "(none)" });
    if (s(snap.start_at) !== s(prevSnap.start_at)) items.push({ label: "Start date", from: formatHDateOnly(prevSnap.start_at) || "(none)", to: formatHDateOnly(snap.start_at) || "(none)" });
    if (s(snap.start_time) !== s(prevSnap.start_time)) items.push({ label: "Start time", from: formatHTime(prevSnap.start_time) || "(none)", to: formatHTime(snap.start_time) || "(none)" });
    if (s(snap.end_at) !== s(prevSnap.end_at)) items.push({ label: "End date", from: formatHDateOnly(prevSnap.end_at) || "(none)", to: formatHDateOnly(snap.end_at) || "(none)" });
    if (s(snap.end_time) !== s(prevSnap.end_time)) items.push({ label: "End time", from: formatHTime(prevSnap.end_time) || "(none)", to: formatHTime(snap.end_time) || "(none)" });
    const prevPhotos = Array.isArray(prevSnap.photos) ? prevSnap.photos : [];
    const curPhotos = Array.isArray(snap.photos) ? snap.photos : [];
    const prevSet = new Set(prevPhotos); const curSet = new Set(curPhotos);
    const added = curPhotos.filter((u) => !prevSet.has(u));
    const removed = prevPhotos.filter((u) => !curSet.has(u));
    if (added.length > 0 || removed.length > 0 || prevPhotos.length !== curPhotos.length) {
        const parts = []; if (added.length) parts.push(`${added.length} added`); if (removed.length) parts.push(`${removed.length} removed`);
        if (!parts.length && prevPhotos.length !== curPhotos.length) parts.push("reordered");
        items.push({ label: "Photos", changed: true, detail: parts.join(", "), photoAdded: added, photoRemoved: removed });
    }
    if (String(snap.latitude ?? "") !== String(prevSnap.latitude ?? "") || String(snap.longitude ?? "") !== String(prevSnap.longitude ?? "")) {
        items.push({ label: "Map pin", changed: true });
    }
    return items;
}

function HDiffChip({ label, from, to, changed, detail, photoAdded, photoRemoved }) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, py: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Chip label={label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.dark", border: "none", flexShrink: 0, mt: 0.1, "& .MuiChip-label": { px: 1 } }} />
                {changed ? (
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", lineHeight: 1.5, pt: 0.15 }}>{detail || "Updated"}</Typography>
                ) : (
                    <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: "break-word" }}>
                        <Box component="span" sx={{ textDecoration: "line-through", opacity: 0.55 }}>{from}</Box>
                        <Box component="span" sx={{ mx: 0.5, color: "text.disabled" }}>→</Box>
                        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>{to}</Box>
                    </Typography>
                )}
            </Box>
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
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { position: "relative" } }} onClick={(e) => e.stopPropagation()} sx={{ zIndex: 100001 }}>
            <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                Edit History
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}
                {!loading && error && <Typography color="error" sx={{ py: 2, textAlign: "center" }}>{error}</Typography>}
                {!loading && !error && rows.length === 0 && <Typography color="text.secondary" sx={{ py: 2, textAlign: "center", fontSize: 14 }}>This event was edited, but detailed version history is not available for edits made before history tracking was enabled.</Typography>}
                {!loading && !error && rows.length > 0 && (
                    <Box sx={{ position: "relative", pl: 2.5 }}>
                        <Box sx={{ position: "absolute", left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                        {rows.map((row, idx) => {
                            const snap = row.snapshot || {};
                            const isOriginal = idx === rows.length - 1 && row.version === 1;
                            const isLatest = idx === 0;

                            let diffItems = [];
                            if (!isOriginal) {
                                if (isLatest && currentEvent) {
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
                                    diffItems = buildHistoryDiffs(snap, liveSnap);
                                } else {
                                    const prevSnap = rows[idx + 1]?.snapshot || {};
                                    diffItems = buildHistoryDiffs(prevSnap, snap);
                                }
                            }
                            return (
                                <Box key={row.id || idx} sx={{ position: "relative", pb: idx < rows.length - 1 ? 2.5 : 0 }}>
                                    <Box sx={{ position: "absolute", left: -20, top: 4, width: 12, height: 12, borderRadius: "50%", bgcolor: isOriginal ? "grey.400" : isLatest ? "secondary.main" : "primary.main", border: "2px solid", borderColor: "background.paper", boxShadow: (t) => `0 0 0 2px ${alpha(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? "text.secondary" : "text.primary" }}>{isOriginal ? "Original" : isLatest ? "Latest edit" : `Version ${row.version}`}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>{formatHistoryDate(row.edited_at)}</Typography>
                                    </Stack>
                                    {!isOriginal && diffItems.length > 0 && (
                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.025), border: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {diffItems.map((item, i) => <HDiffChip key={i} {...item} />)}
                                        </Box>
                                    )}
                                    {!isOriginal && diffItems.length === 0 && <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", pl: 0.5 }}>Event details updated</Typography>}
                                    {isOriginal && (
                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: "1px solid", borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.primary", mb: 0.25 }}>{toStr(snap.title)}</Typography>}
                                            <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.4 }}>{[hCatLabel(snap.category), snap.city || snap.county || hScopeLabel(snap.location_scope), snap.venue_name].filter(Boolean).join(" · ") || "Original event created"}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}><Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button></DialogActions>
        </Dialog>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main EventDetailPanel Component
   ───────────────────────────────────────────────────────────────────────────── */
export default function EventDetailPanel({
                                             event: initialEvent,
                                             user,
                                             onRequireAuth,
                                             onClearSelection,
                                             onClose,
                                             onEventUpdate,
                                             onSuccess,
                                             focusCommentInput = false,
                                             onFocusCommentHandled,
                                             scrollToCommentId: scrollToCommentIdProp = null,
                                             highlightCommentId: highlightCommentIdProp = null,
                                         }) {
    const [event, setEvent] = useState(initialEvent);
    const navigate = useNavigate();
    const edpTheme = useTheme();
    const isMobile = useMediaQuery(edpTheme.breakpoints.down("md"));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Sync local event state when a new initialEvent prop arrives
    // so the panel renders immediately with data from the list —
    // the background fetch will enrich it with engagement + comments.
    useEffect(() => {
        if (initialEvent) setEvent(initialEvent);
    }, [initialEvent]);

    // Scroll to top when a new event is selected
    const detailScrollRef = useRef(null);
    useEffect(() => {
        if (initialEvent && detailScrollRef.current) {
            detailScrollRef.current.scrollTop = 0;
        }
    }, [initialEvent]);

    // Engagement state — seed from initialEvent so counts render instantly
    const initCounts = initialEvent?.engagement?.counts || {};
    const initViewer = initialEvent?.viewerEngagement || initialEvent?.viewer_engagement || {};
    const [hasRsvpd, setHasRsvpd] = useState(Boolean(initViewer.rsvp || initialEvent?.viewerRsvp || initialEvent?.viewer_rsvp));
    const [isInterested, setIsInterested] = useState(Boolean(initViewer.interested || initialEvent?.viewerInterested || initialEvent?.viewer_interested));
    const [hasLiked, setHasLiked] = useState(Boolean(initViewer.like || initialEvent?.viewerLiked || initialEvent?.viewer_liked));
    const [hasReposted, setHasReposted] = useState(Boolean(initViewer.repost || initialEvent?.viewerReposted || initialEvent?.viewer_reposted));
    const [rsvpCount, setRsvpCount] = useState(Number(initCounts.rsvp || initialEvent?.rsvpCount || initialEvent?.rsvp_count || 0));
    const [interestedCount, setInterestedCount] = useState(Number(initCounts.interested || initialEvent?.interestedCount || initialEvent?.interested_count || 0));
    const [likeCount, setLikeCount] = useState(Number(initCounts.like || initialEvent?.likeCount || initialEvent?.like_count || 0));
    const [repostCount, setRepostCount] = useState(Number(initCounts.repost || initialEvent?.repostCount || initialEvent?.repost_count || 0));
    const [shareCount, setShareCount] = useState(Number(initCounts.share || initialEvent?.shareCount || initialEvent?.share_count || 0));
    const [commentCount, setCommentCount] = useState(Number(initCounts.comment || initCounts.comments || initialEvent?.commentCount || initialEvent?.comment_count || 0));

    const [engBusy, setEngBusy] = useState("");

    // Description expand state
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [needsDescTruncate, setNeedsDescTruncate] = useState(false);
    const descriptionRef = useRef(null);

    // User card popover state
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
    const [popoverUser, setPopoverUser] = useState(null);

    // 3-dot event menu state
    const [eventMenuAnchor, setEventMenuAnchor] = useState(null);
    const eventMenuOpen = Boolean(eventMenuAnchor);
    const [eventDeleteOpen, setEventDeleteOpen] = useState(false);
    const [eventDeleting, setEventDeleting] = useState(false);
    const [eventReportOpen, setEventReportOpen] = useState(false);
    const [eventReportReason, setEventReportReason] = useState("");
    const [eventReportDetails, setEventReportDetails] = useState("");
    const [eventReportSubmitted, setEventReportSubmitted] = useState(false);
    const [eventReportSubmitting, setEventReportSubmitting] = useState(false);
    const [errorToast, setErrorToast] = useState({ open: false, msg: "" });
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    // Edit-limit state (5 edits per 24h window)
    const [editLimitReached, setEditLimitReached] = useState(false);
    const [editLimitMsg, setEditLimitMsg] = useState("");
    const [editLimitLoading, setEditLimitLoading] = useState(false);
    const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false);

    // Share dialog
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // Friends going
    const [friendsGoing, setFriendsGoing] = useState([]);
    const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);

    // Edit history dialog state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    // Active account for ownership detection
    const { activeAccount, activeAccountType } = useActiveAccount();
    // Stable key for re-fetch when account changes
    const accountKey = `${activeAccountType || 'personal'}-${activeAccount?.id || 0}`;

    const eventId = initialEvent?.id;
    const canEngage = Boolean(user);

    // Handler for comment count changes - updates local state, notifies parent, and broadcasts to cards
    const handleCommentCountChange = useCallback((newCount) => {
        setCommentCount(newCount);
        // Broadcast to all EventCards so they update their comment count
        broadcastEngagement(eventId, { commentCount: newCount });
        // Notify parent to update the event in the list
        if (onEventUpdate && eventId) {
            onEventUpdate(eventId, { comments_count: newCount, commentsCount: newCount });
        }
    }, [eventId, onEventUpdate]);

    // Sync engagement from global cache on mount
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

    // Listen for engagement changes broadcast by EventCard (or other detail panels)
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

    // Check if description needs truncation
    useEffect(() => {
        if (descriptionRef.current) {
            const el = descriptionRef.current;
            setNeedsDescTruncate(el.scrollHeight > DESC_MAX_HEIGHT + 5);
        }
    }, [event?.description]);

    // Load full event details
    useEffect(() => {
        let active = true;

        async function loadEvent() {
            if (!eventId) return;

            setIsLoading(true);
            setError("");

            try {
                const data = await fetchEventById(eventId);
                if (!active) return;

                setEvent(data);

                // Set engagement counts
                const counts = data?.engagement?.counts || {};
                setRsvpCount(Number(counts.rsvp || 0));
                setInterestedCount(Number(counts.interested || 0));
                setLikeCount(Number(counts.like || 0));
                setShareCount(Number(counts.share || 0));
                setRepostCount(Number(counts.repost || 0));
                setCommentCount(Number(data?.commentCount || 0));

                // Set viewer engagement status
                const viewerEng = data?.viewerEngagement || {};
                setHasRsvpd(Boolean(viewerEng.rsvp));
                setIsInterested(Boolean(viewerEng.interested));
                setHasLiked(Boolean(viewerEng.like));
                setHasReposted(Boolean(viewerEng.repost));
            } catch (err) {
                if (!active) return;
                setError(err?.message || "Failed to load event");
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadEvent();
        return () => { active = false; };
    }, [eventId, accountKey]);

    // Fetch "friends going" — people viewer follows who RSVP'd to this event
    const viewerIdForFriends = user?.id || user?.user_id || null;
    useEffect(() => {
        if (!eventId || !viewerIdForFriends) { setFriendsGoing([]); return; }
        let cancelled = false;
        secureFetch(`/api/events/${encodeURIComponent(eventId)}/friends-going`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (cancelled || !data) return;
                const list = Array.isArray(data.friends) ? data.friends : Array.isArray(data) ? data : [];
                setFriendsGoing(list.slice(0, 10));
            })
            .catch(() => { /* endpoint may not exist yet — silent */ });
        return () => { cancelled = true; };
    }, [eventId, accountKey, viewerIdForFriends]);

    const handleEngage = useCallback(async (type) => {
        if (!eventId) return;

        if (!canEngage) {
            onRequireAuth?.();
            return;
        }

        setEngBusy(type);

        // Optimistic update + broadcast to cards
        if (type === "rsvp") {
            const next = !hasRsvpd;
            const newCount = Math.max(0, rsvpCount + (next ? 1 : -1));
            setHasRsvpd(next);
            setRsvpCount(newCount);
            broadcastEngagement(eventId, { hasRsvpd: next, rsvpCount: newCount });
        } else if (type === "interested") {
            const next = !isInterested;
            const newCount = Math.max(0, interestedCount + (next ? 1 : -1));
            setIsInterested(next);
            setInterestedCount(newCount);
            broadcastEngagement(eventId, { isInterested: next, interestedCount: newCount });
        } else if (type === "like") {
            const next = !hasLiked;
            const newCount = Math.max(0, likeCount + (next ? 1 : -1));
            setHasLiked(next);
            setLikeCount(newCount);
            broadcastEngagement(eventId, { hasLiked: next, likeCount: newCount });
        } else if (type === "repost") {
            const next = !hasReposted;
            const newCount = Math.max(0, repostCount + (next ? 1 : -1));
            setHasReposted(next);
            setRepostCount(newCount);
            broadcastEngagement(eventId, { hasReposted: next, repostCount: newCount });
        }

        try {
            const result = await updateEventEngagement(eventId, { type, action: "toggle" });
            const counts = result?.counts || {};
            setRsvpCount(Number(counts.rsvp || 0));
            setInterestedCount(Number(counts.interested || 0));
            setLikeCount(Number(counts.like || 0));
            setShareCount(Number(counts.share || 0));
            setRepostCount(Number(counts.repost || 0));

            if (type === "rsvp") setHasRsvpd(result.didSet);
            if (type === "interested") setIsInterested(result.didSet);
            if (type === "like") setHasLiked(result.didSet);
            if (type === "repost") setHasReposted(result.didSet);

            // Broadcast server-confirmed state to all cards
            broadcastEngagement(eventId, {
                hasRsvpd: type === "rsvp" ? result.didSet : undefined,
                isInterested: type === "interested" ? result.didSet : undefined,
                hasLiked: type === "like" ? result.didSet : undefined,
                hasReposted: type === "repost" ? result.didSet : undefined,
                rsvpCount: Number(counts.rsvp || 0),
                interestedCount: Number(counts.interested || 0),
                likeCount: Number(counts.like || 0),
                repostCount: Number(counts.repost || 0),
            });
        } catch {
            // Revert on error
        } finally {
            setEngBusy("");
        }
    }, [eventId, canEngage, hasRsvpd, isInterested, hasLiked, hasReposted, rsvpCount, interestedCount, likeCount, repostCount, onRequireAuth]);

    const handleShare = useCallback(() => {
        if (!eventId) return;
        setShareDialogOpen(true);
    }, [eventId]);

    const handleShareCompleted = useCallback(() => {
        setShareCount((c) => {
            const next = c + 1;
            broadcastEngagement(eventId, { shareCount: next });
            return next;
        });
    }, [eventId]);

    const scrollToComments = useCallback(() => {
        const el = document.getElementById("event-comments-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const handleOrganizerClick = (e) => {
        setPopoverAnchorEl(e.currentTarget);
        setPopoverUser({
            id: organizerId, handle: organizerHandle,
            first_name: organizer?.firstName || organizer?.first_name,
            last_name: organizer?.lastName || organizer?.last_name,
            profile_picture: organizerAvatar, avatar_url: organizerAvatar,
            ...(isBusinessEvent && eventBusinessAccountId ? {
                account_type: 'business',
                business_id: eventBusinessAccountId,
                business_name: toStr(event?.businessAccountName || event?.business_account_name) || organizerName,
                business_slug: toStr(event?.businessAccountSlug || event?.business_account_slug || event?.business_account_handle) || organizerHandle,
                business_avatar_url: toStr(event?.businessAccountAvatar || event?.business_account_avatar) || organizerAvatar,
            } : {}),
            ...(isArtistEvent && eventArtistAccountId ? {
                account_type: 'artist',
                artist_id: eventArtistAccountId,
                artist_name: organizerName,
                artist_handle: organizerHandle,
                artist_avatar_url: organizerAvatar,
            } : {}),
        });
    };

    const handleOpenUserCard = useCallback((anchorEl, commentUser) => {
        setPopoverAnchorEl(anchorEl);
        // Pass through ALL account identity fields so UserCardPopover's
        // resolveCardTarget correctly identifies business/artist comments.
        setPopoverUser({
            id: commentUser?.id || commentUser?.user_id,
            handle: commentUser?.handle,
            first_name: commentUser?.first_name, last_name: commentUser?.last_name,
            profile_picture: commentUser?.avatar || commentUser?.avatar_url || commentUser?.profile_picture,
            avatar_url: commentUser?.avatar || commentUser?.avatar_url || commentUser?.profile_picture,
            // Business identity
            ...(commentUser?.business_id ? {
                business_id: commentUser.business_id,
                business_name: commentUser.business_name || commentUser.account_name || '',
                business_slug: commentUser.business_slug || commentUser.account_handle || '',
                business_avatar_url: commentUser.business_avatar_url || commentUser.account_avatar_url || '',
            } : {}),
            // Artist identity
            ...(commentUser?.artist_id ? {
                artist_id: commentUser.artist_id,
                artist_name: commentUser.artist_name || commentUser.account_name || '',
                artist_handle: commentUser.artist_handle || commentUser.account_handle || '',
                artist_avatar_url: commentUser.artist_avatar_url || commentUser.account_avatar_url || '',
            } : {}),
            // Account type + denormalized fields
            ...(commentUser?.account_type ? { account_type: commentUser.account_type } : {}),
            ...(commentUser?.account_name ? { account_name: commentUser.account_name } : {}),
            ...(commentUser?.account_handle ? { account_handle: commentUser.account_handle } : {}),
            ...(commentUser?.account_avatar_url ? { account_avatar_url: commentUser.account_avatar_url } : {}),
        });
    }, []);

    const handlePopoverClose = () => {
        setPopoverAnchorEl(null);
        setPopoverUser(null);
    };

    // Derived data
    const photos = useMemo(() => getEventPhotos(event), [event]);
    const categoryInfo = useMemo(() => getCategoryInfo(event), [event]);
    const coverPhoto = photos.length > 0 ? photos[0] : null;

    const organizer = event?.organizer || {};
    const organizerId = organizer?.id || organizer?.user_id;
    const organizerName = `${toStr(organizer?.firstName || organizer?.first_name)} ${toStr(organizer?.lastName || organizer?.last_name)}`.trim() || "Organizer";
    const organizerHandle = organizer?.handle;

    // ── Ownership detection (mirrors JobCard / EventCard pattern) ──
    const eventBusinessAccountId = event?.business_account_id || event?.businessAccountId || null;
    const isBusinessEvent = Boolean(eventBusinessAccountId);
    const eventArtistAccountId = event?.artist_account_id || event?.artistAccountId || null;
    const isArtistEvent = Boolean(eventArtistAccountId);
    // Visual-artist-hosted event (vs musician-hosted). Prefer any field the
    // backend attached; otherwise fetch /api/music/artists/:id for an
    // authoritative value (mirrors ArtistAdminConsole pattern).
    const initialEventArtistProfileType = String(
        event?.artist_account_profile_type || event?.artistAccountProfileType ||
        event?.artist_profile_type || event?.artistProfileType || ''
    ).toLowerCase();
    const [fetchedEventArtistProfileType, setFetchedEventArtistProfileType] = useState('');
    useEffect(() => {
        if (!isArtistEvent || !eventArtistAccountId) {
            setFetchedEventArtistProfileType('');
            return;
        }
        if (initialEventArtistProfileType === 'artist' || initialEventArtistProfileType === 'music') {
            setFetchedEventArtistProfileType('');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await secureFetch(
                    `/api/music/artists/${encodeURIComponent(String(eventArtistAccountId))}`,
                    { credentials: 'include', headers: { Accept: 'application/json' } }
                );
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.artist || data || {};
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (!cancelled) setFetchedEventArtistProfileType(pt === 'artist' ? 'artist' : 'music');
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [isArtistEvent, eventArtistAccountId, initialEventArtistProfileType]);
    const eventArtistProfileType = (initialEventArtistProfileType === 'artist' || initialEventArtistProfileType === 'music')
        ? initialEventArtistProfileType
        : (fetchedEventArtistProfileType || 'music');
    const isVisualArtistEvent = isArtistEvent && eventArtistProfileType === 'artist';

    // For business events, prefer the CURRENT business avatar (from businesses table join)
    // over the stale poster_avatar snapshot. Same for artist events.
    const organizerAvatar = (() => {
        let raw = "";
        if (isBusinessEvent) {
            // Business event: use business avatar only — never fall back to personal profile pic
            const bizAvatar = toStr(event?.businessAccountAvatar || event?.business_account_avatar).trim();
            if (bizAvatar) raw = bizAvatar;
            // If no business avatar, raw stays "" so the MUI icon fallback renders
        } else if (isArtistEvent) {
            // Artist event: use artist avatar only — never fall back to personal profile pic
            const artAvatar = toStr(event?.artistAccountAvatar || event?.artist_account_avatar).trim();
            if (artAvatar) raw = artAvatar;
        } else {
            // Personal event: use organizer's personal avatar
            raw = organizer?.avatarUrl || organizer?.avatar_url || organizer?.profile_picture || "";
        }
        return isDefaultAvatar(raw) ? "" : raw;
    })();

    const viewerId = Number(user?.id || user?.user_id || 0);
    const eventUserId = Number(organizerId || 0);
    const isPersonalOwner = Boolean(viewerId && eventUserId && viewerId === eventUserId);

    const eventPosterHandle = toStr(
        event?.posterHandle || event?.poster_handle ||
        organizer?.handle || organizer?.username ||
        event?.organizerHandle || event?.organizer_handle
    ).toLowerCase();
    const activeSlug = toStr(activeAccount?.slug || activeAccount?.handle || "").toLowerCase();
    const activeType = activeAccount?.type || activeAccountType || "personal";

    const isOnCorrectAccount = isPersonalOwner && (
        (!eventPosterHandle) ||
        (activeType === "personal" && !isBusinessEvent && !isArtistEvent) ||
        (activeSlug && eventPosterHandle && activeSlug === eventPosterHandle)
    );
    const isConnectedButWrongAccount = isPersonalOwner && !isOnCorrectAccount;

    const eventPosterName = toStr(
        event?.posterName || event?.poster_name || organizerName
    );
    const editDeleteTooltip = isConnectedButWrongAccount
        ? `Switch to "${eventPosterName || "the account"}" to edit or delete`
        : "";

    // Edit history
    const editCount = Number(event?.editCount || event?.edit_count || 0);
    const isEdited = editCount > 0 || Boolean(
        event?.editedAt || event?.edited_at ||
        (event?.updatedAt && event?.createdAt && String(event.updatedAt) !== String(event.createdAt))
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

    // Event menu handlers
    const handleEventMenuOpen = (e) => {
        e.stopPropagation();
        setEventMenuAnchor(e.currentTarget);

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
    const handleEventMenuClose = () => setEventMenuAnchor(null);
    const handleEventCopyLink = () => {
        handleEventMenuClose();
        const url = `${window.location.origin}/events?event=${eventId}`;
        navigator.clipboard.writeText(url).then(() => {
            if (onSuccess) onSuccess("Link copied to clipboard");
        }).catch(() => {
            setErrorToast({ open: true, msg: "Could not copy link." });
        });
    };
    const handleEventEdit = () => {
        handleEventMenuClose();
        if (editLimitReached) {
            setEditLimitDialogOpen(true);
            return;
        }
        if (isOnCorrectAccount) {
            window.dispatchEvent(new CustomEvent("ll:event:edit-request", { detail: { event } }));
        }
    };
    const handleEventDeleteClick = () => {
        handleEventMenuClose();
        if (isOnCorrectAccount) setEventDeleteOpen(true);
    };
    const handleEventConfirmDelete = async () => {
        setEventDeleting(true);
        try {
            const res = await secureFetch(`/api/events/${encodeURIComponent(String(eventId))}`, { method: "DELETE", credentials: "include" });
            if (res.ok) {
                setEventDeleteOpen(false);
                if (onSuccess) onSuccess("Event deleted.");
                window.dispatchEvent(new CustomEvent("ll:event:deleted", { detail: { eventId } }));
                if (typeof onClose === "function") onClose();
                if (typeof onClearSelection === "function") onClearSelection();
            } else {
                setErrorToast({ open: true, msg: "Could not delete event." });
            }
        } catch {
            setErrorToast({ open: true, msg: "Could not delete event." });
        } finally {
            setEventDeleting(false);
        }
    };
    const handleEventReportFromMenu = () => {
        handleEventMenuClose();
        setEventReportReason("");
        setEventReportDetails("");
        setEventReportSubmitted(false);
        setEventReportOpen(true);
    };
    const handleEventReportSubmit = async (reason, details) => {
        try {
            const res = await secureFetch(`/api/events/${encodeURIComponent(eventId)}/report`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
            if (!res.ok) setErrorToast({ open: true, msg: "Could not send report." });
        } catch {
            setErrorToast({ open: true, msg: "Could not send report." });
        }
    };

    const dateLabel = formatEventDate(event);
    const timeLabel = formatEventTime(event);
    const locationLabel = formatLocationLabel(event);
    const addressStr = toStr(event?.address || event?.venueAddress || event?.venue_address).trim();
    const venueName = toStr(event?.venueName || event?.venue_name).trim();
    const eventLat = event?.latitude != null ? Number(event.latitude) : null;
    const eventLng = event?.longitude != null ? Number(event.longitude) : null;
    const hasMapPin = eventLat != null && eventLng != null && Number.isFinite(eventLat) && Number.isFinite(eventLng);


    // No event selected state
    if (!eventId) {
        return (
            <Box
                sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    p: 3,
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Box
                        sx={(t) => ({
                            width: 76,
                            height: 76,
                            borderRadius: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: alpha(t.palette.primary.main, 0.06),
                            border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                        })}
                    >
                        <EventRoundedIcon sx={{ fontSize: 40, color: "primary.main" }} />
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                        Select an Event
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45, maxWidth: 300 }}>
                        Choose an event from the feed to see its full details, RSVP, and join the conversation.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header - only show close button if provided */}
            {onClose && (
                <Box
                    sx={(t) => ({
                        px: 2,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.divider, 0.8),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        bgcolor: alpha(t.palette.background.paper, 0.95),
                        backdropFilter: "blur(8px)",
                    })}
                >
                    <IconButton size="small" onClick={onClose}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* Scrollable content */}
            <Box ref={detailScrollRef} sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: { xs: 1.25, sm: 2 } }}>
                {error && (
                    <Box
                        sx={(t) => ({
                            p: 1.5,
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: alpha(t.palette.error.main, 0.08),
                            border: "1px solid",
                            borderColor: alpha(t.palette.error.main, 0.2),
                        })}
                    >
                        <Typography sx={{ color: "error.main", fontSize: 13, fontWeight: 700 }}>
                            {error}
                        </Typography>
                    </Box>
                )}

                {isLoading && !event ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : event ? (
                    <>
                        {/* Hero Image with Fade & Title */}
                        {coverPhoto ? (
                            <HeroImage
                                photo={coverPhoto}
                                title={event?.title}
                            />
                        ) : (
                            /* No cover photo — decorative gradient banner */
                            <Box
                                sx={(t) => ({
                                    position: "relative",
                                    width: "100%",
                                    borderRadius: 3,
                                    overflow: "hidden",
                                    mb: 2,
                                    background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.13)} 0%, ${alpha(t.palette.primary.main, 0.06)} 50%, ${alpha(t.palette.primary.main, 0.10)} 100%)`,
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.10),
                                    p: { xs: 2.5, sm: 3 },
                                    pt: { xs: 3, sm: 3.5 },
                                    pb: { xs: 2.5, sm: 3 },
                                })}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 950,
                                        fontSize: { xs: 22, sm: 26 },
                                        lineHeight: 1.2,
                                        color: "text.primary",
                                        overflowWrap: "anywhere",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {event?.title || "Untitled Event"}
                                </Typography>
                            </Box>
                        )}

                        {/* Category chip — JobCard style */}
                        {categoryInfo.label && (
                            <Chip
                                size="small"
                                icon={EVENT_CATEGORY_ICONS[categoryInfo.slug] ? React.createElement(EVENT_CATEGORY_ICONS[categoryInfo.slug], { sx: { fontSize: 14 } }) : undefined}
                                label={categoryInfo.label}
                                sx={(t) => ({
                                    mb: 1.5,
                                    height: 24,
                                    borderRadius: 999,
                                    fontWeight: 800,
                                    fontSize: 11,
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    color: t.palette.primary.main,
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.25),
                                    "& .MuiChip-label": { px: 0.9, lineHeight: 1 },
                                    "& .MuiChip-icon": { ml: 0.5, color: t.palette.primary.main },
                                    maxWidth: 200,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                })}
                            />
                        )}

                        {/* Organizer - clickable with popover */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            <Box
                                onClick={handleOrganizerClick}
                                sx={(t) => ({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    p: 1.5,
                                    flex: 1,
                                    minWidth: 0,
                                    borderRadius: 2.5,
                                    bgcolor: alpha(t.palette.primary.main, 0.04),
                                    cursor: "pointer",
                                    transition: "background-color 0.15s",
                                    "&:hover": {
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                    },
                                })}
                            >
                                <Avatar
                                    src={organizerAvatar || undefined}
                                    alt={organizerName}
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        border: "2px solid",
                                        borderColor: "primary.main",
                                        bgcolor: "grey.200",
                                    }}
                                >
                                    {!organizerAvatar ? (
                                        isBusinessEvent ? <StorefrontRoundedIcon /> :
                                            isArtistEvent ? (isVisualArtistEvent ? <PaletteRoundedIcon /> : <MusicNoteRoundedIcon />) :
                                                <PersonRoundedIcon />
                                    ) : null}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.75}>
                                        <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
                                            Posted by
                                        </Typography>
                                        {isEdited && (
                                            <>
                                                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, lineHeight: 1 }}>•</Typography>
                                                <Typography
                                                    variant="caption"
                                                    onClick={openHistory}
                                                    sx={{
                                                        fontSize: 11,
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
                                    <Typography sx={{ fontWeight: 800, fontSize: 14, color: "text.primary" }}>
                                        {organizerName}
                                    </Typography>
                                    {organizerHandle && (
                                        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
                                            @{organizerHandle}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* 3-dot event menu */}
                            <IconButton
                                size="small"
                                onClick={handleEventMenuOpen}
                                sx={{
                                    flexShrink: 0,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    width: 36,
                                    height: 36,
                                }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* View Event Page button */}
                        {!isMobile && (
                            <Button
                                variant="outlined"
                                fullWidth
                                endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={() => navigate(`/events/${eventId}`, { state: { fromEvents: true } })}
                                sx={(t) => ({
                                    mb: 2.5,
                                    py: 1,
                                    borderRadius: 2.5,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    fontSize: 13,
                                    borderColor: alpha(t.palette.primary.main, 0.3),
                                    color: "primary.main",
                                    "&:hover": {
                                        bgcolor: alpha(t.palette.primary.main, 0.06),
                                        borderColor: t.palette.primary.main,
                                    },
                                })}
                            >
                                View Event Page
                            </Button>
                        )}

                        {/* Date, Time & Location — grouped info card */}
                        <Box
                            sx={(t) => ({
                                mb: 2.5,
                                p: 2,
                                borderRadius: 3,
                                bgcolor: alpha(t.palette.primary.main, 0.03),
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.08),
                            })}
                        >
                            <Stack spacing={2}>
                                {dateLabel && (
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Box
                                            sx={(t) => ({
                                                width: 40,
                                                height: 40,
                                                borderRadius: 2,
                                                bgcolor: alpha(t.palette.primary.main, 0.1),
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            })}
                                        >
                                            <CalendarTodayRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{dateLabel}</Typography>
                                            {timeLabel && (
                                                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{timeLabel}</Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                )}

                                {/* Subtle separator */}
                                {dateLabel && (
                                    <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />
                                )}

                                {/* Location */}
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                        sx={(t) => ({
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: alpha(t.palette.primary.main, 0.1),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        })}
                                    >
                                        <LocationOnRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                                    </Box>
                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.25 }}>
                                        {venueName && (
                                            <Typography sx={{ fontWeight: 800, fontSize: 14, color: "text.primary" }}>{venueName}</Typography>
                                        )}
                                        {addressStr && (
                                            <Typography sx={{ fontSize: 13, color: "primary.main", fontWeight: 700 }}>
                                                {addressStr}
                                            </Typography>
                                        )}
                                        <Typography sx={{ fontSize: 13, color: "primary.main", fontWeight: 700 }}>
                                            {locationLabel}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Description / About — styled section */}
                        {hasMapPin && (() => {
                            // Build the Google Maps query based on available location data
                            const hasStreetAddress = Boolean(addressStr);
                            const locationQuery = [addressStr, venueName, locationLabel, 'Alabama'].filter(Boolean).join(', ');
                            const mapSrc = hasStreetAddress
                                ? `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${encodeURIComponent(locationQuery)}&zoom=16`
                                : `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${eventLat},${eventLng}&zoom=11`;
                            // For click-through, use the human-readable location (not coordinates)
                            const directionsQuery = hasStreetAddress
                                ? locationQuery
                                : [locationLabel, 'Alabama'].filter(Boolean).join(', ');
                            return (
                                <Box
                                    sx={{ mb: 3, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider", position: "relative", cursor: "pointer" }}
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`, '_blank')}
                                >
                                    <Box
                                        component="iframe"
                                        src={mapSrc}
                                        sx={{ width: "100%", height: 180, border: 0, display: "block", pointerEvents: "none" }}
                                        loading="lazy"
                                        allowFullScreen
                                        title="Event location"
                                    />
                                </Box>
                            );
                        })()}
                        {event?.description && (
                            <Box sx={{ mb: 3 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1.25, letterSpacing: 0.2 }}>About</Typography>
                                <Box
                                    sx={(t) => ({
                                        position: "relative",
                                        pl: 2,
                                        borderLeft: "3px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.25),
                                    })}
                                >
                                    <Box
                                        sx={{
                                            maxHeight: descriptionExpanded ? "none" : DESC_MAX_HEIGHT,
                                            overflowY: descriptionExpanded ? "visible" : "hidden",
                                            position: "relative",
                                        }}
                                    >
                                        <Box ref={descriptionRef}>
                                            <RichTextDisplay html={event.description} />
                                        </Box>
                                    </Box>
                                    {/* Gradient fade overlay */}
                                    {!descriptionExpanded && needsDescTruncate && (
                                        <Box
                                            sx={(t) => ({
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: 64,
                                                background: `linear-gradient(to bottom, ${alpha(t.palette.background.paper || "background.paper", 0)} 0%, ${t.palette.background.paper || "background.paper"} 85%)`,
                                                pointerEvents: "none",
                                            })}
                                        />
                                    )}
                                    {/* Show more / Show less */}
                                    {needsDescTruncate && (
                                        <Button
                                            size="small"
                                            onClick={() => setDescriptionExpanded((prev) => !prev)}
                                            sx={{
                                                mt: descriptionExpanded ? 0.5 : -0.25,
                                                position: "relative",
                                                zIndex: 2,
                                                textTransform: "none",
                                                fontWeight: 850,
                                                fontSize: "0.78rem",
                                                px: 0,
                                                minWidth: 0,
                                                color: "primary.main",
                                                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                            }}
                                        >
                                            {descriptionExpanded ? "Show less" : "Show more"}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        )}

                        {/* Additional Photos Gallery */}
                        {photos.length > 1 && <AdditionalPhotosGallery photos={photos} />}

                        {/* Friends Going */}
                        {friendsGoing.length > 0 && (
                            <Box
                                onClick={() => setFriendsDialogOpen(true)}
                                sx={(t) => ({
                                    mb: 1.5,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.25,
                                    cursor: "pointer",
                                    borderRadius: 2,
                                    py: 0.75,
                                    px: 1,
                                    mx: -1,
                                    transition: "background-color 0.15s",
                                    "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.06) },
                                })}
                            >
                                <Box sx={{ display: "flex", flexShrink: 0 }}>
                                    {friendsGoing.slice(0, 3).map((friend, idx) => (
                                        <Avatar
                                            key={friend.id || idx}
                                            src={friend.avatarUrl || friend.avatar_url || friend.profile_picture || undefined}
                                            alt={friend.firstName || friend.first_name || ""}
                                            sx={(t) => ({
                                                width: 28,
                                                height: 28,
                                                fontSize: 11,
                                                fontWeight: 800,
                                                border: "2px solid",
                                                borderColor: t.palette.background.paper,
                                                bgcolor: alpha(t.palette.primary.main, 0.12),
                                                color: "primary.main",
                                                ml: idx > 0 ? "-8px" : 0,
                                                zIndex: 3 - idx,
                                                position: "relative",
                                            })}
                                        >
                                            <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                        </Avatar>
                                    ))}
                                </Box>
                                <Typography
                                    sx={{
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        color: "text.secondary",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {(() => {
                                        const first = friendsGoing[0];
                                        const firstName = String(first?.firstName || first?.first_name || first?.name || "Someone");
                                        const lastName = String(first?.lastName || first?.last_name || "");
                                        const displayName = lastName ? `${firstName} ${lastName}` : firstName;
                                        const othersCount = friendsGoing.length - 1;
                                        if (othersCount <= 0) return `${displayName} you follow is going`;
                                        if (othersCount === 1) return `${displayName} and 1 other you follow are going`;
                                        return `${displayName} and ${othersCount} others you follow are going`;
                                    })()}
                                </Typography>
                            </Box>
                        )}

                        {/* RSVP & Interested Buttons */}
                        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                            <Button
                                variant={hasRsvpd ? "contained" : "outlined"}
                                fullWidth
                                disabled={engBusy === "rsvp"}
                                startIcon={hasRsvpd ? <CheckCircleRoundedIcon /> : <EventAvailableRoundedIcon />}
                                onClick={() => handleEngage("rsvp")}
                                sx={(t) => ({
                                    borderRadius: 2.5,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    py: 1.25,
                                    transition: `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                    ...(hasRsvpd
                                        ? {
                                            bgcolor: t.palette.secondary.main,
                                            color: t.palette.secondary.contrastText,
                                            boxShadow: t.custom.shadows.xs,
                                            "&:hover": { bgcolor: t.palette.secondary.dark, boxShadow: t.custom.shadows.sm },
                                        }
                                        : {
                                            borderColor: alpha(t.palette.text.primary, 0.14),
                                            color: t.palette.secondary.main,
                                            "&:hover": { bgcolor: alpha(t.palette.secondary.main, 0.04), borderColor: alpha(t.palette.secondary.main, 0.34), boxShadow: t.custom.shadows.xs },
                                        }),
                                })}
                            >
                                {hasRsvpd ? "Going" : "RSVP"}{rsvpCount > 0 ? ` (${formatCount(rsvpCount)})` : ""}
                            </Button>

                            <Button
                                variant={isInterested ? "contained" : "outlined"}
                                fullWidth
                                disabled={engBusy === "interested"}
                                startIcon={isInterested ? <StarRoundedIcon /> : <StarBorderRoundedIcon />}
                                onClick={() => handleEngage("interested")}
                                sx={(t) => ({
                                    borderRadius: 2.5,
                                    textTransform: "none",
                                    fontWeight: 800,
                                    py: 1.25,
                                    transition: `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                    ...(isInterested
                                        ? {
                                            bgcolor: t.palette.primary.main,
                                            color: t.palette.primary.contrastText,
                                            boxShadow: t.custom.shadows.xs,
                                            "&:hover": { bgcolor: t.palette.primary.dark, boxShadow: t.custom.shadows.sm },
                                        }
                                        : {
                                            borderColor: alpha(t.palette.text.primary, 0.14),
                                            color: t.palette.text.secondary,
                                            "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.04), borderColor: alpha(t.palette.primary.main, 0.34), color: t.palette.primary.main, boxShadow: t.custom.shadows.xs },
                                        }),
                                })}
                            >
                                Interested{interestedCount > 0 ? ` (${formatCount(interestedCount)})` : ""}
                            </Button>
                        </Stack>

                        {/* Event Action Bar — uses theme tokens matching PostDetailModal */}
                        <Paper
                            variant="outlined"
                            sx={(t) => ({
                                mt: 1.25,
                                mb: 3,
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "background.paper",
                                backgroundImage: "none",
                                borderColor: alpha(t.palette.primary.main, 0.14),
                                boxShadow: t.custom?.shadows?.xs || 'none',
                            })}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                    gap: { xs: 0.75, sm: 1.25 },
                                    flexWrap: "wrap",
                                    px: 0.5,
                                    py: 0.25,
                                }}
                            >
                                {/* Like */}
                                <Tooltip title={hasLiked ? "Unlike" : "Like"}>
                                    <Box
                                        onClick={() => handleEngage("like")}
                                        tabIndex={0}
                                        role="button"
                                        sx={(t) => ({
                                            display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                            py: 0.5, px: 1.25, borderRadius: 999,
                                            transition: `background ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}, transform ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}`,
                                            "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                            "&:active": { transform: "scale(0.97)" },
                                        })}
                                    >
                                        {hasLiked ? (
                                            <FavoriteRoundedIcon sx={(t) => ({ fontSize: { xs: 20, sm: 22 }, color: "secondary.main", transition: `color ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}` })} />
                                        ) : (
                                            <FavoriteBorderRoundedIcon sx={(t) => ({ fontSize: { xs: 20, sm: 22 }, color: "text.secondary", transition: `color ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}` })} />
                                        )}
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: hasLiked ? "secondary.main" : "text.secondary", lineHeight: 1 }}>
                                            {likeCount || 0}
                                        </Typography>
                                    </Box>
                                </Tooltip>

                                {/* Comment */}
                                <Tooltip title="Comment">
                                    <Box
                                        onClick={() => {
                                            const anchor = document.getElementById("event-comments-composer");
                                            if (anchor) {
                                                anchor.scrollIntoView({ behavior: "instant", block: "center" });
                                                const el = anchor.querySelector("textarea, input[type='text']");
                                                if (el) {
                                                    try { el.focus(); } catch { /* ignore */ }
                                                    setTimeout(() => { try { el.focus(); } catch { /* ignore */ } }, 300);
                                                }
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        sx={(t) => ({
                                            display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                            py: 0.5, px: 1.25, borderRadius: 999,
                                            transition: `background ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}, transform ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}`,
                                            "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                            "&:active": { transform: "scale(0.97)" },
                                        })}
                                    >
                                        <ChatBubbleOutlineRoundedIcon sx={(t) => ({ fontSize: { xs: 18, sm: 20 }, color: "text.secondary", transition: `color ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}` })} />
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 1 }}>
                                            {commentCount || 0}
                                        </Typography>
                                    </Box>
                                </Tooltip>

                                {/* Repost */}
                                <Tooltip title={hasReposted ? "Undo Repost" : "Repost"}>
                                    <Box
                                        onClick={() => handleEngage("repost")}
                                        tabIndex={0}
                                        role="button"
                                        sx={(t) => ({
                                            display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                            py: 0.5, px: 1.25, borderRadius: 999,
                                            transition: `background ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}, transform ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}`,
                                            "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                            "&:active": { transform: "scale(0.97)" },
                                        })}
                                    >
                                        <RepeatRoundedIcon sx={(t) => ({ fontSize: { xs: 20, sm: 22 }, color: hasReposted ? "secondary.main" : "text.secondary", transition: `color ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}` })} />
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: hasReposted ? "secondary.main" : "text.secondary", lineHeight: 1 }}>
                                            {repostCount || 0}
                                        </Typography>
                                    </Box>
                                </Tooltip>

                                {/* Share */}
                                <Tooltip title="Share">
                                    <Box
                                        onClick={handleShare}
                                        tabIndex={0}
                                        role="button"
                                        sx={(t) => ({
                                            display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                            py: 0.5, px: 1.25, borderRadius: 999,
                                            transition: `background ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}, transform ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}`,
                                            "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                            "&:active": { transform: "scale(0.97)" },
                                        })}
                                    >
                                        <ShareRoundedIcon sx={(t) => ({ fontSize: { xs: 18, sm: 20 }, color: "text.secondary", transition: `color ${t.custom?.motion?.fast || 140}ms ${t.custom?.motion?.ease || 'ease'}` })} />
                                    </Box>
                                </Tooltip>


                            </Box>
                        </Paper>

                        {/* Login prompt if not logged in */}
                        {!canEngage && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                                You need to{" "}
                                <Link
                                    component="button"
                                    underline="hover"
                                    onClick={onRequireAuth}
                                    sx={{
                                        verticalAlign: "baseline",
                                        display: "inline",
                                        font: "inherit",
                                        border: "none",
                                        p: 0,
                                        cursor: "pointer",
                                    }}
                                >
                                    log in
                                </Link>{" "}
                                to comment.
                            </Typography>
                        )}

                        <Divider sx={{ mb: 2.5, borderStyle: "dashed", opacity: 0.5 }} />

                        {/* Comments Section */}
                        <Box id="event-comments-section">
                            <EventCommentsSection
                                eventId={eventId}
                                user={user}
                                eventOwner={organizer}
                                eventBusinessAccountId={eventBusinessAccountId}
                                eventArtistAccountId={eventArtistAccountId}
                                onRequireAuth={onRequireAuth}
                                onCommentCountChange={handleCommentCountChange}
                                onOpenUserCard={handleOpenUserCard}
                                focusCommentInput={focusCommentInput}
                                onFocusCommentHandled={onFocusCommentHandled}
                                scrollToCommentId={scrollToCommentIdProp}
                                highlightCommentId={highlightCommentIdProp}
                            />
                        </Box>
                    </>
                ) : null}
            </Box>

            {/* User Card Popover */}
            <UserCardPopover
                anchorEl={popoverAnchorEl}
                onClose={handlePopoverClose}
                user={popoverUser}
                isSelf={user?.id && popoverUser?.id && String(user.id) === String(popoverUser.id)}
                following={false}
                onViewProfile={(u) => {
                    handlePopoverClose();
                    const h = u?.handle || popoverUser?.handle;
                    if (h) window.location.assign(`/${h}`);
                }}
            />

            {/* Event 3-dot Menu */}
            <SmartMenu
                anchorEl={eventMenuAnchor}
                open={eventMenuOpen}
                onClose={handleEventMenuClose}
                onClick={(e) => e.stopPropagation()}
                disableScrollLock
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } }}
            >
                <MenuItem onClick={handleEventCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>

                {isOnCorrectAccount && <Divider sx={{ my: 0.5 }} />}

                {isOnCorrectAccount && (
                    <MenuItem
                        onClick={handleEventEdit}
                        sx={{ py: 1 }}
                    >
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit" />
                    </MenuItem>
                )}

                {isOnCorrectAccount && (
                    <MenuItem
                        onClick={handleEventDeleteClick}
                        sx={{ py: 1, color: "error.main" }}
                    >
                        <ListItemIcon sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete" />
                    </MenuItem>
                )}

                {!isOnCorrectAccount && <Divider sx={{ my: 0.5 }} />}
                {!isOnCorrectAccount && (
                    <MenuItem onClick={handleEventReportFromMenu} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* Delete Confirmation */}
            <Dialog open={eventDeleteOpen} onClose={() => setEventDeleteOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Event</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this event? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEventDeleteOpen(false)} disabled={eventDeleting}>Cancel</Button>
                    <Button onClick={handleEventConfirmDelete} color="error" variant="contained" disabled={eventDeleting}>
                        {eventDeleting ? "Deleting..." : "Delete Event"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Dialog */}
            <Dialog open={eventReportOpen} onClose={() => setEventReportOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
                    sx={{ zIndex: 100001 }}
            >
                {eventReportSubmitted ? (
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
                                onClick={() => { setEventReportOpen(false); setTimeout(() => { setEventReportSubmitted(false); setEventReportReason(""); setEventReportDetails(""); }, 250); }}
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
                            <IconButton size="small" onClick={() => setEventReportOpen(false)} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 0, pb: 1 }}>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                                Why are you reporting this event? Your report is anonymous.
                            </Typography>
                            <RadioGroup value={eventReportReason} onChange={(e) => setEventReportReason(e.target.value)}>
                                {[
                                    { value: "spam", label: "Spam or misleading" },
                                    { value: "inappropriate", label: "Inappropriate content" },
                                    { value: "scam", label: "Scam or fraud" },
                                    { value: "other", label: "Other" },
                                ].map((opt) => (
                                    <FormControlLabel
                                        key={opt.value}
                                        value={opt.value}
                                        control={<Radio size="small" />}
                                        label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                        sx={{ mx: 0, py: 0.25, px: 1, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
                                    />
                                ))}
                            </RadioGroup>
                            <TextField
                                multiline minRows={3} maxRows={6} fullWidth
                                placeholder="Add any additional details that might help us review this report…"
                                value={eventReportDetails}
                                onChange={(e) => setEventReportDetails(e.target.value)}
                                inputProps={{ maxLength: 1000 }}
                                sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                                {eventReportDetails.length}/1000
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button onClick={() => setEventReportOpen(false)} sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    setEventReportSubmitting(true);
                                    await handleEventReportSubmit(eventReportReason, eventReportDetails);
                                    setEventReportSubmitting(false);
                                    setEventReportSubmitted(true);
                                }}
                                variant="contained" disableElevation
                                disabled={!eventReportReason || eventReportSubmitting}
                                startIcon={eventReportSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, px: 3 }}
                            >
                                Submit report
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Share Event Dialog */}
            {user ? (
                <ShareEventDialog
                    open={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                    event={event}
                    viewer={user}
                    onShared={handleShareCompleted}
                />
            ) : (
                <Dialog
                    open={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                    maxWidth="xs"
                    fullWidth
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
                >
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                        Share Event
                        <IconButton size="small" onClick={() => setShareDialogOpen(false)} aria-label="Close">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pb: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<LinkRoundedIcon />}
                            onClick={() => {
                                const url = `${window.location.origin}/events?event=${eventId}`;
                                navigator.clipboard.writeText(url).then(() => {
                                    if (onSuccess) onSuccess("Link copied to clipboard");
                                }).catch(() => {
                                    setErrorToast({ open: true, msg: "Could not copy link." });
                                });
                                setShareDialogOpen(false);
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
                                onClick={() => { setShareDialogOpen(false); onRequireAuth?.(); }}
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
                currentEvent={event}
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

            {/* Error Toast */}
            <Snackbar
                open={errorToast.open}
                autoHideDuration={3000}
                onClose={() => setErrorToast({ open: false, msg: "" })}
                message={errorToast.msg}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                sx={{ zIndex: 200001 }}
            />
            <SuccessSnackbar {...successSnackbarProps} />
        </Box>
    );
}