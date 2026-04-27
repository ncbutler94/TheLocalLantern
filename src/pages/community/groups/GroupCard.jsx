import { secureFetch } from '../../../utils/secureFetch';
// src/pages/community/GroupPostCard.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Avatar,
    IconButton,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SuccessSnackbar from '../../../components/SuccessSnackbar';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

import ActionBar, { ReportDialog } from '../../../components/ActionBar';
import SmartMenu from '../../../components/SmartMenu';
import { useActiveAccount } from '../../../components/AccountContext';
import SharePostDialog from '../SharePostDialog';

/* ── Helpers (pure, defined outside component) ────────────── */

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

    const opts = {
        month: 'short',
        day: 'numeric',
        year: now.getFullYear() === d.getFullYear() ? undefined : 'numeric',
    };
    // @ts-ignore
    const dateStr = d.toLocaleDateString(undefined, opts).replace(/,\s*$/, '');
    const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    return `${dateStr} · ${timeStr}`;
}

function getDisplayName(post) {
    const first = String(post?.first_name || post?.firstName || '').trim();
    const last = String(post?.last_name || post?.lastName || '').trim();
    const full = `${first} ${last}`.trim();
    if (full) return full;

    const handle = String(post?.handle || '').trim();
    if (handle) return handle.replace(/^@/, '');

    return 'User';
}

