// src/pages/events/EventPostPage.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from "../../utils/commentBlockUtils";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { secureFetch } from "../../utils/secureFetch";
import { alpha } from "@mui/material/styles";
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
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseIcon from "@mui/icons-material/Close";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import defaultAvatar from "../../assets/profile/default_avatar.png";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import PersonIcon from "@mui/icons-material/Person";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
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
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";

import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";

import { fetchEventById, updateEventEngagement } from "./api/eventsApi";
import UserCardPopover from "../../components/UserCardPopover";
import ShareEventDialog from "../../components/ShareEventDialog";
import ShareDialog from "../../components/ShareDialog";
import AccountAvatar from "../../components/AccountAvatar";
import { useAuth } from "../../components/AuthModalContext";
import BlockedPostGate, { useBlockedPostGate } from "../../components/BlockedPostGate";
import { useActiveAccount } from "../../components/AccountContext";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../components/Header/Header";
import NetworkErrorState, { isNetworkError } from "../../components/NetworkErrorState";
import CommentImageAttachments, { uploadFilesToGCS } from "../../components/CommentImageAttachments";
import CommentImages from "../../components/CommentImages";
import CreateEditEventModal from "./modals/CreateEditEventModal";
import RichTextDisplay from "../../components/RichTextDisplay";
import useRateLimit from "../../utils/useRateLimit";
import RateLimitDialog from "../../components/RateLimitDialog";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import { checkProfanity } from "../../utils/profanityCheck";
import SmartMenu from "../../components/SmartMenu";
import useChromeTop from "../../hooks/useChromeTop";

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

/* ═══════════════════════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════════════════════ */
const COMMENT_MAX_CHARS = 15000;
const COMMENT_PREVIEW_CHARS = 200;
const DESCRIPTION_PREVIEW_LINES = 6;

/** Max visual indent depth — deeper replies flatten with a "Replying to" label */
const MAX_VISUAL_DEPTH = 2;
/** How many replies to show per comment before "Show more replies" */
const INITIAL_REPLIES_SHOWN = 5;
/** How many top-level comments to show initially */
const INITIAL_COMMENTS_SHOWN = 20;
/** How many more top-level comments per "Load more" click */
const COMMENTS_LOAD_MORE = 20;

const toStr = (v) => (v == null ? "" : String(v));

/* ── @mention helpers ── */
const MENTION_RE_MATCH = /(^|\s)@([a-zA-Z0-9_.]{0,30})$/;
function getMentionMatch(text, cursorIdx) {
    if (!text || cursorIdx <= 0) return null;
    const before = text.slice(0, cursorIdx);
    const m = before.match(MENTION_RE_MATCH);
    if (!m) return null;
    const query = m[2];
    const start = before.lastIndexOf("@" + query);
    return { query, start, end: cursorIdx };
}
function getMentionAnchorVirtualEl(textareaEl, caretIdx) {
    if (!textareaEl) return null;
    const mirror = document.createElement("div");
    const cs = window.getComputedStyle(textareaEl);
    [
        "font", "fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing",
        "wordSpacing", "textIndent", "whiteSpace", "wordWrap", "overflowWrap",
        "paddingTop", "paddingLeft", "paddingRight", "paddingBottom",
        "borderTopWidth", "borderLeftWidth", "borderRightWidth", "borderBottomWidth",
        "boxSizing", "width",
    ].forEach((p) => { mirror.style[p] = cs[p]; });
    mirror.style.position = "absolute";
    mirror.style.left = "-9999px";
    mirror.style.top = "0";
    mirror.style.visibility = "hidden";
    mirror.style.overflow = "hidden";
    mirror.style.height = "auto";
    const val = textareaEl.value || "";
    const before = document.createTextNode(val.slice(0, caretIdx));
    const span = document.createElement("span");
    span.textContent = val[caretIdx] || ".";
    mirror.appendChild(before);
    mirror.appendChild(span);
    document.body.appendChild(mirror);
    const spanRect = span.getBoundingClientRect();
    const textareaRect = textareaEl.getBoundingClientRect();
    const offsetX = spanRect.left - mirror.getBoundingClientRect().left;
    const offsetY = spanRect.top - mirror.getBoundingClientRect().top;
    document.body.removeChild(mirror);
    const x = textareaRect.left + offsetX + textareaEl.scrollLeft * -1;
    const y = textareaRect.top + offsetY - textareaEl.scrollTop + spanRect.height;
    return { getBoundingClientRect: () => ({ top: y, left: x, bottom: y, right: x, width: 0, height: 0 }) };
}
function MentionAccountBadge({ item }) {
    if (!item) return null;
    const profileType = String(item.profile_type || item.profileType || "").toLowerCase();
    const isVisualArtistMention = item.account_type === "artist" && profileType === "artist";
    return (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.25, ml: 0.25 }}>
            {item.account_type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 12, color: "text.secondary" }} />}
            {item.account_type === "artist" && !isVisualArtistMention && <MusicNoteRoundedIcon sx={{ fontSize: 12, color: "text.secondary" }} />}
            {isVisualArtistMention && <PaletteRoundedIcon sx={{ fontSize: 12, color: "text.secondary" }} />}
        </Box>
    );
}
function renderMentionPopper({ open, anchorEl, results, loading, activeIdx, onSelect, onClose }) {
    return (
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1600 }} modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}>
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
                        {loading && !results.length ? (
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
                                const label = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.handle;
                                const avatar = u.avatar_url || u.profile_picture || '';
                                return (
                                    <ListItemButton
                                        key={u.id || i}
                                        selected={i === activeIdx}
                                        onClick={() => onSelect(u)}
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
/* end @mention helpers */

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
    "music-nightlife": "Music & Nightlife",
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
    { value: "harassment", label: "Harassment or abuse" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "misinformation", label: "Misinformation" },
    { value: "other", label: "Other" },
];

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

const SEND_BUTTON_SX = {
    ml: 0.5,
    bgcolor: "primary.main",
    color: "common.white",
    width: { xs: 32, sm: 36 },
    height: { xs: 32, sm: 36 },
    flexShrink: 0,
    borderRadius: '50%',
    boxShadow: 'none',
    "&:hover": { bgcolor: "primary.dark", boxShadow: (t) => `0 4px 12px ${alpha(t.palette.primary.main, 0.25)}` },
    "&.Mui-disabled": {
        bgcolor: "action.disabledBackground",
        color: "action.disabled",
        opacity: 1,
        boxShadow: 'none',
    },
};

function slugToLabel(slug) {
    if (!slug) return "";
    return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
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
        const [y, mo, d] = s.split("-").map(Number);
        dateObj = new Date(y, mo - 1, d);
    } else {
        const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, y, mo, d] = match.map(Number);
            dateObj = new Date(y, mo - 1, d);
        } else {
            dateObj = new Date(s);
        }
    }

    if (!dateObj || Number.isNaN(dateObj.getTime())) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const eventDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (eventDate.getTime() === today.getTime()) return "Today";
    if (eventDate.getTime() === tomorrow.getTime()) return "Tomorrow";

    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(dateObj);
}

