// src/pages/services/components/ServiceDetailPanel.jsx
//
// Service detail panel — renders the right-panel service detail view
// (cover photo, header, about/photos/reviews tabs, provider card, hours, etc.)
// Extracted from ServicesPage for reusability.

import React, { useMemo } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Avatar,
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    Menu,
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

import axios from "../../../api/axiosInstance";
import { PhotoCommentsDialog } from "../../profile/userProfile/ProfileHeader";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkIcon from "@mui/icons-material/Link";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";

import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ForestRoundedIcon from "@mui/icons-material/Forest";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivism";
import GroupsRoundedIcon from "@mui/icons-material/Groups";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";

import AccountAvatar from "../../../components/AccountAvatar";
import PulsingDots from "../../../components/PulsingDots";

// ─── Highlight Section Icon mapping ──
const HL_ICONS_MAP = {
    Star: StarRoundedIcon,
    Favorite: FavoriteRoundedIcon,
    Forest: ForestRoundedIcon,
    Volunteer: VolunteerActivismRoundedIcon,
    Groups: GroupsRoundedIcon,
    CheckCircle: CheckCircleRoundedIcon,
    Trophy: EmojiEventsRoundedIcon,
    Shield: GppGoodRoundedIcon,
    Build: BuildRoundedIcon,
};
function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS_MAP[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

// ─── Hours helpers ──
const HOURS_DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOURS_DAY_LABELS = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };

function formatTimeStr(t) {
    if (!t) return "";
    const [h, m] = String(t).split(":");
    const hr = parseInt(h, 10);
    if (Number.isNaN(hr)) return t;
    const suffix = hr >= 12 ? "PM" : "AM";
    const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
    return `${hr12}:${m || "00"} ${suffix}`;
}

function parseHoursToArray(hoursObj) {
    if (!hoursObj || typeof hoursObj !== "object") return null;
    const arr = [];
    for (const day of HOURS_DAY_ORDER) {
        const d = hoursObj[day];
        if (!d) continue;
        arr.push({ day: HOURS_DAY_LABELS[day] || day, closed: Boolean(d.closed), allDay: Boolean(d.allDay), open: d.open || null, close: d.close || null });
    }
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
        if (mins >= (oh * 60 + (om || 0)) && mins < (ch * 60 + (cm || 0))) return { open: true, label: "Open \u00b7 Closes " + formatTimeStr(d.close) };
        return { open: false, label: "Closed \u00b7 Opens " + formatTimeStr(d.open) };
    }
    return null;
}

