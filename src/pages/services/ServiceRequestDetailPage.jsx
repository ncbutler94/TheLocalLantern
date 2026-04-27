// src/pages/services/ServiceRequestDetailPage.jsx
//
// Full-featured service request detail page.
// — Owner: edit, mark filled/reopen, delete, view/manage responses
// — Provider: respond, see "already responded" state, withdraw
// — Everyone: photo gallery, share, copy link
// — Responses: quote display, timeline, linked listing, accept/decline, contact reveal

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

import {
    fetchServiceRequestById,
    fetchRequestResponses,
    acceptRequestResponse,
    declineRequestResponse,
    withdrawRequestResponse,
    closeServiceRequest,
    deleteServiceRequest,
    reportServiceRequest,
} from "./api/servicesApi";
import { getServiceCategoryInfo } from "./utils/serviceHelpers";
import UserCardPopover from "../../components/UserCardPopover";
import { ReportDialog } from "../../components/ActionBar";
import { useActiveAccount } from "../../components/AccountContext";
import { useAuth } from "../../components/AuthModalContext";

import ShareServiceDialog from "../../components/ShareServiceDialog";
import RespondToRequestModal from "./modals/RespondToRequestModal";
import RichTextDisplay from "../../components/RichTextDisplay";
import { stripHtml } from "../../utils/richTextUtils";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../components/Header/Header";
import CreateServiceRequestModal from "./modals/CreateServiceRequestModal";

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

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const DESC_MAX_HEIGHT = 160;
const MAX_RESPONSES_SHOWN_INITIALLY = 5;

// Format a raw phone string like "2566896557" → "(256) 689-6557"
function formatPhoneDisplay(value) {
    if (!value) return value;
    const digits = String(value).replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits[0] === "1") return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return value; // Return as-is if not a standard US number
}

const URGENCY_MAP = {
    asap: { label: "Needed ASAP", color: "error" },
    within_week: { label: "This Week", color: "warning" },
    within_month: { label: "This Month", color: "info" },
    flexible: { label: "Flexible", color: "default" },
};

const QUOTE_TYPE_LABELS = {
    free_estimate: "Free Estimate",
    hourly: "Hourly",
    flat: "Flat Rate",
    flexible: "Flexible",
};

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "default", textColor: "text.secondary" },
    accepted: { label: "Accepted", color: "success", textColor: "success.main" },
    declined: { label: "Declined", color: "default", textColor: "text.disabled" },
    withdrawn: { label: "Withdrawn", color: "default", textColor: "text.disabled" },
};

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