function formatEventTime(event) {
    const startTime = event?.startTime || event?.start_time;
    const endTime = event?.endTime || event?.end_time;
    const startHasTime = event?.startHasTime !== false && startTime;

    if (!startHasTime) return null;

    const formatTime = (t) => {
        if (!t) return null;
        const [hh, mm] = String(t).split(":").map(Number);
        const h12 = hh % 12 || 12;
        const ampm = hh >= 12 ? "PM" : "AM";
        return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
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
    if (scope === "statewide" || (!city && !county)) return "Statewide";
    const countyLabel = county ? `${county} County` : "";
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || "Statewide";
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

/* ═══════════════════════════════════════════════════════════════════════════
   normalizeComments — builds a threaded tree from flat or nested data
   ═══════════════════════════════════════════════════════════════════════════ */

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

    const normalizeNode = (c, idx) => {
        const isBizComment = Boolean(c.business_id || (c.account_type && String(c.account_type).toLowerCase() === 'business'));
        const isArtComment = Boolean(c.artist_id || (c.account_type && String(c.account_type).toLowerCase() === 'artist'));
        const rawAvatar = c.avatar_url ?? c.user?.avatar_url ?? c.profile_picture ?? "";
        return {
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
            artist_id: c.artist_id ?? null,
            account_type: c.account_type ?? (c.business_id ? 'business' : c.artist_id ? 'artist' : 'personal'),
            business_name: c.business_name ?? null,
            business_slug: c.business_slug ?? null,
            business_avatar_url: c.business_avatar_url ?? (isBizComment ? (c.account_avatar_url || null) : null),
            artist_name: c.artist_name ?? null,
            artist_handle: c.artist_handle ?? null,
            artist_avatar_url: c.artist_avatar_url ?? (isArtComment ? (c.account_avatar_url || null) : null),
            // Artist sub-type ('music' | 'artist') passed through so the
            // avatar fallback can pick palette (visual artist) vs music-note
            // (musician). Backend sets this per-comment from music_artists.profile_type.
            profile_type: c.profile_type ?? c.profileType ?? null,
            account_name: c.account_name ?? null,
            account_handle: c.account_handle ?? null,
            // Always preserve account_avatar_url from the server — it contains the
            // denormalized business/artist avatar that was current at comment creation time.
            // For ALL account types, fall back to rawAvatar — the backend flattens the
            // display avatar into avatar_url regardless of account type, so rawAvatar
            // already holds the correct business/artist profile pic when present.
            account_avatar_url: c.account_avatar_url ?? rawAvatar ?? null,
            images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
            image: c.image ?? (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null),
            replies: Array.isArray(c.replies) ? c.replies.map((r, i) => normalizeNode(r, i)) : [],
        };
    };

    const hasNestedReplies = src.some((c) => Array.isArray(c.replies) && c.replies.length > 0);
    if (hasNestedReplies) {
        const roots = src.map((c, idx) => normalizeNode(c, idx));
        roots.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
        return roots;
    }

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
    roots.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
    return roots;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Image with Gradient & Title Overlay (full-page version)
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroImage({ photo, title }) {
    const [loaded, setLoaded] = useState(false);
    const [photoPopupOpen, setPhotoPopupOpen] = useState(false);

    if (!photo) return null;

    return (
        <>
            <Box sx={{ mb: 2.5 }}>
                {/* Image container */}
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        borderRadius: 3,
                        overflow: "hidden",
                        cursor: "pointer",
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
                            height: { xs: 240, sm: 320, md: 380 },
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
                        fontSize: { xs: 24, sm: 30, md: 34 },
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

/* ═══════════════════════════════════════════════════════════════════════════
   Additional Photos Gallery
   ═══════════════════════════════════════════════════════════════════════════ */
function AdditionalPhotosGallery({ photos }) {
    const [index, setIndex] = useState(0);
    const touchStartRef = useRef(null);
    const additionalPhotos = photos.slice(1);

    if (additionalPhotos.length === 0) return null;

    const multiPhoto = additionalPhotos.length > 1;
    const current = additionalPhotos[index] || additionalPhotos[0];

    const prev = () => setIndex((i) => (i - 1 + additionalPhotos.length) % additionalPhotos.length);
    const next = () => setIndex((i) => (i + 1) % additionalPhotos.length);

    const handleTouchStart = (e) => { touchStartRef.current = e.touches[0]?.clientX ?? null; };
    const handleTouchEnd = (e) => {
        if (touchStartRef.current == null) return;
        const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? touchStartRef.current);
        if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
        touchStartRef.current = null;
    };

    return (
        <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.5 }}>
                More Photos
            </Typography>

            <Box
                sx={{ position: "relative", userSelect: "none" }}
            >
                {/* Main image with blurred backdrop */}
                <Box
                    onTouchStart={multiPhoto ? handleTouchStart : undefined}
                    onTouchEnd={multiPhoto ? handleTouchEnd : undefined}
                    sx={{
                        width: "100%",
                        height: { xs: 240, sm: 360 },
                        borderRadius: 2.5,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {/* Blurred background fill */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${current})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(30px) saturate(1.4)",
                            transform: "scale(1.2)",
                            opacity: 0.45,
                        }}
                    />
                    <Box sx={{ position: "absolute", inset: 0, bgcolor: (t) => alpha(t.palette.text.primary, 0.06) }} />
                    {/* Main image */}
                    <Box
                        component="img"
                        key={current}
                        src={current}
                        alt={`Photo ${index + 1} of ${additionalPhotos.length}`}
                        loading="lazy"
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                            zIndex: 1,
                        }}
                    />

                    {/* Overlay prev/next arrows */}
                    {multiPhoto && (
                        <>
                            <IconButton
                                aria-label="Previous image"
                                onClick={prev}
                                sx={{
                                    position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 2,
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.85), backdropFilter: "blur(6px)",
                                    boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.15)}`, width: 36, height: 36,
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.background.paper, 0.95) },
                                }}
                            >
                                <ChevronLeftRoundedIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                            <IconButton
                                aria-label="Next image"
                                onClick={next}
                                sx={{
                                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 2,
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.85), backdropFilter: "blur(6px)",
                                    boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.15)}`, width: 36, height: 36,
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.background.paper, 0.95) },
                                }}
                            >
                                <ChevronRightRoundedIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                        </>
                    )}

                    {/* Counter badge top-right */}
                    {multiPhoto && (
                        <Box
                            sx={{
                                position: "absolute", top: 10, right: 10, zIndex: 2,
                                bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(6px)", color: "common.white",
                                px: 1.25, py: 0.25, borderRadius: 999, fontSize: 12, fontWeight: 800,
                            }}
                        >
                            {index + 1} / {additionalPhotos.length}
                        </Box>
                    )}

                    {/* Dot indicators */}
                    {multiPhoto && additionalPhotos.length <= 8 && (
                        <Box
                            sx={{
                                position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                                zIndex: 2, display: "flex", gap: 0.75,
                            }}
                        >
                            {additionalPhotos.map((_, i) => (
                                <Box
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    sx={{
                                        width: i === index ? 18 : 7, height: 7, borderRadius: 999,
                                        bgcolor: i === index ? "background.paper" : (t) => alpha(t.palette.background.paper, 0.5),
                                        transition: "all 0.2s ease", cursor: "pointer",
                                        boxShadow: (t) => `0 1px 3px ${alpha(t.palette.text.primary, 0.3)}`,
                                    }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Thumbnails strip (3+ photos) */}
                {multiPhoto && additionalPhotos.length >= 3 && (
                    <Box
                        sx={{
                            mt: 1, display: "flex", justifyContent: "center", gap: 0.75,
                            overflowX: "auto", pb: 0.5, WebkitOverflowScrolling: "touch",
                            "&::-webkit-scrollbar": { height: 4 },
                            "&::-webkit-scrollbar-thumb": { borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.15) },
                        }}
                    >
                        {additionalPhotos.map((u, i) => {
                            const active = i === index;
                            return (
                                <Box
                                    key={`${u}-${i}`}
                                    component="img"
                                    src={u}
                                    alt=""
                                    loading="lazy"
                                    onClick={() => setIndex(i)}
                                    sx={{
                                        width: { xs: 48, sm: 56 },
                                        height: { xs: 48, sm: 56 },
                                        objectFit: "cover", borderRadius: 1.5, cursor: "pointer", flex: "0 0 auto",
                                        border: "2px solid", borderColor: active ? "primary.main" : "transparent",
                                        opacity: active ? 1 : 0.65, transition: "all 0.15s ease",
                                        "&:hover": { opacity: 1 },
                                    }}
                                />
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Flag Comment Dialog
   ═══════════════════════════════════════════════════════════════════════════ */
function FlagCommentDialog({ open, onClose, onSubmit, loading }) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");

    useEffect(() => {
        if (!open) {
            setReason("");
            setDetails("");
        }
    }, [open]);

    const handleSubmit = () => {
        if (!reason) return;
        onSubmit({ reason, details });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                Report Comment
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
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
                {reason === "other" && (
                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Please provide details..."
                        variant="outlined"
                        sx={{ mt: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                    />
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: "none" }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!reason || loading}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                >
                    {loading ? "Submitting..." : "Submit Report"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   Threaded Comment Item
   ═══════════════════════════════════════════════════════════════════════════ */
function ThreadedCommentItem({
                                 node,
                                 depth,
                                 expanded,
                                 setExpanded,
                                 viewerAvatarUrl,
                                 viewerLabel,
                                 eventOwner,
                                 eventBusinessAccountId,
                                 eventArtistAccountId,
                                 likeComment,
                                 submitReply,
                                 openFlag,
                                 viewerId,
                                 onDelete,
                                 onTogglePinConfirm,
                                 onRequireAuth,
                                 replyToName,
                                 replyToHandle,
                                 onOpenUserCard,
                                 replyToAvatar,
                                 blockedUserIds,
                                 blockedBusinessIds,
                                 blockedArtistIds,
                                 blockedHandles,
                                 highlightedCommentId,
                                 onShareComment,
                                 newCommentIds,
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
    const openMenu = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };
    const closeMenu = (e) => {
        if (e) e.stopPropagation();
        setMenuAnchor(null);
    };

    /* ── Reply @mention state ── */
    const [rpMentionOpen, setRpMentionOpen] = useState(false);
    const [rpMentionQuery, setRpMentionQuery] = useState("");
    const [rpMentionResults, setRpMentionResults] = useState([]);
    const [rpMentionLoading, setRpMentionLoading] = useState(false);
    const [rpMentionActiveIdx, setRpMentionActiveIdx] = useState(0);
    const [rpMentionAnchorEl, setRpMentionAnchorEl] = useState(null);
    const rpInputRef = useRef(null);
    const rpMentionStartRef = useRef(0);
    const rpMentionEndRef = useRef(0);
    const rpAbortRef = useRef(null);

    const closeRpMention = () => { setRpMentionOpen(false); setRpMentionQuery(""); setRpMentionResults([]); setRpMentionActiveIdx(0); };

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
        setTimeout(() => { const el = rpInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!rpMentionOpen || !rpMentionQuery) { setRpMentionResults([]); return; }
        const timer = setTimeout(async () => {
            if (rpAbortRef.current) rpAbortRef.current.abort();
            const ac = new AbortController(); rpAbortRef.current = ac;
            setRpMentionLoading(true);
            try {
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(rpMentionQuery)}&limit=8`, { credentials: "include", signal: ac.signal });
                const data = await res.json();
                if (!ac.signal.aborted) { setRpMentionResults(Array.isArray(data) ? data : data?.results || []); setRpMentionActiveIdx(0); }
            } catch { /* aborted or failed */ }
            if (!ac.signal.aborted) setRpMentionLoading(false);
        }, 200);
        return () => clearTimeout(timer);
    }, [rpMentionOpen, rpMentionQuery]);

    const handleRpMentionChange = (e) => {
        const val = e.target.value;
        setReplyText(val);
        if (replyError) setReplyError('');
        const el = e.target;
        const m = getMentionMatch(val, el.selectionStart || 0);
        if (m) {
            setRpMentionQuery(m.query); rpMentionStartRef.current = m.start; rpMentionEndRef.current = m.end;
            setRpMentionAnchorEl(getMentionAnchorVirtualEl(el, m.start));
            if (!rpMentionOpen) setRpMentionOpen(true);
        } else { closeRpMention(); }
    };
    const handleRpMentionKeyDown = (e) => {
        if (rpMentionOpen && rpMentionResults.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); setRpMentionActiveIdx((i) => (i + 1) % rpMentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setRpMentionActiveIdx((i) => (i - 1 + rpMentionResults.length) % rpMentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertRpMention(rpMentionResults[rpMentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeRpMention(); return; }
        }
    };
    /* end reply @mention state */

    useEffect(() => {
        setLiked(Boolean(node.viewer_liked));
        setLikes(Number(node.likes || 0));
    }, [node.viewer_liked, node.likes]);

    const isExpanded = Boolean(expanded[node.id]);
    const replies = node.replies || [];
    const hasReplies = replies.length > 0;

    // ── Account-aware ownership ──
    const { isBusinessAccount: isBA, isArtistAccount: isAA, activeAccount: activeAcct_tci, activeBusinessId: aBizId, activeArtistId: aArtId } = useActiveAccount();

    // Artist sub-type for the reply-composer avatar fallback. Authoritative
    // value comes from /api/music/artists/:id (mirrors ArtistAdminConsole),
    // with context and localStorage as fallbacks.
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

    // "Own comment" — if comment was posted from a business/artist account,
    // the viewer must be on that same account to claim ownership.
    const isOwnComment = (() => {
        if (viewerId == null || node.user_id == null || String(viewerId) !== String(node.user_id)) return false;
        if (commentBizId > 0) return isBA && Number(aBizId) === commentBizId;
        if (commentArtId > 0) return isAA && Number(aArtId) === commentArtId;
        return !isBA && !isAA;
    })();

    // "Event owner" — can manage all comments. Must be on the correct account.
    const isEventOwner = (() => {
        if (viewerId == null || eventOwner?.id == null || String(viewerId) !== String(eventOwner.id)) return false;
        if (eventBusinessAccountId) return isBA && Number(aBizId) === Number(eventBusinessAccountId);
        if (eventArtistAccountId) return isAA && Number(aArtId) === Number(eventArtistAccountId);
        return !isBA && !isAA;
    })();

    const canPin = isEventOwner && depth === 0;
    const canDelete = isOwnComment || isEventOwner;
    const isPinned = Boolean(node.is_pinned);

    // "Author" badge — comment posted by the same entity that created the event
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

    // Determine account type for avatar/name resolution
    const isBusinessComment = Boolean(commentBizId > 0 || node.business_name || node.account_type === 'business');
    const isArtistComment = Boolean(commentArtId > 0 || node.artist_name || node.account_type === 'artist');
    const commentAccountType = isBusinessComment ? 'business' : isArtistComment ? 'artist' : 'personal';

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
    // the profile_type field the comments API now returns. Defaults to music
    // note for legacy rows.
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

    // Progressively shrink avatars at deeper levels
    const avatarSize = depth === 0 ? 40 : depth === 1 ? 36 : 32;
    const replyAvatarSize = depth >= 2 ? 24 : 28;

    const handleToggleExpand = () => {
        setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
    };

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
        setReplyText(""); setReplyFiles([]); setReplyImageUrls([]);
        setShowReplyBox(false);
        setPosting(false);
        setExpanded((prev) => ({ ...prev, [node.id]: true }));
    };

    const handleReplyKeyDown = (e) => {
        handleRpMentionKeyDown(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleReplySubmit();
        }
    };

    // How many replies to show, and whether there are more
    const shownReplies = replies.slice(0, visibleReplies);
    const hasMoreReplies = replies.length > visibleReplies;
    const remainingReplies = replies.length - visibleReplies;

    // Shared props for recursive children
    const childProps = {
        expanded, setExpanded, viewerAvatarUrl, viewerLabel, eventOwner,
        eventBusinessAccountId, eventArtistAccountId,
        likeComment, submitReply, openFlag, viewerId, onDelete, onTogglePinConfirm, onRequireAuth,
        replyToName: displayName, replyToHandle: displayHandle, replyToAvatar: avatarUrl, onOpenUserCard,
        blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles, highlightedCommentId, onShareComment, newCommentIds,
    };

    // ── Blocked user check ──
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
        const isHighlightedBlocked = highlightedCommentId != null && String(node.id) === String(highlightedCommentId);
        return (
            <>
                <Box id={`comment-${node.id}`} sx={{
                    pl: indentPl,
                    borderLeft: showBorderLeft ? (t) => `2px solid ${alpha(t.palette.text.primary, 0.08)}` : "none",
                    ml: indentMl,
                    ...(isHighlightedBlocked ? {
                        bgcolor: (t) => alpha(t.custom?.brand?.brass || '#A87822', 0.10),
                        borderRadius: 2,
                        transition: 'background-color 0.6s ease',
                    } : {}),
                }}>
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

    // ── Removed comment — hide entirely ──
    if (node.is_removed) {
        return null;
    }

    // ── Normal comment ──
    const commentUserObj = {
        id: node.user_id, handle: displayHandle,
        first_name: displayName, last_name: '',
        profile_picture: commentAccountType === 'business' ? '' : avatarUrl,
        avatar_url: commentAccountType === 'business' ? '' : avatarUrl,
        ...(commentAccountType === 'business' ? {
            account_type: 'business',
            isBusiness: true,
            business_id: node.business_id,
            business_name: node.business_name || displayName,
            business_slug: node.business_slug || displayHandle,
            business_avatar_url: avatarUrl,
        } : {}),
        ...(commentAccountType === 'artist' ? {
            account_type: 'artist',
            isArtist: true,
            artist_id: node.artist_id,
            artist_name: node.artist_name || displayName,
            artist_handle: node.artist_handle || displayHandle,
            artist_avatar_url: avatarUrl,
        } : {}),
    };

    const handleAvatarNameClick = (e) => {
        onOpenUserCard?.(e.currentTarget, commentUserObj);
    };

    const isHighlighted = highlightedCommentId != null && String(node.id) === String(highlightedCommentId);
    const isNewComment = newCommentIds && newCommentIds.has(String(node.id));

    return (
        <>
            <Box
                id={`comment-${node.id}`}
                sx={{
                    pl: indentPl,
                    borderLeft: showBorderLeft ? (t) => `2px solid ${alpha(t.palette.text.primary, 0.08)}` : "none",
                    ml: indentMl,
                    ...(isHighlighted ? {
                        bgcolor: (t) => alpha(t.custom?.brand?.brass || '#A87822', 0.10),
                        borderRadius: 2,
                        transition: (t) => `background-color ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}, box-shadow ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}, border-color ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}`,
                    } : {}),
                    ...(isNewComment ? NEW_COMMENT_FADE_SX : {}),
                }}
            >                <Box
                sx={(t) => ({
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-start",
                    py: 1.25,
                    borderRadius: 2,
                    transition: `background-color ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}, box-shadow ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}, border-color ${t.custom?.motion?.slow || 220}ms ${t.custom?.motion?.ease || 'ease'}`,
                    width: '100%',
                    boxSizing: 'border-box',
                    border: '2px solid transparent',
                    ...(isHighlighted
                        ? {
                            px: 1,
                            backgroundColor: alpha(t.custom?.brand?.brass || '#A87822', 0.14),
                            borderColor: alpha(t.custom?.brand?.brass || '#A87822', 0.50),
                            boxShadow: `0 14px 34px ${alpha(t.custom?.brand?.brass || '#A87822', 0.18)}`,
                        }
                        : null),
                })}
            >
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
                    {/* "Replying to @handle" label for replies — clickable */}
                    {depth > 0 && replyToHandle && (
                        <Typography variant="caption"
                                    sx={{ color: "text.secondary", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}
                        >
                            <Box component="span" sx={{ color: "primary.main" }}>↳</Box>
                            Replying to{" "}
                            <Box
                                component="span"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenUserCard?.(e.currentTarget, {
                                        handle: replyToHandle,
                                        first_name: replyToName?.split(" ")[0],
                                        last_name: replyToName?.split(" ").slice(1).join(" "),
                                        profile_picture: replyToAvatar,
                                        avatar_url: replyToAvatar,
                                    });
                                }}
                                sx={{ color: "primary.main", fontWeight: 700, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                            >
                                @{replyToHandle}
                            </Box>
                        </Typography>
                    )}

                    {/* Name row + menu */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "nowrap" }}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                                <Typography variant="subtitle2"
                                            onClick={handleAvatarNameClick}
                                            sx={{ fontWeight: 700, cursor: "pointer", fontSize: depth >= 2 ? 13 : 14, "&:hover": { textDecoration: "underline" } }}
                                            noWrap
                                >
                                    {displayName}
                                </Typography>
                                {isCommentByOrganizer && (
                                    <Typography variant="caption" color="text.secondary">Author</Typography>
                                )}
                                {isPinned && (
                                    <Chip icon={<PushPinRoundedIcon sx={{ fontSize: 12 }} />} label="Pinned" size="small"
                                          sx={{ height: 22, fontSize: "0.65rem", fontWeight: 600, bgcolor: (t) => alpha(t.palette.warning.main, 0.12), color: "warning.dark", border: "1px solid", borderColor: (t) => alpha(t.palette.warning.main, 0.3), "& .MuiChip-icon": { color: "warning.main" } }}
                                    />
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
                                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', whiteSpace: 'nowrap', fontSize: 11 }}>
                                            {depth > 0 ? 'Reply made by a blocked user' : 'Comment made by a blocked user'}
                                        </Typography>
                                        <Link component="button" type="button" underline="hover"
                                              onClick={(e) => { e.stopPropagation(); setShowBlockedContent(false); }}
                                              sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ml: 0.25 }}>Hide</Link>
                                    </>
                                )}
                            </Box>
                            {displayHandle && (
                                <Typography variant="caption"
                                            onClick={handleAvatarNameClick}
                                            sx={{ color: "text.secondary", fontSize: 11, display: "block", mt: -0.25, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                >
                                    @{displayHandle}
                                </Typography>
                            )}
                        </Box>

                        {/* 3-dot menu */}
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
                                    <IconButton size="small" onClick={openMenu} sx={{ border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.10)}`, bgcolor: "background.paper" }}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                    <SmartMenu anchorEl={menuAnchor} open={menuOpen} onClose={closeMenu}
                                               onClick={(e) => e.stopPropagation()}
                                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                               transformOrigin={{ vertical: "top", horizontal: "right" }}
                                               slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 170, boxShadow: (t) => `0 18px 50px ${alpha(t.palette.text.primary, 0.16)}` } } }}
                                    >
                                        {/* Copy link — always available */}
                                        <MenuItem onClick={(e) => {
                                            closeMenu(e);
                                            const base = window.location.href.split('?')[0].split('#')[0];
                                            const url = `${base}?comment=${node.id}`;
                                            navigator.clipboard.writeText(url).catch(() => {});
                                        }}>
                                            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Copy link" />
                                        </MenuItem>
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

                    {/* Comment text */}
                    <Typography variant="body2"
                                sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.55, fontSize: depth >= 2 ? 13 : 14 }}
                    >
                        {renderCommentText(displayText)}
                    </Typography>
                    {(node.images?.length > 0 || node.image) ? (
                        <CommentImages images={node.images} image={node.image} />
                    ) : null}
                    {needsTruncate && (
                        <Link component="button" type="button" underline="hover" onClick={() => setShowFullText((v) => !v)}
                              sx={{ fontSize: 12, fontWeight: 700, p: 0, mt: 0.25 }}
                        >
                            {showFullText ? "Show less" : "Show more"}
                        </Link>
                    )}

                    {/* Like / Reply row */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.75 }}>
                        <Link component="button" type="button" underline="none"
                              onClick={() => {
                                  if (!viewerId) { onRequireAuth?.(); return; }
                                  likeComment?.(node.id, liked);
                              }}
                              sx={{ fontSize: 13, fontWeight: liked ? 900 : 700, color: liked ? "primary.main" : "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}
                        >
                            {liked ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />} {likes > 0 ? likes : "Like"}
                        </Link>
                        <Link component="button" type="button" underline="none"
                              onClick={() => { if (!viewerId) { onRequireAuth?.(); return; } setShowReplyBox((v) => !v); }}
                              sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}
                        >
                            <ReplyRoundedIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} /> Reply
                        </Link>
                        {onShareComment && (
                            <Link component="button" type="button" underline="none"
                                  onClick={() => onShareComment(node)}
                                  sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}
                            >
                                <ShareOutlinedIcon sx={{ fontSize: 14 }} /> Share
                            </Link>
                        )}
                    </Box>

                    {/* Inline reply composer */}
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
                                           value={replyText} onChange={handleRpMentionChange}
                                           inputRef={rpInputRef}
                                           onKeyDown={handleReplyKeyDown} placeholder={`Reply to ${displayName}...`}
                                           variant="outlined"
                                           disabled={posting}
                                           error={Boolean(replyError)}
                                           helperText={replyError}
                                           sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }}
                                           inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                           InputProps={{
                                               endAdornment: (
                                                   <InputAdornment position="end" sx={{ alignSelf: "flex-end", pb: 0.25 }}>
                                                       <IconButton aria-label="Send reply" onClick={handleReplySubmit}
                                                                   disabled={posting || (!replyText.trim() && replyFiles.length === 0 && replyImageUrls.length === 0)}
                                                                   sx={{ ...SEND_BUTTON_SX, width: 32, height: 32 }}
                                                       >
                                                           {posting ? <CircularProgress size={16} sx={{ color: "common.white" }} /> : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                                                       </IconButton>
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
                                        // Block GIF uploads in comment photos
                                        const gifFile = newFiles.find((f) => f.type === 'image/gif' || f.name?.toLowerCase().endsWith('.gif'));
                                        if (gifFile) {
                                            setReplyError('GIF files cannot be uploaded as comment photos.');
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
                                {rpMentionOpen && renderMentionPopper({ open: rpMentionOpen, anchorEl: rpMentionAnchorEl, results: rpMentionResults, loading: rpMentionLoading, activeIdx: rpMentionActiveIdx, onSelect: insertRpMention, onClose: closeRpMention })}
                            </Box>
                        </Box>
                    )}

                    {/* Show/Hide replies toggle (inside the comment content) */}
                    {hasReplies && !isExpanded && (
                        <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                              sx={{ mt: 0.5, p: 0, display: "inline-flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: "primary.main", textAlign: "left" }}
                        >
                            Show replies ({replies.length})
                        </Link>
                    )}
                    {hasReplies && isExpanded && (
                        <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                              sx={{ mt: 0.5, p: 0, display: "inline-flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: "primary.main", textAlign: "left" }}
                        >
                            Hide replies
                        </Link>
                    )}
                </Box>
            </Box>
            </Box>

            {/* Replies rendered OUTSIDE the indented box so padding doesn't stack */}
            {hasReplies && isExpanded && (
                <Box sx={{ pl: indentPl, ml: indentMl }}>
                    {shownReplies.map((reply) => (
                        <ThreadedCommentItem key={reply.id} node={reply} depth={depth + 1} {...childProps} />
                    ))}
                    {hasMoreReplies && (
                        <Link component="button" type="button" underline="hover"
                              onClick={() => setVisibleReplies((n) => n + INITIAL_REPLIES_SHOWN)}
                              sx={{ mt: 0.75, mb: 0.5, p: 0, fontSize: 13, fontWeight: 700, color: "primary.main", display: "inline-flex", alignItems: "center", gap: 0.5 }}
                        >
                            Show {Math.min(INITIAL_REPLIES_SHOWN, remainingReplies)} more {remainingReplies === 1 ? "reply" : "replies"}
                        </Link>
                    )}
                </Box>
            )}
        </>
    );
}
/* ═══════════════════════════════════════════════════════════════════════════
   Event Comments Section
   ═══════════════════════════════════════════════════════════════════════════ */
// Sort top-level threads (pinned first, then by mode). Returns a new array.
function sortTopLevelThreads(arr, mode) {
    const sorted = [...arr];
    sorted.sort((a, b) => {
        const ap = a.is_pinned ? 1 : 0;
        const bp = b.is_pinned ? 1 : 0;
        if (bp !== ap) return bp - ap;
        if (mode === 'popular') {
            const al = Number(a.likes || 0);
            const bl = Number(b.likes || 0);
            if (bl !== al) return bl - al;
        }
        const ad = new Date(a.created_at || 0).getTime();
        const bd = new Date(b.created_at || 0).getTime();
        return bd - ad;
    });
    return sorted;
}

function EventCommentsSection({
                                  eventId,
                                  user,
                                  eventOwner,
                                  eventBusinessAccountId,
                                  eventArtistAccountId,
                                  onRequireAuth,
                                  onCommentCountChange,
                                  onOpenUserCard,
                                  scrollToCommentId,
                              }) {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [visibleCount, setVisibleCount] = useState(INITIAL_COMMENTS_SHOWN);

    const [commentSort, setCommentSort] = useState('popular');

    // Success toast for comment actions
    const { showSuccess, snackbarProps: commentSuccessSnackbarProps } = useSuccessSnackbar();

    // Track newly added comment IDs for fade-in animation
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());
    const newCommentTimerRef = useRef(0);

    // Share comment dialog state
    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);
    const handleShareComment = useCallback((commentNode) => {
        setShareCommentTarget(commentNode);
        setShareCommentDialogOpen(true);
    }, []);

    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const highlightTimerRef = useRef(0);
    const didScrollToCommentRef = useRef(false);

    // Scroll to and highlight a specific comment after comments load
    useEffect(() => {
        if (!scrollToCommentId || didScrollToCommentRef.current || loading || !threads.length) return;
        didScrollToCommentRef.current = true;

        // Expand all threads so the target comment is visible
        const expandAll = {};
        const walk = (nodes) => {
            for (const n of nodes) {
                if (n.replies?.length) {
                    expandAll[n.id] = true;
                    walk(n.replies);
                }
            }
        };
        walk(threads);
        setExpanded((prev) => ({ ...prev, ...expandAll }));

        // Show all comments so the target isn't beyond the "Show more" cutoff
        setVisibleCount(threads.length + 100);

        // Wait a tick for DOM to update, then scroll
        requestAnimationFrame(() => {
            setTimeout(() => {
                const el = document.getElementById(`comment-${scrollToCommentId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setHighlightedCommentId(String(scrollToCommentId));
                    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                    highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 3000);
                }
            }, 150);
        });
    }, [scrollToCommentId, loading, threads]);

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

    /* ── Comment @mention state ── */
    const [cmMentionOpen, setCmMentionOpen] = useState(false);
    const [cmMentionQuery, setCmMentionQuery] = useState("");
    const [cmMentionResults, setCmMentionResults] = useState([]);
    const [cmMentionLoading, setCmMentionLoading] = useState(false);
    const [cmMentionActiveIdx, setCmMentionActiveIdx] = useState(0);
    const [cmMentionAnchorEl, setCmMentionAnchorEl] = useState(null);
    const cmMentionStartRef = useRef(0);
    const cmMentionEndRef = useRef(0);
    const cmAbortRef = useRef(null);

    const closeCmMention = () => { setCmMentionOpen(false); setCmMentionQuery(""); setCmMentionResults([]); setCmMentionActiveIdx(0); };

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
        setTimeout(() => { const el = commentInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!cmMentionOpen || !cmMentionQuery) { setCmMentionResults([]); return; }
        const timer = setTimeout(async () => {
            if (cmAbortRef.current) cmAbortRef.current.abort();
            const ac = new AbortController(); cmAbortRef.current = ac;
            setCmMentionLoading(true);
            try {
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(cmMentionQuery)}&limit=8`, { credentials: "include", signal: ac.signal });
                const data = await res.json();
                if (!ac.signal.aborted) { setCmMentionResults(Array.isArray(data) ? data : data?.results || []); setCmMentionActiveIdx(0); }
            } catch { /* aborted or failed */ }
            if (!ac.signal.aborted) setCmMentionLoading(false);
        }, 200);
        return () => clearTimeout(timer);
    }, [cmMentionOpen, cmMentionQuery]);

    const handleCmChange = (e) => {
        const val = e.target.value;
        setCommentText(val);
        if (commentError) setCommentError('');
        const el = e.target;
        const m = getMentionMatch(val, el.selectionStart || 0);
        if (m) {
            setCmMentionQuery(m.query); cmMentionStartRef.current = m.start; cmMentionEndRef.current = m.end;
            setCmMentionAnchorEl(getMentionAnchorVirtualEl(el, m.start));
            if (!cmMentionOpen) setCmMentionOpen(true);
        } else { closeCmMention(); }
    };
    const handleCmKeyDown = (e) => {
        if (cmMentionOpen && cmMentionResults.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); setCmMentionActiveIdx((i) => (i + 1) % cmMentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setCmMentionActiveIdx((i) => (i - 1 + cmMentionResults.length) % cmMentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertCmMention(cmMentionResults[cmMentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeCmMention(); return; }
        }
    };
    /* end comment @mention state */

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

    const [deleteConfirm, setDeleteConfirm] = useState({
        open: false,
        commentId: null,
        isReply: false,
    });
    const [pinConfirm, setPinConfirm] = useState({
        open: false,
        commentId: null,
        mode: "pin",
        willReplace: false,
    });
    const [flagState, setFlagState] = useState({ open: false, commentId: null });
    const [flagLoading, setFlagLoading] = useState(false);

    // ── Active account context for commenting under the right identity ──
    const { activeAccount, activeAccountType, getAccountHeaders, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey } = useActiveAccount();

    // parseFreshAccount: reads ll:activeAccount and resolves numeric IDs
    // for business and artist accounts (mirrors EventDetailPanel / AccountContext.deriveAccountFields).
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

    // Build fresh account headers from localStorage to avoid stale closure issues
    const freshAccountHeaders = () => {
        const fa = parseFreshAccount();
        if (!fa) return {};
        if (fa.type === 'business') return { 'x-account-type': 'business', 'x-business-id': String(fa.numericId) };
        if (fa.type === 'artist') return { 'x-account-type': 'artist', 'x-artist-id': String(fa.numericId) };
        return {};
    };

    const viewerId = user?.id || user?.user_id || null;

    // Determine viewer display info based on active account
    // When on a business/artist account, show that account's avatar/name/handle
    const acctType = (activeAccountType || "personal").toLowerCase();
    const isOnBusinessOrArtist = acctType === "business" || acctType === "artist";

    // Fetch active account avatar + profile_type when not in context.
    // For artist accounts ALWAYS fetch so profile_type is authoritative
    // (mirrors ArtistAdminConsole's pattern). Business accounts can
    // short-circuit when the avatar is already populated.
    const [fetchedAccountAvatar, setFetchedAccountAvatar] = useState("");
    const [fetchedAccountProfileType, setFetchedAccountProfileType] = useState("");
    useEffect(() => {
        if (!isOnBusinessOrArtist) {
            setFetchedAccountAvatar("");
            setFetchedAccountProfileType("");
            return;
        }
        const existingAvatar = String(activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || "").trim();
        const hasAvatar = existingAvatar && !isDefaultAvatar(existingAvatar);
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
                const okAv = av && !isDefaultAvatar(av);
                if (okAv) setFetchedAccountAvatar(av);
                if (isArtistAccount) setFetchedAccountProfileType(pt === "artist" ? "artist" : "music");
                // Patch localStorage so Header and other consumers pick up
                // the right values. Overwrite unconditionally so stale
                // cached values get corrected.
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

    // Artist sub-type (musician vs visual artist) for the composer avatar.
    // Fetched value from /api/music/artists/:id is authoritative — mirrors
    // ArtistAdminConsole. Falls back to context, then localStorage.
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
        const first = user?.first_name || user?.firstName || "";
        const last = user?.last_name || user?.lastName || "";
        const full = `${first} ${last}`.trim();
        if (full) return full;
        return user?.name || user?.displayName || user?.display_name || user?.handle || user?.username || "You";
    })();

    const updateCommentInTree = useCallback((currentThreads, commentId, updater) => {
        const updateNode = (n) => {
            if (String(n.id) === String(commentId)) return updater(n);
            if (n.replies && n.replies.length > 0)
                return { ...n, replies: n.replies.map(updateNode) };
            return n;
        };
        return currentThreads.map(updateNode);
    }, []);

    const addReplyToTree = useCallback((currentThreads, parentId, newReply) => {
        const updateNode = (n) => {
            if (String(n.id) === String(parentId)) {
                return {
                    ...n,
                    replies: [...(n.replies || []), newReply],
                    reply_count: (n.reply_count || 0) + 1,
                };
            }
            if (n.replies && n.replies.length > 0)
                return { ...n, replies: n.replies.map(updateNode) };
            return n;
        };
        return currentThreads.map(updateNode);
    }, []);

    const removeCommentFromTree = useCallback((currentThreads, commentId) => {
        const removeRecursive = (nodes) =>
            nodes
                .filter((n) => String(n.id) !== String(commentId))
                .map((n) => ({
                    ...n,
                    replies: n.replies ? removeRecursive(n.replies) : [],
                }));
        return removeRecursive(currentThreads);
    }, []);

    // Fetch comments
    useEffect(() => {
        if (!eventId) return;
        let active = true;

        async function load() {
            setLoading(true);
            try {
                const res = await secureFetch(
                    `/api/events/${encodeURIComponent(eventId)}/comments`,
                    { credentials: "include" }
                );
                if (!res.ok) throw new Error("Failed to load comments");
                const data = await res.json();
                if (!active) return;
                let normalized = normalizeComments(data);

                // ── Enrich comments that have business_id/artist_id but are
                //    missing display fields (backend may not JOIN those tables) ──
                // Collect all business/artist IDs that need enrichment (including in replies)
                // For businesses: backend rejects numeric IDs at /api/business/:slug,
                // so we collect slugs (from account_handle or business_slug) to look up.
                // For artists: /api/music/artists/:id accepts numeric IDs directly.
                const bizSlugsToFetch = new Map();
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

                const bizInfoMap = new Map();
                const artInfoMap = new Map();
                await Promise.all([
                    ...Array.from(bizSlugsToFetch.entries()).slice(0, 20).map(async ([slug, bizId]) => {
                        try {
                            const r = await secureFetch(`/api/business/${encodeURIComponent(slug)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                            if (!r.ok) return;
                            const d = await r.json();
                            bizInfoMap.set(bizId, { business_name: d?.name || '', business_slug: d?.slug || slug, business_avatar_url: d?.avatar_url || d?.logo_url || '' });
                        } catch { /* skip */ }
                    }),
                    ...Array.from(artIdsToFetch).slice(0, 20).map(async (artId) => {
                        try {
                            const r = await secureFetch(`/api/music/artists/${encodeURIComponent(artId)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
                            if (!r.ok) return;
                            const d = await r.json();
                            artInfoMap.set(artId, { artist_name: d?.name || '', artist_handle: d?.handle || '', artist_avatar_url: d?.avatar_url || '' });
                        } catch { /* skip */ }
                    }),
                ]);
                if (!active) return;
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
                        if (enriched.replies?.length) enriched = { ...enriched, replies: enriched.replies.map(enrichNode) };
                        return enriched;
                    };
                    normalized = normalized.map(enrichNode);
                }

                setThreads(normalized);
                onCommentCountChange?.(normalized.length);
            } catch {
                // ignore
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
        return () => {
            active = false;
        };
    }, [eventId, onCommentCountChange]);

    // Re-derive display order when threads, sort mode, or new comment IDs change
    // New comments are boosted to the top (like PostPage) so they appear immediately
    const displayThreadsSorted = useMemo(() => {
        const arr = [...threads];
        arr.sort((a, b) => {
            const ap = a.is_pinned ? 1 : 0;
            const bp = b.is_pinned ? 1 : 0;
            if (bp !== ap) return bp - ap;
            // Boost newly added comments to the top
            if (newCommentIds && newCommentIds.size > 0) {
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

    // Reset visible count when sort mode changes
    useEffect(() => {
        setVisibleCount(INITIAL_COMMENTS_SHOWN);
    }, [commentSort]);

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
        // (mirrors EventDetailPanel pattern)
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
            images: [
                ...commentImageUrls,
                ...commentFiles.map((f) => URL.createObjectURL(f)),
            ],
        };

        setThreads((prev) => {
            const next = [optimisticComment, ...prev];
            onCommentCountChange?.(next.length);
            return next;
        });
        // Inject fade keyframes into <head> and track for animation
        ensureCommentFadeKeyframes();
        setNewCommentIds((prev) => new Set(prev).add(String(optimisticComment.id)));
        // Clear the fade-in flag after animation completes
        if (newCommentTimerRef.current) clearTimeout(newCommentTimerRef.current);
        newCommentTimerRef.current = setTimeout(() => setNewCommentIds(new Set()), 2000);
        recordComment();
        setCommentText("");
        setCommentFiles([]);
        setCommentImageUrls([]);

        try {
            const acctHdrs = freshAccountHeaders();
            const commentPayload = { content: textToSubmit };

            // Upload local files to GCS first, then merge with any existing GIF URLs
            let allImageUrls = [...commentImageUrls];
            if (commentFiles.length > 0) {
                const uploadedUrls = await uploadFilesToGCS(commentFiles);
                allImageUrls = [...allImageUrls, ...uploadedUrls];
            }
            if (allImageUrls.length > 0) {
                commentPayload.image_urls = allImageUrls;
            }

            // Update optimistic comment images with final GCS URLs
            if (allImageUrls.length > 0) {
                setThreads((prev) =>
                    prev.map((c) =>
                        c.id === optimisticComment.id ? { ...c, images: allImageUrls } : c
                    )
                );
            }

            const res = await secureFetch(
                `/api/events/${encodeURIComponent(eventId)}/comments`,
                { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...acctHdrs }, body: JSON.stringify(commentPayload) }
            );
            if (res.ok) {
                const newComment = await res.json();
                const normalized = normalizeComments([newComment])[0];
                if (normalized) {
                    // In-place swap: update the optimistic comment with server data
                    // but keep the optimistic ID so newCommentIds stays stable and
                    // doesn't restart the CSS fade-in animation.
                    // The timer at 2s will clean up newCommentIds.
                    setThreads((prev) =>
                        prev.map((c) =>
                            c.id === optimisticComment.id ? { ...normalized, id: optimisticComment.id } : c
                        )
                    );
                }
            } else {
                setNewCommentIds((prev) => { const next = new Set(prev); next.delete(String(optimisticComment.id)); return next; });
                setThreads((prev) => {
                    const next = prev.filter((c) => c.id !== optimisticComment.id);
                    onCommentCountChange?.(next.length);
                    return next;
                });
            }
        } catch {
            setNewCommentIds((prev) => { const next = new Set(prev); next.delete(String(optimisticComment.id)); return next; });
            setThreads((prev) => {
                const next = prev.filter((c) => c.id !== optimisticComment.id);
                onCommentCountChange?.(next.length);
                return next;
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

        // Read active account fresh from localStorage (mirrors submitComment)
        const fa = parseFreshAccount();
        const fIsBiz = fa?.type === 'business';
        const fIsArt = fa?.type === 'artist';
        const faId = fa?.numericId || null;

        const userId = user?.id || user?.user_id || null;

        const freshHandle = fIsBiz
            ? (fa.slug || fa.handle || '')
            : fIsArt
                ? (fa.slug || fa.handle || '')
                : '';

        let displayFirstName = "";
        let displayLastName = "";
        let displayAvatar = viewerAvatarUrl;
        let displayHandleReply = freshHandle || viewerHandle;

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

            if (!displayFirstName && !displayLastName && displayHandleReply) {
                displayFirstName = displayHandleReply;
            }
        }

        const optimisticReply = {
            id: `temp_reply_${Date.now()}`,
            parentId: parentId,
            user_id: userId,
            public_id: user.public_id,
            text: text,
            first_name: displayFirstName,
            last_name: displayLastName,
            handle: displayHandleReply,
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
            images: [
                ...replyUrlList,
                ...replyFileList.map((f) => URL.createObjectURL(f)),
            ],
        };

        setThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        recordComment();

        try {
            const acctHdrs = freshAccountHeaders();
            const replyPayload = { content: text, parent_id: parentId };

            // Upload local files to GCS first, then merge with any existing GIF URLs
            let allImageUrls = [...replyUrlList];
            if (replyFileList.length > 0) {
                const uploadedUrls = await uploadFilesToGCS(replyFileList);
                allImageUrls = [...allImageUrls, ...uploadedUrls];
            }
            if (allImageUrls.length > 0) {
                replyPayload.image_urls = allImageUrls;
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

            const res = await secureFetch(
                `/api/events/${encodeURIComponent(eventId)}/comments`,
                { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...acctHdrs }, body: JSON.stringify(replyPayload) }
            );
            if (res.ok) {
                const newReply = await res.json();
                const normalized = normalizeComments([newReply])[0];
                if (normalized) {
                    setThreads((prev) => {
                        const withoutOptimistic = removeCommentFromTree(prev, optimisticReply.id);
                        return addReplyToTree(withoutOptimistic, parentId, normalized);
                    });
                }
            } else {
                setThreads((prev) =>
                    removeCommentFromTree(prev, optimisticReply.id)
                );
            }
        } catch {
            setThreads((prev) =>
                removeCommentFromTree(prev, optimisticReply.id)
            );
        }
    };

    const likeComment = async (commentId, currentlyLiked) => {
        if (!user) {
            onRequireAuth?.();
            return;
        }

        const isLikerEventOwner = viewerId != null && eventOwner?.id != null && String(viewerId) === String(eventOwner.id);

        // Optimistic update via the threads tree (syncs to local state via useEffect)
        setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
            ...node,
            viewer_liked: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, node.likes - 1) : node.likes + 1,
            ...(isLikerEventOwner ? { liked_by_author: !currentlyLiked } : {}),
        })));

        try {
            const method = currentlyLiked ? "DELETE" : "POST";
            // Build account headers inline to ensure fresh values
            const acctHeaders = (() => {
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    if (!raw) return {};
                    const parsed = JSON.parse(raw);
                    const t = String(parsed?.type || '').toLowerCase();
                    if (t === 'business' && parsed?.id) return { 'x-account-type': 'business', 'x-business-id': String(parsed.id) };
                    if (t === 'artist' && parsed?.id) return { 'x-account-type': 'artist', 'x-artist-id': String(parsed.id) };
                    return {};
                } catch { return {}; }
            })();
            const res = await secureFetch(
                `/api/events/comments/${encodeURIComponent(commentId)}/like`,
                { method, credentials: "include", headers: { ...acctHeaders } }
            );
            if (!res.ok) {
                // Revert on failure
                setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                    ...node,
                    viewer_liked: currentlyLiked,
                    likes: currentlyLiked ? node.likes + 1 : Math.max(0, node.likes - 1),
                    ...(isLikerEventOwner ? { liked_by_author: currentlyLiked } : {}),
                })));
            }
        } catch {
            // Revert on failure
            setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                ...node,
                viewer_liked: currentlyLiked,
                likes: currentlyLiked ? node.likes + 1 : Math.max(0, node.likes - 1),
                ...(isLikerEventOwner ? { liked_by_author: currentlyLiked } : {}),
            })));
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
            const res = await secureFetch(
                `/api/events/comments/${encodeURIComponent(commentId)}`,
                { method: "DELETE", credentials: "include", headers: { ...freshAccountHeaders() } }
            );
            if (!res.ok) {
                // Revert on failure
                setThreads(previousThreads);
                onCommentCountChange?.(previousThreads.length);
            }
        } catch {
            // Revert on failure
            setThreads(previousThreads);
            onCommentCountChange?.(previousThreads.length);
        }
    };

    const togglePin = async (commentId, isCurrentlyPinned) => {
        if (!user) return;

        // Store current state for potential rollback
        const previousThreads = threads;

        // Optimistically update pin status
        setThreads((prev) => {
            let updated = prev.map((n) => ({
                ...n,
                is_pinned: !isCurrentlyPinned && String(n.id) === String(commentId)
                    ? true
                    : String(n.id) === String(commentId)
                        ? !n.is_pinned
                        : !isCurrentlyPinned ? false : n.is_pinned,
            }));
            updated.sort((a, b) => {
                const ap = a.is_pinned ? 1 : 0;
                const bp = b.is_pinned ? 1 : 0;
                if (bp !== ap) return bp - ap;
                return 0;
            });
            return updated;
        });

        const action = isCurrentlyPinned ? "unpin" : "pin";
        try {
            const res = await secureFetch(
                `/api/events/comments/${encodeURIComponent(commentId)}/${action}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { ...freshAccountHeaders() },
                }
            );
            if (!res.ok) {
                // Revert on failure
                setThreads(previousThreads);
            }
        } catch {
            // Revert on failure
            setThreads(previousThreads);
        }
    };

    const flagComment = async (commentId, reason, details) => {
        if (!user) return;
        setFlagLoading(true);

        // Optimistically update the flagged state
        setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
            ...node,
            viewer_flagged: true,
        })));

        try {
            const res = await secureFetch(
                `/api/events/comments/${encodeURIComponent(commentId)}/flag`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json", ...freshAccountHeaders() },
                    body: JSON.stringify({ reason, details }),
                }
            );
            if (res.ok) {
                setFlagState({ open: false, commentId: null });
            } else {
                // Revert on failure
                setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                    ...node,
                    viewer_flagged: false,
                })));
            }
        } catch {
            // Revert on failure
            setThreads((prev) => updateCommentInTree(prev, commentId, (node) => ({
                ...node,
                viewer_flagged: false,
            })));
        } finally {
            setFlagLoading(false);
        }
    };

    const requestDelete = (commentId, isReply) => {
        setDeleteConfirm({ open: true, commentId, isReply });
    };

    const pinnedTopLevel = threads.find((t) => Boolean(t.is_pinned)) || null;
    const pinnedTopLevelId = pinnedTopLevel?.id != null ? String(pinnedTopLevel.id) : null;

    const requestTogglePinConfirm = (commentId, isCurrentlyPinned) => {
        if (!user) {
            onRequireAuth?.();
            return;
        }
        togglePin(commentId, isCurrentlyPinned);
    };

    const visible = displayThreadsSorted.slice(0, visibleCount);
    const hasMore = displayThreadsSorted.length > visibleCount;

    const handleCommentKeyDown = (e) => {
        handleCmKeyDown(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitComment();
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Comments
                </Typography>
                {displayThreadsSorted.length > 1 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Chip label="Newest" size="small"
                              variant={commentSort === 'newest' ? 'filled' : 'outlined'}
                              color={commentSort === 'newest' ? 'primary' : 'default'}
                              onClick={() => setCommentSort('newest')}
                              sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', borderRadius: 999 }}
                        />
                        <Chip label="Popular" size="small"
                              variant={commentSort === 'popular' ? 'filled' : 'outlined'}
                              color={commentSort === 'popular' ? 'primary' : 'default'}
                              onClick={() => setCommentSort('popular')}
                              sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', borderRadius: 999 }}
                        />
                    </Box>
                )}
            </Box>

            {/* Comment composer */}
            {user ? (
                <Box
                    id="event-comments-composer"
                    sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "flex-start",
                        mb: 2.5,
                    }}
                >
                    <AccountAvatar
                        src={viewerAvatarUrl}
                        alt={viewerLabel}
                        accountType={isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : 'user'}
                        profileType={isArtistAccount ? viewerProfileType : undefined}
                        size={36}
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
                            onKeyDown={handleCommentKeyDown}
                            label={`Leave a comment as ${viewerLabel}`}
                            placeholder="Write your comment…"
                            variant="outlined"
                            disabled={posting}
                            error={Boolean(commentError)}
                            helperText={commentError}
                            sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: { xs: 13, sm: 14 } },
                                "& .MuiInputLabel-root": { fontWeight: 700, fontSize: { xs: 12, sm: 14 } },
                                "& .MuiInputLabel-shrink": { fontSize: { xs: 13, sm: 14 } },
                            }}
                            inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                            InputProps={{
                                endAdornment: (commentText.trim() || commentFiles.length > 0 || commentImageUrls.length > 0) ? (
                                    <InputAdornment
                                        position="end"
                                        sx={{ alignSelf: "flex-end", pb: 0.25 }}
                                    >
                                        <IconButton
                                            aria-label="Send comment"
                                            onClick={submitComment}
                                            disabled={posting || (!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0)}
                                            sx={SEND_BUTTON_SX}
                                        >
                                            {posting ? (
                                                <CircularProgress
                                                    size={16}
                                                    sx={{ color: "inherit" }}
                                                />
                                            ) : (
                                                <ArrowForwardRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                        {/* Image + GIF attachment toolbar & previews */}
                        <CommentImageAttachments
                            files={commentFiles}
                            urls={commentImageUrls}
                            onFilesChange={async (newFiles) => {
                                if (commentError) setCommentError('');
                                // Block GIF uploads in comment photos
                                const gifFile = newFiles.find((f) => f.type === 'image/gif' || f.name?.toLowerCase().endsWith('.gif'));
                                if (gifFile) {
                                    setCommentError('GIF files cannot be uploaded as comment photos.');
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
                        {cmMentionOpen && renderMentionPopper({ open: cmMentionOpen, anchorEl: cmMentionAnchorEl, results: cmMentionResults, loading: cmMentionLoading, activeIdx: cmMentionActiveIdx, onSelect: insertCmMention, onClose: closeCmMention })}
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={(t) => ({
                        p: 2,
                        mb: 2.5,
                        borderRadius: 2.5,
                        bgcolor: alpha(t.palette.info.main, 0.08),
                        border: "1px solid",
                        borderColor: alpha(t.palette.info.main, 0.2),
                        textAlign: "center",
                    })}
                >
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                        Log in to join the conversation.
                    </Typography>
                </Box>
            )}

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={28} />
                </Box>
            )}

            {!loading && threads.length === 0 && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                        No comments yet. Be the first to comment!
                    </Typography>
                </Box>
            )}

            {!loading &&
                visible.map((node) => (
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
                        openFlag={(id) =>
                            setFlagState({ open: true, commentId: id })
                        }
                        viewerId={viewerId}
                        onDelete={requestDelete}
                        onTogglePinConfirm={requestTogglePinConfirm}
                        onRequireAuth={onRequireAuth}
                        onOpenUserCard={onOpenUserCard}
                        blockedUserIds={blockedUserIds}
                        blockedBusinessIds={blockedBusinessIds}
                        blockedArtistIds={blockedArtistIds}
                        blockedHandles={blockedHandles}
                        highlightedCommentId={highlightedCommentId}
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

            {/* Delete Confirm Dialog */}
            <Dialog
                open={deleteConfirm.open}
                onClose={() =>
                    setDeleteConfirm({ open: false, commentId: null, isReply: false })
                }
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    Delete {deleteConfirm.isReply ? "Reply" : "Comment"}?
                    <IconButton
                        size="small"
                        onClick={() =>
                            setDeleteConfirm({
                                open: false,
                                commentId: null,
                                isReply: false,
                            })
                        }
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() =>
                            setDeleteConfirm({
                                open: false,
                                commentId: null,
                                isReply: false,
                            })
                        }
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            const wasReply = deleteConfirm.isReply;
                            deleteComment(deleteConfirm.commentId);
                            setDeleteConfirm({
                                open: false,
                                commentId: null,
                                isReply: false,
                            });
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
                onSubmit={({ reason, details }) =>
                    flagComment(flagState.commentId, reason, details)
                }
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
            />
            <SuccessSnackbar {...commentSuccessSnackbarProps} />

            {/* Rate limit dialog for comments */}
            <RateLimitDialog
                open={commentRateLimitOpen}
                onClose={() => setCommentRateLimitOpen(false)}
                retryAfterSec={commentRateLimitInfo.retryAfterSec}
                reason={commentRateLimitInfo.reason}
                actionLabel="comments"
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
            sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
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
   Event Edit History Dialog (EventPostPage version)
   ───────────────────────────────────────────────────────────────────────────── */

function formatHistoryDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function fmtHTime(raw) {
    if (!raw) return "";
    const [hh, mm] = String(raw).split(":").map(Number);
    if (!Number.isFinite(hh)) return String(raw);
    const h = hh % 12 || 12;
    return `${h}:${String(mm || 0).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
}

function fmtHDateOnly(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw).slice(0, 10);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

const PP_CAT = { "music-nightlife": "Concerts", "arts-culture": "Arts & Culture", "food-drink": "Food & Drink", "community-social": "Community & Social", "family-kids": "Family & Kids", "sports-recreation": "Sports & Recreation", "outdoors-nature": "Outdoors & Nature", "education-workshops": "Education & Workshops", "business-networking": "Business & Networking", "health-wellness": "Health & Wellness", "faith-spiritual": "Faith & Spiritual", "volunteer-fundraising": "Volunteer & Fundraising", "government-civic": "Government & Civic", "markets-shopping": "Markets & Shopping", "holidays-seasonal": "Holidays & Seasonal", other: "Other" };
function ppCatLabel(slug) { return PP_CAT[slug] || slug || ""; }
function ppScopeLabel(scope) { if (scope === "statewide") return "Alabama (Statewide)"; if (scope === "county") return "County-wide"; return scope || ""; }

function buildPPDiffs(prevSnap, snap) {
    const items = [];
    const s = (v) => (v == null ? "" : String(v).trim());
    if (s(snap.title) !== s(prevSnap.title)) items.push({ label: "Title", from: s(prevSnap.title) || "(empty)", to: s(snap.title) || "(empty)" });
    if (s(snap.category) !== s(prevSnap.category)) items.push({ label: "Category", from: ppCatLabel(s(prevSnap.category)) || "(none)", to: ppCatLabel(s(snap.category)) || "(none)" });
    if (s(snap.subcategory) !== s(prevSnap.subcategory)) items.push({ label: "Subcategory", from: s(prevSnap.subcategory) || "(none)", to: s(snap.subcategory) || "(none)" });
    if (s(snap.description) !== s(prevSnap.description)) items.push({ label: "Description", changed: true });
    if (s(snap.venue_name) !== s(prevSnap.venue_name)) items.push({ label: "Venue", from: s(prevSnap.venue_name) || "(none)", to: s(snap.venue_name) || "(none)" });
    if (s(snap.venue_address) !== s(prevSnap.venue_address)) items.push({ label: "Venue address", from: s(prevSnap.venue_address) || "(none)", to: s(snap.venue_address) || "(none)" });
    if (s(snap.address) !== s(prevSnap.address)) items.push({ label: "Address", from: s(prevSnap.address) || "(none)", to: s(snap.address) || "(none)" });
    if (s(snap.location_scope) !== s(prevSnap.location_scope)) items.push({ label: "Location scope", from: ppScopeLabel(s(prevSnap.location_scope)) || "(none)", to: ppScopeLabel(s(snap.location_scope)) || "(none)" });
    if (s(snap.city) !== s(prevSnap.city)) items.push({ label: "City", from: s(prevSnap.city) || "(none)", to: s(snap.city) || "(none)" });
    if (s(snap.county) !== s(prevSnap.county)) items.push({ label: "County", from: s(prevSnap.county) || "(none)", to: s(snap.county) || "(none)" });
    if (s(snap.timezone) !== s(prevSnap.timezone)) items.push({ label: "Timezone", from: s(prevSnap.timezone) || "(none)", to: s(snap.timezone) || "(none)" });
    if (s(snap.start_at) !== s(prevSnap.start_at)) items.push({ label: "Start date", from: fmtHDateOnly(prevSnap.start_at) || "(none)", to: fmtHDateOnly(snap.start_at) || "(none)" });
    if (s(snap.start_time) !== s(prevSnap.start_time)) items.push({ label: "Start time", from: fmtHTime(prevSnap.start_time) || "(none)", to: fmtHTime(snap.start_time) || "(none)" });
    if (s(snap.end_at) !== s(prevSnap.end_at)) items.push({ label: "End date", from: fmtHDateOnly(prevSnap.end_at) || "(none)", to: fmtHDateOnly(snap.end_at) || "(none)" });
    if (s(snap.end_time) !== s(prevSnap.end_time)) items.push({ label: "End time", from: fmtHTime(prevSnap.end_time) || "(none)", to: fmtHTime(snap.end_time) || "(none)" });
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

function PPDiffChip({ label, from, to, changed, detail, photoAdded, photoRemoved }) {
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

function EventPostEditHistoryDialog({ open, onClose, rows, loading, error, currentEvent }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { position: "relative" } }} onClick={(e) => e.stopPropagation()}>
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
                                    diffItems = buildPPDiffs(snap, liveSnap);
                                } else {
                                    const prevSnap = rows[idx + 1]?.snapshot || {};
                                    diffItems = buildPPDiffs(prevSnap, snap);
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
                                            {diffItems.map((item, i) => <PPDiffChip key={i} {...item} />)}
                                        </Box>
                                    )}
                                    {!isOriginal && diffItems.length === 0 && <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", pl: 0.5 }}>Event details updated</Typography>}
                                    {isOriginal && (
                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: "1px solid", borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.primary", mb: 0.25 }}>{toStr(snap.title)}</Typography>}
                                            <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.4 }}>{[ppCatLabel(snap.category), snap.city || snap.county || ppScopeLabel(snap.location_scope), snap.venue_name].filter(Boolean).join(" · ") || "Original event created"}</Typography>
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: EventPostPage — full-page dedicated event view
   ═══════════════════════════════════════════════════════════════════════════ */
function EventPostPage({ user: propUser }) {
    const params = useParams();
    const location = useLocation();
    // Support ?comment=ID deep links (from copy-link and share dialogs)
    const _urlCommentId = useMemo(() => {
        try {
            const sp = new URLSearchParams(location?.search || '');
            return sp.get('comment') || null;
        } catch { return null; }
    }, [location?.search]);
    const navigate = useNavigate();
    const authCtx = useAuth();
    const chromeTop = useChromeTop();

    // ── Listen for auth:token-expired from secureFetch / axiosInstance ──
    useEffect(() => {
        const handleTokenExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    const eventId =
        params?.eventId ?? params?.id ?? params?.event_id ?? null;

    const stateEvent = location?.state?.event || null;
    const fromEvents = Boolean(location?.state?.fromEvents);
    const fromNotifications = Boolean(location?.state?.fromNotifications);
    const fromBusiness = location?.state?.fromBusiness || null;
    const fromArtist = location?.state?.fromArtist || null;
    const fromProfile = location?.state?.fromProfile || null;
    const backProfileName = location?.state?.backProfileName || '';
    const backToProfileUrl = location?.state?.backToProfileUrl || '';
    const backProfileHandle = location?.state?.backProfileHandle || '';
    const scrollToCommentId = location?.state?.scrollToCommentId ?? location?.state?.highlightCommentId ?? _urlCommentId ?? null;

    const [event, setEvent] = useState(stateEvent);
    const [isLoading, setIsLoading] = useState(!stateEvent);
    const [error, setError] = useState("");
    const [rawLoadError, setRawLoadError] = useState(null);

    // Engagement state
    const [hasRsvpd, setHasRsvpd] = useState(false);
    const [isInterested, setIsInterested] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [hasReposted, setHasReposted] = useState(false);
    const [rsvpCount, setRsvpCount] = useState(0);
    const [interestedCount, setInterestedCount] = useState(0);
    const [likeCount, setLikeCount] = useState(0);
    const [repostCount, setRepostCount] = useState(0);
    const [shareCount, setShareCount] = useState(0);
    const [commentCount, setCommentCount] = useState(0);

    const [engBusy, setEngBusy] = useState("");

    // Description expand
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [needsDescTruncate, setNeedsDescTruncate] = useState(false);
    const descriptionRef = useRef(null);

    // User card popover
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
    const [popoverUser, setPopoverUser] = useState(null);

    // Snackbar
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [errorSnackbar, setErrorSnackbar] = useState("");

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

    // 3-dot event menu
    const [eventMenuAnchor, setEventMenuAnchor] = useState(null);
    const eventMenuOpen = Boolean(eventMenuAnchor);
    const [eventDeleteOpen, setEventDeleteOpen] = useState(false);
    const [eventDeleting, setEventDeleting] = useState(false);
    const [eventReportOpen, setEventReportOpen] = useState(false);
    const [eventReportReason, setEventReportReason] = useState("");
    const [eventReportDetails, setEventReportDetails] = useState("");
    const [eventReportSubmitted, setEventReportSubmitted] = useState(false);
    const [eventReportSubmitting, setEventReportSubmitting] = useState(false);

    // Edit-limit state (5 edits per 24h window)
    const [editLimitReached, setEditLimitReached] = useState(false);
    const [editLimitMsg, setEditLimitMsg] = useState("");
    const [editLimitLoading, setEditLimitLoading] = useState(false);
    const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false);

    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Fade-in
    const [pageVisible, setPageVisible] = useState(false);

    const user = propUser || authCtx?.user || null;
    const canEngage = Boolean(user);

    // ── Blocked / hidden post gate ──
    const gate = useBlockedPostGate({ post: event, user, contentType: 'event' });

    // ── Active account context for ownership detection ──
    const { activeAccount, activeAccountType } = useActiveAccount();

    // Stable key for re-fetch when account changes
    const accountKey = `${activeAccountType || 'personal'}-${activeAccount?.id || 0}`;

    const onRequireAuth = useCallback((e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        try {
            if (authCtx && typeof authCtx.open === 'function') authCtx.open();
            else if (authCtx?.openLoginModal) authCtx.openLoginModal();
            else if (authCtx?.openLoginPopup) authCtx.openLoginPopup();
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
    }, [authCtx]);

    // Navigate back — the business page saved scroll position to sessionStorage
    // before navigating here, so we just go back to the business profile.
    const handleBack = useCallback(() => {
        if (fromProfile && backToProfileUrl) {
            // Returning to a user profile — set restore flags so their scroll is preserved
            try {
                const rawKey = backProfileHandle || backToProfileUrl.replace(/^\//, '');
                const norm = String(rawKey || '').replace(/^@/, '').trim();
                [rawKey, norm, norm ? `@${norm}` : ''].filter(Boolean).forEach((k) => {
                    sessionStorage.setItem(`ll:profile:${k}:restore`, '1');
                });
            } catch {
                /* ignore */
            }
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate(backToProfileUrl, { state: { restoreProfile: true } });
            }
        } else if (fromArtist?.handle || fromArtist?.id) {
            // Returning to an artist profile — set restore flag so scroll is preserved
            const key = fromArtist.handle || fromArtist.id;
            try {
                sessionStorage.setItem(`ll:artistProfile:${key}:restore`, '1');
            } catch {
                /* ignore */
            }
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate(`/${fromArtist.handle || fromArtist.id}`);
            }
        } else if (fromBusiness?.slug) {
            // Returning to a business profile — set restore flag so scroll/tab is preserved
            try {
                sessionStorage.setItem('ll:businessScrollRestore', JSON.stringify({
                    slug: fromBusiness.slug,
                    tab: fromBusiness._savedTab ?? undefined,
                    eventSubTab: fromBusiness._savedEventSubTab ?? undefined,
                    ts: Date.now(),
                }));
            } catch { /* ignore */ }
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate(`/${fromBusiness.slug}`);
            }
        } else if (fromEvents) {
            try { sessionStorage.setItem("ll:events:returnEventId", String(event?.id || eventId || "")); } catch {}
            navigate(-1);
        } else {
            try { sessionStorage.setItem("ll:events:returnEventId", String(event?.id || eventId || "")); } catch {}
            navigate("/events", { state: { fromEventPost: true } });
        }
    }, [fromEvents, fromBusiness, fromArtist, fromProfile, backToProfileUrl, backProfileHandle, navigate, event, eventId]);

    const backLabel = fromProfile && backProfileName
        ? `Return to ${backProfileName}'s Profile`
        : fromArtist?.name
            ? `Back to ${fromArtist.name}'s Profile`
            : fromBusiness?.name
                ? `Back to ${fromBusiness.name}'s Events`
                : 'Back to Events';

    // Handle comment count changes
    const handleCommentCountChange = useCallback(
        (newCount) => {
            setCommentCount(newCount);
        },
        []
    );

    // Check description truncation
    useEffect(() => {
        if (descriptionRef.current) {
            const el = descriptionRef.current;
            const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
            const maxHeight = lineHeight * DESCRIPTION_PREVIEW_LINES;
            setNeedsDescTruncate(el.scrollHeight > maxHeight + 5);
        }
    }, [event?.description]);

    // Load full event
    useEffect(() => {
        let active = true;

        async function loadEvent() {
            if (!eventId) return;

            setIsLoading(true);
            setError("");
            setRawLoadError(null);

            try {
                const data = await fetchEventById(eventId);
                if (!active) return;

                setEvent(data);

                const counts = data?.engagement?.counts || {};
                setRsvpCount(Number(counts.rsvp || 0));
                setInterestedCount(Number(counts.interested || 0));
                setLikeCount(Number(counts.like || 0));
                setShareCount(Number(counts.share || 0));
                setRepostCount(Number(counts.repost || 0));
                setCommentCount(Number(data?.commentCount || 0));

                const viewerEng = data?.viewerEngagement || {};
                setHasRsvpd(Boolean(viewerEng.rsvp));
                setIsInterested(Boolean(viewerEng.interested));
                setHasLiked(Boolean(viewerEng.like));
                setHasReposted(Boolean(viewerEng.repost));
            } catch (err) {
                if (!active) return;
                setRawLoadError(err);
                setError(err?.message || "Failed to load event");
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadEvent();
        return () => {
            active = false;
        };
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

    // ── Blocked/hidden organizer check ──
    // Handled by useBlockedPostGate hook + <BlockedPostGate> gate screen.
    // The gate shows a "View Anyway" option instead of silently redirecting.

    const handleEngage = useCallback(
        async (type) => {
            if (!eventId) return;
            if (!canEngage) {
                onRequireAuth();
                return;
            }

            setEngBusy(type);

            // Optimistic
            if (type === "rsvp") {
                const next = !hasRsvpd;
                setHasRsvpd(next);
                setRsvpCount((c) => Math.max(0, c + (next ? 1 : -1)));
            } else if (type === "interested") {
                const next = !isInterested;
                setIsInterested(next);
                setInterestedCount((c) => Math.max(0, c + (next ? 1 : -1)));
            } else if (type === "like") {
                const next = !hasLiked;
                setHasLiked(next);
                setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
            } else if (type === "repost") {
                const next = !hasReposted;
                setHasReposted(next);
                setRepostCount((c) => Math.max(0, c + (next ? 1 : -1)));
            }

            try {
                const result = await updateEventEngagement(eventId, {
                    type,
                    action: "toggle",
                });
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
            } catch {
                // Revert silently
            } finally {
                setEngBusy("");
            }
        },
        [eventId, canEngage, hasRsvpd, isInterested, hasLiked, hasReposted, onRequireAuth]
    );

    const handleShare = useCallback(() => {
        if (!eventId) return;
        setShareDialogOpen(true);
    }, [eventId]);

    const handleShareCompleted = useCallback(() => {
        setShareCount((c) => c + 1);
    }, []);

    // 3-dot event menu handlers
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
    const handleEventMenuClose = (e) => {
        if (e) e.stopPropagation();
        setEventMenuAnchor(null);
    };
    const handleEventMenuCopyLink = (e) => {
        handleEventMenuClose(e);
        const url = `${window.location.origin}/events/${eventId}`;
        navigator.clipboard.writeText(url).then(() => {
            showSuccess("Link copied to clipboard");
        }).catch(() => {
            // ignore
        });
    };
    const handleEventEdit = () => {
        handleEventMenuClose();
        if (editLimitReached) {
            setEditLimitDialogOpen(true);
            return;
        }
        if (isOnCorrectAccount) {
            setEditModalOpen(true);
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
                showSuccess("Event deleted.");
                window.dispatchEvent(new CustomEvent("ll:event:deleted", { detail: { eventId } }));
                try { sessionStorage.setItem('ll:events:eventDeletedSuccess', '1'); } catch {}
                navigate("/events");
            } else {
                setErrorSnackbar("Could not delete event.");
                setTimeout(() => setErrorSnackbar(""), 2500);
            }
        } catch {
            setErrorSnackbar("Could not delete event.");
            setTimeout(() => setErrorSnackbar(""), 2500);
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
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
            if (!res.ok) { setErrorSnackbar("Could not send report."); setTimeout(() => setErrorSnackbar(""), 2500); }
        } catch {
            setErrorSnackbar("Could not send report.");
            setTimeout(() => setErrorSnackbar(""), 2500);
        }
    };

    const handleOrganizerClick = (e) => {
        setPopoverAnchorEl(e.currentTarget);
        setPopoverUser({
            id: organizerId,
            handle: organizerHandle,
            first_name: organizer?.firstName || organizer?.first_name,
            last_name: organizer?.lastName || organizer?.last_name,
            profile_picture: organizerAvatar,
            avatar_url: organizerAvatar,
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
        setPopoverUser({
            id: commentUser?.id || commentUser?.user_id,
            handle: commentUser?.handle,
            first_name: commentUser?.first_name,
            last_name: commentUser?.last_name,
            profile_picture: commentUser?.avatar || commentUser?.avatar_url || commentUser?.profile_picture,
            avatar_url: commentUser?.avatar || commentUser?.avatar_url || commentUser?.profile_picture,
            ...(commentUser?.account_type === 'business' ? {
                account_type: 'business',
                business_id: commentUser.business_id,
                business_name: commentUser.business_name,
                business_slug: commentUser.business_slug,
                business_avatar_url: commentUser.business_avatar_url,
            } : {}),
            ...(commentUser?.account_type === 'artist' ? {
                account_type: 'artist',
                artist_id: commentUser.artist_id,
                artist_name: commentUser.artist_name,
                artist_handle: commentUser.artist_handle,
                artist_avatar_url: commentUser.artist_avatar_url,
            } : {}),
        });
    }, []);

    const handlePopoverClose = () => {
        setPopoverAnchorEl(null);
        setPopoverUser(null);
    };

    // Derived
    const photos = useMemo(() => getEventPhotos(event), [event]);
    const categoryInfo = useMemo(() => getCategoryInfo(event), [event]);
    const coverPhoto = photos.length > 0 ? photos[0] : null;

    const organizer = event?.organizer || {};
    const organizerId = organizer?.id || organizer?.user_id;
    const organizerName =
        `${toStr(organizer?.firstName || organizer?.first_name)} ${toStr(organizer?.lastName || organizer?.last_name)}`.trim() ||
        "Organizer";
    const organizerHandle = organizer?.handle;
    const organizerAvatarPlaceholder = ""; // resolved below after isBusinessEvent / isArtistEvent

    // ── Ownership detection (mirrors EventCard / EventDetailPanel pattern) ──
    const eventBusinessAccountId = event?.business_account_id || event?.businessAccountId || null;
    const isBusinessEvent = Boolean(eventBusinessAccountId);
    const eventArtistAccountId = event?.artist_account_id || event?.artistAccountId || null;
    const isArtistEvent = Boolean(eventArtistAccountId);
    // Sub-type for the organizer avatar badge (palette vs music note).
    // Prefer any field the backend attached; otherwise fetch
    // /api/music/artists/:id for an authoritative value (mirrors
    // ArtistAdminConsole pattern).
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

    const viewerUserId = Number(user?.id || user?.user_id || 0);
    const eventUserId = Number(organizerId || 0);
    const isPersonalOwner = Boolean(viewerUserId && eventUserId && viewerUserId === eventUserId);

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

    const dateLabel = formatEventDate(event);
    const timeLabel = formatEventTime(event);
    const locationLabel = formatLocationLabel(event);
    const addressStr = toStr(
        event?.address || event?.venueAddress || event?.venue_address
    ).trim();
    const venueName = toStr(event?.venueName || event?.venue_name).trim();
    const eventLat = event?.latitude != null ? Number(event.latitude) : null;
    const eventLng = event?.longitude != null ? Number(event.longitude) : null;
    const hasMapPin = eventLat != null && eventLng != null && Number.isFinite(eventLat) && Number.isFinite(eventLng);

    const isSelf =
        user?.id && popoverUser?.id && String(user.id) === String(popoverUser.id);

    // Fade-in on mount
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Outer container — on mobile, go full-bleed to match the fullscreen drawer style
    const outerSx = {
        width: "100%",
        maxWidth: { xs: "100%", sm: 1120 },
        mx: "auto",
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, sm: 3 },
        pt: { xs: `${chromeTop}px`, sm: 3 },
        pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 16}px`, sm: 3 },
        opacity: pageVisible ? 1 : 0,
        transform: pageVisible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 350ms ease, transform 350ms ease',
    };

    if ((isLoading && !event) || (event && user && gate.loading)) {
        return (
            <Box sx={{ ...outerSx, py: 6, px: 2 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        py: 6,
                    }}
                >
                    <CircularProgress size={36} />
                </Box>
            </Box>
        );
    }

    if (!event && !isLoading && isNetworkError(rawLoadError)) {
        return (
            <Box sx={{ ...outerSx, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', px: 2 }}>
                <NetworkErrorState onRetry={() => window.location.reload()} />
            </Box>
        );
    }

    if (event && gate.gated) {
        return <BlockedPostGate gate={gate} />;
    }

    if (!event && !isLoading) {
        return (
            <Box sx={{ ...outerSx, py: 4, px: 2 }}>
                <Typography color="text.secondary">
                    The event you are looking for does not exist or has been removed.
                </Typography>
                {!fromNotifications && (
                    <Button
                        onClick={handleBack}
                        sx={{ mt: 2 }}
                        startIcon={<ArrowBackIcon />}
                    >
                        {backLabel}
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Box sx={outerSx}>
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: { xs: 1.25, sm: 2.5, md: 3 },
                    borderRadius: { xs: 0, sm: 3 },
                    borderColor: { xs: "transparent", sm: "transparent" },
                    border: "none",
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                    boxShadow: { xs: "none", sm: `0 16px 56px ${alpha(t.palette.text.primary, 0.08)}` },
                    overflow: "hidden",
                })}
            >
                {/* Back to events — styled like drawer header on mobile */}
                {!fromNotifications && (
                    <Box
                        sx={(t) => ({
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: { xs: 0, sm: 1.5 },
                            pb: { xs: 0, sm: 1 },
                            borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.1)}`, sm: "1px solid" },
                            borderColor: { sm: "divider" },
                            // Sticky on mobile so it stays visible while scrolling
                            position: { xs: "sticky", sm: "static" },
                            top: { xs: 0, sm: "auto" },
                            zIndex: { xs: 10, sm: "auto" },
                            bgcolor: "background.paper",
                            mx: { xs: -1.25, sm: 0 },
                            px: { xs: 0.5, sm: 0 },
                            py: { xs: 0.25, sm: 0 },
                            minHeight: { xs: 46, sm: "auto" },
                        })}
                    >
                        <IconButton
                            onClick={handleBack}
                            size="small"
                            aria-label="Back"
                            sx={{ width: 36, height: 36, display: { xs: "flex", sm: "none" } }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Button
                            onClick={handleBack}
                            startIcon={<ArrowBackIcon />}
                            sx={{
                                display: { xs: "none", sm: "inline-flex" },
                                px: 1,
                                py: 0.5,
                                minWidth: 0,
                                fontWeight: 800,
                                textTransform: "none",
                                borderRadius: 999,
                                "&:hover": { bgcolor: "action.hover" },
                            }}
                        >
                            {backLabel}
                        </Button>
                        <Typography
                            sx={{
                                display: { xs: "block", sm: "none" },
                                fontWeight: 800,
                                fontSize: 15,
                                flex: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {event?.title || "Event Details"}
                        </Typography>
                    </Box>
                )}

                {/* Hero Image */}
                {coverPhoto ? (
                    <HeroImage
                        photo={coverPhoto}
                        title={event?.title}
                    />
                ) : (
                    /* No cover photo — gradient banner */
                    <Box
                        sx={(t) => ({
                            position: "relative",
                            width: "100%",
                            borderRadius: 3,
                            overflow: "hidden",
                            mb: 2.5,
                            background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.13)} 0%, ${alpha(t.palette.primary.main, 0.06)} 50%, ${alpha(t.palette.primary.main, 0.10)} 100%)`,
                            border: "1px solid",
                            borderColor: alpha(t.palette.primary.main, 0.1),
                            p: { xs: 2.5, sm: 3 },
                            pt: { xs: 3, sm: 3.5 },
                            pb: { xs: 2.5, sm: 3 },
                        })}
                    >
                        <Typography
                            sx={{
                                fontWeight: 950,
                                fontSize: { xs: 22, sm: 28 },
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

                {/* Category chip + 3-dot event menu row */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                    <Box>
                        {categoryInfo.label && (
                            <Chip
                                size="small"
                                icon={
                                    EVENT_CATEGORY_ICONS[categoryInfo.slug]
                                        ? React.createElement(
                                            EVENT_CATEGORY_ICONS[categoryInfo.slug],
                                            { sx: { fontSize: 14 } }
                                        )
                                        : undefined
                                }
                                label={categoryInfo.label}
                                sx={(t) => ({
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
                    </Box>
                    <Tooltip title="More options">
                        <IconButton
                            onClick={handleEventMenuOpen}
                            size="small"
                            sx={{
                                width: 32,
                                height: 32,
                                border: "1px solid",
                                borderColor: "divider",
                                color: "text.secondary",
                                bgcolor: "background.paper",
                                "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Organizer card */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2.5,
                        cursor: "pointer",
                    }}
                    onClick={handleOrganizerClick}
                >
                    <Avatar
                        src={organizerAvatar || undefined}
                        alt={organizerName}
                        sx={(t) => ({
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: "2px solid",
                            borderColor: "divider",
                            ...(!organizerAvatar ? {
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                            } : {}),
                        })}
                    >
                        {!organizerAvatar ? (
                            isBusinessEvent ? <StorefrontRoundedIcon /> :
                                isArtistEvent ? (isVisualArtistEvent ? <PaletteRoundedIcon /> : <MusicNoteRoundedIcon />) :
                                    <PersonRoundedIcon />
                        ) : null}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: "text.secondary",
                                    fontWeight: 600,
                                }}
                            >
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
                        <Typography
                            sx={{ fontWeight: 800, fontSize: 15, color: "text.primary", overflowWrap: "anywhere", wordBreak: "break-word" }}
                        >
                            {organizerName}
                        </Typography>
                        {organizerHandle && (
                            <Typography
                                sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}
                            >
                                @{organizerHandle}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Date, Time & Location card */}
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
                                        width: 42,
                                        height: 42,
                                        borderRadius: 2,
                                        bgcolor: alpha(t.palette.primary.main, 0.1),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    })}
                                >
                                    <CalendarTodayRoundedIcon
                                        sx={{ color: "primary.main", fontSize: 20 }}
                                    />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                                        {dateLabel}
                                    </Typography>
                                    {timeLabel && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                mt: 0.25,
                                            }}
                                        >
                                            <AccessTimeRoundedIcon
                                                sx={{
                                                    fontSize: 14,
                                                    color: "text.secondary",
                                                }}
                                            />
                                            <Typography
                                                sx={{
                                                    fontSize: 13,
                                                    color: "text.secondary",
                                                }}
                                            >
                                                {timeLabel}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Stack>
                        )}

                        {dateLabel && (
                            <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />
                        )}

                        <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                        >
                            <Box
                                sx={(t) => ({
                                    width: 42,
                                    height: 42,
                                    borderRadius: 2,
                                    bgcolor: alpha(t.palette.primary.main, 0.1),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                })}
                            >
                                <LocationOnRoundedIcon
                                    sx={{ color: "primary.main", fontSize: 20 }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.25,
                                }}
                            >
                                {venueName && (
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: 15,
                                            color: "text.primary",
                                            overflowWrap: "anywhere",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {venueName}
                                    </Typography>
                                )}
                                {addressStr && (
                                    <Typography
                                        sx={{
                                            fontSize: 13,
                                            color: "primary.main",
                                            fontWeight: 700,
                                            overflowWrap: "anywhere",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {addressStr}
                                    </Typography>
                                )}
                                <Typography
                                    sx={{
                                        fontSize: 13,
                                        color: "primary.main",
                                        fontWeight: 700,
                                        overflowWrap: "anywhere",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {locationLabel}
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>
                </Box>

                {/* Description / About */}
                {hasMapPin && (() => {
                    const hasStreetAddress = Boolean(addressStr);
                    const locationQuery = [addressStr, venueName, locationLabel, 'Alabama'].filter(Boolean).join(', ');
                    const mapSrc = hasStreetAddress
                        ? `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${encodeURIComponent(locationQuery)}&zoom=16`
                        : `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${eventLat},${eventLng}&zoom=11`;
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
                                sx={{ width: "100%", height: 220, border: 0, display: "block", pointerEvents: "none" }}
                                loading="lazy"
                                allowFullScreen
                                title="Event location"
                            />
                        </Box>
                    );
                })()}
                {event?.description && (
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            sx={{
                                fontWeight: 800,
                                fontSize: 15,
                                mb: 1.25,
                                letterSpacing: 0.2,
                            }}
                        >
                            About
                        </Typography>
                        <Box
                            sx={(t) => ({
                                position: "relative",
                                pl: 2,
                                borderLeft: "3px solid",
                                borderColor: alpha(t.palette.primary.main, 0.25),
                            })}
                        >
                            <Box
                                ref={descriptionRef}
                                sx={{
                                    ...(needsDescTruncate && !descriptionExpanded
                                        ? {
                                            maxHeight: 200,
                                            overflow: "hidden",
                                        }
                                        : {}),
                                }}
                            >
                                <RichTextDisplay html={event.description} />
                            </Box>
                            {needsDescTruncate && !descriptionExpanded && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: 40,
                                        background:
                                            (t) => `linear-gradient(transparent, ${t.palette.background.paper})`,
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <Link
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        onClick={() =>
                                            setDescriptionExpanded(true)
                                        }
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: "primary.main",
                                            bgcolor: "background.paper",
                                            px: 0.5,
                                        }}
                                    >
                                        View more
                                    </Link>
                                </Box>
                            )}
                            {needsDescTruncate && descriptionExpanded && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        mt: 0.5,
                                    }}
                                >
                                    <Link
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        onClick={() =>
                                            setDescriptionExpanded(false)
                                        }
                                        sx={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: "primary.main",
                                        }}
                                    >
                                        View less
                                    </Link>
                                </Box>
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
                <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                    <Button
                        variant={hasRsvpd ? "contained" : "outlined"}
                        fullWidth
                        disabled={engBusy === "rsvp"}
                        startIcon={
                            hasRsvpd ? (
                                <CheckCircleRoundedIcon />
                            ) : (
                                <EventAvailableRoundedIcon />
                            )
                        }
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
                        {hasRsvpd ? "Going" : "RSVP"}
                        {rsvpCount > 0 ? ` (${formatCount(rsvpCount)})` : ""}
                    </Button>

                    <Button
                        variant={isInterested ? "contained" : "outlined"}
                        fullWidth
                        disabled={engBusy === "interested"}
                        startIcon={
                            isInterested ? (
                                <StarRoundedIcon />
                            ) : (
                                <StarBorderRoundedIcon />
                            )
                        }
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
                        Interested
                        {interestedCount > 0
                            ? ` (${formatCount(interestedCount)})`
                            : ""}
                    </Button>
                </Stack>

                {/* Action Bar */}
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        mt: 1.25,
                        mb: 2,
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: "background.paper",
                        borderColor: alpha(t.palette.primary.main, 0.14),
                    })}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-around",
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
                                sx={{
                                    display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                    py: 0.5, px: 1.25, borderRadius: 999,
                                    transition: "background 140ms ease, transform 80ms ease",
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                    "&:active": { transform: "scale(0.97)" },
                                }}
                            >
                                {hasLiked ? (
                                    <FavoriteRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "secondary.main", transition: "color 140ms ease" }} />
                                ) : (
                                    <FavoriteBorderRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: "text.secondary", transition: "color 140ms ease" }} />
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
                                        anchor.scrollIntoView({ behavior: "smooth", block: "center" });
                                        const el = anchor.querySelector("textarea, input[type='text']");
                                        if (el) {
                                            try { el.focus(); } catch { /* ignore */ }
                                            setTimeout(() => { try { el.focus(); } catch { /* ignore */ } }, 300);
                                        }
                                    }
                                }}
                                tabIndex={0}
                                role="button"
                                sx={{
                                    display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                    py: 0.5, px: 1.25, borderRadius: 999,
                                    transition: "background 140ms ease, transform 80ms ease",
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                    "&:active": { transform: "scale(0.97)" },
                                }}
                            >
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: "text.secondary", transition: "color 140ms ease" }} />
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
                                sx={{
                                    display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                    py: 0.5, px: 1.25, borderRadius: 999,
                                    transition: "background 140ms ease, transform 80ms ease",
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                    "&:active": { transform: "scale(0.97)" },
                                }}
                            >
                                <RepeatRoundedIcon sx={{ fontSize: { xs: 20, sm: 22 }, color: hasReposted ? "secondary.main" : "text.secondary", transition: "color 140ms ease" }} />
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
                                sx={{
                                    display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                                    py: 0.5, px: 1.25, borderRadius: 999,
                                    transition: "background 140ms ease, transform 80ms ease",
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                    "&:active": { transform: "scale(0.97)" },
                                }}
                            >
                                <ShareRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: "text.secondary", transition: "color 140ms ease" }} />
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
                        scrollToCommentId={scrollToCommentId}
                    />
                </Box>
            </Paper>

            {/* User Card Popover */}
            <UserCardPopover
                anchorEl={popoverAnchorEl}
                onClose={handlePopoverClose}
                user={popoverUser}
                isSelf={isSelf}
                following={false}
                onViewProfile={(u) => {
                    handlePopoverClose();
                    const h = u?.handle || popoverUser?.handle;
                    if (h) {
                        navigate(`/${h}`);
                    }
                }}
            />

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
                            startIcon={<LinkIcon />}
                            onClick={() => {
                                const url = `${window.location.origin}/events?event=${eventId}`;
                                navigator.clipboard.writeText(url).then(() => {
                                    showSuccess("Link copied to clipboard");
                                }).catch(() => {});
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
                                onClick={() => { setShareDialogOpen(false); onRequireAuth(); }}
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
            <EventPostEditHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                rows={historyRows}
                loading={historyLoading}
                error={historyError}
                currentEvent={event}
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
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor: "divider",
                        boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`,
                        minWidth: 200,
                        py: 0.5,
                    },
                }}
            >
                {/* Copy link — always */}
                <MenuItem onClick={handleEventMenuCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>

                {/* Owner: Edit + Delete — only when on the correct account */}
                {isOnCorrectAccount && <Divider sx={{ my: 0.5 }} />}
                {isOnCorrectAccount && (
                    <MenuItem
                        onClick={handleEventEdit}
                        sx={{ py: 1 }}
                    >
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit event" />
                    </MenuItem>
                )}
                {isOnCorrectAccount && (
                    <MenuItem
                        onClick={handleEventDeleteClick}
                        sx={{ py: 1, color: "error.main" }}
                    >
                        <ListItemIcon sx={{ color: "error.main" }}>
                            <DeleteOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Delete event" />
                    </MenuItem>
                )}

                {/* Report — visible when not on the owning account */}
                {!isOnCorrectAccount && <Divider sx={{ my: 0.5 }} />}
                {!isOnCorrectAccount && (
                    <MenuItem onClick={handleEventReportFromMenu} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report event" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* Delete Event Confirmation */}
            <Dialog
                open={eventDeleteOpen}
                onClose={() => setEventDeleteOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    Delete Event
                    <IconButton size="small" onClick={() => setEventDeleteOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete this event? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setEventDeleteOpen(false)}
                        disabled={eventDeleting}
                        sx={{ textTransform: "none" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleEventConfirmDelete}
                        disabled={eventDeleting}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                        {eventDeleting ? "Deleting..." : "Delete Event"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Event Dialog */}
            <Dialog
                open={eventReportOpen}
                onClose={() => setEventReportOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
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

            {/* Edit Limit Reached Dialog */}
            <Dialog
                open={editLimitDialogOpen}
                onClose={() => setEditLimitDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { position: "relative", borderRadius: 3 } }}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                    Edit Limit Reached
                    <IconButton aria-label="Close" onClick={() => setEditLimitDialogOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        {editLimitMsg || "You've reached the edit limit (5 edits per 24 hours). Please try again later."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditLimitDialogOpen(false)} variant="contained" sx={{ fontWeight: 700, textTransform: "none" }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success snackbar */}
            <SuccessSnackbar {...successSnackbarProps} />

            {/* Error snackbar */}
            {errorSnackbar && (
                <Box
                    sx={{
                        position: "fixed",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        bgcolor: "common.black",
                        color: "common.white",
                        px: 3,
                        py: 1.25,
                        borderRadius: 2,
                        fontSize: 14,
                        fontWeight: 700,
                        boxShadow: (t) => `0 8px 32px ${alpha(t.palette.text.primary, 0.25)}`,
                        zIndex: 1400,
                    }}
                >
                    {errorSnackbar}
                </Box>
            )}

            {/* Error display */}
            {error && (
                <Box
                    sx={(t) => ({
                        p: 1.5,
                        mt: 2,
                        borderRadius: 2,
                        bgcolor: alpha(t.palette.error.main, 0.08),
                        border: "1px solid",
                        borderColor: alpha(t.palette.error.main, 0.2),
                    })}
                >
                    <Typography
                        sx={{ color: "error.main", fontSize: 13, fontWeight: 700 }}
                    >
                        {error}
                    </Typography>
                </Box>
            )}

            {/* ═══ Edit Event Modal ═══ */}
            <CreateEditEventModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                eventToEdit={event}
                user={user}
                onSaved={async () => {
                    setEditModalOpen(false);
                    showSuccess("Event updated successfully");
                    // Refresh event data in place
                    try {
                        const data = await fetchEventById(eventId);
                        if (data) setEvent(data);
                    } catch { /* ignore */ }
                }}
            />
        </Box>
    );
}

export default EventPostPage;
