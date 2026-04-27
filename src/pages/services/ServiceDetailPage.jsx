// src/pages/services/ServiceDetailPage.jsx
//
// ServiceDetailPage — clean, professional service showcase.
//
// Layout:
//   HEADER CARD: Cover → Avatar + Title + Badges + Rating + Location → Actions → Tabs
//   LEFT COLUMN: Tab content (About | Contact | Photos | Reviews)
//   RIGHT SIDEBAR (sticky): Provider card + Quote CTA + Message + Location · Hours · Rating

import React, { useEffect, useLayoutEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Rating,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloseIcon from "@mui/icons-material/Close";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkIcon from "@mui/icons-material/Link";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import FacebookRoundedIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ForestRoundedIcon from "@mui/icons-material/ForestRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SmartMenu from "../../components/SmartMenu";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ButtonBase from "@mui/material/ButtonBase";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import axios from "axios";
import { secureFetch } from "../../utils/secureFetch";
import { getAccountHeaders } from "../../utils/getAccountHeadersStatic";

import { fetchServiceById, fetchServiceReviews, checkReviewEligibility, createServiceReview, updateServiceReview, deleteServiceReview, respondToReview, toggleReviewHelpful } from "./api/servicesApi";
import { toggleServiceFavorite } from "./api/serviceFavoritesApi";
import { getServiceCategoryInfo } from "./utils/serviceHelpers";
import { useAuth } from "../../components/AuthModalContext";
import BlockedPostGate, { useBlockedPostGate } from "../../components/BlockedPostGate";
import { useActiveAccount } from "../../components/AccountContext";
import { ReportDialog } from "../../components/ActionBar";
import PhotosUploadSection from "../../components/PhotosUploadSection";
import PulsingDots from "../../components/PulsingDots";
import NetworkErrorState, { isNetworkError } from "../../components/NetworkErrorState";
import ShareServiceDialog from "../../components/ShareServiceDialog";
import AccountAvatar from "../../components/AccountAvatar";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import { PhotoCommentsDialog } from "../profile/userProfile/ProfileHeader";

/* ── GCS upload helpers ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await fetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}
async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

/* ── Constants ── */
const AVATAR_SIZE = { xs: 72, sm: 80, md: 88 };
const MAX_REVIEW_PHOTOS = 4;

/* ── Highlight icons ── */
const HL_ICONS = { Star: StarRoundedIcon, Favorite: FavoriteRoundedIcon, Forest: ForestRoundedIcon, Volunteer: VolunteerActivismRoundedIcon, Groups: GroupsRoundedIcon, CheckCircle: CheckCircleRoundedIcon, Trophy: EmojiEventsRoundedIcon, Shield: GppGoodRoundedIcon, Build: BuildRoundedIcon };
function HlIcon({ name, ...props }) { const I = HL_ICONS[name] || StarRoundedIcon; return <I {...props} />; }

/* ── Hours helpers ── */
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };

