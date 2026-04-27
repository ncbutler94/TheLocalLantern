// src/pages/community/groups/groupPage/GroupMembersPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Divider,
    Drawer,
    Fade,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PersonIcon from "@mui/icons-material/Person";
import CheckIcon from "@mui/icons-material/Check";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import StarIcon from "@mui/icons-material/Star";
import ShieldIcon from "@mui/icons-material/Shield";

import UserCardPopover from "../../../../components/UserCardPopover";
import { useAuth } from "../../../../components/AuthModalContext";
import { useActiveAccount } from "../../../../components/AccountContext";
import { canViewMembers, safeName } from "./groupPageUtils";

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

function safeAvatar(u) {
    const a = String(u?.avatar_url || u?.profile_picture || "").trim();
    if (!a || a.includes('default_avatar') || a.includes('default_business') || a.includes('default_logo')) return "";
    return a;
}

function safeHandle(u) {
    const h = String(u?.handle || "").trim().replace(/^@+/, "");
    return h ? `@${h}` : "";
}

function toLocationText(u) {
    const city = String(u?.home_city || u?.city || "").trim();
    const county = String(u?.home_county || u?.county || "").trim();
    const parts = [city, county].filter(Boolean);
    return parts.join(", ").trim();
}

function isSelfUser(viewerUser, u) {
    if (!viewerUser || !u) return false;
    const idMatch = Number(viewerUser?.id) === Number(u?.id);
    const h1 = String(viewerUser?.handle || "").trim().replace(/^@+/, "").toLowerCase();
    const h2 = String(u?.handle || "").trim().replace(/^@+/, "").toLowerCase();
    const handleMatch = Boolean(h1 && h2 && h1 === h2);
    return idMatch || handleMatch;
}

function isOwnerOrAdminMembership(viewerMembership) {
    const status = String(viewerMembership?.status || "").toLowerCase();
    if (status !== "joined") return false;
    const role = String(viewerMembership?.role || "").toLowerCase();
    return role === "owner" || role === "admin";
}

function normalizeLeadershipUser(raw) {
    if (!raw || typeof raw !== "object") return null;

    const id = Number(raw.user_id ?? raw.id);
    if (!Number.isFinite(id) || id <= 0) return null;

    const roleRaw = String(raw.role || "").toLowerCase();
    const role = roleRaw === "owner" ? "Owner" : roleRaw === "admin" ? "Admin" : "";

    // Backend returns `username` as "First Last" in some endpoints.
    const username = String(raw.username || "").trim();
    let first_name = String(raw.first_name || "").trim();
    let last_name = String(raw.last_name || "").trim();

    if (!first_name && username) {
        const parts = username.split(" ").filter(Boolean);
        first_name = parts.slice(0, 1).join(" ");
        last_name = parts.slice(1).join(" ");
    }

    const handle = String(raw.handle || "").trim().replace(/^@+/, "");
    const avatar_url = String(raw.avatar_url || raw.avatarUrl || "").trim();
    const profile_picture = String(raw.profile_picture || raw.profilePic || "").trim();

    return {
        id,
        user_id: id,
        role,
        first_name,
        last_name,
        handle,
        avatar_url,
        profile_picture,
        public_id: raw.public_id ?? raw.publicId ?? null,
    };
}

