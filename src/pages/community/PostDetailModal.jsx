import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { secureFetch } from '../../utils/secureFetch';
import { useParams,
    useLocation,
    useNavigate } from 'react-router-dom';
import ForumIcon from '@mui/icons-material/Forum';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

import { alpha as alphaColor, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import { getCommunityCategory, COMMUNITY_CATEGORY_META } from './utils/communityPostCategoryIcons';


import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CloseIcon from '@mui/icons-material/Close';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import PersonIcon from '@mui/icons-material/Person';
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
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import BlockIcon from '@mui/icons-material/Block';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import SuccessSnackbar from '../../components/SuccessSnackbar';
import SmartMenu from '../../components/SmartMenu';

import ActionBar, { ReportDialog } from '../../components/ActionBar';
import UserCardPopover from '../../components/UserCardPopover';
import AccountAvatar from '../../components/AccountAvatar';
import { useAuth } from '../../components/AuthModalContext';
import { useActiveAccount } from '../../components/AccountContext';
import { getAccountHeaders as getStaticAccountHeaders } from '../../utils/getAccountHeadersStatic';
import PollDisplay from './components/PollDisplay';
import ShareDialog from '../../components/ShareDialog';

import PulsingDots from '../../components/PulsingDots';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import CommentImageAttachments, { uploadFilesToGCS } from '../../components/CommentImageAttachments';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import GroupsIcon from '@mui/icons-material/Groups';
import RichTextDisplay from '../../components/RichTextDisplay';
import useRateLimit from '../../utils/useRateLimit';
import RateLimitDialog from '../../components/RateLimitDialog';
import { checkProfanity } from '../../utils/profanityCheck';

// Slice 2b: comment subsystem extracted to its own module so news articles
// (and anything else that wants threaded comments) can reuse it via the
// injectable `resourceContext` prop. Zero behavior change for post comments —
// when resourceContext isn't passed, RedditComments uses the original
// community-post URL chains internally.
import RedditComments, {
    ComposerAvatar,
    MentionAccountBadge,
    resolveMentionHandle,
} from './comments/CommentThread';

function normalizePostForDetail(raw) {
    if (!raw) return null;

    // If this is a group post coming from /api/groups/:id/posts, normalize into the shape
    // the existing PostPage expects.
    const isGroupPost =
        raw.postType === 'group' ||
        raw.groupId != null ||
        raw.group_id != null ||
        raw.group_post_id != null;

    if (!isGroupPost) return raw;

    const id = raw.id ?? raw.group_post_id ?? raw.groupPostId;
    const createdAt = raw.createdAt ?? raw.created_at ?? raw.created;
    const updatedAt = raw.updatedAt ?? raw.updated_at ?? raw.updated;

    const authorUsername =
        raw.authorUsername ??
        raw.username ??
        raw.user_username ??
        raw.author?.username ??
        raw.author_name ??
        raw.authorName ??
        '';

    const authorId =
        raw.authorId ??
        raw.user_id ??
        raw.userId ??
        raw.author?.id ??
        raw.author?.userId ??
        null;

    const imageUrl =
        raw.imageUrl ??
        raw.image_url ??
        raw.photo_url ??
        raw.thumbnail ??
        raw.cover_url ??
        raw.cover ??
        null;

    return {
        ...raw,
        id,
        // unify core text fields
        title: raw.title ?? raw.subject ?? 'Group Post',
        body: raw.body ?? raw.content ?? raw.text ?? raw.message ?? '',
        // carry group context
        postType: 'group',
        groupId: raw.groupId ?? raw.group_id ?? null,
        // unify author bits
        user_id: raw.user_id ?? authorId,
        username: raw.username ?? authorUsername,
        // unify date bits
        created_at: raw.created_at ?? createdAt,
        updated_at: raw.updated_at ?? updatedAt,
        // unify image bits for existing gallery logic
        photo_url: raw.photo_url ?? imageUrl,
        image: raw.image ?? imageUrl,
        // ensure counts exist to avoid undefined UI
        likeCount: raw.likeCount ?? raw.likesCount ?? raw.likes ?? 0,
        commentCount: raw.commentCount ?? raw.commentsCount ?? raw.comments ?? 0,
    };
}
const api = process.env.REACT_APP_API_URL || '';

// Slice 2b: this constant is used by PostPage (the post composer character
// counter) as well as by the extracted comment subsystem in CommentThread.jsx.
// We keep a local copy here rather than importing from CommentThread to keep
// the bundler's circular-dependency graph clean and to preserve the original
// pre-extraction value.
const COMMENT_MAX_CHARS = 15000;

/* ---------- Relative time helper ---------- */
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

/* ---------- Compact relative time helper (for post headers / map popups) ---------- */
const timeAgoCompact = (input) => {
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
    if (w < 5) return `${w}wk ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}yr ago`;
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
const BADGE = Object.fromEntries(
    Object.entries(COMMUNITY_CATEGORY_META).map(([key, meta]) => [key, { label: meta.label, Icon: meta.Icon }])
);

const deriveSplitCategory = (post) => {
    let cat = String(post?.category || '').toLowerCase();
    if (cat === 'recommendations-tips' || cat === 'tips' || cat === 'tip') return 'recommendations';
    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests' || cat === 'volunteer-help') {
        const kind = String(post?.request_kind || post?.requestKind || '').toLowerCase();
        if (kind === 'volunteer' || kind === 'offer' || kind === 'offering') return 'volunteers';
        if (kind === 'help' || kind === 'request' || kind === 'help-request' || kind === 'help_request') return 'help-requests';
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

const CategoryChip = ({ badge, subcategory = '' }) => {
    if (!badge) return null;
    const BadgeIcon = badge.Icon;
    const showSubcategory = badge.label === 'Help Request' && subcategory;

    if (showSubcategory) {
        return (
            <Chip
                size="small"
                icon={BadgeIcon ? <BadgeIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1, py: 0.1 }}>
                        <Box sx={{ fontSize: 10, fontWeight: 900, opacity: 0.85 }}>{badge.label}</Box>
                        <Box
                            sx={{
                                fontSize: 11,
                                fontWeight: 900,
                                textTransform: 'none',
                                maxWidth: 140,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {subcategory}
                        </Box>
                    </Box>
                }
                sx={(t) => ({
                    height: 32,
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
    }

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
    if (!post) return [];
    let processed = [];
    const { photos } = post;

    if (Array.isArray(photos)) {
        processed = photos.filter((p) => p && typeof p === 'string' && p !== 'null');
    } else if (typeof photos === 'string' && photos !== 'null' && photos.trim()) {
        try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed)) processed = parsed.filter((p) => p && typeof p === 'string' && p !== 'null');
        } catch {
            processed = [photos];
        }
    }

    if (!processed.length) {
        const oneOffs = [
            post.photo_url,
            post.photo,
            post.image_url,
            post.image,
            post.thumbnail,
            post.main_photo_url,
            post.cover,
            post.cover_url,
        ]
            .filter((u) => typeof u === 'string' && u && u !== 'null')
            .slice(0, 10);
        if (oneOffs.length) processed = oneOffs;
    }
    if (!processed.length && Array.isArray(post.community_photos)) {
        processed = post.community_photos.map((r) => r?.url || r?.photo_url || r?.path || null).filter(Boolean);
    }
    if (!processed.length && typeof post.photos_json === 'string') {
        try {
            const arr = JSON.parse(post.photos_json);
            if (Array.isArray(arr)) processed = arr.filter((u) => typeof u === 'string' && u);
        } catch {
            /* ignore */
        }
    }
    return processed;
};

/* ---------- Help / Volunteer detail helpers ---------- */
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

const DEFAULT_AVATAR_SX = {
    bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08),
    color: 'primary.main',
};

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


/* ---------- @mention rendering (clickable -> UserCardPopover) ---------- */
const renderTextWithMentions = (text, onMentionClick) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;

    // Combined regex: URLs (http/https/www) and @mentions
    const urlRe = /https?:\/\/[^\s<>\"')\]]+|www\.[^\s<>\"')\]]+/gi;
    const mentionRe = /@([a-zA-Z0-9_]{2,30})/g;

    // Collect all matches with their positions
    const matches = [];

    let m;
    while ((m = urlRe.exec(raw)) !== null) {
        // Strip trailing punctuation that's likely not part of the URL
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


function HelpVolunteerDetailsPanel({ post, derivedCategory, isUrgent }) {
    const isHelpRequest = ['help-requests', 'help_requests', 'help request', 'help requests'].includes(String(derivedCategory || '').toLowerCase());
    const isVolunteerOffer = ['volunteers', 'volunteer-requests', 'volunteer_requests'].includes(String(derivedCategory || '').toLowerCase());
    const shouldShow = isHelpRequest || isVolunteerOffer;

    // Only show Urgent chip here - helpTypeLabel is now in the category badge
    if (!shouldShow || !isUrgent) return null;

    return (
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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
        </Box>
    );
}


/* ========================================================================== */
/* Main PostPage                                                              */
/* ========================================================================== */
export default function PostPage({ embedded = false, post: initialPost = null, user: initialUser = null, hideCategoryChip = false, topRightSlot = null, onLocationClick = null, groupMembershipGated = false, onJoinGroup = null, scrollToCommentId: scrollToCommentIdProp = null, highlightCommentId: highlightCommentIdProp = null }) {
    const { id: routeId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount } = useActiveAccount();
    const isNonPersonal = isBusinessAccount || isArtistAccount;
    const pdmTheme = useTheme();
    const isMobile = useMediaQuery(pdmTheme.breakpoints.down("md"));

    const statePost = location?.state?.post || null;

    const scrollToCommentId = scrollToCommentIdProp ?? location?.state?.scrollToCommentId ?? null;
    const highlightCommentId = highlightCommentIdProp ?? location?.state?.highlightCommentId ?? null;

    // Clear one-time deep-link state so it doesn't re-trigger on back/refresh.
    // IMPORTANT: Do NOT include location.state in the dep array — navigate()
    // creates a new state reference which would re-trigger this effect and cause
    // an infinite update loop.
    // Skip clearing when IDs came from props (embedded mode).
    const deepLinkCleared = useRef(false);
    useEffect(() => {
        if (deepLinkCleared.current) return;
        if (scrollToCommentIdProp != null || highlightCommentIdProp != null) return; // came from props, skip
        if (!location?.state) return;
        if (scrollToCommentId == null && highlightCommentId == null) return;

        deepLinkCleared.current = true;
        const nextState = { ...location.state };
        delete nextState.scrollToCommentId;
        delete nextState.highlightCommentId;

        navigate(location.pathname, { replace: true, state: nextState });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, location.pathname, scrollToCommentId, highlightCommentId]);

    // ---- All hooks are declared BEFORE any early returns ----
    const normalizedInitialPost = normalizePostForDetail(initialPost || statePost);
    const [post, setPost] = useState(normalizedInitialPost);
    const [loading, setLoading] = useState(!initialPost && !statePost);
    const [viewer, setViewer] = useState(initialUser);
    // Shared user card popover state (author + commenters)
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [userCardViewProfileOnly, setUserCardViewProfileOnly] = useState(false);
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

    // Account switch triggers a full page reload (Header.jsx), so no
    // mid-session account-change detection is needed for comments.

    // Listen for "focus comment" events dispatched when user clicks the comment icon on a card
    const pendingFocusRef = useRef(false);

    useEffect(() => {
        const handler = (e) => {
            const targetId = e?.detail?.postId;
            const currentId = post?.id ?? post?.post_id;

            // If this post is already displayed, focus immediately
            if (targetId != null && currentId != null && String(targetId) === String(currentId)) {
                const el = commentInputRef.current;
                if (el) {
                    setTimeout(() => {
                        el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                        el.focus?.();
                    }, 50);
                    return;
                }
            }
            // Otherwise, mark pending so it fires when the post mounts
            pendingFocusRef.current = true;
        };
        window.addEventListener('ll:community:focusComment', handler);
        return () => window.removeEventListener('ll:community:focusComment', handler);
    }, [post?.id, post?.post_id]);

    // When the post changes and a focus was pending, focus the comment input
    useEffect(() => {
        if (!pendingFocusRef.current) return;
        pendingFocusRef.current = false;
        const tryFocus = (attempts) => {
            if (attempts <= 0) return;
            const el = commentInputRef.current;
            if (el) {
                el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                el.focus?.();
            } else {
                setTimeout(() => tryFocus(attempts - 1), 200);
            }
        };
        // Give the component time to fully render with the new post
        setTimeout(() => tryFocus(5), 300);
    }, [post?.id, post?.post_id]);

    // Description clamp (prevents a single long token from breaking layout)
    const [showFullDescription, setShowFullDescription] = useState(false);
    useEffect(() => {
        setShowFullDescription(false);
    }, [post?.id]);

    // Sync with prop when embedded so selecting another card updates the detail pane
    // Also merges when the same post is updated (e.g., edited photos) so the detail view stays current.
    useEffect(() => {
        if (!embedded || !initialPost) return;

        setPost((prev) => {
            if (!prev) return normalizePostForDetail(initialPost);

            const prevId = prev?.id != null ? String(prev.id) : '';
            const nextId = initialPost?.id != null ? String(initialPost.id) : (initialPost?.group_post_id != null ? String(initialPost.group_post_id) : '');

            if (prevId && nextId && prevId !== nextId) return initialPost;

            if (prev === initialPost) return prev;

            return { ...prev, ...initialPost };
        });

        setLoading(false);
    }, [embedded, initialPost]);

    // If the viewer hides/blocks the author while this detail view is open (embedded),
    // immediately clear the selection so the right pane doesn't keep showing the post.
    useEffect(() => {
        if (!embedded) return;

        const onHiddenChanged = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            const hidden = Boolean(e?.detail?.hidden);
            if (!hidden) return;

            const authorId = Number(post?.user_id || post?.userId || 0);
            if (uid && authorId && uid === authorId) {
                setPost(null);
                setLoading(false);
            }
        };

        const onBlockedChanged = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            const blocked = Boolean(e?.detail?.blocked);
            if (!blocked) return;

            const authorId = Number(post?.user_id || post?.userId || 0);
            if (uid && authorId && uid === authorId) {
                setPost(null);
                setLoading(false);
            }
        };

        window.addEventListener('ll:user:hidden-changed', onHiddenChanged);
        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);

        return () => {
            window.removeEventListener('ll:user:hidden-changed', onHiddenChanged);
            window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
        };
    }, [embedded, post?.user_id, post?.userId]);


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

    // Fetch / refresh post with correct account params.
    // When post comes from nav state we show it immediately (no loading flash)
    // but still fire a background fetch to get correct viewerLiked/viewerReposted.
    // When embedded, the parent provides most updates — but on account switch we
    // still need an independent fetch because the parent may not re-supply the
    // selected post detail with the new account's viewerLiked/viewerReposted.
    // Ref for the event-driven fetchLatest closure (which only depends on activePostId)
    const acctRef = useRef({ activeBusinessId, activeArtistId });
    acctRef.current = { activeBusinessId, activeArtistId };
    useEffect(() => {
        const id = post?.id || routeId;
        if (!id) return;

        // When embedded: still fetch fresh data to get accurate counts,
        // but don't show a loading spinner since we already have the post content.
        const showSpinner = !embedded && !post;
        if (showSpinner) setLoading(true);

        let cancelled = false;
        (async () => {
            try {
                const params = new URLSearchParams();
                if (activeBusinessId) params.set('activeBusinessId', activeBusinessId);
                else if (activeArtistId) params.set('activeArtistId', activeArtistId);
                const qs = params.toString() ? `?${params.toString()}` : '';

                let res = await secureFetch(`/api/community/${encodeURIComponent(id)}${qs}`, { credentials: 'include' });
                if (!res.ok) {
                    const res2 = await secureFetch(`/api/community/posts/${encodeURIComponent(id)}${qs}`, { credentials: 'include' });
                    if (res2.ok) res = res2;
                }
                const data = await res.json();
                const fresh = Array.isArray(data) ? data[0] : data;
                if (!cancelled && fresh && typeof fresh === 'object') {
                    if (embedded) {
                        // Merge fresh counts + viewer state into existing post to avoid flicker
                        setPost((prev) => prev ? {
                            ...prev,
                            likesCount: fresh.likesCount ?? fresh.likes_count ?? fresh.like_count ?? fresh.likes ?? prev.likesCount,
                            likes_count: fresh.likes_count ?? fresh.likesCount ?? fresh.like_count ?? fresh.likes ?? prev.likes_count,
                            commentsCount: fresh.commentsCount ?? fresh.comments_count ?? fresh.comment_count ?? fresh.comments ?? prev.commentsCount,
                            comments_count: fresh.comments_count ?? fresh.commentsCount ?? fresh.comment_count ?? fresh.comments ?? prev.comments_count,
                            repostsCount: fresh.repostsCount ?? fresh.reposts_count ?? fresh.repost_count ?? fresh.reposts ?? prev.repostsCount,
                            reposts_count: fresh.reposts_count ?? fresh.repostsCount ?? fresh.repost_count ?? fresh.reposts ?? prev.reposts_count,
                            viewerLiked: fresh.viewerLiked ?? fresh.viewer_liked ?? fresh.liked ?? fresh.is_liked ?? prev.viewerLiked,
                            viewer_liked: fresh.viewer_liked ?? fresh.viewerLiked ?? fresh.liked ?? fresh.is_liked ?? prev.viewer_liked,
                            viewerReposted: fresh.viewerReposted ?? fresh.viewer_reposted ?? fresh.reposted ?? fresh.is_reposted ?? prev.viewerReposted,
                            viewer_reposted: fresh.viewer_reposted ?? fresh.viewerReposted ?? fresh.reposted ?? fresh.is_reposted ?? prev.viewer_reposted,
                            // Also merge author info in case initial post was missing it
                            first_name: prev.first_name || fresh.first_name,
                            last_name: prev.last_name || fresh.last_name,
                            handle: prev.handle || fresh.handle,
                            avatar_url: prev.avatar_url || fresh.avatar_url,
                            profile_picture: prev.profile_picture || fresh.profile_picture,
                            profileImageUrl: prev.profileImageUrl || fresh.profileImageUrl,
                            account_type: prev.account_type || fresh.account_type,
                            account_name: prev.account_name || fresh.account_name,
                            account_avatar_url: prev.account_avatar_url || fresh.account_avatar_url,
                            business_name: prev.business_name || fresh.business_name,
                            business_avatar_url: prev.business_avatar_url || fresh.business_avatar_url,
                            business_slug: prev.business_slug || fresh.business_slug,
                            artist_name: prev.artist_name || fresh.artist_name,
                            artist_avatar_url: prev.artist_avatar_url || fresh.artist_avatar_url,
                            artist_handle: prev.artist_handle || fresh.artist_handle,
                            name: prev.name || fresh.name,
                            authorName: prev.authorName || fresh.authorName,
                            author_name: prev.author_name || fresh.author_name,
                        } : fresh);
                    } else {
                        setPost(fresh);
                    }
                }
            } catch {
                if (!cancelled && showSpinner) setPost(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeId]);

    const backToList = useCallback(() => {
        try {
            const url = sessionStorage.getItem('ll:community:url');
            if (url) {
                navigate(url);
                return;
            }
        } catch {}
        navigate(-1);
    }, [navigate]);

    const photos = useMemo(
        () => extractPhotos(post || {}),
        [
            post,
            post?.photos,
            post?.photos_json,
            post?.photo_url,
            post?.image_url,
            post?.main_photo_url,
            post?.cover_url,
            post?.community_photos,
        ]
    );
    // NOTE: For group posts, the inline thumbnail belongs on the *preview card* (GroupPostCard),
    // not inside the detail view. Keep the detail layout consistent with Community post detail.

    const badgeMeta = useMemo(() => buildBadgeFor(post || {}), [post]);
    const derivedCategory = useMemo(() => deriveSplitCategory(post || {}), [post]);

    const expiresAtLabel = useMemo(() => {
        const raw = (post?.expires_at ?? post?.expiresAt ?? null);
        if (!raw) return '';
        return dateTimeLabelShort(raw);
    }, [post?.expires_at, post?.expiresAt]);

    const showExpiresAt = derivedCategory === 'public-safety-alerts' && Boolean(expiresAtLabel);

    const isGroupPost = Boolean(
        post?.__ll_group_post ||
        post?.postType === 'group' ||
        post?.groupId != null ||
        post?.group_id != null ||
        post?.group_post_id != null ||
        post?.groupPostId != null
    );

    const groupObj = post?.group && typeof post.group === 'object' ? post.group : null;
    const postGroupId = post?.group_id ?? post?.groupId ?? post?.groupID ?? post?.community_group_id ?? post?.group_post_group_id ?? post?.group_post?.group_id ?? groupObj?.id ?? groupObj?.group_id ?? null;
    const postGroupName = String(
        post?.group_name ?? post?.groupName ?? post?.groupTitle ?? post?.group_post_group_name ?? post?.group_post?.group_name ?? groupObj?.name ?? groupObj?.group_name ?? ''
    ).trim();
    const postGroupAvatarUrl = String(
        post?.group_image_url ?? post?.groupImageUrl ?? post?.groupAvatarUrl ?? post?.group_post_group_image_url ?? post?.group_post?.group_image_url ?? groupObj?.image_url ?? groupObj?.photo_url ?? groupObj?.avatar_url ?? ''
    ).trim();

    const isUrgent = Boolean(Number(post?.is_urgent ?? post?.isUrgent ?? post?.urgent ?? 0));
    const displayCategoryLabel = badgeMeta?.label || post?.category_name || post?.category || '';

    // Help type label for Help Requests (shown in category badge)
    const helpTypeLabel = useMemo(() => {
        const helpTypeRaw = String(post?.help_type || '').trim().toLowerCase();
        const helpTypeOther = String(post?.help_type_other || post?.other_help_type || '').trim();

        if (!helpTypeRaw) return '';

        let helpTypeKey = helpTypeRaw
            .replace(/&/g, 'and')
            .replace(/\s+/g, '_')
            .replace(/-+/g, '_')
            .trim();

        if (helpTypeKey === 'care_and_support' || helpTypeKey === 'care_and_upport') helpTypeKey = 'care';

        if (helpTypeKey === 'other') {
            return helpTypeOther ? `Other: ${helpTypeOther}` : 'Other';
        }

        return HELP_TYPE_LABELS[helpTypeKey] || HELP_TYPE_LABELS[helpTypeRaw] || helpTypeRaw;
    }, [post?.help_type, post?.help_type_other, post?.other_help_type]);

    const showHelpVolunteerPanel = useMemo(() => {
        const dc = String(derivedCategory || '').trim().toLowerCase();
        return dc === 'help-requests' || dc === 'volunteers' || dc === 'volunteer-requests';
    }, [derivedCategory]);

    // counts & viewer flags for ActionBar — derived directly from `post`.
    // Account switch triggers a hard page reload (Header.jsx), so we don't need
    // complex account-change sync or separate stable state.  ActionBar's own
    // in-memory cache + cooldown mechanism handles optimistic state internally.
    const abLikes = Number(post?.likesCount ?? post?.likes_count ?? post?.like_count ?? post?.likes ?? 0);
    const abViewerLiked = Boolean(post?.viewerLiked ?? post?.viewer_liked ?? post?.liked ?? post?.is_liked ?? false);
    const abReposts = Number(post?.repostsCount ?? post?.reposts_count ?? post?.repost_count ?? post?.reposts ?? 0);
    const abViewerReposted = Boolean(post?.viewerReposted ?? post?.viewer_reposted ?? post?.reposted ?? post?.is_reposted ?? false);
    const abCommentsCount = Number(
        post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0
    );

    // IMPORTANT: For ownership checks, use the logged-in user from auth context
    // The `viewer` prop might be the profile owner when viewing someone else's profile
    const authCtx = useAuth();
    const viewerUser = authCtx?.user || null;

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
        // For artist accounts ALWAYS fetch so we get an authoritative
        // profile_type from the music_artists row (mirrors
        // ArtistAdminConsole's pattern). Business accounts can short-circuit
        // when avatar is already in context.
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
                // For artist accounts, always set a normalized profile type
                // so the composer fallback icon renders correctly.
                if (isArtistAccount) {
                    setFetchedAccountProfileType2(pt === 'artist' ? 'artist' : 'music');
                }
                // Patch localStorage so Header and other consumers see the
                // right value. Overwrite unconditionally so stale cached
                // values get corrected.
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
    // Sub-type for artist viewers: 'music' (default) or 'artist' (visual
    // artist). The fetched value from /api/music/artists/:id is authoritative
    // — mirrors the pattern in ArtistAdminConsole which reads profile_type
    // directly from the artist row. Falls back to the context, then
    // localStorage, then 'music'.
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
    const postAuthorId =
        post?.user_id ?? post?.author_id ?? post?.user?.id ?? post?.uid ?? post?.owner_id ?? null;

    // package author info for robust matching
    const postAuthor = useMemo(() => {
        const name = `${post?.first_name || ''} ${post?.last_name || ''}`.trim()
            || post?.name || post?.authorName || post?.author_name || post?.account_name
            || post?.business_name || post?.artist_name
            || '';
        return {
            id: postAuthorId != null ? String(postAuthorId) : null,
            handle: post?.handle || post?.account_handle || null,
            public_id: post?.public_id != null ? String(post.public_id) : null,
            name,
        };
    }, [post, postAuthorId]);


    // Strict ownership check - only compare numeric user IDs
    const isOwner = useMemo(() => {
        const vid = Number(viewerUser?.id || 0);
        const aid = Number(postAuthorId || 0);

        // Must have valid IDs to compare
        if (!vid || !aid) return false;

        // Only the exact user ID match counts as owner
        return vid === aid;
    }, [viewerUser?.id, postAuthorId]);

    // Only the post owner can manage (edit/delete) posts
    // Business/artist accounts cannot edit/delete personal community posts (same logic as PostList)
    const canManagePost = isOwner && !isNonPersonal;


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

    // Hide/block state + toast
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    const handleCopyPostLink = useCallback((e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const postUrl = `${window.location.origin}/posts/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            setCopyLinkToast(true);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = postUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopyLinkToast(true);
        });
    }, [closeOwnerMenu, postId]);

    const handleReportMenuClick = useCallback((e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        setReportDialogOpen(true);
    }, [closeOwnerMenu]);

    // ── Hide posts / Block user handlers ──
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

    const submitPostReport = useCallback(async ({ reason, details }) => {
        // Don't close the dialog - let ReportDialog show the thank you message
        const urls = [
            `/api/posts/${encodeURIComponent(postId)}/flag`,
            `/api/community/${encodeURIComponent(postId)}/flag`,
            `/api/community/posts/${encodeURIComponent(postId)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason, details }),
                });
                if (res.ok) {
                    return; // Success - ReportDialog will show thank you message
                }
            } catch {
                // try next
            }
        }
    }, [postId]);

    const isEdited = Boolean(post?.edited_at || post?.editedAt);

    // ── Edit history dialog state (local, not delegated to parent) ──
    const [editHistOpen, setEditHistOpen] = useState(false);
    const [editHistRows, setEditHistRows] = useState([]);
    const [editHistLoading, setEditHistLoading] = useState(false);
    const [editHistError, setEditHistError] = useState('');

    const lostOrFound = String(post?.lost_or_found || '').trim().toLowerCase();
    const isLostFoundPost =
        Boolean(lostOrFound) ||
        ['lost-found', 'lost-and-found'].includes(String(derivedCategory || '').trim().toLowerCase());

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

    const isHelpRequestPost = String(derivedCategory || '').trim().toLowerCase() === 'help-requests';
    const helpResolvedAt = (isHelpRequestPost && !isLostFoundPost) ? (post?.resolved_at || post?.resolvedAt || null) : null;
    const helpResolutionText = isHelpRequestPost ? String(post?.resolution_text || post?.resolutionText || '').trimEnd() : '';
    const helpIsResolvedFlag = isHelpRequestPost ? Number(post?.is_resolved ?? post?.isResolved ?? 0) : 0;
    const isHelpResolved = Boolean(isHelpRequestPost && (helpIsResolvedFlag || helpResolvedAt || helpResolutionText));

    const DETAIL_DESC_PREVIEW_CHARS = 650;
    const fullDescRaw = post?.description != null ? String(post.description) : '';
    const fullDescTrimmed = fullDescRaw.trim();
    const descNeedsTruncate = fullDescTrimmed.length > DETAIL_DESC_PREVIEW_CHARS;
    const descDisplay = (!descNeedsTruncate || showFullDescription)
        ? fullDescRaw
        : `${fullDescTrimmed.slice(0, DETAIL_DESC_PREVIEW_CHARS).trimEnd()}...`;

    const canMarkFound = isOwner && lostOrFound === 'lost' && !isLostFoundResolved;
    const canMarkResolved = Boolean(isOwner && isHelpRequestPost && !isHelpResolved && !isLostFoundPost);


    const fire = useCallback((eventName, detail) => {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch {
            // ignore
        }
    }, []);
    const requestEdit = useCallback((e) => {
        if (e) e.stopPropagation();
        if (!postId || !post) return;
        fire('ll:communityPost:requestEdit', { postId, post });
    }, [fire, postId, post]);

    const requestDelete = useCallback((e) => {
        if (e) e.stopPropagation();
        if (!postId || !post) return;
        fire('ll:communityPost:requestDelete', { postId, post });
    }, [fire, postId, post]);

    const requestMarkFound = useCallback((e) => {
        if (e) e.stopPropagation();
        if (!postId || !post) return;
        fire('ll:communityPost:requestMarkFound', { postId, post });
    }, [fire, postId, post]);

    const requestMarkResolved = useCallback((e) => {
        if (e) e.stopPropagation();
        if (!postId || !post) return;
        fire('ll:communityPost:requestMarkResolved', { postId, post });
    }, [fire, postId, post]);

    const openEditedHistory = useCallback((e) => {
        if (e) e.stopPropagation();
        const pid = postId || post?.id;
        if (!pid) return;
        setEditHistOpen(true);
        setEditHistLoading(true);
        setEditHistError('');
        setEditHistRows([]);
        secureFetch(`/api/community/${encodeURIComponent(pid)}/edits`, {
            credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
        })
            .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
            .then((data) => setEditHistRows(Array.isArray(data) ? data : []))
            .catch((err) => setEditHistError(err?.message || 'Failed to load edit history.'))
            .finally(() => setEditHistLoading(false));
    }, [postId, post]);

    const activePostId = routeId || postId;

    useEffect(() => {
        if (!activePostId) return;

        let alive = true;

        let fetchTimer = null;

        const coercePostFromEvent = (e) => {
            const d = e?.detail;
            if (!d) return null;
            if (d?.post && typeof d.post === 'object') return d.post;
            if (typeof d === 'object' && d?.id != null) return d;
            return null;
        };

        const fetchLatest = async (pid) => {
            try {
                // Include active account params so viewerLiked/viewerReposted
                // reflect the correct account (prevents blink after like/repost).
                const qp = new URLSearchParams();
                const acct = acctRef.current;
                if (acct.activeBusinessId) qp.set('activeBusinessId', acct.activeBusinessId);
                else if (acct.activeArtistId) qp.set('activeArtistId', acct.activeArtistId);
                const qs = qp.toString() ? `?${qp.toString()}` : '';

                let res = await secureFetch(`/api/community/${encodeURIComponent(pid)}${qs}`, { credentials: 'include' });
                if (!res.ok) {
                    const res2 = await secureFetch(`/api/community/posts/${encodeURIComponent(pid)}${qs}`, { credentials: 'include' });
                    if (res2.ok) res = res2;
                }
                const data = await res.json().catch(() => null);
                if (!alive) return;
                const normalized = Array.isArray(data) ? data[0] : data;
                if (normalized && typeof normalized === 'object') {
                    setPost((prev) => ({ ...(prev || {}), ...normalized }));
                }
            } catch {
                // ignore
            }
        };

        const onUpdatedLike = (e) => {
            const next = coercePostFromEvent(e);
            const pid = next?.id ?? e?.detail?.postId ?? e?.detail?.id ?? null;
            if (pid == null) return;
            if (String(pid) !== String(activePostId)) return;

            if (next && typeof next === 'object') {
                setPost((prev) => ({ ...(prev || {}), ...next }));
            }

            // Ensure the detail view reflects edits that may not include full photo payloads in the event.
            // We debounce the refetch so rapid updates (likes, etc.) don't spam the server.
            const detail = e?.detail || {};
            const hasPhotoPayload =
                next &&
                (Object.prototype.hasOwnProperty.call(next, 'photos') ||
                    Object.prototype.hasOwnProperty.call(next, 'community_photos') ||
                    Object.prototype.hasOwnProperty.call(next, 'photos_json') ||
                    Object.prototype.hasOwnProperty.call(next, 'photo_url') ||
                    Object.prototype.hasOwnProperty.call(next, 'image_url') ||
                    Object.prototype.hasOwnProperty.call(next, 'main_photo_url') ||
                    Object.prototype.hasOwnProperty.call(next, 'cover_url'));

            const seemsEdit = Boolean(next?.edited_at || next?.editedAt);
            const forceRefresh = Boolean(detail?.forceRefresh || detail?.refresh || detail?.refetch);
            const skipRefetch = Boolean(detail?.skipRefetch);

            // Only refetch when the event is an actual edit or explicit refresh request.
            // Simple like/repost events don't need a server round-trip — ActionBar handles
            // optimistic state internally, and refetching causes the ActionBar to blink.
            if (!skipRefetch && (forceRefresh || seemsEdit)) {
                if (fetchTimer) window.clearTimeout(fetchTimer);
                fetchTimer = window.setTimeout(() => {
                    fetchLatest(pid);
                }, 250);
            }
        };

        const onDeleted = (e) => {
            const pid = e?.detail?.postId ?? e?.detail?.id ?? e?.detail?.post?.id ?? null;
            if (pid == null) return;
            if (String(pid) !== String(activePostId)) return;
            setPost(null);
        };

        window.addEventListener('ll:communityPost:updated', onUpdatedLike);
        window.addEventListener('ll:communityPost:markedFound', onUpdatedLike);
        window.addEventListener('ll:communityPost:deleted', onDeleted);

        return () => {
            alive = false;
            if (fetchTimer) window.clearTimeout(fetchTimer);
            window.removeEventListener('ll:communityPost:updated', onUpdatedLike);
            window.removeEventListener('ll:communityPost:markedFound', onUpdatedLike);
            window.removeEventListener('ll:communityPost:deleted', onDeleted);
        };
    }, [activePostId]);

    // ── Keep post object in sync with ActionBar like/repost broadcasts ──
    // ActionBar manages its own internal liked/reposted state and cache.
    // We only patch the post object here so other consumers (e.g. the card
    // in the left list) stay consistent.  We do NOT feed these values back
    // into ActionBar props — ActionBar's cooldown + cache handles that.
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

    const openLoginPopup = useCallback(
        (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (authCtx && typeof authCtx.open === 'function') {
                authCtx.open();
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
        [authCtx]
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

        // Parse active account with proper numeric ID resolution
        // (artist accounts may store id as "artist:39" with a separate artistId field)
        const fa2Raw = (() => { try { const r = localStorage.getItem('ll:activeAccount'); return r ? JSON.parse(r) : null; } catch { return null; } })();
        const ft2 = String(fa2Raw?.type || '').toLowerCase();
        let fa2NumericId = null;
        if (ft2 === 'business') {
            const n = Number(fa2Raw?.id);
            fa2NumericId = Number.isFinite(n) && n > 0 ? n : null;
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
        }
        const fa2IsBiz = ft2 === 'business' && fa2NumericId;
        const fa2IsArt = ft2 === 'artist' && fa2NumericId;
        // Resolve the handle for the current active account so the optimistic
        // comment displays the correct @username (business slug / artist handle).
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
        const tryPosts = [
            { url: `/api/community/${encodeURIComponent(postId)}/comments`, method: 'POST' },
            { url: `/api/community/posts/${encodeURIComponent(postId)}/comments`, method: 'POST' },
            { url: `/api/posts/${encodeURIComponent(postId)}/comments`, method: 'POST' },
            { url: `/api/comments?postId=${encodeURIComponent(postId)}`, method: 'POST' },
        ];
        // Build account headers for backend identity detection
        const acctHeaders2 = (() => { try { return getStaticAccountHeaders(); } catch { return {}; } })();

        let serverComment = null;
        let ok = false;

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
                    headers: { 'Content-Type': 'application/json', ...acctHeaders2 },
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
            try {
                const nextCount = (() => {
                    try {
                        const current = Number(post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0);
                        return Number.isFinite(current) ? current + 1 : 1;
                    } catch {
                        return 1;
                    }
                })();

                window.dispatchEvent(
                    new CustomEvent('ll:communityPost:updated', {
                        detail: {
                            postId: postId,
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

            // Build optimistic comment from server response (or synthetic fallback)
            const created = serverComment?.comment || serverComment;

            // Resolve the best available handle for this account from ALL sources.
            // Priority: localStorage > activeAccount context > server response fields.
            // NEVER fall back to `created.handle` (personal user handle from users table).
            const resolvedHandle2 = freshHandle2
                || activeAccount?.slug || activeAccount?.handle
                || (created?.account_handle || '')
                || (created?.business_slug || '')
                || (created?.artist_handle || '')
                || '';

            const optimistic = created && created.id
                ? {
                    ...created,
                    // Override handle so it never shows the personal profile @username
                    // when commenting as a business/artist. If resolvedHandle2 is empty,
                    // keep whatever the server returned for account_handle/business_slug
                    // (the server resolves slugs from the DB even when the client didn't send one).
                    ...(isBusinessAccount && activeBusinessId ? {
                        business_id: activeBusinessId,
                        business_name: created.business_name || activeAccount?.name || '',
                        business_avatar_url: created.business_avatar_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
                        account_type: 'business',
                        account_name: created.account_name || activeAccount?.name || '',
                        account_avatar_url: created.account_avatar_url || activeAccount?.avatar_url || activeAccount?.logo_url || '',
                        ...(resolvedHandle2 ? {
                            business_slug: resolvedHandle2,
                            account_handle: resolvedHandle2,
                            handle: resolvedHandle2,
                        } : {
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
                    user_id: viewerUser?.id,
                    public_id: viewerUser?.public_id,
                    first_name: viewerUser?.first_name || '',
                    last_name: viewerUser?.last_name || '',
                    handle: resolvedHandle2 || viewerUser?.handle || '',
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
                        ...(resolvedHandle2 ? { business_slug: resolvedHandle2 } : {}),
                        business_avatar_url: activeAccount?.avatar_url || activeAccount?.logo_url || '',
                        account_type: 'business',
                        account_name: activeAccount?.name || '',
                        ...(resolvedHandle2 ? { account_handle: resolvedHandle2 } : {}),
                        account_avatar_url: activeAccount?.avatar_url || activeAccount?.logo_url || '',
                    } : {}),
                    ...(isArtistAccount && activeArtistId ? {
                        artist_id: activeArtistId,
                        artist_name: activeAccount?.name || '',
                        ...(resolvedHandle2 ? { artist_handle: resolvedHandle2 } : {}),
                        artist_avatar_url: activeAccount?.avatar_url || '',
                        account_type: 'artist',
                        account_name: activeAccount?.name || '',
                        ...(resolvedHandle2 ? { account_handle: resolvedHandle2 } : {}),
                        account_avatar_url: activeAccount?.avatar_url || '',
                    } : {}),
                };

            // Inject into comment list without reloading
            if (typeof addCommentRef.current === 'function') {
                addCommentRef.current(optimistic);
            } else {
                // Fallback: full reload if ref not connected
                forceRefreshComments();
            }

            const anchor = document.getElementById('comments-anchor');
            if (anchor && !embedded) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // if unauthenticated, prompt login
            openLoginPopup();
        }
    }

    const onComposerKeyDown = (e) => {
        if (commentMention.open && e.key === 'Escape') {
            e.preventDefault();
            closeCommentMention();
            return;
        }
        // Enter = new line. Ctrl/Cmd + Enter = submit.
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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

                    // Ensure we have the numeric id
                    setUserForCard((prev) => {
                        if (!prev) return prev;
                        if (!prev.id && profile.id) return { ...prev, id: profile.id };
                        return prev;
                    });

                    // Am *I* in the target's followers?
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
                } catch {
                    /* try next */
                }
            }
            return null;
        },
        [viewerUser?.id]
    );

    const handleOpenUserCard = (el, author, options) => {
        setUserAnchor(el);
        setUserCardViewProfileOnly(Boolean(options?.viewProfileOnly));
        setUserForCard({
            id: author?.id, // may be undefined; we'll hydrate from /users/public
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

        const anchorTarget = e.currentTarget;

        // Resolve account type before opening card
        resolveMentionHandle(h).then((resolved) => {
            handleOpenUserCard(anchorTarget, resolved);
        });
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
            } catch {
                /* try next */
            }
        }
        return false;
    };

    const handleFollow = async (targetUser) => {
        const tid0 = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid0 && !handle0) return;

        // Don't allow following yourself
        const selfId = Number(viewerUser?.id);
        if (selfId && tid0 && selfId === tid0) return;

        requireAuth(async () => {
            // Ensure numeric id via hydration if needed
            let tid = tid0;
            if (!tid && handle0) {
                const p = await hydrateTargetFromPublic({ handle: handle0 });
                if (p?.id) tid = Number(p.id);
            }
            if (!tid) return;

            // Optimistic UI flip
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
                // rollback optimistic
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
        // If viewer is on a business account → isSelf only for that same business card
        if (isBusinessAccount && activeBusinessId) {
            if (!isAccountCard) return false; // personal card can't be self when on biz
            return (
                (userForCard.account_type === 'business' || Boolean(userForCard.business_id)) &&
                Number(userForCard.business_id) === Number(activeBusinessId)
            );
        }
        // If viewer is on an artist account → isSelf only for that same artist card
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
    const outerSx = embedded
        ? { width: '100%', maxWidth: 'none', mx: 0, px: 0, py: 0 }
        : { maxWidth: 900, mx: 'auto', px: { xs: 1.25, sm: 2 }, py: { xs: 1.5, sm: 3 } };

    if (loading) {
        return (
            <Box sx={{ ...outerSx, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', px: embedded ? 0 : 2 }}>
                <PulsingDots size={8} gap={1} sx={{ py: 0 }} />
            </Box>
        );
    }
    if (!post) {
        // In embedded mode, "no post" usually means nothing is selected (or the selection was cleared
        // because the author was hidden/blocked). Show the same "select a post" empty state rather
        // than a "not found" error.
        if (embedded) {
            return (
                <Box
                    sx={{
                        ...outerSx,
                        py: 6,
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        minHeight: '100%',
                    }}
                >
                    <Box sx={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 76,
                                height: 76,
                                borderRadius: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: (t) => alphaColor(t.palette.text.primary, 0.03),
                                border: (t) => `1px solid ${alphaColor(t.palette.text.primary, 0.06)}`,
                                boxShadow: (t) => t.custom.shadows.xs,
                            }}
                        >
                            <ForumIcon sx={{ fontSize: 42, color: 'primary.main', opacity: 0.9 }} />
                        </Box>

                        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                            Select a post
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                            Click any post on the left to view details here.
                        </Typography>
                    </Box>
                </Box>
            );}

        return (
            <Box sx={{ ...outerSx, py: 4, px: 2 }}>
                <Typography color="text.secondary">Post not found.</Typography>
                <Button onClick={backToList} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
                    Return to Community Posts
                </Button>
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
        avatar_url: post.avatar_url || post.profile_picture,
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

    const openTopCard = (e) => {
        handleOpenUserCard(e.currentTarget, authorUser);
    };

    const authorAvatar = (() => {
        const acctType = String(post.account_type || '').toLowerCase();
        if (acctType === 'business') {
            return (post.business_avatar_url || post.account_avatar_url || post.avatar_url || post.profile_picture || post.profileImageUrl || '').trim();
        }
        if (acctType === 'artist') {
            return (post.artist_avatar_url || post.account_avatar_url || post.avatar_url || post.profile_picture || post.profileImageUrl || '').trim();
        }
        return post.avatar_url || post.profile_picture || post.profileImageUrl || post.account_avatar_url || '';
    })();

    // Determine the correct default avatar icon for the post author based on account type
    const postAcctType = String(post?.account_type || '').toLowerCase();
    const isBusinessAuthor = postAcctType === 'business';
    const isArtistAuthor = postAcctType === 'artist';
    // For artist authors, distinguish musicians from visual artists via
    // post.profile_type (backend returns this when the post was made from
    // an artist account). Defaults to music when absent (legacy rows).
    const authorProfileType = String(post?.profile_type || post?.profileType || '').toLowerCase();
    const isVisualArtistAuthor = isArtistAuthor && authorProfileType === 'artist';
    const AuthorDefaultIcon = isBusinessAuthor
        ? StorefrontOutlinedIcon
        : isArtistAuthor
            ? (isVisualArtistAuthor ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;


    const mainContent = (
        <Box sx={{ width: '100%' }}>
            {!embedded && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Button
                        onClick={backToList}
                        startIcon={<ArrowBackIcon />}
                        sx={{ px: 0, minWidth: 0, fontWeight: 600, textTransform: 'none' }}
                    >
                        Return to Community Posts
                    </Button>
                </Box>
            )}

            {/* Header (author) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    onClick={openTopCard}
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        transition: (t) => `background-color ${t.custom?.motion?.fast || 150}ms ${t.custom?.motion?.ease || 'ease'}`,
                        '&:hover': { bgcolor: (t) => alphaColor(t.palette.text.primary, 0.04) },
                        '&:hover .ll-author-name': { textDecoration: 'underline' },
                        minWidth: 0,
                        maxWidth: '100%',
                    }}
                >
                    <Avatar
                        src={authorAvatar || undefined}
                        alt={post ? `${post.first_name || ''} ${post.last_name || ''}`.trim() : ''}
                        sx={(t) => ({
                            width: { xs: 52, sm: 60 },
                            height: { xs: 52, sm: 60 },
                            flexShrink: 0,
                            bgcolor: alphaColor(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            border: '2px solid',
                            borderColor: alphaColor(t.palette.text.primary, 0.06),
                        })}
                    >
                        {!authorAvatar ? <AuthorDefaultIcon sx={{ fontSize: 28 }} /> : null}
                    </Avatar>

                    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {/* Row 1: Name */}
                        <Typography
                            className="ll-author-name"
                            variant="subtitle1"
                            noWrap
                            sx={(t) => ({ ...t.custom.postDetail.authorName })}
                        >
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
                                return `${post.first_name || ''} ${post.last_name || ''}`.trim()
                                    || post.name || post.authorName || post.author_name || post.account_name
                                    || (post.handle ? `@${post.handle}` : 'User');
                            })()}
                        </Typography>

                        {/* Row 2: @handle */}
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

                        {/* Row 3: Timestamp and Edited */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                            {postDate ? (
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgoCompact(postDate)}
                                </Typography>
                            ) : null}
                            {isEdited ? (
                                <>
                                    <Typography variant="caption" color="text.disabled">•</Typography>
                                    <Typography
                                        variant="caption"
                                        component="button"
                                        onClick={(e) => { e.stopPropagation(); openEditedHistory(e); }}
                                        sx={{
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            color: 'primary.main',
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        title="Click to view edit history"
                                    >
                                        Edited
                                    </Typography>
                                </>
                            ) : null}
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ ml: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {isGroupPost && postGroupId ? (
                            <Chip
                                clickable
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/groups/${postGroupId}`);
                                }}
                                aria-label="View group"
                                icon={(() => {
                                    const grpSrc = postGroupAvatarUrl || '';
                                    return grpSrc ? (
                                        <Avatar
                                            src={grpSrc}
                                            alt=""
                                            sx={{ width: 20, height: 20, ml: 0.5 }}
                                            imgProps={{ referrerPolicy: 'no-referrer' }}
                                        />
                                    ) : (
                                        <Avatar
                                            sx={(t) => ({ width: 20, height: 20, ml: 0.5, bgcolor: alphaColor(t.palette.primary.main, 0.14), border: `1.5px solid ${alphaColor(t.palette.primary.main, 0.22)}` })}
                                        >
                                            <GroupsIcon sx={(t) => ({ fontSize: 13, color: t.palette.primary.main })} />
                                        </Avatar>
                                    );
                                })()}
                                label={
                                    <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1, py: 0.1 }}>
                                        <Box sx={{ fontSize: 11, fontWeight: 900, opacity: 0.85 }}>Posted in</Box>
                                        <Box
                                            sx={{
                                                fontSize: 12,
                                                fontWeight: 900,
                                                textTransform: 'none',
                                                letterSpacing: 0.4,
                                                maxWidth: 180,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {postGroupName || 'Group'}
                                        </Box>
                                    </Box>
                                }
                                sx={(t) => {
                                    const green = t.palette.primary.main;
                                    return {
                                        height: 34,
                                        maxWidth: 260,
                                        minWidth: 0,
                                        bgcolor: alphaColor(green, 0.06),
                                        color: t.palette.text.primary,
                                        border: '1px solid',
                                        borderColor: alphaColor(green, 0.25),
                                        '& .MuiChip-icon': { marginLeft: '6px', marginRight: '2px' },
                                        '& .MuiChip-label': {
                                            paddingRight: '12px',
                                            paddingLeft: '6px',
                                            maxWidth: 220,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        },
                                    };
                                }}
                            />
                        ) : null}

                        {(isUrgent && !showHelpVolunteerPanel) ? (
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
                            {/* Copy link - available for everyone */}
                            <MenuItem onClick={handleCopyPostLink} sx={{ py: 1 }}>
                                <ListItemIcon>
                                    <LinkIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Copy link" />
                            </MenuItem>

                            {/* Mark as Found (Lost & Found posts only) — hidden when on business/artist account */}
                            {canMarkFound && !isNonPersonal && (
                                <>
                                    <Divider sx={{ my: 0.5 }} />
                                    <MenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeOwnerMenu(e);
                                            requestMarkFound(e);
                                        }}
                                        sx={{ py: 1, color: 'success.main' }}
                                    >
                                        <ListItemIcon sx={{ color: 'success.main' }}>
                                            <CheckCircleOutlineIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Mark as Found" />
                                    </MenuItem>
                                </>
                            )}

                            {/* Mark as Resolved (Help Request posts only) — hidden when on business/artist account */}
                            {canMarkResolved && !isNonPersonal && (
                                <>
                                    {!canMarkFound && <Divider sx={{ my: 0.5 }} />}
                                    <MenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeOwnerMenu(e);
                                            requestMarkResolved(e);
                                        }}
                                        sx={{ py: 1, color: 'success.main' }}
                                    >
                                        <ListItemIcon sx={{ color: 'success.main' }}>
                                            <CheckCircleOutlineIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Mark as Resolved" />
                                    </MenuItem>
                                </>
                            )}

                            {/* Owner actions: Edit and Delete — hidden when on business/artist account */}
                            {canManagePost && <Divider sx={{ my: 0.5 }} />}

                            {canManagePost && (
                                <MenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeOwnerMenu(e);
                                        requestEdit(e);
                                    }}
                                    sx={{ py: 1 }}
                                >
                                    <ListItemIcon>
                                        <EditRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Edit post" />
                                </MenuItem>
                            )}

                            {canManagePost && (
                                <MenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeOwnerMenu(e);
                                        requestDelete(e);
                                    }}
                                    sx={{ py: 1, color: 'error.main' }}
                                >
                                    <ListItemIcon sx={{ color: 'error.main' }}>
                                        <DeleteRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Delete post" />
                                </MenuItem>
                            )}

                            {/* Report — hidden for post owner */}
                            {!isOwner && (
                                <>
                                    <Divider sx={{ my: 0.5 }} />
                                    <MenuItem onClick={handleReportMenuClick} sx={{ py: 1 }}>
                                        <ListItemIcon>
                                            <FlagOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Report post" />
                                    </MenuItem>
                                </>
                            )}
                            {/* Hide posts / Block user — non-owner only */}
                            {!isOwner && viewerUser?.id && (
                                <MenuItem onClick={handleHideUser} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <VisibilityOffRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Hide posts" />
                                </MenuItem>
                            )}
                            {!isOwner && viewerUser?.id && (
                                <MenuItem onClick={handleBlockUser} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                    <ListItemIcon sx={{ color: 'error.main' }}>
                                        <BlockRoundedIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Block user" />
                                </MenuItem>
                            )}
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
            {(post.title || post.description) ? (
                <>
                    {post.title ? (
                        <Typography variant="h5" sx={(t) => ({ mt: 1.25, wordBreak: 'break-word', ...t.custom.postDetail.title })}>
                            {post.title}
                        </Typography>
                    ) : null}

                    {/* Category chip under title */}
                    {!hideCategoryChip && badgeMeta ? (
                        <Box sx={{ mt: 0.75, display: 'flex' }}>
                            <CategoryChip badge={badgeMeta} subcategory={helpTypeLabel} />
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

                    {/* Marked as Found status + update message */}
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

                    {/* Help Request Resolved status + resolution text */}
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

                    {post.description && !(isLostFoundResolved && !!lostFoundResolvedMessage) ? (
                        <Box sx={{ mt: 1 }}>
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
                                    more
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
                                    less
                                </Link>
                            ) : null}
                        </Box>
                    ) : null}
                </>
            ) : null}

            {/* Category chip fallback when there's no title/description */}
            {!(post.title || post.description) && !hideCategoryChip && badgeMeta ? (
                <Box sx={{ mt: 1, display: 'flex' }}>
                    <CategoryChip badge={badgeMeta} subcategory={helpTypeLabel} />
                </Box>
            ) : null}

            {/* Poll (full interactive view) */}
            {((['poll', 'polls'].includes(String(post?.category || '').toLowerCase())) || post?.poll || post?.pollData || post?.poll_data || post?.pollOptions || post?.poll_options) && (post?.poll || post?.pollData || post?.poll_data || post?.pollOptions || post?.poll_options) && (
                <PollDisplay
                    poll={post.poll || post.pollData || post.poll_data || (() => {
                        const opts = post.pollOptions || post.poll_options;
                        if (!opts) return null;
                        return {
                            options: Array.isArray(opts) ? opts : [],
                            totalVotes: post.totalVotes ?? post.total_votes ?? post.poll_total_votes ?? 0,
                            viewerVoteOptionId: post.viewerVoteOptionId ?? post.viewer_vote_option_id ?? null,
                            pollExpiresAt: post.pollExpiresAt ?? post.poll_expires_at ?? null,
                            expired: Boolean(post.poll_expired ?? post.pollExpired ?? false),
                        };
                    })()}
                    postId={post.id}
                    variant="full"
                    groupId={post?.groupId ?? post?.group_id ?? null}
                    isNonPersonal={isNonPersonal}
                    activeBusinessId={activeBusinessId}
                    activeArtistId={activeArtistId}
                    groupMembershipGated={groupMembershipGated}
                    onJoinGroup={onJoinGroup}
                />
            )}

            {showExpiresAt ? (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Expires at {expiresAtLabel}
                    </Typography>
                </>
            ) : null}

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

            {/* Photos */}
            {photos.length > 0 && <Carousel photos={photos} />}

            {/* Location */}
            {(post.city || post.county || post.street_address || isStatewidePost) && (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box
                        onClick={typeof onLocationClick === 'function' ? (e) => {
                            e.stopPropagation();
                            onLocationClick(post);
                        } : undefined}
                        role={typeof onLocationClick === 'function' ? 'button' : undefined}
                        tabIndex={typeof onLocationClick === 'function' ? 0 : undefined}
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 0.5,
                            borderRadius: 1.5,
                            px: 1,
                            py: 0.75,
                            mx: -1,
                            cursor: typeof onLocationClick === 'function' ? 'pointer' : 'default',
                            transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}, color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            '&:hover .loc-icon, &:hover .loc-text': typeof onLocationClick === 'function'
                                ? { color: (t) => t.palette.secondary.main }
                                : undefined,
                            '&:hover': typeof onLocationClick === 'function'
                                ? { bgcolor: (t) => alphaColor(t.palette.primary.main, 0.04) }
                                : undefined,
                        }}
                    >
                        <LocationOnRoundedIcon className="loc-icon" sx={(t) => ({ fontSize: t.custom.postDetail.locationIcon.fontSize, color: 'primary.main', mt: t.custom.postDetail.locationIcon.mt, transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` })} />
                        <Box>
                            {post.street_address && (
                                <Typography
                                    className="loc-text"
                                    variant="body2"
                                    sx={(t) => ({ ...t.custom.postDetail.locationText, color: 'primary.main', transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` })}
                                >
                                    {post.street_address}
                                </Typography>
                            )}
                            {locationStr && (
                                <Typography
                                    className="loc-text"
                                    variant="body2"
                                    sx={(t) => ({ ...(post.street_address ? t.custom.postDetail.locationSecondary : t.custom.postDetail.locationText), color: 'primary.main', transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` })}
                                >
                                    {locationStr}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </>
            )}

            {/* Divider between location and action bar */}
            <Divider sx={{ mt: 1.5, borderColor: (t) => alphaColor(t.palette.primary.main, 0.10) }} />

            {/* ACTION BAR — styled to match MusicPostDetailPanel */}
            <Box
                sx={(t) => ({
                    mt: 1,
                    p: 1,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: alphaColor(t.palette.primary.main, 0.14),
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    boxShadow: t.custom?.shadows?.xs || 'none',
                })}
            >
                <ActionBar
                    key={`ab-${post.id}`}
                    user={viewerUser}
                    postId={post.id}
                    post={post}
                    initialLikes={abLikes}
                    initiallyLiked={abViewerLiked}
                    commentsCount={abCommentsCount}
                    initialReposts={abReposts}
                    initiallyReposted={abViewerReposted}
                    showBoost={!isGroupPost}
                    useShareDialog={!isGroupPost}
                    hideShare={Boolean(isGroupPost && post?.__ll_group_is_private)}
                    onComment={() => {
                        const anchor = document.getElementById('comments-composer');
                        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                />
            </Box>

            {/* View Post Page link (when embedded) */}
            {topRightSlot && !isMobile ? (
                <Button
                    variant="outlined"
                    fullWidth
                    endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 18 }} />}
                    onClick={() => {
                        if (post?.id) {
                            try {
                                sessionStorage.setItem('ll:community:url', window.location.pathname + window.location.search);
                                sessionStorage.setItem('ll:community:navigatedToPost', '1');
                                const listEl = document.querySelector('[data-community-scroll]');
                                if (listEl) sessionStorage.setItem('ll:community:scrollTop', String(listEl.scrollTop || 0));
                                const rightEl = document.querySelector('[data-post-detail-scroll]');
                                if (rightEl) sessionStorage.setItem('ll:community:rightScrollTop', String(rightEl.scrollTop || 0));
                            } catch { /* ignore */ }
                            navigate(`/posts/${post.id}`, {
                                state: { post, from: 'community', fromCommunity: true },
                            });
                        }
                    }}
                    sx={(t) => ({
                        mt: 1.25,
                        ...t.custom.postDetail.viewPageButton,
                        textTransform: 'none',
                        borderColor: alphaColor(t.palette.primary.main, 0.25),
                        color: 'primary.main',
                        '&:hover': {
                            borderColor: t.palette.primary.main,
                            bgcolor: alphaColor(t.palette.primary.dark, 0.04),
                        },
                    })}
                >
                    View Post Page
                </Button>
            ) : null}

            {/* Composer OR login prompt OR group membership gate */}
            {viewerUser && groupMembershipGated ? (
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
                    <Typography sx={{ fontWeight: 900, mb: 0.5, color: 'text.primary' }}>
                        Join this group to comment
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        You must be a member of this group to leave comments on posts.
                    </Typography>
                    {typeof onJoinGroup === 'function' && (
                        <Button
                            variant="contained"
                            size="small"
                            disableElevation
                            onClick={onJoinGroup}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 950,
                                px: 3,
                                py: 0.75,
                            }}
                        >
                            Join Group to Comment
                        </Button>
                    )}
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
                                ) : null,
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
                                                // Artist sub-type for the default fallback icon.
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
                                                                    <MentionAccountBadge accountType={accountType} />
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

            {/* Comments */}
            <RedditComments
                postId={post.id}
                post={post}
                refreshKey={commentsRefreshKey}
                addCommentRef={addCommentRef}
                initialPageSize={50} // 50 top-level comments per batch
                viewer={viewerUser}
                postAuthor={postAuthor}
                onOpenUserCard={handleOpenUserCard}
                onCopyLinkToast={() => setCopyLinkToast(true)}
                scrollToCommentId={scrollToCommentId || highlightCommentId}
                highlightCommentId={highlightCommentId || scrollToCommentId}
                // Slice 4e: PostDetailModal has its own inline composer above
                // the RedditComments list. Suppress the component's built-in
                // composer so we don't render two. New comments still inject
                // via the existing addCommentRef pattern.
                showComposer={false}
                onCommentCountChange={(delta) => {
                    // Update local post state
                    setPost((p) => {
                        if (!p) return p;
                        const current = Number(p.commentsCount ?? p.comments_count ?? p.comment_count ?? p.comments ?? 0);
                        const nextCount = Math.max(0, current + delta);
                        return { ...p, commentsCount: nextCount, comments_count: nextCount, comment_count: nextCount };
                    });
                    // Dispatch event to update PostList
                    try {
                        const current = Number(post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0);
                        const nextCount = Math.max(0, current + delta);
                        window.dispatchEvent(
                            new CustomEvent('ll:communityPost:updated', {
                                detail: {
                                    postId: post.id,
                                    commentCountOnly: true,
                                    post: {
                                        id: post.id,
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
                }}
                groupCommentGated={groupMembershipGated}
            />
        </Box>

    );

    return (
        <Box sx={outerSx}>
            {embedded ? (
                <Box
                    sx={(t) => ({
                        width: '100%',
                        minHeight: '100%',
                        bgcolor: 'background.paper',
                        px: { xs: 1.25, sm: 1.75 },
                        py: { xs: 1.25, sm: 1.5 },
                    })}
                >
                    {mainContent}
                </Box>
            ) : (
                <Paper
                    variant="outlined"
                    sx={(t) => ({
                        p: { xs: 1.25, sm: 2 },
                        borderRadius: 3,
                        borderColor: alphaColor(t.palette.primary.main, 0.14),
                        backgroundColor: 'background.paper',
                        backgroundImage: 'none',
                        boxShadow: embedded ? 'none' : `0 16px 56px ${alphaColor(t.palette.text.primary, 0.08)}`,
                    })}
                >
                    {mainContent}
                </Paper>
            )}

            {/* Shared user card popover (author + commenters) */}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => { setUserAnchor(null); setUserCardViewProfileOnly(false); }}
                user={userForCard}
                isSelf={isSelfForCard}
                following={isFollowingForCard}
                onFollow={handleFollow}
                onViewProfile={handleViewProfile}
                viewProfileOnly={userCardViewProfileOnly}
            />

            {/* ── Edit History Dialog (timeline style, matches PostPage/EventPostPage) ── */}
            <Dialog
                open={editHistOpen}
                onClose={() => setEditHistOpen(false)}
                fullWidth
                maxWidth="sm"
                fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{ sx: { position: 'relative' } }}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                    Edit History
                    <IconButton aria-label="Close" onClick={() => setEditHistOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                    {editHistLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={28} />
                        </Box>
                    )}
                    {!editHistLoading && editHistError && (
                        <Alert severity="error" sx={{ mb: 1 }}>{editHistError}</Alert>
                    )}
                    {!editHistLoading && !editHistError && editHistRows.length === 0 && (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>
                            This post was edited, but detailed version history is not available for edits made before history tracking was enabled.
                        </Typography>
                    )}
                    {!editHistLoading && !editHistError && editHistRows.length > 0 && (
                        <Box sx={{ position: 'relative', pl: 2.5 }}>
                            <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                            {editHistRows.map((row, idx) => {
                                const snap = row?.snapshot || {};
                                const prevSnap = editHistRows[idx + 1]?.snapshot || {};
                                const diff = row?.diff || {};
                                const isOriginal = idx === editHistRows.length - 1;
                                const isLatest = idx === 0;
                                const version = row?.version != null ? row.version : editHistRows.length - idx;
                                const editedAt = row?.edited_at || row?.editedAt || row?.updated_at;
                                const editorHandle = String(row?.editor_handle || row?.editorHandle || '').replace(/^@/, '');

                                const diffItems = [];
                                if (!isOriginal) {
                                    const s = (v) => (v == null ? '' : String(v).trim());
                                    if (s(snap.title) !== s(prevSnap.title)) diffItems.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
                                    if (s(snap.description) !== s(prevSnap.description)) {
                                        const prevDesc = s(prevSnap.description);
                                        const curDesc = s(snap.description);
                                        diffItems.push({ label: 'Description', from: prevDesc || '(empty)', to: curDesc || '(empty)' });
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
                                }

                                return (
                                    <Box key={row?.id || `hist-${version}-${idx}`} sx={{ position: 'relative', pb: idx < editHistRows.length - 1 ? 2.5 : 0 }}>
                                        <Box sx={{
                                            position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                                            bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main',
                                            border: '2px solid', borderColor: 'background.paper',
                                            boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                            zIndex: 1,
                                        }} />
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
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 1.5 }}>
                    <Button onClick={() => setEditHistOpen(false)} sx={{ fontWeight: 700 }}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Rate limit dialog for top-level comments */}
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

/* ---------- Local, lightweight carousel ---------- */
function Carousel({ photos }) {
    const [index, setIndex] = useState(0);

    // Reset back to the first photo whenever a different post is selected or photos change.
    useEffect(() => {
        setIndex(0);
    }, [photos]);

    // Clamp index so we never show "3/2" style counters or read out-of-bounds.
    useEffect(() => {
        setIndex((i) => {
            if (!Array.isArray(photos) || photos.length === 0) return 0;
            const max = photos.length - 1;
            return Math.min(Math.max(0, i), max);
        });
    }, [photos.length]);

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
        <Box sx={{ position: 'relative', mt: 1.25 }}>
            <Box
                sx={{
                    width: '100%',
                    height: { xs: 260, sm: 420 },
                    bgcolor: 'common.black',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <Box
                    component="img"
                    src={current}
                    alt=""
                    loading="lazy"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        userSelect: 'none',
                        backgroundColor: 'transparent',
                    }}
                />
            </Box>

            {photos.length > 1 && (
                <>
                    <IconButton
                        aria-label="Previous image"
                        onClick={prev}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: 8,
                            transform: 'translateY(-50%)',
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.45),
                            color: 'common.white',
                            '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.black, 0.65) },
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>

                    <IconButton
                        aria-label="Next image"
                        onClick={next}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            right: 8,
                            transform: 'translateY(-50%)',
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.45),
                            color: 'common.white',
                            '&:hover': { bgcolor: (t) => alphaColor(t.palette.common.black, 0.65) },
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>

                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: (t) => alphaColor(t.palette.common.black, 0.45),
                            color: 'common.white',
                            fontSize: 12,
                        }}
                    >
                        {safeIndex + 1} / {photos.length}
                    </Box>
                </>
            )}
        </Box>
    );
}