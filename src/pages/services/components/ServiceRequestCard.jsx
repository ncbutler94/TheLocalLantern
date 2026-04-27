// src/pages/services/components/ServiceRequestCard.jsx
//
// Card for community service requests ("Looking for…").
// Matches PostCard conventions:
//   • Clean card style — no top accent bar
//   • Photo thumbnail when photos exist
//   • Category chip top-right next to 3-dot menu
//   • UserCardPopover on avatar + name
//   • Timeline & Budget chips under the title
//
import React, { useState } from "react";
import { alpha } from "@mui/material/styles";
import {
    Avatar,
    Box,
    Card,
    Chip,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkIcon from "@mui/icons-material/Link";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import Tooltip from "@mui/material/Tooltip";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

import { getServiceCategoryInfo } from "../utils/serviceHelpers";
import { stripHtml } from "../../../utils/richTextUtils";

// Local AccountAvatar with proper fallback icons for all account types
function AccountAvatar({ src, accountType, alt, size = 40, sx: sxOverride = {}, onClick, ...rest }) {
    const [imgError, setImgError] = React.useState(false);
    React.useEffect(() => { setImgError(false); }, [src]);
    const showImg = Boolean(src) && !imgError;
    const type = String(accountType || '').toLowerCase();
    const FallbackIcon = type === 'business'
        ? StorefrontOutlinedIcon
        : (type === 'artist' || type === 'music' || type === 'music_artist')
            ? MusicNoteRoundedIcon
            : PersonRoundedIcon;
    return (
        <Avatar
            src={showImg ? src : undefined}
            alt={alt || ''}
            imgProps={{ onError: () => setImgError(true) }}
            onClick={onClick}
            sx={(t) => ({
                width: size,
                height: size,
                flexShrink: 0,
                ...(!showImg ? {
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    color: t.palette.primary.main,
                } : {}),
                ...(typeof sxOverride === 'function' ? sxOverride(t) : sxOverride),
            })}
            {...rest}
        >
            {!showImg && <FallbackIcon sx={{ fontSize: typeof size === 'number' ? size * 0.55 : 20 }} />}
        </Avatar>
    );
}
/* ── helpers (module-level — never recreated per render) ── */
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

const URGENCY_LABELS = {
    asap: "ASAP",
    within_week: "This Week",
    within_month: "This Month",
    flexible: "Flexible",
};

const URGENCY_COLORS = {
    asap: "error",
    within_week: "warning",
    within_month: "info",
    flexible: "default",
};

const BUDGET_TYPE_LABELS = {
    hourly: "Hourly",
    flat: "Flat Rate",
    flexible: "Flexible",
    not_sure: "Not Sure",
};

function formatBudgetDisplay(request) {
    const hasMin = request.budgetMin != null && Number.isFinite(Number(request.budgetMin));
    const hasMax = request.budgetMax != null && Number.isFinite(Number(request.budgetMax));
    const suffix = request.budgetType === "hourly" ? "/hr" : "";

    if (hasMin && hasMax && Number(request.budgetMin) !== Number(request.budgetMax)) {
        return `$${Number(request.budgetMin).toLocaleString()}\u2013$${Number(request.budgetMax).toLocaleString()}${suffix}`;
    }
    if (hasMin) return `$${Number(request.budgetMin).toLocaleString()}${suffix}`;
    if (hasMax) return `Up to $${Number(request.budgetMax).toLocaleString()}${suffix}`;
    if (request.budgetNotes) return request.budgetNotes;
    if (request.budgetType) return BUDGET_TYPE_LABELS[request.budgetType] || request.budgetType;
    return "";
}

/**
 * Build a concise budget chip label that includes the type context.
 * e.g. "Flat Rate · $500–$1,000" or "Hourly · $25–$50/hr" or just "$200"
 */
function formatBudgetChipLabel(request) {
    const raw = formatBudgetDisplay(request);
    if (!raw) return "";
    const typeLabel = BUDGET_TYPE_LABELS[request.budgetType] || "";
    // If the raw display already IS the type label (e.g. "Flexible"), just return it
    if (typeLabel && raw === typeLabel) return raw;
    // If there's a type label and a dollar amount, combine them
    if (typeLabel && raw.includes("$")) return `${typeLabel} · ${raw}`;
    return raw;
}

const resolveAvatar = (request) => {
    const a = String(request?.requesterAvatar || "").trim();
    if (a) return a;
    return "";
};

const normalizeRequestAccountType = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "business") return "business";
    if (raw === "artist" || raw === "music" || raw === "music_artist") return "artist";
    return "personal";
};

