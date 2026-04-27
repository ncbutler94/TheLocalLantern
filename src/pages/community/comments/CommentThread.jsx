// src/pages/community/comments/CommentThread.jsx
//
// ══════════════════════════════════════════════════════════════════════════
// Extracted from PostDetailModal.jsx (v8 Slice 2b) — no behavior change.
// ══════════════════════════════════════════════════════════════════════════
//
// This module hosts the entire threaded-comment subsystem that used to live
// inside PostDetailModal: FlagCommentDialog, ThreadedCommentItem,
// BlockedCommentsGroup, RedditComments, plus the supporting helpers
// (normalizeComments, sortTopLevelThreads, groupBlockedTopLevel,
// ensureCommentFadeKeyframes, scanImageFile, ComposerAvatar,
// MentionAccountBadge, resolveMentionHandle).
//
// The extraction is faithful line-for-line with two surgical changes:
//
//   1. `RedditComments` accepts an optional `resourceContext` prop that
//      parameterizes the 3 post-scoped URL chains (list, create, pin).
//      When the prop is absent, it defaults to the exact URL chains used
//      by community-post comments — so PostDetailModal's usage is
//      byte-identical to the pre-extraction behavior.
//
//   2. Exports are added at the bottom so news-side code (Slice 2c) can
//      import `RedditComments` and the helpers it needs.
//
// Comment-scoped URLs (/api/community/comments/:id/{like,delete,flag})
// are NOT parameterized — they operate on comment_id and work identically
// for comments attached to any resource type.
//
// ══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from '../../../utils/commentBlockUtils';
import { secureFetch } from '../../../utils/secureFetch';
import {
    Box,
    Paper,
    Popper,
    Typography,
    Avatar,
    Button,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    FormControlLabel,
    Radio,
    Tooltip,
    MenuItem,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';

import ClickAwayListener from '@mui/material/ClickAwayListener';
import { alpha as alphaColor, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

import { ReportDialog } from '../../../components/ActionBar';
import SmartMenu from '../../../components/SmartMenu';
import UserCardPopover from '../../../components/UserCardPopover';
import { useAuth } from '../../../components/AuthModalContext';
import { useActiveAccount } from '../../../components/AccountContext';
import { getAccountHeaders as getStaticAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import ShareDialog from '../../../components/ShareDialog';

import PulsingDots from '../../../components/PulsingDots';
import CommentImageAttachments, { uploadFilesToGCS } from '../../../components/CommentImageAttachments';
import CommentImages from '../../../components/CommentImages';
import RichTextDisplay from '../../../components/RichTextDisplay';
import useRateLimit from '../../../utils/useRateLimit';
import RateLimitDialog from '../../../components/RateLimitDialog';
import { checkProfanity } from '../../../utils/profanityCheck';

/* ═══════════════════════════════════════════════════════════════════════════
   Default URL builders — used by RedditComments when no resourceContext
   prop is passed. Matches the behavior this module had when embedded
   inside PostDetailModal.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Community-post URL builders — the original behavior. */
const DEFAULT_COMMUNITY_POST_RESOURCE = Object.freeze({
    kind: 'community_post',
    /** GET comments for a post. Returns an array of URL fallbacks. */
    listUrls: (postId, qs = '') => [
        `/api/community/${encodeURIComponent(postId)}/comments${qs}`,
        `/api/community/posts/${encodeURIComponent(postId)}/comments${qs}`,
        `/api/comments?postId=${encodeURIComponent(postId)}${qs ? '&' + qs.slice(1) : ''}`,
        `/api/posts/${encodeURIComponent(postId)}/comments${qs}`,
    ],
    /** POST a new comment on a post. */
    createUrls: (postId) => [
        `/api/community/${encodeURIComponent(postId)}/comments`,
        `/api/posts/${encodeURIComponent(postId)}/comments`,
    ],
    /** Pin or unpin a comment. `action` is 'pin' or 'unpin'. */
    pinUrls: (postId, commentId, action) => [
        `/api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/${action}`,
        `/api/community/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/${action}`,
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}/${action}`,
    ],
});

/** News-article URL builders — used by CommunityNewsDetailPanel in Slice 2c. */
export const NEWS_ARTICLE_RESOURCE = Object.freeze({
    kind: 'news_article',
    listUrls: (articleId, qs = '') => [
        `/api/community/news/article/${encodeURIComponent(articleId)}/comments${qs}`,
    ],
    createUrls: (articleId) => [
        `/api/community/news/article/${encodeURIComponent(articleId)}/comments`,
    ],
    /** News articles don't currently support pin — the backend has no owner
     *  concept for news. We provide an empty chain so any pin attempt silently
     *  no-ops. The pin menu item should be hidden at the call site for news. */
    pinUrls: (_articleId, _commentId, _action) => [],
});

/**
 * Validate that a resource context object has the required shape.
 * Falls back to DEFAULT_COMMUNITY_POST_RESOURCE if the input is invalid,
 * so callers can't accidentally disable the comment subsystem by passing
 * a malformed context.
 */
function normalizeResourceContext(ctx) {
    if (!ctx || typeof ctx !== 'object') return DEFAULT_COMMUNITY_POST_RESOURCE;
    const listUrls = typeof ctx.listUrls === 'function' ? ctx.listUrls : DEFAULT_COMMUNITY_POST_RESOURCE.listUrls;
    const createUrls = typeof ctx.createUrls === 'function' ? ctx.createUrls : DEFAULT_COMMUNITY_POST_RESOURCE.createUrls;
    const pinUrls = typeof ctx.pinUrls === 'function' ? ctx.pinUrls : DEFAULT_COMMUNITY_POST_RESOURCE.pinUrls;
    return {
        kind: String(ctx.kind || 'community_post'),
        listUrls,
        createUrls,
        pinUrls,
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper functions (moved from PostDetailModal.jsx — unchanged)
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────── Helpers duplicated from PostDetailModal ───────────
   These small utilities are used by both the comment subsystem AND by
   PostPage (in PostDetailModal.jsx). Duplicating here (instead of creating
   a shared utils module) keeps the Slice 2b diff narrow and preserves
   byte-identical behavior on both sides. If these ever need to change,
   update BOTH copies — they are intentional sibling code.
   ───────────────────────────────────────────────────────────────── */

const timeAgo = (input) => {
    if (!input) return '';
    const dateString = String(input);
    let d;
    if (dateString.endsWith('Z') || dateString.includes('+')) {
        d = new Date(dateString);
    } else if (dateString.includes('T')) {
        d = new Date(dateString + 'Z');
    } else {
        d = new Date(dateString.replace(' ', 'T') + 'Z');
    }
    if (!d || Number.isNaN(d.valueOf())) return '';
    const diffMs = Math.max(0, Date.now() - d.getTime());

    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'Just now';

    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}${w === 1 ? 'wk' : 'wks'} ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}${mo === 1 ? 'mo' : 'mos'} ago`;
    const y = Math.floor(dys / 365);
    return `${y}${y === 1 ? 'yr' : 'yrs'} ago`;
};

const DEFAULT_AVATAR_SX = {
    bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
    color: 'primary.main',
};

/* @mention rendering (clickable -> UserCardPopover) */
const renderTextWithMentions = (text, onMentionClick) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;

    const urlRe = /https?:\/\/[^\s<>"')\]]+|www\.[^\s<>"')\]]+/gi;
    const mentionRe = /@([a-zA-Z0-9_]{2,30})/g;

    const matches = [];

    let m;
    while ((m = urlRe.exec(raw)) !== null) {
        let url = m[0];
        while (url.length > 1 && /[.,;:!?)>\]}]$/.test(url)) {
            url = url.slice(0, -1);
        }
        matches.push({ type: 'url', start: m.index, end: m.index + url.length, value: url });
    }

    while ((m = mentionRe.exec(raw)) !== null) {
        const start = m.index;
        const handle = m[1];
        const before = start > 0 ? raw[start - 1] : '';
        if (before && /[a-zA-Z_.]/.test(before)) continue;
        matches.push({ type: 'mention', start, end: start + m[0].length, value: handle });
    }

    if (matches.length === 0) return raw;

    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    const filtered = [];
    let lastEnd = 0;
    for (const match of matches) {
        if (match.start >= lastEnd) {
            filtered.push(match);
            lastEnd = match.end;
        }
    }

    const out = [];
    let pos = 0;
    let key = 0;

    for (const match of filtered) {
        if (match.start > pos) out.push(raw.slice(pos, match.start));

        if (match.type === 'url') {
            const href = match.value.startsWith('www.') ? `https://${match.value}` : match.value;
            const displayUrl = match.value
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '');
            out.push(
                <Link
                    key={`url_${key++}_${match.start}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{
                        fontWeight: 600,
                        display: 'inline',
                        color: 'primary.main',
                        wordBreak: 'break-all',
                        cursor: 'pointer',
                    }}
                >
                    {displayUrl}
                </Link>
            );
        } else {
            out.push(
                <Link
                    key={`mention_${key++}_${match.start}`}
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={(e) => onMentionClick?.(e, match.value)}
                    sx={{
                        p: 0,
                        fontWeight: 900,
                        display: 'inline',
                        color: 'primary.main',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    @{match.value}
                </Link>
            );
        }

        pos = match.end;
    }

    if (pos < raw.length) out.push(raw.slice(pos));
    return out;
};

/* @mention typing helpers (autocomplete in comment boxes) */
const getMentionMatch = (text, cursorIndex) => {
    const raw = typeof text === 'string' ? text : String(text ?? '');
    const cursor = Number.isFinite(Number(cursorIndex)) ? Number(cursorIndex) : raw.length;
    const clamped = Math.max(0, Math.min(raw.length, cursor));
    const upto = raw.slice(0, clamped);

    const at = upto.lastIndexOf('@');
    if (at < 0) return null;

    const before = at > 0 ? upto[at - 1] : '';
    if (before && /[A-Za-z_.]/.test(before)) return null;

    const query = upto.slice(at + 1);
    if (!query) return null;
    if (/\s/.test(query)) return null;
    if (!/^[A-Za-z0-9_.]{1,30}$/.test(query)) return null;

    return { start: at, query, end: clamped };
};

const getMentionAnchorVirtualEl = (textareaEl, caretIndex) => {
    if (!textareaEl || typeof window === 'undefined' || typeof document === 'undefined') return null;

    const value = String(textareaEl.value || '');
    const pos = Number.isFinite(Number(caretIndex)) ? Number(caretIndex) : value.length;
    const clampedPos = Math.max(0, Math.min(pos, value.length));

    try {
        const computed = window.getComputedStyle(textareaEl);

        const mirror = document.createElement('div');
        mirror.style.position = 'absolute';
        mirror.style.visibility = 'hidden';
        mirror.style.whiteSpace = 'pre-wrap';
        mirror.style.wordWrap = 'break-word';
        mirror.style.overflowWrap = 'break-word';
        mirror.style.overflow = 'hidden';

        mirror.style.boxSizing = computed.boxSizing;
        mirror.style.width = computed.width;
        mirror.style.padding = computed.padding;
        mirror.style.border = computed.border;

        mirror.style.fontFamily = computed.fontFamily;
        mirror.style.fontSize = computed.fontSize;
        mirror.style.fontWeight = computed.fontWeight;
        mirror.style.fontStyle = computed.fontStyle;
        mirror.style.letterSpacing = computed.letterSpacing;
        mirror.style.textTransform = computed.textTransform;
        mirror.style.textAlign = computed.textAlign;
        mirror.style.lineHeight = computed.lineHeight;

        mirror.style.left = '-9999px';
        mirror.style.top = '0px';

        const beforeText = value.slice(0, clampedPos);
        const afterText = value.slice(clampedPos);

        mirror.textContent = beforeText;

        const marker = document.createElement('span');
        marker.textContent = afterText || '.';
        mirror.appendChild(marker);

        document.body.appendChild(mirror);

        const mirrorRect = mirror.getBoundingClientRect();
        const markerRect = marker.getBoundingClientRect();

        document.body.removeChild(mirror);

        const taRect = textareaEl.getBoundingClientRect();
        const lineHeight =
            Number.parseFloat(computed.lineHeight) ||
            Number.parseFloat(computed.fontSize) * 1.2 ||
            18;

        const caretLeft = taRect.left + (markerRect.left - mirrorRect.left) - textareaEl.scrollLeft;
        const caretTop = taRect.top + (markerRect.top - mirrorRect.top) - textareaEl.scrollTop;
        const anchorY = caretTop + lineHeight;

        const rect = {
            top: anchorY,
            bottom: anchorY,
            left: caretLeft,
            right: caretLeft,
            width: 0,
            height: 0,
        };

        return {
            getBoundingClientRect: () => rect,
            contextElement: textareaEl,
        };
    } catch {
        return null;
    }
};

const coerceHandle = (u) => {
    const h = String(u?.handle || u?.username || '').replace(/^@/, '').trim();
    return h;
};

const coerceName = (u) => {
    const first = String(u?.first_name || '').trim();
    const last = String(u?.last_name || '').trim();
    const name = String(u?.name || '').trim();
    const full = `${first} ${last}`.trim();
    return full || name || (u?.handle ? `@${String(u.handle).replace(/^@/, '')}` : 'User');
};

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

function ComposerAvatar({ url, accountType, profileType, label, size = 44, iconSize = 22, sx: sxOverride = {} }) {
    const [imgError, setImgError] = React.useState(false);
    React.useEffect(() => { setImgError(false); }, [url]);
    const showImg = Boolean(url) && !imgError;
    // For artist accounts, pick Music Note (musician) vs Palette (visual
    // artist) based on profileType. Anything not explicitly 'artist' keeps
    // the legacy music-note fallback so existing callers are unaffected.
    const artistFallbackIcon = (String(profileType || '').toLowerCase() === 'artist')
        ? PaletteRoundedIcon
        : MusicNoteRoundedIcon;
    const FallbackIcon = accountType === 'business'
        ? StorefrontOutlinedIcon
        : accountType === 'artist'
            ? artistFallbackIcon
            : PersonRoundedIcon;
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

/** Small inline badge showing verified status + account type for @mention results */
const MentionAccountBadge = ({ accountType, profileType }) => {
    const type = String(accountType || 'user').toLowerCase();
    const sub = String(profileType || '').toLowerCase();
    const isVisualArtist = type === 'artist' && sub === 'artist';

    return (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, ml: 0.5 }}>
            {type === 'business' && (
                <StorefrontRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', verticalAlign: 'middle' }} />
            )}
            {type === 'artist' && !isVisualArtist && (
                <MusicNoteRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', verticalAlign: 'middle' }} />
            )}
            {isVisualArtist && (
                <PaletteRoundedIcon sx={{ fontSize: 13, color: 'text.secondary', verticalAlign: 'middle' }} />
            )}
        </Box>
    );
};

/**
 * Resolve a @mention handle to the correct account type (user/business/artist)
 * by calling the unified search endpoint.
 */
const resolveMentionHandle = async (handle) => {
    const h = String(handle || '').replace(/^@/, '').trim();
    if (!h) return { handle: h };

    try {
        const res = await secureFetch(
            `/api/community/users/search?q=${encodeURIComponent(h)}`,
            { credentials: 'include', cache: 'no-store' }
        );
        if (!res.ok) return { handle: h };

        const data = await res.json();
        const results = Array.isArray(data) ? data : [];

        // Find exact handle match (case-insensitive)
        const exact = results.find(
            (r) => String(r?.handle || '').toLowerCase() === h.toLowerCase()
        );
        if (!exact) return { handle: h };

        const acctType = String(exact.account_type || 'user').toLowerCase();

        if (acctType === 'business') {
            return {
                handle: exact.handle,
                account_type: 'business',
                business_id: exact.id,
                business_name: exact.name || exact.first_name || '',
                business_slug: exact.handle,
                business_avatar_url: exact.avatar_url || '',
                account_name: exact.name || exact.first_name || '',
                account_handle: exact.handle,
                account_avatar_url: exact.avatar_url || '',
                avatar_url: exact.avatar_url || '',
                first_name: exact.name || exact.first_name || '',
                last_name: '',
            };
        }

        if (acctType === 'artist') {
            return {
                handle: exact.handle,
                account_type: 'artist',
                artist_id: exact.id,
                artist_name: exact.name || exact.first_name || '',
                artist_handle: exact.handle,
                artist_avatar_url: exact.avatar_url || '',
                account_name: exact.name || exact.first_name || '',
                account_handle: exact.handle,
                account_avatar_url: exact.avatar_url || '',
                avatar_url: exact.avatar_url || '',
                first_name: exact.name || exact.first_name || '',
                last_name: '',
            };
        }

        // Personal user
        return {
            id: exact.id,
            handle: exact.handle,
            first_name: exact.first_name || '',
            last_name: exact.last_name || '',
            avatar_url: exact.avatar_url || '',
            profile_picture: exact.profile_picture || '',
            public_id: exact.public_id ?? null,
        };
    } catch {
        return { handle: h };
    }
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXTRACTED RANGE BEGINS — from PostDetailModal.jsx lines 835-3493
   Faithful copy. Only surgical changes are URL-chain parameterization
   inside RedditComments (marked with "Slice 2b:" comments).
   ═══════════════════════════════════════════════════════════════════════════ */

function FlagCommentDialog({ open, onClose, onSubmit, initialReason = 'spam' }) {
    const [reason, setReason] = useState(initialReason);
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setReason(initialReason);
                setDetails('');
                setSubmitted(false);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [open, initialReason]);

    const handleSubmit = () => {
        onSubmit({ reason, details });
        setSubmitted(true);
    };

    return (
        <Dialog
            disableScrollLock
            open={open}
            onClose={(_e, r) => {
                if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                onClose();
            }}
            fullWidth
            maxWidth="xs"
            sx={{ zIndex: 100001 }}
            PaperProps={{ sx: { position: 'relative' } }}
        >
            <DialogTitle sx={{ pr: 7 }}>
                {submitted ? 'Report submitted' : 'Report comment'}
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {submitted ? (
                <>
                    <DialogContent>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Box
                                sx={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: '50%',
                                    bgcolor: 'success.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                }}
                            >
                                <Box component="span" sx={{ fontSize: 28, color: 'success.dark' }}>
                                    ✓
                                </Box>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Thank you for reporting
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Your report helps keep our community safe. We'll review this comment and take appropriate action.
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button
                            variant="contained"
                            onClick={onClose}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogContent dividers>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Choose a reason:
                        </Typography>
                        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)} sx={{ gap: 0.5 }}>
                            <FormControlLabel value="spam" control={<Radio />} label="Spam" />
                            <FormControlLabel value="harassment" control={<Radio />} label="Harassment" />
                            <FormControlLabel value="hate" control={<Radio />} label="Hate speech" />
                            <FormControlLabel value="nudity" control={<Radio />} label="Nudity" />
                            <FormControlLabel value="misinformation" control={<Radio />} label="Misinformation" />
                            <FormControlLabel value="illegal" control={<Radio />} label="Illegal content" />
                            <FormControlLabel value="other" control={<Radio />} label="Other" />
                        </RadioGroup>

                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Details (optional)"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                            Submit report
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

/* ========================================================================== */
/* Comments utilities + threaded list                                         */
/* ========================================================================== */

/** New: length caps and preview settings */
const NEW_COMMENT_FADE_KEYFRAMES = `@keyframes commentFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
const NEW_COMMENT_FADE_SX = {
    animation: 'commentFadeIn 0.45s ease-out both',
};
let _commentFadeInjected = false;
function ensureCommentFadeKeyframes() {
    if (_commentFadeInjected) return;
    _commentFadeInjected = true;
    const style = document.createElement('style');
    style.textContent = NEW_COMMENT_FADE_KEYFRAMES;
    document.head.appendChild(style);
}

const COMMENT_MAX_CHARS = 15000;
const COMMENT_PREVIEW_CHARS = 200;
/** Max visual indent depth — deeper replies flatten with a "Replying to" label */
const MAX_VISUAL_DEPTH = 2;

function normalizeComments(raw) {
    const src = Array.isArray(raw) ? raw : raw?.comments || raw?.data || [];

    // Slice 2d: some endpoints return a flat list (post comments — the
    // original shape this function was built for, where replies are
    // siblings of top-level comments and reassembled via parent_id
    // references), while others return a pre-nested tree (news comments,
    // where each top-level has a .replies array attached server-side).
    //
    // Flatten any pre-nested replies back into the iteration set so the
    // tree-reconstruction pass below works uniformly. Items already at
    // the top level keep their parent_id=null; nested replies inherit
    // the parent_id set by the server. No-op when the payload was
    // already flat.
    const flat = [];
    const walk = (node, inheritedParentId) => {
        if (!node || typeof node !== 'object') return;
        // Preserve the server's parent_id when present; only inherit when
        // it's missing (some backends strip parent_id from nested replies).
        const effective = {
            ...node,
            parent_id: (node.parent_id ?? node.parentId ?? inheritedParentId) ?? null,
        };
        // Grab and strip the nested replies before pushing — we're about
        // to flatten them alongside.
        const kids = Array.isArray(node.replies) ? node.replies : null;
        if (kids) {
            // Remove .replies from the copy we flatten; the reconstruction
            // pass rebuilds it from parent_id.
            delete effective.replies;
        }
        flat.push(effective);
        if (kids) {
            for (const k of kids) walk(k, effective.id);
        }
    };
    for (const c of src) walk(c, null);

    const items = flat.map((c, idx) => ({
        id: c.id ?? c.comment_id ?? c._id ?? `c_${idx}`,
        parentId: c.parent_id ?? c.parentId ?? c.reply_to ?? null,
        user_id: c.user_id ?? c.userId ?? c.user?.id ?? null,
        public_id: c.public_id ?? c.user_public_id ?? c.user?.public_id ?? null,
        text: String(c.text ?? c.content ?? c.body ?? c.comment ?? '').trim(),
        first_name: c.first_name ?? c.author_first_name ?? c.user?.first_name ?? '',
        last_name: c.last_name ?? c.author_last_name ?? c.user?.last_name ?? '',
        handle: c.handle ?? c.user?.handle ?? c.username ?? '',
        avatar: c.avatar_url ?? c.user?.avatar_url ?? c.profile_picture ?? '',
        created_at: c.created_at ?? c.date_created ?? c.posted_at ?? c.time ?? '',
        likes: Number(c.likes ?? c.likesCount ?? c.likes_count ?? c.like_count ?? c.likeCount ?? 0),
        viewer_liked: Boolean(c.viewer_liked ?? c.viewerLiked ?? c.liked ?? false),
        viewer_flagged: Boolean(c.viewer_flagged ?? false),
        liked_by_author: Boolean(c.liked_by_author ?? c.likedByAuthor ?? c.liked_by_post_author ?? c.likedByPostAuthor ?? c.author_liked ?? c.authorLiked ?? false),
        reply_count: Number(c.reply_count ?? 0),
        is_removed: Boolean(c.is_removed ?? c.removed ?? false),
        removed_reason: String(c.removed_reason ?? ''),
        removed_at: c.removed_at ?? null,
        is_pinned: Boolean(c.is_pinned ?? c.pinned ?? false),
        pinned_at: c.pinned_at ?? null,
        pinned_by: c.pinned_by ?? null,
        // Account context — used to display business/artist name+avatar on comments
        business_id: c.business_id ?? null,
        business_name: c.business_name ?? null,
        business_slug: c.business_slug ?? null,
        business_avatar_url: c.business_avatar_url ?? null,
        artist_id: c.artist_id ?? null,
        artist_name: c.artist_name ?? null,
        artist_handle: c.artist_handle ?? null,
        artist_avatar_url: c.artist_avatar_url ?? null,
        // Artist sub-type ('music' | 'artist') passed through so the avatar
        // fallback can pick palette vs music-note. Backend sets this
        // per-comment from music_artists.profile_type.
        profile_type: c.profile_type ?? c.profileType ?? null,
        // Denormalized account identity (fallback when JOINs aren't available)
        account_type: c.account_type ?? null,
        account_handle: c.account_handle ?? null,
        account_name: c.account_name ?? null,
        account_avatar_url: c.account_avatar_url ?? null,
        // Comment images (uploaded photos + Tenor GIFs)
        images: Array.isArray(c.images) ? c.images : [],
        image: c.image ?? (Array.isArray(c.images) && c.images.length > 0 ? c.images[0] : null),
        replies: [],
    }));

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
    // Pinned Comment should appear at the top (only relevant at root level)
    roots.sort((a, b) => {
        const ap = a.is_pinned ? 1 : 0;
        const bp = b.is_pinned ? 1 : 0;
        if (bp !== ap) return bp - ap;
        return 0;
    });
    return roots;
}

function ThreadedCommentItem({
                                 node,
                                 depth = 0,
                                 expanded,
                                 setExpanded,
                                 viewerAvatarUrl,
                                 viewerLabel,
                                 postAuthor,
                                 onOpenUserCard,
                                 likeComment,
                                 submitReply,
                                 openFlag,
                                 viewerId,
                                 onDelete,
                                 onTogglePinConfirm,
                                 blockedUserIds,
                                 blockedBusinessIds,
                                 blockedArtistIds,
                                 blockedHandles,
                                 replyToName,
                                 replyToHandle,
                                 replyToAvatar,
                                 onShareComment,
                                 onScrollToComment,
                                 highlightedCommentId,
                                 parentCommentId,
                                 forceShowBlocked = false,
                                 newCommentIds,
                                 post,
                                 onCopyLinkToast,
                                 groupCommentGated = false,
                             }) {
    const name = node.business_name
        ? node.business_name
        : node.artist_name
            ? node.artist_name
            : node.account_name
                ? node.account_name
                : (`${node.first_name || ''} ${node.last_name || ''}`.trim()
                    || node.name || node.authorName
                    || (node.handle ? `@${node.handle}` : 'User'));
    const ts = node.created_at ? timeAgo(node.created_at) : '';
    const hasReplies = Array.isArray(node.replies) && node.replies.length > 0;
    const open = !!expanded[node.id];
    const isRemoved = Boolean(node.is_removed);
    const displayHandle = node.business_slug
        ? node.business_slug
        : node.artist_handle
            ? node.artist_handle
            : node.account_handle
                ? node.account_handle
                : (node.handle || '');
    // Determine account type for avatar fallback logic
    const isBusinessComment = Boolean(node.business_id || node.business_name || node.account_type === 'business');
    const isArtistComment = Boolean(node.artist_id || node.artist_name || node.account_type === 'artist');
    // Artist sub-type for commenters — musicians vs visual artists.
    // Prefer the value the backend returned on the comment; if missing
    // (e.g. community comments endpoint doesn't JOIN music_artists), fetch
    // /api/music/artists/:id for an authoritative value. Mirrors the
    // ArtistAdminConsole pattern used across the app.
    const initialCommentProfileType = String(node?.profile_type || node?.profileType || '').toLowerCase();
    const [fetchedCommentProfileType, setFetchedCommentProfileType] = useState('');
    useEffect(() => {
        const commenterArtistId = Number(node?.artist_id || 0);
        if (!isArtistComment || !commenterArtistId) {
            setFetchedCommentProfileType('');
            return;
        }
        if (initialCommentProfileType === 'artist' || initialCommentProfileType === 'music') {
            setFetchedCommentProfileType('');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await secureFetch(
                    `/api/music/artists/${encodeURIComponent(String(commenterArtistId))}`,
                    { credentials: 'include', headers: { Accept: 'application/json' } }
                );
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.artist || data || {};
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (!cancelled) setFetchedCommentProfileType(pt === 'artist' ? 'artist' : 'music');
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [isArtistComment, node?.artist_id, initialCommentProfileType]);
    const commentProfileType = (initialCommentProfileType === 'artist' || initialCommentProfileType === 'music')
        ? initialCommentProfileType
        : (fetchedCommentProfileType || 'music');
    const isVisualArtistComment = isArtistComment && commentProfileType === 'artist';

    // For business/artist: use their specific avatar, then account_avatar_url (denormalized at creation).
    // NEVER fall back to node.avatar — that's the personal profile pic from the users table.
    // For normal users: use node.avatar (personal pic).
    const avatarUrl = (() => {
        if (isBusinessComment) {
            return (node.business_avatar_url || node.account_avatar_url || '').trim();
        }
        if (isArtistComment) {
            return (node.artist_avatar_url || node.account_avatar_url || '').trim();
        }
        return node.avatar || '';
    })();
    const removalLabel = (() => {
        const r = String(node.removed_reason || '').toLowerCase();
        if (r === 'post_owner' || r === 'postauthor' || r === 'post_author') return 'Comment removed by post author';
        if (r === 'moderator' || r === 'group_mod' || r === 'group_admin') return 'Comment removed by moderator';
        if (r === 'policy') return 'Comment removed';
        return 'Comment removed by comment author';
    })();

    // Check if comment is from a blocked user — entity-aware
    const commentUserId = Number(node.user_id || 0);
    const commentPublicId = Number(node.public_id || 0);
    const commentBizIdRaw = Number(node.business_id || 0);
    const commentArtIdRaw = Number(node.artist_id || 0);
    const commentHandle = (node.handle || node.business_slug || node.artist_handle || node.account_handle || '').toLowerCase().trim();
    const isBlockedUser = isCommentBlocked(node, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles });
    const [showBlockedContent, setShowBlockedContent] = useState(false);
    const [manuallyHidden, setManuallyHidden] = useState(false);

    // Should we show the placeholder?
    const showPlaceholder = isBlockedUser && (
        (!forceShowBlocked && !showBlockedContent) ||
        (forceShowBlocked && manuallyHidden)
    );
    // Should we show the full comment with a blocked label?
    const showBlockedLabel = isBlockedUser && !showPlaceholder;

    const [showFull, setShowFull] = useState(false);

    const nameNorm = name.toLowerCase().replace(/\s+/g, ' ').trim();
    const authorId = postAuthor?.id != null ? String(postAuthor.id) : null;
    const authorHandle = (postAuthor?.handle || '').toLowerCase();
    const authorPublicId = postAuthor?.public_id != null ? String(postAuthor.public_id) : null;
    const authorNameNorm = (postAuthor?.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const nodeId = node.user_id != null ? String(node.user_id) : null;
    const nodeHandle = (node.handle || '').toLowerCase();
    const nodePub = node.public_id != null ? String(node.public_id) : null;
    const sameUser = viewerId != null && nodeId != null && String(viewerId) === nodeId;
    const commentBizId = Number(node.business_id || 0);
    const commentArtId = Number(node.artist_id || 0);

    const canDelete = viewerId != null && (String(viewerId) === nodeId || (authorId && String(viewerId) === authorId));
    const deleteLabel = depth > 0 ? 'Delete Reply' : 'Delete Comment';
    const isPinned = Boolean(node.is_pinned);
    // isViewerPostAuthor: true only when the viewer is operating under the SAME
    // account type that created the post (not just same user_id).
    const { isBusinessAccount: isBA_comment, isArtistAccount: isAA_comment, activeAccount: activeAcct_comment, activeBusinessId: aBizId_comment, activeArtistId: aArtId_comment } = useActiveAccount();

    // Authoritative viewer profile_type for the reply-composer avatar
    // fallback. Mirrors ArtistAdminConsole — fetches the active artist row
    // and reads profile_type directly.
    const [fetchedReplyProfileType, setFetchedReplyProfileType] = useState('');
    useEffect(() => {
        const artistId = Number(aArtId_comment || 0);
        if (!isAA_comment || !artistId) {
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
    }, [isAA_comment, aArtId_comment]);

    // Sub-type for artist viewers. Fetched value wins over context/localStorage.
    const viewerReplyProfileType = (() => {
        if (!isAA_comment) return 'music';
        const fromFetched = String(fetchedReplyProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        const fromCtx = String(activeAcct_comment?.profile_type || activeAcct_comment?.profileType || '').toLowerCase();
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
    const isViewerPostAuthor = (() => {
        if (viewerId == null || authorId == null || String(viewerId) !== String(authorId)) return false;
        const postBizId = Number(post?.business_id || post?.businessId || 0);
        const postArtId = Number(post?.artist_id || post?.artistId || 0);
        if (postBizId > 0) return isBA_comment && Number(aBizId_comment) === postBizId;
        if (postArtId > 0) return isAA_comment && Number(aArtId_comment) === postArtId;
        return !isBA_comment && !isAA_comment;
    })();
    const canPin = Boolean(isViewerPostAuthor && depth === 0);

    // Account-aware: check if the current active account matches the comment's account

    const isActiveAccountMatch = sameUser && (
        (isBA_comment && aBizId_comment && commentBizId === Number(aBizId_comment)) ||
        (isAA_comment && aArtId_comment && commentArtId === Number(aArtId_comment)) ||
        (!isBA_comment && !isAA_comment && !commentBizId && !commentArtId)
    );

    // Account-aware "own comment": only hide Report if the comment was posted from the SAME account
    const isOwnComment = isActiveAccountMatch;
    // Use the viewer's LIVE avatar for their own comments so profile pic changes show immediately.
    const displayAvatarUrl = (isOwnComment && viewerAvatarUrl) ? viewerAvatarUrl : avatarUrl;
    // Bust browser cache for avatars so updated profile pictures show correctly.
    //
    // IMPORTANT: GCS signed URLs (X-Goog-Signature) include their query string
    // in the signature itself — appending ANY extra query param (like _v=123)
    // invalidates the signature and GCS returns 403 Forbidden. During the
    // private-bucket migration, avatars are served as signed URLs, so the
    // bust must be a no-op for them. Legacy public URLs (no signature) still
    // benefit from the bust, so we keep the behavior in that branch.
    const cacheBustedAvatarUrl = (() => {
        if (!displayAvatarUrl) return '';
        try {
            const isSignedGcs = /[?&]X-Goog-(Signature|Algorithm)=/i.test(displayAvatarUrl);
            if (isSignedGcs) return displayAvatarUrl;
            const separator = displayAvatarUrl.includes('?') ? '&' : '?';
            const cacheKey = Math.floor(Date.now() / (1000 * 60 * 60 * 4));
            return `${displayAvatarUrl}${separator}_v=${cacheKey}`;
        } catch { return displayAvatarUrl; }
    })();

    // Account-aware delete: allow if you're on the matching account that posted the comment,
    // OR you're the post author (those can always delete any comment on their post)
    const canDeleteEffective = canDelete && (
        isActiveAccountMatch ||
        (authorId && String(viewerId) === authorId)
    );

    // isAuthor: true only when the comment was posted by the SAME entity that
    // authored the post. A business/artist comment from the same user_id does
    // NOT count as "Author" on a personal-account post.
    const isAuthor = (() => {
        const userMatch =
            (authorId && nodeId && nodeId === authorId) ||
            (authorHandle && nodeHandle && nodeHandle === authorHandle) ||
            (authorPublicId && nodePub && nodePub === authorPublicId) ||
            (!!authorNameNorm && !!nameNorm && authorNameNorm === nameNorm);
        if (!userMatch) return false;
        // If the post has a business_id, the comment must be from that same business
        const postBizId = Number(post?.business_id || post?.businessId || 0);
        const postArtId = Number(post?.artist_id || post?.artistId || 0);
        if (postBizId > 0) return commentBizId === postBizId;
        if (postArtId > 0) return commentArtId === postArtId;
        // Personal post — comment must also be personal (no biz/art ID)
        return !commentBizId && !commentArtId;
    })();

    const [liked, setLiked] = useState(Boolean(node.viewer_liked));
    const [likes, setLikes] = useState(Number(node.likes || 0));
    const [flagged, setFlagged] = useState(Boolean(node.viewer_flagged));

    // Comment menu state (3-dot menu)
    const [commentMenuAnchor, setCommentMenuAnchor] = useState(null);
    const commentMenuOpen = Boolean(commentMenuAnchor);
    const openCommentMenu = (e) => {
        e.stopPropagation();
        setCommentMenuAnchor(e.currentTarget);
    };
    const closeCommentMenu = (e) => {
        if (e) e.stopPropagation();
        setCommentMenuAnchor(null);
    };

    useEffect(() => {
        setLiked(Boolean(node.viewer_liked));
        setLikes(Number(node.likes || 0));
        setFlagged(Boolean(node.viewer_flagged));
    }, [node.viewer_liked, node.viewer_flagged, node.likes]);

    const toggleReplies = () => setExpanded((s) => ({ ...s, [node.id]: !s[node.id] }));

    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyImageUrls, setReplyImageUrls] = useState([]);
    const [replyError, setReplyError] = useState('');

    const replyInputRef = useRef(null);

    const [replyMention, setReplyMention] = useState({
        open: false,
        query: '',
        results: [],
        start: -1,
        end: -1,
        anchorEl: null,
    });
    const [replyMentionLoading, setReplyMentionLoading] = useState(false);

    const closeReplyMention = useCallback(() => {
        setReplyMentionLoading(false);
        setReplyMention({
            open: false,
            query: '',
            results: [],
            start: -1,
            end: -1,
            anchorEl: null,
        });
    }, []);

    // Dismiss reply mention dropdown on scroll
    useEffect(() => {
        if (!replyMention.open) return;
        const onScroll = () => closeReplyMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [replyMention.open, closeReplyMention]);

    const syncReplyMention = useCallback(
        (nextText) => {
            const el = replyInputRef.current;
            const caret = el?.selectionStart ?? nextText.length;
            const m = getMentionMatch(nextText, caret);

            if (!m) {
                if (replyMention.open) closeReplyMention();
                return;
            }

            const anchorEl = getMentionAnchorVirtualEl(el, m.end);

            setReplyMention((s) => {
                if (s.open && s.query === m.query && s.start === m.start && s.end === m.end) {
                    return { ...s, anchorEl };
                }
                return { open: true, query: m.query, results: [], start: m.start, end: m.end, anchorEl };
            });
        },
        [closeReplyMention, replyMention.open]
    );

    useEffect(() => {
        if (!replyMention.open || !replyMention.query) return undefined;

        setReplyMentionLoading(true);
        const ctrl = new AbortController();

        const t = window.setTimeout(async () => {
            try {
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(replyMention.query)}`, {
                    credentials: 'include',
                    signal: ctrl.signal,
                    cache: 'no-store',
                });

                if (!res.ok) {
                    setReplyMentionLoading(false);
                    return;
                }

                const data = await res.json().catch(() => []);
                setReplyMention((s) => {
                    if (!s.open || s.query !== replyMention.query) return s;
                    return { ...s, results: Array.isArray(data) ? data : [] };
                });
            } catch {
                // ignore
            } finally {
                setReplyMentionLoading(false);
            }
        }, 180);

        return () => {
            window.clearTimeout(t);
            ctrl.abort();
        };
    }, [replyMention.open, replyMention.query]);

    const sendReply = async () => {
        const txt = replyText.trim();
        const hasImages = replyFiles.length > 0 || replyImageUrls.length > 0;
        if (!txt && !hasImages) return;

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
                try {
                    const fd = new FormData();
                    fd.append('image', file);
                    const modRes = await secureFetch('/api/community/moderate-image', {
                        method: 'POST',
                        credentials: 'include',
                        body: fd,
                    });
                    if (!modRes.ok) {
                        const modData = await modRes.json().catch(() => null);
                        if (modData && modData.safe === false) {
                            setReplyError(modData.message || 'One of your images was flagged as inappropriate and cannot be uploaded.');
                            return;
                        }
                        setReplyError('Unable to verify image safety. Please try a different image.');
                        return;
                    }
                    const modData = await modRes.json().catch(() => null);
                    if (modData && modData.safe === false) {
                        setReplyError(modData.message || 'One of your images was flagged as inappropriate and cannot be uploaded.');
                        return;
                    }
                } catch {
                    setReplyError('Unable to verify image safety. Please check your connection and try again.');
                    return;
                }
            }
        }

        setReplyError('');
        submitReply(node.id, txt, () => {
            setReplyText('');
            setReplyFiles([]);
            setReplyImageUrls([]);
            setReplyOpen(false);
            setExpanded((s) => ({ ...s, [node.id]: true }));
        }, { files: replyFiles, imageUrls: replyImageUrls });
    };

    const onReplyKeyDown = (e) => {
        if (replyMention.open && e.key === 'Escape') {
            e.preventDefault();
            closeReplyMention();
            return;
        }
        // Enter = new line. Ctrl/Cmd + Enter = submit.
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            sendReply();
        }
    };

    const openCard = (e) => {
        // Detect if comment was made under a business or artist account
        const isBizComment = Boolean(node.business_id || node.business_name || node.account_type === 'business');
        const isArtComment = Boolean(node.artist_id || node.artist_name || node.account_type === 'artist');

        onOpenUserCard?.(e.currentTarget, {
            id: node.user_id,
            first_name: node.first_name,
            last_name: node.last_name,
            handle: node.handle,
            avatar_url: node.avatar,
            ...(isBizComment ? {
                account_type: 'business',
                business_id: node.business_id,
                business_name: node.business_name || node.account_name,
                business_slug: node.business_slug || node.account_handle,
                business_avatar_url: node.business_avatar_url || node.account_avatar_url,
            } : {}),
            ...(isArtComment ? {
                account_type: 'artist',
                artist_id: node.artist_id,
                artist_name: node.artist_name || node.account_name,
                artist_handle: node.artist_handle || node.account_handle,
                artist_avatar_url: node.artist_avatar_url || node.account_avatar_url,
            } : {}),
            ...(node.account_type ? { account_type: node.account_type } : {}),
            ...(node.account_name ? { account_name: node.account_name } : {}),
            ...(node.account_handle ? { account_handle: node.account_handle } : {}),
            ...(node.account_avatar_url ? { account_avatar_url: node.account_avatar_url } : {}),
        });
    };

    const onMentionClick = (e, mentionHandle) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const h = String(mentionHandle || '').replace(/^@/, '').trim();
        if (!h) return;

        const anchorTarget = e.currentTarget;

        // Resolve account type before opening card
        resolveMentionHandle(h).then((resolved) => {
            onOpenUserCard?.(anchorTarget, resolved);
        });
    };

    const hasNodeAvatar = !!displayAvatarUrl;

    // Default avatar icon and styling (isBusinessComment/isArtistComment defined above)
    const DefaultAvatarIcon = isBusinessComment
        ? StorefrontOutlinedIcon
        : isArtistComment
            ? (isVisualArtistComment ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;
    const defaultAvatarSx = isBusinessComment || isArtistComment
        ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' }
        : { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' };

    // Depth-capped indent — after MAX_VISUAL_DEPTH, stop adding padding
    const shouldIndent = depth > 0 && depth <= MAX_VISUAL_DEPTH;

    const needsTruncate = !!node.text && node.text.length > COMMENT_PREVIEW_CHARS;
    const displayText =
        !node.text
            ? ''
            : showFull || !needsTruncate
                ? node.text
                : `${node.text.slice(0, COMMENT_PREVIEW_CHARS)}...`;

    const REPLY_BATCH = 25;
    const [visibleReplies, setVisibleReplies] = useState(REPLY_BATCH);
    useEffect(() => {
        if (open) setVisibleReplies(REPLY_BATCH);
    }, [open]);

    const repliesToShow = hasReplies ? node.replies.slice(0, visibleReplies) : [];

    // Render blocked user placeholder — content hidden by default, reply tree stays visible
    if (showPlaceholder) {
        const blockedLabel = depth > 0 ? 'Reply from a blocked user' : 'Comment from a blocked user';
        const isHighlighted = String(highlightedCommentId) === String(node.id);
        const handleShowThis = () => {
            if (forceShowBlocked) setManuallyHidden(false);
            else setShowBlockedContent(true);
        };
        return (
            <>
                <Box
                    id={`comment-${node.id}`}
                    sx={{
                        pl: shouldIndent ? 2 : 0,
                        borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.text.primary, 0.08)}` : 'none',
                        ml: shouldIndent ? 1 : 0,
                        ...(isHighlighted ? {
                            bgcolor: (t) => alphaColor('#A87822', 0.08),
                            borderRadius: 2.5,
                            border: '2px solid',
                            borderColor: (t) => `${alphaColor('#A87822', 0.45)}`,
                            boxShadow: (t) => `0 0 16px ${alphaColor('#A87822', 0.15)}`,
                            px: 1.5,
                            my: 0.5,
                            transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease',
                        } : {}),
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center',
                            py: 1,
                            px: 1.5,
                            bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03),
                            borderRadius: 2,
                            my: 0.5,
                        }}
                    >
                        <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                            {blockedLabel}
                        </Typography>
                        <Link
                            component="button"
                            type="button"
                            underline="hover"
                            onClick={handleShowThis}
                            sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                        >
                            Show
                        </Link>
                    </Box>

                    {hasReplies && !open && (
                        <Link
                            component="button"
                            type="button"
                            underline="hover"
                            onClick={toggleReplies}
                            sx={{ fontSize: 13, ml: 1, mt: 0.5, display: 'block' }}
                        >
                            View {node.replies.length} {node.replies.length === 1 ? 'reply' : 'replies'}
                        </Link>
                    )}
                </Box>

                {hasReplies && open ? (
                    <Box sx={{ pl: shouldIndent ? 2 : 0, ml: shouldIndent ? 1 : 0 }}>
                        {repliesToShow.map((r) => (
                            <ThreadedCommentItem
                                key={r.id}
                                node={r}
                                depth={depth + 1}
                                expanded={expanded}
                                setExpanded={setExpanded}
                                viewerAvatarUrl={viewerAvatarUrl}
                                viewerLabel={viewerLabel}
                                postAuthor={postAuthor}
                                onOpenUserCard={onOpenUserCard}
                                likeComment={likeComment}
                                submitReply={submitReply}
                                openFlag={openFlag}
                                viewerId={viewerId}
                                onDelete={onDelete}
                                onTogglePinConfirm={onTogglePinConfirm}
                                blockedUserIds={blockedUserIds}
                                blockedBusinessIds={blockedBusinessIds}
                                blockedArtistIds={blockedArtistIds}
                                blockedHandles={blockedHandles}
                                replyToName={name}
                                replyToHandle={displayHandle}
                                replyToAvatar={displayAvatarUrl}
                                onShareComment={onShareComment}
                                onScrollToComment={onScrollToComment}
                                highlightedCommentId={highlightedCommentId}
                                parentCommentId={node.id}
                                newCommentIds={newCommentIds}
                                post={post}
                                onCopyLinkToast={onCopyLinkToast}
                                groupCommentGated={groupCommentGated}
                            />
                        ))}
                        {node.replies.length > visibleReplies && (
                            <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={() => setVisibleReplies((v) => v + REPLY_BATCH)}
                                sx={{ fontSize: 13, ml: 3, mt: 0.5, display: 'block' }}
                            >
                                Show {Math.min(REPLY_BATCH, node.replies.length - visibleReplies)} more replies
                            </Link>
                        )}
                    </Box>
                ) : null}
            </>
        );
    }

    return (
        <>
            <Box
                id={`comment-${node.id}`}
                sx={{
                    pl: shouldIndent ? 2 : 0,
                    borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.text.primary, 0.08)}` : 'none',
                    ml: shouldIndent ? 1 : 0,
                    ...(String(highlightedCommentId) === String(node.id) ? {
                        bgcolor: (t) => alphaColor('#A87822', 0.08),
                        borderRadius: 2.5,
                        border: '2px solid',
                        borderColor: (t) => `${alphaColor('#A87822', 0.45)}`,
                        boxShadow: (t) => `0 0 16px ${alphaColor('#A87822', 0.15)}`,
                        px: 1.5,
                        my: 0.5,
                        transition: 'background-color 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease',
                    } : {}),
                    ...(newCommentIds && newCommentIds.has(node.id) ? NEW_COMMENT_FADE_SX : {}),
                }}
            >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', py: 1.25 }}>
                    <Avatar
                        src={hasNodeAvatar ? cacheBustedAvatarUrl : undefined}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        sx={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: 'divider',
                            ...(!hasNodeAvatar ? defaultAvatarSx : {}),
                        }}
                        onClick={openCard}
                    >
                        {!hasNodeAvatar ? <DefaultAvatarIcon fontSize="small" /> : null}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* "Replying to [Name]'s comment" label for replies */}
                        {depth > 0 && replyToName ? (
                            <Typography variant="caption"
                                        sx={{ color: 'text.secondary', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}
                            >
                                <Box component="span" sx={{ color: 'primary.main' }}>↳</Box>
                                Replying to {replyToName}&apos;s{' '}
                                <Box
                                    component="span"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (parentCommentId && onScrollToComment) onScrollToComment(parentCommentId);
                                    }}
                                    sx={{ color: 'primary.main', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                >
                                    comment
                                </Box>
                            </Typography>
                        ) : null}

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: 'nowrap',
                            }}
                        >
                            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                                <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 700, cursor: 'pointer' }}
                                        onClick={openCard}
                                        noWrap
                                    >
                                        {name}
                                    </Typography>
                                    {isAuthor && (
                                        <Chip size="small" label="Author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alphaColor(t.palette.primary.main, 0.10), color: t.palette.primary.main, border: '1px solid', borderColor: alphaColor(t.palette.primary.main, 0.24), '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                    {isPinned && depth === 0 && (
                                        <Chip size="small" icon={<PushPinRoundedIcon sx={{ fontSize: 11 }} />} label="Pinned"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alphaColor(t.palette.secondary.main, 0.10), color: t.palette.secondary.main, border: '1px solid', borderColor: alphaColor(t.palette.secondary.main, 0.24), '& .MuiChip-icon': { ml: '2px', mr: '0px', color: t.palette.secondary.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                    {ts ? (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                {ts}
                                            </Typography>
                                        </>
                                    ) : null}
                                    {Boolean(node.liked_by_author) && !isAuthor && (
                                        <Chip size="small" icon={<FavoriteRoundedIcon sx={{ fontSize: 10 }} />} label="by author"
                                              sx={(t) => ({ height: 18, fontSize: 10, fontWeight: 800, ml: 0.25, bgcolor: alphaColor(t.palette.error.main, 0.08), color: t.palette.error.main, border: '1px solid', borderColor: alphaColor(t.palette.error.main, 0.18), '& .MuiChip-icon': { ml: '2px', mr: '-2px', color: t.palette.error.main }, '& .MuiChip-label': { px: 0.5 } })} />
                                    )}
                                    {showBlockedLabel && (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                                                {depth > 0 ? 'Reply made by a blocked user' : 'Comment made by a blocked user'}
                                            </Typography>
                                            <Link
                                                component="button"
                                                type="button"
                                                underline="hover"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (forceShowBlocked) setManuallyHidden(true);
                                                    else setShowBlockedContent(false);
                                                }}
                                                sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', ml: 0.25 }}
                                            >
                                                Hide
                                            </Link>
                                        </>
                                    )}
                                </Box>
                                {displayHandle ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ cursor: 'pointer', lineHeight: 1.2, mt: 0.1, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        onClick={openCard}
                                        noWrap
                                    >
                                        @{displayHandle}
                                    </Typography>
                                ) : null}
                            </Box>

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
                                {/* 3-dot menu for all users */}
                                {!isRemoved ? (
                                    <Box>
                                        <IconButton
                                            size="small"
                                            onClick={openCommentMenu}
                                            sx={{
                                                border: (t) => `1px solid ${alphaColor(t.palette.text.primary, 0.10)}`,
                                                background: 'background.paper',
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                        <SmartMenu
                                            anchorEl={commentMenuAnchor}
                                            open={commentMenuOpen}
                                            onClose={closeCommentMenu}
                                            onClick={(e) => e.stopPropagation()}
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                            slotProps={{
                                                paper: {
                                                    sx: { minWidth: 160, borderRadius: 2 },
                                                },
                                            }}
                                        >
                                            {onShareComment ? (
                                                <MenuItem
                                                    onClick={(e) => {
                                                        closeCommentMenu(e);
                                                        const pid = post?.id || '';
                                                        const url = `${window.location.origin}/posts/${pid}?comment=${node.id}`;
                                                        navigator.clipboard.writeText(url).then(() => {
                                                            onCopyLinkToast?.();
                                                        }).catch(() => {});
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <LinkIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText primary="Copy link" />
                                                </MenuItem>
                                            ) : null}
                                            {canPin ? (
                                                <MenuItem
                                                    onClick={(e) => {
                                                        closeCommentMenu(e);
                                                        onTogglePinConfirm?.(node.id, isPinned);
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <PushPinRoundedIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText primary={isPinned ? "Unpin comment" : "Pin comment"} />
                                                </MenuItem>
                                            ) : null}
                                            {canDeleteEffective ? (
                                                <MenuItem
                                                    onClick={(e) => {
                                                        closeCommentMenu(e);
                                                        onDelete?.(node.id, !!depth);
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText primary={deleteLabel} />
                                                </MenuItem>
                                            ) : null}
                                            {!isOwnComment && !flagged ? (
                                                <MenuItem
                                                    onClick={(e) => {
                                                        closeCommentMenu(e);
                                                        openFlag(node.id);
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <FlagOutlinedIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText primary="Report comment" />
                                                </MenuItem>
                                            ) : null}
                                            {!isOwnComment && flagged ? (
                                                <MenuItem disabled>
                                                    <ListItemIcon>
                                                        <FlagOutlinedIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText primary="Reported" />
                                                </MenuItem>
                                            ) : null}
                                        </SmartMenu>
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>

                        {(node.text || isRemoved) ? (
                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 0.5,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontStyle: isRemoved ? 'italic' : 'normal',
                                    color: isRemoved ? 'text.secondary' : 'text.primary',
                                }}
                            >
                                {isRemoved
                                    ? removalLabel
                                    : (
                                        <>
                                            {renderTextWithMentions(displayText, onMentionClick)}
                                            {needsTruncate && !showFull ? (
                                                <>
                                                    {' '}
                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="hover"
                                                        onClick={() => setShowFull(true)}
                                                        sx={{ fontSize: 14 }}
                                                    >
                                                        more
                                                    </Link>
                                                </>
                                            ) : null}
                                            {needsTruncate && showFull ? (
                                                <>
                                                    {' '}
                                                    <Link
                                                        component="button"
                                                        type="button"
                                                        underline="hover"
                                                        onClick={() => setShowFull(false)}
                                                        sx={{ fontSize: 14 }}
                                                    >
                                                        less
                                                    </Link>
                                                </>
                                            ) : null}
                                        </>
                                    )}
                            </Typography>
                        ) : null}

                        {/* Comment images / GIFs */}
                        {!isRemoved && (node.images?.length > 0 || node.image) ? (
                            <CommentImages images={node.images} image={node.image} />
                        ) : null}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.75 }}>
                            <Link
                                component="button"
                                type="button"
                                underline="none"
                                onClick={() => { if (isRemoved) return; likeComment(node.id, liked, setLiked, setLikes); }}
                                disabled={isRemoved}
                                sx={{ fontSize: 13, fontWeight: liked ? 900 : 700, color: liked ? 'primary.main' : 'text.secondary', cursor: isRemoved ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                            >
                                {liked ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} /> : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />} {likes > 0 ? likes : 'Like'}
                            </Link>

                            {!groupCommentGated && (
                                <Link
                                    component="button"
                                    type="button"
                                    underline="none"
                                    onClick={() => setReplyOpen((v) => !v)}
                                    sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                    aria-expanded={replyOpen ? 'true' : 'false'}
                                >
                                    <ReplyRoundedIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} /> Reply
                                </Link>
                            )}

                            {onShareComment && (
                                <Link
                                    component="button"
                                    type="button"
                                    underline="none"
                                    onClick={() => onShareComment(node)}
                                    sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, p: 0 }}
                                >
                                    <ShareOutlinedIcon sx={{ fontSize: 14 }} /> Share
                                </Link>
                            )}
                        </Box>

                        {replyOpen ? (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-start' }}>
                                <ComposerAvatar
                                    url={viewerAvatarUrl}
                                    accountType={isBA_comment ? 'business' : isAA_comment ? 'artist' : 'personal'}
                                    profileType={isAA_comment ? viewerReplyProfileType : undefined}
                                    label={viewerLabel}
                                    size={{ xs: 32, sm: 40 }}
                                    iconSize={18}
                                    sx={{ mt: 0.25 }}
                                />


                                <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        maxRows={6}
                                        placeholder={`Reply to ${name}…`}
                                        value={replyText}
                                        inputRef={replyInputRef}
                                        onChange={(e) => {
                                            const next = e.target.value;
                                            setReplyText(next);
                                            if (replyError) setReplyError('');
                                            syncReplyMention(next);
                                        }}
                                        onKeyDown={onReplyKeyDown}
                                        error={Boolean(replyError)}
                                        helperText={replyError}
                                        inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: 2, alignItems: 'flex-end' },
                                        }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.25 }}>
                                                    <IconButton
                                                        aria-label="Send reply"
                                                        onClick={sendReply}
                                                        disabled={!replyText.trim() && replyFiles.length === 0 && replyImageUrls.length === 0}
                                                        sx={{
                                                            ml: 0.5,
                                                            bgcolor: 'primary.main',
                                                            color: 'common.white',
                                                            width: 34,
                                                            height: 34,
                                                            flexShrink: 0,
                                                            '&:hover': { bgcolor: 'primary.dark' },
                                                            '&.Mui-disabled': {
                                                                bgcolor: 'action.disabledBackground',
                                                                color: 'action.disabled',
                                                                opacity: 1,
                                                            },
                                                        }}
                                                    >
                                                        <ArrowForwardRoundedIcon />
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
                                            // Find newly added files (not in current replyFiles)
                                            const added = newFiles.filter((f) => !replyFiles.includes(f));
                                            for (const file of added) {
                                                const result = await scanImageFile(file);
                                                if (!result.safe) {
                                                    setReplyError(result.message);
                                                    // Remove the bad file from the array
                                                    setReplyFiles((prev) => prev.filter((pf) => pf !== file));
                                                    return;
                                                }
                                            }
                                            setReplyFiles(newFiles);
                                        }}
                                        onUrlsChange={(u) => { setReplyImageUrls(u); if (replyError) setReplyError(''); }}
                                        maxImages={4}
                                        disabled={false}
                                    />

                                    <Popper
                                        open={Boolean(replyMention.open)}
                                        anchorEl={replyMention.anchorEl || replyInputRef.current}
                                        placement="bottom-start"
                                        disablePortal={false}
                                        sx={{ zIndex: 2000 }}
                                    >
                                        <ClickAwayListener onClickAway={closeReplyMention}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    mt: 0.75,
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    maxHeight: 280,
                                                    width: { xs: '100%', sm: 420 },
                                                    boxShadow: (t) => t.custom.shadows.lg,
                                                }}
                                            >
                                                <List dense disablePadding>
                                                    {replyMentionLoading ? (
                                                        <ListItem sx={{ py: 1 }}>
                                                            <ListItemText
                                                                primary="Searching…"
                                                                primaryTypographyProps={{ fontWeight: 800 }}
                                                            />
                                                        </ListItem>
                                                    ) : null}

                                                    {!replyMentionLoading &&
                                                    (!replyMention.results || replyMention.results.length === 0) ? (
                                                        <ListItem sx={{ py: 1 }}>
                                                            <ListItemText
                                                                primary="No results found"
                                                                primaryTypographyProps={{ fontWeight: 800 }}
                                                            />
                                                        </ListItem>
                                                    ) : null}

                                                    {!replyMentionLoading
                                                        ? (replyMention.results || []).map((u) => {
                                                            const handle = coerceHandle(u);
                                                            const label = coerceName(u);
                                                            const avatar = u?.avatar_url || u?.profile_picture || '';
                                                            const accountType = u?.account_type || 'user';
                                                            // Artist sub-type for the default fallback icon + badge.
                                                            const mentionProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
                                                            const isVisualArtistMention = accountType === 'artist' && mentionProfileType === 'artist';
                                                            return (
                                                                <ListItemButton
                                                                    key={String(u?.id || handle || label) + '_' + accountType}
                                                                    onMouseDown={(e) => e.preventDefault()}
                                                                    onClick={() => {
                                                                        const h = handle;
                                                                        if (!h) return;

                                                                        const el = replyInputRef.current;
                                                                        const startAt = Number.isFinite(Number(replyMention.start)) ? replyMention.start : -1;
                                                                        const endAt = Number.isFinite(Number(replyMention.end)) ? replyMention.end : replyText.length;
                                                                        if (startAt < 0) return;

                                                                        const before = replyText.slice(0, startAt);
                                                                        const after = replyText.slice(endAt);
                                                                        const insertion = `@${h} `;
                                                                        const next = `${before}${insertion}${after}`;

                                                                        setReplyText(next);
                                                                        closeReplyMention();

                                                                        requestAnimationFrame(() => {
                                                                            try {
                                                                                el?.focus();
                                                                                const pos = before.length + insertion.length;
                                                                                el?.setSelectionRange(pos, pos);
                                                                            } catch {
                                                                                // ignore
                                                                            }
                                                                        });
                                                                    }}
                                                                    sx={{ py: 1, px: 1.5 }}
                                                                >
                                                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                                                        <Avatar
                                                                            src={avatar || undefined}
                                                                            sx={{
                                                                                width: 32,
                                                                                height: 32,
                                                                                ...((!avatar && (accountType === 'business' || accountType === 'artist'))
                                                                                    ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' }
                                                                                    : (!avatar ? DEFAULT_AVATAR_SX : {})),
                                                                            }}
                                                                        >
                                                                            {!avatar
                                                                                ? (accountType === 'business'
                                                                                    ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                                                                    : accountType === 'artist'
                                                                                        ? (isVisualArtistMention
                                                                                            ? <PaletteRoundedIcon sx={{ fontSize: 18 }} />
                                                                                            : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />)
                                                                                        : <PersonRoundedIcon fontSize="small" />)
                                                                                : null}
                                                                        </Avatar>
                                                                    </ListItemAvatar>
                                                                    <ListItemText
                                                                        primary={
                                                                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                                                {label}
                                                                                <MentionAccountBadge accountType={accountType} profileType={mentionProfileType} />
                                                                            </Box>
                                                                        }
                                                                        secondary={handle ? `@${handle}` : ''}
                                                                        primaryTypographyProps={{ fontWeight: 800, noWrap: true }}
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
                                </Box>
                            </Box>
                        ) : null}

                        {node.reply_count > 0 && !hasReplies ? (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {node.reply_count} repl{node.reply_count === 1 ? 'y' : 'ies'}
                            </Typography>
                        ) : null}

                        {hasReplies ? (
                            <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={toggleReplies}
                                aria-expanded={open ? 'true' : 'false'}
                                aria-label={open ? 'Hide replies' : `Show replies (${node.replies.length})`}
                                sx={{
                                    mt: 0.5,
                                    p: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    textAlign: 'left',
                                    '&:focus-visible': (theme) => ({
                                        outline: `2px solid ${theme.palette.primary.main}`,
                                        outlineOffset: 2,
                                        borderRadius: 0.5,
                                    }),
                                }}
                            >
                                {open ? 'Hide replies' : `Show replies (${node.replies.length})`}
                            </Link>
                        ) : null}
                    </Box>
                </Box>
            </Box>

            {/* Replies rendered OUTSIDE the indented box so padding doesn't stack */}
            {hasReplies && open ? (
                <Box sx={{ pl: shouldIndent ? 2 : 0, ml: shouldIndent ? 1 : 0 }}>
                    {repliesToShow.map((r) => (
                        <ThreadedCommentItem
                            key={r.id}
                            node={r}
                            depth={depth + 1}
                            expanded={expanded}
                            setExpanded={setExpanded}
                            viewerAvatarUrl={viewerAvatarUrl}
                            viewerLabel={viewerLabel}
                            postAuthor={postAuthor}
                            onOpenUserCard={onOpenUserCard}
                            likeComment={likeComment}
                            submitReply={submitReply}
                            openFlag={openFlag}
                            viewerId={viewerId}
                            onDelete={onDelete}
                            onTogglePinConfirm={onTogglePinConfirm}
                            blockedUserIds={blockedUserIds}
                            blockedBusinessIds={blockedBusinessIds}
                            blockedArtistIds={blockedArtistIds}
                            blockedHandles={blockedHandles}
                            replyToName={name}
                            replyToHandle={displayHandle}
                            replyToAvatar={displayAvatarUrl}
                            onShareComment={onShareComment}
                            onScrollToComment={onScrollToComment}
                            highlightedCommentId={highlightedCommentId}
                            parentCommentId={node.id}
                            newCommentIds={newCommentIds}
                            post={post}
                            onCopyLinkToast={onCopyLinkToast}
                            groupCommentGated={groupCommentGated}
                        />
                    ))}

                    {node.replies.length > repliesToShow.length ? (
                        <Box sx={{ pl: 2, mt: 0.5 }}>
                            <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={() => setVisibleReplies((n) => Math.min(n + REPLY_BATCH, node.replies.length))}
                                sx={{ fontWeight: 600 }}
                            >
                                Load 25 more replies
                            </Link>
                        </Box>
                    ) : null}
                </Box>
            ) : null}
        </>
    );
}

/**
 * Helper: segment an array of top-level threads into groups.
 * Consecutive blocked comments (with no non-blocked replies) are merged
 * into { type: 'blocked-group', nodes: [...] }. Everything else is
 * { type: 'comment', node }.
 */
function groupBlockedTopLevel(threads, blockedUserIds, blockedHandles, blockedBusinessIds, blockedArtistIds) {
    const hasAny = (blockedUserIds?.size > 0) || (blockedHandles?.size > 0) ||
        (blockedBusinessIds?.size > 0) || (blockedArtistIds?.size > 0);
    if (!hasAny) {
        return threads.map((t) => ({ type: 'comment', node: t }));
    }

    const groups = [];
    let pendingBlocked = [];

    const isNodeBlocked = (t) => isCommentBlocked(t, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles });

    const flushBlocked = () => {
        if (pendingBlocked.length >= 2) {
            groups.push({ type: 'blocked-group', nodes: [...pendingBlocked] });
        } else if (pendingBlocked.length === 1) {
            // Single blocked comment — render as a normal item (ThreadedCommentItem handles the placeholder)
            groups.push({ type: 'comment', node: pendingBlocked[0] });
        }
        pendingBlocked = [];
    };

    for (const t of threads) {
        if (isNodeBlocked(t)) {
            pendingBlocked.push(t);
        } else {
            flushBlocked();
            groups.push({ type: 'comment', node: t });
        }
    }
    flushBlocked();
    return groups;
}

/** Collapsed group row for consecutive blocked top-level comments. */
function BlockedCommentsGroup({ nodes, renderComment }) {
    const [expanded, setExpanded] = useState(false);
    const count = nodes.length;

    if (!expanded) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    py: 1,
                    px: 1.5,
                    bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03),
                    borderRadius: 2,
                    my: 0.5,
                }}
            >
                <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {count === 1
                        ? 'Comment from a blocked user'
                        : `${count} comments from blocked users`}
                </Typography>
                <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => setExpanded(true)}
                    sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                >
                    Show
                </Link>
            </Box>
        );
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    py: 0.75,
                    px: 1.5,
                    bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03),
                    borderRadius: 2,
                    my: 0.5,
                }}
            >
                <BlockIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {count === 1
                        ? 'Comment from a blocked user'
                        : `${count} comments from blocked users`}
                </Typography>
                <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => setExpanded(false)}
                    sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                >
                    Hide
                </Link>
            </Box>
            {nodes.map((n) => renderComment(n, { forceShowBlocked: true }))}
        </Box>
    );
}

// Sort top-level threads (pinned first, then by mode). Returns a new array.
// focusCommentId: optional comment ID to boost to the top (the thread containing
//   this comment — either as the root or nested reply — is placed right after pinned).
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
        // Boosted (newly posted) comments appear at top, right after pinned
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

function RedditComments({
                            postId,
                            refreshKey,
                            initialPageSize = 50, // 50 comments at a time
                            viewer,
                            postAuthor,
                            onOpenUserCard,
                            onCommentCountChange,
                            onCopyLinkToast,
                            post,
                            addCommentRef,
                            groupCommentGated = false,
                            scrollToCommentId: scrollToCommentIdProp = null,
                            highlightCommentId: highlightCommentIdProp = null,
                            // Slice 2b: injectable URL builders. When omitted, defaults to
                            // the original community-post URL chains so PostDetailModal's
                            // pre-extraction behavior is byte-identical.
                            resourceContext = null,
                            // Slice 4e: when true (default), RedditComments renders its own
                            // top-level comment composer above the comments list. Callers
                            // that have their own composer (e.g., PostDetailModal / PostPage)
                            // should pass showComposer={false} to suppress it — they inject
                            // new comments via addCommentRef.current(newComment).
                            showComposer = true,
                        }) {
    // Slice 2b: resolve the resource context once per render. Stable ref
    // when the prop is unchanged (which it will be for both call sites).
    const resourceCtx = useMemo(
        () => normalizeResourceContext(resourceContext),
        [resourceContext]
    );

    const [loading, setLoading] = useState(true);
    const [threads, setThreads] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [visibleCount, setVisibleCount] = useState(initialPageSize);
    const [scrolled, setScrolled] = useState(false);
    const [commentSort, setCommentSort] = useState('popular');
    // displayThreads holds the sorted order — only re-sorted on fetch/sort-change/structural edits, NOT on likes
    const [displayThreads, setDisplayThreads] = useState([]);
    const commentSortRef = useRef('popular');
    commentSortRef.current = commentSort;
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const highlightTimerRef = useRef(0);
    const [commentDeleteConfirm, setCommentDeleteConfirm] = useState({ open: false, commentId: null, isReply: false });


    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());

    // Rate limiting for replies
    const { checkLimit: checkReplyLimit, recordAction: recordReply } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [replyRateLimitOpen, setReplyRateLimitOpen] = useState(false);
    const [replyRateLimitInfo, setReplyRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });

    const handleShareComment = useCallback((commentNode) => {
        setShareCommentTarget(commentNode);
        setShareCommentDialogOpen(true);
    }, []);

    // Active account context — used to scope viewerLiked per-account when fetching comments
    const { activeBusinessId: commentBizId, activeArtistId: commentArtId } = useActiveAccount();
    const commentAccountKey = commentBizId ? `biz:${commentBizId}` : commentArtId ? `art:${commentArtId}` : 'personal';

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
        const filterNode = (node) => {
            if (String(node.id) === String(commentId)) {
                return null;
            }
            if (node.replies && node.replies.length > 0) {
                return { ...node, replies: node.replies.map(filterNode).filter(Boolean) };
            }
            return node;
        };
        return currentThreads.map(filterNode).filter(Boolean);
    }, []);

    // Helper: toggle pin status and re-sort
    const togglePinInTree = useCallback((currentThreads, commentId, isPinned) => {
        const updated = currentThreads.map((node) => {
            if (String(node.id) === String(commentId)) {
                return { ...node, is_pinned: isPinned, pinned_at: isPinned ? new Date().toISOString() : null };
            }
            return node;
        });
        return updated.sort((a, b) => {
            const ap = a.is_pinned ? 1 : 0;
            const bp = b.is_pinned ? 1 : 0;
            return bp - ap;
        });
    }, []);

    // Track blocked users for comment placeholders
    const [blockedUserIds, setBlockedUserIds] = useState(() => {
        const raw = viewer?.blocked_user_ids || viewer?.blockedUserIds || viewer?.blocked_users || [];
        const arr = Array.isArray(raw) ? raw : [];
        return new Set(arr.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0));
    });
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [blockedHandles, setBlockedHandles] = useState(() => new Set());

    // Fetch blocked user IDs and handles from the server on mount
    useEffect(() => {
        if (!viewer?.id) return;
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

                // Fetch handles for each blocked personal user so we can match replies by handle
                if (sets.blockedUserIds.size > 0) {
                    const handles = new Set();
                    await Promise.all(
                        Array.from(sets.blockedUserIds).slice(0, 50).map(async (uid) => {
                            try {
                                const r = await secureFetch(`/api/users/public/${uid}`, {
                                    credentials: 'include',
                                    headers: { Accept: 'application/json' },
                                });
                                if (!r.ok) return;
                                const d = await r.json();
                                const h = (d?.profile?.handle || d?.handle || '').toLowerCase().trim();
                                if (h) handles.add(h);
                            } catch { /* skip */ }
                        })
                    );
                    if (active && handles.size > 0) setBlockedHandles(handles);
                }
            } catch {
                // Non-critical
            }
        })();
        return () => { active = false; };
    }, [viewer?.id]);

    // Listen for blocked-changed events (real-time updates when user blocks/unblocks during session)
    useEffect(() => {
        const onBlockedChanged = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
        };

        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
        };
    }, []);

    // "Back to Top" visibility
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // fetch comments (and replies)
    useEffect(() => {
        let cancelled = false;
        const fetchComments = async () => {
            setLoading(true);
            setVisibleCount(initialPageSize);

            // Build query string with active account for per-account viewerLiked
            const qp = new URLSearchParams();
            if (commentBizId) qp.set('activeBusinessId', commentBizId);
            else if (commentArtId) qp.set('activeArtistId', commentArtId);
            const qs = qp.toString() ? `?${qp.toString()}` : '';

            const tryUrls = resourceCtx.listUrls(postId, qs);

            for (const url of tryUrls) {
                try {
                    const res = await secureFetch(url, { credentials: 'include' });
                    if (res.ok) {
                        const data = await res.json();
                        if (!cancelled) {
                            const normalized = normalizeComments(data);
                            setThreads(normalized);
                            setDisplayThreads(sortTopLevelThreads(normalized, commentSortRef.current, undefined, scrollToCommentIdProp));
                            setLoading(false);
                        }
                        return;
                    }
                } catch {
                    // try next endpoint
                }
            }
            if (!cancelled) {
                setThreads([]);
                setDisplayThreads([]);
                setLoading(false);
            }
        };
        fetchComments();
        return () => {
            cancelled = true;
        };
    }, [postId, refreshKey, initialPageSize, commentAccountKey, commentBizId, commentArtId]);

    // Expose a function for the parent to optimistically insert a new top-level comment
    // (so submitting a comment doesn't trigger a full reload).
    // Slice 4e: also wires the internal ref used by our own composer so
    // showComposer=true works without the caller having to provide a ref.
    useEffect(() => {
        const addToList = (serverComment) => {
            if (!serverComment) return;
            const normalized = normalizeComments([serverComment]);
            if (normalized.length > 0) {
                const boostSet = new Set(normalized.map((c) => c.id));
                setThreads((prev) => [...normalized, ...prev]);
                setDisplayThreads((prev) => sortTopLevelThreads([...normalized, ...prev], commentSortRef.current, boostSet));
                ensureCommentFadeKeyframes();
                normalized.forEach((c) => {
                    setNewCommentIds((prev) => new Set(prev).add(c.id));
                });
            }
        };

        if (addCommentRef) addCommentRef.current = addToList;
        internalAddCommentRef.current = addToList;

        return () => {
            if (addCommentRef) addCommentRef.current = null;
            internalAddCommentRef.current = null;
        };
    }, [addCommentRef]);

    const toggle = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

    const requestCommentDelete = useCallback((commentId, isReply = false) => {
        const cid = Number(commentId);
        if (!Number.isFinite(cid) || cid <= 0) return;
        setCommentDeleteConfirm({ open: true, commentId: cid, isReply: !!isReply });
    }, []);

    const closeCommentDeleteConfirm = useCallback(() => {
        setCommentDeleteConfirm({ open: false, commentId: null, isReply: false });
    }, []);

    const confirmCommentDelete = useCallback(async () => {
        if (!commentDeleteConfirm.commentId) return;
        await deleteComment(commentDeleteConfirm.commentId);
        closeCommentDeleteConfirm();
    }, [commentDeleteConfirm.commentId, commentDeleteConfirm.isReply, deleteComment, closeCommentDeleteConfirm]);


    const openLogin = useCallback(() => {
        try {
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch {}
    }, []);


    const [pinConfirm, setPinConfirm] = useState({
        open: false,
        commentId: null,
        mode: 'pin', // 'pin' | 'unpin'
        willReplace: false,
    });

    const closePinConfirm = useCallback(() => {
        setPinConfirm({ open: false, commentId: null, mode: 'pin', willReplace: false });
    }, []);

    const pinnedTopLevel = useMemo(() => threads.find((t) => Boolean(t.is_pinned)) || null, [threads]);
    const pinnedTopLevelId = pinnedTopLevel?.id != null ? String(pinnedTopLevel.id) : null;
    // isViewerPostAuthor: true only when the viewer is operating under the SAME
    // account (personal / business / artist) that originally created the post.
    // A business or artist account sharing the same user_id does NOT count as
    // "post author" on a personal-account post (and vice-versa).
    const isViewerPostAuthor = (() => {
        if (viewer?.id == null || postAuthor?.id == null) return false;
        if (String(viewer.id) !== String(postAuthor.id)) return false;
        const postBizId = Number(post?.business_id || post?.businessId || 0);
        const postArtId = Number(post?.artist_id || post?.artistId || 0);
        const freshAcct = (() => { try { const r = localStorage.getItem('ll:activeAccount'); return r ? JSON.parse(r) : null; } catch { return null; } })();
        const activeType = String(freshAcct?.type || '').toLowerCase();
        const activeBizId = Number(freshAcct?.type === 'business' && freshAcct?.id ? freshAcct.id : 0);
        const activeArtId = Number(freshAcct?.type === 'artist' && freshAcct?.id ? freshAcct.id : 0);
        if (postBizId > 0) return activeType === 'business' && activeBizId === postBizId;
        if (postArtId > 0) return activeType === 'artist' && activeArtId === postArtId;
        // Personal post — viewer must also be on personal (no biz/art active)
        return activeType !== 'business' && activeType !== 'artist';
    })();

    const togglePin = useCallback(
        async (commentId, unpin = false) => {
            if (!viewer) {
                openLogin();
                return;
            }
            if (!isViewerPostAuthor) return;

            const pid = Number(postId);
            const cid = Number(commentId);
            if (!Number.isFinite(pid) || pid <= 0) return;
            if (!Number.isFinite(cid) || cid <= 0) return;

            // Optimistically update the pin status
            const newPinState = !unpin;
            setThreads((prev) => togglePinInTree(prev, cid, newPinState));
            setDisplayThreads((prev) => sortTopLevelThreads(togglePinInTree(prev, cid, newPinState), commentSortRef.current));

            const action = unpin ? 'unpin' : 'pin';
            const tryUrls = resourceCtx.pinUrls(pid, cid, action);

            let success = false;
            for (const url of tryUrls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include' });
                    if (res.ok) {
                        success = true;
                        return;
                    }
                } catch {
                    // try next endpoint
                }
            }

            // Revert on failure
            if (!success) {
                setThreads((prev) => togglePinInTree(prev, cid, !newPinState));
                setDisplayThreads((prev) => sortTopLevelThreads(togglePinInTree(prev, cid, !newPinState), commentSortRef.current));
            }
        },
        [viewer, isViewerPostAuthor, postId, openLogin, togglePinInTree]
    );

    const requestTogglePinConfirm = useCallback(
        (commentId, currentlyPinned) => {
            if (!viewer) {
                try {
                    window.dispatchEvent(new CustomEvent('open-login'));
                    window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                    window.dispatchEvent(new CustomEvent('open-login-popup'));
                } catch {}
                return;
            }

            const cid = Number(commentId);
            if (!Number.isFinite(cid) || cid <= 0) return;

            togglePin(cid, Boolean(currentlyPinned));
        },
        [viewer, togglePin]
    );


    const viewerPersonalAvatarUrl = (() => {
        const raw = viewer?.avatar_url || viewer?.profile_picture || '';
        if (!raw || raw.includes('default_avatar')) return '';
        return raw;
    })();
    const viewerPersonalLabel = `${viewer?.first_name || ''} ${viewer?.last_name || ''}`.trim() || 'You';

    // Use active account info for comment display name & avatar
    const { isBusinessAccount: isBA, isArtistAccount: isAA, activeBusinessId: aBizId, activeArtistId: aArtId, activeAccount: acctObj } = useActiveAccount();

    const [fetchedAccountAvatar, setFetchedAccountAvatar] = useState('');
    const [fetchedAccountProfileType, setFetchedAccountProfileType] = useState('');
    useEffect(() => {
        if (!isBA && !isAA) {
            setFetchedAccountAvatar('');
            setFetchedAccountProfileType('');
            return;
        }
        const existingAvatar = String(acctObj?.avatar_url || acctObj?.avatarUrl || acctObj?.logo_url || acctObj?.logoUrl || '').trim();
        const hasAvatar = existingAvatar && !existingAvatar.includes('default_avatar') && !existingAvatar.includes('default_business') && !existingAvatar.includes('default_logo');
        // For artist accounts ALWAYS fetch so profile_type is authoritative
        // (mirrors ArtistAdminConsole pattern). Business accounts can
        // short-circuit when the avatar is already populated.
        if (isBA && hasAvatar) {
            setFetchedAccountAvatar('');
            setFetchedAccountProfileType('');
            return;
        }
        let active = true;
        (async () => {
            try {
                let url = '';
                if (isBA) {
                    const slug = String(acctObj?.slug || acctObj?.handle || '').trim();
                    if (!slug || /^\d+$/.test(slug)) return;
                    url = `/api/business/${encodeURIComponent(slug)}`;
                } else if (isAA && aArtId) {
                    url = `/api/music/artists/${encodeURIComponent(String(aArtId))}`;
                }
                if (!url) return;
                const res = await secureFetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
                if (!res.ok || !active) return;
                const data = await res.json();
                const entity = data?.business || data?.artist || data || {};
                const av = String(entity?.avatar_url || entity?.avatarUrl || entity?.logo_url || entity?.logoUrl || '').trim();
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (!active) return;
                const okAv = av && !av.includes('default_avatar') && !av.includes('default_business') && !av.includes('default_logo');
                if (okAv) setFetchedAccountAvatar(av);
                if (isAA) setFetchedAccountProfileType(pt === 'artist' ? 'artist' : 'music');
                // Patch localStorage so Header + other consumers pick up the
                // right values. Overwrite unconditionally so stale cached
                // values get corrected.
                try {
                    const stored = JSON.parse(localStorage.getItem('ll:activeAccount') || '{}');
                    if (stored && typeof stored === 'object') {
                        let dirty = false;
                        if (okAv && stored.avatar_url !== av) {
                            stored.avatar_url = av;
                            dirty = true;
                        }
                        if (isAA) {
                            const normalized = pt === 'artist' ? 'artist' : 'music';
                            if (stored.profile_type !== normalized || stored.profileType !== normalized) {
                                stored.profile_type = normalized;
                                stored.profileType = normalized;
                                dirty = true;
                            }
                        }
                        if (dirty) localStorage.setItem('ll:activeAccount', JSON.stringify(stored));
                    }
                } catch { /* ignore */ }
            } catch { /* non-critical */ }
        })();
        return () => { active = false; };
    }, [isBA, isAA, aArtId, acctObj?.slug, acctObj?.handle, acctObj?.avatar_url, acctObj?.avatarUrl, acctObj?.logo_url, acctObj?.logoUrl]);

    const viewerAvatarUrl = (() => {
        if (isBA || isAA) {
            if (fetchedAccountAvatar) return fetchedAccountAvatar;
            const candidates = [
                acctObj?.avatar_url, acctObj?.avatarUrl, acctObj?.logo_url, acctObj?.logoUrl,
                acctObj?.image_url, acctObj?.imageUrl, acctObj?.photo_url, acctObj?.photoUrl,
                acctObj?.account_avatar_url,
            ];
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && s !== 'null' && s !== 'undefined' && !s.includes('default_avatar') && !s.includes('default_business') && !s.includes('default_logo')) return s;
            }
            return '';
        }
        return viewerPersonalAvatarUrl;
    })();
    const viewerAccountType = isBA ? 'business' : isAA ? 'artist' : 'personal';
    // Sub-type for artist viewers: 'music' (default) or 'artist' (visual
    // artist). Fetched value is authoritative (mirrors ArtistAdminConsole);
    // falls back to the context, then localStorage, then 'music'.
    const viewerProfileType = (() => {
        if (!isAA) return 'music';
        const fromFetched = String(fetchedAccountProfileType || '').toLowerCase();
        if (fromFetched === 'artist' || fromFetched === 'music') return fromFetched;
        const fromCtx = String(acctObj?.profile_type || acctObj?.profileType || '').toLowerCase();
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
    const viewerLabel = (isBA || isAA)
        ? (acctObj?.name || viewerPersonalLabel)
        : viewerPersonalLabel;

    /* ────────────────────────────────────────────────────────────────────────
       Slice 4e: Top-level comment composer
       ────────────────────────────────────────────────────────────────────────
       When `showComposer` is true (the default), RedditComments renders its
       own composer above the comments list. PostDetailModal (which has its
       own inline composer) passes showComposer={false} to suppress this.

       The code below is ported from PostDetailModal's PostPage composer
       (state block + mention effects + submitComment + onComposerKeyDown + JSX)
       with two differences:

       1. The URL chain uses resourceCtx.createUrls(postId) (set by Slice 2b)
          so news articles call /api/community/news/article/:id/comments
          instead of the post URLs. All other callsites that don't pass a
          resourceContext default to the community post URL chain.

       2. When a parent passes addCommentRef, we use theirs (so the parent
          can still inject comments from their own composer — PostDetailModal
          pattern). When showComposer=true AND no parent ref, we create our
          own internal ref that submitComment calls directly.

       3. We dispatch the 'll:communityPost:updated' CustomEvent only when
          the resource context is the default community-post one — skipping
          it for news_article because the post card event bus doesn't know
          about news cards.
       ──────────────────────────────────────────────────────────────────── */

    const [commentText, setCommentText] = useState('');
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentImageUrls, setCommentImageUrls] = useState([]);
    const [commentError, setCommentError] = useState('');
    const commentInputRef = useRef(null);

    const [commentMention, setCommentMention] = useState({
        open: false,
        query: '',
        results: [],
        start: -1,
        end: -1,
        anchorEl: null,
    });
    const [commentMentionLoading, setCommentMentionLoading] = useState(false);

    // Rate limiting — renamed to composer* so it can't clash with reply-composer
    // rate limit state that ThreadedCommentItem uses elsewhere in this file.
    const { checkLimit: checkComposerLimit, recordAction: recordComposer } =
        useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [composerRateLimitOpen, setComposerRateLimitOpen] = useState(false);
    const [composerRateLimitInfo, setComposerRateLimitInfo] =
        useState({ retryAfterSec: 10, reason: 'cooldown' });

    const [posting, setPosting] = useState(false);

    const closeCommentMention = useCallback(() => {
        setCommentMentionLoading(false);
        setCommentMention({
            open: false,
            query: '',
            results: [],
            start: -1,
            end: -1,
            anchorEl: null,
        });
    }, []);

    // Dismiss mention dropdown on scroll
    useEffect(() => {
        if (!commentMention.open) return undefined;
        const onScroll = () => closeCommentMention();
        window.addEventListener('scroll', onScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', onScroll, { capture: true });
    }, [commentMention.open, closeCommentMention]);

    const syncCommentMention = useCallback(
        (nextText) => {
            const el = commentInputRef.current;
            const caret = el?.selectionStart ?? nextText.length;
            const m = getMentionMatch(nextText, caret);

            if (!m) {
                if (commentMention.open) closeCommentMention();
                return;
            }

            const anchorEl = getMentionAnchorVirtualEl(el, m.end);

            setCommentMention((s) => {
                if (s.open && s.query === m.query && s.start === m.start && s.end === m.end) {
                    return { ...s, anchorEl };
                }
                return { open: true, query: m.query, results: [], start: m.start, end: m.end, anchorEl };
            });
        },
        [closeCommentMention, commentMention.open]
    );

    // Mention search — debounced
    useEffect(() => {
        if (!commentMention.open || !commentMention.query) return undefined;

        setCommentMentionLoading(true);
        const ctrl = new AbortController();

        const t = window.setTimeout(async () => {
            try {
                const res = await secureFetch(
                    `/api/community/users/search?q=${encodeURIComponent(commentMention.query)}`,
                    { credentials: 'include', signal: ctrl.signal, cache: 'no-store' }
                );

                if (!res.ok) {
                    setCommentMentionLoading(false);
                    return;
                }

                const data = await res.json().catch(() => []);
                setCommentMention((s) => {
                    if (!s.open || s.query !== commentMention.query) return s;
                    return { ...s, results: Array.isArray(data) ? data : [] };
                });
            } catch {
                // ignore — user may have closed the popper, etc.
            } finally {
                setCommentMentionLoading(false);
            }
        }, 180);

        return () => {
            window.clearTimeout(t);
            ctrl.abort();
        };
    }, [commentMention.open, commentMention.query]);

    // Internal ref used when showComposer is true AND parent didn't supply one.
    // Points to the same addToList callback that the list's own addCommentRef
    // effect (further below) populates.
    const internalAddCommentRef = useRef(null);

    async function submitComment() {
        if (!postId) return;
        const cleaned = commentText.trim().slice(0, COMMENT_MAX_CHARS);
        const hasImages = commentFiles.length > 0 || commentImageUrls.length > 0;
        if (!cleaned && !hasImages) return;

        // Client-side profanity check
        if (cleaned) {
            const profResult = checkProfanity(cleaned);
            if (!profResult.clean) {
                setCommentError('Your comment contains inappropriate language. Please revise and try again.');
                return;
            }
        }
        setCommentError('');

        // Rate limit
        const rlResult = checkComposerLimit();
        if (!rlResult.allowed) {
            setComposerRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setComposerRateLimitOpen(true);
            return;
        }

        setPosting(true);

        // Upload local image files to GCS now (deferred from selection time)
        let allImageUrls = [...commentImageUrls]; // starts with Tenor GIF URLs
        if (commentFiles.length > 0) {
            try {
                const uploadedUrls = await uploadFilesToGCS(commentFiles);
                if (uploadedUrls.length === 0) {
                    setCommentError('Failed to upload images. Please try again.');
                    setPosting(false);
                    return;
                }
                allImageUrls = [...uploadedUrls, ...allImageUrls];
            } catch {
                setCommentError('Failed to upload images. Please check your connection and try again.');
                setPosting(false);
                return;
            }
        }

        // Parse active account with proper numeric ID resolution.
        //
        // Slice 4h: the business branch is now as defensive as the artist
        // branch. Previously it only read fa2Raw.id directly and assumed
        // it was numeric — if a business account in localStorage stored
        // its id as "business:42" or had the business id in a separate
        // .businessId / .business_id field (mirroring the artistId pattern),
        // fa2NumericId came back null, fa2IsBiz was falsy, and the payload
        // had no business_id → backend saved the comment as personal.
        //
        // Now we check multiple candidate fields and handle the prefixed
        // string shape, then finally fall back to the React-context
        // aBizId (already destructured from useActiveAccount in this
        // component's scope) so we have a guaranteed-live value.
        const fa2Raw = (() => { try { const r = localStorage.getItem('ll:activeAccount'); return r ? JSON.parse(r) : null; } catch { return null; } })();
        const ft2 = String(fa2Raw?.type || '').toLowerCase();
        let fa2NumericId = null;
        if (ft2 === 'business') {
            // Priority: explicit businessId/business_id field → prefixed id
            // string → plain .id → React-context aBizId.
            const rawBizId = fa2Raw?.businessId ?? fa2Raw?.business_id ?? null;
            if (rawBizId != null) {
                fa2NumericId = Number(rawBizId) || null;
            } else {
                const idStr = String(fa2Raw?.id || '');
                if (idStr.startsWith('business:')) {
                    const n = Number(idStr.replace('business:', ''));
                    fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
                } else {
                    const n = Number(fa2Raw?.id);
                    fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
                }
            }
            // Belt-and-suspenders: if localStorage resolution failed but
            // the React context knows we're on a business account, use
            // that. This ensures the comment attributes correctly even
            // if localStorage is in an unexpected shape.
            if (!fa2NumericId && isBA && aBizId) {
                const n = Number(aBizId);
                fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
            }
        } else if (ft2 === 'artist') {
            const rawArtId = fa2Raw?.artistId ?? fa2Raw?.artist_id ?? null;
            if (rawArtId != null) {
                fa2NumericId = Number(rawArtId) || null;
            } else {
                const idStr = String(fa2Raw?.id || '');
                if (idStr.startsWith('artist:')) {
                    const n = Number(idStr.replace('artist:', ''));
                    fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
                } else {
                    const n = Number(fa2Raw?.id);
                    fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
                }
            }
            // Slice 4h: same belt-and-suspenders for artist, in case the
            // same edge case applies here too.
            if (!fa2NumericId && isAA && aArtId) {
                const n = Number(aArtId);
                fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
            }
        }
        const fa2IsBiz = ft2 === 'business' && fa2NumericId;
        const fa2IsArt = ft2 === 'artist' && fa2NumericId;
        const freshHandle2 = fa2IsBiz
            ? (fa2Raw.slug || fa2Raw.handle || '')
            : fa2IsArt
                ? (fa2Raw.slug || fa2Raw.handle || '')
                : '';
        const payload = {
            text: cleaned,
            content: cleaned,
            body: cleaned,
            comment: cleaned,
            ...(fa2IsBiz ? {
                business_id: fa2NumericId,
                account_type: 'business',
                account_id: fa2NumericId,
                account_handle: fa2Raw.slug || fa2Raw.handle || '',
                account_name: fa2Raw.name || '',
                account_avatar_url: fa2Raw.avatar_url || fa2Raw.logo_url || '',
            } : {}),
            ...(fa2IsArt ? {
                artist_id: fa2NumericId,
                account_type: 'artist',
                account_id: fa2NumericId,
                account_handle: fa2Raw.slug || fa2Raw.handle || '',
                account_name: fa2Raw.name || '',
                account_avatar_url: fa2Raw.avatar_url || '',
            } : {}),
        };

        // URL chain: use resourceContext if available (news → news-specific URLs),
        // else fall back to the original post URL chain.
        const tryPosts = resourceCtx
            ? resourceCtx.createUrls(postId).map((url) => ({ url, method: 'POST' }))
            : [
                { url: `/api/community/${encodeURIComponent(postId)}/comments`, method: 'POST' },
                { url: `/api/community/posts/${encodeURIComponent(postId)}/comments`, method: 'POST' },
                { url: `/api/posts/${encodeURIComponent(postId)}/comments`, method: 'POST' },
                { url: `/api/comments?postId=${encodeURIComponent(postId)}`, method: 'POST' },
            ];
        const acctHeaders2 = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        let serverComment = null;
        let ok = false;

        for (const t of tryPosts) {
            try {
                const jsonPayload = {
                    ...payload,
                    ...(allImageUrls.length > 0 ? { image_urls: allImageUrls } : {}),
                };
                const fetchOpts = {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...acctHeaders2 },
                    body: JSON.stringify(jsonPayload),
                };
                const res = await secureFetch(t.url, fetchOpts);
                if (res.ok) {
                    ok = true;
                    try { serverComment = await res.json(); } catch { /* no body */ }
                    break;
                }
                // Moderation rejections (400)
                if (res.status === 400) {
                    try {
                        const errData = await res.json();
                        if (errData?.message) {
                            setCommentError(errData.message);
                            setPosting(false);
                            return;
                        }
                    } catch { /* ignore parse error */ }
                }
            } catch {
                /* try next URL */
            }
        }
        setPosting(false);
        if (ok) {
            recordComposer();
            setCommentText('');
            setCommentFiles([]);
            setCommentImageUrls([]);

            // Notify parent of the new count so it can update header counters
            if (typeof onCommentCountChange === 'function') {
                try { onCommentCountChange(+1); } catch { /* ignore */ }
            }

            // Only dispatch the community-post update event for community posts.
            // News articles aren't observed by the post card event bus, and
            // dispatching would confuse unrelated listeners.
            const isCommunityPostContext = !resourceCtx
                || resourceCtx === DEFAULT_COMMUNITY_POST_RESOURCE;
            if (isCommunityPostContext) {
                try {
                    const nextCount = (() => {
                        try {
                            const current = Number(
                                post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0
                            );
                            return Number.isFinite(current) ? current + 1 : 1;
                        } catch {
                            return 1;
                        }
                    })();

                    window.dispatchEvent(
                        new CustomEvent('ll:communityPost:updated', {
                            detail: {
                                postId,
                                commentCountOnly: true,
                                post: {
                                    id: postId,
                                    commentsCount: nextCount,
                                    comments_count: nextCount,
                                    comment_count: nextCount,
                                },
                            },
                        })
                    );
                } catch {
                    // ignore
                }
            }

            // Build optimistic comment from server response (or synthetic fallback)
            const created = serverComment?.comment || serverComment;
            const resolvedHandle2 = freshHandle2
                || acctObj?.slug || acctObj?.handle
                || (created?.account_handle || '')
                || (created?.business_slug || '')
                || (created?.artist_handle || '')
                || '';

            const optimistic = created && created.id
                ? {
                    ...created,
                    ...(isBA && aBizId ? {
                        business_id: aBizId,
                        business_name: created.business_name || acctObj?.name || '',
                        business_avatar_url: created.business_avatar_url || acctObj?.avatar_url || acctObj?.logo_url || '',
                        account_type: 'business',
                        account_name: created.account_name || acctObj?.name || '',
                        account_avatar_url: created.account_avatar_url || acctObj?.avatar_url || acctObj?.logo_url || '',
                        ...(resolvedHandle2 ? {
                            business_slug: resolvedHandle2,
                            account_handle: resolvedHandle2,
                            handle: resolvedHandle2,
                        } : {
                            handle: created.account_handle || created.business_slug || '',
                        }),
                    } : {}),
                    ...(isAA && aArtId ? {
                        artist_id: aArtId,
                        artist_name: created.artist_name || acctObj?.name || '',
                        artist_avatar_url: created.artist_avatar_url || acctObj?.avatar_url || '',
                        account_type: 'artist',
                        account_name: created.account_name || acctObj?.name || '',
                        account_avatar_url: created.account_avatar_url || acctObj?.avatar_url || '',
                        ...(resolvedHandle2 ? {
                            artist_handle: resolvedHandle2,
                            account_handle: resolvedHandle2,
                            handle: resolvedHandle2,
                        } : {
                            handle: created.account_handle || created.artist_handle || '',
                        }),
                    } : {}),
                }
                : {
                    id: `temp_comment_${Date.now()}`,
                    text: cleaned,
                    content: cleaned,
                    user_id: viewer?.id,
                    public_id: viewer?.public_id,
                    first_name: viewer?.first_name || '',
                    last_name: viewer?.last_name || '',
                    handle: resolvedHandle2 || viewer?.handle || '',
                    avatar_url: viewer?.avatar_url || viewer?.profile_picture || '',
                    created_at: new Date().toISOString(),
                    likes: 0,
                    viewer_liked: false,
                    reply_count: 0,
                    replies: [],
                    images: allImageUrls.length > 0 ? [...allImageUrls] : [],
                    ...(isBA && aBizId ? {
                        business_id: aBizId,
                        business_name: acctObj?.name || '',
                        ...(resolvedHandle2 ? { business_slug: resolvedHandle2 } : {}),
                        business_avatar_url: acctObj?.avatar_url || acctObj?.logo_url || '',
                        account_type: 'business',
                        account_name: acctObj?.name || '',
                        ...(resolvedHandle2 ? { account_handle: resolvedHandle2 } : {}),
                        account_avatar_url: acctObj?.avatar_url || acctObj?.logo_url || '',
                    } : {}),
                    ...(isAA && aArtId ? {
                        artist_id: aArtId,
                        artist_name: acctObj?.name || '',
                        ...(resolvedHandle2 ? { artist_handle: resolvedHandle2 } : {}),
                        artist_avatar_url: acctObj?.avatar_url || '',
                        account_type: 'artist',
                        account_name: acctObj?.name || '',
                        ...(resolvedHandle2 ? { account_handle: resolvedHandle2 } : {}),
                        account_avatar_url: acctObj?.avatar_url || '',
                    } : {}),
                };

            // Inject into comment list without reloading.
            // Prefer the parent-supplied addCommentRef (for PostDetailModal
            // compatibility); fall back to our internal ref.
            const targetRef = (addCommentRef && typeof addCommentRef.current === 'function')
                ? addCommentRef
                : internalAddCommentRef;

            if (typeof targetRef.current === 'function') {
                targetRef.current(optimistic);
            }

            const anchor = document.getElementById('comments-anchor');
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Unauthenticated → prompt login
            openLogin();
        }
    }

    const onComposerKeyDown = (e) => {
        if (commentMention.open && e.key === 'Escape') {
            e.preventDefault();
            closeCommentMention();
            return;
        }
        // Enter = newline. Ctrl/Cmd + Enter = submit.
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submitComment();
        }
    };

    // like/flag/reply helpers
    const likeComment = async (commentId, currentLiked, setLiked, setLikes) => {
        if (!viewer) return openLogin();

        // Optimistically update local and threads state
        const newLiked = !currentLiked;
        const likeDelta = newLiked ? 1 : -1;
        const optimisticUpdater = (c) => ({
            ...c,
            viewer_liked: newLiked,
            likes: Math.max(0, (c.likes || 0) + likeDelta),
            ...(isViewerPostAuthor ? { liked_by_author: newLiked } : {}),
        });
        setLiked(newLiked);
        setLikes((n) => Math.max(0, n + likeDelta));
        setThreads((prev) => updateCommentInTree(prev, commentId, optimisticUpdater));
        // Update display in-place — do NOT re-sort so the comment doesn't jump
        setDisplayThreads((prev) => updateCommentInTree(prev, commentId, optimisticUpdater));

        const paths = [
            `/api/community/comments/${encodeURIComponent(commentId)}/like`,
        ];
        const freshAcct = (() => { try { const r = localStorage.getItem('ll:activeAccount'); return r ? JSON.parse(r) : null; } catch { return null; } })();
        const ft = String(freshAcct?.type || '').toLowerCase();
        const likeBody = {
            ...(ft === 'business' && freshAcct?.id ? { business_id: freshAcct.id } : {}),
            ...(ft === 'artist' && freshAcct?.id ? { artist_id: freshAcct.id } : {}),
        };
        const hasLikeBody = Object.keys(likeBody).length > 0;
        for (const url of paths) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    ...(hasLikeBody ? {
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(likeBody),
                    } : {}),
                });
                if (res.ok) {
                    const data = await res.json();
                    // Update with actual server values
                    const serverUpdater = (c) => ({
                        ...c,
                        viewer_liked: Boolean(data.liked),
                        likes: Number(data.likes || 0),
                        ...(data.liked_by_author !== undefined ? { liked_by_author: Boolean(data.liked_by_author) } : isViewerPostAuthor ? { liked_by_author: Boolean(data.liked) } : {}),
                    });
                    setLiked(Boolean(data.liked));
                    setLikes(Number(data.likes || 0));
                    setThreads((prev) => updateCommentInTree(prev, commentId, serverUpdater));
                    setDisplayThreads((prev) => updateCommentInTree(prev, commentId, serverUpdater));
                    return;
                }
            } catch {
                /* try next */
            }
        }
        // Revert on failure (already optimistically updated)
        const revertUpdater = (c) => ({
            ...c,
            viewer_liked: currentLiked,
            likes: Math.max(0, (c.likes || 0) - likeDelta),
            ...(isViewerPostAuthor ? { liked_by_author: currentLiked } : {}),
        });
        setLiked(currentLiked);
        setLikes((n) => Math.max(0, n - likeDelta));
        setThreads((prev) => updateCommentInTree(prev, commentId, revertUpdater));
        setDisplayThreads((prev) => updateCommentInTree(prev, commentId, revertUpdater));
    };

    const submitReply = async (parentId, text, onDone, { files: replyFileList = [], imageUrls: replyUrlList = [] } = {}) => {
        if (!viewer) return openLogin();

        // Rate limit check
        const rlResult = checkReplyLimit();
        if (!rlResult.allowed) {
            setReplyRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setReplyRateLimitOpen(true);
            return;
        }

        const cleaned = text.trim().slice(0, COMMENT_MAX_CHARS);
        const hasImages = replyFileList.length > 0 || replyUrlList.length > 0;
        if (!cleaned && !hasImages) return;

        // Read active account from localStorage to avoid stale closure values
        const fa = (() => { try { const r = localStorage.getItem('ll:activeAccount'); return r ? JSON.parse(r) : null; } catch { return null; } })();
        const fType = String(fa?.type || '').toLowerCase();
        const fIsBiz = fType === 'business' && fa?.id;
        const fIsArt = fType === 'artist' && fa?.id;

        const viewerFirstName = (fIsBiz || fIsArt)
            ? (fa?.name || acctObj?.name || '').split(' ')[0] || viewer?.first_name || ''
            : (viewer?.first_name || viewer?.firstName || '');
        const viewerLastName = (fIsBiz || fIsArt)
            ? (fa?.name || acctObj?.name || '').split(' ').slice(1).join(' ')
            : (viewer?.last_name || viewer?.lastName || '');
        const viewerAvatar = viewerAvatarUrl;
        const viewerHandle = fIsBiz
            ? (fa.slug || fa.handle || acctObj?.slug || acctObj?.handle || '')
            : fIsArt
                ? (fa.handle || acctObj?.handle || '')
                : (viewer?.handle || viewer?.username || '');
        const viewerId = viewer?.id || viewer?.user_id || null;

        // Create optimistic reply
        const optimisticReply = {
            id: `temp_reply_${Date.now()}`,
            parentId: parentId,
            parent_id: parentId,
            user_id: viewerId,
            public_id: viewer?.public_id,
            text: cleaned,
            content: cleaned,
            first_name: viewerFirstName,
            last_name: viewerLastName,
            handle: viewerHandle,
            avatar: viewerAvatar,
            avatar_url: viewerAvatar,
            created_at: new Date().toISOString(),
            likes: 0,
            viewer_liked: false,
            viewer_flagged: false,
            reply_count: 0,
            is_removed: false,
            is_pinned: false,
            replies: [],
            images: replyUrlList.length > 0 ? [...replyUrlList] : [],
            ...(fIsBiz ? {
                business_id: fa.id,
                business_name: fa.name || acctObj?.name || '',
                business_slug: fa.slug || fa.handle || acctObj?.slug || acctObj?.handle || '',
                business_avatar_url: fa.avatar_url || fa.logo_url || acctObj?.avatar_url || acctObj?.logo_url || '',
                account_type: 'business',
                account_name: fa.name || acctObj?.name || '',
                account_handle: fa.slug || fa.handle || acctObj?.slug || acctObj?.handle || '',
                account_avatar_url: fa.avatar_url || fa.logo_url || acctObj?.avatar_url || acctObj?.logo_url || '',
            } : {}),
            ...(fIsArt ? {
                artist_id: fa.id,
                artist_name: fa.name || acctObj?.name || '',
                artist_handle: fa.handle || acctObj?.handle || '',
                artist_avatar_url: fa.avatar_url || acctObj?.avatar_url || '',
                account_type: 'artist',
                account_name: fa.name || acctObj?.name || '',
                account_handle: fa.handle || acctObj?.handle || '',
                account_avatar_url: fa.avatar_url || acctObj?.avatar_url || '',
            } : {}),
        };

        // Optimistically add the reply
        setThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        setDisplayThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        onDone?.();
        onCommentCountChange?.(1);
        recordReply();

        const payload = {
            text: cleaned,
            content: cleaned,
            parent_id: parentId,
            ...(fIsBiz ? {
                business_id: fa.id,
                account_type: 'business',
                account_id: fa.id,
                account_handle: fa.slug || fa.handle || '',
                account_name: fa.name || '',
                account_avatar_url: fa.avatar_url || fa.logo_url || '',
            } : {}),
            ...(fIsArt ? {
                artist_id: fa.id,
                account_type: 'artist',
                account_id: fa.id,
                account_handle: fa.handle || '',
                account_name: fa.name || '',
                account_avatar_url: fa.avatar_url || '',
            } : {}),
        };
        const urls = resourceCtx.createUrls(postId);

        // Build account headers for backend identity detection
        const replyAcctHeaders2 = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        const hasFileUploads = replyFileList.length > 0;

        for (const url of urls) {
            try {
                let fetchOpts;
                if (hasFileUploads) {
                    const fd = new FormData();
                    if (cleaned) { fd.append('content', cleaned); fd.append('text', cleaned); }
                    fd.append('parent_id', String(parentId));
                    if (fIsBiz) fd.append('business_id', String(fa.id));
                    if (fIsArt) fd.append('artist_id', String(fa.id));
                    for (const file of replyFileList) fd.append('images', file);
                    if (replyUrlList.length > 0) {
                        fd.append('image_urls', JSON.stringify(replyUrlList));
                    }
                    fetchOpts = {
                        method: 'POST',
                        credentials: 'include',
                        headers: { ...replyAcctHeaders2 },
                        body: fd,
                    };
                } else {
                    const jsonPayload = {
                        ...payload,
                        ...(replyUrlList.length > 0 ? { image_urls: replyUrlList } : {}),
                    };
                    fetchOpts = {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json', ...replyAcctHeaders2 },
                        body: JSON.stringify(jsonPayload),
                    };
                }
                const res = await secureFetch(url, fetchOpts);
                if (res.ok) {
                    const newReply = await res.json();
                    // Replace optimistic reply with server response
                    setThreads((prev) => {
                        const withoutOptimistic = removeCommentFromTree(prev, optimisticReply.id);
                        return addReplyToTree(withoutOptimistic, parentId, normalizeComments([newReply])[0] || newReply);
                    });
                    setDisplayThreads((prev) => {
                        const withoutOptimistic = removeCommentFromTree(prev, optimisticReply.id);
                        return addReplyToTree(withoutOptimistic, parentId, normalizeComments([newReply])[0] || newReply);
                    });
                    return;
                }
            } catch {
                /* try next */
            }
        }

        // Revert on failure
        setThreads((prev) => removeCommentFromTree(prev, optimisticReply.id));
        setDisplayThreads((prev) => removeCommentFromTree(prev, optimisticReply.id));
        onCommentCountChange?.(-1);
    };

    const [flagState, setFlagState] = useState({ open: false, commentId: null });


    async function deleteComment(commentId) {
        if (!viewer) return openLogin();
        const cid = Number(commentId);
        if (!cid) return;

        // Store previous state for rollback
        const previousThreads = threads;
        const previousDisplayThreads = displayThreads;

        // Optimistically remove the comment
        setThreads((prev) => removeCommentFromTree(prev, cid));
        setDisplayThreads((prev) => removeCommentFromTree(prev, cid));
        onCommentCountChange?.(-1);

        const tryUrls = [
            `/api/community/comments/${encodeURIComponent(cid)}`,
            `/api/comments/${encodeURIComponent(cid)}`,
        ];

        let success = false;
        for (const url of tryUrls) {
            try {
                const res = await secureFetch(url, { method: 'DELETE', credentials: 'include' });
                if (res.ok) {
                    success = true;
                    // Notify profile engagement tabs so deleted comments are removed from the Comments tab
                    try {
                        window.dispatchEvent(new CustomEvent('ll:comment:deleted', { detail: { commentId: cid, postId: Number(postId) } }));
                    } catch { /* ignore */ }
                    return;
                }
            } catch {
                /* try next */
            }
        }

        // Revert on failure
        if (!success) {
            setThreads(previousThreads);
            setDisplayThreads(previousDisplayThreads);
            onCommentCountChange?.(1);
        }
    }

    const openFlag = (commentId) => {
        if (!viewer) return openLogin();
        setFlagState({ open: true, commentId });
    };
    const closeFlag = () => setFlagState({ open: false, commentId: null });

    const submitFlag = async ({ reason, details }) => {
        const commentId = flagState.commentId;
        if (!commentId) return closeFlag();

        // Optimistically set viewer_flagged
        setThreads((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: true })));
        setDisplayThreads((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: true })));

        const urls = [
            `/api/community/comments/${encodeURIComponent(commentId)}/flag`,
            `/api/comments/${encodeURIComponent(commentId)}/flag`,
        ];
        let success = false;
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    success = true;
                    break;
                }
            } catch {
                /* try next */
            }
        }

        // Revert on failure
        if (!success) {
            setThreads((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: false })));
            setDisplayThreads((prev) => updateCommentInTree(prev, commentId, (c) => ({ ...c, viewer_flagged: false })));
            closeFlag();
        }
        // Don't close on success — FlagCommentDialog shows confirmation; user clicks Done to close.
    };


    const scrollToComment = useCallback((commentId) => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCommentId(String(commentId));
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 2200);
        }
    }, []);

    // Highlight a specific comment when opened from engagement tab.
    // The comment's thread is boosted to the top by sortTopLevelThreads (focusCommentId),
    // so no scrolling is needed. The highlight persists until the user has actually
    // seen the comment (IntersectionObserver) and then fades after a short delay.
    const highlightAppliedRef = useRef(null);
    const highlightObserverRef = useRef(null);

    // Clear tracking when post changes
    useEffect(() => {
        highlightAppliedRef.current = null;
        if (highlightObserverRef.current) { highlightObserverRef.current.disconnect(); highlightObserverRef.current = null; }
    }, [postId]);

    useEffect(() => {
        const targetId = scrollToCommentIdProp ?? highlightCommentIdProp;
        if (!targetId || loading || !displayThreads.length) return;

        const targetKey = `${postId}:${targetId}`;
        if (highlightAppliedRef.current === targetKey) return;
        highlightAppliedRef.current = targetKey;

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

        // Set highlight immediately — it will persist until the comment is visible
        setHighlightedCommentId(String(targetId));

        // Watch for the comment element to appear in the viewport, then fade the
        // highlight after a short dwell so the user has time to notice it.
        const waitForEl = () => {
            const el = document.getElementById(`comment-${targetId}`);
            if (el) {
                if (highlightObserverRef.current) highlightObserverRef.current.disconnect();
                const observer = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            observer.disconnect();
                            highlightObserverRef.current = null;
                            clearTimeout(highlightTimerRef.current);
                            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 1800);
                        }
                    },
                    { threshold: 0.3 }
                );
                observer.observe(el);
                highlightObserverRef.current = observer;
            } else {
                // Element not in DOM yet (reply thread may still be expanding)
                setTimeout(waitForEl, 200);
            }
        };
        // Small delay to let React render the expanded thread
        setTimeout(waitForEl, 100);

        return () => {
            if (highlightObserverRef.current) { highlightObserverRef.current.disconnect(); highlightObserverRef.current = null; }
        };
    }, [postId, scrollToCommentIdProp, highlightCommentIdProp, loading, displayThreads]);

    // Re-sort display order only when sort mode changes (NOT on like/flag updates)
    useEffect(() => {
        setDisplayThreads((prev) => {
            if (!prev.length) return prev;
            return sortTopLevelThreads(prev, commentSort);
        });
        setVisibleCount(initialPageSize);
    }, [commentSort, initialPageSize]);

    const visibleThreads = displayThreads.slice(0, visibleCount);
    const canLoadMore = displayThreads.length > visibleThreads.length;

    // Group consecutive blocked top-level comments into collapsed rows
    const groupedThreads = useMemo(
        () => groupBlockedTopLevel(visibleThreads, blockedUserIds, blockedHandles, blockedBusinessIds, blockedArtistIds),
        [visibleThreads, blockedUserIds, blockedHandles, blockedBusinessIds, blockedArtistIds]
    );

    // Render a single ThreadedCommentItem with standard props
    const renderSingleComment = (t, { forceShowBlocked = false } = {}) => (
        <ThreadedCommentItem
            key={t.id}
            node={t}
            depth={0}
            expanded={expanded}
            setExpanded={setExpanded}
            viewerAvatarUrl={viewerAvatarUrl}
            viewerLabel={viewerLabel}
            postAuthor={postAuthor}
            onOpenUserCard={onOpenUserCard}
            likeComment={likeComment}
            submitReply={submitReply}
            openFlag={openFlag}
            viewerId={viewer?.id}
            onDelete={requestCommentDelete}
            onTogglePinConfirm={requestTogglePinConfirm}
            blockedUserIds={blockedUserIds}
            blockedBusinessIds={blockedBusinessIds}
            blockedArtistIds={blockedArtistIds}
            blockedHandles={blockedHandles}
            onShareComment={handleShareComment}
            onScrollToComment={scrollToComment}
            highlightedCommentId={highlightedCommentId}
            forceShowBlocked={forceShowBlocked}
            newCommentIds={newCommentIds}
            post={post}
            onCopyLinkToast={onCopyLinkToast}
            groupCommentGated={groupCommentGated}
        />
    );

    // Only widen when reply nesting gets "too deep" so a horizontal scrollbar appears
    const INDENT_PX = 24;
    const SAFE_DEPTH_BEFORE_SCROLL = 6; // vertical until depth exceeds this
    const computeMaxOpenDepth = (nodes, depth = 0) => {
        let max = depth;
        for (const n of nodes) {
            const dHere = expanded[n.id] && n.replies?.length ? computeMaxOpenDepth(n.replies, depth + 1) : depth;
            if (dHere > max) max = dHere;
        }
        return max;
    };
    const maxOpenDepth = computeMaxOpenDepth(visibleThreads, 0);
    const extraWidthPx = Math.max(0, (maxOpenDepth - SAFE_DEPTH_BEFORE_SCROLL) * INDENT_PX);

    return (
        <Box id="comments-anchor" sx={{ mt: 2 }}>
            {/* Slice 4e: Top-level comment composer.
                Rendered when showComposer=true (the default). PostDetailModal
                passes showComposer={false} to preserve its existing inline
                composer. If the viewer is in a gated group and hasn't joined,
                we show a Join CTA instead of the composer. */}
            {showComposer && groupCommentGated ? (
                <Box
                    sx={(t) => ({
                        mt: 0,
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        border: `1px solid ${t.palette.divider}`,
                        bgcolor: alphaColor(t.palette.primary.main, 0.03),
                        textAlign: 'center',
                    })}
                >
                    <Typography sx={{ fontWeight: 900, mb: 0.5, color: 'text.primary' }}>
                        Join this group to comment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        You must be a member of this group to leave comments on posts.
                    </Typography>
                </Box>
            ) : showComposer && viewer ? (
                <Box
                    id="comments-composer"
                    sx={{ mb: 2, display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'nowrap' }}
                >
                    <ComposerAvatar
                        url={viewerAvatarUrl}
                        accountType={viewerAccountType}
                        profileType={isAA ? viewerProfileType : undefined}
                        label={viewerLabel || 'You'}
                        size={{ xs: 36, sm: 44 }}
                        iconSize={22}
                    />

                    <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={1}
                            maxRows={6}
                            value={commentText}
                            inputRef={commentInputRef}
                            onChange={(e) => {
                                const next = e.target.value;
                                setCommentText(next);
                                if (commentError) setCommentError('');
                                syncCommentMention(next);
                            }}
                            onKeyDown={onComposerKeyDown}
                            label={`Leave a comment as ${viewerLabel || 'You'}`}
                            placeholder="Write your comment…"
                            variant="outlined"
                            error={Boolean(commentError)}
                            helperText={commentError}
                            inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                            sx={{
                                '& .MuiInputLabel-root': {
                                    fontSize: { xs: 12, sm: 14 },
                                },
                                '& .MuiInputLabel-shrink': {
                                    fontSize: { xs: 13, sm: 14 },
                                },
                            }}
                            InputProps={{
                                endAdornment: (commentText.trim() || commentFiles.length > 0 || commentImageUrls.length > 0) ? (
                                    <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.25 }}>
                                        <IconButton
                                            aria-label="Send comment"
                                            onClick={submitComment}
                                            disabled={posting || (!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0)}
                                            sx={(t) => ({
                                                ml: 0.5,
                                                bgcolor: 'primary.main',
                                                color: 'common.white',
                                                width: { xs: 32, sm: 38 },
                                                height: { xs: 32, sm: 38 },
                                                borderRadius: '50%',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    bgcolor: 'primary.dark',
                                                    boxShadow: `0 4px 12px ${alphaColor(t.palette.primary.main, 0.25)}`,
                                                },
                                                '&.Mui-disabled': {
                                                    bgcolor: 'action.disabledBackground',
                                                    color: 'action.disabled',
                                                    boxShadow: 'none',
                                                    opacity: 1,
                                                },
                                            })}
                                        >
                                            {posting ? (
                                                <CircularProgress size={16} sx={{ color: 'common.white' }} />
                                            ) : (
                                                <ArrowUpwardRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ) : undefined,
                            }}
                        />

                        {/* Image + GIF attachment toolbar & previews */}
                        <CommentImageAttachments
                            files={commentFiles}
                            urls={commentImageUrls}
                            onFilesChange={(newFiles) => {
                                if (commentError) setCommentError('');
                                setCommentFiles(newFiles);
                            }}
                            onUrlsChange={(u) => { setCommentImageUrls(u); if (commentError) setCommentError(''); }}
                            maxImages={4}
                            disabled={posting}
                        />

                        {/* Mention typeahead popper */}
                        <Popper
                            open={Boolean(commentMention.open)}
                            anchorEl={commentMention.anchorEl || commentInputRef.current}
                            placement="bottom-start"
                            disablePortal={false}
                            sx={{ zIndex: 2000 }}
                        >
                            <ClickAwayListener onClickAway={closeCommentMention}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        mt: 0.75,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        maxHeight: 280,
                                        width: { xs: '100%', sm: 460 },
                                        boxShadow: (t) => t.custom.shadows.lg,
                                    }}
                                >
                                    <List dense disablePadding>
                                        {commentMentionLoading ? (
                                            <ListItem sx={{ py: 1 }}>
                                                <ListItemText primary="Searching…" primaryTypographyProps={{ fontWeight: 800 }} />
                                            </ListItem>
                                        ) : null}

                                        {!commentMentionLoading &&
                                        (!commentMention.results || commentMention.results.length === 0) ? (
                                            <ListItem sx={{ py: 1 }}>
                                                <ListItemText primary="No results found" primaryTypographyProps={{ fontWeight: 800 }} />
                                            </ListItem>
                                        ) : null}

                                        {!commentMentionLoading
                                            ? (commentMention.results || []).map((u) => {
                                                const handle = coerceHandle(u);
                                                const label = coerceName(u);
                                                const avatar = u?.avatar_url || u?.profile_picture || '';
                                                const accountType = u?.account_type || 'user';
                                                // Artist sub-type for the default fallback icon + badge.
                                                const mentionProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
                                                const isVisualArtistMention = accountType === 'artist' && mentionProfileType === 'artist';
                                                return (
                                                    <ListItemButton
                                                        key={String(u?.id || handle || label) + '_' + accountType}
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            const h = handle;
                                                            if (!h) return;

                                                            const el = commentInputRef.current;
                                                            const startAt = Number.isFinite(Number(commentMention.start)) ? commentMention.start : -1;
                                                            const endAt = Number.isFinite(Number(commentMention.end)) ? commentMention.end : commentText.length;
                                                            if (startAt < 0) return;

                                                            const before = commentText.slice(0, startAt);
                                                            const after = commentText.slice(endAt);
                                                            const insertion = `@${h} `;
                                                            const next = `${before}${insertion}${after}`;

                                                            setCommentText(next);
                                                            closeCommentMention();

                                                            requestAnimationFrame(() => {
                                                                try {
                                                                    el?.focus();
                                                                    const pos = before.length + insertion.length;
                                                                    el?.setSelectionRange(pos, pos);
                                                                } catch {
                                                                    // ignore
                                                                }
                                                            });
                                                        }}
                                                        sx={{ py: 1, px: 1.5 }}
                                                    >
                                                        <ListItemAvatar sx={{ minWidth: 44 }}>
                                                            <Avatar
                                                                src={avatar || undefined}
                                                                sx={{
                                                                    width: 32,
                                                                    height: 32,
                                                                    ...((!avatar && (accountType === 'business' || accountType === 'artist'))
                                                                        ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' }
                                                                        : (!avatar ? DEFAULT_AVATAR_SX : {})),
                                                                }}
                                                            >
                                                                {!avatar
                                                                    ? (accountType === 'business'
                                                                        ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                                                        : accountType === 'artist'
                                                                            ? (isVisualArtistMention
                                                                                ? <PaletteRoundedIcon sx={{ fontSize: 18 }} />
                                                                                : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />)
                                                                            : <PersonRoundedIcon fontSize="small" />)
                                                                    : null}
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            primary={
                                                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                                                    {label}
                                                                    <MentionAccountBadge accountType={accountType} profileType={mentionProfileType} />
                                                                </Box>
                                                            }
                                                            secondary={handle ? `@${handle}` : ''}
                                                            primaryTypographyProps={{ fontWeight: 800, noWrap: true }}
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
                    </Box>
                </Box>
            ) : showComposer ? (
                // Unauthenticated → prompt login
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    You need to{' '}
                    <Link component="button" type="button" onClick={openLogin} underline="hover">
                        log in
                    </Link>{' '}
                    to comment.
                </Typography>
            ) : null}

            {/* Rate limit dialog for the composer */}
            {showComposer ? (
                <RateLimitDialog
                    open={composerRateLimitOpen}
                    onClose={() => setComposerRateLimitOpen(false)}
                    retryAfterSec={composerRateLimitInfo.retryAfterSec}
                    reason={composerRateLimitInfo.reason}
                    sx={{ zIndex: 100001 }}
                />
            ) : null}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={(t) => t.custom.postDetail.commentsHeading}>
                    Comments
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

            {/* Vertical list by default; only shows horizontal scrollbar when extra width is actually needed */}
            <Box sx={{ overflowX: 'auto', overflowY: 'hidden', pb: 1 }}>
                <Box sx={{ minWidth: extraWidthPx ? `calc(100% + ${extraWidthPx}px)` : '100%' }}>
                    {loading ? (
                        <PulsingDots size={8} gap={1} sx={{ py: 4 }} />
                    ) : visibleThreads.length ? (
                        <>
                            {groupedThreads.map((group) =>
                                group.type === 'blocked-group' ? (
                                    <BlockedCommentsGroup
                                        key={`blocked-group-${group.nodes[0].id}`}
                                        nodes={group.nodes}
                                        renderComment={renderSingleComment}
                                    />
                                ) : (
                                    renderSingleComment(group.node)
                                )
                            )}
                            {canLoadMore && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                    <Link
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        onClick={() =>
                                            setVisibleCount((c) =>
                                                Math.min(c + initialPageSize, displayThreads.length)
                                            )
                                        }
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Load 50 more comments
                                    </Link>
                                </Box>
                            )}
                            {scrolled && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<ArrowUpwardRoundedIcon sx={{ color: 'common.white' }} />}
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Back to Top
                                    </Button>
                                </Box>
                            )}
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <ChatBubbleOutlineRoundedIcon sx={(t) => t.custom.postDetail.noCommentsIcon} />
                            <Typography sx={(t) => t.custom.postDetail.noCommentsText}>
                                No comments yet. Be the first!
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>


            <Dialog
                disableScrollLock
                open={!!commentDeleteConfirm.open}
                onClose={(e, reason) => {
                    if (reason === 'backdropClick') return;
                    closeCommentDeleteConfirm();
                }}
                disableEscapeKeyDown
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ pr: 6 }}>
                    Confirm delete
                    <IconButton
                        aria-label="Close"
                        onClick={closeCommentDeleteConfirm}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        {commentDeleteConfirm.isReply
                            ? 'Delete this reply? This cannot be undone.'
                            : 'Delete this comment and all of its replies? This cannot be undone.'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeCommentDeleteConfirm} variant="outlined">Cancel</Button>
                    <Button onClick={confirmCommentDelete} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Report/Flag dialog (global for this list) */}
            <FlagCommentDialog open={flagState.open} onClose={closeFlag} onSubmit={submitFlag} />

            {/* Rate limit dialog for replies */}
            <RateLimitDialog
                open={replyRateLimitOpen}
                onClose={() => setReplyRateLimitOpen(false)}
                retryAfterSec={replyRateLimitInfo.retryAfterSec}
                reason={replyRateLimitInfo.reason}
                actionLabel="comments"
                sx={{ zIndex: 100001 }}
            />

            {/* Share Comment dialog */}
            <ShareDialog contentType="comment"
                         open={shareCommentDialogOpen}
                         onClose={() => {
                             setShareCommentDialogOpen(false);
                             setShareCommentTarget(null);
                         }}
                         comment={shareCommentTarget}
                         post={post || { id: postId }}
                         viewer={viewer}
                         sx={{ zIndex: 100001 }}
            />

        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════ */

export default RedditComments;

// Named exports: the individual comment components + the news URL-context
// constant, so Slice 2c (CommunityNewsDetailPanel) and any future callers
// can either drop in <RedditComments resourceContext={NEWS_ARTICLE_RESOURCE} />
// or grab the primitives directly if they want to build a custom layout.
export {
    RedditComments,
    ThreadedCommentItem,
    BlockedCommentsGroup,
    FlagCommentDialog,
    normalizeComments,
    sortTopLevelThreads,
    groupBlockedTopLevel,
    ensureCommentFadeKeyframes,
    DEFAULT_COMMUNITY_POST_RESOURCE,
    // Helpers that PostPage (the parent component in PostDetailModal) also
    // uses directly in its own render tree — exported so the import from
    // ./comments/CommentThread covers PostDetailModal's full dependency.
    ComposerAvatar,
    MentionAccountBadge,
    resolveMentionHandle,
    scanImageFile,
    // NEWS_ARTICLE_RESOURCE is already exported at its declaration above.
};