export default function GroupMembersPanel({
                                              embedded = false,
                                              group,
                                              viewerMembership,
                                              viewerUser, // optional (used for isSelf + auth gating). If not provided, we assume auth is handled elsewhere.
                                              loadingGroup,
                                              renderPrivateGate,

                                              // list
                                              members,
                                              loadingMembers,
                                              membersCountText,

                                              // search
                                              memberSearchText,
                                              setMemberSearchText,
                                              onApplySearch,
                                              onClearSearch,

                                          }) {
    const Root = embedded ? Box : Paper;
    const memberCountLabel = membersCountText || "";
    const groupId = Number(group?.id) || null;

    const _gpTheme = useTheme();
    const isMobile = useMediaQuery(_gpTheme.breakpoints.down('md'));

    const isNonPersonalAccount = useIsNonPersonalAccount();
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();

    // Account headers for account-aware follow API calls (matches UserCardPopover pattern)
    const accountHeaders = useMemo(() => {
        if (isBusinessAccount && activeBusinessId) {
            return { 'x-account-type': 'business', 'x-business-id': String(activeBusinessId) };
        }
        if (isArtistAccount && activeArtistId) {
            return { 'x-account-type': 'artist', 'x-artist-id': String(activeArtistId) };
        }
        return { 'x-account-type': 'personal' };
    }, [isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    const navigate = useNavigate();

    const goMemberProfileLocal = (u) => {
        const id = Number(u?.id);
        const routeId = Number.isFinite(id) && id > 0 ? String(id) : String(u?.public_id || "").trim();
        if (!routeId) return;
        navigate(`/${encodeURIComponent(routeId)}`);
    };

    const membersLoadStartedRef = useRef(false);
    const [hasLoadedMembers, setHasLoadedMembers] = useState(false);

    const [followOverrides, setFollowOverrides] = useState(() => new Map());
    const [hiddenPostIds, setHiddenPostIds] = useState(() => new Set());
    const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());

    // Social-style user popover
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const [mobileUserDrawerOpen, setMobileUserDrawerOpen] = useState(false);

    const stickyWrapRef = useRef(null);

    const [isPinned, setIsPinned] = useState(false);
    const [showTop, setShowTop] = useState(false);


    const blocked = !loadingGroup && !canViewMembers(group, viewerMembership);
    const { user: authUser } = useAuth();

    // If GroupPage does not pass viewerUser, fall back to auth context.
    // If it passes null, treat that as "not logged in".
    const effectiveViewerUser = viewerUser !== undefined ? viewerUser : authUser;
    const isLoggedIn = Boolean(effectiveViewerUser);

    const [leadership, setLeadership] = useState([]);
    const [leadershipLoading, setLeadershipLoading] = useState(false);

    const openAuthUI = () => {
        try {
            window.dispatchEvent(new CustomEvent("open-auth-modal"));
        } catch {
            // no-op
        }
    };

    const requireAuth = async (cb) => {
        if (isLoggedIn) return cb?.();
        openAuthUI();
        return undefined;
    };

    const closeUserCard = () => {
        setUserAnchor(null);
        setUserForCard(null);
        setMobileUserDrawerOpen(false);
    };

    const openUserCard = (anchorEl, u) => {
        const uid = Number(u?.id);
        const isHiddenLocal = Number.isFinite(uid) ? hiddenPostIds.has(uid) : false;
        const isBlockedLocal = Number.isFinite(uid) ? blockedUserIds.has(uid) : false;

        const userData = {
            id: u?.id,
            public_id: u?.public_id,
            first_name: u?.first_name,
            last_name: u?.last_name,
            handle: String(u?.handle || "").replace(/^@+/, ""),
            avatar_url: u?.avatar_url || u?.profile_picture,
            profile_picture: u?.profile_picture,
            hiddenPostsByMe: isHiddenLocal,
            blockedByMe: isBlockedLocal,
        };

        setUserForCard(userData);

        if (isMobile) {
            setUserAnchor(null);
            setMobileUserDrawerOpen(true);
        } else {
            setUserAnchor(anchorEl);
            setMobileUserDrawerOpen(false);
        }
    };

    const getIsFollowing = (u) => {
        const id = Number(u?.id);
        if (!Number.isFinite(id)) return false;
        if (followOverrides.has(id)) return Boolean(followOverrides.get(id));
        return Boolean(u?.is_following);
    };

    const followUser = async (u, forceFollow) => {
        const id = Number(u?.id);
        if (!Number.isFinite(id)) return;

        await requireAuth(async () => {
            const action = forceFollow ? "follow" : "unfollow";

            // Use the same /api/follows/toggle endpoint as UserCardPopover
            // with account headers so follows work from business/artist accounts
            const res = await fetch(`/api/follows/toggle`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...accountHeaders,
                },
                body: JSON.stringify({
                    target_id: id,
                    target_type: "personal",
                    action,
                }),
            });

            if (!res.ok) return;

            setFollowOverrides((prev) => {
                const next = new Map(prev);
                next.set(id, forceFollow);
                return next;
            });
        });
    };

    const rawMembers = useMemo(() => (Array.isArray(members) ? members : []), [members]);

    // Leadership map for quick role chips on rows
    const leaderRoleById = useMemo(() => {
        const m = new Map();
        (Array.isArray(leadership) ? leadership : []).forEach((u) => {
            const id = Number(u?.id);
            const role = String(u?.role || "").trim();
            if (Number.isFinite(id) && id > 0 && role) m.set(id, role);
        });

        // Always include the owner from group payload (even if leadership fetch isn't available).
        const ownerId = Number(group?.created_by_user_id);
        if (Number.isFinite(ownerId) && ownerId > 0 && !m.has(ownerId)) m.set(ownerId, "Owner");

        return m;
    }, [leadership, group?.created_by_user_id]);

    // Sort members: Owner first, then Admins, then regular members
    const sortedMembers = useMemo(() => {
        const roleOrder = (id) => {
            const role = leaderRoleById.get(Number(id)) || "";
            if (role === "Owner") return 0;
            if (role === "Admin") return 1;
            return 2;
        };
        return [...rawMembers].sort((a, b) => roleOrder(a?.id) - roleOrder(b?.id));
    }, [rawMembers, leaderRoleById]);

    // Build a compact "owner" user from group payload for everyone.
    const ownerUser = useMemo(() => {
        const ownerId = Number(group?.created_by_user_id);
        if (!Number.isFinite(ownerId) || ownerId <= 0) return null;

        return {
            id: ownerId,
            user_id: ownerId,
            role: "Owner",
            first_name: String(group?.owner_first_name || "").trim(),
            last_name: String(group?.owner_last_name || "").trim(),
            handle: String(group?.owner_handle || "").trim().replace(/^@+/, ""),
            avatar_url: String(group?.owner_avatar_url || "").trim(),
            profile_picture: String(group?.owner_profile_picture || "").trim(),
            public_id: null,
        };
    }, [
        group?.created_by_user_id,
        group?.owner_first_name,
        group?.owner_last_name,
        group?.owner_handle,
        group?.owner_avatar_url,
        group?.owner_profile_picture,
    ]);

    // Fetch owner/admins via the public leadership endpoint so every viewer
    // sees the full leadership list (owner + admins). Hidden-group privacy is
    // enforced server-side — non-members of a hidden group get a 404.
    useEffect(() => {
        let mounted = true;

        const fetchLeadership = async () => {
            if (!groupId) return;

            setLeadershipLoading(true);
            try {
                const res = await fetch(`/api/groups/${encodeURIComponent(String(groupId))}/leadership`, {
                    method: "GET",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });

                if (!mounted) return;

                if (!res.ok) {
                    setLeadership([]);
                    return;
                }

                const data = await res.json().catch(() => null);
                const adminsArr = Array.isArray(data?.admins) ? data.admins : [];
                const normalized = adminsArr
                    .map(normalizeLeadershipUser)
                    .filter(Boolean);

                setLeadership(normalized);
            } catch {
                if (!mounted) return;
                setLeadership([]);
            } finally {
                if (mounted) setLeadershipLoading(false);
            }
        };

        fetchLeadership();

        return () => {
            mounted = false;
        };
    }, [groupId]);

    useEffect(() => {
        if (loadingMembers) {
            membersLoadStartedRef.current = true;
            return;
        }
        if (membersLoadStartedRef.current && !hasLoadedMembers) {
            setHasLoadedMembers(true);
        }
    }, [loadingMembers, hasLoadedMembers]);

    // Keep Members list in sync with Social popover hide/block actions (UserCardPopover dispatches events)
    useEffect(() => {
        const onHiddenChanged = (e) => {
            const userId = Number(e?.detail?.userId);
            const hidden = Boolean(e?.detail?.hidden);
            if (!Number.isFinite(userId) || userId <= 0) return;

            setHiddenPostIds((prev) => {
                const next = new Set(prev);
                if (hidden) next.add(userId);
                else next.delete(userId);
                return next;
            });
        };

        const onBlockedChanged = (e) => {
            const userId = Number(e?.detail?.userId);
            const isBlocked = Boolean(e?.detail?.blocked);
            if (!Number.isFinite(userId) || userId <= 0) return;

            setBlockedUserIds((prev) => {
                const next = new Set(prev);
                if (isBlocked) next.add(userId);
                else next.delete(userId);
                return next;
            });

            // If you block someone, we also treat their posts as hidden (matches popover behavior)
            setHiddenPostIds((prev) => {
                const next = new Set(prev);
                if (isBlocked) next.add(userId);
                return next;
            });
        };

        window.addEventListener("ll:user:hidden-changed", onHiddenChanged);
        window.addEventListener("ll:user:blocked-changed", onBlockedChanged);
        return () => {
            window.removeEventListener("ll:user:hidden-changed", onHiddenChanged);
            window.removeEventListener("ll:user:blocked-changed", onBlockedChanged);
        };
    }, []);

    // Sticky header shadow + back-to-top visibility
    useEffect(() => {
        if (blocked) return undefined;

        const onScroll = () => {
            const el = stickyWrapRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const pinned = rect.top <= 1;
            setIsPinned(pinned);
            setShowTop(pinned);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [blocked]);

    const isSelf = useMemo(() => {
        if (!effectiveViewerUser || !userForCard) return false;
        const idMatch = Number(effectiveViewerUser?.id) === Number(userForCard?.id);
        const handleMatch =
            effectiveViewerUser?.handle &&
            userForCard?.handle &&
            String(effectiveViewerUser.handle).toLowerCase() === String(userForCard.handle).toLowerCase();
        return idMatch || Boolean(handleMatch);
    }, [effectiveViewerUser, userForCard]);

    const isFollowingForCard = useMemo(() => {
        if (!userForCard) return false;
        return getIsFollowing(userForCard);
    }, [userForCard, followOverrides]);

    const leadershipRows = useMemo(() => {
        const out = [];

        if (ownerUser) out.push(ownerUser);

        // If viewer is owner/admin, include fetched admin list (dedup, and keep owner first).
        const seen = new Set(out.map((x) => Number(x?.id)));
        (Array.isArray(leadership) ? leadership : []).forEach((u) => {
            const id = Number(u?.id);
            if (!Number.isFinite(id) || id <= 0) return;
            if (seen.has(id)) return;
            seen.add(id);
            out.push(u);
        });

        return out;
    }, [ownerUser, leadership]);

    if (blocked) {
        return renderPrivateGate?.("members") || null;
    }

    return (
        <>
            <Root
                sx={(t) => ({
                    borderRadius: 0,
                    mt: 0,
                    overflow: "visible",
                    border: embedded ? "none" : "1px solid",
                    borderColor: embedded ? "transparent" : alpha(t.palette.primary.main, 0.12),
                    bgcolor: embedded ? "transparent" : "background.paper",
                    boxShadow: embedded ? "none" : `0 18px 48px ${alpha(t.palette.common.black, 0.08)}`,
                    position: "relative",
                })}
            >
                {/* Sticky controls */}
                <Box
                    ref={stickyWrapRef}
                    sx={(t) => ({
                        position: "sticky",
                        top: 0,
                        zIndex: 1200,
                        bgcolor: "background.paper",
                        transform: "translateZ(0)",
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.1),
                        boxShadow: isPinned ? `0 4px 16px ${alpha(t.palette.common.black, 0.08)}` : "none",
                    })}
                >
                    <Box sx={{ p: { xs: 1.25, sm: 2.5 } }}>
                        <Stack spacing={{ xs: 0.75, sm: 1.35 }}>
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={1}
                                sx={{ minWidth: 0 }}
                            >
                                <Typography sx={{ fontWeight: 1150, fontSize: { xs: 16, sm: 18 }, minWidth: 0 }}>
                                    Members{" "}
                                    <Typography component="span" sx={{ opacity: 0.65, fontWeight: 900 }}>
                                        {memberCountLabel ? `(${memberCountLabel})` : ""}
                                    </Typography>
                                </Typography>

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                                    {/* Inline "Back to top" when pinned */}
                                    <Fade in={isPinned} unmountOnExit>
                                        <Tooltip title="Back to top">
                                            <IconButton
                                                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 38,
                                                    height: 38,
                                                    border: "1px solid",
                                                    borderColor: alpha(t.palette.primary.main, 0.18),
                                                    bgcolor: alpha(t.palette.primary.main, 0.04),
                                                })}
                                                aria-label="Back to top"
                                            >
                                                <ArrowUpwardIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Fade>
                                </Stack>
                            </Stack>

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={{ xs: 1, sm: 1.5 }}
                                alignItems={{ xs: "stretch", sm: "center" }}
                                justifyContent="space-between"
                            >
                                <TextField
                                    value={memberSearchText}
                                    onChange={(e) => setMemberSearchText(String(e.target.value || ""))}
                                    placeholder="Search members…"
                                    size="small"
                                    fullWidth
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            onApplySearch?.();
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        minWidth: { xs: "100%", sm: 340 },
                                        "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "background.paper" },
                                    }}
                                />

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                        justifyContent: { xs: "flex-end", sm: "flex-start" },
                                        ml: { xs: 0, sm: 1.75 },
                                    }}
                                >
                                    <IconButton
                                        onClick={onApplySearch}
                                        sx={(t) => ({
                                            width: 38,
                                            height: 38,
                                            bgcolor: t.palette.primary.main,
                                            color: "common.white",
                                            borderRadius: 999,
                                            "&:hover": {
                                                bgcolor: t.palette.primary.dark,
                                            },
                                        })}
                                        aria-label="Search"
                                    >
                                        <SearchIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                    <Button
                                        variant="outlined"
                                        onClick={onClearSearch}
                                        sx={{
                                            borderRadius: 999,
                                            textTransform: "none",
                                            fontWeight: 900,
                                            px: 2.25,
                                            height: 38,
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    </Box>

                    <Divider sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.1) })} />
                </Box>

                {/* Members list */}
                <Box sx={{ p: { xs: 0, sm: 2.5 } }}>
                    {!hasLoadedMembers ? (
                        <Box
                            sx={{
                                minHeight: 240,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                py: 6,
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <CircularProgress size={26} />
                                <Typography sx={{ fontWeight: 800, opacity: 0.8 }}>Loading members…</Typography>
                            </Stack>
                        </Box>
                    ) : sortedMembers?.length ? (
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 480px))" },
                                justifyContent: { md: "center" },
                                columnGap: 3,
                                rowGap: { xs: 0, sm: 1.5 },
                                pb: 1,
                            }}
                        >
                            {sortedMembers.map((u) => {
                                const id = Number(u?.id);
                                const name = safeName(u);
                                const handle = safeHandle(u);
                                const avatar = safeAvatar(u);
                                const locText = toLocationText(u);
                                const isFollowing = getIsFollowing(u);

                                const roleChip = leaderRoleById.get(Number(id)) || "";
                                const isSelfRow = isSelfUser(effectiveViewerUser, u);

                                return (
                                    <Fade key={String(id || handle || name)} in timeout={220} appear>
                                        <Paper
                                            variant="outlined"
                                            sx={(t) => ({
                                                p: { xs: 1.5, sm: 2 },
                                                borderRadius: { xs: 0, sm: 3 },
                                                width: "100%",
                                                bgcolor: "background.paper",
                                                borderColor: { xs: 'transparent', sm: alpha(t.palette.divider, 0.5) },
                                                borderBottom: { xs: `1px solid ${alpha(t.palette.divider, 0.1)}`, sm: `1px solid ${alpha(t.palette.divider, 0.5)}` },
                                                borderLeft: { xs: 'none', sm: `1px solid ${alpha(t.palette.divider, 0.5)}` },
                                                borderRight: { xs: 'none', sm: `1px solid ${alpha(t.palette.divider, 0.5)}` },
                                                borderTop: { xs: 'none', sm: `1px solid ${alpha(t.palette.divider, 0.5)}` },
                                                boxShadow: "none",
                                                cursor: "pointer",
                                                transition: "transform .12s ease, box-shadow .12s ease, border-color .12s ease",
                                                "&:hover": {
                                                    transform: "none",
                                                    boxShadow: { xs: 'none', sm: `0 4px 16px ${alpha(t.palette.common.black, 0.06)}` },
                                                    borderColor: { xs: 'transparent', sm: alpha(t.palette.primary.main, 0.3) },
                                                },
                                            })}
                                            onClick={() => goMemberProfileLocal(u)}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                                                <Avatar
                                                    src={avatar || undefined}
                                                    variant="rounded"
                                                    sx={(t) => ({
                                                        width: 62,
                                                        height: 62,
                                                        borderRadius: 2.5,
                                                        border: "1px solid rgba(0,0,0,0.08)",
                                                        boxShadow: "0 4px 12px rgba(2,6,23,0.06)",
                                                        bgcolor: avatar ? undefined : alpha(t.palette.primary.main, 0.08),
                                                        color: avatar ? undefined : t.palette.primary.main,
                                                        '& .MuiAvatar-img': { objectFit: 'cover' },
                                                    })}
                                                >
                                                    {!avatar && <PersonRoundedIcon sx={{ fontSize: 34 }} />}
                                                </Avatar>

                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                        <Typography noWrap sx={{ fontWeight: 950, minWidth: 0 }} title={name}>
                                                            {name}
                                                        </Typography>

                                                        {roleChip ? (
                                                            <Chip
                                                                size="small"
                                                                icon={
                                                                    roleChip === "Owner"
                                                                        ? <StarIcon sx={{ fontSize: 13 }} />
                                                                        : <ShieldIcon sx={{ fontSize: 13 }} />
                                                                }
                                                                label={roleChip}
                                                                sx={(t) => {
                                                                    const styles = roleChip === "Owner"
                                                                        ? {
                                                                            background: `linear-gradient(135deg, ${t.palette.secondary.main} 0%, ${t.palette.secondary.dark} 100%)`,
                                                                            boxShadow: `0 2px 8px ${alpha(t.palette.secondary.main, 0.28)}`,
                                                                        }
                                                                        : {
                                                                            background: `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
                                                                            boxShadow: `0 2px 8px ${alpha(t.palette.primary.main, 0.28)}`,
                                                                        };
                                                                    return {
                                                                        height: 22,
                                                                        borderRadius: 999,
                                                                        fontWeight: 800,
                                                                        fontSize: 11,
                                                                        color: 'common.white',
                                                                        border: 'none',
                                                                        ...styles,
                                                                        '& .MuiChip-label': { px: 0.75 },
                                                                        '& .MuiChip-icon': { color: 'common.white', ml: 0.5 },
                                                                    };
                                                                }}
                                                            />
                                                        ) : null}
                                                    </Stack>

                                                    <Typography
                                                        noWrap
                                                        sx={{ opacity: 0.75, fontWeight: 750, fontSize: 13 }}
                                                        title={handle}
                                                    >
                                                        {handle}
                                                    </Typography>

                                                    {locText ? (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            noWrap
                                                            sx={{ mt: 0.25, display: "block" }}
                                                            title={locText}
                                                        >
                                                            {locText}
                                                        </Typography>
                                                    ) : null}
                                                </Box>

                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {!isSelfRow ? (
                                                        <Tooltip title={isFollowing ? "Following" : "Follow"}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    followUser(u, !isFollowing);
                                                                }}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                onTouchStart={(e) => e.stopPropagation()}
                                                                sx={(t) => ({
                                                                    width: 36,
                                                                    height: 36,
                                                                    border: "1px solid",
                                                                    borderColor: isFollowing
                                                                        ? alpha(t.palette.primary.main, 0.25)
                                                                        : alpha(t.palette.primary.main, 0.35),
                                                                    color: t.palette.primary.main,
                                                                    bgcolor: isFollowing
                                                                        ? alpha(t.palette.primary.main, 0.08)
                                                                        : "transparent",
                                                                    transition: "all 160ms ease",
                                                                    position: "relative",
                                                                    "&:hover": {
                                                                        borderColor: t.palette.primary.main,
                                                                        bgcolor: alpha(t.palette.primary.main, 0.1),
                                                                    },
                                                                })}
                                                                aria-label={isFollowing ? "Following" : "Follow"}
                                                            >
                                                                {isFollowing ? (
                                                                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <PersonIcon sx={{ fontSize: 18 }} />
                                                                        <CheckIcon sx={(t) => ({
                                                                            fontSize: 11,
                                                                            position: 'absolute',
                                                                            bottom: -4,
                                                                            right: -6,
                                                                            color: t.palette.primary.main,
                                                                            fontWeight: 900,
                                                                        })} />
                                                                    </Box>
                                                                ) : (
                                                                    <PersonAddAlt1Icon sx={{ fontSize: 18 }} />
                                                                )}
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : null}

                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            openUserCard(e.currentTarget, u);
                                                        }}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onTouchStart={(e) => e.stopPropagation()}
                                                        aria-label="Member options"
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                        }}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Fade>
                                );
                            })}
                        </Box>
                    ) : (
                        <Paper
                            variant="outlined"
                            sx={(t) => ({
                                borderRadius: 4,
                                borderColor: alpha(t.palette.primary.main, 0.12),
                                p: 3,
                                textAlign: "center",
                                bgcolor: alpha(t.palette.primary.main, 0.02),
                            })}
                        >
                            <Typography sx={{ fontWeight: 950, fontSize: 18, mb: 0.5 }}>No members found</Typography>
                            <Typography sx={{ opacity: 0.8, fontWeight: 650 }}>Try a different search.</Typography>
                        </Paper>
                    )}

                </Box>
            </Root>

            {/* Desktop: Social-style user popover */}
            {!isMobile && (
                <UserCardPopover
                    anchorEl={userAnchor}
                    onClose={closeUserCard}
                    user={userForCard}
                    isSelf={isSelf}
                    following={isFollowingForCard}
                    allowUnfollow
                    onFollow={(u) => followUser(u, true)}
                    onUnfollow={(u) => followUser(u, false)}
                    onViewProfile={(u) => {
                        closeUserCard();
                        goMemberProfileLocal(u);
                    }}
                    layoutVariant="social"
                />
            )}

            {/* Mobile: bottom sheet user card — flush at bottom of screen */}
            {isMobile && (
                <Drawer
                    anchor="bottom"
                    open={mobileUserDrawerOpen && !!userForCard}
                    onClose={closeUserCard}
                    PaperProps={{
                        sx: {
                            borderRadius: '16px 16px 0 0',
                            overflow: 'hidden',
                        },
                    }}
                    ModalProps={{ keepMounted: false }}
                >
                    {userForCard && (() => {
                        const cardName = [userForCard.first_name, userForCard.last_name].filter(Boolean).join(' ') || 'User';
                        const cardHandle = userForCard.handle ? `@${userForCard.handle.replace(/^@+/, '')}` : '';
                        const cardAvatar = userForCard.avatar_url || userForCard.profile_picture || '';
                        const cardIsFollowing = isFollowingForCard;

                        return (
                            <Box sx={{ px: 2.5, pt: 1, pb: 3 }}>
                                {/* Drag handle */}
                                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                                    <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
                                </Box>

                                {/* User info */}
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <Avatar
                                        src={cardAvatar || undefined}
                                        sx={(t) => ({
                                            width: 56,
                                            height: 56,
                                            border: '2px solid',
                                            borderColor: alpha(t.palette.divider, 0.12),
                                            bgcolor: cardAvatar ? undefined : alpha(t.palette.primary.main, 0.08),
                                            color: cardAvatar ? undefined : t.palette.primary.main,
                                        })}
                                    >
                                        {!cardAvatar && <PersonRoundedIcon sx={{ fontSize: 30 }} />}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: 17, lineHeight: 1.2 }}>{cardName}</Typography>
                                        {cardHandle && (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: 13 }}>
                                                {cardHandle}
                                            </Typography>
                                        )}
                                    </Box>
                                </Stack>

                                {/* Actions */}
                                <Stack spacing={1}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disableElevation
                                        onClick={() => {
                                            closeUserCard();
                                            goMemberProfileLocal(userForCard);
                                        }}
                                        sx={(t) => ({
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 800,
                                            fontSize: 15,
                                            py: 1.25,
                                            background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${alpha(t.palette.primary.dark, 0.9)} 100%)`,
                                        })}
                                    >
                                        View Profile
                                    </Button>

                                    {!isSelf && (
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => {
                                                followUser(userForCard, !cardIsFollowing);
                                                closeUserCard();
                                            }}
                                            startIcon={cardIsFollowing
                                                ? <CheckIcon sx={{ fontSize: 18 }} />
                                                : <PersonAddAlt1Icon sx={{ fontSize: 18 }} />
                                            }
                                            sx={(t) => ({
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 15,
                                                py: 1.1,
                                                borderColor: cardIsFollowing
                                                    ? alpha(t.palette.primary.main, 0.3)
                                                    : alpha(t.palette.primary.main, 0.5),
                                                color: t.palette.primary.main,
                                                bgcolor: cardIsFollowing
                                                    ? alpha(t.palette.primary.main, 0.06)
                                                    : 'transparent',
                                            })}
                                        >
                                            {cardIsFollowing ? 'Following' : 'Follow'}
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        );
                    })()}
                </Drawer>
            )}
        </>
    );
}
