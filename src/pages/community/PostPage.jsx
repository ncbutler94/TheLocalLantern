// src/pages/community/PostPage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { isCommentBlocked, parseBlockedSets, handleBlockChangedEvent } from '../../utils/commentBlockUtils';
import { useParams,
    useLocation,
    useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Popper,
    Typography,
    Avatar,
    Button,
    Divider,
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
    ListItem,
    ListItemIcon,
    ListItemAvatar,
    ListItemText,
    List,
    ListItemButton
} from '@mui/material';

import ClickAwayListener from '@mui/material/ClickAwayListener';

import { alpha as alphaColor } from '@mui/material/styles';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { getCommunityCategory, COMMUNITY_CATEGORY_META } from './utils/communityPostCategoryIcons';


import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import SmartMenu from '../../components/SmartMenu';
import AccountAvatar from '../../components/AccountAvatar';

import ActionBar, { ReportDialog } from '../../components/ActionBar';
import ShareDialog from '../../components/ShareDialog';
import { useAuth } from '../../components/AuthModalContext';
import BlockedPostGate, { useBlockedPostGate } from '../../components/BlockedPostGate';

import EditCommunityPostDialog from './components/EditCommunityPostDialog';
import EditPollForm from './components/EditPollForm';
import DeletePostConfirmDialog from './components/DeletePostConfirmDialog';
import SuccessSnackbar, { useSuccessSnackbar } from '../../components/SuccessSnackbar';
import UserCardPopover from '../../components/UserCardPopover';
import { useActiveAccount } from '../../components/AccountContext';
import { getAccountHeaders as getStaticAccountHeaders } from '../../utils/getAccountHeadersStatic';
import PollDisplay from './components/PollDisplay';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../components/Header/Header';
import PulsingDots from '../../components/PulsingDots';
import NetworkErrorState, { isNetworkError } from '../../components/NetworkErrorState';
import CommentImageAttachments, { uploadFilesToGCS } from '../../components/CommentImageAttachments';
import CommentImages from '../../components/CommentImages';
import RichTextDisplay from '../../components/RichTextDisplay';
import useRateLimit from '../../utils/useRateLimit';
import RateLimitDialog from '../../components/RateLimitDialog';
import { checkProfanity } from '../../utils/profanityCheck';
import { secureFetch } from '../../utils/secureFetch';
import useChromeTop from '../../hooks/useChromeTop';

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

/* Module-level stable empty Set — avoids creating a new Set() on every
   setTimeout/cleanup callback which can trigger unnecessary re-renders. */
const EMPTY_SET = Object.freeze(new Set());

const HELP_TYPE_LABELS = {
    labor: 'Home & Yard Help',
    rides: 'Rides & Errands',
    meals: 'Meals & Groceries',
    donations: 'Donations & Supplies',
    care: 'Care & Support',
    staffing: 'Community Event Help',
    skills: 'Skills & Advice',
    other: 'Other',
};

const URGENCY_LABELS = {
    flexible: 'Flexible',
    soon: 'Soon',
    urgent: 'Urgent',
};

const TRAVEL_RADIUS_LABELS = {
    city: 'Within my city',
    county: 'Within my county',
    neighboring_counties: 'Nearby counties',
    statewide: 'Anywhere in Alabama',
};

const DEFAULT_AVATAR_SX = {
    bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
    color: 'primary.main',
};

const GROUP_ROLE_META = {
    owner: { label: 'Group Owner' },
    admin: { label: 'Group Admin' },
};

const normalizeGroupRole = (role) => {
    const r = String(role || '').trim().toLowerCase();
    if (!r) return '';
    if (r === 'owner') return 'owner';
    if (r === 'admin') return 'admin';
    return '';
};

function GroupRoleChip({ role }) {
    const key = normalizeGroupRole(role);
    if (!key) return null;

    const meta = GROUP_ROLE_META[key];
    return (
        <Chip
            size="small"
            variant="outlined"
            label={meta.label}
            sx={(t) => ({
                height: 22,
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 11,
                px: 0.75,
                ...(key === 'owner'
                    ? {
                        borderColor: alphaColor(t.palette.secondary.main, 0.55),
                        color: t.palette.secondary.dark,
                        bgcolor: alphaColor(t.palette.secondary.main, 0.08),
                    }
                    : {
                        borderColor: alphaColor(t.palette.primary.main, 0.35),
                        color: t.palette.primary.dark,
                        bgcolor: alphaColor(t.palette.primary.main, 0.06),
                    }),
                '& .MuiChip-label': { px: 0.75, lineHeight: 1 },
            })}
        />
    );
}


const SEND_BUTTON_SX = {
    ml: 0.5,
    bgcolor: 'primary.main',
    color: 'common.white',
    width: { xs: 32, sm: 36 },
    height: { xs: 32, sm: 36 },
    flexShrink: 0,
    borderRadius: '50%',
    boxShadow: 'none',
    '&:hover': { bgcolor: 'primary.dark', boxShadow: (t) => `0 4px 12px ${alphaColor(t.palette.primary.main, 0.25)}` },
    '&.Mui-disabled': {
        bgcolor: 'action.disabledBackground',
        color: 'action.disabled',
        opacity: 1,
        boxShadow: 'none',
    },
};

