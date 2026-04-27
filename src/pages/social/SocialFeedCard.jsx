// src/pages/social/SocialHome.jsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    Collapse,
    Divider,
    DialogTitle,
    DialogContent,
    DialogActions,
    Dialog,
    Fade,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography,
    Skeleton,
    useMediaQuery,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { alpha, useTheme } from '@mui/material/styles';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed';
import ShieldIcon from '@mui/icons-material/Shield';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';

import ForumIcon from '@mui/icons-material/Forum';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RepeatIcon from '@mui/icons-material/Repeat';
import TuneIcon from '@mui/icons-material/Tune';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import NewReleasesRoundedIcon from '@mui/icons-material/NewReleasesRounded';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import LocationSearchingRoundedIcon from '@mui/icons-material/LocationSearchingRounded';
import PollRoundedIcon from '@mui/icons-material/PollRounded';
import LocalPoliceRoundedIcon from '@mui/icons-material/LocalPoliceRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import ThumbUpRoundedIcon from '@mui/icons-material/ThumbUpRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
// Icon-based fallback avatars are used instead of default_avatar_square.png
// (matching UserCardPopover pattern: PersonRoundedIcon / StorefrontOutlinedIcon / MusicNoteRoundedIcon)

import axios from '../../api/axiosInstance';
import { secureFetch } from '../../utils/secureFetch';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../components/AuthModalContext';
import { useActiveAccount } from '../../components/AccountContext';
import ProfilePostsList from '../profile/userProfile/ProfilePostsList';
import { PostCard } from '../community/PostList';
import UserCardPopover from '../../components/UserCardPopover';
import { MOBILE_BOTTOM_NAV_HEIGHT } from '../../components/Header/Header';
import NetworkErrorState, { isNetworkError } from '../../components/NetworkErrorState';
import PulsingDots from '../../components/PulsingDots';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PostPage from '../community/PostDetailModal';
import BusinessPostDetailModal from '../business/components/BusinessPostDetailModal';
import MusicPostDetailPanel from '../music/components/MusicPostDetailPanel';

// NOTE: These exist in the Local Lantern repo (used elsewhere for city/county selectors).
// If your paths differ, adjust them to match your project structure.
import cityCountyData from '../../data/cityCountyMap.json';

const api = process.env.REACT_APP_API_URL || '';

/* -------------------------------- helpers -------------------------------- */
const toName = (u) => `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim();
const toHandle = (u) => (u?.handle ? `@${u.handle}` : u?.username ? `@${u.username}` : '');

/** Build profile path based on account_type returned by the API */
function getProfilePath(u) {
    if (!u) return '/';
    const acctType = String(u.account_type || '').toLowerCase();
    if (acctType === 'business') {
        const slug = u.handle || u.business_id || u.id;
        return `/business/${encodeURIComponent(slug)}`;
    }
    if (acctType === 'artist') {
        const slug = u.handle || u.artist_id || u.id;
        return `/artist/${encodeURIComponent(slug)}`;
    }
    const slug = u.handle || u.public_id || u.id;
    return `/${encodeURIComponent(slug)}`;
}

const safeNumber = (v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
};

/** Resolve the correct detail-page path based on post category (community / business / artist). */
function getPostDetailPath(p) {
    if (!p) return '/';
    const id = Number(p?.id);
    if (!id) return '/';

    const cat = String(p?.category || p?.post_category || p?.type || '').toLowerCase();

    if (cat === 'business_post') {
        const slug = p?.businessSlug || p?.business_slug || p?.pageSlug || p?.page_slug || p?.handle || '';
        if (slug) return `/${encodeURIComponent(slug)}/posts/${id}`;
        // Fallback: use business id in URL
        const bizId = p?.businessId || p?.business_id || p?.businessPageId || p?.business_page_id || p?.pageId || p?.page_id || '';
        if (bizId) return `/business/${encodeURIComponent(bizId)}/posts/${id}`;
        return `/posts/${id}`;
    }

    if (cat === 'artist_post') {
        const handle = p?.artistHandle || p?.artist_handle || p?.handle || '';
        if (handle) return `/artist/${encodeURIComponent(handle)}/posts/${id}`;
        const artId = p?.artistId || p?.artist_id || p?.music_artist_id || '';
        if (artId) return `/artist/${encodeURIComponent(artId)}/posts/${id}`;
        return `/posts/${id}`;
    }

    return `/posts/${id}`;
}

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

/** Resolve the account type string for a user object. */
function getAcctType(u) {
    return String(u?.account_type || u?.type || '').trim().toLowerCase();
}

/**
 * Determines the "kind" of a post so we can render the right detail modal.
 *   - "artist"   → MusicPostDetailPanel
 *   - "business" → BusinessPostDetailModal
 *   - "user"     → PostPage (community)
 */
function detectPostKind(post) {
    if (!post) return "user";
    const cat = String(post?.category || post?.post_category || post?.type || '').toLowerCase();
    if (cat === 'artist_post') return "artist";
    if (cat === 'business_post') return "business";
    const hasArtist = Boolean(
        post.artist_id || post.artistId || post.artistName || post.artist_name ||
        post.artistHandle || post.artist_handle
    );
    const hasBusiness = Boolean(
        post.business_id || post.businessId || post.businessPageId ||
        post.business_page_id || post.page_id || post.pageId ||
        post.businessName || post.business_name || post.pageName || post.page_name
    );
    if (hasArtist && !hasBusiness) return "artist";
    if (hasBusiness) return "business";
    return "user";
}

const tryGet = async (urls, axiosConfig = {}) => {
    for (const u of urls.filter(Boolean)) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const res = await axios.get(u, axiosConfig);
            return res;
        } catch {
            // try next
        }
    }
    throw new Error('All GET attempts failed');
};

const tryPost = async (urls, payload, axiosConfig = {}) => {
    for (const u of urls.filter(Boolean)) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const res = await axios.post(u, payload, axiosConfig);
            return res;
        } catch {
            // try next
        }
    }
    throw new Error('All POST attempts failed');
};

const storageKey = (viewer, suffix) => {
    const id = viewer?.id || viewer?.public_id || viewer?.handle || 'anon';
    return `ll_social_${suffix}_${id}`;
};

const socialStateKey = (viewer) => storageKey(viewer, 'page_state_v1');
const socialRestoreKey = (viewer) => storageKey(viewer, 'restore_v1');
const socialFeedDataKey = (viewer) => storageKey(viewer, 'feed_data_v1');
const SOCIAL_FEED_SCROLL_KEY = 'll:social:feedScrollTop';

/** Cache feed posts + engagement + metadata to sessionStorage so data is instantly available on return */
function writeSocialFeedData(viewer, payload) {
    try {
        sessionStorage.setItem(socialFeedDataKey(viewer), JSON.stringify(payload));
    } catch {
        // ignore — quota exceeded or private browsing
    }
}

/** Read cached feed data from sessionStorage */
function readSocialFeedData(viewer) {
    try {
        const raw = sessionStorage.getItem(socialFeedDataKey(viewer));
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return null;
        return {
            posts: Array.isArray(data.posts) ? data.posts : [],
            likes: Array.isArray(data.likes) ? data.likes : [],
            reposts: Array.isArray(data.reposts) ? data.reposts : [],
            comments: Array.isArray(data.comments) ? data.comments : [],
            total: Number(data.total) || 0,
            offset: Number(data.offset) || 0,
            hasMore: Boolean(data.hasMore),
            renderCount: Number(data.renderCount) || 0,
            feedTab: Number.isFinite(Number(data.feedTab)) ? Number(data.feedTab) : 0,
        };
    } catch {
        return null;
    }
}


function normalizeSlug(v) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return '';
    if (s === 'announcements') return 'announcement';
    if (s === 'discussion') return 'community-chat';
    if (s === 'lost-found') return 'lost-and-found';
    if (s === 'public-safety') return 'public-safety-alerts';
    if (s === 'polls') return 'poll';
    return s;
}

/**
 * Split-category logic to match the user profile (ProfileEngagementTabs):
 * - recommendations-tips -> tips | recommendations (by rec_type)
 * - volunteer-* -> help-requests | volunteers (by request_kind)
 */
function deriveSplitCategory(post) {
    const raw = post?.category ?? post?.subtype ?? post?.category_slug ?? post?.category_id ?? '';
    let cat = normalizeSlug(raw);

    if (cat === 'recommendations-tips') {
        const rt = String(post?.rec_type || post?.recType || '').trim().toLowerCase();
        if (rt === 'tip' || rt === 'tips') return 'tips';
        if (rt === 'business' || rt === 'recommendation' || rt === 'recommendations') return 'recommendations';
        return 'recommendations';
    }

    if (
        cat === 'volunteer-requests' ||
        cat === 'volunteer-help-requests' ||
        cat === 'volunteer-help' ||
        cat === 'volunteer-and-help-requests'
    ) {
        const kind = String(post?.request_kind || post?.requestKind || post?.help_type || '')
            .trim()
            .toLowerCase();
        if (
            kind === 'volunteer' ||
            kind === 'volunteering' ||
            kind === 'offer' ||
            kind === 'offers' ||
            kind === 'offering'
        ) {
            return 'volunteers';
        }
        return 'help-requests';
    }

    if (cat === 'tips' || cat === 'recommendations') return cat;
    if (cat === 'help-requests' || cat === 'volunteers') return cat;

    return cat;
}

function categoryForItem(item) {
    if (!item) return '';
    if (item.post && typeof item.post === 'object') return deriveSplitCategory(item.post);
    return deriveSplitCategory(item);
}

function getLikesCount(p) {
    return Number(p?.likesCount ?? p?.likes_count ?? p?.like_count ?? p?.likes ?? 0) || 0;
}

function getDateMsForPost(p) {
    const raw = p?.posted_at || p?.postedAt || p?.date_created || p?.created_at || p?.updated_at || null;
    if (!raw) return 0;
    const d = new Date(raw);
    const ms = d.getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

function getDateMsForComment(c) {
    const raw = c?.created_at || c?.createdAt || null;
    if (!raw) return 0;
    const d = new Date(raw);
    const ms = d.getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

/** Get searchable text from a post for client-side filtering */
function getSearchTextForPost(p) {
    if (!p) return '';
    return [
        p.title, p.description, p.body,
        p.first_name, p.last_name, p.handle,
        p.businessName, p.business_name, p.pageName, p.page_name,
        p.artistName, p.artist_name, p.artistHandle, p.artist_handle,
    ].filter(Boolean).join(' ').toLowerCase();
}

/** Get the account type key for a post: 'personal', 'business', or 'artist' */
function getPostAccountType(p) {
    const kind = detectPostKind(p);
    if (kind === 'business') return 'business';
    if (kind === 'artist') return 'artist';
    return 'personal';
}

const COMMUNITY_CATEGORIES = [
    { id: '', label: 'All Categories', Icon: PeopleRoundedIcon },
    { id: 'announcement', label: 'Announcements', Icon: CampaignRoundedIcon },
    { id: 'community-chat', label: 'General Discussion', Icon: QuestionAnswerRoundedIcon },
    { id: 'lost-and-found', label: 'Lost & Found', Icon: LocationSearchingRoundedIcon },
    { id: 'poll', label: 'Polls', Icon: PollRoundedIcon },
    { id: 'public-safety-alerts', label: 'Public Safety Alerts', Icon: LocalPoliceRoundedIcon },
    { id: 'tips', label: 'Tips', Icon: LightbulbRoundedIcon },
    { id: 'recommendations', label: 'Recommendations', Icon: ThumbUpRoundedIcon },
    { id: 'help-requests', label: 'Help Requests', Icon: PanToolRoundedIcon },
    { id: 'volunteers', label: 'Volunteers', Icon: VolunteerActivismRoundedIcon },
];

const BUSINESS_CATEGORIES = [
    { id: '', label: 'All Categories', Icon: StorefrontOutlinedIcon },
    { id: 'update', label: 'Updates', Icon: NewReleasesRoundedIcon },
    { id: 'announcement', label: 'Announcements', Icon: CampaignRoundedIcon },
    { id: 'deal', label: 'Deals', Icon: LocalOfferRoundedIcon },
];

const ALL_POST_CATEGORIES = [
    { id: '', label: 'All Categories', Icon: PeopleRoundedIcon },
];

/** Returns the correct category list based on selected account type filter */
function getCategoriesForType(accountType) {
    if (accountType === 'personal') return COMMUNITY_CATEGORIES;
    if (accountType === 'business') return BUSINESS_CATEGORIES;
    // artist posts and "All Types" don't have subcategories
    return ALL_POST_CATEGORIES;
}

/** Reusable row for category Select items — icon + label, matching CommunityFilter style */
function CategoryRow({ icon: IconComp, label }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {IconComp ? (
                <IconComp sx={{ fontSize: 20, flexShrink: 0, color: 'primary.main' }} />
            ) : (
                <Box sx={{ width: 20, height: 20, flexShrink: 0 }} />
            )}
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </Typography>
        </Box>
    );
}

const SORT_OPTIONS = [
    { value: 'any', label: 'Any' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most Popular' },
];

const DATE_RANGE_OPTIONS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

const ACCOUNT_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'personal', label: 'People' },
    { value: 'business', label: 'Businesses' },
    { value: 'artist', label: 'Artists' },
];


const ALL_COUNTIES_LABEL = 'All Counties';
const ALL_CITIES_LABEL = 'All Cities';


const normalizeCountyName = (name) => String(name || '').replace(/\s+County$/i, '').trim();


const PAGE_SIZE = 25;

/* --------------------------------- cards --------------------------------- */
function UserCard({
                      user,
                      onOpenUserCard,
                      onGoProfile,
                      hideMenu = false,
                      actionLabel = '',
                      actionVariant = 'contained',
                      actionDisabled = false,
                      onAction,
                      locationText,
                      compact = false,
                  }) {
    const theme = useTheme();

    const goProfile = () => {
        if (!user) return;
        const acctType = String(user?.account_type || '').toLowerCase();
        if (typeof onGoProfile === 'function' && acctType !== 'business' && acctType !== 'artist') {
            const slug = user?.handle || user?.public_id || user?.id;
            if (slug) onGoProfile(slug);
            return;
        }
        window.location.assign(getProfilePath(user));
    };

    const computedLocationText = (() => {
        if (locationText !== undefined) return String(locationText || '').trim();
        const city = user?.home_city || user?.city || '';
        const county = user?.home_county || user?.county || '';
        const parts = [city, county].filter(Boolean);
        const locText = parts.join(', ') || county || city || '';
        return String(locText || '').trim();
    })();

    const avatarSize = compact ? 32 : 54;

    return (
        <Paper
            variant="outlined"
            sx={{
                p: compact ? 0.75 : 1.5,
                borderRadius: compact ? 2 : 3,
                width: '100%',
                ...(compact ? {} : { height: 82 }),
                bgcolor: 'background.paper',
                borderColor: (t) => alpha(t.palette.text.primary, 0.12),
                boxShadow: compact ? 'none' : ((t) => `0 10px 26px ${alpha(t.palette.text.primary, 0.06)}`),
                transition: (t) => `transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.fast}ms ${t.custom.motion.ease}, border-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                '&:hover': {
                    transform: 'none',
                    boxShadow: (t) => `0 14px 34px ${alpha(t.palette.text.primary, 0.08)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.35),
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.75 : 1.5 }}>
                {(() => {
                    const avatarUrl = user?.avatar_url || user?.profile_picture || '';
                    const showIcon = isDefaultAvatar(avatarUrl);
                    const acctType = getAcctType(user);
                    const isBiz = acctType === 'business';
                    const isArt = acctType === 'artist';
                    const userProfileType = String(user?.profile_type || user?.profileType || '').toLowerCase();
                    const isVisualArtist = isArt && userProfileType === 'artist';

                    return (
                        <Avatar
                            src={showIcon ? undefined : avatarUrl}
                            sx={(t) => ({
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: '50%',
                                border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                boxShadow: compact ? 'none' : `0 6px 16px ${alpha(t.palette.text.primary, 0.08)}`,
                                cursor: 'pointer',
                                flexShrink: 0,
                                ...(showIcon
                                        ? (isBiz || isArt)
                                            ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main }
                                            : { bgcolor: alpha(t.palette.text.primary, 0.06), color: t.palette.text.secondary }
                                        : null
                                ),
                            })}
                            onClick={goProfile}
                        >
                            {showIcon
                                ? isBiz
                                    ? <StorefrontOutlinedIcon sx={{ fontSize: compact ? 16 : 28 }} />
                                    : isArt
                                        ? (isVisualArtist
                                            ? <PaletteRoundedIcon sx={{ fontSize: compact ? 15 : 26 }} />
                                            : <MusicNoteRoundedIcon sx={{ fontSize: compact ? 15 : 26 }} />)
                                        : <PersonRoundedIcon sx={{ fontSize: compact ? 16 : 28 }} />
                                : null}
                        </Avatar>
                    );
                })()}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                        variant={compact ? 'body2' : 'subtitle1'}
                        noWrap
                        sx={{ cursor: 'pointer', fontWeight: 900, letterSpacing: 0.1, fontSize: compact ? '0.78rem' : undefined, lineHeight: compact ? 1.2 : undefined }}
                        onClick={goProfile}
                        title={toName(user)}
                    >
                        {toName(user) || toHandle(user) || '(name hidden)'}
                    </Typography>
                    <Typography
                        variant={compact ? 'caption' : 'body2'}
                        color="text.secondary"
                        noWrap
                        title={toHandle(user)}
                        sx={{ cursor: 'pointer', fontSize: compact ? '0.68rem' : undefined, lineHeight: compact ? 1.2 : undefined, mt: compact ? '-1px' : undefined }}
                        onClick={goProfile}
                    >
                        {toHandle(user)}
                    </Typography>

                    {!compact && computedLocationText ? (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{ mt: 0.25, display: 'block' }}
                            title={computedLocationText}
                        >
                            {computedLocationText}
                        </Typography>
                    ) : null}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.5 : 1, flexShrink: 0 }}>
                    {actionLabel ? (
                        <Button
                            size="small"
                            variant={actionVariant}
                            onClick={() => (typeof onAction === 'function' ? onAction(user) : null)}
                            disabled={actionDisabled}
                            sx={{
                                borderRadius: 999,
                                textTransform: 'none',
                                fontWeight: 900,
                                px: compact ? 1 : 1.25,
                                minWidth: compact ? 0 : 108,
                                whiteSpace: 'nowrap',
                                fontSize: compact ? '0.68rem' : undefined,
                                py: compact ? 0.15 : undefined,
                                minHeight: compact ? 0 : undefined,
                                lineHeight: compact ? 1.3 : undefined,
                                ...(actionVariant === 'outlined'
                                    ? { bgcolor: 'background.paper' }
                                    : null),
                            }}
                        >
                            {actionLabel}
                        </Button>
                    ) : null}

                    {!hideMenu ? (
                        <IconButton size="small" onClick={(e) => onOpenUserCard(e.currentTarget, user)}>
                            <MoreHorizIcon fontSize="small" />
                        </IconButton>
                    ) : null}
                </Box>
            </Box>
        </Paper>
    );
}



// Icon gold — uses theme secondary.main

function TabIconWrapper({ children, size = 22, squeezeX = 1 }) {
    const sx = Number(squeezeX) || 1;
    const fontSize = typeof size === 'number' ? size : 22;

    if (!React.isValidElement(children)) return null;

    return (
        <Box
            sx={{
                mr: 0.9,
                display: 'flex',
                alignItems: 'center',
                transform: sx === 1 ? 'none' : `scaleX(${sx})`,
                transformOrigin: 'center',
                filter: (t) => `drop-shadow(0 1px 0 ${alpha(t.palette.text.primary, 0.12)})`,
            }}
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

/* ------------------------------ skeletons ------------------------------ */
function FeedSkeletonCard({ variant = 'post' }) {
    const isComment = variant === 'comment';
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                boxShadow: (t) => `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
            }}
        >
            <Box sx={{ p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Skeleton variant="circular" width={42} height={42} animation="wave" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton variant="text" width="42%" animation="wave" />
                    <Skeleton variant="text" width="30%" animation="wave" />
                </Box>
                <Skeleton variant="rounded" width={96} height={26} animation="wave" />
            </Box>

            <Box sx={{ px: 2, pb: 1.75 }}>
                <Skeleton variant="text" width="70%" animation="wave" />
                <Skeleton variant="text" width="92%" animation="wave" />
                <Skeleton variant="text" width="80%" animation="wave" />
                {isComment ? <Skeleton variant="rounded" height={64} animation="wave" sx={{ mt: 1 }} /> : null}
            </Box>

            <Box sx={{ px: 2, pb: 2 }}>
                <Skeleton variant="rounded" height={36} animation="wave" />
            </Box>
        </Paper>
    );
}



/* ── Tab indices (stable, never changes) ───────────────────── */
const TAB = Object.freeze({
    FEED: 0,
    PEOPLE: 1,
    FOLLOWING: 2,
    FOLLOWERS: 3,
    SAFETY: 4,
});

