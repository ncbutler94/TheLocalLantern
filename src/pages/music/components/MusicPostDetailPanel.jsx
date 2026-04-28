import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from "../../../utils/commentBlockUtils";
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
    FormControlLabel,
    IconButton,
    InputAdornment,
    Link,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Popper,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha as alphaColor, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import PersonIcon from "@mui/icons-material/Person";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ForumIcon from "@mui/icons-material/Forum";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LinkIcon from "@mui/icons-material/Link";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BlockIcon from "@mui/icons-material/Block";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import ActionBar from "../../../components/ActionBar";
import ReportContentDialog from "../../../components/ReportContentDialog";
import UserCardPopover from "../../../components/UserCardPopover";
import ShareDialog from "../../../components/ShareDialog";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import CommentImageAttachments, { uploadFilesToGCS } from "../../../components/CommentImageAttachments";
import CommentImages from "../../../components/CommentImages";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import RichTextDisplay from "../../../components/RichTextDisplay";
import useRateLimit from "../../../utils/useRateLimit";
import RateLimitDialog from "../../../components/RateLimitDialog";
import { checkProfanity } from "../../../utils/profanityCheck";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";

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
            if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn’t meet our community guidelines.' };
            return { safe: false, message: 'Unable to verify image safety. Please try a different image.' };
        }
        if (data && data.safe === false) return { safe: false, message: data.message || 'This image doesn’t meet our community guidelines.' };
        return { safe: true };
    } catch {
        return { safe: false, message: 'Unable to verify image safety. Please check your connection and try again.' };
    }
}

/**
 * MusicPostDetailPanel
 * ────────────────────
 * Right-rail post detail panel for the Music page.
 * Shows the selected music_artist_post with THREADED comments section.
 *
 * Location: src/pages/music/components/MusicPostDetailPanel.jsx
 *
 * THREADED COMMENTS: Matches EventDetailPanel / PostPage pattern exactly —
 * normalizeComments, ThreadedCommentItem, submitReply, likeComment (tree-based),
 * optimistic updates, expand/collapse replies.
 *
 * SELF-CONTAINED UserCardPopover with hydration, follow/unfollow, account-aware
 * isSelf, and business/artist profile navigation.
 */

const api = process.env.REACT_APP_API_URL || "";

/* ═══════════════════════════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

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

const COMMENT_MAX_CHARS = 15000;
const COMMENT_PREVIEW_CHARS = 200;
const MAX_VISUAL_DEPTH = 2;
const INITIAL_REPLIES_SHOWN = 5;
const INITIAL_COMMENTS_SHOWN = 20;
const COMMENTS_LOAD_MORE = 20;

// ─── @Mention helpers ─────────────────────────────────────────────────────────

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

// ─── ComposerAvatar — shows the viewer's avatar with correct fallback icon ──

function ComposerAvatar({ url, accountType, profileType, label, size = 44, iconSize = 22, sx: sxOverride = {} }) {
    const [imgError, setImgError] = React.useState(false);
    React.useEffect(() => { setImgError(false); }, [url]);
    const showImg = Boolean(url) && !imgError;
    // For artist accounts, pick Music Note (musician) vs Palette (visual artist)
    // based on profileType. Anything not explicitly 'artist' keeps the legacy
    // music-note fallback so existing callers are unaffected.
    const artistFallbackIcon = (String(profileType || '').toLowerCase() === 'artist')
        ? PaletteRoundedIcon
        : MusicNoteRoundedIcon;
    const FallbackIcon = accountType === 'business'
        ? StorefrontOutlinedIcon
        : accountType === 'artist'
            ? artistFallbackIcon
            : PersonIcon;
    return (
        <Avatar
            src={showImg ? url : undefined}
            alt={label || 'You'}
            imgProps={{ onError: () => setImgError(true) }}
            sx={(t) => ({
                width: size,
                height: size,
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                ...(!showImg ? {
                    bgcolor: alphaColor(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                } : {}),
                ...sxOverride,
            })}
        >
            {!showImg && <FallbackIcon sx={{ fontSize: iconSize }} />}
        </Avatar>
    );
}

function MentionAccountBadge({ item }) {
    if (!item) return null;
    const type = String(item.account_type || "").toLowerCase();
    return (
        <>
            {type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {type === "artist" && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
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
                                            <Avatar src={avatar || undefined} sx={{ width: 32, height: 32, ...(!avatar ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
                                                {!avatar ? <PersonIcon fontSize="small" /> : null}
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

// ───────────────────────────────────────────────────────────────────────────────

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

function formatCounty(raw) {
    const c = String(raw || "").trim();
    if (!c) return "";
    return c.toLowerCase().includes("county") ? c : `${c} County`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   normalizeComments — builds threaded tree (matches EventDetailPanel exactly)
   ═══════════════════════════════════════════════════════════════════════════════ */


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
    const src = Array.isArray(raw) ? raw : raw?.comments || raw?.items || raw?.data || [];

    const normalizeNode = (c, idx) => {
        const isBizComment = Boolean(c.business_id || c.businessId || (c.account_type && String(c.account_type).toLowerCase() === 'business'));
        const isArtComment = Boolean(c.artist_id || c.artistId || (c.account_type && String(c.account_type).toLowerCase() === 'artist'));
        const rawAvatar = c.avatar_url ?? c.avatarUrl ?? c.userAvatar ?? c.user?.avatar_url ?? c.profile_picture ?? c.account_avatar_url ?? c.accountAvatarUrl ?? "";
        return {
            id: c.id ?? c.comment_id ?? c._id ?? `c_${idx}`,
            parentId: c.parent_id ?? c.parentId ?? c.reply_to ?? null,
            user_id: c.user_id ?? c.userId ?? c.user?.id ?? null,
            public_id: c.public_id ?? c.user_public_id ?? c.user?.public_id ?? null,
            text: String(c.text ?? c.content ?? c.body ?? c.comment ?? "").trim(),
            first_name: c.first_name ?? c.author_first_name ?? c.user?.first_name ?? "",
            last_name: c.last_name ?? c.author_last_name ?? c.user?.last_name ?? "",
            handle: c.handle ?? c.userHandle ?? c.user?.handle ?? c.username ?? "",
            avatar: rawAvatar,
            created_at: c.created_at ?? c.createdAt ?? c.date_created ?? c.posted_at ?? c.time ?? "",
            likes: Number(c.likes ?? c.likes_count ?? c.like_count ?? c.likeCount ?? c.likesCount ?? 0),
            viewer_liked: Boolean(c.viewer_liked ?? c.viewerLiked ?? c.liked ?? false),
            viewer_flagged: Boolean(c.viewer_flagged ?? false),
            reply_count: Number(c.reply_count ?? c.replyCount ?? 0),
            is_removed: Boolean(c.is_removed ?? c.isRemoved ?? c.removed ?? false),
            removed_reason: String(c.removed_reason ?? c.removedReason ?? ""),
            removed_at: c.removed_at ?? c.removedAt ?? null,
            is_pinned: Boolean(c.is_pinned ?? c.isPinned ?? c.pinned ?? false),
            pinned_at: c.pinned_at ?? c.pinnedAt ?? null,
            business_id: c.business_id ?? c.businessId ?? null,
            business_name: c.business_name ?? c.businessName ?? null,
            business_slug: c.business_slug ?? c.businessSlug ?? null,
            business_avatar_url: c.business_avatar_url ?? c.businessAvatarUrl ?? c.business_logo ?? c.businessLogo ?? null,
            artist_id: c.artist_id ?? c.artistId ?? null,
            artist_name: c.artist_name ?? c.artistName ?? null,
            artist_handle: c.artist_handle ?? c.artistHandle ?? null,
            artist_avatar_url: c.artist_avatar_url ?? c.artistAvatarUrl ?? null,
            // Artist sub-type ('music' | 'artist') passed through so the
            // avatar fallback can pick palette vs music-note. Backend sets
            // this per-comment from music_artists.profile_type.
            profile_type: c.profile_type ?? c.profileType ?? null,
            account_type: c.account_type ?? c.accountType ?? null,
            account_handle: c.account_handle ?? c.accountHandle ?? c.userHandle ?? null,
            account_name: c.account_name ?? c.accountName ?? c.userName ?? null,
            account_avatar_url: c.account_avatar_url ?? c.accountAvatarUrl ?? null,
            images: Array.isArray(c.images) ? c.images.filter(Boolean) : [],
            image: c.image ?? (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null),
            replies: Array.isArray(c.replies) ? c.replies.map((r, i) => normalizeNode(r, i)) : [],
        }; };

    const hasNestedReplies = src.some((c) => Array.isArray(c.replies) && c.replies.length > 0);
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

/* ═══════════════════════════════════════════════════════════════════════════════
   Photo extraction + Carousel (matches PostDetailModal pattern)
   ═══════════════════════════════════════════════════════════════════════════════ */

function extractPhotos(post) {
    if (!post) return [];
    let processed = [];

    // Try photos array first
    const { photos } = post;
    if (Array.isArray(photos)) {
        processed = photos.filter((p) => p && typeof p === "string" && p !== "null");
    } else if (typeof photos === "string" && photos !== "null" && photos.trim()) {
        try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed)) processed = parsed.filter((p) => p && typeof p === "string" && p !== "null");
        } catch {
            processed = [photos];
        }
    }

    // Try mediaUrl (music posts store JSON arrays here)
    if (!processed.length) {
        const mu = post.mediaUrl || post.media_url || "";
        if (typeof mu === "string" && mu.trim()) {
            try {
                const parsed = JSON.parse(mu);
                if (Array.isArray(parsed)) processed = parsed.filter((u) => typeof u === "string" && u);
            } catch {
                if (mu.trim()) processed = [mu.trim()];
            }
        }
    }

    // Fallback to single-value fields
    if (!processed.length) {
        const oneOffs = [
            post.photo_url, post.photo, post.image_url, post.image,
            post.thumbnail, post.main_photo_url, post.cover, post.cover_url,
        ].filter((u) => typeof u === "string" && u && u !== "null").slice(0, 10);
        if (oneOffs.length) processed = oneOffs;
    }

    // Try photo_urls array
    if (!processed.length && Array.isArray(post.photo_urls)) {
        processed = post.photo_urls.filter((u) => typeof u === "string" && u && u !== "null");
    }
    if (!processed.length && Array.isArray(post.photoUrls)) {
        processed = post.photoUrls.filter((u) => typeof u === "string" && u && u !== "null");
    }

    return processed;
}

