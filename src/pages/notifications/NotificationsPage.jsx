import React, { useEffect, useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
    Alert,
    Avatar,
    AvatarGroup,
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Stack,
    Typography,
    Skeleton,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useLocation, useNavigate } from 'react-router-dom';

import defaultAvatar from '../../assets/profile/default_avatar.png';
import localLanternLogo from '../../assets/LocalLanternLogo.png';
// Round "profile" version of the Local Lantern logo, matching the Messages
// page's system-sender avatar. Used for approval notifications so the
// circular avatar in the notifications list matches the circular avatar
// in the Messages inbox.
import LocalLanternProfilePic from '../../assets/LocalLanternProfilePic.png';
import { useActiveAccount } from '../../components/AccountContext';
import { getAccountHeaders } from '../../utils/getAccountHeadersStatic';
import { secureFetch } from '../../utils/secureFetch';
import SellerReviewsPopup from '../profile/userProfile/SellerReviewsPopup';

/**
 * src/pages/notifications/NotificationsPage.jsx
 *
 * Full-page notification inbox.
 *
 * Backend:
 *  - GET  /api/notifications?limit=50&before_id=<cursor>
 *  - POST /api/notifications/:id/read
 *
 * Notes:
 *  - We build the "title line" from actor display name + verb so you never see "Someone ..."
 *  - Preview line (in quotes) is pulled from notification.data.* when present.
 */

// ── Stable references (defined outside the component to avoid re-creation on every render) ──
const TEXT_PREVIEW_TYPES = new Set([
    'post_comment', 'comment_reply', 'comment_like',
    'photo_comment', 'photo_comment_like',
    'service_photo_comment', 'service_photo_comment_like',
    'event_comment',
    'business_review', 'business_review_reply',
    'listing_message',
    'service_review', 'service_review_response',
    'service_quote_request', 'service_request_response',
    'seller_review',
    'seller_review_reply',
    'post_mention', 'listing_mention',
    'comment_share',
    'poll_ended',
]);

const EMPTY_HIGHLIGHT_IDS = [];

// ── Notification category definitions (stable, module-level) ──
const CATEGORY_TYPES = {
    comments: new Set([
        'post_comment', 'comment_reply', 'comment_like',
        'photo_comment', 'photo_comment_like',
        'service_photo_comment', 'service_photo_comment_like',
        'event_comment', 'post_mention', 'listing_mention',
    ]),
    likes: new Set([
        'post_like', 'photo_like', 'event_like',
        'service_photo_like',
        'listing_favorite', 'service_favorited',
        'business_review_helpful', 'job_saved',
    ]),
    reposts: new Set([
        'post_repost', 'listing_repost', 'event_repost',
    ]),
    shares: new Set([
        'post_share', 'comment_share', 'event_share', 'job_share',
        'group_share',
        'listing_share', 'listing_share_recipient',
        'artist_share', 'business_share', 'music_post_share',
        'profile_share',
        'service_request_shared', 'service_request_share_recipient',
        // Slice 4a: news article shares
        'news_article_share', 'news_article_share_recipient',
    ]),
    followers: new Set([
        'new_follower',
        'follow_request',
        'follow_request_accepted',
    ]),
    marketplace: new Set([
        'listing_favorite', 'listing_repost', 'listing_message',
        'listing_mention', 'listing_sold',
        'listing_share', 'listing_share_recipient', 'seller_review',
        'seller_review_reply',
    ]),
    services: new Set([
        'service_review', 'service_review_response',
        'service_quote_request',
        'service_request_response', 'service_response_accepted',
        'service_response_declined', 'service_favorited',
        'service_request_shared', 'service_request_share_recipient',
        'service_photo_comment', 'service_photo_like', 'service_photo_comment_like',
    ]),
    events: new Set([
        'event_comment', 'event_engagement', 'event_rsvp',
        'event_interested', 'event_like', 'event_repost', 'event_share',
    ]),
    jobs: new Set([
        'job_application', 'job_saved', 'job_share',
    ]),
    groups: new Set([
        'group_invite', 'group_join', 'group_join_request',
        'group_request_approved', 'group_share',
        'group_ban', 'group_timeout',
    ]),
    reviews: new Set([
        'business_review', 'business_review_helpful', 'business_review_reply',
        'service_review', 'service_review_response', 'seller_review',
        'seller_review_reply',
    ]),
    mentions: new Set([
        'post_mention', 'listing_mention', 'poll_ended',
    ]),
};

const CATEGORY_META = [
    { key: 'all',         label: 'All',         icon: NotificationsNoneIcon },
    { key: 'comments',    label: 'Comments',    icon: ChatBubbleOutlineRoundedIcon },
    { key: 'likes',       label: 'Likes',       icon: FavoriteBorderRoundedIcon },
    { key: 'reposts',     label: 'Reposts',     icon: RepeatRoundedIcon },
    { key: 'shares',      label: 'Shares',      icon: ShareRoundedIcon },
    { key: 'followers',   label: 'Followers',   icon: PersonOutlineRoundedIcon },
    { key: 'marketplace', label: 'Marketplace', icon: StorefrontRoundedIcon },
    { key: 'services',    label: 'Services',    icon: BuildRoundedIcon },
    { key: 'events',      label: 'Events',      icon: EventRoundedIcon },
    { key: 'jobs',        label: 'Jobs',        icon: WorkOutlineRoundedIcon },
    { key: 'groups',      label: 'Groups',      icon: GroupsRoundedIcon },
    { key: 'reviews',     label: 'Reviews',     icon: StarBorderRoundedIcon },
    { key: 'mentions',    label: 'Mentions',    icon: CampaignRoundedIcon },
];

