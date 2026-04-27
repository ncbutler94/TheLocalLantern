// src/pages/community/PostList.jsx
//
// Responsive grid (1/2 per row), consistent card height, and category Chip
// in the top-right of each card header. Selected card shows a light gray highlight.
//
// Follow fixes in this version:
// • Follow/Message on the user card are auth-gated (same as Profile page).
// • POST uses the same URL strategy as Profile page: `${api}/users/follow` ➜ '/api/users/follow' ➜ '/users/follow'.
// • We resolve the target via `/users/public/:handleOrId` (same as Profile page) so we always have the correct numeric `id`.
// • The button flips to disabled gray “Following” immediately (optimistic), and stays that way.
// • Already-followed users render “Following” immediately because we derive state from the **target’s** followers list,
//   just like the Profile page does (not from the viewer cache).
//
// UPDATED (infinite scroll):
// • PAGE_SIZE = 100
// • Prefetch when the user scrolls past item #90 of the current page
// • Continues loading with no page cap while the server returns full pages
//
// Based on your original file with no truncation.
//
// NEW (performance bar support + controlled chunking, without removing existing features):
// • In controlled mode (posts prop provided): render only 100 at a time (renderCount).
// • When user scrolls near the bottom of the current chunk:
//     - show 4 flashing skeleton cards,
//     - then reveal the next 100.
// • If we’ve revealed everything we currently have but the parent says there are more:
//     - call onLoadMore() (optional),
//     - keep skeletons visible until parent appends posts.
// • Exposes display stats via onDisplayStatsChange (optional) so we can render a truly fixed bar in CommunityPanel.
//
// NOTE: The “fixed bar” should be rendered by CommunityPanel (overlay in the scroll container) so it is ALWAYS visible.
// This file now reports the values needed for that bar.

import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
// ─── Security: use the hardened axiosInstance (CSRF, token-expiry, rate-limit)
// instead of raw axios. All state-changing requests now automatically include
// the X-CSRF-Token header required by the backend's double-submit cookie pattern.
import axios from '../../api/axiosInstance';
import { secureFetch } from '../../utils/secureFetch';

import {
    Box,
    Card,
    CardActions,
    Avatar,
    Typography,
    Link,
    Chip,
    Button,
    IconButton,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    TextField,
    Tooltip,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel
} from '@mui/material';

import { alpha as alphaColor, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import ActionBar from '../../components/ActionBar';
import UserCardPopover from '../../components/UserCardPopover';
import EditCommunityPostDialog from './components/EditCommunityPostDialog';
import DeletePostConfirmDialog from './components/DeletePostConfirmDialog';
import { useAuth } from '../../components/AuthModalContext';
import { useActiveAccount } from '../../components/AccountContext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import NetworkErrorState, { isNetworkError } from '../../components/NetworkErrorState';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SuccessSnackbar from '../../components/SuccessSnackbar';
import SmartMenu from '../../components/SmartMenu';
import { getCommunityCategory, COMMUNITY_CATEGORY_META } from './utils/communityPostCategoryIcons';
import PulsingDots from '../../components/PulsingDots';
import PollDisplay from './components/PollDisplay';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { ensureListStaggerKeyframes, getListStaggerSx } from '../../themes/theme';
import { stripHtml } from '../../utils/richTextUtils';
import RichTextDisplay from '../../components/RichTextDisplay';


const api = process.env.REACT_APP_API_URL || '';

/* ---------- moderation state (blocked/hidden) persistence ---------- */
const LL_MOD_STATE_KEY = 'LL_MOD_STATE_V1';
const readModStateFromStorage = (viewerId) => {
    try {
        const raw = localStorage.getItem(LL_MOD_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        if (Number(parsed.viewerId) !== Number(viewerId)) return null;
        return {
            blocked_user_ids: Array.isArray(parsed.blocked_user_ids) ? parsed.blocked_user_ids : [],
            hidden_user_ids: Array.isArray(parsed.hidden_user_ids) ? parsed.hidden_user_ids : [],
            hidden_post_user_ids: Array.isArray(parsed.hidden_post_user_ids) ? parsed.hidden_post_user_ids : [],
            hidden_post_ids: Array.isArray(parsed.hidden_post_ids) ? parsed.hidden_post_ids : [],
        };
    } catch {
        return null;
    }
};
const writeModStateToStorage = (viewerId, state) => {
    try {
        localStorage.setItem(
            LL_MOD_STATE_KEY,
            JSON.stringify({
                viewerId: Number(viewerId) || 0,
                blocked_user_ids: Array.isArray(state?.blocked_user_ids) ? state.blocked_user_ids : [],
                hidden_user_ids: Array.isArray(state?.hidden_user_ids) ? state.hidden_user_ids : [],
                hidden_post_user_ids: Array.isArray(state?.hidden_post_user_ids) ? state.hidden_post_user_ids : [],
                hidden_post_ids: Array.isArray(state?.hidden_post_ids) ? state.hidden_post_ids : [],
                savedAt: Date.now(),
            })
        );
    } catch {
        // ignore
    }
};


/* ---------- helpers ---------- */
const formatDate = (v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    // Abbreviate month names (Dec, Nov, etc.)
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
const formatTime = (v) => {
    const d = v ? new Date(v) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
};
const dateTimeLabel = (v) => {
    const a = formatDate(v);
    const b = formatTime(v);
    return a && b ? `${a} · ${b}` : a || b || '';
};

/* ---------- @mention rendering (clickable -> UserCardPopover) ---------- */
const renderTextWithMentions = (text, onMentionClick) => {
    const raw = typeof text === 'string' ? text : (text ?? '').toString();
    if (!raw) return raw;

    const re = /@([a-zA-Z0-9_]{2,30})/g;
    const out = [];
    let last = 0;
    let m;
    let key = 0;

    while ((m = re.exec(raw)) !== null) {
        const startIdx = m.index;
        const endIdx = startIdx + m[0].length;
        const handle = m[1];

        const before = startIdx > 0 ? raw[startIdx - 1] : '';
        // Avoid emails like test@example.com and ignore if preceded by a letter/underscore or dot.
        // NOTE: We intentionally allow digits before @ so "123@handle" still counts as a mention.
        if (before && /[a-zA-Z_.]/.test(before)) {
            continue;
        }

        if (startIdx > last) out.push(raw.slice(last, startIdx));

        out.push(
            <Link
                key={`mention_${key++}_${startIdx}`}
                component="button"
                type="button"
                underline="hover"
                onClick={(e) => onMentionClick?.(e, handle)}
                sx={{
                    p: 0,
                    fontWeight: 900,
                    display: 'inline',
                    color: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                }}
            >
                @{handle}
            </Link>
        );

        last = endIdx;
    }

    if (out.length === 0) return raw;
    if (last < raw.length) out.push(raw.slice(last));
    return out;
};



/* ---------- Compact relative time helper (for headers / map popups) ---------- */
const timeAgoCompact = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return '';
    const diffMs = Math.max(0, Date.now() - d.getTime());

    const s = Math.floor(diffMs / 1000);
    if (s < 60) return '1m ago';

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


/* Help/Volunteer type labels (for list chips) */
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


const BADGE = Object.fromEntries(
    Object.entries(COMMUNITY_CATEGORY_META).map(([key, meta]) => [key, { label: meta.label, Icon: meta.Icon }])
);

// Lantern gold for location hover (matching ActionBar / BusinessDirectoryCard / EventCard)
// Uses theme.palette.secondary.main

const toHoverKey = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : String(val ?? '');
};

const normalizeCategory = (value) => {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'community-chat' || v === 'community_chat' || v === 'community chat') return 'discussion';
    if (v === 'polls') return 'poll';
    return v;
};

const deriveSplitCategory = (post) => {
    // Normalize to new slugs when legacy category remains
    let cat = normalizeCategory(post?.category);

    if (cat === 'recommendations-tips' || cat === 'tips' || cat === 'tip') {
        // Tips have been removed — treat all legacy “tips” rows as Recommendations.
        return 'recommendations';
    }

    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests') {
        const kind = String(post?.request_kind || post?.requestKind || '').toLowerCase();
        if (kind === 'volunteer' || kind === 'offer' || kind === 'offering') return 'volunteers';
        if (kind === 'help' || kind === 'request' || kind === 'help-request' || kind === 'help_request') return 'help-requests';
        // Fallback for legacy rows (no request_kind): treat as Help Requests (matches current seed data)
        return 'help-requests';
    }

    return cat;
};

// Business category labels — resolves category_key to human-readable label
const BUSINESS_CATEGORY_LABELS = {
    food_drink: 'Food & Drink', shopping_retail: 'Shopping & Retail', automotive: 'Automotive',
    home_services: 'Home Services', home_garden: 'Home & Garden', health_wellness: 'Health & Wellness',
    beauty_personal_care: 'Beauty & Personal Care', fitness_recreation: 'Fitness & Recreation',
    professional_services: 'Professional Services', education_childcare: 'Education & Childcare',
    pets_animals: 'Pets & Animals', travel_lodging: 'Travel & Lodging', arts_entertainment: 'Arts & Entertainment',
    community_nonprofit: 'Community & Nonprofit', technology_repair: 'Technology & Repair', other: 'Other',
};
function resolveBizCategoryLabel(post) {
    const catKey = String(
        post?.businessCategoryKey || post?.business_category_key ||
        post?.categoryKey || post?.category_key || ''
    ).toLowerCase().replace(/[^a-z_]/g, '');
    if (catKey && BUSINESS_CATEGORY_LABELS[catKey]) return BUSINESS_CATEGORY_LABELS[catKey];
    const fallback = String(
        post?.postSourceLabel || post?.businessCategoryLabel ||
        post?.businessCategory || post?.business_category ||
        post?.category_name || post?.categoryLabel || ''
    ).trim();
    return fallback || 'Business';
}

const buildBadgeFor = (post) => {
    if (!post) return null;

    // Business and artist posts: no badge chip on the card — the account
    // identity is already communicated by the avatar + name/handle row.
    const rawCat = String(post.category || '').toLowerCase();
    if (rawCat === 'business_post') return null;
    if (rawCat === 'artist_post') return null;

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

const extractPhotos = (post) => {
    if (!post) return [];
    let processed = [];
    const { photos } = post;

    if (Array.isArray(photos)) {
        processed = photos.filter((p) => p && typeof p === 'string' && p !== 'null');
    } else if (typeof photos === 'string' && photos !== 'null' && photos.trim()) {
        try {
            const parsed = JSON.parse(photos);
            if (Array.isArray(parsed)) {
                processed = parsed.filter((p) => p && typeof p === 'string' && p !== 'null');
            }
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
            post.media_url,
            post.coverImage,
            post.cover_image,
        ]
            .filter((u) => typeof u === 'string' && u && u !== 'null')
            .slice(0, 1);
        if (oneOffs.length) processed = oneOffs;
    }
    // mediaUrl may be a JSON array string (business/artist posts)
    if (!processed.length && post.mediaUrl) {
        try {
            const parsed = JSON.parse(post.mediaUrl);
            if (Array.isArray(parsed)) processed = parsed.filter((u) => typeof u === 'string' && u);
            else if (typeof post.mediaUrl === 'string' && post.mediaUrl !== 'null') processed = [post.mediaUrl];
        } catch {
            if (typeof post.mediaUrl === 'string' && post.mediaUrl !== 'null' && post.mediaUrl.trim()) {
                processed = [post.mediaUrl];
            }
        }
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

/* ──────────────────────────────────────────────────────────────────────
   MobilePhotoGrid — Facebook-style dynamic grid, matching ArtistPostCard
   Mobile-only: used when flat=true (isMobileScreen)
   ────────────────────────────────────────────────────────────────────── */
function MobilePhotoGrid({ mediaUrls }) {
    if (!mediaUrls || mediaUrls.length === 0) return null;
    const count = mediaUrls.length;

    const imgCell = (url, idx, sx = {}) => (
        <Box
            key={idx}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                ...sx,
            }}
        >
            <Box
                component="img"
                src={url}
                alt=""
                sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                }}
            />
        </Box>
    );

    const overlay = (extra) => (
        <Box sx={{
            position: 'absolute', inset: 0,
            bgcolor: (t) => alphaColor(t.palette.common.black, 0.55),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
        }}>
            <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
        </Box>
    );

    // 1 photo — full width
    if (count === 1) {
        return (
            <Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}>
                <Box component="img" src={mediaUrls[0]} alt=""
                     sx={{ width: '100%', maxHeight: 600, objectFit: 'contain', display: 'block' }}
                />
            </Box>
        );
    }

    // 2 photos — side by side
    if (count === 2) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0)}
                {imgCell(mediaUrls[1], 1)}
            </Box>
        );
    }

    // 3 photos — big left, two stacked right
    if (count === 3) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
            </Box>
        );
    }

    // 4 photos — big top, three on bottom
    if (count === 4) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380, md: 440 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0, { gridColumn: '1 / 4' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
                {imgCell(mediaUrls[3], 3)}
            </Box>
        );
    }

    // 5+ photos — big left, four right in 2x2 grid, +N overlay on last
    const extra = count - 5;
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360, md: 420 }, mt: 1.5 }}>
            {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
            {imgCell(mediaUrls[1], 1)}
            {imgCell(mediaUrls[2], 2)}
            {imgCell(mediaUrls[3], 3)}
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <Box component="img" src={mediaUrls[4]} alt=""
                     sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {extra > 0 && overlay(extra)}
            </Box>
        </Box>
    );
}