function MusicPhotoCarousel({ photos, initialIndex = 0 }) {
    const clampedInitial = (() => {
        if (!Array.isArray(photos) || photos.length === 0) return 0;
        const n = Number(initialIndex) || 0;
        return Math.min(Math.max(0, n), photos.length - 1);
    })();
    const [index, setIndex] = useState(clampedInitial);

    // Reset to initialIndex when photos array changes (post switch). We
    // intentionally don't depend on initialIndex itself — once the user
    // navigates within the carousel, an unrelated re-render shouldn't
    // override their position.
    useEffect(() => {
        if (!Array.isArray(photos) || photos.length === 0) {
            setIndex(0);
            return;
        }
        const n = Number(initialIndex) || 0;
        setIndex(Math.min(Math.max(0, n), photos.length - 1));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photos]);

    useEffect(() => {
        setIndex((i) => {
            if (!Array.isArray(photos) || photos.length === 0) return 0;
            return Math.min(Math.max(0, i), photos.length - 1);
        });
    }, [photos]);

    const safeIndex = Array.isArray(photos) && photos.length ? Math.min(index, photos.length - 1) : 0;
    const current = Array.isArray(photos) ? photos[safeIndex] : null;

    const prev = () => {
        if (!Array.isArray(photos) || photos.length < 2) return;
        setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    const next = () => {
        if (!Array.isArray(photos) || photos.length < 2) return;
        setIndex((i) => (i + 1) % photos.length);
    };

    if (!current) return null;

    return (
        <Box sx={{ position: "relative", mt: 1.25 }}>
            <Box sx={{
                width: "100%",
                height: { xs: 260, sm: 380 },
                bgcolor: "common.black",
                borderRadius: 1.5,
                overflow: "hidden",
                position: "relative",
            }}>
                <Box
                    component="img"
                    src={current}
                    alt=""
                    loading="lazy"
                    sx={{
                        width: "100%", height: "100%",
                        objectFit: "contain",
                        display: "block",
                        userSelect: "none",
                        backgroundColor: "transparent",
                    }}
                />
            </Box>

            {photos.length > 1 && (
                <>
                    <IconButton
                        aria-label="Previous image"
                        onClick={prev}
                        sx={{
                            position: "absolute", top: "50%", left: 8,
                            transform: "translateY(-50%)",
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.45),
                            color: "common.white",
                            "&:hover": { bgcolor: (t) => alphaColor(t.palette.common.black, 0.65) },
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                        aria-label="Next image"
                        onClick={next}
                        sx={{
                            position: "absolute", top: "50%", right: 8,
                            transform: "translateY(-50%)",
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.45),
                            color: "common.white",
                            "&:hover": { bgcolor: (t) => alphaColor(t.palette.common.black, 0.65) },
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                    <Box sx={{
                        position: "absolute", bottom: 8, left: "50%",
                        transform: "translateX(-50%)",
                        px: 1, py: 0.25, borderRadius: 1,
                        bgcolor: (t) => alphaColor(t.palette.common.black, 0.45),
                        color: "common.white", fontSize: 12, fontWeight: 700,
                    }}>
                        {safeIndex + 1} / {photos.length}
                    </Box>
                </>
            )}

            {/* Thumbnail strip — only when there are 2+ photos. Active
                thumbnail highlighted with a primary-color border so the
                user can see which photo is currently shown. */}
            {photos.length > 1 && (
                <Box
                    sx={{
                        mt: 1,
                        display: "flex",
                        gap: 0.75,
                        overflowX: "auto",
                        WebkitOverflowScrolling: "touch",
                        "&::-webkit-scrollbar": { display: "none" },
                        scrollbarWidth: "none",
                        pb: 0.5,
                    }}
                >
                    {photos.map((src, i) => {
                        const isActive = i === safeIndex;
                        return (
                            <Box
                                key={`${src}-${i}`}
                                role="button"
                                tabIndex={0}
                                aria-label={`Show photo ${i + 1}`}
                                aria-current={isActive ? "true" : undefined}
                                onClick={() => setIndex(i)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIndex(i); } }}
                                sx={(t) => ({
                                    flex: "0 0 auto",
                                    width: 64,
                                    height: 64,
                                    borderRadius: 1,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    position: "relative",
                                    border: "2px solid",
                                    borderColor: isActive ? "primary.main" : "transparent",
                                    opacity: isActive ? 1 : 0.7,
                                    transition: "opacity 150ms ease, border-color 150ms ease",
                                    "&:hover": { opacity: 1 },
                                    bgcolor: alphaColor(t.palette.common.black, 0.04),
                                })}
                            >
                                <Box
                                    component="img"
                                    src={src}
                                    alt=""
                                    loading="lazy"
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        userSelect: "none",
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════════════════════════════════════ */

function EmptyPostState() {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: "100%",
                p: 3,
            }}
        >
            <Box
                sx={{
                    maxWidth: 420,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.1,
                }}
            >
                <Box
                    sx={{
                        width: 76,
                        height: 76,
                        borderRadius: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: (t) => alphaColor(t.palette.text.primary, 0.03),
                        border: (t) => `1px solid ${alphaColor(t.palette.text.primary, 0.06)}`,
                        boxShadow: (t) => t.custom?.shadows?.xs,
                    }}
                >
                    <ForumIcon sx={{ fontSize: 42, color: "primary.main", opacity: 0.9 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                    Select a post
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                    Choose a post from the list to see details, comments, and photos.
                </Typography>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   BlockedCommentPlaceholder — shows "Comment from a blocked user" with Show toggle
   ═══════════════════════════════════════════════════════════════════════════════ */

function BlockedCommentPlaceholder({ commentId, depth, onShow }) {
    const blockedLabel = depth > 0 ? "Reply from a blocked user" : "Comment from a blocked user";
    const shouldIndent = depth > 0 && depth <= MAX_VISUAL_DEPTH;
    return (
        <Box
            id={`comment-${commentId}`}
            sx={{
                pl: shouldIndent ? { xs: 1.25, sm: 2 } : 0,
                borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.common.black, 0.08)}` : "none",
                ml: shouldIndent ? 1 : 0,
            }}
        >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", py: 1, px: 1.5, bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03), borderRadius: 2, my: 0.5 }}>
                <BlockIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{blockedLabel}</Typography>
                <Link component="button" type="button" underline="hover" onClick={() => onShow(commentId)}
                      sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Show</Link>
            </Box>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ThreadedCommentItem — matches EventDetailPanel pattern exactly
   ═══════════════════════════════════════════════════════════════════════════════ */

function ThreadedCommentItem({
                                 node, depth = 0, expanded, setExpanded, viewerAvatarUrl, viewerLabel,
                                 likeComment, submitReply, viewerId, onDelete, onTogglePinConfirm, openFlag,
                                 onRequireAuth,
                                 replyToName, replyToHandle, replyToAvatar, onOpenUserCard, artistOwnerId,
                                 postArtistId,
                                 onScrollToComment, highlightedCommentId, parentCommentId,
                                 onShareComment, newCommentIds,
                                 blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles, shownBlockedIds, onShowBlocked, onHideBlocked,
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

    const insertRpMention = (u) => {
        const handle = u.handle || u.username || "";
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
    const menuOpen = Boolean(menuAnchor);
    const openMenu = (e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); };
    const closeMenu = (e) => { if (e) e.stopPropagation(); setMenuAnchor(null); };

    useEffect(() => {
        setLiked(Boolean(node.viewer_liked));
        setLikes(Number(node.likes || 0));
    }, [node.viewer_liked, node.likes]);

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

    // Artist owner can moderate all comments — must be on the correct artist account
    const isArtistOwner = (() => {
        if (viewerId == null || artistOwnerId == null || String(viewerId) !== String(artistOwnerId)) return false;
        if (postArtistId) return isAA && Number(aArtId) === Number(postArtistId);
        return false;
    })();

    const canPin = isArtistOwner && depth === 0;
    const canDelete = isOwnComment || isArtistOwner;
    const isPinned = Boolean(node.is_pinned);

    // "Author" badge — comment posted by the same artist that owns the post
    const isCommentByArtist = (() => {
        if (!postArtistId) return false;
        return commentArtId > 0 && Number(commentArtId) === Number(postArtistId);
    })();

    const displayName = node.business_name
        ? node.business_name
        : node.artist_name
            ? node.artist_name
            : node.account_name
                ? node.account_name
                : (`${node.first_name || ""} ${node.last_name || ""}`.trim()
                    || node.name || node.authorName
                    || (node.handle ? `@${node.handle}` : "User"));

    const displayHandle = node.business_slug
        ? node.business_slug
        : node.artist_handle
            ? node.artist_handle
            : node.account_handle
                ? node.account_handle
                : (node.handle || "");

    // Determine account type for avatar fallback logic
    const isBusinessComment = Boolean(node.business_id || node.business_name || node.account_type === 'business');
    const isArtistComment = Boolean(node.artist_id || node.artist_name || node.account_type === 'artist');
    // Artist sub-type for commenters — musicians vs visual artists. Reads
    // profile_type from the normalized comment node (backend returns this).
    const commentProfileType = String(node?.profile_type || node?.profileType || '').toLowerCase();
    const isVisualArtistComment = isArtistComment && commentProfileType === 'artist';

    // For business/artist: use their specific avatar, then account_avatar_url, then node.avatar as last resort.
    // For normal users: use node.avatar (personal pic).
    const displayAvatar = (() => {
        if (isBusinessComment) {
            const biz = (node.business_avatar_url || node.account_avatar_url || '').trim();
            return biz || node.avatar || '';
        }
        if (isArtistComment) {
            const art = (node.artist_avatar_url || node.account_avatar_url || '').trim();
            return art || node.avatar || '';
        }
        return node.avatar || '';
    })();
    // Use the viewer's LIVE avatar for their own comments so profile pic changes show immediately.
    const liveDisplayAvatar = (isOwnComment && viewerAvatarUrl) ? viewerAvatarUrl : displayAvatar;

    const createdLabel = timeAgo(node.created_at);
    const deleteLabel = depth > 0 ? "Delete Reply" : "Delete Comment";

    const needsTruncate = node.text.length > COMMENT_PREVIEW_CHARS;
    const displayText = needsTruncate && !showFullText ? `${node.text.slice(0, COMMENT_PREVIEW_CHARS)}...` : node.text;
    const hasAnyMenuItems = canPin || canDelete || (!isOwnComment && viewerId);

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
        setExpanded((prev) => ({ ...prev, [node.id]: true }));
    };

    const shownReplies = replies.slice(0, visibleReplies);
    const hasMoreReplies = replies.length > visibleReplies;
    const remainingReplies = replies.length - visibleReplies;

    const childProps = {
        expanded, setExpanded, viewerAvatarUrl, viewerLabel,
        likeComment, submitReply, viewerId, onDelete, onTogglePinConfirm, openFlag, onRequireAuth,
        replyToName: displayName, replyToHandle: displayHandle, replyToAvatar: liveDisplayAvatar,
        onOpenUserCard, artistOwnerId, postArtistId,
        onScrollToComment, highlightedCommentId, parentCommentId: node.id, onShareComment, newCommentIds,
        blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles, shownBlockedIds, onShowBlocked, onHideBlocked,
    };

    const commentUserObj = {
        id: node.user_id, handle: node.handle,
        first_name: node.first_name, last_name: node.last_name,
        profile_picture: liveDisplayAvatar, avatar_url: liveDisplayAvatar,
        ...(node.business_id ? { account_type: "business", business_id: node.business_id, business_name: node.business_name, business_slug: node.business_slug, business_avatar_url: node.business_avatar_url } : {}),
        ...(node.artist_id ? { account_type: "artist", artist_id: node.artist_id, artist_name: node.artist_name, artist_handle: node.artist_handle, artist_avatar_url: node.artist_avatar_url } : {}),
        ...(node.account_type ? { account_type: node.account_type } : {}),
        ...(node.account_name ? { account_name: node.account_name } : {}),
        ...(node.account_handle ? { account_handle: node.account_handle } : {}),
        ...(node.account_avatar_url ? { account_avatar_url: node.account_avatar_url } : {}),
    };
    const handleAvatarNameClick = (e) => { onOpenUserCard?.(e.currentTarget, commentUserObj); };

    // ── Blocked user check ──
    const commentUserId = Number(node.user_id || 0);
    const commentHandle = (node.handle || node.business_slug || node.artist_handle || node.account_handle || "").toLowerCase().trim();
    const isBlockedComment =
        isCommentBlocked(node, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles });
    const forceShowBlocked = isBlockedComment && shownBlockedIds && shownBlockedIds.has(Number(node.id));

    if (isBlockedComment && !forceShowBlocked) {
        return (
            <>
                <BlockedCommentPlaceholder commentId={node.id} depth={depth} onShow={onShowBlocked} />
                {hasReplies && isExpanded && (
                    <Box sx={{ pl: indentPl, ml: indentMl }}>
                        {shownReplies.map((reply) => (<ThreadedCommentItem key={reply.id} node={reply} depth={depth + 1} {...childProps}
                                                                           blockedUserIds={blockedUserIds} blockedBusinessIds={blockedBusinessIds} blockedArtistIds={blockedArtistIds} blockedHandles={blockedHandles} shownBlockedIds={shownBlockedIds} onShowBlocked={onShowBlocked} onHideBlocked={onHideBlocked} />))}
                    </Box>
                )}
            </>
        );
    }

    if (node.is_removed) {
        const r = String(node.removed_reason || "").toLowerCase();
        let removalLabel = "Comment removed";
        if (r === "post_owner" || r === "artist_owner") removalLabel = "Comment removed by the artist";
        else if (r === "moderator") removalLabel = "Comment removed by moderator";

        return (
            <>
                <Box sx={{ pl: indentPl, borderLeft: showBorderLeft ? (t) => `2px solid ${alphaColor(t.palette.text.primary, 0.08)}` : "none", ml: indentMl }}>
                    <Box sx={{ py: 1.25 }}>
                        <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary", fontSize: 13 }}>{removalLabel}</Typography>
                    </Box>
                    {hasReplies && !isExpanded && (
                        <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                              sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 600, color: "primary.main" }}>Show replies ({replies.length})</Link>
                    )}
                </Box>
                {hasReplies && isExpanded && (
                    <Box sx={{ pl: indentPl, ml: indentMl }}>
                        {shownReplies.map((reply) => (<ThreadedCommentItem key={reply.id} node={reply} depth={depth + 1} {...childProps} />))}
                        {hasMoreReplies && (
                            <Link component="button" type="button" underline="hover"
                                  onClick={() => setVisibleReplies((n) => n + INITIAL_REPLIES_SHOWN)}
                                  sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 700, color: "primary.main" }}>
                                Show {Math.min(INITIAL_REPLIES_SHOWN, remainingReplies)} more {remainingReplies === 1 ? "reply" : "replies"}
                            </Link>
                        )}
                    </Box>
                )}
            </>
        );
    }

    return (
        <>
            <Box id={`comment-${node.id}`} sx={{ pl: indentPl, borderLeft: showBorderLeft ? (t) => `2px solid ${alphaColor(t.palette.text.primary, 0.08)}` : "none", ml: indentMl, ...(String(highlightedCommentId) === String(node.id) ? { bgcolor: (t) => alphaColor('#A87822', 0.08), borderRadius: 2.5, border: '2px solid', borderColor: (t) => `${alphaColor('#A87822', 0.45)}`, boxShadow: (t) => `0 0 16px ${alphaColor('#A87822', 0.15)}`, px: 1.5, my: 0.5, transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease' } : {}), ...(newCommentIds && newCommentIds.has(String(node.id)) ? NEW_COMMENT_FADE_SX : {}) }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", py: 1.25 }}>
                    <Avatar src={liveDisplayAvatar || undefined} alt={displayName}
                            sx={(t) => ({ width: avatarSize, height: avatarSize, flexShrink: 0, cursor: "pointer",
                                border: "1px solid",
                                borderColor: "divider",
                                ...(!liveDisplayAvatar && isBusinessComment ? { bgcolor: alphaColor(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                ...(!liveDisplayAvatar && isArtistComment ? { bgcolor: alphaColor(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                ...(!liveDisplayAvatar && !isBusinessComment && !isArtistComment ? { bgcolor: alphaColor(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                            })}
                            onClick={handleAvatarNameClick}>
                        {!displayAvatar && isBusinessComment ? <StorefrontOutlinedIcon sx={{ fontSize: avatarSize * 0.6 }} /> : null}
                        {!displayAvatar && isArtistComment && isVisualArtistComment ? <PaletteRoundedIcon sx={{ fontSize: avatarSize * 0.6 }} /> : null}
                        {!displayAvatar && isArtistComment && !isVisualArtistComment ? <MusicNoteRoundedIcon sx={{ fontSize: avatarSize * 0.6 }} /> : null}
                        {!displayAvatar && !isBusinessComment && !isArtistComment ? <PersonIcon sx={{ fontSize: avatarSize * 0.6 }} /> : null}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* "Replying to [Name]'s comment" label for replies */}
                        {depth > 0 && replyToName ? (
                            <Typography variant="caption"
                                        sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                <Box component="span" sx={{ color: 'primary.main' }}>↳</Box>
                                Replying to {replyToName}&apos;s{' '}
                                <Box component="span"
                                     onClick={(e) => { e.stopPropagation(); if (parentCommentId && onScrollToComment) onScrollToComment(parentCommentId); }}
                                     sx={{ color: 'primary.main', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                    comment
                                </Box>
                            </Typography>
                        ) : null}
                        {/* Header: name row + 3-dot menu right-aligned */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                            <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.25 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, cursor: "pointer", fontSize: depth >= 2 ? 13 : 14, "&:hover": { textDecoration: "underline" } }} onClick={handleAvatarNameClick} noWrap>
                                        {displayName}
                                    </Typography>
                                    {isPinned && depth === 0 ? (
                                        <Chip size="small" icon={<PushPinRoundedIcon sx={{ fontSize: 11 }} />} label="Pinned"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.5, bgcolor: alphaColor(t.palette.secondary.main, 0.10), color: t.palette.secondary.main, border: "1px solid", borderColor: alphaColor(t.palette.secondary.main, 0.24), "& .MuiChip-icon": { ml: "2px", mr: "0px", color: t.palette.secondary.main }, "& .MuiChip-label": { px: 0.5 } })} />
                                    ) : null}
                                    {isCommentByArtist ? (
                                        <Chip size="small" label="Author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.5, bgcolor: alphaColor(t.palette.primary.main, 0.10), color: t.palette.primary.main, border: "1px solid", borderColor: alphaColor(t.palette.primary.main, 0.24), "& .MuiChip-label": { px: 0.5 } })} />
                                    ) : null}
                                    {forceShowBlocked ? (
                                        <Chip size="small" icon={<BlockIcon sx={{ fontSize: 11 }} />} label={depth > 0 ? "Blocked user" : "Blocked user"}
                                              onClick={() => onHideBlocked?.(node.id)}
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.5, bgcolor: alphaColor(t.palette.text.primary, 0.06), color: "text.secondary", cursor: "pointer", "& .MuiChip-icon": { ml: "2px", mr: "0px", color: "text.disabled" }, "& .MuiChip-label": { px: 0.5 } })} />
                                    ) : null}
                                    {createdLabel ? (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.disabled" }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", fontSize: 11 }}>{createdLabel}</Typography>
                                        </>
                                    ) : null}
                                    {Boolean(node.liked_by_author) && !isCommentByArtist && (
                                        <Chip size="small" icon={<FavoriteRoundedIcon sx={{ fontSize: 10 }} />} label="by author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alphaColor(t.palette.error.main, 0.08), color: t.palette.error.main, border: '1px solid', borderColor: alphaColor(t.palette.error.main, 0.18), '& .MuiChip-icon': { ml: '2px', mr: '-2px', color: t.palette.error.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                </Box>
                                {displayHandle ? (
                                    <Typography variant="caption" onClick={handleAvatarNameClick}
                                                sx={{ color: "text.secondary", fontSize: 11, lineHeight: 1.2, mt: 0.1, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                                        @{displayHandle}
                                    </Typography>
                                ) : null}
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
                                                bgcolor: (t) => alphaColor(t.palette.warning.main, 0.10),
                                                border: (t) => `1px solid ${alphaColor(t.palette.warning.main, 0.28)}`,
                                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.warning.main, 0.16) },
                                            }}
                                        >
                                            <PushPinRoundedIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                                {hasAnyMenuItems ? (
                                    <Box>
                                        <IconButton size="small" onClick={openMenu} sx={{ p: 0.25 }}>
                                            <MoreVertIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <SmartMenu anchorEl={menuAnchor} open={menuOpen} onClose={closeMenu} onClick={(e) => e.stopPropagation()}
                                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                                                   slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 170, boxShadow: (t) => `0 18px 50px ${alphaColor(t.palette.text.primary, 0.16)}` } } }}>
                                            {canPin && (
                                                <MenuItem onClick={(e) => { closeMenu(e); onTogglePinConfirm?.(node.id, isPinned); }}>
                                                    <ListItemIcon><PushPinRoundedIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary={isPinned ? "Unpin comment" : "Pin comment"} />
                                                </MenuItem>
                                            )}
                                            {canDelete ? (
                                                <MenuItem onClick={(e) => { closeMenu(e); onDelete?.(node.id, depth > 0); }} sx={{ color: "error.main" }}>
                                                    <ListItemIcon sx={{ color: "error.main" }}><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary={deleteLabel} />
                                                </MenuItem>
                                            ) : null}
                                            {!isOwnComment && viewerId ? (
                                                <MenuItem onClick={(e) => { closeMenu(e); openFlag?.(node.id); }}>
                                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary="Report" />
                                                </MenuItem>
                                            ) : null}
                                        </SmartMenu>
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.55, fontSize: depth >= 2 ? 13 : 14 }}>{renderCommentText(displayText)}</Typography>
                        {(node.images?.length > 0 || node.image) ? (
                            <CommentImages images={node.images} image={node.image} />
                        ) : null}
                        {needsTruncate ? (
                            <Link component="button" type="button" underline="hover" onClick={() => setShowFullText((v) => !v)} sx={{ fontSize: 12, fontWeight: 700, p: 0, mt: 0.25 }}>
                                {showFullText ? "Show less" : "Show more"}
                            </Link>
                        ) : null}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.75 }}>
                            <Link component="button" type="button" underline="none"
                                  onClick={() => { if (!viewerId) { onRequireAuth?.(); return; } likeComment?.(node.id, liked); }}
                                  sx={{ fontSize: 13, fontWeight: liked ? 900 : 700, color: liked ? "primary.main" : "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}>
                                {liked ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />} {likes > 0 ? likes : "Like"}
                            </Link>
                            <Link component="button" type="button" underline="none"
                                  onClick={() => { if (!viewerId) { onRequireAuth?.(); return; } setShowReplyBox((v) => !v); }}
                                  sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}>
                                <ReplyRoundedIcon sx={{ fontSize: 16, transform: "scaleX(-1)" }} /> Reply
                            </Link>
                            {onShareComment && (
                                <Link component="button" type="button" underline="none"
                                      onClick={() => onShareComment(node)}
                                      sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5, p: 0 }}>
                                    <ShareOutlinedIcon sx={{ fontSize: 14 }} /> Share
                                </Link>
                            )}
                        </Box>
                        {showReplyBox ? (
                            <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "flex-start", position: "relative" }}>
                                <ComposerAvatar
                                    url={viewerAvatarUrl}
                                    accountType={isAA ? 'artist' : isBA ? 'business' : 'personal'}
                                    profileType={isAA ? viewerProfileType : undefined}
                                    label={viewerLabel}
                                    size={replyAvatarSize}
                                    iconSize={Math.round(replyAvatarSize * 0.6)}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <TextField inputRef={rpInputRef} fullWidth multiline minRows={1} maxRows={4}
                                               value={replyText} onChange={handleRpChange}
                                               onKeyDown={handleRpKeyDown} placeholder={`Reply to ${displayName}... (type @ to mention)`}
                                               variant="outlined"
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
                                                                       sx={{ ml: 0.5, bgcolor: "primary.main", color: "common.white", width: 32, height: 32, flexShrink: 0, "&:hover": { bgcolor: "primary.dark" }, "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled", opacity: 1 } }}>
                                                               {posting ? <CircularProgress size={16} sx={{ color: "common.white" }} /> : <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                                                           </IconButton>
                                                       </InputAdornment>
                                                   ),
                                               }} />
                                    {/* Reply image + GIF attachments */}
                                    <CommentImageAttachments
                                        files={replyFiles}
                                        urls={replyImageUrls}
                                        onFilesChange={async (newFiles) => {
                                            if (replyError) setReplyError('');
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
                                    {renderMentionPopper({
                                        open: rpMentionOpen && Boolean(rpMentionAnchorEl),
                                        anchorEl: rpMentionAnchorEl,
                                        results: rpMentionResults,
                                        loading: rpMentionLoading,
                                        activeIdx: rpMentionActiveIdx,
                                        onSelect: insertRpMention,
                                        onClose: closeRpMention,
                                    })}
                                </Box>
                            </Box>
                        ) : null}
                        {hasReplies && !isExpanded ? (
                            <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                                  sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 600, color: "primary.main" }}>Show replies ({replies.length})</Link>
                        ) : null}
                        {hasReplies && isExpanded ? (
                            <Link component="button" type="button" underline="hover" onClick={handleToggleExpand}
                                  sx={{ mt: 0.5, p: 0, fontSize: 13, fontWeight: 600, color: "primary.main" }}>Hide replies</Link>
                        ) : null}
                    </Box>
                </Box>
            </Box>
            {hasReplies && isExpanded ? (
                <Box sx={{ pl: indentPl, ml: indentMl }}>
                    {shownReplies.map((reply) => (<ThreadedCommentItem key={reply.id} node={reply} depth={depth + 1} {...childProps} />))}
                    {hasMoreReplies ? (
                        <Link component="button" type="button" underline="hover"
                              onClick={() => setVisibleReplies((n) => n + INITIAL_REPLIES_SHOWN)}
                              sx={{ mt: 0.75, mb: 0.5, p: 0, fontSize: 13, fontWeight: 700, color: "primary.main" }}>
                            Show {Math.min(INITIAL_REPLIES_SHOWN, remainingReplies)} more {remainingReplies === 1 ? "reply" : "replies"}
                        </Link>
                    ) : null}
                </Box>
            ) : null}
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════════ */

function sortTopLevelThreads(arr, mode, boostIds, focusCommentId) {
    // Determine which top-level thread contains the focus comment
    let focusThreadId = null;
    if (focusCommentId) {
        const fid = String(focusCommentId);
        for (const thread of arr) {
            if (String(thread.id) === fid) { focusThreadId = String(thread.id); break; }
            const searchReplies = (replies) => {
                if (!Array.isArray(replies)) return false;
                for (const r of replies) {
                    if (String(r.id) === fid) return true;
                    if (searchReplies(r.replies)) return true;
                }
                return false;
            };
            if (searchReplies(thread.replies)) { focusThreadId = String(thread.id); break; }
        }
    }

    const sorted = [...arr];
    sorted.sort((a, b) => {
        const ap = a.is_pinned ? 1 : 0;
        const bp = b.is_pinned ? 1 : 0;
        if (bp !== ap) return bp - ap;
        // Focus thread (from engagement navigation) appears right after pinned
        if (focusThreadId) {
            const aFocus = String(a.id) === focusThreadId ? 1 : 0;
            const bFocus = String(b.id) === focusThreadId ? 1 : 0;
            if (aFocus !== bFocus) return bFocus - aFocus;
        }
        if (boostIds && boostIds.size > 0) {
            const aBoost = boostIds.has(a.id) ? 1 : 0;
            const bBoost = boostIds.has(b.id) ? 1 : 0;
            if (aBoost !== bBoost) return bBoost - aBoost;
        }
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

/* ─────────────────────────────────────────────────────────────────────────────
   Music Post Edit History Dialog
   ───────────────────────────────────────────────────────────────────────────── */

function parseMediaUrl(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    try { const p = JSON.parse(s); if (Array.isArray(p)) return p.find((u) => typeof u === "string" && u.trim()) || null; } catch { /* not JSON */ }
    return s;
}

function formatMusicHistoryDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function MusicPostEditHistoryDialog({ open, onClose, rows, loading, error }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ zIndex: 100001 }} PaperProps={{ sx: { position: "relative" } }} onClick={(e) => e.stopPropagation()}>
            <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                Edit History
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}
                {!loading && error && <Typography color="error" sx={{ py: 2, textAlign: "center" }}>{error}</Typography>}
                {!loading && !error && rows.length === 0 && <Typography color="text.secondary" sx={{ py: 2, textAlign: "center", fontSize: 14 }}>This post was edited, but detailed version history is not available for edits made before history tracking was enabled.</Typography>}
                {!loading && !error && rows.length > 0 && (
                    <Box sx={{ position: "relative", pl: 2.5 }}>
                        <Box sx={{ position: "absolute", left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                        {rows.map((row, idx) => {
                            const isLatest = idx === 0;
                            const isOriginal = idx === rows.length - 1;
                            const prevRow = idx > 0 ? rows[idx - 1] : null;
                            const diffs = [];

                            if (isOriginal) {
                                // Original — no diffs
                            } else if (prevRow) {
                                const before = row;
                                const after = prevRow;
                                if ((before.prevTitle || "") !== (after.prevTitle || "")) diffs.push({ label: "Title", from: (before.prevTitle || "(empty)").slice(0, 60), to: (after.prevTitle || "(empty)").slice(0, 60) });
                                if ((before.prevBody || "") !== (after.prevBody || "")) diffs.push({ label: "Description", bodyDiff: true });
                                if ((before.prevMediaUrl || "") !== (after.prevMediaUrl || "")) diffs.push({ label: "Photo", oldMedia: parseMediaUrl(before.prevMediaUrl), newMedia: parseMediaUrl(after.prevMediaUrl) });
                            } else {
                                if (row.prevTitle) diffs.push({ label: "Title", changed: true, detail: `Previously: "${(row.prevTitle || "").slice(0, 50)}"` });
                                if (row.prevBody) diffs.push({ label: "Description", changed: true, detail: `Previously: "${(row.prevBody || "").slice(0, 60)}${(row.prevBody || "").length > 60 ? "..." : ""}"` });
                                if (row.prevMediaUrl) diffs.push({ label: "Photo", oldMedia: parseMediaUrl(row.prevMediaUrl) });
                            }

                            return (
                                <Box key={row.id || idx} sx={{ position: "relative", pb: idx < rows.length - 1 ? 2.5 : 0 }}>
                                    <Box sx={{ position: "absolute", left: -20, top: 4, width: 12, height: 12, borderRadius: "50%", bgcolor: isOriginal ? "grey.400" : isLatest ? "secondary.main" : "primary.main", border: "2px solid", borderColor: "background.paper", boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? "text.secondary" : "text.primary" }}>
                                            {isOriginal ? "Original" : isLatest ? "Latest edit" : `Edit ${row.editNumber || row.edit_number || idx + 1}`}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>{formatMusicHistoryDate(row.editedAt || row.edited_at)}</Typography>
                                    </Stack>
                                    {!isOriginal && diffs.length > 0 ? (
                                        <Box sx={{ bgcolor: (t) => alphaColor(t.palette.primary.main, 0.025), border: "1px solid", borderColor: (t) => alphaColor(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {diffs.map((d, i) => (
                                                <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.25, py: 0.5 }}>
                                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                                        <Chip label={d.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: "primary.dark", border: "none", flexShrink: 0, mt: 0.1, "& .MuiChip-label": { px: 1 } }} />
                                                        {d.changed ? (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", lineHeight: 1.5, pt: 0.15 }}>{d.detail || "Updated"}</Typography>
                                                        ) : d.bodyDiff ? (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, pt: 0.15 }}>Updated</Typography>
                                                        ) : d.oldMedia || d.newMedia ? (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", lineHeight: 1.5, pt: 0.15 }}>{d.newMedia && !d.oldMedia ? "added" : !d.newMedia && d.oldMedia ? "removed" : "changed"}</Typography>
                                                        ) : (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: "break-word" }}>
                                                                <Box component="span" sx={{ textDecoration: "line-through", opacity: 0.55 }}>{d.from}</Box>
                                                                <Box component="span" sx={{ mx: 0.5, color: "text.disabled" }}>→</Box>
                                                                <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>{d.to}</Box>
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {(d.oldMedia || d.newMedia) && (
                                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pl: 0.5, mt: 0.5 }}>
                                                            {d.oldMedia ? (
                                                                <Box sx={{ position: "relative", width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "2px solid", borderColor: "error.main", opacity: 0.6 }}>
                                                                    <Box component="img" src={d.oldMedia} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.35)" }}>
                                                                        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                                                                    </Box>
                                                                </Box>
                                                            ) : null}
                                                            {d.newMedia ? (
                                                                <Box sx={{ position: "relative", width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "2px solid", borderColor: "success.main" }}>
                                                                    <Box component="img" src={d.newMedia} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.2)" }}>
                                                                        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                                                                    </Box>
                                                                </Box>
                                                            ) : null}
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : !isOriginal ? (
                                        <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", pl: 0.5 }}>Post details updated</Typography>
                                    ) : (
                                        <Box sx={{ bgcolor: (t) => alphaColor(t.palette.grey[500], 0.04), border: "1px solid", borderColor: (t) => alphaColor(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {row.prevTitle && <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.primary", mb: 0.25 }}>{(row.prevTitle || "").slice(0, 80)}</Typography>}
                                            {row.prevBody && <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.4 }}>{(row.prevBody || "").slice(0, 100)}{(row.prevBody || "").length > 100 ? "..." : ""}</Typography>}
                                            {parseMediaUrl(row.prevMediaUrl) && (
                                                <Box sx={{ mt: 0.75, width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                                                    <Box component="img" src={parseMediaUrl(row.prevMediaUrl)} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                </Box>
                                            )}
                                            {!row.prevTitle && !row.prevBody && <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Original post created</Typography>}
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

export default function MusicPostDetailPanel({ post: postProp, user, onViewPost, onLocationClick, onCommentSuccess, onBack, scrollToCommentId: scrollToCommentIdProp = null, highlightCommentId: highlightCommentIdProp = null, initialPhotoIndex = 0 }) {
    const [avatarErrored, setAvatarErrored] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [showFullBody, setShowFullBody] = useState(false);
    const mpdpTheme = useTheme();
    const isMobile = useMediaQuery(mpdpTheme.breakpoints.down("md"));

    // ── Refresh counts (engagement tabs may pass stale data) ──
    const [freshCounts, setFreshCounts] = useState(null);
    useEffect(() => {
        if (!postProp?.id) { setFreshCounts(null); return; }
        let cancelled = false;
        (async () => {
            try {
                const artId = postProp.artist_id || postProp.artistId || '';
                let res;
                if (artId) {
                    res = await secureFetch(`/api/music/artists/${encodeURIComponent(artId)}/posts/${encodeURIComponent(postProp.id)}`, { credentials: 'include' });
                }
                if (!res || !res.ok) {
                    res = await secureFetch(`/api/community/${encodeURIComponent(postProp.id)}`, { credentials: 'include' });
                }
                if (!res.ok) return;
                const data = await res.json();
                const d = Array.isArray(data) ? data[0] : (data?.post || data);
                if (!cancelled && d && typeof d === 'object') {
                    setFreshCounts({
                        likesCount: d.likesCount ?? d.likes_count ?? d.like_count ?? d.likes,
                        like_count: d.like_count ?? d.likes_count ?? d.likesCount ?? d.likes,
                        commentsCount: d.commentsCount ?? d.comments_count ?? d.comment_count ?? d.comments,
                        comment_count: d.comment_count ?? d.comments_count ?? d.commentsCount ?? d.comments,
                        repostsCount: d.repostsCount ?? d.reposts_count ?? d.repost_count ?? d.reposts,
                        repost_count: d.repost_count ?? d.reposts_count ?? d.repostsCount ?? d.reposts,
                        viewerLiked: d.viewerLiked ?? d.viewer_liked ?? d.liked ?? d.is_liked,
                        viewerReposted: d.viewerReposted ?? d.viewer_reposted ?? d.reposted ?? d.is_reposted,
                        artist_name: d.artist_name ?? d.artistName,
                        artist_handle: d.artist_handle ?? d.artistHandle,
                        artist_avatar_url: d.artist_avatar_url ?? d.artistAvatarUrl,
                        first_name: d.first_name, last_name: d.last_name,
                        handle: d.handle, avatar_url: d.avatar_url,
                    });
                }
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [postProp?.id]);

    // Merge fresh counts so downstream reads are accurate
    const post = freshCounts ? { ...postProp, ...Object.fromEntries(Object.entries(freshCounts).filter(([, v]) => v != null)) } : postProp;

    // Threaded comments state
    const [threads, setThreads] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [visibleCount, setVisibleCount] = useState(INITIAL_COMMENTS_SHOWN);
    const [commentSort, setCommentSort] = useState('popular');
    const [displayThreads, setDisplayThreads] = useState([]);
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());
    const newCommentTimerRef = useRef(0);
    const commentSortRef = useRef('popular');
    commentSortRef.current = commentSort;

    // Share comment dialog state
    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);
    const handleShareComment = useCallback((commentNode) => {
        setShareCommentTarget(commentNode);
        setShareCommentDialogOpen(true);
    }, []);
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const highlightTimerRef = useRef(0);
    const [commentText, setCommentText] = useState("");
    const [commentPosting, setCommentPosting] = useState(false);
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentImageUrls, setCommentImageUrls] = useState([]);
    const [commentError, setCommentError] = useState('');
    const composerRef = useRef(null);
    const commentInputRef = useRef(null);

    // Rate limiting for comments & replies
    const { checkLimit: checkCommentLimit, recordAction: recordComment } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [commentRateLimitOpen, setCommentRateLimitOpen] = useState(false);
    const [commentRateLimitInfo, setCommentRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });

    // Edit history dialog state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    // 3-dot post menu state
    const [postMenuEl, setPostMenuEl] = useState(null);
    const [copyToast, setCopyToast] = useState(false);

    // Edit-limit state
    const [editLimitReached, setEditLimitReached] = useState(false);
    const [editLimitMsg, setEditLimitMsg] = useState("");
    const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false);

    // ── Comment @mention state ──
    const [cmMentionOpen, setCmMentionOpen] = useState(false);

    // ── Blocked users for comment placeholders ──
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());
    const [shownBlockedIds, setShownBlockedIds] = useState(() => new Set());
    const handleShowBlocked = useCallback((commentId) => {
        setShownBlockedIds((prev) => new Set(prev).add(Number(commentId)));
    }, []);
    const handleHideBlocked = useCallback((commentId) => {
        setShownBlockedIds((prev) => { const next = new Set(prev); next.delete(Number(commentId)); return next; });
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        let active = true;
        (async () => {
            try {
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers: { Accept: 'application/json' },
                });
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
    // Listen for blocked-changed events (real-time updates during session)
    useEffect(() => {
        const onBlockedChanged = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
    }, []);

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

    const insertCmMention = (u) => {
        const handle = u.handle || u.username || "";
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
        const val = e.target.value.slice(0, COMMENT_MAX_CHARS);
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

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, commentId: null, isReply: false });

    // Pin confirmation
    const [pinConfirm, setPinConfirm] = useState({ open: false, commentId: null, currentlyPinned: false });

    // Flag/report comments
    const [flagState, setFlagState] = useState({ open: false, commentId: null, reason: "", details: "", submitting: false });
    const [flagSubmitted, setFlagSubmitted] = useState(false);

    // Report post (uses shared ReportContentDialog)
    const [postReportOpen, setPostReportOpen] = useState(false);

    // Hide / Block artist state
    const [hideBlockToast, setHideBlockToast] = useState("");
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(""), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    // Active account context
    const {
        activeAccount, activeAccountType, accountCacheKey,
        isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId,
    } = useActiveAccount();
    const acctType = (activeAccountType || "personal").toLowerCase();
    const isOnBusinessOrArtist = acctType === "business" || acctType === "artist";

    // Fetch active account avatar + profile_type. For artist accounts we
    // ALWAYS fetch so profile_type is authoritative (mirrors
    // ArtistAdminConsole). Business accounts can short-circuit when an
    // avatar is already populated in context.
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
                // right values. Overwrite unconditionally (last-writer-wins)
                // so stale cached values get corrected.
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

    // Page-level artist sub-type. Fetched value is authoritative.
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

    // Auth context
    const authCtx = useAuth();
    const viewerUser = authCtx?.user || null;

    // UserCardPopover state
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [userCardViewProfileOnly, setUserCardViewProfileOnly] = useState(false);
    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    const viewerId = user?.id || user?.user_id || null;

    const viewerAvatarUrl = (() => {
        if (isOnBusinessOrArtist && activeAccount) {
            if (fetchedAccountAvatar) return fetchedAccountAvatar;
            const candidates = [activeAccount.avatar_url, activeAccount.avatarUrl, activeAccount.logo_url, activeAccount.logoUrl, activeAccount.logo, activeAccount.profile_picture];
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && s !== 'null' && s !== 'undefined' && !s.includes('default_avatar') && !s.includes('default_business') && !s.includes('default_logo')) return s;
            }
            return '';
        }
        const raw = user?.avatar_url || user?.profile_picture || user?.avatarUrl || user?.avatar || '';
        if (!raw || raw.includes('default_avatar')) return '';
        return raw;
    })();

    const viewerHandle = (() => {
        if (isOnBusinessOrArtist && activeAccount) return activeAccount.handle || activeAccount.slug || "";
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
        return user?.name || user?.displayName || user?.handle || user?.username || "You";
    })();

    useEffect(() => {
        setAvatarErrored(false); setImgError(false); setShowFullBody(false);
        setCommentText(""); setExpanded({}); setVisibleCount(INITIAL_COMMENTS_SHOWN);
    }, [post?.id]);

    const artistId = post?.artistId || post?.artist_id || 0;
    const postId = post?.id || 0;

    const openHistory = useCallback((e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (!artistId || !postId) return;
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryError("");
        setHistoryRows([]);
        secureFetch(`/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}/edits`, { credentials: "include", cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
            .then((data) => {
                const edits = Array.isArray(data?.edits) ? data.edits : Array.isArray(data) ? data : [];
                setHistoryRows(edits);
            })
            .catch((err) => setHistoryError(err?.message || "Failed to load edit history"))
            .finally(() => setHistoryLoading(false));
    }, [artistId, postId]);

    /* ── Tree manipulation helpers (matches EventDetailPanel) ── */

    const updateCommentInTree = useCallback((currentThreads, commentId, updater) => {
        const updateNode = (node) => {
            if (String(node.id) === String(commentId)) return updater(node);
            if (node.replies && node.replies.length > 0) return { ...node, replies: node.replies.map(updateNode) };
            return node;
        };
        return currentThreads.map(updateNode);
    }, []);

    const addReplyToTree = useCallback((currentThreads, parentId, newReply) => {
        const updateNode = (node) => {
            if (String(node.id) === String(parentId)) return { ...node, replies: [...(node.replies || []), newReply], reply_count: (node.reply_count || 0) + 1 };
            if (node.replies && node.replies.length > 0) return { ...node, replies: node.replies.map(updateNode) };
            return node;
        };
        return currentThreads.map(updateNode);
    }, []);

    const removeCommentFromTree = useCallback((currentThreads, commentId) => {
        const removeNode = (nodes) => nodes
            .filter((node) => String(node.id) !== String(commentId))
            .map((node) => node.replies && node.replies.length > 0 ? { ...node, replies: removeNode(node.replies) } : node);
        return removeNode(currentThreads);
    }, []);

    const scrollToComment = useCallback((commentId) => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCommentId(String(commentId));
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 2200);
        }
    }, []);

    // Re-sort display order when sort mode changes (NOT on like updates)
    useEffect(() => {
        setDisplayThreads((prev) => {
            if (!prev.length) return prev;
            return sortTopLevelThreads(prev, commentSort);
        });
    }, [commentSort]);

    /* ── Load comments ── */

    useEffect(() => {
        if (!artistId || !postId) { setThreads([]); return; }
        let cancelled = false;
        setCommentsLoading(true);
        const qp = new URLSearchParams();
        if (activeBusinessId) qp.set("activeBusinessId", String(activeBusinessId));
        else if (activeArtistId) qp.set("activeArtistId", String(activeArtistId));
        const qs = qp.toString() ? `?${qp.toString()}` : "";
        (async () => {
            try {
                const res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}/comments${qs}`, {
                    credentials: "include", headers: { ...getAccountHeaders() },
                });
                if (!cancelled && res.ok) {
                    const data = await res.json();
                    const raw = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
                    const normalized = normalizeComments(raw);
                    setThreads(normalized);
                    setDisplayThreads(sortTopLevelThreads(normalized, commentSortRef.current, undefined, scrollToCommentIdProp));
                }
            } catch { /* ignore */ } finally { if (!cancelled) setCommentsLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [artistId, postId, accountCacheKey, activeBusinessId, activeArtistId]);

    // Highlight a specific comment when opened from engagement tab.
    // The comment's thread is boosted to the top by sortTopLevelThreads (focusCommentId),
    // so no scrolling is needed. The highlight persists until the user has actually
    // seen the comment (IntersectionObserver) and then fades after a short delay.
    const highlightAppliedMusicRef = useRef(null);
    const highlightObserverMusicRef = useRef(null);

    useEffect(() => {
        highlightAppliedMusicRef.current = null;
        if (highlightObserverMusicRef.current) { highlightObserverMusicRef.current.disconnect(); highlightObserverMusicRef.current = null; }
    }, [postId]);

    useEffect(() => {
        const targetId = scrollToCommentIdProp ?? highlightCommentIdProp;
        if (!targetId || commentsLoading || !displayThreads.length) return;

        const targetKey = `${postId}:${targetId}`;
        if (highlightAppliedMusicRef.current === targetKey) return;
        highlightAppliedMusicRef.current = targetKey;

        // If the target is a reply, expand its parent thread so the DOM element renders
        const findParentThread = (threads, tid) => {
            for (const thread of threads) {
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

        const parentId = findParentThread(displayThreads, targetId);
        if (parentId) {
            setExpanded((prev) => ({ ...prev, [parentId]: true }));
        }

        // Set highlight immediately — persists until the comment is visible to the user
        setHighlightedCommentId(String(targetId));

        // Watch for the comment element to enter the viewport, then fade highlight
        const waitForEl = () => {
            const el = document.getElementById(`comment-${targetId}`);
            if (el) {
                if (highlightObserverMusicRef.current) highlightObserverMusicRef.current.disconnect();
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            highlightObserverMusicRef.current = null;
                            clearTimeout(highlightTimerRef.current);
                            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 1800);
                        }
                    },
                    { threshold: 0.3 }
                );
                observer.observe(el);
                highlightObserverMusicRef.current = observer;
            } else {
                setTimeout(waitForEl, 200);
            }
        };
        setTimeout(waitForEl, 100);

        return () => {
            if (highlightObserverMusicRef.current) { highlightObserverMusicRef.current.disconnect(); highlightObserverMusicRef.current = null; }
        };
    }, [postId, scrollToCommentIdProp, highlightCommentIdProp, commentsLoading, displayThreads]);

    /* ── Auth helper ── */

    const onRequireAuth = useCallback(() => {
        try {
            window.dispatchEvent(new CustomEvent("open-login"));
            window.dispatchEvent(new CustomEvent("open-auth-dialog"));
            window.dispatchEvent(new CustomEvent("open-login-popup"));
        } catch { /* ignore */ }
    }, []);

    /* ── Submit top-level comment ── */

    const submitComment = async () => {
        const text = commentText.trim();
        const hasImages = commentFiles.length > 0 || commentImageUrls.length > 0;
        if ((!text && !hasImages) || commentPosting || !artistId || !postId) return;
        if (!user) { onRequireAuth(); return; }

        // Client-side profanity check
        if (text) {
            const profResult = checkProfanity(text);
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

        setCommentPosting(true);

        const savedText = commentText;
        const savedFiles = [...commentFiles];
        const savedUrls = [...commentImageUrls];
        recordComment();
        setCommentText("");
        setCommentFiles([]);
        setCommentImageUrls([]);

        const payload = {
            content: text.slice(0, COMMENT_MAX_CHARS),
            ...(savedUrls.length > 0 ? { image_urls: savedUrls } : {}),
            ...(isBusinessAccount && activeBusinessId ? { business_id: activeBusinessId, account_type: "business", account_id: activeBusinessId, account_handle: activeAccount?.slug || activeAccount?.handle || "", account_name: activeAccount?.name || "", account_avatar_url: activeAccount?.avatar_url || activeAccount?.logo_url || "" } : {}),
            ...(isArtistAccount && activeArtistId ? { artist_id: activeArtistId, account_type: "artist", account_id: activeArtistId, account_handle: activeAccount?.slug || activeAccount?.handle || "", account_name: activeAccount?.name || "", account_avatar_url: activeAccount?.avatar_url || "" } : {}),
        };

        try {
            let res;
            const acctHdrs = getAccountHeaders();

            // Upload local image files to GCS first (deferred from selection time)
            let allImageUrls = [...savedUrls];
            if (savedFiles.length > 0) {
                try {
                    const uploadedUrls = await uploadFilesToGCS(savedFiles);
                    if (uploadedUrls.length === 0) {
                        setCommentError('Failed to upload images. Please try again.');
                        setCommentText(savedText); setCommentFiles(savedFiles); setCommentImageUrls(savedUrls);
                        setCommentPosting(false);
                        return;
                    }
                    allImageUrls = [...uploadedUrls, ...allImageUrls];
                } catch {
                    setCommentError('Failed to upload images. Please check your connection and try again.');
                    setCommentText(savedText); setCommentFiles(savedFiles); setCommentImageUrls(savedUrls);
                    setCommentPosting(false);
                    return;
                }
            }
            if (allImageUrls.length > 0) {
                payload.image_urls = allImageUrls;
            }

            res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}/comments`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json", ...acctHdrs },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const serverComment = await res.json();
                const created = serverComment?.comment || serverComment;

                // Build the comment object with account identity fields (matches BusinessPostPage pattern)
                let displayFirstName = "";
                let displayLastName = "";
                let displayAvatarLocal = viewerAvatarUrl;
                let displayHandleLocal = viewerHandle;
                if (isOnBusinessOrArtist && activeAccount) {
                    displayFirstName = activeAccount.name || activeAccount.business_name || activeAccount.artist_name || "";
                } else {
                    displayFirstName = user?.first_name || user?.firstName || "";
                    displayLastName = user?.last_name || user?.lastName || "";
                    if (!displayFirstName && !displayLastName) {
                        const fullName = user?.name || user?.displayName || "";
                        if (fullName) { const parts = fullName.trim().split(" "); displayFirstName = parts[0] || ""; displayLastName = parts.slice(1).join(" ") || ""; }
                    }
                    if (!displayFirstName && !displayLastName && displayHandleLocal) displayFirstName = displayHandleLocal;
                }

                const finalComment = created && created.id ? {
                    ...created,
                    first_name: created.first_name || displayFirstName,
                    last_name: created.last_name || displayLastName,
                    handle: created.handle || displayHandleLocal,
                    avatar: created.avatar || displayAvatarLocal,
                    business_id: isBusinessAccount && activeBusinessId ? activeBusinessId : (created.business_id || null),
                    business_name: isBusinessAccount ? (created.business_name || activeAccount?.name || null) : (created.business_name || null),
                    business_slug: isBusinessAccount ? (created.business_slug || activeAccount?.slug || activeAccount?.handle || null) : (created.business_slug || null),
                    business_avatar_url: isBusinessAccount ? (created.business_avatar_url || activeAccount?.avatar_url || activeAccount?.logo_url || null) : (created.business_avatar_url || null),
                    artist_id: isArtistAccount && activeArtistId ? activeArtistId : (created.artist_id || null),
                    artist_name: isArtistAccount ? (created.artist_name || activeAccount?.name || null) : (created.artist_name || null),
                    artist_handle: isArtistAccount ? (created.artist_handle || activeAccount?.slug || activeAccount?.handle || null) : (created.artist_handle || null),
                    artist_avatar_url: isArtistAccount ? (created.artist_avatar_url || activeAccount?.avatar_url || null) : (created.artist_avatar_url || null),
                    account_type: isBusinessAccount ? "business" : isArtistAccount ? "artist" : (created.account_type || null),
                    // Preserve artist sub-type on the optimistic insert so the
                    // avatar fallback picks palette vs music-note correctly
                    // before the list is reloaded. Backend now returns this
                    // (POST /api/music/artists/:id/posts/:id/comments) — fall
                    // back to the viewer's own profile_type when the server
                    // omits it (e.g. pre-migration backends).
                    profile_type: isArtistAccount
                        ? (created.profile_type || created.profileType || viewerProfileType || 'music')
                        : (created.profile_type || null),
                    account_handle: created.account_handle || (isBusinessAccount ? (activeAccount?.slug || activeAccount?.handle || null) : isArtistAccount ? (activeAccount?.slug || activeAccount?.handle || null) : null),
                    account_name: created.account_name || (isBusinessAccount ? (activeAccount?.name || null) : isArtistAccount ? (activeAccount?.name || null) : null),
                    account_avatar_url: created.account_avatar_url || (isBusinessAccount ? (activeAccount?.avatar_url || activeAccount?.logo_url || null) : isArtistAccount ? (activeAccount?.avatar_url || null) : null),
                } : null;

                if (finalComment) {
                    const normalized = normalizeComments([finalComment]);
                    if (normalized.length > 0) {
                        ensureCommentFadeKeyframes();
                        const addedIds = new Set(normalized.map((c) => String(c.id)));
                        setNewCommentIds((prev) => {
                            const next = new Set(prev);
                            addedIds.forEach((id) => next.add(id));
                            return next;
                        });
                        // Clear the fade-in flag after animation completes
                        if (newCommentTimerRef.current) clearTimeout(newCommentTimerRef.current);
                        newCommentTimerRef.current = setTimeout(() => setNewCommentIds(new Set()), 2000);
                        setThreads((prev) => [...normalized, ...prev]);
                        setDisplayThreads((prev) => sortTopLevelThreads([...normalized, ...prev], commentSortRef.current, addedIds));
                    }
                }
            } else {
                // Restore text on failure
                setCommentText(savedText);
                setCommentFiles(savedFiles);
                setCommentImageUrls(savedUrls);
            }
        } catch {
            setCommentText(savedText);
            setCommentFiles(savedFiles);
            setCommentImageUrls(savedUrls);
        } finally { setCommentPosting(false); }
    };

    /* ── Submit reply (optimistic) ── */

    const submitReply = useCallback(async (parentId, text, { files: replyFileList = [], imageUrls: replyUrlList = [] } = {}) => {
        if (!user) return;

        // Rate limit check
        const rlResult = checkCommentLimit();
        if (!rlResult.allowed) {
            setCommentRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setCommentRateLimitOpen(true);
            return;
        }

        let displayFirstName = ""; let displayLastName = "";
        let displayAvatarLocal = viewerAvatarUrl; let displayHandleLocal = viewerHandle;
        if (isOnBusinessOrArtist && activeAccount) {
            displayFirstName = activeAccount.name || activeAccount.business_name || activeAccount.artist_name || "";
        } else {
            displayFirstName = user?.first_name || user?.firstName || "";
            displayLastName = user?.last_name || user?.lastName || "";
            if (!displayFirstName && !displayLastName) {
                const fullName = user?.name || user?.displayName || "";
                if (fullName) { const parts = fullName.trim().split(" "); displayFirstName = parts[0] || ""; displayLastName = parts.slice(1).join(" ") || ""; }
            }
            if (!displayFirstName && !displayLastName && displayHandleLocal) displayFirstName = displayHandleLocal;
        }
        const optimisticReply = {
            id: `temp_reply_${Date.now()}`, parentId, user_id: viewerId, public_id: user?.public_id,
            text, first_name: displayFirstName, last_name: displayLastName, handle: displayHandleLocal,
            avatar: displayAvatarLocal, created_at: new Date().toISOString(), likes: 0, viewer_liked: false,
            viewer_flagged: false, reply_count: 0, is_removed: false, removed_reason: "", removed_at: null,
            is_pinned: false, pinned_at: null,
            business_id: isBusinessAccount && activeBusinessId ? activeBusinessId : null,
            business_name: isBusinessAccount ? (activeAccount?.name || null) : null,
            business_slug: isBusinessAccount ? (activeAccount?.slug || activeAccount?.handle || null) : null,
            business_avatar_url: isBusinessAccount ? (activeAccount?.avatar_url || activeAccount?.logo_url || null) : null,
            artist_id: isArtistAccount && activeArtistId ? activeArtistId : null,
            artist_name: isArtistAccount ? (activeAccount?.name || null) : null,
            artist_handle: isArtistAccount ? (activeAccount?.slug || activeAccount?.handle || null) : null,
            artist_avatar_url: isArtistAccount ? (activeAccount?.avatar_url || null) : null,
            account_type: isBusinessAccount ? "business" : isArtistAccount ? "artist" : null,
            // Artist sub-type on the optimistic reply so the avatar fallback
            // picks palette vs music-note before the server response arrives.
            profile_type: isArtistAccount ? viewerProfileType : null,
            account_handle: isBusinessAccount ? (activeAccount?.slug || activeAccount?.handle || null) : isArtistAccount ? (activeAccount?.slug || activeAccount?.handle || null) : null,
            account_name: isBusinessAccount ? (activeAccount?.name || null) : isArtistAccount ? (activeAccount?.name || null) : null,
            account_avatar_url: isBusinessAccount ? (activeAccount?.avatar_url || activeAccount?.logo_url || null) : isArtistAccount ? (activeAccount?.avatar_url || null) : null,
            replies: [],
            images: replyUrlList.length > 0 ? [...replyUrlList] : [],
        };
        setThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        setDisplayThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        recordComment();
        ensureCommentFadeKeyframes();
        setNewCommentIds((prev) => new Set(prev).add(String(optimisticReply.id)));
        if (newCommentTimerRef.current) clearTimeout(newCommentTimerRef.current);
        newCommentTimerRef.current = setTimeout(() => setNewCommentIds(new Set()), 2000);
        const payload = {
            content: text, parent_id: parentId,
            ...(replyUrlList.length > 0 ? { image_urls: replyUrlList } : {}),
            ...(isBusinessAccount && activeBusinessId ? { business_id: activeBusinessId, account_type: "business", account_id: activeBusinessId, account_handle: activeAccount?.slug || activeAccount?.handle || "", account_name: activeAccount?.name || "", account_avatar_url: activeAccount?.avatar_url || activeAccount?.logo_url || "" } : {}),
            ...(isArtistAccount && activeArtistId ? { artist_id: activeArtistId, account_type: "artist", account_id: activeArtistId, account_handle: activeAccount?.slug || activeAccount?.handle || "", account_name: activeAccount?.name || "", account_avatar_url: activeAccount?.avatar_url || "" } : {}),
        };
        try {
            let res;
            const acctHdrs = getAccountHeaders();

            // Upload local image files to GCS first (deferred from selection time)
            let allReplyImageUrls = [...(replyUrlList || [])];
            if (replyFileList.length > 0) {
                try {
                    const uploadedUrls = await uploadFilesToGCS(replyFileList);
                    if (uploadedUrls.length === 0) {
                        return;
                    }
                    allReplyImageUrls = [...uploadedUrls, ...allReplyImageUrls];
                } catch {
                    return;
                }
            }
            if (allReplyImageUrls.length > 0) {
                payload.image_urls = allReplyImageUrls;
            }

            res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}/comments`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json", ...acctHdrs },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const newReply = await res.json();
                const normalizedReply = normalizeComments([newReply])[0];
                if (normalizedReply) {
                    setThreads((prev) => { const w = removeCommentFromTree(prev, optimisticReply.id); return addReplyToTree(w, parentId, normalizedReply); });
                    setDisplayThreads((prev) => { const w = removeCommentFromTree(prev, optimisticReply.id); return addReplyToTree(w, parentId, normalizedReply); });
                }
            } else { setThreads((prev) => removeCommentFromTree(prev, optimisticReply.id)); setDisplayThreads((prev) => removeCommentFromTree(prev, optimisticReply.id)); }
        } catch { setThreads((prev) => removeCommentFromTree(prev, optimisticReply.id)); setDisplayThreads((prev) => removeCommentFromTree(prev, optimisticReply.id)); }
    }, [user, viewerId, viewerAvatarUrl, viewerHandle, isOnBusinessOrArtist, activeAccount,
        isBusinessAccount, activeBusinessId, isArtistAccount, activeArtistId, artistId, postId,
        addReplyToTree, removeCommentFromTree, checkCommentLimit, recordComment]);

    /* ── Like comment (tree-based optimistic) ── */

    const likeComment = useCallback(async (commentId, currentlyLiked) => {
        if (!user) return;
        const uid = user?.id || user?.user_id || null;
        const ownerId = post?.owner_user_id || post?.ownerUserId || post?.createdByUserId || post?.created_by_user_id || null;
        const isLikerArtistOwner = uid != null && ownerId != null && String(uid) === String(ownerId);
        const likeUp = (node) => ({ ...node, viewer_liked: !currentlyLiked, likes: currentlyLiked ? Math.max(0, node.likes - 1) : node.likes + 1, ...(isLikerArtistOwner ? { liked_by_author: !currentlyLiked } : {}) });
        setThreads((prev) => updateCommentInTree(prev, commentId, likeUp));
        setDisplayThreads((prev) => updateCommentInTree(prev, commentId, likeUp));
        try {
            const res = await secureFetch(`/api/music/comments/${encodeURIComponent(commentId)}/like`, {
                method: "POST", credentials: "include", headers: { ...getAccountHeaders() },
            });
            if (!res.ok) {
                const revert = (node) => ({ ...node, viewer_liked: currentlyLiked, likes: currentlyLiked ? node.likes + 1 : Math.max(0, node.likes - 1), ...(isLikerArtistOwner ? { liked_by_author: currentlyLiked } : {}) });
                setThreads((prev) => updateCommentInTree(prev, commentId, revert));
                setDisplayThreads((prev) => updateCommentInTree(prev, commentId, revert));
            }
        } catch {
            const revert = (node) => ({ ...node, viewer_liked: currentlyLiked, likes: currentlyLiked ? node.likes + 1 : Math.max(0, node.likes - 1), ...(isLikerArtistOwner ? { liked_by_author: currentlyLiked } : {}) });
            setThreads((prev) => updateCommentInTree(prev, commentId, revert));
            setDisplayThreads((prev) => updateCommentInTree(prev, commentId, revert));
        }
    }, [user, post, updateCommentInTree]);

    /* ── Delete comment (tree-based optimistic) ── */

    const deleteComment = useCallback(async (commentId) => {
        if (!user) return;
        const previousThreads = threads;
        const previousDisplay = displayThreads;
        setThreads((prev) => removeCommentFromTree(prev, commentId));
        setDisplayThreads((prev) => removeCommentFromTree(prev, commentId));
        try {
            const res = await secureFetch(`/api/music/artists/${artistId}/posts/${postId}/comments/${encodeURIComponent(commentId)}`, {
                method: "DELETE", credentials: "include", headers: { ...getAccountHeaders() },
            });
            if (!res.ok) { setThreads(previousThreads); setDisplayThreads(previousDisplay); }
            else {
                // Notify profile engagement tabs so deleted comments are removed from the Comments tab
                try { window.dispatchEvent(new CustomEvent('ll:comment:deleted', { detail: { commentId: Number(commentId), postId: Number(postId) } })); } catch { /* ignore */ }
            }
        } catch { setThreads(previousThreads); setDisplayThreads(previousDisplay); }
    }, [user, artistId, postId, threads, displayThreads, removeCommentFromTree]);

    const requestDelete = useCallback((commentId, isReply = false) => {
        setDeleteConfirm({ open: true, commentId, isReply });
    }, []);

    /* ── Pin / unpin comment ── */

    const togglePinComment = useCallback(async (commentId, currentlyPinned) => {
        if (!user) return;
        const action = currentlyPinned ? "unpin" : "pin";
        const pinUpdater = (node) => {
            if (String(node.id) === String(commentId)) return { ...node, is_pinned: !currentlyPinned };
            if (node.is_pinned && !currentlyPinned) return { ...node, is_pinned: false };
            return node;
        };
        setThreads((prev) => prev.map(pinUpdater));
        setDisplayThreads((prev) => sortTopLevelThreads(prev.map(pinUpdater), commentSortRef.current));
        try {
            const res = await secureFetch(
                `/api/music/artists/${artistId}/posts/${postId}/comments/${encodeURIComponent(commentId)}/${action}`,
                { method: "POST", credentials: "include", headers: { ...getAccountHeaders() } }
            );
            if (!res.ok) {
                const revert = (node) => String(node.id) === String(commentId) ? { ...node, is_pinned: currentlyPinned } : node;
                setThreads((prev) => prev.map(revert));
                setDisplayThreads((prev) => sortTopLevelThreads(prev.map(revert), commentSortRef.current));
            }
        } catch {
            const revert = (node) => String(node.id) === String(commentId) ? { ...node, is_pinned: currentlyPinned } : node;
            setThreads((prev) => prev.map(revert));
            setDisplayThreads((prev) => sortTopLevelThreads(prev.map(revert), commentSortRef.current));
        }
    }, [user, artistId, postId]);

    const requestTogglePin = useCallback((commentId, currentlyPinned) => {
        togglePinComment(commentId, currentlyPinned);
    }, [togglePinComment]);

    /* ── Flag / report comment ── */

    const openFlagDialog = useCallback((commentId) => {
        setFlagState({ open: true, commentId, reason: "", details: "", submitting: false });
        setFlagSubmitted(false);
    }, []);

    const closeFlagDialog = useCallback(() => {
        setFlagState({ open: false, commentId: null, reason: "", details: "", submitting: false });
        setTimeout(() => setFlagSubmitted(false), 200);
    }, []);

    const submitFlag = useCallback(async () => {
        if (!user || !flagState.commentId || !flagState.reason) return;
        setFlagState((prev) => ({ ...prev, submitting: true }));
        const urls = [
            `/api/music/artists/${artistId}/posts/${postId}/comments/${encodeURIComponent(flagState.commentId)}/flag`,
            `/api/posts/comments/${encodeURIComponent(flagState.commentId)}/flag`,
        ];
        let success = false;
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json", ...getAccountHeaders() },
                    body: JSON.stringify({ reason: flagState.reason, details: flagState.details || null }),
                });
                if (res.ok) { success = true; break; }
            } catch { /* try next */ }
        }
        setFlagState((prev) => ({ ...prev, submitting: false }));
        if (success) {
            setFlagSubmitted(true);
        } else {
            closeFlagDialog();
        }
    }, [user, artistId, postId, flagState.commentId, flagState.reason, flagState.details, closeFlagDialog]);

    /* ══════════════════════════════════════════════════════════════════════════
       Self-contained UserCardPopover logic
       ══════════════════════════════════════════════════════════════════════════ */

    const requireAuth = useCallback((cb) => {
        if (viewerUser) return cb?.();
        onRequireAuth();
        return undefined;
    }, [viewerUser, onRequireAuth]);

    const hydrateTargetFromPublic = useCallback(async (target) => {
        if (!target) return null;
        const handleOrId = target.handle || target.id;
        if (!handleOrId) return null;
        const urls = [`${api}/users/public/${encodeURIComponent(handleOrId)}`, `/users/public/${encodeURIComponent(handleOrId)}`, `/api/users/public/${encodeURIComponent(handleOrId)}`].filter(Boolean);
        for (const u of urls) {
            try {
                const res = await secureFetch(u, { credentials: "include" });
                if (!res.ok) continue;
                const data = await res.json();
                const profile = data?.profile || data?.user || data;
                if (!profile) continue;
                setUserForCard((prev) => { if (!prev) return prev; if (!prev.id && profile.id) return { ...prev, id: profile.id }; return prev; });
                const sjRaw = profile.social_json;
                let sj = {};
                if (typeof sjRaw === "string") { try { sj = JSON.parse(sjRaw || "{}"); } catch { sj = {}; } }
                else if (sjRaw && typeof sjRaw === "object") sj = sjRaw;
                const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                const isF = !!viewerUser?.id && followers.includes(Number(viewerUser.id));
                if (profile.id && isF) { setServerFollowingSet((old) => { const next = new Set(old); next.add(Number(profile.id)); return next; }); }
                return profile;
            } catch { /* try next */ }
        }
        return null;
    }, [viewerUser?.id]);

    const handleOpenUserCard = useCallback((el, author, options) => {
        setUserAnchor(el);
        setUserCardViewProfileOnly(Boolean(options?.viewProfileOnly));
        setUserForCard({
            id: author?.id, first_name: author?.first_name, last_name: author?.last_name,
            handle: author?.handle, avatar_url: author?.avatar_url,
            ...(author?.account_type ? { account_type: author.account_type } : {}),
            ...(author?.business_id ? { business_id: author.business_id } : {}),
            ...(author?.business_name ? { business_name: author.business_name } : {}),
            ...(author?.business_slug ? { business_slug: author.business_slug } : {}),
            ...(author?.business_avatar_url ? { business_avatar_url: author.business_avatar_url } : {}),
            ...(author?.artist_id ? { artist_id: author.artist_id } : {}),
            ...(author?.artist_name ? { artist_name: author.artist_name } : {}),
            ...(author?.artist_handle ? { artist_handle: author.artist_handle } : {}),
            ...(author?.artist_avatar_url ? { artist_avatar_url: author.artist_avatar_url } : {}),
            ...(author?.account_name ? { account_name: author.account_name } : {}),
            ...(author?.account_handle ? { account_handle: author.account_handle } : {}),
            ...(author?.account_avatar_url ? { account_avatar_url: author.account_avatar_url } : {}),
        });
        const isAccountCard = Boolean(author?.account_type === "business" || author?.account_type === "artist" || author?.business_id || author?.artist_id);
        if (!isAccountCard) hydrateTargetFromPublic(author);
    }, [hydrateTargetFromPublic]);

    const handleViewProfile = useCallback((u) => {
        if (u?.account_type === "business" || u?.business_id) { const slug = u?.business_slug || u?.account_handle || u?.handle; if (slug) return window.location.assign(`/${slug}`); }
        if (u?.account_type === "artist" || u?.artist_id) { const ah = u?.artist_handle || u?.account_handle || u?.handle; if (ah) return window.location.assign(`/${ah}`); }
        const key = u?.handle || u?.id; if (key) window.location.assign(`/${key}`);
    }, []);

    const postFollow = useCallback(async (targetId) => {
        const payload = { target_id: targetId, action: "follow" };
        const urls = [`${api}/users/follow`, "/api/users/follow", "/users/follow"].filter(Boolean);
        for (const url of urls) {
            try { const res = await secureFetch(url, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); if (res.ok) return true; } catch { /* try next */ }
        }
        return false;
    }, []);

    const handleFollow = useCallback(async (targetUser) => {
        const tid0 = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid0 && !handle0) return;
        const selfId = Number(viewerUser?.id);
        if (selfId && tid0 && selfId === tid0) return;
        requireAuth(async () => {
            let tid = tid0;
            if (!tid && handle0) { const p = await hydrateTargetFromPublic({ handle: handle0 }); if (p?.id) tid = Number(p.id); }
            if (!tid) return;
            setLocallyFollowed((prev) => { const next = new Set(prev); next.add(tid); return next; });
            const ok = await postFollow(tid);
            if (ok) { setServerFollowingSet((prev) => { const next = new Set(prev); next.add(tid); return next; }); }
            else { setLocallyFollowed((prev) => { const next = new Set(prev); next.delete(tid); return next; }); }
        });
    }, [viewerUser?.id, userForCard?.id, userForCard?.handle, requireAuth, hydrateTargetFromPublic, postFollow]);

    const isSelfForCard = useMemo(() => {
        if (!viewerUser && !user) return false;
        const effectiveViewer = viewerUser || user;
        if (!effectiveViewer || !userForCard) return false;
        const isAccountCard = Boolean(userForCard.account_type === "business" || userForCard.account_type === "artist" || userForCard.business_id || userForCard.artist_id);
        if (isBusinessAccount && activeBusinessId) {
            if (!isAccountCard) return false;
            return (userForCard.account_type === "business" || Boolean(userForCard.business_id)) && Number(userForCard.business_id) === Number(activeBusinessId);
        }
        if (isArtistAccount && activeArtistId) {
            if (!isAccountCard) return false;
            return (userForCard.account_type === "artist" || Boolean(userForCard.artist_id)) && Number(userForCard.artist_id) === Number(activeArtistId);
        }
        if (isAccountCard) return false;
        const idMatch = effectiveViewer.id != null && userForCard.id != null && Number(effectiveViewer.id) === Number(userForCard.id);
        const handleMatch = effectiveViewer.handle && userForCard.handle && String(effectiveViewer.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || handleMatch;
    }, [viewerUser, user, userForCard, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    const handleCloseUserCard = useCallback(() => { setUserAnchor(null); setUserCardViewProfileOnly(false); }, []);

    const submitPostReport = useCallback(async ({ reason, details }) => {
        if (!artistId || !postId) return;
        try {
            await secureFetch(
                `/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}/report`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json", ...getAccountHeaders() },
                    body: JSON.stringify({ reason, details: details || null }),
                }
            );
        } catch { /* handled by ReportContentDialog */ }
    }, [artistId, postId]);

    /* ═══════════════════════════════════════════════════════════════════════════ */

    if (!post) return <EmptyPostState />;

    // Derived data
    const actorName = String(
        post.artist_name || post.artistName || post.account_name
        || `${post.first_name || ''} ${post.last_name || ''}`.trim()
        || post.name || post.authorName || post.author_name
        || (post.handle || post.artist_handle || post.artistHandle ? `@${(post.handle || post.artist_handle || post.artistHandle).replace(/^@/, '')}` : '')
        || "Artist"
    ).trim();
    const actorHandle = String(post.artist_handle || post.artistHandle || post.handle || "").trim().replace(/^@/, "");
    const rawAvatarSrc = String(post.artist_avatar_url || post.artistAvatarUrl || post.avatar_url || post.profile_picture || "").trim();
    const avatarSrc = !avatarErrored ? rawAvatarSrc : "";
    // Artist sub-type ('music' | 'artist') for the poster avatar fallback.
    // Reads from the post (backend emits artistProfileType / profile_type).
    // Defaults to 'music' when missing.
    const posterProfileType = String(
        post.artistProfileType || post.artist_profile_type || post.profile_type || ""
    ).toLowerCase();
    const isVisualArtistPoster = posterProfileType === "artist";
    const postDate = post.publishedAt || post.published_at || post.createdAt || post.created_at || "";
    const title = String(post.title || "").trim();
    const body = String(post.body || post.description || post.content || "").trim();
    const BODY_PREVIEW_CHARS = 600;
    const bodyNeedsTruncate = body.length > BODY_PREVIEW_CHARS;
    const bodyDisplay = (!bodyNeedsTruncate || showFullBody) ? body : `${body.slice(0, BODY_PREVIEW_CHARS).trimEnd()}...`;
    const photos = extractPhotos(post);
    const isPinned = Boolean(post.isPinned || post.is_pinned);
    const postAddress = String(post.address || "").trim();
    const city = String(post.city || "").trim();
    const county = String(post.county || "").trim();
    const isStatewide = Boolean(post.isStatewide || post.is_statewide);
    const countyLabel = formatCounty(county);
    const locationStr = isStatewide ? "Alabama (Statewide)" : [city, countyLabel].filter(Boolean).join(", ");
    const hasLocation = Boolean(postAddress || locationStr);
    const likesCount = Number(post.likeCount ?? post.like_count ?? post.likesCount ?? post.likes_count ?? post.likes ?? 0);
    const commentsCount = Number(post.commentCount ?? post.comment_count ?? post.commentsCount ?? post.comments_count ?? post.comments ?? 0);
    const repostsCount = Number(post.repostCount ?? post.repost_count ?? post.repostsCount ?? post.reposts_count ?? post.reposts ?? 0);
    const viewerLiked = Boolean(post.viewerLiked ?? post.viewer_liked ?? false);
    const viewerReposted = Boolean(post.viewerReposted ?? post.viewer_reposted ?? false);
    const isEdited = Boolean(post.isEdited || post.is_edited || Number(post.editCount || post.edit_count || 0) > 0);
    const sharePost = { ...post, artist_id: artistId || post?.artist_id || post?.artistId, shareUrl: actorHandle && postId ? `${window.location.origin}/${encodeURIComponent(actorHandle)}/posts/${postId}` : "" };
    const artistOwnerId = post?.owner_user_id || post?.ownerUserId || post?.createdByUserId || post?.created_by_user_id || null;

    const authorUser = {
        id: post.createdByUserId || post.created_by_user_id, handle: actorHandle,
        first_name: actorName.split(" ")[0] || actorName, last_name: actorName.split(" ").slice(1).join(" ") || "",
        avatar_url: rawAvatarSrc,
        ...(artistId ? { account_type: "artist", artist_id: artistId, artist_name: actorName, artist_handle: actorHandle, artist_avatar_url: rawAvatarSrc } : {}),
        ...(post.account_type ? { account_type: post.account_type } : {}),
        ...(post.business_id ? { business_id: post.business_id } : {}),
        ...(post.business_name ? { business_name: post.business_name } : {}),
        ...(post.business_slug ? { business_slug: post.business_slug } : {}),
        ...(post.business_avatar_url ? { business_avatar_url: post.business_avatar_url } : {}),
        ...(post.account_name ? { account_name: post.account_name } : {}),
        ...(post.account_handle ? { account_handle: post.account_handle } : {}),
        ...(post.account_avatar_url ? { account_avatar_url: post.account_avatar_url } : {}),
    };

    const handleAvatarClick = (e) => { handleOpenUserCard(e.currentTarget, authorUser); };

    // ── Post ownership: user is owner only if actively logged into the artist account that made the post ──
    const isPostOwner = (() => {
        // Must be on an artist account that matches the post's artist
        if (isArtistAccount && activeArtistId && artistId) {
            return Number(activeArtistId) === Number(artistId);
        }
        return false;
    })();

    // Broader link check — used to gate destructive menu items (Hide posts / Block).
    // True when the viewer owns the underlying artist account from any active
    // account, or is actively on the artist account. Mirrors the pattern used
    // in ArtistCard / ArtistDetailPanel / MusicPostsList.
    const postArtistOwnerUserId = Number(
        post?.artistOwnerUserId ||
        post?.artist_owner_user_id ||
        0
    );
    const isLinkedToArtist = Boolean(
        isPostOwner ||
        (viewerId && postArtistOwnerUserId > 0 && Number(viewerId) === postArtistOwnerUserId)
    );

    // ── 3-dot menu handlers ──
    const handlePostMenuOpen = (e) => {
        setPostMenuEl(e.currentTarget);
        // Check edit-limit when menu opens (owners only)
        if (isPostOwner && artistId && postId) {
            secureFetch(`/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}/edit-limit`, {
                credentials: "include", cache: "no-store",
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    if (data && data.ok === false) {
                        setEditLimitReached(true);
                        setEditLimitMsg(data.message || "You've reached the edit limit (5 edits per 24 hours). Please try again later.");
                    } else {
                        setEditLimitReached(false);
                        setEditLimitMsg("");
                    }
                })
                .catch(() => { setEditLimitReached(false); setEditLimitMsg(""); });
        }
    };

    const handlePostMenuClose = () => setPostMenuEl(null);

    const handlePostEditClick = () => {
        setPostMenuEl(null);
        if (editLimitReached) {
            setEditLimitDialogOpen(true);
            return;
        }
        // Navigate to full post page for editing
        if (typeof onViewPost === "function") onViewPost(post);
    };

    const handlePostDeleteClick = () => {
        setPostMenuEl(null);
        if (!artistId || !postId) return;
        // Delete via API
        secureFetch(`/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}`, {
            method: "DELETE", credentials: "include", headers: { ...getAccountHeaders() },
        }).catch(() => {});
    };


    const handlePostCopyLink = () => {
        const handle = String(post?.artist_handle || post?.artistHandle || post?.handle || "").trim();
        const pid = post?.id || "";
        const url = handle && pid
            ? `${window.location.origin}/${encodeURIComponent(handle)}/posts/${encodeURIComponent(pid)}`
            : `${window.location.origin}/music/post/${pid}`;
        navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => setCopyToast(true));
        setPostMenuEl(null);
    };

    const handlePostReportClick = () => {
        setPostMenuEl(null);
        setPostReportOpen(true);
    };

    // ── Hide posts / Block artist handlers ──
    // Posts to /api/users/hide and /api/users/block with target_type='artist'.
    // Backend resolves the artist's owner_user_id and enforces the
    // self-ownership guard (userOwnsEntity in user.js).
    const handleHideArtist = async () => {
        if (!artistId || hideBusy || blockBusy) return;
        setPostMenuEl(null);
        setHideBusy(true);
        const displayName = String(post?.artist_name || post?.artistName || "").trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...getAccountHeaders() };
            const res = await secureFetch("/api/users/hide", {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify({ target_id: Number(artistId), target_type: "artist", action: "hide" }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:hidden-changed", { detail: { artistId, hidden: true, source: "musicPostDetailPanel" } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* best-effort */ } finally { setHideBusy(false); }
    };

    const handleBlockArtist = async () => {
        if (!artistId || hideBusy || blockBusy) return;
        setPostMenuEl(null);
        setBlockBusy(true);
        const displayName = String(post?.artist_name || post?.artistName || "").trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...getAccountHeaders() };
            const res = await secureFetch("/api/users/block", {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify({ target_id: Number(artistId), target_type: "artist", action: "block" }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:blocked-changed", { detail: { userId: artistId, targetType: "artist", blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:blocked-changed", { detail: { artistId, blocked: true, source: "musicPostDetailPanel" } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* best-effort */ } finally { setBlockBusy(false); }
    };

    const threadsToShow = displayThreads.slice(0, visibleCount);
    const hasMore = displayThreads.length > visibleCount;

    return (
        <Box sx={(t) => ({
            p: 2, pb: 3,
            bgcolor: 'background.paper',
            // On mobile without onBack: cover the entire viewport (standalone mode)
            // When onBack is provided, the parent drawer handles layout — skip fixed positioning
            ...(!onBack ? {
                [t.breakpoints.down('md')]: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: t.zIndex.modal,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                },
            } : {}),
        })}>
            {/* Mobile back bar — removed: parent drawer provides its own back button when onBack is supplied */}
            {/* Header: Avatar + Name + Menu */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, justifyContent: "space-between" }}>
                <Box
                    onClick={handleAvatarClick}
                    sx={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 1.25,
                        cursor: "pointer",
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        transition: "background-color 120ms ease",
                        "&:hover": { bgcolor: (t) => alphaColor(t.palette.text.primary, 0.04) },
                        minWidth: 0,
                    }}
                >
                    <Avatar src={!avatarErrored && rawAvatarSrc ? avatarSrc : undefined} alt={actorName}
                            sx={(t) => ({ width: { xs: 52, sm: 56 }, height: { xs: 52, sm: 56 }, flexShrink: 0, bgcolor: alphaColor(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "2px solid", borderColor: alphaColor(t.palette.text.primary, 0.06), "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" } })}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                            onError={() => setAvatarErrored(true)}>
                        {isVisualArtistPoster
                            ? <PaletteRoundedIcon sx={{ fontSize: 26 }} />
                            : <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />}
                    </Avatar>
                    <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                        <Typography variant="subtitle1" noWrap sx={(t) => ({ ...t.custom.postDetail.authorName })}>
                            {actorName}
                        </Typography>
                        {actorHandle ? (
                            <Typography variant="body2" color="text.secondary" noWrap sx={(t) => ({ ...t.custom.postDetail.authorHandle })}>
                                @{actorHandle}
                            </Typography>
                        ) : null}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                            {postDate ? <Typography variant="caption" color="text.secondary">{timeAgo(postDate)}</Typography> : null}
                            {isEdited ? (
                                <>
                                    <Typography variant="caption" color="text.disabled">&bull;</Typography>
                                    <Typography
                                        variant="caption"
                                        onClick={openHistory}
                                        sx={{ fontWeight: 600, color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                    >
                                        Edited
                                    </Typography>
                                </>
                            ) : null}
                        </Box>
                    </Box>
                </Box>
                {isPinned ? (
                    <Box sx={{ flexShrink: 0 }}>
                        <Chip size="small" icon={<PushPinRoundedIcon sx={{ fontSize: 14 }} />} label="Pinned"
                              sx={(t) => ({ fontWeight: 800, fontSize: 11, height: 22, bgcolor: alphaColor(t.palette.secondary.main, 0.10), color: t.palette.secondary.main, border: "1px solid", borderColor: alphaColor(t.palette.secondary.main, 0.24), "& .MuiChip-icon": { marginLeft: "4px", marginRight: "1px", color: t.palette.secondary.main }, "& .MuiChip-label": { fontWeight: 800, px: 0.75 } })} />
                    </Box>
                ) : null}

                {/* 3-dot post menu */}
                <IconButton
                    size="small"
                    onClick={handlePostMenuOpen}
                    sx={{
                        flexShrink: 0, width: 30, height: 30, mt: 0.5,
                        border: "1px solid", borderColor: "divider",
                        bgcolor: "background.paper",
                        "&:hover": { bgcolor: "action.hover" },
                    }}
                >
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <SmartMenu
                    anchorEl={postMenuEl}
                    open={Boolean(postMenuEl)}
                    onClose={handlePostMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    disableScrollLock
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        sx: {
                            mt: 0.5,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alphaColor(t.palette.text.primary, 0.15)}`,
                            minWidth: 200,
                            py: 0.5,
                        },
                    }}
                >
                    <MenuItem onClick={handlePostCopyLink} sx={{ py: 1 }}>
                        <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>
                    {isPostOwner ? [
                        <Divider key="owner-divider" sx={{ my: 0.5 }} />,
                        <MenuItem key="edit" onClick={handlePostEditClick} sx={{ py: 1 }}>
                            <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Edit post" />
                        </MenuItem>,
                        <MenuItem key="delete" onClick={handlePostDeleteClick} sx={{ py: 1, color: "error.main" }}>
                            <ListItemIcon sx={{ color: "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Delete post" />
                        </MenuItem>,
                    ] : null}
                    {!isLinkedToArtist ? [
                        <Divider key="report-divider" sx={{ my: 0.5 }} />,
                        <MenuItem key="report" onClick={handlePostReportClick} sx={{ py: 1 }}>
                            <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Report" />
                        </MenuItem>,
                    ] : null}
                    {!isLinkedToArtist && viewerId ? (
                        <MenuItem onClick={handleHideArtist} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                            <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Hide posts from this artist" />
                        </MenuItem>
                    ) : null}
                    {!isLinkedToArtist && viewerId ? (
                        <MenuItem onClick={handleBlockArtist} disabled={hideBusy || blockBusy} sx={{ py: 1, color: "error.main" }}>
                            <ListItemIcon sx={{ color: "error.main" }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Block artist" />
                        </MenuItem>
                    ) : null}
                </SmartMenu>
            </Box>

            {/* Title */}
            {title ? <Typography variant="h5" sx={(t) => ({ mt: 1.5, wordBreak: "break-word", ...t.custom.postDetail.title })}>{title}</Typography> : null}

            {/* Body */}
            {body ? (
                <Box sx={{ mt: 1 }}>
                    <Box
                        sx={{
                            ...(bodyNeedsTruncate && !showFullBody
                                ? { maxHeight: 200, overflow: "hidden", position: "relative" }
                                : {}),
                        }}
                    >
                        <RichTextDisplay html={body} />
                        {bodyNeedsTruncate && !showFullBody ? (
                            <Box
                                sx={(t) => ({
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 48,
                                    background: `linear-gradient(transparent, ${t.palette.background.paper || "#fff"})`,
                                    pointerEvents: "none",
                                })}
                            />
                        ) : null}
                    </Box>
                    {bodyNeedsTruncate && !showFullBody ? <Link component="span" underline="hover" onClick={() => setShowFullBody(true)} sx={{ fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Show more</Link> : null}
                    {bodyNeedsTruncate && showFullBody ? <Link component="span" underline="hover" onClick={() => setShowFullBody(false)} sx={{ fontWeight: 800, cursor: "pointer", fontSize: 14 }}>Show less</Link> : null}
                </Box>
            ) : null}

            {/* Photos */}
            {photos.length > 0 ? <MusicPhotoCarousel photos={photos} initialIndex={initialPhotoIndex} /> : null}

            {/* Location */}
            {hasLocation ? (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                        <LocationOnRoundedIcon sx={(t) => ({ fontSize: t.custom.postDetail.locationIcon.fontSize, color: "primary.main", mt: t.custom.postDetail.locationIcon.mt })} />
                        <Box>
                            {postAddress ? (
                                <Typography
                                    variant="body2"
                                    sx={(t) => ({ ...t.custom.postDetail.locationText, color: "primary.main" })}
                                >
                                    {postAddress}
                                </Typography>
                            ) : null}
                            {locationStr ? (
                                <Typography
                                    variant="body2"
                                    sx={(t) => ({ ...t.custom.postDetail.locationSecondary, color: "primary.main", fontSize: postAddress ? "0.8rem" : undefined })}
                                >
                                    {locationStr}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>
                </>
            ) : null}

            <Divider sx={{ my: 1.5 }} />

            {/* View Post Page (above ActionBar) */}
            {typeof onViewPost === "function" && !isMobile ? (
                <Button variant="outlined" fullWidth onClick={() => onViewPost(post)} endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 18 }} />}
                        sx={(t) => ({ mb: 1.5, ...t.custom.postDetail.viewPageButton, textTransform: "none", borderColor: alphaColor(t.palette.primary.main, 0.25), color: t.palette.primary.main, "&:hover": { borderColor: t.palette.primary.main, bgcolor: alphaColor(t.palette.primary.dark, 0.04) } })}>
                    View Post Page
                </Button>
            ) : null}

            {/* ActionBar — uses theme tokens matching EventDetailPanel */}
            <Box sx={(t) => ({ p: 1, borderRadius: 1.5, border: "1px solid", borderColor: alphaColor(t.palette.primary.main, 0.14), bgcolor: "background.paper", backgroundImage: "none", boxShadow: t.custom?.shadows?.xs || 'none' })}>
                <ActionBar user={user} postId={postId} post={sharePost} initialLikes={likesCount} initiallyLiked={viewerLiked} commentsCount={commentsCount} initialReposts={repostsCount} initiallyReposted={viewerReposted} showBoost useShareDialog />
            </Box>

            {/* ═══ Comments Section (threaded) ═══ */}
            <Divider sx={{ mt: 1.25, mb: 2.5, borderStyle: "dashed", opacity: 0.5 }} />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={(t) => t.custom.postDetail.commentsHeading}>
                    Comments
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Link component="button" type="button" underline="none" onClick={() => setCommentSort('popular')}
                          sx={{ fontSize: 12, fontWeight: commentSort === 'popular' ? 800 : 600, color: commentSort === 'popular' ? 'primary.main' : 'text.secondary', cursor: 'pointer', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: commentSort === 'popular' ? (t) => alphaColor(t.palette.primary.main, 0.08) : 'transparent', '&:hover': { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.06) } }}>
                        Popular
                    </Link>
                    <Link component="button" type="button" underline="none" onClick={() => setCommentSort('newest')}
                          sx={{ fontSize: 12, fontWeight: commentSort === 'newest' ? 800 : 600, color: commentSort === 'newest' ? 'primary.main' : 'text.secondary', cursor: 'pointer', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: commentSort === 'newest' ? (t) => alphaColor(t.palette.primary.main, 0.08) : 'transparent', '&:hover': { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.06) } }}>
                        Newest
                    </Link>
                </Box>
            </Box>

            {/* Composer */}
            {user ? (
                <Box ref={composerRef} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2, flexWrap: "nowrap", position: "relative" }}>
                    <ComposerAvatar
                        url={viewerAvatarUrl}
                        accountType={acctType}
                        profileType={isArtistAccount ? viewerProfileType : undefined}
                        label={viewerLabel || 'You'}
                        size={44}
                        iconSize={24}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <TextField inputRef={commentInputRef} fullWidth multiline minRows={1} maxRows={6}
                                   variant="outlined"
                                   placeholder="Write your comment… (type @ to mention)" label={`Leave a comment as ${viewerLabel}`}
                                   value={commentText} onChange={handleCmChange}
                                   onKeyDown={handleCmKeyDown} inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                   disabled={commentPosting}
                                   error={Boolean(commentError)}
                                   helperText={commentError}
                                   InputProps={{
                                       endAdornment: (
                                           <InputAdornment position="end" sx={{ alignSelf: "flex-end", pb: 0.25 }}>
                                               <IconButton aria-label="Send comment" onClick={submitComment}
                                                           disabled={!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0 || commentPosting}
                                                           sx={(t) => ({ ml: 0.5, bgcolor: "primary.main", color: "common.white", width: 38, height: 38, borderRadius: 2,
                                                               boxShadow: `0 10px 18px ${alphaColor(t.palette.primary.main, 0.18)}`,
                                                               "&:hover": { bgcolor: "primary.dark", boxShadow: `0 14px 26px ${alphaColor(t.palette.primary.main, 0.22)}` },
                                                               "&.Mui-disabled": { bgcolor: "action.disabledBackground", color: "action.disabled", boxShadow: "none", opacity: 1 } })}>
                                                   {commentPosting ? <CircularProgress size={18} sx={{ color: "common.white" }} /> : <ArrowForwardRoundedIcon />}
                                               </IconButton>
                                           </InputAdornment>
                                       ),
                                   }}
                                   sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                        {/* Image + GIF attachment toolbar & previews */}
                        <CommentImageAttachments
                            files={commentFiles}
                            urls={commentImageUrls}
                            onFilesChange={async (newFiles) => {
                                if (commentError) setCommentError('');
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
                            disabled={commentPosting}
                        />
                        {renderMentionPopper({
                            open: cmMentionOpen && Boolean(cmMentionAnchorEl),
                            anchorEl: cmMentionAnchorEl,
                            results: cmMentionResults,
                            loading: cmMentionLoading,
                            activeIdx: cmMentionActiveIdx,
                            onSelect: insertCmMention,
                            onClose: closeCmMention,
                        })}
                    </Box>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13 }}>
                    <Link component="button" underline="hover" onClick={onRequireAuth}>Log in</Link> to leave a comment.
                </Typography>
            )}

            <Divider sx={{ mb: 1.5 }} />

            {/* Comments list (threaded) */}
            {commentsLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : threads.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <ChatBubbleOutlineRoundedIcon sx={(t) => t.custom.postDetail.noCommentsIcon} />
                    <Typography sx={(t) => t.custom.postDetail.noCommentsText}>No comments yet. Be the first!</Typography>
                </Box>
            ) : (
                <>
                    {threadsToShow.map((node) => (
                        <ThreadedCommentItem key={node.id} node={node} depth={0}
                                             expanded={expanded} setExpanded={setExpanded}
                                             viewerAvatarUrl={viewerAvatarUrl} viewerLabel={viewerLabel}
                                             likeComment={likeComment} submitReply={submitReply}
                                             viewerId={viewerId} onDelete={requestDelete}
                                             onTogglePinConfirm={requestTogglePin} openFlag={openFlagDialog}
                                             onRequireAuth={onRequireAuth} onOpenUserCard={handleOpenUserCard}
                                             artistOwnerId={artistOwnerId} postArtistId={artistId}
                                             onScrollToComment={scrollToComment} highlightedCommentId={highlightedCommentId}
                                             onShareComment={handleShareComment} newCommentIds={newCommentIds}
                                             blockedUserIds={blockedUserIds} blockedBusinessIds={blockedBusinessIds} blockedArtistIds={blockedArtistIds} blockedHandles={blockedHandles}
                                             shownBlockedIds={shownBlockedIds} onShowBlocked={handleShowBlocked} onHideBlocked={handleHideBlocked} />
                    ))}
                    {hasMore ? (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                            <Button variant="text" onClick={() => setVisibleCount((n) => n + COMMENTS_LOAD_MORE)}
                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 13 }}>Load more comments</Button>
                        </Box>
                    ) : null}
                </>
            )}

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, commentId: null, isReply: false })}
                    maxWidth="xs" fullWidth sx={{ zIndex: 100001 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Delete {deleteConfirm.isReply ? "Reply" : "Comment"}?
                    <IconButton size="small" onClick={() => setDeleteConfirm({ open: false, commentId: null, isReply: false })}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirm({ open: false, commentId: null, isReply: false })} sx={{ textTransform: "none" }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={() => { deleteComment(deleteConfirm.commentId); const msg = deleteConfirm.isReply ? 'Reply deleted successfully' : 'Comment deleted successfully'; setDeleteConfirm({ open: false, commentId: null, isReply: false }); onCommentSuccess?.(msg); }}
                            sx={{ textTransform: "none", fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Flag / Report Dialog */}
            <Dialog open={flagState.open} onClose={closeFlagDialog}
                    maxWidth="xs" fullWidth sx={{ zIndex: 100001 }} PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                {flagSubmitted ? (
                    <>
                        <DialogContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
                            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                                Thank you for your report
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
                                We take reports seriously and will review this content. If it violates our community guidelines, we'll take appropriate action.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button
                                onClick={closeFlagDialog}
                                fullWidth
                                variant="contained"
                                disableElevation
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, py: 1 }}
                            >
                                Done
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FlagOutlinedIcon sx={{ fontSize: 22, color: 'text.secondary' }} />
                                Report
                            </Box>
                            <IconButton size="small" onClick={closeFlagDialog} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 0, pb: 1 }}>
                            <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                                Why are you reporting this? Your report is anonymous.
                            </Typography>
                            <RadioGroup value={flagState.reason} onChange={(e) => setFlagState((prev) => ({ ...prev, reason: e.target.value }))}>
                                {[
                                    { value: 'spam', label: 'Spam or misleading' },
                                    { value: 'harassment', label: 'Harassment or bullying' },
                                    { value: 'hate', label: 'Hate speech' },
                                    { value: 'nudity', label: 'Nudity' },
                                    { value: 'misinformation', label: 'Misinformation' },
                                    { value: 'illegal', label: 'Illegal content' },
                                    { value: 'other', label: 'Other' },
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
                                            '&:hover': { bgcolor: 'action.hover' },
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
                                value={flagState.details}
                                onChange={(e) => setFlagState((prev) => ({ ...prev, details: e.target.value.slice(0, 1000) }))}
                                inputProps={{ maxLength: 1000 }}
                                sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5, textAlign: 'right' }}>
                                {(flagState.details || "").length}/1000
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button
                                onClick={closeFlagDialog}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                disableElevation
                                disabled={!flagState.reason || flagState.submitting}
                                onClick={submitFlag}
                                startIcon={flagState.submitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    px: 3,
                                    bgcolor: 'error.main',
                                    '&:hover': { bgcolor: 'error.dark' },
                                }}
                            >
                                {flagState.submitting ? 'Submitting…' : 'Submit Report'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Report Post Dialog */}
            <ReportContentDialog
                open={postReportOpen}
                onClose={() => setPostReportOpen(false)}
                onSubmit={submitPostReport}
                title="Report post"
            />

            <SuccessSnackbar
                open={copyToast}
                onClose={() => setCopyToast(false)}
                message="Link copied to clipboard"
            />

            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast("")}
                message={hideBlockToast}
            />
            <UserCardPopover anchorEl={userAnchor} onClose={handleCloseUserCard} user={userForCard}
                             isSelf={isSelfForCard} following={isFollowingForCard} onFollow={handleFollow}
                             onViewProfile={handleViewProfile} viewProfileOnly={userCardViewProfileOnly} />

            {/* Share Comment dialog */}
            <ShareDialog
                contentType="comment"
                open={shareCommentDialogOpen}
                onClose={() => { setShareCommentDialogOpen(false); setShareCommentTarget(null); }}
                comment={shareCommentTarget}
                post={{ id: postId, type: 'music_post' }}
                viewer={user}
                sx={{ zIndex: 100001 }}
            />

            {/* Edit History Dialog */}
            <MusicPostEditHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                rows={historyRows}
                loading={historyLoading}
                error={historyError}
            />

            {/* Edit Limit Reached Dialog */}
            <Dialog open={editLimitDialogOpen} onClose={() => setEditLimitDialogOpen(false)} fullWidth maxWidth="xs"
                    PaperProps={{ sx: { position: "relative" } }}
                    sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                    Edit Limit Reached
                    <IconButton aria-label="Close" onClick={() => setEditLimitDialogOpen(false)}
                                sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        {editLimitMsg || "You\u2019ve reached the edit limit (5 edits per 24 hours). Please try again later."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditLimitDialogOpen(false)} variant="contained" sx={{ fontWeight: 700 }}>Got it</Button>
                </DialogActions>
            </Dialog>

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