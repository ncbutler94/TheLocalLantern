// src/pages/jobs/JobDetail.jsx
//
// Full-page job detail view (route: /jobs/:jobId)
// Professional styling to match JobDetailPanel.
//
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { secureFetch } from "../../utils/secureFetch";
import { alpha } from "@mui/material/styles";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import CloseIcon from "@mui/icons-material/Close";
import AccountAvatar from "../../components/AccountAvatar";
import { fetchJobById, deleteJob, renewJob } from "./api/jobs";
import { getCategoryInfo, getJobTypeLabel, getExperienceLevelLabel, formatExpiryInfo } from "./utils/jobHelpers";
import useLivePoster from "./hooks/useLivePoster";
import { useAuth } from "../../components/AuthModalContext";
import { useActiveAccount } from "../../components/AccountContext";
import CreateJobModal from "./modals/CreateJobModal";
import ShareDialog from "../../components/ShareDialog";
import ApplyToJobDialog from "./components/ApplyToJobDialog";
import JobApplicationsPanel from "./components/JobApplicationsPanel";
import UserCardPopover from "../../components/UserCardPopover";
import PulsingDots from "../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../components/NetworkErrorState";
import RichTextDisplay from "../../components/RichTextDisplay";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import SmartMenu from "../../components/SmartMenu";
import useChromeTop from "../../hooks/useChromeTop";

/* ── Linkified text — renders URLs, www. links, emails, and phone numbers as clickable ── */
const LINK_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/gi;

function LinkifiedText({ text }) {
    if (!text) return null;
    const str = String(text);

    if (!/https?:\/\/|www\.|@|\d{3}/.test(str)) {
        return (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                {str}
            </Typography>
        );
    }

    const parts = str.split(LINK_REGEX);
    const elements = parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}>
                    {part}
                </a>
            );
        }
        if (/^www\./i.test(part)) {
            return (
                <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}>
                    {part}
                </a>
            );
        }
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
            return (
                <a key={i} href={`mailto:${part}`}
                   style={{ color: "inherit", fontWeight: 700 }}>
                    {part}
                </a>
            );
        }
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
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {elements}
        </Typography>
    );
}

/* ── timeAgo ── */
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

const MAX_LISTING_DAYS = 90;
const EXTEND_OPTIONS = [7, 14, 30, 60, 90];

/** Returns the number of whole days remaining until `expiresAt`, floored to 0 for expired listings. */
const getRemainingDays = (expiresAt) => {
    if (!expiresAt) return 0;
    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.valueOf())) return 0;
    const diffMs = exp.getTime() - Date.now();
    return diffMs > 0 ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : 0;
};