function getHandle(post) {
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

/**
 * Resolve avatar URL from a post object.
 * Returns the raw string (may be empty or a default-avatar path).
 */
function getRawAvatarSrc(post) {
    const a = String(post?.profile_picture || post?.profilePicture || '').trim();
    if (a) return a;
    const b = String(post?.avatar_url || post?.avatarUrl || '').trim();
    if (b) return b;
    return '';
}

/**
 * Matches UserCardPopover logic:
 * Returns true only when we have a real, non-default avatar URL.
 */
function checkHasValidAvatar(src) {
    if (!src) return false;
    if (
        src.includes('default_avatar') ||
        src.includes('default_business') ||
        src.includes('default_logo')
    ) {
        return false;
    }
    return true;
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

/* ── Static style objects (defined OUTSIDE component to prevent re-creation) ── */

const CARD_MIN_HEIGHT = 380;

const menuAnchorOrigin = { vertical: 'bottom', horizontal: 'right' };
const menuTransformOrigin = { vertical: 'top', horizontal: 'right' };

const menuPaperProps = {
    sx: {
        mt: 0.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (t) => t.custom.shadows.lg,
        minWidth: 200,
        py: 0.5,
    },
};

const headerBoxSx = {
    px: 2,
    pt: 2,
    pb: 0.75,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
};

const rightMenuBoxSx = {
    flexShrink: 0,
    mt: -0.75,
    display: 'flex',
    alignItems: 'center',
    gap: 0.75,
};

const editMenuItemSx = { py: 1 };
const deleteMenuItemSx = { py: 1, color: 'error.main' };

const actionBarOuterSx = { flex: 1, minWidth: 0 };

const avatarImgProps = { referrerPolicy: 'no-referrer' };

/**
 * GroupPostCard
 *
 * Used in the Community > Groups > Group Posts tab (right panel)
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
                                          shareGroup = null,
                                          flat = false,
                                      }) {
    const createdAt = post?.created_at || post?.createdAt || post?.timestamp || post?.posted_at || '';
    const when = timeAgoCompact(createdAt);

    const name = getDisplayName(post);
    const handle = getHandle(post);

    /* ── Avatar: matches UserCardPopover pattern ── */
    const rawAvatarSrc = getRawAvatarSrc(post);
    const hasValidAvatar = checkHasValidAvatar(rawAvatarSrc);
    const [avatarError, setAvatarError] = useState(false);
    const showAvatarImg = hasValidAvatar && !avatarError;

    const title = String(post?.title || '').trim();
    const body = String(post?.description || post?.content || post?.body || '').trim();

    const photoUrls = useMemo(() => getPhotoUrls(post), [post]);
    const hasPhoto = photoUrls.length > 0;
    const thumb = hasPhoto ? photoUrls[0] : '';

    const likes = Number(post?.likesCount ?? post?.likes_count ?? post?.like_count ?? post?.likes ?? 0);
    const viewerLiked = Boolean(post?.viewerLiked ?? post?.viewer_liked ?? post?.liked ?? post?.is_liked ?? false);
    const commentsCount = Number(post?.commentsCount ?? post?.comments_count ?? post?.comment_count ?? post?.comments ?? 0);
    const reposts = Number(post?.repostsCount ?? post?.reposts_count ?? post?.repost_count ?? post?.reposts ?? 0);
    const viewerReposted = Boolean(post?.viewerReposted ?? post?.viewer_reposted ?? post?.reposted ?? post?.is_reposted ?? false);

    const isOwner = isViewerOwnerOfPost(viewer, post);
    const { activeBusinessId: gcActiveBusinessId, activeArtistId: gcActiveArtistId } = useActiveAccount();

    const [isHovered, setIsHovered] = useState(false);
    const activeHover = hovered || isHovered;

    const [ownerMenuEl, setOwnerMenuEl] = useState(null);
    const ownerMenuOpen = Boolean(ownerMenuEl);

    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [copyToast, setCopyToast] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // Hide / Block state + auto-dismiss
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState('');
    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(''), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    const openOwnerMenu = (e) => {
        e.stopPropagation();
        setOwnerMenuEl(e.currentTarget);
    };

    const closeOwnerMenu = (e) => {
        if (e) e.stopPropagation();
        setOwnerMenuEl(null);
    };

    const fire = (eventName, detail) => {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch {
            // ignore
        }
    };

    const handleCopyLink = (e) => {
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        const postId = post?.id ?? post?.post_id ?? '';
        const postUrl = `${window.location.origin}/posts/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            setCopyToast(true);
        }).catch(() => {
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
        if (e) e.stopPropagation();
        closeOwnerMenu(e);
        setReportOpen(true);
    };

    // ── Hide posts / Block user handlers ──
    // Target the post's author (personal user_id). Backend enforces that
    // you can't target yourself.
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

    const submitReport = async ({ reason, details }) => {
        const postId = post?.id ?? post?.post_id ?? '';
        if (!postId) return;
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
                if (res.ok) return;
            } catch {
                // try next
            }
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
        onUserClick(e, post);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHover?.(post?.id);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHover?.(null);
    };

    const stopProp = (e) => e.stopPropagation();

    const handleAvatarError = () => setAvatarError(true);

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
            sx={(t) => {
                const m = t.custom.motion;
                const sh = t.custom.shadows;
                return {
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: flat ? 'auto' : { xs: 'auto', sm: CARD_MIN_HEIGHT },
                    minHeight: flat ? 'auto' : { xs: 0, sm: CARD_MIN_HEIGHT },
                    position: 'relative',
                    isolation: flat ? 'auto' : 'isolate',
                    borderRadius: flat ? '0 !important' : `${t.custom.postCard.borderRadius}px`,
                    border: flat ? 'none' : '1px solid',
                    borderColor: flat
                        ? 'transparent'
                        : selected
                            ? t.palette.secondary.main
                            : alpha(t.palette.text.primary, 0.08),
                    bgcolor: flat ? t.palette.background.paper : t.palette.background.paper,
                    ...(flat ? { boxShadow: 'none !important' } : {}),
                    overflow: flat ? 'visible' : 'hidden',
                    // Mobile flat: bottom divider between cards
                    ...(flat ? {
                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                        '&:last-child': { borderBottom: 'none' },
                    } : {}),
                    boxShadow: flat
                        ? 'none'
                        : selected
                            ? sh.md
                            : activeHover
                                ? sh.sm
                                : sh.xs,
                    transition: flat ? 'none' : `box-shadow ${m.slow}ms ${m.ease}, border-color ${m.slow}ms ${m.ease}, transform ${m.slow}ms ${m.ease}`,
                    transform: 'translateY(0)',
                    cursor: onClick ? 'pointer' : 'default',
                    outline: 'none',
                    // Mobile: active press feedback
                    '@media (hover: none)': {
                        '&:active': (onClick && !flat) ? {
                            transform: 'scale(0.985)',
                            boxShadow: sh.xs,
                        } : {},
                    },
                    '&:focus-visible': {
                        boxShadow: `0 0 0 4px ${alpha(t.palette.secondary.main, 0.18)}`,
                    },
                };
            }}
        >
            <Box sx={{ ...headerBoxSx, px: flat ? 2 : 2, pt: flat ? 1.5 : 2 }}>
                {/* Left: Avatar + user info — hoverable */}
                <Box
                    onClick={handleUserClick}
                    role={onUserClick ? 'button' : undefined}
                    tabIndex={onUserClick ? 0 : undefined}
                    onKeyDown={(e) => {
                        if (!onUserClick) return;
                        if (e.key === 'Enter' || e.key === ' ') handleUserClick(e);
                    }}
                    sx={(t) => ({
                        display: 'inline-flex',
                        alignItems: 'flex-start',
                        gap: 1.5,
                        cursor: onUserClick ? 'pointer' : 'default',
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        maxWidth: 'fit-content',
                        transition: `background-color ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                        '&:hover': onUserClick
                            ? { bgcolor: alpha(t.palette.text.primary, 0.04) }
                            : {},
                        '&:hover .ll-user-name': {
                            textDecoration: onUserClick ? 'underline' : 'none',
                        },
                    })}
                >
                    {/* Avatar — matches UserCardPopover: MUI PersonRoundedIcon fallback */}
                    <Avatar
                        src={showAvatarImg ? rawAvatarSrc : undefined}
                        onError={handleAvatarError}
                        alt={name}
                        imgProps={avatarImgProps}
                        sx={(t) => ({
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: '2px solid',
                            borderColor: alpha(t.palette.text.primary, 0.06),
                            bgcolor: alpha(t.palette.text.primary, 0.06),
                            color: t.palette.text.secondary,
                            '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                            transition: `transform ${t.custom.motion.base}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                            '&:hover': {
                                transform: onUserClick ? 'scale(1.04)' : 'none',
                                boxShadow: onUserClick
                                    ? t.custom.shadows.sm
                                    : 'none',
                            },
                        })}
                    >
                        <PersonRoundedIcon sx={{ fontSize: 28 }} />
                    </Avatar>

                    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <Typography
                            className="ll-user-name"
                            variant="subtitle2"
                            sx={{ fontWeight: 750, lineHeight: 1.2, color: 'text.primary' }}
                            noWrap
                        >
                            {name}
                        </Typography>
                        {handle ? (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ lineHeight: 1.4 }}
                                noWrap
                            >
                                {handle}
                            </Typography>
                        ) : null}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.15 }}>
                            {when}
                        </Typography>
                    </Box>
                </Box>

                {/* Right: 3-dot menu — shown for all users, matches PostList style */}
                <Box sx={rightMenuBoxSx}>
                    <Box onClick={stopProp}>
                        <IconButton
                            size="small"
                            aria-label="Post options"
                            onClick={openOwnerMenu}
                            sx={(t) => ({
                                width: 32,
                                height: 32,
                                bgcolor: alpha(t.palette.background.paper, 0.90),
                                color: 'text.secondary',
                                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                            })}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>

                        <SmartMenu
                            anchorEl={ownerMenuEl}
                            open={ownerMenuOpen}
                            onClose={closeOwnerMenu}
                            disableScrollLock
                            onClick={stopProp}
                            anchorOrigin={menuAnchorOrigin}
                            transformOrigin={menuTransformOrigin}
                            PaperProps={menuPaperProps}
                        >
                            {[
                                /* Copy link — always */
                                <MenuItem key="copy-link" onClick={handleCopyLink} sx={{ py: 1 }}>
                                    <ListItemIcon>
                                        <LinkIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Copy link" />
                                </MenuItem>,

                                /* Owner divider */
                                isOwner ? <Divider key="owner-divider" sx={{ my: 0.5 }} /> : null,

                                /* Edit post */
                                isOwner ? (
                                    <MenuItem
                                        key="edit"
                                        onClick={(e) => {
                                            closeOwnerMenu(e);
                                            requestEdit(e);
                                        }}
                                        sx={editMenuItemSx}
                                    >
                                        <ListItemIcon>
                                            <EditRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Edit post" />
                                    </MenuItem>
                                ) : null,

                                /* Delete post */
                                isOwner ? (
                                    <MenuItem
                                        key="delete"
                                        onClick={(e) => {
                                            closeOwnerMenu(e);
                                            requestDelete(e);
                                        }}
                                        sx={deleteMenuItemSx}
                                    >
                                        <ListItemIcon sx={{ color: 'error.main' }}>
                                            <DeleteRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Delete post" />
                                    </MenuItem>
                                ) : null,

                                /* Non-owner: Report */
                                !isOwner ? <Divider key="report-divider" sx={{ my: 0.5 }} /> : null,
                                !isOwner ? (
                                    <MenuItem key="report-item" onClick={handleReportClick} sx={{ py: 1 }}>
                                        <ListItemIcon>
                                            <FlagOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Report post" />
                                    </MenuItem>
                                ) : null,
                                /* Non-owner: Hide posts / Block user */
                                !isOwner ? (
                                    <MenuItem key="hide-user" onClick={handleHideUser} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                                        <ListItemIcon>
                                            <VisibilityOffRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Hide posts" />
                                    </MenuItem>
                                ) : null,
                                !isOwner ? (
                                    <MenuItem key="block-user" onClick={handleBlockUser} disabled={hideBusy || blockBusy} sx={{ py: 1, color: 'error.main' }}>
                                        <ListItemIcon sx={{ color: 'error.main' }}>
                                            <BlockRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary="Block user" />
                                    </MenuItem>
                                ) : null,
                            ].filter(Boolean)}
                        </SmartMenu>
                    </Box>
                </Box>
            </Box>

            {/* Body content — flex:1 fills remaining space so action bar stays at bottom */}
            <Box sx={{ flex: 1, px: flat ? 2 : 2, pt: 0.5, pb: flat ? 0.5 : 1.5, display: 'flex', flexDirection: 'column', overflow: flat ? 'visible' : 'hidden' }}>
                {(hasPhoto || title || body) ? (
                    <Box
                        sx={{
                            mt: 0.85,
                            display: 'flex',
                            gap: (hasPhoto && !flat) ? 2 : 0,
                            alignItems: 'flex-start',
                            flexDirection: (flat ? 'column' : { xs: 'column', sm: 'row' }),
                            flex: 1,
                            overflow: flat ? 'visible' : 'hidden',
                        }}
                    >
                        {hasPhoto && !flat ? (
                            <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
                                <Box
                                    component="img"
                                    alt=""
                                    src={thumb}
                                    loading="lazy"
                                    sx={(t) => ({
                                        width: { xs: '100%', sm: 140 },
                                        height: { xs: 210, sm: 140 },
                                        objectFit: 'cover',
                                        borderRadius: `${t.custom.postCard.borderRadius + 2}px`,
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                        boxShadow: t.custom.shadows.sm,
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

                        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
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
                                        WebkitLineClamp: flat ? 2 : 1,
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
                                        WebkitLineClamp: (hasPhoto && !flat) ? 3 : 4,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: 1.55,
                                        wordBreak: 'break-word',
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    {body}
                                    {body.length > 180 && (
                                        <Typography
                                            component="span"
                                            sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            ...more
                                        </Typography>
                                    )}
                                </Typography>
                            ) : null}
                        </Box>
                    </Box>
                ) : null}

                {/* Flat mode (mobile): full-width dynamic photo grid below text */}
                {flat && hasPhoto && (() => {
                    const urls = photoUrls;
                    const count = urls.length;
                    const imgCell = (url, idx, sx = {}) => (
                        <Box key={idx} sx={{ position: 'relative', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' }, ...sx }}>
                            <Box component="img" src={url} alt="" loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                        </Box>
                    );
                    if (count === 1) return (<Box sx={{ borderRadius: 2.5, overflow: 'hidden', mt: 1.5 }}><Box sx={{ position: 'relative', '&:hover img': { transform: 'scale(1.02)' } }}><Box component="img" src={urls[0]} alt="" loading="lazy" sx={{ width: '100%', maxHeight: 600, objectFit: 'contain', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} /></Box></Box>);
                    if (count === 2) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 220, sm: 280 }, mt: 1.5 }}>{imgCell(urls[0], 0)}{imgCell(urls[1], 1)}</Box>);
                    if (count === 3) return (<Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 260, sm: 340 }, mt: 1.5 }}>{imgCell(urls[0], 0, { gridRow: '1 / 3' })}{imgCell(urls[1], 1)}{imgCell(urls[2], 2)}</Box>);
                    if (count === 4) return (<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '2fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 300, sm: 380 }, mt: 1.5 }}>{imgCell(urls[0], 0, { gridColumn: '1 / 4' })}{imgCell(urls[1], 1)}{imgCell(urls[2], 2)}{imgCell(urls[3], 3)}</Box>);
                    const extra = count - 5;
                    return (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr', gridTemplateRows: '1fr 1fr', gap: 0.5, borderRadius: 2.5, overflow: 'hidden', height: { xs: 280, sm: 360 }, mt: 1.5 }}>
                            {imgCell(urls[0], 0, { gridRow: '1 / 3' })}{imgCell(urls[1], 1)}{imgCell(urls[2], 2)}{imgCell(urls[3], 3)}
                            <Box sx={{ position: 'relative', overflow: 'hidden', '&:hover img': { transform: 'scale(1.03)' } }}>
                                <Box component="img" src={urls[4]} alt="" loading="lazy" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                {extra > 0 && (<Box sx={{ position: 'absolute', inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.55), display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '1.5rem' }}>+{extra}</Typography></Box>)}
                            </Box>
                        </Box>
                    );
                })()}
            </Box>

            {/* Action bar (no Boost for group context) — pinned to bottom via mt:auto */}
            <Box
                sx={(t) => ({
                    mt: flat ? 0 : 'auto',
                    pt: flat ? 1.5 : 1,
                    px: flat ? 2 : 1.5,
                    pb: flat ? 0.5 : 1.5,
                    borderTop: flat ? 'none' : '1px solid',
                    borderTopColor: flat ? 'transparent' : alpha(t.palette.text.primary, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                })}
                onClick={stopProp}
            >
                <Box sx={actionBarOuterSx}>
                    <ActionBar
                        key={`ab-${post?.id || 0}-${gcActiveBusinessId || 0}-${gcActiveArtistId || 0}`}
                        postId={post?.id}
                        post={post}
                        initialLikes={Number.isFinite(likes) ? likes : 0}
                        initiallyLiked={viewerLiked}
                        commentsCount={Number.isFinite(commentsCount) ? commentsCount : 0}
                        initialReposts={Number.isFinite(reposts) ? reposts : 0}
                        initiallyReposted={viewerReposted}
                        showBoost={false}
                        useShareDialog
                        onComment={() => onClick?.()}
                    />
                </Box>

                {shareGroup && (
                    <Tooltip title="Share group">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShareDialogOpen(true);
                            }}
                            sx={(t) => ({
                                ml: 0.5,
                                color: 'text.secondary',
                                '&:hover': {
                                    color: t.palette.primary.main,
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                },
                            })}
                        >
                            <ShareOutlinedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Share Group Dialog */}
            {shareGroup && (
                <SharePostDialog
                    open={shareDialogOpen}
                    onClose={() => setShareDialogOpen(false)}
                    post={shareGroup}
                    viewer={viewer}
                    shareMode="group"
                />
            )}

            {/* Report Dialog — shared component matching PostList */}
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />

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
        </Card>
    );
}