function fmt12(t) {
    if (!t) return "";
    const [h, m] = String(t).split(":");
    const hr = parseInt(h, 10);
    if (Number.isNaN(hr)) return t;
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m || "00"} ${hr >= 12 ? "PM" : "AM"}`;
}

function parseHours(obj) {
    if (!obj || typeof obj !== "object") return null;
    const arr = DAY_ORDER.map((k) => {
        const d = obj[k];
        return d ? { day: DAY_LABELS[k], closed: Boolean(d.closed), allDay: Boolean(d.allDay), open: d.open || null, close: d.close || null } : null;
    }).filter(Boolean);
    return arr.some((d) => d.closed || d.allDay || d.open) ? arr : null;
}

function getHoursStatus(obj) {
    if (!obj || typeof obj !== "object") return null;
    const now = new Date();
    const key = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
    const d = obj[key];
    if (!d) return null;
    if (d.closed) return { open: false, label: "Closed now" };
    if (d.allDay) return { open: true, label: "Open 24 hours" };
    if (d.open && d.close) {
        const mins = now.getHours() * 60 + now.getMinutes();
        const [oh, om] = d.open.split(":").map(Number);
        const [ch, cm] = d.close.split(":").map(Number);
        if (mins >= (oh * 60 + (om || 0)) && mins < (ch * 60 + (cm || 0))) return { open: true, label: "Open \u00b7 Closes " + fmt12(d.close) };
        return { open: false, label: "Closed \u00b7 Opens " + fmt12(d.open) };
    }
    return null;
}

/* ── Shared card style ── */
const CARD = (t) => ({ borderRadius: { xs: 0, md: 3 }, border: "none", bgcolor: "background.paper", overflow: "hidden", boxShadow: { xs: "none", md: "0 2px 12px " + alpha(t.palette.text.primary, 0.04) }, flex: { xs: 1, md: "none" } });
const H = { fontWeight: 950, fontSize: 16, letterSpacing: "-0.01em" };

/* ── FAQ item ── */
function FaqItem({ question, answer }) {
    const [open, setOpen] = useState(false);
    return (
        <Box onClick={() => setOpen((p) => !p)} sx={{ py: 1.5, cursor: "pointer", userSelect: "none", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.03) }, px: 1, borderRadius: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", lineHeight: 1.4 }}>{question}</Typography>
                <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: "text.secondary", transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }} />
            </Stack>
            {open && <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.65, color: "text.secondary", whiteSpace: "pre-wrap" }}>{answer}</Typography>}
        </Box>
    );
}

function formatFavCount(n) {
    if (n == null || n < 0) return "0";
    if (n < 1000) return String(n);
    const k = n / 1000;
    return k >= 100 ? Math.round(k) + "k" : Math.round(k * 10) / 10 + "k";
}

/* ── Relative time helper (matches business page) ── */
function reviewTimeAgo(input) {
    if (!input) return "";
    const d = input instanceof Date ? input : new Date(String(input).trim());
    if (!d || Number.isNaN(d.valueOf())) return "";
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}hr ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const wk = Math.floor(day / 7);
    if (wk < 5) return `${wk}wk ago`;
    const mo = Math.floor(day / 30);
    if (mo < 12) return `${mo}mo ago`;
    const yr = Math.floor(day / 365);
    return `${yr}y ago`;
}

/* ── Image popup ── */
function ImagePopup({ open, onClose, src, alt }) {
    if (!src) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, bgcolor: "common.black", overflow: "hidden" } }}>
            <Box sx={{ position: "relative" }}>
                <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, zIndex: 10, color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.4), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) } }}><CloseIcon /></IconButton>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 200, maxHeight: "80vh" }}>
                    <Box component="img" src={src} alt={alt || ""} referrerPolicy="no-referrer" sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />
                </Box>
            </Box>
        </Dialog>
    );
}

/* ── Photo lightbox ── */
function PhotoLightbox({ open, onClose, photos, initialIndex, onReport, isOwner }) {
    const [idx, setIdx] = useState(initialIndex || 0);
    const items = Array.isArray(photos) ? photos.filter((p) => p && p.url) : [];
    useEffect(() => { setIdx(initialIndex || 0); }, [initialIndex, open]);
    if (!items.length) return null;
    const si = Math.max(0, Math.min(idx, items.length - 1));
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, bgcolor: "common.black", overflow: "hidden" } }}>
            <Box sx={{ position: "relative" }}>
                <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, zIndex: 10, color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.4), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) } }}><CloseIcon /></IconButton>
                {!isOwner && typeof onReport === 'function' && (
                    <IconButton aria-label="Report photo" onClick={() => { const p = items[si]; onReport('gallery', p?.url, p?.id || null); }} sx={{ position: "absolute", top: 8, right: 52, zIndex: 10, color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.4), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) } }}><FlagOutlinedIcon /></IconButton>
                )}
                <Box sx={{ width: "100%", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "common.black" }}>
                    <Box component="img" src={items[si].url} alt={"Photo " + (si + 1)} referrerPolicy="no-referrer" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </Box>
                {items.length > 1 && (<>
                    <IconButton onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} sx={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.45), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) } }}><ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
                    <IconButton onClick={() => setIdx((p) => (p + 1) % items.length)} sx={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.45), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) } }}><ArrowForwardIosRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
                    <Box sx={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", color: "common.white", fontSize: "0.82rem", fontWeight: 700, bgcolor: (t) => alpha(t.palette.common.black, 0.5), px: 1.5, py: 0.35, borderRadius: 999 }}>{si + 1} / {items.length}</Box>
                </>)}
            </Box>
            {items.length > 1 && (
                <Stack direction="row" spacing={0.75} sx={{ p: 1.5, overflowX: "auto", bgcolor: "common.black" }}>
                    {items.map((p, i) => <Box key={p.id || i} component="img" src={p.url} alt="" onClick={() => setIdx(i)} referrerPolicy="no-referrer" sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1.5, cursor: "pointer", flexShrink: 0, border: "2px solid", borderColor: i === si ? "common.white" : "transparent", opacity: i === si ? 1 : 0.5, transition: "all 200ms ease", "&:hover": { opacity: 0.9 } }} />)}
                </Stack>
            )}
        </Dialog>
    );
}

/* ── Social links builder ── */
function buildSocialLinks(svc) {
    const mk = (url, icon, tip, color) => url ? { url: url.startsWith("http") ? url : "https://" + url, icon, tip, color } : null;
    return [
        mk(svc.websiteUrl, <LanguageRoundedIcon sx={{ fontSize: 15 }} />, "Website", "text.secondary"),
        mk(svc.facebookUrl, <FacebookRoundedIcon sx={{ fontSize: 15 }} />, "Facebook", "#1877F2"),
        mk(svc.instagramUrl, <InstagramIcon sx={{ fontSize: 15 }} />, "Instagram", "#E1306C"),
        mk(svc.twitterUrl, <XIcon sx={{ fontSize: 13 }} />, "X (Twitter)", "text.primary"),
        mk(svc.youtubeUrl, <YouTubeIcon sx={{ fontSize: 16 }} />, "YouTube", "#FF0000"),
        mk(svc.tiktokUrl, <LinkIcon sx={{ fontSize: 15 }} />, "TikTok", "text.primary"),
    ].filter(Boolean);
}

/* ── Expandable hours widget ── */
function ExpandableHours({ parsedHours, hoursStatus, notes, defaultOpen }) {
    const [expanded, setExpanded] = useState(Boolean(defaultOpen));
    if (!parsedHours && !notes) return null;
    return (
        <Box>
            <ButtonBase onClick={() => setExpanded((v) => !v)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", borderRadius: 1.5, py: 0.25 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                    <Typography sx={{ fontWeight: 900, fontSize: "0.85rem" }}>Hours</Typography>
                    {hoursStatus && (
                        <Chip size="small" label={hoursStatus.label}
                              sx={(t) => ({ height: 22, fontWeight: 800, fontSize: "0.65rem", bgcolor: hoursStatus.open ? alpha(t.palette.success.main, 0.1) : alpha(t.palette.error.main, 0.1), color: hoursStatus.open ? "success.dark" : "error.dark", border: "1px solid", borderColor: hoursStatus.open ? alpha(t.palette.success.main, 0.25) : alpha(t.palette.error.main, 0.2) })} />
                    )}
                </Stack>
                {expanded ? <ExpandLessRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
            </ButtonBase>
            <Collapse in={expanded}>
                <Box sx={{ mt: 1 }}>
                    {parsedHours && parsedHours.length > 0 && (
                        <Stack spacing={0.35}>
                            {parsedHours.map((h, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={(t) => ({ px: 1.25, py: 0.5, borderRadius: 1.5, bgcolor: i % 2 === 0 ? alpha(t.palette.primary.main, 0.03) : "transparent" })}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.82rem" }}>{h.day}</Typography>
                                    <Typography sx={{ fontSize: "0.82rem", color: h.closed ? "text.disabled" : "text.secondary", fontWeight: h.closed ? 600 : 700 }}>
                                        {h.closed ? "Closed" : h.allDay ? "24 Hours" : (h.open && h.close) ? fmt12(h.open) + " \u2013 " + fmt12(h.close) : "\u2014"}
                                    </Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}
                    {notes && (
                        <Box sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.warning.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.warning.main, 0.1), mt: parsedHours ? 1 : 0 })}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6, color: "text.secondary", fontSize: "0.8rem" }}>{notes}</Typography>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SERVICE QUICK MESSAGE RATE-LIMIT TRACKER (client-side, per-recipient, 5 msgs / 10 min)
   ═══════════════════════════════════════════════════════════════════════════ */
const _svcMsgTracker = new Map();
const _SVC_MSG_WINDOW = 10 * 60 * 1000;
const _SVC_MSG_MAX = 5;

function _trackSvcMsg(recipientId) {
    const now = Date.now();
    const key = String(recipientId);
    const entries = (_svcMsgTracker.get(key) || []).filter(t => now - t < _SVC_MSG_WINDOW);
    entries.push(now);
    _svcMsgTracker.set(key, entries);
}

function _isSvcLimited(recipientId) {
    const now = Date.now();
    const key = String(recipientId);
    const entries = (_svcMsgTracker.get(key) || []).filter(t => now - t < _SVC_MSG_WINDOW);
    return entries.length >= _SVC_MSG_MAX;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ServiceDetailPage() {
    const navigate = useNavigate();
    const routeLocation = useLocation();
    const { serviceId } = useParams();
    const auth = useAuth();
    const { activeAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const cameFromServices = routeLocation?.state?.from === "services" || Boolean(routeLocation?.state?.fromServices);

    // "Return to [name]'s profile" support (when navigating from UserProfilePage)
    const fromUserProfile = Boolean(routeLocation?.state?.fromProfile);
    const backProfileName = routeLocation?.state?.backProfileName || '';
    const backProfileHandle = routeLocation?.state?.backProfileHandle || '';
    const backProfileId = routeLocation?.state?.backProfileId || '';
    const backToProfileUrl =
        routeLocation?.state?.backToProfileUrl ||
        (backProfileHandle ? `/${backProfileHandle}` : backProfileId ? `/${backProfileId}` : '');

    const handleProfileReturn = () => {
        try {
            const rawKey = backProfileHandle || backProfileId;
            const norm = String(rawKey || '').replace(/^@/, '').trim();
            const candidates = [rawKey, norm, norm ? `@${norm}` : ''].filter(Boolean);
            candidates.forEach((k) => {
                sessionStorage.setItem(`ll:profile:${k}:restore`, '1');
            });
        } catch { /* ignore */ }

        if (window.history?.length > 1) {
            window.history.back();
            return;
        }
        if (backToProfileUrl) {
            navigate(backToProfileUrl, { state: { restoreProfile: true, fromPostPage: true } });
        } else {
            navigate('/', { state: { restoreProfile: true, fromPostPage: true } });
        }
    };

    const handleServicesReturn = () => {
        try {
            sessionStorage.setItem("ll:services:restore", "1");
            sessionStorage.setItem("ll:services:tab", "all");
        } catch { /* ignore */ }
        if (cameFromServices && window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/services", { state: { restoreServices: true } });
        }
    };

    const resolvedUserId = useMemo(() => {
        const fromAuth = auth?.user?.id || auth?.user?.user_id;
        if (fromAuth) return fromAuth;
        const fromAcct = activeAccount?.user_id || activeAccount?.id;
        if (fromAcct) return fromAcct;
        try { const raw = localStorage.getItem("ll:activeAccount"); const a = raw ? JSON.parse(raw) : null; return a?.user_id || a?.id || null; } catch { return null; }
    }, [auth?.user, activeAccount]);

    /* ── State ── */
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rawLoadError, setRawLoadError] = useState(null);

    // ── Blocked / hidden content gate ──
    const gate = useBlockedPostGate({ content: service, user: auth?.user, contentType: 'service' });
    const [descExpanded, setDescExpanded] = useState(false);
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [activeTab, setActiveTab] = useState(0);
    const [pendingScrollToReviews] = useState(
        () => Boolean(routeLocation?.state?.scrollToReviews)
    );
    const [highlightReviewId, setHighlightReviewId] = useState(
        () => Number(routeLocation?.state?.highlightReviewId || 0) || null
    );
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIndex, setLbIndex] = useState(0);
    const [imagePopup, setImagePopup] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewProviderInfo, setReviewProviderInfo] = useState(null);
    const [reviewViewerIsOwner, setReviewViewerIsOwner] = useState(false);
    const [reviewSort, setReviewSort] = useState("newest");

    const [rvIneligible, setRvIneligible] = useState({ open: false, reason: "" });
    const [rvFormOpen, setRvFormOpen] = useState(false);
    const [rvEditing, setRvEditing] = useState(null);
    const [rvRating, setRvRating] = useState(0);
    const [rvTitle, setRvTitle] = useState("");
    const [rvText, setRvText] = useState("");
    const [rvPhotos, setRvPhotos] = useState([]);
    const [rvSubmitting, setRvSubmitting] = useState(false);
    const [rvError, setRvError] = useState("");
    const [rvDeleteTarget, setRvDeleteTarget] = useState(null);
    const [rvDeleting, setRvDeleting] = useState(false);

    const [respondingId, setRespondingId] = useState(null);
    const [respondText, setRespondText] = useState("");
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    // Review report state
    const [rvReportOpen, setRvReportOpen] = useState(false);
    const [rvReportTarget, setRvReportTarget] = useState(null);
    const [chromeTop, setChromeTop] = useState(0);
    const [favOptimistic, setFavOptimistic] = useState(null);
    const [favDelta, setFavDelta] = useState(0);

    /* ── Quick Message state ── */
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [quickMsgBody, setQuickMsgBody] = useState("");
    const [quickMsgSubject, setQuickMsgSubject] = useState("");
    const [quickMsgPhotos, setQuickMsgPhotos] = useState([]);
    const [quickMsgSending, setQuickMsgSending] = useState(false);
    const [quickMsgError, setQuickMsgError] = useState("");
    const [quickMsgSuccess, setQuickMsgSuccess] = useState(false);
    const [quickMsgCooldown, setQuickMsgCooldown] = useState(0);
    const [quickMsgLimitOpen, setQuickMsgLimitOpen] = useState(false);

    /* ── Live provider avatar (fetch current profile picture) ── */
    const [providerProfileAvatar, setProviderProfileAvatar] = useState(null);

    /* ── Photo comments/likes (like/comment on avatar, cover, gallery photos) ── */
    const [photoCommentsOpen, setPhotoCommentsOpen] = useState(false);
    const [photoCommentsType, setPhotoCommentsType] = useState('avatar'); // 'avatar' | 'cover' | 'gallery'
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = useState(null);

    // Photo report state
    const [photoReportOpen, setPhotoReportOpen] = useState(false);
    const [photoReportTarget, setPhotoReportTarget] = useState(null);

    const handlePhotoReportOpen = useCallback((photoType, photoUrl, photoId) => {
        setPhotoReportTarget({ photoType, photoUrl: photoUrl || '', photoId: photoId || null, ownerId: Number(service?.user_id || service?.provider_user_id || 0) });
        setPhotoReportOpen(true);
    }, [service]);

    const handlePhotoReportSubmit = useCallback(async ({ reason, details }) => {
        if (!photoReportTarget) return;
        try {
            await secureFetch('/api/photos/report', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, details, photo_type: photoReportTarget.photoType, photo_url: photoReportTarget.photoUrl, photo_id: photoReportTarget.photoId, owner_user_id: photoReportTarget.ownerId }),
            });
        } catch { /* handled by ReportDialog */ }
        setPhotoReportOpen(false);
        setPhotoReportTarget(null);
    }, [photoReportTarget]);
    const [pendingPhotoHighlightId, setPendingPhotoHighlightId] = useState(null);

    /* ── Gallery photos with DB IDs (for like/comment support) ── */
    const [serviceGalleryPhotos, setServiceGalleryPhotos] = useState([]);
    const [serviceGalleryLoaded, setServiceGalleryLoaded] = useState(false);

    /* ── Lifecycle ── */
    useLayoutEffect(() => {
        const measure = () => { const h = document.querySelector("header.MuiAppBar-root") || document.querySelector("header"); setChromeTop(h ? h.getBoundingClientRect().bottom : 0); };
        measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
    }, []);

    useEffect(() => {
        let ok = true; setLoading(true); setError(null); setRawLoadError(null);
        fetchServiceById(serviceId).then((d) => { if (ok) { setService(d); setLoading(false); } }).catch((e) => { if (ok) { setRawLoadError(e); setError(e?.message || "Service not found."); setLoading(false); } });
        return () => { ok = false; };
    }, [serviceId]);

    useEffect(() => { setFavOptimistic(null); setFavDelta(0); }, [service?.isFavorited, service?.is_favorited, service?.favoritesCount, service?.favorites_count]);

    /* ── Fetch provider's CURRENT profile avatar ── */
    useEffect(() => {
        if (!service) { setProviderProfileAvatar(null); return; }
        const pType = String(service.providerType || service.provider_type || "").toLowerCase();
        const pHandle = String(service.providerHandle || service.provider_handle || "").trim();
        const pId = String(service.providerId || service.provider_id || "").trim();
        if (!pHandle && !pId) return;

        let cancelled = false;
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const signal = controller?.signal;

        (async () => {
            try {
                let avatar = null;
                if (pType === "business") {
                    const res = await fetch(`/api/business/${encodeURIComponent(pHandle || pId)}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                    if (res.ok) { const data = await res.json(); const biz = data?.business || data; avatar = biz?.logo_url || biz?.logoUrl || biz?.avatar_url || biz?.avatarUrl || null; }
                } else if (pType === "music") {
                    const res = await fetch(`/api/music/artists/${encodeURIComponent(pHandle || pId)}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                    if (res.ok) { const data = await res.json(); const art = data?.artist || data; avatar = art?.avatar_url || art?.avatarUrl || null; }
                } else {
                    const key = pHandle.replace(/^@/, "") || pId;
                    if (key) {
                        const res = await fetch(`/users/public/${encodeURIComponent(key)}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                        if (res.ok) { const data = await res.json(); const prof = data?.profile || data; avatar = prof?.avatar_url || prof?.avatarUrl || prof?.profile_picture || null; }
                    }
                }
                if (!cancelled && avatar) setProviderProfileAvatar(avatar);
            } catch { /* silently fall back to snapshot avatar */ }
        })();

        return () => { cancelled = true; try { controller?.abort(); } catch { /* */ } };
    }, [service?.id, service?.providerType, service?.provider_type, service?.providerHandle, service?.provider_handle, service?.providerId, service?.provider_id]);

    /* ── Photo comments handlers ── */
    const openAvatarComments = useCallback(() => {
        const avatarUrl = service?.serviceAvatarUrl || service?.service_avatar_url;
        if (!avatarUrl || !service?.id) return;
        setPhotoCommentsType('avatar');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [service?.serviceAvatarUrl, service?.service_avatar_url, service?.id]);

    const openCoverComments = useCallback(() => {
        const coverUrl = service?.coverUrl || service?.cover_url;
        if (!coverUrl || !service?.id) return;
        setPhotoCommentsType('cover');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [service?.coverUrl, service?.cover_url, service?.id]);

    const openGalleryPhotoComments = useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || null);
        setPhotoCommentsOpen(true);
    }, []);

    /* ── Fetch gallery photos with DB record IDs (for like/comment support) ── */
    useEffect(() => {
        if (!service?.id) return;
        let alive = true;
        (async () => {
            try {
                const r = await axios.get(`/api/services/photos/${encodeURIComponent(service.id)}`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) {
                    setServiceGalleryPhotos(items);
                    setServiceGalleryLoaded(true);
                }
            } catch {
                if (alive) setServiceGalleryLoaded(true);
            }
        })();
        return () => { alive = false; };
    }, [service?.id]);

    /* ── Auto-open photo comments when arriving from a notification ── */
    const [pendingPhotoNotifState, setPendingPhotoNotifState] = useState(null);

    // Step 1: Capture the notification state from location
    // Reacts to routeLocation changes so it works even when already on this page
    useEffect(() => {
        const st = routeLocation?.state || {};
        if (!st.llOpenPhotoComments) return;
        setPendingPhotoNotifState({
            photoType: st.llPhotoType || 'avatar',
            photoId: Number(st.llPhotoId || 0) || null,
            photoUrl: st.llPhotoUrl || null,
            commentId: st.llPhotoCommentId ? String(st.llPhotoCommentId) : null,
        });
        // Clear location state so it doesn't re-trigger
        navigate(routeLocation.pathname, { replace: true, state: null });
    }, [routeLocation]); // eslint-disable-line react-hooks/exhaustive-deps

    // Step 2: Once service is loaded AND gallery is loaded (if needed), open the dialog
    useEffect(() => {
        if (!pendingPhotoNotifState || !service) return;
        const { photoType, photoId, photoUrl, commentId } = pendingPhotoNotifState;
        if (commentId) setPendingPhotoHighlightId(commentId);

        if (photoType === 'cover') {
            // For cover photos, open directly — don't check if cover URL exists
            // since the dialog will resolve it via the /photos/special endpoint
            setPhotoCommentsType('cover');
            setPhotoCommentsPhotoId(null);
            setPhotoCommentsPhotoUrl(null);
            setPhotoCommentsOpen(true);
            setPendingPhotoNotifState(null);
        } else if (photoType === 'gallery' && photoId) {
            // Wait for gallery to load so we can resolve the photo URL
            if (!serviceGalleryLoaded) return; // will re-run when loaded
            let resolvedUrl = photoUrl || null;
            if (!resolvedUrl && serviceGalleryPhotos.length > 0) {
                const match = serviceGalleryPhotos.find((p) => Number(p.id) === Number(photoId));
                if (match) resolvedUrl = match.url || null;
            }
            setPhotoCommentsType('gallery');
            setPhotoCommentsPhotoId(photoId);
            setPhotoCommentsPhotoUrl(resolvedUrl);
            setPhotoCommentsOpen(true);
            setPendingPhotoNotifState(null);
        } else {
            // Avatar
            setPhotoCommentsType('avatar');
            setPhotoCommentsPhotoId(null);
            setPhotoCommentsPhotoUrl(null);
            setPhotoCommentsOpen(true);
            setPendingPhotoNotifState(null);
        }
    }, [pendingPhotoNotifState, service, serviceGalleryLoaded, serviceGalleryPhotos]);

    /* ── Handlers ── */
    const handleFavorite = () => {
        if (!service?.id) return;
        const cur = favOptimistic !== null ? favOptimistic : Boolean(service.isFavorited || service.is_favorited);
        const next = !cur;
        setFavOptimistic(next); setFavDelta((p) => p + (next ? 1 : -1));
        toggleServiceFavorite(service.id, activeAccount).then((r) => { if (r && typeof r.favoritesCount === "number") setService((p) => p ? { ...p, isFavorited: Boolean(r.favorited), favoritesCount: r.favoritesCount } : p); }).catch(() => { setFavOptimistic(cur); setFavDelta((p) => p + (next ? -1 : 1)); });
    };

    const loadReviews = useCallback(async () => {
        if (!serviceId) return; setReviewsLoading(true);
        try {
            const d = await fetchServiceReviews(serviceId, { sort: reviewSort, limit: 50 });
            const revs = d.reviews || [];
            const tot = d.total || 0;
            setReviews(revs); setReviewsTotal(tot);
            if (d.providerInfo) setReviewProviderInfo(d.providerInfo);
            if (d.viewerIsOwner != null) setReviewViewerIsOwner(Boolean(d.viewerIsOwner));
            // Broadcast review stats change
            const avg = revs.length ? Number((revs.reduce((s, r) => s + (r.rating || 0), 0) / revs.length).toFixed(2)) : null;
            try {
                window.dispatchEvent(new CustomEvent('ll:service:review-changed', {
                    detail: { serviceId, reviewCount: tot, reviewAvg: avg, _source: 'serviceDetailPage' }
                }));
            } catch { /* */ }
        } catch { setReviews([]); setReviewsTotal(0); } finally { setReviewsLoading(false); }
    }, [serviceId, reviewSort]);

    useEffect(() => { if (service) loadReviews(); }, [service, loadReviews]);

    // Listen for review changes from other components (e.g. ServicesPage panel)
    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || !serviceId || String(d.serviceId) !== String(serviceId)) return;
            if (d._source === 'serviceDetailPage') return;
            loadReviews();
        };
        window.addEventListener('ll:service:review-changed', handler);
        return () => window.removeEventListener('ll:service:review-changed', handler);
    }, [serviceId, loadReviews]);

    // When arriving from a notification that wants the reviews tab open,
    // switch to the reviews tab once service data is available.
    // Tab layout: About(0), Contact(1), Photos(2), Reviews(3 — only if reviews enabled).
    const _svcAllowsReviews = service ? (service.allowReviews !== false && service.allow_reviews !== false) : true;
    const reviewsTabIdx = _svcAllowsReviews ? 3 : -1;
    useEffect(() => {
        if (!pendingScrollToReviews) return;
        if (reviewsTabIdx < 0) return; // reviews disabled by provider
        if (activeTab !== reviewsTabIdx) {
            setActiveTab(reviewsTabIdx);
        }
    }, [pendingScrollToReviews, service, reviewsTabIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll to and highlight a specific review when coming from a notification
    useEffect(() => {
        if (!highlightReviewId || reviewsLoading || reviews.length === 0) return;
        if (reviewsTabIdx < 0) return; // reviews disabled by provider
        if (activeTab !== reviewsTabIdx) return;
        // Give DOM time to render
        const scrollTimer = setTimeout(() => {
            const el = document.querySelector(`[data-service-review-id="${highlightReviewId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 400);
        // Clear highlight after 6 seconds
        const fadeTimer = setTimeout(() => {
            setHighlightReviewId(null);
        }, 6500);
        return () => { clearTimeout(scrollTimer); clearTimeout(fadeTimer); };
    }, [highlightReviewId, reviewsLoading, reviews.length, activeTab]);

    const openReviewForm = async (existing = null) => {
        // For new reviews, ask the backend if this user is eligible before showing the form
        if (!existing && serviceId) {
            try {
                const elig = await checkReviewEligibility(serviceId);
                if (!elig.eligible) {
                    setRvIneligible({ open: true, reason: elig.reason || "You can't review this service." });
                    return;
                }
            } catch { /* if the check fails, fall through and let submit catch it */ }
        }
        if (existing) { setRvEditing(existing); setRvRating(existing.rating || 0); setRvTitle(existing.reviewTitle || existing.title || ""); setRvText(existing.reviewText || existing.body || ""); setRvPhotos((Array.isArray(existing.photoUrls) ? existing.photoUrls : []).filter(Boolean).map((u) => ({ id: u, url: u, _existing: true }))); }
        else { setRvEditing(null); setRvRating(0); setRvTitle(""); setRvText(""); setRvPhotos([]); }
        setRvError(""); setRvFormOpen(true);
    };
    const closeReviewForm = () => { if (!rvSubmitting) { setRvFormOpen(false); setRvError(""); } };

    const handleSubmitReview = async () => {
        if (!rvRating) { setRvError("Please select a rating."); return; }
        setRvSubmitting(true); setRvError("");
        try {
            const u = auth?.user; const pp = [];
            for (const p of rvPhotos) {
                if (p._existing && p.url) { pp.push({ url: p.url, objectPath: p.objectPath || "" }); }
                else if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = Date.now() + "_review_" + (p.file.name || "photo.jpg");
                        const s = await getSignedUploadUrl({ folder: "services/reviews", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); pp.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }
            const payload = { rating: rvRating, reviewTitle: rvTitle, reviewText: rvText, photos: pp, reviewerName: u ? (u.first_name || "") + " " + (u.last_name || "").trim() || u.handle || "User" : "User", reviewerAvatar: u?.avatar_url || null, reviewerHandle: u?.handle || null };
            if (rvEditing?.id) await updateServiceReview(serviceId, rvEditing.id, payload); else await createServiceReview(serviceId, payload);
            setRvFormOpen(false); rvPhotos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch { /* noop */ } } }); setRvPhotos([]); await loadReviews();
        } catch (err) { setRvError(err?.message || "Failed to submit review."); } finally { setRvSubmitting(false); }
    };

    const handleDeleteReview = async (rid) => { setRvDeleting(true); try { await deleteServiceReview(serviceId, rid); setRvDeleteTarget(null); setRvFormOpen(false); await loadReviews(); } catch { /* noop */ } finally { setRvDeleting(false); } };
    const handleRespond = async (rid) => { if (!respondText.trim()) return; try { await respondToReview(serviceId, rid, respondText.trim()); setRespondingId(null); setRespondText(""); await loadReviews(); } catch { /* noop */ } };
    const handleHelpful = async (rv) => {
        const prevHelpful = rv.viewerFoundHelpful;
        const prevCount = rv.helpfulCount || 0;
        setReviews((prev) => prev.map((r) => r.id === rv.id ? { ...r, viewerFoundHelpful: !prevHelpful, helpfulCount: prevHelpful ? Math.max(0, prevCount - 1) : prevCount + 1 } : r));
        try {
            const result = await toggleReviewHelpful(serviceId, rv.id);
            setReviews((prev) => prev.map((r) => r.id === rv.id ? { ...r, viewerFoundHelpful: result.helpful, helpfulCount: result.helpfulCount } : r));
        } catch {
            setReviews((prev) => prev.map((r) => r.id === rv.id ? { ...r, viewerFoundHelpful: prevHelpful, helpfulCount: prevCount } : r));
        }
    };
    const submitReport = async ({ reason, details }) => { try { await fetch("/api/services/" + (service?.id) + "/report", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) }); } catch { /* noop */ } };
    const handleCopyLink = () => { navigator.clipboard?.writeText(window.location.origin + "/services/" + (service?.id || "")); showSuccess("Link copied to clipboard"); };

    /* ── Quick Message handlers ── */
    const openQuickMsg = () => {
        if (!auth?.user) { auth?.requireAuth?.(); return; }
        const rawPId = Number(service?.providerId || service?.provider_id || 0);
        if (rawPId && _isSvcLimited(rawPId)) {
            setQuickMsgLimitOpen(true);
            return;
        }
        setQuickMsgBody("");
        setQuickMsgSubject(`Re: ${service?.title || "Service Inquiry"}`);
        setQuickMsgPhotos([]);
        setQuickMsgError("");
        setQuickMsgSuccess(false);
        setQuickMsgCooldown(0);
        setQuickMsgOpen(true);
    };

    const closeQuickMsg = () => {
        if (quickMsgSending) return;
        quickMsgPhotos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
        setQuickMsgPhotos([]);
        setQuickMsgOpen(false);
    };

    const handleQuickMsgSend = async () => {
        if (!quickMsgBody.trim() || !service || quickMsgCooldown > 0) return;
        setQuickMsgSending(true);
        setQuickMsgError("");
        try {
            // Upload photos
            const photoPayload = [];
            for (const p of quickMsgPhotos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_msg_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "services/messages", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }

            // Determine recipient — prefer personal user for simple routing
            const rawPType = service.providerType || service.provider_type || "personal";
            const rawPId = Number(service.providerId || service.provider_id || 0);
            const serviceUserId = Number(service.userId || service.user_id || service.createdBy || service.created_by || 0);

            let recipientType;
            let recipientId;
            let fallbackUserId = 0;

            if (rawPType === "user" || rawPType === "personal") {
                recipientType = "personal";
                recipientId = rawPId;
            } else if (rawPType === "business") {
                recipientType = "business";
                recipientId = rawPId;
                fallbackUserId = serviceUserId;
            } else if (rawPType === "music") {
                recipientType = "artist";
                recipientId = rawPId;
            } else {
                recipientType = "personal";
                recipientId = rawPId;
            }

            if (!recipientId) throw new Error("Could not determine service provider.");

            // Client-side rate limit check
            if (_isSvcLimited(recipientId)) { setQuickMsgLimitOpen(true); return; }

            await axios.post("/api/messages/send", {
                recipient_type: recipientType,
                recipient_id: recipientId,
                body: quickMsgBody.trim(),
                photos: photoPayload,
                service_id: Number(service.id || service.service_id || 0) || undefined,
                ...(fallbackUserId > 0 ? { fallback_user_id: fallbackUserId } : {}),
            }, { withCredentials: true, headers: { ...getAccountHeaders() } });

            _trackSvcMsg(recipientId);
            quickMsgPhotos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setQuickMsgPhotos([]);
            setQuickMsgSuccess(true);
        } catch (err) {
            const status = err?.response?.status;
            const data = err?.response?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setQuickMsgError(data?.message || data?.error || "You're sending messages too quickly. Please wait a moment.");
                setQuickMsgCooldown(wait);
                const timer = setInterval(() => {
                    setQuickMsgCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setQuickMsgError(""); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setQuickMsgError(data?.message || err?.message || "Failed to send message.");
            }
        } finally {
            setQuickMsgSending(false);
        }
    };

    /* ── Loading / Error ── */
    if (loading || (service && auth?.user && gate.loading)) return (<Box sx={{ position: "fixed", top: chromeTop, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}><CircularProgress /></Box>);
    if (isNetworkError(rawLoadError)) return (<Box sx={{ position: "fixed", top: chromeTop, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}><NetworkErrorState onRetry={() => window.location.reload()} /></Box>);
    if (service && gate.gated) return <BlockedPostGate gate={gate} />;
    if (error || !service) return (<Box sx={{ position: "fixed", top: chromeTop, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, bgcolor: "background.default" }}><Typography color="error" sx={{ fontWeight: 800 }}>{error || "Service not found."}</Typography><Button onClick={fromUserProfile ? handleProfileReturn : handleServicesReturn} startIcon={<ArrowBackRoundedIcon />} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}>{fromUserProfile ? (backProfileName ? `Return to ${backProfileName}'s profile` : 'Return to Profile') : 'Back to Services'}</Button></Box>);

    /* ── Derived ── */
    const catInfo = getServiceCategoryInfo(service.categorySlug || "");
    const CatIcon = catInfo?.Icon || null;
    const loc = service.locationLabel || [service.city, service.county ? service.county + " County" : ""].filter(Boolean).join(", ") || "Alabama";
    const mapsQ = encodeURIComponent(service.streetAddress || service.locationLabel || [service.city, service.county ? service.county + " County" : "", "Alabama"].filter(Boolean).join(", ") || (service.latitude && service.longitude ? service.latitude + "," + service.longitude : "Alabama"));
    const photos = Array.isArray(service.photos) ? service.photos.filter((p) => p && p.url) : [];
    const desc = service.description || "";
    const descLong = desc.length > 200;
    const socialLinks = buildSocialLinks(service);
    const uid = resolvedUserId;
    const isOwn = (() => { if (service.isOwner != null) return service.isOwner; if (!uid) return false; const pt = service.providerType || service.provider_type; const pi = String(service.providerId ?? service.provider_id ?? ""); if (!pi) return false; if (pt === "business" && activeBusinessId && String(activeBusinessId) === pi) return true; if (pt === "music" && activeArtistId && String(activeArtistId) === pi) return true; if ((pt === "user" || pt === "personal") && !activeBusinessId && !activeArtistId && pi === String(uid)) return true; return false; })();
    const providerAllowsReviews = service.allowReviews !== false && service.allow_reviews !== false;
    const providerAllowsMessages = service.allowMessages !== false && service.allow_messages !== false;
    const myReview = reviews.find((r) => r.reviewerId === uid);
    const canWrite = uid && !isOwn && !reviewViewerIsOwner && !myReview && providerAllowsReviews;
    const localFav = favOptimistic !== null ? favOptimistic : Boolean(service.isFavorited || service.is_favorited);
    const baseFav = Number(service.favoritesCount || service.favorites_count || 0);
    const dispFav = Math.max(0, baseFav + favDelta);
    const rc = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; reviews.forEach((r) => { const s = Math.round(r.rating); if (s >= 1 && s <= 5) rc[s]++; });
    const avgR = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const maxC = Math.max(1, ...Object.values(rc));
    const dispR = avgR || service.reviewAvg || 0;
    const dispRC = reviewsTotal != null ? reviewsTotal : (service.reviewCount || 0);
    const parsedH = parseHours(service.availabilityHours);
    const hStatus = getHoursStatus(service.availabilityHours);

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <Box sx={{ position: "fixed", top: chromeTop + "px", left: 0, right: 0, bottom: 0, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 0, md: 3 }, pt: { xs: 0, md: 1.5 }, pb: { xs: 0, md: 4 }, minHeight: { xs: "100%", md: "auto" }, display: { xs: "flex", md: "block" }, flexDirection: "column" }}>

                    {/* ═══ HEADER CARD ═══ */}
                    <Box sx={CARD}>
                        {(cameFromServices || fromUserProfile) && (
                            <Box sx={{ px: { xs: 2, sm: 3 }, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Button onClick={fromUserProfile ? handleProfileReturn : handleServicesReturn} startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />} sx={{ px: 1.5, py: 0.5, minWidth: 0, fontWeight: 800, fontSize: 13, textTransform: "none", borderRadius: 999, color: "primary.main" }}>
                                    {fromUserProfile
                                        ? backProfileName
                                            ? `Return to ${backProfileName}'s profile`
                                            : 'Return to Profile'
                                        : 'Return to Services'}
                                </Button>
                            </Box>
                        )}


                        {/* Cover photo (only if set) */}
                        {(service.coverUrl || (photos.length > 0 && photos[0]?.url)) && (
                            <Box sx={{ position: "relative", width: "100%", height: { xs: 140, sm: 180, md: 200 }, overflow: "hidden", cursor: service.coverUrl ? "pointer" : "default" }}
                                 onClick={() => { if (service.coverUrl) openCoverComments(); }}>
                                <Box component="img" src={service.coverUrl || photos[0].url} alt="" referrerPolicy="no-referrer"
                                     sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </Box>
                        )}

                        {/* Identity */}
                        <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, md: 2 } }}>
                            <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="flex-start">
                                {(() => {
                                    // The detail header shows the SERVICE's own branding avatar.
                                    // Falls back to the category icon — NOT the provider's profile picture.
                                    const svcAvatarBase = service.serviceAvatarUrl || service.service_avatar_url || null;
                                    const svcAvatarSrc = svcAvatarBase || null;
                                    const FallbackIcon = CatIcon || PersonRoundedIcon;
                                    return (
                                        <Avatar
                                            src={svcAvatarSrc || undefined}
                                            onClick={() => { if (svcAvatarSrc) openAvatarComments(); }}
                                            sx={(t) => ({
                                                width: AVATAR_SIZE,
                                                height: AVATAR_SIZE,
                                                flexShrink: 0,
                                                border: "3px solid",
                                                borderColor: alpha(t.palette.primary.main, 0.15),
                                                boxShadow: "0 2px 12px " + alpha(t.palette.common.black, 0.1),
                                                // Opaque tint: 8% primary stacked over solid paper so the
                                                // cover photo doesn't bleed through when no avatar is set.
                                                background: `linear-gradient(${alpha(t.palette.primary.main, 0.08)}, ${alpha(t.palette.primary.main, 0.08)}), ${t.palette.background.paper}`,
                                                color: t.palette.primary.main,
                                                cursor: svcAvatarSrc ? "pointer" : "default",
                                            })}
                                        >
                                            <FallbackIcon sx={{ fontSize: { xs: 38, sm: 42, md: 46 } }} />
                                        </Avatar>
                                    );
                                })()}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 950, fontSize: { xs: "1.15rem", sm: "1.3rem", md: "1.4rem" }, lineHeight: 1.15, letterSpacing: "-0.02em", wordBreak: "break-word" }}>{service.title || "Untitled Service"}</Typography>
                                    {service.summary && <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 600, mt: 0.25, lineHeight: 1.4, wordBreak: "break-word", overflowWrap: "anywhere" }}>{service.summary}</Typography>}
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                                        {catInfo && <Chip size="small" icon={CatIcon ? <CatIcon sx={{ fontSize: "13px !important" }} /> : undefined} label={catInfo.name} sx={(t) => ({ height: 24, fontWeight: 800, fontSize: "0.7rem", bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.15), "& .MuiChip-label": { px: 0.75 }, "& .MuiChip-icon": { color: t.palette.primary.main } })} />}
                                        {service.licensedInsured && <Chip size="small" icon={<GppGoodRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Licensed & Insured" sx={(t) => ({ height: 24, fontWeight: 800, fontSize: "0.68rem", bgcolor: alpha(t.palette.success.main, 0.08), color: t.palette.success.dark, border: "1px solid", borderColor: alpha(t.palette.success.main, 0.18), "& .MuiChip-label": { px: 0.75 }, "& .MuiChip-icon": { color: t.palette.success.main } })} />}
                                    </Box>
                                    {providerAllowsReviews && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                            <Rating value={dispR || 0} precision={0.5} readOnly size="small" sx={{ "& .MuiRating-icon": { fontSize: 16 } }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>({dispRC})</Typography>
                                        </Stack>
                                    )}
                                </Box>
                                {/* Action buttons — top right */}
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0, mt: 0.25 }}>
                                    {isOwn ? (
                                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.5, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}><StarRoundedIcon sx={{ fontSize: 20, color: "text.disabled" }} /><Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>{formatFavCount(dispFav)}</Typography></Box>
                                    ) : (
                                        <Tooltip title={localFav ? "Remove from favorites" : "Add to favorites"}>
                                            <Box onClick={handleFavorite} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.5, borderRadius: 999, cursor: "pointer", border: "1px solid", borderColor: localFav ? (t) => alpha(t.palette.secondary.main, 0.4) : "divider", bgcolor: localFav ? (t) => alpha(t.palette.secondary.main, 0.08) : "background.paper", transition: "all 200ms ease", "&:hover": { bgcolor: localFav ? (t) => alpha(t.palette.secondary.main, 0.15) : "action.hover" }, "&:active": { transform: "scale(0.97)" } }}>
                                                {localFav ? <StarRoundedIcon sx={{ fontSize: 20, color: "secondary.main" }} /> : <StarBorderRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />}
                                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: localFav ? "secondary.main" : "text.secondary" }}>{formatFavCount(dispFav)}</Typography>
                                            </Box>
                                        </Tooltip>
                                    )}
                                    <Tooltip title="Share"><IconButton size="small" onClick={() => setShareOpen(true)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, width: 36, height: 36 }}><ShareRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                    {!isOwn && providerAllowsMessages ? (
                                        <Tooltip title="Message"><IconButton size="small" onClick={openQuickMsg} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, width: 36, height: 36 }}><ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                    ) : null}
                                    <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, width: 36, height: 36 }}><MoreVertIcon sx={{ fontSize: 18 }} /></IconButton>
                                    {isOwn && (
                                        <Button variant="outlined" size="small" startIcon={<EditRoundedIcon sx={{ fontSize: "14px !important" }} />} onClick={() => navigate("/services/" + service.id + "/console")} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 900, fontSize: "0.75rem", px: 1.25, height: 36, minWidth: 0, whiteSpace: "nowrap", ml: 0.4 }}>Edit Profile</Button>
                                    )}
                                    <SmartMenu disableScrollLock anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} onClick={(e) => e.stopPropagation()} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom?.shadows?.lg || "0 8px 32px " + alpha(t.palette.text.primary, 0.12), minWidth: 200, py: 0.5 } }}>
                                        <MenuItem onClick={() => { setMenuAnchor(null); handleCopyLink(); }} sx={{ py: 1 }}><ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon><ListItemText primary="Copy link" /></MenuItem>
                                        {!isOwn && [<Divider key="report-divider" sx={{ my: 0.5 }} />, <MenuItem key="report-item" onClick={() => { setMenuAnchor(null); setReportOpen(true); }} sx={{ py: 1 }}><ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText primary="Report" /></MenuItem>]}
                                    </SmartMenu>
                                </Stack>
                            </Stack>
                            {/* Address — far left */}
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                <Typography sx={{ fontSize: 12, color: "primary.main", fontWeight: 700, lineHeight: 1.2 }}>{loc}</Typography>
                            </Stack>
                            {/* Hours (left) + Social icons (right) */}
                            <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {hStatus && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ py: 0.25 }}>
                                            <AccessTimeRoundedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: hStatus.open ? "success.main" : "error.main" }}>{hStatus.open ? "Open" : "Closed"}</Typography>
                                            {hStatus.label && !/^(Open 24 hours|Closed now)$/.test(hStatus.label) && (
                                                <>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>&middot;</Typography>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{hStatus.label.replace(/^(Open|Closed)\s*·?\s*/i, "")}</Typography>
                                                </>
                                            )}
                                            {hStatus.label === "Open 24 hours" && (
                                                <>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>&middot;</Typography>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>24 hours</Typography>
                                                </>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                                {socialLinks.length > 0 && (
                                    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                                        {socialLinks.map((sl) => (<Tooltip key={sl.tip} title={sl.tip} arrow><IconButton component="a" href={sl.url} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 26, height: 26, p: 0, color: sl.color, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}>{sl.icon}</IconButton></Tooltip>))}
                                    </Stack>
                                )}
                            </Stack>
                            {/* Phone & Email — header contact info */}
                            {(service.phoneNumber || service.emailAddress) && (
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5, flexWrap: "wrap" }}>
                                    {service.phoneNumber && (
                                        <Typography component="a" href={"tel:" + service.phoneNumber.replace(/[^\d+]/g, "")}
                                                    sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.primary", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: "primary.main" } }}>
                                            <PhoneRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                            {service.phoneNumber}
                                        </Typography>
                                    )}
                                    {service.emailAddress && (
                                        <Typography component="a" href={"mailto:" + service.emailAddress}
                                                    sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.primary", textDecoration: "none", display: "flex", alignItems: "center", gap: 0.5, "&:hover": { color: "primary.main" } }}>
                                            <EmailRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                            {service.emailAddress}
                                        </Typography>
                                    )}
                                </Stack>
                            )}
                        </Box>

                        <Divider />
                        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} variant="fullWidth"
                              sx={(t) => ({ "& .MuiTabs-indicator": { height: 2.5, bgcolor: t.palette.primary.main }, "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, color: "text.secondary", gap: 0.5, "&.Mui-selected": { color: "primary.main", fontWeight: 900 } } })}>
                            <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="About" value={0} />
                            {service.latitude && service.longitude && <Tab icon={<LocationOnRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Location" value={1} />}
                            <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={"Photos" + (photos.length ? " (" + photos.length + ")" : "")} value={2} />
                            {providerAllowsReviews && <Tab icon={<RateReviewRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={"Reviews" + (dispRC ? " (" + dispRC + ")" : "")} value={3} />}
                        </Tabs>

                        {/* ═══ TWO-COLUMN LAYOUT (unified inside CARD) ═══ */}
                        <Box sx={{ display: "flex", gap: { xs: 0, md: 2.5 }, flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start", px: { xs: 2, sm: 3 }, pt: 2, pb: 2 }}>

                            {/* ── LEFT COLUMN ── */}
                            <Box sx={{ flex: 1, minWidth: 0, order: { xs: 2, md: 1 }, minHeight: { md: 300 } }}>

                                {/* ═══ ABOUT TAB ═══ */}
                                {activeTab === 0 && (
                                    <Box>
                                        {/* Description + photo strip */}
                                        {desc && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography sx={{ ...H, fontSize: 17, mb: 1.25 }}>{"About " + (service.title || "This Service")}</Typography>
                                                <Box sx={{ position: "relative", maxHeight: descExpanded || !descLong ? "none" : 160, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                                                    <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.65, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "anywhere" }}>{desc}</Typography>
                                                    {!descExpanded && descLong && <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(transparent, " + t.palette.background.paper + ")", pointerEvents: "none" })} />}
                                                </Box>
                                                {descLong && <Button size="small" onClick={() => setDescExpanded((p) => !p)} endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: "16px !important", transform: descExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />} sx={{ mt: 0.5, textTransform: "none", fontWeight: 700, fontSize: "0.78rem", px: 0, color: "primary.main", "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>{descExpanded ? "Show less" : "Read more"}</Button>}
                                                {photos.length > 0 && (
                                                    <Box sx={{ display: "flex", gap: 1, mt: 1.5, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.15), borderRadius: 2 } }}>
                                                        {(() => {
                                                            const gallery = serviceGalleryLoaded && serviceGalleryPhotos.length > 0
                                                                ? serviceGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0))
                                                                : photos;
                                                            return gallery.slice(0, 8).map((p, i) => (
                                                                <Box key={p.id || i} component="img" src={p.url} alt="" referrerPolicy="no-referrer"
                                                                     onClick={() => { if (p.id) openGalleryPhotoComments(p.id, p.url); else { setLbIndex(i); setLbOpen(true); } }}
                                                                     sx={{ height: 100, width: "auto", maxWidth: 180, objectFit: "contain", borderRadius: 2, flexShrink: 0, cursor: "pointer", "&:hover": { opacity: 0.85 } }} />
                                                            ));
                                                        })()}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {/* Highlights */}
                                        {Array.isArray(service.highlightSections) && service.highlightSections.filter((s) => s.title || s.body || s.photoUrl).map((sec, idx) => (
                                            <Box key={idx} sx={(t) => ({ borderRadius: 2.5, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), mb: 2 })}>
                                                <Box sx={(t) => ({ px: 2, py: 1, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", gap: 0.75 })}>
                                                    <HlIcon name={sec.iconName || sec.icon || "Star"} sx={{ fontSize: 17, color: "primary.main" }} />
                                                    <Typography sx={{ fontWeight: 900, fontSize: 12, color: "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>{sec.title || "Highlight"}</Typography>
                                                </Box>
                                                {(sec.photoUrl || sec.body) && (
                                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ p: 2 }}>
                                                        {sec.photoUrl && (
                                                            <Box component="img" src={sec.photoUrl} alt={sec.title || ""} referrerPolicy="no-referrer"
                                                                 onClick={() => setImagePopup({ src: sec.photoUrl, alt: sec.title || "Highlight" })}
                                                                 sx={{ width: { xs: "100%", sm: 220 }, height: "auto", maxHeight: 260, objectFit: "contain", borderRadius: 2, cursor: "pointer", flexShrink: 0, "&:hover": { opacity: 0.85 } }} />
                                                        )}
                                                        {sec.body && <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "anywhere" }}>{sec.body}</Typography>}
                                                    </Stack>
                                                )}
                                            </Box>
                                        ))}

                                        {/* Services Offered */}
                                        {Array.isArray(service.servicesOffered) && service.servicesOffered.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Divider sx={{ mb: 2 }} />
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                    {CatIcon && <CatIcon sx={{ fontSize: 18, color: "primary.main" }} />}
                                                    <Typography sx={H}>Services Offered</Typography>
                                                </Stack>
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                                    {service.servicesOffered.map((s, i) => (<Chip key={i} label={s} size="small" variant="outlined" sx={(t) => ({ fontWeight: 700, fontSize: "0.78rem", borderColor: alpha(t.palette.text.primary, 0.12) })} />))}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Experience + Certs + FAQ */}
                                        {(service.experience || (service.certifications?.length > 0) || (service.faq?.length > 0)) && (
                                            <Box sx={{ mb: 2 }}>
                                                <Divider sx={{ mb: 2 }} />
                                                {service.experience && (
                                                    <Box>
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><WorkOutlineRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={H}>Experience & Background</Typography></Stack>
                                                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, color: "text.secondary", fontSize: "0.85rem" }}>{service.experience}</Typography>
                                                    </Box>
                                                )}
                                                {service.certifications?.length > 0 && (
                                                    <Box sx={{ mt: service.experience ? 2.5 : 0 }}>
                                                        {service.experience && <Divider sx={{ mb: 2 }} />}
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><VerifiedRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={H}>Certifications & Licenses</Typography></Stack>
                                                        <Stack spacing={0.75}>
                                                            {service.certifications.map((c, i) => (
                                                                <Box key={i} sx={(t) => ({ display: "flex", alignItems: "flex-start", gap: 1.25, p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.1) })}>
                                                                    <Box sx={{ minWidth: 0 }}><Typography sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.3 }}>{c.name || c.title || c}</Typography>{(c.issuer || c.organization) && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.15 }}>{c.issuer || c.organization}</Typography>}</Box>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                )}
                                                {service.faq?.length > 0 && (
                                                    <Box sx={{ mt: (service.experience || service.certifications?.length > 0) ? 2.5 : 0 }}>
                                                        {(service.experience || service.certifications?.length > 0) && <Divider sx={{ mb: 2 }} />}
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><HelpOutlineRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={H}>FAQ</Typography></Stack>
                                                        <Stack spacing={0} divider={<Divider />}>{service.faq.map((f, i) => <FaqItem key={i} question={f.question || f.q} answer={f.answer || f.a} />)}</Stack>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {/* Portfolio */}
                                        {service.portfolio?.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Divider sx={{ mb: 2 }} />
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}><CollectionsRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={H}>Portfolio & Past Work</Typography></Stack>
                                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 0.75 }}>
                                                    {service.portfolio.map((it, i) => (
                                                        <Box key={i} onClick={() => setImagePopup({ src: it.url || it.image || it, alt: it.caption || "" })} sx={{ position: "relative", paddingTop: "100%", borderRadius: 2, overflow: "hidden", cursor: "pointer", "&:hover img": { transform: "scale(1.05)" }, "&:hover .po": { opacity: 1 } }}>
                                                            <Box component="img" src={it.url || it.image || it} alt={it.caption || ""} referrerPolicy="no-referrer" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
                                                            {(it.caption || it.title) && <Box className="po" sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 1, py: 0.75, bgcolor: (t) => alpha(t.palette.common.black, 0.6), opacity: 0, transition: "opacity 0.2s" }}><Typography sx={{ color: "common.white", fontSize: "0.72rem", fontWeight: 700 }}>{it.caption || it.title}</Typography></Box>}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* ═══ LOCATION TAB ═══ */}
                                {activeTab === 1 && (
                                    <Stack spacing={1.5}>
                                        <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                            {service.latitude && service.longitude && (() => {
                                                const hasStreet = Boolean(String(service.streetAddress || service.street_address || "").trim());
                                                const mapMode = hasStreet ? "place" : "view";
                                                const mapZoom = hasStreet ? 12 : 10;
                                                const mapSrc = `https://www.google.com/maps/embed/v1/${mapMode}?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${service.latitude},${service.longitude}${mapMode === "place" ? "&q=" + mapsQ : ""}&zoom=${mapZoom}`;
                                                return (
                                                    <Box component="a" href={"https://www.google.com/maps/search/?api=1&query=" + mapsQ} target="_blank" rel="noopener noreferrer" sx={{ display: "block", textDecoration: "none" }}>
                                                        <Box component="iframe" src={mapSrc} sx={{ width: "100%", height: 220, border: 0, display: "block", pointerEvents: "none" }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Service location" />
                                                        <Box sx={{ py: 0.75, px: 2.5, bgcolor: "primary.main", color: "common.white", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}><LocationOnRoundedIcon sx={{ fontSize: 15 }} /><Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Get Directions</Typography></Box>
                                                    </Box>
                                                );
                                            })()}
                                            <Box sx={{ p: 2, pt: service.latitude ? 1.5 : 2 }}>
                                                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}><LocationOnRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={{ fontWeight: 900, fontSize: "0.88rem" }}>Location</Typography></Stack>
                                                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.secondary" }}>{service.isStatewide ? "Alabama (Statewide)" : loc}</Typography>
                                                {service.latitude && service.longitude && !service.streetAddress && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>{"Location shown is approximate for the " + (service.county ? service.county + " County" : "selected") + " area"}</Typography>}
                                            </Box>
                                        </Box>
                                    </Stack>
                                )}

                                {/* ═══ PHOTOS TAB ═══ */}
                                {activeTab === 2 && (
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><PhotoLibraryRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} /><Typography sx={{ ...H, fontSize: 18 }}>All Photos</Typography></Stack>
                                        {(() => {
                                            // Prefer gallery photos with DB IDs for like/comment support
                                            const gallery = serviceGalleryLoaded && serviceGalleryPhotos.length > 0
                                                ? serviceGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0))
                                                : photos;
                                            return gallery.length > 0 ? (
                                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
                                                    {gallery.map((p, i) => (
                                                        <Box key={p.id || i}
                                                             onClick={() => {
                                                                 if (p.id) openGalleryPhotoComments(p.id, p.url);
                                                                 else { setLbIndex(i); setLbOpen(true); }
                                                             }}
                                                             sx={{ position: "relative", paddingTop: "100%", borderRadius: 2, overflow: "hidden", cursor: "pointer", "&:hover img": { transform: "scale(1.05)" } }}>
                                                            <Box component="img" src={p.url} alt="" referrerPolicy="no-referrer" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 300ms ease" }} />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : (<Box sx={{ textAlign: "center", py: 6 }}><PhotoLibraryRoundedIcon sx={{ fontSize: 56, color: "primary.main", opacity: 0.55, mb: 1 }} /><Typography sx={{ fontWeight: 800, fontSize: 16, color: "text.secondary" }}>No photos yet</Typography></Box>);
                                        })()}
                                    </Box>
                                )}

                                {/* ═══ REVIEWS TAB ═══ */}
                                {providerAllowsReviews && activeTab === reviewsTabIdx && (
                                    <Box>
                                        <Typography sx={{ ...H, fontSize: 20, mb: 2 }}>{"Reviews " + (reviewsTotal > 0 ? "(" + reviewsTotal + ")" : "")}</Typography>
                                        {reviewsLoading && !reviews.length && <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}><PulsingDots /></Box>}
                                        {reviews.length > 0 && (
                                            <Box sx={(t) => ({ display: "flex", gap: 3, mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08) })}>
                                                <Box sx={{ textAlign: "center", minWidth: 80, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                                    <Typography sx={{ fontWeight: 950, fontSize: 32, lineHeight: 1 }}>{avgR.toFixed(1)}</Typography>
                                                    <Rating value={avgR} precision={0.5} readOnly size="small" sx={{ mt: 0.5 }} />
                                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, mt: 0.25 }}>{reviews.length + " review" + (reviews.length !== 1 ? "s" : "")}</Typography>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    {[5, 4, 3, 2, 1].map((s) => (<Stack key={s} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}><Typography sx={{ fontSize: "0.72rem", fontWeight: 700, width: 14, textAlign: "right" }}>{s}</Typography><StarRoundedIcon sx={{ fontSize: 13, color: "warning.main" }} /><Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: ((rc[s] / maxC) * 100) + "%", height: "100%", borderRadius: 3, bgcolor: "warning.main", transition: "width 400ms ease" }} /></Box><Typography sx={{ fontSize: "0.72rem", fontWeight: 700, width: 18, color: "text.secondary" }}>{rc[s]}</Typography></Stack>))}
                                                </Box>
                                            </Box>
                                        )}
                                        {canWrite && <Button variant="outlined" startIcon={<RateReviewRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => openReviewForm()} sx={{ mb: 2, borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: "0.82rem" }}>Write a Review</Button>}
                                        {reviews.length > 1 && <FormControl size="small" sx={{ mb: 2, minWidth: 140 }}><InputLabel>Sort</InputLabel><Select value={reviewSort} label="Sort" onChange={(e) => setReviewSort(e.target.value)}><MenuItem value="newest">Newest</MenuItem><MenuItem value="oldest">Oldest</MenuItem><MenuItem value="highest">Highest</MenuItem><MenuItem value="lowest">Lowest</MenuItem></Select></FormControl>}
                                        {reviews.map((rv) => {
                                            const isOwnR = rv.reviewerId === uid;
                                            const rPhotos = Array.isArray(rv.photoUrls) ? rv.photoUrls.filter(Boolean) : [];
                                            const isRvHighlighted = highlightReviewId && Number(rv.id) === Number(highlightReviewId);
                                            return (
                                                <Box
                                                    key={rv.id}
                                                    data-service-review-id={rv.id}
                                                    sx={(t) => ({
                                                        py: 2,
                                                        ...(isRvHighlighted ? {
                                                            px: 1.5,
                                                            mx: -1.5,
                                                            borderRadius: 2.5,
                                                            border: "2px solid",
                                                            borderColor: `${alpha(t.custom?.brand?.brass || "#A87822", 0.45)} !important`,
                                                            bgcolor: alpha(t.custom?.brand?.brass || "#A87822", 0.06),
                                                            boxShadow: `0 0 16px ${alpha(t.custom?.brand?.brass || "#A87822", 0.15)}`,
                                                            my: 1,
                                                        } : {
                                                            borderBottom: "1px solid",
                                                            borderColor: t.palette.divider,
                                                            "&:last-child": { borderBottom: "none" },
                                                        }),
                                                    })}
                                                >
                                                    {/* Header row */}
                                                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                                        <Avatar
                                                            src={rv.reviewerAvatar || undefined}
                                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                                            sx={(t) => ({
                                                                width: 36, height: 36, flexShrink: 0, mt: 0.25,
                                                                cursor: rv.reviewerAvatar ? "pointer" : "default",
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                color: t.palette.primary.main,
                                                                fontSize: "0.85rem", fontWeight: 800,
                                                                "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                                                            })}
                                                        >
                                                            <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                                        </Avatar>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.2 }}>
                                                                    {rv.reviewerName || "User"}
                                                                </Typography>
                                                                {isOwnR && <Chip label="You" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 900 }} />}
                                                                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600, ml: 0.5 }}>
                                                                    {reviewTimeAgo(rv.createdAt)}
                                                                </Typography>
                                                                {rv.updatedAt && rv.updatedAt !== rv.createdAt && (
                                                                    <Typography sx={{ fontSize: "0.62rem", color: "text.disabled", fontWeight: 600, fontStyle: "italic" }}>(edited)</Typography>
                                                                )}
                                                            </Stack>
                                                            {rv.reviewerHandle && (
                                                                <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>
                                                                    @{rv.reviewerHandle}
                                                                </Typography>
                                                            )}
                                                            <Rating
                                                                value={Number(rv.rating)}
                                                                precision={0.5}
                                                                readOnly
                                                                size="small"
                                                                sx={{
                                                                    mt: 0.25,
                                                                    "& .MuiRating-icon": { fontSize: 15 },
                                                                }}
                                                            />
                                                        </Box>
                                                        {isOwnR && (
                                                            <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                                                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openReviewForm(rv)} sx={{ width: 28, height: 28 }}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                                                <Tooltip title="Delete"><IconButton size="small" onClick={() => setRvDeleteTarget(rv)} sx={{ width: 28, height: 28 }}><DeleteRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                                                            </Stack>
                                                        )}
                                                        {!isOwnR && uid && (
                                                            <Tooltip title="Report">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => { setRvReportTarget(rv); setRvReportOpen(true); }}
                                                                    sx={(t) => ({ width: 32, height: 32, flexShrink: 0, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } })}
                                                                >
                                                                    <MoreVertIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Stack>

                                                    {/* Title */}
                                                    {(rv.reviewTitle || rv.title) && (
                                                        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", mt: 1, lineHeight: 1.3 }}>
                                                            {rv.reviewTitle || rv.title}
                                                        </Typography>
                                                    )}

                                                    {/* Body */}
                                                    {rv.reviewText && (
                                                        <Typography
                                                            sx={{
                                                                fontSize: "0.84rem",
                                                                color: "text.primary",
                                                                lineHeight: 1.6,
                                                                mt: (rv.reviewTitle || rv.title) ? 0.5 : 1,
                                                                whiteSpace: "pre-wrap",
                                                                wordBreak: "break-word",
                                                            }}
                                                        >
                                                            {rv.reviewText}
                                                        </Typography>
                                                    )}

                                                    {/* Photos */}
                                                    {rPhotos.length > 0 && (
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.75}
                                                            sx={{
                                                                mt: 1.25,
                                                                overflowX: "auto",
                                                                pb: 0.5,
                                                                "&::-webkit-scrollbar": { height: 4 },
                                                                "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) },
                                                            }}
                                                        >
                                                            {rPhotos.map((u, i) => {
                                                                const src = typeof u === "object" ? u.url || u : u;
                                                                return (
                                                                    <Box
                                                                        key={i}
                                                                        onClick={() => setImagePopup({ src, alt: "Review photo" })}
                                                                        sx={{
                                                                            width: 88,
                                                                            height: 88,
                                                                            flexShrink: 0,
                                                                            borderRadius: 2,
                                                                            overflow: "hidden",
                                                                            border: "1px solid",
                                                                            borderColor: "divider",
                                                                            cursor: "pointer",
                                                                            "&:hover img": { transform: "scale(1.05)" },
                                                                            "&:hover": { boxShadow: (t) => t.custom?.shadows?.xs || "0 1px 4px rgba(0,0,0,0.1)" },
                                                                        }}
                                                                    >
                                                                        <Box
                                                                            component="img"
                                                                            src={src}
                                                                            alt={`Review photo ${i + 1}`}
                                                                            referrerPolicy="no-referrer"
                                                                            onError={(e) => { e.target.style.display = "none"; }}
                                                                            sx={{
                                                                                width: "100%",
                                                                                height: "100%",
                                                                                objectFit: "cover",
                                                                                display: "block",
                                                                                transition: "transform 250ms ease",
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Stack>
                                                    )}

                                                    {/* Helpful + Reply row */}
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                                        {!isOwnR && uid && (
                                                            <Button size="small" startIcon={<ThumbUpAltRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                                                    onClick={() => handleHelpful(rv)}
                                                                    sx={(t) => ({
                                                                        textTransform: "none", fontWeight: rv.viewerFoundHelpful ? 900 : 700, fontSize: "0.72rem", borderRadius: 2, px: 1, minHeight: 0,
                                                                        color: rv.viewerFoundHelpful ? t.palette.primary.main : t.palette.text.secondary,
                                                                        bgcolor: rv.viewerFoundHelpful ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                                                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.12) },
                                                                    })}>
                                                                Helpful{(rv.helpfulCount > 0) ? ` (${rv.helpfulCount})` : ""}
                                                            </Button>
                                                        )}
                                                        {!uid && rv.helpfulCount > 0 && (
                                                            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, fontSize: 11 }}>
                                                                {rv.helpfulCount} {rv.helpfulCount === 1 ? "person" : "people"} found this helpful
                                                            </Typography>
                                                        )}
                                                        {(isOwn || reviewViewerIsOwner) && !rv.providerResponse && respondingId !== rv.id && (
                                                            <Button
                                                                size="small"
                                                                startIcon={<ReplyRoundedIcon sx={{ fontSize: 14 }} />}
                                                                onClick={() => { setRespondingId(rv.id); setRespondText(""); }}
                                                                sx={{
                                                                    color: "text.secondary",
                                                                    textTransform: "none",
                                                                    fontWeight: 600,
                                                                    fontSize: "0.72rem",
                                                                    borderRadius: 2,
                                                                    px: 1,
                                                                    minHeight: 0,
                                                                    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                                                }}
                                                            >
                                                                Reply
                                                            </Button>
                                                        )}
                                                    </Stack>

                                                    {/* Provider Response */}
                                                    {rv.providerResponse && (
                                                        <Box sx={(t) => ({ mt: 1.5, ml: 2, pl: 1.5, py: 1.25, borderLeft: "3px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 8px 8px 0" })}>
                                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Avatar
                                                                        src={reviewProviderInfo?.providerAvatar || undefined}
                                                                        imgProps={{ referrerPolicy: "no-referrer" }}
                                                                        sx={(t) => ({
                                                                            width: 28, height: 28,
                                                                            bgcolor: alpha(t.palette.primary.main, 0.12),
                                                                            color: t.palette.primary.main,
                                                                            "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                                                                        })}
                                                                    >
                                                                        <PersonRoundedIcon sx={{ fontSize: 16 }} />
                                                                    </Avatar>
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                            <Typography sx={{ fontWeight: 900, fontSize: "0.78rem", lineHeight: 1.2 }}>
                                                                                {reviewProviderInfo?.providerName || service.providerName || "Owner"}
                                                                            </Typography>
                                                                            <Chip icon={<StarRoundedIcon sx={{ fontSize: "10px !important" }} />} label="Owner" size="small"
                                                                                  sx={{ height: 18, fontSize: "0.55rem", fontWeight: 900, bgcolor: "secondary.main", color: "common.white", "& .MuiChip-icon": { color: "common.white", ml: 0.25 }, "& .MuiChip-label": { px: 0.5 } }} />
                                                                        </Stack>
                                                                        {reviewProviderInfo?.providerHandle && (
                                                                            <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>@{reviewProviderInfo.providerHandle}</Typography>
                                                                        )}
                                                                    </Box>
                                                                </Stack>
                                                            </Stack>
                                                            <Typography sx={{ fontSize: "0.8rem", color: "text.primary", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{rv.providerResponse}</Typography>
                                                        </Box>
                                                    )}

                                                    {/* Inline reply form */}
                                                    {(isOwn || reviewViewerIsOwner) && !rv.providerResponse && respondingId === rv.id && (
                                                        <Box sx={(t) => ({ mt: 1.5, ml: 2, pl: 1.5, py: 1.5, borderLeft: "3px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 8px 8px 0" })}>
                                                            <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: "primary.dark", mb: 1 }}>Reply as Owner</Typography>
                                                            <TextField fullWidth multiline minRows={2} maxRows={4} placeholder="Write your response..." size="small" value={respondText} onChange={(e) => setRespondText(e.target.value.slice(0, 2000))} sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.82rem" } }} />
                                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                                <Button size="small" onClick={() => { setRespondingId(null); setRespondText(""); }} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.72rem" }}>Cancel</Button>
                                                                <Button size="small" variant="contained" disabled={!respondText.trim()} onClick={() => handleRespond(rv.id)} sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.72rem", borderRadius: 999, px: 2 }}>Post Reply</Button>
                                                            </Stack>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                        {!reviewsLoading && !reviews.length && <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}><ReviewsRoundedIcon sx={{ fontSize: 44, color: "primary.main" }} /><Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>{isOwn ? "No reviews on your service yet" : "No reviews yet"}</Typography><Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 280 }}>{isOwn ? "When customers share their experience, their reviews will show up here." : "Be the first to share your experience with this service."}</Typography></Box>}
                                    </Box>
                                )}
                            </Box>

                            {/* ══════════════════════════════════════════ */}
                            {/*  RIGHT SIDEBAR                            */}
                            {/* ══════════════════════════════════════════ */}
                            <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0, order: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 16 }, mb: { xs: 2, md: 0 } }}>
                                <Stack spacing={1.5}>
                                    {/* Provider card with Message + View Provider */}
                                    <Box sx={CARD}>
                                        <Box sx={{ p: 2.5 }}>
                                            <Typography sx={{ fontWeight: 900, fontSize: "0.68rem", color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, mb: 1.25 }}>Provided By</Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center"
                                                   sx={{ cursor: service.providerHandle ? "pointer" : "default", borderRadius: 2, p: 1, mx: -1, transition: "background-color 150ms ease", "&:hover": service.providerHandle ? { bgcolor: "action.hover" } : {} }}
                                                   onClick={() => { if (service.providerHandle) navigate("/" + service.providerHandle); }}>
                                                {(() => {
                                                    const pType = (service.providerType || service.provider_type || "").toLowerCase();
                                                    const provAvatarSrc = providerProfileAvatar || service.providerAvatar || service.provider_avatar;
                                                    return (
                                                        <Avatar
                                                            src={provAvatarSrc || undefined}
                                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                                            sx={(t) => ({
                                                                width: 52, height: 52, flexShrink: 0,
                                                                border: "2px solid", borderColor: "divider",
                                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                                color: t.palette.primary.main,
                                                                "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                                                            })}
                                                        >
                                                            {pType === "business" ? <StorefrontOutlinedIcon sx={{ fontSize: 26 }} />
                                                                : pType === "music" ? <MusicNoteOutlinedIcon sx={{ fontSize: 26 }} />
                                                                    : <PersonRoundedIcon sx={{ fontSize: 26 }} />}
                                                        </Avatar>
                                                    );
                                                })()}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 900, fontSize: "0.88rem", lineHeight: 1.2 }}>{service.providerName || "Provider"}</Typography>
                                                    {service.providerHandle && <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary" }}>{"@" + service.providerHandle}</Typography>}
                                                </Box>
                                                {service.providerHandle && <OpenInNewRoundedIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
                                            </Stack>
                                            {isOwn ? (
                                                <Button variant="contained" fullWidth startIcon={<SettingsRoundedIcon />}
                                                        onClick={() => navigate("/services/" + service.id + "/console")}
                                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 950, py: 1.1, fontSize: 15, boxShadow: "none", mt: 2 }}>
                                                    Edit Profile
                                                </Button>
                                            ) : providerAllowsMessages ? (
                                                <Button variant="contained" fullWidth startIcon={<ChatBubbleOutlineRoundedIcon />}
                                                        onClick={openQuickMsg}
                                                        sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 950, py: 1.1, fontSize: 15, color: t.palette.common.white, boxShadow: "none", mt: 2 })}>
                                                    Message
                                                </Button>
                                            ) : null}
                                            {!isOwn && service.providerHandle && (
                                                <Button variant="outlined" fullWidth size="small" startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "15px !important" }} />}
                                                        onClick={() => navigate("/" + service.providerHandle)}
                                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: "0.82rem", mt: 1 }}>
                                                    View Provider
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>
                                    {/* Hours widget — visible on all tabs */}
                                    {(parsedH || service.availabilityNotes) && (
                                        <Box sx={CARD}>
                                            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                                <ExpandableHours parsedHours={parsedH} hoursStatus={hStatus} notes={service.availabilityNotes} defaultOpen />
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        </Box>{/* /two-column */}
                    </Box>{/* /CARD */}
                </Box>
            </Box>

            {/* ═══ DIALOGS ═══ */}
            <PhotoLightbox open={lbOpen} onClose={() => setLbOpen(false)} photos={photos} initialIndex={lbIndex} onReport={handlePhotoReportOpen} isOwner={!!isOwn} />
            <ImagePopup open={Boolean(imagePopup)} onClose={() => setImagePopup(null)} src={imagePopup?.src} alt={imagePopup?.alt} />

            <Dialog open={rvFormOpen} onClose={rvSubmitting ? undefined : closeReviewForm} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 2.5, position: "relative" }}>
                    <IconButton onClick={closeReviewForm} disabled={rvSubmitting} sx={{ position: "absolute", top: 8, right: 8, width: 32, height: 32 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
                    <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", mb: 2, pr: 4 }}>{rvEditing ? "Edit Your Review" : "Write a Review"}</Typography>
                    <Box sx={{ mb: 2 }}><Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>Your Rating *</Typography><Rating value={rvRating} precision={1} onChange={(_e, v) => setRvRating(v || 0)} size="large" /></Box>
                    <TextField fullWidth label="Review Title (optional)" value={rvTitle} onChange={(e) => setRvTitle(e.target.value.slice(0, 160))} size="small" inputProps={{ maxLength: 160 }} sx={{ mb: 1.5 }} />
                    <TextField fullWidth label="Your Review" value={rvText} onChange={(e) => setRvText(e.target.value)} multiline minRows={3} maxRows={8} size="small" sx={{ mb: 1.5 }} />
                    <Box sx={{ mb: 1.5 }}><PhotosUploadSection photos={rvPhotos} setPhotos={setRvPhotos} disabled={rvSubmitting} maxPhotos={MAX_REVIEW_PHOTOS} title="Photos (optional)" helperText="Add up to 4 photos." addButtonText="Add photos" /></Box>
                    {rvError && <Typography sx={{ fontSize: "0.8rem", color: "error.main", fontWeight: 700, mb: 1 }}>{rvError}</Typography>}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        {rvEditing && <Button size="small" color="error" startIcon={<DeleteRoundedIcon sx={{ fontSize: "15px !important" }} />} onClick={() => setRvDeleteTarget(rvEditing)} disabled={rvSubmitting} sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem", mr: "auto" }}>Delete</Button>}
                        <Button size="small" onClick={closeReviewForm} disabled={rvSubmitting} sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem" }}>Cancel</Button>
                        <Button variant="contained" size="small" onClick={handleSubmitReview} disabled={rvSubmitting || !rvRating} sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem", borderRadius: 2, px: 2 }}>{rvSubmitting ? "Saving\u2026" : (rvEditing ? "Update" : "Submit")}</Button>
                    </Stack>
                    {rvSubmitting && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                </Box>
            </Dialog>

            <Dialog open={Boolean(rvDeleteTarget)} onClose={() => { if (!rvDeleting) setRvDeleteTarget(null); }} maxWidth="xs" fullWidth disableScrollLock>
                <DialogTitle sx={{ pr: 6 }}><Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Review</Typography><IconButton onClick={() => setRvDeleteTarget(null)} disabled={rvDeleting} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton></DialogTitle>
                <DialogContent><Stack spacing={2}><Typography variant="body2" sx={{ color: "text.secondary" }}>Are you sure? This cannot be undone.</Typography><Stack direction="row" spacing={1} justifyContent="flex-end"><Button variant="outlined" onClick={() => setRvDeleteTarget(null)} disabled={rvDeleting}>Cancel</Button><Button variant="contained" color="error" onClick={() => handleDeleteReview(rvDeleteTarget?.id)} disabled={rvDeleting}>{rvDeleting ? "Deleting\u2026" : "Delete"}</Button></Stack></Stack></DialogContent>
            </Dialog>

            {/* ═══ Own-Service Review Notice ═══ */}
            <Dialog open={rvIneligible.open} onClose={() => setRvIneligible({ open: false, reason: "" })} maxWidth="xs" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <IconButton onClick={() => setRvIneligible({ open: false, reason: "" })} sx={{ position: "absolute", top: 8, right: 8, width: 32, height: 32 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
                    <RateReviewRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", mb: 1 }}>Unable to Review</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 2.5 }}>
                        {rvIneligible.reason}
                    </Typography>
                    <Button variant="contained" fullWidth onClick={() => setRvIneligible({ open: false, reason: "" })} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}>Got It</Button>
                </Box>
            </Dialog>

            <ShareServiceDialog open={shareOpen} onClose={() => setShareOpen(false)} service={service} viewer={auth?.user} />

            {/* ═══ Photo Comments (Like/Comment on Avatar, Cover, Gallery Photos) ═══ */}
            <PhotoCommentsDialog
                open={photoCommentsOpen}
                onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(null); }}
                profileHandleOrId={serviceId}
                viewerId={resolvedUserId || 0}
                isOwner={!!isOwn}
                highlightCommentId={pendingPhotoHighlightId}
                photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                photoId={photoCommentsType === 'gallery' ? photoCommentsPhotoId : undefined}
                photoUrl={photoCommentsType === 'gallery' ? photoCommentsPhotoUrl : undefined}
                apiPrefix="/api/services"
                onSuccess={showSuccess}
                allPhotos={photoCommentsType === 'gallery' ? (serviceGalleryLoaded && serviceGalleryPhotos.length > 0 ? serviceGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0)) : photos) : undefined}
                onNavigatePhoto={photoCommentsType === 'gallery' ? (newPhotoId, newPhotoUrl) => {
                    setPhotoCommentsPhotoId(newPhotoId);
                    setPhotoCommentsPhotoUrl(newPhotoUrl || null);
                } : undefined}
                onReportPhoto={handlePhotoReportOpen}
            />
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} title="Report Service" />
            <ReportDialog open={photoReportOpen} onClose={() => { setPhotoReportOpen(false); setPhotoReportTarget(null); }} onSubmit={handlePhotoReportSubmit} title="Report Photo" />
            <ReportDialog
                open={rvReportOpen}
                onClose={() => { setRvReportOpen(false); setRvReportTarget(null); }}
                onSubmit={async ({ reason, details }) => {
                    const target = rvReportTarget;
                    const reviewId = target?.id;
                    const svcId = serviceId;
                    if (!reviewId || !svcId) return;
                    try {
                        await fetch(`/api/services/${encodeURIComponent(svcId)}/reviews/${encodeURIComponent(reviewId)}/report`, {
                            method: "POST", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reason, details, reviewType: "service" }),
                        });
                    } catch { /* noop */ }
                }}
                title="Report Review"
            />
            <SuccessSnackbar {...successSnackbarProps} />

            {/* ═══ Quick Message Dialog ═══ */}
            <Dialog open={quickMsgOpen} onClose={closeQuickMsg} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Contact Provider</Typography>
                    <IconButton aria-label="Close" onClick={closeQuickMsg} disabled={quickMsgSending} sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {quickMsgSuccess ? (
                        <Stack spacing={2} sx={{ py: 2 }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    The provider will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { setQuickMsgOpen(false); showSuccess("Message sent!"); }}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                                Done
                            </Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {/* Locked recipient */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={
                                        (() => {
                                            const pType = (service.providerType || service.provider_type || "").toLowerCase();
                                            const provAvatarSrc = providerProfileAvatar || service.providerAvatar || service.provider_avatar;
                                            return (
                                                <Avatar
                                                    src={provAvatarSrc || undefined}
                                                    imgProps={{ referrerPolicy: "no-referrer" }}
                                                    sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main", width: 24, height: 24 }}
                                                >
                                                    {pType === "business" ? <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />
                                                        : pType === "music" ? <MusicNoteOutlinedIcon sx={{ fontSize: 14 }} />
                                                            : <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                                </Avatar>
                                            );
                                        })()
                                    }
                                    label={service.providerName || "Provider"}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            {/* Service context */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{service.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{service.providerName || "Provider"}</Typography>
                            </Box>
                            <TextField
                                label="Message"
                                placeholder="Describe what you need, timeline, budget, etc."
                                multiline
                                minRows={5}
                                maxRows={10}
                                value={quickMsgBody}
                                onChange={(e) => setQuickMsgBody(e.target.value.slice(0, 2000))}
                                inputProps={{ maxLength: 2000 }}
                                fullWidth
                                helperText={`${quickMsgBody.length} / 2,000`}
                                FormHelperTextProps={{ sx: { textAlign: "right", mr: 0.5, fontWeight: 600, fontSize: "0.75rem" } }}
                                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }}
                            />
                            {/* Photos */}
                            <PhotosUploadSection photos={quickMsgPhotos} setPhotos={setQuickMsgPhotos} disabled={quickMsgSending}
                                                 maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos to help describe what you need."
                                                 addButtonText="Add photos" />
                            {quickMsgError && (
                                <Alert severity={quickMsgCooldown > 0 ? "warning" : "error"} sx={{ borderRadius: 2 }}>
                                    {quickMsgError}
                                </Alert>
                            )}
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button variant="outlined" onClick={closeQuickMsg} disabled={quickMsgSending}
                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" onClick={handleQuickMsgSend} disabled={!quickMsgBody.trim() || quickMsgSending || quickMsgCooldown > 0}
                                        startIcon={quickMsgSending ? <CircularProgress size={16} color="inherit" /> : <ChatBubbleOutlineRoundedIcon />}
                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>
                                    {quickMsgCooldown > 0 ? `Wait ${quickMsgCooldown}s` : quickMsgSending ? "Sending\u2026" : "Send Message"}
                                </Button>
                            </Stack>
                            {quickMsgSending && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rate limit reached dialog */}
            <Dialog open={quickMsgLimitOpen} onClose={() => setQuickMsgLimitOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this provider recently. Give them a chance to respond before sending more.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center" }}>
                    <Button variant="contained" onClick={() => setQuickMsgLimitOpen(false)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 4 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}