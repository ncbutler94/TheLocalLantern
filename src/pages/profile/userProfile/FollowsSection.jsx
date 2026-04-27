// src/pages/profile/userProfile/FollowsSection.jsx
// ENHANCED VERSION: Visual polish with refined cards, premium hover effects,
// and better typography while preserving all existing logic.

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { alpha, keyframes, useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import axios from '../../../api/axiosInstance';
import SmartMenu from '../../../components/SmartMenu';
import SwipeableRightDrawer from '../../../components/SwipeableRightDrawer';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
// default avatar import removed — using MUI icons for fallbacks

const api = process.env.REACT_APP_API_URL;

/** Build profile path based on account_type returned by the API */
function getProfilePath(u) {
    if (!u) return '/';
    const acctType = String(u.account_type || '').toLowerCase();
    if (acctType === 'business') {
        const slug = u.handle || u.business_slug || u.business_id || u.id;
        return `/${encodeURIComponent(slug)}`;
    }
    if (acctType === 'artist') {
        const slug = u.handle || u.artist_handle || u.artist_id || u.id;
        return `/${encodeURIComponent(slug)}`;
    }
    // Default: personal user
    const slug = u.handle || u.public_id || u.id;
    return `/${encodeURIComponent(slug)}`;
}

/** Get badge config for a business/artist/nonprofit profile */
function getBizBadge(u) {
    const acctType = String(u?.account_type || '').toLowerCase();
    const entType = String(u?.entity_type || '').toLowerCase();
    if (acctType === 'artist') {
        // Visual artists (profile_type === 'artist') get the palette icon;
        // musicians (default) keep the music-note icon.
        const profileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
        const Icon = profileType === 'artist' ? PaletteOutlinedIcon : MusicNoteOutlinedIcon;
        return { label: 'Artist', Icon, color: 'info.main' };
    }
    if (acctType === 'business') {
        if (entType === 'nonprofit') {
            return { label: 'Nonprofit', Icon: VolunteerActivismOutlinedIcon, color: 'success.main' };
        }
        return { label: 'Business', Icon: StorefrontOutlinedIcon, color: 'secondary.main' };
    }
    return null;
}

// Brand colors
// Lantern gold — uses theme secondary.main
// Lantern green — uses theme primary.main
// Lantern green light — uses theme primary.light

// Subtle shimmer animation for loading states
const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

function idKey(u) {
    return String(u?.id ?? '');
}

/**
 * Mini tile used in the section (not the dialog) to preview up to 6 users.
 * ENHANCED: Premium card styling with refined hover effects.
 */
function GridMiniCard({ user, onClick }) {
    const name =
        `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
        user?.display_name ||
        user?.name ||
        (user?.handle ? `@${user.handle}` : 'User');

    const username = user?.handle || user?.username || '';
    const avatar = user?.avatar_url || user?.profile_picture || '';
    const gridBadge = getBizBadge(user);
    const acctType = String(user?.account_type || '').toLowerCase();
    const isBiz = acctType === 'business' || Boolean(user?.business_id);
    const isArt = acctType === 'artist' || Boolean(user?.artist_id);
    // Visual artist (profile_type === 'artist') vs musician fallback icon
    const userProfileType = String(user?.profile_type || user?.profileType || '').toLowerCase();
    const isVisualArtist = isArt && userProfileType === 'artist';
    const hasRealAvatar = Boolean(avatar && avatar !== 'null' && !avatar.includes('default_avatar'));

    return (
        <Paper
            variant="outlined"
            onClick={onClick}
            sx={(t) => ({
                cursor: 'pointer',
                borderRadius: 2.5,
                p: 0,
                minHeight: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                bgcolor: 'background.paper',
                borderColor: alpha(t.palette.primary.main, 0.12),
                boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.06)}`,
                transition: (t) => `all ${t.custom.motion.slow}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    borderColor: alpha(t.palette.primary.main, 0.35),
                    boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.12)}`,
                },
            })}
        >
            {/* Avatar fills the top edge-to-edge */}
            <Box
                sx={(t) => ({
                    width: '100%',
                    aspectRatio: '1 / 0.85',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    ...(isBiz || isArt
                            ? { bgcolor: alpha(t.palette.primary.main, 0.06), color: t.palette.primary.main }
                            : { bgcolor: alpha(t.palette.text.primary, 0.04), color: t.palette.text.secondary }
                    ),
                })}
            >
                {hasRealAvatar ? (
                    <Box
                        component="img"
                        src={avatar}
                        alt={name}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                ) : (
                    isBiz ? <StorefrontOutlinedIcon sx={{ fontSize: 40 }} />
                        : isArt ? (isVisualArtist
                                ? <PaletteOutlinedIcon sx={{ fontSize: 38 }} />
                                : <MusicNoteOutlinedIcon sx={{ fontSize: 38 }} />)
                            : <PersonRoundedIcon sx={{ fontSize: 40 }} />
                )}
            </Box>

            {/* Name + handle + badge below — fixed height so all cards match */}
            <Box sx={{ px: 0.75, pt: 0.5, pb: 0.75, textAlign: 'center', minWidth: 0, minHeight: 62 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Typography
                        variant="body2"
                        noWrap
                        title={name}
                        sx={{
                            fontWeight: 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: "primary.main",
                            fontSize: '0.8rem',
                        }}
                    >
                        {name}
                    </Typography>
                    {Boolean(user?.is_verified) && (
                        <VerifiedRoundedIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
                    )}
                </Box>

                {username ? (
                    <Typography
                        variant="caption"
                        noWrap
                        title={`@${username}`}
                        sx={(t) => ({
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: alpha(t.palette.primary.main, 0.6),
                            fontWeight: 500,
                            fontSize: '0.68rem',
                        })}
                    >
                        @{username}
                    </Typography>
                ) : null}

                {gridBadge ? (() => {
                    const BadgeIcon = gridBadge.Icon;
                    return (
                        <Box
                            sx={(t) => ({
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.3,
                                mt: 0.25,
                                px: 0.6,
                                py: 0.15,
                                borderRadius: 1,
                                bgcolor: alpha(t.palette[gridBadge.color.split('.')[0]]?.main || t.palette.secondary.main, 0.12),
                            })}
                        >
                            <BadgeIcon sx={{ fontSize: 12, color: gridBadge.color }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: gridBadge.color,
                                    lineHeight: 1.2,
                                }}
                            >
                                {gridBadge.label}
                            </Typography>
                        </Box>
                    );
                })() : null}
            </Box>
        </Paper>
    );
}