const getRequestOwnerUserId = (request) => (
    request?.requesterUserId || request?.requester_user_id || request?.requesterId || request?.requester_id || request?.user_id || request?.owner_id || null
);

const getRequestOwnerBusinessId = (request) => {
    if (request?.requesterBusinessId || request?.requester_business_id) return request.requesterBusinessId || request.requester_business_id;
    if (request?.businessId || request?.business_id) return request.businessId || request.business_id;
    const rType = String(request?.requesterType || request?.requester_type || request?.requesterAccountType || request?.requester_account_type || '').toLowerCase().trim();
    if (rType === 'business') return request?.requesterProfileId || request?.requester_profile_id || null;
    return null;
};

const getRequestOwnerArtistId = (request) => {
    if (request?.requesterArtistId || request?.requester_artist_id) return request.requesterArtistId || request.requester_artist_id;
    if (request?.artistId || request?.artist_id) return request.artistId || request.artist_id;
    if (request?.musicArtistId || request?.music_artist_id) return request.musicArtistId || request.music_artist_id;
    const rType = String(request?.requesterType || request?.requester_type || request?.requesterAccountType || request?.requester_account_type || '').toLowerCase().trim();
    if (rType === 'artist' || rType === 'music' || rType === 'music_artist') return request?.requesterProfileId || request?.requester_profile_id || null;
    return null;
};

const isRequestOwnedByActiveAccount = (request, activeAccount, user) => {
    if (!request) return false;
    // NOTE: Do NOT trust request.isRequester here — it reflects user_id ownership
    // across all connected accounts. We need to verify the *active* account matches
    // the request's account type, just like ServiceRequestDetailPage.isOwner does.

    const activeType = normalizeRequestAccountType(activeAccount?.type || "personal");
    const activeAccountId = activeAccount?.id || null;
    const viewerUserId = user?.id || user?.user_id || null;
    const isOnPersonalAccount = activeType === "personal";
    const requestOwnerType = normalizeRequestAccountType(
        request?.requesterAccountType ||
        request?.requester_account_type ||
        request?.requesterType ||
        request?.requester_type ||
        request?.accountType ||
        request?.account_type
    );

    const ownerBusinessId = getRequestOwnerBusinessId(request);
    const ownerArtistId = getRequestOwnerArtistId(request);
    const ownerUserId = getRequestOwnerUserId(request);

    // Business request → only match when active account IS that business
    if (requestOwnerType === "business" && activeType === "business" && activeAccountId && ownerBusinessId) {
        return String(activeAccountId) === String(ownerBusinessId);
    }
    // Artist request → only match when active account IS that artist
    if (requestOwnerType === "artist" && activeType === "artist" && activeAccountId && ownerArtistId) {
        return String(activeAccountId) === String(ownerArtistId);
    }
    // Personal request → only match when on personal account and user ID matches
    if (requestOwnerType === "personal" && isOnPersonalAccount && viewerUserId && ownerUserId) {
        return String(viewerUserId) === String(ownerUserId);
    }

    // Fallback when no requestOwnerType info — match against active account identity only
    if (activeType === "business" && activeAccountId && ownerBusinessId) {
        return String(activeAccountId) === String(ownerBusinessId);
    }
    if (activeType === "artist" && activeAccountId && ownerArtistId) {
        return String(activeAccountId) === String(ownerArtistId);
    }

    // Last resort: personal user ID match — only when on personal account
    // AND the request itself is a personal-type request (not business/artist)
    if (isOnPersonalAccount && viewerUserId && ownerUserId && requestOwnerType === "personal") {
        return String(viewerUserId) === String(ownerUserId);
    }
    return false;
};

/** Extract first valid photo URL from request.photos */
function getFirstPhoto(request) {
    const arr = Array.isArray(request?.photos) ? request.photos : [];
    for (const item of arr) {
        if (!item) continue;
        if (typeof item === "string") { const s = item.trim(); if (s && s !== "null") return s; }
        if (typeof item === "object") {
            const u = (item.url || item.photo_url || item.photoUrl || item.src || item.path || "").trim();
            if (u && u !== "null") return u;
        }
    }
    return null;
}

