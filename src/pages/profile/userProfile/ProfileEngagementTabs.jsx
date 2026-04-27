// src/pages/profile/userProfile/ProfileEngagementTabs.jsx
//
// ENHANCED VERSION: Visual polish with refined card styling, premium tabs,
// and better typography while preserving all existing logic.
//
// A single right-rail card with tabs for:
// - Posts (profile owner's posts feed)
// - Comments (comments this user has made)
// - Likes (posts this user has liked)
// - Reposts (posts this user has reposted)

import React, { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axiosInstance';
import { alpha, keyframes } from '@mui/material/styles';
import { getProfileSubTabsSx, getProfileFilterBarSx } from '../../../themes';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Dialog,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';

// Community category MUI icons (matching CommunityFilter)
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PollRoundedIcon from '@mui/icons-material/PollRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import Diversity3RoundedIcon from '@mui/icons-material/Diversity3Rounded';

// Community category marker images (match CommunityFilter)
import announcementMarker from '../../../assets/mapMarkers/community/announcement-marker.png';
import discussionMarker from '../../../assets/mapMarkers/community/discussion-marker.png';
import lostFoundMarker from '../../../assets/mapMarkers/community/lost-and-found-marker.png';
import safetyMarker from '../../../assets/mapMarkers/community/public-safety-alert-marker.png';
import recommendationsMarker from '../../../assets/mapMarkers/community/recommendations-marker.png';
import helpRequestsMarker from '../../../assets/mapMarkers/community/help-requests-marker.png';
import volunteerMarker from '../../../assets/mapMarkers/community/volunteer-marker.png';
import communityMarker from '../../../assets/mapMarkers/community/community-marker.png';
import defaultAvatar from '../../../assets/profile/default_avatar_square.png';

import { ProfilePostCard } from '../userProfile/ProfilePostsList';
import { MusicPostCardItem } from '../../music/components/MusicPostsList';
import BusinessPostCard from '../../business/components/BusinessPostCard';
import UserCardPopover from '../../../components/UserCardPopover';
import { useActiveAccount } from '../../../components/AccountContext';
import { getAccountHeaders } from '../../../utils/getAccountHeadersStatic';
import SharePostDialog from '../../../components/SharePostDialog';


const toName = (u) => `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim();
const toHandle = (u) => {
    const h = String(u?.handle || u?.username || '').trim().replace(/^@+/, '');
    return h ? `@${h}` : '';
};

/** UTC-safe relative-time formatter */
const formatTimeAgo = (raw) => {
    if (!raw) return '';
    let str = typeof raw === 'string' ? raw : String(raw);
    if (!/Z|[+-]\d{2}:\d{2}/.test(str)) str += 'Z';
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Math.max(0, Date.now() - d.getTime());
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return 'Just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
};

const api = process.env.REACT_APP_API_URL;

// ── Shared dropdown styling — matches SearchInput frosted-glass look ──
const PROFILE_CONTROL_SX = Object.freeze({
    '& .MuiOutlinedInput-root': {
        borderRadius: 999,
        backgroundColor: (t) => {
            const isDark = t.palette.mode === 'dark';
            const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
            return isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
        },
        backdropFilter: 'saturate(140%) blur(10px)',
        minHeight: 40,
        overflow: 'hidden',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.18 : 0.14),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.28 : 0.22),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: (t) => alpha(t.palette.primary.main, 0.50),
            boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
        },
    },
    '& .MuiInputLabel-root': {
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'text.secondary',
    },
    '& .MuiSelect-select': {
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 'unset',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
    '& .MuiInputBase-input': {
        fontWeight: 700,
        letterSpacing: '-0.01em',
    },
});

const profileMenuProps = Object.freeze({
    disableScrollLock: true,
    PaperProps: {
        sx: (t) => ({
            mt: 0.75,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            maxHeight: 340,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: alpha(t.palette.text.primary, 0.08),
            boxShadow: `0 16px 34px ${alpha(t.palette.text.primary, 0.12)}`,
            '& .MuiMenuItem-root': {
                minHeight: 42,
                fontSize: '0.875rem',
                fontWeight: 600,
            },
        }),
    },
});

// Brand colors for visual enhancement
// Lantern gold — uses theme secondary.main
// Lantern green — uses theme primary.main
// Lantern green light — uses theme primary.light
// Icon gold — uses theme secondary.main

// Subtle pulse animation for empty state icons
const gentlePulse = keyframes`
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
`;

/* ───────── shared category logic (copied from CommunityFilter.jsx approach) ───────── */
const DEFAULT_CATEGORIES = [
    { id: 'announcement', label: 'Announcements' },
    { id: 'community-chat', label: 'General Discussion' },
    { id: 'lost-and-found', label: 'Lost & Found' },
    { id: 'poll', label: 'Polls' },
    { id: 'public-safety-alerts', label: 'Public Safety Alerts' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'help-requests', label: 'Help Requests' },
    { id: 'volunteers', label: 'Volunteers' },
];


function categoryLabelForId(id) {
    const norm = normalizeSlug(id);
    const hit = DEFAULT_CATEGORIES.find((c) => normalizeSlug(c.id) === norm);
    return hit ? String(hit.label || '').trim() : '';
}

/** MUI icons for community post categories (matching CommunityFilter) */
const COMMUNITY_CATEGORY_ICONS = {
    announcement: CampaignRoundedIcon,
    announcements: CampaignRoundedIcon,
    discussion: ForumRoundedIcon,
    'community-chat': ForumRoundedIcon,
    'lost-and-found': SearchRoundedIcon,
    'lost-found': SearchRoundedIcon,
    poll: PollRoundedIcon,
    polls: PollRoundedIcon,
    'public-safety-alerts': ShieldRoundedIcon,
    tips: ThumbUpRoundedIcon,
    recommendations: ThumbUpRoundedIcon,
    'recommendations-tips': ThumbUpRoundedIcon,
    'help-requests': PanToolRoundedIcon,
    volunteers: Diversity3RoundedIcon,
    'volunteer-requests': Diversity3RoundedIcon,
};

/** Special (non-community) post-type categories with MUI icons */
const SPECIAL_CATEGORY_MAP = {
    artist_post:       { label: 'Artist Posts',       Icon: MusicNoteRoundedIcon },
    business_post:     { label: 'Business Posts',     Icon: StorefrontRoundedIcon },
    nonprofit_post:    { label: 'Nonprofit Posts',    Icon: VolunteerActivismRoundedIcon },
    organization_post: { label: 'Organization Posts', Icon: AccountBalanceRoundedIcon },
};

function PETCategoryRow({ catId, label, count }) {
    const special = SPECIAL_CATEGORY_MAP[catId];
    const CatIcon = !special ? (COMMUNITY_CATEGORY_ICONS[catId] || ForumRoundedIcon) : null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                {special ? (
                    <special.Icon sx={{ fontSize: 20, flexShrink: 0, color: 'primary.main' }} />
                ) : (
                    <CatIcon sx={{ fontSize: 20, flexShrink: 0, color: 'primary.main' }} />
                )}
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{label}</Typography>
            </Box>
            {count != null && (
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: 'text.secondary', flexShrink: 0 }}>
                    ({count})
                </Typography>
            )}
        </Box>
    );
}

function categoryEmptyPostsBody(categoryId) {
    const id = normalizeSlug(categoryId);
    if (!id) return "This user doesn't have any posts yet.";

    const label = categoryLabelForId(id);
    if (!label) return "This user doesn't have any posts yet.";

    const lower = label.replace(/&/g, 'and').toLowerCase();

    return `This user doesn't have any ${lower} posts yet.`;
}

function normalizeSlug(v) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return '';
    if (s === 'announcements') return 'announcement';
    if (s === 'discussion') return 'community-chat';
    if (s === 'lost-found') return 'lost-and-found';
    if (s === 'public-safety') return 'public-safety-alerts';
    return s;
}

function deriveSplitCategory(post) {
    const raw = post?.category ?? post?.subtype ?? post?.category_slug ?? post?.category_id ?? '';
    let cat = normalizeSlug(raw);

    // Handle business posts — split by entity_type
    const pType = String(post?.postType || '').toLowerCase();
    if (pType === 'business' || cat === 'business_post' || cat === 'business-post') {
        const et = String(post?.entity_type || post?.entityType || 'business').toLowerCase();
        if (et === 'nonprofit') return 'nonprofit_post';
        if (et === 'organization') return 'organization_post';
        return 'business_post';
    }

    // Handle artist posts
    if (pType === 'artist' || cat === 'artist_post' || cat === 'artist-post') {
        return 'artist_post';
    }

    if (cat === 'recommendations-tips') {
        return 'recommendations';
    }

    if (
        cat === 'volunteer-requests' ||
        cat === 'volunteer-help-requests' ||
        cat === 'volunteer-help' ||
        cat === 'volunteer-and-help-requests'
    ) {
        const kind = String(post?.request_kind || post?.requestKind || post?.help_type || '').trim().toLowerCase();
        if (kind === 'volunteer' || kind === 'volunteering' || kind === 'offer' || kind === 'offers' || kind === 'offering') {
            return 'volunteers';
        }
        return 'help-requests';
    }

    if (cat === 'tips' || cat === 'tip') return 'recommendations';
    if (cat === 'recommendations') return cat;
    if (cat === 'help-requests' || cat === 'volunteers') return cat;

    return cat;
}

function categoryForItem(item) {
    if (!item) return '';
    if (item.post && typeof item.post === 'object') return deriveSplitCategory(item.post);
    return deriveSplitCategory(item);
}

function dateMsForItem(item, activeTab) {
    if (!item) return 0;
    if (activeTab === 1) {
        const raw = item.created_at || item.createdAt || null;
        if (!raw) return 0;
        let str = typeof raw === 'string' ? raw : String(raw);
        if (!/Z|[+-]\d{2}:\d{2}/.test(str)) str += 'Z';
        const d = new Date(str);
        const ms = d.getTime();
        return Number.isNaN(ms) ? 0 : ms;
    }
    return getDateMs(item);
}

function likesForItem(item) {
    if (!item) return 0;
    const p = item.post && typeof item.post === 'object' ? item.post : item;
    return getLikesCount(p);
}

function buildCategoryOptionsFromPosts(posts) {
    // Count posts per category from actual data
    const countMap = new Map();
    (Array.isArray(posts) ? posts : []).forEach((p) => {
        const d = categoryForItem(p);
        if (d) countMap.set(d, (countMap.get(d) || 0) + 1);
    });

    // Only include categories that actually have posts
    if (countMap.size === 0) return [];

    // Canonical labels for known community categories
    const communityLabels = new Map();
    DEFAULT_CATEGORIES.forEach((c) => communityLabels.set(normalizeSlug(c.id), c.label));
    communityLabels.set('recommendations', 'Recommendations');
    communityLabels.set('help-requests', 'Help Requests');
    communityLabels.set('volunteers', 'Volunteers');
    communityLabels.set('public_safety', 'Public Safety Alerts');
    communityLabels.set('volunteer_help', 'Volunteers');

    const result = [];
    const seen = new Set();

    countMap.forEach((count, rawId) => {
        const id = String(rawId).trim().toLowerCase();
        if (!id || seen.has(id)) return;
        seen.add(id);

        // Check if it's a special post-type category
        const special = SPECIAL_CATEGORY_MAP[id];
        if (special) {
            result.push({ id, label: special.label, count });
            return;
        }

        // Community category — look up canonical label
        const label = communityLabels.get(id) || categoryLabelForId(id) || id;
        result.push({ id, label, count });
    });

    // Sort: community categories first (by DEFAULT_CATEGORIES order), then special, then alphabetical
    const orderIndex = new Map();
    DEFAULT_CATEGORIES.forEach((c, idx) => orderIndex.set(normalizeSlug(c.id), idx));
    orderIndex.set('recommendations', 11);
    orderIndex.set('help-requests', 12);
    orderIndex.set('volunteers', 13);
    // Special categories go after community
    orderIndex.set('business_post', 100);
    orderIndex.set('nonprofit_post', 101);
    orderIndex.set('organization_post', 102);
    orderIndex.set('artist_post', 103);

    result.sort((a, b) => {
        const ai = orderIndex.has(a.id) ? orderIndex.get(a.id) : 10_000;
        const bi = orderIndex.has(b.id) ? orderIndex.get(b.id) : 10_000;
        if (ai !== bi) return ai - bi;
        return String(a.label).localeCompare(String(b.label));
    });

    return result;
}

function getLikesCount(p) {
    return Number(p?.likesCount ?? p?.likes_count ?? p?.like_count ?? p?.likes ?? 0) || 0;
}