// ─── Photo Gallery ──
function DetailPhotoGallery({ photos, onPhotoClick }) {
    const [lbOpen, setLbOpen] = React.useState(false);
    const [lbIdx, setLbIdx] = React.useState(0);
    const items = Array.isArray(photos) ? photos.filter((p) => p && (p.url || typeof p === "string")) : [];
    const urls = items.map((p) => (typeof p === "string" ? p : p.url));
    if (urls.length === 0) return null;
    const openLightbox = (i) => {
        if (onPhotoClick && items[i]) { onPhotoClick(items[i]); return; }
        setLbIdx(i); setLbOpen(true);
    };
    const safeLbIdx = Math.max(0, Math.min(lbIdx, urls.length - 1));
    return (
        <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                {urls.map((url, i) => (
                    <Box key={i} onClick={() => openLightbox(i)}
                         sx={(t) => ({ position: "relative", aspectRatio: "1", borderRadius: 2, overflow: "hidden", cursor: "pointer", bgcolor: alpha(t.palette.text.primary, 0.04), border: "1px solid", borderColor: alpha(t.palette.divider, 0.5), transition: `transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}, box-shadow ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { transform: "scale(1.03)", boxShadow: `0 4px 16px ${alpha(t.palette.text.primary, 0.12)}` }, "&:hover .photo-overlay": { opacity: 1 } })}>
                        <Box component="img" src={url} alt={`Photo ${i + 1}`} referrerPolicy="no-referrer" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <Box className="photo-overlay" sx={{ position: "absolute", inset: 0, bgcolor: (t) => alpha(t.palette.common.black, 0.15), opacity: 0, transition: "opacity 200ms ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <PhotoLibraryRoundedIcon sx={{ fontSize: 24, color: "common.white", filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }} />
                        </Box>
                    </Box>
                ))}
            </Box>
            <Dialog open={lbOpen} onClose={() => setLbOpen(false)} maxWidth="md" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, bgcolor: "common.black", overflow: "hidden" } }}>
                <Box sx={{ position: "relative" }}>
                    <IconButton onClick={() => setLbOpen(false)} sx={{ position: "absolute", top: 8, right: 8, zIndex: 10, color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.4), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) } }}><CloseIcon /></IconButton>
                    <Box sx={{ width: "100%", aspectRatio: "16/10", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "common.black" }}>
                        <Box component="img" src={urls[safeLbIdx]} alt={`Photo ${safeLbIdx + 1}`} referrerPolicy="no-referrer" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </Box>
                    {urls.length > 1 && (<>
                        <IconButton onClick={() => setLbIdx((p) => (p - 1 + urls.length) % urls.length)} sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.45), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) } }}><ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton onClick={() => setLbIdx((p) => (p + 1) % urls.length)} sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.45), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) } }}><ArrowForwardIosRoundedIcon sx={{ fontSize: 18 }} /></IconButton>
                        <Box sx={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", color: "common.white", fontSize: "0.82rem", fontWeight: 700, bgcolor: (t) => alpha(t.palette.common.black, 0.5), px: 1.5, py: 0.35, borderRadius: 999 }}>{safeLbIdx + 1} / {urls.length}</Box>
                    </>)}
                </Box>
                {urls.length > 1 && (
                    <Stack direction="row" spacing={0.75} sx={{ p: 1.5, overflowX: "auto", bgcolor: "common.black" }}>
                        {urls.map((url, i) => (
                            <Box key={i} component="img" src={url} alt="" onClick={() => setLbIdx(i)} referrerPolicy="no-referrer"
                                 sx={{ width: 56, height: 56, objectFit: "cover", borderRadius: 1.5, cursor: "pointer", flexShrink: 0, border: "2px solid", borderColor: i === safeLbIdx ? "common.white" : "transparent", opacity: i === safeLbIdx ? 1 : 0.5, transition: "all 150ms ease", "&:hover": { opacity: 0.9 } }} />
                        ))}
                    </Stack>
                )}
            </Dialog>
        </Box>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ServiceDetailPanel
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ServiceDetailPanel({
                                               detailService,
                                               detailCatInfo,
                                               detailLocation,
                                               detailProviderName,
                                               detailPriceLabel,
                                               detailIsOwnListing,
                                               detailAllowsReviews,
                                               detailAllowsMessages,
                                               detailFav,
                                               detailFavCount,
                                               detailMenuAnchor,
                                               detailMenuOpen,
                                               detailHoursExpanded,
                                               setDetailHoursExpanded,
                                               setDetailMenuAnchor,
                                               providerProfileAvatar,
                                               serviceDetailTab,
                                               setServiceDetailTab,
                                               svcDescExpanded,
                                               setSvcDescExpanded,
                                               svcReviews,
                                               svcReviewsTotal,
                                               svcReviewsLoading,
                                               svcReviewSort,
                                               setSvcReviewSort,
                                               svcRespondingId,
                                               setSvcRespondingId,
                                               svcRespondText,
                                               setSvcRespondText,
                                               setSvcReviewMenuAnchor,
                                               setSvcReviewMenuReview,
                                               resolvedUserId,
                                               loggedInUser,
                                               navigate,
                                               auth,
                                               handleDetailFavorite,
                                               handleShareService,
                                               handleRequestQuote,
                                               handleRespondToReview,
                                               openSvcReviewForm,
                                               setReportTarget,
                                               setReportReason,
                                               setReportDetails,
                                               setReportConfirmed,
                                               setReportDialogOpen,
                                               setReportSnack,
                                               onSuccess,
                                               setRightTab,
                                               setUserAnchor,
                                               setUserForCard,
                                               setFocusServiceId,
                                               formatDetailFavCount,
                                               providerInfo,
                                               viewerIsOwner,
                                               highlightReviewId = null,
                                               highlightReviewerId = null,
                                               svcHighlightReviewId = null,
                                               onMessage = null,
                                           }) {
    // ── Mobile detection ──
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // Merge highlight sources: prop from ServicesPage notification nav, or direct prop
    const effectiveHighlightId = svcHighlightReviewId || highlightReviewId || null;

    // Boost highlighted review to top so the user sees it immediately
    const sortedSvcReviews = useMemo(() => {
        if (!effectiveHighlightId && !highlightReviewerId) return svcReviews;
        const idx = svcReviews.findIndex((r) => {
            if (effectiveHighlightId && (String(r.id) === String(effectiveHighlightId) || Number(r.id) === Number(effectiveHighlightId))) return true;
            if (highlightReviewerId && Number(r.reviewerId) === Number(highlightReviewerId)) return true;
            return false;
        });
        if (idx <= 0) return svcReviews;
        const copy = [...svcReviews];
        const [target] = copy.splice(idx, 1);
        copy.unshift(target);
        return copy;
    }, [svcReviews, effectiveHighlightId, highlightReviewerId]);

    // ── Review photo lightbox state ──
    const [rvLbPhotos, setRvLbPhotos] = React.useState([]);
    const [rvLbIndex, setRvLbIndex] = React.useState(0);
    const [rvLbOpen, setRvLbOpen] = React.useState(false);
    const openReviewPhotoLightbox = React.useCallback((photos, index) => {
        setRvLbPhotos(photos);
        setRvLbIndex(index);
        setRvLbOpen(true);
    }, []);

    // ── Photo comments/likes state (must be before any early returns) ──
    const [photoCommentsOpen, setPhotoCommentsOpen] = React.useState(false);
    const [photoCommentsType, setPhotoCommentsType] = React.useState('avatar');
    const [photoCommentsPhotoId, setPhotoCommentsPhotoId] = React.useState(null);
    const [photoCommentsPhotoUrl, setPhotoCommentsPhotoUrl] = React.useState(null);
    const [serviceGalleryPhotos, setServiceGalleryPhotos] = React.useState([]);
    const [serviceGalleryLoaded, setServiceGalleryLoaded] = React.useState(false);

    const openAvatarComments = React.useCallback(() => {
        const avatarUrl = detailService?.serviceAvatarUrl || detailService?.service_avatar_url;
        if (!avatarUrl || !detailService?.id) return;
        setPhotoCommentsType('avatar');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [detailService?.serviceAvatarUrl, detailService?.service_avatar_url, detailService?.id]);

    const openCoverComments = React.useCallback(() => {
        const coverUrl = detailService?.coverUrl || detailService?.cover_url;
        if (!coverUrl || !detailService?.id) return;
        setPhotoCommentsType('cover');
        setPhotoCommentsPhotoId(null);
        setPhotoCommentsPhotoUrl(null);
        setPhotoCommentsOpen(true);
    }, [detailService?.coverUrl, detailService?.cover_url, detailService?.id]);

    const openGalleryPhotoComments = React.useCallback((photoId, photoUrl) => {
        if (!photoId) return;
        setPhotoCommentsType('gallery');
        setPhotoCommentsPhotoId(photoId);
        setPhotoCommentsPhotoUrl(photoUrl || null);
        setPhotoCommentsOpen(true);
    }, []);

    // Fetch gallery photos with DB IDs
    React.useEffect(() => {
        if (!detailService?.id) return;
        let alive = true;
        (async () => {
            try {
                const r = await axios.get(`/api/services/photos/${encodeURIComponent(detailService.id)}`, { withCredentials: true });
                const items = Array.isArray(r.data?.photos) ? r.data.photos : [];
                if (alive) { setServiceGalleryPhotos(items); setServiceGalleryLoaded(true); }
            } catch { if (alive) setServiceGalleryLoaded(true); }
        })();
        return () => { alive = false; };
    }, [detailService?.id]);

    if (!detailService) return null;

    // ── Defensive own-listing check ──
    // If the parent didn't compute detailIsOwnListing correctly (e.g. profile popup),
    // fall back to comparing the service's provider identity against the logged-in user.
    const isOwn = (() => {
        if (detailIsOwnListing) return true;
        if (!loggedInUser) return false;
        const provType = detailService.providerType || detailService.provider_type;
        const provId = String(detailService.providerId || detailService.provider_id || '');
        const uid = String(loggedInUser.id || loggedInUser.user_id || '');
        if (provType === 'user' && provId && uid && provId === uid) return true;
        return false;
    })();

    return (
        <Stack spacing={0} sx={{ overflow: "hidden" }}>
            {/* ═══ COVER PHOTO ═══ */}
            {(detailService.coverUrl || detailService.cover_url) && (
                <Box sx={{ position: "relative", width: "100%", height: { xs: 160, sm: 180, md: 200 }, bgcolor: "grey.200", overflow: "hidden", cursor: "pointer" }}
                     onClick={openCoverComments}>
                    <Box component="img" src={detailService.coverUrl || detailService.cover_url} alt="Cover"
                         sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </Box>
            )}

            {/* ═══ HEADER ═══ */}
            <Box sx={{ px: { xs: 2.5, md: 2 }, pt: { xs: 2.5, md: 2 } }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    {(() => {
                        // The detail header shows the SERVICE's own branding avatar.
                        // Falls back to the category icon — NOT the provider's profile picture.
                        const detailAvatarBase = detailService.serviceAvatarUrl || detailService.service_avatar_url || null;
                        const detailAvatarSrc = detailAvatarBase || null;
                        const DetailFallbackIcon = detailCatInfo?.Icon || PersonRoundedIcon;
                        return (
                            <Avatar
                                src={detailAvatarSrc || undefined}
                                onClick={() => { if (detailAvatarSrc) openAvatarComments(); }}
                                sx={(t) => ({
                                    width: { xs: 64, md: 70 },
                                    height: { xs: 64, md: 70 },
                                    flexShrink: 0,
                                    border: "3px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.15),
                                    boxShadow: `0 2px 10px ${alpha(t.palette.common.black, 0.1)}`,
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    color: t.palette.primary.main,
                                    cursor: detailAvatarSrc ? "pointer" : "default",
                                })}
                            >
                                <DetailFallbackIcon sx={{ fontSize: { xs: 32, md: 36 } }} />
                            </Avatar>
                        );
                    })()}
                    <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                        {/* On mobile: title row with just the kebab menu; on desktop: title only (actions are in their own Stack below) */}
                        <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 950, fontSize: { xs: 17, sm: 19 }, lineHeight: 1.15, letterSpacing: "-0.02em", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                    {detailService.title}
                                </Typography>
                                {(detailService.subtitle || detailService.summary) && (
                                    <Typography sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary", mt: 0.15, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                        {detailService.subtitle || detailService.summary}
                                    </Typography>
                                )}
                            </Box>
                            {/* Mobile: kebab menu in top-right next to title */}
                            {isMobile && (
                                <IconButton size="small" onClick={(e) => setDetailMenuAnchor(e.currentTarget)} sx={(t) => ({ border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, width: 32, height: 32, flexShrink: 0, bgcolor: "background.paper", color: 'text.secondary', "&:hover": { bgcolor: "action.hover", color: 'text.primary' } })}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            )}
                            {/* Desktop: full action buttons inline */}
                            {!isMobile && (
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0, mt: 0.25 }}>
                                    <Tooltip title={detailFav ? "Remove from favorites" : "Add to favorites"} arrow>
                                        <Box onClick={handleDetailFavorite}
                                             sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.75, py: 0.3, borderRadius: 999, cursor: "pointer", border: "1px solid", borderColor: detailFav ? (t) => alpha(t.palette.secondary.main, 0.4) : "divider", bgcolor: detailFav ? (t) => alpha(t.palette.secondary.main, 0.08) : "background.paper", transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { bgcolor: detailFav ? (t) => alpha(t.palette.secondary.main, 0.15) : "action.hover" }, "&:active": { transform: "scale(0.97)" } }}>
                                            {detailFav ? <StarRoundedIcon sx={{ fontSize: 16, color: "secondary.main" }} /> : <StarBorderRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                                            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: detailFav ? "secondary.main" : "text.secondary", lineHeight: 1 }}>{detailFavCount > 0 ? formatDetailFavCount(detailFavCount) : "0"}</Typography>
                                        </Box>
                                    </Tooltip>
                                    {isOwn && (
                                        <Button size="small" variant="outlined" startIcon={<EditRoundedIcon sx={{ fontSize: "14px !important" }} />} onClick={() => navigate(`/services/${detailService.id}/console`)} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 900, fontSize: "0.72rem", px: 1.1, height: 30, minWidth: 0, whiteSpace: "nowrap", bgcolor: "background.paper" }}>
                                            Edit Profile
                                        </Button>
                                    )}
                                    <IconButton size="small" onClick={(e) => setDetailMenuAnchor(e.currentTarget)} sx={(t) => ({ border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, width: 32, height: 32, bgcolor: "background.paper", color: 'text.secondary', "&:hover": { bgcolor: "action.hover", color: 'text.primary' } })}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            )}
                        </Stack>
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            {detailCatInfo && (
                                <Chip icon={detailCatInfo.Icon ? <detailCatInfo.Icon sx={{ fontSize: "14px !important" }} /> : undefined} label={detailCatInfo.name} size="small"
                                      sx={(t) => ({ fontWeight: 800, fontSize: 11, height: 24, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.25), "& .MuiChip-label": { px: 0.9, lineHeight: 1 }, "& .MuiChip-icon": { ml: 0.5, color: t.palette.primary.main } })} />
                            )}
                            {(detailService.licensedInsured || detailService.licensed_insured) && (
                                <Chip icon={<VerifiedRoundedIcon sx={{ fontSize: "12px !important" }} />} label="Licensed & Insured" size="small"
                                      sx={{ fontWeight: 800, fontSize: 10, height: 22, bgcolor: (t) => alpha(t.palette.success.main, 0.1), color: "success.dark", border: "1px solid", borderColor: (t) => alpha(t.palette.success.main, 0.25), "& .MuiChip-icon": { color: "success.main" } }} />
                            )}
                        </Box>
                        {detailAllowsReviews && (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                <Rating value={Number(detailService.reviewAvg || detailService.review_avg || 0)} precision={0.5} readOnly size="small" sx={{ "& .MuiRating-icon": { fontSize: 16 } }} />
                                <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>({detailService.reviewCount || detailService.review_count || svcReviewsTotal || 0})</Typography>
                            </Stack>
                        )}
                    </Box>
                </Stack>

                {/* Mobile: action buttons on their own row below avatar+title */}
                {isMobile && (
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1.25 }}>
                        <Tooltip title={detailFav ? "Remove from favorites" : "Add to favorites"} arrow>
                            <Box onClick={handleDetailFavorite}
                                 sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, px: 0.75, py: 0.3, borderRadius: 999, cursor: "pointer", border: "1px solid", borderColor: detailFav ? (t) => alpha(t.palette.secondary.main, 0.4) : "divider", bgcolor: detailFav ? (t) => alpha(t.palette.secondary.main, 0.08) : "background.paper", transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { bgcolor: detailFav ? (t) => alpha(t.palette.secondary.main, 0.15) : "action.hover" }, "&:active": { transform: "scale(0.97)" } }}>
                                {detailFav ? <StarRoundedIcon sx={{ fontSize: 16, color: "secondary.main" }} /> : <StarBorderRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: detailFav ? "secondary.main" : "text.secondary", lineHeight: 1 }}>{detailFavCount > 0 ? formatDetailFavCount(detailFavCount) : "0"}</Typography>
                            </Box>
                        </Tooltip>
                        {isOwn && (
                            <Button size="small" variant="outlined" startIcon={<EditRoundedIcon sx={{ fontSize: "14px !important" }} />} onClick={() => navigate(`/services/${detailService.id}/console`)} sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 900, fontSize: "0.72rem", px: 1.1, height: 30, minWidth: 0, whiteSpace: "nowrap", bgcolor: "background.paper" }}>
                                Edit Profile
                            </Button>
                        )}
                    </Stack>
                )}

                {/* Shared menu (both mobile & desktop) */}
                <Menu anchorEl={detailMenuAnchor} open={detailMenuOpen} onClose={() => setDetailMenuAnchor(null)} disableScrollLock onClick={(e) => e.stopPropagation()} sx={{ zIndex: 10000 }} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }} PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200, py: 0.5 } }}>
                    <MenuItem onClick={() => { setDetailMenuAnchor(null); navigator.clipboard?.writeText(`${window.location.origin}/services/${detailService?.id}`); if (onSuccess) onSuccess("Link copied"); }} sx={{ py: 1 }}>
                        <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>
                    {!isOwn && (
                        <MenuItem onClick={() => { setDetailMenuAnchor(null); if (!loggedInUser) { try { if (auth && typeof auth.open === 'function') auth.open(); else if (auth?.openLoginPopup) auth.openLoginPopup(); else if (auth?.openLoginModal) auth.openLoginModal(); else if (auth?.openLogin) auth.openLogin(); else if (auth?.requireAuth) auth.requireAuth(); } catch {} try { window.dispatchEvent(new CustomEvent('open-auth-modal')); window.dispatchEvent(new CustomEvent('open-login')); window.dispatchEvent(new CustomEvent('open-auth-dialog')); window.dispatchEvent(new CustomEvent('open-login-popup')); } catch {} return; } setReportTarget("service"); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }} sx={{ py: 1 }}>
                            <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Report" />
                        </MenuItem>
                    )}
                </Menu>
                {/* Phone & Email */}
                {(() => {
                    const svcPhone = (detailService.phoneNumber || detailService.phone_number || "").trim();
                    const svcEmail = (detailService.emailAddress || detailService.email_address || "").trim();
                    if (!svcPhone && !svcEmail) return null;
                    return (
                        <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                            {svcPhone && (
                                <Stack direction="row" spacing={0.5} alignItems="center" component="a" href={`tel:${svcPhone.replace(/[^\d+]/g, "")}`}
                                       sx={{ textDecoration: "none", cursor: "pointer", "&:hover .ci-icon": { color: "secondary.main" }, "&:hover .ci-text": { color: "secondary.main", textDecoration: "underline" } }}>
                                    <PhoneRoundedIcon className="ci-icon" sx={{ fontSize: 14, color: "primary.main", transition: "color 0.15s" }} />
                                    <Typography className="ci-text" sx={{ fontSize: 12, color: "text.primary", fontWeight: 700, transition: "color 0.15s" }}>
                                        {svcPhone}
                                    </Typography>
                                </Stack>
                            )}
                            {svcEmail && (
                                <Stack direction="row" spacing={0.5} alignItems="center" component="a" href={`mailto:${svcEmail}`}
                                       sx={{ textDecoration: "none", cursor: "pointer", "&:hover .ci-icon": { color: "secondary.main" }, "&:hover .ci-text": { color: "secondary.main", textDecoration: "underline" } }}>
                                    <EmailRoundedIcon className="ci-icon" sx={{ fontSize: 14, color: "primary.main", transition: "color 0.15s" }} />
                                    <Typography className="ci-text" sx={{ fontSize: 12, color: "text.primary", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}>
                                        {svcEmail}
                                    </Typography>
                                </Stack>
                            )}
                        </Stack>
                    );
                })()}
                {/* Address — far left */}
                {detailLocation && (
                    <Stack direction="row" spacing={0.5} alignItems="center"
                           onClick={() => { setRightTab("map"); if (detailService?.id) setFocusServiceId(String(detailService.id)); }}
                           sx={{ mt: 1, cursor: "pointer", "&:hover .loc-text": { color: "secondary.main" }, "&:hover .loc-icon": { color: "secondary.main" } }}>
                        <LocationOnRoundedIcon className="loc-icon" sx={{ fontSize: 14, color: "primary.main", transition: "color 0.15s" }} />
                        <Typography className="loc-text" sx={{ fontSize: 12, fontWeight: 700, color: "primary.main", transition: "color 0.15s" }}>{detailLocation}</Typography>
                    </Stack>
                )}
                {/* Hours (left) + Social icons (right) */}
                {(() => {
                    const hObj = detailService.availabilityHours || detailService.availability_hours;
                    const hStat = getHoursStatus(hObj);
                    const hParsed = parseHoursToArray(hObj);
                    const socLinks = [
                        { url: detailService.websiteUrl || detailService.website_url, icon: <LanguageRoundedIcon sx={{ fontSize: 15 }} />, label: "Website", color: "text.secondary" },
                        { url: detailService.facebookUrl || detailService.facebook_url, icon: <FacebookIcon sx={{ fontSize: 15 }} />, label: "Facebook", color: "#1877F2" },
                        { url: detailService.instagramUrl || detailService.instagram_url, icon: <InstagramIcon sx={{ fontSize: 15 }} />, label: "Instagram", color: "#C13584" },
                        { url: detailService.twitterUrl || detailService.twitter_url, icon: <XIcon sx={{ fontSize: 13 }} />, label: "X", color: "text.primary" },
                        { url: detailService.youtubeUrl || detailService.youtube_url, icon: <YouTubeIcon sx={{ fontSize: 15 }} />, label: "YouTube", color: "#FF0000" },
                        { url: detailService.tiktokUrl || detailService.tiktok_url, icon: <LinkIcon sx={{ fontSize: 15 }} />, label: "TikTok", color: "text.secondary" },
                    ].filter((l) => l.url);
                    return (
                        <>
                            <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {hStat && (
                                        <Stack direction="row" spacing={0.5} alignItems="center"
                                               onClick={() => setDetailHoursExpanded((v) => !v)}
                                               sx={{ cursor: "pointer", py: 0.25, userSelect: "none", "&:hover": { opacity: 0.8 } }}>
                                            <AccessTimeRoundedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                                            <Typography sx={{ fontSize: 12, fontWeight: 800, color: hStat.open ? "success.main" : "error.main" }}>{hStat.open ? "Open" : "Closed"}</Typography>
                                            {hStat.label && !/^(Open 24 hours|Closed now)$/.test(hStat.label) && (
                                                <>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>&middot;</Typography>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{hStat.label.replace(/^(Open|Closed)\s*·?\s*/i, "")}</Typography>
                                                </>
                                            )}
                                            {hStat.label === "Open 24 hours" && (
                                                <>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>&middot;</Typography>
                                                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>24 hours</Typography>
                                                </>
                                            )}
                                            <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: "text.secondary", transition: "transform 0.2s", transform: detailHoursExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                                        </Stack>
                                    )}
                                </Box>
                                {socLinks.length > 0 && (
                                    <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                                        {socLinks.map((sl) => (
                                            <Tooltip key={sl.label} title={sl.label} arrow placement="top">
                                                <Box component="a" href={sl.url.startsWith("http") ? sl.url : `https://${sl.url}`} target="_blank" rel="noopener noreferrer"
                                                     sx={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.text.primary, 0.06), color: sl.color, cursor: "pointer", textDecoration: "none", "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.12) } }}>
                                                    {sl.icon}
                                                </Box>
                                            </Tooltip>
                                        ))}
                                    </Stack>
                                )}
                            </Stack>
                            {hParsed && (
                                <Collapse in={detailHoursExpanded}>
                                    <Box sx={(t) => ({ mt: 0.75, bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1), borderRadius: 2, px: 1.5, py: 0.75 })}>
                                        <Stack spacing={0}>
                                            {hParsed.map((h, i) => (
                                                <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.4, borderBottom: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: "none" } }}>
                                                    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary", minWidth: 65 }}>{h.day}</Typography>
                                                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: h.closed ? "text.disabled" : "text.secondary" }}>
                                                        {h.closed ? "Closed" : h.allDay ? "Open 24 hours" : (h.open && h.close) ? `${formatTimeStr(h.open)} \u2013 ${formatTimeStr(h.close)}` : "\u2014"}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Collapse>
                            )}
                        </>
                    );
                })()}
            </Box>

            {/* ═══ PROVIDED BY — mobile only, in header area ═══ */}
            {isMobile && (() => {
                const pType = (detailService.providerType || detailService.provider_type || "").toLowerCase();
                const provAvatarSrc = providerProfileAvatar || detailService.providerAvatar || detailService.provider_avatar;
                return (
                    <Box sx={{ px: 2.5, mt: 1.5 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                            Provided By
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center"
                               onClick={() => { const h = detailService.providerHandle || detailService.provider_handle; if (h) navigate("/" + h); }}
                               sx={{ cursor: "pointer", borderRadius: 2, p: 0.75, mx: -0.75, transition: "background 0.15s", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) } }}>
                            <Avatar
                                src={provAvatarSrc || undefined}
                                imgProps={{ referrerPolicy: "no-referrer" }}
                                sx={(t) => ({
                                    width: 32, height: 32, flexShrink: 0,
                                    border: "1.5px solid", borderColor: "divider",
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    color: t.palette.primary.main,
                                    "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                                })}
                            >
                                {pType === "business" ? <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />
                                    : pType === "music" ? <MusicNoteRoundedIcon sx={{ fontSize: 16 }} />
                                        : <PersonRoundedIcon sx={{ fontSize: 16 }} />}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{detailProviderName}</Typography>
                                {(detailService.providerHandle || detailService.provider_handle) && <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>@{detailService.providerHandle || detailService.provider_handle}</Typography>}
                            </Box>
                            <OpenInNewRoundedIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />
                        </Stack>
                    </Box>
                );
            })()}

            {/* ═══ CTA BUTTONS ═══ */}
            <Divider sx={{ mt: 1.5 }} />
            <Stack direction="row" spacing={1} sx={{ px: { xs: 2.5, md: 2 }, pt: 1.5, pb: 1 }}>
                {!isOwn && detailAllowsMessages && (
                    <Button variant="contained" fullWidth startIcon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: "18px !important" }} />}
                            onClick={() => {
                                if (onMessage) {
                                    onMessage(detailService);
                                } else {
                                    handleRequestQuote(detailService);
                                }
                            }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1 }}>
                        Message
                    </Button>
                )}
                {!isMobile && (
                    <Button variant={isOwn ? "contained" : "outlined"} fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                            onClick={() => {
                                try {
                                    sessionStorage.setItem("ll:services:navigatedToService", "1");
                                    sessionStorage.setItem("ll:services:tab", "all");
                                    const el = document.querySelector("[data-services-scroll]");
                                    if (el) sessionStorage.setItem("ll:services:scrollTop", String(el.scrollTop || 0));
                                } catch { /* ignore */ }
                                navigate(`/services/${detailService.id}`, { state: { fromServices: true } });
                            }}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, ...(isOwn ? {} : { borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }) }}>
                        View Service Page
                    </Button>
                )}
            </Stack>

            {/* ─── Sticky Tabs Container ─── */}
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
                <Tabs value={serviceDetailTab} onChange={(_e, v) => setServiceDetailTab(v)}
                      variant="fullWidth"
                      sx={(t) => ({
                          minHeight: { xs: 48, sm: 38 },
                          flexShrink: 0,
                          borderRadius: 0,
                          padding: 0,
                          backgroundColor: "transparent",
                          border: "none",
                          boxShadow: "none",
                          borderBottom: "1px solid",
                          borderColor: alpha(t.palette.primary.main, 0.12),
                          "& .MuiTab-root": {
                              minHeight: { xs: 48, sm: 38 },
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: { xs: "0.6rem", sm: 13.5 },
                              letterSpacing: "-0.01em",
                              py: 0,
                              px: { xs: 0.5, sm: 1 },
                              minWidth: 0,
                              borderRadius: 0,
                              gap: 0.15,
                              flexDirection: { xs: "column", sm: "row" },
                              color: t.palette.text.secondary,
                              "&:hover": { color: t.palette.text.primary },
                          },
                          "& .MuiTab-iconWrapper": {
                              mr: { xs: 0, sm: 0.5 },
                              mb: { xs: 0.25, sm: 0 },
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
                      })}>
                    <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: { xs: 16, sm: 16 } }} />} iconPosition="start" label="About" value={0} />
                    {(detailService.latitude && detailService.longitude) && (
                        <Tab icon={<LocationOnRoundedIcon sx={{ fontSize: { xs: 16, sm: 16 } }} />} iconPosition="start" label="Location" value={1} />
                    )}
                    <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: { xs: 16, sm: 16 } }} />} iconPosition="start"
                         label="Photos" value={2} />
                    {detailAllowsReviews && (
                        <Tab icon={<ReviewsRoundedIcon sx={{ fontSize: { xs: 16, sm: 16 } }} />} iconPosition="start"
                             label="Reviews" value={3} />
                    )}
                </Tabs>
            </Box>

            {/* ══ TAB 0: ABOUT ══ */}
            {serviceDetailTab === 0 && (
                <Box>
                    {/* Provided By — top of About tab (desktop only; mobile shows this in header) */}
                    <Box sx={{ px: { xs: 2.5, md: 2 }, pt: 1.5, display: { xs: 'none', md: 'block' } }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                            Provided By
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center"
                               onClick={() => { const h = detailService.providerHandle || detailService.provider_handle; if (h) navigate("/" + h); }}
                               sx={{ cursor: "pointer", borderRadius: 2, p: 0.75, mx: -0.75, transition: "background 0.15s", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) } }}>
                            {(() => {
                                const pType = (detailService.providerType || detailService.provider_type || "").toLowerCase();
                                const provAvatarSrc = providerProfileAvatar || detailService.providerAvatar || detailService.provider_avatar;
                                return (
                                    <Avatar
                                        src={provAvatarSrc || undefined}
                                        imgProps={{ referrerPolicy: "no-referrer" }}
                                        sx={(t) => ({
                                            width: 28, height: 28, flexShrink: 0,
                                            border: "1.5px solid", borderColor: "divider",
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            color: t.palette.primary.main,
                                            "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                                        })}
                                    >
                                        {pType === "business" ? <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />
                                            : pType === "music" ? <MusicNoteRoundedIcon sx={{ fontSize: 14 }} />
                                                : <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                    </Avatar>
                                );
                            })()}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 12, lineHeight: 1.2 }}>{detailProviderName}</Typography>
                                {(detailService.providerHandle || detailService.provider_handle) && <Typography sx={{ fontSize: 10, fontWeight: 600, color: "text.secondary" }}>@{detailService.providerHandle || detailService.provider_handle}</Typography>}
                            </Box>
                        </Stack>
                    </Box>

                    <Divider sx={{ mx: { xs: 2.5, md: 2 }, mt: 2, mb: 0, display: { xs: 'none', md: 'block' } }} />

                    {/* About / Description */}
                    {(detailService.description || detailService.summary) && (() => {
                        const descText = detailService.description || "";
                        const isLong = descText.length > 220;
                        return (
                            <Box sx={{ px: { xs: 2.5, md: 2 }, pt: 2 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1, wordBreak: "break-word", overflowWrap: "anywhere" }}>About {detailService.title || "This Service"}</Typography>
                                <Box sx={{ position: "relative", maxHeight: svcDescExpanded || !isLong ? "none" : 150, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                                    <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                        {descText}
                                    </Typography>
                                    {!svcDescExpanded && isLong && (
                                        <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${t.palette.background.paper})` })} />
                                    )}
                                </Box>
                                {isLong && (
                                    <Button size="small" onClick={() => setSvcDescExpanded((p) => !p)}
                                            sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, color: "primary.main", mt: 0.5, pl: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                                        {svcDescExpanded ? "Show less" : "Read more"}
                                    </Button>
                                )}
                            </Box>
                        );
                    })()}

                    {/* Highlight Sections */}
                    {(() => {
                        const hlSections = detailService.highlightSections || detailService.highlight_sections || [];
                        if (!Array.isArray(hlSections) || hlSections.length === 0) return null;
                        return hlSections.filter((s) => s.title || s.body || s.photoUrl || s.photo_url).map((sec, idx) => (
                            <Box key={idx} sx={{ px: { xs: 2.5, md: 2 }, pt: 2 }}>
                                <Box sx={(t) => ({ borderRadius: 2.5, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                    <Box sx={(t) => ({ px: 2, py: 1, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", gap: 0.75 })}>
                                        <HlIconRender name={sec.iconName || sec.icon || "Star"} sx={{ fontSize: 17, color: "primary.main" }} />
                                        <Typography sx={{ fontWeight: 900, fontSize: 12, color: "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                            {sec.title || "Highlight"}
                                        </Typography>
                                    </Box>
                                    {(sec.photoUrl || sec.photo_url || sec.body) && (
                                        <Box sx={{ p: 1.75, overflow: "hidden" }}>
                                            {(sec.photoUrl || sec.photo_url) && (
                                                <Box component="img" src={sec.photoUrl || sec.photo_url} alt={sec.title}
                                                     sx={{ float: "left", width: { xs: "100%", sm: 150 }, height: "auto", maxHeight: 261, objectFit: "contain", borderRadius: 2, mr: 1.75, mb: 0.75, display: "block" }} />
                                            )}
                                            {sec.body && (
                                                <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                                    {sec.body}
                                                </Typography>
                                            )}
                                            <Box sx={{ clear: "both" }} />
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ));
                    })()}

                    {/* Services Offered Chips */}
                    {(() => {
                        const svcList = detailService.servicesOffered || detailService.services_offered || [];
                        if (!Array.isArray(svcList) || svcList.length === 0) return null;
                        return (
                            <>
                                <Divider sx={{ mx: { xs: 2.5, md: 2 }, mt: 2, mb: 0 }} />
                                <Box sx={{ px: { xs: 2.5, md: 2 }, pt: 2 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>Services Offered</Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                        {svcList.map((svc) => (
                                            <Chip key={svc} label={svc} size="small" variant="outlined"
                                                  sx={(t) => ({ fontWeight: 700, fontSize: 11.5, borderColor: alpha(t.palette.text.primary, 0.12) })} />
                                        ))}
                                    </Box>
                                </Box>
                            </>
                        );
                    })()}

                    {/* Certifications */}
                    {(() => {
                        const certs = Array.isArray(detailService.certifications) ? detailService.certifications.filter((c) => c.name?.trim()) : [];
                        if (certs.length === 0) return null;
                        return (
                            <>
                                <Divider sx={{ mx: { xs: 2.5, md: 2 }, mt: 2, mb: 0 }} />
                                <Box sx={{ px: { xs: 2.5, md: 2 }, pt: 2 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                                        <VerifiedRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} /> Certifications
                                    </Typography>
                                    <Stack spacing={0.75}>
                                        {certs.map((cert, idx) => (
                                            <Box key={idx} sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08) })}>
                                                <Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1.2 }}>{cert.name}</Typography>
                                                {(cert.issuer || cert.year) && (
                                                    <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600, mt: 0.25 }}>
                                                        {[cert.issuer, cert.year].filter(Boolean).join(" \u00b7 ")}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            </>
                        );
                    })()}

                    <Box sx={{ height: 16 }} />
                </Box>
            )}

            {/* ══ TAB 1: LOCATION ══ */}
            {serviceDetailTab === 1 && (() => {
                const svc = detailService;
                const loc = detailLocation || svc.locationLabel || svc.location_label || "";
                const svcIsStatewide = svc.isStatewide || svc.is_statewide;
                const svcLat = svc.latitude;
                const svcLng = svc.longitude;
                const svcStreet = svc.streetAddress || svc.street_address || "";
                const svcCounty = svc.county || "";
                const svcCity = svc.city || "";
                const hasCoords = svcLat && svcLng;
                const hasStreet = Boolean(String(svcStreet).trim());
                const mapsQ = encodeURIComponent(
                    svcStreet || [svcCity, svcCounty ? svcCounty + " County" : "", "Alabama"].filter(Boolean).join(", ") || "Alabama"
                );
                return (
                    <Box sx={{ px: { xs: 2.5, md: 2 }, pt: 2, pb: 3 }}>
                        <Stack spacing={1.5}>
                            <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                {hasCoords && (() => {
                                    const mapMode = hasStreet ? "place" : "view";
                                    const mapZoom = hasStreet ? 12 : 10;
                                    const mapSrc = `https://www.google.com/maps/embed/v1/${mapMode}?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${svcLat},${svcLng}${mapMode === "place" ? "&q=" + mapsQ : ""}&zoom=${mapZoom}`;
                                    return (
                                        <Box component="a" href={"https://www.google.com/maps/search/?api=1&query=" + mapsQ} target="_blank" rel="noopener noreferrer" sx={{ display: "block", textDecoration: "none" }}>
                                            <Box component="iframe" src={mapSrc} sx={{ width: "100%", height: 220, border: 0, display: "block", pointerEvents: "none" }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Service location" />
                                            <Box sx={{ py: 0.75, px: 2.5, bgcolor: "primary.main", color: "common.white", display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                                                <LocationOnRoundedIcon sx={{ fontSize: 15 }} />
                                                <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Get Directions</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })()}
                                <Box sx={{ p: 2, pt: hasCoords ? 1.5 : 2 }}>
                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                                        <LocationOnRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                        <Typography sx={{ fontWeight: 900, fontSize: "0.88rem" }}>Location</Typography>
                                    </Stack>
                                    <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.secondary" }}>
                                        {svcIsStatewide ? "Alabama (Statewide)" : loc}
                                    </Typography>
                                    {hasCoords && !hasStreet && (
                                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>
                                            {"Location shown is approximate for the " + (svcCounty ? svcCounty + " County" : "selected") + " area"}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                );
            })()}

            {/* ══ TAB 2: PHOTOS ══ */}
            {serviceDetailTab === 2 && (() => {
                const svcPhotos = Array.isArray(detailService.photos) ? detailService.photos.filter((p) => p && (p.url || typeof p === "string")) : [];
                // Prefer gallery photos with DB IDs for like/comment support
                const gallery = serviceGalleryLoaded && serviceGalleryPhotos.length > 0
                    ? serviceGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0))
                    : svcPhotos.map((p, i) => typeof p === "string" ? { id: i, url: p } : p);
                if (gallery.length === 0) return (
                    <Box
                        sx={{
                            py: 6,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <PhotoLibraryRoundedIcon sx={{ fontSize: 48, color: "primary.main" }} />
                        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>
                            No photos yet
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 260 }}>
                            Photos will appear here once this service adds them.
                        </Typography>
                    </Box>
                );
                return <DetailPhotoGallery photos={gallery} onPhotoClick={(p) => { if (p?.id && typeof p.id === 'number') openGalleryPhotoComments(p.id, p.url); }} />;
            })()}

            {/* ══ TAB 3: REVIEWS ══ */}
            {detailAllowsReviews && serviceDetailTab === 3 && (() => {
                const loggedInUserId = resolvedUserId;
                const isOwnListing = isOwn || viewerIsOwner;
                const myReview = svcReviews.find((r) => r.reviewerId === loggedInUserId);
                const canWrite = !isOwnListing && !myReview;
                const hasReviews = svcReviews.length > 0;

                if (svcReviewsLoading && !hasReviews) return (
                    <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}><PulsingDots /></Box>
                );

                const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                svcReviews.forEach((r) => { const s = Math.round(r.rating); if (s >= 1 && s <= 5) ratingCounts[s]++; });
                const avgRating = hasReviews ? svcReviews.reduce((sum, r) => sum + r.rating, 0) / svcReviews.length : 0;
                const maxCount = Math.max(1, ...Object.values(ratingCounts));

                return (
                    <Stack spacing={2} sx={{ px: { xs: 2.5, md: 2 }, pt: 2, pb: 3 }}>
                        {/* Summary Header */}
                        {hasReviews && (
                            <Box sx={(t) => ({ p: 2, borderRadius: 2.5, bgcolor: alpha(t.palette.text.primary, 0.015), border: "1px solid", borderColor: alpha(t.palette.divider, 0.5) })}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box sx={{ textAlign: "center", minWidth: 72 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "2rem", lineHeight: 1, color: "text.primary" }}>{avgRating.toFixed(1)}</Typography>
                                        <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}>
                                            <Rating value={avgRating} precision={0.5} readOnly size="small" />
                                        </Box>
                                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 700, mt: 0.25 }}>
                                            {svcReviewsTotal} review{svcReviewsTotal !== 1 ? "s" : ""}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <Stack key={star} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.35 }}>
                                                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, width: 10, textAlign: "right" }}>{star}</Typography>
                                                <StarRoundedIcon sx={{ fontSize: 13, color: "warning.main" }} />
                                                <LinearProgress variant="determinate" value={(ratingCounts[star] / maxCount) * 100}
                                                                sx={(t) => ({ flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(t.palette.text.primary, 0.06), "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: "warning.main" } })} />
                                                <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: "text.secondary", minWidth: 20, textAlign: "right" }}>{ratingCounts[star]}</Typography>
                                            </Stack>
                                        ))}
                                    </Box>
                                </Stack>
                            </Box>
                        )}

                        {/* Sort + Write */}
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel sx={{ fontSize: 12, fontWeight: 700 }}>Sort</InputLabel>
                                <Select value={svcReviewSort} label="Sort" onChange={(e) => setSvcReviewSort(e.target.value)}
                                        sx={{ fontSize: 12, fontWeight: 700, borderRadius: 2 }}
                                        MenuProps={{ disableScrollLock: true, sx: { zIndex: 10003 }, PaperProps: { sx: { borderRadius: 2.5 } } }}>
                                    <MenuItem value="newest" sx={{ fontSize: 12 }}>Newest</MenuItem>
                                    <MenuItem value="highest" sx={{ fontSize: 12 }}>Highest</MenuItem>
                                    <MenuItem value="lowest" sx={{ fontSize: 12 }}>Lowest</MenuItem>
                                </Select>
                            </FormControl>
                            {canWrite && (
                                <Button size="small" variant="outlined" startIcon={<RateReviewRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                        onClick={() => openSvcReviewForm(null)}
                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12 }}>
                                    Write a Review
                                </Button>
                            )}
                        </Stack>

                        {/* Review list */}
                        {!hasReviews ? (
                            <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                <ReviewsRoundedIcon sx={{ fontSize: 44, color: "primary.main" }} />
                                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>
                                    {isOwnListing ? "No reviews on your service yet" : "No reviews yet"}
                                </Typography>
                                <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 280 }}>
                                    {isOwnListing
                                        ? "When customers share their experience, their reviews will show up here."
                                        : "Be the first to share your experience with this service."}
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                {sortedSvcReviews.map((review) => {
                                    const isOwn = review.reviewerId === loggedInUserId;
                                    const reviewPhotos = Array.isArray(review.photoUrls) ? review.photoUrls.filter(Boolean)
                                        : Array.isArray(review.photo_urls) ? review.photo_urls.filter(Boolean) : [];
                                    const displayName = review.reviewerName || "User";
                                    const isHighlighted = Boolean(effectiveHighlightId || highlightReviewerId) && (
                                        String(review.id) === String(effectiveHighlightId) ||
                                        Number(review.id) === Number(effectiveHighlightId) ||
                                        (highlightReviewerId && Number(review.reviewerId) === Number(highlightReviewerId))
                                    );
                                    return (
                                        <Box
                                            key={review.id}
                                            data-service-review-id={review.id}
                                            id={isHighlighted ? `review-highlight-${review.id}` : undefined}
                                            sx={(t) => ({
                                                py: 2,
                                                px: isHighlighted ? 1.5 : 0,
                                                ...(isHighlighted ? {
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
                                            {/* Header row: avatar, name, rating, time, 3-dot */}
                                            <Stack direction="row" spacing={1.25} alignItems="flex-start">
                                                <Avatar
                                                    src={review.reviewerAvatar || undefined}
                                                    imgProps={{ referrerPolicy: "no-referrer" }}
                                                    onClick={review.reviewerAvatar ? (e) => { setUserAnchor(e.currentTarget); setUserForCard({ id: review.reviewerId, handle: review.reviewerHandle, first_name: review.reviewerName, avatar_url: review.reviewerAvatar }); } : undefined}
                                                    sx={(t) => ({
                                                        width: 36, height: 36, flexShrink: 0, mt: 0.25,
                                                        cursor: review.reviewerAvatar ? "pointer" : "default",
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
                                                        <Typography
                                                            sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.2, cursor: "pointer", "&:hover": { textDecoration: "underline" },
                                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%",
                                                            }}
                                                            onClick={(e) => { setUserAnchor(e.currentTarget); setUserForCard({ id: review.reviewerId, handle: review.reviewerHandle, first_name: review.reviewerName, avatar_url: review.reviewerAvatar }); }}
                                                        >
                                                            {displayName}
                                                        </Typography>
                                                        {isOwn && <Chip label="You" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 900 }} />}
                                                    </Stack>
                                                    {review.reviewerHandle && (
                                                        <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>
                                                            @{review.reviewerHandle}
                                                        </Typography>
                                                    )}
                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                                        <Rating
                                                            value={Number(review.rating)}
                                                            precision={0.5}
                                                            readOnly
                                                            size="small"
                                                            sx={{ "& .MuiRating-icon": { fontSize: 15 } }}
                                                        />
                                                        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600 }}>
                                                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                                        </Typography>
                                                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                                                            <Typography sx={{ fontSize: "0.6rem", color: "text.disabled", fontWeight: 600, fontStyle: "italic" }}>(edited)</Typography>
                                                        )}
                                                    </Stack>
                                                </Box>
                                                {(isOwn || loggedInUserId) && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => { setSvcReviewMenuAnchor(e.currentTarget); setSvcReviewMenuReview(review); }}
                                                        sx={(t) => ({ width: 32, height: 32, flexShrink: 0, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } })}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Stack>

                                            {/* Title */}
                                            {(review.reviewTitle || review.title) && (
                                                <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", mt: 1, lineHeight: 1.3 }}>
                                                    {review.reviewTitle || review.title}
                                                </Typography>
                                            )}

                                            {/* Body */}
                                            {review.reviewText && (
                                                <Typography sx={{ fontSize: "0.84rem", color: "text.primary", lineHeight: 1.6, mt: (review.reviewTitle || review.title) ? 0.5 : 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                    {review.reviewText}
                                                </Typography>
                                            )}

                                            {/* Photos */}
                                            {reviewPhotos.length > 0 && (
                                                <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                                    {reviewPhotos.map((url, i) => (
                                                        <Box key={i} onClick={() => openReviewPhotoLightbox(reviewPhotos, i)} sx={{ position: "relative", width: 88, height: 88, flexShrink: 0, borderRadius: 2, overflow: "hidden", cursor: "pointer", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.05)" }, "&:hover .ll-rv-zoom": { opacity: 1 }, "&:hover": { boxShadow: (t) => t.custom?.shadows?.xs || "0 1px 4px rgba(0,0,0,0.1)" } }}>
                                                            <Box component="img" src={url} alt={`Review photo ${i + 1}`} referrerPolicy="no-referrer"
                                                                 sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: (t) => `transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}` }} />
                                                            <Box className="ll-rv-zoom" sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: "opacity 200ms ease", pointerEvents: "none" }}>
                                                                <Typography sx={{ color: "common.white", fontSize: 18, fontWeight: 700 }}>⌕</Typography>
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            )}

                                            {/* Provider Response */}
                                            {review.providerResponse && (
                                                <Box sx={(t) => ({ mt: 1.5, ml: 2, pl: 1.5, py: 1.25, borderLeft: "3px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 8px 8px 0" })}>
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                                                        {providerInfo?.providerAvatar ? (
                                                            <Avatar src={providerInfo.providerAvatar} imgProps={{ referrerPolicy: "no-referrer" }}
                                                                    sx={{ width: 28, height: 28, "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" } }} />
                                                        ) : (
                                                            <Avatar sx={(t) => ({ width: 28, height: 28, bgcolor: alpha(t.palette.primary.main, 0.12), color: t.palette.primary.main })}>
                                                                <PersonRoundedIcon sx={{ fontSize: 16 }} />
                                                            </Avatar>
                                                        )}
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <Typography sx={{ fontWeight: 900, fontSize: "0.78rem", lineHeight: 1.2 }}>
                                                                    {providerInfo?.providerName || detailProviderName || "Owner"}
                                                                </Typography>
                                                                <Chip icon={<StarRoundedIcon sx={{ fontSize: "10px !important" }} />} label="Owner" size="small"
                                                                      sx={{ height: 18, fontSize: "0.55rem", fontWeight: 900, bgcolor: "secondary.main", color: "common.white", "& .MuiChip-icon": { color: "common.white", ml: 0.25 }, "& .MuiChip-label": { px: 0.5 } }} />
                                                            </Stack>
                                                            {providerInfo?.providerHandle && (
                                                                <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>@{providerInfo.providerHandle}</Typography>
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                    <Typography sx={{ fontSize: "0.8rem", color: "text.primary", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                        {review.providerResponse}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Reply form for owner */}
                                            {isOwnListing && !review.providerResponse && (
                                                svcRespondingId === review.id ? (
                                                    <Box sx={(t) => ({ mt: 1.5, ml: 2, pl: 1.5, py: 1.5, borderLeft: "3px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 8px 8px 0" })}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: "0.75rem", color: "primary.dark", mb: 1 }}>Reply as Provider</Typography>
                                                        <TextField fullWidth multiline minRows={2} maxRows={4} placeholder="Write your response..." size="small" value={svcRespondText}
                                                                   onChange={(e) => setSvcRespondText(e.target.value.slice(0, 2000))} sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.82rem" } }} />
                                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                            <Button size="small" onClick={() => { setSvcRespondingId(null); setSvcRespondText(""); }} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.72rem" }}>Cancel</Button>
                                                            <Button size="small" variant="contained" disabled={!svcRespondText.trim()} onClick={() => handleRespondToReview(review.id)}
                                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem", borderRadius: 2 }}>Post Reply</Button>
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Button size="small" startIcon={<ReplayRoundedIcon sx={{ fontSize: 14 }} />}
                                                            onClick={() => { setSvcRespondingId(review.id); setSvcRespondText(""); }}
                                                            sx={{ mt: 1.25, color: "text.secondary", textTransform: "none", fontWeight: 600, fontSize: "0.72rem", borderRadius: 2, px: 1, minHeight: 0, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}>
                                                        Reply
                                                    </Button>
                                                )
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Stack>
                );
            })()}

            {/* ═══ Photo Comments Dialog ═══ */}
            {/* Boost Dialog z-index above the mobile slide-in panel (z-index 9999) */}
            {photoCommentsOpen && (
                <style>{`
                    .MuiDialog-root { z-index: 10001 !important; }
                `}</style>
            )}
            <PhotoCommentsDialog
                open={photoCommentsOpen}
                onClose={() => { setPhotoCommentsOpen(false); setPhotoCommentsPhotoId(null); setPhotoCommentsPhotoUrl(null); }}
                profileHandleOrId={detailService.id}
                viewerId={resolvedUserId || 0}
                isOwner={!!isOwn}
                photoType={photoCommentsType === 'gallery' ? undefined : photoCommentsType}
                photoId={photoCommentsType === 'gallery' ? photoCommentsPhotoId : undefined}
                photoUrl={photoCommentsType === 'gallery' ? photoCommentsPhotoUrl : undefined}
                apiPrefix="/api/services"
                onSuccess={onSuccess}
                allPhotos={photoCommentsType === 'gallery' ? (serviceGalleryLoaded && serviceGalleryPhotos.length > 0 ? serviceGalleryPhotos.filter((p) => p && p.url && (p.position == null || p.position >= 0)) : undefined) : undefined}
                onNavigatePhoto={photoCommentsType === 'gallery' ? (newPhotoId, newPhotoUrl) => {
                    setPhotoCommentsPhotoId(newPhotoId);
                    setPhotoCommentsPhotoUrl(newPhotoUrl || null);
                } : undefined}
            />

            {/* ═══ Review photo lightbox ═══ */}
            <Dialog
                open={rvLbOpen}
                onClose={() => setRvLbOpen(false)}
                maxWidth={false}
                fullScreen={isMobile}
                disableScrollLock
                sx={{ zIndex: 10002 }}
                PaperProps={{
                    sx: isMobile
                        ? {
                            bgcolor: '#000',
                            m: 0, borderRadius: 0,
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                        }
                        : {
                            bgcolor: 'rgba(0,0,0,0.92)',
                            borderRadius: 3,
                            maxWidth: '90vw', maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                        },
                }}
            >
                <IconButton
                    onClick={() => setRvLbOpen(false)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                >
                    <CloseIcon />
                </IconButton>
                {rvLbPhotos.length > 1 && (
                    <Typography sx={{
                        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, zIndex: 2,
                    }}>
                        {rvLbIndex + 1} / {rvLbPhotos.length}
                    </Typography>
                )}
                {rvLbPhotos[rvLbIndex] && (
                    <Box component="img" src={rvLbPhotos[rvLbIndex]} alt="" referrerPolicy="no-referrer"
                         sx={{ maxWidth: isMobile ? '100vw' : '85vw', maxHeight: '80vh', objectFit: 'contain', userSelect: 'none' }} />
                )}
                {rvLbPhotos.length > 1 && (
                    <>
                        <IconButton
                            onClick={() => setRvLbIndex((p) => (p - 1 + rvLbPhotos.length) % rvLbPhotos.length)}
                            sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                        >
                            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                            onClick={() => setRvLbIndex((p) => (p + 1) % rvLbPhotos.length)}
                            sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'common.white', bgcolor: (t) => alpha(t.palette.common.white, 0.15), '&:hover': { bgcolor: (t) => alpha(t.palette.common.white, 0.25) } }}
                        >
                            <ArrowForwardIosRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </>
                )}
            </Dialog>
        </Stack>

    );
}