/* --------------------------------- page ---------------------------------- */
export default function SocialHome({ me }) {
    const theme = useTheme();
    const auth = useAuth?.() || { open: () => {} };

    // Try to use AccountContext, but fallback to reading localStorage directly
    const accountContext = useActiveAccount();

    // Read active account directly from localStorage as a fallback source
    const [localStorageAccount, setLocalStorageAccount] = useState(() => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    // Listen for account changes
    useEffect(() => {
        const handleAccountChanged = (e) => {
            const nextAccount = e?.detail?.account || null;
            if (nextAccount && typeof nextAccount === 'object') {
                setLocalStorageAccount(nextAccount);
            } else {
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    setLocalStorageAccount(raw ? JSON.parse(raw) : null);
                } catch {
                    setLocalStorageAccount(null);
                }
            }
        };

        const handleStorage = (e) => {
            if (e.key === 'll:activeAccount') {
                try {
                    setLocalStorageAccount(e.newValue ? JSON.parse(e.newValue) : null);
                } catch {
                    setLocalStorageAccount(null);
                }
            }
        };

        window.addEventListener('ll:account:changed', handleAccountChanged);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('ll:account:changed', handleAccountChanged);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    // Use AccountContext as the primary source of truth (same as ActionBar),
    // falling back to localStorage only when the context has no account data.
    // The old approach used localStorage first, which could be stale or missing
    // the artist type — causing artist accounts to show personal data.
    const activeAccount = accountContext.activeAccount || localStorageAccount;
    const isBusinessAccount = accountContext.isBusinessAccount || activeAccount?.type === 'business';
    const isArtistAccount = accountContext.isArtistAccount || activeAccount?.type === 'artist';
    const activeAccountId = (isBusinessAccount
        ? (accountContext.activeBusinessId || activeAccount?.id)
        : isArtistAccount
            ? (accountContext.activeArtistId || activeAccount?.id)
            : activeAccount?.id) || 'personal';
    const activeAccountType = isBusinessAccount ? 'business' : isArtistAccount ? 'artist' : (activeAccount?.type || 'personal');

    const navigate = useNavigate();
    const location = useLocation();

    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [pageIn, setPageIn] = useState(false);

    useEffect(() => {
        setPageIn(false);
        const raf = window.requestAnimationFrame(() => setPageIn(true));
        return () => window.cancelAnimationFrame(raf);
    }, [location.pathname]);


    /* -------- viewport-fit layout (same intent as current page) -------- */
    const pageRef = useRef(null);
    const [availableHeight, setAvailableHeight] = useState(null);

    const measureAvailableHeight = useCallback(() => {
        if (!pageRef.current) return;
        const rect = pageRef.current.getBoundingClientRect();
        const bottomOffset = isMobile ? MOBILE_BOTTOM_NAV_HEIGHT : 0;
        const h = Math.max(0, window.innerHeight - rect.top - bottomOffset);
        setAvailableHeight(h);
    }, [isMobile]);

    useLayoutEffect(() => {
        measureAvailableHeight();
        const raf = window.requestAnimationFrame(measureAvailableHeight);
        return () => window.cancelAnimationFrame(raf);
    }, [measureAvailableHeight]);

    useEffect(() => {
        window.addEventListener('resize', measureAvailableHeight);
        return () => window.removeEventListener('resize', measureAvailableHeight);
    }, [measureAvailableHeight]);

    /* -------------------------- viewer bootstrap -------------------------- */
    const [meLocal, setMeLocal] = useState(null);
    const [meResolved, setMeResolved] = useState(Boolean(me) || Boolean(auth?.user));

    useEffect(() => {
        // If parent prop or auth context already has the user, we’re “resolved”.
        if (me || auth?.user) {
            setMeResolved(true);
            return;
        }

        let alive = true;
        secureFetch('/users/profile', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => {
                if (!alive) return;
                setMeLocal(j?.user || null);
                setMeResolved(true);
            })
            .catch(() => {
                if (!alive) return;
                setMeLocal(null);
                setMeResolved(true);
            });

        return () => {
            alive = false;
        };
    }, [me, auth?.user]);

    // ── Stable viewer reference ──
    // me / auth?.user / meLocal may be new object references on every render
    // even when the underlying data hasn't changed. Using the raw object in
    // useCallback / useEffect deps would recreate callbacks every render,
    // causing infinite setState → render → effect → setState loops.
    const viewerRaw = me || auth?.user || meLocal || null;
    const viewerId = Number(viewerRaw?.id || 0) || 0;
    const viewerHandle = viewerRaw?.handle || '';
    const viewerPublicId = viewerRaw?.public_id || '';

    // Memoize so the reference is stable when the identity fields haven't changed.
    const viewer = useMemo(
        () => viewerRaw,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [viewerId, viewerHandle, viewerPublicId]
    );

    // Keep a ref so async callbacks can always read the latest viewer without
    // needing it in their dependency arrays (which would destabilize them).
    const viewerRef = useRef(viewer);
    viewerRef.current = viewer;

    const isLoggedIn = Boolean(viewer?.id || viewer?.handle);

    /* ------------------------------ state ------------------------------ */

    const [tab, setTab] = useState(() => {
        // Old: 0 Feed, 1 Activity, 2 People, 3 Following, 4 Followers, 5 Safety
        // New: 0 Feed, 1 People, 2 Following, 3 Followers, 4 Safety
        try {
            const raw = localStorage.getItem('ll_social_last_tab');
            const n = Number(raw);
            if (!Number.isFinite(n)) return TAB.FEED;
            if (n === 0) return TAB.FEED;
            if (n === 1) return TAB.FEED;
            if (n === 2) return TAB.PEOPLE;
            if (n === 3) return TAB.FOLLOWING;
            if (n === 4) return TAB.FOLLOWERS;
            if (n === 5) return TAB.SAFETY;
            return TAB.FEED;
        } catch {
            return TAB.FEED;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('ll_social_last_tab', String(tab));
        } catch {
            // ignore
        }
    }, [tab]);


    // Decide initial tab once on entry:
    // - If not logged in: force Find People
    // - If navigated with an intent (e.g., "People you may know"): honor it
    // - Otherwise: default to Feed (and reset feed sub-tab)
    const initialTabAppliedRef = useRef(false);

    useEffect(() => {
        if (initialTabAppliedRef.current) return;
        if (!meResolved) return;

        // If we're restoring from a post-page return, skip the default tab reset.
        // The restore effect will handle setting the correct tab + feedTab from the
        // saved state. Without this guard, setFeedTab(0) below fires before the
        // restore effect runs, clearing the saved sub-tab (Comments/Likes/Reposts).
        if (socialShouldRestoreRef.current === true || location?.state?.restoreSocial) {
            initialTabAppliedRef.current = true;
            return;
        }

        const stateTab = location?.state?.socialTab || location?.state?.openTab || '';
        const params = new URLSearchParams(location.search || '');
        const queryTab = params.get('tab') || '';
        const intent = String(stateTab || queryTab || '').trim().toLowerCase();

        if (!isLoggedIn) {
            setTab(TAB.PEOPLE);
            initialTabAppliedRef.current = true;
            return;
        }

        if (intent === 'people' || intent === 'find-people' || intent === 'findpeople') {
            setTab(TAB.PEOPLE);
            initialTabAppliedRef.current = true;
            return;
        }

        if (intent === 'followers') {
            setTab(TAB.FOLLOWERS);
            initialTabAppliedRef.current = true;
            return;
        }

        if (intent === 'following') {
            setTab(TAB.FOLLOWING);
            initialTabAppliedRef.current = true;
            return;
        }

        if (intent === 'safety') {
            setTab(TAB.SAFETY);
            initialTabAppliedRef.current = true;
            return;
        }

        setTab(TAB.FEED);
        setFeedTab(0);
        initialTabAppliedRef.current = true;
    }, [meResolved, isLoggedIn, location.key, location.search, TAB.FEED, TAB.PEOPLE]);





    // Honor navigation intents whenever the route changes (works even if SocialHome is already mounted).
    // Example: navigate('/social', { state: { socialTab: 'people' } })
    const navIntentSigRef = useRef('');

    useEffect(() => {
        if (!isLoggedIn) return;

        const stateTab = location?.state?.socialTab || location?.state?.openTab || '';
        const params = new URLSearchParams(location.search || '');
        const queryTab = params.get('tab') || '';

        const intent = String(stateTab || queryTab || '').trim().toLowerCase();
        if (!intent) return;

        const sig = `${location?.key || ''}:${intent}`;
        if (navIntentSigRef.current === sig) return;

        if (intent === 'people' || intent === 'find-people' || intent === 'findpeople') {
            setTab(TAB.PEOPLE);
        } else if (intent === 'followers') {
            setTab(TAB.FOLLOWERS);
        } else if (intent === 'following') {
            setTab(TAB.FOLLOWING);
        } else if (intent === 'safety') {
            setTab(TAB.SAFETY);
        }

        navIntentSigRef.current = sig;
    }, [isLoggedIn, location.key, location.search, location.state, TAB.PEOPLE, TAB.FOLLOWERS, TAB.FOLLOWING]);
// People filters (wait for Search button)
    const [peopleSearch, setPeopleSearch] = useState('');
    const [peopleCounty, setPeopleCounty] = useState('');
    const [peopleCity, setPeopleCity] = useState('');

    // Following / Followers search (applied on Search button, like Find People)
    const [followingSearch, setFollowingSearch] = useState('');
    const [followingSearchApplied, setFollowingSearchApplied] = useState('');
    const [followersSearch, setFollowersSearch] = useState('');
    const [followersSearchApplied, setFollowersSearchApplied] = useState('');

    const [followingCounty, setFollowingCounty] = useState('');
    const [followingCity, setFollowingCity] = useState('');
    const [followingCountyApplied, setFollowingCountyApplied] = useState('');
    const [followingCityApplied, setFollowingCityApplied] = useState('');

    const [followersCounty, setFollowersCounty] = useState('');
    const [followersCity, setFollowersCity] = useState('');
    const [followersCountyApplied, setFollowersCountyApplied] = useState('');
    const [followersCityApplied, setFollowersCityApplied] = useState('');

    // Out-of-state toggle for People / Following / Followers
    const [peopleOutOfState, setPeopleOutOfState] = useState(false);
    const [followingOutOfState, setFollowingOutOfState] = useState(false);
    const [followersOutOfState, setFollowersOutOfState] = useState(false);

    // Account type filter for People / Following / Followers
    const [peopleAccountType, setPeopleAccountType] = useState('');
    const [followingAccountType, setFollowingAccountType] = useState('');
    const [followersAccountType, setFollowersAccountType] = useState('');

    // Feed tabs and filters (match profile behavior)
    const [feedTab, setFeedTab] = useState(() => {
        // On restore, initialize from saved state so the correct tab renders immediately
        try {
            if (viewer && sessionStorage.getItem(socialRestoreKey(viewer)) === '1') {
                const raw = sessionStorage.getItem(socialStateKey(viewer));
                if (raw) {
                    const snap = JSON.parse(raw);
                    const t = Number(snap?.feedTab);
                    if (Number.isFinite(t) && t >= 0 && t <= 3) return t;
                }
            }
        } catch {
            // ignore
        }
        return 0;
    }); // 0 posts, 1 comments, 2 likes, 3 reposts

    const [feedFilters, setFeedFilters] = useState(() => ({
        posts: { category: '', sort: 'any', dateRange: 'all', searchTerm: '', accountType: '', dateFrom: '', dateTo: '' },
        comments: { category: '', sort: 'any', dateRange: 'all', searchTerm: '', accountType: '', dateFrom: '', dateTo: '' },
        likes: { category: '', sort: 'any', dateRange: 'all', searchTerm: '', accountType: '', dateFrom: '', dateTo: '' },
        reposts: { category: '', sort: 'any', dateRange: 'all', searchTerm: '', accountType: '', dateFrom: '', dateTo: '' },
    }));

    const [loadingFeed, setLoadingFeed] = useState(false);
    const [loadingFeedMore, setLoadingFeedMore] = useState(false);
    const [loadingEngagement, setLoadingEngagement] = useState(false);
    const [feedFetchError, setFeedFetchError] = useState(null);
    const [loadingPeople, setLoadingPeople] = useState(false);
    const [loadingSafety, setLoadingSafety] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // People tab data
    const [rows, setRows] = useState([]);
    const [peopleTotal, setPeopleTotal] = useState(0);
    const [peopleOffset, setPeopleOffset] = useState(0);
    const [peopleHasMore, setPeopleHasMore] = useState(true);
    const [loadingMorePeople, setLoadingMorePeople] = useState(false);

    const [peopleRenderCount, setPeopleRenderCount] = useState(PAGE_SIZE);
    // Social graph
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [socialFetchError, setSocialFetchError] = useState(null);
    const [peopleFetchError, setPeopleFetchError] = useState(null);


    const [followingRenderCount, setFollowingRenderCount] = useState(PAGE_SIZE);
    const [followersRenderCount, setFollowersRenderCount] = useState(PAGE_SIZE);
    const [publicProfileById, setPublicProfileById] = useState({});
    const publicProfileByIdRef = useRef(publicProfileById);
    publicProfileByIdRef.current = publicProfileById;



// Cache lightweight public profile fields (city/county) so Following/Followers can display location like Find People.
    const prefetchPublicProfiles = useCallback(
        async (users) => {
            const arr = Array.isArray(users) ? users : [];
            const ids = arr
                .map((u) => Number(u?.id))
                .filter((n) => Number.isFinite(n) && n > 0);

            const unique = Array.from(new Set(ids)).slice(0, 80); // safety cap
            const currentCache = publicProfileByIdRef.current || {};
            const missing = unique.filter((id) => !currentCache[id]);

            if (!missing.length) return;

            // Limit concurrency to avoid spamming the server
            const CONC = 6;
            for (let i = 0; i < missing.length; i += CONC) {
                const batch = missing.slice(i, i + CONC);

                // eslint-disable-next-line no-await-in-loop
                const results = await Promise.allSettled(
                    batch.map(async (id) => {
                        const res = await tryGet(
                            [
                                `${api}/users/public/${id}`,
                                `/users/public/${id}`,
                                `/api/users/public/${id}`,
                            ],
                            { withCredentials: true }
                        );
                        const profile = res?.data?.profile;
                        if (!profile) return null;

                        return {
                            id: Number(profile?.id) || id,
                            city: profile?.city || profile?.home_city || '',
                            county: profile?.county || profile?.home_county || '',
                            state: profile?.state || profile?.home_state || '',
                        };
                    })
                );

                const next = {};
                results.forEach((r) => {
                    if (r.status === 'fulfilled' && r.value && r.value.id) {
                        next[r.value.id] = r.value;
                    }
                });

                if (Object.keys(next).length) {
                    setPublicProfileById((prev) => ({ ...(prev || {}), ...next }));
                }
            }
        },
        []
    );
// Feed data (from people you follow)
    // ── Capture restore intent synchronously during render (matches CommunityPage pattern) ──
    const socialShouldRestoreRef = useRef(null);
    const socialSavedScrollTopRef = useRef(0);
    const socialCachedFeedRef = useRef(null);
    if (socialShouldRestoreRef.current === null) {
        let restoreIntent = false;
        try {
            restoreIntent = sessionStorage.getItem(socialRestoreKey(viewer)) === '1';
        } catch {
            // ignore
        }
        if (!restoreIntent) {
            restoreIntent = Boolean(location?.state?.restoreSocial);
        }
        socialShouldRestoreRef.current = restoreIntent;

        if (restoreIntent) {
            try {
                socialSavedScrollTopRef.current = Number(sessionStorage.getItem(SOCIAL_FEED_SCROLL_KEY) || 0);
            } catch {
                socialSavedScrollTopRef.current = 0;
            }
            socialCachedFeedRef.current = readSocialFeedData(viewer);
        }
    }

    const cachedFeed = socialCachedFeedRef.current;
    const [feedPosts, setFeedPosts] = useState(() =>
        cachedFeed && cachedFeed.posts.length > 0 ? cachedFeed.posts : []
    );
    const [feedLikes, setFeedLikes] = useState(() =>
        cachedFeed && cachedFeed.likes.length > 0 ? cachedFeed.likes : []
    );
    const [feedReposts, setFeedReposts] = useState(() =>
        cachedFeed && cachedFeed.reposts.length > 0 ? cachedFeed.reposts : []
    );
    const [feedComments, setFeedComments] = useState(() =>
        cachedFeed && cachedFeed.comments.length > 0 ? cachedFeed.comments : []
    );

    // Server-side paging for FEED posts (community feed view=following)
    const [feedPostsTotal, setFeedPostsTotal] = useState(() =>
        cachedFeed ? cachedFeed.total : 0
    );
    const [feedPostsOffset, setFeedPostsOffset] = useState(() =>
        cachedFeed ? cachedFeed.offset : 0
    );
    const [feedPostsHasMore, setFeedPostsHasMore] = useState(() =>
        cachedFeed ? cachedFeed.hasMore : false
    );
    const [loadingMoreFeedPosts, setLoadingMoreFeedPosts] = useState(false);

    // Cache comment author profiles (because the engagement endpoint returns comment rows without
    // author name/handle/avatar). Keyed by numeric user id.
    const [commentAuthorById, setCommentAuthorById] = useState({});
    const commentAuthorByIdRef = useRef(commentAuthorById);
    commentAuthorByIdRef.current = commentAuthorById;

    const prefetchCommentAuthors = useCallback(
        async (comments) => {
            const arr = Array.isArray(comments) ? comments : [];
            const ids = arr
                .map((c) => Number(c?.user_id || c?.userId || c?.commenter_id || c?.commenterId || 0))
                .filter((n) => Number.isFinite(n) && n > 0);

            const unique = Array.from(new Set(ids)).slice(0, 80);
            const currentCache = commentAuthorByIdRef.current || {};
            const missing = unique.filter((id) => !currentCache[id]);
            if (!missing.length) return;

            const CONC = 6;
            for (let i = 0; i < missing.length; i += CONC) {
                const batch = missing.slice(i, i + CONC);

                // eslint-disable-next-line no-await-in-loop
                const results = await Promise.allSettled(
                    batch.map(async (id) => {
                        const res = await tryGet(
                            [
                                `${api}/users/public/${id}`,
                                `/users/public/${id}`,
                                `/api/users/public/${id}`,
                            ],
                            { withCredentials: true }
                        );

                        const profile = res?.data?.profile || res?.data?.user || res?.data || null;
                        if (!profile) return null;

                        return {
                            id: Number(profile?.id) || id,
                            handle: String(profile?.handle || '').trim(),
                            first_name: String(profile?.first_name || '').trim(),
                            last_name: String(profile?.last_name || '').trim(),
                            profile_picture:
                                String(profile?.profile_picture || profile?.avatar_url || '').trim(),
                            avatar_url: String(profile?.avatar_url || profile?.profile_picture || '').trim(),
                            account_type: String(profile?.account_type || '').trim(),
                            public_id: profile?.public_id || null,
                        };
                    })
                );

                const next = {};
                results.forEach((r) => {
                    if (r.status === 'fulfilled' && r.value && r.value.id) {
                        next[r.value.id] = r.value;
                    }
                });

                if (Object.keys(next).length) {
                    setCommentAuthorById((prev) => ({ ...(prev || {}), ...next }));
                }
            }
        },
        []
    );

    // Feed view helpers
    const [feedHoveredId, setFeedHoveredId] = useState(null);
    const [feedRenderCount, setFeedRenderCount] = useState(() =>
        cachedFeed && cachedFeed.renderCount > PAGE_SIZE ? cachedFeed.renderCount : PAGE_SIZE
    );

    // Moderation state
    const [moderation, setModeration] = useState({
        blocked: [],
        hiddenPosts: [],
    });

    const [blockedSearch, setBlockedSearch] = useState('');
    const [hiddenSearch, setHiddenSearch] = useState('');
    const [safetyTab, setSafetyTab] = useState(0); // 0 = Blocked, 1 = Hidden Posts

    // ── Post Preview Dialog (opens post detail in overlay instead of navigating) ──
    const [previewPost, setPreviewPost] = useState(null);
    const [previewCommentId, setPreviewCommentId] = useState(null);
    const previewScrollBoxRef = useRef(null);
    const [showFeedFilters, setShowFeedFilters] = useState(false);

    // When the preview dialog opens with a target comment, wait for it to render then scroll + highlight
    useEffect(() => {
        if (!previewPost || !previewCommentId) return;
        let attempts = 0;
        const maxAttempts = 30; // try for up to 3 seconds
        const timer = setInterval(() => {
            attempts++;
            const el = document.getElementById(`comment-${previewCommentId}`);
            if (el) {
                clearInterval(timer);
                // Scroll the dialog content to the comment
                const scrollBox = previewScrollBoxRef.current;
                if (scrollBox) {
                    const boxRect = scrollBox.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    scrollBox.scrollTop += elRect.top - boxRect.top - 80;
                }
                // Apply gold highlight with fade-out
                el.style.transition = 'background-color 0.3s ease';
                el.style.borderRadius = '8px';
                el.style.backgroundColor = 'rgba(168, 120, 34, 0.18)'; // brass/gold
                setTimeout(() => {
                    el.style.transition = 'background-color 2s ease';
                    el.style.backgroundColor = 'transparent';
                }, 2200);
            }
            if (attempts >= maxAttempts) clearInterval(timer);
        }, 100);
        return () => clearInterval(timer);
    }, [previewPost, previewCommentId]);

    // ── Edit History dialog (handles community, business, and artist posts) ──
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyPost, setHistoryPost] = useState(null);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    // Listen for the requestHistory event fired by PostCard's "Edited" link
    useEffect(() => {
        const onReqHistory = (e) => {
            const post = e?.detail?.post || null;
            const pid = Number(e?.detail?.postId || post?.id || 0);
            if (!pid) return;
            setHistoryPost(post);
            setHistoryRows([]);
            setHistoryError('');
            setHistoryOpen(true);
        };
        window.addEventListener('ll:communityPost:requestHistory', onReqHistory);
        return () => window.removeEventListener('ll:communityPost:requestHistory', onReqHistory);
    }, []);

    // Fetch edit history when the dialog opens
    useEffect(() => {
        if (!historyOpen || !historyPost) return;
        const pid = Number(historyPost?.id || 0);
        if (!pid) return;

        let alive = true;
        setHistoryLoading(true);
        setHistoryError('');

        (async () => {
            try {
                const cat = String(historyPost?.category || '').toLowerCase();
                let data = null;

                if (cat === 'business_post') {
                    const res = await secureFetch(`/api/business/posts/${encodeURIComponent(pid)}/edits`, {
                        credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
                    });
                    if (res.ok) data = await res.json();
                } else if (cat === 'artist_post') {
                    const artId = historyPost?.artistId || historyPost?.artist_id || historyPost?.music_artist_id || 0;
                    if (artId) {
                        const res = await secureFetch(`/api/music/artists/${encodeURIComponent(artId)}/posts/${encodeURIComponent(pid)}/edits`, {
                            credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
                        });
                        if (res.ok) data = await res.json();
                    }
                } else {
                    const res = await secureFetch(`/api/community/${encodeURIComponent(pid)}/edits`, {
                        credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' },
                    });
                    if (res.ok) data = await res.json();
                }

                if (!alive) return;
                const rows = Array.isArray(data) ? data : Array.isArray(data?.edits) ? data.edits : [];
                setHistoryRows(rows);
                if (!rows.length) setHistoryError('No edit history available.');
            } catch (err) {
                if (alive) setHistoryError(err?.message || 'Failed to load edit history.');
            } finally {
                if (alive) setHistoryLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [historyOpen, historyPost]);

    const counts = useMemo(
        () => ({
            following: following.length,
            followers: followers.length,
            blocked: moderation.blocked.length,
            hiddenPosts: moderation.hiddenPosts.length,
        }),
        [following, followers, moderation]
    );

    const followingIds = useMemo(() => {
        return (Array.isArray(following) ? following : [])
            .map((u) => Number(u?.id))
            .filter((n) => Number.isFinite(n) && n > 0);
    }, [following]);

    // Build a scoped identity list from the social graph so engagement
    // fetches can pass business_id / artist_id and the UI can display
    // the correct actor name, handle, and avatar without extra lookups.
    const followingIdentities = useMemo(() => {
        return (Array.isArray(following) ? following : []).map((u) => ({
            userId: Number(u?.id) || 0,
            accountType: String(u?.account_type || u?.type || '').trim().toLowerCase(),
            businessId: Number(u?.business_id || u?.businessId || 0) || 0,
            artistId: Number(u?.artist_id || u?.artistId || 0) || 0,
            handle: String(u?.handle || u?.slug || '').trim(),
            name: `${u?.first_name || ''} ${u?.last_name || ''}`.trim() || String(u?.name || '').trim(),
            avatarUrl: String(u?.avatar_url || u?.profile_picture || '').trim(),
        })).filter((u) => u.userId > 0);
    }, [following]);

    // Keep a ref so fetchFeedActivity can always read the latest followingIds
    // without needing it in its dependency array (which would destabilize it
    // and cause the auto-fetch effect to re-fire on every social graph update).
    const followingIdsRef = useRef(followingIds);
    followingIdsRef.current = followingIds;

    const followingIdentitiesRef = useRef(followingIdentities);
    followingIdentitiesRef.current = followingIdentities;

    const followingFiltered = useMemo(() => {
        const term = String(followingSearchApplied || '').trim().toLowerCase();
        const countySel = String(followingCountyApplied || '').trim().toLowerCase();
        const citySel = String(followingCityApplied || '').trim().toLowerCase();

        if (!term && !countySel && !citySel && !followingOutOfState && !followingAccountType) return following;

        return (following || []).filter((u) => {
            const id = Number(u?.id);
            const cached = Number.isFinite(id) ? publicProfileById?.[id] : null;

            const name = toName(u).toLowerCase();
            const handle = toHandle(u).toLowerCase();
            const rawUser = String(u?.username || u?.handle || '').toLowerCase();

            const city = String(cached?.city || u?.home_city || u?.city || '').trim().toLowerCase();
            const county = normalizeCountyName(String(cached?.county || u?.home_county || u?.county || ''))
                .trim()
                .toLowerCase();

            // Out-of-state filter: show only users whose state !== AL or country !== US
            if (followingOutOfState) {
                const uCountry = String(cached?.country || u?.country || 'US').trim().toUpperCase();
                const uState = String(cached?.state || u?.state || '').trim().toUpperCase();
                const isAlabama = uCountry === 'US' && (uState === 'AL' || uState === '');
                if (isAlabama) return false;
            }

            // Account type filter
            if (followingAccountType) {
                const acct = getAcctType(u);
                const normalized = acct === 'business' ? 'business' : acct === 'artist' ? 'artist' : 'personal';
                if (normalized !== followingAccountType) return false;
            }

            const matchesText = !term || name.includes(term) || handle.includes(term) || rawUser.includes(term);
            const matchesCounty = !countySel || county === normalizeCountyName(countySel).toLowerCase();
            const matchesCity = !citySel || city === citySel;

            return matchesText && matchesCounty && matchesCity;
        });
    }, [following, followingSearchApplied, followingCountyApplied, followingCityApplied, followingOutOfState, followingAccountType, publicProfileById]);

    const followersFiltered = useMemo(() => {
        const term = String(followersSearchApplied || '').trim().toLowerCase();
        const countySel = String(followersCountyApplied || '').trim().toLowerCase();
        const citySel = String(followersCityApplied || '').trim().toLowerCase();

        if (!term && !countySel && !citySel && !followersOutOfState && !followersAccountType) return followers;

        return (followers || []).filter((u) => {
            const id = Number(u?.id);
            const cached = Number.isFinite(id) ? publicProfileById?.[id] : null;

            const name = toName(u).toLowerCase();
            const handle = toHandle(u).toLowerCase();
            const rawUser = String(u?.username || u?.handle || '').toLowerCase();

            const city = String(cached?.city || u?.home_city || u?.city || '').trim().toLowerCase();
            const county = normalizeCountyName(String(cached?.county || u?.home_county || u?.county || ''))
                .trim()
                .toLowerCase();

            // Out-of-state filter
            if (followersOutOfState) {
                const uCountry = String(cached?.country || u?.country || 'US').trim().toUpperCase();
                const uState = String(cached?.state || u?.state || '').trim().toUpperCase();
                const isAlabama = uCountry === 'US' && (uState === 'AL' || uState === '');
                if (isAlabama) return false;
            }

            // Account type filter
            if (followersAccountType) {
                const acct = getAcctType(u);
                const normalized = acct === 'business' ? 'business' : acct === 'artist' ? 'artist' : 'personal';
                if (normalized !== followersAccountType) return false;
            }

            const matchesText = !term || name.includes(term) || handle.includes(term) || rawUser.includes(term);
            const matchesCounty = !countySel || county === normalizeCountyName(countySel).toLowerCase();
            const matchesCity = !citySel || city === citySel;

            return matchesText && matchesCounty && matchesCity;
        });
    }, [followers, followersSearchApplied, followersCountyApplied, followersCityApplied, followersOutOfState, followersAccountType, publicProfileById]);

    // Client-side out-of-state filter for People tab (rows come from server)
    const peopleFiltered = useMemo(() => {
        if (!peopleOutOfState && !peopleAccountType) return rows;
        return (rows || []).filter((u) => {
            if (peopleOutOfState) {
                const uCountry = String(u?.country || 'US').trim().toUpperCase();
                const uState = String(u?.state || '').trim().toUpperCase();
                const isAlabama = uCountry === 'US' && (uState === 'AL' || uState === '');
                if (isAlabama) return false;
            }
            if (peopleAccountType) {
                const acct = getAcctType(u);
                const normalized = acct === 'business' ? 'business' : acct === 'artist' ? 'artist' : 'personal';
                if (normalized !== peopleAccountType) return false;
            }
            return true;
        });
    }, [rows, peopleOutOfState, peopleAccountType]);


    /* ---------- POPUP STATE + LOGIC ---------- */
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    // Quick unfollow confirmation (prevents accidental unfollows on mobile)
    const [unfollowOpen, setUnfollowOpen] = useState(false);
    const [unfollowTarget, setUnfollowTarget] = useState(null);


// Server‑verified following set keyed by user id (target user id)
    const [serverFollowingSet, setServerFollowingSet] = useState(() => new Set());
// Local optimistic flips
    const [locallyFollowed, setLocallyFollowed] = useState(() => new Set());

    const openAuthUI = useCallback(() => {
        if (auth && typeof auth.open === 'function') {
            auth.open();
            return;
        }
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
        } catch {
            /* no-op */
        }
    }, [auth]);

    const handleGoProfile = useCallback(
        (slugOrId) => {
            const slug = String(slugOrId || '').trim();
            if (!slug) return;
            navigate(`/${encodeURIComponent(slug)}`);
        },
        [navigate]
    );


    const requireAuth = useCallback(
        (cb) => {
            if (viewerRef.current) return cb?.();


            openAuthUI();
            return undefined;
        },
        [openAuthUI]
    );

// Hydrate target from /users/public/:handleOrId to resolve numeric id and current follow state
    const hydrateTargetFromPublic = useCallback(
        async (target) => {
            if (!target) return null;
            const handleOrId = target.handle || target.public_id || target.id;
            if (!handleOrId) return null;

            const urls = [
                `${api}/users/public/${encodeURIComponent(handleOrId)}`,
                `/users/public/${encodeURIComponent(handleOrId)}`,
                `/api/users/public/${encodeURIComponent(handleOrId)}`,
            ];

            for (const u of urls.filter(Boolean)) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const res = await axios.get(u, { withCredentials: true });
                    const profile = res?.data?.profile;
                    if (!profile) continue;

                    setUserForCard((prev) => {
                        if (!prev) return prev;
                        if (!prev.id && profile.id) return { ...prev, id: profile.id };
                        return prev;
                    });

                    const sj =
                        typeof profile.social_json === 'string'
                            ? JSON.parse(profile.social_json || '{}')
                            : profile.social_json || {};
                    const theirFollowers = Array.isArray(sj?.followers) ? sj.followers : [];
                    const isF = !!viewerId && theirFollowers.includes(viewerId);
                    if (profile.id && isF) {
                        setServerFollowingSet((old) => {
                            const next = new Set(old);
                            next.add(Number(profile.id));
                            return next;
                        });
                    }
                    return profile;
                } catch {
                    // try next
                }
            }
            return null;
        },
        [viewerId]
    );

    const handleOpenUserCard = useCallback(
        (el, user) => {
            setUserAnchor(el);
            setUserForCard({
                id: user?.id,
                public_id: user?.public_id,
                first_name: user?.first_name,
                last_name: user?.last_name,
                handle: user?.handle,
                avatar_url: user?.avatar_url || user?.profile_picture,
                profile_picture: user?.profile_picture,
                account_type: user?.account_type || '',
                business_id: user?.business_id || null,
                business_name: user?.business_name || '',
                business_slug: user?.business_slug || '',
                artist_id: user?.artist_id || null,
                artist_name: user?.artist_name || '',
                artist_handle: user?.artist_handle || '',
                _entity_type: user?._entity_type || '',
                _entity_id: user?._entity_id || null,
            });
            // Only hydrate via /users/public for personal accounts
            const acctType = String(user?.account_type || '').toLowerCase();
            if (acctType !== 'business' && acctType !== 'artist') {
                hydrateTargetFromPublic(user); // fire-and-forget
            }
        },
        [hydrateTargetFromPublic]
    );

    const isSelf = useMemo(() => {
        if (!viewer || !userForCard) return false;
        const idMatch = Number(viewer.id) === Number(userForCard.id);
        const handleMatch =
            viewer.handle &&
            userForCard.handle &&
            String(viewer.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || !!handleMatch;
    }, [viewer, userForCard]);

    const isFollowingForCard = useMemo(() => {
        const tid = Number(userForCard?.id);
        if (!tid) return false;
        return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
    }, [userForCard, serverFollowingSet, locallyFollowed]);

    const postFollow = async (targetId, action, targetType = 'user') => {
        const payload = { target_id: targetId, action, target_type: targetType };

        // Include actor account context so the backend records the follow
        // under the correct account (personal / business / artist).
        if (activeAccountId && activeAccountId !== 'personal') {
            payload.account_id = activeAccountId;
            payload.account_type = activeAccountType;
            if (activeAccountType === 'business') {
                payload.business_id = activeAccountId;
            } else if (activeAccountType === 'artist') {
                payload.artist_id = activeAccountId;
            }
        }

        // Prefer the new follows endpoint for all account types so that
        // the `follows` table is the single source of truth across all views.
        // Old /users/follow kept as fallback only.
        const isScoped = activeAccountId && activeAccountId !== 'personal';
        const urls = isScoped
            ? ['/api/follows/toggle', `${api}/api/follows/toggle`, `${api}/users/follow`, '/api/users/follow', '/users/follow']
            : ['/api/follows/toggle', `${api}/api/follows/toggle`, `${api}/users/follow`, '/api/users/follow', '/users/follow'];
        try {
            await tryPost(urls, payload, { withCredentials: true });
            return true;
        } catch {
            return false;
        }
    };

    const handleFollowToggle = async (targetUser, forceAction) => {
        const tid0 = Number(targetUser?.id || userForCard?.id);
        const handle0 = targetUser?.handle || userForCard?.handle;
        if (!tid0 && !handle0) return;
        if (isSelf) return;

        requireAuth(async () => {
            let tid = tid0;
            if (!tid) {
                const p = await hydrateTargetFromPublic({ handle: handle0 });
                if (p?.id) tid = Number(p.id);
            }
            if (!tid) return;

            const currentlyFollowing = serverFollowingSet.has(tid) || locallyFollowed.has(tid);
            const action = forceAction || (currentlyFollowing ? 'unfollow' : 'follow');

            if (action === 'follow') {
                setLocallyFollowed((prev) => {
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

            const targetType = String(targetUser?.account_type || 'user').toLowerCase();
            const ok = await postFollow(tid, action, targetType);
            if (ok) {
                setServerFollowingSet((prev) => {
                    const next = new Set(prev);
                    if (action === 'follow') next.add(tid);
                    else next.delete(tid);
                    return next;
                });
                await fetchSocial();
            } else {
                // rollback
                setLocallyFollowed((prev) => {
                    const next = new Set(prev);
                    if (currentlyFollowing) next.add(tid);
                    else next.delete(tid);
                    return next;
                });
            }
        });
    };


    const openUnfollowConfirm = useCallback((targetUser) => {
        if (!targetUser) return;
        setUnfollowTarget(targetUser);
        setUnfollowOpen(true);
    }, []);

    const closeUnfollowConfirm = useCallback(() => {
        setUnfollowOpen(false);
        setUnfollowTarget(null);
    }, []);

    const confirmUnfollow = useCallback(() => {
        if (unfollowTarget) handleFollowToggle(unfollowTarget, 'unfollow');
        closeUnfollowConfirm();
    }, [unfollowTarget, closeUnfollowConfirm]);


    const handleMessage = (targetUser) => {
        const tid = Number(targetUser?.id || userForCard?.id);
        if (!tid) return;
        requireAuth(() => {
            window.dispatchEvent(new CustomEvent('open-message-center', { detail: { userId: tid } }));
        });
    };

    const handleViewProfile = (u0) => {
        setUserAnchor(null);
        if (!u0) return;
        navigate(getProfilePath(u0));
    };
    /* --------------------------------------------------------------------- */

    const feedReqSeqRef = useRef(0);
    const feedInFlightRef = useRef(false);
    const feedEngagementSigRef = useRef('');

    // Seed for deterministic random shuffle when sort is 'any'.
    // Changes on refresh or when new data loads, but stays stable across re-renders.
    const shuffleSeedRef = useRef(Date.now());

    const lastAutoFetchKeyRef = useRef({ feed: '', people: '', safety: '', social: '' });

    /* ------------------------------ fetchers ------------------------------ */
    // NOTE: fetchSocial uses viewerRef.current inside the body so that the
    // callback identity only changes when the viewer's *id* changes (a primitive),
    // not when the viewer object reference changes. This prevents the infinite
    // setState → render → effect → setState loop that occurred when `viewer`
    // (a new object each render) was in the dep array.
    const fetchSocial = useCallback(async () => {
        try {
            setSocialFetchError(null);
            const v = viewerRef.current;
            if (!v) {
                setFollowing([]);
                setFollowers([]);
                setServerFollowingSet(new Set());
                return;
            }
            const who = v?.public_id || v?.id || v?.handle;

            // Build query params with account context
            const params = new URLSearchParams();
            const isAccountScoped = activeAccountId && activeAccountId !== 'personal';
            if (isAccountScoped) {
                params.set('account_id', activeAccountId);
                params.set('account_type', activeAccountType);
            }
            const queryStr = params.toString();
            const suffix = queryStr ? `?${queryStr}` : '';

            // For business/artist accounts, ONLY use the new follows endpoint.
            // The old /users/social/:who reads social_json which only knows personal
            // accounts — it ignores account_type/account_id params and always returns
            // the personal social graph. The follows endpoint properly scopes by
            // account type, matching what ArtistDetailPanel uses.
            //
            // For personal accounts, ALSO prefer the new follows endpoint so that
            // all views (SocialHome, FollowsSection, UserCardPopover, BusinessPublicPage)
            // read from the same `follows` table — the single source of truth.
            // The old /users/social/:who endpoint is kept as a fallback only.
            let urls;
            let extraHeaders = {};

            if (isAccountScoped) {
                // Build the same account headers that ArtistDetailPanel uses
                extraHeaders['x-account-type'] = activeAccountType;
                if (activeAccountType === 'business') {
                    extraHeaders['x-business-id'] = String(activeAccountId);
                } else if (activeAccountType === 'artist') {
                    extraHeaders['x-artist-id'] = String(activeAccountId);
                }
                urls = [
                    `/api/follows/social/${encodeURIComponent(who)}${suffix}`,
                    `${api}/api/follows/social/${encodeURIComponent(who)}${suffix}`,
                ];
            } else {
                // Personal account: new follows endpoint first, old as fallback
                urls = [
                    `/api/follows/social/${encodeURIComponent(who)}${suffix}`,
                    `${api}/api/follows/social/${encodeURIComponent(who)}${suffix}`,
                    `${api}/users/social/${encodeURIComponent(who)}${suffix}`,
                    `/users/social/${encodeURIComponent(who)}${suffix}`,
                    `/api/users/social/${encodeURIComponent(who)}${suffix}`,
                ];
            }

            const res = await tryGet(urls, { withCredentials: true, headers: extraHeaders });

            const data = res?.data || {};
            const followingArr = Array.isArray(data?.following) ? data.following : [];
            const followersArr = Array.isArray(data?.followers) ? data.followers : [];

            setFollowing(followingArr);
            setFollowers(followersArr);

            // Warm public profile cache so Following/Followers cards can show location.
            prefetchPublicProfiles(followingArr);
            prefetchPublicProfiles(followersArr);


            const ids = followingArr.map((u) => Number(u?.id)).filter(Boolean);
            setServerFollowingSet(new Set(ids));
        } catch (err) {
            setSocialFetchError(err);
            setFollowing([]);
            setFollowers([]);
            setServerFollowingSet(new Set());
        }
    }, [viewerId, prefetchPublicProfiles, activeAccountId, activeAccountType]);

    const fetchPeople = useCallback(
        async (overrides = {}) => {
            const reset = overrides.reset !== undefined ? overrides.reset : !overrides.append;
            const effectiveSearch =
                overrides.search !== undefined ? overrides.search : peopleSearch;
            const effectiveCounty =
                overrides.county !== undefined ? overrides.county : peopleCounty;
            const effectiveCity =
                overrides.city !== undefined ? overrides.city : peopleCity;

            if (reset) {
                setLoadingPeople(true);
                setLoadingMorePeople(false);
            } else {
                setLoadingMorePeople(true);
            }

            try {
                setPeopleFetchError(null);
                const limit = PAGE_SIZE;
                const offset = safeNumber(
                    overrides.offset !== undefined ? overrides.offset : reset ? 0 : peopleOffset,
                    0
                );

                const q = (effectiveSearch || '').trim();

                // ── 1. Users search (existing) ──
                const userQs = new URLSearchParams();
                userQs.set('limit', String(limit));
                userQs.set('offset', String(offset));
                userQs.set('includeTotal', '1');
                if (q) userQs.set('q', q);
                if (effectiveCounty) userQs.set('county', effectiveCounty);
                if (effectiveCity) userQs.set('city', effectiveCity);

                const userFetch = secureFetch(`${api}/users/search?${userQs.toString()}`, { credentials: 'include' })
                    .then((r) => r.json())
                    .catch(() => []);

                // ── 2. Business search (only on reset / first page to avoid dupes) ──
                let bizFetch = Promise.resolve([]);
                if (reset) {
                    const bizQs = new URLSearchParams();
                    bizQs.set('limit', String(limit));
                    bizQs.set('offset', '0');
                    if (q) bizQs.set('q', q);
                    if (effectiveCounty) bizQs.set('county', effectiveCounty);
                    if (effectiveCity) bizQs.set('city', effectiveCity);

                    bizFetch = secureFetch(`${api}/api/business?${bizQs.toString()}`, { credentials: 'include' })
                        .then((r) => r.json())
                        .then((j) => {
                            const arr = Array.isArray(j) ? j : Array.isArray(j?.businesses) ? j.businesses : Array.isArray(j?.items) ? j.items : [];
                            // Normalize business rows to UserCard shape
                            return arr.map((b) => ({
                                id: `biz_${b.id}`,
                                business_id: b.id,
                                handle: b.slug || '',
                                first_name: b.name || '',
                                last_name: '',
                                avatar_url: b.avatar_url || '',
                                profile_picture: b.avatar_url || '',
                                home_city: b.city || '',
                                home_county: b.county || '',
                                city: b.city || '',
                                county: b.county || '',
                                state: b.state || '',
                                country: b.country || 'US',
                                account_type: 'business',
                                _source: 'business',
                            }));
                        })
                        .catch(() => []);
                }

                // ── 3. Artist search (only on reset / first page to avoid dupes) ──
                let artistFetch = Promise.resolve([]);
                if (reset) {
                    const artQs = new URLSearchParams();
                    artQs.set('limit', String(limit));
                    if (q) artQs.set('q', q);
                    if (effectiveCounty) artQs.set('county', effectiveCounty);
                    if (effectiveCity) artQs.set('city', effectiveCity);

                    artistFetch = secureFetch(`${api}/api/music/artists?${artQs.toString()}`, { credentials: 'include' })
                        .then((r) => r.json())
                        .then((j) => {
                            const arr = Array.isArray(j) ? j : Array.isArray(j?.items) ? j.items : Array.isArray(j?.artists) ? j.artists : [];
                            // Normalize artist rows to UserCard shape
                            return arr.map((a) => ({
                                id: `art_${a.id}`,
                                artist_id: a.id,
                                handle: a.handle || '',
                                first_name: a.name || '',
                                last_name: '',
                                avatar_url: a.avatar_url || '',
                                profile_picture: a.avatar_url || '',
                                home_city: a.city || '',
                                home_county: a.county || '',
                                city: a.city || '',
                                county: a.county || '',
                                state: a.state || '',
                                country: a.country || 'US',
                                account_type: 'artist',
                                _source: 'artist',
                            }));
                        })
                        .catch(() => []);
                }

                const [userResult, bizRows, artistRows] = await Promise.all([userFetch, bizFetch, artistFetch]);

                // Parse user result
                const j = userResult;
                const nextUsers = (Array.isArray(j) ? j : Array.isArray(j?.users) ? j.users : [])
                    .map((u) => ({ ...u, account_type: u.account_type || 'personal', _source: 'user' }));
                const nextTotal = Number.isFinite(Number(j?.total)) ? Number(j.total) : reset ? nextUsers.length : peopleTotal;

                if (reset) {
                    // Merge all three sources, users first, then businesses, then artists
                    const merged = [...nextUsers, ...bizRows, ...artistRows];
                    const mergedTotal = nextTotal + bizRows.length + artistRows.length;

                    setRows(merged);
                    setPeopleTotal(mergedTotal);
                    setPeopleOffset(nextUsers.length);
                    setPeopleHasMore(nextUsers.length < nextTotal);
                    setPeopleRenderCount(Math.min(PAGE_SIZE, merged.length));
                } else {
                    // Append only fetches more users (biz/artist already loaded on reset)
                    setRows((prev) => {
                        const base = Array.isArray(prev) ? prev : [];
                        return base.concat(nextUsers);
                    });
                    setPeopleTotal(nextTotal);
                    setPeopleOffset(offset + nextUsers.length);
                    setPeopleHasMore(offset + nextUsers.length < nextTotal);
                }
            } catch (err) {
                setPeopleFetchError(err);
                if (reset) {
                    setRows([]);
                    setPeopleTotal(0);
                    setPeopleOffset(0);
                    setPeopleHasMore(false);
                    setPeopleRenderCount(PAGE_SIZE);
                }
            } finally {
                setLoadingPeople(false);
                setLoadingMorePeople(false);
            }
        },
        [peopleSearch, peopleCounty, peopleCity, peopleOffset, peopleTotal]
    );


    const fetchJsonWithTimeout = async (url, ms = 12000, extraHeaders = {}) => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), ms);
        try {
            const res = await secureFetch(url, {
                credentials: 'include',
                signal: controller.signal,
                headers: { Accept: 'application/json', ...extraHeaders },
            });
            let data = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }
            return { ok: res.ok, status: res.status, data };
        } finally {
            window.clearTimeout(timer);
        }
    };

    const fetchFeedActivity = useCallback(async (opts = {}) => {
        const mode = opts?.mode || 'reset';
        if (feedInFlightRef.current) return;
        feedInFlightRef.current = true;

        const seq = feedReqSeqRef.current + 1;
        feedReqSeqRef.current = seq;

        if (mode === 'append') {
            setLoadingFeedMore(true);
        } else {
            setLoadingFeed(true);
        }
        setLoadingEngagement(false);
        setFeedFetchError(null);

        const isStale = () => seq !== feedReqSeqRef.current;

        try {
            const viewer = viewerRef.current;
            if (!viewer) {
                if (!isStale()) {
                    setFeedPosts([]);
                    setFeedLikes([]);
                    setFeedReposts([]);
                    setFeedComments([]);
                }
                return;
            }

            // Stage 1: Load posts quickly (do NOT block UI on engagement lookups)
            const restoreLimit = feedRestoreLimitRef.current;
            const initialLimit = restoreLimit > PAGE_SIZE ? restoreLimit : PAGE_SIZE;

            const params = new URLSearchParams();
            params.set('sort', 'newest');
            params.set('limit', String(initialLimit));
            params.set('offset', '0');

            // Include account context for business/artist accounts
            const feedHeaders = {};
            if (activeAccountId && activeAccountId !== 'personal') {
                params.set('account_id', activeAccountId);
                params.set('account_type', activeAccountType);
                feedHeaders['x-account-type'] = activeAccountType;
                if (activeAccountType === 'business') {
                    feedHeaders['x-business-id'] = String(activeAccountId);
                } else if (activeAccountType === 'artist') {
                    feedHeaders['x-artist-id'] = String(activeAccountId);
                }
            }

            const { data: j } = await fetchJsonWithTimeout(`/api/social/feed?${params.toString()}`, 12000, feedHeaders);

            const arr = Array.isArray(j)
                ? j
                : Array.isArray(j?.posts)
                    ? j.posts
                    : Array.isArray(j?.data)
                        ? j.data
                        : [];

            if (!isStale()) {
                const postsPage = Array.isArray(arr) ? arr : [];
                const totalRaw = j?.total ?? j?.meta?.total ?? j?.pagination?.total ?? j?.count ?? null;
                const totalNum = Number(totalRaw);
                const total = Number.isFinite(totalNum) && totalNum >= 0 ? totalNum : postsPage.length;

                setFeedPosts(postsPage);
                setFeedPostsTotal(total);
                setFeedPostsOffset(postsPage.length);
                setFeedPostsHasMore(postsPage.length < total);

                // ── Also load followed business + artist posts and merge into the feed ──
                // The /api/social/feed endpoint only returns community posts. Business
                // and artist follows live in different tables (follows / entity_follows)
                // so we fetch them from their own APIs and merge by date.
                (async () => {
                    try {
                        const mergeHeaders = { Accept: 'application/json' };
                        if (activeAccountId && activeAccountId !== 'personal') {
                            mergeHeaders['x-account-type'] = activeAccountType;
                            if (activeAccountType === 'business') mergeHeaders['x-business-id'] = String(activeAccountId);
                            else if (activeAccountType === 'artist') mergeHeaders['x-artist-id'] = String(activeAccountId);
                        }
                        const [bizRes, artRes] = await Promise.allSettled([
                            secureFetch(`/api/business/posts?view=following&limit=25&sort=newest`, { credentials: 'include', headers: mergeHeaders })
                                .then((r) => r.ok ? r.json() : null).catch(() => null),
                            secureFetch(`/api/music/posts?view=following&limit=25&sort=newest`, { credentials: 'include', headers: mergeHeaders })
                                .then((r) => r.ok ? r.json() : null).catch(() => null),
                        ]);

                        const parsePosts = (res) => {
                            const d = res.status === 'fulfilled' ? res.value : null;
                            if (!d) return [];
                            return Array.isArray(d) ? d : Array.isArray(d?.posts) ? d.posts : Array.isArray(d?.items) ? d.items : Array.isArray(d?.data) ? d.data : [];
                        };

                        // Normalize business post fields to match what ProfilePostsList expects
                        // (first_name, last_name, handle, avatar_url, description, posted_at, etc.)
                        const bizPosts = parsePosts(bizRes).map((p) => ({
                            ...p,
                            category: p.category || 'business_post',
                            // Author identity → ProfilePostsList reads first_name, last_name, handle, avatar_url
                            first_name: p.first_name || p.businessName || p.business_name || p.pageName || p.page_name || '',
                            last_name: p.last_name ?? '',
                            handle: p.handle || p.businessSlug || p.business_slug || p.pageSlug || p.page_slug || '',
                            avatar_url: p.avatar_url || p.businessAvatarUrl || p.business_avatar_url || p.pageAvatar || p.page_avatar || p.logo_url || p.logoUrl || '',
                            profile_picture: p.profile_picture || p.businessAvatarUrl || p.business_avatar_url || p.pageAvatar || '',
                            // Content → ProfilePostsList reads title and description
                            title: p.title || '',
                            description: p.description || p.body || '',
                            // Photos → extractPhotos checks photos, photo_url, mediaUrl
                            photos: p.photos || (() => {
                                const mu = p.mediaUrl || p.media_url || '';
                                if (!mu) return undefined;
                                try { const arr = JSON.parse(mu); if (Array.isArray(arr)) return arr; } catch {}
                                return [mu];
                            })(),
                            // Timestamps → ProfilePostsList reads posted_at or date_created
                            posted_at: p.posted_at || p.postedAt || p.created_at || p.createdAt || p.published_at || p.publishedAt || '',
                            date_created: p.date_created || p.created_at || p.createdAt || '',
                            // Location
                            city: p.city || p.businessCity || '',
                            county: p.county || p.businessCounty || '',
                            // Author user_id for follow/block logic
                            user_id: p.user_id || p.userId || p.authorUserId || p.author_user_id || p.created_by_user_id || p.createdByUserId || 0,
                        }));

                        // Normalize artist post fields similarly
                        const artPosts = parsePosts(artRes).map((p) => ({
                            ...p,
                            category: p.category || 'artist_post',
                            first_name: p.first_name || p.artistName || p.artist_name || p.name || '',
                            last_name: p.last_name ?? '',
                            handle: p.handle || p.artistHandle || p.artist_handle || '',
                            avatar_url: p.avatar_url || p.artistAvatarUrl || p.artist_avatar_url || '',
                            profile_picture: p.profile_picture || p.artistAvatarUrl || p.artist_avatar_url || '',
                            title: p.title || '',
                            description: p.description || p.body || '',
                            photos: p.photos || (() => {
                                const mu = p.mediaUrl || p.media_url || p.featuredVideoUrl || '';
                                if (!mu) return undefined;
                                try { const arr = JSON.parse(mu); if (Array.isArray(arr)) return arr; } catch {}
                                return [mu];
                            })(),
                            posted_at: p.posted_at || p.postedAt || p.created_at || p.createdAt || p.published_at || p.publishedAt || '',
                            date_created: p.date_created || p.created_at || p.createdAt || '',
                            city: p.city || '',
                            county: p.county || '',
                            user_id: p.user_id || p.userId || p.owner_user_id || 0,
                        }));

                        if ((bizPosts.length || artPosts.length) && seq === feedReqSeqRef.current) {
                            setFeedPosts((prev) => {
                                const merged = [...(Array.isArray(prev) ? prev : []), ...bizPosts, ...artPosts];
                                // Deduplicate by category:id to avoid collisions between post types
                                const seen = new Set();
                                const deduped = merged.filter((p) => {
                                    const cat = String(p?.category || 'community_post').toLowerCase();
                                    const key = `${cat}:${p?.id || 0}`;
                                    if (seen.has(key)) return false;
                                    seen.add(key);
                                    return true;
                                });
                                // Sort newest first
                                deduped.sort((a, b) => {
                                    const da = new Date(a?.posted_at || a?.postedAt || a?.created_at || a?.published_at || a?.publishedAt || 0);
                                    const db2 = new Date(b?.posted_at || b?.postedAt || b?.created_at || b?.published_at || b?.publishedAt || 0);
                                    return db2 - da;
                                });
                                return deduped;
                            });
                            // Update total to reflect merged count
                            setFeedPostsTotal((prev) => prev + bizPosts.length + artPosts.length);
                        }
                    } catch {
                        // Non-fatal — community posts still show
                    }
                })();

                // Re-read restoreLimit at resolve time — the restore effect may have
                // set it between when the fetch started and when it resolved.
                const resolveRestoreLimit = feedRestoreLimitRef.current;

                // Only reset feedRenderCount if NOT restoring scroll position
                if (resolveRestoreLimit <= 0 && restoreLimit <= 0) {
                    setFeedRenderCount(PAGE_SIZE);
                }
                // Delay clearing the restore guard so the feedRenderCount reset
                // effect (which checks feedRestoreLimitRef > 0) doesn't fire
                // during engagement data re-renders that follow shortly after.
                if (resolveRestoreLimit > 0 || restoreLimit > 0) {
                    setTimeout(() => { feedRestoreLimitRef.current = 0; }, 6000);
                } else {
                    feedRestoreLimitRef.current = 0;
                }

                if (mode !== 'append') {
                    setLoadingFeed(false);
                }
                setLoadingFeedMore(false);
            }


            // Stage 2: Engagement (likes/reposts/comments) — load after posts
            // Uses followingIdentities to pass business_id / artist_id so the
            // engagement endpoint returns scoped activity (not just personal).
            const followingIdsLocal = Array.isArray(followingIdsRef.current) ? followingIdsRef.current : [];
            const identitiesLocal = Array.isArray(followingIdentitiesRef.current) ? followingIdentitiesRef.current : [];

            // Posts tab doesn't need engagement — exit early BEFORE the expensive
            // biz/art discovery fetches so feedInFlightRef is released quickly and
            // switching to Likes/Reposts/Comments tabs isn't blocked.
            if (feedTab === 0) {
                if (!isStale()) setLoadingEngagement(false);
                // Release the in-flight lock now so tab switches can trigger new fetches
                feedInFlightRef.current = false;
                if (!isStale()) { setLoadingFeed(false); setLoadingFeedMore(false); }
                return;
            }

            // ── 2a: Discover followed businesses & artists ────────────────
            // The personal social graph (social_json / followingIds) only has
            // personal user IDs. Business/artist follows live in entity_follows
            // or the follows table. We query dedicated endpoints to find them
            // and build identities the engagement loader can use.
            let bizArtIdentities = [];
            try {
                // Fetch the viewer's followed business IDs
                const bizFollowUrls = [
                    `${api}/api/business/posts?view=following&limit=1`,
                    `/api/business/posts?view=following&limit=1`,
                ];
                // We don't actually need the posts — we need the followed biz IDs.
                // But we can get business posts from the "following" view and extract
                // unique business identities from them. Fetch a larger set to get variety.
                const bizPostsUrls = [
                    `${api}/api/business/posts?view=following&limit=50&sort=newest`,
                    `/api/business/posts?view=following&limit=50&sort=newest`,
                ];
                const artPostsUrls = [
                    `${api}/api/music/posts?view=following&limit=50&sort=newest`,
                    `/api/music/posts?view=following&limit=50&sort=newest`,
                ];

                const feedHeaders2 = {};
                if (activeAccountId && activeAccountId !== 'personal') {
                    feedHeaders2['x-account-type'] = activeAccountType;
                    if (activeAccountType === 'business') feedHeaders2['x-business-id'] = String(activeAccountId);
                    else if (activeAccountType === 'artist') feedHeaders2['x-artist-id'] = String(activeAccountId);
                }

                const [bizRes, artRes] = await Promise.allSettled([
                    (async () => {
                        for (const u of bizPostsUrls) {
                            try { return (await axios.get(u, { withCredentials: true, timeout: 10000, headers: feedHeaders2 }))?.data; }
                            catch { /* try next */ }
                        }
                        return null;
                    })(),
                    (async () => {
                        for (const u of artPostsUrls) {
                            try { return (await axios.get(u, { withCredentials: true, timeout: 10000, headers: feedHeaders2 }))?.data; }
                            catch { /* try next */ }
                        }
                        return null;
                    })(),
                ]);

                // Extract unique business identities from followed business posts
                const bizData = bizRes.status === 'fulfilled' ? bizRes.value : null;
                const bizPosts = Array.isArray(bizData) ? bizData
                    : Array.isArray(bizData?.posts) ? bizData.posts
                        : Array.isArray(bizData?.items) ? bizData.items
                            : Array.isArray(bizData?.data) ? bizData.data : [];

                const seenBiz = new Set();
                bizPosts.forEach((bp) => {
                    const bizId = Number(bp?.businessId || bp?.business_id || bp?.businessPageId || bp?.business_page_id || bp?.pageId || bp?.page_id || 0);
                    const ownerId = Number(bp?.authorUserId || bp?.author_user_id || bp?.user_id || bp?.userId || bp?.created_by_user_id || bp?.createdByUserId || 0);
                    if (!bizId || seenBiz.has(bizId)) return;
                    seenBiz.add(bizId);
                    bizArtIdentities.push({
                        userId: ownerId || 0,
                        accountType: 'business',
                        businessId: bizId,
                        artistId: 0,
                        handle: String(bp?.businessSlug || bp?.business_slug || bp?.pageSlug || bp?.slug || '').trim(),
                        name: String(bp?.businessName || bp?.business_name || bp?.pageName || bp?.page_name || '').trim(),
                        avatarUrl: String(bp?.businessAvatarUrl || bp?.business_avatar_url || bp?.pageAvatar || '').trim(),
                    });
                });

                // Extract unique artist identities from followed artist posts
                const artData = artRes.status === 'fulfilled' ? artRes.value : null;
                const artPosts = Array.isArray(artData) ? artData
                    : Array.isArray(artData?.posts) ? artData.posts
                        : Array.isArray(artData?.items) ? artData.items
                            : Array.isArray(artData?.data) ? artData.data : [];

                const seenArt = new Set();
                artPosts.forEach((ap) => {
                    const artId = Number(ap?.artistId || ap?.artist_id || ap?.music_artist_id || 0);
                    const ownerId = Number(ap?.userId || ap?.user_id || ap?.owner_user_id || 0);
                    if (!artId || seenArt.has(artId)) return;
                    seenArt.add(artId);
                    bizArtIdentities.push({
                        userId: ownerId || 0,
                        accountType: 'artist',
                        businessId: 0,
                        artistId: artId,
                        handle: String(ap?.artistHandle || ap?.artist_handle || ap?.handle || '').trim(),
                        name: String(ap?.artistName || ap?.artist_name || ap?.name || '').trim(),
                        avatarUrl: String(ap?.artistAvatarUrl || ap?.artist_avatar_url || ap?.avatar_url || '').trim(),
                        profileType: String(
                            ap?.artistProfileType || ap?.artist_profile_type ||
                            ap?.profile_type || ap?.profileType || ''
                        ).toLowerCase(),
                    });
                });
            } catch {
                // Non-fatal — personal engagement still works
            }

            // Merge: personal identities + discovered business/artist identities
            const allIdentities = [...identitiesLocal, ...bizArtIdentities];

            if (!allIdentities.length) {
                if (!isStale()) {
                    setFeedLikes([]);
                    setFeedReposts([]);
                    setFeedComments([]);
                    setLoadingEngagement(false);
                }
                return;
            }

            // Fetch per followed identity and aggregate (guarded)
            const MAX_USERS = 16;
            const engagementSig = `${feedTab}:${allIdentities.slice(0, MAX_USERS).map((i) => `${i.userId}:${i.businessId}:${i.artistId}`).join(',')}`;
            if (feedEngagementSigRef.current === engagementSig) {
                if (!isStale()) setLoadingEngagement(false);
                return;
            }
            feedEngagementSigRef.current = engagementSig;

            if (!isStale()) setLoadingEngagement(true);
            const identitiesToLoad = allIdentities.slice(0, MAX_USERS);

            const loadEngagementForIdentity = async (identity) => {
                const { userId, businessId, artistId, accountType } = identity;
                const key = encodeURIComponent(String(userId));

                // Build query params with account scope so the backend returns
                // engagement performed under the business/artist identity.
                const params = new URLSearchParams();
                params.set('types', 'likes,reposts,comments');
                params.set('limit', '50');
                if (businessId > 0) {
                    params.set('business_id', String(businessId));
                    params.set('account_type', 'business');
                } else if (artistId > 0) {
                    params.set('artist_id', String(artistId));
                    params.set('account_type', 'artist');
                }

                const qs = params.toString();
                const urls = [
                    `${api}/users/${key}/engagement/posts?${qs}`,
                    `${api}/api/users/${key}/engagement/posts?${qs}`,
                    `/users/${key}/engagement/posts?${qs}`,
                    `/api/users/${key}/engagement/posts?${qs}`,
                ];

                for (const u of urls.filter(Boolean)) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        const res = await axios.get(u, { withCredentials: true, timeout: 12000 });
                        return res?.data || {};
                    } catch {
                        // try next
                    }
                }
                return {};
            };

            const results = await Promise.allSettled(identitiesToLoad.map((identity) => loadEngagementForIdentity(identity)));

            const likesAgg = [];
            const repostsAgg = [];
            const commentsAgg = [];

            results.forEach((r0, idx) => {
                if (r0.status !== 'fulfilled') return;
                const data = r0.value || {};
                const identity = identitiesToLoad[idx] || {};

                const likes = Array.isArray(data?.likes) ? data.likes : [];
                const reposts = Array.isArray(data?.reposts) ? data.reposts : [];
                const comments = Array.isArray(data?.comments) ? data.comments : [];

                likes.forEach((p) =>
                    likesAgg.push({
                        ...(p || {}),
                        _liked_by_user_id: p?.liked_by_user_id || p?.liker_id || p?.user_id || identity.userId,
                        _actor_account_type: p?.actor_account_type || p?.account_type || identity.accountType || '',
                        _actor_business_id: p?.actor_business_id || p?.business_id || identity.businessId || 0,
                        _actor_artist_id: p?.actor_artist_id || p?.artist_id || identity.artistId || 0,
                        _actor_handle: p?.actor_handle || p?.account_handle || identity.handle || '',
                        _actor_name: p?.actor_name || p?.account_name || identity.name || '',
                        _actor_avatar_url: p?.actor_avatar_url || p?.account_avatar_url || identity.avatarUrl || '',
                    })
                );
                reposts.forEach((p) =>
                    repostsAgg.push({
                        ...(p || {}),
                        _reposted_by_user_id: p?.reposted_by_user_id || p?.reposter_id || p?.user_id || identity.userId,
                        _actor_account_type: p?.actor_account_type || p?.account_type || identity.accountType || '',
                        _actor_business_id: p?.actor_business_id || p?.business_id || identity.businessId || 0,
                        _actor_artist_id: p?.actor_artist_id || p?.artist_id || identity.artistId || 0,
                        _actor_handle: p?.actor_handle || p?.account_handle || identity.handle || '',
                        _actor_name: p?.actor_name || p?.account_name || identity.name || '',
                        _actor_avatar_url: p?.actor_avatar_url || p?.account_avatar_url || identity.avatarUrl || '',
                    })
                );
                // Attach the full identity so the UI can resolve name/handle/avatar
                // without a separate /users/public/:id lookup for business/artist actors.
                comments.forEach((c) =>
                    commentsAgg.push({
                        ...(c || {}),
                        user_id: c?.user_id || c?.userId || identity.userId,
                        commenter_id: c?.commenter_id || c?.commenterId || identity.userId,
                        _actor_account_type: c?.account_type || identity.accountType || '',
                        _actor_business_id: c?.business_id || identity.businessId || 0,
                        _actor_artist_id: c?.artist_id || identity.artistId || 0,
                        _actor_handle: c?.account_handle || identity.handle || '',
                        _actor_name: c?.account_name || identity.name || '',
                        _actor_avatar_url: c?.account_avatar_url || identity.avatarUrl || '',
                        _actor_profile_type: String(
                            c?.profile_type || c?.profileType ||
                            c?.account_profile_type || c?.accountProfileType ||
                            identity.profileType || ''
                        ).toLowerCase(),
                    })
                );
            });

            // Seed the comment author cache with business/artist actor display info
            // so the rendering code can show "Joe's Pizza" instead of "User #42".
            const actorSeeds = {};
            [...likesAgg, ...repostsAgg, ...commentsAgg].forEach((item) => {
                const uid = Number(item._liked_by_user_id || item._reposted_by_user_id || item.user_id || 0);
                const acctType = String(item._actor_account_type || '').toLowerCase();
                if (!uid) return;
                // Only seed for scoped accounts; personal profiles are fetched via /users/public
                if (acctType === 'business' || acctType === 'artist') {
                    // Use a composite key to avoid collisions when the same user_id
                    // has both personal and scoped engagement entries.
                    const compositeKey = `${uid}:${item._actor_business_id || 0}:${item._actor_artist_id || 0}`;
                    if (actorSeeds[compositeKey]) return;
                    actorSeeds[compositeKey] = {
                        id: uid,
                        handle: item._actor_handle || '',
                        first_name: item._actor_name || '',
                        last_name: '',
                        avatar_url: item._actor_avatar_url || '',
                        profile_picture: item._actor_avatar_url || '',
                        account_type: acctType,
                        business_id: item._actor_business_id || null,
                        artist_id: item._actor_artist_id || null,
                    };
                    // Also seed by plain user_id so the existing cache lookup works
                    // (will be overridden if a personal profile fetch runs later — that's fine).
                    if (!actorSeeds[uid]) actorSeeds[uid] = actorSeeds[compositeKey];
                }
            });
            if (Object.keys(actorSeeds).length && !isStale()) {
                setCommentAuthorById((prev) => ({ ...(prev || {}), ...actorSeeds }));
            }

            // Deduplicate
            const dedupePostsById = (list) => {
                const seen = new Set();
                const out = [];
                (Array.isArray(list) ? list : []).forEach((p) => {
                    const id = Number(p?.id || 0);
                    if (!id || seen.has(id)) return;
                    seen.add(id);
                    out.push(p);
                });
                return out;
            };

            const dedupeComments = (list) => {
                const seen = new Set();
                const out = [];
                (Array.isArray(list) ? list : []).forEach((c) => {
                    const cid = Number(c?.comment_id || c?.id || 0);
                    const pid = Number(c?.post?.id || c?.post_id || 0);
                    const key = `${pid}:${cid}`;
                    if (!pid) return;
                    if (seen.has(key)) return;
                    seen.add(key);
                    out.push(c);
                });
                return out;
            };

            if (!isStale()) {
                setFeedLikes(dedupePostsById(likesAgg));
                setFeedReposts(dedupePostsById(repostsAgg));
                setFeedComments(dedupeComments(commentsAgg));
            }
        } catch (err) {
            if (!isStale()) {
                setFeedFetchError(err);
                setFeedPosts([]);
                setFeedLikes([]);
                setFeedReposts([]);
                setFeedComments([]);
            }
        } finally {
            feedInFlightRef.current = false;
            if (!isStale()) {
                setLoadingFeed(false);
                setLoadingFeedMore(false);
                setLoadingEngagement(false);
            }
        }
    }, [viewerId, feedTab, activeAccountId, activeAccountType]);

    // When the social graph loads/changes, invalidate the engagement signature
    // so the next feed fetch will re-fetch engagement data for the new set of
    // followed users. We use followingIds.length as a primitive dep to avoid
    // recreating the effect on every array reference change.
    const followingIdsLength = followingIds.length;
    useEffect(() => {
        if (followingIdsLength > 0) {
            feedEngagementSigRef.current = '';
        }
    }, [followingIdsLength]);

    // Ensure comment cards can show real author name/handle/avatar.
    useEffect(() => {
        prefetchCommentAuthors(feedComments);
    }, [feedComments, prefetchCommentAuthors]);

    // Prefetch reposter profiles so the Reposts tab can show "Reposted by …"
    useEffect(() => {
        if (!feedReposts.length) return;
        const fakeEntries = feedReposts
            .filter((p) => p?._reposted_by_user_id)
            .map((p) => ({ user_id: p._reposted_by_user_id }));
        if (fakeEntries.length) prefetchCommentAuthors(fakeEntries);
    }, [feedReposts, prefetchCommentAuthors]);

    // Prefetch liker profiles so the Likes tab can show "Liked by …"
    useEffect(() => {
        if (!feedLikes.length) return;
        const fakeEntries = feedLikes
            .filter((p) => p?._liked_by_user_id)
            .map((p) => ({ user_id: p._liked_by_user_id }));
        if (fakeEntries.length) prefetchCommentAuthors(fakeEntries);
    }, [feedLikes, prefetchCommentAuthors]);

    const fetchModeration = useCallback(async () => {
        setLoadingSafety(true);
        try {
            const v = viewerRef.current;
            if (!v) {
                setModeration({ blocked: [], hiddenPosts: [] });
                return;
            }

            // Build account-context query params (same pattern as fetchSocial)
            const params = new URLSearchParams();
            const modHeaders = {};
            if (activeAccountId && activeAccountId !== 'personal') {
                params.set('account_id', activeAccountId);
                params.set('account_type', activeAccountType);
                modHeaders['x-account-type'] = activeAccountType;
                if (activeAccountType === 'business') {
                    modHeaders['x-business-id'] = String(activeAccountId);
                } else if (activeAccountType === 'artist') {
                    modHeaders['x-artist-id'] = String(activeAccountId);
                }
            }
            const qs = params.toString();
            const suffix = qs ? `?${qs}` : '';

            const res = await tryGet(
                [`${api}/users/moderation-state${suffix}`, `/users/moderation-state${suffix}`, `/api/users/moderation-state${suffix}`],
                { withCredentials: true, headers: modHeaders }
            );
            const data = res?.data || {};

            // Personal user IDs that were directly blocked
            const blockedUserIds = Array.isArray(data?.blocked_user_ids) ? data.blocked_user_ids : [];
            const hiddenPostIds = Array.isArray(data?.hidden_post_user_ids) ? data.hidden_post_user_ids : [];

            // Business and artist entity IDs owned by blocked users
            const blockedBusinessIds = Array.isArray(data?.blocked_business_ids) ? data.blocked_business_ids : [];
            const blockedArtistIds = Array.isArray(data?.blocked_artist_ids) ? data.blocked_artist_ids : [];

            // Build a set of business/artist IDs so we exclude them from the personal profile fetch
            const bizIdSet = new Set(blockedBusinessIds.map(Number).filter((n) => Number.isFinite(n) && n > 0));
            const artIdSet = new Set(blockedArtistIds.map(Number).filter((n) => Number.isFinite(n) && n > 0));

            const uniq = (arr) =>
                Array.from(new Set(arr.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)));

            // Filter out business/artist entity IDs from the personal user ID list
            // (blocked_user_ids includes personal + biz + artist IDs combined)
            const personalBlockedIds = uniq(blockedUserIds).filter((id) => !bizIdSet.has(id) && !artIdSet.has(id));

            const loadProfiles = async (ids) => {
                const uniqueIds = uniq(ids).slice(0, 80);
                const profiles = await Promise.all(
                    uniqueIds.map(async (id) => {
                        try {
                            const r = await tryGet(
                                [`${api}/users/public/${id}`, `/users/public/${id}`, `/api/users/public/${id}`],
                                { withCredentials: true }
                            );
                            return r?.data?.profile || null;
                        } catch {
                            return null;
                        }
                    })
                );
                return profiles.filter(Boolean);
            };

            // Fetch business profiles by ID
            const loadBusinessProfiles = async (ids) => {
                const uniqueIds = uniq(ids).slice(0, 40);
                const profiles = await Promise.all(
                    uniqueIds.map(async (bizId) => {
                        try {
                            const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
                            const urls = [
                                `${apiBase}/api/business/${bizId}`,
                                `/api/business/${bizId}`,
                            ].filter(Boolean);
                            for (const url of urls) {
                                try {
                                    const r = await tryGet([url], { withCredentials: true });
                                    const biz = r?.data?.business || r?.data || null;
                                    if (!biz) continue;
                                    // Normalize to the shape UserCard expects
                                    return {
                                        id: biz.id || bizId,
                                        account_type: 'business',
                                        first_name: biz.name || biz.business_name || biz.slug || biz.handle || '',
                                        last_name: '',
                                        handle: biz.slug || biz.handle || '',
                                        avatar_url: biz.logo_url || biz.avatar_url || biz.profile_picture || '',
                                        business_id: biz.id || bizId,
                                        business_name: biz.name || biz.business_name || '',
                                        business_slug: biz.slug || biz.handle || '',
                                        home_city: biz.city || biz.home_city || '',
                                        home_county: biz.county || biz.home_county || '',
                                        _entity_type: 'business',
                                        _entity_id: bizId,
                                    };
                                } catch { /* try next */ }
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })
                );
                return profiles.filter(Boolean);
            };

            // Fetch artist profiles by ID
            const loadArtistProfiles = async (ids) => {
                const uniqueIds = uniq(ids).slice(0, 40);
                const profiles = await Promise.all(
                    uniqueIds.map(async (artId) => {
                        try {
                            const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
                            const urls = [
                                `${apiBase}/api/music/artists/${artId}`,
                                `/api/music/artists/${artId}`,
                            ].filter(Boolean);
                            for (const url of urls) {
                                try {
                                    const r = await tryGet([url], { withCredentials: true });
                                    const art = r?.data?.artist || r?.data || null;
                                    if (!art) continue;
                                    return {
                                        id: art.id || artId,
                                        account_type: 'artist',
                                        first_name: art.name || art.artist_name || art.handle || art.artist_handle || '',
                                        last_name: '',
                                        handle: art.handle || art.artist_handle || '',
                                        avatar_url: art.avatar_url || art.profile_picture || '',
                                        artist_id: art.id || artId,
                                        artist_name: art.name || art.artist_name || '',
                                        artist_handle: art.handle || art.artist_handle || '',
                                        home_city: art.city || art.home_city || '',
                                        home_county: art.county || art.home_county || '',
                                        profile_type: String(art.profile_type || art.profileType || '').toLowerCase(),
                                        _entity_type: 'artist',
                                        _entity_id: artId,
                                    };
                                } catch { /* try next */ }
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })
                );
                return profiles.filter(Boolean);
            };

            const [blockedPersonal, blockedBiz, blockedArt, hiddenPersonal, hiddenBiz, hiddenArt] = await Promise.all([
                loadProfiles(personalBlockedIds),
                loadBusinessProfiles(blockedBusinessIds),
                loadArtistProfiles(blockedArtistIds),
                // Hidden posts: also split by entity type (mirrors blocked logic).
                // The API may return hidden_post_business_ids / hidden_post_artist_ids
                // separately; if not, fall back to trying each hidden ID against
                // business and artist endpoints.
                (() => {
                    const hBizIds = Array.isArray(data?.hidden_post_business_ids) ? data.hidden_post_business_ids : [];
                    const hArtIds = Array.isArray(data?.hidden_post_artist_ids) ? data.hidden_post_artist_ids : [];
                    const hBizSet = new Set(hBizIds.map(Number).filter((n) => Number.isFinite(n) && n > 0));
                    const hArtSet = new Set(hArtIds.map(Number).filter((n) => Number.isFinite(n) && n > 0));
                    // Personal = IDs not claimed by biz or artist lists
                    const personalIds = uniq(hiddenPostIds).filter((i) => !hBizSet.has(i) && !hArtSet.has(i));
                    return loadProfiles(personalIds);
                })(),
                (() => {
                    const hBizIds = Array.isArray(data?.hidden_post_business_ids) ? data.hidden_post_business_ids : [];
                    return loadBusinessProfiles(hBizIds);
                })(),
                (() => {
                    const hArtIds = Array.isArray(data?.hidden_post_artist_ids) ? data.hidden_post_artist_ids : [];
                    return loadArtistProfiles(hArtIds);
                })(),
            ]);

            setModeration({
                blocked: [...blockedPersonal, ...blockedBiz, ...blockedArt],
                hiddenPosts: [...hiddenPersonal, ...hiddenBiz, ...hiddenArt],
            });
        } catch {
            setModeration({ blocked: [], hiddenPosts: [] });
        } finally {
            setLoadingSafety(false);
        }
    }, [viewerId, prefetchPublicProfiles, activeAccountId, activeAccountType]);


    const handleUnblockUser = useCallback(
        async (u) => {
            if (!viewerRef.current) return;
            const id = Number(u?.id);
            if (!Number.isFinite(id) || id <= 0) return;

            setModeration((prev) => ({
                ...(prev || { blocked: [], hiddenPosts: [] }),
                blocked: (prev?.blocked || []).filter((x) => Number(x?.id) !== id),
            }));

            // Include account context in body so the backend knows which account to unblock for
            const acctBody = {};
            if (activeAccountType === 'business' && activeAccountId && activeAccountId !== 'personal') {
                acctBody.business_id = activeAccountId;
                acctBody.account_type = 'business';
            } else if (activeAccountType === 'artist' && activeAccountId && activeAccountId !== 'personal') {
                acctBody.artist_id = activeAccountId;
                acctBody.account_type = 'artist';
            }

            // Pass target_type so the backend resolves business/artist → owner correctly
            const entityType = u?._entity_type || u?.account_type || '';
            const targetType = (entityType === 'business' || entityType === 'artist') ? entityType : 'personal';
            const targetId = (targetType !== 'personal' && u?._entity_id) ? Number(u._entity_id) : id;

            try {
                await tryPost(
                    [`${api}/users/block`, '/api/users/block', '/users/block'],
                    { target_id: targetId, target_type: targetType, action: 'unblock', ...acctBody },
                    { withCredentials: true }
                );
            } catch {
                // ignore
            }

            try {
                window.dispatchEvent(new CustomEvent('ll:user:blocked-changed', { detail: { userId: targetId, targetType, blocked: false } }));
            } catch {
                // ignore
            }

            fetchModeration();
        },
        [viewerId, fetchModeration, activeAccountId, activeAccountType]
    );

    const handleUnhidePostsFromUser = useCallback(
        async (u) => {
            if (!viewerRef.current) return;
            const id = Number(u?.id);
            if (!Number.isFinite(id) || id <= 0) return;

            setModeration((prev) => ({
                ...(prev || { blocked: [], hiddenPosts: [] }),
                hiddenPosts: (prev?.hiddenPosts || []).filter((x) => Number(x?.id) !== id),
            }));

            // Include account context in body so the backend knows which account to unhide for
            const acctBody = {};
            if (activeAccountType === 'business' && activeAccountId && activeAccountId !== 'personal') {
                acctBody.business_id = activeAccountId;
                acctBody.account_type = 'business';
            } else if (activeAccountType === 'artist' && activeAccountId && activeAccountId !== 'personal') {
                acctBody.artist_id = activeAccountId;
                acctBody.account_type = 'artist';
            }

            // Pass target_type so the backend resolves business/artist → owner correctly
            const entityType = u?._entity_type || u?.account_type || '';
            const targetType = (entityType === 'business' || entityType === 'artist') ? entityType : 'personal';
            const targetId = (targetType !== 'personal' && u?._entity_id) ? Number(u._entity_id) : id;

            try {
                await tryPost(
                    [`${api}/users/hide`, '/api/users/hide', '/users/hide'],
                    { target_id: targetId, target_type: targetType, action: 'unhide', ...acctBody },
                    { withCredentials: true }
                );
            } catch {
                // ignore
            }

            try {
                window.dispatchEvent(new CustomEvent('ll:user:hidden-changed', { detail: { userId: targetId, targetType, hidden: false } }));
            } catch {
                // ignore
            }

            fetchModeration();
        },
        [viewerId, fetchModeration, activeAccountId, activeAccountType]
    );

    /* -------------------------- initial + tab loads -------------------------- */
    // Reset stale caches when switching between accounts (personal ↔ business ↔ artist)
    // so the UI always shows data for the active account.
    const prevAccountKeyRef = useRef(`${activeAccountType}:${activeAccountId}`);
    useEffect(() => {
        const currentKey = `${activeAccountType}:${activeAccountId}`;
        if (prevAccountKeyRef.current === currentKey) return;
        prevAccountKeyRef.current = currentKey;

        // Clear engagement signature so feed engagement re-fetches
        feedEngagementSigRef.current = '';
        // Clear all auto-fetch keys so every tab re-fetches
        lastAutoFetchKeyRef.current = { feed: '', people: '', safety: '', social: '' };
        // Reset feed data so stale posts from the previous account don't flash
        setFeedPosts([]);
        setFeedLikes([]);
        setFeedReposts([]);
        setFeedComments([]);
        setFeedPostsTotal(0);
        setFeedPostsOffset(0);
        setFeedPostsHasMore(false);
        setFeedRenderCount(PAGE_SIZE);
        // Reset social graph
        setFollowing([]);
        setFollowers([]);
        setServerFollowingSet(new Set());
        // Reset moderation
        setModeration({ blocked: [], hiddenPosts: [] });
    }, [activeAccountType, activeAccountId]);

    useEffect(() => {
        fetchSocial();
    }, [fetchSocial, activeAccountId]);

    // Derive the active filter's primitives so the effect deps are stable scalars,
    // not the entire feedFilters object (whose reference may change on reload).
    const _feedModeKey = feedTab === 0 ? 'posts' : feedTab === 1 ? 'comments' : feedTab === 2 ? 'likes' : 'reposts';
    const activeFeedCategory = feedFilters?.[_feedModeKey]?.category || '';
    const activeFeedSort = feedFilters?.[_feedModeKey]?.sort || 'any';
    const activeFeedDateRange = feedFilters?.[_feedModeKey]?.dateRange || 'all';

    useEffect(() => {
        // FEED: only fetch when Feed tab is active and the feed-relevant inputs change.
        if (tab !== TAB.FEED) return;

        // Skip re-fetch if we just restored cached feed data
        if (feedRestoreLimitRef.current > 0) {
            // Still set the key so subsequent changes trigger a real fetch
            const mode =
                feedTab === 0 ? 'posts' :
                    feedTab === 1 ? 'comments' :
                        feedTab === 2 ? 'likes' : 'reposts';
            const viewerKey = viewerId || viewerHandle || '';
            const accountKey = activeAccountId || 'personal';
            lastAutoFetchKeyRef.current.feed = `feed|${feedTab}|${mode}|${activeFeedCategory}|${activeFeedSort}|${activeFeedDateRange}|${viewerKey}|${accountKey}`;
            return;
        }

        const mode =
            feedTab === 0 ? 'posts' :
                feedTab === 1 ? 'comments' :
                    feedTab === 2 ? 'likes' : 'reposts';

        const viewerKey = viewerId || viewerHandle || '';
        const accountKey = activeAccountId || 'personal';
        const key = `feed|${feedTab}|${mode}|${activeFeedCategory}|${activeFeedSort}|${activeFeedDateRange}|${viewerKey}|${accountKey}`;

        if (lastAutoFetchKeyRef.current.feed !== key) {
            lastAutoFetchKeyRef.current.feed = key;
            fetchFeedActivity({ mode: 'reset' });
        }
    }, [tab, TAB.FEED, feedTab, activeFeedCategory, activeFeedSort, activeFeedDateRange, viewerId, viewerHandle, fetchFeedActivity, activeAccountId]);

    useEffect(() => {
        // FIND PEOPLE: only fetch when People tab is active and filters change.
        if (tab !== TAB.PEOPLE) return;

        const q = (peopleSearch || '').trim();
        const viewerKey = viewerId || viewerHandle || '';
        const accountKey = activeAccountId || 'personal';
        const key = `people|${q}|${peopleCity}|${peopleCounty}|${viewerKey}|${accountKey}`;

        if (lastAutoFetchKeyRef.current.people !== key) {
            lastAutoFetchKeyRef.current.people = key;
            fetchPeople({ reset: true });
        }
    }, [tab, TAB.PEOPLE, peopleSearch, peopleCity, peopleCounty, viewerId, viewerHandle, fetchPeople, activeAccountId]);

    useEffect(() => {
        // SAFETY / MODERATION: only fetch when active.
        if (tab !== TAB.SAFETY) return;

        const viewerKey = viewerId || viewerHandle || '';
        const accountKey = activeAccountId || 'personal';
        const key = `safety|${viewerKey}|${accountKey}`;

        if (lastAutoFetchKeyRef.current.safety !== key) {
            lastAutoFetchKeyRef.current.safety = key;
            fetchModeration();
        }
    }, [tab, TAB.SAFETY, viewerId, viewerHandle, fetchModeration, activeAccountId]);

    useEffect(() => {
        // FOLLOWING / FOLLOWERS: load social graph only when those tabs are active.
        if (tab !== TAB.FOLLOWING && tab !== TAB.FOLLOWERS) return;

        const viewerKey = viewerId || viewerHandle || '';
        const accountKey = activeAccountId || 'personal';
        const key = `social|${viewerKey}|${accountKey}`;

        if (lastAutoFetchKeyRef.current.social !== key) {
            lastAutoFetchKeyRef.current.social = key;
            fetchSocial();
        }
    }, [tab, TAB.FOLLOWING, TAB.FOLLOWERS, viewerId, viewerHandle, fetchSocial, activeAccountId]);
// If you block someone from Following/Followers, remove them from those lists immediately,
    // and refresh social graph so the tabs reflect the change. Hiding posts should NOT remove them.
    useEffect(() => {
        const onBlockedChanged = (e) => {
            const userId = Number(e?.detail?.userId);
            const blocked = Boolean(e?.detail?.blocked);
            if (!Number.isFinite(userId) || userId <= 0) return;

            if (blocked) {
                setFollowing((prev) => (Array.isArray(prev) ? prev.filter((u) => Number(u?.id) !== userId) : prev));
                setFollowers((prev) => (Array.isArray(prev) ? prev.filter((u) => Number(u?.id) !== userId) : prev));
            }
            fetchSocial();
            // Also refresh moderation list so Safety tab updates without tab switch
            fetchModeration();
        };

        const onHiddenChanged = () => {
            // Do not remove from Following/Followers; just refresh the moderation lists and social graph.
            fetchSocial();
            fetchModeration();
        };

        window.addEventListener('ll:user:blocked-changed', onBlockedChanged);
        window.addEventListener('ll:user:hidden-changed', onHiddenChanged);
        return () => {
            window.removeEventListener('ll:user:blocked-changed', onBlockedChanged);
            window.removeEventListener('ll:user:hidden-changed', onHiddenChanged);
        };
    }, [fetchSocial, fetchModeration]);

    /* --------------------------- UI persistence hooks --------------------------- */
// Reset search inputs each time the Social page mounts / viewer changes.
// This keeps the Social page "fresh" on every load and prevents stale searches from persisting.
    useEffect(() => {
        if (!viewer) return;

        // Find People (text + location selectors)
        setPeopleCounty('');
        setPeopleCity('');
        setPeopleSearch('');

        // Following / Followers (text + location + applied)
        setFollowingSearch('');
        setFollowingSearchApplied('');
        setFollowingCounty('');
        setFollowingCity('');
        setFollowingCountyApplied('');
        setFollowingCityApplied('');

        setFollowersSearch('');
        setFollowersSearchApplied('');
        setFollowersCounty('');
        setFollowersCity('');
        setFollowersCountyApplied('');
        setFollowersCityApplied('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewer?.id]);

    useEffect(() => {
        if (!viewer) return;
        try {
            const raw = localStorage.getItem(storageKey(viewer, 'feed_filters_v1'));
            if (!raw) return;
            const s = JSON.parse(raw);

            const next = {
                posts: { category: '', sort: 'any', dateRange: 'all' },
                comments: { category: '', sort: 'any', dateRange: 'all' },
                likes: { category: '', sort: 'any', dateRange: 'all' },
                reposts: { category: '', sort: 'any', dateRange: 'all' },
            };

            const apply = (k) => {
                if (!s?.[k]) return;
                const cat = typeof s[k].category === 'string' ? s[k].category : '';
                const sort = typeof s[k].sort === 'string' ? s[k].sort : 'any';
                const dateRange = typeof s[k].dateRange === 'string' ? s[k].dateRange : 'all';
                next[k] = { category: cat, sort, dateRange };
            };

            apply('posts');
            apply('comments');
            apply('likes');
            apply('reposts');

            setFeedFilters(next);
        } catch {
            // ignore
        }
    }, [viewer]);

    useEffect(() => {
        if (!viewer) return;
        try {
            localStorage.setItem(storageKey(viewer, 'feed_filters_v1'), JSON.stringify(feedFilters));
        } catch {
            // ignore
        }
    }, [viewer, feedFilters]);

    /* ------------------------------ actions ------------------------------ */

    const saveSocialState = useCallback(
        (extra = {}) => {
            if (!viewer) return;
            const snap = {
                tab,
                feedTab,
                feedRenderCount,
                feedPostsOffset,
                feedScrollTop: feedScrollRef.current ? feedScrollRef.current.scrollTop : 0,
                peopleSearch,
                peopleCounty,
                peopleCity,
                ...extra,
            };
            try {
                sessionStorage.setItem(socialStateKey(viewer), JSON.stringify(snap));
            } catch {
                // ignore
            }
        },
        [viewer, tab, feedTab, feedRenderCount, feedPostsOffset, peopleSearch, peopleCounty, peopleCity]
    );

    useEffect(() => {
        return () => {
            saveSocialState();
        };
    }, [saveSocialState]);

    const onPeopleSearch = () => fetchPeople();

    const applyFollowingSearch = useCallback(() => {
        setFollowingSearchApplied(String(followingSearch || ''));
        setFollowingCountyApplied(String(followingCounty || ''));
        setFollowingCityApplied(String(followingCity || ''));
    }, [followingSearch, followingCounty, followingCity]);

    const applyFollowersSearch = useCallback(() => {
        setFollowersSearchApplied(String(followersSearch || ''));
        setFollowersCountyApplied(String(followersCounty || ''));
        setFollowersCityApplied(String(followersCity || ''));
    }, [followersSearch, followersCounty, followersCity]);
    const onPeopleClear = () => {
        setPeopleSearch('');
        setPeopleCounty('');
        setPeopleCity('');
        setPeopleAccountType('');
        fetchPeople({ search: '', county: '', city: '' });
    };

    const openPostInCommunity = (postOrComment) => {
        const p = postOrComment?.post && typeof postOrComment.post === 'object' ? postOrComment.post : postOrComment;
        const id = Number(p?.id);
        if (!id) return;
        setPreviewCommentId(null);
        setPreviewPost(p);
    };

    /** Open a post in the preview dialog (from a comment click) */
    const openCommentInCommunity = (commentItem, viewPostOnly = false) => {
        const c = commentItem || {};
        const post0 = c.post && typeof c.post === 'object' ? c.post : {};
        const postId = Number(post0?.id || c?.post_id || 0);
        if (!postId) return;
        const commentId = viewPostOnly ? null : (Number(c?.comment_id || c?.id || 0) || null);
        setPreviewCommentId(commentId);
        setPreviewPost(post0);
    };

    const onRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        // Reseed so 'any' sort produces a fresh random order
        shuffleSeedRef.current = Date.now();
        try {
            if (tab === TAB.FEED) await fetchFeedActivity();
            else if (tab === TAB.PEOPLE) await fetchPeople();
            else if (tab === TAB.SAFETY) await fetchModeration();
            else await fetchSocial();
        } finally {
            // tiny delay so the fade feels intentional
            window.setTimeout(() => setRefreshing(false), 180);
        }
    };

    const toolbarPaperSx = {
        borderRadius: { xs: 0, sm: 3 },
        p: { xs: 1, sm: 1.25 },
        bgcolor: { xs: 'transparent', sm: alpha(theme.palette.background.paper, 0.96) },
        boxShadow: { xs: 'none', sm: `0 2px 8px ${alpha(theme.palette.text.primary, 0.04)}` },
        borderColor: { xs: 'transparent', sm: alpha(theme.palette.text.primary, 0.08) },
        border: { xs: 'none', sm: undefined },
        overflow: 'visible',
    };

    const pageShellSx = {
        bgcolor: 'background.default',
        height: availableHeight ? `${availableHeight}px` : '100dvh',
        overflow: 'hidden',
        overflowX: 'hidden',
        boxSizing: 'border-box',
    };

    const contentPaperSx = {
        flex: 1,
        minHeight: 320,
        overflow: 'hidden',
        borderRadius: { xs: 0, sm: 3 },
        bgcolor: { xs: 'transparent', sm: alpha(theme.palette.background.paper, 0.96) },
        borderColor: { xs: 'transparent', sm: alpha(theme.palette.text.primary, 0.08) },
        boxShadow: { xs: 'none', sm: `0 2px 12px ${alpha(theme.palette.text.primary, 0.05)}` },
        border: { xs: 'none', sm: undefined },
    };

    const feedContentPaperSx = {
        borderRadius: { xs: 0, sm: 3 },
        overflow: 'hidden',
        bgcolor: { xs: 'transparent', sm: alpha(theme.palette.background.paper, 0.97) },
        borderColor: { xs: 'transparent', sm: alpha(theme.palette.text.primary, 0.08) },
        boxShadow: { xs: 'none', sm: `0 2px 12px ${alpha(theme.palette.text.primary, 0.05)}` },
        border: { xs: 'none', sm: undefined },
    };

    /* ── Sidebar nav item style ── */
    const sidebarNavItem = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: { xs: 'center', md: 'flex-start' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 0.25, md: 1.25 },
        px: { xs: 1, md: 1.5 },
        py: { xs: 0.75, md: 1 },
        minWidth: { xs: 44, md: 'auto' },
        minHeight: { xs: 44, md: 'auto' },
        borderRadius: 2.5,
        cursor: 'pointer',
        fontWeight: isActive ? 800 : 600,
        fontSize: '0.875rem',
        color: isActive ? theme.palette.primary.dark : 'text.primary',
        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.10) : 'transparent',
        borderLeft: { xs: 'none', md: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent' },
        borderBottom: { xs: isActive ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent', md: 'none' },
        transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
        '&:hover': {
            bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.05),
            color: theme.palette.primary.dark,
        },
        userSelect: 'none',
        whiteSpace: 'nowrap',
    });

    const isFeedLoading = loadingFeed && tab === TAB.FEED;

    const isNonFeedLoading = (tab === TAB.PEOPLE && loadingPeople) || (tab === TAB.SAFETY && loadingSafety);


    /* ------------------------------ render helpers ------------------------------ */

    const renderEmpty = (title, subtitle) => (
        <Box
            sx={{
                py: { xs: 8, md: 12 },
                px: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
            }}
        >
            <ForumRoundedIcon
                sx={(t) => ({
                    fontSize: 84,
                    color: alpha(t.palette.primary.main, 0.86),
                    mb: 1.5,
                })}
            />
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary', mb: 0.75 }}>
                {title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', maxWidth: 380, mx: 'auto' }}>
                {subtitle}
            </Typography>
        </Box>
    );

    const renderUserGrid = (list, topPad = 0, mode = 'people') => {
        const full = Array.isArray(list) ? list : [];
        const renderCount = mode === 'people' ? peopleRenderCount : mode === 'following' ? followingRenderCount : mode === 'followers' ? followersRenderCount : full.length;
        const sliced = full.slice(0, Math.max(0, renderCount));

        const handleScroll = (e) => {
            const el = e.currentTarget;
            if (!el) return;
            const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 320;
            if (!nearBottom) return;

            if (mode === 'people' && peopleRenderCount < full.length) {
                setPeopleRenderCount((c) => Math.min(c + PAGE_SIZE, full.length));
            } else if (mode === 'following' && followingRenderCount < full.length) {
                setFollowingRenderCount((c) => Math.min(c + PAGE_SIZE, full.length));
            } else if (mode === 'followers' && followersRenderCount < full.length) {
                setFollowersRenderCount((c) => Math.min(c + PAGE_SIZE, full.length));
            }
        };
        const CARD_W = 450;
        const GAP_U = 4;
        const isSingleRow = (list?.length || 0) <= 1;

        const getIsFollowing = (u) => {
            const tid = Number(u?.id);
            if (!tid) return false;
            return serverFollowingSet.has(tid) || locallyFollowed.has(tid);
        };

        const getIsSelfRow = (u) => {
            const tid = Number(u?.id);
            if (!tid || !viewer?.id) return false;
            return Number(viewer.id) === tid;
        };

        const getAction = (u) => {
            const isSelfRow = getIsSelfRow(u);
            const tid = Number(u?.id);
            if (isSelfRow || !tid) return { label: '', variant: 'contained', disabled: true, onClick: null };

            const isFollowingNow = getIsFollowing(u);

            if (mode === 'followers') {
                if (isFollowingNow) {
                    return { label: 'Following', variant: 'outlined', disabled: false, onClick: () => openUnfollowConfirm(u) };
                }
                return { label: 'Follow back', variant: 'contained', disabled: false, onClick: () => handleFollowToggle(u, 'follow') };
            }

            if (mode === 'following') {
                return { label: 'Following', variant: 'outlined', disabled: false, onClick: () => openUnfollowConfirm(u) };
            }

            // people
            if (isFollowingNow) {
                return { label: 'Following', variant: 'outlined', disabled: false, onClick: () => openUnfollowConfirm(u) };
            }
            return { label: 'Follow', variant: 'contained', disabled: false, onClick: () => handleFollowToggle(u, 'follow') };
        };

        return (
            <Box onScroll={handleScroll} sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', pr: 1, pt: topPad }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: isSingleRow ? '1fr' : `repeat(2, ${CARD_W}px)` },
                        justifyContent: { md: isSingleRow ? 'flex-start' : 'center' },
                        columnGap: GAP_U,
                        rowGap: GAP_U,
                        pb: 2,
                    }}
                >
                    {(sliced || []).map((u) => {
                        const action = getAction(u);
                        const idNum = Number(u?.id);
                        const cached = Number.isFinite(idNum) ? publicProfileById?.[idNum] : null;
                        const city = String(cached?.city || u?.home_city || u?.city || '').trim();
                        const county = String(cached?.county || u?.home_county || u?.county || '').trim();
                        const state = String(cached?.state || u?.home_state || u?.state || '').trim();
                        const parts = [city, county].filter(Boolean);
                        let locText = parts.join(', ');
                        if (!locText) locText = city || county || '';

                        const st = state.toLowerCase();
                        if (locText && st && st !== 'al' && st !== 'alabama') {
                            locText = `${locText}, ${state}`;
                        }
                        return (
                            <Box key={u?.id || u?.public_id || u?.handle} sx={{ width: '100%' }}>
                                <UserCard
                                    user={{ ...u, ...(cached || {}) }}
                                    locationText={locText}
                                    onOpenUserCard={handleOpenUserCard}
                                    actionLabel={action.label}
                                    actionVariant={action.variant}
                                    actionDisabled={action.disabled}
                                    onAction={action.onClick}
                                />
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    const feedKey = feedTab === 0 ? 'posts' : feedTab === 1 ? 'comments' : feedTab === 2 ? 'likes' : 'reposts';
    const activeFilter = feedFilters[feedKey];

    const activeRawList = useMemo(() => {
        if (feedTab === 0) return Array.isArray(feedPosts) ? feedPosts : [];
        if (feedTab === 1) return Array.isArray(feedComments) ? feedComments : [];
        if (feedTab === 2) return Array.isArray(feedLikes) ? feedLikes : [];
        return Array.isArray(feedReposts) ? feedReposts : [];
    }, [feedTab, feedPosts, feedComments, feedLikes, feedReposts]);

    const commentGroups = useMemo(() => {
        if (feedTab !== 1) return [];
        const arr = Array.isArray(activeRawList) ? activeRawList : [];
        const cat = String(activeFilter?.category || '').trim().toLowerCase();
        const sort = String(activeFilter?.sort || 'any').trim().toLowerCase();
        const dateRange = String(activeFilter?.dateRange || 'all').trim().toLowerCase();
        const searchTerm = String(activeFilter?.searchTerm || '').trim().toLowerCase();
        const accountType = String(activeFilter?.accountType || '').trim().toLowerCase();
        const dateFrom = activeFilter?.dateFrom || '';
        const dateTo = activeFilter?.dateTo || '';

        let filtered = cat
            ? arr.filter((c) => categoryForItem(c) === cat)
            : arr.slice();

        // Search term filter (search comment content + parent post)
        if (searchTerm) {
            filtered = filtered.filter((c) => {
                const cText = String(c?.content || c?.body || '').toLowerCase();
                const post = c?.post && typeof c.post === 'object' ? c.post : {};
                return cText.includes(searchTerm) || getSearchTextForPost(post).includes(searchTerm);
            });
        }

        // Account type filter (filter by parent post type)
        if (accountType) {
            filtered = filtered.filter((c) => {
                const post = c?.post && typeof c.post === 'object' ? c.post : {};
                return getPostAccountType(post) === accountType;
            });
        }

        // Apply date range dropdown filter to comments
        if (dateRange && dateRange !== 'all') {
            const now = Date.now();
            let cutoff = 0;
            if (dateRange === 'today') cutoff = now - 24 * 60 * 60 * 1000;
            else if (dateRange === 'week') cutoff = now - 7 * 24 * 60 * 60 * 1000;
            else if (dateRange === 'month') cutoff = now - 30 * 24 * 60 * 60 * 1000;

            if (cutoff > 0) {
                filtered = filtered.filter((c) => getDateMsForComment(c) >= cutoff);
            }
        }

        // Custom date range
        if (dateFrom) {
            const fromMs = new Date(dateFrom).setHours(0, 0, 0, 0);
            if (Number.isFinite(fromMs)) filtered = filtered.filter((c) => getDateMsForComment(c) >= fromMs);
        }
        if (dateTo) {
            const toMs = new Date(dateTo).setHours(23, 59, 59, 999);
            if (Number.isFinite(toMs)) filtered = filtered.filter((c) => getDateMsForComment(c) <= toMs);
        }

        filtered.sort((a, b) => getDateMsForComment(b) - getDateMsForComment(a));

        const map = new Map();
        const groups = [];

        filtered.forEach((c) => {
            const post = c?.post && typeof c.post === 'object' ? c.post : null;
            const pid = Number(post?.id ?? c?.post_id ?? 0);
            if (!Number.isFinite(pid) || pid <= 0) return;

            if (!map.has(pid)) {
                const g = { post: post || {}, post_id: pid, comments: [] };
                map.set(pid, g);
                groups.push(g);
            }
            map.get(pid).comments.push(c);
        });

        if (sort === 'popular') {
            groups.sort((a, b) => getLikesCount(b?.post) - getLikesCount(a?.post));
        } else if (sort === 'any') {
            // Seeded shuffle for comment groups
            let seed = shuffleSeedRef.current;
            const seededRandom = () => {
                seed = (seed * 16807 + 0) % 2147483647;
                return (seed - 1) / 2147483646;
            };
            for (let i = groups.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom() * (i + 1));
                const tmp = groups[i];
                groups[i] = groups[j];
                groups[j] = tmp;
            }
        }
        // 'newest' keeps the initial date sort from above

        return groups;
    }, [feedTab, activeRawList, activeFilter]);

    const filteredSortedPosts = useMemo(() => {
        if (feedTab === 1) return [];
        const list = Array.isArray(activeRawList) ? activeRawList.slice() : [];
        const cat = String(activeFilter?.category || '').trim().toLowerCase();
        const sort = String(activeFilter?.sort || 'any').trim().toLowerCase();
        const dateRange = String(activeFilter?.dateRange || 'all').trim().toLowerCase();
        const searchTerm = String(activeFilter?.searchTerm || '').trim().toLowerCase();
        const accountType = String(activeFilter?.accountType || '').trim().toLowerCase();
        const dateFrom = activeFilter?.dateFrom || '';
        const dateTo = activeFilter?.dateTo || '';

        let out = cat ? list.filter((p) => categoryForItem(p) === cat) : list;

        // Search term filter
        if (searchTerm) {
            out = out.filter((p) => getSearchTextForPost(p).includes(searchTerm));
        }

        // Account type filter (personal / business / artist)
        if (accountType) {
            out = out.filter((p) => getPostAccountType(p) === accountType);
        }

        // Apply date range dropdown filter
        if (dateRange && dateRange !== 'all') {
            const now = Date.now();
            let cutoff = 0;
            if (dateRange === 'today') cutoff = now - 24 * 60 * 60 * 1000;
            else if (dateRange === 'week') cutoff = now - 7 * 24 * 60 * 60 * 1000;
            else if (dateRange === 'month') cutoff = now - 30 * 24 * 60 * 60 * 1000;

            if (cutoff > 0) {
                out = out.filter((p) => getDateMsForPost(p) >= cutoff);
            }
        }

        // Custom date range (From / To date pickers)
        if (dateFrom) {
            const fromMs = new Date(dateFrom).setHours(0, 0, 0, 0);
            if (Number.isFinite(fromMs)) out = out.filter((p) => getDateMsForPost(p) >= fromMs);
        }
        if (dateTo) {
            const toMs = new Date(dateTo).setHours(23, 59, 59, 999);
            if (Number.isFinite(toMs)) out = out.filter((p) => getDateMsForPost(p) <= toMs);
        }

        if (sort === 'popular') {
            out.sort((a, b) => getLikesCount(b) - getLikesCount(a));
        } else if (sort === 'newest') {
            out.sort((a, b) => getDateMsForPost(b) - getDateMsForPost(a));
        } else {
            // 'any' — seeded Fisher-Yates shuffle so order is random but stable per session
            let seed = shuffleSeedRef.current;
            const seededRandom = () => {
                seed = (seed * 16807 + 0) % 2147483647;
                return (seed - 1) / 2147483646;
            };
            for (let i = out.length - 1; i > 0; i--) {
                const j = Math.floor(seededRandom() * (i + 1));
                const tmp = out[i];
                out[i] = out[j];
                out[j] = tmp;
            }
        }

        return out;
    }, [feedTab, activeRawList, activeFilter]);

// Reset paging whenever switching feed tab or changing filters
    useEffect(() => {
        // Skip reset if we're restoring scroll position from a previous visit
        if (feedRestoreLimitRef.current > 0) return;
        setFeedRenderCount(PAGE_SIZE);
    }, [feedTab, activeFilter?.category, activeFilter?.sort, activeFilter?.dateRange, activeFilter?.searchTerm, activeFilter?.accountType, activeFilter?.dateFrom, activeFilter?.dateTo]);

    const feedTotal = feedTab === 0
        ? (Number.isFinite(Number(feedPostsTotal)) && Number(feedPostsTotal) > 0 ? Number(feedPostsTotal) : filteredSortedPosts.length)
        : feedTab === 1
            ? commentGroups.length
            : filteredSortedPosts.length;
    const visibleCount = Math.min(feedRenderCount, feedTotal);

    const feedScrollRef = useRef(null);
    const pendingScrollRestoreRef = useRef(
        socialShouldRestoreRef.current && socialSavedScrollTopRef.current > 0
            ? socialSavedScrollTopRef.current
            : null
    );
    const feedRestoreLimitRef = useRef(
        socialShouldRestoreRef.current && cachedFeed
            ? Math.max(cachedFeed.renderCount || PAGE_SIZE, PAGE_SIZE)
            : cachedFeed && cachedFeed.renderCount > PAGE_SIZE
                ? cachedFeed.renderCount
                : 0
    );
    const loadMoreRef = useRef(null);

    const loadMoreFeedPosts = useCallback(async () => {
        if (feedTab !== 0) return;
        if (loadingMoreFeedPosts) return;
        if (!feedPostsHasMore) return;

        const nextOffset = Number(feedPostsOffset) || 0;

        setLoadingMoreFeedPosts(true);
        try {
            const params = new URLSearchParams();
            params.set('sort', 'newest');
            params.set('limit', String(PAGE_SIZE));
            params.set('offset', String(Math.max(0, nextOffset)));

            // Include account context for business/artist accounts
            const moreHeaders = {};
            if (activeAccountId && activeAccountId !== 'personal') {
                params.set('account_id', activeAccountId);
                params.set('account_type', activeAccountType);
                moreHeaders['x-account-type'] = activeAccountType;
                if (activeAccountType === 'business') {
                    moreHeaders['x-business-id'] = String(activeAccountId);
                } else if (activeAccountType === 'artist') {
                    moreHeaders['x-artist-id'] = String(activeAccountId);
                }
            }

            const { data: j } = await fetchJsonWithTimeout(`/api/social/feed?${params.toString()}`, 12000, moreHeaders);
            const arr = Array.isArray(j)
                ? j
                : Array.isArray(j?.posts)
                    ? j.posts
                    : Array.isArray(j?.data)
                        ? j.data
                        : [];

            const page = Array.isArray(arr) ? arr : [];
            if (page.length) {
                setFeedPosts((prev) => {
                    const seen = new Set((Array.isArray(prev) ? prev : []).map((p) => Number(p?.id || 0)).filter(Boolean));
                    const merged = Array.isArray(prev) ? prev.slice() : [];
                    page.forEach((p) => {
                        const id = Number(p?.id || 0);
                        if (!id || seen.has(id)) return;
                        seen.add(id);
                        merged.push(p);
                    });
                    return merged;
                });
                setFeedPostsOffset(nextOffset + page.length);
                setFeedRenderCount((c) => c + PAGE_SIZE);
            }

            const totalRaw = j?.total ?? j?.meta?.total ?? j?.pagination?.total ?? j?.count ?? null;
            const totalNum = Number(totalRaw);
            const total = Number.isFinite(totalNum) && totalNum >= 0 ? totalNum : Number(feedPostsTotal) || (nextOffset + page.length);
            setFeedPostsTotal(total);
            setFeedPostsHasMore(nextOffset + page.length < total);
        } catch {
            // keep current
        } finally {
            setLoadingMoreFeedPosts(false);
        }
    }, [feedTab, loadingMoreFeedPosts, feedPostsHasMore, feedPostsOffset, feedPostsTotal, activeAccountId, activeAccountType]);
    const socialRestoredRef = useRef(false);

    useEffect(() => {
        const el = loadMoreRef.current;
        const root = feedScrollRef.current;
        if (!el || !root) return;

        const io = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) return;

                // Feed tab
                if (tab === TAB.FEED) {
                    if (feedTab === 0) {
                        // Always reveal more already-loaded posts
                        setFeedRenderCount((c) => Math.min(c + PAGE_SIZE, feedTotal));
                        // Also fetch more from the API if there are more pages
                        loadMoreFeedPosts();
                        return;
                    }
                    setFeedRenderCount((c) => Math.min(c + PAGE_SIZE, feedTotal));
                    return;
                }

                // Find People tab (network paging + progressive render)
                if (tab === TAB.PEOPLE) {
                    const loaded = Array.isArray(rows) ? rows.length : 0;

                    if (peopleRenderCount < loaded) {
                        setPeopleRenderCount((c) => Math.min(c + PAGE_SIZE, loaded));
                        return;
                    }

                    if (!loadingPeople && !loadingMorePeople && peopleHasMore) {
                        fetchPeople({ append: true, reset: false });
                    }
                    return;
                }

                // Following / Followers (progressive render only)
                if (tab === TAB.FOLLOWING) {
                    const total = Array.isArray(followingFiltered) ? followingFiltered.length : 0;
                    setFollowingRenderCount((c) => Math.min(c + PAGE_SIZE, total));
                    return;
                }

                if (tab === TAB.FOLLOWERS) {
                    const total = Array.isArray(followersFiltered) ? followersFiltered.length : 0;
                    setFollowersRenderCount((c) => Math.min(c + PAGE_SIZE, total));
                }
            },
            { root, rootMargin: '800px' }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [
        tab,
        feedTotal,
        feedTab,
        loadMoreFeedPosts,
        rows.length,
        peopleRenderCount,
        peopleHasMore,
        loadingPeople,
        loadingMorePeople,
        fetchPeople,
        followingFiltered.length,
        followersFiltered.length,
    ]);


// Restore Social page state when returning from Post Page
    // Detect return via location.key change + sessionStorage restore flag.
    const prevLocationKeyRef = useRef(location?.key);

    useEffect(() => {
        if (!viewer) return;

        const isNewLocation = location?.key && location.key !== prevLocationKeyRef.current;
        prevLocationKeyRef.current = location?.key;

        if (socialRestoredRef.current && !isNewLocation) return;

        // Check if we should restore (synchronous capture already determined this)
        let shouldRestore = socialShouldRestoreRef.current === true;
        if (!shouldRestore) {
            try {
                shouldRestore = sessionStorage.getItem(socialRestoreKey(viewer)) === '1';
            } catch {
                shouldRestore = false;
            }
        }
        if (!shouldRestore) {
            shouldRestore = Boolean(location?.state?.restoreSocial);
        }
        if (!shouldRestore) {
            socialRestoredRef.current = true;
            return;
        }

        // Clear restore flags + cached data
        socialShouldRestoreRef.current = false;
        try {
            sessionStorage.setItem(socialRestoreKey(viewer), '0');
            sessionStorage.removeItem(SOCIAL_FEED_SCROLL_KEY);
            sessionStorage.removeItem(socialFeedDataKey(viewer));
        } catch {
            // ignore
        }

        try {
            const raw = sessionStorage.getItem(socialStateKey(viewer));
            if (raw) {
                const snap = JSON.parse(raw);
                if (Number.isFinite(Number(snap?.tab))) setTab(Number(snap.tab));
                if (Number.isFinite(Number(snap?.feedTab))) setFeedTab(Number(snap.feedTab));
                if (typeof snap?.peopleSearch === 'string') setPeopleSearch(snap.peopleSearch);
                if (typeof snap?.peopleCounty === 'string') setPeopleCounty(snap.peopleCounty);
                if (typeof snap?.peopleCity === 'string') setPeopleCity(snap.peopleCity);
            }
        } catch {
            // ignore
        }

        // Set pending scroll — prefer the dedicated scroll key, fall back to snap
        const top = socialSavedScrollTopRef.current;
        if (Number.isFinite(top) && top > 0) {
            pendingScrollRestoreRef.current = top;
        }

        // Clear the restore guard after a delay so subsequent tab/filter changes
        // trigger normal fetches again (the guard was preventing re-fetch on restore)
        setTimeout(() => { feedRestoreLimitRef.current = 0; }, 6000);

        socialRestoredRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewer?.id, location?.key]);

    // ── Scroll position restoration (matches CommunityPanel exactly) ──
    // Uses useLayoutEffect for pre-paint application and rAF loop for persistence.
    const restoreScrollTopRef = useRef(pendingScrollRestoreRef.current);

    useLayoutEffect(() => {
        const top = restoreScrollTopRef.current;
        if (!(top > 0)) return;
        const el = feedScrollRef.current;
        if (el) {
            el.scrollTop = top;
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const top = restoreScrollTopRef.current || pendingScrollRestoreRef.current;
        if (!(top > 0)) return undefined;

        let rafId = null;
        let tries = 0;
        const maxTries = 300;            // ~5 seconds at 60 fps
        let consecutiveHolds = 0;
        const requiredHolds = 10;        // must stick for 10 frames

        const tick = () => {
            tries += 1;
            const el = feedScrollRef.current;
            if (el) {
                el.scrollTop = top;

                if (Math.abs(el.scrollTop - top) < 2) {
                    consecutiveHolds += 1;
                    if (consecutiveHolds >= requiredHolds) {
                        pendingScrollRestoreRef.current = null;
                        restoreScrollTopRef.current = 0;
                        return;
                    }
                } else {
                    consecutiveHolds = 0;
                }
            }
            if (tries < maxTries) {
                rafId = window.requestAnimationFrame(tick);
            } else {
                pendingScrollRestoreRef.current = null;
                restoreScrollTopRef.current = 0;
            }
        };

        rafId = window.requestAnimationFrame(tick);

        return () => {
            if (rafId) {
                try { window.cancelAnimationFrame(rafId); } catch { /* ignore */ }
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-apply scroll whenever feed data changes (content grows from API/engagement)
    useEffect(() => {
        const top = restoreScrollTopRef.current || pendingScrollRestoreRef.current;
        if (!(top > 0)) return;
        const el = feedScrollRef.current;
        if (el) {
            el.scrollTop = top;
        }
    }, [feedPosts, activeRawList]);

    const countText = useMemo(() => {
        const word = (n, singular, plural) => (Number(n) === 1 ? singular : plural);

        if (tab === TAB.FEED) {
            if (loadingFeed) return 'Loading…';
            const total = Number.isFinite(Number(feedTotal)) ? Number(feedTotal) : 0;
            const shown = Number.isFinite(Number(visibleCount)) ? Number(visibleCount) : 0;
            return `Displaying ${shown} of ${total} ${word(total, 'item', 'items')}`;
        }

        if (tab === TAB.PEOPLE) {
            if (loadingPeople) return 'Loading…';
            const filtered = Array.isArray(peopleFiltered) ? peopleFiltered : [];
            const total = filtered.length;
            const shown = Math.min(peopleRenderCount, total);
            return `Displaying ${shown} of ${total} ${word(total, 'person', 'people')}`;
        }

        if (tab === TAB.FOLLOWING) {
            const total = Array.isArray(followingFiltered) ? followingFiltered.length : 0;
            const shown = Math.min(followingRenderCount, total);
            return `Displaying ${shown} of ${total} ${word(total, 'following', 'following')}`;
        }

        if (tab === TAB.FOLLOWERS) {
            const total = Array.isArray(followersFiltered) ? followersFiltered.length : 0;
            const shown = Math.min(followersRenderCount, total);
            return `Displaying ${shown} of ${total} ${word(total, 'follower', 'followers')}`;
        }

        if (tab === TAB.SAFETY) {
            return '';
        }

        return '';
    }, [
        tab,
        TAB.FEED,
        TAB.PEOPLE,
        TAB.FOLLOWING,
        TAB.FOLLOWERS,
        TAB.SAFETY,
        loadingFeed,
        loadingPeople,
        feedTotal,
        visibleCount,
        peopleFiltered,
        peopleRenderCount,
        followingFiltered,
        followingRenderCount,
        followersFiltered,
        followersRenderCount,
        moderation,
    ]);



    const peopleCounties = useMemo(() => {
        const raw = Array.isArray(cityCountyData) ? cityCountyData : [];
        const set = new Set();
        raw.forEach((c) => {
            const nm = normalizeCountyName(c?.county);
            if (nm) set.add(nm);
        });
        return Array.from(set).sort();
    }, []);

    const peopleCities = useMemo(() => {
        const raw = Array.isArray(cityCountyData) ? cityCountyData : [];
        const countySel = normalizeCountyName(peopleCounty).toLowerCase();

        const names = raw
            .filter((c) => {
                if (!countySel) return true;
                return normalizeCountyName(c?.county).toLowerCase() === countySel;
            })
            .map((c) => String(c?.name || c?.city || '').trim())
            .filter(Boolean);

        return Array.from(new Set(names)).sort();
    }, [peopleCounty]);
    const followingCities = useMemo(() => {
        const raw = Array.isArray(cityCountyData) ? cityCountyData : [];
        const countySel = normalizeCountyName(followingCounty).toLowerCase();

        const names = raw
            .filter((c) => {
                if (!countySel) return true;
                return normalizeCountyName(c?.county).toLowerCase() === countySel;
            })
            .map((c) => String(c?.name || c?.city || '').trim())
            .filter(Boolean);

        return Array.from(new Set(names)).sort();
    }, [followingCounty]);

    const followersCities = useMemo(() => {
        const raw = Array.isArray(cityCountyData) ? cityCountyData : [];
        const countySel = normalizeCountyName(followersCounty).toLowerCase();

        const names = raw
            .filter((c) => {
                if (!countySel) return true;
                return normalizeCountyName(c?.county).toLowerCase() === countySel;
            })
            .map((c) => String(c?.name || c?.city || '').trim())
            .filter(Boolean);

        return Array.from(new Set(names)).sort();
    }, [followersCounty]);

    const updateFeedFilter = (patch) => {
        setFeedFilters((prev) => ({
            ...prev,
            [feedKey]: { ...prev[feedKey], ...patch },
        }));
    };

    const tabStyles = (t) => ({
        minHeight: { xs: 44, sm: 52 },
        width: '100%',
        border: 'none',
        borderRadius: 0,
        bgcolor: 'transparent',
        px: 0,
        mx: 0,
        '& .MuiTabs-scroller': {
            borderRadius: 0,
        },
        '& .MuiTabs-flexContainer': {
            borderRadius: 0,
        },
        '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            backgroundColor: t.palette.secondary.main,
        },
        '& .MuiTab-root': {
            textTransform: 'none',
            minHeight: { xs: 44, sm: 52 },
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            color: alpha(t.palette.primary.main, 0.85),
            py: { xs: 0.75, sm: 1 },
            px: { xs: 0.5, sm: 2 },
            borderRadius: 0,
            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}, color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
            '& .MuiTab-iconWrapper': {
                marginBottom: 0,
                display: 'flex',
                alignItems: 'center',
            },
            '& .llTabIcon': {
                color: alpha(t.palette.primary.main, 0.7),
                transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
            },
            '&:hover': {
                bgcolor: alpha(t.palette.text.primary, 0.04),
                color: t.palette.text.primary,
            },
            '&:hover .llTabIcon': {
                color: t.palette.secondary.main,
            },
            '&.Mui-selected': {
                color: t.palette.primary.main,
                fontWeight: 750,
            },
            '&.Mui-selected .llTabIcon': {
                color: t.palette.secondary.main,
            },
        },
    });

    return (
        <Box ref={pageRef} sx={pageShellSx}>
            <Fade in={pageIn} timeout={prefersReducedMotion ? 0 : 220} appear>
                <Box sx={{ height: '100%' }}>
                    <Box
                        sx={{
                            maxWidth: 1400,
                            transform: pageIn ? 'none' : 'translateY(6px)',
                            transition: prefersReducedMotion ? 'none' : ((t) => `transform ${t.custom.motion.slow}ms ease-out`),
                            mx: 'auto',
                            px: { xs: 0, sm: 1.5, md: 2 },
                            pt: { xs: 0, sm: 1.5 },
                            pb: { xs: 0, sm: 3 },
                            height: '100%',
                            display: 'flex',
                            flexDirection: { xs: 'column', md: 'row' },
                            gap: { xs: 0, md: 1.5 },
                            minHeight: 0,
                            minWidth: 0,
                        }}
                    >
                        {/* ═══════ LEFT SIDEBAR (desktop) / TOP BAR (mobile) ═══════ */}
                        <Paper
                            variant="outlined"
                            sx={{
                                flexShrink: 0,
                                width: { xs: '100%', md: 220 },
                                display: 'flex',
                                flexDirection: { xs: 'row', md: 'column' },
                                gap: { xs: 0.5, md: 0.25 },
                                position: { md: 'sticky' },
                                top: 0,
                                alignSelf: { md: 'flex-start' },
                                maxHeight: { md: '100%' },
                                overflowY: { md: 'auto' },
                                overflowX: { xs: 'auto', md: 'hidden' },
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' },
                                WebkitOverflowScrolling: 'touch',
                                borderRadius: { xs: 0, md: 3 },
                                bgcolor: { xs: 'transparent', sm: alpha(theme.palette.background.paper, 0.97) },
                                borderColor: { xs: 'transparent', sm: alpha(theme.palette.text.primary, 0.07) },
                                boxShadow: { xs: 'none', sm: `0 2px 12px ${alpha(theme.palette.text.primary, 0.05)}` },
                                border: { xs: 'none', sm: undefined },
                                p: { xs: 0.5, md: 1 },
                            }}
                        >
                            {/* Profile section — avatar + name (all account types) */}
                            {isLoggedIn && (
                                <Box
                                    sx={{
                                        display: { xs: 'none', md: 'flex' },
                                        alignItems: 'center',
                                        gap: 1.25,
                                        px: 1.5,
                                        py: 1.25,
                                        mb: 0.5,
                                        borderRadius: 2.5,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        borderBottom: '1px solid',
                                        borderColor: alpha(theme.palette.primary.main, 0.08),
                                    }}
                                >
                                    {(() => {
                                        const sidebarAvatarUrl = isBusinessAccount
                                            ? (activeAccount?.logo || activeAccount?.image || activeAccount?.avatar_url || '')
                                            : isArtistAccount
                                                ? (activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.image || '')
                                                : (viewer?.avatar_url || viewer?.profile_picture || '');
                                        const showSidebarIcon = isDefaultAvatar(sidebarAvatarUrl);
                                        const activeProfileType = String(activeAccount?.profile_type || activeAccount?.profileType || '').toLowerCase();
                                        const isViewerVisualArtist = isArtistAccount && activeProfileType === 'artist';

                                        return (
                                            <Avatar
                                                src={showSidebarIcon ? undefined : sidebarAvatarUrl}
                                                sx={(t) => ({
                                                    width: 36,
                                                    height: 36,
                                                    border: '2px solid',
                                                    borderColor: alpha(t.palette.primary.main, 0.18),
                                                    flexShrink: 0,
                                                    ...(showSidebarIcon
                                                            ? (isBusinessAccount || isArtistAccount)
                                                                ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main }
                                                                : { bgcolor: alpha(t.palette.text.primary, 0.06), color: t.palette.text.secondary }
                                                            : null
                                                    ),
                                                })}
                                            >
                                                {showSidebarIcon
                                                    ? isBusinessAccount
                                                        ? <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
                                                        : isArtistAccount
                                                            ? (isViewerVisualArtist
                                                                ? <PaletteRoundedIcon sx={{ fontSize: 18 }} />
                                                                : <MusicNoteRoundedIcon sx={{ fontSize: 18 }} />)
                                                            : <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                                    : null}
                                            </Avatar>
                                        );
                                    })()}
                                    <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                                        <Typography
                                            noWrap
                                            sx={{
                                                fontWeight: 750,
                                                fontSize: '0.85rem',
                                                lineHeight: 1.25,
                                                color: 'text.primary',
                                            }}
                                        >
                                            {isBusinessAccount
                                                ? (activeAccount?.name || (activeAccount?.slug ? `@${activeAccount.slug}` : '') || 'My Account')
                                                : isArtistAccount
                                                    ? (activeAccount?.name || (activeAccount?.handle ? `@${activeAccount.handle}` : '') || 'My Account')
                                                    : (toName(viewer) || toHandle(viewer) || 'My Account')}
                                        </Typography>
                                        {isBusinessAccount ? (
                                            <Typography
                                                variant="caption"
                                                noWrap
                                                sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.3 }}
                                            >
                                                {activeAccount?.slug ? `@${activeAccount.slug}` : (activeAccount?.handle ? `@${activeAccount.handle}` : '')}
                                            </Typography>
                                        ) : isArtistAccount ? (
                                            <Typography
                                                variant="caption"
                                                noWrap
                                                sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.3 }}
                                            >
                                                {activeAccount?.handle ? `@${activeAccount.handle}` : (activeAccount?.slug ? `@${activeAccount.slug}` : '')}
                                            </Typography>
                                        ) : toHandle(viewer) ? (
                                            <Typography
                                                variant="caption"
                                                noWrap
                                                sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.3 }}
                                            >
                                                {toHandle(viewer)}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </Box>
                            )}

                            {/* Nav items — horizontal scroll on mobile, vertical on desktop */}
                            {isLoggedIn && (
                                <Box
                                    onClick={() => setTab(TAB.FEED)}
                                    sx={sidebarNavItem(tab === TAB.FEED)}
                                >
                                    <DynamicFeedIcon sx={{ fontSize: 20 }} />
                                    <Box component="span" sx={{ display: { xs: 'block', md: 'inline' }, fontSize: { xs: '0.65rem', md: '0.875rem' }, lineHeight: 1 }}>Feed</Box>
                                </Box>
                            )}

                            <Box
                                onClick={() => setTab(TAB.PEOPLE)}
                                sx={sidebarNavItem(tab === TAB.PEOPLE)}
                            >
                                <PersonSearchIcon sx={{ fontSize: 20 }} />
                                <Box component="span" sx={{ display: { xs: 'block', md: 'inline' }, fontSize: { xs: '0.65rem', md: '0.875rem' }, lineHeight: 1 }}>People</Box>
                            </Box>

                            {isLoggedIn && (
                                <Box
                                    onClick={() => setTab(TAB.FOLLOWING)}
                                    sx={sidebarNavItem(tab === TAB.FOLLOWING)}
                                >
                                    <PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />
                                    <Box component="span" sx={{ display: { xs: 'block', md: 'inline' }, fontSize: { xs: '0.65rem', md: '0.875rem' }, lineHeight: 1 }}>
                                        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Following ({safeNumber(counts.following)})</Box>
                                        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Following</Box>
                                    </Box>
                                </Box>
                            )}

                            {isLoggedIn && (
                                <Box
                                    onClick={() => setTab(TAB.FOLLOWERS)}
                                    sx={sidebarNavItem(tab === TAB.FOLLOWERS)}
                                >
                                    <PersonAddAltOutlinedIcon sx={{ fontSize: 20 }} />
                                    <Box component="span" sx={{ display: { xs: 'block', md: 'inline' }, fontSize: { xs: '0.65rem', md: '0.875rem' }, lineHeight: 1 }}>
                                        <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Followers ({safeNumber(counts.followers)})</Box>
                                        <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>Followers</Box>
                                    </Box>
                                </Box>
                            )}

                            {isLoggedIn && (
                                <Box
                                    onClick={() => setTab(TAB.SAFETY)}
                                    sx={sidebarNavItem(tab === TAB.SAFETY)}
                                >
                                    <ShieldIcon sx={{ fontSize: 20 }} />
                                    <Box component="span" sx={{ display: { xs: 'block', md: 'inline' }, fontSize: { xs: '0.65rem', md: '0.875rem' }, lineHeight: 1 }}>Safety</Box>
                                </Box>
                            )}

                            {/* Divider + Refresh */}
                            <Divider sx={{ my: 0.5, display: { xs: 'none', md: 'block' } }} />
                            <Box sx={{ px: { md: 0.5 }, ml: { xs: 'auto', md: 0 } }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    startIcon={
                                        <RefreshIcon
                                            sx={{
                                                transition: (t) => `transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                                fontSize: 18,
                                                ...(refreshing ? { animation: 'llSpin .9s linear infinite' } : null),
                                            }}
                                        />
                                    }
                                    onClick={onRefresh}
                                    disabled={refreshing}
                                    sx={{
                                        whiteSpace: 'nowrap',
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        px: 1.5,
                                        py: 0.6,
                                        opacity: refreshing ? 0.85 : 1,
                                    }}
                                >
                                    {refreshing ? 'Refreshing…' : 'Refresh'}
                                </Button>
                            </Box>
                        </Paper>

                        {/* ═══════ MAIN CONTENT AREA ═══════ */}
                        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.25, height: '100%' }}>

                            {/* ── Inline Post Detail View (replaces feed when a post is selected) ── */}
                            {previewPost && (
                                <Fade in timeout={250}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            flex: 1,
                                            minHeight: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            borderRadius: { xs: 0, sm: 3 },
                                            border: { xs: 'none', sm: undefined },
                                        }}
                                    >
                                        {/* Back to feed bar */}
                                        <Box
                                            sx={(t) => ({
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: { xs: 1.5, sm: 2 },
                                                py: 1,
                                                borderBottom: '1px solid',
                                                borderColor: alpha(t.palette.text.primary, 0.08),
                                                bgcolor: 'background.paper',
                                                flexShrink: 0,
                                                cursor: 'pointer',
                                                transition: `background-color 160ms ease`,
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.03),
                                                },
                                            })}
                                            onClick={() => { setPreviewPost(null); setPreviewCommentId(null); }}
                                        >
                                            <ArrowBackRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: 'primary.main' }}>
                                                Back to feed
                                            </Typography>
                                        </Box>

                                        {/* Post detail content */}
                                        <Box ref={previewScrollBoxRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                                            {detectPostKind(previewPost) === 'artist' && (
                                                <MusicPostDetailPanel
                                                    post={previewPost}
                                                    user={viewer}
                                                    onViewPost={() => {}}
                                                    onLocationClick={() => {}}
                                                />
                                            )}
                                            {detectPostKind(previewPost) === 'business' && (
                                                <BusinessPostDetailModal
                                                    embedded
                                                    post={previewPost}
                                                    user={viewer}
                                                    onViewPage={() => {}}
                                                    onShare={() => {}}
                                                    onLocationClick={() => {}}
                                                />
                                            )}
                                            {detectPostKind(previewPost) === 'user' && (
                                                <PostPage
                                                    embedded
                                                    post={previewPost}
                                                    user={viewer}
                                                    hideCategoryChip={false}
                                                    onLocationClick={() => {}}
                                                />
                                            )}
                                        </Box>
                                    </Paper>
                                </Fade>
                            )}

                            {/* ── Feed / People / Following / Followers / Safety (hidden when post detail is open) ── */}
                            <Box sx={{ display: previewPost ? 'none' : 'contents' }}>

                                {/* Contextual toolbar area (search/filter rows) — only for non-Feed tabs */}
                                {tab === TAB.PEOPLE ? (
                                    <Paper variant="outlined" sx={toolbarPaperSx}>
                                        {!isLoggedIn && (
                                            <Paper
                                                variant="outlined"
                                                sx={(t) => ({
                                                    mb: 1.5,
                                                    p: 1.25,
                                                    borderRadius: 2.5,
                                                    borderColor: alpha(t.palette.primary.main, 0.16),
                                                    backgroundImage: `linear-gradient(180deg, ${alpha(t.palette.secondary.main, 0.10)} 0%, ${alpha(t.palette.background.paper, 0)} 70%)`,
                                                })}
                                            >
                                                <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: '0.9rem' }}>
                                                    Connect with your community
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.82rem' }}>
                                                    Log in or create an account to follow neighbors and personalize your feed.
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Button component={RouterLink} to="/login" variant="contained" size="small">
                                                        Log in
                                                    </Button>
                                                    <Button component={RouterLink} to="/register" variant="outlined" size="small">
                                                        Create account
                                                    </Button>
                                                </Box>
                                            </Paper>
                                        )}

                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gap: 1,
                                                alignItems: 'center',
                                                gridTemplateColumns: {
                                                    xs: '1fr',
                                                    md: 'minmax(200px, 1fr) minmax(160px, 260px) minmax(160px, 260px) auto auto',
                                                },
                                            }}
                                        >
                                            <TextField
                                                label="Name or @username"
                                                size="small"
                                                value={peopleSearch}
                                                onChange={(e) => setPeopleSearch(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        onPeopleSearch();
                                                    }
                                                }}
                                                sx={{ minWidth: 0 }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                            <Autocomplete
                                                size="small"
                                                options={[ALL_COUNTIES_LABEL, ...(Array.isArray(peopleCounties) ? peopleCounties : [])]}
                                                value={peopleCounty ? peopleCounty : ALL_COUNTIES_LABEL}
                                                onChange={(_, val) => {
                                                    const str = String(val || '').trim();
                                                    setPeopleCity('');
                                                    if (!str || str === ALL_COUNTIES_LABEL) setPeopleCounty('');
                                                    else setPeopleCounty(str);
                                                }}
                                                renderInput={(params) => <TextField {...params} label="County" />}
                                                clearOnEscape
                                                autoHighlight
                                                filterSelectedOptions
                                            />
                                            <Autocomplete
                                                size="small"
                                                options={[ALL_CITIES_LABEL, ...(Array.isArray(peopleCities) ? peopleCities : [])]}
                                                value={peopleCity ? peopleCity : ALL_CITIES_LABEL}
                                                onChange={(_, val) => {
                                                    const str = String(val || '').trim();
                                                    if (!str || str === ALL_CITIES_LABEL) setPeopleCity('');
                                                    else setPeopleCity(str);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField {...params} label={peopleCounty ? `City (${peopleCounty})` : 'City'} />
                                                )}
                                                clearOnEscape
                                                autoHighlight
                                                filterSelectedOptions
                                            />
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<SearchIcon />}
                                                onClick={onPeopleSearch}
                                                sx={{ whiteSpace: 'nowrap', borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                                            >
                                                Search
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ClearIcon />}
                                                onClick={() => {
                                                    onPeopleClear();
                                                    setPeopleOutOfState(false);
                                                }}
                                                sx={{ whiteSpace: 'nowrap', borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                                            >
                                                Clear
                                            </Button>
                                        </Box>

                                        {/* Advanced filter row */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                gap: 1,
                                                mt: 1,
                                                pt: 1,
                                                borderTop: '1px solid',
                                                borderColor: (t) => alpha(t.palette.text.primary, 0.06),
                                            }}
                                        >
                                            <TuneIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.25 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
                                                Filters:
                                            </Typography>

                                            {/* Account type chips */}
                                            {ACCOUNT_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                                                <Chip
                                                    key={o.value}
                                                    label={o.label}
                                                    size="small"
                                                    variant={peopleAccountType === o.value ? 'filled' : 'outlined'}
                                                    color={peopleAccountType === o.value ? 'primary' : 'default'}
                                                    onClick={() => setPeopleAccountType((prev) => prev === o.value ? '' : o.value)}
                                                    sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                                                />
                                            ))}

                                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                                            {/* Out of state checkbox */}
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={peopleOutOfState}
                                                        onChange={(e) => setPeopleOutOfState(e.target.checked)}
                                                        size="small"
                                                        icon={<FlightTakeoffIcon sx={{ fontSize: 20, color: 'text.disabled' }} />}
                                                        checkedIcon={<FlightTakeoffIcon sx={{ fontSize: 20 }} />}
                                                        sx={{ p: 0.5 }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                        Out of State
                                                    </Typography>
                                                }
                                                sx={{ mr: 0, ml: 0 }}
                                            />
                                        </Box>
                                    </Paper>
                                ) : (tab === TAB.FOLLOWING || tab === TAB.FOLLOWERS) ? (
                                    <Paper variant="outlined" sx={toolbarPaperSx}>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gap: 1,
                                                alignItems: 'center',
                                                gridTemplateColumns: {
                                                    xs: '1fr',
                                                    md: 'minmax(200px, 1fr) minmax(160px, 260px) minmax(160px, 260px) auto auto',
                                                },
                                            }}
                                        >
                                            <TextField
                                                label="Search"
                                                size="small"
                                                value={tab === TAB.FOLLOWING ? followingSearch : followersSearch}
                                                onChange={(e) => {
                                                    if (tab === TAB.FOLLOWING) setFollowingSearch(e.target.value);
                                                    else setFollowersSearch(e.target.value);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (tab === TAB.FOLLOWING) applyFollowingSearch();
                                                        else applyFollowersSearch();
                                                    }
                                                }}
                                                sx={{ minWidth: 0 }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                            <Autocomplete
                                                size="small"
                                                options={[ALL_COUNTIES_LABEL, ...(Array.isArray(peopleCounties) ? peopleCounties : [])]}
                                                value={tab === TAB.FOLLOWING
                                                    ? (followingCounty || ALL_COUNTIES_LABEL)
                                                    : (followersCounty || ALL_COUNTIES_LABEL)}
                                                onChange={(_, val) => {
                                                    const str = String(val || '').trim();
                                                    if (tab === TAB.FOLLOWING) {
                                                        setFollowingCity('');
                                                        if (!str || str === ALL_COUNTIES_LABEL) setFollowingCounty('');
                                                        else setFollowingCounty(str);
                                                    } else {
                                                        setFollowersCity('');
                                                        if (!str || str === ALL_COUNTIES_LABEL) setFollowersCounty('');
                                                        else setFollowersCounty(str);
                                                    }
                                                }}
                                                renderInput={(params) => <TextField {...params} label="County" />}
                                                clearOnEscape
                                                autoHighlight
                                                filterSelectedOptions
                                            />
                                            <Autocomplete
                                                size="small"
                                                options={[ALL_CITIES_LABEL, ...(tab === TAB.FOLLOWING
                                                    ? (Array.isArray(followingCities) ? followingCities : [])
                                                    : (Array.isArray(followersCities) ? followersCities : []))]}
                                                value={tab === TAB.FOLLOWING
                                                    ? (followingCity || ALL_CITIES_LABEL)
                                                    : (followersCity || ALL_CITIES_LABEL)}
                                                onChange={(_, val) => {
                                                    const str = String(val || '').trim();
                                                    if (tab === TAB.FOLLOWING) {
                                                        if (!str || str === ALL_CITIES_LABEL) setFollowingCity('');
                                                        else setFollowingCity(str);
                                                    } else {
                                                        if (!str || str === ALL_CITIES_LABEL) setFollowersCity('');
                                                        else setFollowersCity(str);
                                                    }
                                                }}
                                                renderInput={(params) => {
                                                    const county = tab === TAB.FOLLOWING ? followingCounty : followersCounty;
                                                    return <TextField {...params} label={county ? `City (${county})` : 'City'} />;
                                                }}
                                                clearOnEscape
                                                autoHighlight
                                                filterSelectedOptions
                                            />
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<SearchIcon />}
                                                onClick={() => {
                                                    if (tab === TAB.FOLLOWING) applyFollowingSearch();
                                                    else applyFollowersSearch();
                                                }}
                                                sx={{ whiteSpace: 'nowrap', borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                                            >
                                                Search
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ClearIcon />}
                                                onClick={() => {
                                                    if (tab === TAB.FOLLOWING) {
                                                        setFollowingSearch('');
                                                        setFollowingSearchApplied('');
                                                        setFollowingCounty('');
                                                        setFollowingCity('');
                                                        setFollowingCountyApplied('');
                                                        setFollowingCityApplied('');
                                                        setFollowingOutOfState(false);
                                                        setFollowingAccountType('');
                                                    } else {
                                                        setFollowersSearch('');
                                                        setFollowersSearchApplied('');
                                                        setFollowersCounty('');
                                                        setFollowersCity('');
                                                        setFollowersCountyApplied('');
                                                        setFollowersCityApplied('');
                                                        setFollowersOutOfState(false);
                                                        setFollowersAccountType('');
                                                    }
                                                }}
                                                sx={{ whiteSpace: 'nowrap', borderRadius: 999, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                                            >
                                                Clear
                                            </Button>
                                        </Box>

                                        {/* Advanced filter row for Following/Followers */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                gap: 1,
                                                mt: 1,
                                                pt: 1,
                                                borderTop: '1px solid',
                                                borderColor: (t) => alpha(t.palette.text.primary, 0.06),
                                            }}
                                        >
                                            <TuneIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.25 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
                                                Filters:
                                            </Typography>

                                            {/* Account type chips */}
                                            {ACCOUNT_TYPE_OPTIONS.filter((o) => o.value).map((o) => {
                                                const currentType = tab === TAB.FOLLOWING ? followingAccountType : followersAccountType;
                                                return (
                                                    <Chip
                                                        key={o.value}
                                                        label={o.label}
                                                        size="small"
                                                        variant={currentType === o.value ? 'filled' : 'outlined'}
                                                        color={currentType === o.value ? 'primary' : 'default'}
                                                        onClick={() => {
                                                            if (tab === TAB.FOLLOWING) {
                                                                setFollowingAccountType((prev) => prev === o.value ? '' : o.value);
                                                            } else {
                                                                setFollowersAccountType((prev) => prev === o.value ? '' : o.value);
                                                            }
                                                        }}
                                                        sx={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}
                                                    />
                                                );
                                            })}

                                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                                            {/* Out of state checkbox */}
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={tab === TAB.FOLLOWING ? followingOutOfState : followersOutOfState}
                                                        onChange={(e) => {
                                                            if (tab === TAB.FOLLOWING) setFollowingOutOfState(e.target.checked);
                                                            else setFollowersOutOfState(e.target.checked);
                                                        }}
                                                        size="small"
                                                        icon={<FlightTakeoffIcon sx={{ fontSize: 20, color: 'text.disabled' }} />}
                                                        checkedIcon={<FlightTakeoffIcon sx={{ fontSize: 20 }} />}
                                                        sx={{ p: 0.5 }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                        Out of State
                                                    </Typography>
                                                }
                                                sx={{ mr: 0, ml: 0 }}
                                            />
                                        </Box>
                                    </Paper>
                                ) : null}

                                {/* Content area */}
                                <Paper variant="outlined" sx={tab === TAB.FEED ? { ...contentPaperSx, ...feedContentPaperSx } : { ...contentPaperSx, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{
                                        ...(tab === TAB.FEED
                                                ? { height: '100%', overflow: 'hidden', p: 0 }
                                                : tab === TAB.SAFETY
                                                    ? { flex: 1, minHeight: 0, overflow: 'hidden', p: { xs: 1.25, sm: 1.5 } }
                                                    : { flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', p: { xs: 1.25, sm: 1.5 } }
                                        ),
                                    }}>
                                        {isNonFeedLoading && tab !== TAB.FEED ? (
                                            <Box sx={{ p: 2 }}>
                                                <Typography color="text.secondary">Loading…</Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                {tab === TAB.FEED ? (
                                                    <Box
                                                        sx={{
                                                            height: '100%',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            minHeight: 0,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        {/* Fixed header (tabs + filters). Posts scroll underneath. */}
                                                        <Box sx={{ flexShrink: 0 }}>
                                                            {/* Feed tabs */}
                                                            <Tabs value={feedTab} onChange={(_, v) => setFeedTab(v)} variant="fullWidth" sx={tabStyles}>
                                                                <Tab
                                                                    icon={(
                                                                        <TabIconWrapper size={24}>
                                                                            <ForumIcon />
                                                                        </TabIconWrapper>
                                                                    )}
                                                                    iconPosition="start"
                                                                    label="Posts"
                                                                />
                                                                <Tab
                                                                    icon={(
                                                                        <TabIconWrapper size={24}>
                                                                            <ChatBubbleOutlineIcon />
                                                                        </TabIconWrapper>
                                                                    )}
                                                                    iconPosition="start"
                                                                    label="Comments"
                                                                />
                                                                <Tab
                                                                    icon={(
                                                                        <TabIconWrapper size={26} squeezeX={0.9}>
                                                                            <FavoriteIcon />
                                                                        </TabIconWrapper>
                                                                    )}
                                                                    iconPosition="start"
                                                                    label="Likes"
                                                                />
                                                                <Tab
                                                                    icon={(
                                                                        <TabIconWrapper size={24}>
                                                                            <RepeatIcon />
                                                                        </TabIconWrapper>
                                                                    )}
                                                                    iconPosition="start"
                                                                    label="Reposts"
                                                                />
                                                            </Tabs>

                                                            <Divider />

                                                            {/* Filter toggle bar */}
                                                            <Box
                                                                onClick={() => setShowFeedFilters((v) => !v)}
                                                                sx={(t) => ({
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.75,
                                                                    px: 1.5,
                                                                    py: 0.75,
                                                                    cursor: 'pointer',
                                                                    borderBottom: '1px solid',
                                                                    borderColor: alpha(t.palette.text.primary, 0.06),
                                                                    bgcolor: alpha(t.palette.text.primary, 0.018),
                                                                    transition: 'background-color 140ms ease',
                                                                    '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.04) },
                                                                    userSelect: 'none',
                                                                })}
                                                            >
                                                                <TuneIcon sx={{ fontSize: 18, color: showFeedFilters ? 'primary.main' : 'text.secondary', transition: 'color 140ms ease' }} />
                                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: showFeedFilters ? 'primary.main' : 'text.secondary', flex: 1 }}>
                                                                    Filters
                                                                </Typography>
                                                                {/* Active filter indicator */}
                                                                {(activeFilter?.searchTerm || activeFilter?.accountType || activeFilter?.category || activeFilter?.dateFrom || activeFilter?.dateTo || (activeFilter?.sort && activeFilter.sort !== 'any')) && (
                                                                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'secondary.main', flexShrink: 0 }} />
                                                                )}
                                                            </Box>

                                                            {/* Collapsible filter panel */}
                                                            <Collapse in={showFeedFilters} timeout={200} unmountOnExit>
                                                                <Box
                                                                    sx={{
                                                                        px: 1.5,
                                                                        pt: 1.25,
                                                                        pb: 1.25,
                                                                        borderBottom: '1px solid',
                                                                        borderColor: 'divider',
                                                                        bgcolor: alpha(theme.palette.text.primary, 0.025),
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        gap: 1.5,
                                                                    }}
                                                                >
                                                                    {/* Search bar */}
                                                                    <TextField
                                                                        size="small"
                                                                        fullWidth
                                                                        placeholder={feedTab === 0 ? 'Search posts…' : feedTab === 1 ? 'Search comments…' : feedTab === 2 ? 'Search likes…' : 'Search reposts…'}
                                                                        value={activeFilter?.searchTerm || ''}
                                                                        onChange={(e) => updateFeedFilter({ searchTerm: e.target.value })}
                                                                        InputProps={{
                                                                            startAdornment: (
                                                                                <InputAdornment position="start">
                                                                                    <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                                                </InputAdornment>
                                                                            ),
                                                                            endAdornment: activeFilter?.searchTerm ? (
                                                                                <InputAdornment position="end">
                                                                                    <IconButton size="small" onClick={() => updateFeedFilter({ searchTerm: '' })}>
                                                                                        <ClearIcon sx={{ fontSize: 18 }} />
                                                                                    </IconButton>
                                                                                </InputAdornment>
                                                                            ) : null,
                                                                        }}
                                                                    />

                                                                    {/* All filters on one row: dropdowns + date pickers + clear */}
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            gap: 0.75,
                                                                            flexWrap: 'nowrap',
                                                                            alignItems: 'flex-start',
                                                                            pt: 1.25,
                                                                            overflowX: 'auto',
                                                                            overflowY: 'visible',
                                                                            '&::-webkit-scrollbar': { display: 'none' },
                                                                            scrollbarWidth: 'none',
                                                                        }}
                                                                    >
                                                                        {/* Account Type */}
                                                                        <FormControl size="small" sx={{ minWidth: 115, flexShrink: 0 }}>
                                                                            <InputLabel id="social-feed-accttype" shrink>Type</InputLabel>
                                                                            <Select
                                                                                labelId="social-feed-accttype"
                                                                                label="Type"
                                                                                value={activeFilter?.accountType || ''}
                                                                                onChange={(e) => {
                                                                                    const next = String(e.target.value || '');
                                                                                    updateFeedFilter({ accountType: next, category: '' });
                                                                                }}
                                                                                displayEmpty
                                                                                renderValue={(val) => {
                                                                                    const found = ACCOUNT_TYPE_OPTIONS.find((o) => o.value === val) || ACCOUNT_TYPE_OPTIONS[0];
                                                                                    const icons = { '': PeopleRoundedIcon, personal: PersonRoundedIcon, business: StorefrontOutlinedIcon, artist: MusicNoteOutlinedIcon };
                                                                                    const Icon = icons[val] || PeopleRoundedIcon;
                                                                                    return (
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                                                            <Icon sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
                                                                                            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{found.label}</Typography>
                                                                                        </Box>
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {ACCOUNT_TYPE_OPTIONS.map((o) => {
                                                                                    const icons = { '': PeopleRoundedIcon, personal: PersonRoundedIcon, business: StorefrontOutlinedIcon, artist: MusicNoteOutlinedIcon };
                                                                                    const Icon = icons[o.value] || PeopleRoundedIcon;
                                                                                    return (
                                                                                        <MenuItem key={o.value} value={o.value}>
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                <Icon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                                                                {o.label}
                                                                                            </Box>
                                                                                        </MenuItem>
                                                                                    );
                                                                                })}
                                                                            </Select>
                                                                        </FormControl>

                                                                        {/* Category — dynamic based on selected account type */}
                                                                        {(() => {
                                                                            const cats = getCategoriesForType(activeFilter?.accountType || '');
                                                                            if (cats.length <= 1) return null;
                                                                            return (
                                                                                <FormControl size="small" sx={{ minWidth: 130, flexShrink: 0 }}>
                                                                                    <InputLabel id="social-feed-category" shrink>Category</InputLabel>
                                                                                    <Select
                                                                                        labelId="social-feed-category"
                                                                                        label="Category"
                                                                                        value={cats.some((c) => c.id === (activeFilter?.category || '')) ? (activeFilter?.category || '') : ''}
                                                                                        onChange={(e) => updateFeedFilter({ category: String(e.target.value || '') })}
                                                                                        displayEmpty
                                                                                        renderValue={(val) => {
                                                                                            const v = String(val || '').trim().toLowerCase();
                                                                                            const found = cats.find((c) => c.id === v) || cats[0];
                                                                                            return <CategoryRow icon={found?.Icon} label={found?.label || 'All Categories'} />;
                                                                                        }}
                                                                                    >
                                                                                        {cats.map((c) => (
                                                                                            <MenuItem key={c.id || 'all'} value={c.id}>
                                                                                                <CategoryRow icon={c.Icon} label={c.label} />
                                                                                            </MenuItem>
                                                                                        ))}
                                                                                    </Select>
                                                                                </FormControl>
                                                                            );
                                                                        })()}

                                                                        {/* Sort */}
                                                                        <FormControl size="small" sx={{ minWidth: 95, flexShrink: 0 }}>
                                                                            <InputLabel id="social-feed-sort" shrink>Sort by</InputLabel>
                                                                            <Select
                                                                                labelId="social-feed-sort"
                                                                                label="Sort by"
                                                                                value={activeFilter?.sort || 'any'}
                                                                                onChange={(e) => updateFeedFilter({ sort: String(e.target.value || 'any') })}
                                                                            >
                                                                                {SORT_OPTIONS.map((o) => (
                                                                                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>

                                                                        {/* From date */}
                                                                        <TextField
                                                                            size="small"
                                                                            type="date"
                                                                            label="From"
                                                                            InputLabelProps={{ shrink: true }}
                                                                            value={activeFilter?.dateFrom || ''}
                                                                            onChange={(e) => updateFeedFilter({ dateFrom: e.target.value, dateRange: 'all' })}
                                                                            sx={{ minWidth: 130, maxWidth: 150, flexShrink: 0, '& .MuiInputBase-input': { fontSize: 13 } }}
                                                                        />

                                                                        {/* To date */}
                                                                        <TextField
                                                                            size="small"
                                                                            type="date"
                                                                            label="To"
                                                                            InputLabelProps={{ shrink: true }}
                                                                            value={activeFilter?.dateTo || ''}
                                                                            onChange={(e) => updateFeedFilter({ dateTo: e.target.value, dateRange: 'all' })}
                                                                            sx={{ minWidth: 130, maxWidth: 150, flexShrink: 0, '& .MuiInputBase-input': { fontSize: 13 } }}
                                                                        />

                                                                        {/* Clear button */}
                                                                        {(activeFilter?.dateFrom || activeFilter?.dateTo || activeFilter?.searchTerm || activeFilter?.accountType || activeFilter?.category || (activeFilter?.sort && activeFilter.sort !== 'any')) ? (
                                                                            <Button
                                                                                size="small"
                                                                                onClick={() => updateFeedFilter({ searchTerm: '', accountType: '', dateFrom: '', dateTo: '', dateRange: 'all', category: '', sort: 'any' })}
                                                                                sx={{ textTransform: 'none', fontWeight: 800, fontSize: '0.74rem', whiteSpace: 'nowrap', minWidth: 'auto', px: 1, flexShrink: 0 }}
                                                                                startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                                                                            >
                                                                                Clear
                                                                            </Button>
                                                                        ) : null}
                                                                    </Box>
                                                                </Box>
                                                            </Collapse>
                                                        </Box>

                                                        {/* Scrollable list area */}

                                                        {/* Override ProfilePostsList's flat mode inside the social feed grid
                                                        so cards have uniform height with content centered and action bar at bottom.
                                                        Uses .social-feed-grid to beat [data-flat-posts] specificity. */}
                                                        <style>{`
                                                        /* Every wrapper in the chain must be flex-column + stretch to fill the card */
                                                        .social-feed-grid > div {
                                                            display: flex !important;
                                                            flex-direction: column !important;
                                                        }
                                                        .social-feed-grid > div > div,
                                                        .social-feed-grid > div > div > div {
                                                            display: flex !important;
                                                            flex-direction: column !important;
                                                            flex: 1 1 auto !important;
                                                        }
                                                        /* The [data-flat-posts] wrapper and its children must stretch */
                                                        .social-feed-grid [data-flat-posts="1"] {
                                                            flex: 1 1 auto !important;
                                                        }
                                                        .social-feed-grid [data-flat-posts="1"] > div {
                                                            flex: 1 1 auto !important;
                                                        }
                                                        /* The inner item box (py 2.5) must stretch */
                                                        .social-feed-grid [data-flat-posts="1"] > div > div {
                                                            flex: 1 1 auto !important;
                                                            display: flex !important;
                                                            flex-direction: column !important;
                                                            border-bottom: none !important;
                                                        }
                                                        /* The Card itself — override flat min-height:auto back to flex-fill */
                                                        .social-feed-grid .social-feed-grid [data-post-id],
                                                        .social-feed-grid [data-flat-posts] [data-post-id],
                                                        .social-feed-grid [data-flat-posts] .MuiCard-root[data-post-id],
                                                        .social-feed-grid [data-flat-posts="1"] [data-post-id],
                                                        .social-feed-grid [data-flat-posts="1"] .MuiCard-root[data-post-id],
                                                        .social-feed-grid [data-flat-posts="1"] .MuiCard-root.MuiCard-root[data-post-id] {
                                                            display: flex !important;
                                                            flex-direction: column !important;
                                                            flex: 1 1 auto !important;
                                                        }
                                                        /* Content area (2nd child of card: the Box with title/desc/location) — 
                                                           flex:1 centers content vertically */
                                                        .social-feed-grid [data-flat-posts="1"] [data-post-id] > div:nth-child(2) {
                                                            flex: 1 1 auto !important;
                                                            display: flex !important;
                                                            flex-direction: column !important;
                                                            justify-content: flex-start !important;
                                                        }
                                                        /* CardActions — push to bottom, NO border-top on mobile */
                                                        .social-feed-grid [data-flat-posts="1"] [data-post-id] > .MuiCardActions-root,
                                                        .social-feed-grid [data-flat-posts] [data-post-id] > .MuiCardActions-root {
                                                            margin-top: auto !important;
                                                            padding-top: 8px !important;
                                                            padding-bottom: 10px !important;
                                                            padding-left: 0 !important;
                                                            padding-right: 0 !important;
                                                            border-top: none !important;
                                                        }
                                                        /* Also remove border-top on any card action bars on mobile */
                                                        @media (max-width: 599.95px) {
                                                            .social-feed-grid .MuiCardActions-root {
                                                                border-top: none !important;
                                                            }
                                                            /* Hide category chips on business-type posts on mobile */
                                                            .social-feed-grid [data-post-category="business"] .post-category-chip {
                                                                display: none !important;
                                                            }
                                                        }
                                                        /* Location — push to bottom-right of the content area, just above the action bar line */
                                                        .social-feed-grid [data-flat-posts="1"] :has(> .post-loc-icon) {
                                                            margin-top: auto !important;
                                                            margin-bottom: 0 !important;
                                                            align-self: flex-end !important;
                                                        }
                                                        /* Attribution row (Liked by / Reposted by) — embedded in card, not separated */
                                                        .social-feed-grid .ll-attr-row {
                                                            flex-direction: row !important;
                                                            flex: 0 0 auto !important;
                                                            align-items: center !important;
                                                            justify-content: flex-start !important;
                                                            text-align: left !important;
                                                        }
                                                    `}</style>

                                                        <Box
                                                            ref={feedScrollRef}
                                                            onScroll={(e) => {
                                                                const el = e.currentTarget;
                                                                if (!el) return;
                                                                const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 400;
                                                                if (!nearBottom) return;

                                                                if (tab === TAB.FEED) {
                                                                    if (feedTab === 0) {
                                                                        setFeedRenderCount((c) => {
                                                                            const next = Math.min(c + PAGE_SIZE, feedTotal);
                                                                            return next > c ? next : c;
                                                                        });
                                                                        loadMoreFeedPosts();
                                                                    } else {
                                                                        setFeedRenderCount((c) => {
                                                                            const next = Math.min(c + PAGE_SIZE, feedTotal);
                                                                            return next > c ? next : c;
                                                                        });
                                                                    }
                                                                }
                                                            }}
                                                            sx={(t) => ({
                                                                flex: 1,
                                                                minHeight: 0,
                                                                minWidth: 0,
                                                                overflowY: 'auto',
                                                                pr: { xs: 0, md: 1 },
                                                                pb: 2,
                                                                pt: { xs: 0.5, md: 1.5 },
                                                                bgcolor: t.palette.background.default,
                                                            })}
                                                        >
                                                            <Box sx={{ px: { xs: 0, sm: 2 }, pt: { xs: 0, sm: 0.75 } }}>
                                                                {(isFeedLoading || (loadingEngagement && tab === TAB.FEED && feedTab !== 0 && activeRawList.length === 0)) ? (
                                                                    <PulsingDots />
                                                                ) : isNetworkError(feedFetchError) && activeRawList.length === 0 ? (
                                                                    <NetworkErrorState onRetry={() => fetchFeedActivity()} />
                                                                ) : (following.length === 0 && isNetworkError(socialFetchError)) ? (
                                                                    <NetworkErrorState onRetry={fetchSocial} />
                                                                ) : (following.length === 0 ? (
                                                                    renderEmpty(
                                                                        'Your feed is empty',
                                                                        'Follow a few locals in “Find People” to see their activity here.'
                                                                    )
                                                                ) : feedTab === 1 ? (
                                                                    // COMMENTS (grouped by post, like profile)
                                                                    commentGroups.length === 0 ? (
                                                                        renderEmpty(
                                                                            'No comments from accounts you follow yet',
                                                                            'When they comment on posts, you’ll see it here.'
                                                                        )
                                                                    ) : (
                                                                        <Box
                                                                            sx={{
                                                                                display: 'grid',
                                                                                gap: 2,
                                                                                pb: 1,
                                                                            }}
                                                                        >
                                                                            {commentGroups.slice(0, visibleCount).map((g) => {
                                                                                const post0 = g?.post || {};
                                                                                const comments = Array.isArray(g?.comments) ? g.comments : [];
                                                                                const total = comments.length;
                                                                                const latest = comments[0] || null;

                                                                                const timeLabel = (iso) => {
                                                                                    const d = iso ? new Date(iso) : null;
                                                                                    if (!d || Number.isNaN(d.valueOf())) return '';
                                                                                    const diffMs = Date.now() - d.getTime();
                                                                                    if (!Number.isFinite(diffMs)) return '';
                                                                                    const diffSec = Math.floor(diffMs / 1000);

                                                                                    if (diffSec < 60) return 'just now';

                                                                                    const min = Math.floor(diffSec / 60);
                                                                                    if (min < 60) return `${min}m ago`;

                                                                                    const hr = Math.floor(min / 60);
                                                                                    if (hr < 24) return `${hr}hr ago`;

                                                                                    const day = Math.floor(hr / 24);
                                                                                    if (day < 7) return `${day}d ago`;

                                                                                    const wk = Math.floor(day / 7);
                                                                                    if (wk < 5) return `${wk}wk ago`;

                                                                                    const mo = Math.floor(day / 30);
                                                                                    if (mo < 12) return `${mo}mo ago`;

                                                                                    const yr = Math.floor(day / 365);
                                                                                    return `${yr}yr ago`;
                                                                                };

                                                                                const truncate = (t, n) => {
                                                                                    const s0 = String(t || '').trim();
                                                                                    if (!s0) return '';
                                                                                    return s0.length > n ? `${s0.slice(0, n)}…` : s0;
                                                                                };

                                                                                return (
                                                                                    <Box
                                                                                        key={`social-comment-group-${Number(g?.post_id || post0?.id || 0)}`}
                                                                                        role="button"
                                                                                        tabIndex={0}
                                                                                        onKeyDown={(e) => {
                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                e.preventDefault();
                                                                                                openCommentInCommunity(latest, true);
                                                                                            }
                                                                                        }}
                                                                                        onClick={() => openCommentInCommunity(latest, true)}
                                                                                        sx={(t) => ({
                                                                                            border: '1px solid',
                                                                                            borderColor: (t) => alpha(t.palette.text.primary, 0.10),
                                                                                            borderRadius: 2,
                                                                                            bgcolor: 'background.paper',
                                                                                            overflow: 'hidden',
                                                                                            cursor: 'pointer',
                                                                                            boxShadow: (t) => `0 10px 26px ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                            '&:hover': { borderColor: t.palette.primary.main },
                                                                                        })}
                                                                                    >
                                                                                        <Box
                                                                                            sx={(t) => ({
                                                                                                px: 1.5,
                                                                                                py: 1,
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'space-between',
                                                                                                gap: 1,
                                                                                                background: `linear-gradient(90deg, ${alpha(
                                                                                                    t.custom?.brand?.brass || '#A87822',
                                                                                                    0.14
                                                                                                )} 0%, ${alpha(t.palette.background.paper, 0)} 75%)`,
                                                                                                borderBottom: (t) => `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                                                                            })}
                                                                                        >
                                                                                            <Box sx={{ minWidth: 0 }}>
                                                                                                <Typography
                                                                                                    sx={{ fontWeight: 900 }}
                                                                                                    noWrap
                                                                                                    title={String(post0?.title || '')}
                                                                                                >
                                                                                                    {String(post0?.title || '').trim() || 'Post'}
                                                                                                </Typography>
                                                                                                <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                    {String(post0?.handle || '').trim()
                                                                                                        ? `@${String(post0.handle).trim()} • `
                                                                                                        : ''}
                                                                                                    {latest?.created_at ? timeLabel(latest.created_at) : ''}
                                                                                                </Typography>
                                                                                            </Box>

                                                                                            <Box
                                                                                                sx={(t) => ({
                                                                                                    display: 'inline-flex',
                                                                                                    alignItems: 'center',
                                                                                                    gap: 0.5,
                                                                                                    px: 1.1,
                                                                                                    py: 0.4,
                                                                                                    borderRadius: 999,
                                                                                                    border: `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
                                                                                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                                                                                })}
                                                                                            >
                                                                                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' }}>
                                                                                                    {total === 1 ? '1 comment' : `${total} comments`}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        </Box>

                                                                                        <Box sx={{ px: 1.5, py: 1.25, display: 'grid', gap: 1 }}>
                                                                                            {comments.slice(0, 3).map((c) => {
                                                                                                const cText = String(c?.content || '').trim();
                                                                                                const isReply = !!c?.parent_id;
                                                                                                const cTime = c?.created_at || null;

                                                                                                const cAuthorId = Number(
                                                                                                    c?.user_id || c?.userId || c?.commenter_id || c?.commenterId || 0
                                                                                                );
                                                                                                const cachedAuthor =
                                                                                                    Number.isFinite(cAuthorId) && cAuthorId > 0
                                                                                                        ? commentAuthorById?.[cAuthorId]
                                                                                                        : null;

                                                                                                // Prefer inline _actor_* fields from the engagement
                                                                                                // response (covers business/artist actors), then
                                                                                                // fall back to the prefetched cache (personal accounts).
                                                                                                const cActorType = String(c?._actor_account_type || cachedAuthor?.account_type || '').toLowerCase();
                                                                                                const cFirst = String(c?._actor_name || cachedAuthor?.first_name || '').trim();
                                                                                                const cLast = (c?._actor_name ? '' : String(cachedAuthor?.last_name || '').trim());
                                                                                                const cFull = `${cFirst} ${cLast}`.trim();
                                                                                                const cHandleRaw = String(c?._actor_handle || cachedAuthor?.handle || '').trim();
                                                                                                const cHandle = cHandleRaw ? `@${cHandleRaw.replace(/^@/, '')}` : '';
                                                                                                const cAvatar =
                                                                                                    c?._actor_avatar_url || cachedAuthor?.profile_picture || cachedAuthor?.avatar_url || '';
                                                                                                const cShowIcon = isDefaultAvatar(cAvatar);
                                                                                                const cAcctType = cActorType || getAcctType(cachedAuthor);
                                                                                                // Visual-artist vs musician fallback icon
                                                                                                const cProfileType = String(
                                                                                                    c?._actor_profile_type || c?.profile_type || c?.profileType ||
                                                                                                    cachedAuthor?.profile_type || cachedAuthor?.profileType || ''
                                                                                                ).toLowerCase();
                                                                                                const cIsVisualArtist = cAcctType === 'artist' && cProfileType === 'artist';

                                                                                                const cAuthorForCard = Number.isFinite(cAuthorId) && cAuthorId > 0
                                                                                                    ? {
                                                                                                        id: cAuthorId,
                                                                                                        first_name: cFirst,
                                                                                                        last_name: cLast,
                                                                                                        handle: cHandleRaw.replace(/^@/, ''),
                                                                                                        profile_picture: cAvatar || cachedAuthor?.profile_picture || cachedAuthor?.avatar_url || '',
                                                                                                        avatar_url: cAvatar || cachedAuthor?.avatar_url || cachedAuthor?.profile_picture || '',
                                                                                                        account_type: cAcctType || cachedAuthor?.account_type || '',
                                                                                                        business_id: c?._actor_business_id || cachedAuthor?.business_id || null,
                                                                                                        business_name: cachedAuthor?.business_name || '',
                                                                                                        business_slug: cachedAuthor?.business_slug || '',
                                                                                                        artist_id: c?._actor_artist_id || cachedAuthor?.artist_id || null,
                                                                                                        artist_name: cachedAuthor?.artist_name || '',
                                                                                                        artist_handle: cachedAuthor?.artist_handle || '',
                                                                                                        profile_type: cProfileType || '',
                                                                                                    }
                                                                                                    : null;

                                                                                                return (
                                                                                                    <Box
                                                                                                        key={`social-comment-${c?.id || c?.comment_id || ''}`}
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            openCommentInCommunity(c);
                                                                                                        }}
                                                                                                        role="button"
                                                                                                        tabIndex={0}
                                                                                                        onKeyDown={(e) => {
                                                                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                                                                e.preventDefault();
                                                                                                                e.stopPropagation();
                                                                                                                openCommentInCommunity(c);
                                                                                                            }
                                                                                                        }}
                                                                                                        sx={(t) => ({
                                                                                                            border: '1px solid',
                                                                                                            borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                                                                                            borderRadius: 2,
                                                                                                            px: 1.25,
                                                                                                            py: 1,
                                                                                                            bgcolor: alpha(t.palette.primary.main, 0.02),
                                                                                                            '&:hover': { borderColor: alpha(t.palette.primary.main, 0.32) },
                                                                                                        })}
                                                                                                    >
                                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                                                                                                <Avatar
                                                                                                                    src={cShowIcon ? undefined : cAvatar}
                                                                                                                    alt={cFull || cHandle || 'User'}
                                                                                                                    sx={(t) => ({
                                                                                                                        width: 34, height: 34,
                                                                                                                        cursor: cAuthorForCard ? 'pointer' : 'default',
                                                                                                                        ...(cShowIcon
                                                                                                                                ? (cAcctType === 'business' || cAcctType === 'artist')
                                                                                                                                    ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main }
                                                                                                                                    : { bgcolor: alpha(t.palette.text.primary, 0.06), color: t.palette.text.secondary }
                                                                                                                                : null
                                                                                                                        ),
                                                                                                                    })}
                                                                                                                    onClick={(e) => {
                                                                                                                        if (!cAuthorForCard) return;
                                                                                                                        e.stopPropagation();
                                                                                                                        handleOpenUserCard(e.currentTarget, cAuthorForCard);
                                                                                                                    }}
                                                                                                                >
                                                                                                                    {cShowIcon
                                                                                                                        ? cAcctType === 'business'
                                                                                                                            ? <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                                                                                                                            : cAcctType === 'artist'
                                                                                                                                ? (cIsVisualArtist
                                                                                                                                    ? <PaletteRoundedIcon sx={{ fontSize: 17 }} />
                                                                                                                                    : <MusicNoteRoundedIcon sx={{ fontSize: 17 }} />)
                                                                                                                                : <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                                                                                                        : null}
                                                                                                                </Avatar>
                                                                                                                <Box sx={{ minWidth: 0 }}>
                                                                                                                    <Typography
                                                                                                                        variant="body2"
                                                                                                                        sx={{ fontWeight: 900, lineHeight: 1.1 }}
                                                                                                                        noWrap
                                                                                                                        title={cFull || cHandle}
                                                                                                                    >
                                                                                                                        {cFull || (cHandle ? cHandle : 'User')}
                                                                                                                    </Typography>
                                                                                                                    <Typography variant="caption" color="text.secondary" noWrap>
                                                                                                                        {cHandle}
                                                                                                                        {isReply ? ' • Reply' : ''}
                                                                                                                    </Typography>
                                                                                                                </Box>
                                                                                                            </Box>
                                                                                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                                                                                                {cTime ? timeLabel(cTime) : ''}
                                                                                                            </Typography>
                                                                                                        </Box>
                                                                                                        <Typography
                                                                                                            variant="body2"
                                                                                                            sx={{
                                                                                                                fontWeight: 800,
                                                                                                                color: 'text.primary',
                                                                                                                mt: 0.5,
                                                                                                                whiteSpace: 'pre-wrap',
                                                                                                                overflowWrap: 'anywhere',
                                                                                                            }}
                                                                                                        >
                                                                                                            {truncate(cText, 260)}
                                                                                                        </Typography>
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

                                                                            <Box ref={loadMoreRef} sx={{ height: 1 }} />
                                                                        </Box>
                                                                    )
                                                                ) : (
                                                                    // POSTS / LIKES / REPOSTS use the exact profile post card list
                                                                    (() => {
                                                                        const list = filteredSortedPosts.slice(0, visibleCount);

                                                                        if (filteredSortedPosts.length === 0) {
                                                                            const label =
                                                                                feedTab === 0
                                                                                    ? 'No posts from accounts you follow yet'
                                                                                    : feedTab === 2
                                                                                        ? 'No likes from accounts you follow yet'
                                                                                        : 'No reposts from accounts you follow yet';

                                                                            const sub =
                                                                                feedTab === 0
                                                                                    ? 'When they post in Community, their posts will show here.'
                                                                                    : feedTab === 2
                                                                                        ? 'When they like posts, you’ll see the liked posts here.'
                                                                                        : 'When they repost, you’ll see those posts here.';

                                                                            return renderEmpty(label, sub);
                                                                        }

                                                                        return (
                                                                            <Box>
                                                                                {(feedTab === 2 || feedTab === 3) ? (
                                                                                    <Box className="social-feed-grid" sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', overflowX: 'hidden' }}>
                                                                                        {list.map((p, idx) => {
                                                                                            const isRepost = feedTab === 3;
                                                                                            const actorId = Number(
                                                                                                isRepost
                                                                                                    ? (p?._reposted_by_user_id || 0)
                                                                                                    : (p?._liked_by_user_id || 0)
                                                                                            );

                                                                                            // Prefer inline _actor_* fields (business/artist),
                                                                                            // fall back to commentAuthorById cache (personal).
                                                                                            const cachedActor = Number.isFinite(actorId) && actorId > 0
                                                                                                ? commentAuthorById?.[actorId]
                                                                                                : null;
                                                                                            const actorName = String(p?._actor_name || '').trim()
                                                                                                || (cachedActor ? `${cachedActor.first_name || ''} ${cachedActor.last_name || ''}`.trim() : '');
                                                                                            const actorHandleRaw = String(p?._actor_handle || cachedActor?.handle || '').trim();
                                                                                            const actorHandle = actorHandleRaw ? `@${actorHandleRaw.replace(/^@/, '')}` : '';
                                                                                            const actorAccountType = String(p?._actor_account_type || cachedActor?.account_type || '').toLowerCase();
                                                                                            const actorProfilePath = actorAccountType === 'business'
                                                                                                ? `/business/${encodeURIComponent(actorHandleRaw || p?._actor_business_id || actorId)}`
                                                                                                : actorAccountType === 'artist'
                                                                                                    ? `/artist/${encodeURIComponent(actorHandleRaw || p?._actor_artist_id || actorId)}`
                                                                                                    : actorHandleRaw
                                                                                                        ? `/${encodeURIComponent(actorHandleRaw)}`
                                                                                                        : cachedActor
                                                                                                            ? getProfilePath(cachedActor)
                                                                                                            : (actorId > 0 ? `/${encodeURIComponent(actorId)}` : null);

                                                                                            const AttrIcon = isRepost ? RepeatIcon : FavoriteIcon;
                                                                                            const attrLabel = isRepost ? 'Reposted by' : 'Liked by';

                                                                                            return (
                                                                                                <Box
                                                                                                    key={`${p?.id || ''}-${actorId}-${p?._actor_business_id || 0}-${p?._actor_artist_id || 0}`}
                                                                                                    sx={(t) => ({
                                                                                                        flex: {
                                                                                                            xs: '0 0 100%',
                                                                                                            sm: '0 0 100%',
                                                                                                            md: '0 0 calc(50% - 16px)',
                                                                                                            lg: '0 0 calc(50% - 16px)',
                                                                                                            xl: '0 0 calc(50% - 16px)',
                                                                                                        },
                                                                                                        mx: { xs: 0, md: 1 },
                                                                                                        my: { xs: 0, md: 1 },
                                                                                                        minWidth: 0,
                                                                                                        maxWidth: '100%',
                                                                                                        display: 'flex',
                                                                                                        flexDirection: 'column',
                                                                                                        borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.12)}`, md: 'none' },
                                                                                                        '&:last-child': { borderBottom: 'none' },
                                                                                                    })}
                                                                                                >
                                                                                                    {(actorName || actorHandle) ? (
                                                                                                        <Box
                                                                                                            className="ll-attr-row"
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                e.preventDefault();
                                                                                                                if (actorProfilePath) {
                                                                                                                    navigate(actorProfilePath);
                                                                                                                }
                                                                                                            }}
                                                                                                            sx={(t) => ({
                                                                                                                display: 'flex',
                                                                                                                flexDirection: 'row',
                                                                                                                alignItems: 'center',
                                                                                                                justifyContent: 'flex-start',
                                                                                                                gap: 0.6,
                                                                                                                px: 2,
                                                                                                                py: 0.5,
                                                                                                                cursor: actorProfilePath ? 'pointer' : 'default',
                                                                                                                flexShrink: 0,
                                                                                                                textAlign: 'left',
                                                                                                                bgcolor: alpha(isRepost ? t.palette.info.main : t.palette.error.main, 0.04),
                                                                                                                borderBottom: `1px solid ${alpha(t.palette.divider, 0.06)}`,
                                                                                                            })}
                                                                                                        >
                                                                                                            <AttrIcon sx={{ fontSize: 13, color: isRepost ? 'text.secondary' : 'error.main', flexShrink: 0 }} />
                                                                                                            <Typography
                                                                                                                noWrap
                                                                                                                sx={{
                                                                                                                    color: 'text.secondary',
                                                                                                                    fontSize: '0.72rem',
                                                                                                                    lineHeight: 1.2,
                                                                                                                    minWidth: 0,
                                                                                                                }}
                                                                                                            >
                                                                                                                {attrLabel}{' '}
                                                                                                                <Box component="span" sx={{ fontWeight: 800, color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}>
                                                                                                                    {actorName || actorHandle}
                                                                                                                </Box>
                                                                                                                {actorName && actorHandle ? (
                                                                                                                    <Box component="span" sx={{ ml: 0.4, '&:hover': { textDecoration: 'underline' } }}>
                                                                                                                        {actorHandle}
                                                                                                                    </Box>
                                                                                                                ) : null}
                                                                                                            </Typography>
                                                                                                        </Box>
                                                                                                    ) : null}

                                                                                                    <PostCard
                                                                                                        post={p}
                                                                                                        user={viewer}
                                                                                                        hoveredId={feedHoveredId}
                                                                                                        setHoveredId={setFeedHoveredId}
                                                                                                        onCardClick={openPostInCommunity}
                                                                                                        flat={isMobile}
                                                                                                        onOpenUserCard={(el, cardData) => {
                                                                                                            setUserAnchor(el);
                                                                                                            setUserForCard(cardData);
                                                                                                        }}
                                                                                                    />
                                                                                                </Box>
                                                                                            );
                                                                                        })}
                                                                                    </Box>
                                                                                ) : (
                                                                                    // POSTS tab (feedTab 0) — matches CommunityPanel / PostList layout
                                                                                    (() => {
                                                                                        return (
                                                                                            <Box className="social-feed-grid" sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', overflowX: 'hidden' }}>
                                                                                                {list.map((p, idx) => (
                                                                                                    <Box
                                                                                                        key={`feed-${p?.category || 'p'}-${p?.id || idx}`}
                                                                                                        sx={(t) => ({
                                                                                                            flex: {
                                                                                                                xs: '0 0 100%',
                                                                                                                sm: '0 0 100%',
                                                                                                                md: '0 0 calc(50% - 16px)',
                                                                                                                lg: '0 0 calc(50% - 16px)',
                                                                                                                xl: '0 0 calc(50% - 16px)',
                                                                                                            },
                                                                                                            mx: { xs: 0, md: 1 },
                                                                                                            my: { xs: 0, md: 1 },
                                                                                                            minWidth: 0,
                                                                                                            maxWidth: '100%',
                                                                                                            borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.12)}`, md: 'none' },
                                                                                                            '&:last-child': { borderBottom: 'none' },
                                                                                                        })}
                                                                                                    >
                                                                                                        <PostCard
                                                                                                            post={p}
                                                                                                            user={viewer}
                                                                                                            hoveredId={feedHoveredId}
                                                                                                            setHoveredId={setFeedHoveredId}
                                                                                                            onCardClick={openPostInCommunity}
                                                                                                            flat={isMobile}
                                                                                                            onOpenUserCard={(el, cardData) => {
                                                                                                                setUserAnchor(el);
                                                                                                                setUserForCard(cardData);
                                                                                                            }}
                                                                                                        />
                                                                                                    </Box>
                                                                                                ))}
                                                                                            </Box>
                                                                                        );
                                                                                    })()
                                                                                )}
                                                                                <Box ref={loadMoreRef} sx={{ height: 1 }} />
                                                                            </Box>
                                                                        );
                                                                    })()
                                                                ))}
                                                            </Box>
                                                        </Box>

                                                        {/* Fixed bottom status bar */}
                                                        <Box
                                                            sx={{
                                                                flexShrink: 0,
                                                                borderTop: '1px solid',
                                                                borderColor: 'divider',
                                                                px: { xs: 1.25, md: 1.5 },
                                                                py: 0.75,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: alpha(theme.palette.background.paper, 0.97),
                                                                borderRadius: { xs: 0, sm: '0 0 12px 12px' },
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: { xs: '0.82rem', md: '0.9rem' },
                                                                    color: 'text.secondary',
                                                                    letterSpacing: '-0.01em',
                                                                    fontWeight: 700,
                                                                    textAlign: 'center',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {countText}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ) : null}{tab === TAB.PEOPLE ? (
                                                peopleFiltered.length === 0 && isNetworkError(peopleFetchError) ? (
                                                    <NetworkErrorState onRetry={() => fetchPeople({ reset: true })} />
                                                ) : peopleFiltered.length === 0 ? (
                                                    renderEmpty('No users found', 'Try searching by name, @handle, or narrowing by county/city.')
                                                ) : (
                                                    renderUserGrid(peopleFiltered, 1, 'people')
                                                )
                                            ) : null}

                                                {tab === TAB.FOLLOWING ? (
                                                    following.length === 0 && isNetworkError(socialFetchError) ? (
                                                        <NetworkErrorState onRetry={fetchSocial} />
                                                    ) : following.length === 0 ? (
                                                        renderEmpty('You are not following anyone yet', 'Find locals in “Find People” and hit Follow.')
                                                    ) : (
                                                        renderUserGrid(followingFiltered, 0, 'following')
                                                    )
                                                ) : null}

                                                {tab === TAB.FOLLOWERS ? (
                                                    followers.length === 0 && isNetworkError(socialFetchError) ? (
                                                        <NetworkErrorState onRetry={fetchSocial} />
                                                    ) : followers.length === 0 ? (
                                                        renderEmpty('No followers yet', 'As your profile and posts gain traction, followers will show here.')
                                                    ) : (
                                                        renderUserGrid(followersFiltered, 0, 'followers')
                                                    )
                                                ) : null}


                                                {tab === TAB.SAFETY ? (
                                                    <Box sx={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <Box sx={{ flexShrink: 0 }}>
                                                            <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Moderation</Typography>
                                                            <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 1.5 }}>
                                                                Manage users you've blocked or hidden. These settings are per-account.
                                                            </Typography>
                                                        </Box>

                                                        {/* Sub-tabs: Blocked / Hidden */}
                                                        <Box sx={{ flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', mb: 0 }}>
                                                            <Tabs
                                                                value={safetyTab}
                                                                onChange={(_e, v) => setSafetyTab(v)}
                                                                sx={(t) => ({
                                                                    minHeight: 40,
                                                                    '& .MuiTab-root': {
                                                                        textTransform: 'none',
                                                                        minHeight: 40,
                                                                        fontWeight: 700,
                                                                        fontSize: '0.85rem',
                                                                        py: 0.5,
                                                                        px: 2,
                                                                        color: t.palette.text.secondary,
                                                                        '&:hover': { color: t.palette.text.primary },
                                                                    },
                                                                    '& .Mui-selected': {
                                                                        color: `${t.palette.primary.main} !important`,
                                                                        fontWeight: 900,
                                                                    },
                                                                    '& .MuiTabs-indicator': {
                                                                        bgcolor: t.palette.primary.main,
                                                                        height: 2.5,
                                                                        borderRadius: '2px 2px 0 0',
                                                                    },
                                                                })}
                                                            >
                                                                <Tab label={`Blocked Users (${(moderation.blocked || []).length})`} />
                                                                <Tab label={`Hidden Posts From (${(moderation.hiddenPosts || []).length})`} />
                                                            </Tabs>
                                                        </Box>

                                                        {/* Search bar */}
                                                        <Box sx={{ flexShrink: 0, px: 1.5, pt: 1.5, pb: 1 }}>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                value={safetyTab === 0 ? blockedSearch : hiddenSearch}
                                                                onChange={(e) => {
                                                                    if (safetyTab === 0) setBlockedSearch(e.target.value);
                                                                    else setHiddenSearch(e.target.value);
                                                                }}
                                                                placeholder={safetyTab === 0 ? 'Search blocked users…' : 'Search hidden posts from…'}
                                                                InputProps={{
                                                                    startAdornment: (
                                                                        <InputAdornment position="start">
                                                                            <SearchIcon fontSize="small" />
                                                                        </InputAdornment>
                                                                    ),
                                                                    endAdornment: (safetyTab === 0 ? blockedSearch : hiddenSearch) ? (
                                                                        <InputAdornment position="end">
                                                                            <IconButton
                                                                                size="small"
                                                                                aria-label="Clear search"
                                                                                onClick={() => {
                                                                                    if (safetyTab === 0) setBlockedSearch('');
                                                                                    else setHiddenSearch('');
                                                                                }}
                                                                                edge="end"
                                                                            >
                                                                                <ClearIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    ) : null,
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* Scrollable 2-column grid of user cards */}
                                                        <Box
                                                            sx={{
                                                                flex: 1,
                                                                minHeight: 0,
                                                                overflowY: 'auto',
                                                                overflowX: 'hidden',
                                                                px: 1.5,
                                                                pb: 2,
                                                            }}
                                                        >
                                                            {(() => {
                                                                const isBlocked = safetyTab === 0;
                                                                const listRaw = isBlocked ? (moderation.blocked || []) : (moderation.hiddenPosts || []);
                                                                const query = isBlocked ? blockedSearch : hiddenSearch;
                                                                const term = String(query || '').trim().toLowerCase();
                                                                const list = term
                                                                    ? listRaw.filter((u) => {
                                                                        const hay = `${toName(u)} ${toHandle(u)}`.trim().toLowerCase();
                                                                        return hay.includes(term);
                                                                    })
                                                                    : listRaw;
                                                                const actionLabel = isBlocked ? 'Unblock' : 'Unhide Posts';
                                                                const handler = isBlocked ? handleUnblockUser : handleUnhidePostsFromUser;

                                                                if (listRaw.length === 0) {
                                                                    return (
                                                                        <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                                                            <ShieldIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                                                            <Typography sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                                                                {isBlocked ? 'No blocked users' : 'No hidden posts'}
                                                                            </Typography>
                                                                            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', maxWidth: 300 }}>
                                                                                {isBlocked
                                                                                    ? 'Users you block will appear here so you can manage them.'
                                                                                    : 'Users whose posts you hide will appear here.'}
                                                                            </Typography>
                                                                        </Box>
                                                                    );
                                                                }

                                                                if (list.length === 0 && term) {
                                                                    return (
                                                                        <Box sx={{ py: 4, textAlign: 'center' }}>
                                                                            <Typography color="text.secondary">No matches for &ldquo;{term}&rdquo;</Typography>
                                                                        </Box>
                                                                    );
                                                                }

                                                                return (
                                                                    <Box
                                                                        sx={{
                                                                            display: 'grid',
                                                                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        {list.map((u) => (
                                                                            <UserCard
                                                                                key={u?.id || u?.public_id || u?.handle}
                                                                                compact
                                                                                user={{
                                                                                    ...(u || {}),
                                                                                    ...(isBlocked
                                                                                        ? { blockedByMe: true, isBlockedByMe: true, blocked_by_me: true }
                                                                                        : { hiddenPostsByMe: true, hidden_posts_by_me: true, hiddenByMe: true, isHiddenByMe: true }),
                                                                                }}
                                                                                onOpenUserCard={handleOpenUserCard}
                                                                                onGoProfile={handleGoProfile}
                                                                                hideMenu
                                                                                actionLabel={actionLabel}
                                                                                onAction={handler}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                );
                                                            })()}
                                                        </Box>
                                                    </Box>
                                                ) : null}
                                            </>
                                        )}
                                    </Box>

                                    {/* Count bar — pinned to bottom of content Paper for People/Following/Followers */}
                                    {tab !== TAB.FEED && tab !== TAB.SAFETY ? (
                                        <Box
                                            sx={{
                                                flexShrink: 0,
                                                borderTop: '1px solid',
                                                borderColor: 'divider',
                                                px: { xs: 1.25, md: 1.5 },
                                                py: 0.75,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: alpha(theme.palette.background.paper, 0.97),
                                                borderRadius: { xs: 0, sm: '0 0 12px 12px' },
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: '0.82rem', md: '0.9rem' },
                                                    color: 'text.secondary',
                                                    letterSpacing: '-0.01em',
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {countText}
                                            </Typography>
                                        </Box>
                                    ) : null}

                                </Paper>

                            </Box>{/* end feed/people content (hidden when post detail is open) */}

                        </Box>{/* end main content column */}


                        {/* Unfollow confirmation (no X because there is a cancel button) */}
                        <Dialog
                            open={unfollowOpen}
                            onClose={closeUnfollowConfirm}
                            aria-labelledby="unfollow-confirm-title"
                        >
                            <DialogTitle id="unfollow-confirm-title" sx={{ fontWeight: 900 }}>
                                Unfollow {toName(unfollowTarget) || toHandle(unfollowTarget) || 'this user'}?
                            </DialogTitle>
                            <DialogContent sx={{ pt: 0.5, pb: 0.5 }}>
                                <Typography color="text.secondary">
                                    You won&apos;t see their posts in your feed unless you follow them again.
                                </Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 2, pb: 1.5 }}>
                                <Button onClick={closeUnfollowConfirm} variant="outlined" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                    Cancel
                                </Button>
                                <Button onClick={confirmUnfollow} variant="contained" color="error" sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}>
                                    Unfollow
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* User popover (3‑dots) */}
                        <UserCardPopover
                            anchorEl={userAnchor}
                            onClose={() => setUserAnchor(null)}
                            user={userForCard}
                            isSelf={isSelf}
                            following={isFollowingForCard}
                            allowUnfollow
                            onFollow={(u) => {
                                handleFollowToggle(u, 'follow');
                            }}
                            onUnfollow={(u) => {
                                handleFollowToggle(u, 'unfollow');
                            }}
                            onMessage={handleMessage}
                            onViewProfile={handleViewProfile}
                            layoutVariant="social"
                        />

                        {/* ── Edit History dialog (community / business / artist) ── */}
                        <Dialog
                            open={historyOpen}
                            onClose={() => { setHistoryOpen(false); setHistoryPost(null); setHistoryRows([]); setHistoryError(''); }}
                            fullWidth
                            maxWidth="sm"
                            onClick={(e) => e.stopPropagation()}
                            PaperProps={{ sx: { position: 'relative' } }}
                        >
                            <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                                Edit History
                            </DialogTitle>
                            <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                                {historyLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <Typography color="text.secondary" sx={{ fontWeight: 600, fontSize: 14 }}>Loading…</Typography>
                                    </Box>
                                ) : historyError && historyRows.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center', fontSize: 14 }}>{historyError}</Typography>
                                ) : historyRows.length > 0 ? (
                                    <Box sx={{ position: 'relative', pl: 2.5 }}>
                                        <Box sx={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                                        {historyRows.map((row, idx) => {
                                            const isLatest = idx === 0;
                                            const isOriginal = idx === historyRows.length - 1;
                                            const when = row?.edited_at || row?.editedAt || row?.created_at || '';
                                            const whenLabel = when ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(when)) : '';

                                            // Build diff items from snapshot fields
                                            const snap = row?.snapshot || row || {};
                                            const prevSnap = idx < historyRows.length - 1 ? (historyRows[idx + 1]?.snapshot || historyRows[idx + 1] || {}) : {};
                                            const diffItems = [];
                                            if (!isOriginal) {
                                                const s = (v) => String(v || '').trim();
                                                if (s(snap.title) !== s(prevSnap.title) && (s(snap.title) || s(prevSnap.title))) {
                                                    diffItems.push({ label: 'Title', from: s(prevSnap.title) || '(empty)', to: s(snap.title) || '(empty)' });
                                                }
                                                const bodyKey = snap.body !== undefined ? 'body' : 'description';
                                                const prevBodyKey = prevSnap.body !== undefined ? 'body' : 'description';
                                                if (s(snap[bodyKey]) !== s(prevSnap[prevBodyKey]) && (s(snap[bodyKey]) || s(prevSnap[prevBodyKey]))) {
                                                    diffItems.push({ label: 'Content', changed: true, detail: 'Updated' });
                                                }
                                                if (!diffItems.length) diffItems.push({ label: 'Post', changed: true, detail: 'Details updated' });
                                            }

                                            return (
                                                <Box key={row?.id ?? idx} sx={{ position: 'relative', pb: idx < historyRows.length - 1 ? 2.5 : 0 }}>
                                                    <Box sx={{ position: 'absolute', left: -20, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: isOriginal ? 'grey.400' : isLatest ? 'secondary.main' : 'primary.main', border: '2px solid', borderColor: 'background.paper', boxShadow: (t) => `0 0 0 2px ${alpha(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? 'text.secondary' : 'text.primary' }}>
                                                            {isOriginal ? 'Original' : isLatest ? 'Latest edit' : `Version ${historyRows.length - idx}`}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500 }}>{whenLabel}</Typography>
                                                    </Box>
                                                    {!isOriginal && diffItems.length > 0 && (
                                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.025), border: '1px solid', borderColor: (t) => alpha(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                            {diffItems.map((item, i) => (
                                                                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}>
                                                                    <Chip label={item.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.dark', border: 'none', flexShrink: 0, mt: 0.1, '& .MuiChip-label': { px: 1 } }} />
                                                                    {item.changed ? (
                                                                        <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.5, pt: 0.15 }}>{item.detail || 'Updated'}</Typography>
                                                                    ) : (
                                                                        <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: 'break-word' }}>
                                                                            <Box component="span" sx={{ textDecoration: 'line-through', opacity: 0.55 }}>{item.from}</Box>
                                                                            <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
                                                                            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{item.to}</Box>
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}
                                                    {isOriginal && (
                                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: '1px solid', borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                                            <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.4 }}>Original post created</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ) : null}
                            </DialogContent>
                            <DialogActions sx={{ px: 2, pb: 1.5 }}>
                                <Button onClick={() => { setHistoryOpen(false); setHistoryPost(null); }} sx={{ fontWeight: 700 }}>Close</Button>
                            </DialogActions>
                        </Dialog>

                        {/* local keyframes */}c
                        <style>
                            {`
                        @keyframes llSpin { 
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                        </style>
                    </Box>
                </Box>
            </Fade>
        </Box>
    );
}