// src/pages/community/groups/GroupPostCard.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Avatar,
    IconButton,
    Link,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SuccessSnackbar from '../../../components/SuccessSnackbar';
import SmartMenu from '../../../components/SmartMenu';
import { secureFetch } from '../../../utils/secureFetch';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import Divider from '@mui/material/Divider';

import defaultAvatar from '../../../assets/profile/default_avatar.png';
import ActionBar from '../../../components/ActionBar';
import PollDisplay from '../components/PollDisplay';
import { useActiveAccount } from '../../../components/AccountContext';
import { getCommunityCategory, COMMUNITY_CATEGORY_META } from '../utils/communityPostCategoryIcons';

// Read the active account directly from localStorage + events (no context dependency)
function useIsNonPersonalAccount() {
    const read = () => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            const t = String(parsed?.type || parsed?.account_type || parsed?.accountType || '').toLowerCase();
            return t === 'business' || t === 'artist';
        } catch { return false; }
    };
    const [value, setValue] = useState(read);
    useEffect(() => {
        const sync = () => setValue(read());
        window.addEventListener('ll:account:changed', sync);
        window.addEventListener('storage', sync);
        sync();
        return () => {
            window.removeEventListener('ll:account:changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);
    return value;
}

function timeAgoCompact(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}hr ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    const diffWk = Math.floor(diffDay / 7);
    if (diffWk < 5) return `${diffWk}wk ago`;
    const diffMo = Math.floor(diffDay / 30);
    if (diffMo < 12) return `${diffMo}mo ago`;
    const diffYr = Math.floor(diffDay / 365);
    return `${diffYr}yr ago`;
}

function getDisplayName(post) {
    // Prefer business/artist account name when the post was made under a non-personal account
    const acctType = String(post?.account_type || '').toLowerCase();
    if (acctType === 'business') {
        const bn = String(post?.business_name || post?.account_name || '').trim();
        if (bn) return bn;
    }
    if (acctType === 'artist') {
        const an = String(post?.artist_name || post?.account_name || '').trim();
        if (an) return an;
    }

    const first = String(post?.first_name || post?.firstName || '').trim();
    const last = String(post?.last_name || post?.lastName || '').trim();
    const full = `${first} ${last}`.trim();
    if (full) return full;

    const handle = String(post?.handle || '').trim();
    if (handle) return handle.replace(/^@/, '');

    return 'User';
}

function getHandle(post) {
    const acctType = String(post?.account_type || '').toLowerCase();
    if (acctType === 'business') {
        const bh = String(post?.business_slug || post?.account_handle || '').trim();
        if (bh) return `@${bh.replace(/^@/, '')}`;
    }
    if (acctType === 'artist') {
        const ah = String(post?.artist_handle || post?.account_handle || '').trim();
        if (ah) return `@${ah.replace(/^@/, '')}`;
    }
    const h = String(post?.handle || '').trim();
    return h ? `@${h.replace(/^@/, '')}` : '';
}

function normalizePhotoUrls(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((u) => String(u || '').trim()).filter(Boolean);

    if (typeof input === 'string') {
        const s = input.trim();
        if (!s) return [];

        if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
            try {
                const parsed = JSON.parse(s);
                if (Array.isArray(parsed)) return parsed.map((u) => String(u || '').trim()).filter(Boolean);
                if (parsed && typeof parsed === 'object') {
                    const maybe = parsed.urls || parsed.images || parsed.photos;
                    if (Array.isArray(maybe)) return maybe.map((u) => String(u || '').trim()).filter(Boolean);
                }
            } catch {
                // ignore
            }
        }

        if (s.includes(',')) return s.split(',').map((u) => String(u || '').trim()).filter(Boolean);
        return [s];
    }

    return [];
}

function getPhotoUrls(post) {
    const direct = normalizePhotoUrls(post?.photos);
    const images = normalizePhotoUrls(post?.images);
    const urls = normalizePhotoUrls(post?.image_urls || post?.imageUrls);
    const cover = normalizePhotoUrls(post?.image_url || post?.imageUrl);

    const merged = [...direct, ...images, ...urls, ...cover].filter(Boolean);

    const seen = new Set();
    return merged.filter((u) => {
        const key = String(u);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getAvatarSrc(post) {
    // Prefer business/artist avatar when the post was made under a non-personal account
    const acctType = String(post?.account_type || '').toLowerCase();
    if (acctType === 'business') {
        const ba = String(post?.business_avatar_url || post?.account_avatar_url || '').trim();
        if (ba) return ba;
    }
    if (acctType === 'artist') {
        const aa = String(post?.artist_avatar_url || post?.account_avatar_url || '').trim();
        if (aa) return aa;
    }
    const a = String(post?.profile_picture || post?.profilePicture || '').trim();
    if (a) return a;
    const b = String(post?.avatar_url || post?.avatarUrl || '').trim();
    if (b) return b;
    return '';
}

function isViewerOwnerOfPost(viewer, post) {
    const v = viewer?.user || viewer || null;
    if (!v || !post) return false;

    const vid = v?.id != null ? String(v.id) : '';
    const pid = post?.user_id ?? post?.author_id ?? post?.userId ?? post?.owner_id ?? null;
    const aid = pid != null ? String(pid) : '';

    if (vid && aid && vid === aid) return true;

    const vHandle = String(v?.handle || '').trim().toLowerCase().replace(/^@/, '');
    const pHandle = String(post?.handle || '').trim().toLowerCase().replace(/^@/, '');
    if (vHandle && pHandle && vHandle === pHandle) return true;

    const vPublic = v?.public_id != null ? String(v.public_id) : '';
    const pPublic = post?.public_id != null ? String(post.public_id) : '';
    if (vPublic && pPublic && vPublic === pPublic) return true;

    return false;
}

/* ──────────────────────────────────────────────────────────────────────
   Category badge helpers — mirrors PostList.jsx logic & styling
   ────────────────────────────────────────────────────────────────────── */
const BADGE = Object.fromEntries(
    Object.entries(COMMUNITY_CATEGORY_META).map(([key, meta]) => [key, { label: meta.label, Icon: meta.Icon }])
);

const normalizeCategory = (value) => {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'community-chat' || v === 'community_chat' || v === 'community chat') return 'discussion';
    if (v === 'polls') return 'poll';
    return v;
};

const deriveSplitCategory = (post) => {
    let cat = normalizeCategory(post?.category);
    if (cat === 'recommendations-tips' || cat === 'tips' || cat === 'tip') return 'recommendations';
    if (cat === 'volunteer-requests' || cat === 'volunteer-help-requests') {
        const kind = String(post?.request_kind || post?.requestKind || '').toLowerCase();
        if (kind === 'volunteer' || kind === 'offer' || kind === 'offering') return 'volunteers';
        if (kind === 'help' || kind === 'request' || kind === 'help-request' || kind === 'help_request') return 'help-requests';
        return 'help-requests';
    }
    return cat;
};

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
    const rawCat = String(post.category || '').toLowerCase();
    if (rawCat === 'business_post') return { label: resolveBizCategoryLabel(post), Icon: StorefrontOutlinedIcon };
    if (rawCat === 'artist_post') return { label: 'Artist', Icon: MusicNoteRoundedIcon };
    if (post.category === 'public-safety-alerts') return getCommunityCategory('public-safety-alerts');
    if (post.lost_or_found) {
        const meta = getCommunityCategory('lost-and-found');
        return { ...meta, label: post.lost_or_found === 'found' ? 'Found' : 'Lost' };
    }
    const cat = deriveSplitCategory(post);
    return BADGE[cat] || BADGE.community || null;
};

/* ──────────────────────────────────────────────────────────────────────
   MobilePhotoGrid — Facebook-style dynamic grid, matching ArtistPostCard
   Mobile-only: used when isMobile is true
   ────────────────────────────────────────────────────────────────────── */
function GroupMobilePhotoGrid({ mediaUrls }) {
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
            bgcolor: (t) => alpha(t.palette.common.black, 0.55),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
        }}>
            <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography>
        </Box>
    );

    if (count === 1) {
        return (
            <Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}>
                <Box component="img" src={mediaUrls[0]} alt=""
                     sx={{ width: '100%', maxHeight: 600, objectFit: 'contain', display: 'block' }}
                />
            </Box>
        );
    }

    if (count === 2) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280, md: 320 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0)}
                {imgCell(mediaUrls[1], 1)}
            </Box>
        );
    }

    if (count === 3) {
        return (
            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340, md: 400 }, mt: 1.5 }}>
                {imgCell(mediaUrls[0], 0, { gridRow: '1 / 3' })}
                {imgCell(mediaUrls[1], 1)}
                {imgCell(mediaUrls[2], 2)}
            </Box>
        );
    }

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