/* ============================================================================ */
export const PostCard = memo(function PostCard({
                                                   post,
                                                   user,
                                                   hoveredId,
                                                   setHoveredId,
                                                   onLocationClick,
                                                   locationClickable = true,
                                                   onCardClick,
                                                   onOpenUserCard,
                                                   selectedId,
                                                   selectable = false,

                                                   // Optional context hints (used by Profile posts list)
                                                   actionBarVariant = '',
                                                   forceProfileActionBar = false,

                                                   currentView = '',
                                                   showTopAccent = true,

                                                   // Hide the three-dot post options menu (used by map popup cards)
                                                   hidePostMenu = false,

                                                   // Flat mode: strip card chrome for profile feed
                                                   flat = false,

                                                   // Business account restriction - hide edit/delete for personal posts
                                                   isBusinessAccount = false,

                                                   // Group context - used for poll voting
                                                   groupId = null,

                                                   // Slot rendered between content and CardActions (used for photo grid)
                                                   renderBeforeActions = null,

                                                   // Connected mode: edge-to-edge cards with no gap/radius on mobile (social feed style)
                                                   connected = false,

                                                   // Attribution row rendered inside the card header (e.g. "Liked by @user")
                                                   attributionRow = null,
                                               }) {
    const {
        id,
        first_name,
        last_name,
        handle,
        avatar_url,
        profile_picture,
        date_created,
        posted_at,
        created_at,
        createdAt,
        title,
        description,
        city,
        county,
        street_address,
        likesCount,
        likes_count,
        like_count,
        likes,
        viewerLiked,
        viewer_liked,
        liked,
        is_liked,
        commentsCount,
        comments_count,
        comment_count,
        comments,
        repostsCount,
        reposts_count,
        repost_count,
        reposts,
        viewerReposted,
        viewer_reposted,
        reposted,
        is_reposted,
        category,
        lost_or_found,
        help_type,  // for legacy volunteer/help split
        request_kind,
        requestKind,
        rec_type,   // legacy (kept for backward compatibility; tips removed)
        reward,
        resolved_at,
        resolved_message,
        resolved_by_user_id,
        // provided by API
        user_id,    // post author id (preferred)

        // group context (present for group posts)
        group_id,
        group_name,
        group_image_url,
    } = post;

    const groupObj = post?.group && typeof post.group === 'object' ? post.group : null;

    const baseGroupIdRaw =
        group_id ??
        post?.group_id ??
        post?.groupId ??
        post?.groupID ??
        post?.community_group_id ??
        post?.communityGroupId ??
        post?.group_post_group_id ??
        post?.group_post?.group_id ??
        groupObj?.id ??
        groupObj?.group_id ??
        groupObj?.groupId ??
        null;

    const baseGroupId = baseGroupIdRaw != null && String(baseGroupIdRaw).trim() !== '' ? Number(baseGroupIdRaw) : 0;

    const baseGroupName = String(
        group_name ??
        post?.group_name ??
        post?.groupName ??
        post?.groupTitle ??
        post?.group_post_group_name ??
        post?.group_post?.group_name ??
        groupObj?.name ??
        groupObj?.group_name ??
        ''
    ).trim();

    const baseGroupAvatarUrl = String(
        group_image_url ??
        post?.group_image_url ??
        post?.groupImageUrl ??
        post?.groupAvatarUrl ??
        post?.group_post_group_image_url ??
        post?.group_post?.group_image_url ??
        groupObj?.image_url ??
        groupObj?.photo_url ??
        groupObj?.group_photo_url ??
        groupObj?.avatar_url ??
        ''
    ).trim();

    const authCtx = useAuth();
    const { activeBusinessId: cardActiveBizId, activeArtistId: cardActiveArtistId, isArtistAccount: cardIsArtistAccount, activeAccount: cardActiveAccount } = useActiveAccount();
    const viewNorm = String(currentView || '').trim().toLowerCase();
    // IMPORTANT: For ownership checks, only use the logged-in user from auth context
    // The `user` prop might be the profile owner when viewing someone else's profile
    const viewerUser = authCtx?.user || null;

    const [groupCtx, setGroupCtx] = useState(() => ({
        id: baseGroupId || 0,
        name: baseGroupName,
        avatarUrl: baseGroupAvatarUrl,
        loaded: Boolean(baseGroupId || baseGroupName || baseGroupAvatarUrl),
    }));

    // Keep state in sync if the feed includes group fields directly.
    useEffect(() => {
        const nextId = baseGroupId || 0;
        const nextName = baseGroupName;
        const nextAvatar = baseGroupAvatarUrl;

        setGroupCtx((prev) => {
            if (
                prev?.id === nextId &&
                String(prev?.name || '') === String(nextName || '') &&
                String(prev?.avatarUrl || '') === String(nextAvatar || '')
            ) {
                return prev;
            }
            return {
                id: nextId,
                name: nextName,
                avatarUrl: nextAvatar,
                loaded: Boolean(nextId || nextName || nextAvatar),
            };
        });
    }, [baseGroupId, baseGroupName, baseGroupAvatarUrl]);

    const inProfileView =
        viewNorm === 'profile' ||
        String(actionBarVariant || '').trim().toLowerCase() === 'profile' ||
        Boolean(forceProfileActionBar);

    // Some profile endpoints may return posts without group_id even if they are group-linked.
    // Hydrate via /api/community/:id (which includes group_id/name/image) in profile view only.
    // IMPORTANT: Mark when this check completes so we don't briefly render the wrong category chip.
    useEffect(() => {
        const postId = Number(post?.id || 0);

        if (!inProfileView || !postId) {
            setGroupCheckDone(true);
            return undefined;
        }

        if (groupCtx?.id) {
            setGroupCheckDone(true);
            return undefined;
        }

        if (groupCheckRunningRef.current) return undefined;

        groupCheckRunningRef.current = true;
        setGroupCheckDone(false);

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`/api/community/${encodeURIComponent(String(postId))}`, { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                const p = data?.post || data || null;
                if (!p || cancelled) return;

                const gidRaw = p?.group_id ?? p?.groupId ?? p?.community_group_id ?? null;
                const gid = gidRaw != null && String(gidRaw).trim() !== '' ? Number(gidRaw) : 0;
                if (!gid) return;

                const name = String(p?.group_name || '').trim();
                const avatarUrl = String(p?.group_image_url || '').trim();

                if (!cancelled) {
                    setGroupCtx({
                        id: gid,
                        name,
                        avatarUrl,
                        loaded: true,
                    });
                }
            } catch {
                // ignore
            } finally {
                groupCheckRunningRef.current = false;
                if (!cancelled) setGroupCheckDone(true);
            }
        })();

        return () => {
            cancelled = true;
            groupCheckRunningRef.current = false;
        };
    }, [inProfileView, post?.id, groupCtx?.id]);


    // In profile view, group posts may arrive without group_id at first.
    // We defer rendering the category chip until we've checked /api/community/:id once,
    // to avoid a brief "Discussion" (or other category) chip flicker before group context hydrates.
    const [groupCheckDone, setGroupCheckDone] = useState(() => {
        if (!inProfileView) return true;
        return Boolean(baseGroupId);
    });
    const groupCheckRunningRef = useRef(false);

    // If we have a group id but missing details, fetch group details for a clean "Posted in ..." label.
    // Use a ref to track which group id we've already fetched, preventing infinite re-fetch loops
    // (when API returns empty name/avatar, setGroupCtx creates a new object → re-render → effect
    //  re-runs → fetch again → setGroupCtx again → infinite loop).
    const groupDetailsFetchedRef = useRef(0);
    useEffect(() => {
        const gid = Number(groupCtx?.id || 0);
        if (!gid) return undefined;

        const hasName = Boolean(String(groupCtx?.name || '').trim());
        const hasAvatar = Boolean(String(groupCtx?.avatarUrl || '').trim());
        if (hasName && hasAvatar) return undefined;

        // Prevent re-fetching the same group id (avoids infinite loop when API returns empty name/avatar)
        if (groupDetailsFetchedRef.current === gid) return undefined;
        groupDetailsFetchedRef.current = gid;

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`/api/groups/${encodeURIComponent(String(gid))}`, { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json().catch(() => null);
                const g = data?.group || data || null;
                if (!g || cancelled) return;

                const name = String(g?.name || g?.group_name || '').trim();
                const avatarUrl = String(g?.image_url || g?.photo_url || g?.group_photo_url || g?.icon_url || '').trim();

                if (!cancelled) {
                    setGroupCtx((prev) => {
                        const nextName = name || String(prev?.name || '');
                        const nextAvatar = avatarUrl || String(prev?.avatarUrl || '');
                        // Return same reference if nothing changed — prevents unnecessary re-renders
                        if (
                            prev?.id === gid &&
                            String(prev?.name || '') === nextName &&
                            String(prev?.avatarUrl || '') === nextAvatar &&
                            prev?.loaded === true
                        ) {
                            return prev;
                        }
                        return { id: gid, name: nextName, avatarUrl: nextAvatar, loaded: true };
                    });
                }
            } catch {
                // ignore
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [groupCtx?.id, groupCtx?.name, groupCtx?.avatarUrl]);

    const viewerId = Number(viewerUser?.id || 0);

    const authorId = Number(user_id || post?.userId || post?.author_id || post?.owner_id || 0);

    // Strict ownership check - only compare numeric user IDs
    const isOwner = Boolean(viewerId && authorId && viewerId === authorId);
    const hideActionChip = viewNorm === 'group';

    // Only the post owner can manage (edit/delete) posts
    // Business accounts cannot edit/delete personal community posts
    const canManage = isOwner && !isBusinessAccount;

    const fire = (name, detail) => {
        try {
            window.dispatchEvent(new CustomEvent(name, { detail }));
        } catch {
            // ignore
        }
    };

    const isEditedNow = Boolean(
        post?.edited_at ||
        post?.editedAt ||
        post?.has_edits ||
        post?.edits_count ||
        post?.editsCount ||
        post?.is_edited ||
        post?.isEdited
    );

    const editedStorageKey = useMemo(() => {
        const idNum = Number(id);
        return idNum ? `ll.communityPost.edited.${idNum}` : '';
    }, [id]);

    const [persistedEdited, setPersistedEdited] = useState(() => {
        if (!editedStorageKey) return false;
        try {
            return window.localStorage.getItem(editedStorageKey) === '1';
        } catch {
            return false;
        }
    });

    // Owner actions menu (Edit/Delete) — reduces visual clutter vs separate icons
    const [ownerMenuEl, setOwnerMenuEl] = useState(null);
    const ownerMenuOpen = Boolean(ownerMenuEl);

    const openOwnerMenu = (e) => {
        e.stopPropagation();
        setOwnerMenuEl(e.currentTarget);
    };
    const closeOwnerMenu = (e) => {
        if (e) e.stopPropagation();
        setOwnerMenuEl(null);
    };

    // Hide/block state — toast confirmation when user hides posts from this
    // author or blocks them outright.
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    useEffect(() => {
        if (!editedStorageKey) return;
        if (!isEditedNow) return;
        setPersistedEdited(true);
        try {
            window.localStorage.setItem(editedStorageKey, '1');
        } catch {
            // ignore
        }
    }, [editedStorageKey, isEditedNow]);

    // Show "Edited" indicator to everyone, not just the owner
    const showEdited = isEditedNow || persistedEdited;

    const finalLikesCount = Number(likesCount ?? likes_count ?? like_count ?? likes ?? 0);
    const finalViewerLiked = Boolean(viewerLiked ?? viewer_liked ?? liked ?? is_liked ?? false);
    const finalCommentsCount = Number(commentsCount ?? comments_count ?? comment_count ?? comments ?? 0);
    const finalRepostsCount = Number(repostsCount ?? reposts_count ?? repost_count ?? reposts ?? 0);
    const finalViewerReposted = Boolean(viewerReposted ?? viewer_reposted ?? reposted ?? is_reposted ?? false);

    // ── Post-type-aware identity resolution ──
    // Business and artist posts should show the entity's name/handle/avatar
    // instead of the personal user's identity, and use the correct fallback icon.
    const rawCatForIdentity = String(post?.category || post?.post_type || '').toLowerCase();
    const rawAcctType = String(post?.account_type || '').toLowerCase();
    const isBusinessPost = rawCatForIdentity === 'business_post' || rawAcctType === 'business';
    const isArtistPost = rawCatForIdentity === 'artist_post' || rawAcctType === 'artist';

    const resolvedDisplayName = (() => {
        if (isBusinessPost) {
            const bn = (post?.business_name || post?.businessName || post?.account_name || '').trim();
            if (bn) return { first: bn, last: '' };
        }
        if (isArtistPost) {
            const an = (post?.artist_name || post?.artistName || post?.account_name || '').trim();
            if (an) return { first: an, last: '' };
        }
        return { first: first_name || '', last: last_name || '' };
    })();

    const resolvedHandle = (() => {
        if (isBusinessPost) {
            return (post?.business_slug || post?.businessSlug || post?.account_handle || handle || '').trim();
        }
        if (isArtistPost) {
            return (post?.artist_handle || post?.artistHandle || post?.account_handle || handle || '').trim();
        }
        return (handle || '').trim();
    })();

    const resolvedAvatarSrc = (() => {
        if (isBusinessPost) {
            return (post?.businessLogo || post?.business_avatar_url || post?.account_avatar_url || avatar_url || '').trim();
        }
        if (isArtistPost) {
            return (post?.artistAvatar || post?.artist_avatar_url || post?.account_avatar_url || avatar_url || '').trim();
        }
        return (avatar_url || profile_picture || '').trim();
    })();

    // Visual artist (profile_type === 'artist') → palette icon; else music note.
    const artistProfileType = String(
        post?.profile_type || post?.profileType ||
        post?.artist_profile_type || post?.artistProfileType || ''
    ).toLowerCase();
    const isVisualArtistPost = isArtistPost && artistProfileType === 'artist';

    const AvatarFallbackIcon = isBusinessPost
        ? StorefrontOutlinedIcon
        : isArtistPost
            ? (isVisualArtistPost ? PaletteRoundedIcon : MusicNoteRoundedIcon)
            : PersonRoundedIcon;

    const avatarSrc = resolvedAvatarSrc;
    const posterIsVerified = Boolean(
        post?.is_verified === true || post?.is_verified === 1 || post?.is_verified === "1" ||
        post?.isVerified === true || post?.isVerified === 1 || post?.isVerified === "1" ||
        post?.posterIsVerified === true || post?.posterIsVerified === 1 || post?.posterIsVerified === "1" ||
        post?.poster_is_verified === true || post?.poster_is_verified === 1 || post?.poster_is_verified === "1"
    );
    const postDate = date_created || posted_at || created_at || createdAt;

    const [imgError, setImgError] = useState(false);

    const processedPhotos = extractPhotos(post);
    const mainPhoto = processedPhotos[0] || '';
    const showImage = !!mainPhoto && !imgError;

    const isStatewidePost = (() => {
        const c = String(post?.city || '').trim().toLowerCase();
        const co = String(post?.county || '').trim().toLowerCase();
        // Statewide when both are empty/null, or explicitly 'statewide', or legacy 'all counties'/'all cities'
        if (!c && !co) return true;
        if (c === 'statewide' || co === 'statewide') return true;
        if (c === 'all cities' && co === 'all counties') return true;
        return Boolean(post?.statewide ?? post?.is_statewide ?? post?.isStatewide);
    })();

    const countyLabel = county
        ? (String(county).toLowerCase().includes('county') ? county : `${county} County`)
        : '';
    const locationStr = isStatewidePost ? 'Alabama (Statewide)' : [post.city, countyLabel].filter(Boolean).join(', ');

    const safeDesc = stripHtml(typeof description === 'string' ? description : (description ?? '').toString());

    // Detect if the description contains HTML formatting (rich text from RichTextEditor)
    const rawDescHtml = typeof description === 'string' ? description : (description ?? '').toString();
    const descHasHtml = /<[a-z][\s\S]*?>/i.test(rawDescHtml);

    const splitCategory = deriveSplitCategory(post);

    // Lost/Found status + update preview
    const isLostFoundPost =
        Boolean(String(lost_or_found || '').trim()) ||
        ['lost-found', 'lost-and-found'].includes(normalizeCategory(category));

    const lostFoundResolvedAtValue = isLostFoundPost ? (resolved_at || post?.resolvedAt || null) : null;
    const lostFoundResolvedMsg = isLostFoundPost ? String(resolved_message || post?.resolvedMessage || '').trim() : '';
    const lostFoundIsResolved = Boolean(isLostFoundPost && (lostFoundResolvedAtValue || lostFoundResolvedMsg));

    const rawUpdateMsg = String(
        post?.update_message ??
        post?.updateMessage ??
        post?.update_text ??
        post?.updateText ??
        post?.update ??
        ''
    ).trim();

    const lostFoundUpdateMsg = String(lostFoundResolvedMsg || rawUpdateMsg || '').trim();
    const hasLostFoundUpdate = isLostFoundPost && Boolean(lostFoundUpdateMsg);

    // Help Requests: resolved + resolution update preview
    const isHelpRequestPost = splitCategory === 'help-requests';

    const helpIsResolved = Boolean(
        isHelpRequestPost &&
        (
            Number(post?.is_resolved ?? post?.isResolved ?? post?.resolved ?? 0) === 1 ||
            Boolean(post?.resolved_at ?? post?.resolvedAt ?? null)
        )
    );

    const helpResolutionText = String(
        post?.resolution_text ??
        post?.resolutionText ??
        ''
    ).trim();

    const hasHelpResolutionUpdate = Boolean(isHelpRequestPost && helpIsResolved && helpResolutionText);

    /* Short preview + "more" hint */
    const WORD_LIMIT = 28;
    const CHAR_LIMIT = 240;

    const descTrimmed = safeDesc.trim();
    const words = descTrimmed.split(/\s+/).filter(Boolean);

    const longByWords = words.length > WORD_LIMIT;
    const longByChars = descTrimmed.length > CHAR_LIMIT;

    const long = longByWords || longByChars;

    const preview = !long
        ? descTrimmed
        : longByWords
            ? words.slice(0, WORD_LIMIT).join(' ')
            : descTrimmed.slice(0, CHAR_LIMIT).trimEnd();

    const updateNormalized = lostFoundUpdateMsg.replace(/\s+/g, ' ').trim();
    const UPDATE_CHAR_LIMIT = 32;
    const updateNeedsMore = updateNormalized.length > UPDATE_CHAR_LIMIT;

    const updatePreviewText = updateNeedsMore
        ? `${updateNormalized.slice(0, UPDATE_CHAR_LIMIT).trimEnd()}…`
        : updateNormalized;

    const helpUpdateNormalized = helpResolutionText.replace(/\s+/g, ' ').trim();
    const HELP_UPDATE_CHAR_LIMIT = 64;
    const helpUpdateNeedsMore = helpUpdateNormalized.length > HELP_UPDATE_CHAR_LIMIT;

    const helpUpdatePreviewText = helpUpdateNeedsMore
        ? `${helpUpdateNormalized.slice(0, HELP_UPDATE_CHAR_LIMIT).trimEnd()}…`
        : helpUpdateNormalized;

    const showDescriptionPreview = Boolean(preview) && !hasLostFoundUpdate && !hasHelpResolutionUpdate;

    // Help type label for Help Requests (computed early so actionChip can use it)
    const helpTypeRaw = String(post?.help_type || help_type || '').trim().toLowerCase();
    const helpTypeOther = String(post?.help_type_other || post?.help_typeOther || '').trim();
    const helpTypeLabel =
        helpTypeRaw
            ? (helpTypeRaw === 'other'
                ? (helpTypeOther ? `Other: ${helpTypeOther}` : 'Other')
                : (HELP_TYPE_LABELS[helpTypeRaw] || formatNiceLabel(helpTypeRaw)))
            : '';

    const badgeMeta = buildBadgeFor(post);
    const actionChip = (() => {
        if (hideActionChip) return null;
        const shouldDeferBadge = Boolean(inProfileView && !Number(groupCtx?.id || 0) && !groupCheckDone);
        if (shouldDeferBadge) return null;

        if (Number(groupCtx?.id || 0)) {
            return (
                <Chip
                    size="small"
                    component={RouterLink}
                    to={`/groups/${encodeURIComponent(String(groupCtx?.id || 0))}`}
                    clickable
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    aria-label="View group"
                    icon={(() => {
                        const grpSrc = (groupCtx?.avatarUrl || baseGroupAvatarUrl) || '';
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
                                {String((groupCtx?.name || baseGroupName) || 'Group')}
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
            );
        }

        if (!badgeMeta) return null;

        const BadgeIcon = badgeMeta.Icon;

        // For Help Requests or Volunteers with a subcategory, show two-line label
        const isHelpRequestCategory = badgeMeta.label === 'Help Request';
        const isVolunteerCategory = badgeMeta.label === 'Volunteer';
        const showSubcategory = (isHelpRequestCategory || isVolunteerCategory) && helpTypeLabel;

        if (showSubcategory) {
            return (
                <Chip
                    size="small"
                    icon={<BadgeIcon sx={{ fontSize: '13px !important' }} />}
                    label={
                        <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1, py: 0.1 }}>
                            <Box sx={{ fontSize: 10, fontWeight: 900, opacity: 0.85 }}>{badgeMeta.label}</Box>
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
                                {helpTypeLabel}
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
                        '& .MuiChip-label': { px: 0.9, lineHeight: 1 },
                    })}
                />
            );
        }

        return (
            <Chip
                size="small"
                label={badgeMeta.label}
                icon={<BadgeIcon sx={{ fontSize: '13px !important' }} />}
                sx={(t) => ({
                    height: 24,
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
                    '& .MuiChip-label': { px: 0.9, lineHeight: 1 },
                })}
            />
        );
    })();

    const [avatarErrored, setAvatarErrored] = useState(false);
    useEffect(() => {
        setAvatarErrored(false);
    }, [avatarSrc, id]);
    const avatarImgSrc = !avatarErrored ? avatarSrc : '';

    const openUserCard = (e) => {
        e.stopPropagation();
        if (typeof onOpenUserCard !== 'function') return;
        const cardData = {
            id: user_id || undefined,
            first_name: resolvedDisplayName.first,
            last_name: resolvedDisplayName.last,
            handle: resolvedHandle,
            avatar_url: avatarSrc,
        };
        if (isBusinessPost) {
            cardData.account_type = 'business';
            cardData.business_id = post?.business_id || post?.businessId;
            cardData.business_name = resolvedDisplayName.first;
            cardData.business_slug = resolvedHandle;
            cardData.business_avatar_url = avatarSrc;
        } else if (isArtistPost) {
            cardData.account_type = 'artist';
            cardData.artist_id = post?.artist_id || post?.artistId;
            cardData.artist_name = resolvedDisplayName.first;
            cardData.artist_handle = resolvedHandle;
            cardData.artist_avatar_url = avatarSrc;
        }
        onOpenUserCard(e.currentTarget, cardData);
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



    const fireLocationClick = (e) => {
        if (!locationClickable) return;
        e.stopPropagation();
        onLocationClick?.(post);
    };
    const onLocKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fireLocationClick(e);
        }
    };

    const hoverKey = useMemo(() => toHoverKey(id), [id]);
    const isHovered = String(hoveredId ?? '') === String(hoverKey);
    const isSelected = selectable && String(selectedId ?? '') === String(id);

    const showRewardChip =
        String(lost_or_found).toLowerCase() === 'lost' &&
        reward !== undefined &&
        reward !== null &&
        String(reward).trim() !== '' &&
        String(reward).trim() !== '0';

    const derivedCategory = deriveSplitCategory(post);

    const expiresAtRaw = post?.expires_at ?? post?.expiresAt ?? null;
    const expiresAtLabel = expiresAtRaw ? dateTimeLabel(expiresAtRaw) : '';
    const showExpiresAt = derivedCategory === 'public-safety-alerts' && Boolean(expiresAtLabel);

    const isHelpRequest =
        ['help-requests', 'help_requests', 'help request', 'help requests'].includes(derivedCategory) ||
        ['help-requests', 'help_requests', 'volunteer-help-requests', 'volunteer-requests', 'volunteer_help_requests'].includes(
            String(post?.category || '').toLowerCase()
        );

    const isUrgent =
        isHelpRequest &&
        Boolean(Number(post?.is_urgent ?? post?.isUrgent ?? post?.urgent ?? 0));

    const isMapPopupCard = showTopAccent === false;

    const isProfileContext =
        String(actionBarVariant || '').trim().toLowerCase() === 'profile' || Boolean(forceProfileActionBar);


    // Determine if Mark as Found/Resolved should be shown in menu
    // Show for any owner (including business accounts) — disabled when isBusinessAccount
    const showMarkFoundInMenu =
        isOwner &&
        String(lost_or_found || '').toLowerCase() === 'lost' &&
        !lostFoundIsResolved;

    const showMarkResolvedInMenu =
        isOwner &&
        isHelpRequestPost &&
        !helpIsResolved;

    // Report dialog state
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [copyToast, setCopyToast] = useState(false);

    const resetReportDialog = () => {
        setReportOpen(false);
        // Delay reset so close animation finishes
        setTimeout(() => {
            setReportReason('');
            setReportDetails('');
            setReportSubmitted(false);
            setReportSubmitting(false);
        }, 250);
    };

    const handleCopyLink = (e) => {
        e.stopPropagation();
        closeOwnerMenu(e);
        const postUrl = `${window.location.origin}/posts/${id}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            setCopyToast(true);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = postUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopyToast(true);
        });
    };

    const handleReportClick = (e) => {
        e.stopPropagation();
        closeOwnerMenu(e);
        setReportOpen(true);
    };

    // ── Hide posts / Block user handlers ──
    // Target the post's author (personal user_id). Backend enforces that
    // you can't target yourself.
    const handleHideUser = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const uid = Number(authorId || 0);
        if (!uid || hideBusy || blockBusy) return;
        setHideBusy(true);
        const displayName = String(first_name || last_name ? `${first_name || ''} ${last_name || ''}`.trim() : 'this user');
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
    }, [authorId, hideBusy, blockBusy, first_name, last_name]);

    const handleBlockUser = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const uid = Number(authorId || 0);
        if (!uid || hideBusy || blockBusy) return;
        setBlockBusy(true);
        const displayName = String(first_name || last_name ? `${first_name || ''} ${last_name || ''}`.trim() : 'User');
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
    }, [authorId, hideBusy, blockBusy, first_name, last_name]);

    const submitReport = async () => {
        if (!reportReason) return;
        setReportSubmitting(true);
        const urls = [
            `/api/posts/${encodeURIComponent(id)}/flag`,
            `/api/community/${encodeURIComponent(id)}/flag`,
            `/api/community/posts/${encodeURIComponent(id)}/flag`,
        ];
        for (const url of urls) {
            try {
                const res = await secureFetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reportReason, details: reportDetails }),
                });
                if (res.ok) {
                    setReportSubmitting(false);
                    setReportSubmitted(true);
                    return;
                }
            } catch {
                // try next
            }
        }
        setReportSubmitting(false);
        setReportSubmitted(true);
    };


    return (
        <>
            <Card
                data-post-id={id}
                data-selected={isSelected ? 'true' : 'false'}
                elevation={flat || connected ? 0 : undefined}
                onClick={() => { if (!reportOpen) onCardClick?.(post); }}
                sx={(t) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    minHeight: flat || connected ? 'auto' : { xs: 360, sm: 350, md: 340 },
                    height: 'auto',
                    position: 'relative',
                    isolation: flat || connected ? 'auto' : 'isolate',
                    borderRadius: flat ? '0 !important' : connected ? { xs: '0 !important', sm: '16px' } : '16px',
                    border: flat ? '0 !important' : connected ? { xs: '0 !important', sm: '1px solid' } : '1px solid',
                    borderBottom: connected ? { xs: `1px solid ${alphaColor(t.palette.text.primary, 0.06)}`, sm: '1px solid' } : undefined,
                    borderColor: flat
                        ? 'transparent'
                        : isSelected
                            ? t.palette.secondary.main
                            : alphaColor(t.palette.text.primary, 0.08),
                    bgcolor: flat ? t.palette.background.paper : t.palette.background.paper,
                    ...(flat || connected ? { boxShadow: 'none !important' } : {}),
                    overflow: flat || connected ? 'visible' : 'hidden',
                    cursor: 'pointer',
                    boxShadow: flat || connected
                        ? 'none'
                        : isSelected
                            ? '0 8px 32px rgba(0,0,0,0.12)'
                            : isHovered
                                ? '0 6px 20px rgba(0,0,0,0.08)'
                                : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: flat || connected ? 'none' : 'all 180ms ease',
                    transform: 'none',
                    // Mobile: active press feedback
                    '@media (hover: none)': {
                        '&:active': flat || connected ? {} : {
                            transform: 'scale(0.985)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        },
                    },
                    // Short-height desktops: allow cards to be shorter and tighter so
                    // more posts fit in the visible feed without bunching.
                    '@media (min-width: 1440px) and (max-height: 820px)': flat || connected ? {} : {
                        minHeight: 240,
                        '& [data-post-header]': { py: '6px !important' },
                        '& [data-post-body]': { py: '4px !important' },
                    },
                    // Clean card style — no top accent bar
                })}
                onMouseEnter={() => setHoveredId?.(hoverKey)}
                onMouseLeave={() => setHoveredId?.(null)}
            >
                {/* Attribution row (e.g. "Liked by @user") — rendered inside the card */}
                {attributionRow}

                {/* Custom header with hoverable user section */}
                <Box data-post-header sx={{ px: flat || connected ? { xs: 1.5, sm: 2 } : 2, pt: flat ? 1.5 : connected ? { xs: 1.25, sm: 2 } : 2, pb: flat ? 0.5 : 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    {/* Hoverable user section (avatar + info) - compact highlight */}
                    <Box
                        onClick={openUserCard}
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            cursor: typeof onOpenUserCard === 'function' ? 'pointer' : 'default',
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            transition: (t) => `background-color ${t.custom?.motion?.fast || 150}ms ${t.custom?.motion?.ease || 'ease'}`,
                            '&:hover': typeof onOpenUserCard === 'function' ? {
                                bgcolor: (t) => alphaColor(t.palette.text.primary, 0.04),
                            } : {},
                            minWidth: 0,
                            overflow: 'hidden',
                        }}
                    >
                        <Avatar
                            src={avatarImgSrc || undefined}
                            sx={(t) => ({
                                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                width: 48,
                                height: 48,
                                flexShrink: 0,
                                border: '2px solid',
                                borderColor: alphaColor(t.palette.text.primary, 0.06),
                            })}
                            onError={() => setAvatarErrored(true)}
                        >
                            <AvatarFallbackIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                            {/* Row 1: Name + Verified */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 750,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {resolvedDisplayName.first} {resolvedDisplayName.last}
                                </Typography>
                            </Box>
                            {/* Row 2: Handle */}
                            {!!resolvedHandle && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    @{resolvedHandle}
                                </Typography>
                            )}
                            {/* Row 3: Timestamp and edited indicator */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgoCompact(postDate)}
                                </Typography>
                                {showEdited && (
                                    <>
                                        <Typography variant="caption" color="text.disabled">•</Typography>
                                        <Typography
                                            variant="caption"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fire('ll:communityPost:requestHistory', { postId: id, post });
                                            }}
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
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Three-dot post options menu — hidden when hidePostMenu is true */}
                    {!hidePostMenu && (
                        <>
                            <Tooltip title="Post options" arrow>
                                <IconButton
                                    size="small"
                                    aria-label="Post options"
                                    onClick={openOwnerMenu}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        flexShrink: 0,
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
                                        boxShadow: (t) => t.custom?.shadows?.lg || '0 8px 32px rgba(0,0,0,0.12)',
                                        minWidth: 190,
                                        py: 0.5,
                                    },
                                }}
                            >
                                {/* Copy link — available for everyone */}
                                <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                                    <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Copy link" />
                                </MenuItem>

                                {/* Mark as Found (Lost & Found posts only) */}
                                {showMarkFoundInMenu && !isBusinessAccount && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <MenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeOwnerMenu(e);
                                                fire('ll:communityPost:requestMarkFound', { postId: id, post });
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

                                {/* Mark as Resolved (Help Request posts only) */}
                                {showMarkResolvedInMenu && !isBusinessAccount && (
                                    <>
                                        {!showMarkFoundInMenu && <Divider sx={{ my: 0.5 }} />}
                                        <MenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeOwnerMenu(e);
                                                fire('ll:communityPost:requestMarkResolved', { postId: id, post });
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

                                {/* Owner actions: Edit and Delete */}
                                {canManage && <Divider sx={{ my: 0.5 }} />}
                                {canManage && (
                                    <MenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeOwnerMenu(e);
                                            fire('ll:communityPost:requestEdit', { postId: id, post });
                                        }}
                                        sx={{ py: 1 }}
                                    >
                                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Edit post" />
                                    </MenuItem>
                                )}
                                {canManage && (
                                    <MenuItem
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeOwnerMenu(e);
                                            fire('ll:communityPost:requestDelete', { postId: id, post });
                                        }}
                                        sx={{ py: 1, color: 'error.main' }}
                                    >
                                        <ListItemIcon sx={{ color: 'error.main' }}>
                                            <DeleteIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Delete post" />
                                    </MenuItem>
                                )}

                                {/* Report — hidden for post owner (can't report your own post) */}
                                {!isOwner && (
                                    <>
                                        <Divider sx={{ my: 0.5 }} />
                                        <MenuItem onClick={handleReportClick} sx={{ py: 1 }}>
                                            <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Report post" />
                                        </MenuItem>
                                    </>
                                )}
                                {/* Hide posts / Block — only for non-owners */}
                                {!isOwner && viewerId > 0 && (
                                    <MenuItem onClick={handleHideUser} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                        <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Hide posts" />
                                    </MenuItem>
                                )}
                                {!isOwner && viewerId > 0 && (
                                    <MenuItem onClick={handleBlockUser} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                        <ListItemIcon sx={{ color: 'error.main' }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                                        <ListItemText primary="Block user" />
                                    </MenuItem>
                                )}
                            </SmartMenu>
                        </>
                    )}
                </Box>

                <Box
                    data-post-body
                    sx={{
                        flex: 1,
                        px: flat ? 2 : 2,
                        pt: flat ? 0.5 : ((showImage && !flat) ? 1 : 0.5),
                        pb: (hasLostFoundUpdate || hasHelpResolutionUpdate) ? 3 : (flat ? 0.5 : 1),
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: showImage ? 'flex-start' : 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', gap: (showImage && !flat) ? 2 : 0, alignItems: (showImage && !flat) ? 'center' : 'flex-start' }}>
                        {/* Desktop only: side thumbnail */}
                        {showImage && !flat && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'relative',
                                        width: { xs: 140, sm: 150, md: 160 },
                                        height: { xs: 140, sm: 150, md: 160 },
                                        flexShrink: 0,
                                        // Short-height desktops: shrink the thumbnail so the card
                                        // can be meaningfully shorter (pairs with card minHeight: 240).
                                        '@media (min-width: 1440px) and (max-height: 820px)': {
                                            width: 96,
                                            height: 96,
                                        },
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={mainPhoto}
                                        loading="lazy"
                                        onError={() => setImgError(true)}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            border: '1px solid',
                                            borderColor: (t) => alphaColor(t.palette.text.primary, 0.08),
                                            boxShadow: (t) => t.custom.shadows.xs,
                                            display: 'block',
                                        }}
                                        alt=""
                                    />

                                    {processedPhotos.length > 1 ? (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: '50%',
                                                bottom: 6,
                                                transform: 'translateX(-50%)',
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 999,
                                                bgcolor: (t) => alphaColor(t.palette.common.black, 0.70),
                                                backdropFilter: 'blur(4px)',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                color: 'common.white',
                                                lineHeight: 1.2,
                                                whiteSpace: 'nowrap',
                                                userSelect: 'none',
                                            }}
                                        >
                                            +{processedPhotos.length - 1} more
                                        </Box>
                                    ) : null}
                                </Box>
                            </Box>
                        )}

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {title && (
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mt: 0,
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.3,
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere',
                                        ...(isMapPopupCard
                                            ? {
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }
                                            : {}),
                                    }}
                                >
                                    {title}
                                </Typography>
                            )}

                            {/* Category chip under title */}
                            {actionChip && (
                                <Box sx={{ mt: 0.5, display: 'flex' }}>
                                    {actionChip}
                                </Box>
                            )}

                            {/* Reward for Lost items (under category chip) */}
                            {showRewardChip && (
                                <Chip
                                    size="small"
                                    label={`Reward: ${formatReward(reward)}`}
                                    sx={{
                                        alignSelf: 'flex-start',
                                        mt: 0.5,
                                        fontWeight: 800,
                                        borderRadius: 999,
                                        bgcolor: (t) => alphaColor(t.palette.warning.main, 0.12),
                                        border: '1px solid',
                                        borderColor: (t) => alphaColor(t.palette.warning.main, 0.35),
                                    }}
                                />
                            )}

                            {showExpiresAt ? (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: 'block', fontWeight: 700 }}
                                >
                                    Expires at {expiresAtLabel}
                                </Typography>
                            ) : null}

                            {/* Status chips: Urgent, Resolved/Found */}
                            {(isUrgent || lostFoundIsResolved || helpIsResolved) ? (
                                <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
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

                                    {lostFoundIsResolved ? (
                                        <Chip
                                            size="small"
                                            label="Found"
                                            icon={<CheckCircleRoundedIcon sx={{ color: 'success.dark', fontSize: 16 }} />}
                                            sx={{
                                                fontWeight: 900,
                                                borderRadius: 999,
                                                border: (t) => `1px solid ${alphaColor(t.palette.success.main, 0.35)}`,
                                                bgcolor: (t) => alphaColor(t.palette.success.main, 0.08),
                                                '& .MuiChip-label': { fontWeight: 900 },
                                            }}
                                        />
                                    ) : null}

                                    {helpIsResolved ? (
                                        <Chip
                                            size="small"
                                            label="Resolved"
                                            icon={<CheckCircleRoundedIcon sx={{ color: 'success.dark', fontSize: 16 }} />}
                                            sx={{
                                                fontWeight: 900,
                                                borderRadius: 999,
                                                border: (t) => `1px solid ${alphaColor(t.palette.success.main, 0.35)}`,
                                                bgcolor: (t) => alphaColor(t.palette.success.main, 0.08),
                                                '& .MuiChip-label': { fontWeight: 900 },
                                            }}
                                        />
                                    ) : null}
                                </Box>
                            ) : null}

                            {/* Update message - simplified inline display */}
                            {(hasLostFoundUpdate || hasHelpResolutionUpdate) ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mt: 0.5,
                                        lineHeight: 1.4,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    {hasLostFoundUpdate
                                        ? renderTextWithMentions(lostFoundUpdateMsg, onMentionClick)
                                        : renderTextWithMentions(helpResolutionText, onMentionClick)
                                    }
                                </Typography>
                            ) : null}

                            {showDescriptionPreview && (
                                descHasHtml ? (
                                    <Box
                                        sx={{
                                            mt: 0.6,
                                            color: 'text.secondary',
                                            fontSize: '0.875rem',
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: isMapPopupCard ? 2 : ((showImage && !flat) ? 3 : 4),
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                            '& p': { m: 0 },
                                            '& ul, & ol': { m: 0, pl: 2.5 },
                                            '& h1, & h2, & h3, & h4, & h5, & h6': { m: 0, fontSize: 'inherit', fontWeight: 700 },
                                            '& blockquote': { m: 0, pl: 1, borderLeft: '2px solid', borderColor: 'divider' },
                                            '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                                        }}
                                    >
                                        <RichTextDisplay html={rawDescHtml} />
                                        {long && (
                                            <Typography
                                                component="span"
                                                sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                ...more
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.6,
                                            lineHeight: 1.4,
                                            display: '-webkit-box',
                                            WebkitLineClamp: isMapPopupCard ? 2 : ((showImage && !flat) ? 3 : 4),
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                        }}
                                    >
                                        {renderTextWithMentions(preview, onMentionClick)}
                                        {long && (
                                            <Typography
                                                component="span"
                                                sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                ...more
                                            </Typography>
                                        )}
                                    </Typography>
                                )
                            )}

                            {/* Poll preview (card mode) */}
                            {normalizeCategory(category) === 'poll' && post?.poll && (
                                <Box sx={{ mt: 0.75 }}>
                                    <PollDisplay
                                        poll={post.poll}
                                        postId={post.id}
                                        variant="card"
                                        onCardClick={onCardClick}
                                        post={post}
                                        groupId={groupId}
                                    />
                                </Box>
                            )}

                            {/* Deal / Announcement boxes for business posts on social feed */}
                            {(() => {
                                if (post?.category !== 'business_post') return null;
                                const bpType = (post?.type || post?.post_type || 'update').toLowerCase();
                                const bpIsDeal = bpType === 'deal';
                                const bpIsAnnouncement = bpType === 'announcement';
                                if (!bpIsDeal && !bpIsAnnouncement) return null;

                                const bpDiscountText = post?.discountText || post?.discount_text || '';
                                const bpValidUntil = post?.validUntil || post?.valid_until || '';
                                const bpDealExpired = bpIsDeal && bpValidUntil && (() => { try { const d = new Date(bpValidUntil); const n = new Date(); n.setHours(0,0,0,0); return d < n; } catch { return false; } })();

                                return (
                                    <>
                                        {/* Announcement box */}
                                        {bpIsAnnouncement && (
                                            <Box
                                                sx={{
                                                    mt: 1.25,
                                                    p: 1.5,
                                                    bgcolor: (t) => alphaColor(t.palette.info.main, 0.06),
                                                    borderRadius: 2.5,
                                                    borderLeft: '4px solid',
                                                    borderLeftColor: 'info.main',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                                    <CampaignIcon sx={{ fontSize: 18, color: 'info.dark', flexShrink: 0 }} />
                                                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: 'info.dark' }}>
                                                        Announcement
                                                    </Typography>
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Deal box */}
                                        {bpIsDeal && (bpDiscountText || bpDealExpired) && (
                                            <Box
                                                sx={{
                                                    mt: 1.25,
                                                    p: 1.5,
                                                    bgcolor: (t) => bpDealExpired
                                                        ? alphaColor(t.palette.grey[500], 0.06)
                                                        : alphaColor(t.palette.success.main, 0.06),
                                                    borderRadius: 2.5,
                                                    borderLeft: '4px solid',
                                                    borderLeftColor: bpDealExpired ? 'grey.400' : 'success.main',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" spacing={0.75}>
                                                    <LocalOfferIcon sx={{ fontSize: 18, color: bpDealExpired ? 'grey.500' : 'success.dark', flexShrink: 0 }} />
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize: 13,
                                                            color: bpDealExpired ? 'text.disabled' : 'success.dark',
                                                            textDecoration: bpDealExpired ? 'line-through' : 'none',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {bpDiscountText || 'Deal'}
                                                    </Typography>
                                                </Stack>
                                                {bpValidUntil && (
                                                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.75 }}>
                                                        <ScheduleIcon sx={{ fontSize: 13, color: bpDealExpired ? 'error.main' : 'text.secondary' }} />
                                                        <Typography variant="caption" color={bpDealExpired ? 'error.main' : 'text.secondary'} fontWeight={600} sx={{ fontSize: 11 }}>
                                                            {bpDealExpired ? 'Expired' : `Valid until ${formatDate(bpValidUntil)}`}
                                                        </Typography>
                                                    </Stack>
                                                )}
                                            </Box>
                                        )}

                                        {/* Deal expired badge (standalone — when no discount text) */}
                                        {bpDealExpired && !bpDiscountText && (
                                            <Chip
                                                label="Expired"
                                                size="small"
                                                sx={{ mt: 1, height: 22, fontSize: '0.68rem', fontWeight: 600, bgcolor: 'error.light', color: 'error.contrastText' }}
                                            />
                                        )}
                                    </>
                                );
                            })()}

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
                                    <Box
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (fbSlug) window.location.assign(`/${fbSlug}`);
                                        }}
                                        sx={{
                                            mt: 1.25,
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
                                                boxShadow: (t) => t.custom.shadows.sm,
                                                transform: 'none',
                                            },
                                        }}
                                    >
                                        {/* Avatar / left accent */}
                                        <Box
                                            sx={{
                                                width: 58,
                                                minHeight: 58,
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
                                                <Typography sx={{ fontSize: 22, fontWeight: 800, color: 'common.white' }}>
                                                    {String(fbName || '?')[0].toUpperCase()}
                                                </Typography>
                                            )}
                                        </Box>

                                        {/* Info */}
                                        <Box sx={{ flex: 1, py: 0.75, px: 1.25, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.15 }}>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        fontSize: 8.5,
                                                        fontWeight: 900,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.6,
                                                        color: 'primary.main',
                                                        px: 0.6,
                                                        py: 0.1,
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
                                                    fontSize: 13,
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {fbName}
                                            </Typography>
                                            {(fbCategory || fbLoc) ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.15, flexWrap: 'wrap' }}>
                                                    {fbCategory ? (
                                                        <Box
                                                            component="span"
                                                            sx={{
                                                                display: 'inline-block',
                                                                px: 0.6,
                                                                py: 0.05,
                                                                borderRadius: 999,
                                                                fontSize: 10,
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
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.2 }}>
                                                            {fbCategory ? '· ' : ''}{fbLoc}
                                                        </Typography>
                                                    ) : null}
                                                </Box>
                                            ) : null}
                                        </Box>
                                    </Box>
                                );
                            })()}
                        </Box>
                    </Box>

                </Box>
                {/* Mobile: dynamic photo grid (matches ArtistPostCard) —
               skip when renderBeforeActions supplies its own photo grid */}
                {flat && showImage && !renderBeforeActions && (
                    <Box sx={{ px: 2 }}>
                        <MobilePhotoGrid
                            mediaUrls={processedPhotos}
                        />
                    </Box>
                )}
                {renderBeforeActions ? <Box sx={{ mb: 1 }}>{renderBeforeActions}</Box> : null}
                {/* Location row */}
                {(city || county || street_address || isStatewidePost) ? (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            maxWidth: '100%',
                            justifyContent: 'flex-end',
                            pointerEvents: 'auto',
                            px: flat ? 2 : 2,
                            mt: flat ? 1 : 'auto',
                            mb: flat ? 0.5 : 0.5,
                        }}
                    >
                        {/* Spacer pushes location to the right */}
                        <Box sx={{ flex: 1 }} />
                        {(city || county || street_address || isStatewidePost) && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    borderRadius: 1,
                                    cursor: locationClickable ? 'pointer' : 'inherit',
                                    '&:hover .post-loc-icon, &:hover .post-loc-text': locationClickable
                                        ? { color: 'secondary.main' }
                                        : undefined,
                                }}
                            >
                                <LocationOnRoundedIcon className="post-loc-icon" sx={{ fontSize: 15, color: 'primary.main', transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                                <Typography
                                    variant="body2"
                                    className="post-loc-text"
                                    {...(locationClickable
                                        ? {
                                            role: 'button',
                                            tabIndex: 0,
                                            'aria-label': 'View this location on the map',
                                            onClick: fireLocationClick,
                                            onKeyDown: onLocKey,
                                        }
                                        : {})}
                                    sx={{
                                        cursor: locationClickable ? 'pointer' : 'inherit',
                                        color: 'primary.main',
                                        fontWeight: 700,
                                        fontSize: 12,
                                        transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: { xs: 210, sm: 280, md: 320 },
                                    }}
                                >
                                    {street_address ? (
                                        <>
                                            {street_address}{locationStr ? ` ${locationStr}` : ''}
                                        </>
                                    ) : (
                                        locationStr
                                    )}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                ) : null}
                <CardActions sx={{ px: flat ? 2 : 2, pt: flat ? 1.5 : 1.5, pb: flat ? 0.5 : 1.4, mt: flat ? 0 : 'auto', borderTop: (flat || connected) ? 'none' : '1px solid', borderColor: (flat || connected) ? 'transparent' : 'divider' }}>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Box onClick={(e) => e.stopPropagation()} sx={{ width: 'fit-content' }}>
                            <ActionBar
                                user={user}
                                postId={id}
                                post={post}
                                initialLikes={finalLikesCount}
                                initiallyLiked={!!finalViewerLiked}
                                commentsCount={finalCommentsCount}
                                initialReposts={finalRepostsCount}
                                initiallyReposted={!!finalViewerReposted}
                                showBoost
                                useShareDialog
                                onComment={() => {
                                    onCardClick?.(post);
                                    try {
                                        window.dispatchEvent(new CustomEvent('ll:community:focusComment', { detail: { postId: id } }));
                                    } catch {}
                                }}
                            />
                        </Box>
                    </Box>
                </CardActions>
            </Card>

            {/* Report dialog */}
            {reportOpen && (
                <Dialog
                    open={reportOpen}
                    onClose={resetReportDialog}
                    maxWidth="xs"
                    fullWidth
                    onClick={(e) => e.stopPropagation()}
                    sx={{ zIndex: 100001 }}
                    PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
                >
                    {reportSubmitted ? (
                        <>
                            <DialogContent sx={{ textAlign: 'center', py: 5, px: 3 }}>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                                    <CheckCircleRoundedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                                    Thank you for your report
                                </Typography>
                                <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.5 }}>
                                    We take reports seriously and will review this. If it violates our community guidelines, we'll take appropriate action.
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                                <Button
                                    onClick={resetReportDialog}
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
                                <IconButton size="small" onClick={resetReportDialog} aria-label="Close">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ pt: 0, pb: 1 }}>
                                <Typography sx={{ fontSize: 14, color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                                    Why are you reporting this? Your report is anonymous.
                                </Typography>
                                <RadioGroup value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
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
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value.slice(0, 1000))}
                                    inputProps={{ maxLength: 1000 }}
                                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                                />
                                <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5, textAlign: 'right' }}>
                                    {(reportDetails || '').length}/1000
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                                <Button
                                    onClick={resetReportDialog}
                                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    disableElevation
                                    disabled={!reportReason || reportSubmitting}
                                    onClick={submitReport}
                                    startIcon={reportSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                    sx={{
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        px: 3,
                                        bgcolor: 'error.main',
                                        '&:hover': { bgcolor: 'error.dark' },
                                    }}
                                >
                                    {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            )}

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyToast}
                onClose={() => setCopyToast(false)}
                message="Link copied to clipboard"
            />

            {/* Hide/Block confirmation */}
            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast('')}
                message={hideBlockToast}
            />
        </>
    );
});
PostCard.displayName = 'PostCard';


/* ═══════════════════════════════════════════════════════════════════════════
   PrivatePostPrompt — displayed when a user tries to view a private post
   they don't follow. Shows author info + follow button using the same
   follow logic as UserCardPopover.

   Usage (e.g. on a post detail page when the API returns 403):
     import { PrivatePostPrompt } from './PostList';
     <PrivatePostPrompt author={errorData.author} />
   ═══════════════════════════════════════════════════════════════════════════ */

const PRIVATE_API_BASE = (() => {
    const raw = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
    return raw ? `${raw}/api` : '/api';
})();

export function PrivatePostPrompt({ author, message }) {
    const authCtx = useAuth();
    const viewer = authCtx?.user || null;
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();

    const [followBusy, setFollowBusy] = useState(false);
    const [followed, setFollowed] = useState(false);

    const authorId = Number(author?.id || 0);
    const viewerIdLocal = Number(viewer?.id || 0);
    const isSelf = Boolean(viewerIdLocal && authorId && viewerIdLocal === authorId);

    const avatarSrc = author?.avatar_url || author?.profile_picture || '';
    const authorName = [author?.first_name, author?.last_name].filter(Boolean).join(' ').trim() || '(Unknown)';
    const authorHandle = author?.handle ? `@${author.handle}` : '';

    const handleFollow = async () => {
        if (!authorId || followBusy || followed || isSelf) return;

        if (!viewer) {
            try { authCtx?.open?.(); } catch { /* */ }
            return;
        }

        setFollowBusy(true);

        try {
            const body = {
                target_id: authorId,
                target_type: 'user',
                action: 'follow',
            };

            const hdrs = { 'Content-Type': 'application/json' };
            if (isBusinessAccount && activeBusinessId) {
                hdrs['x-account-type'] = 'business';
                hdrs['x-business-id'] = String(activeBusinessId);
            } else if (isArtistAccount && activeArtistId) {
                hdrs['x-account-type'] = 'artist';
                hdrs['x-artist-id'] = String(activeArtistId);
            }

            const res = await fetch(`${PRIVATE_API_BASE}/follows/toggle`, {
                method: 'POST',
                credentials: 'include',
                headers: hdrs,
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setFollowed(true);
            }
        } catch {
            // ignore
        } finally {
            setFollowBusy(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: { xs: 6, sm: 8 },
                px: 3,
                minHeight: 300,
            }}
        >
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: (t) => alphaColor(t.palette.text.primary, 0.06),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                }}
            >
                <LockRoundedIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>
                Private Post
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 380 }}>
                {message || 'This post is only visible to followers. Follow this user to see their posts.'}
            </Typography>

            {authorId ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: (t) => alphaColor(t.palette.text.primary, 0.03),
                        border: (t) => `1px solid ${alphaColor(t.palette.text.primary, 0.08)}`,
                        width: '100%',
                        maxWidth: 340,
                    }}
                >
                    <Avatar
                        src={avatarSrc}
                        sx={{
                            width: 56,
                            height: 56,
                            border: (t) => `2px solid ${alphaColor(t.palette.primary.main, 0.15)}`,
                        }}
                    >
                        <PersonRoundedIcon />
                    </Avatar>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.3 }}>
                            {authorName}
                        </Typography>
                        {authorHandle ? (
                            <Typography variant="body2" color="text.secondary">
                                {authorHandle}
                            </Typography>
                        ) : null}
                    </Box>

                    {!isSelf ? (
                        <Button
                            variant={followed ? 'outlined' : 'contained'}
                            size="small"
                            disabled={followBusy || followed}
                            onClick={handleFollow}
                            startIcon={
                                followBusy
                                    ? <CircularProgress size={14} color="inherit" />
                                    : followed
                                        ? <CheckCircleOutlineIcon sx={{ fontSize: '16px !important' }} />
                                        : <PersonAddAlt1RoundedIcon sx={{ fontSize: '16px !important' }} />
                            }
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                px: 3,
                                minWidth: 120,
                            }}
                        >
                            {followed ? 'Request Sent' : 'Follow'}
                        </Button>
                    ) : null}

                    {followed ? (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Refresh the page after they accept your follow request.
                        </Typography>
                    ) : null}
                </Box>
            ) : null}
        </Box>
    );
}

PrivatePostPrompt.propTypes = {
    author: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        handle: PropTypes.string,
        avatar_url: PropTypes.string,
        profile_picture: PropTypes.string,
    }),
    message: PropTypes.string,
};


/* --------------------------------------------------------------------------
 * Pagination + virtualized render
 * ------------------------------------------------------------------------ */
const PAGE_SIZE = 25;        // ← render 25 at a time (progressive)
const API_FETCH_SIZE = 100;  // ← fetch 100 at a time from the API
const PREFETCH_AT = 80;      // ← when scrolled past item #80, prefetch next batch
const LOCAL_CHUNK = 25;      // ← for the controlled (client-only) list window
const MIN_BOTTOM_LOADER_MS = 250;

export default function PostList({
                                     isRefreshing = false,
                                     user,
                                     posts,
                                     loading = false,
                                     hoveredId,
                                     setHoveredId,
                                     onLocationClick,
                                     locationClickable = true,
                                     onCardClick,
                                     query = '',
                                     view = '',
                                     selectedId = null,
                                     selectable = false,

                                     // NEW (optional): where this list is rendered (community vs group)
                                     context = 'community',

                                     // NEW (optional): lets parent provide true totals + paging
                                     totalCount = null,
                                     hasMoreExternal = null,
                                     onLoadMore = null,

                                     // NEW (optional): report display stats to parent for the fixed bar
                                     onDisplayStatsChange = null,

                                     onMutate = null,

                                     // Business account restriction - disable edit/delete on personal posts
                                     isBusinessAccount = false,

                                     // NEW (optional): opens create post flow from empty state
                                     onCreatePost = null,

                                     // Network/feed error — when set and is a network error, shows offline state
                                     error = null,
                                 }) {
    const auth = useAuth();
    const { activeBusinessId, activeArtistId } = useActiveAccount();
    const plTheme = useTheme();
    const isMobileScreen = useMediaQuery(plTheme.breakpoints.down('md'));
    const plAccountKey = activeBusinessId ? `biz:${activeBusinessId}` : activeArtistId ? `art:${activeArtistId}` : 'personal';
    const plAccountKeyRef = useRef(plAccountKey);
    plAccountKeyRef.current = plAccountKey;
    const [postOverrides, setPostOverrides] = useState({});
    const [deletedIds, setDeletedIds] = useState(() => new Set());
    const [overlaysMounted, setOverlaysMounted] = useState(() => Boolean(window.__llCommunityOverlaysMounted));
    const overlaysMountedRef = useRef(overlaysMounted);

    // Inject list stagger keyframes once
    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    useEffect(() => {
        overlaysMountedRef.current = overlaysMounted;
    }, [overlaysMounted]);

    useEffect(() => {
        const onMounted = () => setOverlaysMounted(true);
        const onUnmounted = () => setOverlaysMounted(false);

        window.addEventListener('ll:communityOverlays:mounted', onMounted);
        window.addEventListener('ll:communityOverlays:unmounted', onUnmounted);

        return () => {
            window.removeEventListener('ll:communityOverlays:mounted', onMounted);
            window.removeEventListener('ll:communityOverlays:unmounted', onUnmounted);
        };
    }, []);


    const [editOpen, setEditOpen] = useState(false);
    const [editLimitOpen, setEditLimitOpen] = useState(false);
    const [editLimitMessage, setEditLimitMessage] = useState('');
    const [editPostId, setEditPostId] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deletePostId, setDeletePostId] = useState(null);

    const [markFoundOpen, setMarkFoundOpen] = useState(false);
    const [markFoundPostId, setMarkFoundPostId] = useState(null);
    const [markFoundPost, setMarkFoundPost] = useState(null);
    const [markFoundMessage, setMarkFoundMessage] = useState('');
    const [markFoundSaving, setMarkFoundSaving] = useState(false);
    const [markFoundError, setMarkFoundError] = useState('');

    const [markResolvedOpen, setMarkResolvedOpen] = useState(false);
    const [markResolvedPostId, setMarkResolvedPostId] = useState(null);
    const [markResolvedPost, setMarkResolvedPost] = useState(null);
    const [markResolvedMessage, setMarkResolvedMessage] = useState('');
    const [markResolvedSaving, setMarkResolvedSaving] = useState(false);
    const [markResolvedError, setMarkResolvedError] = useState('');

    const MARK_FOUND_MAX = 1000;
    const MARK_RESOLVED_MAX = 1000;

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyPostId, setHistoryPostId] = useState(null);
    const [historyPost, setHistoryPost] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    useEffect(() => {
        if (!overlaysMounted) return;

        // When CommunityOverlays owns the dialogs, ensure PostList doesn't keep any local dialogs open.
        setEditOpen(false);
        setEditPostId(null);
        setEditLimitOpen(false);
        setDeleteConfirmOpen(false);
        setDeletePostId(null);
        setMarkFoundOpen(false);
        setMarkFoundPostId(null);
        setMarkFoundPost(null);
        setMarkResolvedOpen(false);
        setMarkResolvedPostId(null);
        setMarkResolvedPost(null);
        setHistoryOpen(false);
        setHistoryPostId(null);
        setHistoryPost(null);
        setHistoryRows([]);
    }, [overlaysMounted]);


    // Fetch the canonical latest post payload from the server (used after Edit dialog closes)
    // so the Community list + Post detail + Post page all update immediately.
    const fetchLatestPost = useCallback(async (pid) => {
        const idStr = pid != null ? String(pid) : '';
        if (!idStr) return null;

        const urls = [
            `/api/community/${encodeURIComponent(idStr)}`,
            `/api/community/posts/${encodeURIComponent(idStr)}`,
        ];

        for (const url of urls) {
            try {
                const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
                if (!res.ok) continue;

                const data = await res.json().catch(() => null);
                const normalized = Array.isArray(data) ? data[0] : data;

                if (normalized && typeof normalized === 'object') return normalized;
            } catch {
                // try next
            }
        }

        return null;
    }, []);

    const broadcastPostUpdated = useCallback((updated) => {
        if (!updated || updated.id == null) return;
        const pid = Number(updated.id);
        if (!Number.isFinite(pid) || pid <= 0) return;

        // Only persist the (Edited) badge if the server says the post is edited.
        const isEdited = Boolean(
            updated?.edited_at ||
            updated?.editedAt ||
            updated?.has_edits ||
            updated?.edits_count ||
            updated?.editsCount
        );

        if (isEdited) {
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
    }, []);

    const closeEditDialog = useCallback(async () => {
        const pid = Number(editPostId || 0);

        setEditOpen(false);
        setEditPostId(null);

        // Always re-hydrate after closing the edit dialog so every view updates immediately.
        // (If the user cancelled, this is a harmless no-op update.)
        if (pid) {
            const latest = await fetchLatestPost(pid);
            if (latest) broadcastPostUpdated(latest);
        }

        if (typeof onMutateRef.current === 'function') onMutateRef.current();
    }, [editPostId, fetchLatestPost, broadcastPostUpdated]);

    const closeMarkFoundDialog = () => {
        setMarkFoundOpen(false);
        setMarkFoundPostId(null);
        setMarkFoundPost(null);
        setMarkFoundMessage('');
        setMarkFoundError('');
        setMarkFoundSaving(false);
    };

    const closeMarkResolvedDialog = () => {
        setMarkResolvedOpen(false);
        setMarkResolvedPostId(null);
        setMarkResolvedPost(null);
        setMarkResolvedMessage('');
        setMarkResolvedError('');
        setMarkResolvedSaving(false);
    };

    const closeHistoryDialog = () => {
        setHistoryOpen(false);
        setHistoryPostId(null);
        setHistoryPost(null);
        setHistoryRows([]);
        setHistoryError('');
        setHistoryLoading(false);
    };

    const closeEditLimitDialog = () => {
        setEditLimitOpen(false);
        setEditLimitMessage('');
    };

    useEffect(() => {
        if (overlaysMounted) return undefined;

        const onReqEdit = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;

            setEditPostId(pid);
            setEditOpen(true);
        };

        const onReqDelete = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setDeletePostId(pid);
            setDeleteConfirmOpen(true);
        };

        const onReqHistory = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setHistoryError('');
            setHistoryRows([]);
            setHistoryPostId(pid);
            setHistoryPost(e?.detail?.post || null);
            setHistoryOpen(true);
        };

        window.addEventListener('ll:communityPost:requestEdit', onReqEdit);
        window.addEventListener('ll:communityPost:requestDelete', onReqDelete);
        window.addEventListener('ll:communityPost:requestHistory', onReqHistory);

        return () => {
            window.removeEventListener('ll:communityPost:requestEdit', onReqEdit);
            window.removeEventListener('ll:communityPost:requestDelete', onReqDelete);
            window.removeEventListener('ll:communityPost:requestHistory', onReqHistory);
        };
    }, [overlaysMounted]);

    // Mark Found and Mark Resolved handlers - always active since CommunityOverlays doesn't handle these
    useEffect(() => {
        const onReqMarkFound = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setMarkFoundError('');
            setMarkFoundMessage('');
            setMarkFoundPostId(pid);
            setMarkFoundPost(e?.detail?.post || null);
            setMarkFoundOpen(true);
        };

        const onReqMarkResolved = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.post?.id || 0);
            if (!pid) return;
            setMarkResolvedError('');
            setMarkResolvedMessage('');
            setMarkResolvedPostId(pid);
            setMarkResolvedPost(e?.detail?.post || null);
            setMarkResolvedOpen(true);
        };

        window.addEventListener('ll:communityPost:requestMarkFound', onReqMarkFound);
        window.addEventListener('ll:communityPost:requestMarkResolved', onReqMarkResolved);

        return () => {
            window.removeEventListener('ll:communityPost:requestMarkFound', onReqMarkFound);
            window.removeEventListener('ll:communityPost:requestMarkResolved', onReqMarkResolved);
        };
    }, []);

// When an edit succeeds, refresh the list (or patch rows in-place) so the UI shows the latest content immediately.
    // Keep the list visually in sync immediately after edits/deletes/mark-found without relying on a full refetch.
    useEffect(() => {
        const getPostFromEvent = (e) => {
            const direct = e?.detail?.post;
            if (direct && typeof direct === 'object') return direct;

            const raw = e?.detail?.raw || e?.detail?.data || null;
            if (raw && typeof raw === 'object') return raw;

            if (typeof e?.detail === 'string') {
                try {
                    return JSON.parse(e.detail);
                } catch {
                    return null;
                }
            }

            return null;
        };

        const onUpdated = (e) => {
            const updated = getPostFromEvent(e);
            const updatedId = Number(updated?.id || 0);
            if (!updatedId) return;

            // Persist "edited" badge even if list endpoint omits edited fields
            try {
                window.localStorage.setItem(`ll.communityPost.edited.${updatedId}`, '1');
            } catch {
                // ignore
            }

            // Merge as an override so controlled lists re-render immediately.
            setPostOverrides((prev) => ({
                ...prev,
                [updatedId]: { ...(prev?.[updatedId] || {}), ...updated },
            }));

            // Patch internal rows too (uncontrolled mode)
            try {
                setRows((prev) => (Array.isArray(prev) ? prev.map((p) => (Number(p?.id) === updatedId ? { ...p, ...updated } : p)) : prev));
            } catch {
                // ignore
            }

            // If the update event indicates we should refresh server truth (common after edits),
            // ask the parent to refetch so the left list stays consistent.
            if (typeof onMutateRef.current === 'function') {
                const shouldRefetch = Boolean(
                    e?.detail?.forceRefresh ||
                    e?.detail?.refresh ||
                    e?.detail?.refetch
                );
                if (shouldRefetch) {
                    try {
                        onMutateRef.current();
                    } catch {
                        // ignore
                    }
                }
            }
        };

        const onDeleted = (e) => {
            const pid = Number(e?.detail?.postId || e?.detail?.id || e?.detail?.post?.id || 0);
            if (!pid) return;

            setDeletedIds((prev) => {
                const next = new Set(prev);
                next.add(pid);
                return next;
            });

            setPostOverrides((prev) => {
                if (!prev || !prev[pid]) return prev;
                const next = { ...prev };
                delete next[pid];
                return next;
            });

            try {
                setRows((prev) => (Array.isArray(prev) ? prev.filter((p) => Number(p?.id) !== pid) : prev));
            } catch {
                // ignore
            }
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:markedFound', onUpdated);
        window.addEventListener('ll:communityPost:resolved', onUpdated);
        window.addEventListener('ll:communityPost:unresolved', onUpdated);
        window.addEventListener('ll:communityPost:deleted', onDeleted);

        // Sync likes/reposts from ActionBar in PostDetailModal back to cards.
        // Only apply viewer boolean (viewerLiked/viewerReposted) when the event
        // came from the same account; counts are universal and always apply.
        const onLikeChanged = (e) => {
            const d = e?.detail;
            if (!d?.postId) return;
            const pid = Number(d.postId);
            const sameAccount = !d._acct || d._acct === plAccountKeyRef.current;
            const patch = {};
            if (d.likes != null) {
                const n = Math.max(0, Number(d.likes) || 0);
                patch.likesCount = n;
                patch.likes_count = n;
                patch.like_count = n;
            }
            if (d.liked != null && sameAccount) {
                patch.viewerLiked = Boolean(d.liked);
                patch.viewer_liked = Boolean(d.liked);
            }
            if (Object.keys(patch).length) {
                setPostOverrides((prev) => ({
                    ...prev,
                    [pid]: { ...(prev?.[pid] || {}), id: pid, ...patch },
                }));
            }
        };

        const onRepostChanged = (e) => {
            const d = e?.detail;
            if (!d?.postId) return;
            const pid = Number(d.postId);
            const sameAccount = !d._acct || d._acct === plAccountKeyRef.current;
            const patch = {};
            if (d.reposts != null) {
                const n = Math.max(0, Number(d.reposts) || 0);
                patch.repostsCount = n;
                patch.reposts_count = n;
                patch.repost_count = n;
            }
            if (d.reposted != null && sameAccount) {
                patch.viewerReposted = Boolean(d.reposted);
                patch.viewer_reposted = Boolean(d.reposted);
            }
            if (Object.keys(patch).length) {
                setPostOverrides((prev) => ({
                    ...prev,
                    [pid]: { ...(prev?.[pid] || {}), id: pid, ...patch },
                }));
            }
        };

        window.addEventListener('ll:post:like-changed', onLikeChanged);
        window.addEventListener('ll:post:repost-changed', onRepostChanged);

        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:markedFound', onUpdated);
            window.removeEventListener('ll:communityPost:resolved', onUpdated);
            window.removeEventListener('ll:communityPost:unresolved', onUpdated);
            window.removeEventListener('ll:communityPost:deleted', onDeleted);
            window.removeEventListener('ll:post:like-changed', onLikeChanged);
            window.removeEventListener('ll:post:repost-changed', onRepostChanged);
        };
    }, []);

    const normalizeHistoryRows = (rows) => {
        const arr = Array.isArray(rows) ? rows : [];
        // Ensure each row has a diff object that includes photo additions/removals (fallback computed client-side)
        return arr.map((row, idx) => {
            const current = row && typeof row === 'object' ? row : {};
            const snapshot = current.snapshot && typeof current.snapshot === 'object' ? current.snapshot : {};
            const prev = idx + 1 < arr.length ? (arr[idx + 1] || {}) : null;

            const curPhotos = Array.isArray(snapshot.photos) ? snapshot.photos.filter(Boolean) : [];
            const prevSnap = prev && typeof prev === 'object' && prev.snapshot && typeof prev.snapshot === 'object' ? prev.snapshot : {};
            const prevPhotos = Array.isArray(prevSnap.photos) ? prevSnap.photos.filter(Boolean) : [];

            const existingDiff = current.diff && typeof current.diff === 'object' ? current.diff : null;
            if (existingDiff) {
                // Still ensure arrays are present for renderer convenience
                const added = Array.isArray(existingDiff.added) ? existingDiff.added.filter(Boolean) : [];
                const removed = Array.isArray(existingDiff.removed) ? existingDiff.removed.filter(Boolean) : [];
                const reordered = Boolean(existingDiff.reordered);
                return { ...current, snapshot, diff: { ...existingDiff, added, removed, reordered } };
            }

            // Fallback diff: compare current snapshot photos to previous version
            const curSet = new Set(curPhotos);
            const prevSet = new Set(prevPhotos);

            const added = curPhotos.filter((p) => !prevSet.has(p));
            const removed = prevPhotos.filter((p) => !curSet.has(p));
            const reordered = added.length === 0 && removed.length === 0 && curPhotos.length > 1 && prevPhotos.length > 1 && curPhotos.join('||') !== prevPhotos.join('||');

            return { ...current, snapshot, diff: { added, removed, reordered } };
        });
    };


    useEffect(() => {
        const run = async () => {
            if (!historyOpen || !historyPostId) return;
            setHistoryLoading(true);
            setHistoryError('');
            try {
                const cat = String(historyPost?.category || '').toLowerCase();
                let res;

                if (cat === 'business_post') {
                    // Business post edit history
                    res = await axios.get(`/api/business/posts/${historyPostId}/edits`);
                } else if (cat === 'artist_post') {
                    // Artist post edit history — needs artist ID
                    const artId = historyPost?.artistId || historyPost?.artist_id || historyPost?.music_artist_id || 0;
                    if (artId) {
                        res = await axios.get(`/api/music/artists/${artId}/posts/${historyPostId}/edits`);
                    } else {
                        // Fallback: try the community endpoint
                        res = await axios.get(`/api/community/${historyPostId}/edits`);
                    }
                } else {
                    // Community post (default)
                    res = await axios.get(`/api/community/${historyPostId}/edits`);
                }

                const data = res?.data;
                const rows = Array.isArray(data) ? data : Array.isArray(data?.edits) ? data.edits : [];
                setHistoryRows(normalizeHistoryRows(rows));
            } catch (err) {
                const msg = err?.response?.data?.message || err?.message || 'Failed to load edit history.';
                setHistoryError(String(msg));
            } finally {
                setHistoryLoading(false);
            }
        };
        run();
    }, [historyOpen, historyPostId, historyPost]);

    const submitMarkFound = async () => {
        if (!markFoundPostId) return;
        setMarkFoundSaving(true);
        setMarkFoundError('');
        try {
            const res = await axios.post(`/api/community/${markFoundPostId}/mark-found`, {
                message: markFoundMessage || '',
            });
            const updated = res?.data && typeof res.data === 'object' ? res.data : null;
            if (updated) {
                window.dispatchEvent(new CustomEvent('ll:communityPost:markedFound', { detail: { post: updated, forceRefresh: true } }));
            }

            // Make sure (Edited) can remain visible even if list refresh omits edited flags
            try {
                window.localStorage.setItem(`ll.communityPost.edited.${Number(markFoundPostId)}`, '1');
            } catch {
                // ignore
            }

            closeMarkFoundDialog();
            if (typeof onMutateRef.current === 'function') onMutateRef.current();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to mark as found.';
            setMarkFoundError(String(msg));
        } finally {
            setMarkFoundSaving(false);
        }
    };

    const submitMarkResolved = async () => {
        if (!markResolvedPostId) return;
        setMarkResolvedSaving(true);
        setMarkResolvedError('');

        try {
            const res = await axios.post(`/api/community/${markResolvedPostId}/mark-resolved`, {
                resolution_text: markResolvedMessage || '',
            });

            // Some APIs return only { ok: true }. We still want the UI to update immediately.
            const nowIso = new Date().toISOString();
            const optimistic = {
                ...(markResolvedPost && typeof markResolvedPost === 'object' ? markResolvedPost : {}),
                id: Number(markResolvedPostId),
                is_resolved: 1,
                resolved_at: nowIso,
                resolution_text: String(markResolvedMessage || '').trim(),
            };

            const apiUpdated = res?.data && typeof res.data === 'object' ? res.data : null;
            const updated = apiUpdated ? { ...optimistic, ...apiUpdated } : optimistic;

            // Broadcast + patch locally so the card flips to "Resolved" immediately.
            try {
                window.dispatchEvent(new CustomEvent('ll:communityPost:resolved', { detail: { post: updated } }));
            } catch {
                // ignore
            }
            try {
                window.dispatchEvent(new CustomEvent('ll:communityPost:updated', { detail: { post: updated, forceRefresh: true } }));
            } catch {
                // ignore
            }

            closeMarkResolvedDialog();
            if (typeof onMutateRef.current === 'function') onMutateRef.current();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Failed to mark as resolved.';
            setMarkResolvedError(String(msg));
        } finally {
            setMarkResolvedSaving(false);
        }
    };

    const controlled = typeof posts !== 'undefined';

    // Stabilize callback refs so useEffect deps never change on every render
    // (prevents infinite update loops when the parent doesn't memoize these)
    const onDisplayStatsChangeRef = useRef(onDisplayStatsChange);
    onDisplayStatsChangeRef.current = onDisplayStatsChange;

    const onLoadMoreRef = useRef(onLoadMore);
    onLoadMoreRef.current = onLoadMore;

    const onMutateRef = useRef(onMutate);
    onMutateRef.current = onMutate;

    const isTrendingView = String(view || '').trim().toLowerCase() === 'trending';

    const [rows, setRows] = useState([]);
    const [page, setPage] = useState(0);
    const [uLoading, setULoad] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const sentinelRef = useRef(null);
    const prefetchRef = useRef(null);
    const [deferEmpty, setDeferEmpty] = useState(true);

    // Local visibility filters (instant UI reaction to Hide / Block / Hide Post)
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [hiddenUserIds, setHiddenUserIds] = useState(() => new Set());
    const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());
    // Entity-specific sets — block/hide only a specific business or artist, not all accounts
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    const [hiddenBusinessIds, setHiddenBusinessIds] = useState(() => new Set());
    const [hiddenArtistIds, setHiddenArtistIds] = useState(() => new Set());

    // Seed from user object if available (non-breaking; depends on what the backend includes)
    useEffect(() => {
        const rawBlocked = user?.blocked_user_ids || user?.blockedUserIds || user?.blocked_users || user?.blockedUsers;
        const rawHiddenUsers = user?.hidden_user_ids || user?.hiddenUserIds || user?.hidden_users || user?.hiddenUsers;
        const rawHiddenPosts = user?.hidden_post_ids || user?.hiddenPostIds || user?.hidden_posts || user?.hiddenPosts;

        if (Array.isArray(rawBlocked)) {
            setBlockedUserIds(new Set(rawBlocked.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));
        }
        if (Array.isArray(rawHiddenUsers)) {
            setHiddenUserIds(new Set(rawHiddenUsers.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));
        }
        if (Array.isArray(rawHiddenPosts)) {
            setHiddenPostIds(new Set(rawHiddenPosts.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));
        }
        // We intentionally only re-seed when the viewer changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Hydrate moderation state (blocked/hidden) so it persists across navigation and reloads.
    useEffect(() => {
        const viewerId = Number(user?.id || 0);
        if (!viewerId) return;

        // Fast path: localStorage (so the UI remembers instantly)
        const fromStore = readModStateFromStorage(viewerId);
        if (fromStore) {
            const b = new Set((fromStore.blocked_user_ids || []).map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0));
            const hu = new Set((fromStore.hidden_user_ids || []).map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0));
            const hp = new Set((fromStore.hidden_post_ids || []).map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0));
            setBlockedUserIds(b);
            setHiddenUserIds(hu);
            setHiddenPostIds(hp);
            // Restore entity-specific sets from storage
            if (fromStore.blocked_business_ids) setBlockedBusinessIds(new Set(fromStore.blocked_business_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)));
            if (fromStore.blocked_artist_ids) setBlockedArtistIds(new Set(fromStore.blocked_artist_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)));
            if (fromStore.hidden_post_business_ids) setHiddenBusinessIds(new Set(fromStore.hidden_post_business_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)));
            if (fromStore.hidden_post_artist_ids) setHiddenArtistIds(new Set(fromStore.hidden_post_artist_ids.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)));
        }

        let cancelled = false;

        const load = async () => {
            try {
                const res = await axios.get('/api/users/moderation-state');
                const data = res?.data && typeof res.data === 'object' ? res.data : {};
                const blockedIds = Array.isArray(data.blocked_user_ids) ? data.blocked_user_ids : [];
                const hiddenUsers = Array.isArray(data.hidden_user_ids) ? data.hidden_user_ids : [];
                const hiddenPostUserIds = Array.isArray(data.hidden_post_user_ids) ? data.hidden_post_user_ids : [];
                const hiddenPostIds = Array.isArray(data.hidden_post_ids) ? data.hidden_post_ids : [];

                // Entity-specific IDs from moderation-state
                const blockedBizIds = Array.isArray(data.blocked_business_ids) ? data.blocked_business_ids : [];
                const blockedArtIds = Array.isArray(data.blocked_artist_ids) ? data.blocked_artist_ids : [];
                const hiddenBizIds = Array.isArray(data.hidden_post_business_ids) ? data.hidden_post_business_ids : [];
                const hiddenArtIds = Array.isArray(data.hidden_post_artist_ids) ? data.hidden_post_artist_ids : [];

                if (cancelled) return;

                // Personal hidden users only (NOT entity owner IDs)
                const mergedHiddenUsers = Array.from(
                    new Set([...hiddenUsers, ...hiddenPostUserIds].map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0))
                );

                // Personal blocked user IDs only (entity blocks are separate)
                const b = new Set(blockedIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0));
                const hu = new Set(mergedHiddenUsers);
                const hp = new Set(hiddenPostIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0));

                setBlockedUserIds(b);
                setHiddenUserIds(hu);
                setHiddenPostIds(hp);

                // Entity-specific sets
                setBlockedBusinessIds(new Set(blockedBizIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));
                setBlockedArtistIds(new Set(blockedArtIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));
                setHiddenBusinessIds(new Set(hiddenBizIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));
                setHiddenArtistIds(new Set(hiddenArtIds.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)));

                writeModStateToStorage(viewerId, {
                    blocked_user_ids: Array.from(b),
                    hidden_user_ids: Array.from(hu),
                    hidden_post_user_ids: hiddenPostUserIds,
                    hidden_post_ids: Array.from(hp),
                    blocked_business_ids: blockedBizIds,
                    blocked_artist_ids: blockedArtIds,
                    hidden_post_business_ids: hiddenBizIds,
                    hidden_post_artist_ids: hiddenArtIds,
                });
            } catch {
                // ignore; localStorage seed (if any) still works
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    // Listen for popover actions so the list updates immediately without a full refresh.
    useEffect(() => {
        const onHiddenUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const hidden = Boolean(e?.detail?.hidden);
            const targetType = String(e?.detail?.targetType || 'personal').toLowerCase();

            if (targetType === 'business') {
                // Entity-specific: update business hidden set, not user set
                setHiddenBusinessIds((prev) => {
                    const next = new Set(prev);
                    if (hidden) next.add(uid);
                    else next.delete(uid);
                    return next;
                });
            } else if (targetType === 'artist') {
                setHiddenArtistIds((prev) => {
                    const next = new Set(prev);
                    if (hidden) next.add(uid);
                    else next.delete(uid);
                    return next;
                });
            } else {
                // Personal hide
                setHiddenUserIds((prev) => {
                    const next = new Set(prev);
                    if (hidden) next.add(uid);
                    else next.delete(uid);
                    return next;
                });
            }
        };

        const onBlockedUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const blocked = Boolean(e?.detail?.blocked);
            const targetType = String(e?.detail?.targetType || 'personal').toLowerCase();

            if (targetType === 'business') {
                setBlockedBusinessIds((prev) => {
                    const next = new Set(prev);
                    if (blocked) next.add(uid);
                    else next.delete(uid);
                    return next;
                });
            } else if (targetType === 'artist') {
                setBlockedArtistIds((prev) => {
                    const next = new Set(prev);
                    if (blocked) next.add(uid);
                    else next.delete(uid);
                    return next;
                });
            } else {
                // Personal block
                setBlockedUserIds((prev) => {
                    const next = new Set(prev);
                    if (blocked) next.add(uid);
                    else next.delete(uid);
                    return next;
                });
            }
        };

        const onHiddenPost = (e) => {
            const pid = Number(e?.detail?.postId || 0);
            if (!pid) return;
            const hidden = Boolean(e?.detail?.hidden);
            setHiddenPostIds((prev) => {
                const next = new Set(prev);
                if (hidden) next.add(pid);
                else next.delete(pid);
                return next;
            });
        };

        window.addEventListener('ll:user:hidden-changed', onHiddenUser);
        window.addEventListener('ll:user:blocked-changed', onBlockedUser);
        window.addEventListener('ll:post:hidden-changed', onHiddenPost);

        return () => {
            window.removeEventListener('ll:user:hidden-changed', onHiddenUser);
            window.removeEventListener('ll:user:blocked-changed', onBlockedUser);
            window.removeEventListener('ll:post:hidden-changed', onHiddenPost);
        };
    }, []);

    // Persist moderation state locally so it "remembers" immediately on navigation/reload.
    useEffect(() => {
        const viewerId = Number(user?.id || 0);
        if (!viewerId) return;
        writeModStateToStorage(viewerId, {
            blocked_user_ids: Array.from(blockedUserIds || []),
            hidden_user_ids: Array.from(hiddenUserIds || []),
            hidden_post_user_ids: [],
            hidden_post_ids: Array.from(hiddenPostIds || []),
            blocked_business_ids: Array.from(blockedBusinessIds || []),
            blocked_artist_ids: Array.from(blockedArtistIds || []),
            hidden_post_business_ids: Array.from(hiddenBusinessIds || []),
            hidden_post_artist_ids: Array.from(hiddenArtistIds || []),
        });
    }, [user?.id, blockedUserIds, hiddenUserIds, hiddenPostIds, blockedBusinessIds, blockedArtistIds, hiddenBusinessIds, hiddenArtistIds]);

    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    // Virtualized rendering for the controlled case
    const [renderCount, setRenderCount] = useState(LOCAL_CHUNK);

    // NEW: controlled mode chunk loading UI
    const [controlledChunkLoading, setControlledChunkLoading] = useState(false);
    const controlledSentinelRef = useRef(null);
    const awaitingServerAppendRef = useRef(false);
    const requestedMoreRef = useRef(false);

    // Bottom loader timing (≥ 250ms)
    const [showBottomLoader, setShowBottomLoader] = useState(false);
    const bottomStartRef = useRef(0);
    const bottomTimerRef = useRef(null);
    const prevULoadingRef = useRef(uLoading);

    // Server-verified following set keyed by user id (author id)
    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
    // Local optimistic follow flips (within this component lifetime)
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    const showBottomLoaderRef = useRef(showBottomLoader);
    showBottomLoaderRef.current = showBottomLoader;

    useEffect(() => {
        const wasLoading = prevULoadingRef.current;
        const pagingContext = !controlled && rows.length > 0 && hasMore;

        if (!wasLoading && uLoading && pagingContext) {
            bottomStartRef.current = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            setShowBottomLoader(true);
        }

        if (wasLoading && !uLoading && showBottomLoaderRef.current) {
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const elapsed = now - bottomStartRef.current;
            const remaining = Math.max(0, MIN_BOTTOM_LOADER_MS - elapsed);

            if (bottomTimerRef.current) clearTimeout(bottomTimerRef.current);
            bottomTimerRef.current = setTimeout(() => {
                setShowBottomLoader(false);
                bottomTimerRef.current = null;
            }, remaining || 0);
        }

        prevULoadingRef.current = uLoading;
    }, [uLoading, rows.length, hasMore, controlled]);

    useEffect(() => () => { if (bottomTimerRef.current) clearTimeout(bottomTimerRef.current); }, []);

    const hydrateTargetFromPublic = useCallback(async (target) => {
        // Fetch public profile to get the canonical numeric id and followers list,
        // mirroring the logic used on the Profile page.
        if (!target) return null;
        const handleOrId = target.handle || target.id;
        if (!handleOrId) return null;

        const urls = [
            `${api}/users/public/${encodeURIComponent(handleOrId)}`,
            `/users/public/${encodeURIComponent(handleOrId)}`,
            `/api/users/public/${encodeURIComponent(handleOrId)}`
        ].filter(Boolean);

        for (const u of urls) {
            try {
                const res = await axios.get(u, { withCredentials: true });
                const profile = res?.data?.profile;
                if (!profile) continue;

                // Update the card's user object with the numeric id if it was missing
                setUserForCard((prev) => {
                    if (!prev) return prev;
                    if (!prev.id && profile.id) return { ...prev, id: profile.id };
                    return prev;
                });

                // Derive following the SAME WAY the profile page does:
                // am *I* in the target's followers?
                const sj = typeof profile.social_json === 'string'
                    ? JSON.parse(profile.social_json || '{}')
                    : (profile.social_json || {});
                const followers = Array.isArray(sj?.followers) ? sj.followers : [];
                const isF = !!user?.id && followers.includes(Number(user.id));
                if (profile.id && isF) {
                    setServerFollowingSet((old) => {
                        const next = new Set(old);
                        next.add(Number(profile.id));
                        return next;
                    });
                }
                return profile;
            } catch (_e) {
                // try next URL
            }
        }
        return null;
    }, [user?.id]);

    const handleOpenUserCard = (el, author) => {
        setUserAnchor(el);
        setUserForCard({
            id: author?.id, // may be undefined; we'll hydrate from /users/public
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle,
            avatar_url: author?.avatar_url,
        });
        // Fire-and-forget hydration to resolve id + following
        hydrateTargetFromPublic(author);
    };

    const openAuthUI = useCallback(() => {
        if (auth && typeof auth.open === 'function') {
            auth.open(); // same approach as ActionBar
            return;
        }
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
        } catch {
            /* no-op */
        }
    }, [auth]);

    const requireAuth = useCallback(
        (cb) => {
            if (user) return cb?.();
            openAuthUI();
            return undefined;
        },
        [user, openAuthUI]
    );

    const handleViewProfile = (u) =>
        window.location.assign(`/${u.handle || u.id}`);
    const isSelf = useMemo(() => {
        if (!user || !userForCard) return false;
        const idMatch = Number(user.id) === Number(userForCard.id);
        const handleMatch =
            (user.handle && userForCard.handle) &&
            String(user.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || !!handleMatch;
    }, [user, userForCard]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    // Follow → same URL strategy as the Profile page
    const postFollow = async (targetId) => {
        const payload = { target_id: targetId, action: 'follow' };
        const urls = [`${api}/users/follow`, '/api/users/follow', '/users/follow'].filter(Boolean);
        for (const url of urls) {
            try {
                await axios.post(url, payload, { withCredentials: true });
                return true;
            } catch {
                /* try next */
            }
        }
        return false;
    };

    // Follow click: auth-gated; on success, mark as locally/serverside followed
    const handleFollow = async (targetUser) => {
        const tid0 = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid0 && !handle0) return; // cannot resolve
        if (isSelf) return;

        requireAuth(async () => {
            // Ensure we have the numeric id from /users/public before posting follow
            let tid = tid0;
            if (!tid && handle0) {
                const p = await hydrateTargetFromPublic({ handle: handle0 });
                if (p?.id) tid = Number(p.id);
            }
            if (!tid) return;

            // Optimistic: flip immediately
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
                // Rollback optimistic state if the API failed
                setLocallyFollowed((prev) => {
                    const next = new Set(prev);
                    next.delete(tid);
                    return next;
                });
            }
        });
    };

    // Track whether we've received at least one completed fetch cycle.
    // This prevents the empty state from showing before the very first fetch finishes.
    const hasCompletedFetchRef = useRef(false);

    useEffect(() => {
        // In controlled mode, wait until loading transitions from true→false (first fetch done)
        // In uncontrolled mode, wait until uLoading transitions from true→false
        const isStillLoading = controlled ? loading : uLoading;
        if (!isStillLoading && !isRefreshing) {
            hasCompletedFetchRef.current = true;
            // Data has arrived (or fetch completed with no results) — allow empty state to show.
            // Use 220ms to ensure stagger animations and any parent state propagation complete.
            const t = setTimeout(() => setDeferEmpty(false), 220);
            return () => clearTimeout(t);
        }
    }, [controlled, loading, uLoading, isRefreshing]);

    // Re-defer empty state whenever a new load cycle begins (filter change, search, etc.)
    // This prevents the "No Posts Found" message from flashing between refreshes.
    useEffect(() => {
        if (isRefreshing || (controlled && loading)) {
            setDeferEmpty(true);
        }
    }, [isRefreshing, controlled, loading]);

    const fetchPage = useCallback(async (p) => {
        setULoad(true);
        try {
            const res = await fetch(
                `/api/community?limit=${API_FETCH_SIZE}&offset=${p * API_FETCH_SIZE}${query ? `&${query}` : ''}`
            );
            const j = await res.json();
            setRows((old) => [...old, ...(Array.isArray(j) ? j : [])]);
            setHasMore(Array.isArray(j) && j.length === API_FETCH_SIZE);
            setPage(p);
        } catch (e) {        } finally {
            setULoad(false);
        }
    }, [query]);

    useEffect(() => {
        if (controlled) return undefined;
        setRows([]);
        setPage(0);
        setHasMore(true);
        (async () => {
            await fetchPage(0);
        })();
    }, [query, controlled, fetchPage]);

    // Controlled: don’t reset renderCount when posts append; only reset when list shrinks (new search)
    const prevControlledLenRef = useRef(0);
    useEffect(() => {
        if (!controlled) return;

        const nextLen = Array.isArray(posts) ? posts.length : 0;
        const prevLen = prevControlledLenRef.current;

        if (nextLen < prevLen) {
            // new search / filters replaced the list
            setRenderCount(LOCAL_CHUNK);
            setControlledChunkLoading(false);
            awaitingServerAppendRef.current = false;
            requestedMoreRef.current = false;
        } else if (nextLen > prevLen) {
            // append from parent (server load more)
            if (awaitingServerAppendRef.current) {
                awaitingServerAppendRef.current = false;
                requestedMoreRef.current = false;

                // reveal next chunk after a short shimmer beat
                setTimeout(() => {
                    setRenderCount((c) => Math.min(c + PAGE_SIZE, nextLen));
                    setControlledChunkLoading(false);
                }, 150);
            }
        } else if (nextLen === prevLen && awaitingServerAppendRef.current) {
            // Server returned no new items — we've reached the end.
            // Clear loading state so the dots don't show forever.
            awaitingServerAppendRef.current = false;
            requestedMoreRef.current = false;
            setControlledChunkLoading(false);
        }

        prevControlledLenRef.current = nextLen;
    }, [controlled, posts]);

    // ---- Intersection observer: bottom sentinel (safety net) ----
    useEffect(() => {
        if (controlled) return undefined;
        const el = sentinelRef.current;
        if (!el) return undefined;

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                if (hasMore && !uLoading) fetchPage(page + 1);
            },
            { rootMargin: '1200px' } // large margin to start early
        );

        io.observe(el);
        return () => io.disconnect();
    }, [controlled, hasMore, uLoading, page, fetchPage]);

    // ---- Intersection observer: prefetch sentinel (after item #90) ----
    useEffect(() => {
        if (controlled) return undefined;
        const el = prefetchRef.current;
        if (!el) return undefined;

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) return;
                if (hasMore && !uLoading) fetchPage(page + 1);
            },
            { rootMargin: '800px' }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [controlled, hasMore, uLoading, page, rows.length, fetchPage]);

    const baseList = controlled ? (Array.isArray(posts) ? posts : []) : rows;

    const list = useMemo(() => {
        const arr = Array.isArray(baseList) ? baseList : [];

        const hasOverrides = postOverrides && Object.keys(postOverrides).length > 0;
        const hasDeleted = deletedIds && deletedIds.size > 0;

        const hasHiddenPosts = hiddenPostIds && hiddenPostIds.size > 0;
        const hasHiddenUsers = hiddenUserIds && hiddenUserIds.size > 0;
        const hasBlockedUsers = blockedUserIds && blockedUserIds.size > 0;
        const hasBlockedBiz = blockedBusinessIds && blockedBusinessIds.size > 0;
        const hasBlockedArt = blockedArtistIds && blockedArtistIds.size > 0;
        const hasHiddenBiz = hiddenBusinessIds && hiddenBusinessIds.size > 0;
        const hasHiddenArt = hiddenArtistIds && hiddenArtistIds.size > 0;

        const getAuthorIdForFilter = (p) =>
            Number(p?.user_id || p?.userId || p?.author_id || p?.owner_id || 0);

        const passesVisibility = (p) => {
            const pid = Number(p?.id || 0);
            if (pid && hasHiddenPosts && hiddenPostIds.has(pid)) return false;
            if (pid && hasDeleted && deletedIds.has(pid)) return false;

            // Check entity-specific blocks/hides first
            const postBizId = Number(p?.featured_business_id || p?.business_id || 0);
            const postArtId = Number(p?.artist_id || p?.music_artist_id || 0);

            // If the post is from a business, check business block/hide sets
            if (postBizId > 0) {
                if (hasBlockedBiz && blockedBusinessIds.has(postBizId)) return false;
                if (hasHiddenBiz && hiddenBusinessIds.has(postBizId)) return false;
            }

            // If the post is from an artist, check artist block/hide sets
            if (postArtId > 0) {
                if (hasBlockedArt && blockedArtistIds.has(postArtId)) return false;
                if (hasHiddenArt && hiddenArtistIds.has(postArtId)) return false;
            }

            // Personal user block/hide — only apply if the post is NOT from
            // a business or artist account (so blocking a personal account
            // doesn't also hide their business/artist posts)
            const aid = getAuthorIdForFilter(p);
            if (aid && postBizId <= 0 && postArtId <= 0) {
                if (hasBlockedUsers && blockedUserIds.has(aid)) return false;
                if (hasHiddenUsers && hiddenUserIds.has(aid)) return false;
            }

            return true;
        };

        // Fast path: nothing to change
        if (!hasOverrides && !hasDeleted && !hasHiddenPosts && !hasHiddenUsers && !hasBlockedUsers
            && !hasBlockedBiz && !hasBlockedArt && !hasHiddenBiz && !hasHiddenArt) return arr;

        return arr
            .filter(passesVisibility)
            .map((p) => {
                const pid = Number(p?.id || 0);
                if (!pid || !hasOverrides) return p;
                const ov = postOverrides[pid];
                return ov ? { ...p, ...ov } : p;
            });
    }, [baseList, postOverrides, deletedIds, hiddenPostIds, hiddenUserIds, blockedUserIds, blockedBusinessIds, blockedArtistIds, hiddenBusinessIds, hiddenArtistIds]);

    const visible = useMemo(
        () => (controlled ? list.slice(0, renderCount) : list),
        [controlled, list, renderCount]
    );

    // ✅ Report stats upward (for the fixed bar in CommunityPanel)
    const effectiveTotal =
        Number.isFinite(Number(totalCount)) ? Number(totalCount)
            : (controlled ? list.length : list.length);

    // Track previous stats to avoid calling the parent callback when nothing changed
    const prevDisplayStatsRef = useRef({ displayed: -1, total: -1, loadingMore: false });

    useEffect(() => {
        if (typeof onDisplayStatsChangeRef.current !== 'function') return;
        // Don't report "0 of N" while data is still loading — wait until content is settled
        const isStillLoading = controlled ? loading : uLoading;
        if (isStillLoading || isRefreshing) return;

        const displayed = controlled ? Math.min(renderCount, list.length) : list.length;
        const loadingMore = Boolean(controlled ? controlledChunkLoading : (showBottomLoader || uLoading));

        // Skip if nothing actually changed (prevents infinite parent re-render loops)
        const prev = prevDisplayStatsRef.current;
        if (
            prev.displayed === displayed &&
            prev.total === effectiveTotal &&
            prev.loadingMore === loadingMore
        ) {
            return;
        }
        prevDisplayStatsRef.current = { displayed, total: effectiveTotal, loadingMore };

        onDisplayStatsChangeRef.current({
            displayed,
            displaying: displayed,
            total: effectiveTotal,
            loadingMore,
        });
    }, [controlled, renderCount, list.length, effectiveTotal, loading, uLoading, isRefreshing, controlledChunkLoading, showBottomLoader]);

    // Controlled: scroll-based loader (robust inside nested scroll containers)
    useEffect(() => {
        if (!controlled) return undefined;

        const rootEl = document.querySelector('[data-community-scroll]') || null;
        if (!rootEl) return undefined;

        let ticking = false;

        const maybeLoad = () => {
            // Only trigger when the user is at (or extremely near) the bottom
            const nearBottom = (rootEl.scrollTop + rootEl.clientHeight) >= (rootEl.scrollHeight - 8);
            if (!nearBottom) return;

            const loadedLen = list.length;
            const canRevealMore = renderCount < loadedLen;

            // If we have more already loaded, reveal next PAGE_SIZE with a short shimmer beat
            if (canRevealMore && !controlledChunkLoading) {
                setControlledChunkLoading(true);
                setTimeout(() => {
                    setRenderCount((c) => Math.min(c + PAGE_SIZE, loadedLen));
                    setControlledChunkLoading(false);
                }, 250);
                return;
            }

            // If we've revealed everything we currently have but the parent says there are more, request more
            const externalHasMore = (hasMoreExternal == null) ? false : Boolean(hasMoreExternal);
            if (!canRevealMore && externalHasMore && typeof onLoadMoreRef.current === 'function') {
                if (requestedMoreRef.current) return;
                requestedMoreRef.current = true;
                awaitingServerAppendRef.current = true;

                setControlledChunkLoading(true);
                onLoadMoreRef.current();
            }
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                maybeLoad();
            });
        };

        rootEl.addEventListener('scroll', onScroll, { passive: true });

        // Run once (next tick) in case the list is already at the bottom after a render
        const t = setTimeout(() => {
            try { maybeLoad(); } catch { /* ignore */ }
        }, 0);

        return () => {
            clearTimeout(t);
            rootEl.removeEventListener('scroll', onScroll);
        };
    }, [controlled, list.length, renderCount, controlledChunkLoading, hasMoreExternal]);

    // Extra safety: if parent passes a selectedId that isn’t in the current list, don’t highlight anything.
    let effectiveSelectedId = null;
    if (selectable && selectedId !== null && typeof selectedId !== 'undefined') {
        const sid = String(selectedId);
        if (list.some((p) => String(p?.id ?? '') === sid)) {
            effectiveSelectedId = selectedId;
        }
    }

    // Initial page overlay spinner only if nothing has loaded yet
    const initialLoading = controlled
        ? (loading && visible.length === 0)
        : (uLoading && rows.length === 0);

    // Where to place the prefetch sentinel inside the current page:
    // page starts at 0; after fetching page N, we watch index (N*API_FETCH_SIZE + (PREFETCH_AT-1))
    const prefetchIndex = !controlled
        ? Math.max(0, (page * API_FETCH_SIZE) + (PREFETCH_AT - 1))
        : -1;

    const renderedGrid = useMemo(
        () =>
            visible.flatMap((p, idx) => {
                const key = p.key || `${normalizeCategory(p.category) || 'post'}-${p.id}`;
                const nodes = (
                    <Box
                        key={`card-${key}`}
                        sx={(t) => ({
                            flex: {
                                xs: '0 0 100%',
                                sm: '0 0 100%',
                                md: '0 0 calc(50% - 16px)',
                                lg: '0 0 calc(50% - 16px)',
                                xl: '0 0 calc(50% - 16px)',
                            },
                            // Mobile: no margin, edge-to-edge with bottom divider
                            mx: { xs: 0, md: 1 },
                            my: { xs: 0, md: 1 },
                            minWidth: 0,
                            maxWidth: '100%',
                            borderBottom: { xs: `1px solid ${alphaColor(t.palette.divider, 0.1)}`, md: 'none' },
                            '&:last-child': { borderBottom: { xs: 'none', md: 'none' } },
                            ...getListStaggerSx(idx),
                        })}
                    >
                        <PostCard
                            post={p}
                            user={user}
                            hoveredId={hoveredId}
                            setHoveredId={setHoveredId}
                            onLocationClick={onLocationClick}
                            locationClickable={locationClickable}
                            onCardClick={onCardClick}
                            onOpenUserCard={handleOpenUserCard}
                            selectedId={effectiveSelectedId}
                            selectable={selectable}
                            currentView={view}
                            isBusinessAccount={isBusinessAccount}
                            flat={isMobileScreen}
                        />
                    </Box>
                );

                // Insert the prefetch sentinel after item #90 of the current page
                const needPrefetchMarker =
                    !controlled &&
                    hasMore &&
                    idx === Math.min(prefetchIndex, visible.length - 1);

                return needPrefetchMarker
                    ? [
                        nodes,
                        <Box key={`prefetch-${key}`} ref={prefetchRef} sx={{ height: 1, width: '100%' }} />,
                    ]
                    : [nodes];
            }),
        [
            visible,
            user,
            hoveredId,
            setHoveredId,
            onLocationClick,
            onCardClick,
            selectable,
            hasMore,
            controlled,
            prefetchIndex,
            effectiveSelectedId,
            isBusinessAccount,
            isMobileScreen,
        ]
    );
    // When filters/view change, show the pulsing dots loader.
    if (isRefreshing) {
        return (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                <PulsingDots />
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', minHeight: visible.length === 0 ? '100%' : 240, width: '100%', overflow: 'hidden' }}>
            {visible.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', overflowX: 'hidden' }}>
                    {renderedGrid}

                    {/* ✅ Controlled-mode loader while revealing or waiting on server */}
                    {controlled && controlledChunkLoading && (
                        <Box sx={{ flex: '0 0 100%', display: 'flex', justifyContent: 'center', py: 2 }}>
                            <PulsingDots />
                        </Box>
                    )}

                    {/* Bottom-of-list inline loader under the last row while fetching (≥ 250ms) */}
                    {showBottomLoader && (
                        <Box sx={{ flex: '0 0 100%', display: 'flex', justifyContent: 'center', py: 2 }}>
                            <PulsingDots sx={{ py: 2 }} />
                        </Box>
                    )}

                    {/* End-of-feed indicator — shown when there are items, nothing more to load,
                        and we're not currently loading. Fills the blank space that appears when
                        the list has fewer items than the viewport height (common on mobile).
                        Mobile-only: desktop shows nothing at end of feed. */}
                    {isMobileScreen &&
                        !showBottomLoader &&
                        !controlledChunkLoading &&
                        !(hasMoreExternal == null ? false : Boolean(hasMoreExternal)) &&
                        renderCount >= list.length && (
                            <Box
                                sx={{
                                    flex: '0 0 100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 1.5,
                                    py: { xs: 3, md: 4 },
                                    // Expand to fill remaining vertical space when the list is short
                                    minHeight: { xs: 120, md: 80 },
                                    color: (t) => alphaColor(t.palette.text.primary, 0.35),
                                    '&::before, &::after': {
                                        content: '""',
                                        flex: '0 0 40px',
                                        height: '1px',
                                        bgcolor: (t) => alphaColor(t.palette.text.primary, 0.12),
                                    },
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    You're all caught up
                                </Typography>
                            </Box>
                        )}
                </Box>
            )}

            {/* Invisible sentinel to trigger next fetch (bottom) */}
            {!controlled && <Box ref={sentinelRef} sx={{ height: 1 }} />}

            {/* Controlled sentinel (trigger reveal / server page) */}
            {controlled && <Box ref={controlledSentinelRef} sx={{ height: 1 }} />}

            {/* Initial full-screen overlay only for the very first load */}
            {initialLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'background.paper',
                    }}
                >
                    <PulsingDots />
                </Box>
            )}

            {/* Network offline — friendly centered state */}
            {!initialLoading && !isRefreshing && !loading && visible.length === 0 && !deferEmpty && isNetworkError(error) && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        px: 2,
                    }}
                >
                    <NetworkErrorState />
                </Box>
            )}

            {!initialLoading && !isRefreshing && !loading && visible.length === 0 && !deferEmpty && !isNetworkError(error) && (
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        px: 2,
                    }}
                >
                    <Stack spacing={1.5} alignItems="center">
                        <Box sx={(t) => ({
                            width: 64, height: 64, borderRadius: '50%',
                            bgcolor: alphaColor(t.palette.primary.main, 0.08),
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                        })}>
                            <ForumRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 950, fontSize: 17 }}>
                            {context === 'group'
                                ? 'No Posts Yet'
                                : (isTrendingView ? 'No Trending Posts Yet' : 'No Posts Found')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>
                            {context === 'group'
                                ? 'Be the first to share something with this group!'
                                : (isTrendingView
                                    ? 'No trending posts yet for these filters. Try adjusting your filters.'
                                    : 'Be the first to create a post and let your community know what\u2019s happening!')}
                        </Typography>
                        {typeof onCreatePost === 'function' && !isTrendingView ? (
                            <Button
                                variant="contained"
                                startIcon={<AddRoundedIcon />}
                                onClick={onCreatePost}
                                sx={(t) => ({
                                    mt: 1.5,
                                    borderRadius: 999,
                                    textTransform: 'none',
                                    fontWeight: 950,
                                    fontSize: 15,
                                    px: 3,
                                    py: 1,
                                    color: t.palette.common.white,
                                    boxShadow: 'none',
                                    '&:hover': { boxShadow: 'none' },
                                })}
                            >
                                Create a Post
                            </Button>
                        ) : null}
                    </Stack>
                </Box>
            )}

            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
                isSelf={isSelf}
                following={isFollowingForCard}
                onFollow={handleFollow}
                onViewProfile={(u) => window.location.assign(`/${u.handle || u.id}`)}
            />

            {!overlaysMounted && editOpen && !editLimitOpen && editPostId ? (
                <EditCommunityPostDialog
                    open
                    postId={editPostId}
                    onClose={closeEditDialog}
                />
            ) : null}

            {!overlaysMounted && (
                <Dialog
                    disableScrollLock
                    open={editLimitOpen}
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick') return;
                        closeEditLimitDialog();
                    }}
                    fullWidth
                    maxWidth="xs"
                    sx={{ zIndex: 100001 }}
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        Edit limit reached
                        <IconButton onClick={closeEditLimitDialog} size="small" aria-label="Close">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Alert severity="warning">
                            {editLimitMessage || 'You can edit a post up to 5 times within a 24-hour window.'}
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained" onClick={closeEditLimitDialog}>
                            OK
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {!overlaysMounted && (
                <DeletePostConfirmDialog
                    open={deleteConfirmOpen}
                    postId={deletePostId}
                    onClose={() => {
                        setDeleteConfirmOpen(false);
                        setDeletePostId(null);
                    }}
                    onDeleted={() => {
                        const pid = Number(deletePostId || 0);
                        // Notify any listeners (CommunityPage/PostDetail/PostPage) to refetch or clear selection.
                        if (pid) {
                            try {
                                window.dispatchEvent(new CustomEvent('ll:communityPost:deleted', { detail: { postId: pid } }));
                            } catch {
                                // ignore
                            }
                        }

                        setDeleteConfirmOpen(false);
                        setDeletePostId(null);
                        if (typeof onMutateRef.current === 'function') onMutateRef.current();
                    }}
                />
            )}

            <Dialog
                disableScrollLock
                open={markFoundOpen}
                fullWidth
                maxWidth="sm"
                sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closeMarkFoundDialog();
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Mark as Found
                    <IconButton onClick={closeMarkFoundDialog} size="small" aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {markFoundError ? (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {markFoundError}
                        </Alert>
                    ) : null}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {markFoundPost?.title
                            ? `You're marking “${markFoundPost.title}” as found.`
                            : 'You are marking this item as found.'}
                        {' '}You can optionally add an update message.
                    </Typography>

                    <TextField
                        label="Update message (optional)"
                        value={markFoundMessage}
                        onChange={(e) => setMarkFoundMessage(e.target.value.slice(0, MARK_FOUND_MAX))}
                        fullWidth
                        multiline
                        minRows={3}
                        inputProps={{ maxLength: MARK_FOUND_MAX }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeMarkFoundDialog} disabled={markFoundSaving}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={submitMarkFound} disabled={markFoundSaving}>
                        {markFoundSaving ? 'Saving…' : 'Mark as Found'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                disableScrollLock
                open={markResolvedOpen}
                fullWidth
                maxWidth="sm"
                onClose={(_, reason) => {
                    if (reason === 'backdropClick') return;
                    closeMarkResolvedDialog();
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    Mark as Resolved
                    <IconButton onClick={closeMarkResolvedDialog} size="small" aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {markResolvedError ? (
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {markResolvedError}
                        </Alert>
                    ) : null}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {markResolvedPost?.title
                            ? `You're marking “${markResolvedPost.title}” as resolved.`
                            : 'You are marking this request as resolved.'}
                        {' '}You can optionally add a resolution update.
                    </Typography>

                    <TextField
                        label="Resolution update (optional)"
                        value={markResolvedMessage}
                        onChange={(e) => setMarkResolvedMessage(e.target.value.slice(0, MARK_RESOLVED_MAX))}
                        fullWidth
                        multiline
                        minRows={3}
                        inputProps={{ maxLength: MARK_RESOLVED_MAX }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeMarkResolvedDialog} disabled={markResolvedSaving}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={submitMarkResolved} disabled={markResolvedSaving}>
                        {markResolvedSaving ? 'Saving…' : 'Mark as Resolved'}
                    </Button>
                </DialogActions>
            </Dialog>

            {!overlaysMounted && (
                <Dialog
                    disableScrollLock
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
                        {historyLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={28} />
                            </Box>
                        )}
                        {!historyLoading && historyError && (
                            <Alert severity="error" sx={{ mb: 1 }}>{historyError}</Alert>
                        )}
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
                                    const snap = row?.snapshot || {};
                                    const prevSnap = historyRows[idx + 1]?.snapshot || {};
                                    const diff = row?.diff || {};
                                    const isOriginal = idx === historyRows.length - 1;
                                    const isLatest = idx === 0;

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
                                        <Box key={row.id || row.version || idx} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                            {/* Timeline dot */}
                                            <Box sx={{
                                                position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%',
                                                bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main',
                                                border: '2px solid', borderColor: 'background.paper',
                                                boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`,
                                                zIndex: 1,
                                            }} />
                                            {/* Version label + date */}
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                                <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                    {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${row.version || historyRows.length - idx}`}
                                                </Typography>
                                                <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>
                                                    {row.edited_at ? dateTimeLabel(row.edited_at) : ''}
                                                </Typography>
                                                {row.editor_handle ? (
                                                    <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>@{row.editor_handle}</Typography>
                                                ) : null}
                                            </Stack>
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
            )}
        </Box>
    );
}

PostList.propTypes = {
    user: PropTypes.object,
    posts: PropTypes.array,
    loading: PropTypes.bool,
    hoveredId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setHoveredId: PropTypes.func.isRequired,
    onLocationClick: PropTypes.func.isRequired,
    locationClickable: PropTypes.bool,
    onCardClick: PropTypes.func,
    query: PropTypes.string,
    view: PropTypes.string,
    selectedId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    selectable: PropTypes.bool,
    currentView: PropTypes.string,
    context: PropTypes.string,

    // NEW (optional)
    totalCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    hasMoreExternal: PropTypes.bool,
    onLoadMore: PropTypes.func,
    onDisplayStatsChange: PropTypes.func,
    onMutate: PropTypes.func,
    onCreatePost: PropTypes.func,
};