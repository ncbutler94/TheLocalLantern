import { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Box,
    Chip,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import StarIcon from "@mui/icons-material/Star";
import ShieldIcon from "@mui/icons-material/Shield";
import { useNavigate } from "react-router-dom";

import defaultAvatarSquare from "../../../../assets/profile/default_avatar.png";

/* ---- helpers ---- */
const safeStr = (v) => String(v ?? "").trim();

function isOwnerOrAdminMembership(vm) {
    const r = safeStr(vm?.role).toLowerCase();
    return ["owner", "admin", "moderator"].includes(r);
}

function normalizeLeadershipUser(raw) {
    if (!raw) return null;
    const id = Number(raw.id ?? raw.user_id);
    if (!Number.isFinite(id) || id <= 0) return null;
    const role = safeStr(raw.role);
    const username = safeStr(raw.username);
    let first_name = safeStr(raw.first_name);
    let last_name = safeStr(raw.last_name);
    if (!first_name && username) {
        const parts = username.split(" ").filter(Boolean);
        first_name = parts.slice(0, 1).join(" ");
        last_name = parts.slice(1).join(" ");
    }
    const handle = safeStr(raw.handle).replace(/^@+/, "");
    const avatar_url = safeStr(raw.avatar_url || raw.avatarUrl);
    const profile_picture = safeStr(raw.profile_picture || raw.profilePic);
    return { id, user_id: id, role, first_name, last_name, handle, avatar_url, profile_picture, public_id: raw.public_id ?? raw.publicId ?? null };
}

function safeName(u) {
    const f = safeStr(u?.first_name);
    const l = safeStr(u?.last_name);
    return [f, l].filter(Boolean).join(" ") || safeStr(u?.username) || "User";
}

function safeHandle(u) {
    const h = safeStr(u?.handle).replace(/^@+/, "");
    return h ? `@${h}` : "";
}

function safeAvatar(u) {
    return safeStr(u?.avatar_url) || safeStr(u?.profile_picture) || "";
}

function formatLocation(group) {
    const statewide = Boolean(group?.isStatewide || group?.is_statewide);
    if (statewide) return "Statewide Alabama";
    const city = safeStr(group?.city);
    const county = safeStr(group?.county);
    const countyLabel = county ? (county.toLowerCase().includes("county") ? county : `${county} County`) : "";
    if (city && countyLabel) return `${city}, ${countyLabel}`;
    return city || countyLabel || "";
}

function getVisibilityInfo(group) {
    const visRaw = String(group?.visibility || "").toLowerCase();
    const privateFlag = Boolean(group?.is_private ?? group?.isPrivate);
    const isHidden = visRaw === "hidden";
    const isPrivate = visRaw === "private" || privateFlag;
    return { isHidden, isPrivate, isPublic: !isHidden && !isPrivate };
}

/* ------------------------------------------------------------------ */
/*  SectionHeader                                                      */
/* ------------------------------------------------------------------ */
function SectionHeader({ icon, title }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box
                sx={(t) => ({
                    width: 30,
                    height: 30,
                    borderRadius: 1.75,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                })}
            >
                {icon}
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15.5, letterSpacing: "-0.01em" }}>
                {title}
            </Typography>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  InfoRow                                                            */
/* ------------------------------------------------------------------ */
function InfoRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 0.5 }}>
            <Box sx={(t) => ({ color: alpha(t.palette.text.primary, 0.4), display: "flex", flexShrink: 0 })}>
                {icon}
            </Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, opacity: 0.55, minWidth: 70 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                {value}
            </Typography>
        </Box>
    );
}