/**
 * GroupPostCard
 *
 * Used in the Group Page Posts feed
 *
 * Props:
 * - post: post object
 * - onClick: open detail (right panel) or post page
 * - onUserClick: open user card popover (expects signature onUserClick(event, post))
 * - viewer: logged-in user (from /users/profile)
 * - groupId: current group id (optional; included in delete/edit event detail)
 * - selected: whether this card is selected
 * - hovered: whether this card is hovered (from parent)
 * - onHover: callback to set hover state
 * - canPin: whether viewer can pin/unpin posts (owner/admin)
 * - onPin: callback when pin is requested (postId)
 * - onUnpin: callback when unpin is requested (postId)
 */
export default function GroupPostCard({
                                          post,
                                          onClick,
                                          onUserClick,
                                          viewer = null,
                                          groupId = null,
                                          selected = false,
                                          hovered = false,
                                          onHover,
                                          canPin = false,
                                          onPin,
                                          onUnpin,
                                          canAdminDelete = false,
                                          onAdminDelete,
                                          onReport,
                                          shareGroup = null,
                                          isMember = false,
                                      }) {
    const createdAt = post?.created_at || post?.createdAt || post?.timestamp || post?.posted_at || '';
    const when = timeAgoCompact(createdAt);

    // ── Edited indicator (matches PostList pattern) ──
    const postId = post?.id ?? post?.post_id ?? null;
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
        const idNum = Number(postId);
        return idNum ? `ll.communityPost.edited.${idNum}` : '';
    }, [postId]);

    const [persistedEdited, setPersistedEdited] = useState(() => {
        if (!editedStorageKey) return false;
        try {
            return window.localStorage.getItem(editedStorageKey) === '1';
        } catch {
            return false;
        }
    });

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

    const showEdited = isEditedNow || persistedEdited;

    const name = getDisplayName(post);
    const handle = getHandle(post);
    const avatarSrc = getAvatarSrc(post);

    const title = String(post?.title || '').trim();
    const body = String(post?.description || post?.content || post?.body || '').trim();

    // Truncate body for preview (matching PostList pattern)
    const BODY_WORD_LIMIT = 28;
    const BODY_CHAR_LIMIT = 220;
    const bodyWords = body.split(/\s+/).filter(Boolean);
    const longByWords = bodyWords.length > BODY_WORD_LIMIT;
    const longByChars = body.length > BODY_CHAR_LIMIT;
    const bodyIsLong = longByWords || longByChars;
    const bodyPreview = !bodyIsLong
        ? body
        : longByWords
            ? `${bodyWords.slice(0, BODY_WORD_LIMIT).join(' ')}...`
            : `${body.slice(0, BODY_CHAR_LIMIT).trimEnd()}...`;

    const postCategory = String(post?.category || '').toLowerCase();
    const hasPollData = Boolean(post?.poll || post?.pollData || post?.poll_data || (Array.isArray(post?.pollOptions) && post.pollOptions.length > 0) || (Array.isArray(post?.poll_options) && post.poll_options.length > 0));
    const isPollPost = postCategory === 'poll' || postCategory === 'polls' || hasPollData;

    // Category badge — same logic & style as PostList.jsx
    const badgeMeta = buildBadgeFor(post);
    const categoryChip = (() => {
        if (!badgeMeta) return null;
        const BadgeIcon = badgeMeta.Icon;
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
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                    fontWeight: 800,
                    fontSize: 11,
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.25),
                    '& .MuiChip-icon': { color: t.palette.primary.main, ml: 0.5 },
                    '& .MuiChip-label': { px: 0.9, lineHeight: 1 },
                })}
            />
        );
    })();
    const pollData = post?.poll || post?.pollData || post?.poll_data || (() => {
        const opts = post?.pollOptions || post?.poll_options;
        if (!opts || !Array.isArray(opts) || opts.length === 0) return null;
        return {
            options: opts,
            totalVotes: post?.totalVotes ?? post?.total_votes ?? 0,
            viewerVoteOptionId: post?.viewerVoteOptionId ?? post?.viewer_vote_option_id ?? null,
            pollExpiresAt: post?.pollExpiresAt ?? post?.poll_expires_at ?? null,
            expired: Boolean(post?.poll_expired ?? post?.pollExpired ?? false),
        };
    })();

    const photoUrls = useMemo(() => getPhotoUrls(post), [post]);
    const hasPhoto = photoUrls.length > 0;
    const thumb = hasPhoto ? photoUrls[0] : '';

    const likes = Number(post?.likesCount ?? post?.likes_count ?? post?.like_count ?? post?.likes ?? 0);
    const viewerLiked = Boolean(post?.viewerLiked ?? post?.viewer_liked ?? post?.liked ?? post?.is_liked ?? false);
    const commentsCount = Number(post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0);
    const reposts = Number(post?.repostsCount ?? post?.reposts_count ?? post?.repost_count ?? post?.reposts ?? 0);
    const viewerReposted = Boolean(post?.viewerReposted ?? post?.viewer_reposted ?? post?.reposted ?? post?.is_reposted ?? false);

    const isOwner = isViewerOwnerOfPost(viewer, post);

    const isNonPersonalAccount = useIsNonPersonalAccount();
    const { activeBusinessId: gpActiveBusinessId, activeArtistId: gpActiveArtistId } = useActiveAccount();
    // On non-personal accounts, disable edit/delete even if technically the owner
    const canEditDelete = isOwner && !isNonPersonalAccount;

    const isPinned = Boolean(Number(post?.is_pinned ?? post?.isPinned ?? 0));

    const [isHovered, setIsHovered] = useState(false);
    const activeHover = hovered || isHovered;

    const [ownerMenuEl, setOwnerMenuEl] = useState(null);
    const ownerMenuOpen = Boolean(ownerMenuEl);

    const [pinning, setPinning] = useState(false);
    const [copyToast, setCopyToast] = useState(false);

    // Hide/block state + toast
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    const gpTheme = useTheme();
    const isMobile = useMediaQuery(gpTheme.breakpoints.down('md'));

    const openOwnerMenu = (e) => {
        e.stopPropagation();
        setOwnerMenuEl(e.currentTarget);
    };

    const closeOwnerMenu = (e) => {
        if (e) e.stopPropagation();
        setOwnerMenuEl(null);
    };

    // ── Hide posts / Block user handlers ──
    const handleHideUser = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const uid = Number(post?.user_id || post?.author_id || post?.userId || post?.owner_id || 0);
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
    }, [post?.user_id, post?.author_id, post?.userId, post?.owner_id, post?.first_name, post?.firstName, post?.handle, hideBusy, blockBusy]);

    const handleBlockUser = useCallback(async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const uid = Number(post?.user_id || post?.author_id || post?.userId || post?.owner_id || 0);
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
    }, [post?.user_id, post?.author_id, post?.userId, post?.owner_id, post?.first_name, post?.firstName, post?.handle, hideBusy, blockBusy]);

    const handlePinToggle = async (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        setPinning(true);
        try {
            if (isPinned) {
                await onUnpin?.(post?.id);
            } else {
                await onPin?.(post?.id);
            }
        } catch (err) {
            // Handle error silently
        } finally {
            setPinning(false);
        }
    };

    const fire = (eventName, detail) => {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch {
            // ignore
        }
    };

    const requestEdit = (e) => {
        e.stopPropagation();
        const postId = post?.id ?? post?.post_id ?? null;
        if (!postId) return;
        fire('ll:communityPost:requestEdit', { postId, post, groupId: groupId ?? null });
    };

    const requestDelete = (e) => {
        e.stopPropagation();
        const postId = post?.id ?? post?.post_id ?? null;
        if (!postId) return;
        fire('ll:communityPost:requestDelete', { postId, post, groupId: groupId ?? null });
    };

    const handleUserClick = (e) => {
        if (!onUserClick) return;
        e.stopPropagation();
        // Construct an author object with account fields so the parent's UserCardPopover
        // can correctly identify business/artist accounts
        const author = {
            ...post,
            id: post?.user_id ?? post?.author_id ?? post?.userId ?? post?.id,
            first_name: post?.first_name || post?.firstName,
            last_name: post?.last_name || post?.lastName,
            handle: post?.handle,
            avatar_url: post?.avatar_url || post?.profile_picture,
            // Ensure account fields are present
            ...(post?.account_type ? { account_type: post.account_type } : {}),
            ...(post?.business_id ? { business_id: post.business_id } : {}),
            ...(post?.business_name ? { business_name: post.business_name } : {}),
            ...(post?.business_slug ? { business_slug: post.business_slug } : {}),
            ...(post?.business_avatar_url ? { business_avatar_url: post.business_avatar_url } : {}),
            ...(post?.artist_id ? { artist_id: post.artist_id } : {}),
            ...(post?.artist_name ? { artist_name: post.artist_name } : {}),
            ...(post?.artist_handle ? { artist_handle: post.artist_handle } : {}),
            ...(post?.artist_avatar_url ? { artist_avatar_url: post.artist_avatar_url } : {}),
            ...(post?.account_name ? { account_name: post.account_name } : {}),
            ...(post?.account_handle ? { account_handle: post.account_handle } : {}),
            ...(post?.account_avatar_url ? { account_avatar_url: post.account_avatar_url } : {}),
        };
        onUserClick(e, author);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHover?.(post?.id);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHover?.(null);
    };

    return (
        <Card
            data-post-id={post?.id}
            data-selected={selected ? 'true' : 'false'}
            role={onClick ? 'button' : undefined}
            onClick={onClick}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === 'Enter' || e.key === ' ') onClick();
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            elevation={isMobile ? 0 : undefined}
            sx={(t) => ({
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minHeight: isMobile ? 'auto' : 250,
                height: 'auto',
                position: 'relative',
                isolation: isMobile ? 'auto' : 'isolate',
                borderRadius: isMobile ? '0 !important' : '16px',
                border: isMobile ? '0 !important' : '1px solid',
                borderColor: isMobile
                    ? 'transparent'
                    : selected ? t.palette.secondary.main : alpha(t.palette.text.primary, 0.08),
                bgcolor: isMobile ? t.palette.background.paper : t.palette.background.paper,
                ...(isMobile ? { boxShadow: 'none !important' } : {}),
                overflow: isMobile ? 'visible' : 'hidden',
                boxShadow: isMobile
                    ? 'none'
                    : selected
                        ? '0 8px 32px rgba(0,0,0,0.12)'
                        : (activeHover ? '0 6px 20px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)'),
                transition: isMobile ? 'none' : 'all 180ms ease',
                transform: 'translateY(0)',
                cursor: onClick ? 'pointer' : 'default',
                outline: 'none',
                '&:focus-visible': {
                    boxShadow: `0 0 0 4px ${alpha(t.palette.secondary.main, 0.18)}`,
                },
            })}
        >
            <Box sx={{ p: isMobile ? 2 : 1.5, pb: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', gap: 1.25, width: '100%', flex: 1, minHeight: 0 }}>
                    {/* Avatar + user header */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.1,
                            alignItems: 'flex-start',
                            borderRadius: 2,
                            '&:hover .ll-user-name': { textDecoration: onUserClick ? 'underline' : 'none' },
                        }}
                    >
                        <Avatar
                            src={avatarSrc || undefined}
                            alt={name}
                            onClick={handleUserClick}
                            sx={(t) => ({
                                width: 48,
                                height: 48,
                                flexShrink: 0,
                                cursor: onUserClick ? 'pointer' : 'default',
                                border: '2px solid',
                                borderColor: alpha(t.palette.text.primary, 0.06),
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                transition: 'transform 150ms ease, box-shadow 150ms ease',
                                '&:hover': {
                                    transform: onUserClick ? 'scale(1.04)' : 'none',
                                    boxShadow: onUserClick ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
                                },
                            })}
                        >
                            {!avatarSrc ? <PersonRoundedIcon sx={{ fontSize: 28 }} /> : null}
                        </Avatar>
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    className="ll-user-name"
                                    variant="subtitle1"
                                    sx={{ fontWeight: 750, lineHeight: 1.2, cursor: onUserClick ? 'pointer' : 'default', color: 'text.primary' }}
                                    onClick={onUserClick ? handleUserClick : undefined}
                                    noWrap
                                >
                                    {name}
                                </Typography>

                                {handle ? (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ lineHeight: 1.2, cursor: onUserClick ? 'pointer' : 'default' }}
                                        onClick={onUserClick ? handleUserClick : undefined}
                                        noWrap
                                    >
                                        {handle}
                                    </Typography>
                                ) : null}

                                {/* Timestamp + edited indicator */}
                                {(when || showEdited) ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                                        {when ? (
                                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }} noWrap>
                                                {when}
                                            </Typography>
                                        ) : null}
                                        {showEdited && (
                                            <>
                                                {when && <Typography variant="caption" color="text.disabled">•</Typography>}
                                                <Typography
                                                    variant="caption"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fire('ll:communityPost:requestHistory', { postId: post?.id ?? post?.post_id, post });
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
                                ) : null}
                            </Box>

                            {/* Right: category chip + 3-dot menu */}
                            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.75 }} onClick={(e) => e.stopPropagation()}>
                                {categoryChip}
                                <IconButton
                                    size="small"
                                    aria-label="Post options"
                                    onClick={openOwnerMenu}
                                    disabled={pinning}
                                    sx={(t) => ({
                                        width: 32,
                                        height: 32,
                                        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                                        borderRadius: 999,
                                        color: 'text.secondary',
                                        '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                                    })}
                                >
                                    {pinning ? <CircularProgress size={16} /> : <MoreVertIcon fontSize="small" />}
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Preview body row */}
                        {(hasPhoto || title || body) ? (
                            <Box sx={{ mt: 0.85, display: 'flex', gap: (hasPhoto && !isMobile) ? 2 : 0, alignItems: 'flex-start' }}>
                                {/* Desktop only: side thumbnail */}
                                {hasPhoto && !isMobile ? (
                                    <Box sx={{ flexShrink: 0 }}>
                                        <Box
                                            component="img"
                                            alt=""
                                            src={thumb}
                                            loading="lazy"
                                            sx={(t) => ({
                                                width: 112,
                                                height: 112,
                                                objectFit: 'cover',
                                                borderRadius: '14px',
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.text.primary, 0.08),
                                                boxShadow: '0 4px 14px rgba(0,0,0,0.10)',
                                                bgcolor: t.palette.grey[100],
                                                display: 'block',
                                            })}
                                        />
                                        {photoUrls.length > 1 ? (
                                            <Box
                                                sx={(t) => ({
                                                    mt: 0.65,
                                                    px: 1.1,
                                                    py: 0.25,
                                                    borderRadius: 999,
                                                    border: '1px solid',
                                                    borderColor: alpha(t.palette.text.primary, 0.10),
                                                    bgcolor: alpha(t.palette.text.primary, 0.03),
                                                    fontSize: '0.72rem',
                                                    fontWeight: 900,
                                                    color: 'text.secondary',
                                                    lineHeight: 1.2,
                                                    whiteSpace: 'nowrap',
                                                    userSelect: 'none',
                                                    textAlign: 'center',
                                                })}
                                            >
                                                +{photoUrls.length - 1} more {photoUrls.length - 1 === 1 ? 'photo' : 'photos'}
                                            </Box>
                                        ) : null}
                                    </Box>
                                ) : null}

                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    {title ? (
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mt: 0.25,
                                                fontSize: '1.05rem',
                                                fontWeight: 800,
                                                letterSpacing: '-0.01em',
                                                lineHeight: 1.2,
                                                wordBreak: 'break-word',
                                                overflowWrap: 'anywhere',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                    ) : null}

                                    {body ? (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mt: title ? 0.6 : 0,
                                                display: '-webkit-box',
                                                WebkitLineClamp: (hasPhoto && !isMobile) ? 2 : 4,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: 1.55,
                                                wordBreak: 'break-word',
                                                overflowWrap: 'anywhere',
                                            }}
                                        >
                                            {bodyPreview}
                                            {bodyIsLong && (
                                                <>
                                                    {' '}<Link component="span" underline="hover" sx={{ color: 'primary.main', cursor: 'pointer' }}>more</Link>
                                                </>
                                            )}
                                        </Typography>
                                    ) : null}

                                    {/* Poll preview (card mode) */}
                                    {isPollPost && pollData && (
                                        <Box sx={{ mt: 0.75 }} onClick={(e) => e.stopPropagation()}>
                                            <PollDisplay
                                                poll={pollData}
                                                postId={post?.id ?? post?.post_id}
                                                variant="card"
                                                onCardClick={() => onClick?.()}
                                                post={post}
                                                groupId={groupId}
                                                isNonPersonal={isNonPersonalAccount}
                                                activeBusinessId={gpActiveBusinessId}
                                                activeArtistId={gpActiveArtistId}
                                                groupMembershipGated={!isMember && !isNonPersonalAccount}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ) : null}

                        {/* Mobile: dynamic photo grid (matches ArtistPostCard) */}
                        {isMobile && hasPhoto && (
                            <GroupMobilePhotoGrid
                                mediaUrls={photoUrls}
                            />
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Owner menu (shared for both pinned and non-pinned) */}
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
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        minWidth: 200,
                        py: 0.5,
                    },
                }}
            >
                {/* Copy Link — always shown */}
                <MenuItem
                    onClick={(e) => {
                        closeOwnerMenu(e);
                        const postId = post?.id ?? post?.post_id;
                        if (postId) {
                            const url = `${window.location.origin}/posts/${postId}`;
                            navigator.clipboard.writeText(url).then(() => setCopyToast(true)).catch(() => {});
                        }
                    }}
                    sx={{ py: 1 }}
                >
                    <ListItemIcon>
                        <LinkIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>

                {/* Pin/Unpin option - only for admins/owners */}
                {canPin && (
                    <MenuItem
                        onClick={handlePinToggle}
                        sx={{ py: 1 }}
                    >
                        <ListItemIcon>
                            {isPinned ? (
                                <PushPinOutlinedIcon fontSize="small" />
                            ) : (
                                <PushPinIcon fontSize="small" />
                            )}
                        </ListItemIcon>
                        <ListItemText primary={isPinned ? 'Unpin post' : 'Pin post'} />
                    </MenuItem>
                )}

                {(canEditDelete || canPin || (!isOwner && viewer)) && <Divider sx={{ my: 0.5 }} />}

                {canEditDelete && (
                    <MenuItem
                        onClick={(e) => {
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

                {canEditDelete && (
                    <MenuItem
                        onClick={(e) => {
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

                {/* Admin delete — for admin/owner on OTHER people's posts */}
                {canAdminDelete && !isOwner && (
                    <MenuItem
                        onClick={(e) => {
                            closeOwnerMenu(e);
                            const postId = post?.id ?? post?.post_id;
                            if (postId && typeof onAdminDelete === 'function') onAdminDelete(postId);
                        }}
                        sx={{ py: 1, color: 'error.main' }}
                    >
                        <ListItemIcon sx={{ color: 'error.main' }}>
                            <DeleteRoundedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Remove post" />
                    </MenuItem>
                )}

                {/* Report — for non-owners */}
                {!isOwner && viewer && (
                    <MenuItem
                        onClick={(e) => {
                            closeOwnerMenu(e);
                            const postId = post?.id ?? post?.post_id;
                            if (postId && typeof onReport === 'function') onReport(postId, post);
                        }}
                        sx={{ py: 1 }}
                    >
                        <ListItemIcon>
                            <FlagOutlinedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Report post" />
                    </MenuItem>
                )}

                {/* Hide posts / Block user — for non-owners */}
                {!isOwner && viewer && (
                    <MenuItem onClick={handleHideUser} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                        <ListItemIcon>
                            <VisibilityOffRoundedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Hide posts" />
                    </MenuItem>
                )}
                {!isOwner && viewer && (
                    <MenuItem onClick={handleBlockUser} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                        <ListItemIcon sx={{ color: 'error.main' }}>
                            <BlockRoundedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Block user" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyToast}
                message="Link copied!"
                onClose={() => setCopyToast(false)}
                autoHideDuration={2000}
            />

            {/* Hide/Block confirmation */}
            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast('')}
                message={hideBlockToast}
            />

            {/* Action bar (no Boost for group context) */}
            <Box
                sx={(t) => ({
                    mt: 'auto',
                    pt: 1,
                    px: isMobile ? 2 : 1.5,
                    pb: isMobile ? 0.5 : 1.5,
                    borderTop: isMobile ? 'none' : '1px solid',
                    borderTopColor: isMobile ? 'transparent' : alpha(t.palette.text.primary, 0.08),
                })}
                onClick={(e) => e.stopPropagation()}
            >
                <ActionBar
                    key={`ab-${post?.id || 0}-${gpActiveBusinessId || 0}-${gpActiveArtistId || 0}`}
                    postId={post?.id}
                    post={post}
                    initialLikes={Number.isFinite(likes) ? likes : 0}
                    initiallyLiked={viewerLiked}
                    commentsCount={Number.isFinite(commentsCount) ? commentsCount : 0}
                    initialReposts={Number.isFinite(reposts) ? reposts : 0}
                    initiallyReposted={viewerReposted}
                    showBoost={false}
                    useShareDialog
                    onComment={() => {
                        onClick?.();
                        // Tell PostDetailModal to focus the comment input
                        try {
                            window.dispatchEvent(new CustomEvent('ll:community:focusComment', {
                                detail: { postId: post?.id },
                            }));
                        } catch {
                            // ignore
                        }
                    }}
                />
            </Box>
        </Card>
    );
}