const NEW_COMMENT_FADE_SX = {
    animation: 'commentFadeIn 0.45s ease-out both',
    '@keyframes commentFadeIn': {
        from: { opacity: 0, transform: 'translateY(8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
};

const api = process.env.REACT_APP_API_URL || '';

/* ---------- Relative time helper ---------- */
const timeAgo = (input) => {
    const d = input ? new Date(input) : null;
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

/* ---------- Compact relative time helper (for post headers) ---------- */
const timeAgoCompact = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    const diffMs = Math.max(0, Date.now() - d.getTime());

    const s = Math.floor(diffMs / 1000);
    if (s < 60) return 'Just now';

    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}hr ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}wk ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}yr ago`;
};

/* ---------- Absolute date helper (short month names) ---------- */
const formatDateShort = (v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTimeShort = (v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    return d
        .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
        .toLowerCase();
};

const dateTimeLabelShort = (v) => {
    const a = formatDateShort(v);
    const b = formatTimeShort(v);
    return a && b ? `${a} · ${b}` : a || b || '';
};



/* ---------- category/badge helpers (match PostList chips) ---------- */

/* Currency-ish formatter for rewards (accepts number or string) */
const formatReward = (val) => {
    if (val === null || typeof val === 'undefined') return '';
    const num = typeof val === 'string' ? Number(val.replace(/[^0-9.-]/g, '')) : Number(val);
    if (Number.isFinite(num)) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: num % 1 === 0 ? 0 : 2,
            }).format(num);
        } catch {
            /* fallback */
        }
    }
    return String(val);
};
const formatNiceLabel = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((w) => (w ? (w.charAt(0).toUpperCase() + w.slice(1)) : ''))
        .join(' ')
        .trim();
};

const isVolunteerHelpCategory = (category) => {
    const cat = String(category || '').trim().toLowerCase();
    if (!cat) return false;
    return (
        cat === 'help-requests' ||
        cat === 'volunteers' ||
        cat === 'volunteer-requests' ||
        cat === 'volunteer-help-requests' ||
        cat === 'volunteer-help' ||
        cat.includes('volunteer')
    );
};

const normalizeRequestKind = (post) => {
    const kind = String(post?.request_kind || post?.requestKind || '').trim().toLowerCase();
    if (kind) return kind;

    // Fallback: infer from category when request_kind is missing (legacy rows)
    const cat = String(post?.category || '').trim().toLowerCase();
    if (cat === 'help-requests') return 'help';
    if (cat === 'volunteers') return 'volunteer';
    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests' || cat === 'volunteer-help') return 'help';
    return '';
};

const parseDateSafe = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
    // Handle numeric timestamps passed as strings
    const n = Number(value);
    if (Number.isFinite(n)) {
        const dn = new Date(n);
        if (!Number.isNaN(dn.getTime())) return dn;
    }
    return null;
};


const BADGE = Object.fromEntries(
    Object.entries(COMMUNITY_CATEGORY_META).map(([key, meta]) => [key, { label: meta.label, Icon: meta.Icon }])
);

const deriveSplitCategory = (post) => {
    // Normalize to new slugs when legacy category remains
    let cat = String(post?.category || '').toLowerCase();

    if (cat === 'recommendations-tips' || cat === 'tips' || cat === 'tip') {
        // Tips removed — treat legacy rows as Recommendations.
        return 'recommendations';
    }

    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests' || cat === 'volunteer-help') {
        const kind = String(post?.request_kind || post?.requestKind || '').toLowerCase();
        if (kind === 'volunteer' || kind === 'offer' || kind === 'offering') return 'volunteers';
        if (kind === 'help' || kind === 'request' || kind === 'help-request' || kind === 'help_request') return 'help-requests';
        // Fallback for legacy rows (no request_kind)
        return 'help-requests';
    }

    if (cat === 'polls') return 'poll';

    return cat;
};

const buildBadgeFor = (post) => {
    if (!post) return null;
    if (post.category === 'public-safety-alerts') {
        return getCommunityCategory('public-safety-alerts');
    }
    if (post.lost_or_found) {
        const meta = getCommunityCategory('lost-and-found');
        return { ...meta, label: post.lost_or_found === 'found' ? 'Found' : 'Lost' };
    }
    const cat = deriveSplitCategory(post);
    return BADGE[cat] || BADGE.community || null;
};

const CategoryChip = ({ badge }) => {
    if (!badge) return null;
    const BadgeIcon = badge.Icon;
    return (
        <Chip
            size="small"
            label={badge.label}
            icon={BadgeIcon ? <BadgeIcon sx={{ fontSize: '13px !important' }} /> : undefined}
            sx={(t) => ({
                height: 22,
                maxWidth: 200,
                minWidth: 0,
                borderRadius: 999,
                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                color: t.palette.primary.main,
                fontWeight: 800,
                fontSize: 11,
                border: '1px solid',
                borderColor: alphaColor(t.palette.primary.main, 0.25),
                '& .MuiChip-icon': { color: t.palette.primary.main, ml: 0.5 },
                '& .MuiChip-label': { px: 0.75, lineHeight: 1 },
            })}
        />
    );
};

/* ---------- photos ---------- */
const extractPhotos = (post) => {
    if (!post || typeof post !== 'object') return [];

    const pickUrl = (val) => {
        if (!val) return null;
        if (typeof val === 'string') {
            const s = val.trim();
            if (!s || s === 'null' || s === 'undefined') return null;
            return s;
        }
        if (typeof val === 'object') {
            const s =
                val.url ||
                val.photo_url ||
                val.photoUrl ||
                val.path ||
                val.location ||
                val.src ||
                val.href ||
                null;
            return pickUrl(s);
        }
        return null;
    };

    const pushMany = (arr, out) => {
        for (const item of arr) {
            const u = pickUrl(item);
            if (u) out.push(u);
        }
    };

    const collected = [];

    // Common shapes:
    // - post.photos: array of strings/objects OR JSON string
    // - post.photos_json: JSON string
    // - post.photo_urls / post.image_urls: array or JSON string
    // - fallbacks: photo_url, image_url, etc.
    const candidates = [
        post.photos,
        post.photos_json,
        post.photo_urls,
        post.photoUrls,
        post.image_urls,
        post.imageUrls,
        post.images,
        post.image_list,
        post.imageList,
    ];

    for (const c of candidates) {
        if (!c) continue;

        if (Array.isArray(c)) {
            pushMany(c, collected);
            continue;
        }

        if (typeof c === 'string') {
            const s = c.trim();
            if (!s || s === 'null') continue;

            // JSON array?
            if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed)) pushMany(parsed, collected);
                    else {
                        const u = pickUrl(parsed);
                        if (u) collected.push(u);
                    }
                    continue;
                } catch {
                    // fall through
                }
            }

            // Delimited list?
            if (/[;,|]/.test(s)) {
                const parts = s
                    .split(/[;,|]/)
                    .map((p) => p.trim())
                    .filter(Boolean);
                pushMany(parts, collected);
                continue;
            }

            // Single URL/path
            const u = pickUrl(s);
            if (u) collected.push(u);
        }
    }

    // Other known fallbacks
    if (!collected.length) {
        const oneOffs = [
            post.photo_url,
            post.photoUrl,
            post.photo,
            post.image_url,
            post.imageUrl,
            post.image,
            post.thumbnail,
            post.main_photo_url,
            post.mainPhotoUrl,
            post.cover,
            post.cover_url,
            post.coverUrl,
        ];
        pushMany(oneOffs, collected);
    }

    if (!collected.length && Array.isArray(post.community_photos)) {
        pushMany(post.community_photos, collected);
    }

    // Unique + stable order
    const seen = new Set();
    const out = [];
    for (const u of collected) {
        if (!u) continue;
        if (seen.has(u)) continue;
        seen.add(u);
        out.push(u);
        if (out.length >= 20) break;
    }

    return out;
};

/* ---------- @mention rendering (clickable -> UserCardPopover) ---------- */
const renderTextWithMentions = (text, onMentionClick) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;

    // Combined regex: URLs (http/https/www) and @mentions
    // URL pattern matches http(s)://... or www. and captures until whitespace/certain punctuation
    const urlRe = /https?:\/\/[^\s<>\"')\]]+|www\.[^\s<>\"')\]]+/gi;
    const mentionRe = /@([a-zA-Z0-9_]{2,30})/g;

    // Collect all matches with their positions
    const matches = [];

    let m;
    while ((m = urlRe.exec(raw)) !== null) {
        // Strip trailing punctuation that's likely not part of the URL (. , ; : ! ?)
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

    // Sort by start position; if overlapping, keep the earlier/longer match
    matches.sort((a, b) => a.start - b.start || b.end - a.end);

    // Remove overlapping matches (keep the first one)
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
            // Display a cleaned-up label: strip protocol, trailing slash
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


/* ---------- @mention typing helpers (autocomplete in comment boxes) ---------- */
const getMentionMatch = (text, cursorIndex) => {
    const raw = typeof text === 'string' ? text : String(text ?? '');
    const cursor = Number.isFinite(Number(cursorIndex)) ? Number(cursorIndex) : raw.length;
    const clamped = Math.max(0, Math.min(raw.length, cursor));
    const upto = raw.slice(0, clamped);

    const at = upto.lastIndexOf('@');
    if (at < 0) return null;

    // Allow @ after numbers/punctuation, but not directly after letters, underscore, or dot
    const before = at > 0 ? upto[at - 1] : '';
    if (before && /[A-Za-z_.]/.test(before)) return null;

    const query = upto.slice(at + 1);
    if (!query) return null; // don't trigger on bare "@"
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


/* ========================================================================== */
/* Flag dialog (no click-away; X in the corner)                               */
/* ========================================================================== */
function FlagCommentDialog({ open, onClose, onSubmit, initialReason = 'spam' }) {
    const [reason, setReason] = useState(initialReason);
    const [details, setDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!open) {
            // Delay reset so the confirmation screen stays visible during the close animation
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
            open={open}
            onClose={(_e, r) => {
                if (r === 'backdropClick' || r === 'escapeKeyDown') return;
                onClose();
            }}
            fullWidth
            maxWidth="xs"
            PaperProps={{ sx: { position: 'relative' } }}
            sx={{ zIndex: 100001 }}
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

const COMMENT_MAX_CHARS = 15000;
const COMMENT_PREVIEW_CHARS = 200;
/** Max visual indent depth — deeper replies flatten with a "Replying to" label */
const MAX_VISUAL_DEPTH = 2;

function normalizeComments(raw) {
    const src = Array.isArray(raw) ? raw : raw?.comments || raw?.data || [];
    const items = src.map((c, idx) => ({
        id: c.id ?? c.comment_id ?? c._id ?? `c_${idx}`,
        parentId: c.parent_id ?? c.parentId ?? c.reply_to ?? null,
        user_id: c.user_id ?? c.userId ?? c.user?.id ?? null,
        public_id: c.public_id ?? c.user_public_id ?? c.user?.public_id ?? null,
        // Pinned comment support (post author can pin exactly one top-level comment)
        is_pinned: Number(c.is_pinned ?? c.isPinned ?? c.pinned ?? 0),
        pinned_at: c.pinned_at ?? c.pinnedAt ?? null,
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
        is_removed: Boolean(c.is_removed ?? c.isRemoved ?? false),
        removed_reason: String(c.removed_reason ?? c.removedReason ?? ''),
        removed_by_user_id: c.removed_by_user_id ?? c.removedByUserId ?? null,
        removed_at: c.removed_at ?? c.removedAt ?? null,
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
        // fallback can pick palette (visual artist) vs music-note (musician).
        // Backend sets this per-comment from music_artists.profile_type.
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

    // Safety: ensure pinned top-level comment stays first even if the backend ordering changes.
    roots.sort((a, b) => {
        const ap = Number(a?.is_pinned ?? 0);
        const bp = Number(b?.is_pinned ?? 0);
        if (bp !== ap) return bp - ap;
        const at = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bt = b?.created_at ? new Date(b.created_at).getTime() : 0;
        return at - bt;
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
                                 viewerId,
                                 postAuthor,
                                 groupRoleMap,
                                 onOpenUserCard,
                                 likeComment,
                                 submitReply,
                                 openFlag,
                                 highlightedCommentId,
                                 highlightedCommentIds,
                                 onRequestDelete,
                                 onRequestTogglePin,
                                 canPinComment,
                                 blockedUserIds,
                                 blockedBusinessIds,
                                 blockedArtistIds,
                                 blockedHandles,
                                 replyToName,
                                 replyToHandle,
                                 replyToAvatar,
                                 onShareComment,
                                 onScrollToComment,
                                 parentCommentId,
                                 postId,
                                 onCopyLinkToast,
                                 forceShowBlocked = false,
                                 groupCommentGated = false,
                                 post,
                             }) {
    const name = node.business_name
        ? node.business_name
        : node.artist_name
            ? node.artist_name
            : node.account_name
                ? node.account_name
                : (`${node.first_name || ''} ${node.last_name || ''}`.trim() || 'User');
    const ts = node.created_at ? timeAgo(node.created_at) : '';
    const hasReplies = Array.isArray(node.replies) && node.replies.length > 0;
    const isRemoved = !!node.is_removed;
    const showRemovedPlaceholder = isRemoved && hasReplies;
    const open = !!expanded[node.id];
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

    // For business/artist: use their specific avatar, then account_avatar_url (denormalized at creation).
    // NEVER fall back to node.avatar — that's the personal profile pic from the users table.
    // For normal users: use node.avatar (personal pic).
    const commentAvatarUrl = (() => {
        if (isBusinessComment) {
            return (node.business_avatar_url || node.account_avatar_url || '').trim();
        }
        if (isArtistComment) {
            return (node.artist_avatar_url || node.account_avatar_url || '').trim();
        }
        return node.avatar || '';
    })();

    const isPinned = Boolean(Number(node?.is_pinned ?? node?.isPinned ?? 0));

    // Account-aware: determine if the current active account matches the comment's account
    const { isBusinessAccount: isBA_comment, isArtistAccount: isAA_comment, activeBusinessId: aBizId_comment, activeArtistId: aArtId_comment, activeAccount: activeAcct_comment } = useActiveAccount();

    // Authoritative viewer profile_type for the reply-composer avatar fallback.
    // Mirrors ArtistAdminConsole — fetches the active artist row and reads
    // profile_type directly. Only matters for artist viewers.
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
    const isVisualArtistViewer = isAA_comment && viewerReplyProfileType === 'artist';

    const [showFull, setShowFull] = useState(false);

    // Blocked user check — matches all ID fields and handles
    const commentUserId = Number(node.user_id || 0);
    const commentPublicId = Number(node.public_id || 0);
    const commentBizIdRaw = Number(node.business_id || 0);
    const commentArtIdRaw = Number(node.artist_id || 0);
    const commentHandle = (node.handle || node.business_slug || node.artist_handle || node.account_handle || '').toLowerCase().trim();
    const isBlockedUser =
        isCommentBlocked(node, { blockedUserIds, blockedBusinessIds, blockedArtistIds, blockedHandles });
    const [showBlockedContent, setShowBlockedContent] = useState(false);
    const [manuallyHidden, setManuallyHidden] = useState(false);

    // Should we show the placeholder?
    const showPlaceholder = isBlockedUser && (
        (!forceShowBlocked && !showBlockedContent) ||
        (forceShowBlocked && manuallyHidden)
    );
    // Should we show the full comment with a blocked label?
    const showBlockedLabel = isBlockedUser && !showPlaceholder;

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

    const isHighlighted =
        (highlightedCommentId != null && String(node.id) === String(highlightedCommentId))
        || (highlightedCommentIds instanceof Set && highlightedCommentIds.has(String(node.id)));

    const nameNorm = name.toLowerCase().replace(/\s+/g, ' ').trim();
    const authorId = postAuthor?.id != null ? String(postAuthor.id) : null;
    const authorHandle = (postAuthor?.handle || '').toLowerCase();
    const authorPublicId = postAuthor?.public_id != null ? String(postAuthor.public_id) : null;
    const authorNameNorm = (postAuthor?.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const nodeId = node.user_id != null ? String(node.user_id) : null;
    const nodeGroupRole = nodeId && groupRoleMap ? (groupRoleMap[String(nodeId)] || '') : '';
    const nodeHandle = (node.handle || '').toLowerCase();
    const nodePub = node.public_id != null ? String(node.public_id) : null;
    const viewerIdStr = viewerId != null ? String(viewerId) : null;
    const viewerGroupRole = normalizeGroupRole(groupRoleMap?.[viewerIdStr]);
    const canDelete = !!viewerIdStr && (
        (nodeId && viewerIdStr === nodeId) ||
        (authorId && viewerIdStr === authorId) ||
        viewerGroupRole === 'owner' ||
        viewerGroupRole === 'admin'
    );

    // Account-aware "own comment": true only when the comment was posted from the SAME account type currently active
    const sameUser = viewerIdStr != null && nodeId != null && viewerIdStr === nodeId;
    const commentBizId = Number(node.business_id || 0);
    const commentArtId = Number(node.artist_id || 0);
    const isActiveAccountMatch = sameUser && (
        (isBA_comment && aBizId_comment && commentBizId === Number(aBizId_comment)) ||
        (isAA_comment && aArtId_comment && commentArtId === Number(aArtId_comment)) ||
        (!isBA_comment && !isAA_comment && !commentBizId && !commentArtId)
    );
    const isOwnComment = isActiveAccountMatch;
    // Use the viewer's LIVE avatar for their own comments so profile pic changes show immediately.
    const displayAvatarUrl = (isOwnComment && viewerAvatarUrl) ? viewerAvatarUrl : commentAvatarUrl;
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
    // OR you're the post author / group owner / admin (those can always delete)
    const canDeleteEffective = canDelete && (
        isActiveAccountMatch ||
        (authorId && viewerIdStr === authorId) ||
        viewerGroupRole === 'owner' ||
        viewerGroupRole === 'admin'
    );
    const deleteLabel = depth > 0 ? 'Delete Reply' : 'Delete Comment';

    const isAuthor = (() => {
        const userMatch =
            (authorId && nodeId && nodeId === authorId) ||
            (authorHandle && nodeHandle && nodeHandle === authorHandle) ||
            (authorPublicId && nodePub && nodePub === authorPublicId) ||
            (!!authorNameNorm && !!nameNorm && authorNameNorm === nameNorm);
        if (!userMatch) return false;
        // Business/artist comment on a personal post is NOT "Author"
        if (commentBizId > 0 || commentArtId > 0) return false;
        return true;
    })();

    const [liked, setLiked] = useState(Boolean(node.viewer_liked));
    const rawLikes = Number(node.likes || 0);
    const createdAt = parseDateSafe(node.created_at);
    const isFreshOwnComment =
        !!viewerIdStr && !!nodeId && viewerIdStr === nodeId && !!createdAt && (Date.now() - createdAt.getTime() < 5 * 60 * 1000);
    const displayLikes = (!node.viewer_liked && rawLikes === 1 && isFreshOwnComment) ? 0 : rawLikes;

    const [likes, setLikes] = useState(displayLikes);
    const [flagged, setFlagged] = useState(Boolean(node.viewer_flagged));

    // isViewerPostAuthor: true only when the viewer is operating under the SAME
    // account type that created the post (not just same user_id).
    const isViewerPostAuthor = (() => {
        if (viewerIdStr == null || authorId == null || viewerIdStr !== authorId) return false;
        const postBizId = Number(post?.business_id || post?.businessId || 0);
        const postArtId = Number(post?.artist_id || post?.artistId || 0);
        if (postBizId > 0) return isBA_comment && Number(aBizId_comment) === postBizId;
        if (postArtId > 0) return isAA_comment && Number(aArtId_comment) === postArtId;
        return !isBA_comment && !isAA_comment;
    })();
    const [likedByAuthor, setLikedByAuthor] = useState(Boolean(node.liked_by_author));

    useEffect(() => {
        setLikedByAuthor(Boolean(node.liked_by_author));
    }, [node.liked_by_author]);

    useEffect(() => {
        setLiked(Boolean(node.viewer_liked));
        const nextRawLikes = Number(node.likes || 0);
        const nextCreatedAt = parseDateSafe(node.created_at);
        const nextIsFreshOwn =
            !!viewerIdStr && !!nodeId && viewerIdStr === nodeId && !!nextCreatedAt && (Date.now() - nextCreatedAt.getTime() < 5 * 60 * 1000);
        const nextDisplayLikes = (!node.viewer_liked && nextRawLikes === 1 && nextIsFreshOwn) ? 0 : nextRawLikes;
        setLikes(nextDisplayLikes);
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
        if (e.key === 'Enter' && !e.shiftKey) {
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
        onOpenUserCard?.(e.currentTarget, { handle: h });
    };

    const hasNodeAvatar = !!displayAvatarUrl;

    // Default avatar icon and styling (isBusinessComment/isArtistComment defined above).
    // For artist commenters, distinguish musicians from visual artists using
    // the `profile_type` field. Prefer the comments API value; if missing
    // (community comments endpoint doesn't JOIN music_artists), fetch
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
    const DefaultAvatarIcon = isBusinessComment
        ? StorefrontOutlinedIcon
        : isArtistComment
            ? (isVisualArtistComment ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;
    const defaultAvatarSx = isBusinessComment || isArtistComment
        ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' }
        : { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' };

    // Depth-capped indent — after MAX_VISUAL_DEPTH, stop adding padding so replies don't keep shifting right
    const shouldIndent = depth > 0 && depth <= MAX_VISUAL_DEPTH;
    const indentPl = shouldIndent ? { xs: 1.5, sm: 2 } : 0;
    const indentMl = shouldIndent ? { xs: 0.5, sm: 1 } : 0;
    const avatarSize = depth === 0 ? 40 : depth === 1 ? 36 : 32;
    const commentFontSize = depth >= 2 ? 13 : 14;
    const nameFontSize = depth >= 2 ? 13 : 14;

    const REPLY_BATCH = 25;
    const [visibleReplies, setVisibleReplies] = useState(REPLY_BATCH);
    useEffect(() => {
        if (open) setVisibleReplies(REPLY_BATCH);
    }, [open]);

    const repliesToShow = hasReplies ? node.replies.slice(0, visibleReplies) : [];

    const effectiveText = showRemovedPlaceholder ? '' : (node.text || '');
    const needsTruncate = !!effectiveText && effectiveText.length > COMMENT_PREVIEW_CHARS;
    const displayText =
        !effectiveText
            ? ''
            : showFull || !needsTruncate
                ? effectiveText
                : `${effectiveText.slice(0, COMMENT_PREVIEW_CHARS)}...`;

    if (isRemoved && !hasReplies) return null;

    // Render blocked user placeholder — content hidden by default, reply tree stays visible
    if (showPlaceholder) {
        const blockedLabel = depth > 0 ? 'Reply from a blocked user' : 'Comment from a blocked user';
        const isHighlighted = (String(highlightedCommentId) === String(node.id))
            || (highlightedCommentIds instanceof Set && highlightedCommentIds.has(String(node.id)));
        const handleShowThis = () => {
            if (forceShowBlocked) setManuallyHidden(false);
            else setShowBlockedContent(true);
        };
        return (
            <>
                <Box
                    id={`comment-${node.id}`}
                    sx={{
                        pl: indentPl,
                        borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.text.primary, 0.08)}` : 'none',
                        ml: indentMl,
                        ...(isHighlighted ? {
                            bgcolor: (t) => alphaColor(t.custom?.brand?.brass || '#A87822', 0.10),
                            borderRadius: 2,
                            transition: 'background-color 0.6s ease',
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

                {/* Replies rendered outside the indented box */}
                {hasReplies && open ? (
                    <Box sx={{ pl: indentPl, ml: indentMl }}>
                        {repliesToShow.map((r) => (
                            <ThreadedCommentItem
                                key={r.id}
                                node={r}
                                depth={depth + 1}
                                expanded={expanded}
                                setExpanded={setExpanded}
                                viewerAvatarUrl={viewerAvatarUrl}
                                viewerLabel={viewerLabel}
                                viewerId={viewerId}
                                highlightedCommentId={highlightedCommentId}
                                highlightedCommentIds={highlightedCommentIds}
                                onRequestDelete={onRequestDelete}
                                onRequestTogglePin={onRequestTogglePin}
                                canPinComment={false}
                                postAuthor={postAuthor}
                                groupRoleMap={groupRoleMap}
                                onOpenUserCard={onOpenUserCard}
                                likeComment={likeComment}
                                submitReply={submitReply}
                                openFlag={openFlag}
                                blockedUserIds={blockedUserIds}
                                blockedBusinessIds={blockedBusinessIds}
                                blockedArtistIds={blockedArtistIds}
                                blockedHandles={blockedHandles}
                                replyToName={name}
                                replyToHandle={displayHandle}
                                replyToAvatar={displayAvatarUrl}
                                onShareComment={onShareComment}
                                onScrollToComment={onScrollToComment}
                                parentCommentId={node.id}
                                postId={postId}
                                onCopyLinkToast={onCopyLinkToast}
                                groupCommentGated={groupCommentGated}
                                post={post}
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
                data-comment-id={String(node.id)}
                id={`comment-${node.id}`}
                sx={{
                    pl: indentPl,
                    borderLeft: shouldIndent ? (t) => `2px solid ${alphaColor(t.palette.text.primary, 0.08)}` : 'none',
                    ml: indentMl,
                    scrollMarginTop: 120,
                }}
            >
                <Box
                    sx={(t) => ({
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        py: 1.25,
                        borderRadius: 2,
                        transition: (t) => `background-color ${t.custom.motion.slow}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.slow}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                        width: '100%',
                        boxSizing: 'border-box',
                        border: '2px solid transparent',
                        ...(isHighlighted
                            ? {
                                px: 1,
                                backgroundColor: alphaColor(t.custom?.brand?.brass || '#A87822', 0.14),
                                borderColor: alphaColor(t.custom?.brand?.brass || '#A87822', 0.50),
                                boxShadow: `0 14px 34px ${alphaColor(t.custom?.brand?.brass || '#A87822', 0.18)}`,
                            }
                            : null),
                    })}
                >
                    <Avatar
                        src={hasNodeAvatar ? cacheBustedAvatarUrl : undefined}
                        imgProps={{ referrerPolicy: 'no-referrer' }}
                        sx={{ width: avatarSize, height: avatarSize, flexShrink: 0, cursor: 'pointer', border: '1px solid', borderColor: 'divider', ...(!hasNodeAvatar ? defaultAvatarSx : {}) }}
                        onClick={openCard}
                    >
                        {!hasNodeAvatar ? <DefaultAvatarIcon sx={{ fontSize: avatarSize * 0.6 }} /> : null}
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
                                <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 700, cursor: 'pointer', fontSize: nameFontSize, '&:hover': { textDecoration: 'underline' } }}
                                        onClick={openCard}
                                        noWrap
                                    >
                                        {name}
                                    </Typography>
                                    <GroupRoleChip role={(!commentBizId && !commentArtId) ? nodeGroupRole : ''} />
                                    {isAuthor && (
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Author
                                            </Typography>
                                        </Box>
                                    )}
                                    {ts ? (
                                        <>
                                            <Box sx={{ width: 4, height: 4, borderRadius: '50%' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                                                {ts}
                                            </Typography>
                                        </>
                                    ) : null}
                                    {likedByAuthor && !isAuthor && (
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
                                        sx={{ cursor: 'pointer', fontSize: 11, mt: 0.1, lineHeight: 1.2, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', '&:hover': { textDecoration: 'underline' } }}
                                        onClick={openCard}
                                        noWrap
                                    >
                                        @{displayHandle}
                                    </Typography>
                                ) : null}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
                                {canPinComment && isPinned && depth === 0 ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.75 }}>
                                            <Tooltip title="Unpin comment" placement="top">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onRequestTogglePin?.(node.id, true)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        bgcolor: (t) => alphaColor(t.palette.warning.main, 0.10),
                                                        border: (t) => `1px solid ${alphaColor(t.palette.warning.main, 0.28)}`,
                                                        '&:hover': { bgcolor: (t) => alphaColor(t.palette.warning.main, 0.16) },
                                                    }}
                                                >
                                                    <PushPinRoundedIcon
                                                        fontSize="small"
                                                        sx={{ color: 'warning.main' }}
                                                    />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                ) : null}

                                {/* 3-dot menu for all users */}
                                {!showRemovedPlaceholder ? (
                                    <Box sx={{ ml: (canPinComment && isPinned && depth === 0) ? 0.5 : 0 }}>
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
                                            {[
                                                onShareComment ? (
                                                    <MenuItem
                                                        key="share"
                                                        onClick={(e) => {
                                                            closeCommentMenu(e);
                                                            const url = `${window.location.origin}/posts/${postId}?comment=${node.id}`;
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
                                                ) : null,
                                                !isPinned && canPinComment && depth === 0 ? (
                                                    <MenuItem
                                                        key="pin"
                                                        onClick={(e) => {
                                                            closeCommentMenu(e);
                                                            onRequestTogglePin?.(node.id, false);
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <PushPinRoundedIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Pin comment" />
                                                    </MenuItem>
                                                ) : null,
                                                isPinned && canPinComment && depth === 0 ? (
                                                    <MenuItem
                                                        key="unpin"
                                                        onClick={(e) => {
                                                            closeCommentMenu(e);
                                                            onRequestTogglePin?.(node.id, true);
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <PushPinRoundedIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Unpin comment" />
                                                    </MenuItem>
                                                ) : null,
                                                canDeleteEffective ? (
                                                    <MenuItem
                                                        key="delete"
                                                        onClick={(e) => {
                                                            closeCommentMenu(e);
                                                            onRequestDelete?.(node.id, depth > 0);
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText primary={deleteLabel} />
                                                    </MenuItem>
                                                ) : null,
                                                !isOwnComment && !flagged ? (
                                                    <MenuItem
                                                        key="report"
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
                                                ) : null,
                                                !isOwnComment && flagged ? (
                                                    <MenuItem key="reported" disabled>
                                                        <ListItemIcon>
                                                            <FlagOutlinedIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Reported" />
                                                    </MenuItem>
                                                ) : null,
                                            ].filter(Boolean)}
                                        </SmartMenu>
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>
                        {showRemovedPlaceholder ? (
                            <Typography
                                variant="body2"
                                sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                                {node.removed_reason === 'post_owner'
                                    ? 'Comment removed by post author'
                                    : node.removed_reason === 'author'
                                        ? 'Comment removed by comment author'
                                        : node.removed_reason === 'moderator'
                                            ? 'Comment removed by group moderator'
                                            : 'Comment removed'}
                            </Typography>
                        ) : effectiveText ? (
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55, fontSize: commentFontSize }}>
                                {renderTextWithMentions(displayText, onMentionClick)}
                                {needsTruncate && !showFull && (
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
                                )}
                                {needsTruncate && showFull && (
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
                                )}
                            </Typography>
                        ) : null}

                        {/* Comment images / GIFs */}
                        {!showRemovedPlaceholder && !isRemoved && (node.images?.length > 0 || node.image) ? (
                            <CommentImages images={node.images} image={node.image} />
                        ) : null}

                        {!showRemovedPlaceholder && (

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    mt: 0.75,
                                }}
                            >
                                <Link
                                    component="button"
                                    type="button"
                                    underline="none"
                                    onClick={() => { if (isRemoved) return; if (isViewerPostAuthor) setLikedByAuthor(!liked); likeComment(node.id, liked, setLiked, setLikes); }}
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
                        )}

                        {replyOpen && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-start' }}>
                                <Avatar
                                    src={viewerAvatarUrl || undefined}
                                    alt={viewerLabel}
                                    sx={(t) => ({
                                        width: { xs: 32, sm: 40 },
                                        height: { xs: 32, sm: 40 },
                                        mt: 0.25,
                                        flexShrink: 0,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                        color: t.palette.primary.main,
                                    })}
                                >
                                    {isBA_comment ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                        : isAA_comment
                                            ? (isVisualArtistViewer
                                                ? <PaletteRoundedIcon sx={{ fontSize: 18 }} />
                                                : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />)
                                            : <PersonRoundedIcon sx={{ fontSize: 18 }} />}
                                </Avatar>


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
                                        sx={{
                                            '& .MuiOutlinedInput-root': { borderRadius: 2, alignItems: 'flex-end' },
                                        }}
                                        inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                        InputProps={{
                                            endAdornment: (replyText.trim() || replyFiles.length > 0 || replyImageUrls.length > 0) ? (
                                                <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.25 }}>
                                                    <IconButton
                                                        aria-label="Send reply"
                                                        onClick={sendReply}
                                                        disabled={!replyText.trim() && replyFiles.length === 0 && replyImageUrls.length === 0}
                                                        sx={{
                                                            ...SEND_BUTTON_SX,
                                                            width: { xs: 28, sm: 34 },
                                                            height: { xs: 28, sm: 34 },
                                                        }}
                                                    >
                                                        <ArrowUpwardRoundedIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                        }}
                                    />

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
                                        disabled={false}
                                    />

                                    <Popper
                                        open={Boolean(replyMention.open)}
                                        anchorEl={replyInputRef.current}
                                        placement="bottom-start"
                                        disablePortal
                                        sx={{ zIndex: 2000, width: '100%' }}
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
                                                                primary="No users found"
                                                                primaryTypographyProps={{ fontWeight: 800 }}
                                                            />
                                                        </ListItem>
                                                    ) : null}

                                                    {!replyMentionLoading
                                                        ? (replyMention.results || []).map((u) => {
                                                            const handle = coerceHandle(u);
                                                            const label = coerceName(u);
                                                            const avatar = u?.avatar_url || u?.profile_picture || '';
                                                            const accountType = String(u?.account_type || 'user').toLowerCase();
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
                                                                        <Avatar src={avatar || undefined} sx={{ width: 32, height: 32, ...(!avatar ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
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
                                                                        primary={label}
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
                        )}

                        {node.reply_count > 0 && !hasReplies && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {node.reply_count} repl{node.reply_count === 1 ? 'y' : 'ies'}
                            </Typography>
                        )}

                        {hasReplies && (
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
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Replies rendered OUTSIDE the indented box so padding doesn't stack */}
            {hasReplies && open && (
                <Box sx={{ pl: indentPl, ml: indentMl }}>
                    {repliesToShow.map((r) => (
                        <ThreadedCommentItem
                            key={r.id}
                            node={r}
                            depth={depth + 1}
                            expanded={expanded}
                            setExpanded={setExpanded}
                            viewerAvatarUrl={viewerAvatarUrl}
                            viewerLabel={viewerLabel}
                            viewerId={viewerId}
                            highlightedCommentId={highlightedCommentId}
                            highlightedCommentIds={highlightedCommentIds}
                            onRequestDelete={onRequestDelete}
                            onRequestTogglePin={onRequestTogglePin}
                            canPinComment={false}
                            postAuthor={postAuthor}
                            groupRoleMap={groupRoleMap}
                            onOpenUserCard={onOpenUserCard}
                            likeComment={likeComment}
                            submitReply={submitReply}
                            openFlag={openFlag}
                            blockedUserIds={blockedUserIds}
                            blockedBusinessIds={blockedBusinessIds}
                            blockedArtistIds={blockedArtistIds}
                            blockedHandles={blockedHandles}
                            replyToName={name}
                            replyToHandle={displayHandle}
                            replyToAvatar={displayAvatarUrl}
                            onShareComment={onShareComment}
                            onScrollToComment={onScrollToComment}
                            parentCommentId={node.id}
                            postId={postId}
                            onCopyLinkToast={onCopyLinkToast}
                            groupCommentGated={groupCommentGated}
                            post={post}
                        />
                    ))}

                    {node.replies.length > repliesToShow.length && (
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
                    )}
                </Box>
            )}
        </>
    );
}

/**
 * Helper: segment an array of top-level threads into groups.
 * Consecutive blocked comments are merged into { type: 'blocked-group', nodes: [...] }.
 * Everything else is { type: 'comment', node }.
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

function RedditComments({
                            postId,
                            groupId,
                            groupRoleMap,
                            onMergeRoleMap,
                            refreshKey,
                            initialPageSize = 50,
                            viewer,
                            postAuthor,
                            onOpenUserCard,
                            scrollToCommentId,
                            highlightCommentIds,
                            post,
                            addCommentRef,
                            onCopyLinkToast,
                            groupCommentGated = false,
                        }) {
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [threads, setThreads] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [visibleCount, setVisibleCount] = useState(initialPageSize);
    const [scrolled, setScrolled] = useState(false);
    const [commentSort, setCommentSort] = useState('popular');
    const [highlightedCommentId, setHighlightedCommentId] = useState(null);
    const [highlightedCommentIds, setHighlightedCommentIds] = useState(() => new Set());
    const autoScrollRef = useRef(false);
    const highlightTimerRef = useRef(0);

    // Track newly added comment IDs for fade-in animation
    const [newCommentIds, setNewCommentIds] = useState(() => new Set());
    const newCommentTimerRef = useRef(0);

    // When navigating with multiple comment IDs to highlight (e.g. "view all comments" from profile),
    // set them all as highlighted and clear after a longer timeout.
    useEffect(() => {
        if (!highlightCommentIds || highlightCommentIds.size === 0) return;
        setHighlightedCommentIds(highlightCommentIds);
        const timer = setTimeout(() => setHighlightedCommentIds(EMPTY_SET), 5000);
        return () => clearTimeout(timer);
    }, [highlightCommentIds]);
    const [shareCommentDialogOpen, setShareCommentDialogOpen] = useState(false);
    const [shareCommentTarget, setShareCommentTarget] = useState(null);

    // Rate limiting for replies
    const { checkLimit: checkReplyLimit, recordAction: recordReply } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [replyRateLimitOpen, setReplyRateLimitOpen] = useState(false);
    const [replyRateLimitInfo, setReplyRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });

    const handleShareComment = useCallback((commentNode) => {
        setShareCommentTarget(commentNode);
        setShareCommentDialogOpen(true);
    }, []);

    const scrollToComment = useCallback((commentId) => {
        const el = document.getElementById(`comment-${commentId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedCommentId(String(commentId));
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightedCommentId(null), 2200);
        }
    }, []);

    // Active account context — used to scope viewerLiked per-account when fetching comments
    const { activeBusinessId: commentBizId, activeArtistId: commentArtId } = useActiveAccount();
    const commentAccountKey = commentBizId ? `biz:${commentBizId}` : commentArtId ? `art:${commentArtId}` : 'personal';

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
    }, [viewer?.id]);
    // Listen for blocked-changed events (real-time updates during session)
    useEffect(() => {
        const onBlockedChanged = (e) => {
            handleBlockChangedEvent(e, setBlockedUserIds, setBlockedBusinessIds, setBlockedArtistIds);
        };
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        return () => window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
    }, []);


    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY || document.documentElement.scrollTop || 0;
            setScrolled(y > 600);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const target = scrollToCommentId != null ? String(scrollToCommentId) : '';
        autoScrollRef.current = false;
        setHighlightedCommentId(null);
        if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = 0;
        }
        // reset per-post or per-target change
    }, [postId, scrollToCommentId]);

    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const fetchComments = async () => {
            setCommentsLoading(true);
            setVisibleCount(initialPageSize);

            // Build query string with active account for per-account viewerLiked
            const qp = new URLSearchParams();
            if (commentBizId) qp.set('activeBusinessId', commentBizId);
            else if (commentArtId) qp.set('activeArtistId', commentArtId);
            const qs = qp.toString() ? `?${qp.toString()}` : '';

            const tryUrls = [
                `/api/community/${encodeURIComponent(postId)}/comments${qs}`,
                `/api/community/posts/${encodeURIComponent(postId)}/comments${qs}`,
                `/api/comments?postId=${encodeURIComponent(postId)}${qs ? '&' + qp.toString() : ''}`,
                `/api/posts/${encodeURIComponent(postId)}/comments${qs}`,
            ];

            for (const url of tryUrls) {
                try {
                    const res = await secureFetch(url, { credentials: 'include' });
                    if (res.ok) {
                        const data = await res.json();
                        if (!cancelled) {
                            setThreads(normalizeComments(data));
                            setCommentsLoading(false);
                        }
                        return;
                    }
                } catch {
                    // try next endpoint
                }
            }
            if (!cancelled) {
                setThreads([]);
                setCommentsLoading(false);
            }
        };
        fetchComments();
        return () => {
            cancelled = true;
        };
    }, [postId, refreshKey, initialPageSize, refreshTick, commentAccountKey, commentBizId, commentArtId]);

    // Expose a function for the parent to optimistically insert a new top-level comment
    useEffect(() => {
        if (!addCommentRef) return;
        addCommentRef.current = (serverComment) => {
            if (!serverComment) return;
            const normalized = normalizeComments([serverComment]);
            if (normalized.length > 0) {
                const addedIds = new Set(normalized.map((c) => String(c.id)));
                setNewCommentIds((prev) => {
                    const next = new Set(prev);
                    addedIds.forEach((id) => next.add(id));
                    return next;
                });
                setThreads((prev) => [...normalized, ...prev]);
            }
        };
        return () => { addCommentRef.current = null; };
    }, [addCommentRef]);


    // If this is a group post, fetch Owner/Admin roles for commenters (for subtle badges).
    // Use a ref for groupRoleMap to avoid re-triggering this effect when roles are merged
    // (merging creates a new object reference which would re-trigger the effect).
    const groupRoleMapRef = useRef(groupRoleMap);
    groupRoleMapRef.current = groupRoleMap;
    useEffect(() => {
        const gid = groupId != null ? Number(groupId) : null;
        if (!gid || !threads || threads.length === 0) return undefined;

        const collect = (nodes, set) => {
            nodes.forEach((n) => {
                const uid = n?.user_id != null ? String(n.user_id) : '';
                if (uid) set.add(uid);
                if (Array.isArray(n?.replies) && n.replies.length) collect(n.replies, set);
            });
        };

        const idsSet = new Set();
        collect(threads, idsSet);

        const currentMap = groupRoleMapRef.current;
        const missing = Array.from(idsSet).filter((id) => id && !(currentMap && currentMap[String(id)]));
        if (missing.length === 0) return undefined;

        let cancelled = false;

        (async () => {
            try {
                const url = `/api/groups/${encodeURIComponent(String(gid))}/role-map?userIds=${encodeURIComponent(missing.join(','))}`;
                const res = await secureFetch(url, { credentials: 'include' });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const map = data?.roleMap || data?.roles || data || null;
                if (!map || typeof map !== 'object') return;

                const normalized = {};
                Object.entries(map).forEach(([k, v]) => {
                    const key = String(k);
                    const role = normalizeGroupRole(v);
                    if (key && role) normalized[key] = role;
                });

                if (!cancelled && Object.keys(normalized).length) {
                    onMergeRoleMap?.(normalized);
                }
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId, threads, onMergeRoleMap]);

    useEffect(() => {
        const targetId = scrollToCommentId != null ? String(scrollToCommentId) : '';
        if (!targetId) return;
        if (commentsLoading) return;
        if (!threads || threads.length === 0) return;
        if (autoScrollRef.current) return;

        const findPath = (nodes, rootIndex = 0) => {
            for (let i = 0; i < nodes.length; i += 1) {
                const n = nodes[i];
                const id = n?.id != null ? String(n.id) : '';
                if (id === targetId) {
                    return { found: true, parentIds: [], rootIndex: rootIndex + i, rootId: id };
                }
                const kids = Array.isArray(n?.replies) ? n.replies : [];
                if (kids.length) {
                    const subRes = findPath(kids, rootIndex + i);
                    if (subRes?.found) {
                        return {
                            ...subRes,
                            parentIds: [id, ...(subRes.parentIds || [])].filter(Boolean),
                            rootId: subRes.rootId,
                        };
                    }
                }
            }
            return null;
        };

        // Find the chain (root -> ... -> target) so we can expand parents and ensure the root is visible.
        let rootIndex = -1;
        let parentIds = [];
        let rootId = '';
        for (let i = 0; i < threads.length; i += 1) {
            const root = threads[i];
            const rootId0 = root?.id != null ? String(root.id) : '';
            if (!rootId0) continue;
            if (rootId0 === targetId) {
                rootIndex = i;
                rootId = rootId0;
                parentIds = [];
                break;
            }
            const res = findPath(Array.isArray(root?.replies) ? root.replies : [], 0);
            if (res?.found) {
                rootIndex = i;
                rootId = rootId0;
                parentIds = [rootId0, ...(res.parentIds || [])].filter(Boolean);
                break;
            }
        }

        // If the root comment isn't in the current visible window, expand the window first.
        if (rootIndex >= 0) {
            const needed = rootIndex + 1;
            if (visibleCount < needed) {
                setVisibleCount(needed);
                return;
            }
        }

        if (parentIds.length) {
            setExpanded((prev) => {
                const next = { ...(prev || {}) };
                parentIds.forEach((pid) => {
                    if (!pid) return;
                    next[pid] = true;
                });
                return next;
            });
        }

        const safeEscape = (v) => {
            try {
                if (typeof window !== 'undefined' && window.CSS && typeof window.CSS.escape === 'function') {
                    return window.CSS.escape(v);
                }
            } catch {}
            return v.replace(/"/g, '\\"');
        };

        const attemptScroll = (triesLeft) => {
            const sel = `[data-comment-id="${safeEscape(targetId)}"]`;
            const el = document.querySelector(sel);
            if (el) {
                try {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch {
                    // ignore
                }

                setHighlightedCommentId(targetId);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = setTimeout(() => {
                    setHighlightedCommentId(null);
                    highlightTimerRef.current = 0;
                }, 6500);

                autoScrollRef.current = true;
                return;
            }

            if (triesLeft <= 0) {
                autoScrollRef.current = true;
                return;
            }

            requestAnimationFrame(() => attemptScroll(triesLeft - 1));
        };

        // Let the DOM paint (and replies expand) before searching for the target element.
        requestAnimationFrame(() => requestAnimationFrame(() => attemptScroll(8)));
    }, [scrollToCommentId, commentsLoading, threads, visibleCount]);

    const openLogin = () => {
        try {
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch {}
    };

    const [commentDeleteConfirm, setCommentDeleteConfirm] = useState({ open: false, commentId: null, isReply: false });

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();

    const [pinConfirm, setPinConfirm] = useState({
        open: false,
        commentId: null,
        isPinned: false,
        willReplace: false,
    });

    const closePinConfirm = useCallback(() => {
        setPinConfirm({ open: false, commentId: null, isPinned: false, willReplace: false });
    }, []);

    const canPinComment = Boolean(
        viewer?.id != null &&
        postAuthor?.id != null &&
        String(viewer.id) === String(postAuthor.id)
    );

    const getPinnedTopLevelId = useCallback(() => {
        const top = Array.isArray(threads) ? threads : [];
        const found = top.find((t) => Boolean(Number(t?.is_pinned ?? t?.isPinned ?? 0)));
        return found?.id ?? null;
    }, [threads]);

    const togglePin = useCallback(
        async (commentId, wantsPin) => {
            const pid = postId != null ? String(postId) : '';
            const cid = commentId != null ? String(commentId) : '';
            if (!pid || !cid) return;

            const action = wantsPin ? 'pin' : 'unpin';
            const urls = [
                `/api/community/posts/${encodeURIComponent(pid)}/comments/${encodeURIComponent(cid)}/${action}`,
                `/api/community/${encodeURIComponent(pid)}/comments/${encodeURIComponent(cid)}/${action}`,
            ];

            for (const url of urls) {
                try {
                    const res = await secureFetch(url, { method: 'POST', credentials: 'include' });
                    if (res.ok) {
                        setRefreshTick((k) => k + 1);
                        return;
                    }
                } catch {
                    // try next
                }
            }
        },
        [postId]
    );

    const requestTogglePin = useCallback(
        (commentId, currentlyPinned) => {
            if (!canPinComment) return;
            togglePin(commentId, !currentlyPinned);
        },
        [canPinComment, togglePin]
    );

    const requestCommentDelete = useCallback((commentId, isReply = false) => {
        const cid = Number(commentId);
        if (!Number.isFinite(cid) || cid <= 0) return;
        setCommentDeleteConfirm({ open: true, commentId: cid, isReply: !!isReply });
    }, []);

    const closeCommentDeleteConfirm = useCallback(() => {
        setCommentDeleteConfirm({ open: false, commentId: null, isReply: false });
    }, []);

    async function deleteComment(commentId) {
        if (!viewer) return openLogin();
        const cid = Number(commentId);
        if (!Number.isFinite(cid) || cid <= 0) return;

        const tryUrls = [
            `/api/community/comments/${encodeURIComponent(cid)}`,
            `/api/comments/${encodeURIComponent(cid)}`,
            `/api/community/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(cid)}`,
        ];

        for (const url of tryUrls) {
            try {
                const res = await secureFetch(url, { method: 'DELETE', credentials: 'include' });
                if (res.ok) {
                    setRefreshTick((k) => k + 1);
                    return;
                }
            } catch {
                /* try next */
            }
        }
    }

    const confirmCommentDelete = useCallback(async () => {
        if (!commentDeleteConfirm.commentId) return;
        const wasReply = commentDeleteConfirm.isReply;
        await deleteComment(commentDeleteConfirm.commentId);
        closeCommentDeleteConfirm();
        showSuccess(wasReply ? 'Reply deleted successfully' : 'Comment deleted successfully');
    }, [commentDeleteConfirm.commentId, commentDeleteConfirm.isReply, closeCommentDeleteConfirm, showSuccess]);

    const viewerPersonalAvatarUrl = (() => {
        const raw = viewer?.avatar_url || viewer?.profile_picture || '';
        if (!raw || raw.includes('default_avatar')) return '';
        return raw;
    })();
    const viewerPersonalLabel = `${viewer?.first_name || ''} ${viewer?.last_name || ''}`.trim() || 'You';

    const { isBusinessAccount: isBA, isArtistAccount: isAA, activeBusinessId: aBizId, activeArtistId: aArtId, activeAccount: acctObj } = useActiveAccount();

    // ── Fetch active account avatar + profile_type when not in context ──
    // For artist accounts we always fetch so profile_type is authoritative
    // (mirrors ArtistAdminConsole). Business accounts can short-circuit.
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
                // Patch localStorage so Header + other consumers see the
                // right value. Overwrite unconditionally (last-writer-wins)
                // so stale values from before this migration get corrected.
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
    // artist). Fetched value from /api/music/artists/:id is authoritative —
    // mirrors ArtistAdminConsole. Falls back to context, then localStorage.
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

    const likeComment = async (commentId, currentLiked, setLiked, setLikes) => {
        if (!viewer) return openLogin();
        const paths = [
            `/api/community/comments/${encodeURIComponent(commentId)}/like`,
            `/api/comments/${encodeURIComponent(commentId)}/like`,
        ];
        // Read active account from localStorage to avoid stale closure values
        const freshAcct = (() => {
            try {
                const raw = localStorage.getItem('ll:activeAccount');
                if (!raw) return null;
                return JSON.parse(raw);
            } catch { return null; }
        })();
        const freshType = String(freshAcct?.type || '').toLowerCase();
        const likeBody = {
            ...(freshType === 'business' && freshAcct?.id ? { business_id: freshAcct.id } : {}),
            ...(freshType === 'artist' && freshAcct?.id ? { artist_id: freshAcct.id } : {}),
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
                    setLiked(Boolean(data.liked));
                    setLikes(Number(data.likes || 0));
                    return;
                }
            } catch {
                /* try next */
            }
        }
        setLiked(!currentLiked);
        setLikes((n) => Math.max(0, n + (currentLiked ? -1 : 1)));
    };

    // ── Tree manipulation helpers (optimistic reply insertion) ──
    const addReplyToTree = (currentThreads, parentId, newReply) => {
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
    };

    const removeCommentFromTree = (currentThreads, commentId) => {
        const filterNode = (node) => {
            if (String(node.id) === String(commentId)) return null;
            if (node.replies && node.replies.length > 0) {
                return { ...node, replies: node.replies.map(filterNode).filter(Boolean) };
            }
            return node;
        };
        return currentThreads.map(filterNode).filter(Boolean);
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
        const freshAcct = (() => {
            try {
                const raw = localStorage.getItem('ll:activeAccount');
                if (!raw) return null;
                return JSON.parse(raw);
            } catch { return null; }
        })();
        const freshType = String(freshAcct?.type || '').toLowerCase();
        const freshIsBiz = freshType === 'business' && freshAcct?.id;
        const freshIsArt = freshType === 'artist' && freshAcct?.id;

        const freshHandle = freshIsBiz
            ? (freshAcct.slug || freshAcct.handle || '')
            : freshIsArt
                ? (freshAcct.handle || '')
                : (viewer?.handle || '');

        // Build optimistic reply
        const optimisticReply = {
            id: `temp_reply_${Date.now()}`,
            parentId: parentId,
            parent_id: parentId,
            user_id: viewer?.id || null,
            public_id: viewer?.public_id || null,
            text: cleaned,
            content: cleaned,
            first_name: (freshIsBiz || freshIsArt)
                ? (freshAcct?.name || '').split(' ')[0] || viewer?.first_name || ''
                : viewer?.first_name || '',
            last_name: (freshIsBiz || freshIsArt)
                ? (freshAcct?.name || '').split(' ').slice(1).join(' ')
                : viewer?.last_name || '',
            handle: freshHandle,
            avatar: viewerAvatarUrl,
            avatar_url: viewerAvatarUrl,
            created_at: new Date().toISOString(),
            likes: 0,
            viewer_liked: false,
            viewer_flagged: false,
            reply_count: 0,
            is_removed: false,
            is_pinned: false,
            replies: [],
            images: replyUrlList.length > 0 ? [...replyUrlList] : [],
            ...(freshIsBiz ? {
                business_id: freshAcct.id,
                business_name: freshAcct.name || acctObj?.name || '',
                business_slug: freshAcct.slug || freshAcct.handle || '',
                business_avatar_url: freshAcct.avatar_url || freshAcct.logo_url || '',
                account_type: 'business',
                account_name: freshAcct.name || acctObj?.name || '',
                account_handle: freshAcct.slug || freshAcct.handle || '',
                account_avatar_url: freshAcct.avatar_url || freshAcct.logo_url || '',
            } : {}),
            ...(freshIsArt ? {
                artist_id: freshAcct.id,
                artist_name: freshAcct.name || acctObj?.name || '',
                artist_handle: freshAcct.handle || '',
                artist_avatar_url: freshAcct.avatar_url || '',
                account_type: 'artist',
                account_name: freshAcct.name || acctObj?.name || '',
                account_handle: freshAcct.handle || '',
                account_avatar_url: freshAcct.avatar_url || '',
            } : {}),
        };

        // Optimistically insert into tree (no scroll, no re-fetch)
        setThreads((prev) => addReplyToTree(prev, parentId, optimisticReply));
        onDone?.();
        recordReply();

        const payload = {
            text: cleaned,
            content: cleaned,
            parent_id: parentId,
            ...(freshIsBiz ? {
                business_id: freshAcct.id,
                account_type: 'business',
                account_id: freshAcct.id,
                account_handle: freshAcct.slug || freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAcct.avatar_url || freshAcct.logo_url || '',
            } : {}),
            ...(freshIsArt ? {
                artist_id: freshAcct.id,
                account_type: 'artist',
                account_id: freshAcct.id,
                account_handle: freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAcct.avatar_url || '',
            } : {}),
        };
        // Build account headers for backend identity detection
        const replyAcctHeaders = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        const urls = [
            `/api/community/${encodeURIComponent(postId)}/comments`,
            `/api/posts/${encodeURIComponent(postId)}/comments`,
        ];

        const hasFileUploads = replyFileList.length > 0;

        for (const url of urls) {
            try {
                let fetchOpts;
                if (hasFileUploads) {
                    const fd = new FormData();
                    if (cleaned) { fd.append('content', cleaned); fd.append('text', cleaned); }
                    fd.append('parent_id', String(parentId));
                    if (freshIsBiz) fd.append('business_id', String(freshAcct.id));
                    if (freshIsArt) fd.append('artist_id', String(freshAcct.id));
                    for (const file of replyFileList) fd.append('images', file);
                    if (replyUrlList.length > 0) {
                        fd.append('image_urls', JSON.stringify(replyUrlList));
                    }
                    fetchOpts = {
                        method: 'POST',
                        credentials: 'include',
                        headers: { ...replyAcctHeaders },
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
                        headers: { 'Content-Type': 'application/json', ...replyAcctHeaders },
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
                    return;
                }
            } catch {}
        }
        // If all endpoints fail, remove the optimistic reply
        setThreads((prev) => removeCommentFromTree(prev, optimisticReply.id));
    };

    const [flagState, setFlagState] = useState({ open: false, commentId: null });

    const openFlag = (commentId) => {
        if (!viewer) return openLogin();
        setFlagState({ open: true, commentId });
    };
    const closeFlag = () => setFlagState({ open: false, commentId: null });

    const submitFlag = async ({ reason, details }) => {
        const commentId = flagState.commentId;
        if (!commentId) return closeFlag();

        // Include active account info so the report is tracked under the correct identity
        const body = { reason, details };
        if (isBA && aBizId) {
            body.activeBusinessId = aBizId;
        } else if (isAA && aArtId) {
            body.activeArtistId = aArtId;
        }

        const urls = [
            `/api/community/comments/${encodeURIComponent(commentId)}/flag`,
            `/api/comments/${encodeURIComponent(commentId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    setRefreshTick((k) => k + 1);
                    break;
                }
            } catch {}
        }
        // Don't close — FlagCommentDialog shows confirmation; user clicks Done to close.
    };

    const sortedThreads = useMemo(() => {
        const arr = [...threads];
        arr.sort((a, b) => {
            const ap = a.is_pinned ? 1 : 0;
            const bp = b.is_pinned ? 1 : 0;
            if (bp !== ap) return bp - ap;
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

    const visibleThreads = sortedThreads.slice(0, visibleCount);
    const canLoadMore = sortedThreads.length > visibleThreads.length;

    // Group consecutive blocked top-level comments into collapsed rows
    const groupedThreads = useMemo(
        () => groupBlockedTopLevel(visibleThreads, blockedUserIds, blockedHandles, blockedBusinessIds, blockedArtistIds),
        [visibleThreads, blockedUserIds, blockedHandles, blockedBusinessIds, blockedArtistIds]
    );

    // Render a single ThreadedCommentItem with standard props
    const renderSingleComment = (t, { forceShowBlocked = false } = {}) => {
        const isNew = newCommentIds.has(String(t.id));
        const item = (
            <ThreadedCommentItem
                key={t.id}
                node={t}
                depth={0}
                expanded={expanded}
                setExpanded={setExpanded}
                viewerAvatarUrl={viewerAvatarUrl}
                viewerLabel={viewerLabel}
                viewerId={viewer?.id}
                postAuthor={postAuthor}
                groupRoleMap={groupRoleMap}
                highlightedCommentId={highlightedCommentId}
                highlightedCommentIds={highlightedCommentIds}
                onOpenUserCard={onOpenUserCard}
                likeComment={likeComment}
                submitReply={submitReply}
                openFlag={openFlag}
                onRequestDelete={requestCommentDelete}
                onRequestTogglePin={requestTogglePin}
                canPinComment={canPinComment}
                blockedUserIds={blockedUserIds}
                blockedBusinessIds={blockedBusinessIds}
                blockedArtistIds={blockedArtistIds}
                blockedHandles={blockedHandles}
                onShareComment={handleShareComment}
                onScrollToComment={scrollToComment}
                forceShowBlocked={forceShowBlocked}
                postId={postId}
                onCopyLinkToast={onCopyLinkToast}
                groupCommentGated={groupCommentGated}
                post={post}
            />
        );
        return isNew
            ? <Box key={`fade-${t.id}`} sx={NEW_COMMENT_FADE_SX}>{item}</Box>
            : item;
    };

    const INDENT_PX = 24;
    const SAFE_DEPTH_BEFORE_SCROLL = 6;
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
        <>
            <Box id="comments-anchor" sx={{ mt: 2 }}>
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

                <Box sx={{ overflowX: 'auto', overflowY: 'visible', pb: 1, px: { xs: 1, sm: 1.25 } }}>

                    <Box sx={{ minWidth: extraWidthPx ? `calc(100% + ${extraWidthPx}px)` : '100%' }}>
                        {commentsLoading ? (
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
                                                    Math.min(c + initialPageSize, sortedThreads.length)
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
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                                    No comments yet. Be the first!
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

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
            </Box>

            <Dialog
                open={commentDeleteConfirm.open}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                    closeCommentDeleteConfirm();
                }}
                PaperProps={{ sx: { borderRadius: 3 } }}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ pr: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        Delete {commentDeleteConfirm.isReply ? 'reply' : 'comment'}?
                    </Typography>
                    <IconButton
                        aria-label="Close"
                        onClick={closeCommentDeleteConfirm}
                        size="small"
                        sx={{ width: 36, height: 36 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary">
                        {commentDeleteConfirm.isReply
                            ? 'This reply will be permanently deleted.'
                            : 'This comment and all replies under it will be permanently deleted.'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2, py: 1.5 }}>
                    <Button onClick={closeCommentDeleteConfirm} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmCommentDelete}
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

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
            />

            {/* ── Comment action confirmation snackbar ── */}
            <SuccessSnackbar {...successSnackbarProps} />
        </>
    );
}

/* ========================================================================== */
/* Main PostPage                                                              */
/* ========================================================================== */
function PostPage({ embedded = false, post: initialPost = null, user: initialUser = null }) {
    const auth = useAuth();
    const params = useParams();
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount } = useActiveAccount();
    const isNonPersonal = isBusinessAccount || isArtistAccount;
    const chromeTop = useChromeTop();

    // ── Post-level success confirmation snackbar (edit/delete) ──
    const { showSuccess: showPostSuccess, snackbarProps: postSnackbarProps } = useSuccessSnackbar();

    // Persist PostPage scroll so if auth redirects happen (login/register), we can return to the exact reading spot.
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const onScroll = () => {
            try {
                sessionStorage.setItem('ll:post:scrollY', String(window.scrollY || 0));
            } catch {
                // ignore
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    const routeId = params?.id ?? params?.postId ?? params?.post_id ?? params?.postID ?? null;
    const location = useLocation();
    const navigate = useNavigate();
    // Support ?comment=ID deep links (from copy-link and share dialogs)
    const _urlCommentId = useMemo(() => {
        try {
            const sp = new URLSearchParams(location?.search || '');
            return sp.get('comment') || null;
        } catch { return null; }
    }, [location?.search]);
    const deepLinkCommentId = location?.state?.scrollToCommentId ?? location?.state?.highlightCommentId ?? _urlCommentId ?? null;
    // Serialize array to a stable string so useMemo doesn't re-compute on every render
    // when React Router creates a new location.state reference with the same values.
    const _highlightIdsRaw = location?.state?.highlightCommentIds;
    const _highlightIdsKey = Array.isArray(_highlightIdsRaw) && _highlightIdsRaw.length
        ? _highlightIdsRaw.map(String).join(',')
        : '';
    const deepLinkCommentIds = useMemo(() => {
        return _highlightIdsKey ? new Set(_highlightIdsKey.split(',')) : null;
    }, [_highlightIdsKey]);

    const statePost = location?.state?.post || null;

    const _groupContextRaw = location?.state?.groupContext || null;
    const _stateGroupId = location?.state?.groupId ?? null;
    const _stateGroupName = location?.state?.groupName ?? '';
    const initialGroupCtx = useMemo(() => {
        const gc = _groupContextRaw;
        const gid = gc?.id ?? _stateGroupId ?? null;
        const gname = gc?.name ?? _stateGroupName ?? '';
        const avatarUrl =
            gc?.avatarUrl ||
            gc?.image_url ||
            gc?.imageUrl ||
            gc?.photo_url ||
            gc?.group_photo_url ||
            '';
        const visRaw = String(gc?.visibility || '').trim().toLowerCase();
        const isPrivate = Boolean(gc?.isPrivate ?? gc?.is_private) || (visRaw && visRaw !== 'public');
        return {
            id: gid != null ? Number(gid) : null,
            name: String(gname || ''),
            avatarUrl: String(avatarUrl || ''),
            isPrivate,
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_stateGroupId, _stateGroupName]);

    const [groupCtx, setGroupCtx] = useState(initialGroupCtx);

    const isGroupContext = useMemo(() => Boolean(groupCtx?.id), [groupCtx?.id]);

    // Track the group's pinned post ID to determine if current post is pinned
    const [groupPinnedPostId, setGroupPinnedPostId] = useState(null);

    const [groupRoleMap, setGroupRoleMap] = useState(() => ({}));

    // ── Group membership gating for comments ──
    const [groupMembership, setGroupMembership] = useState(null); // null = unknown, object = fetched
    const [groupMembershipLoading, setGroupMembershipLoading] = useState(false);
    const [groupRulesOpen, setGroupRulesOpen] = useState(false);
    const [groupRulesHtml, setGroupRulesHtml] = useState('');
    const [groupJoining, setGroupJoining] = useState(false);
    const [groupJoinError, setGroupJoinError] = useState('');

    // Fetch viewer's membership status when viewing a group post
    useEffect(() => {
        if (!isGroupContext || !groupCtx?.id) {
            setGroupMembership(null);
            return;
        }

        let cancelled = false;
        setGroupMembershipLoading(true);

        (async () => {
            try {
                const res = await secureFetch(`/api/groups/${encodeURIComponent(String(groupCtx.id))}`, { credentials: 'include' });
                const data = await res.json().catch(() => null);
                const g = data?.group || data || null;
                const vm = data?.viewerMembership || null;

                if (!cancelled) {
                    setGroupMembership({
                        isMember: Boolean(vm && String(vm.status || '').toLowerCase() === 'joined' && !vm.is_banned),
                        status: String(vm?.status || '').toLowerCase(),
                        role: String(vm?.role || '').toLowerCase(),
                        rulesHtml: String(g?.rules_html || g?.rulesHtml || '').trim(),
                        groupName: String(g?.name || '').trim(),
                        visibility: String(g?.visibility || '').toLowerCase(),
                    });
                }
            } catch {
                if (!cancelled) setGroupMembership(null);
            } finally {
                if (!cancelled) setGroupMembershipLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isGroupContext, groupCtx?.id]);

    const isGroupMember = Boolean(groupMembership?.isMember);

    // Handle "Join to comment" button click — check rules first
    const handleJoinToComment = useCallback(async () => {
        if (!groupCtx?.id) return;

        const rules = groupMembership?.rulesHtml || '';
        if (rules) {
            setGroupRulesHtml(rules);
            setGroupRulesOpen(true);
            setGroupJoinError('');
            return;
        }

        // No rules — join immediately
        setGroupJoining(true);
        setGroupJoinError('');
        try {
            const res = await secureFetch(`/api/groups/${encodeURIComponent(String(groupCtx.id))}/join`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => ({}));
            const status = String(data?.status || data?.membership?.status || '').toLowerCase();

            setGroupMembership((prev) => ({
                ...(prev || {}),
                isMember: status === 'joined',
                status: status || 'joined',
            }));
        } catch (err) {
            setGroupJoinError(err?.message || 'Unable to join group.');
        } finally {
            setGroupJoining(false);
        }
    }, [groupCtx?.id, groupMembership?.rulesHtml]);

    // Handle accepting rules and joining
    const handleAcceptRulesAndJoin = useCallback(async () => {
        if (!groupCtx?.id) return;

        setGroupJoining(true);
        setGroupJoinError('');
        try {
            const res = await secureFetch(`/api/groups/${encodeURIComponent(String(groupCtx.id))}/join`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await res.json().catch(() => ({}));
            const status = String(data?.status || data?.membership?.status || '').toLowerCase();

            setGroupMembership((prev) => ({
                ...(prev || {}),
                isMember: status === 'joined',
                status: status || 'joined',
            }));
            setGroupRulesOpen(false);
            setGroupRulesHtml('');
        } catch (err) {
            setGroupJoinError(err?.message || 'Unable to join group.');
        } finally {
            setGroupJoining(false);
        }
    }, [groupCtx?.id]);

    const mergeGroupRoleMap = useCallback((nextMap) => {
        const incoming = nextMap && typeof nextMap === 'object' ? nextMap : {};
        setGroupRoleMap((prev) => ({ ...(prev || {}), ...incoming }));
    }, []);

    // If we have a group id but missing details (name/avatar/privacy), fetch group details for a clean "Posted in ..." label.
    useEffect(() => {
        let cancelled = false;

        const gid = groupCtx?.id ?? null;
        const hasName = Boolean(groupCtx?.name && String(groupCtx.name).trim());
        const hasAvatar = Boolean(groupCtx?.avatarUrl && String(groupCtx.avatarUrl).trim());
        const hasPrivacy = typeof groupCtx?.isPrivate === 'boolean';
        if (!gid || (hasName && hasAvatar && hasPrivacy)) return undefined;

        (async () => {
            try {
                const res = await secureFetch(`/api/groups/${encodeURIComponent(String(gid))}`, { credentials: 'include' });
                const data = await res.json().catch(() => null);
                const g = data?.group || data || null;
                if (!g) return;

                const name = String(g?.name || groupCtx?.name || '').trim();
                const avatarUrl = String(
                    g?.image_url || g?.photo_url || g?.group_photo_url || g?.icon_url || groupCtx?.avatarUrl || ''
                ).trim();
                const vis = String(g?.visibility || '').trim().toLowerCase();
                const isPrivate = vis ? vis !== 'public' : Boolean(groupCtx?.isPrivate);

                if (!cancelled) {
                    setGroupCtx({ id: gid, name, avatarUrl, isPrivate });
                }
            } catch {
                // ignore
            }
            return null;
        })();

        return () => {
            cancelled = true;
        };
    }, [groupCtx?.id, groupCtx?.name, groupCtx?.avatarUrl, groupCtx?.isPrivate]);

    // Fetch the group's pinned post ID to determine if current post is pinned
    useEffect(() => {
        if (!isGroupContext || !groupCtx?.id) {
            setGroupPinnedPostId(null);
            return;
        }

        let cancelled = false;
        const gid = groupCtx.id;

        (async () => {
            try {
                const res = await secureFetch(`/api/groups/${encodeURIComponent(String(gid))}/pinned-posts`, {
                    credentials: 'include',
                });
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                const posts = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : [];
                const pinnedId = posts.length > 0 ? (posts[0]?.id ?? posts[0]?.post_id ?? null) : null;
                if (!cancelled) {
                    setGroupPinnedPostId(pinnedId != null ? Number(pinnedId) : null);
                }
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isGroupContext, groupCtx?.id]);

    const _stateFrom = location?.state?.from;
    const _stateFromSocial = location?.state?.fromSocial;
    useEffect(() => {
        if (_stateFrom === 'social' || _stateFromSocial === true) {
            try {
                sessionStorage.setItem('ll:social:restore_intent', '1');
            } catch {
                // ignore
            }
        }
    }, [_stateFrom, _stateFromSocial]);

    // ---- All hooks are declared BEFORE any early returns ----
    const [post, setPost] = useState(initialPost || statePost);
    const [postLoading, setPostLoading] = useState(!initialPost && !statePost);
    const [loadError, setLoadError] = useState(null);
    const [viewer, setViewer] = useState(initialUser);
    const [shareOpen, setShareOpen] = useState(false);
    const [pageVisible, setPageVisible] = useState(false);

    // ── Blocked / hidden post gate ──
    const gate = useBlockedPostGate({ post, user: viewer, contentType: 'post' });

    // If we navigated here without explicit groupContext (e.g. from a user profile),
    // hydrate the group context from the loaded post payload so the "Posted in ..." chip is consistent.
    const _postGroupId = post?.group_id ?? post?.groupId ?? post?.groupID ?? post?.community_group_id ?? post?.communityGroupId ?? null;
    const _postGroupName = post?.group_name ?? post?.groupName ?? post?.groupTitle ?? '';
    const _postGroupImage = post?.group_image_url ?? post?.groupImageUrl ?? post?.groupAvatarUrl ?? '';
    useEffect(() => {
        const gidRaw = _postGroupId;
        const gid = gidRaw != null && String(gidRaw).trim() !== '' ? Number(gidRaw) : null;
        if (!gid || Number.isNaN(gid)) return;

        const name = String(_postGroupName || '').trim();
        const avatarUrl = String(_postGroupImage || '').trim();

        setGroupCtx((prev) => {
            const prevId = prev?.id != null ? Number(prev.id) : null;
            if (prevId === gid) {
                const nextName = name || prev?.name || '';
                const nextAvatar = avatarUrl || prev?.avatarUrl || '';
                const nextIsPrivate = typeof prev?.isPrivate === 'boolean' ? prev.isPrivate : false;
                // Avoid unnecessary state updates.
                if (nextName === (prev?.name || '') && nextAvatar === (prev?.avatarUrl || '') && nextIsPrivate === prev?.isPrivate) {
                    return prev;
                }
                return { id: gid, name: nextName, avatarUrl: nextAvatar, isPrivate: nextIsPrivate };
            }

            return {
                id: gid,
                name: name || '',
                avatarUrl: avatarUrl || '',
                isPrivate: typeof prev?.isPrivate === 'boolean' ? prev.isPrivate : false,
            };
        });
    }, [_postGroupId, _postGroupName, _postGroupImage]);

    // If this page is opened directly with a route that doesn't provide an :id param,
    // avoid getting stuck in a perpetual postLoading state.
    useEffect(() => {
        if (embedded) return;
        if (!routeId && !initialPost && !statePost) {
            setPostLoading(false);
            setPost(null);
        }
    }, [embedded, routeId, initialPost, statePost]);

    const reloadPost = useCallback(
        async ({ showSpinner = false } = {}) => {
            const id = post?.id || routeId;
            if (!id) return null;

            if (showSpinner) setPostLoading(true);

            let out = null;

            try {
                const qp = new URLSearchParams();
                if (activeBusinessId) qp.set('activeBusinessId', activeBusinessId);
                else if (activeArtistId) qp.set('activeArtistId', activeArtistId);
                const qs = qp.toString() ? `?${qp.toString()}` : '';

                let res = await secureFetch(`/api/community/${encodeURIComponent(id)}${qs}`, {
                    credentials: 'include',
                    cache: 'no-store',
                });

                if (!res.ok) {
                    const res2 = await secureFetch(`/api/community/posts/${encodeURIComponent(id)}${qs}`, {
                        credentials: 'include',
                        cache: 'no-store',
                    });
                    if (res2.ok) res = res2;
                }

                if (!res.ok) {
                    // Handle private-group 404: redirect straight to the group page
                    const errData = await res.json().catch(() => null);
                    if (errData?.group_private && errData?.group_id) {
                        navigate(
                            `/groups/${encodeURIComponent(String(errData.group_id))}`,
                            { replace: true, state: { restoreGroupPage: true } },
                        );
                        return null;
                    }
                    setPostLoading(false);
                    return null;
                }

                const data = await res.json().catch(() => null);
                const normalized = Array.isArray(data) ? data[0] : data;

                if (normalized && typeof normalized === 'object') {
                    out = normalized;
                    setPost(normalized);
                    setLoadError(null);
                }
            } catch (err) {
                setLoadError(err);
            } finally {
                if (showSpinner) setPostLoading(false);
            }

            return out;
        },
        [routeId, post?.id, activeBusinessId, activeArtistId, navigate]
    );

    const didInitialLoadRef = useRef(false);

    useEffect(() => {
        if (embedded) return;
        if (didInitialLoadRef.current) return;

        // When navigating here from places like the profile feed, location.state may contain a partial post.
        // Fetch the canonical post payload once so group-linked posts can render the same "Posted in <Group>" header.
        didInitialLoadRef.current = true;
        void reloadPost({ showSpinner: false });
    }, [embedded, reloadPost]);

    // ── Moderation guard ──
    // After the post loads, check if the current account has blocked or hidden the post author.
    // Instead of redirecting, show a message with a "View Post" button.
    // moderationChecked gates all post rendering so the content never flashes.
    const didModerationCheckRef = useRef(false);
    const [moderationBlock, setModerationBlock] = useState(null);
    const [moderationChecked, setModerationChecked] = useState(embedded);
    useEffect(() => {
        if (embedded) return;
        const authorUid = Number(post?.user_id ?? post?.author_id ?? post?.uid ?? 0);
        // Don't mark as checked yet — wait for post to load with a real user_id
        if (!authorUid) return;
        if (didModerationCheckRef.current) return;

        let cancelled = false;
        (async () => {
            try {
                const acctHeaders = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();
                const res = await secureFetch('/api/users/moderation-state', {
                    credentials: 'include',
                    headers: { Accept: 'application/json', ...acctHeaders },
                });
                if (!res.ok || cancelled) { if (!cancelled) { didModerationCheckRef.current = true; setModerationChecked(true); } return; }
                const data = await res.json();
                if (cancelled) return;

                const blocked = Array.isArray(data?.blocked_user_ids) ? data.blocked_user_ids : [];
                const hiddenUsers = Array.isArray(data?.hidden_user_ids) ? data.hidden_user_ids : [];
                const hiddenPosts = Array.isArray(data?.hidden_post_user_ids) ? data.hidden_post_user_ids : [];

                const isAuthorBlocked = blocked.includes(authorUid) || blocked.includes(String(authorUid));
                const isAuthorHidden = hiddenUsers.includes(authorUid) || hiddenUsers.includes(String(authorUid))
                    || hiddenPosts.includes(authorUid) || hiddenPosts.includes(String(authorUid));

                if (isAuthorBlocked || isAuthorHidden) {
                    const authorName = `${post?.first_name || ''} ${post?.last_name || ''}`.trim() || 'this user';
                    const reason = isAuthorBlocked ? 'blocked' : 'hidden posts from';
                    if (!cancelled) setModerationBlock({ authorName, reason });
                }
            } catch {
                // If moderation check fails, don't block the page — just let the post render
            }
            if (!cancelled) {
                didModerationCheckRef.current = true;
                setModerationChecked(true);
            }
        })();

        return () => { cancelled = true; };
    }, [embedded, post?.user_id, post?.author_id, post?.uid, post?.first_name, post?.last_name]);

// Shared user card popover state (author + commenters)
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    // comment composer + refresh hook for comment list
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

    // Rate limiting for top-level comments
    const { checkLimit: checkCommentLimit, recordAction: recordComment } = useRateLimit('comment', { burstMax: 3, burstWindowMs: 10_000, maxPerHour: 60 });
    const [commentRateLimitOpen, setCommentRateLimitOpen] = useState(false);
    const [commentRateLimitInfo, setCommentRateLimitInfo] = useState({ retryAfterSec: 10, reason: 'cooldown' });

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

    // Dismiss comment mention dropdown on scroll
    useEffect(() => {
        if (!commentMention.open) return;
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

    useEffect(() => {
        if (!commentMention.open || !commentMention.query) return undefined;

        setCommentMentionLoading(true);
        const ctrl = new AbortController();

        const t = window.setTimeout(async () => {
            try {
                const res = await secureFetch(`/api/community/users/search?q=${encodeURIComponent(commentMention.query)}`, {
                    credentials: 'include',
                    signal: ctrl.signal,
                    cache: 'no-store',
                });

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
                // ignore
            } finally {
                setCommentMentionLoading(false);
            }
        }, 180);

        return () => {
            window.clearTimeout(t);
            ctrl.abort();
        };
    }, [commentMention.open, commentMention.query]);

    const [posting, setPosting] = useState(false);
    const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
    const forceRefreshComments = () => setCommentsRefreshKey((k) => k + 1);
    const addCommentRef = useRef(null);

    // Refetch post + comments when the active account changes
    const prevPostAcctRef = useRef({ activeBusinessId, activeArtistId });
    useEffect(() => {
        const prev = prevPostAcctRef.current;
        prevPostAcctRef.current = { activeBusinessId, activeArtistId };
        if (prev.activeBusinessId !== activeBusinessId || prev.activeArtistId !== activeArtistId) {
            reloadPost({ showSpinner: false });
            forceRefreshComments();
        }
    }, [activeBusinessId, activeArtistId, reloadPost]);

    // Description clamp (prevents a single long token from breaking layout)
    const [showFullDescription, setShowFullDescription] = useState(false);
    useEffect(() => {
        setShowFullDescription(false);
    }, [post?.id]);

// owner action dialogs (edit/delete/mark found/history)
    const [editOpen, setEditOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Owner actions menu (Edit/Delete)
    const [ownerMenuEl, setOwnerMenuEl] = useState(null);
    const ownerMenuOpen = Boolean(ownerMenuEl);
    const openOwnerMenu = useCallback((e) => {
        if (e) e.stopPropagation();
        setOwnerMenuEl(e.currentTarget);
    }, []);
    const closeOwnerMenu = useCallback((e) => {
        if (e) e.stopPropagation();
        setOwnerMenuEl(null);
    }, []);

    // Report dialog and copy link state
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [copyLinkToast, setCopyLinkToast] = useState(false);

    const handleCopyPostLink = useCallback((e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const pid = routeId || post?.id || '';
        const postUrl = `${window.location.origin}/posts/${pid}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            setCopyLinkToast(true);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = postUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopyLinkToast(true);
        });
    }, [closeOwnerMenu, routeId, post?.id]);

    const handleReportMenuClick = useCallback((e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        setReportDialogOpen(true);
    }, [closeOwnerMenu]);

    const submitPostReport = useCallback(async ({ reason, details }) => {
        const pid = routeId || post?.id;
        if (!pid) return;
        const urls = [
            `/api/posts/${encodeURIComponent(pid)}/flag`,
            `/api/community/${encodeURIComponent(pid)}/flag`,
            `/api/community/posts/${encodeURIComponent(pid)}/flag`,
        ];
        // Include active account info so the report is tracked under the correct identity
        const body = { reason, details };
        if (isBusinessAccount && activeBusinessId) {
            body.activeBusinessId = activeBusinessId;
        } else if (isArtistAccount && activeArtistId) {
            body.activeArtistId = activeArtistId;
        }
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
                if (res.ok) return;
            } catch {
                // try next
            }
        }
    }, [routeId, post?.id, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    // Group pin/unpin (owner/admin of the group)
    const [pinDialogOpen, setPinDialogOpen] = useState(false);
    const [pinSaving, setPinSaving] = useState(false);
    const [pinError, setPinError] = useState('');

    const [markFoundOpen, setMarkFoundOpen] = useState(false);
    const [markFoundPostId, setMarkFoundPostId] = useState(null);
    const [markFoundMessage, setMarkFoundMessage] = useState('');
    const [markFoundSaving, setMarkFoundSaving] = useState(false);
    const [markFoundError, setMarkFoundError] = useState('');

    const [markResolvedOpen, setMarkResolvedOpen] = useState(false);
    const [markResolvedPostId, setMarkResolvedPostId] = useState(null);
    const [markResolvedMessage, setMarkResolvedMessage] = useState('');
    const [markResolvedSaving, setMarkResolvedSaving] = useState(false);
    const [markResolvedError, setMarkResolvedError] = useState('');


    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyPostId, setHistoryPostId] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');
    const [historyRows, setHistoryRows] = useState([]);
    // Dialog helpers (edit / delete / mark found / history)
    const openEditDialog = useCallback(() => {
        if (!post?.id) return;
        setEditOpen(true);
    }, [post?.id]);

    const openDeleteDialog = useCallback(() => {
        if (!post?.id) return;
        setDeleteConfirmOpen(true);
    }, [post?.id]);


// Helpers (avoid TDZ errors: canPinInGroup / isPinnedInGroup are declared later)
    const computeCanPinInGroup = useCallback(() => {
        try {
            if (!isGroupContext) return false;
            const viewerUser0 = viewer?.user || viewer || null;
            const vid = viewerUser0?.id != null ? String(viewerUser0.id) : '';
            if (!vid) return false;
            const role = groupRoleMap?.[String(vid)] || '';
            const norm = String(role || '').trim().toLowerCase();
            return norm === 'owner' || norm === 'admin';
        } catch {
            return false;
        }
    }, [isGroupContext, viewer, groupRoleMap]);

    const computeIsPinnedInGroup = useCallback(() => {
        try {
            // First check if post data includes is_pinned
            const fromPost = Boolean(Number(
                post?.is_pinned ?? post?.isPinned ?? post?.group_is_pinned ?? post?.groupIsPinned ?? post?.groupPinned ?? post?.pinned ?? 0
            ));
            if (fromPost) return true;

            // Fallback: check if current post ID matches the group's pinned post ID
            if (groupPinnedPostId != null && post?.id != null) {
                return Number(post.id) === Number(groupPinnedPostId);
            }

            return false;
        } catch {
            return false;
        }
    }, [post, groupPinnedPostId]);

    const openGroupPinDialog = useCallback(
        (e) => {
            if (e) e.stopPropagation();
            if (!computeCanPinInGroup() || !post?.id || !groupCtx?.id) return;
            setPinError('');
            setPinSaving(false);
            setPinDialogOpen(true);
        },
        [computeCanPinInGroup, post?.id, groupCtx?.id]
    );

    const closeGroupPinDialog = useCallback((e) => {
        if (e) e.stopPropagation();
        if (pinSaving) return;
        setPinDialogOpen(false);
        setPinError('');
        setPinSaving(false);
    }, [pinSaving]);

    const submitGroupPinToggle = useCallback(async () => {
        const gid = groupCtx?.id != null ? String(groupCtx.id) : '';
        const pid = post?.id != null ? String(post.id) : '';
        if (!gid || !pid) return;

        setPinSaving(true);
        setPinError('');
        const currentlyPinned = computeIsPinnedInGroup();
        const wantsPin = !currentlyPinned;
        const action = wantsPin ? 'pin' : 'unpin';

        const urls = [
            `${api}/groups/${encodeURIComponent(gid)}/admin/posts/${encodeURIComponent(pid)}/${action}`,
            `/api/groups/${encodeURIComponent(gid)}/admin/posts/${encodeURIComponent(pid)}/${action}`,
            `/groups/${encodeURIComponent(gid)}/admin/posts/${encodeURIComponent(pid)}/${action}`,

            // Some routers may expose explicit endpoints
            `${api}/groups/${encodeURIComponent(gid)}/admin/posts/${encodeURIComponent(pid)}/${action === 'pin' ? 'pin' : 'unpin'}`,
            `/api/groups/${encodeURIComponent(gid)}/admin/posts/${encodeURIComponent(pid)}/${action === 'pin' ? 'pin' : 'unpin'}`,
            `/groups/${encodeURIComponent(gid)}/admin/posts/${encodeURIComponent(pid)}/${action === 'pin' ? 'pin' : 'unpin'}`,

            // Legacy "pin" route that accepts { pinned: true|false }
            `${api}/groups/${encodeURIComponent(gid)}/posts/${encodeURIComponent(pid)}/pin`,
            `/api/groups/${encodeURIComponent(gid)}/posts/${encodeURIComponent(pid)}/pin`,
            `/groups/${encodeURIComponent(gid)}/posts/${encodeURIComponent(pid)}/pin`,
        ].filter(Boolean);

        let ok = false;
        for (let i = 0; i < urls.length; i += 1) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const res = await secureFetch(urls[i], {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinned: wantsPin }),
                });
                if (res.ok) {
                    ok = true;
                    break;
                }
            } catch {
                // try next
            }
        }

        if (!ok) {
            setPinSaving(false);
            setPinError('Unable to update pinned status. Please try again.');
            return;
        }

        setPinSaving(false);
        setPinDialogOpen(false);

        // Optimistically update groupPinnedPostId
        if (wantsPin) {
            setGroupPinnedPostId(Number(pid));
        } else {
            setGroupPinnedPostId(null);
        }

        void reloadPost({ showSpinner: false });
    }, [api, groupCtx?.id, post, computeIsPinnedInGroup, reloadPost]);

    const openMarkFoundDialog = useCallback(() => {
        if (!post?.id) return;
        setMarkFoundPostId(Number(post.id));
        setMarkFoundMessage('');
        setMarkFoundError('');
        setMarkFoundSaving(false);
        setMarkFoundOpen(true);
    }, [post?.id]);

    const closeMarkFoundDialog = useCallback(() => {
        setMarkFoundOpen(false);
        setMarkFoundPostId(null);
        setMarkFoundMessage('');
        setMarkFoundError('');
        setMarkFoundSaving(false);
    }, []);

    const openMarkResolvedDialog = useCallback(() => {
        if (!post?.id) return;
        setMarkResolvedPostId(Number(post.id));
        setMarkResolvedMessage('');
        setMarkResolvedError('');
        setMarkResolvedSaving(false);
        setMarkResolvedOpen(true);
    }, [post?.id]);

    const closeMarkResolvedDialog = useCallback(() => {
        setMarkResolvedOpen(false);
        setMarkResolvedPostId(null);
        setMarkResolvedMessage('');
        setMarkResolvedError('');
        setMarkResolvedSaving(false);
    }, []);

    const submitMarkResolved = useCallback(async () => {
        if (!markResolvedPostId) return;

        setMarkResolvedSaving(true);
        setMarkResolvedError('');

        const cleaned = String(markResolvedMessage || '').slice(0, 1000);

        try {
            const res = await secureFetch(`/api/volunteer-help/${encodeURIComponent(markResolvedPostId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ is_resolved: 1, resolution_text: cleaned }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setMarkResolvedError(String(data?.message || 'Failed to mark as resolved.'));
                setMarkResolvedSaving(false);
                return;
            }

            let updated = null;

            if (data && typeof data === 'object') {
                if (data?.post && typeof data.post === 'object') updated = data.post;
                else if (data?.id != null) updated = data;
            }

            if (!updated || updated?.id == null) {
                updated = {
                    ...(post || {}),
                    id: markResolvedPostId,
                    is_resolved: 1,
                    resolved_at: new Date().toISOString(),
                    resolution_text: cleaned,
                };
            } else {
                updated = {
                    ...(post || {}),
                    ...updated,
                    is_resolved: 1,
                    resolved_at: updated?.resolved_at || updated?.resolvedAt || new Date().toISOString(),
                    resolution_text: String(updated?.resolution_text || updated?.resolutionText || cleaned),
                };
            }

            setPost((prev) => ({ ...(prev || {}), ...updated }));

            try {
                window.dispatchEvent(
                    new CustomEvent('ll:communityPost:updated', {
                        detail: { postId: markResolvedPostId, post: updated, forceRefresh: true },
                    })
                );
                window.dispatchEvent(
                    new CustomEvent('ll:communityPost:resolved', {
                        detail: { postId: markResolvedPostId, post: updated },
                    })
                );
            } catch {
                // ignore
            }

            closeMarkResolvedDialog();
        } catch {
            setMarkResolvedError('Failed to mark as resolved.');
            setMarkResolvedSaving(false);
        }
    }, [markResolvedPostId, markResolvedMessage, closeMarkResolvedDialog, post]);

    const submitMarkFound = useCallback(async () => {
        if (!markFoundPostId) return;

        setMarkFoundSaving(true);
        setMarkFoundError('');

        try {
            const res = await secureFetch(`/api/community/${encodeURIComponent(markFoundPostId)}/mark-found`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: markFoundMessage || '' }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                setMarkFoundError(String(data?.message || 'Failed to mark as found.'));
                setMarkFoundSaving(false);
                return;
            }

            let updated = null;

            if (data && typeof data === 'object') {
                if (data?.post && typeof data.post === 'object') updated = data.post;
                else if (data?.id != null) updated = data;
            }

            // If the API didn't return the updated post, fetch it so the UI updates immediately
            if (!updated || updated?.id == null) {
                try {
                    let getRes = await secureFetch(`/api/community/${encodeURIComponent(markFoundPostId)}`, { credentials: 'include' });
                    if (!getRes.ok) {
                        const res2 = await secureFetch(`/api/community/posts/${encodeURIComponent(markFoundPostId)}`, { credentials: 'include' });
                        if (res2.ok) getRes = res2;
                    }
                    const latest = await getRes.json().catch(() => null);
                    const normalized = Array.isArray(latest) ? latest[0] : latest;
                    if (normalized && typeof normalized === 'object') updated = normalized;
                } catch {
                    // ignore
                }
            }

            if (updated && typeof updated === 'object') {
                setPost((prev) => ({ ...(prev || {}), ...updated }));
                try {
                    window.dispatchEvent(
                        new CustomEvent('ll:communityPost:markedFound', {
                            detail: { postId: markFoundPostId, post: updated, forceRefresh: true },
                        })
                    );
                } catch {
                    // ignore
                }
            }

            closeMarkFoundDialog();
        } catch {
            setMarkFoundError('Failed to mark as found.');
            setMarkFoundSaving(false);
        }
    }, [markFoundPostId, markFoundMessage, closeMarkFoundDialog]);

    const openHistoryDialog = useCallback(async () => {
        if (!post?.id) return;

        const pid = Number(post.id);
        setHistoryPostId(pid);
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryError('');
        setHistoryRows([]);

        try {
            const res = await secureFetch(`/api/community/${encodeURIComponent(pid)}/edits`, {
                credentials: 'include',
            });
            const data = await res.json().catch(() => []);
            if (!res.ok) {
                setHistoryError(String(data?.message || 'Failed to load edit history.'));
                setHistoryRows([]);
            } else {
                setHistoryRows(Array.isArray(data) ? data : []);
            }
        } catch {
            setHistoryError('Failed to load edit history.');
            setHistoryRows([]);
        } finally {
            setHistoryLoading(false);
        }
    }, [post?.id]);

    const closeHistoryDialog = useCallback(() => {
        setHistoryOpen(false);
        setHistoryPostId(null);
        setHistoryLoading(false);
        setHistoryError('');
        setHistoryRows([]);
    }, []);

    // NEW: ensure we land at the top whenever this page is opened (non-embedded)
    useEffect(() => {
        if (!embedded) {
            try {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            } catch {}
        }
    }, [embedded]);

    // Sync with prop when embedded so selecting another card updates the detail pane
    useEffect(() => {
        if (embedded && initialPost && (!post || String(initialPost.id) !== String(post.id))) {
            setPost(initialPost);
            setPostLoading(false);
        }
    }, [embedded, initialPost, post]);

    // recognize viewer (includes social_json we use for following)
    useEffect(() => {
        let alive = true;
        if (!viewer) {
            secureFetch('/users/profile', { credentials: 'include' })
                .then((r) => (r.ok ? r.json() : null))
                .then((resp) => {
                    if (!alive) return;
                    const u = resp?.user || resp || null;
                    setViewer(u);
                })
                .catch(() => {
                    if (alive) setViewer(null);
                });
        }
        return () => {
            alive = false;
        };
    }, [viewer]);

    // fetch post by id if not provided
    useEffect(() => {
        let cancelled = false;
        const normalizedRouteId =
            routeId && routeId !== 'undefined' && routeId !== 'null' && routeId !== 'NaN' ? routeId : null;

        const initialPostId =
            initialPost != null && (typeof initialPost === 'string' || typeof initialPost === 'number')
                ? String(initialPost)
                : initialPost?.id != null
                    ? String(initialPost.id)
                    : null;

        const id = post?.id || normalizedRouteId || initialPostId;

        // If we already have a real post object, don't refetch.
        if (post && typeof post === 'object' && post.id != null) return;
        if (!id) {
            if (!cancelled) setPostLoading(false);
            return;
        }

        (async () => {
            setPostLoading(true);
            try {
                let res = await secureFetch(`/api/community/${encodeURIComponent(id)}`, { credentials: 'include' });
                if (!res.ok) {
                    const res2 = await secureFetch(`/api/community/posts/${encodeURIComponent(id)}`, { credentials: 'include' });
                    if (res2.ok) res = res2;
                }
                const data = await res.json();
                if (!cancelled) setPost(Array.isArray(data) ? data[0] : data);
            } catch {
                if (!cancelled) setPost(null);
            } finally {
                if (!cancelled) setPostLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [routeId, post, initialPost]);

    // Return targets when we came from a profile
    const fromProfile = Boolean(location?.state?.fromProfile);
    const fromNotifications = Boolean(location?.state?.fromNotifications);
    const backProfileName = location?.state?.backProfileName || '';
    const backProfileHandle = location?.state?.backProfileHandle || '';
    const backProfileId = location?.state?.backProfileId || '';
    const backToProfileUrl =
        location?.state?.backToProfileUrl ||
        (backProfileHandle ? `/${backProfileHandle}` : backProfileId ? `/${backProfileId}` : '');

    // "Back to {business}'s profile" support (when navigating from BusinessPublicPage engagement tabs)
    const fromBusiness = Boolean(location?.state?.fromBusiness);
    const backBusinessName = location?.state?.backBusinessName || '';
    const backBusinessSlug = location?.state?.backBusinessSlug || '';


    const _stateFromCommunity = location?.state?.fromCommunity;
    const fromSocial = useMemo(() => {
        if (_stateFrom === 'social' || _stateFromSocial === true) return true;
        if (_stateFromCommunity === false) return true;
        try {
            const flag = sessionStorage.getItem('ll:social:restore_intent') === '1';
            if (flag) return true;
            return false;
        } catch {
            return false;
        }
    }, [_stateFrom, _stateFromSocial, _stateFromCommunity]);

    const fromCommunity = useMemo(() => {
        if (fromSocial) return false;
        if (_stateFrom === 'community' || _stateFromCommunity === true) return true;
        try {
            return Boolean(sessionStorage.getItem('ll:community:url'));
        } catch {
            return false;
        }
    }, [fromSocial, _stateFrom, _stateFromCommunity]);
    const backToList = useCallback(() => {
        try {
            sessionStorage.setItem('ll:community:restore', '1');
        } catch {}

        try {
            const url = sessionStorage.getItem('ll:community:url');
            if (url) {
                navigate(url, { state: { restoreCommunity: true } });
                return;
            }
        } catch {}

        navigate('/community');
    }, [navigate]);

    const returnGroupId = groupCtx?.id ?? null;

    const handleReturnClick = useCallback(() => {
        const canGoBack =
            typeof window !== 'undefined' && window.history && typeof window.history.length === 'number'
                ? window.history.length > 1
                : false;

        // If we came from a user profile page, return there first — even if the post belongs to a group.
        if (fromProfile) {
            try {
                const rawKey = backProfileHandle || backProfileId;
                const norm = String(rawKey || '').replace(/^@/, '').trim();
                const candidates = [rawKey, norm, norm ? `@${norm}` : ''].filter(Boolean);

                candidates.forEach((k) => {
                    sessionStorage.setItem(`ll:profile:${k}:restore`, '1');
                });
            } catch {
                // ignore
            }

            if (canGoBack) {
                navigate(-1);
                return;
            }

            const fallbackHandle = backProfileHandle ? String(backProfileHandle).replace(/^@/, '') : '';
            const targetUrl =
                backToProfileUrl ||
                (fallbackHandle ? `/${fallbackHandle}` : backProfileId ? `/${backProfileId}` : '');

            if (targetUrl) {
                navigate(targetUrl, { state: { restoreProfile: true, fromPostPage: true } });
            } else {
                navigate('/', { state: { restoreProfile: true, fromPostPage: true } });
            }
            return;
        }

        // If we came from a business public page, return there with scroll restoration
        if (fromBusiness && backBusinessSlug) {
            if (canGoBack) {
                navigate(-1);
                return;
            }
            navigate(`/${backBusinessSlug}`, { state: { fromPostPage: true } });
            return;
        }

        if (fromSocial) {
            try {
                sessionStorage.setItem('ll:social:restore_intent', '0');
            } catch {
                // ignore
            }

            if (canGoBack) {
                navigate(-1);
            } else {
                navigate('/social', { state: { restoreSocial: true } });
            }
            return;
        }

        // If this post was opened from a dedicated Group Page, return there and restore scroll.
        if (returnGroupId) {
            try {
                sessionStorage.setItem('ll:group:restore', '1');
            } catch {
                // ignore
            }

            if (canGoBack) {
                navigate(-1);
                return;
            }

            try {
                const url = sessionStorage.getItem('ll:group:url');
                if (url) {
                    navigate(url, { state: { restoreGroupPage: true } });
                    return;
                }
            } catch {
                // ignore
            }

            navigate(`/groups/${encodeURIComponent(String(returnGroupId))}`, { state: { restoreGroupPage: true } });
            return;
        }

        // If we came from the Community page (including groups view), return there
        if (fromCommunity) {
            try {
                sessionStorage.setItem('ll:community:restore', '1');
                if (isGroupContext) {
                    sessionStorage.setItem('ll:community:returnToGroupPosts', '1');
                }
            } catch {
                // ignore
            }

            if (canGoBack) {
                navigate(-1);
                return;
            }

            const restoreState = { restoreCommunity: true };
            if (isGroupContext) {
                restoreState.restoreGroupPosts = true;
            }

            try {
                const url = sessionStorage.getItem('ll:community:url');
                if (url) {
                    navigate(url, { state: restoreState });
                    return;
                }
            } catch {
                // ignore
            }

            navigate('/community', { state: restoreState });
            return;
        }

        backToList();
    }, [returnGroupId, fromProfile, fromSocial, fromCommunity, isGroupContext, navigate, backToList, backToProfileUrl, backProfileHandle, backProfileId]);

    // When the viewer hides this author's posts or blocks them from the UserCardPopover while on PostPage,
    // immediately navigate back (to Community/Profile origin) so we don't keep showing content they chose to remove.
    useEffect(() => {
        if (embedded) return undefined;

        const getPostAuthorIdNum = () => {
            const raw =
                post?.user_id ??
                post?.author_id ??
                post?.user?.id ??
                post?.uid ??
                post?.owner_id ??
                null;
            const n = Number(raw);
            return Number.isFinite(n) && n > 0 ? n : null;
        };

        const goBackFromModeration = () => {
            // If they came from a profile, return there. Otherwise, return to community if available.
            // If neither, go home.
            if (fromProfile) {
                handleReturnClick();
                return;
            }

            if (fromCommunity) {
                try {
                    sessionStorage.setItem('ll:community:clearSelection', '1');
                    sessionStorage.setItem('ll:community:returnToTrending', '1');
                } catch {
                    // ignore
                }
                backToList();
                return;
            }

            navigate('/', { replace: true });
        };

        const onHideUserPosts = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const authorIdNum = getPostAuthorIdNum();
            if (authorIdNum && uid === authorIdNum) {
                goBackFromModeration();
            }
        };

        const onBlockUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const authorIdNum = getPostAuthorIdNum();
            if (authorIdNum && uid === authorIdNum) {
                goBackFromModeration();
            }
        };

        const onHideSinglePost = (e) => {
            const pid = e?.detail?.postId != null ? String(e.detail.postId) : '';
            if (!pid) return;
            const activeNow = (routeId || post?.id) != null ? String(routeId || post?.id) : '';
            if (activeNow && pid === activeNow) {
                goBackFromModeration();
            }
        };

        window.addEventListener('ll:user:hidden-changed', onHideUserPosts);
        window.addEventListener('ll:user:blocked-changed', onBlockUser);
        window.addEventListener('ll:post:hidden-changed', onHideSinglePost);

        return () => {
            window.removeEventListener('ll:user:hidden-changed', onHideUserPosts);
            window.removeEventListener('ll:user:blocked-changed', onBlockUser);
            window.removeEventListener('ll:post:hidden-changed', onHideSinglePost);
        };
    }, [embedded, post, routeId, fromProfile, fromCommunity, handleReturnClick, backToList, navigate]);

    const photos = useMemo(() => extractPhotos(post || {}), [post]);
    const badgeMeta = useMemo(() => (isGroupContext ? null : buildBadgeFor(post || {})), [post, isGroupContext]);

    const likes = Number(post?.likesCount ?? post?.likes_count ?? post?.like_count ?? post?.likes ?? 0);
    const viewerLiked = Boolean(post?.viewerLiked ?? post?.viewer_liked ?? post?.liked ?? post?.is_liked ?? false);
    const commentsCount = Number(
        post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0
    );
    const reposts = Number(post?.repostsCount ?? post?.reposts_count ?? post?.repost_count ?? post?.reposts ?? 0);
    const viewerReposted = Boolean(
        post?.viewerReposted ?? post?.viewer_reposted ?? post?.reposted ?? post?.is_reposted ?? false
    );

    const viewerUser = viewer?.user || viewer || null;

    // Display name & avatar for the comment composer — reflects the active account
    const viewerPersonalAvatarUrl2 = (() => {
        const raw = viewerUser?.avatar_url || viewerUser?.profile_picture || '';
        if (!raw || raw.includes('default_avatar')) return '';
        return raw;
    })();
    const viewerPersonalLabel2 = `${viewerUser?.first_name || ''} ${viewerUser?.last_name || ''}`.trim() || 'You';

    const [fetchedAccountAvatar2, setFetchedAccountAvatar2] = useState('');
    const [fetchedAccountProfileType2, setFetchedAccountProfileType2] = useState('');
    useEffect(() => {
        if (!isBusinessAccount && !isArtistAccount) {
            setFetchedAccountAvatar2('');
            setFetchedAccountProfileType2('');
            return;
        }
        const existingAvatar = String(activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || '').trim();
        const hasAvatar = existingAvatar && !existingAvatar.includes('default_avatar') && !existingAvatar.includes('default_business') && !existingAvatar.includes('default_logo');
        if (isBusinessAccount && hasAvatar) {
            setFetchedAccountAvatar2('');
            setFetchedAccountProfileType2('');
            return;
        }
        let active = true;
        (async () => {
            try {
                let url = '';
                if (isBusinessAccount) {
                    const slug = String(activeAccount?.slug || activeAccount?.handle || '').trim();
                    if (!slug || /^\d+$/.test(slug)) return;
                    url = `/api/business/${encodeURIComponent(slug)}`;
                } else if (isArtistAccount && activeArtistId) {
                    url = `/api/music/artists/${encodeURIComponent(String(activeArtistId))}`;
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
                if (okAv) setFetchedAccountAvatar2(av);
                if (isArtistAccount) setFetchedAccountProfileType2(pt === 'artist' ? 'artist' : 'music');
                try {
                    const stored = JSON.parse(localStorage.getItem('ll:activeAccount') || '{}');
                    if (stored && typeof stored === 'object') {
                        let dirty = false;
                        if (okAv && stored.avatar_url !== av) {
                            stored.avatar_url = av;
                            dirty = true;
                        }
                        if (isArtistAccount) {
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
    }, [isBusinessAccount, isArtistAccount, activeArtistId, activeAccount?.slug, activeAccount?.handle, activeAccount?.avatar_url, activeAccount?.avatarUrl, activeAccount?.logo_url, activeAccount?.logoUrl]);

    const viewerAvatarUrl = (() => {
        if (isBusinessAccount || isArtistAccount) {
            if (fetchedAccountAvatar2) return fetchedAccountAvatar2;
            const candidates = [
                activeAccount?.avatar_url, activeAccount?.avatarUrl, activeAccount?.logo_url, activeAccount?.logoUrl,
                activeAccount?.image_url, activeAccount?.imageUrl, activeAccount?.photo_url, activeAccount?.photoUrl,
                activeAccount?.account_avatar_url,
            ];
            for (const c of candidates) {
                const s = String(c || '').trim();
                if (s && s !== 'null' && s !== 'undefined' && !s.includes('default_avatar') && !s.includes('default_business') && !s.includes('default_logo')) return s;
            }
            return '';
        }
        return viewerPersonalAvatarUrl2;
    })();
    const viewerAccountType = isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : 'personal';
    const viewerProfileType = (() => {
        if (!isArtistAccount) return 'music';
        const fromFetched = String(fetchedAccountProfileType2 || '').toLowerCase();
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
    const viewerLabel = (isBusinessAccount || isArtistAccount)
        ? (activeAccount?.name || viewerPersonalLabel2)
        : viewerPersonalLabel2;

    const postId = post?.id;
    const activePostId = routeId || postId;

    useEffect(() => {
        if (!activePostId) return;

        const patchCommunitySessionCache = (updatedPost) => {
            try {
                const idStr = updatedPost?.id != null ? String(updatedPost.id) : '';
                if (!idStr) return;

                // Patch the cached Community list payload so returning to /community shows updated photos immediately.
                const dataKey = 'll:community:data';
                const stateKey = 'll:community:state';

                const safeParse = (raw) => {
                    if (!raw || typeof raw !== 'string') return null;
                    try { return JSON.parse(raw); } catch { return null; }
                };

                const rawData = sessionStorage.getItem(dataKey);
                const data = safeParse(rawData);
                if (data && Array.isArray(data.posts)) {
                    const nextPosts = data.posts.map((p) => (p && String(p.id) === idStr ? { ...p, ...updatedPost } : p));
                    // Only write if we actually had that post in cache
                    if (nextPosts.some((p) => p && String(p.id) === idStr)) {
                        sessionStorage.setItem(dataKey, JSON.stringify({ ...data, posts: nextPosts, ts: Date.now() }));
                    }
                }

                const rawState = sessionStorage.getItem(stateKey);
                const st = safeParse(rawState);
                if (st && st.selectedPost && String(st.selectedPost.id) === idStr) {
                    sessionStorage.setItem(stateKey, JSON.stringify({ ...st, selectedPost: { ...st.selectedPost, ...updatedPost } }));
                }
            } catch {
                // ignore
            }
        };

        const onUpdated = (e) => {
            const next = e?.detail?.post || e?.detail || null;
            if (!next || next.id == null) return;
            if (String(next.id) !== String(activePostId)) return;
            setPost((prev) => ({ ...(prev || {}), ...next }));
            patchCommunitySessionCache(next);
        };

        const onMarkedFound = (e) => {
            const next = e?.detail?.post || e?.detail || null;
            if (!next || next.id == null) return;
            if (String(next.id) !== String(activePostId)) return;
            setPost((prev) => ({ ...(prev || {}), ...next }));
            patchCommunitySessionCache(next);
        };

        const onDeleted = (e) => {
            const delId = e?.detail?.postId ?? e?.detail?.id ?? e?.detail ?? null;
            if (delId == null) return;
            if (String(delId) !== String(activePostId)) return;
            setPost(null);
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:markedFound', onMarkedFound);
        window.addEventListener('ll:communityPost:deleted', onDeleted);

        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:markedFound', onMarkedFound);
            window.removeEventListener('ll:communityPost:deleted', onDeleted);
        };
    }, [activePostId]);

    // ── Keep post state in sync with ActionBar like/repost broadcasts ──
    // Without this, the post object retains stale likesCount/viewerLiked after
    // ActionBar toggles, and any parent re-render would override ActionBar's
    // correct internal state with stale props.
    useEffect(() => {
        if (!activePostId) return;

        const onLikeChanged = (e) => {
            const d = e?.detail;
            if (!d || String(d.postId) !== String(activePostId)) return;
            setPost((prev) => {
                if (!prev) return prev;
                const patch = {};
                if (d.likes != null) {
                    const n = Math.max(0, Number(d.likes) || 0);
                    patch.likesCount = n;
                    patch.likes_count = n;
                    patch.like_count = n;
                }
                if (d.liked != null) {
                    patch.viewerLiked = Boolean(d.liked);
                    patch.viewer_liked = Boolean(d.liked);
                }
                return { ...prev, ...patch };
            });
        };

        const onRepostChanged = (e) => {
            const d = e?.detail;
            if (!d || String(d.postId) !== String(activePostId)) return;
            setPost((prev) => {
                if (!prev) return prev;
                const patch = {};
                if (d.reposts != null) {
                    const n = Math.max(0, Number(d.reposts) || 0);
                    patch.repostsCount = n;
                    patch.reposts_count = n;
                    patch.repost_count = n;
                }
                if (d.reposted != null) {
                    patch.viewerReposted = Boolean(d.reposted);
                    patch.viewer_reposted = Boolean(d.reposted);
                }
                return { ...prev, ...patch };
            });
        };

        window.addEventListener('ll:post:like-changed', onLikeChanged);
        window.addEventListener('ll:post:repost-changed', onRepostChanged);
        return () => {
            window.removeEventListener('ll:post:like-changed', onLikeChanged);
            window.removeEventListener('ll:post:repost-changed', onRepostChanged);
        };
    }, [activePostId]);

    const postAuthorId =
        post?.user_id ?? post?.author_id ?? post?.user?.id ?? post?.uid ?? post?.owner_id ?? null;

    const viewerId = viewerUser?.id != null ? String(viewerUser.id) : '';
    const viewerHandle = String(viewerUser?.handle || '').trim().toLowerCase();

    const authorId = postAuthorId != null ? String(postAuthorId) : '';
    const authorHandle = String(post?.handle || '').trim().toLowerCase();
    const viewerPublicId = viewerUser?.public_id != null ? String(viewerUser.public_id) : '';
    const authorPublicId = post?.public_id != null ? String(post.public_id) : '';

    const isOwner = useMemo(() => {
        if (viewerId && authorId && viewerId === authorId) return true;
        if (viewerHandle && authorHandle && viewerHandle === authorHandle) return true;
        if (viewerPublicId && authorPublicId && viewerPublicId === authorPublicId) return true;
        return false;
    }, [viewerId, authorId, viewerHandle, authorHandle, viewerPublicId, authorPublicId]);

    // Only the post owner can manage (edit/delete) posts
    // Business/artist accounts cannot edit/delete personal community posts (same logic as PostList)
    const canManage = isOwner && !isNonPersonal;

    // ── Hide posts / Block user state + handlers ──
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    const handleHideUser = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const uid = Number(postAuthorId || 0);
        if (!uid || hideBusy || blockBusy) return;
        setHideBusy(true);
        const displayName = String(post?.first_name || post?.firstName || post?.handle || 'this user').trim() || 'this user';
        try {
            const res = await secureFetch('/api/users/hide', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_id: uid, target_type: 'personal', action: 'hide' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: uid, targetType: 'personal', hidden: true } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* best-effort */ } finally { setHideBusy(false); }
    }, [closeOwnerMenu, postAuthorId, post?.first_name, post?.firstName, post?.handle, hideBusy, blockBusy]);

    const handleBlockUser = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const uid = Number(postAuthorId || 0);
        if (!uid || hideBusy || blockBusy) return;
        setBlockBusy(true);
        const displayName = String(post?.first_name || post?.firstName || post?.handle || 'User').trim() || 'User';
        try {
            const res = await secureFetch('/api/users/block', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_id: uid, target_type: 'personal', action: 'block' }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: uid, targetType: 'personal', blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: uid, targetType: 'personal', hidden: true } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* best-effort */ } finally { setBlockBusy(false); }
    }, [closeOwnerMenu, postAuthorId, post?.first_name, post?.firstName, post?.handle, hideBusy, blockBusy]);

    const viewerGroupRole = (isGroupContext && viewerId) ? (groupRoleMap?.[String(viewerId)] || '') : '';
    const viewerGroupRoleNorm = String(viewerGroupRole || '').trim().toLowerCase();
    const canPinInGroup = viewerGroupRoleNorm === 'owner' || viewerGroupRoleNorm === 'admin';
    const isPinnedInGroup = useMemo(() => {
        // Check if post data includes is_pinned flag
        const fromPost = Boolean(Number(
            post?.is_pinned ?? post?.isPinned ?? post?.group_is_pinned ?? post?.groupIsPinned ?? post?.groupPinned ?? post?.pinned ?? 0
        ));
        if (fromPost) return true;

        // Fallback: check if current post ID matches the group's pinned post ID
        if (groupPinnedPostId != null && post?.id != null) {
            return Number(post.id) === Number(groupPinnedPostId);
        }

        return false;
    }, [post, groupPinnedPostId]);

    const isEdited = Boolean(post?.edited_at || post?.editedAt);

    const requestKind = useMemo(() => normalizeRequestKind(post), [post]);
    const isHelpRequest = String(requestKind || '').trim().toLowerCase() === 'help';

    const POST_DESC_PREVIEW_CHARS = 900;
    const fullDescRaw = post?.description != null ? String(post.description) : '';
    const fullDescTrimmed = fullDescRaw.trim();
    const descNeedsTruncate = fullDescTrimmed.length > POST_DESC_PREVIEW_CHARS;
    const descDisplay = (!descNeedsTruncate || showFullDescription)
        ? fullDescRaw
        : `${fullDescTrimmed.slice(0, POST_DESC_PREVIEW_CHARS).trimEnd()}...`;

    const lostOrFound = String(post?.lost_or_found || '').trim().toLowerCase();
    const isLostFoundPost =
        Boolean(lostOrFound) ||
        ['lost-found', 'lost-and-found'].includes(String(post?.category || '').trim().toLowerCase());

    const reward = post?.reward;
    const showRewardChip =
        lostOrFound === 'lost' &&
        reward !== undefined &&
        reward !== null &&
        String(reward).trim() !== '' &&
        String(reward).trim() !== '0';

    const lostFoundResolvedAt = isLostFoundPost ? (post?.resolved_at || post?.resolvedAt || null) : null;
    const lostFoundResolvedMessage = isLostFoundPost ? (post?.resolved_message || post?.resolvedMessage || '') : '';
    const isLostFoundResolved = Boolean(isLostFoundPost && (lostFoundResolvedAt || lostFoundResolvedMessage));

    const helpResolvedAt = (isHelpRequest && !isLostFoundPost) ? (post?.resolved_at || post?.resolvedAt || null) : null;
    const helpResolutionText = isHelpRequest ? String(post?.resolution_text || post?.resolutionText || '').trimEnd() : '';
    const helpIsResolvedFlag = isHelpRequest ? Number(post?.is_resolved ?? post?.isResolved ?? 0) : 0;
    const isHelpResolved = Boolean(isHelpRequest && (helpIsResolvedFlag || helpResolvedAt || helpResolutionText));

    const canMarkFound = Boolean(isOwner && lostOrFound === 'lost' && !isLostFoundResolved);
    const canMarkResolved = Boolean(isOwner && isHelpRequest && !isHelpResolved && !isLostFoundPost);


    const isVolunteerHelp = useMemo(() => {
        const catOk = isVolunteerHelpCategory(post?.category);
        const rk = String(requestKind || '').trim().toLowerCase();
        const hasHelpFields = Boolean(post?.help_type || post?.helpType || post?.help_type_other || post?.is_urgent || post?.isUrgent);
        return Boolean(catOk || rk === 'help' || rk === 'volunteer' || hasHelpFields);
    }, [post, requestKind]);

    const helpTypeLabel = useMemo(() => {
        const ht = String(post?.help_type || post?.helpType || '').trim().toLowerCase();
        const other = String(post?.help_type_other || '').trim();
        if (!ht) return '';
        if (ht === 'other') return other ? `Other: ${other}` : 'Other';
        return HELP_TYPE_LABELS[ht] || formatNiceLabel(ht);
    }, [post]);

    const urgency = requestKind === 'help'
        ? String(post?.urgency || post?.urgency_level || post?.urgencyLevel || '').trim().toLowerCase()
        : '';

    const isUrgent = (
        // Primary: DB column `is_urgent` from volunteer_help_requests
        Boolean(Number(post?.is_urgent ?? post?.isUrgent ?? post?.urgent ?? 0)) ||
        // Legacy fallbacks (only used if you ever stored a string urgency)
        String(post?.urgency || post?.urgency_level || post?.urgencyLevel || '').trim().toLowerCase() === 'urgent'
    );
    const postAuthor = useMemo(() => {
        const name = `${post?.first_name || ''} ${post?.last_name || ''}`.trim();
        return {
            id: postAuthorId != null ? String(postAuthorId) : null,
            handle: post?.handle || null,
            public_id: post?.public_id != null ? String(post.public_id) : null,
            name,
        };
    }, [post, postAuthorId]);

    // If this post is inside a group, fetch the viewer's role (Owner/Admin) so we can show group moderation controls.
    useEffect(() => {
        const gid = groupCtx?.id != null ? Number(groupCtx.id) : null;
        const vid = viewerUser?.id != null ? String(viewerUser.id) : '';
        if (!gid || !vid) return undefined;
        if (groupRoleMap && groupRoleMap[String(vid)]) return undefined;

        let cancelled = false;

        (async () => {
            try {
                const url = `/api/groups/${encodeURIComponent(String(gid))}/role-map?userIds=${encodeURIComponent(vid)}`;
                const res = await secureFetch(url, { credentials: 'include' });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const map = data?.roleMap || data?.roles || data || null;
                if (!map || typeof map !== 'object') return;

                const normalized = {};
                Object.entries(map).forEach(([k, v]) => {
                    const key = String(k);
                    const role = normalizeGroupRole(v);
                    if (key && role) normalized[key] = role;
                });

                if (!cancelled && Object.keys(normalized).length) {
                    mergeGroupRoleMap(normalized);
                }
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [returnGroupId, viewerUser?.id, groupRoleMap, mergeGroupRoleMap]);


    // If this post is inside a group, fetch the author's role (Owner/Admin) so we can render a badge.
    useEffect(() => {
        const gid = groupCtx?.id != null ? Number(groupCtx.id) : null;
        const uid = postAuthorId != null ? String(postAuthorId) : '';
        if (!gid || !uid) return undefined;

        let cancelled = false;

        (async () => {
            try {
                const url = `/api/groups/${encodeURIComponent(String(gid))}/role-map?userIds=${encodeURIComponent(uid)}`;
                const res = await secureFetch(url, { credentials: 'include' });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const map = data?.roleMap || data?.roles || data || null;
                if (!map || typeof map !== 'object') return;

                const normalized = {};
                Object.entries(map).forEach(([k, v]) => {
                    const key = String(k);
                    const role = normalizeGroupRole(v);
                    if (key && role) normalized[key] = role;
                });

                if (!cancelled && Object.keys(normalized).length) {
                    mergeGroupRoleMap(normalized);
                }
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [returnGroupId, postAuthorId, mergeGroupRoleMap]);

    const openLoginPopup = useCallback(
        (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            try {
                if (auth && typeof auth.open === 'function') auth.open();
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
        },
        [auth]
    );

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

        // (Image moderation is handled at selection time in CommentImageAttachments)

        // Rate limit check
        const rlResult = checkCommentLimit();
        if (!rlResult.allowed) {
            setCommentRateLimitInfo({ retryAfterSec: rlResult.retryAfterSec, reason: rlResult.reason });
            setCommentRateLimitOpen(true);
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

        // Read active account from localStorage to avoid stale closure values
        const freshAcct = (() => {
            try {
                const raw = localStorage.getItem('ll:activeAccount');
                if (!raw) return null;
                return JSON.parse(raw);
            } catch { return null; }
        })();
        const freshType = String(freshAcct?.type || '').toLowerCase();
        const freshIsBiz = freshType === 'business' && freshAcct?.id;
        const freshIsArt = freshType === 'artist' && freshAcct?.id;
        // Resolve the handle for the current active account so the optimistic
        // comment displays the correct @username (business slug / artist handle).
        const freshHandle = freshIsBiz
            ? (freshAcct.slug || freshAcct.handle || '')
            : freshIsArt
                ? (freshAcct.handle || '')
                : '';

        const payload = {
            text: cleaned,
            content: cleaned,
            body: cleaned,
            comment: cleaned,
            ...(freshIsBiz ? {
                business_id: freshAcct.id,
                account_type: 'business',
                account_id: freshAcct.id,
                account_handle: freshAcct.slug || freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAcct.avatar_url || freshAcct.logo_url || '',
            } : {}),
            ...(freshIsArt ? {
                artist_id: freshAcct.id,
                account_type: 'artist',
                account_id: freshAcct.id,
                account_handle: freshAcct.handle || '',
                account_name: freshAcct.name || '',
                account_avatar_url: freshAcct.avatar_url || '',
            } : {}),
        };
        const tryPosts = [
            { url: `/api/community/${encodeURIComponent(postId)}/comments`, method: 'POST' },
            { url: `/api/community/posts/${encodeURIComponent(postId)}/comments`, method: 'POST' },
            { url: `/api/posts/${encodeURIComponent(postId)}/comments`, method: 'POST' },
            { url: `/api/comments?postId=${encodeURIComponent(postId)}`, method: 'POST' },
        ];
        let serverComment = null;
        let ok = false;
        // Build account headers so the backend can identify business/artist context
        // via headers (belt-and-suspenders alongside body fields).
        const acctHeaders = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        const hasFileUploads = false; // Files already uploaded to GCS above

        for (const t of tryPosts) {
            try {
                let fetchOpts;
                const jsonPayload = {
                    ...payload,
                    ...(allImageUrls.length > 0 ? { image_urls: allImageUrls } : {}),
                };
                fetchOpts = {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', ...acctHeaders },
                    body: JSON.stringify(jsonPayload),
                };
                const res = await secureFetch(t.url, fetchOpts);
                if (res.ok) {
                    ok = true;
                    try { serverComment = await res.json(); } catch { /* no body */ }
                    break;
                }
                // Catch moderation rejections (400) from server
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
                /* try next */
            }
        }
        setPosting(false);
        if (ok) {
            recordComment();
            setCommentText('');
            setCommentFiles([]);
            setCommentImageUrls([]);
            setPost((p) => (p ? { ...p, commentsCount: Number(p.commentsCount || 0) + 1 } : p));

            // Build optimistic comment from server response (or synthetic fallback)
            const created = serverComment?.comment || serverComment;

            // Resolve the best available handle for this account from ALL sources.
            // Priority: localStorage > activeAccount context > server response fields.
            // NEVER fall back to `created.handle` (personal user handle from users table).
            const resolvedHandle = freshHandle
                || activeAccount?.slug || activeAccount?.handle
                || (created?.account_handle || '')
                || (created?.business_slug || '')
                || (created?.artist_handle || '')
                || '';

            const optimistic = created && created.id
                ? {
                    ...created,
                    // Override handle so it never shows the personal profile @username
                    // when commenting as a business/artist. If resolvedHandle is empty,
                    // keep whatever the server returned for account_handle/business_slug
                    // (the server resolves slugs from the DB even when the client didn't send one).
                    ...(isBusinessAccount && activeBusinessId ? {
                        business_id: activeBusinessId,
                        business_name: created.business_name || activeAccount?.name || '',
                        business_avatar_url: created.business_avatar_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
                        account_type: 'business',
                        account_name: created.account_name || activeAccount?.name || '',
                        account_avatar_url: created.account_avatar_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
                        // Only override slug/handle fields if we have a value; otherwise keep server's
                        ...(resolvedHandle ? {
                            business_slug: resolvedHandle,
                            account_handle: resolvedHandle,
                            handle: resolvedHandle,
                        } : {
                            // Ensure handle doesn't show personal handle — use account_handle from server
                            handle: created.account_handle || created.business_slug || '',
                        }),
                    } : {}),
                    ...(isArtistAccount && activeArtistId ? {
                        artist_id: activeArtistId,
                        artist_name: created.artist_name || activeAccount?.name || '',
                        artist_avatar_url: created.artist_avatar_url || activeAccount?.avatar_url || '',
                        account_type: 'artist',
                        account_name: created.account_name || activeAccount?.name || '',
                        account_avatar_url: created.account_avatar_url || activeAccount?.avatar_url || '',
                        ...(resolvedHandle ? {
                            artist_handle: resolvedHandle,
                            account_handle: resolvedHandle,
                            handle: resolvedHandle,
                        } : {
                            handle: created.account_handle || created.artist_handle || '',
                        }),
                    } : {}),
                }
                : {
                    id: `temp_comment_${Date.now()}`,
                    text: cleaned,
                    content: cleaned,
                    user_id: viewerUser?.id,
                    public_id: viewerUser?.public_id,
                    first_name: viewerUser?.first_name || '',
                    last_name: viewerUser?.last_name || '',
                    handle: resolvedHandle || viewerUser?.handle || '',
                    avatar_url: viewerUser?.avatar_url || viewerUser?.profile_picture || '',
                    created_at: new Date().toISOString(),
                    likes: 0,
                    viewer_liked: false,
                    reply_count: 0,
                    replies: [],
                    images: allImageUrls.length > 0 ? [...allImageUrls] : [],
                    ...(isBusinessAccount && activeBusinessId ? {
                        business_id: activeBusinessId,
                        business_name: activeAccount?.name || '',
                        ...(resolvedHandle ? { business_slug: resolvedHandle } : {}),
                        business_avatar_url: activeAccount?.avatar_url || activeAccount?.logo_url || '',
                        account_type: 'business',
                        account_name: activeAccount?.name || '',
                        ...(resolvedHandle ? { account_handle: resolvedHandle } : {}),
                        account_avatar_url: activeAccount?.avatar_url || activeAccount?.logo_url || '',
                    } : {}),
                    ...(isArtistAccount && activeArtistId ? {
                        artist_id: activeArtistId,
                        artist_name: activeAccount?.name || '',
                        ...(resolvedHandle ? { artist_handle: resolvedHandle } : {}),
                        artist_avatar_url: activeAccount?.avatar_url || '',
                        account_type: 'artist',
                        account_name: activeAccount?.name || '',
                        ...(resolvedHandle ? { account_handle: resolvedHandle } : {}),
                        account_avatar_url: activeAccount?.avatar_url || '',
                    } : {}),
                };

            // Inject into comment list without reloading
            if (typeof addCommentRef.current === 'function') {
                addCommentRef.current(optimistic);
            } else {
                forceRefreshComments();
            }
        } else {
            openLoginPopup();
        }
    }

    const onComposerKeyDown = (e) => {
        if (commentMention.open && e.key === 'Escape') {
            e.preventDefault();
            closeCommentMention();
            return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitComment();
        }
    };

    /* ---------- Shared user card logic (matches PostList) ---------- */
    const openAuthUI = useCallback(() => {
        openLoginPopup();
    }, [openLoginPopup]);

    const requireAuth = useCallback(
        (cb) => {
            if (viewerUser) return cb?.();
            openAuthUI();
            return undefined;
        },
        [viewerUser, openAuthUI]
    );

    const hydrateTargetFromPublic = useCallback(
        async (target) => {
            if (!target) return null;
            const handleOrId = target.handle || target.id;
            if (!handleOrId) return null;

            const urls = [
                `${api}/users/public/${encodeURIComponent(handleOrId)}`,
                `/users/public/${encodeURIComponent(handleOrId)}`,
                `/api/users/public/${encodeURIComponent(handleOrId)}`,
            ].filter(Boolean);

            for (const u of urls) {
                try {
                    const res = await secureFetch(u, { credentials: 'include' });
                    if (!res.ok) continue;
                    const data = await res.json();
                    const profile = data?.profile || data?.user || data;
                    if (!profile) continue;

                    setUserForCard((prev) => {
                        if (!prev) return prev;
                        if (!prev.id && profile.id) return { ...prev, id: profile.id };
                        return prev;
                    });

                    const sjRaw = profile.social_json;
                    let sj = {};
                    if (typeof sjRaw === 'string') {
                        try {
                            sj = JSON.parse(sjRaw || '{}');
                        } catch {
                            sj = {};
                        }
                    } else if (sjRaw && typeof sjRaw === 'object') {
                        sj = sjRaw;
                    }
                    const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                    const isF = !!viewerUser?.id && followers.includes(Number(viewerUser.id));
                    if (profile.id && isF) {
                        setServerFollowingSet((old) => {
                            const next = new Set(old);
                            next.add(Number(profile.id));
                            return next;
                        });
                    }
                    return profile;
                } catch {}
            }
            return null;
        },
        [viewerUser?.id]
    );

    const handleOpenUserCard = (el, author) => {
        setUserAnchor(el);
        setUserForCard({
            id: author?.id,
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle,
            avatar_url: author?.avatar_url,
            // Preserve business/artist account info when present
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
        // Only hydrate personal profiles (skip for business/artist account cards)
        const isAccountCard = Boolean(
            author?.account_type === 'business' ||
            author?.account_type === 'artist' ||
            author?.business_id ||
            author?.artist_id
        );
        if (!isAccountCard) {
            hydrateTargetFromPublic(author);
        }
    };

    const onMentionClick = (e, mentionHandle) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const h = String(mentionHandle || '').replace(/^@/, '').trim();
        if (!h) return;
        handleOpenUserCard(e.currentTarget, { handle: h });
    };

    const handleViewProfile = (u) => {
        // For business accounts, navigate to /{slug} (same URL pattern as personal profiles)
        if (u?.account_type === 'business' || u?.business_id) {
            const slug = u?.business_slug || u?.account_handle || u?.handle;
            if (slug) return window.location.assign(`/${slug}`);
        }
        // For artist accounts, navigate to /{handle} (same URL pattern as personal profiles)
        if (u?.account_type === 'artist' || u?.artist_id) {
            const artistHandle = u?.artist_handle || u?.account_handle || u?.handle;
            if (artistHandle) return window.location.assign(`/${artistHandle}`);
        }
        window.location.assign(`/${u.handle || u.id}`);
    };
    const postFollow = async (targetId) => {
        const payload = { target_id: targetId, action: 'follow' };
        const urls = [`${api}/users/follow`, '/api/users/follow', '/users/follow'].filter(Boolean);
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) return true;
            } catch {}
        }
        return false;
    };

    const handleFollow = async (targetUser) => {
        const tid0 = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid0 && !handle0) return;

        const selfId = Number(viewerUser?.id);
        if (selfId && tid0 && selfId === tid0) return;

        requireAuth(async () => {
            let tid = tid0;
            if (!tid && handle0) {
                const p = await hydrateTargetFromPublic({ handle: handle0 });
                if (p?.id) tid = Number(p.id);
            }
            if (!tid) return;

            setLocallyFollowed((prev) => {
                const next = new Set(prev);
                next.add(tid);
                return next;
            });

            const ok = await postFollow(tid);
            if (ok) {
                setServerFollowingSet((prev) => {
                    const next = new Set(prev);
                    next.add(tid);
                    return next;
                });
            } else {
                setLocallyFollowed((prev) => {
                    const next = new Set(prev);
                    next.delete(tid);
                    return next;
                });
            }
        });
    };

    const isSelfForCard = useMemo(() => {
        if (!viewerUser || !userForCard) return false;

        const isAccountCard = Boolean(
            userForCard.account_type === 'business' ||
            userForCard.account_type === 'artist' ||
            userForCard.business_id ||
            userForCard.artist_id
        );

        // Match ONLY the currently active account identity:
        if (isBusinessAccount && activeBusinessId) {
            if (!isAccountCard) return false;
            return (
                (userForCard.account_type === 'business' || Boolean(userForCard.business_id)) &&
                Number(userForCard.business_id) === Number(activeBusinessId)
            );
        }
        if (isArtistAccount && activeArtistId) {
            if (!isAccountCard) return false;
            return (
                (userForCard.account_type === 'artist' || Boolean(userForCard.artist_id)) &&
                Number(userForCard.artist_id) === Number(activeArtistId)
            );
        }
        // Personal account → isSelf only for personal cards with matching user ID
        if (isAccountCard) return false;
        const idMatch =
            viewerUser.id != null && userForCard.id != null && Number(viewerUser.id) === Number(userForCard.id);
        const handleMatch =
            viewerUser.handle &&
            userForCard.handle &&
            String(viewerUser.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || handleMatch;
    }, [viewerUser, userForCard, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    /* panel width */
    // Fade-in on mount
    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Wider desktop layout (keeps comfortable reading width; still fully responsive on mobile)
    const fadeSx = embedded ? {} : {
        opacity: pageVisible ? 1 : 0,
        transform: pageVisible ? 'translateY(0)' : `translateY(${6}px)`,
        transition: (t) => t.custom.motion.contentFade?.transition
            ?? `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}, transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
    };
    const outerSx = embedded
        ? { width: '100%', maxWidth: 'none', mx: 0, px: 0, py: 0 }
        : {
            width: '100%',
            maxWidth: 1120,
            mx: 'auto',
            px: { xs: 0, sm: 2, md: 3 },
            py: { xs: 0, sm: 3 },
            pt: { xs: `${chromeTop}px`, sm: 3 },
            pb: { xs: `${MOBILE_BOTTOM_NAV_HEIGHT + 16}px`, sm: 3 },
            ...fadeSx,
        };

    // ── Moderation block screen ──
    if (moderationBlock && !embedded) {
        return (
            <Box sx={{
                ...outerSx,
                py: { xs: 6, sm: 10 },
                px: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2,
            }}>
                <Box
                    sx={(t) => ({
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: alphaColor(t.palette.warning.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                    })}
                >
                    <VisibilityOffRoundedIcon sx={{ fontSize: 36, color: 'warning.main' }} />
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 20 }, color: 'text.primary' }}>
                    Hidden Post
                </Typography>
                <Typography
                    sx={{ fontWeight: 500, fontSize: 15, color: 'text.secondary', maxWidth: 420, lineHeight: 1.5 }}
                >
                    This post was made by <strong>{moderationBlock.authorName}</strong>, who you have {moderationBlock.reason}.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={handleReturnClick}
                        startIcon={<ArrowBackIcon />}
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            py: 1,
                        }}
                    >
                        Go Back
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setModerationBlock(null);
                            didModerationCheckRef.current = true;
                        }}
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 3,
                            py: 1,
                        }}
                    >
                        View Post
                    </Button>
                </Box>
            </Box>
        );
    }

    // Hold all post content until moderation check completes — prevents flash of blocked content
    if (!moderationChecked && post && !embedded) {
        return (
            <Box sx={{ ...outerSx, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', px: embedded ? 0 : 2 }}>
                <PulsingDots size={8} gap={1} sx={{ py: 0 }} />
            </Box>
        );
    }

    if ((postLoading && !post) || (!embedded && post && viewer && gate.loading)) {
        return (
            <Box sx={{ ...outerSx, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', px: embedded ? 0 : 2 }}>
                <PulsingDots size={8} gap={1} sx={{ py: 0 }} />
            </Box>
        );
    }
    if (!post && isNetworkError(loadError)) {
        return (
            <Box sx={{ ...outerSx, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', px: embedded ? 0 : 2 }}>
                <NetworkErrorState onRetry={() => window.location.reload()} />
            </Box>
        );
    }
    if (!embedded && post && !postLoading && gate.gated) {
        return <BlockedPostGate gate={gate} />;
    }

    if (!post) {
        return (
            <Box sx={{ ...outerSx, py: 4, px: embedded ? 0 : 2 }}>
                <Typography color="text.secondary">
                    The post you are trying to find does not exist or has been deleted.
                </Typography>

                {!embedded && (fromProfile || fromBusiness || fromCommunity || fromSocial || returnGroupId) ? (
                    <Button onClick={handleReturnClick} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
                        {fromBusiness
                            ? `Back to ${backBusinessName || 'Business'}'s profile`
                            : fromProfile
                                ? backProfileName
                                    ? `Return to ${backProfileName}'s profile`
                                    : 'Return to Profile'
                                : fromSocial
                                    ? 'Return to Feed'
                                    : (isGroupContext ? (groupCtx?.name ? `Back to ${String(groupCtx.name).length > 40 ? String(groupCtx.name).slice(0, 40) + '…' : groupCtx.name}` : 'Back to Group') : 'Return to Community Posts')}
                    </Button>
                ) : !embedded ? (
                    <Button
                        onClick={() => navigate('/community')}
                        sx={{ mt: 2 }}
                        startIcon={<ArrowBackIcon />}
                    >
                        Go to Community Posts
                    </Button>
                ) : null}
            </Box>
        );
    }

    const countyLabel = post.county
        ? String(post.county).toLowerCase().includes('county')
            ? post.county
            : `${post.county} County`
        : '';
    const isStatewidePost = (() => {
        const c = String(post?.city || '').trim().toLowerCase();
        const co = String(post?.county || '').trim().toLowerCase();
        if (!c && !co) return true;
        if (c === 'statewide' || co === 'statewide') return true;
        if (c === 'all cities' && co === 'all counties') return true;
        return Boolean(post?.statewide ?? post?.is_statewide ?? post?.isStatewide);
    })();
    const locationStr = isStatewidePost ? 'Alabama (Statewide)' : [post.city, countyLabel].filter(Boolean).join(', ');
    const postDate = post.date_created || post.posted_at;

    const authorUser = {
        id: postAuthorId,
        first_name: post.first_name,
        last_name: post.last_name,
        handle: post.handle,
        avatar_url: post.avatar_url || post.profile_picture || '',
        public_id: post.public_id,
        // Preserve business/artist account info when the post was made under a non-personal account
        ...(post.account_type ? { account_type: post.account_type } : {}),
        ...(post.business_id ? { business_id: post.business_id } : {}),
        ...(post.business_name ? { business_name: post.business_name } : {}),
        ...(post.business_slug ? { business_slug: post.business_slug } : {}),
        ...(post.business_avatar_url ? { business_avatar_url: post.business_avatar_url } : {}),
        ...(post.artist_id ? { artist_id: post.artist_id } : {}),
        ...(post.artist_name ? { artist_name: post.artist_name } : {}),
        ...(post.artist_handle ? { artist_handle: post.artist_handle } : {}),
        ...(post.artist_avatar_url ? { artist_avatar_url: post.artist_avatar_url } : {}),
        ...(post.account_name ? { account_name: post.account_name } : {}),
        ...(post.account_handle ? { account_handle: post.account_handle } : {}),
        ...(post.account_avatar_url ? { account_avatar_url: post.account_avatar_url } : {}),
    };

    const authorGroupRole = (isGroupContext && postAuthorId != null) ? (groupRoleMap[String(postAuthorId)] || '') : '';


    const openTopCard = (e) => {
        handleOpenUserCard(e.currentTarget, authorUser);
    };

    const authorAvatar = (() => {
        const acctType = String(post.account_type || '').toLowerCase();
        if (acctType === 'business') {
            return (post.business_avatar_url || post.account_avatar_url || '').trim();
        }
        if (acctType === 'artist') {
            return (post.artist_avatar_url || post.account_avatar_url || '').trim();
        }
        return post.avatar_url || post.profile_picture || '';
    })();
    const hasAuthorAvatar = !!authorAvatar;

    // Determine the correct default avatar icon for the post author based on account type
    const postAcctType = String(post?.account_type || '').toLowerCase();
    const isBusinessAuthor = postAcctType === 'business';
    const isArtistAuthor = postAcctType === 'artist';
    // For artist authors, distinguish musicians from visual artists via
    // post.profile_type (backend returns this when the post was made from an
    // artist account). Defaults to music when absent (legacy rows).
    const authorProfileType = String(post?.profile_type || post?.profileType || '').toLowerCase();
    const isVisualArtistAuthor = isArtistAuthor && authorProfileType === 'artist';
    const AuthorDefaultIcon = isBusinessAuthor
        ? StorefrontOutlinedIcon
        : isArtistAuthor
            ? (isVisualArtistAuthor ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;

    return (
        <Box sx={outerSx}>
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: { xs: 1.25, sm: 2, md: 2.5 },
                    borderRadius: { xs: 0, sm: 3 },
                    border: 'none',
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    boxShadow: embedded
                        ? 'none'
                        : { xs: 'none', sm: `0 16px 56px ${alphaColor(t.palette.text.primary, 0.08)}` },
                })}
            >
                {/* Top return bar (Profile / Community / Group) — hidden when arriving from notifications */}
                {!embedded && !fromNotifications && (fromProfile || fromBusiness || fromCommunity || fromSocial || isGroupContext) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, pb: 1 }}>
                        <Button
                            onClick={handleReturnClick}
                            startIcon={<ArrowBackIcon />}
                            sx={{ px: 1, py: 0.5, minWidth: 0, fontWeight: 800, textTransform: 'none', borderRadius: 999, '&:hover': { bgcolor: 'action.hover' }, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: { xs: 13, sm: 14 } }}
                        >
                            {fromBusiness
                                ? `Back to ${backBusinessName || 'Business'}'s profile`
                                : fromProfile
                                    ? backProfileName
                                        ? `Return to ${backProfileName}'s profile`
                                        : 'Return to Profile'
                                    : fromSocial ? 'Return to Feed' : (isGroupContext ? (groupCtx?.name ? `Back to ${String(groupCtx.name).length > 40 ? String(groupCtx.name).slice(0, 40) + '…' : groupCtx.name}` : 'Back to Group') : 'Return to Community Posts')}
                        </Button>
                    </Box>
                )}

                {/* Header (author) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Avatar
                        src={hasAuthorAvatar ? authorAvatar : undefined}
                        alt={post.first_name || ''}
                        sx={(t) => ({
                            width: { xs: 52, sm: 60 },
                            height: { xs: 52, sm: 60 },
                            flexShrink: 0,
                            cursor: 'pointer',
                            bgcolor: alphaColor(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            border: '2px solid',
                            borderColor: alphaColor(t.palette.text.primary, 0.06),
                        })}
                        onClick={openTopCard}
                    >
                        {!hasAuthorAvatar ? <AuthorDefaultIcon sx={{ fontSize: 28 }} /> : null}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Clickable name + handle area — constrained to content width */}
                        <Box
                            onClick={openTopCard}
                            sx={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                alignSelf: 'flex-start',
                                width: 'fit-content',
                                maxWidth: '100%',
                                borderRadius: 1,
                                '&:hover .ll-author-name': { textDecoration: 'underline' },
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                                <Typography className="ll-author-name" variant="subtitle1" noWrap sx={(t) => ({ ...t.custom.postDetail.authorName })}>
                                    {(() => {
                                        const acctType = String(post.account_type || '').toLowerCase();
                                        if (acctType === 'business') {
                                            const bn = (post.business_name || post.account_name || '').trim();
                                            if (bn) return bn;
                                        }
                                        if (acctType === 'artist') {
                                            const an = (post.artist_name || post.account_name || '').trim();
                                            if (an) return an;
                                        }
                                        return `${post.first_name || ''} ${post.last_name || ''}`.trim() || 'User';
                                    })()}
                                </Typography>
                                <GroupRoleChip role={(!isBusinessAuthor && !isArtistAuthor) ? authorGroupRole : ''} />
                            </Box>

                            {(() => {
                                const acctType = String(post.account_type || '').toLowerCase();
                                let displayHandle = '';
                                if (acctType === 'business') {
                                    displayHandle = (post.business_slug || post.account_handle || post.handle || '').trim();
                                } else if (acctType === 'artist') {
                                    displayHandle = (post.artist_handle || post.account_handle || post.handle || '').trim();
                                } else {
                                    displayHandle = (post.handle || '').trim();
                                }
                                if (!displayHandle) return null;
                                return (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        noWrap
                                        sx={(t) => ({ ...t.custom.postDetail.authorHandle })}
                                    >
                                        @{displayHandle.replace(/^@/, '')}
                                    </Typography>
                                );
                            })()}
                        </Box>

                        {/* Row 3: Timestamp and edited indicator (matches PostList card) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                            {postDate ? (
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgoCompact(postDate)}
                                </Typography>
                            ) : null}
                            {isEdited ? (
                                <>
                                    {postDate ? (
                                        <Typography variant="caption" color="text.disabled">•</Typography>
                                    ) : null}
                                    <Typography
                                        variant="caption"
                                        onClick={openHistoryDialog}
                                        sx={{
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            color: 'primary.main',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                        title="Click to view edit history"
                                    >
                                        Edited
                                    </Typography>
                                </>
                            ) : null}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            ml: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 0.75,
                            minWidth: 0,
                        }}
                    >

                        {/* Volunteer / Help details panel (matches the preview detail UI) */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>

                            {groupCtx?.name ? (
                                <Chip
                                    clickable
                                    aria-label="View group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (returnGroupId) {
                                            navigate(`/groups/${encodeURIComponent(String(returnGroupId))}`, { state: { restoreGroupPage: true } });
                                        }
                                    }}
                                    avatar={
                                        groupCtx?.avatarUrl ? (
                                            <Avatar
                                                src={groupCtx.avatarUrl}
                                                alt=""
                                                sx={{ width: 28, height: 28 }}
                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                            />
                                        ) : (
                                            <Avatar
                                                sx={(t) => ({ width: 28, height: 28, bgcolor: t.palette.primary.light })}
                                            >
                                                <GroupsIcon sx={{ fontSize: 18, color: '#fff' }} />
                                            </Avatar>
                                        )
                                    }
                                    label={
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                lineHeight: 1.05,
                                                py: 0.1,
                                                maxWidth: { xs: 240, sm: 360 },
                                            }}
                                        >
                                            <Box sx={{ fontSize: 11, fontWeight: 900, opacity: 0.88 }}>Posted in</Box>
                                            <Box
                                                sx={{
                                                    fontSize: 14,
                                                    fontWeight: 900,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: { xs: 200, sm: 320 },
                                                }}
                                            >
                                                {String(groupCtx.name)}
                                            </Box>
                                        </Box>
                                    }
                                    sx={(t) => ({
                                        borderRadius: 999,
                                        bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: alphaColor(t.palette.primary.main, 0.12) },
                                        border: '1px solid',
                                        borderColor: alphaColor(t.palette.primary.main, 0.18),
                                        py: 0.6,
                                        px: 0.2,
                                        mr: { xs: 0.5, sm: 1 },
                                        mt: { xs: 0.25, sm: 0.1 },
                                        '& .MuiChip-avatar': { ml: 0.9, mr: 0.75 },
                                        '& .MuiChip-label': { py: 0.2, pr: 1.6 },
                                    })}
                                />
                            ) : null}

                            {/* Post options menu - always visible */}
                            <Tooltip title="Post options" arrow>
                                <IconButton
                                    size="small"
                                    aria-label="Post options"
                                    onClick={openOwnerMenu}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        color: 'text.secondary',
                                        bgcolor: 'background.paper',
                                        '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                                    }}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>

                            <SmartMenu
                                anchorEl={ownerMenuEl}
                                open={ownerMenuOpen}
                                onClose={closeOwnerMenu}
                                disableScrollLock
                                onClick={(e) => e.stopPropagation()}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                PaperProps={{
                                    sx: {
                                        mt: 0.5,
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        boxShadow: (t) => t.custom.shadows.lg,
                                        minWidth: 190,
                                        py: 0.5,
                                    },
                                }}
                            >
                                {[
                                    /* Copy link - always */
                                    <MenuItem key="copy-link" onClick={handleCopyPostLink} sx={{ py: 1 }}>
                                        <ListItemIcon>
                                            <LinkIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Copy link" />
                                    </MenuItem>,

                                    /* Mark as Found — hidden when on business/artist account */
                                    canMarkFound && !isNonPersonal ? <Divider key="found-divider" sx={{ my: 0.5 }} /> : null,
                                    canMarkFound && !isNonPersonal ? (
                                        <MenuItem
                                            key="mark-found"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeOwnerMenu(e);
                                                openMarkFoundDialog();
                                            }}
                                            sx={{ py: 1, color: 'success.main' }}
                                        >
                                            <ListItemIcon sx={{ color: 'success.main' }}>
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Mark as Found" />
                                        </MenuItem>
                                    ) : null,

                                    /* Mark as Resolved — hidden when on business/artist account */
                                    canMarkResolved && !isNonPersonal && !canMarkFound ? <Divider key="resolved-divider" sx={{ my: 0.5 }} /> : null,
                                    canMarkResolved && !isNonPersonal ? (
                                        <MenuItem
                                            key="mark-resolved"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeOwnerMenu(e);
                                                openMarkResolvedDialog();
                                            }}
                                            sx={{ py: 1, color: 'success.main' }}
                                        >
                                            <ListItemIcon sx={{ color: 'success.main' }}>
                                                <CheckCircleOutlineIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Mark as Resolved" />
                                        </MenuItem>
                                    ) : null,

                                    /* Owner: Edit + Delete — hidden when on business/artist account */
                                    canManage ? <Divider key="owner-divider" sx={{ my: 0.5 }} /> : null,
                                    canManage ? (
                                        <MenuItem
                                            key="edit"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeOwnerMenu(e);
                                                openEditDialog();
                                            }}
                                            sx={{ py: 1 }}
                                        >
                                            <ListItemIcon>
                                                <EditIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Edit post" />
                                        </MenuItem>
                                    ) : null,
                                    canManage ? (
                                        <MenuItem
                                            key="delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeOwnerMenu(e);
                                                openDeleteDialog();
                                            }}
                                            sx={{ py: 1, color: 'error.main' }}
                                        >
                                            <ListItemIcon sx={{ color: 'error.main' }}>
                                                <DeleteIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Delete post" />
                                        </MenuItem>
                                    ) : null,

                                    /* Report — hidden for post owner */
                                    !isOwner ? <Divider key="report-divider" sx={{ my: 0.5 }} /> : null,
                                    !isOwner ? (
                                        <MenuItem key="report-item" onClick={handleReportMenuClick} sx={{ py: 1 }}>
                                            <ListItemIcon>
                                                <FlagOutlinedIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Report post" />
                                        </MenuItem>
                                    ) : null,
                                    /* Hide posts / Block user — non-owner only */
                                    !isOwner && viewerId ? (
                                        <MenuItem key="hide-user" onClick={handleHideUser} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                            <ListItemIcon>
                                                <VisibilityOffRoundedIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Hide posts" />
                                        </MenuItem>
                                    ) : null,
                                    !isOwner && viewerId ? (
                                        <MenuItem key="block-user" onClick={handleBlockUser} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                            <ListItemIcon sx={{ color: 'error.main' }}>
                                                <BlockRoundedIcon fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText primary="Block user" />
                                        </MenuItem>
                                    ) : null,
                                ].filter(Boolean)}
                            </SmartMenu>

                            <ReportDialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} onSubmit={submitPostReport} sx={{ zIndex: 100001 }} />
                            <SuccessSnackbar
                                open={copyLinkToast}
                                onClose={() => setCopyLinkToast(false)}
                                message="Link copied to clipboard"
                            />
                            <SuccessSnackbar
                                open={Boolean(hideBlockToast)}
                                onClose={() => setHideBlockToast('')}
                                message={hideBlockToast}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Title + Description */}
                {post.title ? (
                    <Typography variant="h5" sx={(t) => ({ mt: 1.25, wordBreak: 'break-word', ...t.custom.postDetail.title })}>
                        {post.title}
                    </Typography>

                ) : null}

                {/* Category chip under title */}
                {!isGroupContext && badgeMeta ? (
                    <Box sx={{ mt: 0.75, display: 'flex' }}>
                        <CategoryChip badge={badgeMeta} active />
                    </Box>
                ) : null}

                {/* Reward for Lost items */}
                {showRewardChip && (
                    <Chip
                        size="small"
                        label={`Reward: ${formatReward(reward)}`}
                        sx={{
                            alignSelf: 'flex-start',
                            mt: 0.75,
                            fontWeight: 800,
                            borderRadius: 999,
                            bgcolor: (t) => alphaColor(t.palette.warning.main, 0.12),
                            border: '1px solid',
                            borderColor: (t) => alphaColor(t.palette.warning.main, 0.35),
                        }}
                    />
                )}

                {isVolunteerHelp ? (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {helpTypeLabel ? (
                            <Chip
                                size="small"
                                label={helpTypeLabel}
                                sx={{ borderRadius: 999, fontWeight: 800 }}
                            />
                        ) : null}

                        {isUrgent ? (
                            <Chip
                                size="small"
                                label="Urgent"
                                sx={{
                                    borderRadius: 999,
                                    fontWeight: 900,
                                    border: (t) => `1px solid ${alphaColor(t.palette.error.main, 0.35)}`,
                                    bgcolor: (t) => alphaColor(t.palette.error.main, 0.08),
                                    '& .MuiChip-label': { fontWeight: 900 },
                                }}
                            />
                        ) : null}
                    </Box>
                ) : null}

                {isLostFoundResolved ? (
                    <Box sx={{ mt: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<CheckCircleRoundedIcon sx={{ color: 'success.dark' }} />}
                                label="Marked as Found"
                                size="small"
                                sx={{
                                    border: (t) => `1px solid ${alphaColor(t.palette.success.main, 0.35)}`,
                                    bgcolor: (t) => alphaColor(t.palette.success.main, 0.08),
                                    fontWeight: 900,
                                    borderRadius: 999,
                                    '& .MuiChip-label': { fontWeight: 900 },
                                }}
                            />
                        </Box>

                        {lostFoundResolvedMessage ? (
                            <Box
                                sx={{
                                    mt: 0.75,
                                    px: 1.25,
                                    py: 1,
                                    borderRadius: '14px',
                                    bgcolor: (t) => alphaColor(t.palette.success.main, 0.08),
                                    border: (t) => `1px solid ${alphaColor(t.palette.success.main, 0.22)}`,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.25 }}>
                                    Updated
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}
                                >
                                    {renderTextWithMentions(String(lostFoundResolvedMessage), onMentionClick)}
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>
                ) : null}

                {isHelpResolved ? (
                    <Box sx={{ mt: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<CheckCircleRoundedIcon sx={{ color: 'success.dark' }} />}
                                label="Resolved"
                                size="small"
                                sx={{
                                    border: (t) => `1px solid ${alphaColor(t.palette.success.main, 0.35)}`,
                                    bgcolor: (t) => alphaColor(t.palette.success.main, 0.08),
                                    fontWeight: 900,
                                    borderRadius: 999,
                                    '& .MuiChip-label': { fontWeight: 900 },
                                }}
                            />
                        </Box>

                        {helpResolutionText ? (
                            <Box
                                sx={{
                                    mt: 0.75,
                                    px: 1.25,
                                    py: 1,
                                    borderRadius: '14px',
                                    bgcolor: (t) => alphaColor(t.palette.success.main, 0.08),
                                    border: (t) => `1px solid ${alphaColor(t.palette.success.main, 0.22)}`,
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.25 }}>
                                    Updated
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, wordBreak: 'break-word' }}
                                >
                                    {renderTextWithMentions(String(helpResolutionText), onMentionClick)}
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>
                ) : null}

                {post.description ? (
                    <Box sx={{ mt: 1.25 }}>
                        <Box
                            sx={{
                                ...(descNeedsTruncate && !showFullDescription
                                    ? { maxHeight: 200, overflow: 'hidden', position: 'relative' }
                                    : {}),
                            }}
                        >
                            <RichTextDisplay html={post.description} />
                            {descNeedsTruncate && !showFullDescription ? (
                                <Box
                                    sx={(t) => ({
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: 48,
                                        background: `linear-gradient(transparent, ${t.palette.background.paper || '#fff'})`,
                                        pointerEvents: 'none',
                                    })}
                                />
                            ) : null}
                        </Box>
                        {descNeedsTruncate && !showFullDescription ? (
                            <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={() => setShowFullDescription(true)}
                                sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}
                            >
                                Show more
                            </Link>
                        ) : null}
                        {descNeedsTruncate && showFullDescription ? (
                            <Link
                                component="button"
                                type="button"
                                underline="hover"
                                onClick={() => setShowFullDescription(false)}
                                sx={{ fontSize: 14, fontWeight: 800, mt: 0.25 }}
                            >
                                Show less
                            </Link>
                        ) : null}
                    </Box>
                ) : null}

                {/* Poll (full interactive view) */}
                {String(post?.category || '').toLowerCase() === 'poll' && post?.poll && (
                    <PollDisplay
                        poll={post.poll}
                        postId={post.id}
                        variant="full"
                        isNonPersonal={isNonPersonal}
                        activeBusinessId={activeBusinessId}
                        activeArtistId={activeArtistId}
                    />
                )}

                {/* Photos */}
                {photos.length > 0 && <Carousel photos={photos} />}

                {/* Featured Business Card (Recommendations) */}
                {(() => {
                    const fbId = Number(post?.featured_business_id || 0);
                    const fbName = String(post?.featured_business_name || '').trim();
                    if (!fbId || !fbName) return null;
                    const fbSlug = String(post?.featured_business_slug || '').trim();
                    const fbAvatar = String(post?.featured_business_avatar_url || '').trim();
                    const fbCategory = String(post?.featured_business_category || '').replace(/_/g, ' ').trim();
                    const fbCity = String(post?.featured_business_city || '').trim();
                    const fbCounty = String(post?.featured_business_county || '').trim();
                    const fbLoc = [fbCity, fbCounty].filter(Boolean).join(', ');
                    return (
                        <>
                            <Divider sx={{ my: 1.5 }} />
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (fbSlug) window.location.assign(`/${fbSlug}`);
                                }}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    borderRadius: 2.5,
                                    overflow: 'hidden',
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: (t) => alphaColor(t.palette.primary.dark, 0.18),
                                    boxShadow: (t) => t.custom.shadows.xs,
                                    cursor: 'pointer',
                                    transition: (t) => `border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: (t) => t.custom.shadows.sm,
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                {/* Avatar / left accent */}
                                <Box
                                    sx={{
                                        width: { xs: 68, sm: 78 },
                                        minHeight: 78,
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: fbAvatar
                                            ? 'none'
                                            : 'linear-gradient(135deg, #0b3d2e 0%, #1a6b4f 100%)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {fbAvatar ? (
                                        <Box
                                            component="img"
                                            src={fbAvatar}
                                            alt=""
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ fontSize: 26, fontWeight: 800, color: 'common.white' }}>
                                            {String(fbName || '?')[0].toUpperCase()}
                                        </Typography>
                                    )}
                                </Box>

                                {/* Info */}
                                <Box sx={{ flex: 1, py: 1.25, px: 1.5, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                        <Box
                                            component="span"
                                            sx={{
                                                fontSize: 9,
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.6,
                                                color: 'primary.main',
                                                px: 0.75,
                                                py: 0.15,
                                                borderRadius: 999,
                                                bgcolor: (t) => alphaColor(t.palette.primary.dark, 0.08),
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            Recommended
                                        </Box>
                                    </Box>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 900,
                                            lineHeight: 1.3,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {fbName}
                                    </Typography>
                                    {fbSlug ? (
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display: 'block',
                                                mt: 0.15,
                                                color: 'text.secondary',
                                                fontWeight: 600,
                                                fontSize: 12,
                                            }}
                                        >
                                            @{fbSlug}
                                        </Typography>
                                    ) : null}
                                    {(fbCategory || fbLoc) ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                                            {fbCategory ? (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        display: 'inline-block',
                                                        px: 0.75,
                                                        py: 0.1,
                                                        borderRadius: 999,
                                                        fontSize: 10.5,
                                                        fontWeight: 700,
                                                        bgcolor: (t) => alphaColor(t.palette.primary.dark, 0.06),
                                                        color: 'primary.main',
                                                        textTransform: 'capitalize',
                                                        lineHeight: 1.5,
                                                    }}
                                                >
                                                    {fbCategory}
                                                </Box>
                                            ) : null}
                                            {fbLoc ? (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11.5, lineHeight: 1.2 }}>
                                                    {fbCategory ? '· ' : ''}{fbLoc}
                                                </Typography>
                                            ) : null}
                                        </Box>
                                    ) : null}
                                </Box>
                            </Box>
                        </>
                    );
                })()}

                {/* Location */}
                {(post.city || post.county || post.street_address || isStatewidePost) && (
                    <>
                        <Divider sx={{ my: 1.5 }} />
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                            <LocationOnRoundedIcon className="loc-icon" sx={(t) => ({ fontSize: t.custom.postDetail.locationIcon.fontSize, color: 'primary.main', mt: t.custom.postDetail.locationIcon.mt })} />
                            <Box>
                                {post.street_address && (
                                    <Typography variant="body2" sx={(t) => ({ ...t.custom.postDetail.locationText, color: 'primary.main' })}>
                                        {post.street_address}
                                    </Typography>
                                )}
                                {locationStr && (
                                    <Typography variant="body2" sx={(t) => ({ ...(post.street_address ? t.custom.postDetail.locationSecondary : t.custom.postDetail.locationText), color: 'primary.main' })}>
                                        {locationStr}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Divider sx={{ my: 1.5 }} />
                    </>
                )}

                {/* ACTION BAR */}
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 1.25,
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: 'background.paper',
                        borderColor: (t) => alphaColor(t.palette.primary.main, 0.14),
                    }}
                >
                    <ActionBar
                        key={`ab-${post.id}-${activeBusinessId || 0}-${activeArtistId || 0}`}
                        user={viewerUser}
                        postId={post.id}
                        post={post}
                        initialLikes={likes}
                        initiallyLiked={viewerLiked}
                        commentsCount={commentsCount}
                        initialReposts={reposts}
                        initiallyReposted={viewerReposted}
                        showBoost={!isGroupContext}
                        hideShare={Boolean(isGroupContext && groupCtx?.isPrivate)}
                        useShareDialog={Boolean(isGroupContext)}
                        onShare={!isGroupContext ? (() => setShareOpen(true)) : undefined}
                        onComment={() => {
                            const anchor = document.getElementById('comments-composer');
                            if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                    />
                </Paper>

                {/* Composer OR login prompt OR group-membership gate */}
                {viewerUser && isGroupContext && !isGroupMember && !groupMembershipLoading ? (
                    <Box
                        id="comments-composer"
                        sx={(t) => ({
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: alphaColor(t.palette.primary.main, 0.04),
                            textAlign: 'center',
                        })}
                    >
                        <GroupsIcon sx={{ fontSize: 32, color: 'primary.main', mb: 0.5, opacity: 0.7 }} />
                        <Typography sx={{ fontWeight: 900, mb: 0.5, color: 'text.primary' }}>
                            Join this group to comment
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            You must be a member of {groupCtx?.name ? `"${groupCtx.name}"` : 'this group'} to leave comments on posts.
                        </Typography>
                        {groupJoinError && (
                            <Typography sx={{ color: 'error.main', fontWeight: 800, mb: 1, fontSize: 13 }}>
                                {groupJoinError}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            size="small"
                            disableElevation
                            disabled={groupJoining}
                            onClick={handleJoinToComment}
                            startIcon={groupMembership?.visibility === 'private' || groupMembership?.visibility === 'hidden' ? <LockOutlinedIcon sx={{ fontSize: 16 }} /> : null}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 950,
                                px: 3,
                                py: 0.75,
                            }}
                        >
                            {groupJoining
                                ? 'Joining…'
                                : (groupMembership?.visibility === 'private' || groupMembership?.visibility === 'hidden')
                                    ? 'Request to Join Group'
                                    : 'Join Group to Comment'}
                        </Button>
                    </Box>
                ) : viewerUser ? (
                    <Box
                        id="comments-composer"
                        sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'nowrap' }}
                    >
                        <AccountAvatar
                            src={viewerAvatarUrl}
                            accountType={viewerAccountType}
                            profileType={viewerProfileType}
                            alt={viewerLabel || 'You'}
                            size={{ xs: 36, sm: 44 }}
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
                                label={`Leave a comment as ${viewerLabel}`}
                                placeholder="Write your comment…"
                                variant="outlined"
                                error={Boolean(commentError)}
                                helperText={commentError}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontWeight: 700,
                                        fontSize: { xs: 12, sm: 14 },
                                    },
                                    '& .MuiInputLabel-shrink': {
                                        fontSize: { xs: 13, sm: 14 },
                                    },
                                }}
                                inputProps={{ maxLength: COMMENT_MAX_CHARS }}
                                InputProps={{
                                    endAdornment: (commentText.trim() || commentFiles.length > 0 || commentImageUrls.length > 0) ? (
                                        <InputAdornment position="end" sx={{ alignSelf: 'flex-end', pb: 0.25 }}>
                                            <IconButton
                                                aria-label="Send comment"
                                                onClick={submitComment}
                                                disabled={posting || (!commentText.trim() && commentFiles.length === 0 && commentImageUrls.length === 0)}
                                                sx={SEND_BUTTON_SX}
                                            >
                                                {posting ? (
                                                    <CircularProgress size={16} sx={{ color: 'inherit' }} />
                                                ) : (
                                                    <ArrowUpwardRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
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

                            <Popper
                                open={Boolean(commentMention.open)}
                                anchorEl={commentInputRef.current}
                                placement="bottom-start"
                                disablePortal
                                sx={{ zIndex: 2000, width: '100%' }}
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
                                                    <ListItemText primary="No users found" primaryTypographyProps={{ fontWeight: 800 }} />
                                                </ListItem>
                                            ) : null}

                                            {!commentMentionLoading
                                                ? (commentMention.results || []).map((u) => {
                                                    const handle = coerceHandle(u);
                                                    const label = coerceName(u);
                                                    const avatar = u?.avatar_url || u?.profile_picture || '';
                                                    const accountType = String(u?.account_type || 'user').toLowerCase();
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
                                                                <Avatar src={avatar || undefined} sx={{ width: 32, height: 32, ...(!avatar ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
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
                                                                primary={label}
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
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        You need to{' '}
                        <Link href="/login" onClick={openLoginPopup} underline="hover">
                            log in
                        </Link>{' '}
                        to comment.
                    </Typography>
                )}

                <Divider sx={{ my: 1.5 }} />

                <RedditComments
                    postId={post.id}
                    post={post}
                    groupId={groupCtx?.id}
                    groupRoleMap={groupRoleMap}
                    onMergeRoleMap={mergeGroupRoleMap}
                    refreshKey={commentsRefreshKey}
                    addCommentRef={addCommentRef}
                    initialPageSize={50}
                    viewer={viewerUser}
                    postAuthor={postAuthor}
                    onOpenUserCard={handleOpenUserCard}
                    scrollToCommentId={deepLinkCommentId}
                    highlightCommentIds={deepLinkCommentIds}
                    onCopyLinkToast={() => setCopyLinkToast(true)}
                    groupCommentGated={Boolean(isGroupContext && !isGroupMember && !groupMembershipLoading)}
                />
            </Paper>

            {/* Shared user card popover */}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
                isSelf={isSelfForCard}
                following={isFollowingForCard}
                onFollow={handleFollow}
                onViewProfile={handleViewProfile}
            />

            <ShareDialog contentType="post" open={shareOpen} onClose={() => setShareOpen(false)} viewer={viewerUser} post={post} />

            {/* Group Rules Dialog — shown when a non-member tries to join to comment */}
            <Dialog
                open={groupRulesOpen}
                onClose={(_e, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                }}
                maxWidth="sm"
                fullWidth
                disableEscapeKeyDown
            >
                <DialogTitle sx={{ fontWeight: 950, display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                    <GavelOutlinedIcon sx={{ opacity: 0.9 }} />
                    Group Rules
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1, color: 'text.primary' }}>
                        You must agree to the rules of {groupCtx?.name ? `"${groupCtx.name}"` : 'this group'} before joining.
                    </Typography>
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            maxHeight: 340,
                            overflowY: 'auto',
                            p: 1.5,
                            '& p': { mt: 0, mb: 1 },
                            '& ul': { mt: 0.5, mb: 1.25, paddingLeft: 2.5 },
                            '& ol': { mt: 0.5, mb: 1.25, paddingLeft: 2.5 },
                        }}
                    >
                        <Box
                            sx={{ fontSize: 14, color: 'text.primary' }}
                            dangerouslySetInnerHTML={{ __html: String(groupRulesHtml || '').trim() }}
                        />
                    </Box>
                    {groupJoinError && (
                        <Typography sx={{ color: 'error.main', mt: 1.25, fontWeight: 800 }}>
                            {groupJoinError}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 2, pb: 2, pt: 1.25, gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setGroupRulesOpen(false);
                            setGroupRulesHtml('');
                            setGroupJoinError('');
                        }}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, px: 2 }}
                        disabled={groupJoining}
                    >
                        Decline
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAcceptRulesAndJoin}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 2.5 }}
                        disabled={groupJoining}
                    >
                        {groupJoining ? 'Joining…' : 'Accept & Join'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={pinDialogOpen}
                onClose={closeGroupPinDialog}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 950 }}>
                    {isPinnedInGroup ? 'Unpin this post?' : 'Pin this post?'}
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontWeight: 700, opacity: 0.85, mb: 1 }}>
                        {isPinnedInGroup
                            ? 'This post will no longer stay at the top of the group posts feed.'
                            : 'This post will be pinned to the top of the group posts feed.'}
                    </Typography>
                    {pinError ? (
                        <Typography sx={{ color: 'error.main', fontWeight: 800 }}>{pinError}</Typography>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2.25 }}>
                    <Button
                        onClick={closeGroupPinDialog}
                        disabled={pinSaving}
                        sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submitGroupPinToggle}
                        disabled={pinSaving}
                        sx={{ textTransform: 'none', fontWeight: 950, borderRadius: 999 }}
                    >
                        {isPinnedInGroup ? 'Unpin' : 'Pin'}
                    </Button>
                </DialogActions>
            </Dialog>

            {String(post?.category || '').toLowerCase() === 'poll' ? (
                <EditPollForm
                    open={editOpen}
                    postId={Number(post?.id || 0)}
                    onClose={async () => {
                        setEditOpen(false);

                        const updated = await reloadPost({ showSpinner: false });

                        if (updated && updated.id != null) {
                            const pid = Number(updated.id);

                            const isEdited = Boolean(
                                updated?.edited_at ||
                                updated?.editedAt ||
                                updated?.has_edits ||
                                updated?.edits_count ||
                                updated?.editsCount
                            );

                            if (isEdited && Number.isFinite(pid) && pid > 0) {
                                try {
                                    window.localStorage.setItem(`ll.communityPost.edited.${pid}`, '1');
                                } catch {
                                    // ignore
                                }
                            }

                            try {
                                window.dispatchEvent(
                                    new CustomEvent('ll:communityPost:updated', {
                                        detail: { postId: pid, post: updated, forceRefresh: true },
                                    })
                                );
                            } catch {
                                // ignore
                            }
                        }
                    }}
                />
            ) : (
                <EditCommunityPostDialog
                    open={editOpen}
                    postId={Number(post?.id || 0)}
                    onSaved={() => {
                        showPostSuccess('Post updated successfully');
                    }}
                    onClose={async () => {
                        setEditOpen(false);

                        const updated = await reloadPost({ showSpinner: false });

                        if (updated && updated.id != null) {
                            const pid = Number(updated.id);

                            const isEdited = Boolean(
                                updated?.edited_at ||
                                updated?.editedAt ||
                                updated?.has_edits ||
                                updated?.edits_count ||
                                updated?.editsCount
                            );

                            if (isEdited && Number.isFinite(pid) && pid > 0) {
                                try {
                                    window.localStorage.setItem(`ll.communityPost.edited.${pid}`, '1');
                                } catch {
                                    // ignore
                                }
                            }

                            try {
                                window.dispatchEvent(
                                    new CustomEvent('ll:communityPost:updated', {
                                        detail: { postId: pid, post: updated, forceRefresh: true },
                                    })
                                );
                            } catch {
                                // ignore
                            }
                        }
                    }}
                />
            )}

            <DeletePostConfirmDialog
                open={deleteConfirmOpen}
                postId={Number(post?.id || 0)}
                onClose={() => setDeleteConfirmOpen(false)}
                onDeleted={() => {
                    setDeleteConfirmOpen(false);

                    const deletedId = Number(post?.id || 0);
                    if (deletedId) {
                        try {
                            // Let CommunityPage/PostList/PostDetail clear selection + refetch.
                            window.dispatchEvent(
                                new CustomEvent('ll:communityPost:deleted', { detail: { postId: deletedId } })
                            );
                        } catch {
                            // ignore
                        }

                        try {
                            // If we navigate back to /community, avoid restoring a stale selectedPost from session cache.
                            sessionStorage.setItem('ll:community:pendingDeleteId', String(deletedId));
                            sessionStorage.setItem('ll:community:forceRefresh', '1');
                            sessionStorage.setItem('ll:community:postDeletedSuccess', '1');
                        } catch {
                            // ignore
                        }
                    }

                    try {
                        navigate('/community', { replace: true });
                    } catch {
                        // ignore
                    }
                }}
            />

            <Dialog
                open={markFoundOpen}
                fullWidth
                maxWidth="sm"
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closeMarkFoundDialog();
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Mark as Found</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                        Optionally add a short note (e.g., “Found near the park”).
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={6}
                        label="Message (optional)"
                        value={markFoundMessage}
                        onChange={(e) => setMarkFoundMessage(e.target.value)}
                        inputProps={{ maxLength: 500 }}
                    />

                    {markFoundError ? (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {markFoundError}
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={closeMarkFoundDialog}
                        disabled={markFoundSaving}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submitMarkFound}
                        disabled={markFoundSaving}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                        startIcon={<CheckCircleIcon />}
                    >
                        {markFoundSaving ? 'Saving…' : 'Mark as Found'}
                    </Button>
                </DialogActions>
            </Dialog>


            <Dialog
                open={markResolvedOpen}
                fullWidth
                maxWidth="sm"
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closeMarkResolvedDialog();
                }}
            >
                <DialogTitle sx={{ fontWeight: 900 }}>Mark as Resolved</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                        Optionally add a short update (this will show on the post like Lost &amp; Found updates).
                    </Typography>

                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        maxRows={8}
                        label="Update (optional)"
                        value={markResolvedMessage}
                        onChange={(e) => setMarkResolvedMessage(e.target.value)}
                        inputProps={{ maxLength: 1000 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            {String(markResolvedMessage || '').length}/1000
                        </Typography>
                    </Box>

                    {markResolvedError ? (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {markResolvedError}
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={closeMarkResolvedDialog}
                        disabled={markResolvedSaving}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={submitMarkResolved}
                        disabled={markResolvedSaving}
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                        startIcon={<CheckCircleIcon />}
                    >
                        {markResolvedSaving ? 'Saving…' : 'Mark as Resolved'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={historyOpen}
                fullWidth
                maxWidth="sm"
                fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closeHistoryDialog();
                }}
                PaperProps={{ sx: { position: 'relative' } }}
                sx={{ zIndex: 1400 }}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                    Edit History
                    <IconButton onClick={closeHistoryDialog} size="small" aria-label="Close" sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : null}

                    {!historyLoading && historyError ? (
                        <Alert severity="error" sx={{ mb: 1 }}>{historyError}</Alert>
                    ) : null}

                    {!historyLoading && !historyError && (!historyRows || historyRows.length === 0) ? (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>
                            This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                        </Typography>
                    ) : null}

                    {!historyLoading && !historyError && historyRows && historyRows.length > 0 ? (
                        <Box sx={{ position: 'relative', pl: 2.5 }}>
                            {/* Timeline vertical line */}
                            <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                            {historyRows.map((row, idx) => {
                                // Resolve snapshot: try dedicated snapshot field, then fall back to the row itself
                                const rawSnap = row?.snapshot ?? row?.snap ?? row?.data ?? null;
                                const snap = rawSnap && typeof rawSnap === 'object' ? { ...rawSnap } : { ...(row || {}) };
                                const rawPrevRow = idx + 1 < historyRows.length ? historyRows[idx + 1] : null;
                                const rawPrevSnap = rawPrevRow?.snapshot ?? rawPrevRow?.snap ?? rawPrevRow?.data ?? null;
                                const prevSnap = rawPrevSnap && typeof rawPrevSnap === 'object' ? { ...rawPrevSnap } : { ...(rawPrevRow || {}) };
                                const diff = row?.diff || {};
                                const isOriginal = idx === historyRows.length - 1;
                                const isLatest = idx === 0;
                                const version = row?.version != null ? row.version : historyRows.length - idx;

                                const editedAt = row?.edited_at || row?.editedAt || row?.updated_at || row?.updatedAt || snap?.edited_at || snap?.editedAt;
                                const editorHandleRaw = row?.editor_handle || row?.editorHandle || row?.handle || '';
                                const editorHandle = editorHandleRaw ? String(editorHandleRaw).replace(/^@/, '') : '';

                                // Helper: resolve poll options from multiple possible locations
                                const getPollOpts = (obj) => {
                                    if (!obj) return [];
                                    const candidates = [obj.pollOptions, obj.poll_options, obj.poll?.options, obj.options];
                                    for (const c of candidates) {
                                        if (Array.isArray(c) && c.length > 0) return c;
                                    }
                                    return [];
                                };

                                // Helper: resolve poll expiration from multiple possible locations
                                const getPollExp = (obj) => {
                                    if (!obj) return '';
                                    const sv = (v) => (v == null ? '' : String(v).trim());
                                    return sv(obj.pollExpiresAt || obj.poll_expires_at || obj.poll?.pollExpiresAt || obj.poll?.poll_expires_at || obj.poll?.expires_at || obj.poll?.expiresAt);
                                };

                                // Build diff items
                                const diffItems = [];
                                if (!isOriginal) {
                                    const s = (v) => (v == null ? '' : String(v).trim());
                                    if (s(snap.title) !== s(prevSnap.title)) diffItems.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
                                    if (s(snap.description) !== s(prevSnap.description)) {
                                        const prevDesc = s(prevSnap.description);
                                        const curDesc = s(snap.description);
                                        diffItems.push({ label: 'Description', from: prevDesc || '(empty)', to: curDesc || '(empty)' });
                                    }

                                    // Category changes
                                    const curCat = s(snap?.category);
                                    const prevCat = s(prevSnap?.category);
                                    const formatCat = (c) => c ? c.replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : '';
                                    if (curCat && prevCat && curCat !== prevCat) diffItems.push({ label: 'Category', from: formatCat(prevCat), to: formatCat(curCat) });

                                    // Location changes (city + county)
                                    const curCity = s(snap?.city);
                                    const prevCity = s(prevSnap?.city);
                                    const curCounty = s(snap?.county);
                                    const prevCounty = s(prevSnap?.county);
                                    if (curCity !== prevCity || curCounty !== prevCounty) {
                                        const fmtLoc = (c, co) => {
                                            const countyStr = co ? (co.toLowerCase().includes('county') ? co : `${co} County`) : '';
                                            return [c, countyStr].filter(Boolean).join(', ') || '(none)';
                                        };
                                        diffItems.push({ label: 'Location', from: fmtLoc(prevCity, prevCounty), to: fmtLoc(curCity, curCounty) });
                                    }

                                    // Visibility changes
                                    const curVis = s(snap?.visibility);
                                    const prevVis = s(prevSnap?.visibility);
                                    if (curVis && prevVis && curVis !== prevVis) {
                                        const fmtVis = (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
                                        diffItems.push({ label: 'Visibility', from: fmtVis(prevVis), to: fmtVis(curVis) });
                                    }

                                    // Poll option label changes
                                    const curOpts = getPollOpts(snap);
                                    const prevOpts = getPollOpts(prevSnap);
                                    if (curOpts.length > 0 && prevOpts.length > 0) {
                                        curOpts.forEach((co, coIdx) => {
                                            const po = prevOpts.find((p) => p.id === co.id);
                                            if (po) {
                                                const curLabel = s(co.label || co.text || co.option_text);
                                                const prevLabel = s(po.label || po.text || po.option_text);
                                                if (curLabel !== prevLabel) {
                                                    diffItems.push({ label: `Option ${coIdx + 1}`, from: prevLabel || '(empty)', to: curLabel || '(empty)' });
                                                }
                                            }
                                        });
                                    } else if (curOpts.length > 0 && prevOpts.length === 0) {
                                        diffItems.push({ label: 'Poll Options', changed: true, detail: `${curOpts.length} option${curOpts.length !== 1 ? 's' : ''} recorded` });
                                    }

                                    // Poll expiration changes
                                    const curExp = getPollExp(snap);
                                    const prevExp = getPollExp(prevSnap);
                                    if (curExp !== prevExp) {
                                        const fmtExp = (v) => {
                                            if (!v) return 'No limit';
                                            try { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(v)); } catch { return v; }
                                        };
                                        diffItems.push({ label: 'Expiration', from: fmtExp(prevExp), to: fmtExp(curExp) });
                                    }

                                    const added = Array.isArray(diff?.added) ? diff.added.filter(Boolean) : [];
                                    const removed = Array.isArray(diff?.removed) ? diff.removed.filter(Boolean) : [];
                                    const reordered = Boolean(diff?.reordered);
                                    if (added.length > 0 || removed.length > 0 || reordered) {
                                        const parts = [];
                                        if (added.length) parts.push(`${added.length} added`);
                                        if (removed.length) parts.push(`${removed.length} removed`);
                                        if (!parts.length && reordered) parts.push('reordered');
                                        diffItems.push({ label: 'Photos', changed: true, detail: parts.join(', '), photoAdded: added, photoRemoved: removed });
                                    }

                                    // Last resort: if we still have no diff items, check if the server-provided diff
                                    // object has any flags we can describe
                                    if (diffItems.length === 0 && diff && typeof diff === 'object') {
                                        if (diff.titleChanged) diffItems.push({ label: 'Title', changed: true, detail: 'Updated' });
                                        if (diff.bodyChanged) diffItems.push({ label: 'Description', changed: true, detail: 'Updated' });
                                        if (diff.locationChanged) diffItems.push({ label: 'Location', changed: true, detail: 'Updated' });
                                        if (diff.visibilityChanged) diffItems.push({ label: 'Visibility', changed: true, detail: 'Updated' });
                                        if (diff.pollExpirationChanged) diffItems.push({ label: 'Expiration', changed: true, detail: 'Updated' });
                                        const changedFields = Array.isArray(diff.changed_fields) ? diff.changed_fields : Array.isArray(diff.changedFields) ? diff.changedFields : [];
                                        changedFields.forEach((f) => {
                                            const label = String(f || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
                                            if (label && !diffItems.some((d) => d.label === label)) {
                                                diffItems.push({ label, changed: true, detail: 'Updated' });
                                            }
                                        });
                                    }
                                }

                                return (
                                    <Box key={row?.id || `${historyPostId || 'post'}-${version}-${idx}`} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                        {/* Timeline dot */}
                                        <Box sx={{
                                            position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                                            bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main',
                                            border: '2px solid', borderColor: 'background.paper',
                                            boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                            zIndex: 1,
                                        }} />
                                        {/* Version label + date */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${version}`}
                                            </Typography>
                                            <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>
                                                {editedAt ? dateTimeLabelShort(editedAt) : ''}
                                            </Typography>
                                            {editorHandle ? (
                                                <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>@{editorHandle}</Typography>
                                            ) : null}
                                        </Box>
                                        {/* Diff chips */}
                                        {!isOriginal && diffItems.length > 0 && (
                                            <Box sx={{ bgcolor: (t) => alphaColor(t.palette.primary.main, 0.025), border: '1px solid', borderColor: (t) => alphaColor(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {diffItems.map((item, i) => (
                                                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, py: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                            <Chip label={item.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: 'primary.dark', border: 'none', flexShrink: 0, mt: 0.1, '& .MuiChip-label': { px: 1 } }} />
                                                            {item.changed ? (
                                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.5, pt: 0.15 }}>{item.detail || 'Updated'}</Typography>
                                                            ) : item.label === 'Description' ? (() => {
                                                                const stripFragments = (v) => String(v || '').replace(/<!--\s*(?:Start|End)Fragment\s*-->/gi, '').trim();
                                                                return (
                                                                    <Box sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word', maxHeight: 200, overflowY: 'auto' }}>
                                                                        <Box sx={{ textDecoration: 'line-through', opacity: 0.55, mb: 0.5 }}>
                                                                            <RichTextDisplay html={stripFragments(item.from)} sx={{ fontSize: 'inherit', lineHeight: 'inherit', color: 'inherit' }} />
                                                                        </Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                                                            <Box component="span" sx={{ color: 'text.disabled', flexShrink: 0 }}>→</Box>
                                                                            <Box sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                                                <RichTextDisplay html={stripFragments(item.to)} sx={{ fontSize: 'inherit', lineHeight: 'inherit' }} />
                                                                            </Box>
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })() : (
                                                                <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word' }}>
                                                                    <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.55 }}>{item.from}</Box>
                                                                    <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
                                                                    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.to}</Box>
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {(item.photoAdded?.length > 0 || item.photoRemoved?.length > 0) && (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pl: 0.5, mt: 0.5 }}>
                                                                {(item.photoRemoved || []).slice(0, 4).map((url, pi) => (
                                                                    <Box key={`rm-${pi}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'error.main', opacity: 0.6 }}>
                                                                        <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)' }}>
                                                                            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                                {(item.photoAdded || []).slice(0, 4).map((url, pi) => (
                                                                    <Box key={`add-${pi}`} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1.5, overflow: 'hidden', border: '2px solid', borderColor: 'success.main' }}>
                                                                        <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                                                            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                        {!isOriginal && diffItems.length === 0 && (
                                            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', pl: 0.5 }}>Post details updated</Typography>
                                        )}
                                        {isOriginal && (
                                            <Box sx={{ bgcolor: (t) => alphaColor(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alphaColor(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                {snap.title && <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary', mb: 0.25 }}>{String(snap.title).trim()}</Typography>}
                                                <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>Original post created</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={closeHistoryDialog} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* ── Post edit/delete confirmation snackbar ── */}
            <SuccessSnackbar {...postSnackbarProps} />

            {/* Rate limit dialog for top-level comments */}
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

export default PostPage;

/* ---------- Local, lightweight carousel ---------- */
function Carousel({ photos, compact = false }) {
    const [index, setIndex] = useState(0);
    const touchStartRef = useRef(null);

    useEffect(() => {
        if (!Array.isArray(photos) || photos.length === 0) return;
        if (index > photos.length - 1) setIndex(0);
    }, [photos, index]);

    const prev = useCallback(
        () => setIndex((i) => (i - 1 + photos.length) % photos.length),
        [photos.length]
    );
    const next = useCallback(
        () => setIndex((i) => (i + 1) % photos.length),
        [photos.length]
    );

    const current = photos[index] || photos[0];
    const multiPhoto = photos.length > 1;
    const mainHeight = compact ? { xs: 240, sm: 340 } : { xs: 280, sm: 440 };

    const handleTouchStart = (e) => { touchStartRef.current = e.touches[0]?.clientX ?? null; };
    const handleTouchEnd = (e) => {
        if (touchStartRef.current == null) return;
        const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? touchStartRef.current);
        if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
        touchStartRef.current = null;
    };

    return (
        <Box sx={{ position: 'relative', mt: 2, userSelect: 'none' }}>
            {/* Main image container with blurred backdrop */}
            <Box
                onTouchStart={multiPhoto ? handleTouchStart : undefined}
                onTouchEnd={multiPhoto ? handleTouchEnd : undefined}
                sx={{
                    width: '100%',
                    height: mainHeight,
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Blurred background fill */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${current})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(30px) saturate(1.4)',
                        transform: 'scale(1.2)',
                        opacity: 0.45,
                    }}
                />
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alphaColor(t.palette.common.black, 0.06) }} />
                {/* Main image */}
                <Box
                    component="img"
                    key={current}
                    src={current}
                    alt={`Photo ${index + 1} of ${photos.length}`}
                    loading="lazy"
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
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
                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                                bgcolor: (t) => alphaColor(t.palette.common.white, 0.85), backdropFilter: 'blur(6px)',
                                boxShadow: (t) => t.custom.shadows.xs, width: 36, height: 36,
                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.white, 0.95) },
                            }}
                        >
                            <ChevronLeftIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <IconButton
                            aria-label="Next image"
                            onClick={next}
                            sx={{
                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 2,
                                bgcolor: (t) => alphaColor(t.palette.common.white, 0.85), backdropFilter: 'blur(6px)',
                                boxShadow: (t) => t.custom.shadows.xs, width: 36, height: 36,
                                '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.white, 0.95) },
                            }}
                        >
                            <ChevronRightIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </>
                )}

                {/* Counter badge top-right */}
                {multiPhoto && (
                    <Box
                        sx={{
                            position: 'absolute', top: 10, right: 10, zIndex: 2,
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.55), backdropFilter: 'blur(6px)', color: 'common.white',
                            px: 1.25, py: 0.25, borderRadius: 999, fontSize: 12, fontWeight: 800,
                        }}
                    >
                        {index + 1} / {photos.length}
                    </Box>
                )}

                {/* Dot indicators */}
                {multiPhoto && photos.length <= 8 && (
                    <Box
                        sx={{
                            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                            zIndex: 2, display: 'flex', gap: 0.75,
                        }}
                    >
                        {photos.map((_, i) => (
                            <Box
                                key={i}
                                onClick={() => setIndex(i)}
                                sx={{
                                    width: i === index ? 18 : 7, height: 7, borderRadius: 999,
                                    bgcolor: (t) => i === index ? t.palette.common.white : alphaColor(t.palette.common.white, 0.5),
                                    transition: (t) => `all ${t.custom.motion.slow}ms ${t.custom.motion.ease}`, cursor: 'pointer',
                                    boxShadow: (t) => t.custom.shadows.xs,
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Thumbnails strip (2+ photos) */}
            {multiPhoto && (
                <Box
                    sx={{
                        mt: 1, display: 'flex', justifyContent: 'center', gap: 0.75,
                        overflowX: 'auto', pb: 0.5, WebkitOverflowScrolling: 'touch',
                        '&::-webkit-scrollbar': { height: 4 },
                        '&::-webkit-scrollbar-thumb': { borderRadius: 999, bgcolor: (t) => alphaColor(t.palette.common.black, 0.15) },
                    }}
                >
                    {photos.map((u, i) => {
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
                                    width: compact ? { xs: 44, sm: 52 } : { xs: 52, sm: 60 },
                                    height: compact ? { xs: 44, sm: 52 } : { xs: 52, sm: 60 },
                                    objectFit: 'cover', borderRadius: 1.5, cursor: 'pointer', flex: '0 0 auto',
                                    border: '2px solid', borderColor: active ? 'primary.main' : 'transparent',
                                    opacity: active ? 1 : 0.65, transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                    '&:hover': { opacity: 1 },
                                }}
                            />
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}