function getDateMs(p) {
    const raw = p?.posted_at || p?.postedAt || p?.date_created || p?.created_at || p?.updated_at || null;
    if (!raw) return 0;
    let str = typeof raw === 'string' ? raw : String(raw);
    if (!/Z|[+-]\d{2}:\d{2}/.test(str)) str += 'Z';
    const d = new Date(str);
    const ms = d.getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

function a11yProps(idx) {
    return {
        id: `profile-activity-tab-${idx}`,
        'aria-controls': `profile-activity-tabpanel-${idx}`,
    };
}

function TabIconWrapper({ children, size = 22, squeezeX = 1 }) {
    const sx = Number(squeezeX) || 1;
    const fontSize = typeof size === 'number' ? size : 22;

    if (!React.isValidElement(children)) return null;

    return (
        <Box
            sx={(t) => ({
                mr: 0.9,
                display: 'flex',
                alignItems: 'center',
                transform: sx === 1 ? 'none' : `scaleX(${sx})`,
                transformOrigin: 'center',
                filter: (t) => `drop-shadow(0 1px 0 ${alpha(t.palette.text.primary, 0.12)})`,
            })}
        >
            {React.cloneElement(children, {
                className: `${children.props.className ? `${children.props.className} ` : ''}llTabIcon`,
                sx: {
                    ...(children.props.sx || null),
                    fontSize,
                },
            })}
        </Box>
    );
}

function TabPanel({ value, index, children }) {
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`profile-activity-tabpanel-${index}`}
            aria-labelledby={`profile-activity-tab-${index}`}
            sx={{ minHeight: 0 }}
        >
            {value === index ? children : null}
        </Box>
    );
}

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
];

const PAGE_SIZE = 25;
const STICKY_FOOTER_HEIGHT = 48;

/* ───────────────────────────────────────────
   PostPhotoGrid — Facebook-style photo grid
   Matches the ArtistPostCard photo rendering
   ─────────────────────────────────────────── */

function extractMediaUrls(post) {
    if (!post) return [];
    let processed = [];
    const { photos } = post;

    // 1. photos field (array or JSON string)
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

    // 2. Single-value fallback fields
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

    // 3. mediaUrl (JSON array string — business/artist posts)
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

    // 4. community_photos array of objects
    if (!processed.length && Array.isArray(post.community_photos)) {
        processed = post.community_photos.map((r) => r?.url || r?.photo_url || r?.path || null).filter(Boolean);
    }

    // 5. photos_json string
    if (!processed.length && typeof post.photos_json === 'string') {
        try {
            const arr = JSON.parse(post.photos_json);
            if (Array.isArray(arr)) processed = arr.filter((u) => typeof u === 'string' && u);
        } catch {
            /* ignore */
        }
    }

    return processed;
}

function PostPhotoGrid({ mediaUrls }) {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    const count = mediaUrls.length;

    // Clicks bubble up to the parent card row which opens the post detail.
    const imgCell = (url, idx, sx = {}) => (
        <Box
            key={idx}
            sx={{
                position: 'relative',
                cursor: 'pointer',
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
                    transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            />
        </Box>
    );

    const overlay = (extra) => (
        <Box sx={{
            position: 'absolute', inset: 0,
            bgcolor: (t) => alpha(t.palette.common.black, 0.55),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
        }}>
            <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
        </Box>
    );

    // 1 photo — natural aspect ratio, capped height, no crop
    if (count === 1) {
        return (
            <Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}>
                <Box
                    sx={{ position: 'relative', cursor: 'pointer',  }}
                >
                    <Box
                        component="img"
                        src={mediaUrls[0]}
                        alt=""
                        sx={{
                            width: '100%',
                            maxHeight: 600,
                            objectFit: 'contain',
                            display: 'block',
                            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                    />
                </Box>
            </Box>
        );
    }

    // 2 photos
    if (count === 2) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0)}
                {imgCell(mediaUrls[1], 1)}
            </Box>
        );
    }

    // 3 photos
    if (count === 3) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
            </Box>
        );
    }

    // 4 photos
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

    // 5+ photos
    const extra = count - 5;
    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360, md: 420 }, mt: 1.5 }}>
            {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
            {imgCell(mediaUrls[1], 1)}
            {imgCell(mediaUrls[2], 2)}
            {imgCell(mediaUrls[3], 3)}
            <Box
                sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    overflow: 'hidden',

                }}
            >
                <Box
                    component="img"
                    src={mediaUrls[4]}
                    alt=""
                    sx={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                />
                {extra > 0 && overlay(extra)}
            </Box>
        </Box>
    );
}

function PhotoLightbox({ open, onClose, mediaUrls, initialIndex }) {
    const [index, setIndex] = useState(initialIndex || 0);

    useEffect(() => {
        if (open) setIndex(initialIndex || 0);
    }, [open, initialIndex]);

    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { bgcolor: 'common.black', maxHeight: '90vh' } }}
        >
            <IconButton
                onClick={onClose}
                sx={{ position: 'absolute', top: 8, right: 8, color: 'common.white', zIndex: 1 }}
            >
                <CloseRoundedIcon />
            </IconButton>
            {mediaUrls.length > 1 && (
                <>
                    <IconButton
                        onClick={() => setIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)}
                        sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}
                    >
                        <ChevronLeftRoundedIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => setIndex((prev) => (prev + 1) % mediaUrls.length)}
                        sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.black, 0.50), '&:hover': { bgcolor: (t) => alpha(t.palette.common.black, 0.70) } }}
                    >
                        <ChevronRightRoundedIcon />
                    </IconButton>
                </>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, height: '80vh' }}>
                <Box
                    component="img"
                    src={mediaUrls[index]}
                    alt=""
                    sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
            </Box>
        </Dialog>
    );
}

