import { secureFetch } from '../../../../utils/secureFetch';

// Security: sanitize HTML in group rules to prevent XSS
let sanitizeHtml;
try {
    const DOMPurify = require("dompurify");
    sanitizeHtml = (dirty) => DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "span", "div", "ul", "ol", "li", "h1", "h2", "h3"],
        ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
        ALLOW_DATA_ATTR: false,
    });
} catch {
    sanitizeHtml = (dirty) => String(dirty || "").replace(/<[^>]*>/g, "");
}
import React, { useState, useCallback } from 'react';
import {
    Box, Button, Chip, Paper, Stack, Typography,
    IconButton, MenuItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SuccessSnackbar from '../../../../components/SuccessSnackbar';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ArticleIcon from '@mui/icons-material/Article';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import GroupsIcon from '@mui/icons-material/Groups';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BlockIcon from '@mui/icons-material/Block';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LinkIcon from '@mui/icons-material/Link';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';

import GroupHeaderCard from './GroupHeaderCard';
import ShareDialog from '../../../../components/ShareDialog';
import { ReportDialog } from '../../../../components/ActionBar';
import SmartMenu from '../../../../components/SmartMenu';
import defaultGroupImg from '../../../../assets/default_groups.png';
import ContentFadeIn from '../../../../components/ContentFadeIn';
import JoinQuestionsDialog from '../groupPage/JoinQuestionsDialog';
import SwitchAccountDialog from '../groupPage/SwitchAccountDialog';

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

/**
 * GroupOverviewPanel
 * ------------------
 * Displays group information in the sidebar/overview area.
 *
 * Content visibility based on membership:
 * - Public groups: Everyone can see about, rules, photos
 * - Private groups: Non-members see limited info + join prompt
 * - Hidden groups: Only visible to members/invitees
 *
 * Admin features:
 * - Quick stats for admins (pending requests, recent activity)
 * - Direct link to admin console
 */

function PhotoThumb({ src }) {
    const [fitMode, setFitMode] = useState('cover');
    const [objectPosition, setObjectPosition] = useState('center');

    const handleLoad = (e) => {
        const img = e.currentTarget;
        const w = img?.naturalWidth || 0;
        const h = img?.naturalHeight || 0;

        if (!w || !h) return;

        const ratio = w / h;
        const isExtremePortrait = ratio < 0.72;
        const isExtremeLandscape = ratio > 1.85;

        if (isExtremePortrait || isExtremeLandscape) {
            setFitMode('contain');
            setObjectPosition('center');
            return;
        }

        const isPortrait = ratio < 0.95;
        setFitMode('cover');
        setObjectPosition(isPortrait ? 'center 20%' : 'center');
    };

    return (
        <Box
            sx={(t) => ({
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.14),
                bgcolor:
                    fitMode === 'contain'
                        ? alpha(t.palette.background.default, 0.85)
                        : alpha(t.palette.primary.main, 0.03),
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: `0 4px 12px ${alpha(t.palette.common.black, 0.12)}`,
                },
            })}
        >
            <Box
                component="img"
                alt="Group photo"
                src={src}
                loading="lazy"
                onLoad={handleLoad}
                sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: fitMode,
                    objectPosition,
                    display: 'block',
                }}
            />
        </Box>
    );
}

