// src/pages/jobs/components/JobDetailPanel.jsx
//
// Rich inline detail panel — professional styling with Apply button.
// v2: now shows experienceLevel, benefits, schedule; description is linkified.
//
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { secureFetch } from "../../../utils/secureFetch";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkIcon from "@mui/icons-material/Link";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import NewReleasesRoundedIcon from "@mui/icons-material/NewReleasesRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { fetchJobById, deleteJob } from "../api/jobs";
import { getCategoryInfo, getJobTypeLabel, getExperienceLevelLabel, formatExpiryInfo } from "../utils/jobHelpers";
import useLivePoster from "../hooks/useLivePoster";
import ShareDialog from "../../../components/ShareDialog";
import PulsingDots from "../../../components/PulsingDots";
import JobApplicationsPanel from "./JobApplicationsPanel";
import RichTextDisplay from "../../../components/RichTextDisplay";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";

/* ── client-side timeAgo ── */
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

const resolveAvatar = (job) => {
    const poster = String(job?.posterAvatar || job?.poster_avatar || "").trim();
    if (poster) return poster;
    const logo = String(job?.logoUrl || job?.logo_url || "").trim();
    if (logo) return logo;
    return "";
};

const isNewJob = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return false;
    return Date.now() - d.getTime() < 48 * 60 * 60 * 1000;
};

/* ── Linkified text — renders URLs, www. links, emails, and phone numbers as clickable ── */
const LINK_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/gi;

function LinkifiedText({ text }) {
    if (!text) return null;
    const str = String(text);

    // Quick check — skip regex work if nothing link-like
    if (!/https?:\/\/|www\.|@|\d{3}/.test(str)) {
        return (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                {str}
            </Typography>
        );
    }

    const parts = str.split(LINK_REGEX);
    const elements = parts.map((part, i) => {
        // URL with protocol
        if (/^https?:\/\//i.test(part)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}>
                    {part}
                </a>
            );
        }
        // www. link (no protocol)
        if (/^www\./i.test(part)) {
            return (
                <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}>
                    {part}
                </a>
            );
        }
        // Email
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
            return (
                <a key={i} href={`mailto:${part}`}
                   style={{ color: "inherit", fontWeight: 700 }}>
                    {part}
                </a>
            );
        }
        // Phone number
        if (/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(part)) {
            const digits = part.replace(/\D/g, "");
            return (
                <a key={i} href={`tel:+1${digits}`}
                   style={{ color: "inherit", fontWeight: 700 }}>
                    {part}
                </a>
            );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });

    return (
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.65, wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {elements}
        </Typography>
    );
}

