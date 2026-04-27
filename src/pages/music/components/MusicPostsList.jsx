import React, { useState, useEffect, useRef, useCallback } from "react";
import { secureFetch } from "../../../utils/secureFetch";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    Chip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    IconButton,
    Link,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha as alphaColor, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CloseIcon from "@mui/icons-material/Close";

import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";
import ActionBar from "../../../components/ActionBar";
import ReportContentDialog from "../../../components/ReportContentDialog";
import PulsingDots from "../../../components/PulsingDots";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import { ensureListStaggerKeyframes, getListStaggerSx } from "../../../themes/theme";
import { useActiveAccount } from "../../../components/AccountContext";
import { stripHtml } from "../../../utils/richTextUtils";
import RichTextDisplay from "../../../components/RichTextDisplay";

/**
 * MusicPostsList
 * - Renders a grid of music-artist post cards in the same visual language as PostList
 * - Each card has: hoverable user section (opens UserCardPopover), category chip,
 *   title, description, location, ActionBar footer
 * - Clicking a card body calls onCardClick (opens detail in right panel)
 *
 * Intended location:
 *   src/pages/music/components/MusicPostsList.jsx
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const timeAgoCompact = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return "";
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return "1m ago";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}hr ago`;
    const dys = Math.floor(h / 24);
    if (dys < 7) return `${dys}d ago`;
    const w = Math.floor(dys / 7);
    if (w < 5) return `${w}wk ago`;
    const mo = Math.floor(dys / 30);
    if (mo < 12) return `${mo}mo ago`;
    const y = Math.floor(dys / 365);
    return `${y}yr ago`;
};

const WORD_LIMIT = 28;
const CHAR_LIMIT = 240;

function truncateDescription(desc) {
    const trimmed = String(desc || "").trim();
    if (!trimmed) return { preview: "", long: false };
    const words = trimmed.split(/\s+/).filter(Boolean);
    const longByWords = words.length > WORD_LIMIT;
    const longByChars = trimmed.length > CHAR_LIMIT;
    const long = longByWords || longByChars;
    const preview = !long
        ? trimmed
        : longByWords
            ? words.slice(0, WORD_LIMIT).join(" ")
            : trimmed.slice(0, CHAR_LIMIT).trimEnd();
    return { preview, long };
}

function extractPhotos(post) {
    if (!post) return [];
    const candidates = [
        post.photos,
        post.photo_urls,
        post.photoUrls,
    ];
    for (const c of candidates) {
        if (Array.isArray(c) && c.length > 0) {
            return c.filter((p) => typeof p === "string" && p && p !== "null");
        }
    }
    // Check single-value fields (including music post mediaUrl)
    const oneOff = post.media_url || post.mediaUrl || post.photo_url || post.cover_url || post.coverUrl || post.image_url || "";
    if (typeof oneOff === "string" && oneOff.trim()) {
        // mediaUrl can be a JSON array string
        try {
            const parsed = JSON.parse(oneOff);
            if (Array.isArray(parsed)) return parsed.filter((u) => typeof u === "string" && u);
        } catch {
            // not JSON, treat as single URL
        }
        return [oneOff.trim()];
    }
    return [];
}

// Stable empty array to avoid creating new references on every render
const EMPTY_POSTS = [];

// ─── Single Post Card ────────────────────────────────────────────────────────

export function MusicPostCardItem({
                                      post,
                                      user,
                                      hoveredId,
                                      setHoveredId,
                                      onCardClick,
                                      onOpenUserCard,
                                      onEditPost,
                                      onDeletePost,
                                      onOpenShare,
                                      onLocationClick,
                                      onPostHidden,
                                      onHideArtistPosts,
                                      selectedId,
                                      selectable,
                                      popupMode = false,
                                      renderBeforeActions = null,
                                      flat = false,
                                  }) {
    const [avatarErrored, setAvatarErrored] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Edit history dialog
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    // Edit-limit state
    const [editLimitReached, setEditLimitReached] = useState(false);
    const [editLimitMsg, setEditLimitMsg] = useState("");
    const [editLimitDialogOpen, setEditLimitDialogOpen] = useState(false);

    // Post report state (uses shared ReportContentDialog)
    const [postReportOpen, setPostReportOpen] = useState(false);

    // 3-dot post menu state
    const [postMenuEl, setPostMenuEl] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [copyToast, setCopyToast] = useState(false);
    const [hideBlockToast, setHideBlockToast] = useState("");
    const [hideBusy, setHideBusy] = useState(false);
    const [blockBusy, setBlockBusy] = useState(false);

    // Active account context — determines ownership
    const { isArtistAccount, activeArtistId, getAccountHeaders: getAcctHdrs } = useActiveAccount();

    useEffect(() => {
        if (!hideBlockToast) return undefined;
        const t = window.setTimeout(() => setHideBlockToast(""), 1800);
        return () => window.clearTimeout(t);
    }, [hideBlockToast]);

    useEffect(() => {
        setAvatarErrored(false);
    }, [post?.id]);

    const postId = post?.id || 0;
    const artistId = post?.artist_id || post?.artistId || 0;

    const submitPostReport = useCallback(async ({ reason, details }) => {
        if (!artistId || !postId) return;
        try {
            const res = await secureFetch(
                `/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}/report`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason, details: details || null }),
                }
            );
            // If the report was submitted successfully, hide the post from the list
            if (res.ok) {
                onPostHidden?.(postId);
            }
        } catch { /* handled by ReportContentDialog */ }
    }, [artistId, postId, onPostHidden]);

    // "Hide posts from this artist" — inserts into user_hidden_posts via
    // the shared /users/hide endpoint, then removes them client-side.
    const handleHideArtistPosts = useCallback(async () => {
        if (!artistId || hideBusy || blockBusy) return;
        setPostMenuEl(null);
        setHideBusy(true);
        const displayName = String(post?.artist_name || post?.artistName || "").trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...(getAcctHdrs?.() || {}) };
            const res = await secureFetch(`/api/users/hide`, {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify({
                    target_id: Number(artistId),
                    target_type: "artist",
                    action: "hide",
                }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:hidden-changed", { detail: { artistId, hidden: true, source: "musicPostsList" } })); } catch { /* */ }
                setHideBlockToast(`Posts from ${displayName} hidden`);
            }
        } catch { /* best-effort */ } finally { setHideBusy(false); }
        // Immediately remove all posts by this artist from the client-side list
        onHideArtistPosts?.(artistId);
    }, [artistId, onHideArtistPosts, hideBusy, blockBusy, post?.artist_name, post?.artistName, getAcctHdrs]);

    // "Block artist" — posts to /users/block with target_type='artist'.
    // Backend resolves the artist's owner and enforces the self-ownership guard.
    const handleBlockArtist = useCallback(async () => {
        if (!artistId || hideBusy || blockBusy) return;
        setPostMenuEl(null);
        setBlockBusy(true);
        const displayName = String(post?.artist_name || post?.artistName || "").trim() || "Artist";
        try {
            const hdrs = { "Content-Type": "application/json", ...(getAcctHdrs?.() || {}) };
            const res = await secureFetch(`/api/users/block`, {
                method: "POST",
                credentials: "include",
                headers: hdrs,
                body: JSON.stringify({
                    target_id: Number(artistId),
                    target_type: "artist",
                    action: "block",
                }),
            });
            if (res.ok) {
                try { window.dispatchEvent(new CustomEvent("ll:user:blocked-changed", { detail: { userId: artistId, targetType: "artist", blocked: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:user:hidden-changed", { detail: { userId: artistId, targetType: "artist", hidden: true } })); } catch { /* */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:blocked-changed", { detail: { artistId, blocked: true, source: "musicPostsList" } })); } catch { /* */ }
                setHideBlockToast(`${displayName} blocked`);
            }
        } catch { /* best-effort */ } finally { setBlockBusy(false); }
        onHideArtistPosts?.(artistId);
    }, [artistId, onHideArtistPosts, hideBusy, blockBusy, post?.artist_name, post?.artistName, getAcctHdrs]);

    const openHistory = useCallback((e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        if (!artistId || !postId) return;
        setHistoryOpen(true);
        setHistoryLoading(true);
        setHistoryError("");
        setHistoryRows([]);
        secureFetch(`/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}/edits`, { credentials: "include", cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed"))))
            .then((data) => setHistoryRows(Array.isArray(data?.edits) ? data.edits : []))
            .catch((err) => setHistoryError(err?.message || "Failed to load edit history"))
            .finally(() => setHistoryLoading(false));
    }, [artistId, postId]);

    // Actor info (the artist who posted)
    const actorName = String(
        post?.artist_name || post?.artistName || post?.name ||
        [post?.first_name, post?.last_name].filter(Boolean).join(" ") || "Artist"
    ).trim();
    const actorHandle = String(post?.artist_handle || post?.artistHandle || post?.handle || "").trim().replace(/^@/, "");
    const rawAvatarSrc = String(
        post?.artist_avatar_url || post?.artistAvatarUrl ||
        post?.avatar_url || post?.profile_picture || ""
    ).trim();
    const avatarSrc = !avatarErrored ? (rawAvatarSrc || "") : "";
    // Artist sub-type for the default avatar icon. Reads from post fields
    // (backend emits artistProfileType / profile_type) — falls back to
    // 'music' when missing.
    const posterProfileType = String(
        post?.artistProfileType || post?.artist_profile_type || post?.profile_type || ""
    ).toLowerCase();
    const isVisualArtistPoster = posterProfileType === "artist";

    const postDate = post?.date_created || post?.posted_at || post?.created_at || post?.createdAt || "";
    const title = String(post?.title || "").trim();
    const description = stripHtml(String(post?.description || post?.body || post?.content || "").trim());
    const rawDescHtml = String(post?.description || post?.body || post?.content || "");
    const descHasHtml = /<[a-z][\s\S]*?>/i.test(rawDescHtml);
    const { preview, long } = truncateDescription(description);
    const isEdited = Boolean(post?.isEdited || post?.is_edited || Number(post?.editCount || post?.edit_count || 0) > 0);

    const processedPhotos = extractPhotos(post);
    const mainPhoto = processedPhotos[0] || "";
    const showImage = Boolean(mainPhoto && !imgError);

    // Location
    const postAddress = String(post?.address || "").trim();
    const city = String(post?.city || "").trim();
    const countyRaw = String(post?.county || "").trim();
    const countyLabel = countyRaw
        ? (String(countyRaw).toLowerCase().includes("county") ? countyRaw : `${countyRaw} County`)
        : "";
    const locationStr = [city, countyLabel].filter(Boolean).join(", ");

    // Engagement counts
    const likesCount = Number(post?.likes_count ?? post?.likesCount ?? post?.likes ?? 0);
    const commentsCount = Number(post?.comments_count ?? post?.commentsCount ?? post?.comments ?? 0);
    const repostsCount = Number(post?.reposts_count ?? post?.repostsCount ?? post?.reposts ?? 0);
    const viewerLiked = Boolean(post?.viewer_liked ?? post?.viewerLiked ?? post?.is_liked ?? false);
    const viewerReposted = Boolean(post?.viewer_reposted ?? post?.viewerReposted ?? post?.is_reposted ?? false);

    const hoverKey = postId;
    const isHovered = String(hoveredId ?? "") === String(hoverKey);
    const isSelected = selectable && String(selectedId ?? "") === String(postId);

    // Ownership: user is owner only if actively logged into the artist account that made this post.
    // This matches ArtistProfilePage's canManage pattern — personal accounts that own an artist
    // do NOT get edit/delete unless they switch to the artist account.
    const isOwner = isArtistAccount && activeArtistId && artistId
        ? Number(activeArtistId) === Number(artistId)
        : false;

    // Broader link check — true whenever the viewer's personal account owns
    // this artist, OR they're actively switched into it. Used to hide
    // Hide posts / Block menu items so a user can't target their own artist.
    // Requires the backend to include `artist_owner_user_id` / `artistOwnerUserId`
    // on the post payload (see serializePost in music.js).
    const viewerId = Number(user?.id || user?.user_id || 0);
    const postArtistOwnerId = Number(
        post?.artistOwnerUserId ||
        post?.artist_owner_user_id ||
        0
    );
    const isLinkedToArtist = Boolean(
        isOwner ||
        (viewerId > 0 && postArtistOwnerId > 0 && viewerId === postArtistOwnerId)
    );

    const handleCopyLink = () => {
        const handle = String(post?.artist_handle || post?.artistHandle || post?.handle || "").trim();
        const pid = post?.id || "";
        const url = handle && pid
            ? `${window.location.origin}/${encodeURIComponent(handle)}/posts/${encodeURIComponent(pid)}`
            : `${window.location.origin}/music/post/${pid}`;
        navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => setCopyToast(true));
    };

    // ── 3-dot menu handlers (matches MusicPostDetailPanel logic) ──
    const handlePostMenuOpen = (e) => {
        e.stopPropagation();
        setPostMenuEl(e.currentTarget);
        // Check edit-limit when menu opens (owners only)
        if (isOwner && artistId && postId) {
            secureFetch(`/api/music/artists/${encodeURIComponent(String(artistId))}/posts/${encodeURIComponent(String(postId))}/edit-limit`, {
                credentials: "include", cache: "no-store",
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                    if (data && data.ok === false) {
                        setEditLimitReached(true);
                        setEditLimitMsg(data.message || "You've reached the edit limit (5 edits per 24 hours). Please try again later.");
                    } else {
                        setEditLimitReached(false);
                        setEditLimitMsg("");
                    }
                })
                .catch(() => { setEditLimitReached(false); setEditLimitMsg(""); });
        }
    };
    const handlePostMenuClose = () => setPostMenuEl(null);

    const handlePostCopyLink = () => {
        handlePostMenuClose();
        handleCopyLink();
    };

    const handlePostEditClick = () => {
        handlePostMenuClose();
        if (editLimitReached) {
            setEditLimitDialogOpen(true);
            return;
        }
        if (typeof onEditPost === "function") onEditPost(post);
    };

    const handlePostDeleteClick = () => {
        handlePostMenuClose();
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        setDeleteConfirmOpen(false);
        if (typeof onDeletePost === "function") onDeletePost(post);
    };

    const handlePostReportClick = () => {
        handlePostMenuClose();
        setPostReportOpen(true);
    };

    const openUserCard = (e) => {
        e.stopPropagation();
        if (onOpenUserCard) {
            const artistId = post?.artist_id || post?.artistId || 0;
            onOpenUserCard(e.currentTarget, {
                id: artistId || post?.user_id || undefined,
                first_name: actorName.split(" ")[0] || actorName,
                last_name: actorName.split(" ").slice(1).join(" ") || "",
                handle: actorHandle,
                avatar_url: rawAvatarSrc,
                // Mark as artist so UserCardPopover follows the correct entity
                ...(artistId ? {
                    account_type: "artist",
                    artist_id: Number(artistId),
                    artist_name: actorName,
                    artist_handle: actorHandle,
                    artist_avatar_url: rawAvatarSrc,
                } : {}),
            });
        }
    };

    return (
        <>
            <Card
                data-post-id={postId}
                className="music-post-card"
                elevation={flat ? 0 : undefined}
                sx={(t) => {
                    const m = t.custom.motion;
                    const sh = t.custom.shadows;
                    return {
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        minHeight: (flat || popupMode) ? "auto" : { xs: 360, sm: 350, md: 340 },
                        height: "auto",
                        position: "relative",
                        isolation: flat ? "auto" : "isolate",
                        borderRadius: flat ? "0 !important" : (popupMode ? 0 : `${t.custom?.postCard?.borderRadius || 16}px`),
                        border: flat ? "none" : (popupMode ? "none" : "1px solid"),
                        borderColor: flat
                            ? "transparent"
                            : isSelected
                                ? alphaColor(t.palette.secondary.main, 0.80)
                                : alphaColor(t.palette.text.primary, 0.10),
                        bgcolor: t.palette.background.paper,
                        overflow: flat ? "visible" : "hidden",
                        ...(flat ? { boxShadow: "none !important", backgroundImage: "none !important" } : {}),
                        boxShadow: flat
                            ? "none"
                            : popupMode
                                ? "none"
                                : isSelected
                                    ? (sh?.md || `0 16px 42px ${alphaColor(t.palette.text.primary, 0.12)}`)
                                    : isHovered
                                        ? (sh?.sm || `0 8px 22px ${alphaColor(t.palette.text.primary, 0.10)}`)
                                        : (sh?.xs || `0 2px 10px ${alphaColor(t.palette.text.primary, 0.08)}`),
                        transition: flat ? "none" : (popupMode ? "none" : `box-shadow ${m.slow}ms ${m.ease}, border-color ${m.slow}ms ${m.ease}, transform ${m.slow}ms ${m.ease}`),
                        transform: "translateY(0)",
                        cursor: popupMode ? "default" : "pointer",
                        // Mobile: active press feedback
                        "@media (hover: none)": {
                            "&:active": (!flat && !popupMode) ? {
                                transform: "scale(0.985)",
                                boxShadow: sh?.xs || `0 2px 8px ${alphaColor(t.palette.text.primary, 0.04)}`,
                            } : {},
                        },
                        "&:focus-visible": {
                            boxShadow: `0 0 0 4px ${alphaColor(t.palette.secondary.main, 0.18)}`,
                        },
                    };
                }}
                onClick={() => onCardClick?.(post)}
                onMouseEnter={() => setHoveredId?.(hoverKey)}
                onMouseLeave={() => setHoveredId?.(null)}
            >
                {/* Header: Hoverable user section + category chip */}
                <Box sx={{ px: flat ? 2 : 2, pt: flat ? 1.5 : 2, pb: flat ? 0.5 : 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    {/* Hoverable user section */}
                    <Box
                        className="ll-author-link"
                        onClick={(e) => { e.stopPropagation(); openUserCard(e); }}
                        sx={(t) => ({
                            display: "inline-flex",
                            alignItems: "flex-start",
                            gap: 1.5,
                            cursor: "pointer",
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            "&:hover": {
                                bgcolor: alphaColor(t.palette.text.primary, 0.04),
                            },
                            maxWidth: "fit-content",
                        })}
                    >
                        <Avatar
                            src={avatarSrc || undefined}
                            sx={(t) => ({
                                bgcolor: alphaColor(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                width: 48,
                                height: 48,
                                flexShrink: 0,
                                border: "2px solid",
                                borderColor: alphaColor(t.palette.text.primary, 0.06),
                                "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                            })}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                            onError={() => setAvatarErrored(true)}
                        >
                            {isVisualArtistPoster
                                ? <PaletteRoundedIcon sx={{ fontSize: 26 }} />
                                : <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />}
                        </Avatar>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 700, lineHeight: 1.3 }}
                            >
                                {actorName}
                            </Typography>
                            {actorHandle ? (
                                <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary", lineHeight: 1.4 }}
                                >
                                    @{actorHandle}
                                </Typography>
                            ) : null}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
                                <Typography variant="caption" color="text.secondary">
                                    {timeAgoCompact(postDate)}
                                </Typography>
                                {isEdited ? (
                                    <>
                                        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, lineHeight: 1 }}>•</Typography>
                                        <Typography
                                            variant="caption"
                                            onClick={openHistory}
                                            sx={{ fontWeight: 600, color: "primary.main", fontSize: 11, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                        >
                                            Edited
                                        </Typography>
                                    </>
                                ) : null}
                            </Box>
                        </Box>
                    </Box>

                    {/* Three-dot menu */}
                    <Tooltip title="Options" arrow disableTouchListener>
                        <IconButton
                            size="small"
                            onClick={handlePostMenuOpen}
                            sx={{
                                flexShrink: 0, width: 32, height: 32, mt: 0.5,
                                border: "1px solid", borderColor: "divider",
                                color: "text.secondary", bgcolor: "background.paper",
                                "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                            }}
                        >
                            <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        px: flat ? 2 : 2,
                        pt: (showImage && !flat) ? 1 : 0.5,
                        pb: flat ? 0.5 : ((postAddress || locationStr) ? (postAddress && locationStr ? 4.5 : 3) : 1),
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: (showImage && !flat) ? "flex-start" : "center",
                    }}
                >
                    <Box sx={{ display: "flex", gap: (showImage && !flat) ? 2 : 0, alignItems: (showImage && !flat) ? "center" : "flex-start" }}>
                        {/* Photo thumbnail — desktop only when flat */}
                        {showImage && !flat ? (
                            <Box sx={{ flexShrink: 0 }}>
                                <Box
                                    sx={{
                                        position: "relative",
                                        width: { xs: 120, sm: 140, md: 150 },
                                        height: { xs: 120, sm: 140, md: 150 },
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={mainPhoto}
                                        loading="lazy"
                                        onError={() => setImgError(true)}
                                        sx={(t) => ({
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "12px",
                                            border: "1px solid",
                                            borderColor: alphaColor(t.palette.text.primary, 0.08),
                                            boxShadow: t.custom.shadows.xs,
                                            display: "block",
                                        })}
                                        alt=""
                                    />
                                    {processedPhotos.length > 1 ? (
                                        <Box
                                            sx={(t) => ({
                                                position: "absolute",
                                                left: "50%",
                                                bottom: 6,
                                                transform: "translateX(-50%)",
                                                px: 1,
                                                py: 0.25,
                                                borderRadius: 999,
                                                bgcolor: alphaColor(t.palette.text.primary, 0.7),
                                                fontSize: "0.7rem",
                                                fontWeight: 700,
                                                color: "common.white",
                                                lineHeight: 1.2,
                                                whiteSpace: "nowrap",
                                            })}
                                        >
                                            +{processedPhotos.length - 1} more
                                        </Box>
                                    ) : null}
                                </Box>
                            </Box>
                        ) : null}

                        {/* Text content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {title ? (
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mt: 0,
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        letterSpacing: "-0.01em",
                                        lineHeight: 1.3,
                                        wordBreak: "break-word",
                                        overflowWrap: "anywhere",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {title}
                                </Typography>
                            ) : null}

                            {preview ? (
                                descHasHtml ? (
                                    <Box
                                        sx={{
                                            mt: 0.6,
                                            color: "text.secondary",
                                            fontSize: "0.875rem",
                                            lineHeight: 1.4,
                                            display: "-webkit-box",
                                            WebkitLineClamp: showImage ? 3 : 4,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            wordBreak: "break-word",
                                            overflowWrap: "anywhere",
                                            "& p": { m: 0 },
                                            "& ul, & ol": { m: 0, pl: 2.5 },
                                            "& h1, & h2, & h3, & h4, & h5, & h6": { m: 0, fontSize: "inherit", fontWeight: 700 },
                                            "& blockquote": { m: 0, pl: 1, borderLeft: "2px solid", borderColor: "divider" },
                                            "& a": { color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } },
                                        }}
                                    >
                                        <RichTextDisplay html={rawDescHtml} />
                                        {long ? (
                                            <Typography
                                                component="span"
                                                sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                ...more
                                            </Typography>
                                        ) : null}
                                    </Box>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.6,
                                            lineHeight: 1.4,
                                            display: "-webkit-box",
                                            WebkitLineClamp: showImage ? 3 : 4,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            wordBreak: "break-word",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {preview}
                                        {long ? (
                                            <Typography
                                                component="span"
                                                sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                ...more
                                            </Typography>
                                        ) : null}
                                    </Typography>
                                )
                            ) : null}
                        </Box>
                    </Box>

                    {/* Location (bottom-right) — desktop only; on mobile/flat it renders below the image */}
                    {!flat && (postAddress || locationStr) ? (
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                if (typeof onLocationClick === "function") {
                                    onLocationClick(post);
                                }
                            }}
                            sx={{
                                position: "absolute",
                                right: 16,
                                bottom: 10,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 0.25,
                                maxWidth: "calc(100% - 32px)",
                                pointerEvents: "auto",
                                cursor: typeof onLocationClick === "function" ? "pointer" : "default",
                                borderRadius: 1,
                                px: 0.5,
                                mx: -0.5,
                                transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover .music-post-loc-icon, &:hover .music-post-loc-text": typeof onLocationClick === "function"
                                    ? { color: (t) => t.palette.secondary.main }
                                    : undefined,
                            }}
                        >
                            {postAddress ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <LocationOnRoundedIcon
                                        className="music-post-loc-icon"
                                        sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                    />
                                    <Typography
                                        variant="body2"
                                        className="music-post-loc-text"
                                        noWrap
                                        sx={{ color: "primary.main", fontWeight: 700, fontSize: 12, lineHeight: 1.2, maxWidth: { xs: 200, sm: 260, md: 300 }, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                    >
                                        {postAddress}
                                    </Typography>
                                </Box>
                            ) : null}
                            {locationStr ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    {!postAddress && (
                                        <LocationOnRoundedIcon
                                            className="music-post-loc-icon"
                                            sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                        />
                                    )}
                                    <Typography
                                        variant="body2"
                                        className="music-post-loc-text"
                                        noWrap
                                        sx={{ color: "primary.main", fontWeight: 700, fontSize: 11, lineHeight: 1.2, maxWidth: { xs: 200, sm: 260, md: 300 }, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                    >
                                        {locationStr}
                                    </Typography>
                                </Box>
                            ) : null}
                        </Box>
                    ) : null}
                </Box>

                {/* Flat mode (mobile): full-width photo below text */}
                {flat && showImage ? (
                    <Box sx={{ px: 2, mt: 0.5 }}>
                        <Box sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                            <Box
                                sx={{
                                    position: "relative",
                                    "&:hover img": { transform: "scale(1.02)" },
                                }}
                            >
                                <Box
                                    component="img"
                                    src={mainPhoto}
                                    alt=""
                                    loading="lazy"
                                    onError={() => setImgError(true)}
                                    sx={{
                                        width: "100%",
                                        maxHeight: 600,
                                        objectFit: "contain",
                                        display: "block",
                                        transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                />
                                {processedPhotos.length > 1 ? (
                                    <Box
                                        sx={(t) => ({
                                            position: "absolute",
                                            left: "50%",
                                            bottom: 8,
                                            transform: "translateX(-50%)",
                                            px: 1.25,
                                            py: 0.35,
                                            borderRadius: 999,
                                            bgcolor: alphaColor(t.palette.text.primary, 0.7),
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            color: "common.white",
                                            lineHeight: 1.2,
                                            whiteSpace: "nowrap",
                                            userSelect: "none",
                                            textAlign: "center",
                                        })}
                                    >
                                        +{processedPhotos.length - 1} more {processedPhotos.length - 1 === 1 ? "photo" : "photos"}
                                    </Box>
                                ) : null}
                            </Box>
                        </Box>
                    </Box>
                ) : null}

                {/* Location — mobile/flat only: below the image, right-aligned */}
                {flat && (postAddress || locationStr) ? (
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onLocationClick === "function") {
                                onLocationClick(post);
                            }
                        }}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 0.25,
                            mt: 1,
                            px: 2,
                            pointerEvents: "auto",
                            cursor: typeof onLocationClick === "function" ? "pointer" : "default",
                            borderRadius: 1,
                            transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            "&:hover .music-post-loc-icon, &:hover .music-post-loc-text": typeof onLocationClick === "function"
                                ? { color: (t) => t.palette.secondary.main }
                                : undefined,
                        }}
                    >
                        {postAddress ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <LocationOnRoundedIcon
                                    className="music-post-loc-icon"
                                    sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                />
                                <Typography
                                    variant="body2"
                                    className="music-post-loc-text"
                                    noWrap
                                    sx={{ color: "primary.main", fontWeight: 700, fontSize: 12, lineHeight: 1.2, maxWidth: { xs: 200, sm: 260 }, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                >
                                    {postAddress}
                                </Typography>
                            </Box>
                        ) : null}
                        {locationStr ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {!postAddress && (
                                    <LocationOnRoundedIcon
                                        className="music-post-loc-icon"
                                        sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                    />
                                )}
                                <Typography
                                    variant="body2"
                                    className="music-post-loc-text"
                                    noWrap
                                    sx={{ color: "primary.main", fontWeight: 700, fontSize: 11, lineHeight: 1.2, maxWidth: { xs: 200, sm: 260 }, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}
                                >
                                    {locationStr}
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>
                ) : null}

                {renderBeforeActions ? <Box sx={{ mb: 1 }}>{renderBeforeActions}</Box> : null}

                {/* Action bar footer */}
                <CardActions sx={{ px: flat ? 2 : 2, pt: flat ? 1.5 : 1.0, pb: flat ? 0.5 : 1.4, mt: flat ? 0 : "auto", borderTop: flat ? "none" : "1px solid", borderColor: flat ? "transparent" : "divider" }}>
                    <Box onClick={(e) => e.stopPropagation()} sx={{ width: "fit-content" }}>
                        <ActionBar
                            user={user}
                            postId={postId}
                            post={post}
                            initialLikes={likesCount}
                            initiallyLiked={viewerLiked}
                            commentsCount={commentsCount}
                            initialReposts={repostsCount}
                            initiallyReposted={viewerReposted}
                            showBoost
                            useShareDialog
                            onComment={() => {
                                onCardClick?.(post);
                            }}
                        />
                    </Box>
                </CardActions>
            </Card>

            {/* Edit History Dialog */}
            <MusicListHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                rows={historyRows}
                loading={historyLoading}
                error={historyError}
            />

            {/* Edit Limit Reached Dialog */}
            <Dialog
                open={editLimitDialogOpen}
                onClose={() => setEditLimitDialogOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { position: "relative" } }}
                onClick={(e) => e.stopPropagation()}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                    Edit Limit Reached
                    <IconButton aria-label="Close" onClick={() => setEditLimitDialogOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        {editLimitMsg || "You've reached the edit limit (5 edits per 24 hours). Please try again later."}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditLimitDialogOpen(false)} variant="contained" sx={{ fontWeight: 700 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Report Post Dialog */}
            <ReportContentDialog
                open={postReportOpen}
                onClose={() => setPostReportOpen(false)}
                onSubmit={submitPostReport}
                title="Report post"
                sx={{ zIndex: 100001 }}
            />

            {/* 3-dot post menu (mobile-aware via SmartMenu) */}
            <SmartMenu
                anchorEl={postMenuEl}
                open={Boolean(postMenuEl)}
                onClose={handlePostMenuClose}
                disableScrollLock
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => `0 12px 40px ${alphaColor(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } }}
            >
                <MenuItem onClick={handlePostCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>
                {isOwner && <Divider sx={{ my: 0.5 }} />}
                {isOwner && (
                    <MenuItem onClick={handlePostEditClick} sx={{ py: 1 }}>
                        <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit post" />
                    </MenuItem>
                )}
                {isOwner && (
                    <MenuItem onClick={handlePostDeleteClick} sx={{ py: 1, color: "error.main" }}>
                        <ListItemIcon sx={{ color: "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete post" />
                    </MenuItem>
                )}
                {!isOwner && <Divider sx={{ my: 0.5 }} />}
                {!isOwner && (
                    <MenuItem onClick={handlePostReportClick} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report post" />
                    </MenuItem>
                )}
                {!isLinkedToArtist && viewerId > 0 && (
                    <MenuItem onClick={handleHideArtistPosts} disabled={hideBusy || blockBusy} sx={{ py: 1 }}>
                        <ListItemIcon><VisibilityOffRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Hide posts from this artist" />
                    </MenuItem>
                )}
                {!isLinkedToArtist && viewerId > 0 && (
                    <MenuItem onClick={handleBlockArtist} disabled={hideBusy || blockBusy} sx={{ py: 1, color: "error.main" }}>
                        <ListItemIcon sx={{ color: "error.main" }}><BlockRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Block artist" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* Delete confirm */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth onClick={(e) => e.stopPropagation()} sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete post</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to permanently delete this post? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ textTransform: "none", fontWeight: 700 }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Copy link toast */}
            <SuccessSnackbar open={copyToast} onClose={() => setCopyToast(false)} message="Link copied" />

            {/* Hide/Block toast */}
            <SuccessSnackbar
                open={Boolean(hideBlockToast)}
                onClose={() => setHideBlockToast("")}
                message={hideBlockToast}
            />
        </>
    );
}

/* ─── Inline Edit History Dialog for MusicPostsList ─────────────────────────── */

function parseMediaUrl(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    try { const p = JSON.parse(s); if (Array.isArray(p)) return p.find((u) => typeof u === "string" && u.trim()) || null; } catch { /* not JSON */ }
    return s;
}

function formatMusicListDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function MusicListHistoryDialog({ open, onClose, rows, loading, error }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { position: "relative" } }} onClick={(e) => e.stopPropagation()}>
            <DialogTitle sx={{ pr: 7, fontWeight: 800, fontSize: 18 }}>
                Edit History
                <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ minHeight: 120, px: { xs: 2, sm: 3 } }}>
                {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>}
                {!loading && error && <Typography color="error" sx={{ py: 2, textAlign: "center" }}>{error}</Typography>}
                {!loading && !error && rows.length === 0 && <Typography color="text.secondary" sx={{ py: 2, textAlign: "center", fontSize: 14 }}>No edit history available.</Typography>}
                {!loading && !error && rows.length > 0 && (
                    <Box sx={{ position: "relative", pl: 2.5 }}>
                        <Box sx={{ position: "absolute", left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                        {rows.map((row, idx) => {
                            const isLatest = idx === 0;
                            const isOriginal = idx === rows.length - 1;
                            const prevRow = idx > 0 ? rows[idx - 1] : null;
                            const diffs = [];

                            if (isOriginal) {
                                // Original — no diffs
                            } else if (prevRow) {
                                const before = row;
                                const after = prevRow;
                                if ((before.prevTitle || "") !== (after.prevTitle || "")) diffs.push({ label: "Title", from: (before.prevTitle || "(empty)").slice(0, 60), to: (after.prevTitle || "(empty)").slice(0, 60) });
                                if ((before.prevBody || "") !== (after.prevBody || "")) diffs.push({ label: "Description", bodyDiff: true });
                                if ((before.prevMediaUrl || "") !== (after.prevMediaUrl || "")) diffs.push({ label: "Photo", oldMedia: parseMediaUrl(before.prevMediaUrl), newMedia: parseMediaUrl(after.prevMediaUrl) });
                            } else {
                                if (row.prevTitle) diffs.push({ label: "Title", changed: true, detail: `Previously: "${(row.prevTitle || "").slice(0, 50)}"` });
                                if (row.prevBody) diffs.push({ label: "Description", changed: true, detail: `Previously: "${(row.prevBody || "").slice(0, 60)}${(row.prevBody || "").length > 60 ? "..." : ""}"` });
                                if (row.prevMediaUrl) diffs.push({ label: "Photo", oldMedia: parseMediaUrl(row.prevMediaUrl) });
                            }

                            return (
                                <Box key={row.id || idx} sx={{ position: "relative", pb: idx < rows.length - 1 ? 2.5 : 0 }}>
                                    <Box sx={{ position: "absolute", left: -20, top: 4, width: 12, height: 12, borderRadius: "50%", bgcolor: isOriginal ? "grey.400" : isLatest ? "secondary.main" : "primary.main", border: "2px solid", borderColor: "background.paper", boxShadow: (t) => `0 0 0 2px ${alphaColor(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? "text.secondary" : "text.primary" }}>
                                            {isOriginal ? "Original" : isLatest ? "Latest edit" : `Edit ${row.editNumber || idx + 1}`}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>{formatMusicListDate(row.editedAt)}</Typography>
                                    </Stack>
                                    {!isOriginal && diffs.length > 0 ? (
                                        <Box sx={{ bgcolor: (t) => alphaColor(t.palette.primary.main, 0.025), border: "1px solid", borderColor: (t) => alphaColor(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {diffs.map((d, i) => (
                                                <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.25, py: 0.5 }}>
                                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                                        <Chip label={d.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alphaColor(t.palette.primary.main, 0.08), color: "primary.dark", border: "none", flexShrink: 0, mt: 0.1, "& .MuiChip-label": { px: 1 } }} />
                                                        {d.changed ? (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", lineHeight: 1.5, pt: 0.15 }}>{d.detail || "Updated"}</Typography>
                                                        ) : d.bodyDiff ? (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, pt: 0.15 }}>Updated</Typography>
                                                        ) : d.oldMedia || d.newMedia ? (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", lineHeight: 1.5, pt: 0.15 }}>{d.newMedia && !d.oldMedia ? "added" : !d.newMedia && d.oldMedia ? "removed" : "changed"}</Typography>
                                                        ) : (
                                                            <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5, pt: 0.15, minWidth: 0, wordBreak: "break-word" }}>
                                                                <Box component="span" sx={{ textDecoration: "line-through", opacity: 0.55 }}>{d.from}</Box>
                                                                <Box component="span" sx={{ mx: 0.5, color: "text.disabled" }}>→</Box>
                                                                <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>{d.to}</Box>
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    {(d.oldMedia || d.newMedia) && (
                                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pl: 0.5, mt: 0.5 }}>
                                                            {d.oldMedia ? (
                                                                <Box sx={{ position: "relative", width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "2px solid", borderColor: "error.main", opacity: 0.6 }}>
                                                                    <Box component="img" src={d.oldMedia} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.35)" }}>
                                                                        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>−</Typography>
                                                                    </Box>
                                                                </Box>
                                                            ) : null}
                                                            {d.newMedia ? (
                                                                <Box sx={{ position: "relative", width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "2px solid", borderColor: "success.main" }}>
                                                                    <Box component="img" src={d.newMedia} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.2)" }}>
                                                                        <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 16, lineHeight: 1 }}>+</Typography>
                                                                    </Box>
                                                                </Box>
                                                            ) : null}
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : !isOriginal ? (
                                        <Typography sx={{ fontSize: 12, color: "text.secondary", fontStyle: "italic", pl: 0.5 }}>Post details updated</Typography>
                                    ) : (
                                        <Box sx={{ bgcolor: (t) => alphaColor(t.palette.grey[500], 0.04), border: "1px solid", borderColor: (t) => alphaColor(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {row.prevTitle && <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.primary", mb: 0.25 }}>{(row.prevTitle || "").slice(0, 80)}</Typography>}
                                            {row.prevBody && <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.4 }}>{(row.prevBody || "").slice(0, 100)}{(row.prevBody || "").length > 100 ? "..." : ""}</Typography>}
                                            {parseMediaUrl(row.prevMediaUrl) && (
                                                <Box sx={{ mt: 0.75, width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
                                                    <Box component="img" src={parseMediaUrl(row.prevMediaUrl)} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                </Box>
                                            )}
                                            {!row.prevTitle && !row.prevBody && <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Original post created</Typography>}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}><Button onClick={onClose} sx={{ fontWeight: 700 }}>Close</Button></DialogActions>
        </Dialog>
    );
}

export default function MusicPostsList({
                                           posts,
                                           loading = false,
                                           user,
                                           hoveredId,
                                           setHoveredId,
                                           onCardClick,
                                           onOpenUserCard,
                                           onEditPost,
                                           onDeletePost,
                                           onLocationClick,
                                           onPostHidden,
                                           onHideArtistPosts,
                                           selectedId = null,
                                           selectable = true,
                                           onDisplayStatsChange,
                                           totalCount,
                                       }) {
    const safePosts = Array.isArray(posts) ? posts : EMPTY_POSTS;
    const sentinelRef = useRef(null);

    const plTheme = useTheme();
    const isMobileScreen = useMediaQuery(plTheme.breakpoints.down('md'));

    // Track previous stats to avoid calling onDisplayStatsChange with identical values
    const prevStatsRef = useRef({ shown: -1, total: -1, loading: null });

    useEffect(() => { ensureListStaggerKeyframes(); }, []);

    // Report display stats — only call when values actually change to prevent infinite loops
    const shownCount = safePosts.length;
    const resolvedTotal = Number(totalCount ?? shownCount);

    useEffect(() => {
        if (!onDisplayStatsChange) return;

        const prev = prevStatsRef.current;
        if (
            prev.shown === shownCount &&
            prev.total === resolvedTotal &&
            prev.loading === loading
        ) {
            return;
        }

        prevStatsRef.current = { shown: shownCount, total: resolvedTotal, loading };
        onDisplayStatsChange({ shown: shownCount, total: resolvedTotal, loading });
    }, [shownCount, resolvedTotal, loading, onDisplayStatsChange]);

    if (loading && safePosts.length === 0) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    minHeight: 240,
                    width: "100%",
                }}
            >
                <PulsingDots />
            </Box>
        );
    }

    if (safePosts.length === 0) {
        return (
            <Stack spacing={1.5} sx={{ py: 4, flex: 1, px: 2 }} alignItems="center" justifyContent="center" textAlign="center">
                <Box sx={(t) => ({
                    width: 64, height: 64, borderRadius: '50%',
                    bgcolor: alphaColor(t.palette.primary.main, 0.08),
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 0.5,
                })}>
                    <MusicNoteRoundedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                </Box>
                <Typography sx={{ fontWeight: 950, fontSize: 17 }}>No posts yet</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 380 }}>
                    Artist posts will appear here as they share updates, releases, and announcements.
                </Typography>
            </Stack>
        );
    }

    return (
        <Box>
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    overflowX: "hidden",
                }}
            >
                {safePosts.map((post, idx) => {
                    const key = post?.id || post?.post_id || Math.random();
                    return (
                        <Box
                            key={key}
                            sx={(t) => ({
                                flex: {
                                    xs: "0 0 100%",
                                    sm: "0 0 100%",
                                    md: "0 0 calc(50% - 16px)",
                                    lg: "0 0 calc(50% - 16px)",
                                    xl: "0 0 calc(50% - 16px)",
                                },
                                // Mobile: no margin, edge-to-edge
                                mx: { xs: 0, md: 1 },
                                my: { xs: 0, md: 1 },
                                minWidth: 0,
                                maxWidth: "100%",
                                borderBottom: { xs: `1px solid ${alphaColor(t.palette.divider, 0.1)}`, md: "none" },
                                "&:last-child": { borderBottom: { xs: "none", md: "none" } },
                                ...getListStaggerSx(idx),
                            })}
                        >
                            <MusicPostCardItem
                                post={post}
                                user={user}
                                hoveredId={hoveredId}
                                setHoveredId={setHoveredId}
                                onCardClick={onCardClick}
                                onOpenUserCard={onOpenUserCard}
                                onEditPost={onEditPost}
                                onDeletePost={onDeletePost}
                                onLocationClick={onLocationClick}
                                onPostHidden={onPostHidden}
                                onHideArtistPosts={onHideArtistPosts}
                                selectedId={selectedId}
                                selectable={selectable}
                                flat={isMobileScreen}
                            />
                        </Box>
                    );
                })}
            </Box>

            {/* Bottom loading */}
            {loading && safePosts.length > 0 ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <PulsingDots />
                </Box>
            ) : null}

            <Box ref={sentinelRef} sx={{ height: 1 }} />
        </Box>
    );
}
