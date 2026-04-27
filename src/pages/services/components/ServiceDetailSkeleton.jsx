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
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
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
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
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
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import ButtonBase from "@mui/material/ButtonBase";

import { fetchServiceById, fetchServiceReviews, createServiceReview, updateServiceReview, deleteServiceReview, respondToReview } from "./api/servicesApi";
import { toggleServiceFavorite } from "./api/serviceFavoritesApi";
import { getServiceCategoryInfo } from "./utils/serviceHelpers";
import { useAuth } from "../../components/AuthModalContext";
import { useActiveAccount } from "../../components/AccountContext";
import { ReportDialog } from "../../components/ActionBar";
import PhotosUploadSection from "../../components/PhotosUploadSection";
import ShareServiceDialog from "./components/ShareServiceDialog";
import defaultAvatar from "../../assets/profile/default_avatar.png";
import { secureFetch } from "../../utils/secureFetch";

/* ── GCS upload helpers ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
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
const CARD = (t) => ({ borderRadius: 3, border: "1px solid", borderColor: alpha(t.palette.divider, 0.6), bgcolor: "background.paper", overflow: "hidden", boxShadow: "0 2px 12px " + alpha(t.palette.text.primary, 0.04) });
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
function PhotoLightbox({ open, onClose, photos, initialIndex }) {
    const [idx, setIdx] = useState(initialIndex || 0);
    const items = Array.isArray(photos) ? photos.filter((p) => p && p.url) : [];
    useEffect(() => { setIdx(initialIndex || 0); }, [initialIndex, open]);
    if (!items.length) return null;
    const si = Math.max(0, Math.min(idx, items.length - 1));
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, bgcolor: "common.black", overflow: "hidden" } }}>
            <Box sx={{ position: "relative" }}>
                <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, zIndex: 10, color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.4), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) } }}><CloseIcon /></IconButton>
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
        mk(svc.instagramUrl, <InstagramIcon sx={{ fontSize: 15 }} />, "Instagram", "#C13584"),
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

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ServiceDetailPage() {
    const navigate = useNavigate();
    const routeLocation = useLocation();
    const { serviceId } = useParams();
    const auth = useAuth();
    const { activeAccount } = useActiveAccount();
    const cameFromServices = routeLocation?.state?.from === "services";

    const resolvedUserId = useMemo(() => {
        const fromAuth = auth?.user?.id || auth?.user?.user_id;
        if (fromAuth) return fromAuth;
        const fromAcct = activeAccount?.user_id || activeAccount?.id;
        if (fromAcct) return fromAcct;
        try { const raw = localStorage.getItem("ll:activeAccount"); const a = raw ? JSON.parse(raw) : null; return a?.user_id || a?.id || null; } catch { return null; }
    }, [auth?.user, activeAccount]);

    /* ── State ── */
    // ── TOKEN_EXPIRED: redirect to login ──
    useEffect(() => {
        const onExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', onExpired);
        return () => window.removeEventListener('auth:token-expired', onExpired);
    }, [navigate]);

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [descExpanded, setDescExpanded] = useState(false);
    const [copyToast, setCopyToast] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIndex, setLbIndex] = useState(0);
    const [imagePopup, setImagePopup] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewSort, setReviewSort] = useState("newest");

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
    const [chromeTop, setChromeTop] = useState(0);
    const [favOptimistic, setFavOptimistic] = useState(null);
    const [favDelta, setFavDelta] = useState(0);

    /* ── Lifecycle ── */
    useLayoutEffect(() => {
        const measure = () => { const h = document.querySelector("header.MuiAppBar-root") || document.querySelector("header"); setChromeTop(h ? h.getBoundingClientRect().bottom : 0); };
        measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure);
    }, []);

    useEffect(() => {
        let ok = true; setLoading(true); setError(null);
        fetchServiceById(serviceId).then((d) => { if (ok) { setService(d); setLoading(false); } }).catch((e) => { if (ok) { setError(e?.message || "Service not found."); setLoading(false); } });
        return () => { ok = false; };
    }, [serviceId]);

    useEffect(() => { setFavOptimistic(null); setFavDelta(0); }, [service?.isFavorited, service?.is_favorited, service?.favoritesCount, service?.favorites_count]);

    /* ── Handlers ── */
    const handleFavorite = () => {
        if (!service?.id) return;
        const cur = favOptimistic !== null ? favOptimistic : Boolean(service.isFavorited || service.is_favorited);
        const next = !cur;
        setFavOptimistic(next); setFavDelta((p) => p + (next ? 1 : -1));
        toggleServiceFavorite(service.id).then((r) => { if (r && typeof r.favoritesCount === "number") setService((p) => p ? { ...p, isFavorited: Boolean(r.favorited), favoritesCount: r.favoritesCount } : p); }).catch(() => { setFavOptimistic(cur); setFavDelta((p) => p + (next ? -1 : 1)); });
    };

    const loadReviews = useCallback(async () => {
        if (!serviceId) return; setReviewsLoading(true);
        try { const d = await fetchServiceReviews(serviceId, { sort: reviewSort, limit: 50 }); setReviews(d.reviews || []); setReviewsTotal(d.total || 0); } catch { setReviews([]); setReviewsTotal(0); } finally { setReviewsLoading(false); }
    }, [serviceId, reviewSort]);

    useEffect(() => { if (service) loadReviews(); }, [service, loadReviews]);

    const openReviewForm = (existing = null) => {
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
    const submitReport = async ({ reason, details }) => { try { await secureFetch("/api/services/" + (service?.id) + "/report", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details }) }); } catch { /* noop */ } };
    const handleCopyLink = () => { navigator.clipboard?.writeText(window.location.origin + "/services/" + (service?.id || "")); setCopyToast(true); setTimeout(() => setCopyToast(false), 2000); };

    /* ── Loading / Error ── */
    if (loading) return (<Box sx={{ position: "fixed", top: chromeTop, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}><CircularProgress /></Box>);
    if (error || !service) return (<Box sx={{ position: "fixed", top: chromeTop, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, bgcolor: "background.default" }}><Typography color="error" sx={{ fontWeight: 800 }}>{error || "Service not found."}</Typography><Button onClick={() => navigate("/services")} startIcon={<ArrowBackRoundedIcon />} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}>Back to Services</Button></Box>);

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
    const isOwn = (() => { if (service.isOwner != null) return service.isOwner; if (!uid) return false; const pt = service.providerType || service.provider_type; const pi = String(service.providerId ?? service.provider_id ?? ""); if (!pi) return false; if ((pt === "user" || pt === "personal") && pi === String(uid)) return true; if (pt === "business" && activeAccount?.type === "business" && pi === String(activeAccount?.id)) return true; if (pt === "music" && activeAccount?.type === "artist" && pi === String(activeAccount?.id)) return true; return false; })();
    const providerAllowsReviews = service.allowReviews !== false && service.allow_reviews !== false;
    const providerAllowsMessages = service.allowMessages !== false && service.allow_messages !== false;
    const reviewsTabIdx = providerAllowsReviews ? 3 : -1;
    const myReview = reviews.find((r) => r.reviewerId === uid);
    const canWrite = uid && !isOwn && !myReview && providerAllowsReviews;
    const localFav = favOptimistic !== null ? favOptimistic : Boolean(service.isFavorited || service.is_favorited);
    const baseFav = Number(service.favoritesCount || service.favorites_count || 0);
    const dispFav = Math.max(0, baseFav + favDelta);
    const rc = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; reviews.forEach((r) => { const s = Math.round(r.rating); if (s >= 1 && s <= 5) rc[s]++; });
    const avgR = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const maxC = Math.max(1, ...Object.values(rc));
    const dispR = service.reviewAvg || avgR;
    const dispRC = service.reviewCount || reviewsTotal;
    const parsedH = parseHours(service.availabilityHours);
    const hStatus = getHoursStatus(service.availabilityHours);
    const team = Array.isArray(service.teamMembers) ? service.teamMembers.filter((m) => m.name) : [];

    // ═══════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════
    return (
        <Box sx={{ position: "fixed", top: chromeTop + "px", left: 0, right: 0, bottom: 0, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 1.5, md: 3 }, pt: { xs: 1, md: 1.5 }, pb: 4 }}>

                    {/* ═══ HEADER CARD ═══ */}
                    <Box sx={CARD}>
                        {cameFromServices && (
                            <Box sx={{ px: { xs: 2, sm: 3 }, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                                <Button onClick={() => navigate(-1)} startIcon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />} sx={{ px: 1.5, py: 0.5, minWidth: 0, fontWeight: 800, fontSize: 13, textTransform: "none", borderRadius: 999, color: "primary.main" }}>Return to Services</Button>
                            </Box>
                        )}

                        {/* Cover */}
                        {(service.coverUrl || (photos.length > 0 && photos[0]?.url)) && (
                            <Box sx={{ position: "relative", width: "100%", height: { xs: 140, sm: 180, md: 220 }, overflow: "hidden" }}>
                                <Box component="img" src={service.coverUrl || photos[0].url} alt="" referrerPolicy="no-referrer"
                                     onClick={() => setImagePopup({ src: service.coverUrl || photos[0].url, alt: "Cover" })}
                                     sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }} />
                                <Box sx={(t) => ({ position: "absolute", inset: 0, background: "linear-gradient(to top, " + alpha(t.palette.background.paper, 0.5) + " 0%, transparent 50%)" })} />
                            </Box>
                        )}

                        {/* Identity */}
                        <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.75, md: 2 } }}>
                            <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="flex-start">
                                <Avatar src={service.serviceAvatarUrl || service.providerAvatar || defaultAvatar}
                                        onClick={() => { const s = service.serviceAvatarUrl || service.providerAvatar; if (s) setImagePopup({ src: s, alt: "Avatar" }); }}
                                        sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0, border: "3px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.15), boxShadow: (t) => "0 2px 12px " + alpha(t.palette.common.black, 0.1), bgcolor: (t) => alpha(t.palette.success.main, 0.12), cursor: (service.serviceAvatarUrl || service.providerAvatar) ? "pointer" : "default" }}
                                        imgProps={{ referrerPolicy: "no-referrer" }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 950, fontSize: { xs: "1.15rem", sm: "1.3rem", md: "1.4rem" }, lineHeight: 1.15, letterSpacing: "-0.02em", wordBreak: "break-word" }}>{service.title || "Untitled Service"}</Typography>
                                    {service.summary && <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 600, mt: 0.25, lineHeight: 1.4 }}>{service.summary}</Typography>}
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                                        {catInfo && <Chip size="small" icon={CatIcon ? <CatIcon sx={{ fontSize: "13px !important" }} /> : undefined} label={catInfo.name} sx={(t) => ({ height: 24, fontWeight: 800, fontSize: "0.7rem", bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.15), "& .MuiChip-label": { px: 0.75 }, "& .MuiChip-icon": { color: t.palette.primary.main } })} />}
                                        {service.licensedInsured && <Chip size="small" icon={<GppGoodRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Licensed & Insured" sx={(t) => ({ height: 24, fontWeight: 800, fontSize: "0.68rem", bgcolor: alpha(t.palette.success.main, 0.08), color: t.palette.success.dark, border: "1px solid", borderColor: alpha(t.palette.success.main, 0.18), "& .MuiChip-label": { px: 0.75 }, "& .MuiChip-icon": { color: t.palette.success.main } })} />}
                                    </Box>
                                    {/* Rating row — above address */}
                                    {providerAllowsReviews && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                            <Rating value={dispR || 0} precision={0.5} readOnly size="small" sx={{ "& .MuiRating-iconFilled": { color: "secondary.main" }, "& .MuiRating-icon": { fontSize: 16 } }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: "text.secondary" }}>{dispR > 0 ? dispR.toFixed(1) : "0.0"} ({dispRC})</Typography>
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>

                            {/* Location — far left, own line matching business detail */}
                            <Stack direction="row" spacing={0.35} alignItems="center" sx={{ mt: 0.75 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 15, color: "primary.main" }} />
                                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "primary.main" }}>{loc}</Typography>
                            </Stack>
                            {/* Hours status (Open / Closed) — far left, expandable like business detail */}
                            {hStatus && (
                                <Box sx={{ mt: 0.5 }}>
                                    <ExpandableHours parsedHours={parsedH} hoursStatus={hStatus} notes={service.availabilityNotes} />
                                </Box>
                            )}

                            {/* Actions + Social links (social pushed to far bottom-right) */}
                            <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ mt: 1 }}>
                                {isOwn ? (
                                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}><StarRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /><Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{formatFavCount(dispFav)}</Typography></Box>
                                ) : (
                                    <Tooltip title={localFav ? "Remove from favorites" : "Add to favorites"}>
                                        <Box onClick={handleFavorite} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.4, borderRadius: 999, cursor: "pointer", border: "1px solid", borderColor: localFav ? (t) => alpha(t.palette.secondary.main, 0.4) : "divider", bgcolor: localFav ? (t) => alpha(t.palette.secondary.main, 0.08) : "background.paper", transition: "all 200ms ease", "&:hover": { bgcolor: localFav ? (t) => alpha(t.palette.secondary.main, 0.15) : "action.hover" }, "&:active": { transform: "scale(0.97)" } }}>
                                            {localFav ? <StarRoundedIcon sx={{ fontSize: 18, color: "secondary.main" }} /> : <StarBorderRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />}
                                            <Typography sx={{ fontSize: 12, fontWeight: 700, color: localFav ? "secondary.main" : "text.secondary" }}>{formatFavCount(dispFav)}</Typography>
                                        </Box>
                                    </Tooltip>
                                )}
                                {isOwn && <Button variant="outlined" size="small" startIcon={<SettingsRoundedIcon sx={{ fontSize: "14px !important" }} />} onClick={() => navigate("/services/" + service.id + "/console")} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: "0.72rem", height: 32, px: 1.25 }}>Manage</Button>}
                                <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={(t) => ({ border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, width: 32, height: 32, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } })}><MoreVertIcon fontSize="small" /></IconButton>
                                <Menu disableScrollLock anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} onClick={(e) => e.stopPropagation()} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200, py: 0.5 } }}>
                                    <MenuItem onClick={() => { setMenuAnchor(null); handleCopyLink(); }} sx={{ py: 1 }}><ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon><ListItemText primary="Copy link" /></MenuItem>
                                    {!isOwn && <MenuItem onClick={() => { setMenuAnchor(null); setReportOpen(true); }} sx={{ py: 1 }}><ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText primary="Report" /></MenuItem>}
                                </Menu>
                            </Stack>

                            {/* Social links — far bottom-right */}
                            {socialLinks.length > 0 && (
                                <Stack direction="row" spacing={0.25} justifyContent="flex-end" sx={{ mt: 1 }}>
                                    {socialLinks.map((sl) => (<Tooltip key={sl.tip} title={sl.tip} arrow><IconButton component="a" href={sl.url} target="_blank" rel="noopener noreferrer" size="small" sx={{ width: 28, height: 28, color: sl.color, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}>{sl.icon}</IconButton></Tooltip>))}
                                </Stack>
                            )}
                        </Box>

                        {/* Tabs */}
                        <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} variant="fullWidth"
                              sx={(t) => ({ borderTop: "1px solid " + alpha(t.palette.divider, 0.6), "& .MuiTabs-indicator": { height: 3, bgcolor: t.palette.primary.main }, "& .MuiTab-root": { minHeight: 46, textTransform: "none", fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.85rem" }, color: "text.secondary", gap: 0.5, "&.Mui-selected": { color: "primary.main", fontWeight: 900, bgcolor: alpha(t.palette.primary.main, 0.04) } } })}>
                            <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="About" />
                            <Tab icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Contact" />
                            <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={"Photos" + (photos.length ? " (" + photos.length + ")" : "")} />
                            {providerAllowsReviews && <Tab icon={<RateReviewRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={"Reviews" + (dispRC ? " (" + dispRC + ")" : "")} />}
                        </Tabs>
                    </Box>

                    {/* ═══ TWO-COLUMN LAYOUT ═══ */}
                    <Box sx={{ display: "flex", gap: { xs: 0, md: 2.5 }, flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start", pt: 2 }}>

                        {/* ── LEFT COLUMN ── */}
                        <Box sx={{ flex: 1, minWidth: 0, order: { xs: 2, md: 1 } }}>

                            {/* ═══ ABOUT TAB ═══ */}
                            {activeTab === 0 && (
                                <Stack spacing={1.5}>
                                    {/* Description + photo strip */}
                                    {(desc || service.aboutPhotoUrl) && (
                                        <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                            <Typography sx={{ ...H, fontSize: 17, mb: 1.25 }}>{"About " + (service.title || "This Service")}</Typography>
                                            <Box sx={{ position: "relative", maxHeight: descExpanded || !descLong ? "none" : 160, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                                                {service.aboutPhotoUrl && (
                                                    <Box component="img" src={service.aboutPhotoUrl} alt="" referrerPolicy="no-referrer"
                                                         onClick={() => setImagePopup({ src: service.aboutPhotoUrl, alt: service.title })}
                                                         sx={{ float: "left", width: { xs: 120, sm: 150 }, height: "auto", maxHeight: 200, objectFit: "contain", borderRadius: 2.5, mr: 1.75, mb: 0.75, cursor: "pointer", "&:hover": { opacity: 0.85 } }} />
                                                )}
                                                {desc && <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.65, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line" }}>{desc}</Typography>}
                                                <Box sx={{ clear: "both" }} />
                                                {!descExpanded && descLong && <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(transparent, " + t.palette.background.paper + ")", pointerEvents: "none" })} />}
                                            </Box>
                                            {descLong && <Button size="small" onClick={() => setDescExpanded((p) => !p)} endIcon={<ExpandMoreRoundedIcon sx={{ fontSize: "16px !important", transform: descExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />} sx={{ mt: 0.5, textTransform: "none", fontWeight: 700, fontSize: "0.78rem", px: 0, color: "primary.main", "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>{descExpanded ? "Show less" : "Read more"}</Button>}
                                            {photos.length > 0 && (
                                                <Box sx={{ display: "flex", gap: 1, mt: 1.5, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: (t) => alpha(t.palette.text.primary, 0.15), borderRadius: 2 } }}>
                                                    {photos.slice(0, 8).map((p, i) => (<Box key={p.id || i} component="img" src={p.url} alt="" referrerPolicy="no-referrer" onClick={() => { setLbIndex(i); setLbOpen(true); }} sx={{ height: 100, width: "auto", maxWidth: 180, objectFit: "contain", borderRadius: 2, flexShrink: 0, cursor: "pointer", "&:hover": { opacity: 0.85 } }} />))}
                                                </Box>
                                            )}
                                        </Box></Box>
                                    )}

                                    {/* Highlights — image LEFT, text centered RIGHT */}
                                    {Array.isArray(service.highlightSections) && service.highlightSections.filter((s) => s.title || s.body || s.photoUrl).map((sec, idx) => (
                                        <Box key={idx} sx={(t) => ({ borderRadius: 2.5, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                            <Box sx={(t) => ({ px: 2, py: 1, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", gap: 0.75 })}>
                                                <HlIcon name={sec.iconName || sec.icon || "Star"} sx={{ fontSize: 17, color: "primary.main" }} />
                                                <Typography sx={{ fontWeight: 900, fontSize: 12, color: "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>{sec.title || "Highlight"}</Typography>
                                            </Box>
                                            {(sec.photoUrl || sec.body) && (
                                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ p: 1.75 }}>
                                                    {sec.photoUrl && (
                                                        <Box component="img" src={sec.photoUrl} alt={sec.title || ""} referrerPolicy="no-referrer"
                                                             onClick={() => setImagePopup({ src: sec.photoUrl, alt: sec.title || "Highlight" })}
                                                             sx={{ width: { xs: "100%", sm: 180 }, height: "auto", maxHeight: 220, objectFit: "contain", borderRadius: 2, cursor: "pointer", flexShrink: 0, "&:hover": { opacity: 0.85 } }} />
                                                    )}
                                                    {sec.body && <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line" }}>{sec.body}</Typography>}
                                                </Stack>
                                            )}
                                        </Box>
                                    ))}

                                    {/* Services Offered */}
                                    {Array.isArray(service.servicesOffered) && service.servicesOffered.length > 0 && (
                                        <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                            <Typography sx={{ ...H, mb: 1 }}>Services Offered</Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                                {service.servicesOffered.map((s, i) => (<Chip key={i} label={s} size="small" variant="outlined" icon={CatIcon ? <CatIcon sx={{ fontSize: "14px !important" }} /> : undefined} sx={(t) => ({ fontWeight: 700, fontSize: "0.78rem", borderColor: alpha(t.palette.text.primary, 0.12), "& .MuiChip-icon": { color: t.palette.primary.main } })} />))}
                                            </Box>
                                        </Box></Box>
                                    )}

                                    {/* Meet the Owner — styled like Discover tab */}
                                    {team.length > 0 && (
                                        <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", bgcolor: alpha(t.palette.text.primary, 0.025), border: "1px solid", borderColor: alpha(t.palette.divider, 0.6) })}>
                                            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: 13, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
                                                    {service.teamSectionTitle || "Meet the Owner"}
                                                </Typography>
                                                <Stack spacing={2}>
                                                    {team.map((m, i) => (
                                                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                                                            <Box
                                                                component="img"
                                                                src={m.avatarUrl || defaultAvatar}
                                                                alt={m.name}
                                                                onClick={() => { if (m.avatarUrl) setImagePopup({ src: m.avatarUrl, alt: m.name }); }}
                                                                sx={{
                                                                    width: 90,
                                                                    height: 90,
                                                                    borderRadius: 2.5,
                                                                    objectFit: "cover",
                                                                    border: "2px solid",
                                                                    borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                                                                    boxShadow: (t) => "0 2px 12px " + alpha(t.palette.common.black, 0.08),
                                                                    flexShrink: 0,
                                                                    cursor: m.avatarUrl ? "pointer" : "default",
                                                                    transition: "opacity 0.15s",
                                                                    "&:hover": m.avatarUrl ? { opacity: 0.85 } : {},
                                                                }}
                                                            />
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>{m.name}</Typography>
                                                                {m.role && <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", mt: 0.15 }}>{m.role}</Typography>}
                                                                {m.bio && <Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.secondary", mt: 0.5, lineHeight: 1.5, whiteSpace: "pre-line" }}>{m.bio}</Typography>}
                                                            </Box>
                                                        </Stack>
                                                    ))}
                                                </Stack>
                                            </Box></Box>
                                    )}

                                    {/* Experience + Certs + FAQ */}
                                    {(service.experience || (service.certifications?.length > 0) || (service.faq?.length > 0)) && (
                                        <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
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
                                                                <VerifiedRoundedIcon sx={{ fontSize: 16, color: "success.main", mt: 0.15, flexShrink: 0 }} />
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
                                        </Box></Box>
                                    )}

                                    {/* Portfolio */}
                                    {service.portfolio?.length > 0 && (
                                        <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}><CollectionsRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={H}>Portfolio & Past Work</Typography></Stack>
                                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 0.75 }}>
                                                {service.portfolio.map((it, i) => (
                                                    <Box key={i} onClick={() => setImagePopup({ src: it.url || it.image || it, alt: it.caption || "" })} sx={{ position: "relative", paddingTop: "100%", borderRadius: 2, overflow: "hidden", cursor: "pointer", "&:hover img": { transform: "scale(1.05)" }, "&:hover .po": { opacity: 1 } }}>
                                                        <Box component="img" src={it.url || it.image || it} alt={it.caption || ""} referrerPolicy="no-referrer" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
                                                        {(it.caption || it.title) && <Box className="po" sx={{ position: "absolute", bottom: 0, left: 0, right: 0, px: 1, py: 0.75, bgcolor: (t) => alpha(t.palette.common.black, 0.6), opacity: 0, transition: "opacity 0.2s" }}><Typography sx={{ color: "common.white", fontSize: "0.72rem", fontWeight: 700 }}>{it.caption || it.title}</Typography></Box>}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box></Box>
                                    )}
                                </Stack>
                            )}

                            {/* ═══ CONTACT TAB ═══ */}
                            {activeTab === 1 && (
                                <Stack spacing={1.5}>
                                    {(service.phoneNumber || service.emailAddress) && (
                                        <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                            <Typography sx={{ fontWeight: 900, fontSize: "0.7rem", color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, mb: 1 }}>Contact Info</Typography>
                                            <Stack spacing={0.75}>
                                                {service.phoneNumber && (
                                                    <Chip component="a" href={"tel:" + service.phoneNumber.replace(/[^\d+]/g, "")} clickable
                                                          icon={<PhoneRoundedIcon sx={{ fontSize: 15, color: "primary.main !important" }} />}
                                                          label={service.phoneNumber} size="small" variant="outlined"
                                                          sx={(t) => ({ fontWeight: 700, fontSize: "0.82rem", height: 32, borderColor: alpha(t.palette.text.primary, 0.12), textDecoration: "none", "& .MuiChip-icon": { ml: 0.5 }, "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: "primary.main" } })} />
                                                )}
                                                {service.emailAddress && (
                                                    <Chip component="a" href={"mailto:" + service.emailAddress} clickable
                                                          icon={<EmailRoundedIcon sx={{ fontSize: 15, color: "primary.main !important" }} />}
                                                          label={service.emailAddress} size="small" variant="outlined"
                                                          sx={(t) => ({ fontWeight: 700, fontSize: "0.82rem", height: 32, borderColor: alpha(t.palette.text.primary, 0.12), textDecoration: "none", "& .MuiChip-icon": { ml: 0.5 }, "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.06), borderColor: "primary.main" } })} />
                                                )}
                                            </Stack>
                                        </Box></Box>
                                    )}
                                    {(parsedH || service.availabilityNotes) && (
                                        <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                            <ExpandableHours parsedHours={parsedH} hoursStatus={hStatus} notes={service.availabilityNotes} defaultOpen />
                                        </Box></Box>
                                    )}
                                    <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                        {service.latitude && service.longitude && (
                                            <Box component="a" href={"https://www.google.com/maps/search/?api=1&query=" + mapsQ} target="_blank" rel="noopener noreferrer" sx={{ display: "block", textDecoration: "none" }}>
                                                <Box component="iframe" src={"https://www.google.com/maps/embed/v1/place?key=" + (process.env.REACT_APP_GOOGLE_API_KEY || "") + "&q=" + mapsQ + "&zoom=14"} sx={{ width: "100%", height: 180, border: 0, display: "block", pointerEvents: "none" }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Service location" />
                                                <Box sx={{ py: 0.75, px: 2.5, bgcolor: "primary.main", color: "common.white", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}><LocationOnRoundedIcon sx={{ fontSize: 15 }} /><Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Get Directions</Typography></Box>
                                            </Box>
                                        )}
                                        <Box sx={{ p: 2, pt: service.latitude ? 1.5 : 2 }}>
                                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}><LocationOnRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} /><Typography sx={{ fontWeight: 900, fontSize: "0.88rem" }}>Location</Typography></Stack>
                                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.secondary" }}>{service.isStatewide ? "Statewide" : loc}</Typography>
                                            {service.latitude && service.longitude && !service.streetAddress && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>{"Location shown is approximate for the " + (service.county ? service.county + " County" : "selected") + " area"}</Typography>}
                                        </Box>
                                    </Box>
                                </Stack>
                            )}

                            {/* ═══ PHOTOS TAB ═══ */}
                            {activeTab === 2 && (
                                <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><PhotoLibraryRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} /><Typography sx={{ ...H, fontSize: 18 }}>All Photos</Typography></Stack>
                                    {photos.length > 0 ? (
                                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 1 }}>
                                            {photos.map((p, i) => (<Box key={p.id || i} onClick={() => { setLbIndex(i); setLbOpen(true); }} sx={{ position: "relative", paddingTop: "100%", borderRadius: 2, overflow: "hidden", cursor: "pointer", "&:hover img": { transform: "scale(1.05)" } }}><Box component="img" src={p.url} alt="" referrerPolicy="no-referrer" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 300ms ease" }} /></Box>))}
                                        </Box>
                                    ) : (<Box sx={{ textAlign: "center", py: 6 }}><PhotoLibraryRoundedIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} /><Typography sx={{ fontWeight: 800, fontSize: 16, color: "text.secondary" }}>No photos yet</Typography></Box>)}
                                </Box></Box>
                            )}

                            {/* ═══ REVIEWS TAB ═══ */}
                            {providerAllowsReviews && activeTab === reviewsTabIdx && (
                                <Box sx={CARD}><Box sx={{ p: { xs: 2, md: 2.5 } }}>
                                    <Typography sx={{ ...H, fontSize: 20, mb: 2 }}>{"Reviews " + (reviewsTotal > 0 ? "(" + reviewsTotal + ")" : "")}</Typography>
                                    {reviewsLoading && !reviews.length && <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress size={28} /></Box>}
                                    {reviews.length > 0 && (
                                        <Box sx={(t) => ({ display: "flex", gap: 3, mb: 2.5, p: 2, borderRadius: 2.5, bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08) })}>
                                            <Box sx={{ textAlign: "center", minWidth: 80, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                                                <Typography sx={{ fontWeight: 950, fontSize: 32, lineHeight: 1 }}>{avgR.toFixed(1)}</Typography>
                                                <Rating value={avgR} precision={0.5} readOnly size="small" sx={{ mt: 0.5, "& .MuiRating-iconFilled": { color: "secondary.main" } }} />
                                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, mt: 0.25 }}>{reviews.length + " review" + (reviews.length !== 1 ? "s" : "")}</Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                {[5, 4, 3, 2, 1].map((s) => (<Stack key={s} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}><Typography sx={{ fontSize: "0.72rem", fontWeight: 700, width: 14, textAlign: "right" }}>{s}</Typography><StarRoundedIcon sx={{ fontSize: 13, color: "secondary.main" }} /><Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: ((rc[s] / maxC) * 100) + "%", height: "100%", borderRadius: 3, bgcolor: "secondary.main", transition: "width 400ms ease" }} /></Box><Typography sx={{ fontSize: "0.72rem", fontWeight: 700, width: 18, color: "text.secondary" }}>{rc[s]}</Typography></Stack>))}
                                            </Box>
                                        </Box>
                                    )}
                                    {canWrite && <Button variant="outlined" startIcon={<RateReviewRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => openReviewForm()} sx={{ mb: 2, borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: "0.82rem" }}>Write a Review</Button>}
                                    {reviews.length > 1 && <FormControl size="small" sx={{ mb: 2, minWidth: 140 }}><InputLabel>Sort</InputLabel><Select value={reviewSort} label="Sort" onChange={(e) => setReviewSort(e.target.value)}><MenuItem value="newest">Newest</MenuItem><MenuItem value="oldest">Oldest</MenuItem><MenuItem value="highest">Highest</MenuItem><MenuItem value="lowest">Lowest</MenuItem></Select></FormControl>}
                                    {reviews.map((rv) => {
                                        const isOwnR = rv.reviewerId === uid;
                                        const rPhotos = Array.isArray(rv.photoUrls) ? rv.photoUrls.filter(Boolean) : [];
                                        return (
                                            <Box key={rv.id} sx={(t) => ({ p: 2, mb: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.divider, 0.5) })}>
                                                <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mb: 1 }}>
                                                    <Avatar src={rv.reviewerAvatar || defaultAvatar} sx={{ width: 36, height: 36 }} />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Stack direction="row" spacing={0.5} alignItems="center"><Typography sx={{ fontWeight: 800, fontSize: 13 }}>{rv.reviewerName || "User"}</Typography>{isOwnR && <Chip label="You" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 900 }} />}</Stack>
                                                        {rv.reviewerHandle && <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>{"@" + rv.reviewerHandle}</Typography>}
                                                    </Box>
                                                    {isOwnR && <Stack direction="row" spacing={0.25}><Tooltip title="Edit"><IconButton size="small" onClick={() => openReviewForm(rv)} sx={{ width: 28, height: 28 }}><EditRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" onClick={() => setRvDeleteTarget(rv)} sx={{ width: 28, height: 28 }}><DeleteRoundedIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip></Stack>}
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                                    <Rating value={rv.rating} readOnly size="small" sx={{ "& .MuiRating-iconFilled": { color: "secondary.main" }, "& .MuiRating-icon": { fontSize: 15 } }} />
                                                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>{rv.createdAt ? new Date(rv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</Typography>
                                                    {rv.updatedAt && rv.updatedAt !== rv.createdAt && <Typography sx={{ fontSize: "0.62rem", color: "text.disabled", fontStyle: "italic" }}>(edited)</Typography>}
                                                </Stack>
                                                {(rv.reviewTitle || rv.title) && <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", mb: 0.5, lineHeight: 1.3 }}>{rv.reviewTitle || rv.title}</Typography>}
                                                {rv.reviewText && <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "text.secondary", mb: 0.5 }}>{rv.reviewText}</Typography>}
                                                {rPhotos.length > 0 && <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: "auto", pb: 0.5 }}>{rPhotos.map((u, i) => <Box key={i} component="img" src={u} alt="" referrerPolicy="no-referrer" onClick={() => setImagePopup({ src: u, alt: "Review photo" })} sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 2, flexShrink: 0, border: "1px solid", borderColor: "divider", cursor: "pointer" }} />)}</Stack>}
                                                {rv.providerResponse && <Box sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08), mt: 1, ml: 2 })}><Typography variant="caption" sx={{ fontWeight: 900, color: "primary.main", display: "block", mb: 0.25, fontSize: 10.5, textTransform: "uppercase" }}>Provider Response</Typography><Typography variant="body2" sx={{ fontSize: "0.82rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{rv.providerResponse}</Typography></Box>}
                                                {isOwn && !rv.providerResponse && (respondingId === rv.id ? (<Box sx={{ mt: 1, ml: 2 }}><TextField fullWidth multiline minRows={2} maxRows={4} placeholder="Write your response..." size="small" value={respondText} onChange={(e) => setRespondText(e.target.value.slice(0, 2000))} sx={{ mb: 0.75, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.82rem" } }} /><Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" onClick={() => { setRespondingId(null); setRespondText(""); }} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, fontSize: 12 }}>Cancel</Button><Button size="small" variant="contained" disabled={!respondText.trim()} onClick={() => handleRespond(rv.id)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12 }}>Respond</Button></Stack></Box>) : (<Button size="small" onClick={() => { setRespondingId(rv.id); setRespondText(""); }} sx={{ mt: 0.5, ml: 2, textTransform: "none", fontWeight: 700, fontSize: 12, color: "primary.main" }}>Reply to review</Button>))}
                                            </Box>
                                        );
                                    })}
                                    {!reviewsLoading && !reviews.length && <Box sx={{ textAlign: "center", py: 4 }}><ReviewsRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} /><Typography sx={{ fontWeight: 800, color: "text.secondary" }}>No reviews yet</Typography><Typography variant="body2" sx={{ color: "text.disabled" }}>Be the first to leave a review!</Typography></Box>}
                                </Box></Box>
                            )}
                        </Box>

                        {/* ══════════════════════════════════════════ */}
                        {/*  RIGHT SIDEBAR                            */}
                        {/* ══════════════════════════════════════════ */}
                        <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0, order: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 16 }, mb: { xs: 2, md: 0 } }}>
                            <Stack spacing={1.5}>

                                {/* Provider card */}
                                <Box sx={CARD}>
                                    <Box sx={{ p: 2.5 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "0.68rem", color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5, mb: 1.25 }}>Provided By</Typography>
                                        <Stack direction="row" spacing={1.5} alignItems="center"
                                               sx={{ cursor: service.providerHandle ? "pointer" : "default", borderRadius: 2, p: 1, mx: -1, transition: "background-color 150ms ease", "&:hover": service.providerHandle ? { bgcolor: "action.hover" } : {} }}
                                               onClick={() => { if (service.providerHandle) navigate("/" + service.providerHandle); }}>
                                            <Avatar src={service.providerAvatar || defaultAvatar}
                                                    sx={{ width: 52, height: 52, border: "2px solid", borderColor: "divider" }}
                                                    imgProps={{ referrerPolicy: "no-referrer" }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 900, fontSize: "0.88rem", lineHeight: 1.2 }}>{service.providerName || "Provider"}</Typography>
                                                {service.providerHandle && <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary" }}>{"@" + service.providerHandle}</Typography>}
                                            </Box>
                                            {service.providerHandle && <OpenInNewRoundedIcon sx={{ fontSize: 16, color: "text.disabled" }} />}
                                        </Stack>
                                    </Box>
                                </Box>

                                {/* CTA + quick info */}
                                <Box sx={CARD}>
                                    <Box sx={{ p: 2.5 }}>
                                        {providerAllowsMessages && (
                                            <Button variant="contained" fullWidth startIcon={<ChatBubbleOutlineRoundedIcon />}
                                                    onClick={() => { if (service.providerHandle) navigate("/messages?to=" + service.providerHandle); }}
                                                    disabled={isOwn || !service.providerHandle}
                                                    sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 950, py: 1.1, fontSize: 15, color: t.palette.common.white, boxShadow: "none", mb: 1 })}>
                                                Message
                                            </Button>
                                        )}
                                        <Stack direction="row" spacing={1} sx={{ mb: !isOwn && service.providerHandle ? 0 : 2 }}>
                                            {!isOwn && service.providerHandle && (
                                                <Button variant="outlined" fullWidth size="small" startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "15px !important" }} />}
                                                        onClick={() => navigate("/" + service.providerHandle)}
                                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: "0.82rem", flex: 1 }}>
                                                    View Provider
                                                </Button>
                                            )}
                                            <Button variant="outlined" fullWidth size="small" startIcon={<ShareRoundedIcon sx={{ fontSize: "15px !important" }} />}
                                                    onClick={() => setShareOpen(true)}
                                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: "0.82rem", flex: 1 }}>
                                                Share
                                            </Button>
                                        </Stack>
                                        {(!isOwn && service.providerHandle) && <Box sx={{ mb: 2 }} />}

                                        <Stack spacing={1.75}>
                                            {/* Pricing info */}
                                            {service.priceLabel && service.priceLabel !== "Get a Quote" && (
                                                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                                    <AttachMoneyRoundedIcon sx={{ fontSize: 18, color: "primary.main", mt: 0.15 }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>Pricing</Typography>
                                                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.primary" }}>{service.priceLabel}</Typography>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {/* Location — green */}
                                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                                <LocationOnRoundedIcon sx={{ fontSize: 18, color: "primary.main", mt: 0.15 }} />
                                                <Box>
                                                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>Service Area</Typography>
                                                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "primary.main" }}>{service.isStatewide ? "Statewide" : loc}</Typography>
                                                </Box>
                                            </Stack>
                                            {/* Rating */}
                                            {providerAllowsReviews && dispRC > 0 && (
                                                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                                    <StarRoundedIcon sx={{ fontSize: 18, color: "secondary.main", mt: 0.15 }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: "text.disabled", textTransform: "uppercase", letterSpacing: 0.5 }}>Reviews</Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{dispR > 0 ? dispR.toFixed(1) : "0.0"}</Typography>
                                                            <Rating value={dispR || 0} precision={0.5} readOnly size="small" sx={{ "& .MuiRating-iconFilled": { color: "secondary.main" }, "& .MuiRating-icon": { fontSize: 14 } }} />
                                                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary" }}>{"(" + dispRC + ")"}</Typography>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            )}
                                            {/* Hours — expandable */}
                                            <ExpandableHours parsedHours={parsedH} hoursStatus={hStatus} notes={service.availabilityNotes} />
                                        </Stack>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ═══ DIALOGS ═══ */}
            <PhotoLightbox open={lbOpen} onClose={() => setLbOpen(false)} photos={photos} initialIndex={lbIndex} />
            <ImagePopup open={Boolean(imagePopup)} onClose={() => setImagePopup(null)} src={imagePopup?.src} alt={imagePopup?.alt} />

            <Dialog open={rvFormOpen} onClose={rvSubmitting ? undefined : closeReviewForm} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 2.5, position: "relative" }}>
                    <IconButton onClick={closeReviewForm} disabled={rvSubmitting} sx={{ position: "absolute", top: 8, right: 8, width: 32, height: 32 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
                    <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", mb: 2, pr: 4 }}>{rvEditing ? "Edit Your Review" : "Write a Review"}</Typography>
                    <Box sx={{ mb: 2 }}><Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>Your Rating *</Typography><Rating value={rvRating} precision={0.5} onChange={(_e, v) => setRvRating(v || 0)} size="large" sx={{ "& .MuiRating-iconFilled": { color: "secondary.main" }, "& .MuiRating-iconHover": { color: "secondary.main" } }} /></Box>
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

            <ShareServiceDialog open={shareOpen} onClose={() => setShareOpen(false)} service={service} viewer={auth?.user} />
            <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} title="Report Service" />
            <Snackbar open={copyToast} autoHideDuration={2000} onClose={() => setCopyToast(false)} message="Link copied to clipboard" anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
        </Box>
    );
}