export default function JobDetailPanel({
                                           jobId,
                                           job: preloadedJob,
                                           user,
                                           onClose,
                                           onDeleted,
                                           onEdit,
                                           onOpenUserCard,
                                           onReport,
                                           onShare,
                                           onApply,
                                           onRenew,
                                           loggedInUser,
                                           activeAccount,
                                       }) {
    const navigate = useNavigate();
    const jdpTheme = useTheme();
    const isMobile = useMediaQuery(jdpTheme.breakpoints.down("md"));
    const [job, setJob] = useState(preloadedJob || null);
    const [isLoading, setIsLoading] = useState(!preloadedJob);
    const [error, setError] = useState(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [detailTab, setDetailTab] = useState("details");
    const [applicationCount, setApplicationCount] = useState(0);

    // Ownership detection
    const viewerId = Number(loggedInUser?.id || user?.id || 0);
    const posterId = Number(job?.posterUserId || job?.createdByUserId || job?.created_by_user_id || 0);
    // Live poster overrides — fetches /users/public/:id once per unique
    // posterUserId and caches process-wide. Belt-and-suspenders on top of the
    // server-side live join: guarantees the card shows the current name,
    // handle, and profile picture. Returns null fields for business/artist
    // jobs (those are entity-identified, not user-identified).
    const livePoster = useLivePoster(job);
    const jobPosterHandle = livePoster.handle || job?.posterHandle || job?.poster_handle || null;
    const activeSlug = activeAccount?.slug || null;
    const isBusiness = job?.ownerType === "business";
    const isArtist = job?.ownerType === "artist" || Boolean(
        !isBusiness && (job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id)
    );

    const activeIdentifier = activeSlug || loggedInUser?.handle || user?.handle || null;
    const clientIsOwner = Boolean(
        viewerId && posterId && viewerId === posterId &&
        jobPosterHandle && activeIdentifier &&
        String(jobPosterHandle).toLowerCase() === String(activeIdentifier).toLowerCase()
    );
    const isOwner = Boolean(job?.isOwner) || clientIsOwner;
    const isOnCorrectAccount = isOwner;
    const isConnectedButWrongAccount = false;

    // Track preloadedJob by its id to avoid infinite re-renders when parent
    // passes a new object reference on every render.
    const preloadedJobId = preloadedJob?.id ?? null;
    const preloadedJobRef = useRef(preloadedJob);
    // Only update the ref when the actual job id changes, not on every render.
    if (preloadedJobId !== (preloadedJobRef.current?.id ?? null)) {
        preloadedJobRef.current = preloadedJob;
    }

    useEffect(() => {
        const stablePreloaded = preloadedJobRef.current;
        if (stablePreloaded) {
            setJob(stablePreloaded);
            setIsLoading(false);
            return;
        }
        if (!jobId) {
            setJob(null);
            setIsLoading(false);
            return;
        }
        const controller = new AbortController();
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchJobById(jobId, { signal: controller.signal });
                const resolved = data && typeof data === "object" && data.job ? data.job : data;
                setJob(resolved || null);
            } catch (err) {
                if (err.name !== "AbortError") setError(err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobId, preloadedJobId]);

    // Reset tab when job changes
    useEffect(() => {
        setDetailTab("details");
        setApplicationCount(0);
    }, [jobId, preloadedJob?.id]);

    // Fetch application count for owner's jobs
    const resolvedJobId = job?.id || jobId;
    useEffect(() => {
        if (!resolvedJobId || !isOwner) {
            setApplicationCount(0);
            return;
        }
        let alive = true;
        async function loadCount() {
            try {
                const res = await secureFetch(`/api/jobs/${resolvedJobId}/applications?status=`, {
                    credentials: "include",
                });
                if (!res.ok || !alive) return;
                const data = await res.json();
                if (alive) setApplicationCount(data.total || 0);
            } catch {
                // ignore
            }
        }
        loadCount();
        return () => { alive = false; };
    }, [resolvedJobId, isOwner]);

    const handleShare = async () => {
        const resolvedId = job?.id || jobId;
        const url = `${window.location.origin}/jobs/${resolvedId}`;
        if (navigator.share) {
            try { await navigator.share({ title: job?.title || "Job on The Local Lantern", url }); return; } catch { /* fallthrough */ }
        }
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
    };

    const handleDelete = async () => {
        if (!job) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            await deleteJob(job.id);
            setDeleteOpen(false);
            if (typeof onDeleted === "function") onDeleted(job.id);
            if (typeof onClose === "function") onClose();
        } catch (err) {
            setDeleteError(err);
            setIsDeleting(false);
        }
    };

    // Derived values
    const posterAvatar = livePoster.avatarUrl || String(job?.posterAvatar || job?.poster_avatar || "").trim();
    const posterName = livePoster.name || job?.posterName || job?.poster_name || "";
    const companyName = job?.company || job?.companyName || job?.company_name || "";
    const logoUrl = String(job?.logoUrl || job?.logo_url || "").trim();
    const pay = job?.pay || "";
    const jobType = job?.jobType || job?.job_type || "";
    const jobTypeLabel = getJobTypeLabel(jobType);
    const workMode = job?.workMode || job?.work_mode || "";
    const categorySlug = job?.categoryName || job?.category || "";
    const catInfo = categorySlug ? getCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;
    const locationLabel = job?.locationLabel || job?.location_label || "";
    const howToApply = job?.howToApply || job?.how_to_apply || "";
    const avatarFromJob = resolveAvatar(job);
    // Use the viewer's live avatar when they are the poster, so profile-pic
    // changes are reflected immediately without needing to re-save the job.
    const avatarSrc = (() => {
        if (!isOwner) return avatarFromJob;
        const live = activeAccount?.avatar_url || activeAccount?.logo_url
            || loggedInUser?.avatar_url || loggedInUser?.profile_picture
            || user?.avatar_url || user?.profile_picture || "";
        return String(live).trim() || avatarFromJob;
    })();
    const createdAt = job?.createdAt || job?.created_at || "";
    const fresh = isNewJob(createdAt);
    const rawExpiresAt = job?.expiresAt || job?.expires_at || "";
    const isExpired = rawExpiresAt ? new Date(rawExpiresAt).getTime() <= Date.now() : false;
    const viewerApplied = Boolean(job?.viewerApplied || job?.isApplied || job?.is_applied);

    // New v2 fields
    const expLevelRaw = job?.experienceLevel || job?.experience_level || "";
    const expLevelLabel = getExperienceLevelLabel(expLevelRaw);
    const benefitsText = job?.benefits || "";
    const scheduleText = job?.schedule || "";

    // Expiry info for owner
    const expiryInfo = isOwner ? formatExpiryInfo(rawExpiresAt) : null;

    return (
        <Box
            sx={{
                height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
                bgcolor: "background.paper",
                backgroundImage: "none",
                "& .MuiChip-root": {
                    transition: "filter 0.15s ease, box-shadow 0.15s ease",
                    "&:hover": { filter: "brightness(0.96)", bgcolor: "inherit" },
                    "&.MuiChip-clickable:hover": { bgcolor: "inherit", boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.text.primary, 0.10)}` },
                    "&.MuiChip-outlined:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) },
                },
            }}
        >
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
                {error ? (
                    <Box sx={{ p: { xs: 1.25, sm: 2 } }}>
                        <Alert severity="error" sx={{ borderRadius: 2 }}>{error.message || "Failed to load job."}</Alert>
                    </Box>
                ) : isLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 240 }}>
                        <PulsingDots />
                    </Box>
                ) : job ? (
                    <Box>
                        {/* ═══════════ HERO HEADER ═══════════ */}
                        <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 2, pb: 0.5 }}>
                            {/* Poster row + menu */}
                            <Stack direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
                                <Box
                                    onClick={(e) => {
                                        if (typeof onOpenUserCard === "function") {
                                            e.stopPropagation();
                                            const cardData = {
                                                id: job?.posterUserId || job?.createdByUserId || job?.created_by_user_id,
                                                user_id: job?.posterUserId || job?.createdByUserId || job?.created_by_user_id,
                                                handle: jobPosterHandle,
                                                profilePath: livePoster.profilePath || job?.posterProfilePath || job?.poster_profile_path || null,
                                                first_name: posterName || companyName || "User",
                                                last_name: "",
                                                avatar_url: avatarSrc,
                                            };
                                            if (isBusiness) {
                                                cardData.account_type = "business";
                                                cardData.business_id = job?.businessId || job?.business_id || job?.pageId || job?.page_id || undefined;
                                                cardData.business_name = companyName || posterName;
                                                cardData.business_slug = job?.businessSlug || job?.business_slug || jobPosterHandle;
                                                cardData.business_avatar_url = avatarSrc;
                                            } else if (isArtist) {
                                                cardData.account_type = "artist";
                                                cardData.artist_id = job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id || undefined;
                                                cardData.artist_name = posterName || companyName;
                                                cardData.artist_handle = job?.artistHandle || job?.artist_handle || jobPosterHandle;
                                                cardData.artist_avatar_url = avatarSrc;
                                            }
                                            onOpenUserCard(e.currentTarget, cardData);
                                        }
                                    }}
                                    sx={{
                                        display: "inline-flex", alignItems: "center", gap: 1.25,
                                        borderRadius: 2, p: 0.75, m: -0.75,
                                        cursor: onOpenUserCard ? "pointer" : "default",
                                        transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        "&:hover": onOpenUserCard ? { bgcolor: (t) => alpha(t.palette.text.primary, 0.06) } : {},
                                        minWidth: 0,
                                    }}
                                >
                                    <Avatar
                                        src={avatarSrc || undefined}
                                        sx={{
                                            width: 48, height: 48, flexShrink: 0,
                                            border: "2px solid", borderColor: (t) => alpha(t.palette.divider, 0.3),
                                            ...(!avatarSrc ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main" } : {}),
                                        }}
                                    >
                                        {!avatarSrc ? (
                                            isBusiness ? <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
                                                : isArtist ? <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />
                                                    : <PersonRoundedIcon sx={{ fontSize: 28 }} />
                                        ) : null}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, minWidth: 0 }}>
                                            <Typography sx={{ fontWeight: 950, fontSize: "1.05rem", lineHeight: 1.2, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                                {posterName || companyName || "Unknown"}
                                            </Typography>
                                            {Boolean(job?.posterIsVerified || job?.poster_is_verified) && (
                                                <Tooltip title="Verified" arrow>
                                                    <VerifiedRoundedIcon sx={{ fontSize: 14, color: "primary.main", flexShrink: 0 }} />
                                                </Tooltip>
                                            )}
                                        </Box>
                                        {jobPosterHandle && (
                                            <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 600, mt: 0.15 }}>
                                                @{jobPosterHandle}
                                            </Typography>
                                        )}
                                        <Typography sx={{ color: "text.secondary", fontSize: 11, mt: 0.15 }}>
                                            {createdAt ? `Posted ${timeAgoCompact(createdAt)}` : ""}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* NEW badge + 3-dot menu button */}
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0, mt: 0.25 }}>
                                    {fresh && (
                                        <Chip size="small" icon={<NewReleasesRoundedIcon sx={{ fontSize: 13 }} />} label="NEW"
                                              sx={(t) => ({
                                                  height: 22, borderRadius: 999, fontWeight: 900, fontSize: 10,
                                                  letterSpacing: "0.04em", flexShrink: 0,
                                                  bgcolor: alpha(t.palette.success.main, 0.12), color: t.palette.success.dark,
                                                  border: "1px solid", borderColor: alpha(t.palette.success.main, 0.3),
                                                  "& .MuiChip-icon": { color: t.palette.success.dark },
                                                  "& .MuiChip-label": { px: 0.5 },
                                              })}
                                        />
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                                        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, width: 30, height: 30 }}
                                    >
                                        <MoreVertIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {/* Menu (rendered outside flex row to avoid layout issues) */}
                            <SmartMenu
                                disableScrollLock anchorEl={menuAnchor} open={menuOpen}
                                onClose={() => setMenuAnchor(null)}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } }}
                            >
                                {[
                                    <MenuItem key="copy-link" onClick={() => { setMenuAnchor(null); handleShare(); }} sx={{ py: 1 }}>
                                        <ListItemIcon><LinkIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                                        <ListItemText primary="Copy link" />
                                    </MenuItem>,
                                    isOwner ? <Divider key="owner-divider" sx={{ my: 0.5 }} /> : null,
                                    isOwner && typeof onEdit === "function" ? (
                                        <MenuItem key="edit" onClick={() => { setMenuAnchor(null); onEdit(job); }} sx={{ py: 1 }}>
                                            <ListItemIcon><EditIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                                            <ListItemText primary="Edit job" />
                                        </MenuItem>
                                    ) : null,
                                    isOwner ? (
                                        <MenuItem key="delete" onClick={() => { setMenuAnchor(null); setDeleteOpen(true); }}
                                                  sx={{ py: 1, color: "error.main" }}>
                                            <ListItemIcon sx={{ color: "error.main" }}><DeleteIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                                            <ListItemText primary="Delete job" />
                                        </MenuItem>
                                    ) : null,
                                    !isOwner ? <Divider key="report-divider" sx={{ my: 0.5 }} /> : null,
                                    !isOwner ? (
                                        <MenuItem key="report" onClick={() => { setMenuAnchor(null); if (typeof onReport === "function") onReport(job); }} sx={{ py: 1 }}>
                                            <ListItemIcon><FlagOutlinedIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                                            <ListItemText primary="Report job" />
                                        </MenuItem>
                                    ) : null,
                                ].filter(Boolean)}
                            </SmartMenu>

                            {/* Title */}
                            <Box sx={{ mt: 1, mb: 0.5 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.25, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                    {job.title || "Untitled job"}
                                </Typography>
                            </Box>
                        </Box>

                        {/* ═══════════ FULL-WIDTH ACTION BUTTONS ═══════════ */}
                        <Divider sx={{ mt: 1.5 }} />
                        {!isOwner && (
                            <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5, pb: 1 }}>
                                {viewerApplied ? (
                                    <Button
                                        variant="outlined" disableElevation fullWidth
                                        startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                                        disabled
                                        sx={{
                                            borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1,
                                            color: "success.main", borderColor: (t) => alpha(t.palette.success.main, 0.3),
                                            "&.Mui-disabled": { color: "success.main", borderColor: (t) => alpha(t.palette.success.main, 0.3) },
                                        }}
                                    >
                                        Applied
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained" disableElevation fullWidth
                                        startIcon={<SendRoundedIcon sx={{ fontSize: 18, transform: "rotate(-30deg)" }} />}
                                        onClick={() => { if (typeof onApply === "function") onApply(job); }}
                                        sx={{
                                            borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1,
                                            "&:hover": { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.18)}` },
                                        }}
                                    >
                                        Apply Now
                                    </Button>
                                )}
                                {!isMobile && (
                                    <Button
                                        variant="outlined" fullWidth
                                        startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            try {
                                                const scrollEl = document.querySelector("[data-jobs-scroll]");
                                                sessionStorage.setItem("ll:jobs:scrollTop", String(scrollEl?.scrollTop || 0));
                                                sessionStorage.setItem("ll:jobs:selectedJobId", String(job?.id || jobId || ""));
                                            } catch { /* ignore */ }
                                            navigate(`/jobs/${job?.id || jobId}`, { state: { from: "jobs" } });
                                        }}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
                                    >
                                        View Job Page
                                    </Button>
                                )}
                                <Button
                                    variant="outlined" fullWidth
                                    startIcon={<ShareRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                    onClick={() => setShareDialogOpen(true)}
                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
                                >
                                    Share
                                </Button>
                            </Stack>
                        )}
                        {isOwner && (
                            <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5, pb: 1 }}>
                                {!isMobile && (
                                    <Button
                                        variant="outlined" fullWidth
                                        startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            try {
                                                const scrollEl = document.querySelector("[data-jobs-scroll]");
                                                sessionStorage.setItem("ll:jobs:scrollTop", String(scrollEl?.scrollTop || 0));
                                                sessionStorage.setItem("ll:jobs:selectedJobId", String(job?.id || jobId || ""));
                                            } catch { /* ignore */ }
                                            navigate(`/jobs/${job?.id || jobId}`, { state: { from: "jobs" } });
                                        }}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
                                    >
                                        View Job Page
                                    </Button>
                                )}
                                <Button
                                    variant="outlined" fullWidth
                                    startIcon={<ShareRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                    onClick={() => setShareDialogOpen(true)}
                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}
                                >
                                    Share
                                </Button>
                            </Stack>
                        )}

                        {/* ─── Sticky Tabs Container ─── */}
                        {isOwner && (
                            <Box
                                sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                    bgcolor: "background.paper",
                                    pt: 1.25,
                                    pb: 0.5,
                                }}
                            >
                                <Divider />
                                <Tabs
                                    value={detailTab}
                                    onChange={(_, v) => setDetailTab(v)}
                                    variant="fullWidth"
                                    sx={(t) => ({
                                        minHeight: 38,
                                        flexShrink: 0,
                                        borderRadius: 0,
                                        padding: 0,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        boxShadow: "none",
                                        borderBottom: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.12),
                                        "& .MuiTab-root": {
                                            minHeight: 38,
                                            textTransform: "none",
                                            fontWeight: 700,
                                            fontSize: 13.5,
                                            letterSpacing: "-0.01em",
                                            py: 0,
                                            px: 1,
                                            minWidth: 0,
                                            borderRadius: 0,
                                            gap: 0.25,
                                            color: t.palette.text.secondary,
                                            "&:hover": { color: t.palette.text.primary },
                                        },
                                        "& .Mui-selected": {
                                            color: `${t.palette.primary.main} !important`,
                                            fontWeight: 950,
                                        },
                                        "& .MuiTabs-indicator": {
                                            bgcolor: t.palette.primary.main,
                                            height: 2.5,
                                            borderRadius: 0,
                                        },
                                    })}
                                >
                                    <Tab value="details" icon={<WorkOutlineRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Details" />
                                    <Tab value="applications" icon={<PeopleAltRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start"
                                         label={applicationCount > 0 ? `Applications (${applicationCount})` : "Applications"} />
                                </Tabs>
                            </Box>
                        )}

                        {/* ═══════════ EXPIRED BANNER ═══════════ */}
                        {isExpired && (
                            <Alert severity="warning"
                                   sx={{ mx: { xs: 1.5, sm: 2.5 }, mt: 1.5, borderRadius: 2.5, fontWeight: 700, fontSize: 13, "& .MuiAlert-icon": { fontSize: 20 } }}
                            >
                                This job listing has expired and is no longer accepting applications.
                            </Alert>
                        )}

                        {/* ═══════════ OWNER EXPIRY INFO BANNER ═══════════ */}
                        {isOwner && expiryInfo && expiryInfo.label && detailTab === "details" && (
                            <Box
                                sx={(t) => ({
                                    mx: { xs: 1.5, sm: 2.5 }, mt: 1.5, p: 1.5, borderRadius: 2.5,
                                    border: "1px solid",
                                    borderColor: expiryInfo.urgency === "expired" ? alpha(t.palette.error.main, 0.25) : expiryInfo.urgency === "critical" ? alpha(t.palette.warning.main, 0.25) : alpha(t.palette.text.primary, 0.08),
                                    bgcolor: expiryInfo.urgency === "expired" ? alpha(t.palette.error.main, 0.04) : expiryInfo.urgency === "critical" ? alpha(t.palette.warning.main, 0.04) : alpha(t.palette.text.primary, 0.02),
                                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5,
                                })}
                            >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                    <AccessTimeRoundedIcon sx={{ fontSize: 18, flexShrink: 0, color: expiryInfo.urgency === "expired" ? "error.main" : expiryInfo.urgency === "critical" ? "warning.main" : "text.secondary" }} />
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.3, color: expiryInfo.urgency === "expired" ? "error.main" : expiryInfo.urgency === "critical" ? "warning.dark" : "text.primary" }}>
                                            {expiryInfo.label}
                                        </Typography>
                                        {expiryInfo.dateLabel ? (
                                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>
                                                {expiryInfo.isExpired ? "Was set to expire" : "Expiry date"}: {expiryInfo.dateLabel}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                </Stack>
                                {typeof onRenew === "function" ? (
                                    <Button size="small" variant="outlined" startIcon={<AutorenewRoundedIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => onRenew(job)}
                                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, px: 1.5, py: 0.5, flexShrink: 0 }}
                                    >
                                        Extend
                                    </Button>
                                ) : null}
                            </Box>
                        )}

                        {/* ═══════════ TAB: DETAILS ═══════════ */}
                        {detailTab === "details" && (
                            <>
                                {/* ═══════════ JOB DETAILS — 2-COLUMN CARDS ═══════════ */}
                                <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 2, pb: 1 }}>
                                    <SectionLabel>Job Details</SectionLabel>
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                                        {jobTypeLabel && (
                                            <DetailCard icon={<ScheduleRoundedIcon sx={{ fontSize: 18 }} />} label="Job Type" value={jobTypeLabel} />
                                        )}
                                        {workMode && (
                                            <DetailCard icon={<ComputerRoundedIcon sx={{ fontSize: 18 }} />} label="Work Mode" value={workMode} />
                                        )}
                                        {locationLabel && (
                                            <DetailCard icon={<PlaceRoundedIcon sx={{ fontSize: 18 }} />} label="Location" value={locationLabel} />
                                        )}
                                        {pay && (
                                            <DetailCard icon={<AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />} label="Compensation" value={pay} highlight />
                                        )}
                                        {expLevelLabel && (
                                            <DetailCard icon={<SchoolRoundedIcon sx={{ fontSize: 18 }} />} label="Experience" value={expLevelLabel} />
                                        )}
                                        {scheduleText && (
                                            <DetailCard icon={<EventNoteRoundedIcon sx={{ fontSize: 18 }} />} label="Schedule" value={scheduleText} />
                                        )}
                                        {catInfo && (
                                            <DetailCard
                                                icon={CatIcon ? <CatIcon sx={{ fontSize: 18 }} /> : <CategoryRoundedIcon sx={{ fontSize: 18 }} />}
                                                label="Category"
                                                value={catInfo.name}
                                            />
                                        )}
                                    </Box>
                                </Box>

                                {/* ═══════════ DESCRIPTION (linkified) ═══════════ */}
                                <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pt: 1.5, pb: 2 }}>
                                    <SectionLabel>Description</SectionLabel>
                                    <Box
                                        sx={(t) => ({
                                            position: "relative",
                                            p: 2, borderRadius: 2.5,
                                            border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06),
                                            bgcolor: alpha(t.palette.text.primary, 0.015),
                                        })}
                                    >
                                        {job.description ? (
                                            <>
                                                <Box sx={{ maxHeight: descExpanded ? "none" : 160, overflowY: descExpanded ? "visible" : "hidden", position: "relative" }}>
                                                    <RichTextDisplay html={job.description} />
                                                </Box>
                                                {!descExpanded && (job.description || "").length > 300 && (
                                                    <Box sx={{
                                                        position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
                                                        background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                                                        pointerEvents: "none", borderRadius: "0 0 10px 10px",
                                                    }} />
                                                )}
                                                {(job.description || "").length > 300 && (
                                                    <Button
                                                        size="small"
                                                        onClick={() => setDescExpanded((p) => !p)}
                                                        sx={{
                                                            mt: descExpanded ? 0.5 : -0.25, position: "relative", zIndex: 2,
                                                            textTransform: "none", fontWeight: 850, fontSize: "0.78rem", px: 0, minWidth: 0,
                                                            color: "primary.main", "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                                        }}
                                                    >
                                                        {descExpanded ? "Show less" : "Show more"}
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                                                No description provided.
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>

                                {/* ═══════════ BENEFITS & PERKS ═══════════ */}
                                {benefitsText && (
                                    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2 }}>
                                        <SectionLabel>Benefits &amp; Perks</SectionLabel>
                                        <Box
                                            sx={(t) => ({
                                                p: 2, borderRadius: 2.5,
                                                border: "1px solid", borderColor: alpha(t.palette.success.main, 0.18),
                                                bgcolor: alpha(t.palette.success.main, 0.03),
                                            })}
                                        >
                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                                                <CardGiftcardRoundedIcon sx={{ fontSize: 15, color: "success.main" }} />
                                                <Typography sx={{ fontWeight: 800, fontSize: 12, color: "success.dark" }}>
                                                    What&apos;s Offered
                                                </Typography>
                                            </Stack>
                                            <LinkifiedText text={benefitsText} />
                                        </Box>
                                    </Box>
                                )}

                                {/* ═══════════ HOW TO APPLY ═══════════ */}
                                {howToApply && (
                                    <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2 }}>
                                        <SectionLabel>How to Apply</SectionLabel>
                                        <Box
                                            sx={(t) => ({
                                                p: 2, borderRadius: 2.5,
                                                border: "1px solid", borderColor: alpha(t.palette.info.main, 0.18),
                                                bgcolor: alpha(t.palette.info.main, 0.03),
                                            })}
                                        >
                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                                                <InfoOutlinedIcon sx={{ fontSize: 15, color: "info.main" }} />
                                                <Typography sx={{ fontWeight: 800, fontSize: 12, color: "info.dark" }}>
                                                    Additional Instructions
                                                </Typography>
                                            </Stack>
                                            <LinkifiedText text={howToApply} />
                                        </Box>
                                    </Box>
                                )}




                            </>
                        )}

                        {/* ═══════════ TAB: APPLICATIONS (owner only) ═══════════ */}
                        {detailTab === "applications" && isOwner && (
                            <JobApplicationsPanel jobId={job?.id || jobId} />
                        )}
                    </Box>
                ) : (
                    /* ═══════════ EMPTY STATE ═══════════ */
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 2, py: 3 }}>
                        <Box sx={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.1, textAlign: "center" }}>
                            <Box
                                sx={{
                                    width: 88, height: 88, borderRadius: "20px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    border: "1px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.06),
                                    bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                                    boxShadow: (t) => `0 1px 0 ${alpha(t.palette.text.primary, 0.04)}`,
                                }}
                            >
                                <WorkOutlineRoundedIcon sx={{ fontSize: 48, color: "primary.main" }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Select a job</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                                Choose a job from the listings to see its full details, pay, and how to apply.
                            </Typography>
                            {onClose && (
                                <Button variant="text" size="small" onClick={onClose} sx={{ mt: 0.5, textTransform: "none", fontWeight: 800 }}>
                                    Back to browse
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Delete dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Job</Typography>
                    <IconButton aria-label="Close" onClick={() => setDeleteOpen(false)} disabled={isDeleting}
                                sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Are you sure you want to delete &quot;{job?.title}&quot;? This cannot be undone.
                        </Typography>
                        {deleteError && <Alert severity="error" sx={{ borderRadius: 2 }}>{deleteError.message || "Failed to delete."}</Alert>}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Share dialog */}
            <ShareDialog
                contentType="job"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                viewer={loggedInUser || user}
                job={job ? { ...job, id: job.id || jobId } : { id: jobId }}
                sx={{ zIndex: 100001 }}
            />

            {/* Copy toast */}
            <SuccessSnackbar
                open={copied} onClose={() => setCopied(false)}
                message="Link copied to clipboard"
            />
        </Box>
    );
}