/** Returns a human-readable date string for a date X days from now. */
const futureDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function JobDetail({ user: propUser }) {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const chromeTop = useChromeTop();

    // ── Listen for auth:token-expired from secureFetch / axiosInstance ──
    useEffect(() => {
        const handleTokenExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    const { activeAccount, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const user = propUser || auth?.user || null;

    const cameFromJobs = location?.state?.from === "jobs";
    const fromNotifications = Boolean(location?.state?.fromNotifications);

    // "Return to [name]'s profile" support (when navigating from UserProfilePage)
    const fromUserProfile = Boolean(location?.state?.fromProfile);
    const backProfileName = location?.state?.backProfileName || '';
    const backProfileHandle = location?.state?.backProfileHandle || '';
    const backProfileId = location?.state?.backProfileId || '';
    const backToProfileUrl =
        location?.state?.backToProfileUrl ||
        (backProfileHandle ? `/${backProfileHandle}` : backProfileId ? `/${backProfileId}` : '');

    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Menu
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);

    // Delete
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit
    const [editOpen, setEditOpen] = useState(false);

    // Report
    const [reportOpen, setReportOpen] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);

    // Apply
    const [applyOpen, setApplyOpen] = useState(false);

    // Toast
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [errorToast, setErrorToast] = useState({ open: false, msg: "" });

    // Share
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // UserCardPopover
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    // Detail tab (details vs applications)
    const [detailTab, setDetailTab] = useState(() => {
        const stateTab = location?.state?.detailTab;
        return stateTab === 'applications' ? 'applications' : 'details';
    });
    const [applicationCount, setApplicationCount] = useState(0);
    const highlightApplicationUserId = Number(location?.state?.highlightApplicationUserId || 0) || null;

    // Renew / Extend dialog
    const [renewOpen, setRenewOpen] = useState(false);
    const [renewDays, setRenewDays] = useState(30);
    const [isRenewing, setIsRenewing] = useState(false);
    const [renewError, setRenewError] = useState(null);
    const [extendRemaining, setExtendRemaining] = useState(0);

    // Fade-in
    const [visible, setVisible] = useState(false);

    useEffect(() => {
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
        if (jobId) load();
        return () => controller.abort();
    }, [jobId]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // ── Ownership — prefer backend-computed isOwner (account-aware) ──
    const viewerId = Number(user?.id || 0);
    const posterId = Number(job?.posterUserId || job?.createdByUserId || job?.created_by_user_id || 0);
    // Live poster overrides — fetches /users/public/:id once per unique
    // posterUserId and caches process-wide. Belt-and-suspenders on top of the
    // server-side live join: guarantees the page shows the current name,
    // handle, and profile picture. Returns null fields for business/artist
    // jobs (those are entity-identified, not user-identified).
    const livePoster = useLivePoster(job);
    const jobPosterHandle = livePoster.handle || job?.posterHandle || job?.poster_handle || null;
    const activeSlug = activeAccount?.slug || null;
    const isBusiness = job?.ownerType === "business";
    const isArtist = !isBusiness && Boolean(
        job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id
    );

    // Resolve active account identifier: artist/business slug, or personal handle
    const activeIdentifier = activeSlug || user?.handle || null;
    const clientIsOwner = Boolean(
        viewerId && posterId && viewerId === posterId &&
        jobPosterHandle && activeIdentifier &&
        String(jobPosterHandle).toLowerCase() === String(activeIdentifier).toLowerCase()
    );
    const isOwner = Boolean(job?.isOwner) || clientIsOwner;
    const isOnCorrectAccount = isOwner;
    const isConnectedButWrongAccount = false;

    // Track whether we've consumed the initial navigation state
    const initialNavConsumedRef = useRef(false);

    // Reset tab when job changes — but respect navigation state on initial mount
    useEffect(() => {
        if (!initialNavConsumedRef.current) {
            initialNavConsumedRef.current = true;
            // On first mount, honour the location state (e.g. detailTab: 'applications')
            const stateTab = location?.state?.detailTab;
            if (stateTab === 'applications') {
                setDetailTab('applications');
                return;
            }
        }
        setDetailTab("details");
        setApplicationCount(0);
    }, [jobId]);

    // Fetch application count for owner's jobs
    useEffect(() => {
        if (!jobId || !isOwner) {
            setApplicationCount(0);
            return;
        }
        let alive = true;
        async function loadCount() {
            try {
                const res = await secureFetch(`/api/jobs/${jobId}/applications?status=`, {
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
    }, [jobId, isOwner]);

    // Derived
    const posterAvatar = livePoster.avatarUrl || String(job?.posterAvatar || job?.poster_avatar || "").trim();
    const posterName = livePoster.name || job?.posterName || job?.poster_name || "";
    const companyName = job?.company || job?.companyName || job?.company_name || "";
    const logoUrl = String(job?.logoUrl || job?.logo_url || "").trim();
    const pay = job?.pay || "";
    const jobTypeRaw = job?.jobType || job?.job_type || "";
    const jobTypeLabel = getJobTypeLabel(jobTypeRaw);
    const workMode = job?.workMode || job?.work_mode || "";
    const categorySlug = job?.categoryName || job?.category || "";
    const catInfo = categorySlug ? getCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;
    const locationLabel = job?.locationLabel || job?.location_label || "";
    const howToApply = job?.howToApply || job?.how_to_apply || "";
    const avatarFromJob = job ? resolveAvatar(job) : "";
    // Use the viewer's live avatar when they are the poster, so profile-pic
    // changes are reflected immediately without needing to re-save the job.
    const avatarSrc = (() => {
        if (!isOwner) return avatarFromJob;
        const live = activeAccount?.avatar_url || activeAccount?.logo_url
            || user?.avatar_url || user?.profile_picture || "";
        return String(live).trim() || avatarFromJob;
    })();
    const headerName = posterName || companyName || "Someone";
    const createdAt = job?.createdAt || job?.created_at || "";
    const fresh = isNewJob(createdAt);
    const rawExpiresAt = job?.expiresAt || job?.expires_at || "";
    const isExpired = rawExpiresAt
        ? new Date(rawExpiresAt).getTime() <= Date.now()
        : false;

    // v2 fields
    const expLevelRaw = job?.experienceLevel || job?.experience_level || "";
    const expLevelLabel = getExperienceLevelLabel(expLevelRaw);
    const benefitsText = job?.benefits || "";
    const scheduleText = job?.schedule || "";
    const viewerApplied = Boolean(job?.viewerApplied || job?.isApplied || job?.is_applied);

    // Expiry info for owner
    const expiryInfo = isOwner ? formatExpiryInfo(rawExpiresAt) : null;

    const createdLabel = (() => {
        const raw = job?.createdAt || job?.created_at || job?.timeAgo;
        if (!raw) return "";
        if (typeof raw === "string" && raw.includes("ago")) return raw;
        return timeAgoCompact(raw);
    })();

    // Handlers
    const handleCopyLink = () => {
        setMenuAnchor(null);
        const url = `${window.location.origin}/jobs/${jobId}`;
        navigator.clipboard.writeText(url).then(() => {
            showSuccess("Link copied to clipboard");
        }).catch(() => {
            setErrorToast({ open: true, msg: "Could not copy link." });
        });
    };

    const handleDelete = async () => {
        if (!job) return;
        setIsDeleting(true);
        try {
            await deleteJob(job.id);
            setDeleteOpen(false);
            showSuccess("Job deleted.");
            setTimeout(() => navigate("/jobs"), 600);
        } catch {
            setErrorToast({ open: true, msg: "Failed to delete job." });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReport = async (reason, details) => {
        try {
            await secureFetch(`/api/jobs/${encodeURIComponent(jobId)}/flag`, {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details: details || "" }),
            });
        } catch {
            setErrorToast({ open: true, msg: "Could not send report." });
        }
    };

    const handleBack = () => {
        if (fromUserProfile) {
            try {
                const rawKey = backProfileHandle || backProfileId;
                const norm = String(rawKey || '').replace(/^@/, '').trim();
                const candidates = [rawKey, norm, norm ? `@${norm}` : ''].filter(Boolean);
                candidates.forEach((k) => {
                    sessionStorage.setItem(`ll:profile:${k}:restore`, '1');
                });
            } catch { /* ignore */ }

            if (window.history.length > 1) {
                navigate(-1);
                return;
            }
            if (backToProfileUrl) {
                navigate(backToProfileUrl, { state: { restoreProfile: true, fromPostPage: true } });
            } else {
                navigate('/', { state: { restoreProfile: true, fromPostPage: true } });
            }
            return;
        }
        if (cameFromJobs) {
            navigate("/jobs", { state: { from: "job-detail" } });
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/jobs");
        }
    };

    const handleOpenUserCard = (e) => {
        if (!job) return;
        const handle = livePoster.handle || job?.posterHandle || job?.poster_handle || null;
        const cardData = {
            id: job?.posterUserId || job?.createdByUserId || job?.created_by_user_id,
            user_id: job?.posterUserId || job?.createdByUserId || job?.created_by_user_id,
            handle,
            profilePath: livePoster.profilePath || job?.posterProfilePath || job?.poster_profile_path || null,
            first_name: posterName || companyName || "User",
            last_name: "",
            avatar_url: avatarSrc,
        };
        if (isBusiness) {
            cardData.account_type = 'business';
            cardData.business_id = job?.businessId || job?.business_id || job?.pageId || job?.page_id || undefined;
            cardData.business_name = companyName || posterName;
            cardData.business_slug = job?.businessSlug || job?.business_slug || handle;
            cardData.business_avatar_url = avatarSrc;
        } else {
            const isJobArtist = job?.ownerType === "artist" || Boolean(
                job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id
            );
            if (isJobArtist) {
                cardData.account_type = 'artist';
                cardData.artist_id = job?.artistId || job?.artist_id || job?.posterArtistId || job?.poster_artist_id || undefined;
                cardData.artist_name = posterName || companyName;
                cardData.artist_handle = job?.artistHandle || job?.artist_handle || handle;
                cardData.artist_avatar_url = avatarSrc;
            }
        }
        setUserAnchor(e.currentTarget);
        setUserForCard(cardData);
    };

    const handleCloseUserCard = () => {
        setUserAnchor(null);
        setUserForCard(null);
    };

    const handleViewUserProfile = (u) => {
        const path = u?.profilePath
            || (u?.handle ? `/${u.handle}` : null)
            || (u?.id ? `/${u.id}` : null);
        handleCloseUserCard();
        if (path) window.location.assign(path);
    };

    const isSelfForCard = useMemo(() => {
        if (!user || !userForCard) return false;
        const cardBizId = userForCard.business_id;
        const cardArtId = userForCard.artist_id;
        const cardIsAccount = Boolean(
            userForCard.account_type === 'business' ||
            userForCard.account_type === 'artist' ||
            cardBizId || cardArtId
        );
        if (cardBizId && isBusinessAccount && activeBusinessId) {
            return String(activeBusinessId) === String(cardBizId);
        }
        if (cardArtId && isArtistAccount && activeArtistId) {
            return String(activeArtistId) === String(cardArtId);
        }
        if (cardIsAccount) return false;
        if (isBusinessAccount || isArtistAccount) return false;
        const cardHandle = (userForCard.handle || '').toLowerCase();
        const viewerHandle = (user.handle || '').toLowerCase();
        if (cardHandle && viewerHandle && cardHandle !== viewerHandle) return false;
        return user.id != null && userForCard.id != null &&
            String(user.id) === String(userForCard.id);
    }, [user, userForCard, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId]);

    // Listen for block/hide events from UserCardPopover
    useEffect(() => {
        const handleHiddenOrBlocked = (e) => {
            const { userId, hidden, blocked } = e?.detail || {};
            if (!userId) return;
            if (!hidden && !blocked) return;
            const posterId = Number(
                job?.posterUserId || job?.createdByUserId || job?.created_by_user_id || 0
            );
            if (posterId === Number(userId)) {
                showSuccess(hidden ? "User hidden. Redirecting..." : "User blocked. Redirecting...");
                setTimeout(() => navigate("/jobs"), 800);
            }
        };
        window.addEventListener("ll:user:hidden-changed", handleHiddenOrBlocked);
        window.addEventListener("ll:user:blocked-changed", handleHiddenOrBlocked);
        return () => {
            window.removeEventListener("ll:user:hidden-changed", handleHiddenOrBlocked);
            window.removeEventListener("ll:user:blocked-changed", handleHiddenOrBlocked);
        };
    }, [job, navigate]);

    const handleOpenExtend = () => {
        const remaining = getRemainingDays(rawExpiresAt);
        const maxExtend = Math.max(0, MAX_LISTING_DAYS - remaining);
        setExtendRemaining(remaining);
        // Pick the largest available option that fits, or the smallest if none fit
        const available = EXTEND_OPTIONS.filter((d) => d <= maxExtend);
        const defaultPick = available.length > 0
            ? (available.includes(30) ? 30 : available[available.length - 1])
            : EXTEND_OPTIONS[0];
        setRenewDays(defaultPick);
        setRenewError(null);
        setRenewOpen(true);
    };

    const handleConfirmRenew = async () => {
        if (!job) return;
        setIsRenewing(true);
        setRenewError(null);
        try {
            // For active listings, add extension on top of remaining time.
            // For expired listings (remaining === 0), just use the chosen days.
            const totalDays = extendRemaining + renewDays;
            const updated = await renewJob(job.id, totalDays);
            setRenewOpen(false);
            // Refresh the job data with the new expiry
            if (updated && typeof updated === "object") {
                setJob((prev) => prev ? { ...prev, ...updated } : updated);
            } else {
                // Re-fetch if the API didn't return the updated job
                const data = await fetchJobById(jobId);
                const resolved = data && typeof data === "object" && data.job ? data.job : data;
                setJob(resolved || null);
            }
            showSuccess("Listing extended successfully!");
        } catch (err) {
            setRenewError(err);
        } finally {
            setIsRenewing(false);
        }
    };

    const tooltipSx = { fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, maxWidth: 240 };

    // ── Outer layout ──
    const outerSx = {
        width: "100%",
        maxWidth: 820,
        mx: "auto",
        px: { xs: 0, sm: 2, md: 3 },
        py: { xs: 0, sm: 3 },
        pt: { xs: `${chromeTop}px`, sm: 3 },
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: (t) => `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}, transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
    };

    const paperSx = (t) => ({
        borderRadius: { xs: 0, sm: 3 },
        border: "none",
        bgcolor: "background.paper",
        backgroundImage: "none",
        boxShadow: { xs: "none", sm: `0 16px 56px ${alpha(t.palette.text.primary, 0.08)}` },
        overflow: "hidden",
    });

    // Loading
    if (isLoading) {
        return (
            <Box sx={outerSx}>
                <Paper variant="outlined" sx={paperSx}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
                        <PulsingDots />
                    </Box>
                </Paper>
            </Box>
        );
    }

    // Network offline
    if (isNetworkError(error)) {
        return (
            <Box sx={{ ...outerSx, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <NetworkErrorState onRetry={() => window.location.reload()} />
            </Box>
        );
    }

    // Error / not found
    if (error || !job) {
        return (
            <Box sx={outerSx}>
                <Paper variant="outlined" sx={(t) => ({ ...paperSx(t), p: 3 })}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {error?.message || "This job does not exist or has been removed."}
                    </Typography>
                    {!fromNotifications && (
                        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ textTransform: "none", fontWeight: 800 }}>
                            {fromUserProfile
                                ? backProfileName
                                    ? `Return to ${backProfileName}'s profile`
                                    : 'Return to Profile'
                                : 'Back to Jobs'}
                        </Button>
                    )}
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={outerSx}>
            <Paper variant="outlined" sx={paperSx}>

                {/* ═══════════ BACK BAR ═══════════ */}
                {!fromNotifications && (
                    <Box
                        sx={(t) => ({
                            display: "flex", alignItems: "center", gap: 1,
                            px: { xs: 2, sm: 3 }, py: 1,
                            borderBottom: "1px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                        })}
                    >
                        <Button
                            onClick={handleBack}
                            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                            sx={{
                                px: 1.5, py: 0.5, minWidth: 0,
                                fontWeight: 800, fontSize: 13,
                                textTransform: "none", borderRadius: 999,
                                "&:hover": { bgcolor: "action.hover" },
                            }}
                        >
                            {fromUserProfile
                                ? backProfileName
                                    ? `Return to ${backProfileName}'s profile`
                                    : 'Return to Profile'
                                : 'Back to Jobs'}
                        </Button>
                    </Box>
                )}

                {/* ═══════════ HERO HEADER ═══════════ */}
                <Box
                    sx={(t) => ({
                        px: { xs: 2, sm: 3 },
                        pt: { xs: 2.5, sm: 3 },
                        pb: 2.5,
                        background: `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 45%, transparent 100%)`,
                        borderBottom: "1px solid",
                        borderColor: alpha(t.palette.primary.main, 0.08),
                    })}
                >
                    {/* Poster row */}
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Box
                            onClick={handleOpenUserCard}
                            sx={{
                                display: "inline-flex", alignItems: "flex-start", gap: 1.5,
                                borderRadius: 2, p: 0.75, m: -0.75,
                                cursor: "pointer", minWidth: 0,
                                transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) },
                            }}
                        >
                            <AccountAvatar
                                src={avatarSrc}
                                accountType={isBusiness ? "business" : isArtist ? "artist" : "user"}
                                size={{ xs: 48, sm: 56 }}
                                sx={{
                                    border: "2px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.08),
                                }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, minWidth: 0 }}>
                                    <Typography
                                        sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 15 }, lineHeight: 1.3 }}
                                    >
                                        {headerName}
                                    </Typography>
                                    {Boolean(job?.posterIsVerified || job?.poster_is_verified) && (
                                        <Tooltip title="Verified" arrow>
                                            <VerifiedRoundedIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
                                        </Tooltip>
                                    )}
                                </Box>
                                {isBusiness && companyName && companyName !== posterName && (
                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{companyName}</Typography>
                                )}
                                {jobPosterHandle ? (
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", lineHeight: 1.3 }}>
                                        @{jobPosterHandle}
                                    </Typography>
                                ) : null}
                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, display: "block", mt: 0.15 }}>
                                    {createdLabel ? `Posted ${createdLabel}` : ""}
                                </Typography>
                            </Box>
                        </Box>

                        {/* NEW badge + 3-dot menu — top right */}
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0, mt: 0.25 }}>
                            {fresh && (
                                <Chip
                                    size="small"
                                    icon={<NewReleasesRoundedIcon sx={{ fontSize: 14 }} />}
                                    label="NEW"
                                    sx={(t) => ({
                                        height: 24, borderRadius: 999, fontWeight: 900, fontSize: 10.5,
                                        letterSpacing: "0.04em", flexShrink: 0,
                                        bgcolor: alpha(t.palette.success.main, 0.12),
                                        color: t.palette.success.dark,
                                        border: "1px solid", borderColor: alpha(t.palette.success.main, 0.3),
                                        "& .MuiChip-icon": { color: t.palette.success.dark },
                                        "& .MuiChip-label": { px: 0.5 },
                                    })}
                                />
                            )}
                            <IconButton
                                size="small"
                                onClick={(e) => setMenuAnchor(e.currentTarget)}
                                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, width: 34, height: 34, flexShrink: 0 }}
                            >
                                <MoreVertIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                        </Stack>
                    </Stack>

                    {/* Title */}
                    <Box sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: { xs: 22, sm: 28 }, lineHeight: 1.2, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                            {job.title || "Untitled job"}
                        </Typography>
                    </Box>

                    {/* ═══════════ ACTION BAR (like Business Detail) ═══════════ */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.5 }}
                    >
                        {/* Primary action — Apply (non-owner) */}
                        {!isOwner && (
                            viewerApplied ? (
                                <Button
                                    variant="outlined"
                                    disableElevation
                                    startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                                    disabled
                                    fullWidth
                                    sx={{
                                        borderRadius: 999, textTransform: "none",
                                        fontWeight: 900, fontSize: 15,
                                        py: 1.1,
                                        color: "success.main",
                                        borderColor: (t) => alpha(t.palette.success.main, 0.3),
                                        "&.Mui-disabled": { color: "success.main", borderColor: (t) => alpha(t.palette.success.main, 0.3) },
                                    }}
                                >
                                    Applied
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    disableElevation
                                    startIcon={<SendRoundedIcon sx={{ fontSize: 17, transform: "rotate(-30deg)" }} />}
                                    onClick={() => { if (!user) { auth?.openLoginPopup?.(); return; } setApplyOpen(true); }}
                                    fullWidth
                                    sx={{
                                        borderRadius: 999, textTransform: "none",
                                        fontWeight: 900, fontSize: 15,
                                        py: 1.1,
                                        "&:hover": { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.18)}` },
                                    }}
                                >
                                    Apply Now
                                </Button>
                            )
                        )}

                        {/* Share button */}
                        <Button
                            variant="outlined"
                            startIcon={<ShareRoundedIcon sx={{ fontSize: 17 }} />}
                            onClick={() => setShareDialogOpen(true)}
                            sx={(t) => ({
                                borderRadius: 999, textTransform: "none",
                                fontWeight: 800, fontSize: 13,
                                px: 2, py: 1.1, flexShrink: 0,
                                minWidth: { xs: 0, sm: "auto" },
                                borderColor: alpha(t.palette.text.primary, 0.12),
                                color: "text.secondary",
                                "&:hover": { borderColor: alpha(t.palette.primary.main, 0.4), color: "primary.main" },
                                ...(!isOwner ? { flex: "0 0 auto" } : { flex: 1 }),
                            })}
                        >
                            Share
                        </Button>
                    </Stack>

                </Box>

                {/* ═══════════ OWNER TABS (Details / Applications) ═══════════ */}
                {isOwner && (
                    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                        <Tabs
                            value={detailTab}
                            onChange={(_, v) => setDetailTab(v)}
                            variant="fullWidth"
                            sx={{
                                minHeight: 42,
                                "& .MuiTab-root": {
                                    minHeight: 42, textTransform: "none", fontWeight: 850,
                                    fontSize: 13, py: 0, letterSpacing: "-0.01em",
                                },
                                "& .MuiTabs-indicator": { height: 2.5, borderRadius: 999 },
                            }}
                        >
                            <Tab value="details" icon={<WorkOutlineRoundedIcon sx={{ fontSize: 17 }} />} iconPosition="start" label="Details" />
                            <Tab
                                value="applications"
                                icon={<PeopleAltRoundedIcon sx={{ fontSize: 17 }} />}
                                iconPosition="start"
                                label={applicationCount > 0 ? `Applications (${applicationCount})` : "Applications"}
                            />
                        </Tabs>
                    </Box>
                )}

                {/* ═══════════ EXPIRED BANNER ═══════════ */}
                {isExpired && (
                    <Alert
                        severity="warning"
                        sx={{
                            mx: { xs: 2, sm: 3 }, mt: 2, borderRadius: 2.5,
                            fontWeight: 700, fontSize: 13.5,
                            "& .MuiAlert-icon": { fontSize: 20 },
                        }}
                    >
                        This job listing has expired and is no longer accepting applications.
                    </Alert>
                )}

                {/* ═══════════ OWNER EXPIRY INFO BANNER ═══════════ */}
                {isOwner && expiryInfo && expiryInfo.label && (
                    <Box
                        sx={(t) => ({
                            mx: { xs: 2, sm: 3 },
                            mt: 2,
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: expiryInfo.urgency === "expired"
                                ? alpha(t.palette.error.main, 0.25)
                                : expiryInfo.urgency === "critical"
                                    ? alpha(t.palette.warning.main, 0.25)
                                    : alpha(t.palette.text.primary, 0.08),
                            bgcolor: expiryInfo.urgency === "expired"
                                ? alpha(t.palette.error.main, 0.04)
                                : expiryInfo.urgency === "critical"
                                    ? alpha(t.palette.warning.main, 0.04)
                                    : alpha(t.palette.text.primary, 0.02),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: { xs: "wrap", sm: "nowrap" },
                        })}
                    >
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                            <AccessTimeRoundedIcon
                                sx={{
                                    fontSize: 20,
                                    flexShrink: 0,
                                    color: expiryInfo.urgency === "expired"
                                        ? "error.main"
                                        : expiryInfo.urgency === "critical"
                                            ? "warning.main"
                                            : "text.secondary",
                                }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: 14,
                                        lineHeight: 1.3,
                                        color: expiryInfo.urgency === "expired"
                                            ? "error.main"
                                            : expiryInfo.urgency === "critical"
                                                ? "warning.dark"
                                                : "text.primary",
                                    }}
                                >
                                    {expiryInfo.label}
                                </Typography>
                                {expiryInfo.dateLabel ? (
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>
                                        {expiryInfo.isExpired ? "Was set to expire" : "Expiry date"}: {expiryInfo.dateLabel}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Stack>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AutorenewRoundedIcon sx={{ fontSize: 17 }} />}
                            onClick={handleOpenExtend}
                            sx={(t) => ({
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                                fontSize: 13,
                                px: 2,
                                py: 0.6,
                                flexShrink: 0,
                                borderColor: expiryInfo.urgency === "expired"
                                    ? alpha(t.palette.error.main, 0.35)
                                    : expiryInfo.urgency === "critical"
                                        ? alpha(t.palette.warning.main, 0.35)
                                        : alpha(t.palette.primary.main, 0.3),
                                color: expiryInfo.urgency === "expired"
                                    ? t.palette.error.main
                                    : expiryInfo.urgency === "critical"
                                        ? t.palette.warning.dark
                                        : t.palette.primary.main,
                                "&:hover": {
                                    borderColor: expiryInfo.urgency === "expired"
                                        ? t.palette.error.main
                                        : expiryInfo.urgency === "critical"
                                            ? t.palette.warning.main
                                            : t.palette.primary.main,
                                    bgcolor: expiryInfo.urgency === "expired"
                                        ? alpha(t.palette.error.main, 0.06)
                                        : expiryInfo.urgency === "critical"
                                            ? alpha(t.palette.warning.main, 0.06)
                                            : alpha(t.palette.primary.main, 0.06),
                                },
                            })}
                        >
                            Extend Listing
                        </Button>
                    </Box>
                )}

                {/* ═══════════ TAB: DETAILS ═══════════ */}
                {detailTab === "details" && (
                    <>
                        {/* ═══════════ CONTENT BODY ═══════════ */}
                        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: 1 }}>

                            {/* Job Details — 2-column cards */}
                            <Box sx={{ mb: 3 }}>
                                <SectionLabel>Job Details</SectionLabel>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.25 }}>
                                    {jobTypeLabel && (
                                        <DetailCard icon={<ScheduleRoundedIcon sx={{ fontSize: 20 }} />} label="Job Type" value={jobTypeLabel} />
                                    )}
                                    {workMode && (
                                        <DetailCard icon={<ComputerRoundedIcon sx={{ fontSize: 20 }} />} label="Work Mode" value={workMode} />
                                    )}
                                    {locationLabel && (
                                        <DetailCard icon={<PlaceRoundedIcon sx={{ fontSize: 20 }} />} label="Location" value={locationLabel} />
                                    )}
                                    {pay && (
                                        <DetailCard icon={<AttachMoneyRoundedIcon sx={{ fontSize: 20 }} />} label="Compensation" value={pay} highlight />
                                    )}
                                    {catInfo && (
                                        <DetailCard
                                            icon={CatIcon ? <CatIcon sx={{ fontSize: 20 }} /> : <CategoryRoundedIcon sx={{ fontSize: 20 }} />}
                                            label="Category"
                                            value={catInfo.name}
                                        />
                                    )}
                                    {expLevelLabel && (
                                        <DetailCard icon={<SchoolRoundedIcon sx={{ fontSize: 20 }} />} label="Experience" value={expLevelLabel} />
                                    )}
                                    {scheduleText && (
                                        <DetailCard icon={<EventNoteRoundedIcon sx={{ fontSize: 20 }} />} label="Schedule" value={scheduleText} />
                                    )}
                                </Box>
                            </Box>

                            {/* Description */}
                            <Box sx={{ mb: 3 }}>
                                <SectionLabel>Description</SectionLabel>
                                <Box
                                    sx={(t) => ({
                                        position: "relative",
                                        p: { xs: 2, sm: 2.5 }, borderRadius: 2.5,
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

                            {/* Benefits & Perks */}
                            {benefitsText && (
                                <Box sx={{ mb: 3 }}>
                                    <SectionLabel>Benefits &amp; Perks</SectionLabel>
                                    <Box
                                        sx={(t) => ({
                                            p: { xs: 2, sm: 2.5 }, borderRadius: 2.5,
                                            border: "1px solid", borderColor: alpha(t.palette.success.main, 0.18),
                                            bgcolor: alpha(t.palette.success.main, 0.03),
                                        })}
                                    >
                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                            <CardGiftcardRoundedIcon sx={{ fontSize: 16, color: "success.main" }} />
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: "success.dark" }}>
                                                What&apos;s Offered
                                            </Typography>
                                        </Stack>
                                        <LinkifiedText text={benefitsText} />
                                    </Box>
                                </Box>
                            )}

                            {/* How to Apply */}
                            {howToApply && (
                                <Box sx={{ mb: 3 }}>
                                    <SectionLabel>How to Apply</SectionLabel>
                                    <Box
                                        sx={(t) => ({
                                            p: { xs: 2, sm: 2.5 }, borderRadius: 2.5,
                                            border: "1px solid", borderColor: alpha(t.palette.info.main, 0.18),
                                            bgcolor: alpha(t.palette.info.main, 0.03),
                                        })}
                                    >
                                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                                            <InfoOutlinedIcon sx={{ fontSize: 16, color: "info.main" }} />
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: "info.dark" }}>
                                                Additional Instructions
                                            </Typography>
                                        </Stack>
                                        <LinkifiedText text={howToApply} />
                                    </Box>
                                </Box>
                            )}


                            {/* Bottom CTA */}
                            {!isOwner ? (
                                <Box
                                    sx={(t) => ({
                                        mb: 2, p: 3,
                                        borderRadius: 3,
                                        border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.15),
                                        bgcolor: alpha(t.palette.primary.main, 0.025),
                                        textAlign: "center",
                                    })}
                                >
                                    <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 0.5 }}>
                                        Interested in this position?
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: 13 }}>
                                        Submit your application and resume directly to the employer.
                                    </Typography>
                                    {viewerApplied ? (
                                        <Button
                                            variant="outlined"
                                            disableElevation
                                            startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 17 }} />}
                                            disabled
                                            sx={{
                                                borderRadius: 999, textTransform: "none",
                                                fontWeight: 900, fontSize: 15,
                                                px: 5, py: 1.1,
                                                color: "success.main",
                                                borderColor: (t) => alpha(t.palette.success.main, 0.3),
                                                "&.Mui-disabled": { color: "success.main", borderColor: (t) => alpha(t.palette.success.main, 0.3) },
                                            }}
                                        >
                                            Applied
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            disableElevation
                                            startIcon={<SendRoundedIcon sx={{ fontSize: 17, transform: "rotate(-30deg)" }} />}
                                            onClick={() => { if (!user) { auth?.openLoginPopup?.(); return; } setApplyOpen(true); }}
                                            sx={{
                                                borderRadius: 999, textTransform: "none",
                                                fontWeight: 900, fontSize: 15,
                                                px: 5, py: 1.1,
                                                "&:hover": { boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.18)}` },
                                            }}
                                        >
                                            Apply Now
                                        </Button>
                                    )}
                                </Box>
                            ) : null}
                        </Box>
                    </>
                )}

                {/* ═══════════ TAB: APPLICATIONS (owner only) ═══════════ */}
                {detailTab === "applications" && isOwner && (
                    <Box sx={{ minHeight: 300 }}>
                        <JobApplicationsPanel jobId={job?.id || jobId} highlightUserId={highlightApplicationUserId} />
                    </Box>
                )}
            </Paper>

            {/* ── 3-dot Menu ── */}
            <SmartMenu
                disableScrollLock
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={() => setMenuAnchor(null)}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } } }}
            >
                <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>

                {isOwner && <Divider sx={{ my: 0.5 }} />}

                {isOwner && (
                    <Tooltip title={isConnectedButWrongAccount ? `Switch to "${posterName || "the account"}" to edit` : ""} placement="left" arrow
                             componentsProps={{ tooltip: { sx: tooltipSx } }}>
                        <span>
                            <MenuItem disabled={isConnectedButWrongAccount}
                                      onClick={() => { setMenuAnchor(null); if (isOnCorrectAccount) setEditOpen(true); }}
                                      sx={{ py: 1 }}>
                                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Edit job" />
                            </MenuItem>
                        </span>
                    </Tooltip>
                )}

                {isOwner && (
                    <Tooltip title={isConnectedButWrongAccount ? `Switch to "${posterName || "the account"}" to delete` : ""} placement="left" arrow
                             componentsProps={{ tooltip: { sx: tooltipSx } }}>
                        <span>
                            <MenuItem disabled={isConnectedButWrongAccount}
                                      onClick={() => { setMenuAnchor(null); if (isOnCorrectAccount) setDeleteOpen(true); }}
                                      sx={{ py: 1, color: isConnectedButWrongAccount ? "text.disabled" : "error.main" }}>
                                <ListItemIcon sx={{ color: isConnectedButWrongAccount ? "text.disabled" : "error.main" }}>
                                    <DeleteIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Delete job" />
                            </MenuItem>
                        </span>
                    </Tooltip>
                )}

                {!isOwner && <Divider sx={{ my: 0.5 }} />}
                {!isOwner && (
                    <MenuItem onClick={() => { setMenuAnchor(null); setReportReason(""); setReportDetails(""); setReportSubmitted(false); setReportOpen(true); }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report job" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* ── Delete Dialog ── */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ fontWeight: 900 }}>Delete Job</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete &quot;{job?.title}&quot;? This cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)} disabled={isDeleting}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Report Dialog ── */}
            <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
                    sx={{ zIndex: 100001 }}
            >
                {reportSubmitted ? (
                    <>
                        <DialogContent sx={{ textAlign: "center", py: 5, px: 3 }}>
                            <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
                                <CheckCircleRoundedIcon sx={{ fontSize: 48, color: "success.main" }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1 }}>
                                Thank you for your report
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", lineHeight: 1.5 }}>
                                We take reports seriously and will review this job. If it violates our community guidelines, we'll take appropriate action.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button
                                onClick={() => { setReportOpen(false); setTimeout(() => { setReportSubmitted(false); setReportReason(""); setReportDetails(""); }, 250); }}
                                fullWidth variant="contained" disableElevation
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, py: 1 }}
                            >
                                Done
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <>
                        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5, fontWeight: 800, fontSize: 18 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <FlagOutlinedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                Report job
                            </Box>
                            <IconButton size="small" onClick={() => setReportOpen(false)} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 0, pb: 1 }}>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2, lineHeight: 1.5 }}>
                                Why are you reporting this job? Your report is anonymous.
                            </Typography>
                            <RadioGroup value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                                {[
                                    { value: "spam", label: "Spam or misleading" },
                                    { value: "inappropriate", label: "Inappropriate content" },
                                    { value: "scam", label: "Scam or fraud" },
                                    { value: "other", label: "Other" },
                                ].map((opt) => (
                                    <FormControlLabel
                                        key={opt.value} value={opt.value}
                                        control={<Radio size="small" />}
                                        label={<Typography sx={{ fontSize: 14 }}>{opt.label}</Typography>}
                                        sx={{ mx: 0, py: 0.25, px: 1, borderRadius: 2, "&:hover": { bgcolor: "action.hover" } }}
                                    />
                                ))}
                            </RadioGroup>
                            <TextField
                                multiline minRows={3} maxRows={6} fullWidth
                                placeholder="Add any additional details that might help us review this report…"
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                inputProps={{ maxLength: 1000 }}
                                sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                            />
                            <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textAlign: "right" }}>
                                {reportDetails.length}/1000
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                            <Button onClick={() => setReportOpen(false)} sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={async () => {
                                    setReportSubmitting(true);
                                    await handleReport(reportReason, reportDetails);
                                    setReportSubmitting(false);
                                    setReportSubmitted(true);
                                }}
                                variant="contained" disableElevation
                                disabled={!reportReason || reportSubmitting}
                                startIcon={reportSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                                sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2, px: 3 }}
                            >
                                Submit report
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* ── Edit Modal ── */}
            <CreateJobModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onCreated={() => {
                    setEditOpen(false);
                    showSuccess("Job updated successfully");
                    fetchJobById(jobId).then((data) => {
                        const resolved = data && typeof data === "object" && data.job ? data.job : data;
                        setJob(resolved || null);
                    }).catch(() => {});
                }}
                editingJob={job}
            />

            {/* ── Apply Dialog ── */}
            <ApplyToJobDialog
                open={applyOpen}
                onClose={() => setApplyOpen(false)}
                job={job}
                user={user}
            />

            {/* ── Share Dialog ── */}
            <ShareDialog
                contentType="job"
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                viewer={user}
                job={job ? { ...job, id: job.id || jobId } : { id: jobId }}
                sx={{ zIndex: 100001 }}
            />

            {/* ── Extend / Renew Dialog ── */}
            <Dialog open={renewOpen} onClose={() => setRenewOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                        {extendRemaining > 0 ? "Extend Job Listing" : "Renew Job Listing"}
                    </Typography>
                    <IconButton
                        aria-label="Close"
                        onClick={() => setRenewOpen(false)}
                        disabled={isRenewing}
                        sx={{ position: "absolute", right: 12, top: 12 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {extendRemaining > 0
                                ? <>How many days would you like to add to &quot;{job?.title}&quot;?</>
                                : <>How long would you like to renew &quot;{job?.title}&quot;?</>}
                        </Typography>

                        {/* Current status chip */}
                        <Box
                            sx={(t) => ({
                                p: 1.25,
                                borderRadius: 2,
                                bgcolor: extendRemaining > 0
                                    ? alpha(t.palette.success.main, 0.06)
                                    : alpha(t.palette.error.main, 0.06),
                                border: "1px solid",
                                borderColor: extendRemaining > 0
                                    ? alpha(t.palette.success.main, 0.15)
                                    : alpha(t.palette.error.main, 0.15),
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            })}
                        >
                            <AccessTimeRoundedIcon
                                sx={{
                                    fontSize: 16,
                                    color: extendRemaining > 0 ? "success.main" : "error.main",
                                }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                {extendRemaining > 0
                                    ? `${extendRemaining} day${extendRemaining === 1 ? "" : "s"} remaining`
                                    : "Listing expired"}
                                {expiryInfo?.dateLabel ? ` — ${expiryInfo.dateLabel}` : ""}
                            </Typography>
                        </Box>

                        {(() => {
                            const maxExtend = Math.max(0, MAX_LISTING_DAYS - extendRemaining);
                            const availableOptions = EXTEND_OPTIONS.filter((d) => d <= maxExtend);

                            if (maxExtend <= 0) {
                                return (
                                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        This listing already has {extendRemaining} days remaining
                                        (maximum {MAX_LISTING_DAYS}). No extension needed.
                                    </Alert>
                                );
                            }

                            return (
                                <>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Extend by"
                                        value={availableOptions.includes(renewDays) ? renewDays : (availableOptions[availableOptions.length - 1] || renewDays)}
                                        onChange={(e) => setRenewDays(Number(e.target.value))}
                                    >
                                        {availableOptions.map((d) => (
                                            <MenuItem key={d} value={d}>
                                                {d} day{d === 1 ? "" : "s"}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {/* New expiry preview */}
                                    <Box
                                        sx={(t) => ({
                                            p: 1.25,
                                            borderRadius: 2,
                                            bgcolor: alpha(t.palette.primary.main, 0.04),
                                            border: "1px solid",
                                            borderColor: alpha(t.palette.primary.main, 0.12),
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        })}
                                    >
                                        <AutorenewRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                            New expiry: {futureDate(extendRemaining + renewDays)} ({extendRemaining + renewDays} day{(extendRemaining + renewDays) === 1 ? "" : "s"} total)
                                        </Typography>
                                    </Box>
                                </>
                            );
                        })()}

                        {renewError ? (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {renewError.message || "Failed to extend listing."}
                            </Alert>
                        ) : null}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setRenewOpen(false)} disabled={isRenewing}>
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleConfirmRenew}
                                disabled={isRenewing || (MAX_LISTING_DAYS - extendRemaining) <= 0}
                                startIcon={<AutorenewRoundedIcon />}
                                sx={(t) => ({ fontWeight: 900, color: t.palette.common.white })}
                            >
                                {isRenewing
                                    ? "Extending..."
                                    : extendRemaining > 0
                                        ? "Extend"
                                        : "Renew"}
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* ── Success Toast ── */}
            <SuccessSnackbar {...successSnackbarProps} />

            {/* ── Error Toast ── */}
            <Snackbar
                open={errorToast.open}
                autoHideDuration={3000}
                onClose={() => setErrorToast({ open: false, msg: "" })}
                message={errorToast.msg}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                sx={{ zIndex: 200001 }}
            />

            {/* ── User Card Popover (follow, block, hide) ── */}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={handleCloseUserCard}
                user={userForCard}
                viewer={user}
                isSelf={isSelfForCard}

                onViewProfile={handleViewUserProfile}
            />
        </Box>
    );
}

/* ─────────────────── Sub-components ─────────────────── */

/** Uppercase section label */
function SectionLabel({ children }) {
    return (
        <Typography
            sx={{
                fontWeight: 900, fontSize: 11.5,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "text.secondary",
                mb: 1.5,
            }}
        >
            {children}
        </Typography>
    );
}

/** Card used in the 2-column detail grid */
function DetailCard({ icon, label, value, highlight = false }) {
    return (
        <Box
            sx={(t) => ({
                p: 1.75, borderRadius: 2.5,
                border: "1px solid",
                borderColor: highlight ? alpha(t.palette.success.main, 0.2) : alpha(t.palette.text.primary, 0.06),
                bgcolor: highlight ? alpha(t.palette.success.main, 0.04) : alpha(t.palette.text.primary, 0.015),
                display: "flex", alignItems: "flex-start", gap: 1.25,
            })}
        >
            <Box sx={(t) => ({ mt: 0.2, flexShrink: 0, color: highlight ? t.palette.success.main : t.palette.primary.main, display: "flex" })}>
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {label}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.35, wordBreak: "break-word", overflowWrap: "anywhere", mt: 0.2 }}>
                    <LinkifyInline text={value} />
                </Typography>
            </Box>
        </Box>
    );
}

/**
 * Lightweight inline linkifier — renders plain text as-is but converts
 * any URLs, emails, or phone numbers into clickable links.
 */
function LinkifyInline({ text }) {
    if (!text || typeof text !== "string") return text || null;
    if (!/https?:\/\/|www\.|@|\.\w{2,}/.test(text)) return text;

    const combined = /(https?:\/\/[^\s<]+|www\.[^\s<]+\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/gi;
    const parts = text.split(combined);

    return parts.map((part, i) => {
        if (/^https?:\/\//i.test(part)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        if (/^www\./i.test(part)) {
            return (
                <a key={i} href={`https://${part}`} target="_blank" rel="noopener noreferrer"
                   style={{ color: "inherit", fontWeight: 700, wordBreak: "break-all" }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
            return (
                <a key={i} href={`mailto:${part}`}
                   style={{ color: "inherit", fontWeight: 700 }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        if (/^\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(part)) {
            const digits = part.replace(/\D/g, "");
            return (
                <a key={i} href={`tel:+1${digits}`}
                   style={{ color: "inherit", fontWeight: 700 }}
                   onClick={(e) => e.stopPropagation()}>
                    {part}
                </a>
            );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });
}
