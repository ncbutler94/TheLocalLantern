// src/pages/jobs/components/JobCard.jsx
//
// Mirrors Community PostCard structure.
// Uses the same avatar resolution as Header: avatar_url || profile_picture || PersonRounded fallback
//
// v3: redesigned card layout with refined visual hierarchy
//
import React, { useEffect, useState } from "react";
import { alpha, useTheme as useThemeJob } from "@mui/material/styles";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";
import {
    Avatar,
    Box,
    Card,
    Chip,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import LinkIcon from "@mui/icons-material/Link";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { getCategoryInfo, getJobTypeLabel, getExperienceLevelLabel, formatExpiryInfo } from "../utils/jobHelpers";
import useLivePoster from "../hooks/useLivePoster";

/* ── helpers ── */
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

const isNewJob = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return false;
    return Date.now() - d.getTime() < 48 * 60 * 60 * 1000;
};

const resolveAvatar = (job) => {
    const poster = String(job?.posterAvatar || job?.poster_avatar || "").trim();
    if (poster) return poster;
    const logo = String(job?.logoUrl || job?.logo_url || "").trim();
    if (logo) return logo;
    return "";
};

const tooltipSx = { fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, maxWidth: 240 };

const buildMenuItems = ({
                            job, setMenuAnchor, setCopyToast,
                            showOwnerActions, isOnCorrectAccount, isExpired,
                            disabledTooltip, onEdit, onDelete, onRenew, onReport,
                        }) => {
    const menuItems = [];

    menuItems.push(
        <MenuItem key="copy-link" onClick={(e) => {
            e.stopPropagation(); setMenuAnchor(null);
            const url = `${window.location.origin}/jobs/${job?.id}`;
            navigator.clipboard.writeText(url).then(() => setCopyToast(true)).catch(() => setCopyToast(true));
        }} sx={{ py: 1 }}>
            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Copy link" />
        </MenuItem>
    );

    if (showOwnerActions) {
        menuItems.push(<Divider key="owner-divider" sx={{ my: 0.5 }} />);
        menuItems.push(
            <Tooltip key="edit" title={disabledTooltip} placement="left" arrow
                     disableHoverListener={isOnCorrectAccount} componentsProps={{ tooltip: { sx: tooltipSx } }}>
                <span>
                    <MenuItem disabled={!isOnCorrectAccount} onClick={(e) => {
                        e.stopPropagation(); setMenuAnchor(null);
                        if (isOnCorrectAccount && typeof onEdit === "function") onEdit(job);
                    }} sx={{ py: 1, opacity: isOnCorrectAccount ? 1 : 0.5 }}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit job" />
                    </MenuItem>
                </span>
            </Tooltip>
        );
        menuItems.push(
            <Tooltip key="delete" title={disabledTooltip} placement="left" arrow
                     disableHoverListener={isOnCorrectAccount} componentsProps={{ tooltip: { sx: tooltipSx } }}>
                <span>
                    <MenuItem disabled={!isOnCorrectAccount} onClick={(e) => {
                        e.stopPropagation(); setMenuAnchor(null);
                        if (isOnCorrectAccount && typeof onDelete === "function") onDelete(job);
                    }} sx={{ py: 1, opacity: isOnCorrectAccount ? 1 : 0.5, color: isOnCorrectAccount ? "error.main" : undefined }}>
                        <ListItemIcon sx={{ color: isOnCorrectAccount ? "error.main" : undefined }}><DeleteIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete job" />
                    </MenuItem>
                </span>
            </Tooltip>
        );
        if (isOnCorrectAccount && typeof onRenew === "function") {
            menuItems.push(
                <MenuItem key="renew" onClick={(e) => { e.stopPropagation(); setMenuAnchor(null); onRenew(job); }}
                          sx={{ py: 1, color: isExpired ? "success.main" : "primary.main" }}>
                    <ListItemIcon sx={{ color: isExpired ? "success.main" : "primary.main" }}><AutorenewRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary={isExpired ? "Renew listing" : "Extend listing"} />
                </MenuItem>
            );
        }
    }

    if (!showOwnerActions) {
        menuItems.push(<Divider key="report-divider" sx={{ my: 0.5 }} />);
        menuItems.push(
            <MenuItem key="report" onClick={(e) => {
                e.stopPropagation(); setMenuAnchor(null);
                if (typeof onReport === "function") onReport(job);
            }} sx={{ py: 1 }}>
                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Report job" />
            </MenuItem>
        );
    }
    return menuItems;
};