export default forwardRef(function FollowsSection(
    {
        viewer,
        profileId,
        profileHandle,
        profileAvatar,
        profileName,
        profileUsername,
        onFlash,
        refreshNonce,
        showFollowingTabInSection = true,
        fillHeight = false,
        onCountsChange,
        // Account-type scoping: pass these for business/artist profiles
        // so the social endpoint returns the correct follow graph.
        accountType,   // 'business' | 'artist' | undefined (personal)
        accountId,     // numeric business_id or artist_id
        // For business/artist: the owner's user ID is needed as the
        // :who parameter in /api/follows/social/:who because that
        // endpoint first resolves :who to a user row.
        ownerUserId,
        // If true, treats the viewer as the owner of this profile
        // (enables unfollow, follow-back actions in the dialog).
        // For personal profiles this is auto-detected; pass explicitly
        // for business/artist profiles.
        isOwner: isOwnerProp,
    },
    ref
) {
    const fsTheme = useTheme();
    const isMobile = useMediaQuery(fsTheme.breakpoints.down('sm'));
    // 0 = Followers, 1 = Following
    const [tab, setTab] = useState(0);
    const [tabFade, setTabFade] = useState(true);

    // Force reload of followers/following lists
    const [refreshTick, setRefreshTick] = useState(0);

    const [loading, setLoading] = useState(true);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    // Randomized preview (section shows a few users only)
    const [previewFollowers, setPreviewFollowers] = useState([]);
    const [previewFollowing, setPreviewFollowing] = useState([]);
    const [counts, setCounts] = useState({ followers: 0, following: 0 });
    const [loadError, setLoadError] = useState('');

    // Viewer relationship set (to decide Follow/Follow Back visibility)
    const [viewerFollowingIds, setViewerFollowingIds] = useState(new Set());

    // Popup (View All)
    const [allOpen, setAllOpen] = useState(false);
    const [dialogTab, setDialogTab] = useState(0);
    const [dialogTabFade, setDialogTabFade] = useState(true);

    // Search within popup (per active tab)
    const [searchText, setSearchText] = useState('');
    const [appliedQuery, setAppliedQuery] = useState('');
    const dialogScrollRef = useRef(null);

    // 3-dots menu & messaging
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuUser, setMenuUser] = useState(null);

    // Message popup (lightweight placeholder until full messaging is wired)
    const openMenu = (e, user) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
        setMenuUser(user);
    };
    const closeMenu = () => {
        setMenuAnchor(null);
        setMenuUser(null);
    };
    const isOwnPage = typeof isOwnerProp === 'boolean'
        ? isOwnerProp
        : viewer && Number(viewer.id) === Number(profileId);

    useImperativeHandle(ref, () => ({
        openAll: (initialTab) => {
            setDialogTab(typeof initialTab === 'number' ? initialTab : tab);
            setAllOpen(true);
        },
        refresh: () => {
            setRefreshTick((t) => t + 1);
        },
    }));

    // Reset popup search when switching tabs or opening the dialog
    useEffect(() => {
        if (!allOpen) return;
        setSearchText('');
        setAppliedQuery('');
        closeMenu();
        if (dialogScrollRef.current) {
            dialogScrollRef.current.scrollTop = 0;
        }
    }, [dialogTab, allOpen]);

    // UPDATED: prefer numeric id for API robustness; fall back to handle
    const key =
        String(profileId || '') ||
        (profileHandle && String(profileHandle).toLowerCase());

    const lastRefreshNonceRef = useRef(refreshNonce);

    useEffect(() => {
        if (typeof refreshNonce === 'undefined') return;
        if (lastRefreshNonceRef.current === refreshNonce) return;
        lastRefreshNonceRef.current = refreshNonce;
        setRefreshTick((t) => t + 1);
    }, [refreshNonce]);


    // Load social lists for the viewed profile (and refresh when requested)
    useEffect(() => {
        // For business/artist scoped queries, we need a valid user identifier
        // as the :who param AND account_type + account_id query params.
        // The :who param is either ownerUserId (the business/artist owner)
        // or falls back to the viewer's ID if available, then to the key.
        const isScopedAccount = (accountType === 'business' || accountType === 'artist') && accountId;
        const socialWho = isScopedAccount
            ? String(ownerUserId || viewer?.id || viewer?.public_id || key)
            : key;

        if (!socialWho) return;

        let alive = true;
        const ctrl = new AbortController();

        (async () => {
            setLoading(true);
            setLoadError('');
            setPreviewFollowers([]);
            setPreviewFollowing([]);

            try {
                // Build query params for scoped accounts (business/artist)
                const scopeParams = isScopedAccount
                    ? `?account_type=${encodeURIComponent(accountType)}&account_id=${encodeURIComponent(accountId)}`
                    : '';

                // Use the new centralized follows endpoint as the source of truth.
                // Falls back to the legacy /users/social/ endpoint if unavailable.
                let r;
                try {
                    r = await axios.get(
                        `${api}/api/follows/social/${encodeURIComponent(socialWho)}${scopeParams}`,
                        { withCredentials: true, signal: ctrl.signal }
                    );
                } catch {
                    r = await axios.get(
                        `${api}/users/social/${encodeURIComponent(socialWho)}${scopeParams}`,
                        { withCredentials: true, signal: ctrl.signal }
                    );
                }
                if (!alive) return;

                const nextFollowers = Array.isArray(r.data.followers) ? r.data.followers : [];
                const nextFollowing = Array.isArray(r.data.following) ? r.data.following : [];
                const nextCounts = r.data.counts || { followers: 0, following: 0 };

                setFollowers(nextFollowers);
                setFollowing(nextFollowing);
                setCounts(nextCounts);
                if (onCountsChange) onCountsChange(nextCounts);

                // Randomized preview (only a few tiles are shown in the section)
                const PREVIEW_MAX = 6;
                const shuffle = (arr) => {
                    const a = Array.isArray(arr) ? arr.slice() : [];
                    for (let i = a.length - 1; i > 0; i -= 1) {
                        const j = Math.floor(Math.random() * (i + 1));
                        const tmp = a[i];
                        a[i] = a[j];
                        a[j] = tmp;
                    }
                    return a;
                };

                setPreviewFollowers(shuffle(nextFollowers).slice(0, PREVIEW_MAX));
                setPreviewFollowing(shuffle(nextFollowing).slice(0, PREVIEW_MAX));
            } catch (e) {
                if (alive) {
                    setLoadError(e?.response?.data?.message || 'Failed to load followers.');
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [key, refreshTick, accountType, accountId, ownerUserId]);


    // Load viewer's own follow set so we can show correct contextual options
    useEffect(() => {
        if (!viewer) {
            setViewerFollowingIds(new Set());
            return;
        }

        let alive = true;
        const ctrl = new AbortController();

        (async () => {
            try {
                const who = viewer?.public_id || viewer?.id || viewer?.handle;
                let r;
                try {
                    r = await axios.get(
                        `${api}/api/follows/social/${encodeURIComponent(who)}`,
                        { withCredentials: true, signal: ctrl.signal }
                    );
                } catch {
                    r = await axios.get(
                        `${api}/users/social/${encodeURIComponent(who)}`,
                        { withCredentials: true, signal: ctrl.signal }
                    );
                }
                if (!alive) return;
                const myFollowing = (r.data.following || []).map((u) => idKey(u));
                setViewerFollowingIds(new Set(myFollowing));
            } catch {
                if (alive) setViewerFollowingIds(new Set());
            }
        })();

        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [viewer]);

    // helpers
    const weFollow = (u) => viewerFollowingIds.has(idKey(u));
    const addWeFollow = (uid) =>
        setViewerFollowingIds((old) => {
            const s = new Set(old);
            s.add(String(uid));
            return s;
        });
    const removeWeFollow = (uid) =>
        setViewerFollowingIds((old) => {
            const s = new Set(old);
            s.delete(String(uid));
            return s;
        });

    const goProfile = (u) => {
        if (!u) return;
        const path = getProfilePath(u);
        setAllOpen(false);
        window.location.assign(path);
    };

    // actions
    const followUser = async (u, asFollowBack = false) => {
        if (!viewer || !u || Number(viewer.id) === Number(u.id)) return;
        const targetType = String(u.account_type || 'user').toLowerCase();
        const normalizedType = targetType === 'user' ? 'personal' : targetType;
        try {
            // Use new follows/toggle endpoint first, fall back to legacy
            try {
                await axios.post(
                    `${api}/api/follows/toggle`,
                    { target_id: u.id, action: 'follow', target_type: normalizedType },
                    { withCredentials: true }
                );
            } catch {
                await axios.post(
                    `${api}/users/follow`,
                    { target_id: u.id, action: 'follow', target_type: targetType },
                    { withCredentials: true }
                );
            }
            addWeFollow(u.id);

            if (isOwnPage) {
                setCounts((c) => ({ ...c, following: (c.following || 0) + 1 }));
                setFollowing((list) => {
                    const exists = list.find((x) => Number(x.id) === Number(u.id));
                    return exists ? list : [...list, u];
                });
            }

            onFlash?.({
                type: 'success',
                text: asFollowBack ? 'Followed back.' : 'Followed.',
            });
        } catch (e) {
            onFlash?.({
                type: 'error',
                text: e?.response?.data?.message || 'Failed to follow.',
            });
        } finally {
            closeMenu();
        }
    };

    const unfollowUser = async (u) => {
        if (!viewer || !u || Number(viewer.id) === Number(u.id)) return;
        const targetType = String(u.account_type || 'user').toLowerCase();
        const normalizedType = targetType === 'user' ? 'personal' : targetType;
        try {
            // Use new follows/toggle endpoint first, fall back to legacy
            try {
                await axios.post(
                    `${api}/api/follows/toggle`,
                    { target_id: u.id, action: 'unfollow', target_type: normalizedType },
                    { withCredentials: true }
                );
            } catch {
                await axios.post(
                    `${api}/users/follow`,
                    { target_id: u.id, action: 'unfollow', target_type: targetType },
                    { withCredentials: true }
                );
            }
            removeWeFollow(u.id);

            if (isOwnPage) {
                setFollowing((list) => list.filter((x) => Number(x.id) !== Number(u.id)));
                setCounts((c) => ({
                    ...c,
                    following: Math.max(0, (c.following || 0) - 1),
                }));
            }
        } catch (e) {
            onFlash?.({
                type: 'error',
                text: e?.response?.data?.message || 'Failed to unfollow.',
            });
        } finally {
            closeMenu();
        }
    };


    const blockUser = async (u) => {
        closeMenu();
        if (!u?.id) return;
        try {
            await axios.post(
                `${api}/users/block`,
                { target_id: u.id, action: 'block' },
                { withCredentials: true }
            );

            // Remove from local lists immediately (backend also removes follow links)
            setFollowers((prev) => (Array.isArray(prev) ? prev.filter((x) => x.id !== u.id) : prev));
            setFollowing((prev) => (Array.isArray(prev) ? prev.filter((x) => x.id !== u.id) : prev));

            onFlash?.({ type: 'success', text: `Blocked @${u.handle || 'user'}.` });
        } catch (err) {
            onFlash?.({ type: 'error', text: err?.response?.data?.message || 'Failed to block user.' });
        }
    };


    const normalizeQuery = (q) => String(q || '').toLowerCase().trim();

    const userMatchesQuery = (u, q) => {
        const nq = normalizeQuery(q);
        if (!nq) return true;

        const name = `${u?.first_name || ''} ${u?.last_name || ''}`.toLowerCase();
        const handle = String(u?.handle || u?.username || '').toLowerCase();
        const display = String(u?.display_name || u?.name || '').toLowerCase();
        return name.includes(nq) || handle.includes(nq) || display.includes(nq);
    };

    const sortUsersAlpha = (list) => {
        const arr = Array.isArray(list) ? list.slice() : [];
        const norm = (s) => String(s || '').toLowerCase().trim();

        arr.sort((a, b) => {
            const aFirst = norm(a?.first_name);
            const aLast = norm(a?.last_name);
            const aDisplay = norm(a?.display_name || a?.name);
            const aHandle = norm(a?.handle || a?.username);

            const bFirst = norm(b?.first_name);
            const bLast = norm(b?.last_name);
            const bDisplay = norm(b?.display_name || b?.name);
            const bHandle = norm(b?.handle || b?.username);

            const aKey = (aLast || aFirst) ? `${aLast} ${aFirst}`.trim() : (aDisplay || aHandle);
            const bKey = (bLast || bFirst) ? `${bLast} ${bFirst}`.trim() : (bDisplay || bHandle);

            const c = aKey.localeCompare(bKey, undefined, { sensitivity: 'base' });
            if (c !== 0) return c;
            return aHandle.localeCompare(bHandle, undefined, { sensitivity: 'base' });
        });

        return arr;
    };


    const handleApplySearch = () => {
        setAppliedQuery(searchText);
        closeMenu();
        if (dialogScrollRef.current) {
            dialogScrollRef.current.scrollTop = 0;
        }
    };

    const handleClearSearch = () => {
        setSearchText('');
        setAppliedQuery('');
        closeMenu();
        if (dialogScrollRef.current) {
            dialogScrollRef.current.scrollTop = 0;
        }
    };

    // ------- Section content: preview up to 6 -------
    const visibleList = (tab === 0 ? previewFollowers : previewFollowing).slice(0, 6);

    const dialogList = dialogTab === 0 ? followers : following;
    const filteredDialogList = dialogList.filter((u) => userMatchesQuery(u, appliedQuery));
    const sortedDialogList = sortUsersAlpha(filteredDialogList);

    // Enhanced tab styling
    const tabSx = (t) => ({
        fontWeight: 700,
        textTransform: 'none',
        fontSize: '0.85rem',
        minHeight: 40,
        color: alpha(t.palette.primary.main, 0.7),
        '&.Mui-selected': {
            color: "primary.main",
        },
    });

    const handleTabChange = (_, v) => {
        if (v === tab) return;
        setTabFade(false);
        setTimeout(() => { setTab(v); setTabFade(true); }, 150);
    };

    const handleDialogTabChange = (_, v) => {
        if (v === dialogTab) return;
        setDialogTabFade(false);
        setTimeout(() => { setDialogTab(v); setDialogTabFade(true); }, 150);
    };

    const fadeSx = (visible) => ({
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 200ms ease, transform 200ms ease',
    });

    return (
        <Box
            sx={{
                ...(fillHeight ? { flex: 1, minHeight: 0, height: '100%' } : null),
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Enhanced tabs with custom indicator */}
            {showFollowingTabInSection ? (
                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    sx={{
                        mb: 1,
                        minHeight: 40,
                        '& .MuiTabs-indicator': {
                            backgroundColor: "secondary.main",
                            height: 3,
                            borderRadius: '3px 3px 0 0',
                        },
                    }}
                >
                    <Tab label={`Followers (${counts.followers || 0})`} sx={tabSx} />
                    <Tab label={`Following (${counts.following || 0})`} sx={tabSx} />
                </Tabs>
            ) : (
                <Tabs
                    value={0}
                    onChange={() => {}}
                    sx={{
                        mb: 1,
                        minHeight: 40,
                        '& .MuiTabs-indicator': {
                            backgroundColor: "secondary.main",
                            height: 3,
                            borderRadius: '3px 3px 0 0',
                        },
                    }}
                >
                    <Tab label={`Followers (${counts.followers || 0})`} sx={tabSx} />
                </Tabs>
            )}

            <Box
                sx={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    pr: 0.25,
                    pt: 0.5,
                }}
            >
                {loading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CircularProgress size={24} sx={{ color: "primary.main" }} />
                    </Box>
                ) : loadError ? (
                    <Typography color="error" sx={{ py: 1 }}>
                        {loadError}
                    </Typography>
                ) : (
                    <Box sx={fadeSx(tabFade)}>
                        {/* 3 per row on desktop, 2 on smaller screens */}
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: 'repeat(2, minmax(0, 1fr))',
                                    sm: 'repeat(3, minmax(0, 1fr))',
                                },
                                gridAutoRows: '1fr',
                                alignContent: 'stretch',
                                gap: 1,
                            }}
                        >
                            {visibleList.map((u) => (
                                <GridMiniCard key={u.id} user={u} onClick={() => goProfile(u)} />
                            ))}
                        </Box>

                        {visibleList.length === 0 && (
                            <Box
                                sx={{
                                    py: 3,
                                    flex: 1,
                                    minHeight: 90,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={(t) => ({
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        bgcolor: tab === 0 ? alpha(t.palette.primary.main, 0.08) : alpha(t.palette.primary.main, 0.10),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    })}
                                >
                                    {tab === 0 ? (
                                        <PersonOutlineOutlinedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                    ) : (
                                        <PersonAddOutlinedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                                    )}
                                </Box>
                                <Typography
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    {tab === 0 ? 'No followers yet' : 'Not following anyone'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>



            {/* ---------- View All Popup ---------- */}
            {isMobile ? (
                <SwipeableRightDrawer
                    open={allOpen}
                    onClose={() => setAllOpen(false)}
                    onOpen={() => {}}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                    transitionDuration={{ enter: 280, exit: 220 }}
                    // High zIndex so the drawer covers the top app bar and bottom nav
                    sx={{ zIndex: (t) => (t.zIndex?.modal ?? 1300) + 200 }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            top: 0,
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        },
                    }}
                >
                    {/* Mobile header: just a back arrow — tabs below already identify the view */}
                    <Box
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1,
                            py: 1,
                            // iOS safe-area so the back button clears the notch/status bar
                            pt: 'max(8px, env(safe-area-inset-top))',
                            borderBottom: 1,
                            borderColor: alpha(t.palette.primary.main, 0.1),
                            bgcolor: 'background.paper',
                            background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.03)} 0%, ${alpha(t.palette.primary.main, 0.05)} 100%)`,
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                        })}
                    >
                        <IconButton
                            aria-label="Back"
                            onClick={() => setAllOpen(false)}
                            size="medium"
                            sx={{ color: 'text.primary' }}
                        >
                            <ArrowBackRoundedIcon />
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Tabs + search bar */}
                        <Box sx={{ flexShrink: 0 }}>
                            <Tabs
                                value={dialogTab}
                                onChange={handleDialogTabChange}
                                sx={(t) => ({
                                    borderBottom: 1,
                                    borderColor: alpha(t.palette.primary.main, 0.1),
                                    px: { xs: 1, sm: 2 },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: "secondary.main",
                                        height: 3,
                                        borderRadius: '3px 3px 0 0',
                                    },
                                })}
                            >
                                <Tab
                                    label={`Followers (${counts.followers})`}
                                    sx={tabSx}
                                />
                                <Tab
                                    label={`Following (${counts.following})`}
                                    sx={tabSx}
                                />
                            </Tabs>

                            {/* Search */}
                            <Box sx={{ p: { xs: 1.5, sm: 2 }, pb: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    placeholder={dialogTab === 0 ? 'Search followers…' : 'Search following…'}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchText ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" aria-label="Clear search" onClick={() => setSearchText('')}>
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                        sx: (t) => ({
                                            borderRadius: 999,
                                            bgcolor: alpha(t.palette.primary.main, 0.04),
                                            '&:hover': {
                                                bgcolor: alpha(t.palette.primary.main, 0.06),
                                            },
                                            '&.Mui-focused': {
                                                bgcolor: 'background.paper',
                                            },
                                        }),
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* List */}
                        <Box
                            ref={dialogScrollRef}
                            sx={(t) => ({
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                                px: { xs: 1.25, sm: 2 },
                                pb: 2,
                                pt: 1.5,
                                bgcolor: alpha(t.palette.primary.main, 0.015),
                            })}
                        >
                            <Box sx={fadeSx(dialogTabFade)}>
                                {loading ? (
                                    <Typography sx={{ p: 2 }} color="text.secondary">
                                        Loading…
                                    </Typography>
                                ) : dialogList.length === 0 ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            py: 6,
                                            gap: 2,
                                        }}
                                    >
                                        <Box
                                            sx={(t) => ({
                                                width: 72,
                                                height: 72,
                                                borderRadius: '50%',
                                                bgcolor: dialogTab === 0 ? alpha(t.palette.primary.main, 0.08) : alpha(t.palette.primary.main, 0.10),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            })}
                                        >
                                            {dialogTab === 0 ? (
                                                <PersonOutlineOutlinedIcon sx={{ fontSize: 36, color: "primary.main" }} />
                                            ) : (
                                                <PersonAddOutlinedIcon sx={{ fontSize: 36, color: "primary.main" }} />
                                            )}
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    color: 'text.primary',
                                                    mb: 0.5,
                                                }}
                                            >
                                                {dialogTab === 0 ? 'No followers yet' : 'Not following anyone'}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ maxWidth: 280 }}
                                            >
                                                {dialogTab === 0
                                                    ? 'When people follow this account, they\'ll show up here.'
                                                    : 'Accounts that are followed will appear here.'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : normalizeQuery(appliedQuery) && filteredDialogList.length === 0 ? (
                                    <Typography sx={{ p: 2 }} color="text.secondary">
                                        No results.
                                    </Typography>
                                ) : (
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                                            gap: 1.5,
                                        }}
                                    >
                                        {sortedDialogList.map((u) => {
                                            const name =
                                                `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                                                (u.handle ? `@${u.handle}` : 'User');
                                            const username = u.handle || u.username || '';
                                            const avatar = u.avatar_url || u.profile_picture || '';
                                            const hasRealDialogAvatar = Boolean(avatar && avatar !== 'null' && !avatar.includes('default_avatar') && !avatar.includes('default_business') && !avatar.includes('default_logo'));
                                            const dialogBadge = getBizBadge(u);
                                            const dialogAcctType = String(u.account_type || '').toLowerCase();
                                            const dialogIsBiz = dialogAcctType === 'business';
                                            const dialogIsArt = dialogAcctType === 'artist';
                                            const dialogProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
                                            const dialogIsVisualArtist = dialogIsArt && dialogProfileType === 'artist';

                                            const canFollowOption = !isOwnPage && !weFollow(u);
                                            const canUnfollowOption = isOwnPage && dialogTab === 1;
                                            const canFollowBackOption = isOwnPage && dialogTab === 0 && !weFollow(u);

                                            return (
                                                <Paper
                                                    key={u.id}
                                                    variant="outlined"
                                                    sx={(t) => ({
                                                        display: 'grid',
                                                        gridTemplateColumns: 'auto 1fr auto',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        p: 1,
                                                        borderRadius: 2.5,
                                                        bgcolor: 'background.paper',
                                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                                        boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.05)}`,
                                                    })}
                                                >
                                                    <Avatar
                                                        src={hasRealDialogAvatar ? avatar : undefined}
                                                        alt={name}
                                                        variant="square"
                                                        sx={(t) => ({
                                                            width: 64,
                                                            height: 64,
                                                            borderRadius: 2,
                                                            cursor: 'pointer',
                                                            border: `2px solid ${alpha(t.palette.primary.main, 0.1)}`,
                                                            ...(!hasRealDialogAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                                        })}
                                                        onClick={() => goProfile(u)}
                                                    >
                                                        {dialogIsBiz ? <StorefrontOutlinedIcon sx={{ fontSize: 32 }} />
                                                            : dialogIsArt ? (dialogIsVisualArtist
                                                                    ? <PaletteOutlinedIcon sx={{ fontSize: 30 }} />
                                                                    : <MusicNoteOutlinedIcon sx={{ fontSize: 30 }} />)
                                                                : <PersonRoundedIcon sx={{ fontSize: 32 }} />}
                                                    </Avatar>

                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                noWrap
                                                                title={name}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    fontWeight: 700,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    color: "primary.main",
                                                                }}
                                                                onClick={() => goProfile(u)}
                                                            >
                                                                {name}
                                                            </Typography>
                                                            {Boolean(u?.is_verified) && (
                                                                <VerifiedRoundedIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
                                                            )}
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            title={`@${username}`}
                                                            sx={(t) => ({
                                                                cursor: 'pointer',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                color: alpha(t.palette.primary.main, 0.6),
                                                            })}
                                                            onClick={() => goProfile(u)}
                                                        >
                                                            @{username}
                                                        </Typography>

                                                        {dialogBadge ? (() => {
                                                            const DlgBadgeIcon = dialogBadge.Icon;
                                                            return (
                                                                <Box
                                                                    sx={(t) => ({
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.3,
                                                                        mt: 0.25,
                                                                        px: 0.6,
                                                                        py: 0.15,
                                                                        borderRadius: 1,
                                                                        bgcolor: alpha(t.palette[dialogBadge.color.split('.')[0]]?.main || t.palette.secondary.main, 0.12),
                                                                    })}
                                                                >
                                                                    <DlgBadgeIcon sx={{ fontSize: 12, color: dialogBadge.color }} />
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            fontSize: '0.68rem',
                                                                            fontWeight: 700,
                                                                            color: dialogBadge.color,
                                                                            lineHeight: 1.2,
                                                                        }}
                                                                    >
                                                                        {dialogBadge.label}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        })() : null}
                                                    </Box>

                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => openMenu(e, u)}
                                                        sx={(t) => ({
                                                            color: alpha(t.palette.primary.main, 0.6),
                                                        })}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>

                                                    {menuUser && menuUser.id === u.id ? (
                                                        <SmartMenu
                                                            open={Boolean(menuAnchor)}
                                                            anchorEl={menuAnchor}
                                                            onClose={closeMenu}
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                            PaperProps={{
                                                                sx: (t) => ({
                                                                    borderRadius: 2,
                                                                    boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.15)}`,
                                                                }),
                                                            }}
                                                        >
                                                            {canUnfollowOption ? (
                                                                <MenuItem onClick={() => unfollowUser(u)}>Unfollow</MenuItem>
                                                            ) : null}

                                                            {canFollowBackOption ? (
                                                                <MenuItem onClick={() => followUser(u, true)}>
                                                                    Follow Back
                                                                </MenuItem>
                                                            ) : null}

                                                            {canFollowOption ? (
                                                                <MenuItem onClick={() => followUser(u, false)}>Follow</MenuItem>
                                                            ) : null}

                                                            <MenuItem onClick={() => goProfile(u)}>View Profile</MenuItem>
                                                            <MenuItem onClick={() => blockUser(u)} sx={{ color: 'error.main' }}>
                                                                Block User
                                                            </MenuItem>

                                                        </SmartMenu>
                                                    ) : null}
                                                </Paper>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </SwipeableRightDrawer>
            ) : (
                <Dialog
                    open={allOpen}
                    onClose={(_, reason) => {
                        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
                        setAllOpen(false);
                    }}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: (t) => ({
                            width: 980,
                            maxWidth: '96vw',
                            height: { sm: '90vh', md: '88vh' },
                            maxHeight: '92vh',
                            borderRadius: 3,
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            border: `1px solid ${alpha(t.palette.primary.main, 0.1)}`,
                            boxShadow: `0 24px 80px ${alpha(t.palette.primary.main, 0.25)}`,
                        }),
                    }}
                >
                    <DialogTitle
                        sx={(t) => ({
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            alignItems: 'center',
                            py: 1.5,
                            px: { xs: 1.5, sm: 2.5 },
                            borderBottom: 1,
                            borderColor: alpha(t.palette.primary.main, 0.1),
                            bgcolor: 'background.paper',
                            background: `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.03)} 0%, ${alpha(t.palette.primary.main, 0.05)} 100%)`,
                        })}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                            Followers &amp; Following
                        </Typography>
                        <IconButton
                            aria-label="Close"
                            onClick={() => setAllOpen(false)}
                            size="small"
                            sx={(t) => ({
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                '&:hover': {
                                    bgcolor: alpha(t.palette.primary.main, 0.15),
                                },
                            })}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent
                        sx={{
                            p: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            height: 'calc(100% - 56px)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Tabs + search bar */}
                        <Box sx={{ flexShrink: 0 }}>
                            <Tabs
                                value={dialogTab}
                                onChange={handleDialogTabChange}
                                sx={(t) => ({
                                    borderBottom: 1,
                                    borderColor: alpha(t.palette.primary.main, 0.1),
                                    px: { xs: 1, sm: 2 },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: "secondary.main",
                                        height: 3,
                                        borderRadius: '3px 3px 0 0',
                                    },
                                })}
                            >
                                <Tab
                                    label={`Followers (${counts.followers})`}
                                    sx={tabSx}
                                />
                                <Tab
                                    label={`Following (${counts.following})`}
                                    sx={tabSx}
                                />
                            </Tabs>

                            {/* Search bar */}
                            <Box
                                sx={(t) => ({
                                    p: { xs: 1.25, sm: 2 },
                                    borderBottom: 1,
                                    borderColor: alpha(t.palette.primary.main, 0.08),
                                    bgcolor: alpha(t.palette.primary.main, 0.02),
                                })}
                            >
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Search by name or username…"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleApplySearch();
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={(t) => ({ color: alpha(t.palette.primary.main, 0.5) })} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: searchText ? (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setSearchText('')}
                                                        sx={{ p: 0.25 }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                        }}
                                        sx={(t) => ({
                                            '& .MuiOutlinedInput-root': {
                                                bgcolor: 'background.paper',
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: alpha(t.palette.primary.main, 0.2),
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: alpha(t.palette.primary.main, 0.4),
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: "primary.main",
                                                },
                                            },
                                        })}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleApplySearch}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            bgcolor: "primary.main",
                                            borderRadius: 2,
                                            px: 2.5,
                                            '&:hover': {
                                                bgcolor: "primary.light",
                                            },
                                        }}
                                    >
                                        Search
                                    </Button>
                                    <Button
                                        onClick={handleClearSearch}
                                        disabled={!appliedQuery}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            color: "primary.main",
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        <Box
                            ref={dialogScrollRef}
                            sx={(t) => ({
                                flex: '1 1 auto',
                                minHeight: 0,
                                overflowY: 'auto',
                                px: { xs: 1.25, sm: 2 },
                                pb: 2,
                                pt: 1.5,
                                bgcolor: alpha(t.palette.primary.main, 0.015),
                            })}
                        >
                            <Box sx={fadeSx(dialogTabFade)}>
                                {loading ? (
                                    <Typography sx={{ p: 2 }} color="text.secondary">
                                        Loading…
                                    </Typography>
                                ) : dialogList.length === 0 ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            py: 6,
                                            gap: 2,
                                        }}
                                    >
                                        <Box
                                            sx={(t) => ({
                                                width: 72,
                                                height: 72,
                                                borderRadius: '50%',
                                                bgcolor: dialogTab === 0 ? alpha(t.palette.primary.main, 0.08) : alpha(t.palette.primary.main, 0.10),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            })}
                                        >
                                            {dialogTab === 0 ? (
                                                <PersonOutlineOutlinedIcon sx={{ fontSize: 36, color: "primary.main" }} />
                                            ) : (
                                                <PersonAddOutlinedIcon sx={{ fontSize: 36, color: "primary.main" }} />
                                            )}
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    color: 'text.primary',
                                                    mb: 0.5,
                                                }}
                                            >
                                                {dialogTab === 0 ? 'No followers yet' : 'Not following anyone'}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ maxWidth: 280 }}
                                            >
                                                {dialogTab === 0
                                                    ? 'When people follow this account, they\'ll show up here.'
                                                    : 'Accounts that are followed will appear here.'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : normalizeQuery(appliedQuery) && filteredDialogList.length === 0 ? (
                                    <Typography sx={{ p: 2 }} color="text.secondary">
                                        No results.
                                    </Typography>
                                ) : (
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: {
                                                xs: 'repeat(1, minmax(0, 1fr))',
                                                sm: 'repeat(2, minmax(0, 1fr))',
                                            },
                                            gap: 2,
                                        }}
                                    >
                                        {sortedDialogList.map((u) => {
                                            const name =
                                                `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
                                                (u.handle ? `@${u.handle}` : 'User');
                                            const username = u.handle || u.username || '';
                                            const avatar = u.avatar_url || u.profile_picture || '';
                                            const hasRealDialogAvatar = Boolean(avatar && avatar !== 'null' && !avatar.includes('default_avatar') && !avatar.includes('default_business') && !avatar.includes('default_logo'));
                                            const dialogBadge = getBizBadge(u);
                                            const dialogAcctType = String(u.account_type || '').toLowerCase();
                                            const dialogIsBiz = dialogAcctType === 'business';
                                            const dialogIsArt = dialogAcctType === 'artist';
                                            const dialogProfileType = String(u?.profile_type || u?.profileType || '').toLowerCase();
                                            const dialogIsVisualArtist = dialogIsArt && dialogProfileType === 'artist';

                                            const canFollowOption = !isOwnPage && !weFollow(u);
                                            const canUnfollowOption = isOwnPage && dialogTab === 1;
                                            const canFollowBackOption = isOwnPage && dialogTab === 0 && !weFollow(u);

                                            return (
                                                <Paper
                                                    key={u.id}
                                                    variant="outlined"
                                                    sx={(t) => ({
                                                        display: 'grid',
                                                        gridTemplateColumns: 'auto 1fr auto',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        p: 1,
                                                        borderRadius: 2.5,
                                                        bgcolor: 'background.paper',
                                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                                        boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.05)}`,
                                                        transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                                                        '&:hover': {
                                                            boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.12)}`,
                                                            borderColor: alpha(t.palette.primary.main, 0.3),
                                                        },
                                                    })}
                                                >
                                                    <Avatar
                                                        src={hasRealDialogAvatar ? avatar : undefined}
                                                        alt={name}
                                                        variant="square"
                                                        sx={(t) => ({
                                                            width: { xs: 72, sm: 80 },
                                                            height: { xs: 72, sm: 80 },
                                                            borderRadius: 2,
                                                            cursor: 'pointer',
                                                            border: `2px solid ${alpha(t.palette.primary.main, 0.1)}`,
                                                            transition: (t2) => `border-color ${t2.custom.motion.base}ms ${t2.custom.motion.ease}`,
                                                            '&:hover': {
                                                                borderColor: alpha(t.palette.primary.main, 0.3),
                                                            },
                                                            ...(!hasRealDialogAvatar ? { bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main } : {}),
                                                        })}
                                                        onClick={() => goProfile(u)}
                                                    >
                                                        {dialogIsBiz ? <StorefrontOutlinedIcon sx={{ fontSize: 36 }} />
                                                            : dialogIsArt ? (dialogIsVisualArtist
                                                                    ? <PaletteOutlinedIcon sx={{ fontSize: 34 }} />
                                                                    : <MusicNoteOutlinedIcon sx={{ fontSize: 34 }} />)
                                                                : <PersonRoundedIcon sx={{ fontSize: 36 }} />}
                                                    </Avatar>

                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Typography
                                                                variant="subtitle2"
                                                                noWrap
                                                                title={name}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    fontWeight: 700,
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                    color: "primary.main",
                                                                    '&:hover': {
                                                                        color: "primary.light",
                                                                    },
                                                                }}
                                                                onClick={() => goProfile(u)}
                                                            >
                                                                {name}
                                                            </Typography>
                                                            {Boolean(u?.is_verified) && (
                                                                <VerifiedRoundedIcon sx={{ fontSize: 15, color: 'primary.main', flexShrink: 0 }} />
                                                            )}
                                                        </Box>
                                                        <Typography
                                                            variant="body2"
                                                            noWrap
                                                            title={`@${username}`}
                                                            sx={(t) => ({
                                                                cursor: 'pointer',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                color: alpha(t.palette.primary.main, 0.6),
                                                            })}
                                                            onClick={() => goProfile(u)}
                                                        >
                                                            @{username}
                                                        </Typography>

                                                        {dialogBadge ? (() => {
                                                            const DlgBadgeIcon = dialogBadge.Icon;
                                                            return (
                                                                <Box
                                                                    sx={(t) => ({
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: 0.3,
                                                                        mt: 0.25,
                                                                        px: 0.6,
                                                                        py: 0.15,
                                                                        borderRadius: 1,
                                                                        bgcolor: alpha(t.palette[dialogBadge.color.split('.')[0]]?.main || t.palette.secondary.main, 0.12),
                                                                    })}
                                                                >
                                                                    <DlgBadgeIcon sx={{ fontSize: 12, color: dialogBadge.color }} />
                                                                    <Typography
                                                                        variant="caption"
                                                                        sx={{
                                                                            fontSize: '0.68rem',
                                                                            fontWeight: 700,
                                                                            color: dialogBadge.color,
                                                                            lineHeight: 1.2,
                                                                        }}
                                                                    >
                                                                        {dialogBadge.label}
                                                                    </Typography>
                                                                </Box>
                                                            );
                                                        })() : null}
                                                    </Box>

                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => openMenu(e, u)}
                                                        sx={(t) => ({
                                                            color: alpha(t.palette.primary.main, 0.6),
                                                            '&:hover': {
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                color: "primary.main",
                                                            },
                                                        })}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>

                                                    {menuUser && menuUser.id === u.id ? (
                                                        <SmartMenu
                                                            open={Boolean(menuAnchor)}
                                                            anchorEl={menuAnchor}
                                                            onClose={closeMenu}
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                            PaperProps={{
                                                                sx: (t) => ({
                                                                    borderRadius: 2,
                                                                    boxShadow: `0 8px 24px ${alpha(t.palette.primary.main, 0.15)}`,
                                                                }),
                                                            }}
                                                        >
                                                            {canUnfollowOption ? (
                                                                <MenuItem onClick={() => unfollowUser(u)}>Unfollow</MenuItem>
                                                            ) : null}

                                                            {canFollowBackOption ? (
                                                                <MenuItem onClick={() => followUser(u, true)}>
                                                                    Follow Back
                                                                </MenuItem>
                                                            ) : null}

                                                            {canFollowOption ? (
                                                                <MenuItem onClick={() => followUser(u, false)}>Follow</MenuItem>
                                                            ) : null}

                                                            <MenuItem onClick={() => goProfile(u)}>View Profile</MenuItem>
                                                            <MenuItem onClick={() => blockUser(u)} sx={{ color: 'error.main' }}>
                                                                Block User
                                                            </MenuItem>

                                                        </SmartMenu>
                                                    ) : null}
                                                </Paper>
                                            );
                                        })}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}

        </Box>
    );
});