/* ─────────────────── Sub-components ─────────────────── */

function SectionLabel({ children }) {
    return (
        <Typography
            sx={{
                fontWeight: 900, fontSize: 11,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "text.secondary",
                mb: 1.25,
            }}
        >
            {children}
        </Typography>
    );
}

function DetailCard({ icon, label, value, highlight = false }) {
    return (
        <Box
            sx={(t) => ({
                p: 1.25, borderRadius: 2,
                border: "1px solid",
                borderColor: highlight ? alpha(t.palette.success.main, 0.2) : alpha(t.palette.text.primary, 0.06),
                bgcolor: highlight ? alpha(t.palette.success.main, 0.04) : alpha(t.palette.text.primary, 0.015),
                display: "flex", alignItems: "flex-start", gap: 1,
            })}
        >
            <Box sx={(t) => ({ mt: 0.15, flexShrink: 0, color: highlight ? t.palette.success.main : t.palette.primary.main, display: "flex" })}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "text.secondary", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {label}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere", mt: 0.15 }}>
                    <LinkifyInline text={value} />
                </Typography>
            </Box>
        </Box>
    );
}

/**
 * Lightweight inline linkifier — renders plain text as-is but converts
 * any URLs, emails, or phone numbers into clickable links.
 * Used inside DetailCard values and anywhere short text might contain a link.
 */
function LinkifyInline({ text }) {
    if (!text || typeof text !== "string") return text || null;
    // Quick check — skip the regex work if there's nothing link-like
    if (!/https?:\/\/|www\.|@|\.\w{2,}/.test(text)) return text;

    const combined = /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const parts = text.split(combined);

    return parts.map((part, i) => {
        // URL (http:// or https://)
        if (/^https?:\/\//i.test(part)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        // www. link (no protocol)
        if (/^www\./i.test(part)) {
            return (
                <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        // Email
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
            return (
                <a key={i} href={`mailto:${part}`}
                   style={{ color: "inherit", fontWeight: 700 }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });
}