/* ================================================================== */
/*  MAIN EXPORT                                                        */
/* ================================================================== */
export default function GroupAboutPanel({ group, viewerMembership }) {
    const navigate = useNavigate();

    const groupId = Number(group?.id) || null;

    /* ---- Leadership fetch ---- */
    const [leadership, setLeadership] = useState([]);
    const [leadershipLoading, setLeadershipLoading] = useState(false);

    const ownerUser = useMemo(() => {
        const ownerId = Number(group?.created_by_user_id);
        if (!Number.isFinite(ownerId) || ownerId <= 0) return null;
        return {
            id: ownerId,
            user_id: ownerId,
            role: "Owner",
            first_name: safeStr(group?.owner_first_name),
            last_name: safeStr(group?.owner_last_name),
            handle: safeStr(group?.owner_handle).replace(/^@+/, ""),
            avatar_url: safeStr(group?.owner_avatar_url),
            profile_picture: safeStr(group?.owner_profile_picture),
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

    useEffect(() => {
        let mounted = true;
        const fetchLeadership = async () => {
            if (!groupId) return;
            // The Group Leadership card is shown to every viewer, so we use
            // the public /leadership endpoint rather than the admin-gated
            // /admin/admins one. Hidden-group privacy is enforced on the
            // backend (non-members get a 404).
            setLeadershipLoading(true);
            try {
                const res = await fetch(`/api/groups/${encodeURIComponent(String(groupId))}/leadership`, {
                    method: "GET",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });
                if (!mounted) return;
                if (!res.ok) { setLeadership([]); return; }
                const data = await res.json().catch(() => null);
                const adminsArr = Array.isArray(data?.admins) ? data.admins : [];
                setLeadership(adminsArr.map(normalizeLeadershipUser).filter(Boolean));
            } catch {
                if (mounted) setLeadership([]);
            } finally {
                if (mounted) setLeadershipLoading(false);
            }
        };
        fetchLeadership();
        return () => { mounted = false; };
    }, [groupId]);

    const leadershipRows = useMemo(() => {
        const out = [];
        if (ownerUser) out.push(ownerUser);
        const seen = new Set(out.map((x) => Number(x?.id)));
        (Array.isArray(leadership) ? leadership : []).forEach((u) => {
            const id = Number(u?.id);
            if (!Number.isFinite(id) || id <= 0 || seen.has(id)) return;
            seen.add(id);
            out.push(u);
        });
        return out;
    }, [ownerUser, leadership]);

    if (!group) return null;

    const description = safeStr(group.description);
    const aboutText = description || "No description has been added yet.";

    const locationLabel = formatLocation(group);
    const { isHidden, isPrivate } = getVisibilityInfo(group);
    const visibilityLabel = isHidden ? "Hidden" : isPrivate ? "Private" : "Public";
    const VisIcon = isHidden ? VisibilityOffOutlinedIcon : isPrivate ? LockOutlinedIcon : PublicOutlinedIcon;
    const categoryLabel = safeStr(group?.category_name) || safeStr(group?.category) || "";
    const memberCount = Number(group?.member_count ?? group?.memberCount ?? 0) || 0;

    const goToProfile = (u) => {
        const id = Number(u?.id);
        const routeId = Number.isFinite(id) && id > 0 ? String(id) : safeStr(u?.public_id);
        if (routeId) navigate(`/${encodeURIComponent(routeId)}`);
    };

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: { xs: 0, sm: 2 },
                px: { xs: 0, sm: 2.5 },
                py: { xs: 0, sm: 2.5 },
            }}
        >
            {/* ============ ABOUT (left) + DETAILS & LEADERSHIP (right) ============ */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
                    gap: { xs: 0, sm: 2 },
                    alignItems: "start",
                }}
            >
                {/* Description Card — borderless on mobile */}
                <Paper
                    elevation={0}
                    sx={(t) => ({
                        p: { xs: 2, sm: 2.75 },
                        borderRadius: { xs: 0, sm: 3 },
                        border: { xs: 'none', sm: "1px solid" },
                        borderBottom: { xs: '1px solid', sm: "1px solid" },
                        borderColor: alpha(t.palette.divider, 0.08),
                        bgcolor: "background.paper",
                    })}
                >
                    <SectionHeader icon={<InfoOutlinedIcon sx={{ fontSize: 17 }} />} title="About" />
                    <Typography
                        sx={(t) => ({
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                            color: alpha(t.palette.text.primary, 0.75),
                            fontSize: { xs: 13.5, sm: 14.5 },
                        })}
                    >
                        {aboutText}
                    </Typography>
                </Paper>

                {/* Right column: Details + Leadership stacked */}
                <Stack spacing={{ xs: 0, sm: 2 }}>
                    {/* Details Card — borderless on mobile */}
                    <Paper
                        elevation={0}
                        sx={(t) => ({
                            p: { xs: 2, sm: 2.75 },
                            borderRadius: { xs: 0, sm: 3 },
                            border: { xs: 'none', sm: "1px solid" },
                            borderBottom: { xs: '1px solid', sm: "1px solid" },
                            borderColor: alpha(t.palette.divider, 0.08),
                            bgcolor: "background.paper",
                        })}
                    >
                        <Typography sx={{ fontWeight: 800, fontSize: 15.5, mb: 1.5, letterSpacing: "-0.01em" }}>
                            Details
                        </Typography>
                        <Stack spacing={0.5}>
                            <InfoRow
                                icon={<VisIcon sx={{ fontSize: 17 }} />}
                                label="Visibility"
                                value={visibilityLabel}
                            />
                            {categoryLabel && (
                                <InfoRow
                                    icon={<CategoryOutlinedIcon sx={{ fontSize: 17 }} />}
                                    label="Category"
                                    value={categoryLabel}
                                />
                            )}
                            {locationLabel && (
                                <InfoRow
                                    icon={<LocationOnRoundedIcon sx={{ fontSize: 17 }} />}
                                    label="Location"
                                    value={locationLabel}
                                />
                            )}
                            <InfoRow
                                icon={<GroupsOutlinedIcon sx={{ fontSize: 17 }} />}
                                label="Members"
                                value={memberCount.toLocaleString()}
                            />
                        </Stack>
                    </Paper>

                    {/* Leadership Card — borderless on mobile */}
                    {leadershipRows.length > 0 && (
                        <Paper
                            elevation={0}
                            sx={(t) => ({
                                p: { xs: 2, sm: 2.75 },
                                borderRadius: { xs: 0, sm: 3 },
                                border: { xs: 'none', sm: "1px solid" },
                                borderBottom: { xs: '1px solid', sm: "1px solid" },
                                borderColor: alpha(t.palette.divider, 0.08),
                                bgcolor: "background.paper",
                            })}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                                <SectionHeader
                                    icon={<GroupsOutlinedIcon sx={{ fontSize: 17 }} />}
                                    title="Group Leadership"
                                />
                                {leadershipLoading && <CircularProgress size={16} />}
                            </Box>

                            <Stack spacing={1}>
                                {leadershipRows.map((u) => {
                                    const role = safeStr(u?.role);
                                    const isOwner = role.toLowerCase() === "owner";

                                    return (
                                        <Box
                                            key={String(u?.id)}
                                            onClick={() => goToProfile(u)}
                                            sx={(t) => ({
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1.5,
                                                p: 1.25,
                                                borderRadius: 2.5,
                                                border: "1px solid",
                                                borderColor: alpha(t.palette.divider, 0.08),
                                                cursor: "pointer",
                                                transition: "all 160ms ease",
                                                "&:hover": {
                                                    bgcolor: alpha(t.palette.primary.main, 0.03),
                                                    borderColor: alpha(t.palette.primary.main, 0.15),
                                                },
                                            })}
                                        >
                                            <Avatar
                                                src={safeAvatar(u)}
                                                variant="rounded"
                                                imgProps={{
                                                    onError: (e) => { e.currentTarget.src = defaultAvatarSquare; },
                                                }}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 1.75,
                                                    border: "1px solid rgba(0,0,0,0.06)",
                                                }}
                                            />
                                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <Typography
                                                        noWrap
                                                        sx={{ fontWeight: 750, fontSize: 13.5, lineHeight: 1.2 }}
                                                        title={safeName(u)}
                                                    >
                                                        {safeName(u)}
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        icon={isOwner
                                                            ? <StarIcon sx={{ fontSize: 11 }} />
                                                            : <ShieldIcon sx={{ fontSize: 11 }} />
                                                        }
                                                        label={role ? role.charAt(0).toUpperCase() + role.slice(1) : role}
                                                        sx={(t) => ({
                                                            height: 20,
                                                            fontWeight: 800,
                                                            fontSize: 10.5,
                                                            bgcolor: isOwner
                                                                ? alpha(t.palette.warning.main, 0.12)
                                                                : alpha(t.palette.primary.main, 0.08),
                                                            color: isOwner
                                                                ? t.palette.warning.dark
                                                                : t.palette.primary.main,
                                                            "& .MuiChip-icon": {
                                                                color: "inherit",
                                                                ml: 0.5,
                                                            },
                                                            "& .MuiChip-label": { px: 0.75 },
                                                        })}
                                                    />
                                                </Stack>
                                                {safeHandle(u) && (
                                                    <Typography
                                                        noWrap
                                                        sx={{ fontSize: 12, fontWeight: 600, opacity: 0.5, lineHeight: 1.3, mt: 0.15 }}
                                                    >
                                                        {safeHandle(u)}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}