const DESC_WORD_LIMIT = 24;
const DESC_CHAR_LIMIT = 160;

export default function ServiceRequestCard({
                                               request,
                                               onClick,
                                               selected: _selected = false,
                                               onEdit,
                                               onDelete,
                                               onOpenUserCard,
                                               onReport,
                                               onShare,
                                               onLocationClick,
                                               onRespond,
                                               onViewResponses,
                                               onHover,
                                               user,
                                               activeAccount,
                                           }) {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [copyToast, setCopyToast] = useState(false);
    const menuOpen = Boolean(menuAnchor);

    if (!request) return null;

    const avatarFromRequest = resolveAvatar(request);
    const requesterName = request.requesterName || "Someone";

    // Ownership check — account-aware, matching the active personal/business/artist account.
    const isOwner = isRequestOwnedByActiveAccount(request, activeAccount, user);

    // Derive account type for correct fallback icon (business → storefront, artist → music note, personal → person)
    const requesterAccountType = (() => {
        const raw = normalizeRequestAccountType(
            request?.requesterAccountType || request?.requester_account_type ||
            request?.requesterType || request?.requester_type ||
            request?.accountType || request?.account_type
        );
        if (raw === "business") return "business";
        if (raw === "artist") return "artist";
        // Fallback: infer from IDs if no explicit type
        if (request?.requesterBusinessId || request?.requester_business_id || request?.businessId || request?.business_id) return "business";
        if (request?.requesterArtistId || request?.requester_artist_id || request?.artistId || request?.artist_id || request?.musicArtistId || request?.music_artist_id) return "artist";
        return "user";
    })();

    // Use the viewer's live avatar when they are the requester, so profile-pic
    // changes are reflected immediately without needing to re-save the request.
    // IMPORTANT: For business/artist accounts, only use activeAccount avatar —
    // NEVER fall through to user?.avatar_url (that's the personal profile pic).
    // If the active account type doesn't match the request's account type,
    // fall back to the server-provided avatar (avatarFromRequest).
    const avatarSrc = (() => {
        if (!isOwner) return avatarFromRequest;
        const acctType = normalizeRequestAccountType(activeAccount?.type || "personal");
        // Only use live avatar when the active account type matches the request's account type
        if (acctType === "business" && requesterAccountType === "business") {
            const live = (activeAccount?.avatar_url || activeAccount?.logo_url || "").trim();
            return live || avatarFromRequest;
        }
        if (acctType === "artist" && requesterAccountType === "artist") {
            const live = (activeAccount?.avatar_url || "").trim();
            return live || avatarFromRequest;
        }
        if (acctType === "personal" && requesterAccountType === "user") {
            // Personal account — safe to use personal avatar
            const live = (activeAccount?.avatar_url || user?.avatar_url || user?.profile_picture || "").trim();
            return live || avatarFromRequest;
        }
        // Account type mismatch (e.g. viewing a business request from personal account)
        // — use the server-provided avatar snapshot
        return avatarFromRequest;
    })();

    const requesterIsVerified = Boolean(
        request?.requesterIsVerified === true || request?.requesterIsVerified === 1 || request?.requesterIsVerified === "1" ||
        request?.requester_is_verified === true || request?.requester_is_verified === 1 || request?.requester_is_verified === "1" ||
        request?.is_verified === true || request?.is_verified === 1 || request?.is_verified === "1" ||
        request?.isVerified === true || request?.isVerified === 1 || request?.isVerified === "1"
    );
    const createdAt = request.createdAt || request.created_at || "";

    const categorySlug = request.categorySlug || request.category_slug || "";
    const catInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;

    const rawLocationLabel = request.locationLabel || request.location_label || "";
    const locationLabel = (() => {
        if (request.isStatewide || request.is_statewide) return "Alabama (Statewide)";
        if (rawLocationLabel) {
            const lower = rawLocationLabel.toLowerCase().trim();
            if (lower === "statewide" || lower === "alabama") return "Alabama (Statewide)";
            return rawLocationLabel;
        }
        const parts = [request.city, request.county ? `${request.county} County` : ""].filter(Boolean);
        return parts.join(", ") || "Alabama (Statewide)";
    })();

    const urgency = request.urgency || "flexible";
    const urgencyLabel = URGENCY_LABELS[urgency] || "Flexible";
    const urgencyColor = URGENCY_COLORS[urgency] || "default";

    const budgetDisplay = formatBudgetDisplay(request);
    const budgetChipLabel = formatBudgetChipLabel(request);
    const photoCount = Array.isArray(request.photos) ? request.photos.length : 0;
    const firstPhoto = getFirstPhoto(request);
    const showImage = Boolean(firstPhoto);
    const responseCount = request.responseCount || request.response_count || 0;
    const isFilled = request.status === "filled";
    const isOpen = request.status === "open" || (!request.status);
    const viewerHasResponded = Boolean(request.viewerHasResponded || request.viewer_has_responded);

    // Description preview — strip HTML so the card shows plain-text summary
    const descRaw = stripHtml(String(request.description || "")).trim().replace(/\s+/g, " ");
    const descWords = descRaw.split(/\s+/).filter(Boolean);
    const descLongByWords = descWords.length > DESC_WORD_LIMIT;
    const descLongByChars = descRaw.length > DESC_CHAR_LIMIT;
    const descIsLong = descLongByWords || descLongByChars;
    const descPreview = !descRaw
        ? ""
        : !descIsLong
            ? descRaw
            : descLongByWords
                ? descWords.slice(0, DESC_WORD_LIMIT).join(" ")
                : descRaw.slice(0, DESC_CHAR_LIMIT).trimEnd();

    const handleCopyLink = (e) => {
        e.stopPropagation();
        setMenuAnchor(null);
        const url = `${window.location.origin}/services/requests/${request.id}`;
        navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => {});
    };

    const handleQuickRespond = (e) => {
        e.stopPropagation();
        if (typeof onRespond === "function") onRespond(request);
    };

    const openUserCard = (e) => {
        e.stopPropagation();
        if (typeof onOpenUserCard === "function") {
            const rType = (request.requesterType || request.requester_type || "").toLowerCase();
            onOpenUserCard(e.currentTarget, {
                id: request.requesterId || request.requester_id,
                first_name: requesterName.split(" ")[0] || "",
                last_name: requesterName.split(" ").slice(1).join(" ") || "",
                handle: request.requesterHandle || request.requester_handle,
                avatar_url: request.requesterAvatar || request.requester_avatar,
                ...(rType === "business" ? {
                    account_type: "business",
                    business_id: request.requesterProfileId || request.requester_profile_id,
                    business_name: requesterName,
                    business_slug: request.requesterHandle || request.requester_handle,
                } : rType === "artist" ? {
                    account_type: "artist",
                    artist_id: request.requesterProfileId || request.requester_profile_id,
                    artist_name: requesterName,
                    artist_handle: request.requesterHandle || request.requester_handle,
                } : {}),
            });
        }
    };

    // Whether we have timeline or budget info to show as chips
    const hasTimelineChip = urgency && urgency !== "flexible";
    const hasBudgetChip = Boolean(budgetChipLabel);
    const hasMetaChips = hasTimelineChip || hasBudgetChip;

    return (
        <Card
            data-request-id={request.id}
            data-selected={_selected ? "true" : "false"}
            onClick={() => { if (typeof onClick === "function") onClick(request); }}
            onMouseEnter={() => {
                if (typeof onHover === "function") onHover(request.id);
            }}
            onMouseLeave={() => {
                if (typeof onHover === "function") onHover(null);
            }}
            sx={(t) => {
                const mobile = t.breakpoints.down("md");
                return {
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    minHeight: { xs: "auto", sm: 330, md: 325 },
                    height: { xs: "auto", md: "100%" },
                    position: "relative",
                    isolation: "isolate",
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: _selected
                        ? t.palette.secondary.main
                        : alpha(t.palette.text.primary, 0.08),
                    bgcolor: t.palette.background.paper,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: _selected
                        ? "0 8px 32px rgba(0,0,0,0.12)"
                        : "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 180ms ease",
                    transform: _selected ? "translateY(0)" : "translateY(0)",
                    "&:hover": _selected ? {} : {
                        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    },
                    ...(isFilled && !_selected ? { opacity: 0.75 } : {}),
                    // Mobile: flat edge-to-edge with bottom divider only
                    [mobile]: {
                        borderRadius: 0,
                        border: "none",
                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                        boxShadow: "none",
                        "&:hover": { boxShadow: "none" },
                    },
                };}}
        >
            {/* ═══ HEADER ═══ */}
            <Box sx={{ px: 2, pt: 2, pb: 0.75, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                {/* Left: requester avatar + info */}
                <Box
                    onClick={openUserCard}
                    sx={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        maxWidth: "fit-content",
                        cursor: onOpenUserCard ? "pointer" : "default",
                        transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                        "&:hover": onOpenUserCard ? { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) } : {},
                    }}
                >
                    <AccountAvatar
                        src={avatarSrc || undefined}
                        accountType={requesterAccountType}
                        size={48}
                        sx={(t) => ({
                            flexShrink: 0,
                            border: "2px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                        })}
                    />

                    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
                                {requesterName}
                            </Typography>
                            {requesterIsVerified ? (
                                <Tooltip title="Verified" arrow>
                                    <VerifiedRoundedIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
                                </Tooltip>
                            ) : null}
                        </Box>
                        {(request.requesterHandle || request.requester_handle) && (
                            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180, display: "block" }}>
                                @{String(request.requesterHandle || request.requester_handle).replace(/^@/, "")}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.15 }}>
                            {timeAgoCompact(createdAt)}
                        </Typography>
                    </Box>
                </Box>

                {/* Right: menu — aligned with name row (compensate for left side m: -0.75) */}
                <Box sx={{ flexShrink: 0, mt: -0.75, display: "flex", alignItems: "center", gap: 0.75 }}>

                    {/* 3-dot menu */}
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
                        sx={{
                            width: 32, height: 32, flexShrink: 0,
                            border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                            borderRadius: 999,
                            color: "text.secondary",
                            "&:hover": { bgcolor: "action.hover" },
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>

                    <Menu
                        anchorEl={menuAnchor}
                        open={menuOpen}
                        onClose={(e) => { if (e?.stopPropagation) e.stopPropagation(); setMenuAnchor(null); }}
                        onClick={(e) => e.stopPropagation()}
                        disableScrollLock
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        PaperProps={{
                            sx: {
                                mt: 0.5,
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                minWidth: 200,
                                py: 0.5,
                            },
                        }}
                    >
                        <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Copy link" />
                        </MenuItem>

                        {isOwner && typeof onEdit === "function" && (
                            <MenuItem onClick={(e) => { e.stopPropagation(); setMenuAnchor(null); onEdit(request); }} sx={{ py: 1 }}>
                                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Edit" />
                            </MenuItem>
                        )}

                        {isOwner && typeof onDelete === "function" && (
                            <MenuItem onClick={(e) => { e.stopPropagation(); setMenuAnchor(null); onDelete(request); }} sx={{ py: 1, color: 'error.main' }}>
                                <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Delete" />
                            </MenuItem>
                        )}

                        {!isOwner && typeof onReport === "function" && (
                            <MenuItem onClick={(e) => { e.stopPropagation(); setMenuAnchor(null); onReport(request); }} sx={{ py: 1 }}>
                                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Report" />
                            </MenuItem>
                        )}
                    </Menu>

                    <Snackbar
                        open={copyToast}
                        autoHideDuration={2000}
                        onClose={() => setCopyToast(false)}
                        message="Link copied to clipboard"
                        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    />
                </Box>
            </Box>

            {/* ═══ BODY ═══ */}
            <Box
                sx={{
                    flex: 1,
                    px: 2,
                    pt: showImage ? 1 : 0.5,
                    pb: 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "stretch",
                }}
            >
                <Box sx={{ display: "flex", gap: showImage ? 2 : 0, alignItems: "flex-start" }}>
                    {/* Photo thumbnail — matching BusinessPostCard style */}
                    {showImage && (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Box
                                sx={{
                                    position: "relative",
                                    width: { xs: 110, sm: 150, md: 160 },
                                    height: { xs: 110, sm: 150, md: 160 },
                                    flexShrink: 0,
                                }}
                            >
                                <Box
                                    component="img"
                                    src={firstPhoto}
                                    loading="lazy"
                                    alt=""
                                    sx={(t) => ({
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "12px",
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.text.primary, 0.08),
                                        boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.08)}`,
                                        display: "block",
                                    })}
                                />
                                {photoCount > 1 && (
                                    <Box
                                        sx={(t) => ({
                                            position: "absolute",
                                            left: "50%",
                                            bottom: 6,
                                            transform: "translateX(-50%)",
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 999,
                                            bgcolor: alpha(t.palette.common.black, 0.7),
                                            backdropFilter: "blur(4px)",
                                            fontSize: "0.7rem",
                                            fontWeight: 700,
                                            color: "common.white",
                                            lineHeight: 1.2,
                                            whiteSpace: "nowrap",
                                            userSelect: "none",
                                        })}
                                    >
                                        +{photoCount - 1} more
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Text content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: "1.05rem",
                                fontWeight: 800,
                                letterSpacing: "-0.01em",
                                lineHeight: 1.25,
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {request.title || "Untitled request"}
                        </Typography>

                        {/* ═══ CATEGORY CHIP — under title ═══ */}
                        {catInfo && (
                            <Box sx={{ mt: 0.5 }}>
                                <Chip
                                    size="small"
                                    icon={CatIcon ? <CatIcon sx={{ fontSize: 14 }} /> : undefined}
                                    label={catInfo.name}
                                    sx={(t) => ({
                                        height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10.5,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.custom?.primaryText || t.palette.primary.main,
                                        border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.25),
                                        "& .MuiChip-label": { px: 0.75, lineHeight: 1 },
                                        "& .MuiChip-icon": { ml: 0.5, color: t.custom?.primaryText || t.palette.primary.main },
                                        maxWidth: 180,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    })}
                                />
                            </Box>
                        )}

                        {/* ═══ TIMELINE & BUDGET CHIPS — under title ═══ */}
                        {hasMetaChips && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ mt: 0.5, flexWrap: "wrap", rowGap: 0.5 }}
                            >
                                {hasTimelineChip && (
                                    <Chip
                                        size="small"
                                        icon={<ScheduleRoundedIcon sx={{ fontSize: 12 }} />}
                                        label={
                                            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                                                <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.03em", opacity: 0.7 }}>
                                                    Timeline
                                                </Typography>
                                                <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 800 }}>
                                                    {urgencyLabel}
                                                </Typography>
                                            </Box>
                                        }
                                        color={urgencyColor}
                                        variant="outlined"
                                        sx={{
                                            height: 24,
                                            borderRadius: 999,
                                            "& .MuiChip-label": { px: 0.6 },
                                            "& .MuiChip-icon": { ml: 0.4 },
                                        }}
                                    />
                                )}
                                {hasBudgetChip && (
                                    <Chip
                                        size="small"
                                        label={
                                            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                                                <Typography component="span" sx={{ fontSize: 9.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.03em", opacity: 0.7 }}>
                                                    Budget
                                                </Typography>
                                                <Typography component="span" sx={{ fontSize: 10.5, fontWeight: 800 }}>
                                                    {budgetChipLabel}
                                                </Typography>
                                            </Box>
                                        }
                                        sx={(t) => ({
                                            height: 24,
                                            borderRadius: 999,
                                            bgcolor: alpha(t.palette.success.main, 0.07),
                                            color: t.palette.success.dark,
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.success.main, 0.22),
                                            "& .MuiChip-label": { px: 0.6 },
                                        })}
                                    />
                                )}
                                {isFilled && (
                                    <Chip
                                        size="small"
                                        icon={<CheckCircleRoundedIcon sx={{ fontSize: 12 }} />}
                                        label="Filled"
                                        color="success"
                                        sx={{ height: 24, borderRadius: 999, fontWeight: 800, fontSize: 11, "& .MuiChip-label": { px: 0.75 } }}
                                    />
                                )}
                            </Stack>
                        )}

                        {/* Description preview */}
                        {descPreview && (
                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 0.75,
                                    color: "text.secondary",
                                    lineHeight: 1.45,
                                    display: "-webkit-box",
                                    WebkitLineClamp: showImage ? 3 : 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    wordBreak: "break-word",
                                }}
                            >
                                {descPreview}
                                {descIsLong && (
                                    <Typography
                                        component="span"
                                        sx={{ fontSize: 'inherit', fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                    >
                                        ...more
                                    </Typography>
                                )}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ═══ FOOTER ═══ */}
            <Box sx={{ px: 2, pb: 0.75, pt: 0.5 }}>
                {/* Location row */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {/* Location */}
                    {locationLabel && (
                        <Box
                            sx={{
                                display: "flex", alignItems: "center", gap: 0.5,
                                ...(typeof onLocationClick === "function" ? {
                                    cursor: "pointer", borderRadius: 1, px: 0.5, mx: -0.5,
                                    transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    "&:hover .req-loc-icon, &:hover .req-loc-text": { color: "secondary.main" },
                                } : {}),
                            }}
                            onClick={typeof onLocationClick === "function" ? (e) => { e.stopPropagation(); onLocationClick(request); } : undefined}
                        >
                            <LocationOnRoundedIcon className="req-loc-icon" sx={{ fontSize: 14, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                            <Typography className="req-loc-text" sx={{ fontSize: 11, color: "primary.main", fontWeight: 700, whiteSpace: "nowrap", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}>
                                {locationLabel}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* ═══ ACTION BAR ═══ */}
            <Divider sx={{ display: { xs: "none", md: "block" } }} />
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    px: 1.5,
                    py: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 0.5,
                }}
            >
                {/* Left: Responses pill + Share pill */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {isOwner && (
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                if (responseCount > 0 && typeof onViewResponses === "function") {
                                    onViewResponses(request);
                                } else if (typeof onClick === "function") {
                                    onClick(request);
                                }
                            }}
                            sx={{
                                display: "inline-flex", alignItems: "center", gap: 0.5,
                                px: 1.25, py: 0.5, borderRadius: 999,
                                cursor: responseCount > 0 ? "pointer" : "default",
                                transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": responseCount > 0
                                    ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }
                                    : {},
                                "&:active": responseCount > 0 ? { transform: "scale(0.97)" } : {},
                            }}
                        >
                            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 22, color: responseCount > 0 ? "primary.main" : "text.secondary" }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: responseCount > 0 ? "primary.main" : "text.secondary" }}>
                                {responseCount}
                            </Typography>
                        </Box>
                    )}
                    <Box
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof onShare === "function") {
                                onShare(request);
                            } else {
                                const url = `${window.location.origin}/services/requests/${request.id}`;
                                if (navigator.share) {
                                    navigator.share({ title: request.title || "Service Request", url }).catch(() => {});
                                } else {
                                    navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => {});
                                }
                            }
                        }}
                        sx={{
                            display: "inline-flex", alignItems: "center", gap: 0.5,
                            px: 1.25, py: 0.5, borderRadius: 999, cursor: "pointer", minWidth: 42, justifyContent: "center",
                            transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                            "&:active": { transform: "scale(0.97)" },
                        }}
                    >
                        <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                    </Box>
                </Stack>

                {/* Right: Send a Response (non-owners) */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {!isOwner && isOpen && typeof onRespond === "function" && (
                        viewerHasResponded ? (
                            <Box
                                sx={(t) => ({
                                    display: "inline-flex", alignItems: "center", gap: 0.5,
                                    px: 1, py: 0.4, borderRadius: 999,
                                    fontSize: 12, fontWeight: 800,
                                    color: t.palette.success.main,
                                    bgcolor: alpha(t.palette.success.main, 0.08),
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.success.main, 0.2),
                                })}
                            >
                                <CheckCircleRoundedIcon sx={{ fontSize: 13 }} />
                                <Typography component="span" sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1 }}>Responded</Typography>
                            </Box>
                        ) : (
                            <Box
                                onClick={handleQuickRespond}
                                tabIndex={0}
                                role="button"
                                sx={(t) => ({
                                    display: "inline-flex", alignItems: "center", gap: 0.5,
                                    px: 1, py: 0.4, borderRadius: 999, cursor: "pointer",
                                    fontSize: 12, fontWeight: 800,
                                    color: t.palette.primary.main,
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.2),
                                    transition: `all 150ms ease`,
                                    "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.14) },
                                })}
                            >
                                <SendRoundedIcon sx={{ fontSize: 13 }} />
                                <Typography component="span" sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1 }}>Respond</Typography>
                            </Box>
                        )
                    )}
                </Stack>
            </Box>
        </Card>
    );
}
