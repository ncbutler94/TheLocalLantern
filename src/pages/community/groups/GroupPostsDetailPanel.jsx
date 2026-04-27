import { secureFetch } from '../../../../utils/secureFetch';
import React from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import LockIcon from '@mui/icons-material/Lock';
import ForumIcon from '@mui/icons-material/Forum';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import GroupsIcon from '@mui/icons-material/Groups';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';

import GroupPostCard from './GroupPostCard';
import PostDetailModal from '../PostDetailModal';
import defaultGroupImg from '../../../../assets/default_groups.png';
import { useActiveAccount } from '../../../../components/AccountContext';
import ContentFadeIn from '../../../../components/ContentFadeIn';
import SmartMenu from '../../../../components/SmartMenu';
import { ensureListStaggerKeyframes, getListStaggerSx } from '../../../../theme';

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
    const [value, setValue] = React.useState(read);
    React.useEffect(() => {
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


function mergePreferDefined(base, patch) {
    if (!patch || typeof patch !== 'object') return base;
    const out = { ...(base && typeof base === 'object' ? base : {}) };
    Object.entries(patch).forEach(([k, v]) => {
        if (v !== undefined) out[k] = v;
    });
    return out;
}

function OwnerPostMenu({ post, groupId }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleOpen = (e) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    };

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        setAnchorEl(null);
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

    return (
        <>
            <IconButton
                size="small"
                aria-label="Post options"
                onClick={handleOpen}
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

            <SmartMenu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
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
                        boxShadow: '0 18px 50px rgba(0,0,0,0.16)',
                        minWidth: 190,
                    },
                }}
            >
                <MenuItem
                    onClick={(e) => {
                        handleClose(e);
                        requestEdit(e);
                    }}
                >
                    <ListItemIcon>
                        <EditRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Edit post" />
                </MenuItem>

                <MenuItem
                    onClick={(e) => {
                        handleClose(e);
                        requestDelete(e);
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <DeleteRoundedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Delete post" />
                </MenuItem>
            </SmartMenu>
        </>
    );
}