/**
 * JobCard v3 — redesigned layout
 */
export default function JobCard({ job, onClick, selected, onEdit, onDelete, onOpenUserCard, onReport, onRenew, onShare, onApply, onSave, user, activeAccount, onLocationClick, disableHoverEffects = false, flat = false }) {
    const jobTheme = useThemeJob();
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const [copyToast, setCopyToast] = useState(false);
    const [shareHover, setShareHover] = useState(false);
    const [saved, setSaved] = useState(Boolean(job?.viewerSaved || job?.isSaved || job?.is_saved));
    const [applied, setApplied] = useState(Boolean(job?.viewerApplied || job?.isApplied || job?.is_applied));

    // Sync applied state when job prop changes
    useEffect(() => {
        setApplied(Boolean(job?.viewerApplied || job?.isApplied || job?.is_applied));
    }, [job?.viewerApplied, job?.isApplied, job?.is_applied]);

    // Sync saved state when job prop changes
    useEffect(() => {
        setSaved(Boolean(job?.viewerSaved || job?.isSaved || job?.is_saved));
    }, [job?.viewerSaved, job?.isSaved, job?.is_saved]);

    const staticPosterName = job?.posterName || job?.poster_name || "";
    const companyName = job?.company || job?.companyName || job?.company_name || "";
    const isBusiness = job?.ownerType === "business";
    const isArtist = job?.ownerType === "artist" || Boolean(
        !isBusiness && (job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id)
    );

    // Live poster overrides. For personal jobs, fetch the current user profile
    // so name / handle / avatar reflect live values instead of the snapshot
    // captured at job-creation time. Returns empty/null fields for business
    // and artist jobs (those are entity-identified, not user-identified).
    const livePoster = useLivePoster(job);
    const posterName = livePoster.name || staticPosterName;
    const staticAvatarFromJob = resolveAvatar(job);
    const avatarFromJob = livePoster.avatarUrl || staticAvatarFromJob;

    const headerName = posterName || companyName || "Someone";
    const headerSub = isBusiness && companyName && companyName !== headerName ? companyName : "";

    const viewerId = Number(user?.id || 0);
    const posterId = Number(job?.posterUserId || job?.createdByUserId || job?.created_by_user_id || 0);
    const staticPosterHandle = job?.posterHandle || job?.poster_handle || null;
    const posterHandle = livePoster.handle || staticPosterHandle;
    const activeSlug = activeAccount?.slug || null;
    const activeIdentifier = activeSlug || user?.handle || null;

    const backendIsOwner = job?.isOwner;
    const handleMatches = Boolean(
        posterHandle && activeIdentifier &&
        String(posterHandle).toLowerCase() === String(activeIdentifier).toLowerCase()
    );
    const businessIdMatches = Boolean(
        isBusiness && job?.businessId && activeAccount?.id &&
        String(job.businessId) === String(activeAccount.id)
    );
    const clientIsOwner = Boolean(
        viewerId && posterId && viewerId === posterId &&
        (handleMatches || businessIdMatches)
    );
    const showOwnerActions = Boolean(backendIsOwner) || clientIsOwner;
    const isOnCorrectAccount = showOwnerActions;
    const disabledTooltip = "";

    // Use the viewer's live avatar when they are the poster, so profile-pic
    // changes are reflected immediately without needing to re-save the job.
    const avatarSrc = (() => {
        if (!showOwnerActions) return avatarFromJob;
        const live = activeAccount?.avatar_url || activeAccount?.logo_url || user?.avatar_url || user?.profile_picture || "";
        return String(live).trim() || avatarFromJob;
    })();

    const rawExpiresAt = job?.expiresAt || job?.expires_at || "";
    const isExpired = rawExpiresAt ? new Date(rawExpiresAt).getTime() <= Date.now() : false;
    const expiryInfo = showOwnerActions ? formatExpiryInfo(rawExpiresAt) : null;
    const showExpiredStyling = isExpired && showOwnerActions;

    const locationLabel = job?.locationLabel || job?.location_label || "Alabama (Statewide)";
    const createdAt = job?.createdAt || job?.created_at || "";
    const pay = job?.pay || "";
    const jobTypeRaw = job?.jobType || job?.job_type || "";
    const jobTypeLabel = getJobTypeLabel(jobTypeRaw);
    const workMode = job?.workMode || job?.work_mode || "";
    const jobFresh = isNewJob(createdAt);
    const categorySlug = job?.category || "";
    const catInfo = categorySlug ? getCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;
    const categoryLabel = catInfo?.name || "";

    // v2 fields
    const expLevelRaw = job?.experienceLevel || job?.experience_level || "";
    const expLevelLabel = getExperienceLevelLabel(expLevelRaw);
    const scheduleRaw = job?.schedule || "";

    const isSelected = Boolean(selected);

    const handleShareClick = (e) => {
        e.stopPropagation();
        if (typeof onShare === "function") onShare(job);
    };

    const handleApplyClick = (e) => {
        e.stopPropagation();
        if (typeof onApply === "function") {
            onApply(job);
        } else if (typeof onClick === "function") {
            onClick(job);
        }
    };

    const handleSaveClick = (e) => {
        e.stopPropagation();
        const next = !saved;
        setSaved(next);
        if (typeof onSave === "function") onSave(job, next);
    };

    const handleExtendClick = (e) => {
        e.stopPropagation();
        if (typeof onRenew === "function") onRenew(job);
    };

    /* ── Collect tag chips into an array for cleaner rendering ── */
    const tagChips = [];
    if (pay) {
        tagChips.push({ key: "pay", label: `$ ${pay.replace(/^\$\s*/, "")}`, palette: "success" });
    }
    if (jobTypeLabel) {
        tagChips.push({ key: "type", label: jobTypeLabel, palette: "primary" });
    }
    if (workMode) {
        tagChips.push({ key: "mode", label: workMode, palette: "primary" });
    }
    if (expLevelLabel) {
        tagChips.push({ key: "exp", label: expLevelLabel, palette: "info" });
    }

    return (
        <Card
            data-job-id={job?.id}
            elevation={flat ? 0 : undefined}
            onClick={() => { if (typeof onClick === "function") onClick(job); }}
            sx={(t) => {
                const m = t.custom.motion;
                const sh = t.custom.shadows;
                return {
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    isolation: flat ? "auto" : "isolate",
                    borderRadius: flat ? "0 !important" : `${t.custom?.postCard?.borderRadius || 16}px`,
                    border: flat ? "none" : "1px solid",
                    borderColor: flat
                        ? "transparent"
                        : showExpiredStyling
                            ? t.palette.error.light
                            : isSelected
                                ? alpha(t.palette.secondary.main, 0.80)
                                : alpha(t.palette.text.primary, 0.10),
                    bgcolor: showExpiredStyling
                        ? alpha(t.palette.error.light, 0.08)
                        : t.palette.background.paper,
                    overflow: flat ? "visible" : "hidden",
                    ...(flat ? { boxShadow: "none !important", backgroundImage: "none !important" } : {}),
                    boxShadow: flat
                        ? "none"
                        : isSelected
                            ? (sh?.md || `0 16px 42px ${alpha(t.palette.text.primary, 0.12)}`)
                            : (sh?.xs || `0 2px 10px ${alpha(t.palette.text.primary, 0.08)}`),
                    transition: flat ? "none" : `box-shadow ${m?.slow || 250}ms ${m?.ease || "cubic-bezier(.4,0,.2,1)"}, border-color ${m?.slow || 250}ms ${m?.ease || "cubic-bezier(.4,0,.2,1)"}, transform ${m?.slow || 250}ms ${m?.ease || "cubic-bezier(.4,0,.2,1)"}`,
                    transform: "translateY(0)",
                    cursor: "pointer",
                    // Mobile: active press feedback
                    "@media (hover: none)": {
                        "&:active": !flat ? {
                            transform: "scale(0.985)",
                            boxShadow: sh?.xs || `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`,
                        } : {},
                    },
                    // Desktop hover: richer shadow like music cards
                    "&:hover": (isSelected || disableHoverEffects || flat) ? {} : {
                        boxShadow: sh?.sm || `0 8px 22px ${alpha(t.palette.text.primary, 0.10)}`,
                    },
                    "&:focus-visible": {
                        boxShadow: `0 0 0 4px ${alpha(t.palette.secondary.main, 0.18)}`,
                    },
                };
            }}
        >
            {/* ═══ TOP SECTION: poster meta + menu ═══ */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    px: flat ? 2 : 2,
                    pt: flat ? 1.5 : 2,
                    pb: flat ? 0.5 : 1,
                    gap: 1,
                }}
            >
                {/* Left: avatar + name cluster */}
                <Box
                    onClick={(e) => {
                        if (typeof onOpenUserCard === "function") {
                            e.stopPropagation();
                            const accountHandle = job?.accountHandle || job?.account_handle || null;
                            const accountName = job?.accountName || job?.account_name || null;
                            const accountAvatarUrl = job?.accountAvatarUrl || job?.account_avatar_url || null;
                            const businessSlug = job?.businessSlug || job?.business_slug || accountHandle || posterHandle;
                            const artistHandle = job?.artistHandle || job?.artist_handle || accountHandle || posterHandle;
                            const cardData = {
                                id: job?.posterUserId || job?.created_by_user_id || job?.createdByUserId,
                                user_id: job?.posterUserId || job?.created_by_user_id || job?.createdByUserId,
                                handle: isBusiness ? businessSlug : isArtist ? artistHandle : (posterHandle || accountHandle || null),
                                profilePath: livePoster.profilePath || job?.posterProfilePath || job?.poster_profile_path || null,
                                first_name: headerName,
                                last_name: "",
                                avatar_url: avatarSrc,
                                account_name: accountName,
                                account_handle: accountHandle,
                                account_avatar_url: accountAvatarUrl || avatarSrc,
                            };
                            if (isBusiness) {
                                cardData.account_type = "business";
                                cardData.business_id = job?.businessId || job?.business_id || job?.pageId || job?.page_id || undefined;
                                cardData.business_name = companyName || accountName || headerName;
                                cardData.business_slug = businessSlug;
                                cardData.business_avatar_url = accountAvatarUrl || avatarSrc;
                            } else if (isArtist) {
                                cardData.account_type = "artist";
                                cardData.artist_id = job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id || undefined;
                                cardData.artist_name = posterName || accountName || headerName;
                                cardData.artist_handle = artistHandle;
                                cardData.artist_avatar_url = accountAvatarUrl || avatarSrc;
                            }
                            onOpenUserCard(e.currentTarget, cardData);
                        }
                    }}
                    sx={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        minWidth: 0,
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        maxWidth: "fit-content",
                        cursor: onOpenUserCard ? "pointer" : "default",
                        transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                        "&:hover": onOpenUserCard ? { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) } : {},
                    }}
                >
                    <Avatar
                        src={avatarSrc || undefined}
                        sx={(t) => ({
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: "2px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                        })}
                    >
                        {isBusiness ? <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                            : isArtist ? <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />
                                : <PersonRoundedIcon sx={{ fontSize: 28 }} />}
                    </Avatar>
                    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 750, lineHeight: 1.2 }}>
                                {headerName}
                            </Typography>
                            {Boolean(job?.posterIsVerified || job?.poster_is_verified) && (
                                <Tooltip title="Verified" arrow>
                                    <VerifiedRoundedIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
                                </Tooltip>
                            )}
                        </Box>
                        {headerSub ? (
                            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
                                {headerSub}
                            </Typography>
                        ) : null}
                        {posterHandle ? (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.3 }}>
                                @{posterHandle}
                            </Typography>
                        ) : null}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.15 }}>
                            {timeAgoCompact(createdAt)}
                        </Typography>
                    </Box>
                </Box>

                {/* Right: NEW chip + kebab — aligned inline with name row */}
                <Box sx={{ flexShrink: 0, mt: -0.75, display: "flex", alignItems: "center", gap: 0.75 }}>
                    {jobFresh && !isExpired ? (
                        <Chip
                            size="small"
                            icon={<NewReleasesRoundedIcon sx={{ fontSize: 12 }} />}
                            label="NEW"
                            sx={(t) => ({
                                height: 20,
                                borderRadius: 999,
                                fontWeight: 900,
                                fontSize: 9.5,
                                letterSpacing: "0.05em",
                                flexShrink: 0,
                                bgcolor: alpha(t.palette.success.main, 0.10),
                                color: t.palette.success.dark,
                                border: "none",
                                "& .MuiChip-icon": { color: t.palette.success.dark },
                                "& .MuiChip-label": { px: 0.5 },
                            })}
                        />
                    ) : null}
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
                        sx={{
                            border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                            borderRadius: 999,
                            width: 32,
                            height: 32,
                        }}
                    >
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <SmartMenu
                        disableScrollLock
                        anchorEl={menuAnchor}
                        open={menuOpen}
                        onClose={(e) => { if (e?.stopPropagation) e.stopPropagation(); setMenuAnchor(null); }}
                        onClick={(e) => e.stopPropagation()}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        PaperProps={{
                            sx: {
                                mt: 0.5,
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: (t) => `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`,
                                minWidth: 200,
                                py: 0.5,
                                backgroundImage: "none",
                            },
                        }}
                    >
                        {buildMenuItems({ job, setMenuAnchor, setCopyToast, showOwnerActions, isOnCorrectAccount, isExpired, disabledTooltip, onEdit, onDelete, onRenew, onReport })}
                    </SmartMenu>
                    <SuccessSnackbar
                        open={copyToast}
                        onClose={() => setCopyToast(false)}
                        message="Link copied to clipboard"
                    />
                </Box>
            </Box>

            {/* ═══ BODY: title, tags, schedule, description ═══ */}
            <Box sx={{ flex: 1, px: 2, pt: 0.5, pb: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>

                {/* Title row */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            letterSpacing: "-0.01em",
                            lineHeight: 1.3,
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            flex: 1,
                        }}
                    >
                        {job?.title || "Untitled job"}
                    </Typography>
                </Box>

                {/* Category chip — shown under title */}
                {categoryLabel ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Chip
                            size="small"
                            icon={CatIcon ? <CatIcon sx={{ fontSize: 14 }} /> : undefined}
                            label={categoryLabel}
                            sx={(t) => ({
                                height: 24,
                                borderRadius: 999,
                                fontWeight: 800,
                                fontSize: 11,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: t.palette.primary.main,
                                border: "none",
                                "& .MuiChip-label": { px: 0.9, lineHeight: 1 },
                                "& .MuiChip-icon": { ml: 0.5, color: t.palette.primary.main },
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            })}
                        />
                    </Box>
                ) : null}

                {/* Tag chips row */}
                {tagChips.length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
                        {tagChips.map((chip) => (
                            <Chip
                                key={chip.key}
                                size="small"
                                label={chip.label}
                                sx={(t) => {
                                    const paletteColor = chip.palette === "success"
                                        ? t.palette.success
                                        : chip.palette === "info"
                                            ? t.palette.info
                                            : t.palette.primary;
                                    const textColor = chip.palette === "success"
                                        ? paletteColor.dark
                                        : chip.palette === "info"
                                            ? paletteColor.dark
                                            : paletteColor.main;
                                    return {
                                        height: 22,
                                        borderRadius: 999,
                                        fontWeight: 700,
                                        fontSize: 11,
                                        bgcolor: alpha(paletteColor.main, 0.08),
                                        color: textColor,
                                        border: "none",
                                        "& .MuiChip-label": { px: 0.75, lineHeight: 1 },
                                    };
                                }}
                            />
                        ))}
                    </Box>
                ) : null}

                {/* Schedule */}
                {scheduleRaw ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <EventNoteRoundedIcon sx={{ fontSize: 13, color: "text.disabled", flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.3 }}>
                            {scheduleRaw.length > 50 ? `${scheduleRaw.slice(0, 50)}…` : scheduleRaw}
                        </Typography>
                    </Box>
                ) : null}

            </Box>

            {/* ═══ LOCATION BAR (bottom-right, matches PostCard/BusinessCard) ═══ */}
            {locationLabel ? (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", px: 2, py: 0.75, mt: "auto" }}>
                    <Box
                        onClick={typeof onLocationClick === "function" ? (e) => { e.stopPropagation(); onLocationClick(job); } : undefined}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            ...(typeof onLocationClick === "function" ? {
                                cursor: "pointer",
                                borderRadius: 1,
                                px: 0.5,
                                mx: -0.5,
                                transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover .loc-icon, &:hover .loc-text": { color: "secondary.main" },
                            } : {}),
                        }}
                    >
                        <LocationOnRoundedIcon
                            className="loc-icon"
                            sx={{
                                fontSize: 15,
                                color: "primary.main",
                                flexShrink: 0,
                                transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                            }}
                        />
                        <Typography
                            className="loc-text"
                            variant="body2"
                            sx={{
                                color: "primary.main",
                                fontWeight: 700,
                                fontSize: 12,
                                lineHeight: 1.25,
                                textAlign: "right",
                                transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                            }}
                        >
                            {locationLabel}
                        </Typography>
                    </Box>
                </Box>
            ) : null}

            {/* ═══ FOOTER ACTION BAR ═══ */}
            <Box
                sx={{
                    mt: flat ? 0 : (locationLabel ? 0 : "auto"),
                    px: 1.5,
                    py: 1,
                    borderTop: flat ? "none" : "1px solid",
                    borderColor: flat ? "transparent" : "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 0.5,
                }}
            >
                {/* Left: expiry info (owner) OR save+share (non-owner) */}
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                    {showOwnerActions && expiryInfo && expiryInfo.label ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                            <AccessTimeRoundedIcon
                                sx={{
                                    fontSize: 14,
                                    color: expiryInfo.urgency === "expired"
                                        ? "error.main"
                                        : expiryInfo.urgency === "critical"
                                            ? "warning.main"
                                            : "text.secondary",
                                }}
                            />
                            <Tooltip title={expiryInfo.dateLabel ? `Expiry date: ${expiryInfo.dateLabel}` : ""} arrow placement="top">
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 700,
                                        color: expiryInfo.urgency === "expired"
                                            ? "error.main"
                                            : expiryInfo.urgency === "critical"
                                                ? "warning.dark"
                                                : "text.secondary",
                                    }}
                                >
                                    {expiryInfo.label}
                                </Typography>
                            </Tooltip>
                            {typeof onRenew === "function" ? (
                                <Chip
                                    size="small"
                                    icon={<AutorenewRoundedIcon sx={{ fontSize: 12 }} />}
                                    label="Extend"
                                    onClick={handleExtendClick}
                                    sx={(t) => {
                                        const urgencyColor = expiryInfo.urgency === "expired"
                                            ? t.palette.error.main
                                            : expiryInfo.urgency === "critical"
                                                ? t.palette.warning.dark
                                                : t.palette.primary.main;
                                        const urgencyBg = expiryInfo.urgency === "expired"
                                            ? t.palette.error.main
                                            : expiryInfo.urgency === "critical"
                                                ? t.palette.warning.main
                                                : t.palette.primary.main;
                                        return {
                                            height: 22,
                                            borderRadius: 999,
                                            fontWeight: 800,
                                            fontSize: 10.5,
                                            ml: 0.5,
                                            cursor: "pointer",
                                            bgcolor: alpha(urgencyBg, 0.08),
                                            color: urgencyColor,
                                            border: "1px solid",
                                            borderColor: alpha(urgencyBg, 0.25),
                                            "& .MuiChip-icon": { ml: 0.5, color: "inherit" },
                                            "& .MuiChip-label": { px: 0.6, lineHeight: 1 },
                                            "&:hover": { bgcolor: alpha(urgencyBg, 0.14) },
                                        };
                                    }}
                                />
                            ) : null}
                        </Stack>
                    ) : null}

                    {/* Non-owner: save + share */}
                    {!showOwnerActions ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Tooltip title={saved ? "Unsave" : "Save"}>
                                <Box
                                    onClick={handleSaveClick}
                                    tabIndex={0}
                                    role="button"
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: 999,
                                        minWidth: 42,
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                        "&:active": { transform: "scale(0.97)" },
                                    }}
                                >
                                    {saved ? (
                                        <BookmarkRoundedIcon sx={{ fontSize: 22, color: "secondary.main" }} />
                                    ) : (
                                        <BookmarkBorderRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                    )}
                                </Box>
                            </Tooltip>
                            <Tooltip title="Share">
                                <Box
                                    onClick={handleShareClick}
                                    onMouseEnter={() => setShareHover(true)}
                                    onMouseLeave={() => setShareHover(false)}
                                    tabIndex={0}
                                    role="button"
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: 999,
                                        minWidth: 42,
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                        "&:active": { transform: "scale(0.97)" },
                                    }}
                                >
                                    <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                </Box>
                            </Tooltip>
                        </Stack>
                    ) : null}
                </Stack>

                {/* Right: Apply/Applied (non-owner) OR Share (owner) */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {!showOwnerActions ? (
                        applied ? (
                            <Box
                                sx={(t) => ({
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.4,
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: t.palette.success.main,
                                    bgcolor: alpha(t.palette.success.main, 0.08),
                                    border: "1px solid",
                                    borderColor: alpha(t.palette.success.main, 0.2),
                                })}
                            >
                                <CheckCircleRoundedIcon sx={{ fontSize: 13 }} />
                                <Typography component="span" sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                                    Applied
                                </Typography>
                            </Box>
                        ) : (
                            <Tooltip title="Apply for this job">
                                <Box
                                    onClick={handleApplyClick}
                                    tabIndex={0}
                                    role="button"
                                    sx={(t) => ({
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        px: 1,
                                        py: 0.4,
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: "#FFFFFF",
                                        bgcolor: t.palette.primary.main,
                                        transition: `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        "&:hover": { bgcolor: t.palette.primary.dark },
                                    })}
                                >
                                    <SendRoundedIcon sx={{ fontSize: 13, transform: "rotate(-30deg)" }} />
                                    <Typography component="span" sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                                        Apply
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )
                    ) : null}

                    {showOwnerActions ? (
                        <Tooltip title="Share">
                            <Box
                                onClick={handleShareClick}
                                onMouseEnter={() => setShareHover(true)}
                                onMouseLeave={() => setShareHover(false)}
                                tabIndex={0}
                                role="button"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: 999,
                                    minWidth: 42,
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                    "&:active": { transform: "scale(0.97)" },
                                }}
                            >
                                <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                            </Box>
                        </Tooltip>
                    ) : null}
                </Stack>
            </Box>
        </Card>
    );
}