const timeAgo = (input) => {
    const d = input ? new Date(input) : null;
    if (!d || Number.isNaN(d.valueOf())) return "";
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return "just now";
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

function formatQuoteRange(resp) {
    const hasMin = resp.quoteMin != null && Number.isFinite(Number(resp.quoteMin));
    const hasMax = resp.quoteMax != null && Number.isFinite(Number(resp.quoteMax));
    const suffix = resp.quoteType === "hourly" ? "/hr" : "";

    if (hasMin && hasMax && Number(resp.quoteMin) !== Number(resp.quoteMax)) {
        return `$${Number(resp.quoteMin).toLocaleString()}–$${Number(resp.quoteMax).toLocaleString()}${suffix}`;
    }
    if (hasMin) return `$${Number(resp.quoteMin).toLocaleString()}${suffix}`;
    if (hasMax) return `Up to $${Number(resp.quoteMax).toLocaleString()}${suffix}`;
    return null;
}

/* ═══════════════════════════════════════════
   PHOTO EXTRACTION (matches PostPage)
   ═══════════════════════════════════════════ */

const extractPhotos = (request) => {
    if (!request || typeof request !== "object") return [];
    const pickUrl = (val) => {
        if (!val) return null;
        if (typeof val === "string") {
            const s = val.trim();
            if (!s || s === "null" || s === "undefined") return null;
            return s;
        }
        if (typeof val === "object") {
            return pickUrl(val.url || val.photo_url || val.photoUrl || val.path || val.src || null);
        }
        return null;
    };
    const collected = [];
    const arr = Array.isArray(request.photos) ? request.photos : [];
    for (const item of arr) {
        const u = pickUrl(item);
        if (u) collected.push(u);
    }
    // Unique + stable
    const seen = new Set();
    const out = [];
    for (const u of collected) {
        if (seen.has(u)) continue;
        seen.add(u);
        out.push(u);
        if (out.length >= 20) break;
    }
    return out;
};

/* ═══════════════════════════════════════════
   CAROUSEL (matches PostPage styling)
   ═══════════════════════════════════════════ */

function Carousel({ photos }) {
    const [index, setIndex] = useState(0);
    const touchStartRef = useRef(null);

    useEffect(() => {
        if (!Array.isArray(photos) || photos.length === 0) return;
        if (index > photos.length - 1) setIndex(0);
    }, [photos, index]);

    const prev = useCallback(
        () => setIndex((i) => (i - 1 + photos.length) % photos.length),
        [photos.length]
    );
    const next = useCallback(
        () => setIndex((i) => (i + 1) % photos.length),
        [photos.length]
    );

    if (!photos.length) return null;

    const current = photos[index] || photos[0];
    const multiPhoto = photos.length > 1;
    const mainHeight = { xs: 280, sm: 440 };

    const handleTouchStart = (e) => { touchStartRef.current = e.touches[0]?.clientX ?? null; };
    const handleTouchEnd = (e) => {
        if (touchStartRef.current == null) return;
        const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? touchStartRef.current);
        if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev(); }
        touchStartRef.current = null;
    };

    return (
        <Box sx={{ position: "relative", mt: 2, userSelect: "none" }}>
            <Box
                onTouchStart={multiPhoto ? handleTouchStart : undefined}
                onTouchEnd={multiPhoto ? handleTouchEnd : undefined}
                sx={{
                    width: "100%",
                    height: mainHeight,
                    borderRadius: 2.5,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* Blurred background fill */}
                <Box
                    sx={{
                        position: "absolute", inset: 0,
                        backgroundImage: `url(${current})`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        filter: "blur(30px) saturate(1.4)",
                        transform: "scale(1.2)", opacity: 0.45,
                    }}
                />
                <Box sx={{ position: "absolute", inset: 0, bgcolor: (t) => alpha(t.palette.text.primary, 0.06) }} />
                {/* Main image */}
                <Box
                    component="img"
                    key={current}
                    src={current}
                    alt={`Photo ${index + 1} of ${photos.length}`}
                    loading="lazy"
                    sx={{
                        position: "relative",
                        width: "100%", height: "100%",
                        objectFit: "contain", display: "block", zIndex: 1,
                    }}
                />

                {multiPhoto && (
                    <>
                        <IconButton
                            aria-label="Previous image"
                            onClick={prev}
                            sx={{
                                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 2,
                                bgcolor: (t) => alpha(t.palette.background.paper, 0.85), backdropFilter: "blur(6px)",
                                boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.15)}`, width: 36, height: 36,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.background.paper, 0.95) },
                            }}
                        >
                            <ChevronLeftIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <IconButton
                            aria-label="Next image"
                            onClick={next}
                            sx={{
                                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 2,
                                bgcolor: (t) => alpha(t.palette.background.paper, 0.85), backdropFilter: "blur(6px)",
                                boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.15)}`, width: 36, height: 36,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.background.paper, 0.95) },
                            }}
                        >
                            <ChevronRightIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </>
                )}

                {multiPhoto && (
                    <Box sx={{
                        position: "absolute", top: 10, right: 10, zIndex: 2,
                        bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(6px)", color: "common.white",
                        px: 1.25, py: 0.25, borderRadius: 999, fontSize: 12, fontWeight: 800,
                    }}>
                        {index + 1} / {photos.length}
                    </Box>
                )}

                {multiPhoto && photos.length <= 8 && (
                    <Box sx={{
                        position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                        zIndex: 2, display: "flex", gap: 0.75,
                    }}>
                        {photos.map((_, i) => (
                            <Box
                                key={i}
                                onClick={() => setIndex(i)}
                                sx={{
                                    width: i === index ? 18 : 7, height: 7, borderRadius: 999,
                                    bgcolor: i === index ? "common.white" : (t) => alpha(t.palette.background.paper, 0.5),
                                    transition: (t) => `all ${t.custom.motion.base}ms ${t.custom.motion.ease}`, cursor: "pointer",
                                    boxShadow: (t) => `0 1px 3px ${alpha(t.palette.text.primary, 0.3)}`,
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {multiPhoto && (
                <Box sx={{
                    mt: 1, display: "flex", justifyContent: "center", gap: 0.75,
                    overflowX: "auto", pb: 0.5, WebkitOverflowScrolling: "touch",
                    "&::-webkit-scrollbar": { height: 4 },
                    "&::-webkit-scrollbar-thumb": { borderRadius: 999, bgcolor: (t) => alpha(t.palette.text.primary, 0.15) },
                }}>
                    {photos.map((u, i) => (
                        <Box
                            key={`${u}-${i}`}
                            component="img"
                            src={u}
                            alt=""
                            loading="lazy"
                            onClick={() => setIndex(i)}
                            sx={{
                                width: { xs: 52, sm: 60 }, height: { xs: 52, sm: 60 },
                                objectFit: "cover", borderRadius: 1.5, cursor: "pointer", flex: "0 0 auto",
                                border: "2px solid", borderColor: i === index ? "primary.main" : "transparent",
                                opacity: i === index ? 1 : 0.65, transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { opacity: 1 },
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

/* ═══════════════════════════════════════════
   CONFIRMATION DIALOG
   ═══════════════════════════════════════════ */

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, confirmColor, loading }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                {title}
                <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8 }}>
                    <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>{message}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }}>
                    Cancel
                </Button>
                <Button variant="contained" color={confirmColor || "primary"} onClick={onConfirm} disabled={loading}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, boxShadow: "none" }}>
                    {loading ? "Processing…" : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/* ═══════════════════════════════════════════
   RESPONSE CARD
   ═══════════════════════════════════════════ */

// ─── Response photo grid with lightbox ───
function ResponsePhotoGrid({ photos }) {
    const _rpgTheme = useTheme();
    const _rpgMobile = useMediaQuery(_rpgTheme.breakpoints.down("md"));
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);

    if (!Array.isArray(photos) || photos.length === 0) return null;
    const photoUrls = photos.filter(Boolean);
    if (!photoUrls.length) return null;

    const handleOpen = (idx) => { setLightboxIdx(idx); setLightboxOpen(true); };
    const handlePrev = () => setLightboxIdx((i) => (i - 1 + photoUrls.length) % photoUrls.length);
    const handleNext = () => setLightboxIdx((i) => (i + 1) % photoUrls.length);
    const cols = photoUrls.length === 1 ? 1 : photoUrls.length === 2 ? 2 : photoUrls.length === 3 ? 3 : 2;

    return (
        <>
            <Box sx={{
                mt: 1.5, display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 0.75, borderRadius: 2, overflow: "hidden",
            }}>
                {photoUrls.map((url, idx) => (
                    <Box key={idx} onClick={() => handleOpen(idx)} sx={{
                        position: "relative", paddingTop: photoUrls.length === 1 ? "56%" : "100%",
                        borderRadius: 1.5, overflow: "hidden", cursor: "pointer",
                        "&:hover .rp-overlay": { opacity: 1 },
                    }}>
                        <Box component="img" src={url} alt={`Response photo ${idx + 1}`} sx={{
                            position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover",
                        }} />
                        <Box className="rp-overlay" sx={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            bgcolor: "rgba(0,0,0,0.08)", opacity: 0, transition: "opacity 150ms ease",
                        }} />
                    </Box>
                ))}
            </Box>

            <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={false} fullScreen={_rpgMobile}
                    PaperProps={{ sx: _rpgMobile
                            ? { bgcolor: "#000", m: 0, borderRadius: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }
                            : { bgcolor: "rgba(0,0,0,0.92)", borderRadius: 3, maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
                    }}
                    sx={_rpgMobile ? { zIndex: (t) => t.zIndex.modal + 10 } : {}}
            >
                <IconButton onClick={() => setLightboxOpen(false)} sx={{
                    position: "absolute", top: 8, right: 8, zIndex: 2, color: "#fff",
                    bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}>
                    <CloseRoundedIcon />
                </IconButton>
                {photoUrls.length > 1 && (
                    <Typography sx={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700, zIndex: 2 }}>
                        {lightboxIdx + 1} / {photoUrls.length}
                    </Typography>
                )}
                <Box component="img" src={photoUrls[lightboxIdx]} alt={`Photo ${lightboxIdx + 1}`} sx={{
                    maxWidth: _rpgMobile ? "100vw" : "85vw", maxHeight: _rpgMobile ? "80vh" : "80vh", objectFit: "contain", userSelect: "none",
                }} />
                {photoUrls.length > 1 && (
                    <>
                        <IconButton onClick={handlePrev} sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                            <ChevronLeftIcon />
                        </IconButton>
                        <IconButton onClick={handleNext} sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                            <ChevronRightIcon />
                        </IconButton>
                    </>
                )}
            </Dialog>
        </>
    );
}

function ResponseCard({ response, isRequester, isOwnResponse, onAccept, onDecline, onWithdraw, onViewListing, onOpenUserCard, highlighted }) {
    const _rcTheme = useTheme();
    const _rcMobile = useMediaQuery(_rcTheme.breakpoints.down("md"));
    const [expanded, setExpanded] = useState(false);
    const status = response.status || "pending";
    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const quoteRange = formatQuoteRange(response);
    const quoteLabel = response.quoteType ? (QUOTE_TYPE_LABELS[response.quoteType] || response.quoteType) : null;
    const messagePreview = (response.message || "").length > 200 && !expanded;

    const handleProfileClick = (e) => {
        if (typeof onOpenUserCard === "function") {
            const rType = (response.responderType || response.responder_type || "").toLowerCase();
            onOpenUserCard(e.currentTarget, {
                id: response.responderId,
                first_name: response.responderName?.split(" ")[0],
                last_name: response.responderName?.split(" ").slice(1).join(" "),
                handle: response.responderHandle,
                avatar_url: response.responderAvatar,
                ...(rType === "business" ? {
                    account_type: "business",
                    business_id: response.responderProfileId || response.responder_profile_id,
                    business_name: response.responderName,
                    business_slug: response.responderHandle,
                } : rType === "artist" ? {
                    account_type: "artist",
                    artist_id: response.responderProfileId || response.responder_profile_id,
                    artist_name: response.responderName,
                    artist_handle: response.responderHandle,
                } : {}),
            });
        }
    };

    return (
        <Box
            data-response-id={response.id}
            sx={(t) => ({
                p: 2, borderRadius: 2.5,
                transition: `background-color ${t.custom?.motion?.slow || 400}ms ease, box-shadow ${t.custom?.motion?.slow || 400}ms ease, border-color ${t.custom?.motion?.slow || 400}ms ease`,
                border: highlighted ? '2px solid' : "1px solid",
                borderColor: highlighted
                    ? alpha(t.custom?.brand?.brass || '#A87822', 0.70)
                    : status === "accepted"
                        ? alpha(t.palette.success.main, 0.35)
                        : status === "declined" || status === "withdrawn"
                            ? alpha(t.palette.text.disabled, 0.12)
                            : alpha(t.palette.divider, 0.8),
                bgcolor: highlighted
                    ? alpha(t.custom?.brand?.brass || '#A87822', 0.14)
                    : status === "accepted"
                        ? alpha(t.palette.success.main, 0.03)
                        : status === "declined" || status === "withdrawn"
                            ? alpha(t.palette.action.disabledBackground, 0.3)
                            : t.palette.background.paper,
                opacity: status === "declined" || status === "withdrawn" ? 0.7 : 1,
                ...(highlighted ? {
                    boxShadow: `0 14px 34px ${alpha(t.custom?.brand?.brass || '#A87822', 0.20)}`,
                } : {}),
            })}
        >
            {/* Header */}
            <Stack direction="row" spacing={1.5} alignItems="center">
                <AccountAvatar
                    src={response.responderAvatar}
                    accountType={response.responderType || response.responder_type || (response.responderBusinessId ? "business" : response.responderArtistId ? "artist" : "user")}
                    size={40}
                    sx={{ border: "2px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.06), cursor: "pointer" }}
                    onClick={handleProfileClick}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", flexDirection: _rcMobile ? "column" : "row", alignItems: _rcMobile ? "flex-start" : "center", gap: _rcMobile ? 0 : 1 }}>
                        <Typography
                            onClick={handleProfileClick}
                            sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.3, cursor: "pointer", "&:hover": { textDecoration: "underline" },
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: _rcMobile ? "normal" : "nowrap",
                                wordBreak: _rcMobile ? "break-word" : "normal",
                            }}
                        >
                            {response.responderName || "Provider"}
                        </Typography>
                        {response.responderHandle && (
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, whiteSpace: "nowrap", mt: _rcMobile ? 0.125 : 0 }}>
                                @{response.responderHandle}
                            </Typography>
                        )}
                    </Box>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                        <Chip
                            size="small"
                            label={statusCfg.label}
                            color={statusCfg.color}
                            variant={status === "accepted" ? "filled" : "outlined"}
                            sx={{ height: 20, borderRadius: 999, fontWeight: 800, fontSize: 10.5, "& .MuiChip-label": { px: 0.75 } }}
                        />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, fontWeight: 600 }}>
                            {timeAgo(response.createdAt)}
                        </Typography>
                    </Stack>
                </Box>
                {isOwnResponse && (
                    <Chip size="small" label="Your Response" color="primary" variant="outlined"
                          sx={{ height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10.5 }} />
                )}
            </Stack>

            {/* Quote + Timeline Row */}
            {(quoteRange || quoteLabel || response.estimatedTimeline) && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5, gap: 0.75 }}>
                    {(quoteRange || quoteLabel) && (
                        <Box sx={(t) => ({
                            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5,
                            borderRadius: 1.5, bgcolor: alpha(t.palette.success.main, 0.06),
                            border: "1px solid", borderColor: alpha(t.palette.success.main, 0.15),
                        })}>
                            <AttachMoneyRoundedIcon sx={{ fontSize: 15, color: "success.main" }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "success.dark" }}>
                                {quoteRange || quoteLabel}
                            </Typography>
                            {quoteRange && quoteLabel && (
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", ml: 0.25 }}>
                                    ({quoteLabel})
                                </Typography>
                            )}
                        </Box>
                    )}
                    {response.estimatedTimeline && (
                        <Box sx={(t) => ({
                            display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5,
                            borderRadius: 1.5, bgcolor: alpha(t.palette.info.main, 0.06),
                            border: "1px solid", borderColor: alpha(t.palette.info.main, 0.15),
                        })}>
                            <ScheduleRoundedIcon sx={{ fontSize: 15, color: "info.main" }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "info.dark" }}>
                                {response.estimatedTimeline}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            )}

            {/* Message */}
            <Box sx={{ mt: 1.5, position: "relative" }}>
                <Box
                    sx={{
                        color: "text.secondary",
                        ...(messagePreview ? { maxHeight: 100, overflow: "hidden" } : {}),
                    }}
                >
                    <RichTextDisplay html={response.message} sx={{ color: "text.secondary" }} />
                </Box>
                {messagePreview && (
                    <Box sx={(t) => ({
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
                        background: `linear-gradient(transparent, ${t.palette.background.paper})`,
                        pointerEvents: "none",
                    })} />
                )}
                {(stripHtml(response.message || "").length > 200 || (response.message || "").length > 300) && (
                    <Button
                        size="small"
                        onClick={() => setExpanded((p) => !p)}
                        endIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                        sx={{ mt: 0.25, textTransform: "none", fontWeight: 800, fontSize: "0.75rem", px: 0, minWidth: 0 }}
                    >
                        {expanded ? "Show less" : "Read more"}
                    </Button>
                )}
            </Box>

            {/* Response Photos */}
            <ResponsePhotoGrid photos={response.photos} />

            {/* Linked Listing */}
            {response.listingId && response.listingTitle && (
                <Box
                    onClick={() => {
                        if (typeof onViewListing === "function") onViewListing(response.listingId);
                    }}
                    sx={(t) => ({
                        mt: 1.5, p: 1.25, borderRadius: 2,
                        bgcolor: alpha(t.palette.primary.main, 0.04),
                        border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1),
                        cursor: "pointer", transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                    })}
                >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10, display: "block", mb: 0.5 }}>
                        Service Provided By
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <StorefrontRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{response.listingTitle}</Typography>
                            {(response.listingReviewCount > 0) && (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                    <StarRoundedIcon sx={{ fontSize: 13, color: "warning.main" }} />
                                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary" }}>
                                        {Number(response.listingReviewAvg).toFixed(1)} ({response.listingReviewCount})
                                    </Typography>
                                </Stack>
                            )}
                        </Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "primary.main" }}>View</Typography>
                    </Box>
                </Box>
            )}

            {/* Contact Reveal (after acceptance) */}
            {status === "accepted" && response.responderContact && (
                <Box sx={(t) => ({
                    mt: 1.5, p: 1.5, borderRadius: 2,
                    bgcolor: alpha(t.palette.success.main, 0.06),
                    border: "1px solid", borderColor: alpha(t.palette.success.main, 0.2),
                })}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                        <ContactPhoneRoundedIcon sx={{ fontSize: 16, color: "success.main" }} />
                        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "success.dark", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            Contact Info
                        </Typography>
                    </Stack>
                    {response.responderContact.preference && (
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {response.responderContact.preference === "call" ? "Phone: " : response.responderContact.preference === "email" ? "Email: " : ""}
                            {response.responderContact.preference === "call" ? formatPhoneDisplay(response.responderContact.value) : (response.responderContact.value || "In-app message")}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Action Buttons */}
            {status === "pending" && (isRequester || isOwnResponse) && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    {isRequester && (
                        <>
                            <Button
                                variant="contained"
                                size="small"
                                color="success"
                                startIcon={<ThumbUpAltRoundedIcon />}
                                onClick={() => { if (typeof onAccept === "function") onAccept(response); }}
                                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, flex: 1, boxShadow: "none" }}
                            >
                                Accept
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ThumbDownAltRoundedIcon />}
                                onClick={() => { if (typeof onDecline === "function") onDecline(response); }}
                                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, flex: 1, color: "text.secondary", borderColor: "divider" }}
                            >
                                Decline
                            </Button>
                        </>
                    )}
                    {isOwnResponse && (
                        <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            startIcon={<UndoRoundedIcon />}
                            onClick={() => { if (typeof onWithdraw === "function") onWithdraw(response); }}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                        >
                            Withdraw Response
                        </Button>
                    )}
                </Stack>
            )}
        </Box>
    );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */

export default function ServiceRequestDetailPage({ user, onEdit, onRespond }) {
    const navigate = useNavigate();
    const { requestId } = useParams();
    const loc = useLocation();
    const fromServices = Boolean(loc?.state?.fromServices);
    const fromMap = Boolean(loc?.state?.fromMap);
    const fromNotifications = Boolean(loc?.state?.fromNotifications);
    const _srdpTheme = useTheme();
    const isMobile = useMediaQuery(_srdpTheme.breakpoints.down("md"));

    // Core data
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [descExpanded, setDescExpanded] = useState(false);
    const [detailTab, setDetailTab] = useState(0);
    const [pendingOpenResponses] = useState(
        () => Boolean(loc?.state?.openResponsesTab)
    );
    const [highlightResponseId, setHighlightResponseId] = useState(
        () => Number(loc?.state?.highlightResponseId || 0) || null
    );

    // Responses
    const [responses, setResponses] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [responsesError, setResponsesError] = useState(null);
    const [isRequester, setIsRequester] = useState(false);
    const [myResponse, setMyResponse] = useState(null);
    const [showAllResponses, setShowAllResponses] = useState(false);
    const [responsesKey, setResponsesKey] = useState(0);
    const reloadResponses = useCallback(() => setResponsesKey((k) => k + 1), []);

    // Dialogs
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Toasts
    const [toast, setToast] = useState("");
    const [copyToast, setCopyToast] = useState(false);

    // Share dialog
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // Respond modal (for standalone detail page)
    const [respondModalOpen, setRespondModalOpen] = useState(false);

    // Page 3-dot menu
    const [pageMenuAnchor, setPageMenuAnchor] = useState(null);
    const pageMenuOpen = Boolean(pageMenuAnchor);
    const [reportOpen, setReportOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // UserCardPopover
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey, activeAccount } = useActiveAccount();
    const auth = useAuth();
    const viewerUser = auth?.user;

    /** Robust login-popup opener */
    const openAuthPopup = useCallback((e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        try {
            if (auth && typeof auth.open === 'function') auth.open();
            else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
            else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
            else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
            else if (auth && typeof auth.requireAuth === 'function') auth.requireAuth();
        } catch { /* ignore */ }
        try {
            window.dispatchEvent(new CustomEvent('open-auth-modal'));
            window.dispatchEvent(new CustomEvent('open-login'));
            window.dispatchEvent(new CustomEvent('open-auth-dialog'));
            window.dispatchEvent(new CustomEvent('open-login-popup'));
        } catch { /* ignore */ }
    }, [auth]);

    const handleOpenUserCard = (el, author) => {
        setUserAnchor(el);
        setUserForCard({
            id: author?.id,
            first_name: author?.first_name,
            last_name: author?.last_name,
            handle: author?.handle,
            avatar_url: author?.avatar_url,
            ...(author?.account_type ? { account_type: author.account_type } : {}),
            ...(author?.business_id ? { business_id: author.business_id } : {}),
            ...(author?.business_name ? { business_name: author.business_name } : {}),
            ...(author?.business_slug ? { business_slug: author.business_slug } : {}),
            ...(author?.artist_id ? { artist_id: author.artist_id } : {}),
            ...(author?.artist_name ? { artist_name: author.artist_name } : {}),
            ...(author?.artist_handle ? { artist_handle: author.artist_handle } : {}),
        });
    };

    const handleViewProfile = (u) => {
        if (u?.account_type === "business" || u?.business_id) {
            const slug = u?.business_slug || u?.account_handle;
            if (slug) return window.location.assign(`/business/${slug}`);
        }
        if (u?.account_type === "artist" || u?.artist_id) {
            const artistHandle = u?.artist_handle || u?.account_handle;
            if (artistHandle) return window.location.assign(`/artist/${artistHandle}`);
        }
        const handle = u?.handle || u?.account_handle;
        if (handle) window.location.assign(`/profile/${handle}`);
    };

    const isSelfForCard = Boolean(
        viewerUser && userForCard &&
        viewerUser.id != null && userForCard.id != null &&
        Number(viewerUser.id) === Number(userForCard.id)
    );

    // Account-aware ownership detection
    // Matches the pattern from ActionBar / ServiceRequestCard:
    // - If request was made by a business account → only owner when active account is that business
    // - If request was made by an artist account → only owner when active account is that artist
    // - If request was made by a personal account → only owner when on personal account and user ID matches
    const userId = user?.id || user?.user_id;
    const isOwner = (() => {
        if (!request || !userId) return false;
        // Trust backend if provided
        if (typeof request.isRequester === "boolean") return request.isRequester;

        const reqAccountType = String(
            request.requesterAccountType || request.requester_account_type ||
            request.requesterType || request.requester_type ||
            request.accountType || request.account_type || ""
        ).toLowerCase().trim();

        const reqBusinessId = request.requesterBusinessId || request.requester_business_id || request.businessId || request.business_id
            || (reqAccountType === "business" ? (request.requesterProfileId || request.requester_profile_id) : null)
            || null;
        const reqArtistId = request.requesterArtistId || request.requester_artist_id || request.artistId || request.artist_id || request.musicArtistId || request.music_artist_id
            || ((reqAccountType === "artist" || reqAccountType === "music" || reqAccountType === "music_artist") ? (request.requesterProfileId || request.requester_profile_id) : null)
            || null;
        const reqUserId = request.requesterId || request.requester_id || request.user_id || request.owner_id || null;

        // Business account request — only match when active account IS that business
        if ((reqAccountType === "business" || reqBusinessId) && isBusinessAccount && activeBusinessId && reqBusinessId) {
            return String(activeBusinessId) === String(reqBusinessId);
        }
        // Artist account request — only match when active account IS that artist
        if ((reqAccountType === "artist" || reqAccountType === "music" || reqAccountType === "music_artist" || reqArtistId) && isArtistAccount && activeArtistId && reqArtistId) {
            return String(activeArtistId) === String(reqArtistId);
        }
        // Personal account request — only match when NOT on a business/artist account
        if (!isBusinessAccount && !isArtistAccount && reqUserId) {
            return String(userId) === String(reqUserId);
        }

        // Fallback: if no account type info, check active account ID against requester IDs
        if (isBusinessAccount && activeBusinessId && reqBusinessId) {
            return String(activeBusinessId) === String(reqBusinessId);
        }
        if (isArtistAccount && activeArtistId && reqArtistId) {
            return String(activeArtistId) === String(reqArtistId);
        }

        // Last resort: personal user ID match only when on personal account
        if (!isBusinessAccount && !isArtistAccount) {
            return Boolean(reqUserId && String(userId) === String(reqUserId));
        }
        return false;
    })();

    // ── Cross-account ownership (matches EventPostPage pattern) ──
    // isPersonalOwner: the viewer's underlying user_id matches the requester's
    // user_id — true regardless of which account (personal/business/artist) is
    // currently active.  Used to hide the Respond button so a user can never
    // respond to their own request from any of their linked accounts.
    const reqUserId_x = request?.requesterId || request?.requester_id || request?.user_id || request?.owner_id || null;
    const isPersonalOwner = Boolean(userId && reqUserId_x && String(userId) === String(reqUserId_x));

    // isOnCorrectAccount: the viewer is the personal owner AND they are
    // currently on the same account type/slug that originally posted the
    // request.  Only then should Edit / Delete be shown.
    const isOnCorrectAccount = (() => {
        if (!isPersonalOwner) return false;
        const reqAccountType = String(
            request?.requesterAccountType || request?.requester_account_type ||
            request?.requesterType || request?.requester_type ||
            request?.accountType || request?.account_type || ""
        ).toLowerCase().trim();
        const reqHandle = String(
            request?.requesterHandle || request?.requester_handle || ""
        ).toLowerCase().trim();
        const reqIsBusiness = reqAccountType === "business" || !!(request?.requesterBusinessId || request?.requester_business_id);
        const reqIsArtist = reqAccountType === "artist" || reqAccountType === "music" || reqAccountType === "music_artist"
            || !!(request?.requesterArtistId || request?.requester_artist_id);

        const activeSlug = String(activeAccount?.slug || activeAccount?.handle || "").toLowerCase().trim();

        // Personal request → must be on personal account
        if (!reqIsBusiness && !reqIsArtist) {
            return !isBusinessAccount && !isArtistAccount;
        }
        // Business request → must be on that business account
        if (reqIsBusiness) {
            if (!isBusinessAccount) return false;
            if (activeSlug && reqHandle && activeSlug === reqHandle) return true;
            const reqBizId = request?.requesterBusinessId || request?.requester_business_id
                || (reqAccountType === "business" ? (request?.requesterProfileId || request?.requester_profile_id) : null);
            return Boolean(activeBusinessId && reqBizId && String(activeBusinessId) === String(reqBizId));
        }
        // Artist request → must be on that artist account
        if (reqIsArtist) {
            if (!isArtistAccount) return false;
            if (activeSlug && reqHandle && activeSlug === reqHandle) return true;
            const reqArtId = request?.requesterArtistId || request?.requester_artist_id
                || ((reqAccountType === "artist" || reqAccountType === "music" || reqAccountType === "music_artist")
                    ? (request?.requesterProfileId || request?.requester_profile_id) : null);
            return Boolean(activeArtistId && reqArtId && String(activeArtistId) === String(reqArtId));
        }
        return false;
    })();

    // ── Live requester avatar ──
    // Use the viewer's current profile picture when they are the requester,
    // so avatar changes are reflected immediately (matches ServiceRequestCard).
    // Only use the live avatar when the active account type matches the request's
    // account type — otherwise fall back to the server-provided snapshot.
    const liveRequesterAvatar = (() => {
        if (!isOwner || !request) return request?.requesterAvatar || "";
        const acctType = String(
            isBusinessAccount ? "business" : isArtistAccount ? "artist" : "personal"
        );
        const reqType = String(
            request.requesterType || request.requester_type ||
            request.requesterAccountType || request.requester_account_type || ""
        ).toLowerCase().trim();
        const reqIsBusiness = reqType === "business" || !!(request.requesterBusinessId || request.requester_business_id);
        const reqIsArtist = reqType === "artist" || reqType === "music" || reqType === "music_artist" || !!(request.requesterArtistId || request.requester_artist_id);

        if (acctType === "business" && reqIsBusiness) {
            return (activeAccount?.avatar_url || activeAccount?.logo_url || "").trim() || request?.requesterAvatar || "";
        }
        if (acctType === "artist" && reqIsArtist) {
            return (activeAccount?.avatar_url || "").trim() || request?.requesterAvatar || "";
        }
        if (acctType === "personal" && !reqIsBusiness && !reqIsArtist) {
            return (activeAccount?.avatar_url || user?.avatar_url || user?.profile_picture || "").trim() || request?.requesterAvatar || "";
        }
        // Account type mismatch — use server-provided avatar snapshot
        return request?.requesterAvatar || "";
    })();

    // Fetch request
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError(null);
        fetchServiceRequestById(requestId)
            .then((data) => {
                if (!mounted) return;
                setRequest(data);
                setLoading(false);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(err?.message || "Request not found.");
                setLoading(false);
            });
        return () => { mounted = false; };
    }, [requestId, accountCacheKey]);

    // Fetch responses
    useEffect(() => {
        if (!request?.id) return;
        let mounted = true;
        setResponsesLoading(true);
        setResponsesError(null);

        fetchRequestResponses(request.id)
            .then((data) => {
                if (!mounted) return;
                setResponses(data.responses || []);
                setIsRequester(Boolean(data.isRequester));
                setMyResponse(data.myResponse || null);
                setResponsesLoading(false);
            })
            .catch((err) => {
                if (!mounted) return;
                setResponsesError(err?.message || "Failed to load responses.");
                setResponsesLoading(false);
            });
        return () => { mounted = false; };
    }, [request?.id, accountCacheKey, responsesKey]);

    // Derived
    const catInfo = request ? getServiceCategoryInfo(request.categorySlug || "") : null;
    const CatIcon = catInfo?.Icon || null;
    const location = request
        ? (request.locationLabel || [request.city, request.county ? `${request.county} County` : ""].filter(Boolean).join(", ") || "Alabama")
        : "";
    const photos = request ? extractPhotos(request) : [];
    const desc = request?.description || "";
    const descIsLong = desc.length > 300;
    const isFilled = request?.status === "filled";
    const isOpen = request?.status === "open";

    const urgencyInfo = URGENCY_MAP[request?.urgency] || URGENCY_MAP.flexible;

    const budgetText = (() => {
        if (!request) return null;
        if (request.budgetMin && request.budgetMax) return `$${Number(request.budgetMin).toLocaleString()}–$${Number(request.budgetMax).toLocaleString()}`;
        if (request.budgetMin) return `From $${Number(request.budgetMin).toLocaleString()}`;
        if (request.budgetMax) return `Up to $${Number(request.budgetMax).toLocaleString()}`;
        if (request.budgetType === "flexible") return "Flexible";
        return null;
    })();
    const budgetSuffix = request?.budgetType === "hourly" ? "/hr" : request?.budgetType === "flat" ? " (flat)" : "";

    // Visible responses (filter out withdrawn for non-owners)
    // effectiveIsRequester: backend isRequester gated through front-end isOwner
    // so switching accounts properly hides owner controls
    const effectiveIsRequester = isOwner || (isRequester && !isBusinessAccount && !isArtistAccount);
    const visibleResponses = responses.filter((r) => {
        if (r.status === "withdrawn" && !effectiveIsRequester && String(r.responderId) !== String(userId)) return false;
        return true;
    });
    const acceptedResponses = visibleResponses.filter((r) => r.status === "accepted");
    const pendingResponses = visibleResponses.filter((r) => r.status === "pending");
    const otherResponses = visibleResponses.filter((r) => r.status !== "accepted" && r.status !== "pending");

    // Sort: accepted first, then pending, then others
    const sortedResponses = [...acceptedResponses, ...pendingResponses, ...otherResponses];
    const displayedResponses = showAllResponses ? sortedResponses : sortedResponses.slice(0, MAX_RESPONSES_SHOWN_INITIALLY);
    const hasMoreResponses = sortedResponses.length > MAX_RESPONSES_SHOWN_INITIALLY;

    const hasQuotes = visibleResponses.some((r) => r.quoteMin || r.quoteMax || r.quoteType);

    // When arriving from a notification that wants the responses tab open,
    // switch to the responses tab once effectiveIsRequester is confirmed.
    // Tab layout: About(0), Photos(1), Responses(2 — only if requester).
    useEffect(() => {
        if (!pendingOpenResponses || !effectiveIsRequester) return;
        const responsesIdx = 2;
        if (detailTab !== responsesIdx) {
            setDetailTab(responsesIdx);
        }
    }, [pendingOpenResponses, effectiveIsRequester]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll to and highlight a specific response when coming from a notification
    useEffect(() => {
        if (!highlightResponseId || responsesLoading || responses.length === 0) return;
        const responsesTabIdx = 2;
        if (detailTab !== responsesTabIdx) return;
        // Give DOM time to render
        const scrollTimer = setTimeout(() => {
            const el = document.querySelector(`[data-response-id="${highlightResponseId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 400);
        // Clear highlight after 6 seconds
        const fadeTimer = setTimeout(() => {
            setHighlightResponseId(null);
        }, 6500);
        return () => { clearTimeout(scrollTimer); clearTimeout(fadeTimer); };
    }, [highlightResponseId, responsesLoading, responses.length, detailTab]);

    // Handlers
    const handleCopyLink = () => {
        const url = `${window.location.origin}/services/requests/${request?.id}`;
        navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => {});
    };

    const handleShare = () => {
        if (!request) return;
        setShareDialogOpen(true);
    };

    // Map generic ReportDialog reasons to service API reasons
    const SERVICE_REASON_MAP = { spam: "spam", inappropriate: "inappropriate", harassment: "inappropriate", misinformation: "misleading", other: "other" };
    const handleReportSubmit = async ({ reason, details } = {}) => {
        const r = SERVICE_REASON_MAP[reason] || reason || "other";
        if (!request?.id) return;
        try {
            await reportServiceRequest(request.id, { reason: r, details: details || "" });
        } catch (err) {
            setToast(err?.message || "Failed to submit report.");
        }
    };

    const handleAcceptResponse = (resp) => {
        setConfirmDialog({
            title: "Accept This Response?",
            message: `You're accepting ${resp.responderName || "this provider"}'s response. Their contact information will be revealed to you, and your contact preference will be shared with them.`,
            confirmLabel: "Accept",
            confirmColor: "success",
            action: async () => {
                const updated = await acceptRequestResponse(request.id, resp.id);
                setResponses((prev) => prev.map((r) => r.id === resp.id ? { ...r, ...updated, status: "accepted", responderContact: updated.responderContact } : r));
                setToast("Response accepted! Contact info revealed.");
            },
        });
    };

    const handleDeclineResponse = (resp) => {
        setConfirmDialog({
            title: "Decline This Response?",
            message: `This will decline ${resp.responderName || "this provider"}'s response. They won't be notified of the reason.`,
            confirmLabel: "Decline",
            confirmColor: "warning",
            action: async () => {
                await declineRequestResponse(request.id, resp.id);
                setResponses((prev) => prev.map((r) => r.id === resp.id ? { ...r, status: "declined" } : r));
                setToast("Response declined.");
            },
        });
    };

    const handleWithdrawResponse = (resp) => {
        setConfirmDialog({
            title: "Withdraw Your Response?",
            message: "This will remove your response from this request. You can respond again later if the request is still open.",
            confirmLabel: "Withdraw",
            confirmColor: "warning",
            action: async () => {
                await withdrawRequestResponse(request.id, resp.id);
                setResponses((prev) => prev.map((r) => r.id === resp.id ? { ...r, status: "withdrawn" } : r));
                setMyResponse(null);
                setToast("Response withdrawn.");
            },
        });
    };

    const handleToggleFilled = () => {
        const actionLabel = isFilled ? "Reopen" : "Mark as Filled";
        const actionMsg = isFilled
            ? "This will reopen your request so providers can continue to respond."
            : "This will mark your request as filled. Providers will no longer be able to respond.";
        setConfirmDialog({
            title: `${actionLabel} This Request?`,
            message: actionMsg,
            confirmLabel: actionLabel,
            confirmColor: isFilled ? "primary" : "success",
            action: async () => {
                const result = await closeServiceRequest(request.id);
                setRequest((prev) => ({ ...prev, status: result.status }));
                setToast(result.status === "filled" ? "Request marked as filled!" : "Request reopened.");
            },
        });
    };

    const handleDelete = () => {
        setConfirmDialog({
            title: "Delete This Request?",
            message: "This action cannot be undone. All responses will also be removed.",
            confirmLabel: "Delete",
            confirmColor: "error",
            action: async () => {
                await deleteServiceRequest(request.id);
                setToast("Request deleted.");
                setTimeout(() => navigate("/services?tab=requests", { state: { restoreServices: true } }), 400);
            },
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmDialog?.action) return;
        setConfirmLoading(true);
        try {
            await confirmDialog.action();
            setConfirmDialog(null);
        } catch (err) {
            setToast(err?.message || "Something went wrong.");
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleViewListing = (listingId) => {
        navigate(`/services/${listingId}`);
    };

    // ─── Loading state ───
    if (loading) {
        return (
            <Box sx={{ width: "100%", maxWidth: 1120, mx: "auto", px: { xs: 1.25, sm: 2, md: 3 }, py: { xs: 1.5, sm: 3 }, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    // ─── Error state ───
    if (error || !request) {
        return (
            <Box sx={{ width: "100%", maxWidth: 1120, mx: "auto", px: { xs: 1.25, sm: 2, md: 3 }, py: { xs: 1.5, sm: 3 }, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 300 }}>
                <Typography color="error" sx={{ fontWeight: 800 }}>{error || "Request not found."}</Typography>
                {!fromNotifications && (
                    <Button onClick={() => navigate("/services?tab=requests")} startIcon={<ArrowBackRoundedIcon />}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}>
                        Back to Requests
                    </Button>
                )}
            </Box>
        );
    }

    // ─── RENDER ───
    return (
        <Box sx={{ width: "100%", maxWidth: 1120, mx: "auto", px: { xs: 0, sm: 2, md: 3 }, py: { xs: 0, sm: 3 }, pb: isMobile ? `${MOBILE_BOTTOM_NAV_HEIGHT + 16}px` : undefined }}>
            <Paper
                variant="outlined"
                sx={(t) => ({
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    borderRadius: { xs: 0, md: 3 },
                    border: "none",
                    bgcolor: "background.paper",
                    backgroundImage: "none",
                    boxShadow: { xs: "none", md: `0 16px 56px ${alpha(t.palette.text.primary, 0.08)}` },
                })}
            >
                {/* Back link — clean, just the button */}
                {!fromNotifications && (
                    <Box sx={{ mb: 1 }}>
                        <Button
                            onClick={() => {
                                if (fromMap) {
                                    if (window.history?.length > 1) {
                                        window.history.back();
                                    } else {
                                        navigate("/services?tab=requests", { state: { restoreServices: true, openMap: true } });
                                    }
                                    return;
                                }
                                try {
                                    sessionStorage.setItem("ll:services:restore", "1");
                                    sessionStorage.setItem("ll:services:tab", "requests");
                                } catch { /* ignore */ }
                                if (fromServices) {
                                    navigate(-1);
                                } else {
                                    navigate("/services?tab=requests", { state: { restoreServices: true } });
                                }
                            }}
                            startIcon={<ArrowBackRoundedIcon />}
                            size="small"
                            sx={{ px: 1, py: 0.25, minWidth: 0, fontWeight: 800, fontSize: 13, textTransform: "none", borderRadius: 999, "&:hover": { bgcolor: "action.hover" } }}
                        >
                            {fromMap ? "Return to Map" : isMobile ? "Back" : "Return to Requests"}
                        </Button>
                    </Box>
                )}

                {/* ═══ HERO SECTION ═══ */}
                <Box sx={(t) => ({
                    borderRadius: 2.5,
                    background: `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 45%, transparent 100%)`,
                    border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08),
                    overflow: "hidden", mb: { xs: 1.5, sm: 2.5 },
                })}>
                    {/* Accent bar */}
                    <Box sx={{ height: 3, bgcolor: isFilled ? "text.disabled" : "primary.main" }} />

                    <Box sx={{ px: { xs: 1.25, sm: 2.5 }, pt: { xs: 1.25, sm: 2 }, pb: { xs: 1.25, sm: 2 } }}>
                        {/* Author row + actions */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <AccountAvatar
                                src={liveRequesterAvatar}
                                accountType={request.requesterType || request.requester_type || (request.requesterBusinessId || request.requester_business_id ? "business" : request.requesterArtistId || request.requester_artist_id ? "artist" : "user")}
                                alt={request.requesterName || ""}
                                size={{ xs: 38, sm: 52 }}
                                sx={{
                                    cursor: "pointer",
                                    border: "2px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.06),
                                }}
                                onClick={(e) => {
                                    const rType = (request.requesterType || request.requester_type || "").toLowerCase();
                                    handleOpenUserCard(e.currentTarget, {
                                        id: request.requesterId,
                                        first_name: request.requesterName?.split(" ")[0],
                                        last_name: request.requesterName?.split(" ").slice(1).join(" "),
                                        handle: request.requesterHandle,
                                        avatar_url: liveRequesterAvatar,
                                        ...(rType === "business" ? {
                                            account_type: "business",
                                            business_id: request.requesterProfileId || request.requester_profile_id,
                                            business_name: request.requesterName,
                                            business_slug: request.requesterHandle,
                                        } : rType === "artist" ? {
                                            account_type: "artist",
                                            artist_id: request.requesterProfileId || request.requester_profile_id,
                                            artist_name: request.requesterName,
                                            artist_handle: request.requesterHandle,
                                        } : {}),
                                    });
                                }}
                            />

                            <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                                <Box
                                    onClick={(e) => {
                                        const rType = (request.requesterType || request.requester_type || "").toLowerCase();
                                        handleOpenUserCard(e.currentTarget, {
                                            id: request.requesterId,
                                            first_name: request.requesterName?.split(" ")[0],
                                            last_name: request.requesterName?.split(" ").slice(1).join(" "),
                                            handle: request.requesterHandle,
                                            avatar_url: liveRequesterAvatar,
                                            ...(rType === "business" ? {
                                                account_type: "business",
                                                business_id: request.requesterProfileId || request.requester_profile_id,
                                                business_name: request.requesterName,
                                                business_slug: request.requesterHandle,
                                            } : rType === "artist" ? {
                                                account_type: "artist",
                                                artist_id: request.requesterProfileId || request.requester_profile_id,
                                                artist_name: request.requesterName,
                                                artist_handle: request.requesterHandle,
                                            } : {}),
                                        });
                                    }}
                                    sx={{
                                        display: "inline-flex",
                                        flexDirection: "column",
                                        cursor: "pointer",
                                        alignSelf: "flex-start",
                                        width: "fit-content",
                                        maxWidth: "100%",
                                        borderRadius: 1,
                                        "&:hover .ll-author-name": { textDecoration: "underline" },
                                    }}
                                >
                                    <Typography className="ll-author-name" sx={{ fontWeight: 900, fontSize: { xs: 14, sm: 15 }, lineHeight: 1.3 }}>
                                        {request.requesterName || "Someone"}
                                    </Typography>
                                    {request.requesterHandle && (
                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>
                                            @{request.requesterHandle}
                                        </Typography>
                                    )}
                                </Box>
                                {/* Owner chip — under name */}
                                {isOwner && (
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip size="small" icon={<PersonRoundedIcon sx={{ fontSize: 13 }} />} label="Your Request"
                                              color="primary" variant="outlined"
                                              sx={{ height: 24, borderRadius: 999, fontWeight: 800, fontSize: 11 }} />
                                    </Box>
                                )}
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, mt: 0.25 }}>
                                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
                                </Typography>
                            </Box>

                            {/* Right side: menu only */}
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
                                <IconButton size="small" onClick={(e) => setPageMenuAnchor(e.currentTarget)}
                                            sx={(t) => ({ width: 32, height: 32, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: 'text.secondary', "&:hover": { bgcolor: "action.hover", color: 'text.primary' } })}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>

                        {/* Title */}
                        <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, sm: 22, md: 28 }, lineHeight: 1.15, mt: { xs: 1, sm: 1.75 }, wordBreak: "break-word" }}>
                            {request.title}
                        </Typography>
                        {catInfo && (
                            <Box sx={{ mt: 0.75 }}>
                                <Chip size="small" icon={CatIcon ? <CatIcon sx={{ fontSize: 13 }} /> : undefined} label={catInfo.name}
                                      sx={(t) => ({ height: 24, borderRadius: 999, fontWeight: 800, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2), "& .MuiChip-icon": { color: t.palette.primary.main } })} />
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* 3-dot menu — PostList style */}
                <Menu anchorEl={pageMenuAnchor} open={pageMenuOpen} onClose={() => setPageMenuAnchor(null)}
                      disableScrollLock
                      onClick={(e) => e.stopPropagation()}
                      sx={{ zIndex: 10000 }}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                      PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200, py: 0.5 } }}>
                    <MenuItem onClick={() => { setPageMenuAnchor(null); handleCopyLink(); }} sx={{ py: 1 }}>
                        <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>
                    {isOnCorrectAccount && (
                        <MenuItem onClick={() => { setPageMenuAnchor(null); if (typeof onEdit === "function") { onEdit(request); } else { setEditModalOpen(true); } }} sx={{ py: 1 }}>
                            <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Edit" />
                        </MenuItem>
                    )}
                    {isOnCorrectAccount && (
                        <MenuItem onClick={() => { setPageMenuAnchor(null); handleDelete(); }} sx={{ py: 1, color: 'error.main' }}>
                            <ListItemIcon sx={{ color: 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Delete" />
                        </MenuItem>
                    )}
                    {!isOnCorrectAccount && viewerUser && (
                        <MenuItem onClick={() => { setPageMenuAnchor(null); setReportOpen(true); }} sx={{ py: 1 }}>
                            <ListItemIcon><FlagRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Report" />
                        </MenuItem>
                    )}
                </Menu>

                {/* ─── Full-width action buttons — matches BusinessDetailPanel ─── */}
                <Divider sx={{ mx: 0, mt: { xs: 0.75, sm: 1.5 } }} />
                {!isPersonalOwner && !isOwner && (
                    <Stack direction="row" spacing={1} sx={{ pt: 1, pb: 0.5 }}>
                        {myResponse && myResponse.status !== "withdrawn" ? (
                            <Button variant="outlined" fullWidth size="small" startIcon={<CheckCircleRoundedIcon sx={{ fontSize: '16px !important' }} />} disabled
                                    sx={(t) => ({
                                        borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: { xs: 13, sm: 14 }, py: { xs: 0.6, sm: 0.75 },
                                        color: t.palette.success.main,
                                        borderColor: alpha(t.palette.success.main, 0.3),
                                        "&.Mui-disabled": { color: t.palette.success.main, borderColor: alpha(t.palette.success.main, 0.3) },
                                    })}>
                                Responded
                            </Button>
                        ) : isOpen ? (
                            <Button variant="contained" fullWidth size="small" startIcon={<SendRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                    onClick={() => {
                                        if (!viewerUser) { openAuthPopup(); return; }
                                        if (typeof onRespond === "function") {
                                            onRespond(request);
                                        } else {
                                            setRespondModalOpen(true);
                                        }
                                    }}
                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: { xs: 13, sm: 14 }, py: { xs: 0.6, sm: 0.75 } }}>
                                Respond
                            </Button>
                        ) : null}
                        <Button variant="outlined" fullWidth size="small" startIcon={<ShareRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                onClick={handleShare}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: { xs: 13, sm: 14 }, py: { xs: 0.6, sm: 0.75 }, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                            Share
                        </Button>
                    </Stack>
                )}
                {isOwner && (
                    <Stack direction="row" spacing={1} sx={{ pt: 1, pb: 0.5 }}>
                        <Button
                            fullWidth
                            size="small"
                            variant={isFilled ? "outlined" : "contained"}
                            color={isFilled ? "primary" : "success"}
                            startIcon={isFilled ? <LockOpenRoundedIcon sx={{ fontSize: '16px !important' }} /> : <CheckCircleRoundedIcon sx={{ fontSize: '16px !important' }} />}
                            onClick={handleToggleFilled}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: { xs: 13, sm: 14 }, py: { xs: 0.6, sm: 0.75 }, boxShadow: "none", "&:hover": { boxShadow: "none" } }}
                        >
                            {isFilled ? "Reopen" : "Mark Filled"}
                        </Button>
                        <Button variant="outlined" fullWidth size="small" startIcon={<ShareRoundedIcon sx={{ fontSize: '16px !important' }} />}
                                onClick={handleShare}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: { xs: 13, sm: 14 }, py: { xs: 0.6, sm: 0.75 }, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                            Share
                        </Button>
                    </Stack>
                )}

                {/* ─── Sticky Tabs Container — matches BusinessDetailPanel ─── */}
                <Box sx={{ position: "sticky", top: 0, zIndex: 10, bgcolor: "background.paper", pt: 1.25, pb: 0.5 }}>
                    <Divider />
                    <Tabs value={detailTab} onChange={(_e, v) => setDetailTab(v)} variant="fullWidth"
                          sx={(t) => ({
                              minHeight: isMobile ? 52 : 38, flexShrink: 0, borderRadius: 0, padding: 0, backgroundColor: "transparent", border: "none", boxShadow: "none",
                              borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12),
                              "& .MuiTab-root": { minHeight: isMobile ? 52 : 38, textTransform: "none", fontWeight: 700, fontSize: isMobile ? 11.5 : 13.5, letterSpacing: "-0.01em", py: isMobile ? 0.5 : 0, px: 1, minWidth: 0, borderRadius: 0, gap: isMobile ? 0.25 : 0.25, color: t.palette.text.secondary, "&:hover": { color: t.palette.text.primary },
                                  ...(isMobile && { flexDirection: "column" }),
                              },
                              "& .Mui-selected": { color: `${t.palette.primary.main} !important`, fontWeight: 950 },
                              "& .MuiTabs-indicator": { bgcolor: t.palette.primary.main, height: 2.5, borderRadius: 0 },
                          })}>
                        <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: isMobile ? 20 : 16 }} />} iconPosition={isMobile ? "top" : "start"} label="About" />
                        <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: isMobile ? 20 : 16 }} />} iconPosition={isMobile ? "top" : "start"}
                             label={`Photos${photos.length > 0 ? ` (${photos.length})` : ""}`} />
                        {effectiveIsRequester && (
                            <Tab icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: isMobile ? 20 : 16 }} />} iconPosition={isMobile ? "top" : "start"}
                                 label={`Responses${visibleResponses.length > 0 ? ` (${visibleResponses.length})` : ""}`} />
                        )}
                    </Tabs>
                </Box>

                {/* ═══ TAB 0: ABOUT ═══ */}
                {detailTab === 0 && (
                    <Stack spacing={2.5} sx={{ pt: 2.5 }}>
                        {/* Alerts */}
                        {!isOwner && myResponse && myResponse.status !== "withdrawn" && (
                            <Alert
                                severity={myResponse.status === "accepted" ? "success" : myResponse.status === "declined" ? "warning" : "info"}
                                sx={{ borderRadius: 2 }}
                                icon={myResponse.status === "accepted" ? <CheckCircleRoundedIcon /> : undefined}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {myResponse.status === "accepted"
                                        ? "Your response was accepted! Check your Messages for contact details."
                                        : myResponse.status === "declined"
                                            ? "Your response was declined by the requester."
                                            : "You've already responded to this request. Your response is pending review."
                                    }
                                </Typography>
                            </Alert>
                        )}
                        {!isOwner && isFilled && (
                            <Alert severity="warning" sx={{ borderRadius: 2 }} icon={<VisibilityOffRoundedIcon />}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    This request has been filled and is no longer accepting responses.
                                </Typography>
                            </Alert>
                        )}

                        {/* Detail cards grid */}
                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: { xs: 1, sm: 1.5 } }}>
                            <Box sx={(t) => ({ p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), display: "flex", alignItems: "flex-start", gap: 0.75 })}>
                                <LocationOnRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: { xs: 10, sm: 10.5 }, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Location</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 12.5, sm: 14 }, lineHeight: 1.3, wordBreak: "break-word", mt: 0.25 }}>{location}</Typography>
                                </Box>
                            </Box>
                            <Box sx={(t) => ({ p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), display: "flex", alignItems: "flex-start", gap: 0.75 })}>
                                <InfoRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: { xs: 10, sm: 10.5 }, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Status</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 12.5, sm: 14 }, lineHeight: 1.3, mt: 0.25 }}>
                                        {isFilled ? "Filled" : "Open"}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={(t) => ({ p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), display: "flex", alignItems: "flex-start", gap: 0.75 })}>
                                <ScheduleRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: { xs: 10, sm: 10.5 }, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Timeline</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 12.5, sm: 14 }, lineHeight: 1.3, mt: 0.25 }}>
                                        {request.urgency === "asap" ? "ASAP" : request.urgency === "within_week" ? "This Week" : request.urgency === "within_month" ? "This Month" : "Flexible"}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={(t) => ({ p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), display: "flex", alignItems: "flex-start", gap: 0.75 })}>
                                <AccessTimeRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: { xs: 10, sm: 10.5 }, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Posted</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: { xs: 12.5, sm: 14 }, lineHeight: 1.3, mt: 0.25 }}>
                                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}
                                    </Typography>
                                </Box>
                            </Box>
                            {request.contactPreference && (
                                <Box sx={(t) => ({ p: { xs: 1, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015), display: "flex", alignItems: "flex-start", gap: 0.75 })}>
                                    {request.contactPreference === "call" ? <PhoneRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />
                                        : request.contactPreference === "email" ? <EmailRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />
                                            : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: { xs: 17, sm: 20 }, color: "primary.main", mt: 0.1, flexShrink: 0 }} />}
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontSize: { xs: 10, sm: 10.5 }, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Contact</Typography>
                                        <Typography sx={{ fontWeight: 800, fontSize: { xs: 12.5, sm: 14 }, lineHeight: 1.3, mt: 0.25 }}>
                                            {request.contactPreference === "call" ? "Phone" : request.contactPreference === "email" ? "Email" : "Message"}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Description */}
                        {desc && (
                            <Box sx={(t) => ({ position: "relative", p: 1.5, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: alpha(t.palette.text.primary, 0.015) })}>
                                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", mb: 0.75 }}>
                                    Description
                                </Typography>
                                <Box sx={{ maxHeight: descExpanded ? "none" : DESC_MAX_HEIGHT, overflowY: descExpanded ? "visible" : "hidden", position: "relative" }}>
                                    <RichTextDisplay html={desc} sx={{ color: "text.secondary" }} />
                                </Box>
                                {!descExpanded && descIsLong && (
                                    <Box sx={{
                                        position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
                                        background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                                        pointerEvents: "none", borderRadius: "0 0 8px 8px",
                                    }} />
                                )}
                                {descIsLong && (
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
                            </Box>
                        )}

                        {/* Budget & Timeline grid */}
                        {((budgetText || request.budgetNotes) || request.timelineNotes) && (
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: (budgetText || request.budgetNotes) && request.timelineNotes ? "1fr 1fr" : "1fr" }, gap: 1.5 }}>
                                {(budgetText || request.budgetNotes) && (
                                    <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.12) })}>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                                            <AttachMoneyRoundedIcon sx={{ fontSize: 16, color: "success.main" }} />
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: "success.main", textTransform: "uppercase", fontSize: 10.5 }}>Budget</Typography>
                                        </Box>
                                        {budgetText && (
                                            <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 16, mb: 0.25 }}>
                                                {budgetText}{budgetSuffix}
                                            </Typography>
                                        )}
                                        {request.budgetNotes && budgetText && (
                                            <Typography variant="caption" sx={{ color: "text.secondary", wordBreak: "break-word" }}>{request.budgetNotes}</Typography>
                                        )}
                                        {request.budgetNotes && !budgetText && (
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{request.budgetNotes}</Typography>
                                        )}
                                    </Box>
                                )}
                                {request.timelineNotes && (
                                    <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.info.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.info.main, 0.12) })}>
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                                            <EventNoteRoundedIcon sx={{ fontSize: 16, color: "info.main" }} />
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: "info.main", textTransform: "uppercase", fontSize: 10.5 }}>Timeline Notes</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ lineHeight: 1.6, color: "text.secondary", wordBreak: "break-word" }}>{request.timelineNotes}</Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Stack>
                )}

                {/* ═══ TAB 1: PHOTOS ═══ */}
                {detailTab === 1 && (
                    <Box sx={{ pt: 2.5 }}>
                        {photos.length > 0 ? (
                            <Carousel photos={photos} />
                        ) : (
                            <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                <PhotoLibraryRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
                                <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 700 }}>No photos attached</Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* ═══ TAB 2: RESPONSES (requester only) ═══ */}
                {effectiveIsRequester && detailTab === 2 && (
                    <Stack spacing={2} sx={{ pt: 2.5 }}>
                        <Box sx={{ mb: 0.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                                    Responses
                                </Typography>
                                {visibleResponses.length > 0 && (
                                    <Chip size="small" label={visibleResponses.length} color="primary"
                                          sx={{ height: 22, borderRadius: 999, fontWeight: 900, fontSize: 12, minWidth: 28 }} />
                                )}
                            </Stack>

                            {/* Quote summary for owner */}
                            {effectiveIsRequester && hasQuotes && pendingResponses.length > 0 && (
                                <Box sx={(t) => ({
                                    mt: 1, p: 1.25, borderRadius: 2,
                                    bgcolor: alpha(t.palette.warning.main, 0.04),
                                    border: "1px solid", borderColor: alpha(t.palette.warning.main, 0.12),
                                })}>
                                    <Typography sx={{ fontWeight: 800, fontSize: 12, color: "warning.dark", mb: 0.5 }}>
                                        Quote Summary
                                    </Typography>
                                    <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                        {pendingResponses.filter((r) => r.quoteMin || r.quoteMax).map((r) => {
                                            const range = formatQuoteRange(r);
                                            if (!range) return null;
                                            return (
                                                <Chip
                                                    key={r.id}
                                                    size="small"
                                                    avatar={<AccountAvatar src={r.responderAvatar} accountType={r.responderType || r.responder_type || (r.responderBusinessId ? "business" : r.responderArtistId ? "artist" : "user")} size={20} />}
                                                    label={range}
                                                    variant="outlined"
                                                    sx={{ fontWeight: 700, fontSize: 12, borderRadius: 999, height: 26 }}
                                                />
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}
                        </Box>

                        {/* Request author context — shows who made this request above the response cards */}
                        <Box
                            onClick={(e) => {
                                const rType = (request.requesterType || request.requester_type || "").toLowerCase();
                                handleOpenUserCard(e.currentTarget, {
                                    id: request.requesterId,
                                    first_name: request.requesterName?.split(" ")[0],
                                    last_name: request.requesterName?.split(" ").slice(1).join(" "),
                                    handle: request.requesterHandle,
                                    avatar_url: liveRequesterAvatar,
                                    ...(rType === "business" ? {
                                        account_type: "business",
                                        business_id: request.requesterProfileId || request.requester_profile_id,
                                        business_name: request.requesterName,
                                        business_slug: request.requesterHandle,
                                    } : rType === "artist" ? {
                                        account_type: "artist",
                                        artist_id: request.requesterProfileId || request.requester_profile_id,
                                        artist_name: request.requesterName,
                                        artist_handle: request.requesterHandle,
                                    } : {}),
                                });
                            }}
                            sx={(t) => ({
                                p: 1.5, borderRadius: 2,
                                bgcolor: alpha(t.palette.primary.main, 0.03),
                                border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08),
                                display: "flex", alignItems: "center", gap: 1.5,
                                cursor: "pointer",
                                transition: `background-color ${t.custom?.motion?.fast || 120}ms ${t.custom?.motion?.ease || 'ease'}`,
                                "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.06) },
                                "&:hover .ll-requester-name": { textDecoration: "underline" },
                            })}
                        >
                            <AccountAvatar
                                src={liveRequesterAvatar}
                                accountType={request.requesterType || request.requester_type || "user"}
                                size={36}
                                sx={{ border: "2px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.06) }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.03em", display: "block", lineHeight: 1.2 }}>
                                    Requested by
                                </Typography>
                                <Typography
                                    className="ll-requester-name"
                                    sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.3 }}
                                >
                                    {request.requesterName || "Someone"}
                                </Typography>
                                {request.requesterHandle && (
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11, lineHeight: 1.2 }}>
                                        @{String(request.requesterHandle).replace(/^@/, "")}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Responses loading */}
                        {responsesLoading && (
                            <Box sx={{ py: 3, textAlign: "center" }}>
                                <LinearProgress sx={{ borderRadius: 999, mb: 1 }} />
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>Loading responses…</Typography>
                            </Box>
                        )}

                        {/* Responses error */}
                        {responsesError && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>{responsesError}</Alert>
                        )}

                        {/* Empty state */}
                        {!responsesLoading && visibleResponses.length === 0 && (
                            <Box sx={(t) => ({
                                py: 4, px: 3, textAlign: "center", borderRadius: 2.5,
                                border: "1px dashed", borderColor: alpha(t.palette.text.primary, 0.12),
                                bgcolor: alpha(t.palette.background.default, 0.5),
                            })}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                                <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 0.5 }}>
                                    No responses yet
                                </Typography>
                                <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 360, mx: "auto" }}>
                                    Providers will see your request and can send you quotes and messages. Hang tight!
                                </Typography>
                            </Box>
                        )}

                        {/* Response cards */}
                        {!responsesLoading && displayedResponses.length > 0 && (
                            <Stack spacing={1.5}>
                                {displayedResponses.map((resp) => (
                                    <ResponseCard
                                        key={resp.id}
                                        response={resp}
                                        highlighted={highlightResponseId && Number(resp.id) === Number(highlightResponseId)}
                                        isRequester={effectiveIsRequester}
                                        isOwnResponse={Boolean(userId && String(resp.responderId) === String(userId))}
                                        onAccept={handleAcceptResponse}
                                        onDecline={handleDeclineResponse}
                                        onWithdraw={handleWithdrawResponse}
                                        onViewListing={handleViewListing}
                                        onOpenUserCard={handleOpenUserCard}
                                    />
                                ))}
                            </Stack>
                        )}

                        {/* Show more / less */}
                        {hasMoreResponses && (
                            <Box sx={{ textAlign: "center", mt: 1.5 }}>
                                <Button
                                    size="small"
                                    onClick={() => setShowAllResponses((p) => !p)}
                                    endIcon={showAllResponses ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                                >
                                    {showAllResponses ? "Show fewer" : `Show all ${sortedResponses.length} responses`}
                                </Button>
                            </Box>
                        )}
                    </Stack>
                )}

                {/* Bottom spacer */}
                <Box sx={{ height: 40 }} />
            </Paper>

            {/* ═══ USER CARD POPOVER ═══ */}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
                isSelf={isSelfForCard}
                onViewProfile={handleViewProfile}
            />

            {/* ═══ CONFIRMATION DIALOG ═══ */}
            <ConfirmDialog
                open={Boolean(confirmDialog)}
                onClose={() => { if (!confirmLoading) setConfirmDialog(null); }}
                onConfirm={handleConfirmAction}
                title={confirmDialog?.title || ""}
                message={confirmDialog?.message || ""}
                confirmLabel={confirmDialog?.confirmLabel || "Confirm"}
                confirmColor={confirmDialog?.confirmColor || "primary"}
                loading={confirmLoading}
            />

            {/* ═══ TOASTS ═══ */}
            <Snackbar
                open={Boolean(toast)}
                autoHideDuration={3000}
                onClose={() => setToast("")}
                message={toast}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
            <Snackbar
                open={copyToast}
                autoHideDuration={2000}
                onClose={() => setCopyToast(false)}
                message="Link copied to clipboard"
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />

            {/* ═══ SHARE SERVICE REQUEST DIALOG ═══ */}
            <ShareServiceDialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                request={request}
                viewer={user || viewerUser}
            />

            {/* ═══ REPORT SERVICE REQUEST DIALOG ═══ */}
            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={handleReportSubmit}
                title="Report Request"
            />

            {/* ═══ RESPOND TO REQUEST MODAL (standalone detail page) ═══ */}
            <RespondToRequestModal
                open={respondModalOpen}
                onClose={() => setRespondModalOpen(false)}
                request={request}
                onSuccess={() => {
                    reloadResponses();
                    setRespondModalOpen(false);
                }}
            />

            {/* ═══ EDIT REQUEST MODAL (inline, used when onEdit prop is not provided) ═══ */}
            {isOnCorrectAccount && request && (
                <CreateServiceRequestModal
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    editingRequest={request}
                    onSuccess={() => {
                        setEditModalOpen(false);
                        // Reload the request data
                        (async () => {
                            try {
                                const { fetchServiceRequestById } = await import("./api/servicesApi");
                                const fresh = await fetchServiceRequestById(requestId);
                                if (fresh) setRequest(fresh);
                            } catch { /* ignore */ }
                        })();
                    }}
                />
            )}
        </Box>
    );
}
