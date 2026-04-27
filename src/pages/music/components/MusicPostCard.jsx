import React, { useState, useCallback } from "react";
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
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, useTheme as useThemeMusic } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MobileActionSheet from "../../../components/MobileActionSheet";
import SuccessSnackbar from "../../../components/SuccessSnackbar";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import theme from "../../../themes/theme";
import { stripHtml } from "../../../utils/richTextUtils";
import RichTextDisplay from "../../../components/RichTextDisplay";

/**
 * MusicPostCard
 * - UI-only component (no data fetching)
 * - Styled to match PostList card theme (top accent bar, Card with border/shadow, gold location hover)
 *
 * Intended location:
 *   src/pages/music/components/MusicPostCard.jsx
 */

// Lantern gold for location hover (matching PostList / EventCard)
const LIGHT_GOLD = theme.custom.brand.brass;

export default function MusicPostCard({
                                          post,
                                          defaultAvatarSrc = "",
                                          onOpenPost,
                                          onOpenActor,
                                          onLike,
                                          onComment,
                                          onShare,
                                          onEdit,
                                          onDelete,
                                          onReport,
                                          canManage = false,
                                          artistHandle = "",
                                          showMenu = true,
                                          disabled = false,
                                          loading = false,
                                          renderBeforeActions = null,
                                          flat = false,
                                      }) {
    // ── All hooks must be declared before any early return ──────────────
    const musicTheme = useThemeMusic();
    const isMobileMusic = useMediaQuery(musicTheme.breakpoints.down('md'));
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [copyToast, setCopyToast] = useState(false);
    const menuOpen = Boolean(menuAnchor);

    const safePost = post || {};
    const actor = safePost.actor || {};
    const artistId = safePost.artistId || safePost.artist_id || 0;
    const postId = safePost.id || safePost.post_id || 0;

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

    // ── Loading skeleton (early return is safe now — all hooks above) ──
    if (loading) {
        return (
            <Card
                elevation={0}
                sx={(t) => ({
                    position: "relative",
                    isolation: "isolate",
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: alpha(t.palette.text.primary, 0.10),
                    backgroundColor: t.palette.background.paper,
                    overflow: "hidden",
                    boxShadow: (t) => `0 2px 10px ${alpha(t.palette.text.primary, 0.08)}`,
                    p: 1.75,
                })}
            >
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Skeleton variant="circular" width={56} height={56} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Skeleton variant="text" width="55%" height={22} />
                        <Skeleton variant="text" width="92%" height={18} />
                        <Skeleton variant="text" width="78%" height={18} />
                        <Skeleton variant="rounded" width="100%" height={140} sx={{ mt: 1, borderRadius: 2 }} />
                    </Box>
                </Stack>
            </Card>
        );
    }

    const actorName = actor.name || "Unknown";
    const actorHandle = actor.handle || "";
    const actorAvatar = actor.avatarUrl || defaultAvatarSrc || "";
    const actorIsVerified = Boolean(
        actor.is_verified === true || actor.is_verified === 1 || actor.is_verified === "1" ||
        actor.isVerified === true || actor.isVerified === 1 || actor.isVerified === "1"
    );
    // Artist sub-type ('music' | 'artist') for the avatar fallback icon.
    // Reads from the post (backend emits artistProfileType / profile_type)
    // or the actor object. Defaults to 'music' when missing.
    const posterProfileType = String(
        safePost.artistProfileType || safePost.artist_profile_type || safePost.profile_type ||
        actor.profileType || actor.profile_type || ""
    ).toLowerCase();
    const isVisualArtistPoster = posterProfileType === "artist";
    const timeAgo = safePost.timeAgo || "";
    const isEdited = Boolean(safePost.isEdited || safePost.is_edited || Number(safePost.editCount || safePost.edit_count || 0) > 0);

    const typeLabel = safePost.type || "Update";
    const title = safePost.title || "";
    const body = stripHtml(safePost.body || "");
    const rawBodyHtml = safePost.body || "";
    const bodyHasHtml = /<[a-z][\s\S]*?>/i.test(rawBodyHtml);
    const bodyIsLong = body.trim().split(/\s+/).filter(Boolean).length > 28 || body.trim().length > 240;
    const locationLabel = safePost.locationLabel || "";

    const tags = Array.isArray(safePost.tags) ? safePost.tags : [];

    const handleCardClick = () => {
        if (disabled) return;
        if (onOpenPost) onOpenPost(safePost);
    };

    const handleActorClick = (e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onOpenActor) onOpenActor(actor);
    };

    const handleLike = (e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onLike) onLike(safePost);
    };

    const handleComment = (e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onComment) onComment(safePost);
    };

    const handleShare = (e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onShare) onShare(safePost);
    };

    // ── Three-dot menu handlers ──
    const handleOpenMenu = (e) => {
        e.stopPropagation();
        if (isMobileMusic) { setMobileSheetOpen(true); } else { setMenuAnchor(e.currentTarget); }
    };
    const handleCloseMenu = (e) => { if (e) e.stopPropagation(); setMenuAnchor(null); };

    const handleCopyLink = () => {
        handleCloseMenu();
        const handle = artistHandle || actor.handle || actor.slug || "";
        const url = handle ? `${window.location.origin}/${handle}/posts/${postId}` : `${window.location.origin}/posts/${postId}`;
        navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => setCopyToast(true));
    };

    const handleEdit = () => { handleCloseMenu(); if (typeof onEdit === "function") onEdit(safePost); };
    const handleDeleteClick = () => { handleCloseMenu(); setDeleteConfirmOpen(true); };
    const handleConfirmDelete = () => { setDeleteConfirmOpen(false); if (typeof onDelete === "function") onDelete(safePost); };
    const handleReport = () => { handleCloseMenu(); if (typeof onReport === "function") onReport(safePost); };

    const mobileMenuItems = [
        { icon: <LinkRoundedIcon />, label: "Copy link", onClick: handleCopyLink },
        canManage && { icon: <EditRoundedIcon />, label: "Edit post", onClick: handleEdit },
        canManage && { icon: <DeleteRoundedIcon />, label: "Delete post", onClick: handleDeleteClick, color: "error" },
        !canManage && { divider: true },
        !canManage && { icon: <FlagOutlinedIcon />, label: "Report post", onClick: handleReport },
    ].filter(Boolean);

    return (
        <>
            <Card
                elevation={flat ? 0 : 0}
                onClick={handleCardClick}
                sx={(t) => {
                    return {
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        minHeight: flat ? "auto" : { xs: "auto", sm: 350, md: 340 },
                        height: "auto",
                        position: "relative",
                        isolation: flat ? "auto" : "isolate",
                        borderRadius: flat ? "0 !important" : "16px",
                        border: flat ? "0 !important" : "1px solid",
                        borderColor: flat
                            ? "transparent"
                            : alpha(t.palette.text.primary, 0.10),
                        bgcolor: flat ? "transparent !important" : t.palette.background.paper,
                        ...(flat ? { background: "transparent !important", backgroundImage: "none !important", boxShadow: "none !important" } : {}),
                        overflow: flat ? "visible" : "hidden",
                        cursor: disabled ? "default" : "pointer",
                        boxShadow: flat
                            ? "none"
                            : `0 2px 10px ${alpha(t.palette.text.primary, 0.08)}`,
                        transition: flat ? "none" : "all 180ms ease",
                    };}}
            >
                {/* Header (actor row) — hoverable user area */}
                <Box sx={{ px: 2, pt: 2, pb: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box
                        onClick={handleActorClick}
                        sx={{
                            display: "inline-flex",
                            alignItems: "flex-start",
                            gap: 1.25,
                            cursor: disabled ? "default" : "pointer",
                            borderRadius: 2,
                            p: 0.75,
                            m: -0.75,
                            transition: "background-color 120ms ease",
                            "&:hover": disabled ? undefined : { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) },
                            maxWidth: "fit-content",
                        }}
                    >
                        <Avatar
                            src={actorAvatar || undefined}
                            alt={actorName}
                            sx={(t) => ({
                                width: 48,
                                height: 48,
                                flexShrink: 0,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                border: "2px solid",
                                borderColor: alpha(t.palette.text.primary, 0.06),
                                "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                            })}
                            imgProps={{ referrerPolicy: "no-referrer" }}
                        >
                            {isVisualArtistPoster
                                ? <PaletteRoundedIcon sx={{ fontSize: 26 }} />
                                : <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 750, lineHeight: 1.2 }} noWrap>
                                    {actorName}
                                </Typography>
                            </Stack>
                            {actorHandle ? (
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }} noWrap>
                                    @{actorHandle}
                                </Typography>
                            ) : null}
                            {timeAgo || isEdited ? (
                                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.1 }}>
                                    {timeAgo ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }} noWrap>
                                            {timeAgo}
                                        </Typography>
                                    ) : null}
                                    {isEdited ? (
                                        <>
                                            {timeAgo ? <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, lineHeight: 1 }}>•</Typography> : null}
                                            <Typography
                                                variant="caption"
                                                onClick={openHistory}
                                                sx={{ fontWeight: 600, color: "primary.main", fontSize: 11, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                            >
                                                Edited
                                            </Typography>
                                        </>
                                    ) : null}
                                </Stack>
                            ) : null}
                        </Box>
                    </Box>

                    {/* Type badge + three-dot menu */}
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, mt: 0.5 }}>
                        <Chip
                            label={typeLabel}
                            size="small"
                            sx={{
                                height: 24,
                                borderRadius: 999,
                                fontWeight: 700,
                                fontSize: "0.68rem",
                            }}
                        />
                        {showMenu && (
                            <Tooltip title="Options" arrow disableTouchListener>
                                <IconButton
                                    size="small"
                                    onClick={handleOpenMenu}
                                    sx={{
                                        width: 32, height: 32,
                                        border: "1px solid", borderColor: "divider",
                                        color: "text.secondary", bgcolor: "background.paper",
                                        "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                                    }}
                                >
                                    <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Box>

                {/* Content area */}
                <Box
                    sx={{
                        flex: 1,
                        px: 2,
                        pt: 0.5,
                        pb: 1,
                        position: "relative",
                    }}
                >
                    {title ? (
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: "1rem",
                                fontWeight: 700,
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
                    {body ? (
                        bodyHasHtml ? (
                            <Box
                                sx={{
                                    mt: title ? 0.5 : 0,
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    lineHeight: 1.4,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
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
                                <RichTextDisplay html={rawBodyHtml} />
                                {bodyIsLong && (
                                    <Typography
                                        component="span"
                                        sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                    >
                                        ...more
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    mt: title ? 0.5 : 0,
                                    lineHeight: 1.4,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    wordBreak: "break-word",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {body}
                                {bodyIsLong && (
                                    <Typography
                                        component="span"
                                        sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                    >
                                        ...more
                                    </Typography>
                                )}
                            </Typography>
                        )
                    ) : null}

                    {/* Tags */}
                    {tags.length ? (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap", gap: 0.5 }}>
                            {tags.slice(0, 6).map((tg) => (
                                <Chip key={tg} label={tg} size="small" sx={{ borderRadius: 999, height: 22, fontSize: "0.7rem" }} />
                            ))}
                        </Stack>
                    ) : null}

                    {/* Featured media placeholder */}
                    {safePost.featuredVideoUrl ? (
                        <Box
                            sx={{
                                mt: 1.25,
                                borderRadius: "12px",
                                border: "1px solid",
                                borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    pt: "56.25%",
                                    backgroundColor: "action.hover",
                                }}
                            >
                                <Box sx={{ position: "absolute", inset: 0, p: 1.25 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                        Featured video
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                        {safePost.featuredVideoUrl}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ) : null}

                    {/* Location — mobile only: directly under the image, right-aligned */}
                    {locationLabel ? (
                        <Box
                            sx={{
                                display: { xs: "flex", sm: "none" },
                                justifyContent: "flex-end",
                                mt: 1,
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    cursor: "pointer",
                                    borderRadius: 1,
                                    px: 0.5,
                                    mx: -0.5,
                                    transition: "color 140ms ease",
                                    "&:hover .music-loc-icon-m, &:hover .music-loc-text-m": {
                                        color: LIGHT_GOLD,
                                    },
                                }}
                            >
                                <LocationOnRoundedIcon
                                    className="music-loc-icon-m"
                                    sx={{ fontSize: 15, color: "primary.main", transition: "color 140ms ease" }}
                                />
                                <Typography
                                    className="music-loc-text-m"
                                    noWrap
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: 1.2,
                                        color: "primary.main",
                                        whiteSpace: "nowrap",
                                        transition: "color 140ms ease",
                                    }}
                                >
                                    {locationLabel}
                                </Typography>
                            </Stack>
                        </Box>
                    ) : null}

                    {/* Location — on mobile (xs): rendered right under the image; on desktop: bottom-right of content */}
                    {locationLabel ? (
                        <Box
                            sx={{
                                display: { xs: "none", sm: "flex" },
                                justifyContent: "flex-end",
                                mt: 1,
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    cursor: "pointer",
                                    borderRadius: 1,
                                    px: 0.5,
                                    mx: -0.5,
                                    transition: "color 140ms ease",
                                    "&:hover .music-loc-icon, &:hover .music-loc-text": {
                                        color: LIGHT_GOLD,
                                    },
                                }}
                            >
                                <LocationOnRoundedIcon
                                    className="music-loc-icon"
                                    sx={{ fontSize: 15, color: "primary.main", transition: "color 140ms ease" }}
                                />
                                <Typography
                                    className="music-loc-text"
                                    noWrap
                                    sx={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        lineHeight: 1.2,
                                        color: "primary.main",
                                        whiteSpace: "nowrap",
                                        transition: "color 140ms ease",
                                    }}
                                >
                                    {locationLabel}
                                </Typography>
                            </Stack>
                        </Box>
                    ) : null}
                </Box>

                {renderBeforeActions ? <Box sx={{ mb: 1 }}>{renderBeforeActions}</Box> : null}

                {/* Actions */}
                <CardActions sx={{ px: 2, pt: 0.75, pb: 1.25, mt: "auto", borderTop: { xs: "none", md: "1px solid" }, borderColor: { xs: "transparent", md: "divider" } }}>
                    <Box onClick={(e) => e.stopPropagation()} sx={{ width: 'fit-content' }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ justifyContent: "space-between" }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <IconButton onClick={handleLike} disabled={disabled} aria-label="Like" size="small">
                                    <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                    {Number.isFinite(safePost.likeCount) ? safePost.likeCount : 0}
                                </Typography>

                                <IconButton onClick={handleComment} disabled={disabled} aria-label="Comment" size="small">
                                    <ChatBubbleOutlineIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                    {Number.isFinite(safePost.commentCount) ? safePost.commentCount : 0}
                                </Typography>
                            </Stack>

                            <IconButton onClick={handleShare} disabled={disabled} aria-label="Share" size="small">
                                <ShareOutlinedIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Stack>
                    </Box>
                </CardActions>
            </Card>

            {/* Desktop three-dot menu */}
            {showMenu && !isMobileMusic && (
                <Menu
                    anchorEl={menuAnchor}
                    open={menuOpen}
                    onClose={handleCloseMenu}
                    disableScrollLock
                    onClick={(e) => e.stopPropagation()}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } }}
                >
                    <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                        <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>
                    {canManage && <Divider sx={{ my: 0.5 }} />}
                    {canManage && (
                        <MenuItem onClick={handleEdit} sx={{ py: 1 }}>
                            <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Edit post" />
                        </MenuItem>
                    )}
                    {canManage && (
                        <MenuItem onClick={handleDeleteClick} sx={{ py: 1, color: "error.main" }}>
                            <ListItemIcon sx={{ color: "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Delete post" />
                        </MenuItem>
                    )}
                    {!canManage && <Divider sx={{ my: 0.5 }} />}
                    {!canManage && (
                        <MenuItem onClick={handleReport} sx={{ py: 1 }}>
                            <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Report post" />
                        </MenuItem>
                    )}
                </Menu>
            )}

            {/* Mobile action sheet */}
            {showMenu && isMobileMusic && (
                <MobileActionSheet
                    open={mobileSheetOpen}
                    onClose={() => setMobileSheetOpen(false)}
                    items={mobileMenuItems}
                />
            )}

            {/* Delete confirm */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth onClick={(e) => e.stopPropagation()} sx={{ zIndex: 99998 }}>
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

            {/* Edit History Dialog */}
            <MusicCardHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                rows={historyRows}
                loading={historyLoading}
                error={historyError}
            />
        </>
    );
}

/* ─── Inline Edit History Dialog for MusicPostCard ──────────────────────────── */

function parseMediaUrl(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (!s) return null;
    try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.find((u) => typeof u === "string" && u.trim()) || null;
    } catch { /* not JSON */ }
    return s;
}

function formatMusicCardDate(raw) {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

function MusicCardHistoryDialog({ open, onClose, rows, loading, error }) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ zIndex: (t) => t.zIndex.modal + 50 }} PaperProps={{ sx: { position: "relative" } }} onClick={(e) => e.stopPropagation()}>
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
                        <Box sx={{ position: "absolute", left: 5, top: 10, bottom: 10, width: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.12), borderRadius: 1 }} />
                        {rows.map((row, idx) => {
                            const isLatest = idx === 0;
                            const isOriginal = idx === rows.length - 1;
                            // row = snapshot BEFORE this edit; prevRow (idx-1) = snapshot BEFORE the next edit = state AFTER this edit
                            const prevRow = idx > 0 ? rows[idx - 1] : null;
                            const diffs = [];

                            if (isOriginal) {
                                // Nothing to diff — this is the original state
                            } else if (prevRow) {
                                // Compare: this row's prev (before) vs prevRow's prev (after)
                                const before = row;
                                const after = prevRow;
                                if ((before.prevTitle || "") !== (after.prevTitle || "")) diffs.push({ label: "Title", from: (before.prevTitle || "(empty)").slice(0, 60), to: (after.prevTitle || "(empty)").slice(0, 60) });
                                if ((before.prevBody || "") !== (after.prevBody || "")) diffs.push({ label: "Description", from: (before.prevBody || "").slice(0, 80), to: (after.prevBody || "").slice(0, 80), bodyDiff: true });
                                if ((before.prevMediaUrl || "") !== (after.prevMediaUrl || "")) diffs.push({ label: "Photo", oldMedia: parseMediaUrl(before.prevMediaUrl), newMedia: parseMediaUrl(after.prevMediaUrl) });
                            } else {
                                // Latest edit with only one row — show what was before
                                if (row.prevTitle) diffs.push({ label: "Title", changed: true, detail: `Previously: "${(row.prevTitle || "").slice(0, 50)}"` });
                                if (row.prevBody) diffs.push({ label: "Description", changed: true, detail: `Previously: "${(row.prevBody || "").slice(0, 60)}${(row.prevBody || "").length > 60 ? "..." : ""}"` });
                                if (row.prevMediaUrl) diffs.push({ label: "Photo", oldMedia: parseMediaUrl(row.prevMediaUrl) });
                            }

                            return (
                                <Box key={row.id || idx} sx={{ position: "relative", pb: idx < rows.length - 1 ? 2.5 : 0 }}>
                                    <Box sx={{ position: "absolute", left: -20, top: 4, width: 12, height: 12, borderRadius: "50%", bgcolor: isOriginal ? "grey.400" : isLatest ? "secondary.main" : "primary.main", border: "2px solid", borderColor: "background.paper", boxShadow: (t) => `0 0 0 2px ${alpha(isOriginal ? t.palette.grey[400] : isLatest ? t.palette.secondary.main : t.palette.primary.main, 0.2)}`, zIndex: 1 }} />
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: isOriginal ? "text.secondary" : "text.primary" }}>
                                            {isOriginal ? "Original" : isLatest ? "Latest edit" : `Edit ${row.editNumber || idx + 1}`}
                                        </Typography>
                                        <Typography sx={{ fontSize: 11, color: "text.disabled", fontWeight: 500 }}>{formatMusicCardDate(row.editedAt)}</Typography>
                                    </Stack>
                                    {!isOriginal && diffs.length > 0 ? (
                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.025), border: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
                                            {diffs.map((d, i) => (
                                                <Box key={i} sx={{ display: "flex", flexDirection: "column", gap: 0.25, py: 0.5 }}>
                                                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                                        <Chip label={d.label} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.dark", border: "none", flexShrink: 0, mt: 0.1, "& .MuiChip-label": { px: 1 } }} />
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
                                        <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.04), border: "1px solid", borderColor: (t) => alpha(t.palette.grey[500], 0.08), borderRadius: 2, px: 1.5, py: 1 }}>
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