/** Classify a notification into its category key(s). Returns an array of matched keys. */
const getNotifCategories = (type) => {
    const t = String(type || '');
    const matched = [];
    for (const [key, typeSet] of Object.entries(CATEGORY_TYPES)) {
        if (typeSet.has(t)) matched.push(key);
    }
    return matched;
};
export default function NotificationsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        activeAccount,
        isBusinessAccount,
        isArtistAccount,
        activeBusinessId,
        activeArtistId,
        accountCacheKey,
    } = useActiveAccount();

    // Build account query params for notification API calls
    const getNotifAccountParams = () => {
        if (isBusinessAccount && activeBusinessId) {
            return { account_id: String(activeBusinessId), account_type: 'business' };
        }
        if (isArtistAccount && activeArtistId) {
            return { account_id: String(activeArtistId), account_type: 'artist' };
        }
        return { account_id: 'personal', account_type: 'personal' };
    };

    /** Common headers for notification fetch() calls (includes account identity) */
    const notifFetchHeaders = () => ({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...getAccountHeaders(),
    });

    const [meProfileSlug, setMeProfileSlug] = useState('');

    const [highlightIds, setHighlightIds] = useState(() => {
        const ids = location?.state?.llHighlightNotifIds;
        return Array.isArray(ids) ? ids.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0) : [];
    });

    const [pageReady, setPageReady] = useState(false);

    // ── TOKEN_EXPIRED: redirect to login ──
    useEffect(() => {
        const onExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', onExpired);
        return () => window.removeEventListener('auth:token-expired', onExpired);
    }, [navigate]);

    useEffect(() => {
        let alive = true;

        async function loadMe() {
            try {
                const candidates = ['/users/profile', '/api/users/profile'];
                for (const url of candidates) {
                    try {
                        const r = await secureFetch(url, { credentials: 'include', headers: { Accept: 'application/json' } });
                        if (!r.ok) continue;
                        const d = await r.json();
                        const u = d?.user || d || null;
                        if (!alive || !u) return;
                        const slugRaw = String(u?.handle || u?.public_id || u?.id || '').trim();
                        const slug = slugRaw.replace(/^@+/, '');
                        if (slug) setMeProfileSlug(slug);
                        return;
                    } catch {
                        // try next
                    }
                }
            } catch {
                // ignore
            }
        }

        loadMe();
        return () => {
            alive = false;
        };
    }, []);


    const [items, setItems] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [followedBackIds, setFollowedBackIds] = useState(new Set());
    const [alreadyFollowingIds, setAlreadyFollowingIds] = useState(new Set());
    const [activeCategory, setActiveCategory] = useState('all');
    const [sellerReviewsPopup, setSellerReviewsPopup] = useState({ open: false, sellerId: null, highlightReviewId: null });

    // ── Scroll-direction detection for sticky header (mobile) ──
    const [showStickyHeader, setShowStickyHeader] = useState(true);
    const lastScrollY = React.useRef(0);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                const currentY = window.scrollY;
                if (currentY <= 10) {
                    setShowStickyHeader(true);
                } else if (currentY < lastScrollY.current) {
                    // scrolling up
                    setShowStickyHeader(true);
                } else if (currentY > lastScrollY.current + 5) {
                    // scrolling down (with small threshold to avoid jitter)
                    setShowStickyHeader(false);
                }
                lastScrollY.current = currentY;
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const hasMore = Boolean(nextCursor);

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';

        const now = Date.now();
        let t;

        // Handle Date objects directly (knex may return these)
        if (dateStr instanceof Date) {
            t = dateStr.getTime();
        } else {
            const raw = String(dateStr).trim();

            // Always try both UTC and local interpretations and pick whichever
            // gives the most recent past time. This handles the common case where
            // the server stores local time but knex/JSON adds a Z suffix.
            if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) {
                // Strip any trailing Z or timezone for the "as local" parse
                const stripped = raw.replace(/[Zz]$/, '').replace(/[+-]\d{2}:\d{2}$/, '').replace(' ', 'T');
                const asLocal = new Date(stripped).getTime();
                // Ensure Z suffix for the "as UTC" parse
                const withZ = stripped.endsWith('Z') ? stripped : stripped + 'Z';
                const asUtc = new Date(withZ).getTime();

                const diffLocal = now - asLocal;
                const diffUtc = now - asUtc;

                if (Number.isFinite(asLocal) && Number.isFinite(asUtc) && diffLocal > 0 && diffUtc > 0) {
                    t = diffLocal < diffUtc ? asLocal : asUtc;
                } else if (Number.isFinite(asLocal) && diffLocal >= 0) {
                    t = asLocal;
                } else if (Number.isFinite(asUtc) && diffUtc >= 0) {
                    t = asUtc;
                }
            }

            if (!t) {
                t = new Date(raw).getTime();
            }
        }

        if (!Number.isFinite(t)) return '';

        const diffSec = Math.max(0, Math.floor((now - t) / 1000));

        if (diffSec < 60) return 'Just now';

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
        return `${yr}y ago`;
    };

    const parseData = (n) => {
        const d = n?.data;
        if (!d) return null;
        if (typeof d === 'object') return d;
        try {
            return JSON.parse(d);
        } catch {
            return null;
        }
    };

    const getActorAvatarSrc = (n) => {
        // System notifications (approvals) — use the round Local Lantern
        // profile pic (same asset the Messages page uses for the system
        // sender) so the avatar visually matches between surfaces.
        const nType = String(n?.type || '');
        if (nType === 'business_approved' || nType === 'artist_approved') {
            return LocalLanternProfilePic;
        }

        // actor_avatar_url is now hydrated fresh from the DB by the backend,
        // so prefer it over the stale snapshot in data.actorAccountAvatarUrl.
        const candidate =
            n?.actor_avatar_url ||
            n?.actor_profile_picture ||
            n?.actor_avatar ||
            n?.from_avatar_url ||
            n?.from_profile_picture ||
            n?.from_avatar ||
            n?.avatar_url ||
            n?.profile_picture ||
            '';
        return candidate || defaultAvatar;
    };

    /** Check if avatar URL points to a default/placeholder image */
    const isDefaultAvatar = (src) => {
        if (!src) return true;
        const s = String(src).toLowerCase();
        return s.includes('default_avatar') || s.includes('default_business') || s.includes('default_logo') || s === String(defaultAvatar).toLowerCase();
    };

    /** Determine actor account type from notification data: 'business' | 'artist' | 'personal' */
    const getActorAccountType = (n) => {
        // Approval notifications — show relevant icon type
        const nType = String(n?.type || '');
        if (nType === 'business_approved') return 'business';
        if (nType === 'artist_approved') return 'artist';

        const d = parseData(n);
        const accountType = String(d?.actorAccountType || d?.actor_account_type || n?.actor_account_type || '').trim().toLowerCase();
        if (accountType === 'business') return 'business';
        if (accountType === 'artist') return 'artist';
        // Infer from other data hints
        if (d?.actorBusinessId || d?.actor_business_id || n?.actor_business_id) return 'business';
        if (d?.actorArtistId || d?.actor_artist_id || n?.actor_artist_id) return 'artist';
        return 'personal';
    };

    /** Determine actor profile sub-type for artist accounts: 'music' | 'artist'.
     *  Only meaningful when getActorAccountType() returns 'artist'. Defaults to
     *  'music' when the field isn't in the notification payload — accurate for
     *  all notifications created before actorProfileType was added. */
    const getActorProfileType = (n) => {
        const d = parseData(n);
        const raw = String(d?.actorProfileType || d?.actor_profile_type || '').trim().toLowerCase();
        return (raw === 'artist') ? 'artist' : 'music';
    };

    /** Get the appropriate default avatar icon based on account type */
    const DefaultAvatarIcon = ({ accountType, profileType, size = 22 }) => {
        if (accountType === 'business') return <StorefrontOutlinedIcon sx={{ fontSize: size }} />;
        if (accountType === 'artist') {
            return (profileType === 'artist')
                ? <PaletteRoundedIcon sx={{ fontSize: size - 2 }} />
                : <MusicNoteRoundedIcon sx={{ fontSize: size - 2 }} />;
        }
        return <PersonRoundedIcon sx={{ fontSize: size }} />;
    };

    const getActorDisplayName = (n) => {
        // System notifications (approvals) — no actor
        const nType = String(n?.type || '');
        if (nType === 'business_approved' || nType === 'artist_approved') {
            return 'Local Lantern';
        }

        // Prefer business/artist account name when the actor was operating as one
        const d = parseData(n);
        const accountName = String(d?.actorAccountName || '').trim();
        if (accountName) return accountName;

        const first = String(n?.actor_first_name || n?.actorFirstName || '').trim();
        const last = String(n?.actor_last_name || n?.actorLastName || '').trim();
        const fullFromNames = `${first} ${last}`.trim();

        const full =
            fullFromNames ||
            String(n?.actor_name || n?.actorName || n?.from_name || n?.fromName || '').trim();

        const handle = String(
            n?.actor_handle ||
            n?.actorHandle ||
            n?.from_handle ||
            n?.fromHandle ||
            n?.from_user_handle ||
            n?.fromUserHandle ||
            ''
        ).trim();

        if (full) return full;
        if (handle) return handle;
        return 'Unknown user';
    };

    /** Truncate a string with ellipsis */
    const truncate = (str, max = 45) => {
        const s = String(str || '').trim();
        return s.length > max ? s.slice(0, max) + '…' : s;
    };

    const getVerb = (n) => {
        const type = String(n?.type || '');
        const others = Number(n?.othersCount) || 0;
        const suffix = others === 1 ? ' and 1 other' : others > 1 ? ` and ${others} others` : '';
        const d = parseData(n);
        // Slice 2d: entityType is also used by the click handler (resolved
        // separately at that call site), but we need it locally inside this
        // function to distinguish news-article comment-reply/like labels.
        const entityType = String(n?.entity_type || n?.entityType || '').trim();

        // Helper for entity-specific context
        const listingTitle = d?.listingTitle || d?.listing_title || '';
        const jobTitle = d?.jobTitle || d?.job_title || '';
        const eventTitle = d?.eventTitle || d?.event_title || '';
        const artistName = d?.artistName || d?.artist_name || '';
        const postTitle = d?.postTitle || d?.post_title || d?.title || '';
        const postAuthorName = d?.postAuthorName || d?.post_author_name || d?.authorName || d?.author_name || '';
        const senderName = d?.senderName || d?.sender_name || '';

        switch (type) {
            // ── Community ──
            case 'post_like':
                return `${suffix} liked your post${postTitle ? ` "${truncate(postTitle)}"` : ''}`;
            case 'post_repost':
                return `${suffix} reposted your post${postTitle ? ` "${truncate(postTitle)}"` : ''}`;
            case 'post_comment':
                return `${suffix} commented on your post${postTitle ? ` "${truncate(postTitle)}"` : ''}`;
            case 'comment_reply': {
                // Slice 2d: when the parent comment is on a news article, say
                // "on a news article — [title]" instead of "on X's post".
                const isNews = d?.isNewsArticle === true || entityType === 'news_article';
                if (isNews) {
                    const artTitle = d?.articleTitle || d?.article_title || '';
                    return artTitle
                        ? `${suffix} replied to your comment on "${truncate(artTitle)}"`
                        : `${suffix} replied to your comment on a news article`;
                }
                return postAuthorName
                    ? `${suffix} replied to your comment on ${postAuthorName}'s post`
                    : `${suffix} replied to your comment`;
            }
            case 'comment_like': {
                // Slice 2d: mention the article when it's a news-comment like.
                const isNews = d?.isNewsArticle === true || entityType === 'news_article';
                if (isNews) {
                    const artTitle = d?.articleTitle || d?.article_title || '';
                    return artTitle
                        ? `${suffix} liked your comment on "${truncate(artTitle)}"`
                        : `${suffix} liked your comment on a news article`;
                }
                return `${suffix} liked your comment`;
            }
            case 'post_mention':
                return 'mentioned you in a post';

            // ── Profile photos ──
            case 'photo_like': {
                const pk = String(d?.photoKind ?? d?.photo_kind ?? '').toLowerCase();
                const photoLabel = pk === 'cover' ? 'cover photo' : pk === 'gallery' ? 'photo' : 'profile photo';
                return `${suffix} liked your ${photoLabel}`;
            }
            case 'photo_comment': {
                const pk = String(d?.photoKind ?? d?.photo_kind ?? '').toLowerCase();
                const photoLabel = pk === 'cover' ? 'cover photo' : pk === 'gallery' ? 'photo' : 'profile photo';
                return `${suffix} commented on your ${photoLabel}`;
            }
            case 'photo_comment_like': {
                const pk = String(d?.photoKind ?? d?.photo_kind ?? '').toLowerCase();
                const photoLabel = pk === 'cover' ? 'cover photo' : pk === 'gallery' ? 'photo' : 'profile photo';
                return `${suffix} liked a comment on your ${photoLabel}`;
            }

            // ── Business ──
            case 'business_review':
                return 'left a review on your business';
            case 'business_review_helpful':
                return `${suffix} found your review helpful`;
            case 'business_review_reply':
                return 'replied to your review';

            // ── Events ──
            case 'event_comment':
                return `${suffix} commented on your event${eventTitle ? ` "${truncate(eventTitle)}"` : ''}`;
            case 'event_engagement':
            case 'event_rsvp':
                return `${suffix} RSVP'd to your event${eventTitle ? ` "${truncate(eventTitle)}"` : ''}`;
            case 'event_interested':
                return `${suffix} is interested in your event${eventTitle ? ` "${truncate(eventTitle)}"` : ''}`;
            case 'event_like':
                return `${suffix} liked your event${eventTitle ? ` "${truncate(eventTitle)}"` : ''}`;
            case 'event_repost':
                return `${suffix} reposted your event${eventTitle ? ` "${truncate(eventTitle)}"` : ''}`;

            // ── Music / Artist ──
            case 'artist_team_removed':
                return `removed you from ${artistName || 'an artist'} team`;

            // ── Jobs ──
            case 'job_application':
                return `${suffix} applied to your job${jobTitle ? ` "${truncate(jobTitle)}"` : ''}`;
            case 'job_saved':
                return `${suffix} saved your job posting${jobTitle ? ` "${truncate(jobTitle)}"` : ''}`;

            // ── Marketplace ──
            case 'listing_favorite':
                return `${suffix} saved your listing${listingTitle ? ` "${truncate(listingTitle)}"` : ''}`;
            case 'listing_repost':
                return `${suffix} reposted your listing${listingTitle ? ` "${truncate(listingTitle)}"` : ''}`;
            case 'listing_message':
                return `messaged you about${listingTitle ? ` "${truncate(listingTitle)}"` : ' your listing'}`;
            case 'listing_mention':
                return `mentioned you in a listing${listingTitle ? ` "${truncate(listingTitle)}"` : ''}`;
            case 'listing_share':
                if (d?.isAuthorNotif === true) return `${suffix} shared your listing${listingTitle ? ` "${truncate(listingTitle)}"` : ''}`;
                return `shared a listing with you${listingTitle ? ` — "${truncate(listingTitle)}"` : ''}`;
            case 'listing_share_recipient':
                return `shared a listing with you${listingTitle ? ` — "${truncate(listingTitle)}"` : ''}`;
            case 'listing_sold': {
                const soldTitle = listingTitle ? `"${truncate(listingTitle)}"` : 'A listing you saved';
                return others > 0
                    ? `${suffix} — a listing you saved was marked sold`
                    : `${soldTitle} was marked as sold`;
            }
            case 'seller_review':
                return 'left you a seller review';
            case 'seller_review_reply':
                return 'replied to your seller review';

            // ── Services ──
            case 'service_review':
                return 'reviewed your service listing';
            case 'service_review_response':
                return 'responded to your service review';
            case 'service_quote_request':
                return 'requested a quote from you';
            case 'service_request_response':
                return 'responded to your service request';
            case 'service_response_accepted':
                return 'accepted your service response';
            case 'service_response_declined':
                return 'declined your service response';
            case 'service_favorited':
                return `${suffix} favorited your service listing`;
            case 'service_photo_comment': {
                const spk = String(d?.photoType ?? d?.photo_type ?? '').toLowerCase();
                const spcLabel = spk === 'cover' ? 'service cover photo' : spk === 'avatar' ? 'service profile photo' : 'service photo';
                return `${suffix} commented on your ${spcLabel}`;
            }
            case 'service_photo_like': {
                const spk = String(d?.photoType ?? d?.photo_type ?? '').toLowerCase();
                const splLabel = spk === 'cover' ? 'service cover photo' : spk === 'avatar' ? 'service profile photo' : 'service photo';
                return `${suffix} liked your ${splLabel}`;
            }
            case 'service_photo_comment_like': {
                return `${suffix} liked your comment`;
            }
            case 'service_request_shared': {
                const reqTitle = d?.requestTitle || d?.request_title || '';
                return `${suffix} shared your service request${reqTitle ? ` "${truncate(reqTitle)}"` : ''}`;
            }
            case 'service_request_share_recipient': {
                const reqTitle2 = d?.requestTitle || d?.request_title || '';
                return `shared a service request with you${reqTitle2 ? ` — "${truncate(reqTitle2)}"` : ''}`;
            }
            // Slice 4a: news article shares
            case 'news_article_share': {
                const artTitle = d?.articleTitle || d?.article_title || '';
                if (d?.isAuthorNotif === true) return `${suffix} shared a news article${artTitle ? ` "${truncate(artTitle)}"` : ''}`;
                return `shared a news article with you${artTitle ? ` — "${truncate(artTitle)}"` : ''}`;
            }
            case 'news_article_share_recipient': {
                const artTitle2 = d?.articleTitle || d?.article_title || '';
                return `shared a news article with you${artTitle2 ? ` — "${truncate(artTitle2)}"` : ''}`;
            }

            // ── Shares ──
            case 'post_share': {
                const sharePostTypeText = String(d?.postType ?? d?.post_type ?? '').toLowerCase();
                // Profile shares routed through generic /api/shares with postType='profile'
                if (sharePostTypeText === 'profile') {
                    const profName = d?.profileName || d?.profile_name || '';
                    return profName ? `shared ${profName}'s profile with you` : 'shared a profile with you';
                }
                // Service request shares routed through generic /api/shares with postType='service_request'
                if (sharePostTypeText === 'service_request') {
                    const rTitle = d?.requestTitle || d?.request_title || d?.title || '';
                    return `shared a service request with you${rTitle ? ` — "${truncate(rTitle)}"` : ''}`;
                }
                // Service shares routed through generic /api/shares with postType='service'
                if (sharePostTypeText === 'service') {
                    const sTitle = d?.serviceTitle || d?.listingTitle || d?.listing_title || '';
                    return `shared a service with you${sTitle ? ` — "${truncate(sTitle)}"` : ''}`;
                }
                // Marketplace listing shares
                if (sharePostTypeText === 'listing') {
                    const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
                    return `shared a listing with you${lTitle ? ` — "${truncate(lTitle)}"` : ''}`;
                }
                // Comment shares routed through generic /api/shares with postType='comment'
                if (sharePostTypeText === 'comment') {
                    return 'shared a comment with you';
                }
                // Business profile shares routed through generic /api/shares with postType='business'
                if (sharePostTypeText === 'business') {
                    const bizName = d?.businessName || d?.business_name || '';
                    return bizName ? `shared ${bizName}'s business page with you` : 'shared a business page with you';
                }
                // Artist profile shares routed through generic /api/shares with postType='artist'
                if (sharePostTypeText === 'artist') {
                    const artNameShare = d?.artistName || d?.artist_name || '';
                    return artNameShare ? `shared ${artNameShare}'s music page with you` : 'shared a music page with you';
                }
                // Author notification: created via createNotificationIfAllowed with isAuthorNotif=true
                // "Mike shared your post"
                if (d?.isAuthorNotif === true) {
                    return `${suffix} shared your post${postTitle ? ` "${truncate(postTitle)}"` : ''}`;
                }
                // Recipient notification: created via INSERT IGNORE, no isAuthorNotif
                // "Mike shared X's post with you"
                return postAuthorName
                    ? `shared ${postAuthorName}'s post with you`
                    : 'shared a post with you';
            }
            case 'profile_share': {
                const profName = d?.profileName || d?.profile_name || '';
                if (d?.isAuthorNotif === true) return `${suffix} shared your profile`;
                return profName ? `shared ${profName}'s profile with you` : 'shared a profile with you';
            }
            case 'comment_share':
                return 'shared a comment with you';
            case 'event_share':
                if (d?.isAuthorNotif === true) return `${suffix} shared your event${eventTitle ? ` "${truncate(eventTitle)}"` : ''}`;
                return `shared an event with you${eventTitle ? ` — "${truncate(eventTitle)}"` : ''}`;
            case 'job_share':
                if (d?.isAuthorNotif === true) return `${suffix} shared your job posting${jobTitle ? ` "${truncate(jobTitle)}"` : ''}`;
                return `shared a job listing with you${jobTitle ? ` — "${truncate(jobTitle)}"` : ''}`;
            case 'group_share': {
                const gName = d?.groupName || d?.group_name || '';
                if (d?.isAuthorNotif === true) return `${suffix} shared your group${gName ? ` "${truncate(gName)}"` : ''}`;
                return gName ? `shared a group with you — ${truncate(gName)}` : 'shared a group with you';
            }
            case 'artist_share':
                return `shared a music page with you${artistName ? ` — ${artistName}` : ''}`;
            case 'business_share': {
                const bizNameShare = d?.businessName || d?.business_name || '';
                return bizNameShare ? `shared ${bizNameShare}'s business page with you` : 'shared a business page with you';
            }
            case 'music_post_share': {
                const artNameShare = d?.artistName || d?.artist_name || '';
                if (d?.isAuthorNotif === true) return `${suffix} shared your music post${artNameShare ? ` on ${artNameShare}` : ''}`;
                return 'shared a music post with you';
            }

            // ── Poll ──
            case 'poll_ended': {
                const pollTitle = d?.postTitle || d?.post_title || d?.title || '';
                const votes = Number(d?.totalVotes || 0);
                const voteSuffix = votes > 0 ? ` with ${votes} vote${votes !== 1 ? 's' : ''}` : '';
                return pollTitle
                    ? `Your poll "${truncate(pollTitle)}" has ended${voteSuffix}`
                    : `Your poll has ended${voteSuffix}`;
            }

            // ── Groups ──
            case 'group_invite': {
                const gName = d?.groupName || d?.group_name || '';
                return gName ? `invited you to join the group ${truncate(gName)}` : 'invited you to join a group';
            }
            case 'group_join':
                return `${suffix} joined your group`;
            case 'group_join_request':
                return `${suffix} requested to join your group`;
            case 'group_request_approved': {
                const approvedGroupName = d?.groupName || d?.group_name || '';
                return approvedGroupName
                    ? `Your request to join ${truncate(approvedGroupName)} was approved!`
                    : 'Your group join request was approved!';
            }
            case 'group_ban': {
                const banGroupName = d?.groupName || d?.group_name || '';
                const banReason = d?.reason || '';
                const banBase = banGroupName ? `You have been banned from ${truncate(banGroupName)}` : 'You have been banned from a group';
                return banReason ? `${banBase} — "${truncate(banReason)}"` : banBase;
            }
            case 'group_timeout': {
                const toGroupName = d?.groupName || d?.group_name || '';
                const toReason = d?.reason || '';
                const mins = Number(d?.duration_minutes || 0);
                const durLabel = mins >= 1440 ? `${Math.round(mins / 1440)} day${Math.round(mins / 1440) !== 1 ? 's' : ''}`
                    : mins >= 60 ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) !== 1 ? 's' : ''}`
                        : `${mins} minute${mins !== 1 ? 's' : ''}`;
                const toBase = toGroupName
                    ? `You have been timed out from ${truncate(toGroupName)} for ${durLabel}`
                    : `You have been timed out from a group for ${durLabel}`;
                return toReason ? `${toBase} — "${truncate(toReason)}"` : toBase;
            }

            // ── Follow ──
            case 'new_follower':
                return `${suffix} started following you`;
            case 'follow_request':
                return `${suffix} requested to follow you`;
            case 'follow_request_accepted':
                return `accepted your follow request`;

            // ── Account Approval ──
            case 'business_approved': {
                const bizName = d?.businessName || d?.business_name || 'Your business';
                return `approved your business "${truncate(bizName)}"! You can now switch to your business profile.`;
            }
            case 'artist_approved': {
                const artName = d?.artistName || d?.artist_name || 'Your artist profile';
                // Sub-type controls whether we call this a music or visual artist
                // profile in the approval text. Reads the profile_type the
                // backend attached to the notification payload (camelCase or
                // snake_case). Defaults to 'music' for backward compat with
                // older notifications that don't carry the field — same as
                // the Header's inline version of this block.
                const pt = String(d?.profileType || d?.profile_type || '').toLowerCase();
                const noun = (pt === 'artist') ? 'artist' : 'music';
                return `approved your ${noun} profile "${truncate(artName)}"! You can now switch to your ${noun} profile.`;
            }

            default:
                return 'sent you a notification';
        }
    };

    const getPreview = (n) => {
        const type = String(n?.type || '');
        const d = parseData(n);

        // Allow preview for post_share with postType='comment' (comment shares via generic share endpoint)
        const isCommentShare = type === 'post_share' && String(d?.postType ?? d?.post_type ?? '').toLowerCase() === 'comment';
        if (!TEXT_PREVIEW_TYPES.has(type) && !isCommentShare) return '';
        if (!d) return '';

        // Poll ended — show results summary
        if (type === 'poll_ended') {
            const summary = d?.resultsSummary || '';
            const votes = Number(d?.totalVotes || 0);
            if (summary) return summary;
            if (votes > 0) return `${votes} total vote${votes !== 1 ? 's' : ''}`;
            return 'No votes were cast';
        }

        const preview =
            d.preview ||
            d.comment_preview || d.commentPreview ||
            d.messagePreview || d.message_preview ||
            d.snippet || d.text ||
            d.review_text || d.reviewText ||
            d.comment || d.body ||
            d.commentText || d.comment_text ||
            '';

        const out = String(preview || '').trim();
        if (!out) return '';

        const max = 120;
        if (out.length <= max) return out;
        return `${out.slice(0, max).trim()}...`;
    };

    const fetchPage = async ({ beforeId, replace } = {}) => {
        const limit = 50;
        const qs = new URLSearchParams();
        qs.set('limit', String(limit));
        if (beforeId) qs.set('before', String(beforeId));
        const acctParams = getNotifAccountParams();
        qs.set('account_id', acctParams.account_id);
        qs.set('account_type', acctParams.account_type);

        const res = await secureFetch(`/api/notifications?${qs.toString()}`, {
            method: 'GET',
            credentials: 'include',
            headers: notifFetchHeaders(),
        });

        if (!res.ok) {
            const msg = res.status === 401 ? 'Please sign in to view notifications.' : 'Failed to load notifications.';
            throw new Error(msg);
        }

        const data = await res.json();
        const newItems = Array.isArray(data?.items) ? data.items : [];
        const cursor = data?.nextCursor ?? data?.next_cursor ?? null;
        const cursorNum = cursor ? Number(cursor) : null;

        setNextCursor(cursorNum && Number.isFinite(cursorNum) ? cursorNum : null);

        setItems((prev) => {
            if (replace) return newItems;
            const existing = new Set((prev || []).map((x) => Number(x.id)));
            const merged = [...(prev || [])];
            newItems.forEach((n) => {
                const id = Number(n?.id);
                if (!existing.has(id)) merged.push(n);
            });
            return merged;
        });
    };

    useEffect(() => {
        const raf = window.requestAnimationFrame(() => setPageReady(true));
        return () => window.cancelAnimationFrame(raf);
    }, []);

    // Serialize highlight IDs from location state so the dependency is a primitive (string),
    // not an object reference that changes on every render.
    const highlightIdsFromState = location?.state?.llHighlightNotifIds;
    const highlightIdsKey = Array.isArray(highlightIdsFromState)
        ? JSON.stringify(highlightIdsFromState)
        : '';

    useEffect(() => {
        if (highlightIdsKey) {
            try {
                const parsed = JSON.parse(highlightIdsKey);
                setHighlightIds(
                    parsed.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
                );
            } catch {
                setHighlightIds(EMPTY_HIGHLIGHT_IDS);
            }
        } else {
            setHighlightIds(EMPTY_HIGHLIGHT_IDS);
        }
    }, [highlightIdsKey]);

    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);
            setError('');
            try {
                await fetchPage({ replace: true });
            } catch (e) {
                if (!mounted) return;
                setError(String(e?.message || 'Failed to load notifications.'));
            } finally {
                if (mounted) setLoading(false);
            }
        }

        // Reset state when account changes so stale data doesn't flash
        setItems([]);
        setNextCursor(null);
        setHighlightIds(EMPTY_HIGHLIGHT_IDS);
        setAlreadyFollowingIds(new Set());
        load();

        return () => {
            mounted = false;
        };
        // Re-fetch when account identity changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountCacheKey]);

    // ── Check existing follow status for follower notifications ──
    // When notifications load (or change), look up each new_follower actor
    // via /api/follows/status to pre-seed followedBackIds so the "Follow back"
    // button won't appear for people the user already follows.
    useEffect(() => {
        let cancelled = false;

        async function checkFollowStatuses() {
            // Collect unique follower target IDs + types from new_follower notifications
            const targets = [];
            const seen = new Set();

            for (const n of items) {
                if (String(n?.type || '') !== 'new_follower') continue;
                const nd = parseData(n);
                const targetId = Number(
                    nd?.followerAccountId || nd?.followerUserId ||
                    n?.actor_id || n?.actor_user_id || 0
                );
                const targetType = String(nd?.followerAccountType || 'personal').toLowerCase();
                if (!targetId || seen.has(targetId)) continue;
                seen.add(targetId);
                targets.push({ targetId, targetType });
            }

            if (targets.length === 0) return;

            const alreadyFollowing = new Set();
            const headers = { Accept: 'application/json', ...getAccountHeaders() };

            // Check each follower in parallel
            await Promise.all(
                targets.map(async ({ targetId, targetType }) => {
                    try {
                        const qs = new URLSearchParams({
                            target_id: String(targetId),
                            target_type: targetType,
                        });
                        const res = await secureFetch(`/api/follows/status?${qs}`, {
                            credentials: 'include',
                            headers,
                        });
                        if (!res.ok) return;
                        const data = await res.json();
                        if (data?.following) {
                            alreadyFollowing.add(targetId);
                        }
                    } catch {
                        // ignore individual failures
                    }
                })
            );

            if (cancelled || alreadyFollowing.size === 0) return;

            setAlreadyFollowingIds((prev) => {
                const next = new Set(prev);
                for (const id of alreadyFollowing) next.add(id);
                return next;
            });
        }

        if (!loading && items.length > 0) {
            checkFollowStatuses();
        }

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, loading]);

    const handleRefresh = async () => {
        setHighlightIds(EMPTY_HIGHLIGHT_IDS);
        setError('');
        setLoading(true);
        setItems([]);
        setNextCursor(null);
        setAlreadyFollowingIds(new Set());

        try {
            await fetchPage({ replace: true });
        } catch (e) {
            setError(String(e?.message || 'Failed to load notifications.'));
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (!hasMore || loadingMore) return;

        setLoadingMore(true);
        setError('');
        try {
            await fetchPage({ beforeId: nextCursor, replace: false });
        } catch (e) {
            setError(String(e?.message || 'Failed to load more notifications.'));
        } finally {
            setLoadingMore(false);
        }
    };

    const markOneRead = async (id) => {
        const nid = Number(id);
        if (!Number.isFinite(nid) || nid <= 0) return;

        try {
            await secureFetch(`/api/notifications/${nid}/read`, {
                method: 'POST',
                credentials: 'include',
                headers: notifFetchHeaders(),
            });

            setItems((prev) => prev.map((x) => (x.id === nid ? { ...x, is_read: true } : x)));
        } catch {
            // ignore
        }
    };

    /** Mark all notification IDs in a group as read (fire-and-forget). */
    const markGroupRead = async (n) => {
        const ids = n?.groupedIds;
        if (Array.isArray(ids) && ids.length > 1) {
            // Mark each individually (backend has single-ID endpoint)
            ids.forEach((gid) => {
                const nid = Number(gid);
                if (Number.isFinite(nid) && nid > 0) {
                    secureFetch(`/api/notifications/${nid}/read`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: notifFetchHeaders(),
                    }).catch(() => {});
                }
            });
            setItems((prev) => prev.map((x) => {
                const xId = Number(x.id);
                if (ids.includes(xId)) return { ...x, is_read: true };
                return x;
            }));
        } else {
            await markOneRead(n?.id);
        }
    };

    const resolveData = (n) => {
        const d = n?.data;
        if (!d) return null;
        if (typeof d === 'object') return d;
        try {
            return JSON.parse(d);
        } catch {
            return null;
        }
    };

    const getMyProfilePath = () => {
        // If viewing as business or artist, route to that account's profile
        if (isBusinessAccount && activeAccount?.slug) {
            return `/${activeAccount.slug}`;
        }
        if (isArtistAccount && activeAccount?.slug) {
            return `/${activeAccount.slug}`;
        }
        const slug = String(meProfileSlug || '').trim().replace(/^@+/, '');
        if (slug) return `/${slug}`;
        return '/account';
    };

    const handleFollowBack = async (e, notif) => {
        e.stopPropagation();
        e.preventDefault();
        const nd = parseData(notif);
        const targetId = Number(nd?.followerAccountId || nd?.followerUserId || notif?.actor_id || notif?.actor_user_id || 0);
        const targetType = String(nd?.followerAccountType || 'personal').toLowerCase();
        if (!targetId || followedBackIds.has(targetId)) return;

        setFollowedBackIds((prev) => new Set(prev).add(targetId));
        try {
            await secureFetch('/api/follows/toggle', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...getAccountHeaders() },
                body: JSON.stringify({
                    target_id: targetId,
                    target_type: targetType,
                    action: 'follow',
                }),
            });
        } catch {
            setFollowedBackIds((prev) => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
        }
    };

    const handleOpenNotification = async (n) => {
        if (!n) return;

        if (!n.is_read) {
            await markGroupRead(n);
        }

        const id = Number(n.id);
        const type = String(n?.type || '').trim();
        const entityType = String(n?.entity_type || n?.entityType || '').trim();
        const entityId = Number(n?.entity_id ?? n?.entityId ?? n?.post_id ?? n?.postId ?? 0);
        const subId = Number(n?.sub_entity_id ?? n?.subEntityId ?? n?.comment_id ?? n?.commentId ?? 0);
        const d = resolveData(n) || {};
        const dataCommentId = Number(d?.commentId ?? d?.comment_id ?? 0);
        const dataPhotoId = Number(d?.photoId ?? d?.photo_id ?? 0);
        const commentId = dataCommentId || subId || undefined;
        const fromState = { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type };

        // ── Community posts ────────────────────────────────────────
        // NOTE: comment_reply and comment_like are generic types used across
        // posts AND events. Only route them here when entityType is NOT 'event'.
        const isEventEntity = entityType === 'event';
        const isPostComment = type === 'post_comment' || type === 'comment_reply' || type === 'comment_like';
        const isGenericCommentOnEvent = isEventEntity && (type === 'comment_reply' || type === 'comment_like');
        const isGrouped = Number(n?.othersCount || n?.groupedCount || 0) > 1;

        // Slice 2d: news-article comments
        //
        // When a user replies to / likes a comment on a news article, the
        // backend writes entityType='news_article' and data.isNewsArticle=true
        // (see news.js POST /article/:id/comments and community.js
        // /comments/:commentId/like). Route those to /news/article/:id and
        // seed the panel with the metadata we stored, so the page paints
        // instantly and RedditComments scrolls to the exact comment.
        const isNewsArticleComment =
            isPostComment && (entityType === 'news_article' || d?.isNewsArticle === true);
        if (isNewsArticleComment) {
            const newsArticleId = Number(
                d?.articleId ?? d?.article_id ?? d?.postId ?? d?.post_id ?? entityId ?? 0
            );
            // For comment_like, entityId may be the comment ID rather than the
            // article ID — prefer data.articleId/postId when available, fall
            // back to entityId.
            // For comment_like, similarly disambiguate the comment id.
            const newsCommentId = (type === 'comment_like' && entityType === 'news_article')
                ? (Number(d?.commentId ?? d?.comment_id ?? commentId ?? 0) || Number(entityId) || 0)
                : (Number(commentId) || 0);

            if (Number.isFinite(newsArticleId) && newsArticleId > 0) {
                navigate(`/news/article/${newsArticleId}`, {
                    state: {
                        ...fromState,
                        // Seed the panel so the first paint has the headline,
                        // publisher, and hero image already — same pattern as
                        // the news_article_share recipient route below.
                        article: {
                            id: newsArticleId,
                            title: d?.articleTitle || d?.article_title || '',
                            source_name: d?.articleSourceName || d?.article_source_name || '',
                            image_url: d?.articleImageUrl || d?.article_image_url || '',
                            url: d?.articleUrl || d?.article_url || '',
                        },
                        scrollToCommentId: newsCommentId && !isGrouped ? newsCommentId : undefined,
                        highlightCommentId: newsCommentId && !isGrouped ? newsCommentId : undefined,
                    },
                });
                return;
            }
        }

        if (
            !isGenericCommentOnEvent && (
                entityType === 'community_post' ||
                entityType === 'business_post' ||
                entityType === 'artist_post' ||
                type === 'post_like' || type === 'post_repost' ||
                type === 'post_comment' || type === 'comment_reply' || type === 'comment_like' ||
                type === 'post_mention' || type === 'poll_ended'
            )
        ) {
            // For comment_like, entityId may be the comment ID, not the post ID.
            // Use data.postId or subEntityId as the real post ID in that case.
            const dataPostId = Number(d?.postId ?? d?.post_id ?? 0);
            const postId = (entityType === 'post_comment' && dataPostId > 0)
                ? dataPostId
                : (dataPostId > 0 && type === 'comment_like') ? dataPostId : entityId;
            // For comment_like where entityId is the comment, use entityId as commentId
            const resolvedCommentId = (entityType === 'post_comment' && type === 'comment_like')
                ? entityId
                : commentId;
            if (Number.isFinite(postId) && postId > 0) {
                // Business or artist post: navigate to /:slug/posts/:id when slug is available
                const bizSlug = d?.businessSlug || d?.business_slug || d?.pageSlug || d?.page_slug || '';
                const artSlug = d?.artistSlug || d?.artist_slug || d?.artistHandle || d?.artist_handle || '';
                const isBizPost = entityType === 'business_post' || (bizSlug && !entityType?.includes('community') && !entityType?.includes('artist'));
                const isArtPost = entityType === 'artist_post' || (artSlug && !entityType?.includes('community') && !entityType?.includes('business'));
                const basePath = isBizPost && bizSlug ? `/${bizSlug}/posts/${postId}`
                    : isArtPost && artSlug ? `/${artSlug}/posts/${postId}`
                        : `/posts/${postId}`;

                navigate(basePath, {
                    state: {
                        ...fromState,
                        scrollToCommentId: isPostComment && resolvedCommentId && !isGrouped ? Number(resolvedCommentId) : undefined,
                        highlightCommentId: isPostComment && resolvedCommentId && !isGrouped ? Number(resolvedCommentId) : undefined,
                        scrollToComments: isPostComment && isGrouped ? true : undefined,
                    },
                });
                return;
            }
        }

        // ── Service photos ────────────────────────────────────────
        const isServicePhoto = type === 'service_photo_comment' || type === 'service_photo_comment_like' || type === 'service_photo_like';
        if (isServicePhoto) {
            const svcId = Number(d?.serviceId ?? d?.service_id ?? 0);
            if (Number.isFinite(svcId) && svcId > 0) {
                const svcPhotoKind = String(d?.photoType ?? d?.photo_type ?? 'avatar').toLowerCase();
                navigate(`/services`, {
                    state: {
                        ...fromState,
                        openServiceId: svcId,
                        llOpenPhotoComments: true,
                        llPhotoCommentId: Number.isFinite(commentId) && commentId > 0 ? commentId : undefined,
                        llPhotoType: svcPhotoKind === 'gallery' ? 'gallery' : svcPhotoKind === 'cover' ? 'cover' : 'avatar',
                        ...(svcPhotoKind === 'gallery' ? {
                            llPhotoId: Number.isFinite(dataPhotoId) && dataPhotoId > 0 ? dataPhotoId : undefined,
                            llPhotoUrl: d?.photoUrl ?? d?.photo_url ?? undefined,
                        } : {}),
                    },
                });
                return;
            }
        }

        // ── Profile photos ─────────────────────────────────────────
        const isPhoto = type === 'photo_comment' || type === 'photo_comment_like' || type === 'photo_like';
        if (isPhoto) {
            const photoArtistId = Number(d?.artistId ?? d?.artist_id ?? 0);
            const photoBizId = Number(d?.businessId ?? d?.business_id ?? 0);

            if (photoArtistId > 0) {
                // Artist photo → navigate to artist profile page (/{handle})
                const artHandle = String(d?.artistHandle ?? d?.artistSlug ?? d?.artist_handle ?? d?.artist_slug ?? '').trim();
                if (artHandle) {
                    const artPhotoKind = String(d?.photoKind ?? d?.photo_kind ?? 'avatar').toLowerCase();
                    navigate(`/${artHandle}`, {
                        state: {
                            ...fromState,
                            llOpenPhotoComments: true,
                            llPhotoCommentId: Number.isFinite(commentId) && commentId > 0 ? commentId : undefined,
                            llPhotoType: artPhotoKind === 'gallery' ? 'gallery' : artPhotoKind === 'cover' ? 'cover' : 'avatar',
                            ...(artPhotoKind === 'gallery' ? {
                                llPhotoId: Number.isFinite(dataPhotoId) && dataPhotoId > 0 ? dataPhotoId : undefined,
                                llPhotoUrl: d?.photoUrl ?? d?.photo_url ?? undefined,
                            } : {}),
                        },
                    });
                    return;
                }
            }

            if (photoBizId > 0) {
                // Business photo → navigate to business page
                const bizSlug = String(d?.businessSlug ?? d?.business_slug ?? d?.slug ?? '').trim();
                const bizPath = bizSlug ? `/${bizSlug}` : `/business/${photoBizId}`;
                const bizPhotoKind = String(d?.photoKind ?? d?.photo_kind ?? 'avatar').toLowerCase();
                navigate(bizPath, {
                    state: {
                        ...fromState,
                        llOpenPhotoComments: true,
                        llPhotoCommentId: Number.isFinite(commentId) && commentId > 0 ? commentId : undefined,
                        llPhotoType: bizPhotoKind === 'gallery' ? 'gallery' : bizPhotoKind === 'cover' ? 'cover' : 'avatar',
                        ...(bizPhotoKind === 'gallery' ? {
                            llPhotoId: Number.isFinite(dataPhotoId) && dataPhotoId > 0 ? dataPhotoId : undefined,
                            llPhotoUrl: d?.photoUrl ?? d?.photo_url ?? undefined,
                        } : {}),
                    },
                });
                return;
            }

            // Personal photo → navigate to own profile with photo type
            const rawPhotoKind = String(d?.photoKind ?? d?.photo_kind ?? 'avatar').toLowerCase();
            navigate(getMyProfilePath(), {
                state: {
                    ...fromState,
                    llOpenAvatarComments: true,
                    llAvatarPhotoId: Number.isFinite(dataPhotoId) && dataPhotoId > 0 ? dataPhotoId : undefined,
                    llAvatarCommentId: Number.isFinite(commentId) && commentId > 0 ? commentId : undefined,
                    llPhotoType: rawPhotoKind === 'gallery' ? 'gallery' : rawPhotoKind === 'cover' ? 'cover' : 'avatar',
                    ...(rawPhotoKind === 'gallery' ? {
                        llPhotoId: Number.isFinite(dataPhotoId) && dataPhotoId > 0 ? dataPhotoId : undefined,
                        llPhotoUrl: d?.photoUrl ?? d?.photo_url ?? undefined,
                    } : {}),
                },
            });
            return;
        }

        // ── Business posts / reviews ───────────────────────────────
        if (entityType === 'business_post') {
            const postId = entityId;
            if (Number.isFinite(postId) && postId > 0) {
                const bizSlug = d?.businessSlug || d?.business_slug || d?.pageSlug || d?.page_slug || '';
                const bizCommentId = isPostComment && commentId && !isGrouped ? Number(commentId) : undefined;
                const navState = {
                    ...fromState,
                    scrollToCommentId: bizCommentId,
                    highlightCommentId: bizCommentId,
                    scrollToComments: isPostComment && isGrouped ? true : undefined,
                };
                if (bizSlug) {
                    navigate(`/${bizSlug}/posts/${postId}`, { state: navState });
                } else {
                    navigate(`/posts/${postId}`, { state: navState });
                }
                return;
            }
        }
        if (type === 'business_review' || type === 'business_review_helpful' || type === 'business_review_reply') {
            // Try every known field the backend might use for the business slug.
            const slug = d?.businessSlug || d?.business_slug || d?.pageSlug || d?.page_slug
                || d?.slug || d?.handle
                || n?.business_slug || n?.businessSlug || n?.page_slug || n?.pageSlug || '';
            // Review ID: data.reviewId, sub_entity_id, or entity_id (when entity is the review itself).
            const reviewId = Number(d?.reviewId ?? d?.review_id ?? subId ?? entityId ?? 0);
            // Business ID: data.businessId, entity_id (when entity is the business), or fall back.
            const bizIdFromData = Number(d?.businessId ?? d?.business_id ?? d?.business ?? 0);
            const bizId = bizIdFromData > 0 ? bizIdFromData
                : (subId > 0 && Number.isFinite(entityId) && entityId > 0) ? entityId
                    : Number(n?.business_id ?? entityId ?? 0);
            const reviewState = {
                ...fromState,
                scrollToReviews: true,
                highlightReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : undefined,
            };
            if (slug) {
                navigate(`/${slug}`, { state: reviewState });
                return;
            }
            // No slug available — resolve it from the business API using the numeric ID.
            if (Number.isFinite(bizId) && bizId > 0) {
                try {
                    const res = await secureFetch(`/api/business/${bizId}`, { credentials: 'include' });
                    if (res.ok) {
                        const biz = await res.json();
                        const resolvedSlug = biz?.slug || biz?.handle || biz?.business?.slug || biz?.business?.handle || '';
                        if (resolvedSlug) {
                            navigate(`/${resolvedSlug}`, { state: reviewState });
                            return;
                        }
                    }
                } catch { /* ignore – fall through */ }
                // If API lookup fails, try the numeric ID as a last resort.
                navigate(`/${bizId}`, { state: reviewState });
                return;
            }
        }

        // ── Events ─────────────────────────────────────────────────
        if (entityType === 'event' || type.startsWith('event_')) {
            const evId = Number(d?.eventId ?? d?.event_id ?? entityId ?? 0);
            if (Number.isFinite(evId) && evId > 0) {
                const isEventComment = type === 'event_comment' || (type === 'comment_reply' && entityType === 'event') || (type === 'comment_like' && entityType === 'event');
                navigate(`/events/${evId}`, {
                    state: {
                        ...fromState,
                        scrollToCommentId: isEventComment && commentId ? Number(commentId) : undefined,
                    },
                });
                return;
            }
        }

        // ── Music / Artist posts ───────────────────────────────────
        if (entityType === 'artist_post') {
            const postId = entityId;
            if (Number.isFinite(postId) && postId > 0) {
                // Artist posts live at /:slug/posts/:postId — need the slug
                const artistSlug = d?.artistSlug || d?.artist_slug || d?.artistHandle || d?.artist_handle || '';
                if (artistSlug) {
                    navigate(`/${artistSlug}/posts/${postId}`, { state: fromState });
                } else {
                    // Fallback: community post page handles most post types
                    navigate(`/posts/${postId}`, { state: fromState });
                }
                return;
            }
        }
        if (type === 'artist_team_removed') {
            navigate('/music', { state: fromState });
            return;
        }

        // ── Jobs ───────────────────────────────────────────────────
        if (entityType === 'job' || type === 'job_application' || type === 'job_saved' || type === 'job_share') {
            const jId = Number(d?.jobId ?? d?.job_id ?? entityId ?? 0);
            if (Number.isFinite(jId) && jId > 0) {
                const jobNavState = { ...fromState };

                // Application notifications: open to Applications tab
                if (type === 'job_application') {
                    jobNavState.detailTab = 'applications';
                    // Single (non-grouped) application: highlight the applicant
                    const groupedCount = Number(n?.groupedCount || 1);
                    if (groupedCount <= 1) {
                        const applicantId = Number(d?.applicantId ?? d?.applicant_id ?? n?.actor_id ?? n?.actor_user_id ?? 0);
                        if (Number.isFinite(applicantId) && applicantId > 0) {
                            jobNavState.highlightApplicationUserId = applicantId;
                        }
                    }
                }

                navigate(`/jobs/${jId}`, { state: jobNavState });
                return;
            }
        }

        // ── Marketplace: Seller Reviews ────────────────────────────────
        if (type === 'seller_review' || type === 'seller_review_reply') {
            const reviewId = Number(d?.reviewId ?? d?.review_id ?? 0);
            const sellerHandle = String(d?.sellerHandle ?? d?.seller_handle ?? '').trim();
            const sellerIdFromData = Number(d?.sellerId ?? d?.seller_id ?? 0);

            if (type === 'seller_review') {
                // seller_review: I'm the seller — go to my own profile's seller info tab
                const profilePath = sellerHandle ? `/${sellerHandle}` : getMyProfilePath();
                navigate(profilePath, {
                    state: {
                        ...fromState,
                        rightRailView: 'marketplace',
                        marketplaceSubTab: 'seller_info',
                        highlightSellerReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : undefined,
                    },
                });
                return;
            }

            // seller_review_reply: I'm the reviewer — the seller's profile may be private,
            // so open the seller reviews popup in-place instead of navigating.
            const sellerId = Number.isFinite(sellerIdFromData) && sellerIdFromData > 0 ? sellerIdFromData : null;
            if (sellerId) {
                setSellerReviewsPopup({
                    open: true,
                    sellerId,
                    highlightReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : null,
                });
                return;
            }
        }

        // ── Marketplace ────────────────────────────────────────────
        if (
            entityType === 'marketplace_listing' ||
            type === 'listing_favorite' || type === 'listing_repost' ||
            type === 'listing_message' || type === 'listing_mention' ||
            type === 'listing_sold' ||
            type === 'listing_share' || type === 'listing_share_recipient'
        ) {
            const lId = Number(d?.listingId ?? d?.listing_id ?? entityId ?? 0);
            if (Number.isFinite(lId) && lId > 0) {
                navigate(`/marketplace/${lId}`, { state: fromState });
                return;
            }
        }

        // ── Service Requests ───────────────────────────────────────
        if (
            type === 'service_request_response' || type === 'service_response_accepted' ||
            type === 'service_response_declined' ||
            type === 'service_request_shared' || type === 'service_request_share_recipient'
        ) {
            const rId = Number(d?.requestId ?? d?.request_id ?? entityId ?? 0);
            if (Number.isFinite(rId) && rId > 0) {
                const responseNavState = { ...fromState };
                // Open the responses tab and highlight the specific response
                if (type === 'service_request_response') {
                    responseNavState.openResponsesTab = true;
                    const respId = Number(d?.responseId ?? d?.response_id ?? 0);
                    if (Number.isFinite(respId) && respId > 0) {
                        responseNavState.highlightResponseId = respId;
                    }
                }
                navigate(`/services/requests/${rId}`, { state: responseNavState });
                return;
            }
        }

        // ── Services (listings) ───────────────────────────────────
        if (
            type === 'service_review' || type === 'service_review_response' ||
            type === 'service_quote_request' ||
            type === 'service_favorited'
        ) {
            const sId = Number(d?.listingId ?? d?.listing_id ?? d?.serviceId ?? d?.service_id ?? entityId ?? 0);
            if (Number.isFinite(sId) && sId > 0) {
                // For review-related notifications, open the reviews tab and scroll to the specific review
                const isReviewType = type === 'service_review' || type === 'service_review_response';
                const reviewId = Number(d?.reviewId ?? d?.review_id ?? subId ?? 0);
                // Navigate to /services (the main services hub) with state telling it
                // which service to open. /services/:id is a request-detail route and
                // would 400 when given a listing ID.
                const serviceNavState = {
                    ...fromState,
                    openServiceId: sId,
                    ...(isReviewType ? {
                        scrollToReviews: true,
                        highlightReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : undefined,
                    } : {}),
                };
                navigate('/services', { state: serviceNavState });
                return;
            }
        }

        // ── Follow — single: go to follower's profile; grouped: go to social page ──
        if (type === 'new_follower') {
            const isFollowGrouped = Array.isArray(n?.actors) && n.actors.length > 1;
            if (isFollowGrouped) {
                navigate('/social', {
                    state: {
                        ...fromState,
                        socialTab: 'followers',
                        sortFollowersBy: 'recent',
                    },
                });
                return;
            }
            const handle = String(d?.actorAccountHandle || d?.actorHandle || d?.actor_handle || n?.actor_handle || '').trim();
            const actorId = Number(d?.followerId || d?.followerUserId || n?.actor_id || n?.actor_user_id || 0);
            if (handle) {
                navigate(`/${handle}`, { state: fromState });
                return;
            }
            if (Number.isFinite(actorId) && actorId > 0) {
                navigate(`/${actorId}`, { state: fromState });
                return;
            }
        }

        // Follow request — navigate to social page with Requests tab
        if (type === 'follow_request') {
            navigate('/social', { state: { ...fromState, socialTab: 'requests' } });
            return;
        }

        // Follow request accepted — go to the profile of the person who accepted
        if (type === 'follow_request_accepted') {
            const handle = String(d?.actorAccountHandle || d?.actorHandle || d?.actor_handle || n?.actor_handle || '').trim();
            const actorId = Number(d?.acceptedByUserId || n?.actor_id || n?.actor_user_id || 0);
            if (handle) {
                navigate(`/${handle}`, { state: fromState });
                return;
            }
            if (Number.isFinite(actorId) && actorId > 0) {
                navigate(`/${actorId}`, { state: fromState });
                return;
            }
        }

        // ── Groups — invite, join ─────────────────────────────────
        if (type === 'group_invite' || type === 'group_join' || type === 'group_request_approved') {
            const groupSlug = d?.groupSlug || d?.group_slug || '';
            const groupIdFromData = Number(d?.groupId ?? d?.group_id ?? entityId ?? 0);
            if (groupSlug) {
                navigate(`/${groupSlug}`, { state: fromState });
                return;
            }
            if (Number.isFinite(groupIdFromData) && groupIdFromData > 0) {
                navigate(`/groups/${groupIdFromData}`, { state: fromState });
                return;
            }
        }
        // ── Group join request → admin console members tab ────────
        if (type === 'group_join_request') {
            const groupSlug = d?.groupSlug || d?.group_slug || '';
            const groupIdFromData = Number(d?.groupId ?? d?.group_id ?? entityId ?? 0);
            if (groupSlug) {
                navigate(`/${groupSlug}/admin`, {
                    state: { ...fromState, adminTab: 'members' },
                });
                return;
            }
            if (Number.isFinite(groupIdFromData) && groupIdFromData > 0) {
                navigate(`/groups/${groupIdFromData}/admin`, {
                    state: { ...fromState, adminTab: 'members' },
                });
                return;
            }
        }
        // ── Group ban / timeout → group page ──────────────────────
        if (type === 'group_ban' || type === 'group_timeout') {
            const groupSlug = d?.groupSlug || d?.group_slug || '';
            const groupIdFromData = Number(d?.groupId ?? d?.group_id ?? entityId ?? 0);
            if (groupSlug) {
                navigate(`/${groupSlug}`, { state: fromState });
                return;
            }
            if (Number.isFinite(groupIdFromData) && groupIdFromData > 0) {
                navigate(`/groups/${groupIdFromData}`, { state: fromState });
                return;
            }
        }

        // ── Shares ──────────────────────────────────────────────────
        if (type.endsWith('_share')) {
            const sharePostId = Number(d?.postId ?? d?.post_id ?? entityId ?? 0);
            const sharePostType = String(d?.postType ?? d?.post_type ?? '');
            const shareCommentId = Number(d?.commentId ?? d?.comment_id ?? 0);
            const shareDeepLink = String(d?.deepLink ?? d?.deep_link ?? '');

            // Comment share — navigate to the correct post page and highlight the comment
            if (type === 'comment_share') {
                // Resolve the comment ID to highlight
                let navCommentId = shareCommentId || Number(d?.commentId ?? d?.comment_id ?? 0);
                // Resolve the real post ID — for comment shares, entityId may be the comment ID, not the post ID
                let navPostId = Number(d?.realPostId ?? d?.real_post_id ?? 0);
                // Determine the post/entity type so we can route to the correct page
                const shareEntityType = String(d?.entityType ?? d?.entity_type ?? d?.postType ?? d?.post_type ?? '').toLowerCase();
                const shareBizSlug = d?.businessSlug || d?.business_slug || d?.pageSlug || d?.page_slug || '';
                const shareArtSlug = d?.artistSlug || d?.artist_slug || d?.artistHandle || d?.artist_handle || '';
                const shareEventId = Number(d?.eventId ?? d?.event_id ?? 0);

                // Slice 2d: sniff the deep link for a /news/article/:id path
                // in addition to the existing /posts/:id and /events/:id
                // patterns. This is the most reliable signal that a shared
                // comment belongs to a news article — the shares backend
                // writes the permalink, which for news comments looks like
                // `/news/article/:id?comment=:commentId`.
                let deepLinkNewsArticleId = 0;

                // Try to extract post ID and comment ID from the deep link URL
                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        // Match /posts/:id, /:slug/posts/:id, /events/:id patterns
                        const postsMatch = url.pathname.match(/\/posts\/(\d+)/);
                        const eventsMatch = url.pathname.match(/\/events\/(\d+)/);
                        const newsMatch = url.pathname.match(/\/news\/article\/(\d+)/);
                        if (postsMatch) navPostId = navPostId || Number(postsMatch[1]);
                        if (eventsMatch && !navPostId) navPostId = Number(eventsMatch[1]);
                        if (newsMatch) deepLinkNewsArticleId = Number(newsMatch[1]) || 0;
                        const qComment = url.searchParams.get('comment');
                        if (qComment) navCommentId = Number(qComment) || navCommentId;
                    } catch { /* ignore */ }
                }

                // Fallback: use sharePostId if we still don't have a post ID
                if ((!navPostId || navPostId <= 0) && Number.isFinite(sharePostId) && sharePostId > 0) {
                    navPostId = sharePostId;
                }

                const commentNavState = {
                    ...fromState,
                    scrollToCommentId: navCommentId || undefined,
                    highlightCommentId: navCommentId || undefined,
                };

                // Slice 2d: if the shared comment belongs to a news article,
                // route to /news/article/:id and seed the panel (same shape
                // as news_article_share). The backend may signal this a few
                // different ways depending on when the share was created, so
                // we check all of them defensively — including the deep-link
                // path regex as a last-resort fallback.
                const isNewsArticleShare =
                    d?.isNewsArticle === true ||
                    shareEntityType === 'news_article' ||
                    shareEntityType === 'news' ||
                    deepLinkNewsArticleId > 0;
                if (isNewsArticleShare) {
                    const shareArticleId = Number(
                        d?.articleId ?? d?.article_id ?? deepLinkNewsArticleId ?? navPostId ?? sharePostId ?? 0
                    );
                    if (Number.isFinite(shareArticleId) && shareArticleId > 0) {
                        navigate(`/news/article/${shareArticleId}`, {
                            state: {
                                ...commentNavState,
                                article: {
                                    id: shareArticleId,
                                    title: d?.articleTitle || d?.article_title || '',
                                    source_name: d?.articleSourceName || d?.article_source_name || '',
                                    image_url: d?.articleImageUrl || d?.article_image_url || '',
                                    url: d?.articleUrl || d?.article_url || '',
                                },
                            },
                        });
                        return;
                    }
                }

                if (Number.isFinite(navPostId) && navPostId > 0) {
                    // Route to event post page
                    if (shareEntityType === 'event' || shareEntityType.includes('event') || (shareEventId > 0)) {
                        const evId = shareEventId || navPostId;
                        navigate(`/events/${evId}`, { state: commentNavState });
                        return;
                    }
                    // Route to business post page
                    if (shareEntityType === 'business_post' || shareEntityType === 'business' || shareBizSlug) {
                        const basePath = shareBizSlug ? `/${shareBizSlug}/posts/${navPostId}` : `/posts/${navPostId}`;
                        navigate(basePath, { state: commentNavState });
                        return;
                    }
                    // Route to artist post page
                    if (shareEntityType === 'artist_post' || shareEntityType === 'artist' || shareArtSlug) {
                        const basePath = shareArtSlug ? `/${shareArtSlug}/posts/${navPostId}` : `/posts/${navPostId}`;
                        navigate(basePath, { state: commentNavState });
                        return;
                    }
                    // Default: community post page
                    navigate(`/posts/${navPostId}`, { state: commentNavState });
                    return;
                }

                // Fallback to deep link directly — still pass comment highlight state
                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        navigate(url.pathname + url.search, { state: commentNavState });
                    } catch {
                        navigate(shareDeepLink, { state: commentNavState });
                    }
                    return;
                }
            }

            // Service request share (via generic /api/shares with postType='service_request')
            if ((type === 'post_share' && sharePostType === 'service_request') || sharePostType === 'service_request') {
                const rId = Number(d?.postId ?? d?.post_id ?? d?.requestId ?? d?.request_id ?? sharePostId ?? 0);
                if (Number.isFinite(rId) && rId > 0) {
                    navigate(`/services/requests/${rId}`, { state: fromState });
                    return;
                }
            }

            // Service share (via generic /api/shares with postType='service')
            if ((type === 'post_share' && sharePostType === 'service') || sharePostType === 'service') {
                const sId = Number(d?.postId ?? d?.post_id ?? sharePostId ?? 0);
                if (Number.isFinite(sId) && sId > 0) {
                    navigate(`/services`, { state: { ...fromState, openServiceId: sId } });
                    return;
                }
            }

            // Marketplace listing share (via generic /api/shares with postType='listing').
            // Also honor a marketplace deep link even when older share rows did not
            // persist postType='listing' correctly.
            if ((type === 'post_share' && sharePostType === 'listing') || type === 'listing_share' || sharePostType === 'listing') {
                const lId = Number(d?.postId ?? d?.post_id ?? d?.listingId ?? d?.listing_id ?? sharePostId ?? 0);
                if (Number.isFinite(lId) && lId > 0) {
                    navigate(`/marketplace/${lId}`, { state: fromState });
                    return;
                }
            }

            if (shareDeepLink) {
                try {
                    const url = new URL(shareDeepLink, window.location.origin);
                    const marketMatch = url.pathname.match(/^\/marketplace\/(\d+)/);
                    if (marketMatch) {
                        navigate(`/marketplace/${marketMatch[1]}`, { state: fromState });
                        return;
                    }
                } catch { /* ignore malformed deep link */ }
            }

            // Comment share routed through generic /api/shares with postType='comment'
            if ((type === 'post_share' && sharePostType === 'comment') || sharePostType === 'comment') {
                let navCommentId = shareCommentId || Number(d?.commentId ?? d?.comment_id ?? 0);
                let navPostId = Number(d?.realPostId ?? d?.real_post_id ?? 0);
                const shareEntityType = String(d?.entityType ?? d?.entity_type ?? '').toLowerCase();
                const shareBizSlug = d?.businessSlug || d?.business_slug || d?.pageSlug || d?.page_slug || '';
                const shareArtSlug = d?.artistSlug || d?.artist_slug || d?.artistHandle || d?.artist_handle || '';
                const shareEventId = Number(d?.eventId ?? d?.event_id ?? 0);

                // Slice 2d: sniff for /news/article/:id in the deep link
                // (same rationale as the first comment_share branch).
                let deepLinkNewsArticleId2 = 0;

                // Try to extract post ID and comment ID from the deep link
                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        const postsMatch = url.pathname.match(/\/posts\/(\d+)/);
                        const eventsMatch = url.pathname.match(/\/events\/(\d+)/);
                        const newsMatch = url.pathname.match(/\/news\/article\/(\d+)/);
                        if (postsMatch) navPostId = navPostId || Number(postsMatch[1]);
                        if (eventsMatch && !navPostId) navPostId = Number(eventsMatch[1]);
                        if (newsMatch) deepLinkNewsArticleId2 = Number(newsMatch[1]) || 0;
                        const qComment = url.searchParams.get('comment');
                        if (qComment) navCommentId = Number(qComment) || navCommentId;
                    } catch { /* ignore */ }
                }

                if ((!navPostId || navPostId <= 0) && Number.isFinite(sharePostId) && sharePostId > 0) {
                    navPostId = sharePostId;
                }

                const commentNavState = {
                    ...fromState,
                    scrollToCommentId: navCommentId || undefined,
                    highlightCommentId: navCommentId || undefined,
                };

                // Slice 2d: news-article comment share (same logic as above
                // but inside the post_share(postType=comment) fallback path).
                const isNewsArticleShare2 =
                    d?.isNewsArticle === true ||
                    shareEntityType === 'news_article' ||
                    shareEntityType === 'news' ||
                    deepLinkNewsArticleId2 > 0;
                if (isNewsArticleShare2) {
                    const shareArticleId2 = Number(
                        d?.articleId ?? d?.article_id ?? deepLinkNewsArticleId2 ?? navPostId ?? sharePostId ?? 0
                    );
                    if (Number.isFinite(shareArticleId2) && shareArticleId2 > 0) {
                        navigate(`/news/article/${shareArticleId2}`, {
                            state: {
                                ...commentNavState,
                                article: {
                                    id: shareArticleId2,
                                    title: d?.articleTitle || d?.article_title || '',
                                    source_name: d?.articleSourceName || d?.article_source_name || '',
                                    image_url: d?.articleImageUrl || d?.article_image_url || '',
                                    url: d?.articleUrl || d?.article_url || '',
                                },
                            },
                        });
                        return;
                    }
                }

                if (Number.isFinite(navPostId) && navPostId > 0) {
                    if (shareEntityType === 'event' || shareEntityType.includes('event') || shareEventId > 0) {
                        navigate(`/events/${shareEventId || navPostId}`, { state: commentNavState });
                        return;
                    }
                    if (shareEntityType === 'business_post' || shareEntityType === 'business' || shareBizSlug) {
                        const basePath = shareBizSlug ? `/${shareBizSlug}/posts/${navPostId}` : `/posts/${navPostId}`;
                        navigate(basePath, { state: commentNavState });
                        return;
                    }
                    if (shareEntityType === 'artist_post' || shareEntityType === 'artist' || shareArtSlug) {
                        const basePath = shareArtSlug ? `/${shareArtSlug}/posts/${navPostId}` : `/posts/${navPostId}`;
                        navigate(basePath, { state: commentNavState });
                        return;
                    }
                    navigate(`/posts/${navPostId}`, { state: commentNavState });
                    return;
                }

                // Fallback to deep link with comment highlight state
                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        navigate(url.pathname + url.search, { state: commentNavState });
                    } catch {
                        navigate(shareDeepLink, { state: commentNavState });
                    }
                    return;
                }
            }

            // Business profile share (via generic /api/shares with postType='business')
            if ((type === 'post_share' && sharePostType === 'business') || type === 'business_share') {
                const bizSlug = d?.businessSlug || d?.business_slug || d?.sharerAccountSlug || d?.sharer_account_slug || '';
                if (bizSlug) {
                    navigate(`/${bizSlug}`, { state: fromState });
                    return;
                }
                // Fallback: try deep link
                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        navigate(url.pathname, { state: fromState });
                    } catch {
                        navigate(shareDeepLink, { state: fromState });
                    }
                    return;
                }
            }

            // Artist profile share (via generic /api/shares with postType='artist')
            if ((type === 'post_share' && sharePostType === 'artist') || type === 'artist_share') {
                const artHandle = d?.artistHandle || d?.artist_handle || d?.sharerAccountSlug || d?.sharer_account_slug || '';
                if (artHandle) {
                    navigate(`/${artHandle}`, { state: fromState });
                    return;
                }
                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        navigate(url.pathname, { state: fromState });
                    } catch {
                        navigate(shareDeepLink, { state: fromState });
                    }
                    return;
                }
            }

            // Post share
            if (type === 'post_share' || sharePostType === 'post' || sharePostType === 'business_post') {
                if (Number.isFinite(sharePostId) && sharePostId > 0) {
                    // Business post: navigate to /:slug/posts/:id when slug is available
                    const shareBizSlug = d?.businessSlug || d?.business_slug || d?.pageSlug || d?.page_slug || '';
                    const shareIsBiz = sharePostType === 'business_post' || d?.entityType === 'business_post' || Boolean(shareBizSlug);
                    const sharePath = shareIsBiz && shareBizSlug ? `/${shareBizSlug}/posts/${sharePostId}` : `/posts/${sharePostId}`;
                    navigate(sharePath, { state: fromState });
                    return;
                }
            }

            // Event share
            if (type === 'event_share' || sharePostType === 'event') {
                if (Number.isFinite(sharePostId) && sharePostId > 0) {
                    navigate(`/events/${sharePostId}`, { state: fromState });
                    return;
                }
            }

            // Job share
            if (type === 'job_share' || sharePostType === 'job') {
                if (Number.isFinite(sharePostId) && sharePostId > 0) {
                    navigate(`/jobs/${sharePostId}`, { state: fromState });
                    return;
                }
            }

            // Group share
            if (type === 'group_share' || sharePostType === 'group') {
                const gSlug = d?.groupSlug || d?.group_slug || '';
                const gId = Number(d?.groupId ?? d?.group_id ?? sharePostId ?? 0);
                if (gSlug) {
                    navigate(`/${gSlug}`, { state: fromState });
                    return;
                }
                if (Number.isFinite(gId) && gId > 0) {
                    navigate(`/groups/${gId}`, { state: fromState });
                    return;
                }
            }

            // Service request share
            if (type === 'service_request_shared' || type === 'service_request_share_recipient' || sharePostType === 'service_request') {
                const rId = Number(d?.requestId ?? d?.request_id ?? sharePostId ?? 0);
                if (Number.isFinite(rId) && rId > 0) {
                    navigate(`/services/requests/${rId}`, { state: fromState });
                    return;
                }
            }

            // Slice 4a: News article share — route to the full-page news route
            if (type === 'news_article_share' || type === 'news_article_share_recipient' || sharePostType === 'news_article') {
                const aId = Number(d?.articleId ?? d?.article_id ?? d?.postId ?? d?.post_id ?? sharePostId ?? entityId ?? 0);
                if (Number.isFinite(aId) && aId > 0) {
                    navigate(`/news/article/${aId}`, {
                        state: {
                            ...fromState,
                            // Seed CommunityNewsDetailPanel with any metadata we already have
                            // so the page paints instantly while useNewsArticleDetail fetches.
                            article: {
                                id: aId,
                                title: d?.articleTitle || d?.article_title || '',
                                source_name: d?.articleSourceName || d?.article_source_name || '',
                                image_url: d?.articleImageUrl || d?.article_image_url || '',
                                url: d?.articleUrl || d?.article_url || '',
                            },
                        },
                    });
                    return;
                }
            }

            // Service share
            if (sharePostType === 'service') {
                if (Number.isFinite(sharePostId) && sharePostId > 0) {
                    navigate(`/services`, { state: { ...fromState, openServiceId: sharePostId } });
                    return;
                }
            }

            // Listing share recipient (fallback)
            if (type === 'listing_share_recipient') {
                const lId2 = Number(d?.listingId ?? d?.listing_id ?? sharePostId ?? 0);
                if (Number.isFinite(lId2) && lId2 > 0) {
                    navigate(`/marketplace/${lId2}`, { state: fromState });
                    return;
                }
            }

            // Marketplace / Music post share
            if (sharePostType === 'music_post' || type === 'music_post_share') {
                if (Number.isFinite(sharePostId) && sharePostId > 0) {
                    navigate(`/posts/${sharePostId}`, { state: fromState });
                    return;
                }
            }

            // User profile share — navigate to the shared profile
            if (type === 'profile_share' || (type === 'post_share' && String(d?.postType ?? d?.post_type ?? '').toLowerCase() === 'profile')) {
                const profHandle = d?.profileHandle || d?.profile_handle || '';
                const profId = Number(d?.profileId ?? d?.profile_id ?? sharePostId ?? 0);
                if (profHandle) {
                    navigate(`/${profHandle}`, { state: fromState });
                    return;
                }
                if (Number.isFinite(profId) && profId > 0) {
                    navigate(`/${profId}`, { state: fromState });
                    return;
                }
            }

            // Generic deep link fallback for any share type
            if (shareDeepLink) {
                try {
                    const url = new URL(shareDeepLink, window.location.origin);
                    navigate(url.pathname + url.search, { state: fromState });
                } catch {
                    navigate(shareDeepLink, { state: fromState });
                }
                return;
            }
        }

        // ── Account Approval ─────────────────────────────────────────
        if (type === 'business_approved') {
            const bizSlug = d?.businessSlug || d?.business_slug || '';
            if (bizSlug) {
                navigate(`/${bizSlug}`, { state: fromState });
            } else {
                navigate('/', { state: fromState });
            }
            return;
        }
        if (type === 'artist_approved') {
            const artHandle = d?.artistHandle || d?.artist_handle || '';
            if (artHandle) {
                navigate(`/${artHandle}`, { state: fromState });
            } else {
                navigate('/', { state: fromState });
            }
            return;
        }

        // ── Fallback ───────────────────────────────────────────────
        navigate('/community');
    };

    // ── Derived: deduplicated items ──
    const deduplicatedItems = (() => {
        const replyKeys = new Set();
        for (const n of items) {
            if (n?.type === 'comment_reply') {
                const actorId = n?.actor_id || n?.actor_user_id || '';
                const eId = n?.entity_id || '';
                if (actorId && eId) replyKeys.add(`${actorId}:${eId}`);
            }
        }
        return items.filter((n) => {
            if (n?.type !== 'post_comment') return true;
            const actorId = n?.actor_id || n?.actor_user_id || '';
            const eId = n?.entity_id || '';
            return !(actorId && eId && replyKeys.has(`${actorId}:${eId}`));
        });
    })();

    // ── Derived: count per category (for badge + visibility) ──
    const categoryCounts = (() => {
        const counts = { all: deduplicatedItems.length };
        for (const catMeta of CATEGORY_META) {
            if (catMeta.key === 'all') continue;
            counts[catMeta.key] = 0;
        }
        for (const n of deduplicatedItems) {
            const cats = getNotifCategories(n?.type);
            for (const c of cats) {
                if (counts[c] !== undefined) counts[c] += 1;
            }
        }
        return counts;
    })();

    // ── Derived: filtered items for active category ──
    const filteredItems = activeCategory === 'all'
        ? deduplicatedItems
        : deduplicatedItems.filter((n) => {
            const typeSet = CATEGORY_TYPES[activeCategory];
            return typeSet && typeSet.has(String(n?.type || ''));
        });

    // ── Clear handler: category-aware ──
    const handleClear = async () => {
        setHighlightIds(EMPTY_HIGHLIGHT_IDS);
        setError('');

        if (activeCategory === 'all') {
            // Clear everything via backend
            setLoading(true);
            try {
                const acctParams = getNotifAccountParams();
                await secureFetch('/api/notifications/clear', {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: notifFetchHeaders(),
                    body: JSON.stringify(acctParams),
                });
                setItems([]);
                setNextCursor(null);
            } catch {
                // ignore
            } finally {
                setLoading(false);
            }
        } else {
            // Clear only items in the active category locally + mark read on server
            const typeSet = CATEGORY_TYPES[activeCategory];
            if (!typeSet) return;
            const toRemove = [];
            const toKeep = [];
            for (const n of items) {
                if (typeSet.has(String(n?.type || ''))) {
                    toRemove.push(n);
                } else {
                    toKeep.push(n);
                }
            }
            setItems(toKeep);

            // Fire-and-forget: mark each removed notification as read
            for (const n of toRemove) {
                const nid = Number(n?.id);
                if (Number.isFinite(nid) && nid > 0) {
                    secureFetch(`/api/notifications/${nid}/read`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: notifFetchHeaders(),
                    }).catch(() => {});
                }
            }
        }
    };

    // ── Render a single notification item ──
    const renderNotifItem = (n, isLast) => {
        const actorName = getActorDisplayName(n);
        const verb = getVerb(n);
        const ts = formatTimeAgo(n.created_at);
        const preview = getPreview(n);
        const idNum = Number(n?.id);
        const isHighlighted = Number.isFinite(idNum) && highlightIds.includes(idNum);
        const actors = Array.isArray(n?.actors) ? n.actors : [];
        const isGrouped = actors.length > 1;
        const isFollower = String(n?.type || '') === 'new_follower';

        // Resolve follow-back state once for follower notifications
        let fbTargetId = 0;
        let didFollowBack = false;
        let wasAlreadyFollowing = false;
        if (isFollower) {
            const nd = parseData(n);
            fbTargetId = Number(nd?.followerAccountId || nd?.followerUserId || n?.actor_id || n?.actor_user_id || 0);
            didFollowBack = fbTargetId > 0 && followedBackIds.has(fbTargetId);
            wasAlreadyFollowing = fbTargetId > 0 && alreadyFollowingIds.has(fbTargetId);
        }

        return (
            <Button
                key={n.id}
                onClick={() => handleOpenNotification(n)}
                variant="text"
                sx={{
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    borderRadius: 0,
                    px: { xs: 2, sm: 1.5 },
                    py: { xs: 1.75, sm: 1.5 },
                    bgcolor: (theme) => {
                        const brass = theme.custom?.brand?.brass || '#A87822';
                        if (isHighlighted) return alpha(brass, 0.10);
                        if (n.is_read) return 'transparent';
                        return alpha(brass, 0.05);
                    },
                    borderBottom: isLast ? 'none' : '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                        bgcolor: (theme) => {
                            const brass = theme.custom?.brand?.brass || '#A87822';
                            if (isHighlighted) return alpha(brass, 0.16);
                            if (n.is_read) return alpha(theme.palette.text.primary, 0.04);
                            return alpha(brass, 0.10);
                        },
                    },
                }}
            >
                <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ width: '100%' }}>
                    {isGrouped ? (
                        <AvatarGroup
                            max={3}
                            sx={{
                                mt: 0.15,
                                flexShrink: 0,
                                '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    fontSize: 13,
                                    border: '2px solid',
                                    borderColor: 'background.paper',
                                },
                            }}
                        >
                            {actors.slice(0, 3).map((a) => {
                                const aSrc = a.avatar_url || '';
                                const aIsDefault = isDefaultAvatar(aSrc);
                                const aAccountType = String(a.account_type || '').toLowerCase();
                                // Grouped-actor payloads may not include profile_type yet;
                                // default to 'music' which matches the pre-existing fallback.
                                const aProfileType = String(a.profile_type || a.profileType || '').toLowerCase() === 'artist' ? 'artist' : 'music';
                                return (
                                    <Avatar
                                        key={a.id}
                                        src={aIsDefault ? undefined : aSrc}
                                        alt={`${a.first_name || a.handle || ''}`}
                                        sx={(t) => aIsDefault ? {
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            color: t.palette.primary.main,
                                        } : {}}
                                    >
                                        {aIsDefault && <DefaultAvatarIcon accountType={aAccountType} profileType={aProfileType} size={18} />}
                                    </Avatar>
                                );
                            })}
                        </AvatarGroup>
                    ) : (
                        <Avatar
                            src={isDefaultAvatar(getActorAvatarSrc(n)) ? undefined : getActorAvatarSrc(n)}
                            alt={actorName || 'User'}
                            sx={(t) => ({
                                width: 40,
                                height: 40,
                                border: '1px solid',
                                borderColor: 'divider',
                                mt: 0.15,
                                flexShrink: 0,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                            })}
                        >
                            <DefaultAvatarIcon accountType={getActorAccountType(n)} profileType={getActorProfileType(n)} size={22} />
                        </Avatar>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: n.is_read ? 700 : 900,
                                lineHeight: 1.25,
                                fontSize: 14,
                            }}
                        >
                            <Box component="span" sx={{ fontWeight: 900 }}>
                                {actorName}
                            </Box>{' '}
                            <Box component="span" sx={{ fontWeight: n.is_read ? 700 : 800 }}>
                                {verb}
                            </Box>
                        </Typography>

                        {preview ? (
                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 0.35,
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    lineHeight: 1.25,
                                }}
                                noWrap
                            >
                                &quot;{preview}&quot;
                            </Typography>
                        ) : null}

                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                            {ts}
                        </Typography>
                    </Box>

                    {/* Follow-back button pinned to the right */}
                    {isFollower && fbTargetId > 0 && !wasAlreadyFollowing ? (
                        <Box
                            onClick={(ev) => {
                                ev.stopPropagation();
                                ev.preventDefault();
                                if (!didFollowBack) handleFollowBack(ev, n);
                            }}
                            role="button"
                            tabIndex={0}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                alignSelf: 'center',
                                flexShrink: 0,
                                gap: 0.5,
                                ml: 1,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                                cursor: didFollowBack ? 'default' : 'pointer',
                                color: didFollowBack ? 'primary.main' : 'primary.contrastText',
                                bgcolor: didFollowBack ? (t) => alpha(t.palette.primary.main, 0.08) : 'primary.main',
                                border: '1px solid',
                                borderColor: didFollowBack ? (t) => alpha(t.palette.primary.main, 0.3) : 'primary.main',
                                transition: 'all 150ms ease',
                                '&:hover': didFollowBack ? {} : { bgcolor: 'primary.dark' },
                            }}
                        >
                            {didFollowBack
                                ? <HowToRegRoundedIcon sx={{ fontSize: 14 }} />
                                : <PersonAddRoundedIcon sx={{ fontSize: 14 }} />}
                            {didFollowBack ? 'Following' : 'Follow back'}
                        </Box>
                    ) : null}

                    {/* Switch-to-profile button for approval notifications */}
                    {(String(n?.type || '') === 'business_approved' || String(n?.type || '') === 'artist_approved') ? (() => {
                        const nd = parseData(n);
                        const isBusinessApproval = String(n?.type || '') === 'business_approved';
                        const acctName = isBusinessApproval
                            ? (nd?.businessName || nd?.business_name || 'Business')
                            : (nd?.artistName || nd?.artist_name || 'Artist');
                        const acctId = isBusinessApproval
                            ? String(nd?.businessId || nd?.business_id || '')
                            : `artist:${nd?.artistId || nd?.artist_id || ''}`;
                        const acctSlug = isBusinessApproval
                            ? (nd?.businessSlug || nd?.business_slug || '')
                            : (nd?.artistHandle || nd?.artist_handle || '');
                        const acctAvatar = isBusinessApproval
                            ? (nd?.businessAvatarUrl || nd?.business_avatar_url || '')
                            : (nd?.artistAvatarUrl || nd?.artist_avatar_url || '');
                        return (
                            <Box
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    ev.preventDefault();
                                    // Switch account using same mechanism as Header
                                    const acct = {
                                        id: acctId,
                                        type: isBusinessApproval ? 'business' : 'artist',
                                        name: acctName,
                                        avatar_url: acctAvatar || null,
                                        slug: acctSlug || null,
                                        artistId: isBusinessApproval ? null : (nd?.artistId || nd?.artist_id || null),
                                        businessId: isBusinessApproval ? (nd?.businessId || nd?.business_id || null) : null,
                                        role: 'owner',
                                    };
                                    try {
                                        localStorage.setItem('ll:activeAccount', JSON.stringify(acct));
                                    } catch { /* ignore */ }
                                    try {
                                        window.dispatchEvent(new CustomEvent('ll:account:changed', { detail: { account: acct } }));
                                    } catch { /* ignore */ }
                                    // Navigate to the profile page
                                    const dest = acctSlug ? `/${acctSlug}` : '/';
                                    window.location.assign(dest);
                                }}
                                role="button"
                                tabIndex={0}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    alignSelf: 'center',
                                    flexShrink: 0,
                                    gap: 0.5,
                                    ml: 1,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    color: 'primary.contrastText',
                                    bgcolor: 'primary.main',
                                    border: '1px solid',
                                    borderColor: 'primary.main',
                                    transition: 'all 150ms ease',
                                    '&:hover': { bgcolor: 'primary.dark' },
                                }}
                            >
                                <SwapHorizRoundedIcon sx={{ fontSize: 14 }} />
                                Switch to {isBusinessApproval ? 'Business' : (String(nd?.profileType || nd?.profile_type || '').toLowerCase() === 'artist' ? 'Artist' : 'Music')}
                            </Box>
                        );
                    })() : null}
                </Stack>
            </Button>
        );
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', px: { xs: 0, sm: 3 }, py: { xs: 0, sm: 3 }, minHeight: { xs: '100dvh', sm: 'auto' }, bgcolor: { xs: 'background.paper', sm: 'transparent' } }}>
            <Paper elevation={0} sx={{
                opacity: pageReady ? 1 : 0,
                transform: pageReady ? 'none' : 'translateY(6px)',
                transition: 'opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                minHeight: { xs: '100dvh', md: 520 },
                borderRadius: { xs: 0, sm: 5 },
                border: { xs: 'none', sm: '1px solid' },
                borderColor: { xs: 'transparent', sm: 'divider' },
                overflow: 'hidden',
                bgcolor: 'background.paper',
            }}>
                {/* ── Sticky header wrapper (header + chips) ── */}
                <Box
                    sx={{
                        position: { xs: 'sticky', sm: 'relative' },
                        top: 0,
                        zIndex: 10,
                        bgcolor: 'background.paper',
                        transform: { xs: showStickyHeader ? 'translateY(0)' : 'translateY(-100%)', sm: 'none' },
                        transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                        boxShadow: { xs: showStickyHeader ? '0 1px 4px rgba(0,0,0,0.06)' : 'none', sm: 'none' },
                    }}
                >
                    {/* ── Header ── */}
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2.5 } }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1.5}
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            justifyContent="space-between"
                        >
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <NotificationsNoneIcon />
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 900 }}>
                                        Notifications
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                        {isBusinessAccount
                                            ? `Notifications for ${activeAccount?.name || 'your business'}`
                                            : isArtistAccount
                                                ? `Notifications for ${activeAccount?.name || 'your artist profile'}`
                                                : 'Your recent activity across The Local Lantern.'}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Stack direction="row" spacing={0.5}>
                                <Button
                                    variant="text"
                                    startIcon={<SettingsOutlinedIcon sx={{ fontSize: '16px !important' }} />}
                                    onClick={() => navigate('/account?tab=notifications')}
                                    sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, fontSize: { xs: 12, sm: 14 }, px: { xs: 1, sm: 1.5 }, minWidth: 0 }}
                                >
                                    Settings
                                </Button>
                                <Button
                                    variant="text"
                                    startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />}
                                    onClick={handleRefresh}
                                    disabled={loading || loadingMore}
                                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 999, fontSize: { xs: 12, sm: 14 }, px: { xs: 1, sm: 1.5 }, minWidth: 0 }}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant="text"
                                    onClick={handleClear}
                                    disabled={loading || loadingMore || filteredItems.length === 0}
                                    sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, fontSize: { xs: 12, sm: 14 }, px: { xs: 1, sm: 1.5 }, minWidth: 0 }}
                                >
                                    {activeCategory === 'all' ? 'Clear all' : `Clear ${CATEGORY_META.find((c) => c.key === activeCategory)?.label || ''}`}
                                </Button>
                            </Stack>
                        </Stack>

                        {error ? (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        ) : null}
                    </Box>

                    <Divider />

                    {/* ── Category filter chips ── */}
                    {!loading && items.length > 0 ? (
                        <Box
                            sx={{
                                px: { xs: 1.5, sm: 2 },
                                py: 1.25,
                                display: 'flex',
                                gap: 0.75,
                                flexWrap: { xs: 'nowrap', sm: 'wrap' },
                                overflowX: { xs: 'auto', sm: 'visible' },
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' },
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            {CATEGORY_META.map((cat) => {
                                const count = categoryCounts[cat.key] || 0;
                                if (cat.key !== 'all' && count === 0) return null;
                                const isActive = activeCategory === cat.key;
                                const CatIcon = cat.icon;
                                const unreadCount = cat.key === 'all'
                                    ? deduplicatedItems.filter((n) => !n.is_read).length
                                    : deduplicatedItems.filter((n) => {
                                        const typeSet = CATEGORY_TYPES[cat.key];
                                        return typeSet && typeSet.has(String(n?.type || '')) && !n.is_read;
                                    }).length;

                                return (
                                    <Badge
                                        key={cat.key}
                                        badgeContent={unreadCount > 0 ? unreadCount : 0}
                                        color="secondary"
                                        variant="standard"
                                        invisible={unreadCount === 0}
                                        slotProps={{
                                            badge: {
                                                sx: {
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    minWidth: 16,
                                                    height: 16,
                                                    px: 0.4,
                                                },
                                            },
                                        }}
                                    >
                                        <Chip
                                            icon={<CatIcon sx={{ fontSize: 16 }} />}
                                            label={`${cat.label}${cat.key !== 'all' ? ` (${count})` : ''}`}
                                            size="small"
                                            onClick={() => setActiveCategory(cat.key)}
                                            sx={(theme) => {
                                                const brass = theme.custom?.brand?.brass || '#A87822';
                                                return {
                                                    fontWeight: isActive ? 800 : 700,
                                                    fontSize: 12.5,
                                                    borderRadius: 999,
                                                    border: 'none',
                                                    flexShrink: 0,
                                                    bgcolor: isActive
                                                        ? alpha(brass, 0.10)
                                                        : alpha(theme.palette.text.primary, 0.04),
                                                    color: isActive
                                                        ? theme.palette.text.primary
                                                        : theme.palette.text.secondary,
                                                    transition: 'all 150ms ease',
                                                    '&:hover': {
                                                        bgcolor: alpha(brass, isActive ? 0.16 : 0.08),
                                                    },
                                                    '& .MuiChip-icon': {
                                                        color: isActive ? brass : theme.palette.text.secondary,
                                                    },
                                                };
                                            }}
                                        />
                                    </Badge>
                                );
                            })}
                        </Box>
                    ) : null}
                </Box>
                {/* ── end sticky header wrapper ── */}

                {/* ── Notification list ── */}
                <Box sx={{ px: { xs: 0, sm: 2 }, py: { xs: 0, sm: 1.25 } }}>
                    {loading ? (
                        <Box sx={{ height: { xs: 320, md: 380 }, overflow: 'hidden' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={22} />
                            </Box>

                            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 1, pt: 1 }}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            display: 'flex',
                                            gap: 1.5,
                                            py: 1.25,
                                            alignItems: 'flex-start'
                                        }}
                                    >
                                        <Skeleton variant="circular" width={42} height={42} />
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Skeleton variant="text" height={20} width="72%" />
                                            <Skeleton variant="text" height={18} width="38%" />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : items.length === 0 ? (
                        <Box sx={{ px: { xs: 2, sm: 2 }, py: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 900 }}>
                                You're all caught up.
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, mt: 0.5 }}>
                                Check back later for new activity.
                            </Typography>
                        </Box>
                    ) : filteredItems.length === 0 ? (
                        <Box sx={{ px: { xs: 2, sm: 2 }, py: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 900 }}>
                                No {CATEGORY_META.find((c) => c.key === activeCategory)?.label?.toLowerCase() || ''} notifications.
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700, mt: 0.5 }}>
                                Switch to another category or check back later.
                            </Typography>
                        </Box>
                    ) : (
                        <Stack spacing={0}>
                            {filteredItems.map((n, idx) => renderNotifItem(n, idx === filteredItems.length - 1))}
                        </Stack>
                    )}

                    {hasMore && activeCategory === 'all' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 0.5 }}>
                            <Button
                                variant="outlined"
                                onClick={handleLoadMore}
                                disabled={loadingMore || loading}
                                sx={{ textTransform: 'none', fontWeight: 900, borderRadius: 999, minWidth: 160 }}
                            >
                                {loadingMore ? 'Loading...' : 'Load more'}
                            </Button>
                        </Box>
                    ) : null}
                </Box>
            </Paper>

            {/* ═══════════ Seller Reviews Popup (for seller_review_reply notifications) ═══════════ */}
            <SellerReviewsPopup
                open={sellerReviewsPopup.open}
                onClose={() => setSellerReviewsPopup({ open: false, sellerId: null, highlightReviewId: null })}
                sellerId={sellerReviewsPopup.sellerId}
                highlightReviewId={sellerReviewsPopup.highlightReviewId}
            />
        </Box>
    );
}