export default function ProfileEngagementTabs({
                                                  me,
                                                  profile,
                                                  posts,
                                                  isScrollBox = false,
                                                  scrollBoxHeight = null,
                                                  isMine,
                                                  isFollowing,
                                                  privacy,
                                                  canViewSection,
                                                  onOpenPost,
                                                  onOpenComment,
                                                  onExpandPosts,
                                                  onFilterChange,
                                                  onScrollToTop,
                                                  disableInitialAutoScroll = true,
                                                  pageScrollOffset = 0,
                                                  searchQuery = '',
                                                  searchBarSlot = null,
                                                  clearFiltersRef = null,
                                                  initialTab = 0,
                                              }) {
    const navigate = useNavigate();
    const { activeBusinessId, activeArtistId } = useActiveAccount();
    const accountCacheKey = activeBusinessId ? `biz:${activeBusinessId}` : activeArtistId ? `art:${activeArtistId}` : 'personal';
    const accountKeyRef = useRef(accountCacheKey);
    accountKeyRef.current = accountCacheKey;
    const rawProfileKey = profile?.handle || profile?.public_id || profile?.id;
    const profileKey = typeof rawProfileKey === 'string' && rawProfileKey.startsWith('@') ? rawProfileKey.slice(1) : rawProfileKey;

    const [tab, setTab] = useState(initialTab || 0);

    // Sync tab when parent changes initialTab (e.g. mobile sub-tab icons)
    const prevInitialTabRef = useRef(initialTab);
    useEffect(() => {
        if (initialTab !== prevInitialTabRef.current) {
            prevInitialTabRef.current = initialTab;
            setTab(initialTab);
        }
    }, [initialTab]);
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [renderCounts, setRenderCounts] = useState([PAGE_SIZE, PAGE_SIZE, PAGE_SIZE, PAGE_SIZE]);
    const setTabSafe = useCallback((nextTab) => {
        setTab((prev) => (prev === nextTab ? prev : nextTab));
    }, []);
    const setCategorySafe = useCallback((nextCategory) => {
        setCategory((prev) => (prev === nextCategory ? prev : nextCategory));
    }, []);
    const setSortBySafe = useCallback((nextSortBy) => {
        setSortBy((prev) => (prev === nextSortBy ? prev : nextSortBy));
    }, []);
    const setDateFromSafe = useCallback((v) => {
        setDateFrom((prev) => (prev === v ? prev : v));
    }, []);
    const setDateToSafe = useCallback((v) => {
        setDateTo((prev) => (prev === v ? prev : v));
    }, []);
    const setRenderCountsSafe = useCallback((nextRenderCounts) => {
        setRenderCounts((prev) => {
            const next = typeof nextRenderCounts === 'function' ? nextRenderCounts(prev) : nextRenderCounts;
            if (!Array.isArray(next)) return prev;
            if (prev.length === next.length && prev.every((value, index) => value === next[index])) {
                return prev;
            }
            return next;
        });
    }, []);
    const renderCount = renderCounts[tab] ?? PAGE_SIZE;
    const setRenderCount = useCallback((valOrFn) => {
        setRenderCountsSafe((prev) => {
            const next = [...prev];
            next[tab] = typeof valOrFn === 'function' ? valOrFn(prev[tab] ?? PAGE_SIZE) : valOrFn;
            return next;
        });
    }, [tab, setRenderCountsSafe]);

    const engagementStateKey = profileKey ? `ll:profileEngagementState:${profileKey}` : null;
    const engagementRestoredRef = useRef(false);
    const restoreInProgressRef = useRef(false);
    const forceSavedRef = useRef(false); // Prevents unmount cleanup from overwriting force-saved state
    const pendingScrollRef = useRef(null); // Stores snapshot when posts data hasn't arrived yet
    const scrollerRef = useRef(null);

    // When isScrollBox=false and parent CSS (from UserProfilePage) makes PET's scroll area
    // the scroll container via `overflowY: auto !important`, we need to detect which DOM
    // element is actually scrollable. UPP's CSS override targets scrollerRef itself, not
    // its parent — so we check computed style to find the right element.
    const getEffectiveScroller = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return null;
        if (isScrollBox) return el; // PET manages its own scroll

        // In embedded mode, check if el itself was made scrollable by parent CSS overrides
        try {
            const style = window.getComputedStyle(el);
            const oy = style?.overflowY;
            if (oy === 'auto' || oy === 'scroll') return el;
        } catch {
            // ignore
        }

        // Fallback: check parent
        const parent = el.parentElement;
        if (parent) {
            try {
                const pStyle = window.getComputedStyle(parent);
                const poy = pStyle?.overflowY;
                if (poy === 'auto' || poy === 'scroll') return parent;
            } catch {
                // ignore
            }
        }

        return parent || el;
    }, [isScrollBox]);

    /** Scroll to the top of the engagement content area */
    const scrollToTop = useCallback(() => {
        // Reset the direct scroller
        const eff = getEffectiveScroller();
        if (eff) eff.scrollTop = 0;
        // Walk up the DOM to reset any scrolled ancestor within the card
        let el = scrollerRef.current;
        while (el) {
            if (el.scrollTop > 0 && el.scrollHeight > el.clientHeight) {
                el.scrollTop = 0;
            }
            el = el.parentElement;
            // Stop at the card boundary
            if (el?.classList?.contains('MuiCard-root')) {
                if (el.scrollTop > 0) el.scrollTop = 0;
                break;
            }
        }
        // Page-level scroll is handled by onScrollToTop from the parent.
        // Do NOT call scrollIntoView here — it fights the parent's scroll.
    }, [getEffectiveScroller]);

    const onFilterChangeRef = useRef(onFilterChange);
    useEffect(() => {
        onFilterChangeRef.current = onFilterChange;
    }, [onFilterChange]);

    const onScrollToTopRef = useRef(onScrollToTop);
    useEffect(() => {
        onScrollToTopRef.current = onScrollToTop;
    }, [onScrollToTop]);

    // Expose a clearFilters function to the parent via ref
    useEffect(() => {
        if (clearFiltersRef) {
            clearFiltersRef.current = () => {
                setCategorySafe('');
                setSortBySafe('newest');
                setDateFromSafe('');
                setDateToSafe('');
                scrollToTop();
            };
        }
        return () => {
            if (clearFiltersRef) clearFiltersRef.current = null;
        };
    }, [clearFiltersRef, setCategorySafe, setSortBySafe, setDateFromSafe, setDateToSafe, scrollToTop]);

    // Notify parent of current filter state so expand button can sync
    useEffect(() => {
        onFilterChangeRef.current?.({ tab, category, sortBy, dateFrom, dateTo });
    }, [tab, category, sortBy, dateFrom, dateTo]);

    const handleTabChange = useCallback(
        (_, nextTab) => {
            const v = Number.isFinite(nextTab) ? nextTab : 0;

            setTabSafe(v);
            setCategorySafe('');
            setSortBySafe('newest');
            setDateFromSafe('');
            setDateToSafe('');

            const eff = getEffectiveScroller();
            if (eff) eff.scrollTop = 0;

            // Scroll the page so the right-rail tabs are at viewport top
            onScrollToTopRef.current?.();

            if (engagementStateKey) {
                const snapshot = {
                    tab: v,
                    category: '',
                    sortBy: 'newest',
                    dateFrom: '',
                    dateTo: '',
                    scrollTop: 0,
                };
                try {
                    sessionStorage.setItem(engagementStateKey, JSON.stringify(snapshot));
                } catch {
                    // ignore
                }
            }
        },
        [engagementStateKey, getEffectiveScroller, setCategorySafe, setDateFromSafe, setDateToSafe, setSortBySafe, setTabSafe]
    );

    const saveEngagementState = useCallback(() => {
        if (!engagementStateKey) return;
        // If forceSaveEngagementState was called (e.g. before navigation), don't overwrite
        // with potentially stale/zero scroll values from unmount cleanup
        if (forceSavedRef.current) return;

        const eff = getEffectiveScroller();
        const snapshot = {
            tab: Number.isFinite(tab) ? tab : 0,
            category: category || '',
            sortBy: sortBy || 'newest',
            dateFrom: dateFrom || '',
            dateTo: dateTo || '',
            renderCounts: renderCounts,
            scrollTop: eff ? eff.scrollTop : 0,
            lastPostId: null,
            windowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
        };

        try {
            const prevRaw = sessionStorage.getItem(engagementStateKey);
            if (prevRaw) {
                const prev = JSON.parse(prevRaw);
                if (prev && (typeof prev.lastPostId === 'string' || typeof prev.lastPostId === 'number')) {
                    snapshot.lastPostId = prev.lastPostId;
                }
            }
        } catch {
            // ignore
        }

        try {
            sessionStorage.setItem(engagementStateKey, JSON.stringify(snapshot));
        } catch {
            // ignore
        }
    }, [engagementStateKey, tab, category, sortBy, dateFrom, dateTo, renderCounts]);

    useEffect(() => {
        const handleSetState = (ev) => {
            const detail = ev?.detail || {};
            const incomingKey = typeof detail.profileKey === 'string' ? detail.profileKey.replace(/^@+/, '') : '';
            if (!incomingKey || incomingKey !== profileKey) return;

            if (Number.isFinite(detail.tab)) setTabSafe(detail.tab);
            if (typeof detail.category === 'string') setCategorySafe(detail.category);
            if (typeof detail.sortBy === 'string') setSortBySafe(detail.sortBy);
            if (typeof detail.dateFrom === 'string') setDateFromSafe(detail.dateFrom);
            if (typeof detail.dateTo === 'string') setDateToSafe(detail.dateTo);

            const nextScrollTop = Number.isFinite(detail.scrollTop) ? detail.scrollTop : null;
            if (nextScrollTop !== null) {
                requestAnimationFrame(() => {
                    const eff = getEffectiveScroller();
                    if (eff) eff.scrollTop = nextScrollTop;
                });
            }
        };

        window.addEventListener('ll:profileEngagement:setState', handleSetState);
        return () => window.removeEventListener('ll:profileEngagement:setState', handleSetState);
    }, [getEffectiveScroller, profileKey, setCategorySafe, setDateFromSafe, setDateToSafe, setSortBySafe, setTabSafe]);

    const forceSaveEngagementState = useCallback(
        (nextTab, opts = null) => {
            if (!engagementStateKey) return;

            // Mark as force-saved so unmount cleanup won't overwrite with stale values
            forceSavedRef.current = true;

            const eff = getEffectiveScroller();
            const snapshot = {
                tab: Number.isFinite(nextTab) ? nextTab : (Number.isFinite(tab) ? tab : 0),
                category: category || '',
                sortBy: sortBy || 'newest',
                dateFrom: dateFrom || '',
                dateTo: dateTo || '',
                renderCounts: renderCounts,
                scrollTop: eff ? eff.scrollTop : 0,
                lastPostId: opts && (typeof opts.lastPostId === 'string' || typeof opts.lastPostId === 'number')
                    ? opts.lastPostId
                    : null,
                windowScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
            };

            if (snapshot.lastPostId === null) {
                try {
                    const prevRaw = sessionStorage.getItem(engagementStateKey);
                    if (prevRaw) {
                        const prev = JSON.parse(prevRaw);
                        if (prev && (typeof prev.lastPostId === 'string' || typeof prev.lastPostId === 'number')) {
                            snapshot.lastPostId = prev.lastPostId;
                        }
                    }
                } catch {
                    // ignore
                }
            }

            try {
                sessionStorage.setItem(engagementStateKey, JSON.stringify(snapshot));
            } catch {
                // ignore
            }
        },
        [engagementStateKey, tab, category, sortBy, dateFrom, dateTo, renderCounts]
    );

    const restoreScrollFromSnapshot = useCallback(
        (snapshot) => {
            const lastPostId = snapshot && (typeof snapshot.lastPostId === 'string' || typeof snapshot.lastPostId === 'number')
                ? String(snapshot.lastPostId)
                : '';
            const desiredScrollTop = snapshot && Number.isFinite(snapshot.scrollTop) ? Number(snapshot.scrollTop) : null;
            const desiredWindowY = snapshot && Number.isFinite(snapshot.windowScrollY) ? Number(snapshot.windowScrollY) : null;

            let tries = 0;
            const maxTries = 60;
            let successCount = 0;
            // Continue for a few frames after success to guard against late overwrites
            // (e.g. UPP's restore rAF firing after PET has set the correct position)
            const guardFrames = 8;

            const attempt = () => {
                tries += 1;
                const scrollerEl = getEffectiveScroller();

                // Strategy 1: Use saved scrollTop (exact pixel position — most reliable)
                if (scrollerEl && desiredScrollTop !== null && desiredScrollTop > 0) {
                    scrollerEl.scrollTop = desiredScrollTop;
                    // Check if it stuck
                    if (scrollerEl.scrollTop >= desiredScrollTop - 5) {
                        successCount += 1;
                        // Keep re-applying for a few guard frames to override any late resets
                        if (successCount < guardFrames && tries < maxTries) {
                            requestAnimationFrame(attempt);
                            return;
                        }
                        return; // Done — scroll is stable
                    }
                    // Content not tall enough yet — retry
                    successCount = 0;
                    if (tries < maxTries) {
                        requestAnimationFrame(attempt);
                    }
                    return;
                }

                // Strategy 2: Find anchor element by lastPostId (fallback when scrollTop is 0/null)
                if (lastPostId) {
                    const root = scrollerEl || document;
                    const node = root.querySelector?.(`[data-profile-post-id="${CSS.escape(lastPostId)}"]`);
                    if (node) {
                        try {
                            if (scrollerEl) {
                                const rect = node.getBoundingClientRect();
                                const parentRect = scrollerEl.getBoundingClientRect();
                                const delta = rect.top - parentRect.top - 24;
                                scrollerEl.scrollTop = Math.max(0, scrollerEl.scrollTop + delta);
                            } else {
                                node.scrollIntoView({ block: 'center', behavior: 'auto' });
                            }
                            return;
                        } catch {
                            // fall through
                        }
                    }
                }

                // Strategy 3: Use window scroll (non-scrollbox mode)
                if (!scrollerEl && desiredWindowY !== null) {
                    window.scrollTo({ top: desiredWindowY, left: 0, behavior: 'auto' });
                    return;
                }

                if (tries < maxTries) {
                    requestAnimationFrame(attempt);
                }
            };

            requestAnimationFrame(() => requestAnimationFrame(attempt));
        },
        [getEffectiveScroller]
    );

    useEffect(() => {
        if (!engagementStateKey || engagementRestoredRef.current) return;

        const restoreKeysToCheck = [
            `ll:profile:${profileKey}:restore`,
            `ll:profile:@${profileKey}:restore`,
            rawProfileKey ? `ll:profile:${rawProfileKey}:restore` : null,
            rawProfileKey ? `ll:profile:@${String(rawProfileKey).replace(/^@+/, '')}:restore` : null,
        ].filter(Boolean);

        let shouldRestore = false;
        try {
            shouldRestore = restoreKeysToCheck.some((k) => sessionStorage.getItem(k) === '1');
        } catch {
            shouldRestore = false;
        }

        if (!shouldRestore) {
            try {
                sessionStorage.removeItem(engagementStateKey);
            } catch {
                /* ignore */
            }

            setTabSafe(0);
            setCategorySafe('');
            setSortBySafe('newest');
            setDateFromSafe('');
            setDateToSafe('');

            requestAnimationFrame(() => {
                const eff = getEffectiveScroller();
                if (eff) eff.scrollTop = 0;
            });

            engagementRestoredRef.current = true;
            return;
        }

        restoreInProgressRef.current = true;
        let raw = null;
        try {
            raw = sessionStorage.getItem(engagementStateKey);
        } catch {
            raw = null;
        }

        if (raw) {
            try {
                const s = JSON.parse(raw);
                if (Number.isFinite(s.tab)) setTabSafe(s.tab);
                if (typeof s.category === 'string') setCategorySafe(s.category);
                if (typeof s.sortBy === 'string') setSortBySafe(s.sortBy);
                if (typeof s.dateFrom === 'string') setDateFromSafe(s.dateFrom);
                if (typeof s.dateTo === 'string') setDateToSafe(s.dateTo);
                if (Array.isArray(s.renderCounts)) {
                    setRenderCountsSafe(s.renderCounts.map((v) => Math.max(PAGE_SIZE, Math.min(Number(v) || PAGE_SIZE, 5000))));
                }

                if ((s.tab === 0 || !Number.isFinite(s.tab)) && s.scrollTop > 0) {
                    pendingScrollRef.current = s;
                }

                restoreScrollFromSnapshot(s);
            } catch {
                // ignore malformed saved state
            }
        } else {
            setTabSafe(0);
            setCategorySafe('');
            setSortBySafe('newest');
            setDateFromSafe('');
            setDateToSafe('');
        }

        try {
            restoreKeysToCheck.forEach((k) => sessionStorage.setItem(k, '0'));
        } catch {
            /* ignore */
        }

        forceSavedRef.current = false;
        engagementRestoredRef.current = true;
    }, [
        engagementStateKey,
        getEffectiveScroller,
        profileKey,
        rawProfileKey,
        restoreScrollFromSnapshot,
        setCategorySafe,
        setDateFromSafe,
        setDateToSafe,
        setRenderCountsSafe,
        setSortBySafe,
        setTabSafe,
    ]);

    // When Posts tab data arrives from parent (async API), retry scroll restore.
    // The initial restore loop likely failed because posts=[] → 0 content height.
    useEffect(() => {
        const pending = pendingScrollRef.current;
        if (!pending) return;
        if (!posts || !posts.length) return;
        // Posts just arrived — clear pending and re-apply scroll
        pendingScrollRef.current = null;
        restoreScrollFromSnapshot(pending);
    }, [posts, restoreScrollFromSnapshot]);

    useEffect(() => {
        saveEngagementState();
    }, [saveEngagementState]);

    useEffect(() => {
        return () => {
            saveEngagementState();
        };
    }, [saveEngagementState]);

    useEffect(() => {
        const el = getEffectiveScroller();
        if (!el || !engagementStateKey) return;

        let raf = 0;
        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                saveEngagementState();
            });
        };

        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            if (raf) cancelAnimationFrame(raf);
            el.removeEventListener('scroll', onScroll);
        };
    }, [engagementStateKey, saveEngagementState, getEffectiveScroller]);

    const [engagementLoaded, setEngagementLoaded] = useState(false);
    const [engagementLoading, setEngagementLoading] = useState(false);
    const [engagementError, setEngagementError] = useState('');
    const [likes, setLikes] = useState([]);
    const [reposts, setReposts] = useState([]);
    const [comments, setComments] = useState([]);

    // ── Moderation: blocked / hidden user IDs + entity IDs ──
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
    const [blockedBusinessIds, setBlockedBusinessIds] = useState(() => new Set());
    const [blockedArtistIds, setBlockedArtistIds] = useState(() => new Set());
    // ── Viewer's following list (for filtering followers-only posts) ──
    const [viewerFollowingIds, setViewerFollowingIds] = useState(() => new Set());
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axios.get('/api/users/moderation-state', { withCredentials: true });
                if (!alive) return;
                const d = res?.data || {};
                const blocked = Array.isArray(d.blocked_user_ids) ? d.blocked_user_ids : [];
                const hiddenUsers = Array.isArray(d.hidden_user_ids) ? d.hidden_user_ids : [];
                const hiddenPosts = Array.isArray(d.hidden_post_user_ids) ? d.hidden_post_user_ids : [];
                const legacyOwners = Array.isArray(d.blocked_owner_ids_legacy) ? d.blocked_owner_ids_legacy : [];
                const combined = new Set();
                for (const id of [...blocked, ...hiddenUsers, ...hiddenPosts, ...legacyOwners]) {
                    combined.add(Number(id));
                    combined.add(String(id));
                }
                if (alive) setBlockedUserIds(combined);

                // Business and artist entity IDs
                const bizIds = Array.isArray(d.blocked_business_ids) ? d.blocked_business_ids : [];
                const hiddenBizIds = Array.isArray(d.hidden_post_business_ids) ? d.hidden_post_business_ids : [];
                const bSet = new Set();
                for (const id of [...bizIds, ...hiddenBizIds]) { bSet.add(Number(id)); bSet.add(String(id)); }
                if (alive) setBlockedBusinessIds(bSet);

                const artIds = Array.isArray(d.blocked_artist_ids) ? d.blocked_artist_ids : [];
                const hiddenArtIds = Array.isArray(d.hidden_post_artist_ids) ? d.hidden_post_artist_ids : [];
                const aSet = new Set();
                for (const id of [...artIds, ...hiddenArtIds]) { aSet.add(Number(id)); aSet.add(String(id)); }
                if (alive) setBlockedArtistIds(aSet);

                // Viewer's following list for followers-only post filtering
                const followingArr = Array.isArray(d.viewer_following_ids) ? d.viewer_following_ids : [];
                if (alive && followingArr.length > 0) {
                    setViewerFollowingIds(new Set(followingArr.map(Number).filter((n) => n > 0)));
                }
            } catch {
                // If moderation check fails, don't filter anything
            }
        })();
        return () => { alive = false; };
    }, []);

    // Live-update when user blocks/hides someone during this session
    useEffect(() => {
        const onBlockChanged = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const isBlocked = Boolean(e?.detail?.blocked);
            const targetType = String(e?.detail?.targetType || '').toLowerCase();

            // Route to correct set based on target type
            if (targetType === 'business') {
                setBlockedBusinessIds((prev) => {
                    const next = new Set(prev);
                    if (isBlocked) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            } else if (targetType === 'artist') {
                setBlockedArtistIds((prev) => {
                    const next = new Set(prev);
                    if (isBlocked) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            } else {
                setBlockedUserIds((prev) => {
                    const next = new Set(prev);
                    if (isBlocked) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            }
        };
        const onHiddenChanged = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const isHidden = Boolean(e?.detail?.hidden);
            const targetType = String(e?.detail?.targetType || '').toLowerCase();

            // Route to correct set based on target type
            if (targetType === 'business') {
                setBlockedBusinessIds((prev) => {
                    const next = new Set(prev);
                    if (isHidden) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            } else if (targetType === 'artist') {
                setBlockedArtistIds((prev) => {
                    const next = new Set(prev);
                    if (isHidden) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            } else {
                setBlockedUserIds((prev) => {
                    const next = new Set(prev);
                    if (isHidden) { next.add(uid); next.add(String(uid)); }
                    else { next.delete(uid); next.delete(String(uid)); }
                    return next;
                });
            }
        };
        window.addEventListener('ll:user:blocked-changed', onBlockChanged);
        window.addEventListener('ll:user:hidden-changed', onHiddenChanged);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', onBlockChanged);
            window.removeEventListener('ll:user:hidden-changed', onHiddenChanged);
        };
    }, []);

    // ── Viewer's joined group IDs (for filtering private-group posts) ──
    const [viewerGroupIds, setViewerGroupIds] = useState(() => new Set());
    const [privateGroupIds, setPrivateGroupIds] = useState(() => new Set());
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axios.get('/api/groups/my-memberships', { withCredentials: true });
                if (!alive) return;
                const ids = Array.isArray(res?.data?.group_ids) ? res.data.group_ids : [];
                const privIds = Array.isArray(res?.data?.private_group_ids) ? res.data.private_group_ids : [];
                setViewerGroupIds(new Set(ids.map(Number)));
                setPrivateGroupIds(new Set(privIds.map(Number)));
            } catch {
                // If fetch fails, don't filter — allow all
            }
        })();
        return () => { alive = false; };
    }, []);

    const engagementInFlightRef = useRef(false);

    useEffect(() => {
        const findAny = (idNum) => {
            const inArr = (arr) => (Array.isArray(arr) ? arr.find((p) => Number(p?.id) === idNum) : null);
            const fromComments = (arr) => {
                if (!Array.isArray(arr)) return null;
                const hit = arr.find((c) => Number(c?.post?.id) === idNum);
                return hit?.post || null;
            };
            return inArr(posts) || inArr(likes) || inArr(reposts) || fromComments(comments) || null;
        };

        const onLikeEvt = (e) => {
            const d = e?.detail || {};
            const idNum = Number(d.postId);
            if (!Number.isFinite(idNum)) return;

            const liked = Boolean(d.liked);
            const likesCount = Number(d.likes);
            // The engagement likes/reposts lists represent the PROFILE OWNER's
            // activity. Only modify (add/remove) them when the action came from
            // the profile owner's personal account.  A business or artist
            // account viewing this profile is a separate identity — their
            // like/unlike should never alter the profile owner's list.
            const isProfileOwnerAction = !d._acct || d._acct === 'personal';

            const base = findAny(idNum);

            const patch = (p) => {
                if (!p || Number(p?.id) !== idNum) return p;
                return {
                    ...p,
                    likesCount: Number.isFinite(likesCount) ? likesCount : Number(p?.likesCount ?? p?.likes_count ?? p?.likes ?? 0),
                    likes_count: Number.isFinite(likesCount) ? likesCount : p?.likes_count,
                };
            };

            // Always update counts (universal) but only add/remove from the
            // profile owner's likes list when it was their own action.
            setLikes((prev) => {
                const arr = Array.isArray(prev) ? prev.map(patch) : [];
                if (!isProfileOwnerAction) return arr;
                const exists = arr.some((p) => Number(p?.id) === idNum);

                if (liked && !exists) {
                    const toAdd = base ? patch(base) : { id: idNum, viewerLiked: true, likesCount: Number.isFinite(likesCount) ? likesCount : 0 };
                    return [toAdd, ...arr];
                }
                if (!liked && exists && !isMine) {
                    return arr.filter((p) => Number(p?.id) !== idNum);
                }
                return arr;
            });
        };

        const onRepostEvt = (e) => {
            const d = e?.detail || {};
            const idNum = Number(d.postId);
            if (!Number.isFinite(idNum)) return;

            const reposted = Boolean(d.reposted);
            const repostsCount = Number(d.reposts);
            const isProfileOwnerAction = !d._acct || d._acct === 'personal';

            const base = findAny(idNum);

            const patch = (p) => {
                if (!p || Number(p?.id) !== idNum) return p;
                return {
                    ...p,
                    repostsCount: Number.isFinite(repostsCount) ? repostsCount : Number(p?.repostsCount ?? p?.reposts_count ?? p?.reposts ?? 0),
                    reposts_count: Number.isFinite(repostsCount) ? repostsCount : p?.reposts_count,
                };
            };

            setReposts((prev) => {
                const arr = Array.isArray(prev) ? prev.map(patch) : [];
                if (!isProfileOwnerAction) return arr;
                const exists = arr.some((p) => Number(p?.id) === idNum);

                if (reposted && !exists) {
                    const toAdd = base ? patch(base) : { id: idNum, viewerReposted: true, repostsCount: Number.isFinite(repostsCount) ? repostsCount : 0 };
                    return [toAdd, ...arr];
                }
                if (!reposted && exists && !isMine) {
                    return arr.filter((p) => Number(p?.id) !== idNum);
                }
                return arr;
            });
        };

        window.addEventListener('ll:post:like-changed', onLikeEvt);
        window.addEventListener('ll:post:repost-changed', onRepostEvt);
        return () => {
            window.removeEventListener('ll:post:like-changed', onLikeEvt);
            window.removeEventListener('ll:post:repost-changed', onRepostEvt);
        };
    }, [posts, likes, reposts, comments, isMine]);

    // ── Listen for comment deletions from post detail modals ──
    useEffect(() => {
        const onCommentDeleted = (e) => {
            const cid = Number(e?.detail?.commentId || 0);
            if (!cid) return;
            setComments((prev) => {
                const next = prev.filter((c) => Number(c?.id || c?.comment_id || 0) !== cid);
                return next.length === prev.length ? prev : next;
            });
        };
        window.addEventListener('ll:comment:deleted', onCommentDeleted);
        return () => window.removeEventListener('ll:comment:deleted', onCommentDeleted);
    }, []);


    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [sharePost, setSharePost] = useState(null);

    /** Open the UserCardPopover anchored to the clicked element */
    const handleOpenUserCard = useCallback((anchorEl, authorOrPost) => {
        if (!anchorEl) return;
        const uid =
            Number(authorOrPost?.user_id) ||
            Number(authorOrPost?.author_id) ||
            Number(authorOrPost?.id) ||
            undefined;
        setUserAnchor(anchorEl);
        setUserForCard({
            ...authorOrPost,
            id: uid,
            first_name: authorOrPost?.first_name,
            last_name: authorOrPost?.last_name,
            handle: authorOrPost?.handle || authorOrPost?.username,
            avatar_url: authorOrPost?.avatar_url || authorOrPost?.profile_picture,
        });
    }, []);

    /** Check whether a post was authored by the profile owner */
    const isProfileOwnerPost = useCallback(
        (p) => {
            if (!p || !profile) return false;
            const profileId = Number(profile?.id || 0);
            const profileHandleNorm = String(profile?.handle || '').replace(/^@+/, '').toLowerCase().trim();
            const postAuthorId = Number(p?.user_id ?? p?.author_id ?? 0);
            const postHandleNorm = String(p?.handle ?? p?.username ?? '').replace(/^@+/, '').toLowerCase().trim();
            if (profileId && postAuthorId && profileId === postAuthorId) return true;
            if (profileHandleNorm && postHandleNorm && profileHandleNorm === postHandleNorm) return true;
            return false;
        },
        [profile]
    );

    const topRef = useRef(null);
    const suppressAutoScrollRef = useRef(!!disableInitialAutoScroll);
    const lastScrollKeyRef = useRef('');
    const anchorInfoRef = useRef(null);
    const prevIsScrollBoxRef = useRef(isScrollBox);
    const sentinelRef = useRef(null);

    const stickyTop = isScrollBox
        ? 0
        : Number.isFinite(Number(pageScrollOffset))
            ? Math.max(0, Number(pageScrollOffset))
            : 0;

    useEffect(() => {
        prevIsScrollBoxRef.current = isScrollBox;
    }, [isScrollBox]);

    useEffect(() => {
        if (isScrollBox) return;

        let raf = 0;

        const updateAnchor = () => {
            raf = 0;
            const scrollerEl = scrollerRef.current;
            if (!scrollerEl) return;

            const rect = scrollerEl.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            const x = rect.left + rect.width * 0.5;
            const y = Math.min(rect.bottom - 8, Math.max(rect.top + 8, window.innerHeight * 0.35));
            const el = document.elementFromPoint(x, y);
            if (!el) return;

            const cardEl = el.closest('[data-profile-post-id]');
            if (!cardEl) return;

            const id = String(cardEl.getAttribute('data-profile-post-id') || '');
            if (!id) return;

            anchorInfoRef.current = {
                id,
                top: cardEl.getBoundingClientRect().top,
            };
        };

        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(updateAnchor);
        };

        updateAnchor();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (raf) window.cancelAnimationFrame(raf);
        };
    }, [isScrollBox]);

    useLayoutEffect(() => {
        const scrollerEl = scrollerRef.current;
        if (!scrollerEl) return;

        const wasScrollBox = prevIsScrollBoxRef.current;
        if (wasScrollBox || !isScrollBox) return;

        const info = anchorInfoRef.current;
        if (!info || !info.id) return;

        let raf1 = 0;
        let raf2 = 0;

        raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(() => {
                const anchorEl = scrollerEl.querySelector(`[data-profile-post-id="${info.id}"]`);
                if (!anchorEl) return;

                const newTop = anchorEl.getBoundingClientRect().top;
                const delta = newTop - info.top;

                if (Math.abs(delta) < 2) return;

                scrollerEl.scrollTop += delta;
            });
        });

        return () => {
            if (raf1) window.cancelAnimationFrame(raf1);
            if (raf2) window.cancelAnimationFrame(raf2);
        };
    }, [isScrollBox]);

    useEffect(() => {
        const scrollerEl = scrollerRef.current;
        if (!scrollerEl || !isScrollBox) return;

        const onWheel = (e) => {
            const dy = e.deltaY;
            if (!dy) return;

            const atTop = scrollerEl.scrollTop <= 0;
            const atBottom = scrollerEl.scrollTop + scrollerEl.clientHeight >= scrollerEl.scrollHeight - 1;

            if ((atTop && dy < 0) || (atBottom && dy > 0)) {
                e.preventDefault();
                window.scrollBy({ top: dy, left: 0, behavior: 'auto' });
            }
        };

        scrollerEl.addEventListener('wheel', onWheel, { passive: false });
        return () => scrollerEl.removeEventListener('wheel', onWheel);
    }, [isScrollBox]);


    const safeCanView = useCallback(
        (level) => {
            if (typeof canViewSection === 'function') return !!canViewSection(level);
            return true;
        },
        [canViewSection]
    );

    const canViewPosts = safeCanView(privacy?.posts || 'public');
    const canViewLikes = safeCanView(privacy?.likes || 'public');
    const canViewReposts = safeCanView(privacy?.reposts || 'public');
    const canViewComments = safeCanView(privacy?.comments || 'public');
    const activeCanView = tab === 0 ? canViewPosts : tab === 1 ? canViewComments : tab === 2 ? canViewLikes : canViewReposts;

    const activeList = useMemo(() => {
        if (tab === 0) return Array.isArray(posts) ? posts : [];
        if (tab === 1) return Array.isArray(comments) ? comments : [];
        if (tab === 2) return Array.isArray(likes) ? likes : [];
        return Array.isArray(reposts) ? reposts : [];
    }, [tab, posts, likes, reposts, comments]);

    // Pre-filtered list: apply all filters EXCEPT category so category counts reflect other active filters
    const preCategoryList = useMemo(() => {
        let arr = activeList;

        // Search filtering
        if (searchQuery && String(searchQuery).trim()) {
            const q = String(searchQuery).trim().toLowerCase();
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const title = String(src?.title || '').toLowerCase();
                const body = String(src?.body || src?.content || src?.text || '').toLowerCase();
                const cat = String(src?.category || src?.subtype || '').toLowerCase();
                const city = String(src?.city || '').toLowerCase();
                const county = String(src?.county || '').toLowerCase();
                const authorFirst = String(src?.first_name || src?.author?.first_name || '').toLowerCase();
                const authorLast = String(src?.last_name || src?.author?.last_name || '').toLowerCase();
                const authorHandle = String(src?.handle || src?.author?.handle || src?.username || '').toLowerCase();
                const businessName = String(src?.business_name || src?.businessName || '').toLowerCase();
                const commentBody = tab === 1 ? String(it?.body || it?.content || it?.text || '').toLowerCase() : '';
                return title.includes(q) || body.includes(q) || cat.includes(q) || city.includes(q) || county.includes(q) || (authorFirst + ' ' + authorLast).includes(q) || authorHandle.includes(q) || businessName.includes(q) || commentBody.includes(q);
            });
        }

        // Blocked users — hide posts by blocked / hidden users on all tabs
        if (blockedUserIds.size > 0 || blockedBusinessIds.size > 0 || blockedArtistIds.size > 0) {
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const authorId = Number(src?.user_id ?? src?.author_id ?? src?.created_by_user_id ?? 0);
                if (authorId && (blockedUserIds.has(authorId) || blockedUserIds.has(String(authorId)))) return false;
                // Check business owner ID for business posts
                const bizOwnerId = Number(src?.businessOwnerId ?? src?.business_owner_id ?? src?.owner_id ?? 0);
                if (bizOwnerId && (blockedUserIds.has(bizOwnerId) || blockedUserIds.has(String(bizOwnerId)))) return false;
                // Check business entity ID
                const bizId = Number(src?.business_id ?? src?.businessId ?? src?.businessPageId ?? src?.business_page_id ?? 0);
                if (bizId && (blockedBusinessIds.has(bizId) || blockedBusinessIds.has(String(bizId)))) return false;
                // Check artist entity ID
                const artId = Number(src?.artist_id ?? src?.artistId ?? 0);
                if (artId && (blockedArtistIds.has(artId) || blockedArtistIds.has(String(artId)))) return false;
                return true;
            });
        }

        // Privacy: private group filtering
        if (!(tab === 0 && isMine)) {
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const gid = Number(src?.group_id ?? src?.groupId ?? 0);
                if (!gid) return true;
                const vis = String(src?.group_visibility ?? src?.groupVisibility ?? '').toLowerCase();
                if (vis === 'public') return true;
                if (vis === 'private' || vis === 'hidden') return viewerGroupIds.has(gid);
                if (privateGroupIds.has(gid)) return viewerGroupIds.has(gid);
                return true;
            });
        }

        // Privacy: followers-only posts — hide posts with visibility='followers'
        // from authors the viewer doesn't follow (unless it's the viewer's own profile)
        if (!(tab === 0 && isMine) && viewerFollowingIds.size > 0) {
            const viewerId = Number(me?.id || 0);
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const vis = String(src?.visibility || '').toLowerCase().trim();
                if (vis !== 'followers' && vis !== 'private') return true;
                // Always show if viewer is the post author
                const authorId = Number(src?.user_id ?? src?.author_id ?? 0);
                if (viewerId && authorId && viewerId === authorId) return true;
                // Show if viewer follows the post author
                if (authorId && viewerFollowingIds.has(authorId)) return true;
                // Hide — viewer doesn't follow this private-profile author
                return false;
            });
        }

        // Date range filtering
        if (dateFrom || dateTo) {
            const fromMs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
            const toMs = dateTo ? new Date(dateTo + 'T23:59:59.999').getTime() : Infinity;
            if (Number.isFinite(fromMs) || Number.isFinite(toMs)) {
                arr = arr.filter((it) => {
                    const ms = dateMsForItem(it, tab);
                    if (!ms) return false;
                    if (fromMs && ms < fromMs) return false;
                    if (Number.isFinite(toMs) && ms > toMs) return false;
                    return true;
                });
            }
        }

        return arr;
    }, [activeList, searchQuery, dateFrom, dateTo, tab, blockedUserIds, blockedBusinessIds, blockedArtistIds, viewerGroupIds, privateGroupIds, viewerFollowingIds, isMine, me]);

    const categoryOptions = useMemo(() => buildCategoryOptionsFromPosts(preCategoryList), [preCategoryList]);

    useEffect(() => {
        if (!profileKey) return;
        if (tab === 0) return;
        if (engagementLoaded) return;
        if (engagementInFlightRef.current) return;

        let alive = true;
        const ctrl = new AbortController();

        (async () => {
            engagementInFlightRef.current = true;
            setEngagementError('');
            setEngagementLoading(true);
            try {
                const key = encodeURIComponent(profileKey);
                const urls = [
                    `${api}/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                    `${api}/api/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                    `/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                    `/api/users/${key}/engagement/posts?types=likes,reposts,comments&limit=500`,
                ];

                let data = null;

                const acctHeaders = (() => {
                    try { return getAccountHeaders(); } catch { return {}; }
                })();

                for (const u of urls) {
                    try {
                        const r = await axios.get(u, { withCredentials: true, signal: ctrl.signal, headers: { ...acctHeaders } });
                        data = r?.data || null;
                        break;
                    } catch {
                        // try next
                    }
                }

                if (!alive) return;

                setLikes(Array.isArray(data?.likes) ? data.likes : []);
                setReposts(Array.isArray(data?.reposts) ? data.reposts : []);
                // Only show comments made from the personal account, and filter out soft-deleted comments
                const rawComments = Array.isArray(data?.comments) ? data.comments : [];
                const pHandle = String(profileKey || '').toLowerCase().trim();
                setComments(rawComments.filter((c) => {
                    // Filter out soft-deleted comments the backend may still return
                    if (Number(c?.is_removed) === 1 || c?.is_removed === true || c?.removed_at) return false;
                    const ah = String(c?.account_handle || '').toLowerCase().trim();
                    if (ah && pHandle && ah !== pHandle) return false;
                    if (Number(c?.business_id || 0) > 0) return false;
                    if (Number(c?.artist_id || 0) > 0) return false;
                    const at = String(c?.account_type || '').toLowerCase().trim();
                    if (at === 'business' || at === 'artist') return false;
                    return true;
                }));
                setEngagementLoaded(true);
            } catch (err) {
                if (!alive) return;
                setEngagementError(err?.response?.data?.message || err?.message || 'Could not load likes and reposts.');
            } finally {
                engagementInFlightRef.current = false;
                if (alive) setEngagementLoading(false);
            }
        })();

        return () => {
            alive = false;
            engagementInFlightRef.current = false;
            ctrl.abort();
        };
    }, [tab, profileKey, engagementLoaded, accountCacheKey]);

    // Re-fetch engagement data when active account changes
    const prevAccountKeyRef = useRef(accountCacheKey);
    useEffect(() => {
        if (prevAccountKeyRef.current === accountCacheKey) return;
        prevAccountKeyRef.current = accountCacheKey;
        setEngagementLoaded(false);
    }, [accountCacheKey]);

    useEffect(() => {
        suppressAutoScrollRef.current = true;
        lastScrollKeyRef.current = '';

        let hasSaved = false;
        if (engagementStateKey) {
            try {
                hasSaved = !!sessionStorage.getItem(engagementStateKey);
            } catch {
                hasSaved = false;
            }
        }

        if (!hasSaved) {
            setTabSafe(0);
            setCategorySafe('');
            setSortBySafe('newest');
            setDateFromSafe('');
            setDateToSafe('');
        }

        setEngagementLoaded(false);
        setEngagementLoading(false);
        setEngagementError('');
        setLikes([]);
        setReposts([]);
        setComments([]);

        setUserAnchor(null);
        setUserForCard(null);
        setShareOpen(false);
        setSharePost(null);

        if (!hasSaved) setRenderCountsSafe([PAGE_SIZE, PAGE_SIZE, PAGE_SIZE, PAGE_SIZE]);
    }, [engagementStateKey, profileKey, setCategorySafe, setDateFromSafe, setDateToSafe, setRenderCountsSafe, setSortBySafe, setTabSafe]);

    useEffect(() => {
        if (!category) return;
        const ok = categoryOptions.some((c) => c.id === String(category).toLowerCase());
        if (!ok) setCategorySafe('');
    }, [category, categoryOptions, setCategorySafe]);


    const filteredSortedList = useMemo(() => {
        let arr = activeList;

        // ── Search filtering (applied from parent search bar) ──
        if (searchQuery && String(searchQuery).trim()) {
            const q = String(searchQuery).trim().toLowerCase();
            arr = arr.filter((it) => {
                // For comments tab, the post is nested under it.post
                const src = tab === 1 ? (it?.post || it) : it;
                const title = String(src?.title || '').toLowerCase();
                const body = String(src?.body || src?.content || src?.text || '').toLowerCase();
                const cat = String(src?.category || src?.subtype || '').toLowerCase();
                const city = String(src?.city || '').toLowerCase();
                const county = String(src?.county || '').toLowerCase();
                const authorFirst = String(src?.first_name || src?.author?.first_name || '').toLowerCase();
                const authorLast = String(src?.last_name || src?.author?.last_name || '').toLowerCase();
                const authorHandle = String(src?.handle || src?.author?.handle || src?.username || '').toLowerCase();
                const businessName = String(src?.business_name || src?.businessName || '').toLowerCase();
                // For comments, also search the comment text itself
                const commentBody = tab === 1 ? String(it?.body || it?.content || it?.text || '').toLowerCase() : '';
                return title.includes(q) || body.includes(q) || cat.includes(q) || city.includes(q) || county.includes(q) || (authorFirst + ' ' + authorLast).includes(q) || authorHandle.includes(q) || businessName.includes(q) || commentBody.includes(q);
            });
        }

        // ── Moderation: hide posts by blocked / hidden users on all tabs ──
        if (blockedUserIds.size > 0 || blockedBusinessIds.size > 0 || blockedArtistIds.size > 0) {
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const authorId = Number(src?.user_id ?? src?.author_id ?? src?.created_by_user_id ?? 0);
                if (authorId && (blockedUserIds.has(authorId) || blockedUserIds.has(String(authorId)))) return false;
                // Check business owner ID for business posts
                const bizOwnerId = Number(src?.businessOwnerId ?? src?.business_owner_id ?? src?.owner_id ?? 0);
                if (bizOwnerId && (blockedUserIds.has(bizOwnerId) || blockedUserIds.has(String(bizOwnerId)))) return false;
                // Check business entity ID
                const bizId = Number(src?.business_id ?? src?.businessId ?? src?.businessPageId ?? src?.business_page_id ?? 0);
                if (bizId && (blockedBusinessIds.has(bizId) || blockedBusinessIds.has(String(bizId)))) return false;
                // Check artist entity ID
                const artId = Number(src?.artist_id ?? src?.artistId ?? 0);
                if (artId && (blockedArtistIds.has(artId) || blockedArtistIds.has(String(artId)))) return false;
                return true;
            });
        }

        // ── Privacy: hide posts from private/hidden groups the viewer hasn't joined ──
        // On your own profile posts tab (tab 0 + isMine), skip — you should see your own posts.
        if (!(tab === 0 && isMine)) {
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const gid = Number(src?.group_id ?? src?.groupId ?? 0);
                if (!gid) return true; // not a group post — keep

                // If group_visibility is on the post (engagement data), use it directly
                const vis = String(src?.group_visibility ?? src?.groupVisibility ?? '').toLowerCase();
                if (vis === 'public') return true;

                // If visibility is explicitly private/hidden, check membership
                if (vis === 'private' || vis === 'hidden') {
                    return viewerGroupIds.has(gid);
                }

                // No visibility field (e.g. posts tab) — check against known private group IDs
                if (privateGroupIds.has(gid)) {
                    return viewerGroupIds.has(gid);
                }

                return true; // unknown group, assume public
            });
        }

        // ── Privacy: followers-only posts — hide posts with visibility='followers'
        //    from authors the viewer doesn't follow (unless viewing own profile) ──
        if (!(tab === 0 && isMine) && viewerFollowingIds.size > 0) {
            const viewerId = Number(me?.id || 0);
            arr = arr.filter((it) => {
                const src = tab === 1 ? (it?.post || it) : it;
                const vis = String(src?.visibility || '').toLowerCase().trim();
                if (vis !== 'followers' && vis !== 'private') return true;
                const authorId = Number(src?.user_id ?? src?.author_id ?? 0);
                if (viewerId && authorId && viewerId === authorId) return true;
                if (authorId && viewerFollowingIds.has(authorId)) return true;
                return false;
            });
        }

        if (category) {
            const catNorm = normalizeSlug(category);
            arr = arr.filter((it) => {
                const itCat = categoryForItem(it);
                return itCat === catNorm;
            });
        }

        // ── Date range filtering (From / To date pickers) ──
        if (dateFrom || dateTo) {
            const fromMs = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : 0;
            const toMs = dateTo ? new Date(dateTo + 'T23:59:59.999').getTime() : Infinity;
            if (Number.isFinite(fromMs) || Number.isFinite(toMs)) {
                arr = arr.filter((it) => {
                    const ms = dateMsForItem(it, tab);
                    if (!ms) return false;
                    if (fromMs && ms < fromMs) return false;
                    if (Number.isFinite(toMs) && ms > toMs) return false;
                    return true;
                });
            }
        }

        const sorter = (a, b) => {
            if (sortBy === 'popular') {
                const la = likesForItem(a);
                const lb = likesForItem(b);
                if (la !== lb) return lb - la;
            }
            const da = dateMsForItem(a, tab);
            const db = dateMsForItem(b, tab);
            return db - da;
        };

        return [...arr].sort(sorter);
    }, [activeList, category, sortBy, dateFrom, dateTo, tab, searchQuery, blockedUserIds, blockedBusinessIds, blockedArtistIds, viewerGroupIds, privateGroupIds, viewerFollowingIds, isMine, me]);

    // ── Comments: group by post for pagination ──
    const commentGroupOrder = useMemo(() => {
        if (tab !== 1) return [];
        const groupMap = new Map();
        const order = [];
        for (const c of filteredSortedList) {
            const pid = Number(c?.post?.id ?? c?.post_id ?? 0);
            if (!pid) continue;
            if (!groupMap.has(pid)) {
                groupMap.set(pid, []);
                order.push(pid);
            }
            groupMap.get(pid).push(c);
        }
        return order.map((pid) => ({ pid, comments: groupMap.get(pid) }));
    }, [tab, filteredSortedList]);

    const totalCommentCount = useMemo(() => {
        if (tab !== 1) return 0;
        return filteredSortedList.length;
    }, [tab, filteredSortedList]);

    // ── Visible list: comments paginate by post groups, others by flat items ──
    const visibleList = useMemo(() => {
        if (tab === 1) {
            // Paginate by post groups, flatten visible groups' comments
            const groups = commentGroupOrder.slice(0, renderCount);
            const flat = [];
            for (const g of groups) flat.push(...g.comments);
            return flat;
        }
        return filteredSortedList.slice(0, renderCount);
    }, [tab, filteredSortedList, commentGroupOrder, renderCount]);


    useEffect(() => {
        const totalItems = tab === 1 ? commentGroupOrder.length : filteredSortedList.length;
        const obs = new IntersectionObserver(
            (entries) => {
                const e = entries[0];
                if (!e.isIntersecting) return;
                if (renderCount >= totalItems) return;
                setRenderCount((c) => Math.min(c + PAGE_SIZE, totalItems + PAGE_SIZE));
            },
            { rootMargin: '400px' }
        );

        if (sentinelRef.current) obs.observe(sentinelRef.current);
        return () => obs.disconnect();
    }, [renderCount, filteredSortedList.length, commentGroupOrder.length, tab, setRenderCount]);

    const blockLocationClicks = useCallback((e) => {
        if (!(e.target instanceof HTMLElement)) return;
        const loc = e.target.closest('[data-post-location-trigger]');
        if (!loc) return;
        e.stopPropagation();
    }, []);

    const openPostWithState = useCallback(
        (p) => {
            const pid = String(p?.id || '');
            if (!pid) return;

            forceSaveEngagementState(tab, { lastPostId: pid });

            if (profileKey) {
                try {
                    sessionStorage.setItem(`ll:profile:${profileKey}:restore`, '1');
                    if (!profileKey.startsWith('@')) sessionStorage.setItem(`ll:profile:@${profileKey}:restore`, '1');
                } catch {
                    /* ignore */
                }
            }

            onOpenPost?.(p);
        },
        [forceSaveEngagementState, tab, onOpenPost, profileKey]
    );

    const renderList = useCallback(
        (arr, emptyCfg = null) => {
            if (!activeCanView) {
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Box
                            sx={(t) => ({
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: alpha(t.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            })}
                        >
                            <Typography sx={{ fontSize: 28 }}>🔒</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            This section is private.
                        </Typography>
                    </Box>
                );
            }

            if (engagementLoading && tab !== 0) {
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Loading…
                        </Typography>
                    </Box>
                );
            }

            if (engagementError && tab !== 0) {
                return (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                            {engagementError}
                        </Alert>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setEngagementLoaded(false);
                                setEngagementError('');
                            }}
                            sx={(t) => ({
                                textTransform: 'none',
                                borderColor: "primary.main",
                                color: "primary.main",
                                '&:hover': {
                                    borderColor: "primary.light",
                                    bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.10 : 0.05),
                                },
                            })}
                        >
                            Retry
                        </Button>
                    </Box>
                );
            }

            if (!arr.length) {
                const hasSearch = searchQuery && String(searchQuery).trim().length > 0;
                const hasFilters = hasSearch || !!category || !!dateFrom || !!dateTo;
                const title = hasFilters ? 'No posts match your filters' : String(emptyCfg?.title || 'Nothing here yet.');
                const body = hasFilters ? 'Try adjusting your search or filters.' : String(emptyCfg?.body || '');
                const iconNode = emptyCfg?.icon || null;

                return (
                    <Box
                        sx={{
                            px: 2,
                            pt: 10,
                            pb: 5,
                            minHeight: isScrollBox ? 360 : 220,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                        }}
                    >
                        {iconNode ? iconNode : null}

                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary', mt: iconNode ? 1 : 0 }}>
                            {title}
                        </Typography>

                        {body ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                                {body}
                            </Typography>
                        ) : null}
                    </Box>
                );
            }

            return (
                <Box
                    data-flat-posts="1"
                    onClickCapture={blockLocationClicks}
                    onKeyDownCapture={blockLocationClicks}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        p: 0,
                        pb: isScrollBox ? `calc(${STICKY_FOOTER_HEIGHT}px + 12px)` : undefined,
                    }}
                >
                    {/* Suppress inner post card styling so only the wrapper highlight shows */}
                    <style>{`
                        [data-flat-posts] [data-post-id],
                        [data-flat-posts] [data-post-id][class],
                        [data-flat-posts] .MuiCard-root[data-post-id],
                        [data-flat-posts] .MuiPaper-root[data-post-id],
                        [data-flat-posts] .MuiCard-root.MuiCard-root[data-post-id],
                        [data-flat-posts] .MuiPaper-root.MuiPaper-root[data-post-id],
                        [data-flat-posts] [data-business-post-id],
                        [data-flat-posts] .MuiCard-root[data-business-post-id],
                        [data-flat-posts] [data-profile-post-id] > .MuiCard-root,
                        [data-flat-posts] [data-profile-post-id] > .MuiPaper-root {
                            box-shadow: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                            transform: none !important;
                            transition: none !important;
                            min-height: auto !important;
                            background-image: none !important;
                            background-color: transparent !important;
                            background: transparent !important;
                            overflow: visible !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            outline: none !important;
                        }
                        [data-flat-posts] [data-post-id]:hover,
                        [data-flat-posts] [data-post-id][class]:hover,
                        [data-flat-posts] .MuiCard-root[data-post-id]:hover,
                        [data-flat-posts] .MuiPaper-root[data-post-id]:hover,
                        [data-flat-posts] [data-business-post-id]:hover,
                        [data-flat-posts] .MuiCard-root[data-business-post-id]:hover,
                        [data-flat-posts] [data-profile-post-id] > .MuiCard-root:hover,
                        [data-flat-posts] [data-profile-post-id] > .MuiPaper-root:hover {
                            box-shadow: none !important;
                            transform: none !important;
                            background-color: transparent !important;
                            background: transparent !important;
                        }
                        [data-flat-posts] [data-post-id]::before,
                        [data-flat-posts] [data-post-id]::after,
                        [data-flat-posts] [data-business-post-id]::before,
                        [data-flat-posts] [data-business-post-id]::after {
                            display: none !important;
                        }
                        [data-flat-posts] [data-post-id] > .MuiCardActions-root,
                        [data-flat-posts] [data-business-post-id] > .MuiCardActions-root,
                        [data-flat-posts] [data-profile-post-id] .MuiCardActions-root {
                            padding: 0 !important;
                            border: none !important;
                        }
                        /* Location wrapper: shrink to fit-content so hover only fires on actual text */
                        [data-flat-posts] :has(> .post-loc-icon) {
                            width: fit-content !important;
                            max-width: fit-content !important;
                            margin-left: auto !important;
                        }
                        /* ── Hide the built-in small square thumbnails in ALL post card types ──
                           CommunityPostCard, BusinessPostCard, and MusicPostCardItem all render
                           a ~150px square img[loading="lazy"] thumbnail. We hide them so only
                           the full-width PostPhotoGrid renders instead. */
                        [data-flat-posts] [data-post-id] img[loading="lazy"][alt=""],
                        [data-flat-posts] [data-profile-post-id] img[loading="lazy"][alt=""],
                        [data-flat-posts] [data-business-post-id] img[loading="lazy"][alt=""] {
                            display: none !important;
                        }
                        /* Hide the parent container that wraps the thumbnail + "+N more" badge */
                        [data-flat-posts] [data-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                        [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]),
                        [data-flat-posts] [data-business-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"][alt=""]) {
                            display: none !important;
                        }
                        [data-flat-posts] [data-profile-post-id] .MuiBox-root:has(> .MuiBox-root > img[loading="lazy"]) {
                            display: none !important;
                        }
                        /* ── Zero out internal padding on Business/Music cards to match community flat style ── */
                        [data-flat-posts] [data-business-post-id] > .MuiBox-root,
                        [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiBox-root,
                        [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiBox-root {
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                            padding-top: 0 !important;
                        }
                        [data-flat-posts] [data-business-post-id] > .MuiCardActions-root,
                        [data-flat-posts] [data-profile-post-id] > .MuiCard-root > .MuiCardActions-root,
                        [data-flat-posts] [data-profile-post-id] > .MuiPaper-root > .MuiCardActions-root,
                        [data-flat-posts] [data-profile-post-id] .MuiCardActions-root {
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                            padding-bottom: 0 !important;
                            border-top: none !important;
                            margin-top: 0 !important;
                        }
                        /* Restore MusicPostCardItem inner padding — prevents body text flush-left */
                        [data-flat-posts] .music-post-card > .MuiBox-root {
                            padding-left: 16px !important;
                            padding-right: 16px !important;
                        }
                        [data-flat-posts] .music-post-card > .MuiCardActions-root {
                            padding-left: 16px !important;
                            padding-right: 16px !important;
                        }
                    `}</style>
                    {arr.map((p) => {
                        const pType = String(p?.postType || '').toLowerCase();
                        const cardKey = `${p.category || 'post'}-${p.id}`;
                        // Show user card popover when clicking user areas.
                        // For business/artist posts, always show the card (even if the profile owner authored it,
                        // because tapping should show the business/music page card).
                        // For community posts by the profile owner, suppress (we're already on their profile).
                        const isOwner = isProfileOwnerPost(p);
                        const isBizOrArtist = pType === 'business' || pType === 'artist';
                        const cardUserHandler = (isBizOrArtist || !isOwner) ? handleOpenUserCard : undefined;

                        if (pType === 'business') {
                            return (
                                <Box
                                    key={cardKey}
                                    data-profile-post-id={String(p?.id || '')}
                                    onClick={(e) => {
                                        if (e.defaultPrevented) return;
                                        const t = e.target;
                                        if (t && typeof t.closest === 'function') {
                                            // Only bail for actual icon-buttons (like/repost/share/menu/save),
                                            // menu items, and explicit links — let card body clicks through
                                            if (t.closest('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return;
                                        }
                                        openPostWithState(p);
                                    }}
                                    sx={{
                                        cursor: 'pointer',
                                        borderBottom: '2px solid',
                                        borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                        '&:last-child': { borderBottom: 'none' },
                                        bgcolor: 'transparent',
                                        py: 2.5,
                                        px: { xs: 2, sm: 3 },
                                        transition: (t) => t.custom?.motion ? `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}` : 'background-color 180ms ease',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.07 : 0.03),
                                        },
                                    }}
                                >
                                    <BusinessPostCard
                                        post={p}
                                        user={me}
                                        hoveredId={null}
                                        setHoveredId={() => {}}
                                        onCardClick={openPostWithState}
                                        onOpenUserCard={cardUserHandler}
                                        onEditPost={(post0) => {
                                            if (!isMine) return;
                                            const pid = Number(post0?.id || 0);
                                            if (!pid) return;
                                            window.dispatchEvent(
                                                new CustomEvent('ll:communityPost:requestEdit', { detail: { postId: pid, post: post0 } })
                                            );
                                        }}
                                        onDeletePost={(post0) => {
                                            if (!isMine) return;
                                            const pid = Number(post0?.id || 0);
                                            if (!pid) return;
                                            window.dispatchEvent(
                                                new CustomEvent('ll:communityPost:requestDelete', { detail: { postId: pid, post: post0 } })
                                            );
                                        }}
                                        renderBeforeActions={(() => { const urls = extractMediaUrls(p); return urls.length > 0 ? <PostPhotoGrid mediaUrls={urls} /> : null; })()}
                                    />
                                </Box>
                            );
                        }

                        if (pType === 'artist') {
                            return (
                                <Box key={cardKey} data-profile-post-id={String(p?.id || '')}
                                     onClick={(e) => {
                                         if (e.defaultPrevented) return;
                                         const t = e.target;
                                         if (t && typeof t.closest === 'function') {
                                             if (t.closest('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return;
                                         }
                                         openPostWithState(p);
                                     }}
                                     sx={{
                                         borderBottom: '2px solid',
                                         borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                         '&:last-child': { borderBottom: 'none' },
                                         bgcolor: 'transparent',
                                         py: 2.5,
                                         px: { xs: 2, sm: 3 },
                                         cursor: 'pointer',
                                         transition: (t) => t.custom?.motion ? `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}` : 'background-color 180ms ease',
                                         overflow: 'hidden',
                                         '&:hover': {
                                             bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.07 : 0.03),
                                         },
                                     }}>
                                    <MusicPostCardItem
                                        post={p}
                                        user={me}
                                        hoveredId={null}
                                        setHoveredId={() => {}}
                                        onCardClick={openPostWithState}
                                        onOpenUserCard={cardUserHandler}
                                        onEditPost={(post0) => {
                                            if (!isMine) return;
                                            const pid = Number(post0?.id || 0);
                                            if (!pid) return;
                                            window.dispatchEvent(
                                                new CustomEvent('ll:communityPost:requestEdit', { detail: { postId: pid, post: post0 } })
                                            );
                                        }}
                                        onDeletePost={(post0) => {
                                            if (!isMine) return;
                                            const pid = Number(post0?.id || 0);
                                            if (!pid) return;
                                            window.dispatchEvent(
                                                new CustomEvent('ll:communityPost:requestDelete', { detail: { postId: pid, post: post0 } })
                                            );
                                        }}
                                        onOpenShare={(post0) => {
                                            setSharePost(post0);
                                            setShareOpen(true);
                                        }}
                                        renderBeforeActions={(() => { const urls = extractMediaUrls(p); return urls.length > 0 ? <PostPhotoGrid mediaUrls={urls} /> : null; })()}
                                    />
                                </Box>
                            );
                        }

                        // Default: community post
                        return (
                            <Box key={cardKey} data-profile-post-id={String(p?.id || '')}
                                 onClick={(e) => {
                                     if (e.defaultPrevented) return;
                                     const t = e.target;
                                     if (t && typeof t.closest === 'function') {
                                         if (t.closest('.MuiIconButton-root, [role="menuitem"], [role="button"], .MuiMenuItem-root, a[href], .MuiChip-root')) return;
                                     }
                                     openPostWithState(p);
                                 }}
                                 sx={{
                                     borderBottom: '2px solid',
                                     borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                     '&:last-child': { borderBottom: 'none' },
                                     bgcolor: 'transparent',
                                     py: 2.5,
                                     px: { xs: 2, sm: 3 },
                                     cursor: 'pointer',
                                     transition: (t) => t.custom?.motion ? `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}` : 'background-color 180ms ease',
                                     overflow: 'hidden',
                                     '&:hover': {
                                         bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.07 : 0.03),
                                     },
                                 }}>
                                <ProfilePostCard
                                    post={p}
                                    user={me}
                                    hoveredId={null}
                                    setHoveredId={() => {}}
                                    onCardClick={openPostWithState}
                                    onEditPost={(post0) => {
                                        if (!isMine) return;
                                        const pid = Number(post0?.id || 0);
                                        if (!pid) return;
                                        window.dispatchEvent(
                                            new CustomEvent('ll:communityPost:requestEdit', { detail: { postId: pid, post: post0 } })
                                        );
                                    }}
                                    onDeletePost={(post0) => {
                                        if (!isMine) return;
                                        const pid = Number(post0?.id || 0);
                                        if (!pid) return;
                                        window.dispatchEvent(
                                            new CustomEvent('ll:communityPost:requestDelete', { detail: { postId: pid, post: post0 } })
                                        );
                                    }}
                                    onOpenUserCard={cardUserHandler}
                                    onOpenShare={(post0) => {
                                        setSharePost(post0);
                                        setShareOpen(true);
                                    }}
                                    renderBeforeActions={(() => { const urls = extractMediaUrls(p); return urls.length > 0 ? <PostPhotoGrid mediaUrls={urls} /> : null; })()}
                                />
                            </Box>
                        );
                    })}
                    <Box ref={sentinelRef} sx={{ height: 1 }} />
                </Box>
            );
        },
        [activeCanView, engagementLoading, engagementError, tab, me, openPostWithState, isMine, isScrollBox, blockLocationClicks, searchQuery, category, isProfileOwnerPost, handleOpenUserCard]
    );


    const renderComments = useCallback(
        (items) => {
            if (!activeCanView) {
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Box
                            sx={(t) => ({
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                bgcolor: alpha(t.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            })}
                        >
                            <Typography sx={{ fontSize: 28 }}>🔒</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            This section is private.
                        </Typography>
                    </Box>
                );
            }

            if (engagementLoading && tab !== 0) {
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Loading…
                        </Typography>
                    </Box>
                );
            }

            if (engagementError && tab !== 0) {
                return (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                            {engagementError}
                        </Alert>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                                setEngagementLoaded(false);
                                setEngagementError('');
                            }}
                            sx={{
                                textTransform: 'none',
                                borderColor: "primary.main",
                                color: "primary.main",
                            }}
                        >
                            Retry
                        </Button>
                    </Box>
                );
            }

            // Group comments by post_id (same as SocialHome)
            const groupMap = new Map();
            const groupOrder = [];
            const arr = Array.isArray(items) ? items : [];
            arr.forEach((c) => {
                const post = c?.post && typeof c.post === 'object' ? c.post : null;
                const pid = Number(post?.id ?? c?.post_id ?? 0);
                if (!Number.isFinite(pid) || pid <= 0) return;
                if (!groupMap.has(pid)) {
                    const g = { post: post || {}, post_id: pid, comments: [], postType: c?.postType || 'community' };
                    groupMap.set(pid, g);
                    groupOrder.push(g);
                }
                groupMap.get(pid).comments.push(c);
            });

            if (!groupOrder.length) {
                const hasSearch = searchQuery && String(searchQuery).trim().length > 0;
                const hasFilters = hasSearch || !!category || !!dateFrom || !!dateTo;
                return (
                    <Box
                        sx={{
                            px: 2,
                            pt: 10,
                            pb: 5,
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'text.primary' }}>
                            {hasFilters ? 'No comments match your filters' : 'No comments yet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 320 }}>
                            {hasFilters ? 'Try adjusting your search or filters.' : "This user hasn't commented on any posts yet."}
                        </Typography>
                    </Box>
                );
            }

            const truncate = (t, n) => {
                const s0 = String(t || '').trim();
                if (!s0) return '';
                return s0.length > n ? `${s0.slice(0, n)}…` : s0;
            };

            // Profile owner info (the commenter on this profile page)
            const ownerFirst = String(profile?.first_name || '').trim();
            const ownerLast = String(profile?.last_name || '').trim();
            const ownerFull = `${ownerFirst} ${ownerLast}`.trim();
            const ownerHandleRaw = String(profile?.handle || '').trim();
            const ownerHandle = ownerHandleRaw ? `@${ownerHandleRaw.replace(/^@/, '')}` : '';
            const ownerAvatarRaw = profile?.profile_picture || profile?.avatar_url || '';
            const ownerHasRealAvatar = Boolean(ownerAvatarRaw && !ownerAvatarRaw.includes('default_avatar') && !ownerAvatarRaw.includes('default_business') && !ownerAvatarRaw.includes('default_logo') && !ownerAvatarRaw.includes('placeholder'));
            const ownerAccountType = String(profile?.account_type || '').toLowerCase();

            return (
                <Box
                    sx={{
                        display: 'grid',
                        gap: { xs: 1.25, sm: 2 },
                        p: isScrollBox ? { xs: 1, sm: 2 } : { xs: 1.25, sm: 2.75 },
                        pb: isScrollBox ? `calc(${STICKY_FOOTER_HEIGHT}px + 12px)` : undefined,
                    }}
                >
                    {groupOrder.map((g) => {
                        const post0 = g.post;
                        const cmts = g.comments;
                        const total = cmts.length;
                        const latest = cmts[0] || null;

                        const postTitle = String(post0?.title || post0?.body || '').trim().slice(0, 80) || 'Post';
                        const postHandleRaw = String(post0?.handle || post0?.businessSlug || post0?.artistHandle || '').trim();
                        const postHandle = postHandleRaw ? `@${postHandleRaw.replace(/^@/, '')}` : '';

                        // Post author info — resolve per post-type to avoid owner-user fallback confusion
                        const postAuthorName = (() => {
                            const pType = String(g.postType || '').toLowerCase();
                            if (pType === 'business') return post0?.businessName || toName(post0) || '';
                            if (pType === 'artist') return post0?.artistName || toName(post0) || '';
                            return toName(post0) || '';
                        })().trim() || (postHandle ? postHandle : 'Someone');

                        // Only show the post author's @handle if it differs from the profile user
                        const profileHandleNorm = String(profile?.handle || '').replace(/^@+/, '').toLowerCase().trim();
                        const postHandleNorm = String(postHandleRaw || '').replace(/^@+/, '').toLowerCase().trim();
                        const showPostHandle = !!(postHandleNorm && postHandleNorm !== profileHandleNorm);

                        const postAuthorAvatarRaw = (() => {
                            const pType = String(g.postType || '').toLowerCase();
                            if (pType === 'business') {
                                return post0?.businessAvatarUrl || post0?.businessAvatar || post0?.avatar_url || post0?.profile_picture || '';
                            }
                            if (pType === 'artist') {
                                return post0?.artistAvatarUrl || post0?.artistAvatar || post0?.avatar_url || post0?.profile_picture || '';
                            }
                            // Community: avatar_url/profile_picture come from the post author (users table join)
                            return post0?.avatar_url || post0?.profile_picture || '';
                        })();
                        // Check if we have a real avatar (not a default placeholder path)
                        const hasRealAvatar = Boolean(postAuthorAvatarRaw && !postAuthorAvatarRaw.includes('default_avatar') && !postAuthorAvatarRaw.includes('default_business') && !postAuthorAvatarRaw.includes('default_logo'));
                        const postAuthorAvatar = hasRealAvatar ? postAuthorAvatarRaw : '';
                        const postAuthorPostType = String(g.postType || '').toLowerCase();

                        const postAuthorVerified = Boolean(post0?.is_verified);

                        return (
                            <Box
                                key={`comment-group-${g.post_id}`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        forceSaveEngagementState(tab);
                                        if (profileKey) {
                                            try { sessionStorage.setItem(`ll:profile:${profileKey}:restore`, '1'); } catch { /* ignore */ }
                                        }
                                        onOpenComment?.(latest ? { ...latest, _viewPostOnly: true } : latest);
                                    }
                                }}
                                onClick={() => {
                                    forceSaveEngagementState(tab);
                                    if (profileKey) {
                                        try { sessionStorage.setItem(`ll:profile:${profileKey}:restore`, '1'); } catch { /* ignore */ }
                                    }
                                    onOpenComment?.(latest ? { ...latest, _viewPostOnly: true } : latest);
                                }}
                                sx={(t) => ({
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.text.primary, 0.10),
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    boxShadow: `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                    '&:hover': { borderColor: t.palette.primary.main },
                                })}
                            >
                                {/* Post header with gradient */}
                                <Box
                                    sx={(t) => ({
                                        px: { xs: 1.25, sm: 1.5 },
                                        py: { xs: 0.75, sm: 1 },
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: { xs: 0.75, sm: 1 },
                                        background: `linear-gradient(90deg, ${alpha(
                                            t.custom?.brand?.brass || '#A87822',
                                            0.14
                                        )} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                    })}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.25 }, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                        <Avatar
                                            src={postAuthorAvatar || undefined}
                                            alt={postAuthorName}
                                            sx={(t) => ({
                                                width: { xs: 32, sm: 38 },
                                                height: { xs: 32, sm: 38 },
                                                flexShrink: 0,
                                                ...(!postAuthorAvatar ? {
                                                    bgcolor: alpha(t.palette.primary.main, 0.10),
                                                    color: t.palette.primary.main,
                                                } : {}),
                                            })}
                                        >
                                            {!postAuthorAvatar && postAuthorPostType === 'business' && <StorefrontOutlinedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                                            {!postAuthorAvatar && postAuthorPostType === 'artist' && <MusicNoteRoundedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                                            {!postAuthorAvatar && postAuthorPostType !== 'business' && postAuthorPostType !== 'artist' && <PersonRoundedIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                            <Typography
                                                sx={{ fontWeight: 900, fontSize: { xs: '0.85rem', sm: '1rem' }, lineHeight: 1.2 }}
                                                noWrap
                                                title={String(post0?.title || '')}
                                            >
                                                {postTitle}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', lineHeight: 1.3, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                                {postAuthorName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.3, fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                                                {showPostHandle ? postHandle : ''}
                                                {latest?.created_at ? `${showPostHandle ? ' • ' : ''}${formatTimeAgo(latest.created_at)}` : ''}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            forceSaveEngagementState(tab);
                                            if (profileKey) {
                                                try { sessionStorage.setItem(`ll:profile:${profileKey}:restore`, '1'); } catch { /* ignore */ }
                                            }
                                            const first = cmts[0] || null;
                                            if (first) {
                                                onOpenComment?.({ ...first, _viewPostOnly: true });
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                forceSaveEngagementState(tab);
                                                if (profileKey) {
                                                    try { sessionStorage.setItem(`ll:profile:${profileKey}:restore`, '1'); } catch { /* ignore */ }
                                                }
                                                const first = cmts[0] || null;
                                                if (first) {
                                                    onOpenComment?.({ ...first, _viewPostOnly: true });
                                                }
                                            }
                                        }}
                                        sx={(t) => ({
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.4,
                                            px: { xs: 0.75, sm: 1.1 },
                                            py: { xs: 0.3, sm: 0.4 },
                                            borderRadius: 999,
                                            flexShrink: 0,
                                            border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                            bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.12 : 0.06),
                                            cursor: 'pointer',
                                            transition: 'all 150ms ease',
                                            '&:hover': {
                                                bgcolor: alpha(t.custom?.brand?.brass || '#A87822', 0.14),
                                                borderColor: alpha(t.custom?.brand?.brass || '#A87822', 0.35),
                                            },
                                            '&:hover .MuiTypography-root': {
                                                color: t.custom?.brand?.brass || '#A87822',
                                            },
                                        })}
                                    >
                                        <ChatBubbleOutlineIcon sx={{ fontSize: { xs: 11, sm: 13 }, color: 'primary.main' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: { xs: '0.65rem', sm: '0.75rem' }, color: 'primary.main', transition: 'color 150ms ease', whiteSpace: 'nowrap' }}>
                                            {total === 1 ? '1 comment' : `${total} comments`}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Individual comment rows */}
                                <Box sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 0.75, sm: 1.25 }, display: 'grid', gap: { xs: 0.75, sm: 1 } }}>
                                    {cmts.slice(0, 3).map((c) => {
                                        const cText = String(c?.content || c?.body || '').trim();
                                        const isReply = Boolean(c?.parent_id);
                                        const cTime = c?.created_at || c?.createdAt || null;

                                        return (
                                            <Box
                                                key={`comment-${c?.id || c?.comment_id || ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    forceSaveEngagementState(tab);
                                                    if (profileKey) {
                                                        try { sessionStorage.setItem(`ll:profile:${profileKey}:restore`, '1'); } catch { /* ignore */ }
                                                    }
                                                    onOpenComment?.(c);
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onOpenComment?.(c);
                                                    }
                                                }}
                                                sx={(t) => ({
                                                    border: '1px solid',
                                                    borderColor: alpha(t.palette.text.primary, 0.08),
                                                    borderRadius: 2,
                                                    px: { xs: 1, sm: 1.25 },
                                                    py: { xs: 0.75, sm: 1 },
                                                    bgcolor: alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.06 : 0.02),
                                                    '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                })}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 0.5, sm: 1 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
                                                        <Avatar
                                                            src={ownerHasRealAvatar ? ownerAvatarRaw : undefined}
                                                            alt={ownerFull || ownerHandle || 'User'}
                                                            sx={(t) => ({
                                                                width: { xs: 28, sm: 34 },
                                                                height: { xs: 28, sm: 34 },
                                                                ...(!ownerHasRealAvatar ? {
                                                                    bgcolor: alpha(t.palette.primary.main, 0.10),
                                                                    color: t.palette.primary.main,
                                                                } : {}),
                                                            })}
                                                        >
                                                            {!ownerHasRealAvatar && ownerAccountType === 'business' && <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />}
                                                            {!ownerHasRealAvatar && ownerAccountType === 'artist' && <MusicNoteRoundedIcon sx={{ fontSize: 20 }} />}
                                                            {!ownerHasRealAvatar && ownerAccountType !== 'business' && ownerAccountType !== 'artist' && <PersonRoundedIcon sx={{ fontSize: 20 }} />}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{ fontWeight: 900, lineHeight: 1.1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                                                                noWrap
                                                                title={ownerFull || ownerHandle}
                                                            >
                                                                {ownerFull || (ownerHandle ? ownerHandle : 'User')}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                                {ownerHandle}
                                                                {isReply ? ' • Reply' : ''}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                        {cTime ? formatTimeAgo(cTime) : ''}
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: 'text.primary',
                                                        mt: 0.5,
                                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                                        whiteSpace: 'pre-wrap',
                                                        overflowWrap: 'anywhere',
                                                    }}
                                                >
                                                    {truncate(cText, 260)}
                                                </Typography>
                                                {/* Comment image preview */}
                                                {(() => {
                                                    const cImg = c?.image || (Array.isArray(c?.images) && c.images.length > 0 ? c.images[0] : null);
                                                    if (!cImg) return null;
                                                    return (
                                                        <Box
                                                            component="img"
                                                            src={cImg}
                                                            alt="comment image"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onOpenComment?.(c);
                                                            }}
                                                            sx={{
                                                                mt: 0.75,
                                                                width: 56,
                                                                height: 56,
                                                                objectFit: 'cover',
                                                                borderRadius: 1.5,
                                                                border: '1px solid',
                                                                borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                display: 'block',
                                                                flexShrink: 0,
                                                                cursor: 'pointer',
                                                                transition: 'opacity 150ms ease',
                                                                '&:hover': { opacity: 0.85 },
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </Box>
                                        );
                                    })}

                                    {total > 3 ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                                            View all comments on this post
                                        </Typography>
                                    ) : null}
                                </Box>
                            </Box>
                        );
                    })}

                    <Box ref={sentinelRef} sx={{ height: 1 }} />
                </Box>
            );
        },
        [activeCanView, engagementLoading, engagementError, tab, isScrollBox, onOpenComment, profile, forceSaveEngagementState, profileKey, searchQuery, category, dateFrom, dateTo]
    );

    // Enhanced tab styles — matched to Events sub-tabs pattern
    const tabStyles = (t) => ({
        ...getProfileSubTabsSx(t),
        minHeight: 44,
        backgroundColor: 'transparent',
        background: 'transparent',
        '& .MuiTab-root': {
            ...getProfileSubTabsSx(t)['& .MuiTab-root'],
            minHeight: 44,
            '&:focus': { outline: 'none' },
            '&:focus-visible': { outline: 'none', boxShadow: 'none' },
        },
        '& .MuiTabs-indicator': { backgroundColor: t.palette.secondary.main },
        '& .MuiTab-root.Mui-selected': { color: t.palette.secondary.main },
    });

    return (
        <Card
            ref={topRef}
            variant="outlined"
            sx={(t) => ({
                borderRadius: '24px',
                overflow: 'hidden',
                borderColor: alpha(t.palette.text.primary, 0.08),
                boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`,
                bgcolor: 'background.paper',
                backgroundImage: 'none',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                outline: 'none',
                transition: (t) => `box-shadow ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                '&:focus, &:focus-visible, &:focus-within': { outline: 'none', boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}` },
                '&:hover': {
                    boxShadow: `0 4px 16px ${alpha(t.palette.text.primary, 0.06)}`,
                },
                ...(isScrollBox ? { height: scrollBoxHeight || 680, maxHeight: scrollBoxHeight || 680 } : null),
            })}
        >
            {/* Header stack: title + tabs + filters */}
            <Box
                sx={{
                    zIndex: 5,
                    bgcolor: 'background.paper',
                }}
            >
                {/* Header */}
                <Box
                    sx={(t) => ({
                        px: { xs: 1.5, sm: 2 },
                        py: 1.25,
                        borderBottom: '1px solid',
                        borderColor: alpha(t.palette.text.primary, 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    })}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                whiteSpace: 'nowrap',
                                fontWeight: 800,
                                color: "primary.main",
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Community Activity
                        </Typography>
                    </Box>
                </Box>

                {/* Tabs */}
                <Box sx={(t) => ({ borderBottom: '1px solid', borderColor: alpha(t.palette.text.primary, 0.08) })}>
                    <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={tabStyles}>
                        <Tab
                            icon={(
                                <TabIconWrapper size={22}>
                                    <PeopleAltRoundedIcon />
                                </TabIconWrapper>
                            )}
                            iconPosition="start"
                            label={`Posts${Array.isArray(posts) && posts.length > 0 ? ` (${posts.length})` : ''}`}
                            {...a11yProps(0)}
                        />
                        <Tab
                            icon={(
                                <TabIconWrapper size={22}>
                                    <ChatBubbleOutlineIcon />
                                </TabIconWrapper>
                            )}
                            iconPosition="start"
                            label={`Comments${Array.isArray(comments) && comments.length > 0 ? ` (${comments.length})` : ''}`}
                            {...a11yProps(1)}
                        />
                        <Tab
                            icon={(
                                <TabIconWrapper size={24} squeezeX={0.9}>
                                    <FavoriteIcon />
                                </TabIconWrapper>
                            )}
                            iconPosition="start"
                            label={`Likes${Array.isArray(likes) && likes.length > 0 ? ` (${likes.length})` : ''}`}
                            {...a11yProps(2)}
                        />
                        <Tab
                            icon={(
                                <TabIconWrapper size={22}>
                                    <RepeatIcon />
                                </TabIconWrapper>
                            )}
                            iconPosition="start"
                            label={`Reposts${Array.isArray(reposts) && reposts.length > 0 ? ` (${reposts.length})` : ''}`}
                            {...a11yProps(3)}
                        />
                    </Tabs>
                </Box>

                {/* Search bar slot (injected from parent) */}
                {searchBarSlot || null}

                {/* Filters */}
                <Box
                    sx={(t) => ({
                        px: 1.5,
                        pt: 1.25,
                        pb: 1,
                        borderBottom: '1px solid',
                        borderColor: alpha(t.palette.text.primary, 0.08),
                    })}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1,
                            alignItems: 'flex-start',
                        }}
                    >
                        {/* Category — only shown on Posts tab (tab 0) */}
                        {tab === 0 && (
                            <FormControl size="small" sx={{ ...PROFILE_CONTROL_SX, flex: 3, minWidth: 0 }}>
                                <InputLabel id="profile-activity-category-label" shrink>
                                    Category
                                </InputLabel>
                                <Select
                                    labelId="profile-activity-category-label"
                                    id="profile-activity-category-select"
                                    label="Category"
                                    value={category}
                                    onChange={(e) => { setCategorySafe(String(e.target.value || '')); scrollToTop(); onScrollToTopRef.current?.(); }}
                                    displayEmpty
                                    renderValue={(val) => {
                                        const v = String(val || '').trim().toLowerCase();
                                        if (!v) return 'All Categories';
                                        const found = categoryOptions.find((c) => c.id === v);
                                        if (!found) return v;
                                        const special = SPECIAL_CATEGORY_MAP[found.id];
                                        const CatIcon = !special ? (COMMUNITY_CATEGORY_ICONS[found.id] || ForumRoundedIcon) : null;
                                        const countStr = found.count != null ? ` (${found.count})` : '';
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                {special ? (
                                                    <special.Icon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                ) : (
                                                    <CatIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                                                )}
                                                {found.label}{countStr}
                                            </Box>
                                        );
                                    }}
                                    MenuProps={profileMenuProps}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {categoryOptions.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>
                                            <PETCategoryRow catId={c.id} label={c.label} count={c.count} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Sort */}
                        <FormControl size="small" sx={{ ...PROFILE_CONTROL_SX, flex: 2, minWidth: 0 }}>
                            <InputLabel id="profile-activity-sort-label" shrink>Sort by</InputLabel>
                            <Select
                                labelId="profile-activity-sort-label"
                                label="Sort by"
                                value={sortBy}
                                onChange={(e) => { setSortBySafe(String(e.target.value || 'newest')); scrollToTop(); onScrollToTopRef.current?.(); }}
                                MenuProps={profileMenuProps}
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <MenuItem key={o.value} value={o.value}>
                                        {o.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* From date */}
                        <TextField
                            size="small"
                            type="date"
                            label="From"
                            InputLabelProps={{ shrink: true }}
                            value={dateFrom}
                            onChange={(e) => { setDateFromSafe(e.target.value || ''); scrollToTop(); onScrollToTopRef.current?.(); }}
                            sx={{
                                ...PROFILE_CONTROL_SX,
                                flex: tab === 0 ? 2.5 : 3,
                                minWidth: 0,
                                '& .MuiInputBase-input': { fontSize: 13 },
                            }}
                        />

                        {/* To date */}
                        <TextField
                            size="small"
                            type="date"
                            label="To"
                            InputLabelProps={{ shrink: true }}
                            value={dateTo}
                            onChange={(e) => { setDateToSafe(e.target.value || ''); scrollToTop(); onScrollToTopRef.current?.(); }}
                            sx={{
                                ...PROFILE_CONTROL_SX,
                                flex: tab === 0 ? 2.5 : 3,
                                minWidth: 0,
                                '& .MuiInputBase-input': { fontSize: 13 },
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Body: internal scroll area + pinned footer */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: isScrollBox ? 1 : 'unset',
                    minHeight: 0,
                }}
            >
                {/* Scroll area */}
                <Box
                    ref={scrollerRef}
                    data-profile-posts-scroll
                    className="profile-posts-scroller"
                    onClickCapture={blockLocationClicks}
                    onKeyDownCapture={blockLocationClicks}
                    sx={{
                        flex: isScrollBox ? 1 : 'unset',
                        minHeight: 0,
                        overflowY: isScrollBox ? 'auto' : 'visible',
                        overscrollBehaviorY: isScrollBox ? 'contain' : 'auto',
                    }}
                >
                    {/* Content */}
                    <Box
                        sx={{
                            p: 0,
                            minHeight: isScrollBox ? '100%' : 0,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <TabPanel value={tab} index={0}>
                            {renderList(visibleList, {
                                title: 'No current activity',
                                body: categoryEmptyPostsBody(category),
                                icon: <PeopleAltRoundedIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
                            })}
                        </TabPanel>

                        <TabPanel value={tab} index={1}>
                            {renderComments(visibleList)}
                        </TabPanel>

                        <TabPanel value={tab} index={2}>
                            {renderList(visibleList, {
                                title: 'No liked posts',
                                body: "This user hasn't liked any posts yet.",
                                icon: <FavoriteIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
                            })}
                        </TabPanel>

                        <TabPanel value={tab} index={3}>
                            {renderList(visibleList, {
                                title: 'No reposts',
                                body: "This user hasn't reposted anything yet.",
                                icon: <RepeatIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
                            })}
                        </TabPanel>
                    </Box>
                </Box>
            </Box>

            {/* Helpers */}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
                isSelf={!!(me && me.handle === userForCard?.handle)}
                following={false}
                onFollow={() => {}}
                onMessage={() =>
                    window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: userForCard?.id } }))
                }
                onViewProfile={(u) => {
                    setUserAnchor(null);
                    navigate(`/${u.handle || u.id}`);
                }}
            />
            <SharePostDialog open={shareOpen} onClose={() => setShareOpen(false)} viewer={me} post={sharePost} />
        </Card>
    );
}