function AdminQuickStats({ group, pendingRequestsCount }) {
    const memberCount = Number(group?.member_count ?? group?.memberCount ?? 0);
    const postCount = Number(group?.post_count ?? group?.posts_count ?? group?.postsCount ?? 0);

    return (
        <Box
            sx={(t) => ({
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.18),
                borderRadius: 3,
                p: { xs: 1.25, md: 1.5 },
                bgcolor: alpha(t.palette.primary.main, 0.04),
                backgroundImage: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, transparent 60%)`,
            })}
        >
            <Typography sx={{ fontWeight: 950, mb: 1, color: 'primary.main' }}>Admin Overview</Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Paper
                    elevation={0}
                    sx={(t) => ({
                        flex: '1 1 80px',
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: alpha(t.palette.divider, 0.8),
                        textAlign: 'center',
                    })}
                >
                    <PeopleAltIcon sx={{ fontSize: 20, color: 'primary.main', mb: 0.25 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1 }}>
                        {memberCount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Members
                    </Typography>
                </Paper>

                <Paper
                    elevation={0}
                    sx={(t) => ({
                        flex: '1 1 80px',
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: alpha(t.palette.divider, 0.8),
                        textAlign: 'center',
                    })}
                >
                    <ArticleIcon sx={{ fontSize: 20, color: 'primary.main', mb: 0.25 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1 }}>
                        {postCount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        Posts
                    </Typography>
                </Paper>

                {pendingRequestsCount > 0 && (
                    <Paper
                        elevation={0}
                        sx={(t) => ({
                            flex: '1 1 80px',
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: alpha(t.palette.warning.main, 0.08),
                            border: '1px solid',
                            borderColor: alpha(t.palette.warning.main, 0.3),
                            textAlign: 'center',
                        })}
                    >
                        <HourglassEmptyIcon sx={{ fontSize: 20, color: 'warning.main', mb: 0.25 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1, color: 'warning.dark' }}>
                            {pendingRequestsCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            Pending
                        </Typography>
                    </Paper>
                )}
            </Stack>
        </Box>
    );
}

function PrivateGroupNotice({ isHidden, onJoin, requested, group, isNonPersonalAccount = false, onSwitchAccount }) {
    return (
        <Box
            sx={(t) => ({
                border: '1px solid',
                borderColor: alpha(t.palette.primary.main, 0.18),
                borderRadius: 3,
                p: 2,
                bgcolor: alpha(t.palette.background.paper, 0.66),
                textAlign: 'center',
            })}
        >
            <Box
                sx={(t) => ({
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: alpha(t.palette.primary.main, 0.2),
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    mx: 'auto',
                    mb: 1.5,
                })}
            >
                {isHidden ? (
                    <VisibilityOffIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                ) : (
                    <LockIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                )}
            </Box>

            <Typography sx={{ fontWeight: 950, fontSize: 16, mb: 0.5 }}>
                {isHidden ? 'Hidden Group' : 'Private Group'}
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.5, maxWidth: 280, mx: 'auto' }}>
                {isHidden
                    ? 'This group is invite-only. Content is only visible to members.'
                    : 'Posts are only visible to members. Request to join to see the feed.'
                }
            </Typography>

            {!requested && (typeof onJoin === 'function' || typeof onSwitchAccount === 'function') && (
                <Button
                    variant="contained"
                    onClick={() => {
                        if (isNonPersonalAccount && typeof onSwitchAccount === 'function') {
                            onSwitchAccount();
                        } else if (typeof onJoin === 'function') {
                            onJoin(group);
                        }
                    }}
                    startIcon={<LockIcon />}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 3 }}
                >
                    Request to Join
                </Button>
            )}

            {requested && (
                <Chip
                    icon={<HourglassEmptyIcon sx={{ fontSize: 16 }} />}
                    label="Request Pending"
                    variant="outlined"
                    sx={(t) => ({
                        fontWeight: 900,
                        borderColor: alpha(t.palette.warning.main, 0.5),
                        color: t.palette.warning.dark,
                        bgcolor: alpha(t.palette.warning.main, 0.08),
                        '& .MuiChip-icon': { color: t.palette.warning.main },
                    })}
                />
            )}
        </Box>
    );
}

export default function GroupOverviewPanel({
                                               selectedGroup,
                                               groupPosts,
                                               showFullDescription,
                                               onToggleDescription,
                                               onJoin,
                                               onAcceptInvite,
                                               onDeclineInvite,
                                               onLeave,
                                               onToggleMute,
                                               onOpenAdminConsole,
                                               defaultGroupsSrc,
                                               avatarSize,
                                               defaultAvatarScale,
                                               pendingRequestsCount = 0,
                                               isMuted = false,
                                               viewer = null,
                                               onViewGroupPage,
                                           }) {
    const group = selectedGroup || null;

    const isNonPersonalAccount = useIsNonPersonalAccount();

    const [shareOpen, setShareOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const [copyToast, setCopyToast] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    // ── Join questions dialog ──
    const [joinQDialogOpen, setJoinQDialogOpen] = useState(false);
    const [joinQSubmitting, setJoinQSubmitting] = useState(false);
    const [switchAccountOpen, setSwitchAccountOpen] = useState(false);

    const joinQuestions = (() => {
        try {
            const raw = group?.join_questions_json || group?.joinQuestionsJson;
            if (!raw) return [];
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    })();

    const handleJoinWithQuestions = useCallback((g) => {
        if (isNonPersonalAccount) {
            setSwitchAccountOpen(true);
            return;
        }
        if (joinQuestions.length > 0) {
            setJoinQDialogOpen(true);
            return;
        }
        if (typeof onJoin === 'function') onJoin(g);
    }, [isNonPersonalAccount, joinQuestions, onJoin]);

    const handleJoinQuestionsSubmit = useCallback(async (answers) => {
        setJoinQSubmitting(true);
        try {
            const gid = group?.id || group?.group_id;
            if (!gid) return;
            const res = await secureFetch(`/api/groups/${encodeURIComponent(String(gid))}/join`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to join');
            }
            setJoinQDialogOpen(false);
            if (typeof onJoin === 'function') onJoin(group, { fromQuestionsDialog: true });
        } catch (e) {
            console.error('[GroupOverviewPanel] join with questions error:', e);
        } finally {
            setJoinQSubmitting(false);
        }
    }, [group, onJoin]);

    const handleMenuOpen = (e) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
    };
    const handleMenuClose = (e) => {
        if (e) e.stopPropagation();
        setMenuAnchor(null);
    };

    const handleCopyLink = (e) => {
        if (e) e.stopPropagation();
        handleMenuClose(e);
        const slug =
            group?.group_username || group?.groupUsername || group?.handle ||
            group?.username || group?.slug || group?.id || '';
        const groupUrl = `${window.location.origin}/groups/${slug}`;
        navigator.clipboard.writeText(groupUrl).then(() => {
            setCopyToast(true);
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = groupUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopyToast(true);
        });
    };

    const handleReportClick = (e) => {
        if (e) e.stopPropagation();
        handleMenuClose(e);
        setReportOpen(true);
    };

    const submitReport = useCallback(async ({ reason, details }) => {
        const groupId = group?.id || group?.group_id;
        if (!groupId) return;
        const urls = [
            `/api/groups/${encodeURIComponent(groupId)}/flag`,
            `/api/community/groups/${encodeURIComponent(groupId)}/flag`,
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
    }, [group?.id, group?.group_id]);

    // Extract photos
    const photosRaw =
        group?.photos ??
        group?.group_photos ??
        group?.groupPhotos ??
        group?.galleryPhotos ??
        group?.gallery_photos ??
        [];
    const photosArr = Array.isArray(photosRaw) ? photosRaw : [];
    const photoUrls = photosArr
        .map((p) => (typeof p === 'string' ? p : p?.url))
        .filter((u) => typeof u === 'string' && u.trim())
        .slice(0, 4);

    // Empty state
    if (!group) {
        return (
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    top: { xs: 50, md: 56 },
                    overflowY: 'auto',
                    p: { xs: 1, md: 1.5 },
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: 460, textAlign: 'center', p: 2 }}>
                        <Box
                            sx={(t) => ({
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: t.palette.primary.light,
                                border: '2px solid',
                                borderColor: alpha(t.palette.primary.main, 0.22),
                                mx: 'auto',
                                mb: 2,
                                boxShadow: `0 4px 16px ${alpha(t.palette.primary.main, 0.18)}`,
                            })}
                        >
                            <GroupsIcon sx={{ fontSize: 50, color: '#fff' }} />
                        </Box>

                        <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75 }}>Select a group</Typography>
                        <Typography color="text.secondary" sx={{ lineHeight: 1.5 }}>
                            Choose a group from the list to see its overview and posts.
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    // Visibility and membership
    const visRaw = String(group?.visibility || '').toLowerCase();
    const privateFlag = Boolean(group?.is_private ?? group?.isPrivate);
    const isPrivate = visRaw === 'private' || privateFlag;
    const isHidden = visRaw === 'hidden';
    const isRestricted = isPrivate || isHidden;

    const viewerRole = String(group?.viewer_role ?? group?.viewerRole ?? '').toLowerCase();
    const isOwner = !isNonPersonalAccount && viewerRole === 'owner';
    const isAdmin = !isNonPersonalAccount && viewerRole === 'admin';
    const isBanned = !isNonPersonalAccount && Boolean(
        group?.is_banned ||
        (group?.banned_until && new Date(group.banned_until) > new Date())
    );
    const isTimedOut = !isBanned && !isNonPersonalAccount && Boolean(
        group?.is_timed_out ||
        (group?.timeout_until && new Date(group.timeout_until) > new Date())
    );
    const isRestricted_ban_or_timeout = isBanned || isTimedOut;
    const isMember = !isBanned && !isNonPersonalAccount && (Boolean(group?.is_member ?? group?.isMember) || isOwner || isAdmin);
    const canManage = !isRestricted_ban_or_timeout && (isOwner || isAdmin);

    const requested = !isNonPersonalAccount && Boolean(group?.has_requested ?? group?.hasRequested);
    const invited = !isNonPersonalAccount && Boolean(group?.has_invite ?? group?.hasInvite ?? group?.is_invited ?? group?.isInvited);

    // Description
    const descRaw = group?.description ? String(group.description) : '';
    const descTrim = descRaw.trim();
    const DESC_LIMIT = 520;
    const descLong = descTrim.length > DESC_LIMIT;
    const descShown = showFullDescription || !descLong ? descRaw : `${descTrim.slice(0, DESC_LIMIT).trimEnd()}…`;

    // Rules
    const rulesHtmlRaw = group?.rulesHtml || group?.rules_html || group?.rules_text || group?.rulesText || '';
    const rulesHtml = typeof rulesHtmlRaw === 'string' ? rulesHtmlRaw.trim() : '';

    // For restricted groups, non-members see limited content
    const showFullContent = !isRestricted_ban_or_timeout && (isMember || invited || !isRestricted);

    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                top: { xs: 50, md: 56 },
                overflowY: 'auto',
                p: { xs: 1, md: 1.5 },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
            }}
        >
            {/* 3-dot menu — upper right corner, matches PostList style */}
            <Box sx={{ position: 'absolute', top: { xs: 8, md: 12 }, right: { xs: 8, md: 12 }, zIndex: 20 }}>
                <IconButton
                    size="small"
                    aria-label="Group options"
                    onClick={handleMenuOpen}
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
                    disableScrollLock
                    anchorEl={menuAnchor}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                        sx: {
                            mt: 0.5,
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: (t) => t.custom.shadows.lg,
                            minWidth: 200,
                            py: 0.5,
                        },
                    }}
                >
                    {[
                        /* Copy link — always */
                        <MenuItem key="copy-link" onClick={handleCopyLink} sx={{ py: 1 }}>
                            <ListItemIcon>
                                <LinkIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Copy link" />
                        </MenuItem>,

                        /* Report — always */
                        <Divider key="report-divider" sx={{ my: 0.5 }} />,
                        <MenuItem key="report-item" onClick={handleReportClick} sx={{ py: 1 }}>
                            <ListItemIcon>
                                <FlagOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Report group" />
                        </MenuItem>,
                    ].filter(Boolean)}
                </SmartMenu>
            </Box>

            {/* Header Card */}
            <GroupHeaderCard
                group={group}
                groupPosts={groupPosts}
                defaultGroupsSrc={defaultGroupsSrc}
                avatarSize={avatarSize}
                defaultAvatarScale={defaultAvatarScale}
                onJoin={isRestricted_ban_or_timeout ? null : onJoin}
                onAcceptInvite={isRestricted_ban_or_timeout ? null : onAcceptInvite}
                onDeclineInvite={isRestricted_ban_or_timeout ? null : onDeclineInvite}
                onLeave={isBanned ? null : onLeave}
                onToggleMute={isRestricted_ban_or_timeout ? null : onToggleMute}
                onOpenAdminConsole={isRestricted_ban_or_timeout ? null : onOpenAdminConsole}
                pendingRequestsCount={isRestricted_ban_or_timeout ? 0 : pendingRequestsCount}
                isMuted={isMuted}
                isSticky
                showJoinCta={!isRestricted_ban_or_timeout}
            />

            {/* View Group Page + Share — outside ContentFadeIn so they don't fade on tab switch */}
            <Stack spacing={1}>
                {typeof onViewGroupPage === 'function' && (
                    <Button
                        variant="outlined"
                        fullWidth
                        endIcon={<OpenInNewIcon />}
                        onClick={() => onViewGroupPage(group)}
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontWeight: 900,
                            py: 1,
                        }}
                    >
                        View Group Page
                    </Button>
                )}

                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ShareOutlinedIcon />}
                    onClick={() => setShareOpen(true)}
                    sx={{
                        borderRadius: 999,
                        textTransform: 'none',
                        fontWeight: 900,
                        py: 1,
                    }}
                >
                    Share Group
                </Button>
            </Stack>

            {/* Banned Notice — above content */}
            {isBanned && (
                <Box
                    sx={(t) => ({
                        border: '1px solid',
                        borderColor: alpha(t.palette.error.main, 0.2),
                        borderRadius: 3,
                        p: { xs: 2.5, md: 3 },
                        bgcolor: alpha(t.palette.error.main, 0.04),
                        textAlign: 'center',
                    })}
                >
                    <BlockIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.65, mb: 1 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'error.main', mb: 0.5 }}>
                        You have been banned from this group
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                        You can no longer view posts or interact with this group.
                    </Typography>
                </Box>
            )}

            {/* Timeout Notice — above content */}
            {isTimedOut && (() => {
                const rawUntil = group?.timeout_until || group?.timeoutUntil;
                const untilDate = rawUntil ? new Date(rawUntil) : null;
                const validUntil = untilDate && !Number.isNaN(untilDate.getTime()) ? untilDate : null;
                const diffMs = validUntil ? Math.max(0, validUntil.getTime() - Date.now()) : 0;
                const diffMins = Math.ceil(diffMs / 60000);
                const timeLeftLabel = diffMins >= 1440
                    ? `${Math.round(diffMins / 1440)} day${Math.round(diffMins / 1440) !== 1 ? 's' : ''}`
                    : diffMins >= 60
                        ? `${Math.round(diffMins / 60)} hour${Math.round(diffMins / 60) !== 1 ? 's' : ''}`
                        : `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
                return (
                    <Box
                        sx={(t) => ({
                            border: '1px solid',
                            borderColor: alpha(t.palette.warning.main, 0.25),
                            borderRadius: 3,
                            p: { xs: 2.5, md: 3 },
                            bgcolor: alpha(t.palette.warning.main, 0.06),
                            textAlign: 'center',
                        })}
                    >
                        <HourglassEmptyIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.65, mb: 1 }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'warning.dark', mb: 0.5 }}>
                            You have been timed out
                        </Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                            You cannot post or interact with this group while timed out.
                            {validUntil && ` Expires in approximately ${timeLeftLabel}.`}
                        </Typography>
                    </Box>
                );
            })()}

            {/* Non-personal account notice */}
            {isNonPersonalAccount && !isBanned && !isTimedOut && !isMember && (
                <Box
                    sx={(t) => ({
                        border: '1px solid',
                        borderColor: alpha(t.palette.info.main, 0.15),
                        borderRadius: 3,
                        p: { xs: 2.5, md: 3 },
                        bgcolor: alpha(t.palette.info.main, 0.04),
                        textAlign: 'center',
                    })}
                >
                    <SwapHorizRoundedIcon sx={{ fontSize: 36, color: 'info.main', opacity: 0.7, mb: 1 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 15, color: 'info.dark', mb: 0.5 }}>
                        Switch to your personal account
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                        Groups are designed for a personal experience. Switch to your personal account to join, post, and comment.
                    </Typography>
                </Box>
            )}

            <ContentFadeIn triggerKey={`gov-${group?.id ?? 'none'}`}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                    {!isRestricted_ban_or_timeout && (
                        <>
                            {/* Section Title */}
                            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 0.25 }}>
                                <GroupsIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                                <Typography sx={{ fontWeight: 950, fontSize: 15 }}>Group Overview</Typography>
                            </Stack>

                            {/* Admin Quick Stats (for admins only) */}
                            {canManage && (
                                <AdminQuickStats
                                    group={group}
                                    pendingRequestsCount={pendingRequestsCount}
                                />
                            )}

                            {/* About Section */}
                            {showFullContent && (
                                <Box
                                    sx={(t) => ({
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        borderRadius: 3,
                                        p: { xs: 1.25, md: 1.5 },
                                        bgcolor: alpha(t.palette.background.paper, 0.66),
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 950, mb: 0.75 }}>About</Typography>

                                    {/* Created date */}
                                    {(group?.created_at || group?.createdAt) && (() => {
                                        const raw = group?.created_at || group?.createdAt;
                                        const d = new Date(raw);
                                        if (Number.isNaN(d.getTime())) return null;
                                        return (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                                <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                                    Created {d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </Typography>
                                            </Box>
                                        );
                                    })()}

                                    <Typography
                                        sx={{
                                            fontWeight: 750,
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            overflowWrap: 'anywhere',
                                            maxWidth: '100%',
                                            minWidth: 0,
                                        }}
                                    >
                                        {descShown || 'No description yet.'}
                                    </Typography>

                                    {descLong && (
                                        <Button
                                            type="button"
                                            size="small"
                                            variant="text"
                                            onClick={onToggleDescription}
                                            sx={{ mt: 0.5, borderRadius: 999, textTransform: 'none', fontWeight: 950, px: 1 }}
                                        >
                                            {showFullDescription ? 'Show less' : 'Show more'}
                                        </Button>
                                    )}

                                    {rulesHtml && (
                                        <Box sx={{ mt: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 950, display: 'block', mb: 0.5 }}>
                                                Group Rules
                                            </Typography>
                                            <Box
                                                sx={{
                                                    p: 1.25,
                                                    borderRadius: 2,
                                                    border: '1px solid rgba(0,0,0,0.08)',
                                                    bgcolor: 'rgba(255,255,255,0.7)',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        maxWidth: '100%',
                                                        overflowWrap: 'anywhere',
                                                        wordBreak: 'break-word',
                                                        whiteSpace: 'pre-wrap',
                                                        '& *': { margin: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' },
                                                        '& p': { marginBottom: '0.6em' },
                                                        '& li': { marginLeft: '1.1em' },
                                                        fontSize: 14,
                                                        lineHeight: 1.55,
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(rulesHtml) }}
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Photos Section — hidden for private/hidden groups */}
                            {showFullContent && !isRestricted && photoUrls.length > 0 && (
                                <Box
                                    sx={(t) => ({
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        borderRadius: 3,
                                        p: { xs: 1.25, md: 1.5 },
                                        bgcolor: alpha(t.palette.background.paper, 0.66),
                                    })}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.9 }}>
                                        <PhotoLibraryIcon sx={{ fontSize: 18, opacity: 0.7 }} />
                                        <Typography sx={{ fontWeight: 950 }}>Photos</Typography>
                                        <Chip
                                            size="small"
                                            label={photoUrls.length}
                                            sx={{ height: 20, fontSize: 11, fontWeight: 800 }}
                                        />
                                    </Stack>

                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: 'repeat(2, minmax(0, 1fr))',
                                                sm: 'repeat(4, minmax(0, 1fr))',
                                            },
                                            gap: 1,
                                        }}
                                    >
                                        {photoUrls.map((src) => (
                                            <PhotoThumb key={src} src={src} />
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Private/Hidden Group Notice for non-members */}
                            {isRestricted && !isMember && !invited && (
                                <PrivateGroupNotice
                                    isHidden={isHidden}
                                    onJoin={handleJoinWithQuestions}
                                    requested={requested}
                                    group={group}
                                    isNonPersonalAccount={isNonPersonalAccount}
                                    onSwitchAccount={() => setSwitchAccountOpen(true)}
                                />
                            )}

                            {/* Invited notice */}
                            {!isMember && invited && (
                                <Box
                                    sx={(t) => ({
                                        border: '1px solid',
                                        borderColor: alpha(t.palette.info.main, 0.3),
                                        borderRadius: 3,
                                        p: 2,
                                        bgcolor: alpha(t.palette.info.main, 0.06),
                                        textAlign: 'center',
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 900, color: 'info.dark', mb: 0.5 }}>
                                        You've been invited!
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Accept the invitation to see posts and participate in discussions.
                                    </Typography>
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        {typeof onDeclineInvite === 'function' && (
                                            <Button
                                                variant="outlined"
                                                onClick={onDeclineInvite}
                                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 900 }}
                                            >
                                                Decline
                                            </Button>
                                        )}
                                        {typeof onAcceptInvite === 'function' && (
                                            <Button
                                                variant="contained"
                                                onClick={onAcceptInvite}
                                                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 950 }}
                                            >
                                                Accept Invitation
                                            </Button>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </ContentFadeIn>

            {/* Share Group Dialog */}
            <ShareDialog
                contentType="group"
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                group={group}
                viewer={viewer}
            />

            {/* Report Dialog — shared component matching PostList */}
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />

            {/* Copy link toast */}
            <SuccessSnackbar
                open={copyToast}
                message="Link copied to clipboard"
                onClose={() => setCopyToast(false)}
                autoHideDuration={2000}
            />

            {/* Join Questions Dialog */}
            <JoinQuestionsDialog
                open={joinQDialogOpen}
                onClose={() => setJoinQDialogOpen(false)}
                onSubmit={handleJoinQuestionsSubmit}
                questions={joinQuestions}
                groupName={group?.name || 'this group'}
                submitting={joinQSubmitting}
            />

            <SwitchAccountDialog
                open={switchAccountOpen}
                onClose={() => setSwitchAccountOpen(false)}
            />
        </Box>
    );
}