export default function GroupPostsDetailPanel({
                                                  selectedGroup,
                                                  groupPosts,
                                                  groupPostsLoading,
                                                  groupPostsError,
                                                  selectedGroupPostDetail,
                                                  onSelectPostId,
                                                  onBackToList,
                                                  onOpenCreatePost,
                                                  onJoin,
                                                  onViewGroupPage,
                                                  onViewGroupPostPage,
                                                  onUserClick,
                                                  defaultGroupsSrc,
                                                  groupIconSrc,
                                                  avatarSize,
                                                  defaultAvatarScale,
                                                  user,

                                                  // hide pinned styling when filters are not default (but still allow pinned posts to appear)
                                                  showPinnedPosts = true,
                                              }) {
    const group = selectedGroup || null;

    const isNonPersonalAccount = useIsNonPersonalAccount();
    const { isBusinessAccount: gpdIsBusinessAccount, isArtistAccount: gpdIsArtistAccount, activeBusinessId: gpdActiveBusinessId, activeArtistId: gpdActiveArtistId } = useActiveAccount();

    const [postOverrides, setPostOverrides] = React.useState(() => ({}));

    // Dialog state for non-personal account trying to join
    const [switchAccountDialogOpen, setSwitchAccountDialogOpen] = React.useState(false);

    // Wrapper around onJoin that intercepts non-personal account attempts
    const handleJoinAttempt = React.useCallback((groupArg) => {
        if (isNonPersonalAccount) {
            setSwitchAccountDialogOpen(true);
            return;
        }
        if (typeof onJoin === 'function') onJoin(groupArg);
    }, [isNonPersonalAccount, onJoin]);

    // Inject list stagger keyframes once
    React.useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // ── Moderation: hide posts from blocked/hidden users (mirrors PostList pattern) ──
    const [blockedUserIds, setBlockedUserIds] = React.useState(() => new Set());
    const [hiddenUserIds, setHiddenUserIds] = React.useState(() => new Set());
    const [hiddenPostIds, setHiddenPostIds] = React.useState(() => new Set());

    // Fetch moderation state on mount
    React.useEffect(() => {
        const viewerId = Number(user?.id || 0);
        if (!viewerId) return;
        let active = true;
        (async () => {
            try {
                const params = new URLSearchParams();
                const hdrs = { Accept: 'application/json' };
                if (gpdIsBusinessAccount && gpdActiveBusinessId) {
                    params.set('account_id', String(gpdActiveBusinessId));
                    params.set('account_type', 'business');
                    hdrs['x-account-type'] = 'business';
                    hdrs['x-business-id'] = String(gpdActiveBusinessId);
                } else if (gpdIsArtistAccount && gpdActiveArtistId) {
                    params.set('account_id', String(gpdActiveArtistId));
                    params.set('account_type', 'artist');
                    hdrs['x-account-type'] = 'artist';
                    hdrs['x-artist-id'] = String(gpdActiveArtistId);
                }
                const qs = params.toString();
                const res = await secureFetch(`/api/users/moderation-state${qs ? `?${qs}` : ''}`, {
                    credentials: 'include',
                    headers: hdrs,
                });
                if (!res.ok || !active) return;
                const data = await res.json();
                const toSet = (arr) => new Set(
                    (Array.isArray(arr) ? arr : []).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0)
                );
                if (active) {
                    setBlockedUserIds(toSet(data?.blocked_user_ids));
                    setHiddenUserIds(toSet([
                        ...(Array.isArray(data?.hidden_user_ids) ? data.hidden_user_ids : []),
                        ...(Array.isArray(data?.hidden_post_user_ids) ? data.hidden_post_user_ids : []),
                    ]));
                    setHiddenPostIds(toSet(data?.hidden_post_ids));
                }
            } catch { /* ignore */ }
        })();
        return () => { active = false; };
    }, [user?.id, gpdIsBusinessAccount, gpdActiveBusinessId, gpdIsArtistAccount, gpdActiveArtistId]);

    // Listen for hide/block events so the list updates immediately
    React.useEffect(() => {
        const onHiddenUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const hidden = Boolean(e?.detail?.hidden);
            setHiddenUserIds((prev) => {
                const next = new Set(prev);
                if (hidden) next.add(uid); else next.delete(uid);
                return next;
            });
        };
        const onBlockedUser = (e) => {
            const uid = Number(e?.detail?.userId || 0);
            if (!uid) return;
            const blocked = Boolean(e?.detail?.blocked);
            setBlockedUserIds((prev) => {
                const next = new Set(prev);
                if (blocked) next.add(uid); else next.delete(uid);
                return next;
            });
        };
        const onHiddenPost = (e) => {
            const pid = Number(e?.detail?.postId || 0);
            if (!pid) return;
            const hidden = Boolean(e?.detail?.hidden);
            setHiddenPostIds((prev) => {
                const next = new Set(prev);
                if (hidden) next.add(pid); else next.delete(pid);
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

    React.useEffect(() => {
        const onUpdated = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const post = detail.post && typeof detail.post === 'object' ? detail.post : null;
            const pid = post?.id ?? detail.postId ?? detail.id ?? null;
            if (pid == null) return;
            const idStr = String(pid);
            setPostOverrides((prev) => ({ ...(prev || {}), [idStr]: post || detail }));
        };

        const onDeleted = (e) => {
            const detail = e?.detail && typeof e.detail === 'object' ? e.detail : {};
            const pid = detail.postId ?? detail.id ?? null;
            if (pid == null) return;
            const idStr = String(pid);
            setPostOverrides((prev) => {
                const next = { ...(prev || {}) };
                delete next[idStr];
                return next;
            });
        };

        window.addEventListener('ll:communityPost:updated', onUpdated);
        window.addEventListener('ll:communityPost:deleted', onDeleted);
        return () => {
            window.removeEventListener('ll:communityPost:updated', onUpdated);
            window.removeEventListener('ll:communityPost:deleted', onDeleted);
        };
    }, []);

    if (!group) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 420, textAlign: 'center', p: 2 }}>
                    <Box
                        sx={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            mx: 'auto',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid',
                            borderColor: 'primary.light',
                            bgcolor: '#e8f5e9',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            component="img"
                            src={defaultGroupImg}
                            alt="Groups"
                            sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scale(1.15)',
                            }}
                        />
                    </Box>

                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75 }}>Select a group</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.5 }}>Click a group on the left to see its posts here.</Typography>
                </Box>
            </Box>
        );
    }

    const vis = String(group?.visibility || '').toLowerCase();
    const privateFlag = Boolean(group?.is_private ?? group?.isPrivate);
    const isPrivate = vis === 'private' || vis === 'hidden' || privateFlag;

    const isMember = !isNonPersonalAccount && Boolean(group?.is_member ?? group?.isMember);
    const requested = !isNonPersonalAccount && Boolean(group?.has_requested ?? group?.hasRequested);
    const canSeeFeed = isMember || !isPrivate;

    const viewerRole = String(group?.viewer_role ?? group?.viewerRole ?? '').toLowerCase();
    const isGroupOwner = !isNonPersonalAccount && viewerRole === 'owner';
    const isGroupAdmin = !isNonPersonalAccount && (viewerRole === 'admin' || isGroupOwner);
    const canPinPosts = isGroupAdmin;
    const canAdminDeletePosts = isGroupAdmin;

    const postsArr = React.useMemo(() => {
        const raw = Array.isArray(groupPosts) ? groupPosts : [];
        const hasHidden = hiddenPostIds.size > 0;
        const hasHiddenUsers = hiddenUserIds.size > 0;
        const hasBlocked = blockedUserIds.size > 0;
        if (!hasHidden && !hasHiddenUsers && !hasBlocked) return raw;
        return raw.filter((p) => {
            const pid = Number(p?.id ?? p?.post_id ?? 0);
            if (pid && hasHidden && hiddenPostIds.has(pid)) return false;
            const uid = Number(p?.user_id ?? p?.userId ?? p?.author_id ?? p?.owner_id ?? 0);
            if (uid && hasBlocked && blockedUserIds.has(uid)) return false;
            if (uid && hasHiddenUsers && hiddenUserIds.has(uid)) return false;
            return true;
        });
    }, [groupPosts, hiddenPostIds, hiddenUserIds, blockedUserIds]);

    const sanitizePinnedForDisplay = (post) => {
        if (!post || typeof post !== 'object') return post;
        if (showPinnedPosts) return post;
        return { ...post, is_pinned: 0, isPinned: 0 };
    };

    const selectedGroupPostDetailResolved = (() => {
        const base = selectedGroupPostDetail && typeof selectedGroupPostDetail === 'object' ? selectedGroupPostDetail : null;
        if (!base) return null;
        const idStr = String(base?.id ?? base?.post_id ?? '');
        if (!idStr) return base;
        const patch = postOverrides?.[idStr];
        return patch ? mergePreferDefined(base, patch) : base;
    })();

    return (
        <Box sx={{ px: { xs: 1, md: 1.5 }, pt: { xs: 1.25, md: 1.75 }, pb: { xs: 1, md: 1.5 }, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <ContentFadeIn triggerKey={`gpd-${group?.id ?? 'none'}-${selectedGroupPostDetailResolved?.id ?? 'list'}`}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>

                    {!canSeeFeed ? (
                        <Box
                            sx={(t) => ({
                                border: '1px solid',
                                borderColor: alpha(t.palette.primary.main, 0.12),
                                borderRadius: 3,
                                p: { xs: 2, md: 2.5 },
                                bgcolor: alpha(t.palette.background.paper, 0.6),
                                textAlign: 'center',
                            })}
                        >
                            <Box
                                sx={(t) => ({
                                    width: 88,
                                    height: 88,
                                    borderRadius: '20px',
                                    mx: 'auto',
                                    mb: 1.75,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid',
                                    borderColor: alpha(t.palette.primary.main, 0.16),
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                    boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
                                })}
                            >
                                <LockIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                            </Box>

                            <Typography sx={{ fontWeight: 900, mb: 0.75, fontSize: 18 }}>This group is private</Typography>
                            <Typography color="text.secondary" sx={{ lineHeight: 1.5, maxWidth: 520, mx: 'auto' }}>
                                You must request to join before you can view posts in this group. Use the button above to request access.
                            </Typography>

                            {requested ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 900 }}>
                                    Request pending
                                </Typography>
                            ) : null}
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Non-personal account notice */}
                            {isNonPersonalAccount && (
                                <Box
                                    sx={(t) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: 2.5,
                                        bgcolor: alpha(t.palette.warning.main, 0.06),
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.warning.main, 0.18),
                                    })}
                                >
                                    <SwapHorizRoundedIcon sx={{ color: 'warning.main', fontSize: 22, flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.45 }}>
                                        You must be signed into your <strong>personal account</strong> to join groups and create posts.
                                    </Typography>
                                </Box>
                            )}

                            {!selectedGroupPostDetailResolved ? (
                                <Box
                                    sx={(t) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1,
                                        pb: 1,
                                        borderBottom: '1px solid',
                                        borderColor: alpha(t.palette.divider, 0.15),
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        bgcolor: 'background.paper',
                                        pt: 0.5,
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'text.primary' }}>Posts</Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tooltip
                                            title={
                                                isMember ? ''
                                                    : isNonPersonalAccount ? 'Switch to your personal account to create a post'
                                                        : 'Join this group to create a post'
                                            }
                                            arrow
                                            disableHoverListener={isMember}
                                        >
                                    <span>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            disabled={!isMember}
                                            onClick={onOpenCreatePost}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                px: 2,
                                                py: 0.75,
                                                whiteSpace: 'nowrap',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    boxShadow: isMember ? `0 4px 12px ${alpha(t.palette.primary.main, 0.3)}` : 'none',
                                                },
                                            })}
                                        >
                                            Create Post
                                        </Button>
                                    </span>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            ) : null}

                            {groupPostsLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <CircularProgress size={18} />
                                    <Typography color="text.secondary">Loading…</Typography>
                                </Box>
                            ) : null}

                            {!groupPostsLoading && groupPostsError ? (
                                <Typography color="error" sx={{ mt: 0.5 }}>
                                    {groupPostsError}
                                </Typography>
                            ) : null}

                            {!groupPostsLoading && !groupPostsError && postsArr.length === 0 ? (
                                <Box
                                    sx={{
                                        py: 5,
                                        px: 3,
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <ForumRoundedIcon
                                        sx={(t) => ({
                                            fontSize: 72,
                                            color: alpha(t.palette.primary.main, 0.7),
                                            mb: 0.5,
                                        })}
                                    />
                                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>No Posts Yet</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, lineHeight: 1.5 }}>
                                        Be the first to share something with this group!
                                    </Typography>
                                </Box>
                            ) : null}

                            {/* List / Detail — clean ternary swap */}
                            {selectedGroupPostDetailResolved ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            startIcon={<OpenInNewIcon />}
                                            onClick={onBackToList}
                                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                                        >
                                            Back to posts
                                        </Button>

                                        <Chip
                                            icon={(() => {
                                                const photoSrc =
                                                    group?.photo_url || group?.photoUrl ||
                                                    group?.image_url || group?.imageUrl ||
                                                    group?.group_photo_url || group?.groupPhotoUrl || '';
                                                const src = (typeof photoSrc === 'string' ? photoSrc.trim() : '') || '';
                                                return src ? (
                                                    <Box
                                                        component="img"
                                                        src={src}
                                                        alt=""
                                                        sx={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Box
                                                        sx={(t) => ({
                                                            width: 20,
                                                            height: 20,
                                                            borderRadius: '50%',
                                                            bgcolor: '#e8f5e9',
                                                            border: '1.5px solid',
                                                            borderColor: alpha(t.palette.primary.main, 0.25),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                        })}
                                                    >
                                                        <GroupsIcon sx={{ fontSize: 12, color: 'primary.main' }} />
                                                    </Box>
                                                );
                                            })()}
                                            label={`Posted in ${group?.name || group?.group_name || 'this group'}`}
                                            sx={(t) => ({
                                                fontWeight: 900,
                                                borderRadius: 999,
                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                border: '1px solid',
                                                borderColor: alpha(t.palette.primary.main, 0.16),
                                                '& .MuiChip-icon': { ml: 0.75, mr: 0.25 },
                                                '& .MuiChip-label': {
                                                    py: 0.2,
                                                    pl: 0.5,
                                                    pr: 1.25,
                                                    maxWidth: 220,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                },
                                            })}
                                        />
                                    </Box>

                                    <PostDetailModal
                                        user={user}
                                        embedded
                                        hideCategoryChip
                                        topRightSlot={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {(() => {
                                                    const canEdit = !isNonPersonalAccount && isViewerOwnerOfPost(user, selectedGroupPostDetailResolved);
                                                    if (!canEdit) return null;
                                                    return (
                                                        <OwnerPostMenu
                                                            key={`ll:gpd-owner-${String(selectedGroupPostDetailResolved?.id ?? selectedGroupPostDetailResolved?.post_id ?? '')}`}
                                                            post={selectedGroupPostDetailResolved}
                                                            groupId={group?.id ?? group?.group_id ?? null}
                                                        />
                                                    );
                                                })()}

                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    endIcon={<OpenInNewIcon />}
                                                    onClick={() => onViewGroupPostPage?.(selectedGroupPostDetailResolved?.id ?? selectedGroupPostDetailResolved?.post_id)}
                                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900, whiteSpace: 'nowrap' }}
                                                >
                                                    View post page
                                                </Button>
                                            </Box>
                                        }
                                        post={{
                                            ...sanitizePinnedForDisplay(selectedGroupPostDetailResolved),
                                            id: selectedGroupPostDetailResolved?.id ?? selectedGroupPostDetailResolved?.post_id,
                                            description:
                                                selectedGroupPostDetailResolved?.description ??
                                                selectedGroupPostDetailResolved?.content ??
                                                selectedGroupPostDetailResolved?.body ??
                                                selectedGroupPostDetailResolved?.post_body ??
                                                '',
                                            category: (() => {
                                                const cat = String(selectedGroupPostDetailResolved?.category || '').toLowerCase();
                                                if (['poll', 'polls'].includes(cat)) return selectedGroupPostDetailResolved.category;
                                                if (selectedGroupPostDetailResolved?.poll || selectedGroupPostDetailResolved?.pollData || selectedGroupPostDetailResolved?.poll_data || selectedGroupPostDetailResolved?.pollOptions || selectedGroupPostDetailResolved?.poll_options) return 'poll';
                                                return null;
                                            })(),
                                            category_id: (() => {
                                                const cat = String(selectedGroupPostDetailResolved?.category || '').toLowerCase();
                                                if (['poll', 'polls'].includes(cat)) return selectedGroupPostDetailResolved?.category_id ?? null;
                                                if (selectedGroupPostDetailResolved?.poll || selectedGroupPostDetailResolved?.pollData || selectedGroupPostDetailResolved?.poll_data || selectedGroupPostDetailResolved?.pollOptions || selectedGroupPostDetailResolved?.poll_options) return selectedGroupPostDetailResolved?.category_id ?? null;
                                                return null;
                                            })(),
                                        }}
                                        groupMembershipGated={!isMember && !isNonPersonalAccount}
                                        onJoinGroup={() => handleJoinAttempt(group)}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {postsArr.map((p, idx) => {
                                        const pid = p?.id ?? p?.post_id ?? null;
                                        if (!pid) return null;
                                        return (
                                            <Box
                                                key={`group-post-${pid}-${gpdActiveBusinessId || 0}-${gpdActiveArtistId || 0}`}
                                                sx={getListStaggerSx(idx)}
                                            >
                                                <GroupPostCard
                                                    post={sanitizePinnedForDisplay((() => {
                                                        const idStr = String(p?.id ?? p?.post_id ?? '');
                                                        const patch = idStr ? postOverrides?.[idStr] : null;
                                                        return patch ? mergePreferDefined(p, patch) : p;
                                                    })())}
                                                    onClick={() => onSelectPostId?.(pid)}
                                                    onUserClick={onUserClick}
                                                    viewer={user}
                                                    groupId={group?.id ?? group?.group_id ?? null}
                                                    isMember={isMember}
                                                    canPin={canPinPosts}
                                                    onPin={async (postId) => {
                                                        try {
                                                            await secureFetch(`/api/groups/${encodeURIComponent(String(group?.id))}/admin/posts/${encodeURIComponent(String(postId))}/pin`, {
                                                                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
                                                            });
                                                        } catch { /* ignore */ }
                                                    }}
                                                    onUnpin={async (postId) => {
                                                        try {
                                                            await secureFetch(`/api/groups/${encodeURIComponent(String(group?.id))}/admin/posts/${encodeURIComponent(String(postId))}/unpin`, {
                                                                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}',
                                                            });
                                                        } catch { /* ignore */ }
                                                    }}
                                                    canAdminDelete={canAdminDeletePosts}
                                                    onAdminDelete={(postId) => {
                                                        if (!window.confirm('Remove this post? This cannot be undone.')) return;
                                                        secureFetch(`/api/groups/${encodeURIComponent(String(group?.id))}/admin/posts/${encodeURIComponent(String(postId))}`, {
                                                            method: 'DELETE', credentials: 'include',
                                                        }).catch(() => {});
                                                    }}
                                                    onReport={(postId) => {
                                                        try {
                                                            secureFetch(`/api/posts/${encodeURIComponent(String(postId))}/flag`, {
                                                                method: 'POST', credentials: 'include',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ reason: 'inappropriate', details: '' }),
                                                            });
                                                        } catch { /* ignore */ }
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>
            </ContentFadeIn>

            {/* Switch to personal account dialog */}
            <Dialog
                open={switchAccountDialogOpen}
                onClose={() => setSwitchAccountDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                disableScrollLock
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        fontWeight: 900,
                        fontSize: 17,
                        pr: 1.5,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SwapHorizRoundedIcon sx={{ color: 'primary.main' }} />
                        Switch Account
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setSwitchAccountDialogOpen(false)}
                        aria-label="Close"
                        sx={{ width: 32, height: 32 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        Groups are designed for a personal experience. Switch to your personal account to join groups, vote on polls, and participate in discussions.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
                    <Button
                        variant="contained"
                        onClick={() => setSwitchAccountDialogOpen(false)}
                        disableElevation
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 800,
                            px: 3,
                        }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}