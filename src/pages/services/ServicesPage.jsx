// src/pages/services/ServicesPage.jsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { alpha, useTheme } from "@mui/material/styles";
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
    Drawer,
    Fade,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Radio,
    RadioGroup,
    Rating,
    Select,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

import PhotosUploadSection from "../../components/PhotosUploadSection";
import ShareServiceDialog from "../../components/ShareServiceDialog";
import ServiceDetailPanel from "./components/ServiceDetailPanel";
import SwipeableBottomDrawer from "../../components/SwipeableBottomDrawer";
import SwipeableRightDrawer from "../../components/SwipeableRightDrawer";
import SmartMenu from "../../components/SmartMenu";
import SuccessSnackbar, { useSuccessSnackbar } from "../../components/SuccessSnackbar";
import RichTextDisplay from "../../components/RichTextDisplay";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CloseIcon from "@mui/icons-material/Close";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PostAddRoundedIcon from "@mui/icons-material/PostAddRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import FrontHandRoundedIcon from "@mui/icons-material/FrontHandRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import { ReportDialog } from "../../components/ActionBar";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import LinkIcon from "@mui/icons-material/Link";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ForestRoundedIcon from "@mui/icons-material/Forest";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivism";
import GroupsRoundedIcon from "@mui/icons-material/Groups";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

import SearchInput from "../../components/SearchInput";
import UserCardPopover from "../../components/UserCardPopover";
import ServicesFilters from "./components/ServicesFilters";
import ServicesList from "./components/ServicesList";
import PulsingDots from "../../components/PulsingDots";
import ServiceRequestCard from "./components/ServiceRequestCard";
import RequestsOverviewPanel from "./components/RequestsOverviewPanel";
import ServicesMapTab from "./components/ServicesMapTab";
import ServiceDiscoverTab from "./components/ServiceDiscoverTab";
import useServicesFeed from "./hooks/useServicesFeed";
import CreateServiceRequestModal from "./modals/CreateServiceRequestModal";
import RespondToRequestModal from "./modals/RespondToRequestModal";
import { deleteService, requestQuote, deleteServiceRequest, fetchRequestResponses, acceptRequestResponse, declineRequestResponse, withdrawRequestResponse, closeServiceRequest, fetchServiceReviews, checkReviewEligibility, createServiceReview, updateServiceReview, deleteServiceReview, respondToReview, reportService, reportServiceRequest, fetchServiceLimits, fetchServiceRequests, fetchServiceById } from "./api/servicesApi";
import { toggleServiceFavorite } from "./api/serviceFavoritesApi";
import { useActiveAccount } from "../../components/AccountContext";
import { useAuth } from "../../components/AuthModalContext";
import { isNetworkError } from "../../components/NetworkErrorState";
import { formatPriceRange, getServiceCategoryInfo, SERVICE_CATEGORIES } from "./utils/serviceHelpers";
import { secureFetch } from "../../utils/secureFetch";
// Continuous subheader scroll-hide (Facebook-style tracking)
import useSubheaderScrollHide from "../../utils/useSubheaderScrollHide";
import {
    countiesWithinRadius,
    radiusLabel,
    isCountyOnly,
    getCountyCenter,
    STATEWIDE,
    DEFAULT_RADIUS_WHEN_COUNTY_SELECTED,
} from "../../utils/geoRadius";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../components/Header/Header";
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

// ─── Highlight Section Icon mapping (matches ServiceDiscoverTab / CreateServicePage) ──
/* ── Signed upload helpers (for review photos) ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}
async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

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

// ─── View‑option arrays (static – defined outside component to avoid re‑render loops) ──
const SERVICES_VIEW_OPTIONS = [
    { value: "all", label: "All Services", icon: VisibilityRoundedIcon },
    { value: "mine", label: "My Services", icon: PersonRoundedIcon },
    { value: "favorites", label: "Favorites", icon: FavoriteRoundedIcon },
    { value: "following", label: "Following", icon: PeopleOutlineRoundedIcon },
];

const REQUESTS_VIEW_OPTIONS = [
    { value: "all", label: "All Requests", icon: VisibilityRoundedIcon },
    { value: "mine", label: "My Requests", icon: PersonRoundedIcon },
    { value: "following", label: "Following", icon: PeopleOutlineRoundedIcon },
];

const BOTTOM_GUTTER_PX = 0;
const APP_BACKGROUND = "background.default";
const RIGHT_WIDTH = { xs: "40%", lg: "35%" };
const TAB_FADE_MS = 160;
const REQ_DESC_MAX_HEIGHT = 160; // px – collapsed description max height

// ─── Helper: convert a category slug like "beauty-personal-care" → "Beauty & Personal Care" ──
function formatCategoryName(slug) {
    if (!slug) return "";
    const info = getServiceCategoryInfo(slug);
    if (info?.name) return info.name;
    // Fallback: title-case the slug with hyphens replaced
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Empty-state message builders (outside component to avoid re-creation) ──

function getServiceEmptyStateMessages({ view, search, category, priceModel, city, county }) {
    const catName = formatCategoryName(category);
    // 1) View-specific messages take priority
    if (view === "mine") {
        return {
            headline: "No Services Posted Yet",
            subtitle: "Services you offer will appear here. Get started by creating your first service listing!",
        };
    }
    if (view === "favorites") {
        return {
            headline: "No saved services yet",
            subtitle: "Tap the heart icon on any service to save it here for quick access.",
        };
    }
    if (view === "following") {
        const locationParts = [city, county].filter(Boolean);
        if (locationParts.length > 0) {
            return {
                headline: `No services from people you follow in ${locationParts.join(", ")}`,
                subtitle: "Try removing the location filter or follow more service providers.",
            };
        }
        if (category) {
            return {
                headline: `No ${catName} services from people you follow`,
                subtitle: "Try a different category or follow more providers.",
            };
        }
        return {
            headline: "No services from people you follow",
            subtitle: "Follow people to see their service listings here.",
        };
    }

    // 2) "all" view — build context-aware messages from active filters
    const hasSearch = Boolean(search && search.trim());
    const hasCategory = Boolean(category);
    const hasCity = Boolean(city);
    const hasCounty = Boolean(county);
    const hasPriceModel = priceModel && priceModel !== "any";

    const activeFilterCount = [hasSearch, hasCategory, hasCity, hasCounty, hasPriceModel].filter(Boolean).length;

    if (hasSearch && activeFilterCount === 1) {
        return {
            headline: `No results for \u201c${search.trim()}\u201d`,
            subtitle: "Try different keywords or check your spelling.",
        };
    }
    if (hasCity && !hasCounty && activeFilterCount === 1) {
        return {
            headline: `No services found in ${city}`,
            subtitle: "Try expanding your search to the full county or browse all of Alabama.",
        };
    }
    if (hasCounty && !hasCity && activeFilterCount === 1) {
        return {
            headline: `No services found in ${county} County`,
            subtitle: "Try browsing all counties or adjusting your other filters.",
        };
    }
    if (hasCity && hasCounty && activeFilterCount === 2) {
        return {
            headline: `No services found in ${city}, ${county} County`,
            subtitle: "Try removing the city filter to see all services in the county.",
        };
    }
    if (hasCategory && activeFilterCount === 1) {
        return {
            headline: `No ${catName} services available`,
            subtitle: "Check back soon or try a different category.",
        };
    }
    if (hasCategory && (hasCity || hasCounty)) {
        const locationLabel = hasCity && hasCounty
            ? `${city}, ${county} County`
            : hasCity ? city : `${county} County`;
        return {
            headline: `No ${catName} services in ${locationLabel}`,
            subtitle: "Try removing the location or category filter to see more results.",
        };
    }
    if (hasSearch && (hasCity || hasCounty)) {
        const locationLabel = hasCity && hasCounty
            ? `${city}, ${county} County`
            : hasCity ? city : `${county} County`;
        return {
            headline: `No results for \u201c${search.trim()}\u201d in ${locationLabel}`,
            subtitle: "Try broader search terms or remove the location filter.",
        };
    }
    if (hasSearch && hasCategory) {
        return {
            headline: `No ${catName} services matching \u201c${search.trim()}\u201d`,
            subtitle: "Try different keywords or browse all categories.",
        };
    }
    if (activeFilterCount >= 2) {
        return {
            headline: "No services match your filters",
            subtitle: "Try removing some filters to see more results.",
        };
    }
    return {
        headline: "No Services Yet",
        subtitle: "Be the first to offer a service and help your community!",
    };
}

function getRequestEmptyStateMessages({ view, search, category, city, county, urgency, budgetType }) {
    const catName = formatCategoryName(category);
    if (view === "mine") {
        return {
            headline: "No Requests Posted Yet",
            subtitle: "Requests you\u2019ve submitted will appear here.",
        };
    }
    if (view === "following") {
        return {
            headline: "No requests from people you follow",
            subtitle: "Follow people to see their service requests here.",
        };
    }

    const hasSearch = Boolean(search && search.trim());
    const hasCategory = Boolean(category);
    const hasCity = Boolean(city);
    const hasCounty = Boolean(county);
    const hasUrgency = Boolean(urgency);
    const hasBudgetType = Boolean(budgetType);

    const activeFilterCount = [hasSearch, hasCategory, hasCity, hasCounty, hasUrgency, hasBudgetType].filter(Boolean).length;

    if (hasSearch && activeFilterCount === 1) {
        return {
            headline: `No requests matching \u201c${search.trim()}\u201d`,
            subtitle: "Try different keywords or check your spelling.",
        };
    }
    if (hasUrgency && activeFilterCount === 1) {
        return {
            headline: `No ${urgency === "asap" ? "ASAP" : urgency} requests right now`,
            subtitle: "Try a different urgency filter or browse all requests.",
        };
    }
    if (hasCategory && activeFilterCount === 1) {
        return {
            headline: `No ${catName} requests available`,
            subtitle: "Check back soon or try a different category.",
        };
    }
    if ((hasCity || hasCounty) && activeFilterCount <= 2 && !hasSearch && !hasCategory) {
        const locationLabel = hasCity && hasCounty
            ? `${city}, ${county} County`
            : hasCity ? city : `${county} County`;
        return {
            headline: `No requests found in ${locationLabel}`,
            subtitle: "Try expanding your search area or removing the location filter.",
        };
    }
    if (hasCategory && (hasCity || hasCounty)) {
        const locationLabel = hasCity && hasCounty
            ? `${city}, ${county} County`
            : hasCity ? city : `${county} County`;
        return {
            headline: `No ${catName} requests in ${locationLabel}`,
            subtitle: "Try removing the location or category filter to see more.",
        };
    }
    if (activeFilterCount >= 2) {
        return {
            headline: "No requests match your filters",
            subtitle: "Try removing some filters to see more results.",
        };
    }
    return {
        headline: "No Requests Yet",
        subtitle: "Be the first to submit a request and get help from your community!",
    };
}

/** Format large numbers: 1200 → "1.2k", 54300 → "54.3k", 999 → "999" */
function formatDetailFavCount(n) {
    if (n == null || n < 0) return "0";
    if (n < 1000) return String(n);
    const k = n / 1000;
    return k >= 100 ? `${Math.round(k)}k` : `${Math.round(k * 10) / 10}k`;
}

/** Shared keyframes for staggered card fade-in */
const REQ_FADE_KEYFRAMES = `
@keyframes reqCardFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}`;
let reqKeyframesInjected = false;
function ensureReqKeyframes() {
    if (reqKeyframesInjected) return;
    reqKeyframesInjected = true;
    const style = document.createElement("style");
    style.textContent = REQ_FADE_KEYFRAMES;
    document.head.appendChild(style);
}

// ─── Photo Gallery (marketplace-style: main photo + thumbnail strip) ─────────────────
function DetailPhotoGallery({ photos, onReport, isOwner }) {
    const [activePhoto, setActivePhoto] = React.useState(0);
    const [lbOpen, setLbOpen] = React.useState(false);
    const [lbIdx, setLbIdx] = React.useState(0);
    const items = Array.isArray(photos) ? photos.filter((p) => p && (p.url || typeof p === "string")) : [];
    const urls = items.map((p) => (typeof p === "string" ? p : p.url));

    if (urls.length === 0) return null;

    const safeActive = Math.max(0, Math.min(activePhoto, urls.length - 1));
    const mainImage = urls[safeActive] || urls[0];
    const safeLbIdx = Math.max(0, Math.min(lbIdx, urls.length - 1));

    const openLightbox = (i) => { setLbIdx(i); setLbOpen(true); };

    return (
        <Box sx={{ pt: 1 }}>
            {/* Main photo — click to open lightbox */}
            <Box
                onClick={() => openLightbox(safeActive)}
                sx={(t) => ({
                    position: "relative", cursor: "pointer", borderRadius: 2.5,
                    overflow: "hidden", bgcolor: alpha(t.palette.text.primary, 0.03),
                    "&:hover .photo-zoom-hint": { opacity: 1 },
                })}
            >
                <Box
                    component="img"
                    src={mainImage}
                    alt={`Photo ${safeActive + 1}`}
                    referrerPolicy="no-referrer"
                    sx={{ width: "100%", height: { xs: 240, sm: 300 }, objectFit: "contain", display: "block" }}
                />
                {/* Zoom hint overlay */}
                <Box
                    className="photo-zoom-hint"
                    sx={{
                        position: "absolute", inset: 0,
                        bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0,
                        transition: (t) => `opacity ${t.custom?.motion?.base || 200}ms ${t.custom?.motion?.ease || 'ease'}`,
                        pointerEvents: "none",
                    }}
                >
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <PhotoLibraryRoundedIcon sx={{ fontSize: 14, color: "common.white" }} />
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white" }}>View full size</Typography>
                    </Box>
                </Box>
                {/* Photo counter badge */}
                {urls.length > 1 && (
                    <Box sx={{ position: "absolute", bottom: 8, right: 8, px: 1, py: 0.3, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(4px)" }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white" }}>{safeActive + 1} / {urls.length}</Typography>
                    </Box>
                )}
            </Box>

            {/* Thumbnail strip */}
            {urls.length > 1 && (
                <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: "auto", pb: 0.5, WebkitOverflowScrolling: "touch", "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { borderRadius: 999, bgcolor: (t) => alpha(t.palette.text.primary, 0.15) } }}>
                    {urls.map((url, idx) => (
                        <Box key={idx} onClick={() => setActivePhoto(idx)}
                             sx={(t) => ({
                                 width: 56, height: 56, borderRadius: 1.5, overflow: "hidden",
                                 cursor: "pointer", flexShrink: 0,
                                 border: "2.5px solid",
                                 borderColor: idx === safeActive ? t.palette.primary.main : alpha(t.palette.text.primary, 0.08),
                                 opacity: idx === safeActive ? 1 : 0.65,
                                 transition: `all ${t.custom?.motion?.fast || 100}ms ${t.custom?.motion?.ease || 'ease'}`,
                                 "&:hover": { opacity: 1, transform: "scale(1.05)" },
                             })}>
                            <Box component="img" src={url} alt="" referrerPolicy="no-referrer"
                                 sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </Box>
                    ))}
                </Stack>
            )}

            {/* Fullscreen lightbox dialog */}
            <Dialog
                open={lbOpen}
                onClose={() => setLbOpen(false)}
                maxWidth="md"
                fullWidth
                fullScreen
                disableScrollLock
                sx={{ zIndex: 10002 }}
                PaperProps={{ sx: { borderRadius: 0, bgcolor: "common.black", overflow: "hidden" } }}
            >
                <Box sx={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                    <IconButton
                        onClick={() => setLbOpen(false)}
                        sx={{
                            position: "absolute", top: 8, right: 8, zIndex: 10,
                            color: "common.white",
                            bgcolor: (t) => alpha(t.palette.common.black, 0.4),
                            "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {!isOwner && typeof onReport === 'function' && (
                        <IconButton
                            aria-label="Report photo"
                            onClick={() => { const p = items[safeLbIdx]; onReport('gallery', typeof p === 'string' ? p : p?.url, typeof p === 'string' ? null : p?.id || null); }}
                            sx={{ position: "absolute", top: 8, right: 52, zIndex: 10, color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.4), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.6) } }}
                        >
                            <FlagOutlinedIcon />
                        </IconButton>
                    )}
                    <Box sx={{ width: "100%", flex: 1, minHeight: { xs: 300, sm: 400 }, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "common.black" }}>
                        <Box
                            component="img"
                            src={urls[safeLbIdx]}
                            alt={`Photo ${safeLbIdx + 1}`}
                            referrerPolicy="no-referrer"
                            sx={{ maxWidth: "100%", maxHeight: { xs: "80vh", sm: "70vh" }, objectFit: "contain" }}
                        />
                    </Box>
                    {urls.length > 1 && (
                        <>
                            <IconButton
                                onClick={() => setLbIdx((p) => (p - 1 + urls.length) % urls.length)}
                                sx={{
                                    position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                                    color: "common.white",
                                    bgcolor: (t) => alpha(t.palette.common.black, 0.45),
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
                                }}
                            >
                                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                onClick={() => setLbIdx((p) => (p + 1) % urls.length)}
                                sx={{
                                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                                    color: "common.white",
                                    bgcolor: (t) => alpha(t.palette.common.black, 0.45),
                                    "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
                                }}
                            >
                                <ArrowForwardIosRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Box sx={{
                                position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                                color: "common.white", fontSize: "0.82rem", fontWeight: 700,
                                bgcolor: (t) => alpha(t.palette.common.black, 0.5),
                                px: 1.5, py: 0.35, borderRadius: 999,
                            }}>
                                {safeLbIdx + 1} / {urls.length}
                            </Box>
                        </>
                    )}
                </Box>
                {urls.length > 1 && (
                    <Stack direction="row" spacing={0.75} sx={{ p: 1.5, overflowX: "auto", bgcolor: "common.black" }}>
                        {urls.map((url, i) => (
                            <Box
                                key={i}
                                component="img"
                                src={url}
                                alt=""
                                onClick={() => setLbIdx(i)}
                                referrerPolicy="no-referrer"
                                sx={{
                                    width: 56, height: 56, objectFit: "cover",
                                    borderRadius: 1.5, cursor: "pointer", flexShrink: 0,
                                    border: "2px solid",
                                    borderColor: i === safeLbIdx ? "common.white" : "transparent",
                                    opacity: i === safeLbIdx ? 1 : 0.5,
                                    transition: "all 150ms ease",
                                    "&:hover": { opacity: 0.9 },
                                }}
                            />
                        ))}
                    </Stack>
                )}
            </Dialog>
        </Box>
    );
}

/* ── SectionHeading (matches BusinessDetailPanel) ── */
function SectionHeading({ icon: Icon, children }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
            {Icon && <Icon sx={{ fontSize: 18, color: "primary.main" }} />}
            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{children}</Typography>
        </Stack>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SERVICE MESSAGE RATE-LIMIT TRACKER (sessionStorage-backed, shared across pages)
   Tracks per-recipient (provider), 5 msgs / 10 min window.
   Uses sessionStorage so limits carry over between ServiceDetailPage,
   ServicesPage, and ServiceDetailPanel within the same browser session.
   ═══════════════════════════════════════════════════════════════════════════ */
const _SVC_QUOTE_MSG_WINDOW = 10 * 60 * 1000;
const _SVC_QUOTE_MSG_MAX = 5;
const _SVC_MSG_STORAGE_PREFIX = "ll:svcMsgTrack:";

function _getSvcMsgEntries(recipientKey) {
    const now = Date.now();
    const storageKey = _SVC_MSG_STORAGE_PREFIX + String(recipientKey);
    try {
        const raw = sessionStorage.getItem(storageKey);
        if (!raw) return [];
        const entries = JSON.parse(raw).filter(t => now - t < _SVC_QUOTE_MSG_WINDOW);
        return entries;
    } catch { return []; }
}

function _trackSvcQuoteMsg(recipientKey) {
    const now = Date.now();
    const storageKey = _SVC_MSG_STORAGE_PREFIX + String(recipientKey);
    const entries = _getSvcMsgEntries(recipientKey);
    entries.push(now);
    try { sessionStorage.setItem(storageKey, JSON.stringify(entries)); } catch { /* */ }
}

function _isSvcQuoteLimited(recipientKey) {
    return _getSvcMsgEntries(recipientKey).length >= _SVC_QUOTE_MSG_MAX;
}

/** Build a consistent recipient key from a service object so rate-limits
 *  are shared across ServicesPage and ServiceDetailPage. */
function _svcRecipientKey(service) {
    const pType = (service?.providerType || service?.provider_type || "personal").toLowerCase();
    const pId = String(service?.providerId || service?.provider_id || "0");
    return `${pType}:${pId}`;
}

// ─── Response photo grid with lightbox (matches ServiceRequestDetailPage) ───
function ResponsePhotoGrid({ photos, onReport, isOwner }) {
    const _rpgTheme = useTheme();
    const _rpgMobile = useMediaQuery("(max-width:1439px)");
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
            <Box sx={{ mt: 1, mb: 1, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0.75, borderRadius: 2, overflow: "hidden" }}>
                {photoUrls.map((url, idx) => (
                    <Box key={idx} onClick={() => handleOpen(idx)} sx={{
                        position: "relative", paddingTop: photoUrls.length === 1 ? "56%" : "100%",
                        borderRadius: 1.5, overflow: "hidden", cursor: "pointer",
                        "&:hover .rp-overlay": { opacity: 1 },
                    }}>
                        <Box component="img" src={url} alt={`Photo ${idx + 1}`} sx={{
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
                    <CloseIcon />
                </IconButton>
                {!isOwner && typeof onReport === 'function' && (
                    <IconButton aria-label="Report photo" onClick={() => onReport('gallery', photoUrls[lightboxIdx], null)} sx={{ position: "absolute", top: 8, right: 52, zIndex: 2, color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                        <FlagOutlinedIcon />
                    </IconButton>
                )}
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
                            <ArrowBackIosNewRoundedIcon />
                        </IconButton>
                        <IconButton onClick={handleNext} sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                            <ArrowForwardIosRoundedIcon />
                        </IconButton>
                    </>
                )}
            </Dialog>
        </>
    );
}

export default function ServicesPage({ user }) {
    const navigate = useNavigate();
    const loc = useLocation();
    const [chromeTop, setChromeTop] = useState(0);
    // When restoring from a back-nav, skip the entrance animation entirely so
    // the cached list appears instantly instead of fading/sliding in.
    const isBackNavRef = useRef(false);
    if (isBackNavRef.current === false) {
        let _bn = Boolean(loc?.state?.restoreServices);
        if (!_bn) try { _bn = sessionStorage.getItem("ll:services:restore") === "1"; } catch { /* */ }
        if (!_bn) try { _bn = sessionStorage.getItem("ll:services:navigatedToRequest") === "1"; } catch { /* */ }
        if (!_bn) try { _bn = sessionStorage.getItem("ll:services:navigatedToService") === "1"; } catch { /* */ }
        isBackNavRef.current = _bn || false;
    }
    const [pageVisible, setPageVisible] = useState(() => Boolean(isBackNavRef.current));

    const { activeAccount, accountCacheKey, activeBusinessId, activeArtistId } = useActiveAccount();
    const auth = useAuth();
    const loggedInUser = auth?.user || user;

    /** Robust login-popup opener — tries every known auth-context method, then
     *  dispatches custom events as fallback (matches PostPage pattern). */
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

    const resolvedUserId = useMemo(() => {
        const fromAuth = auth?.user?.id || auth?.user?.user_id;
        if (fromAuth) return fromAuth;
        const fromAccount = activeAccount?.user_id || activeAccount?.id;
        if (fromAccount) return fromAccount;
        try {
            const raw = localStorage.getItem("ll:activeAccount");
            const acct = raw ? JSON.parse(raw) : null;
            return acct?.user_id || acct?.id || null;
        } catch {
            return null;
        }
    }, [auth?.user, activeAccount]);

    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    // Photo report state
    const [photoReportOpen, setPhotoReportOpen] = useState(false);
    const [photoReportTarget, setPhotoReportTarget] = useState(null);

    const handlePhotoReportOpen = useCallback((photoType, photoUrl, photoId, ownerId) => {
        setPhotoReportTarget({ photoType, photoUrl: photoUrl || '', photoId: photoId || null, ownerId: Number(ownerId || 0) });
        setPhotoReportOpen(true);
    }, []);

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

    // ── Read cached filter state once (synchronous, for useState initializers) ──
    // Always restore from sessionStorage so filters persist across all navigation
    // (tab switches, other pages, etc.). sessionStorage clears on session end.
    const cachedFiltersRef = useRef(null);
    if (cachedFiltersRef.current === null) {
        let _cf = false;
        try {
            const raw = sessionStorage.getItem("ll:services:cachedItems");
            if (raw) {
                const parsed = JSON.parse(raw);
                _cf = {
                    search: parsed.search ?? "",
                    sort: parsed.sort ?? "any",
                    filters: parsed.filters ?? null,
                    serviceView: parsed.serviceView ?? "all",
                    requestsView: parsed.requestsView ?? "all",
                    requestsSort: parsed.requestsSort ?? "newest",
                    requestsFilters: parsed.requestsFilters ?? null,
                    leftMode: parsed.leftMode ?? null,
                    myServicesStatus: parsed.myServicesStatus ?? "active",
                };
            }
        } catch { /* ignore */ }
        cachedFiltersRef.current = _cf || false;
    }
    const _rf = cachedFiltersRef.current;

    const [search, setSearch] = useState(() => _rf ? _rf.search : "");
    const [searchDraft, setSearchDraft] = useState(() => _rf ? _rf.search : "");
    const [sort, setSort] = useState(() => _rf ? _rf.sort : "any");
    const [filters, setFilters] = useState(() => _rf && _rf.filters ? _rf.filters : {
        category: "",
        priceModel: "any",
        city: "",
        county: "",
        radius: STATEWIDE,
        statewideOnly: false,
    });

    // ── Radius expansion ──
    const expandedCounties = useMemo(
        () => countiesWithinRadius(filters.county, filters.radius),
        [filters.county, filters.radius]
    );

    // ── Map center/zoom — driven by county + radius ──
    const AL_CENTER = useMemo(() => [32.69, -86.79], []);
    const AL_ZOOM = 7;
    const [mapCenter, setMapCenter] = useState(AL_CENTER);
    const [mapZoom, setMapZoom] = useState(AL_ZOOM);

    useEffect(() => {
        if (filters.county) {
            const center = getCountyCenter(filters.county);
            if (center) {
                setMapCenter(center);
                const r = String(filters.radius);
                let zoom = 10;
                if (r === STATEWIDE)    zoom = AL_ZOOM;
                else if (r === '100')   zoom = 7.5;
                else if (r === '50')    zoom = 8;
                else if (r === '25')    zoom = 9;
                setMapZoom(zoom);
            }
        } else {
            setMapCenter(AL_CENTER);
            setMapZoom(AL_ZOOM);
        }
    }, [filters.county, filters.radius, AL_CENTER]);

    const [leftMode, setLeftMode] = useState(() => {
        // Check URL ?tab=requests first
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get("tab") === "requests") return "requests";
        } catch { /* ignore */ }
        // Check cached filter state from back-nav
        if (_rf && _rf.leftMode) return _rf.leftMode;
        // Check restore intent from sessionStorage (set by detail pages)
        try {
            if (sessionStorage.getItem("ll:services:restore") === "1" ||
                sessionStorage.getItem("ll:services:navigatedToRequest") === "1" ||
                sessionStorage.getItem("ll:services:navigatedToService") === "1") {
                const savedTab = sessionStorage.getItem("ll:services:tab");
                if (savedTab === "requests") return "requests";
                if (savedTab === "all") return "all";
            }
        } catch { /* ignore */ }
        return "all";
    });
    const [myServicesStatus, setMyServicesStatus] = useState(() => _rf ? _rf.myServicesStatus : "active");
    const [showFilters, setShowFilters] = useState(true);

    // Tab-switch content fade (matches CommunityPanel / BusinessHubPage behavior)
    const servicesTheme = useTheme();
    const isMobile = useMediaQuery("(max-width:1439px)");
    // Phone-only breakpoint (matches Community/Business/Events/Music/Jobs/Marketplace pattern).
    // Below this, the compact phone header (pill tabs + tiny icon cluster) is used as-is.
    const isPhoneServices = useMediaQuery("(max-width:899px)");
    // Tablet/laptop range (900–1439): header controls are promoted to labeled buttons
    // (search bar, Filters, Map, Offer Service / Request a Service) instead of hiding in tiny icon cluster.
    const isTabletServices = isMobile && !isPhoneServices;
    // Narrow end of tablet (900–1099): Filters / Map / create action collapse to icons.
    const isNarrowTabletServices = useMediaQuery("(min-width:900px) and (max-width:1099px)");

    // ── Mobile drawer state (mirrors CommunityPage mobile pattern) ──
    const [mobileMapOpen, setMobileMapOpen] = useState(false);

    // ── Close mobile map drawer on browser back button ──
    useEffect(() => {
        if (!mobileMapOpen) return;
        window.history.pushState({ serviceMap: true }, '');
        const handlePopState = () => { setMobileMapOpen(false); setMobileMapFilterOpen(false); };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mobileMapOpen]);
    const [mobileMapFilterOpen, setMobileMapFilterOpen] = useState(false);
    // 'list' = normal services/requests list, 'discover' = inline discover/overview content
    const [mobileView, setMobileView] = useState("list");
    const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);
    // Track if user came from mobile map so we can show "Return to Map" in detail header
    const [cameFromMobileMap, setCameFromMobileMap] = useState(false);

    // Note: Previously this page observed the body class `ll-mobile-nav-hidden`
    // to expand the container when the global nav hid on scroll. With the
    // continuous scroll-hide system (Header.jsx + `--ll-nav-offset`), the
    // global bars slide via transform and the container stays at its normal
    // size — no mid-scroll layout shift needed.

    // ── Mobile subheader fade (replaces translate-based scroll-hide) ──
    // Previously this used two `useSubheaderScrollHide` calls (one per scroll
    // container) to translateY the subheader and reclaim its vertical space
    // via negative margin-bottom. That produced jerky content shifts. The
    // subheader is now `position: sticky` under the global header and fades
    // via `opacity: calc(1 - var(--ll-nav-offset))`. Same CSS var as Header.jsx.
    const mobileHeaderRef = useRef(null);
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-services-scroll]',
        enabled: false,
    });
    useSubheaderScrollHide({
        headerRef: mobileHeaderRef,
        scrollTargetSelector: '[data-services-requests-scroll]',
        enabled: false,
    });

    // ── Write the live subheader height to --ll-subheader-height ──
    // The scroll containers reserve space via `padding-top: calc(header +
    // subheader)` so content doesn't sit under the floating chrome on
    // initial paint. ResizeObserver keeps the CSS var in sync with the
    // real height (filter chips, wrapping, etc.). Mobile only.
    useLayoutEffect(() => {
        if (!isMobile) {
            document.documentElement.style.removeProperty('--ll-subheader-height');
            return;
        }
        const el = mobileHeaderRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const apply = () => {
            const h = el.getBoundingClientRect().height;
            if (h > 0) {
                document.documentElement.style.setProperty('--ll-subheader-height', `${Math.ceil(h)}px`);
            }
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty('--ll-subheader-height');
        };
    }, [isMobile]);

    // ── Mobile pull-to-refresh ──────────────────────────────────────────
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartRef = useRef(null);
    const pullScrollRef = useRef(null);
    const PULL_THRESHOLD = 70;
    // refresh comes from useServicesFeed (declared further below). We store it
    // in a ref so the pull-to-refresh callback doesn't reference the const
    // before its declaration (temporal dead zone).
    const refreshRef = useRef(null);

    const handlePullTouchStart = useCallback((e) => {
        if (!isMobile || pullRefreshing) return;
        const el = e.currentTarget;
        if (el.scrollTop > 5) { pullStartRef.current = null; return; }
        pullStartRef.current = e.touches[0].clientY;
        pullScrollRef.current = el;
    }, [isMobile, pullRefreshing]);

    const handlePullTouchMove = useCallback((e) => {
        if (!isMobile || pullRefreshing || pullStartRef.current == null) return;
        const el = pullScrollRef.current;
        if (el && el.scrollTop > 5) { pullStartRef.current = null; setPullDistance(0); return; }
        const dy = e.touches[0].clientY - pullStartRef.current;
        if (dy > 0) setPullDistance(Math.min(dy * 0.45, 120));
        else setPullDistance(0);
    }, [isMobile, pullRefreshing]);

    const handlePullTouchEnd = useCallback(() => {
        if (!isMobile || pullRefreshing) return;
        if (pullDistance >= PULL_THRESHOLD) {
            setPullRefreshing(true);
            setPullDistance(0);
            if (typeof refreshRef.current === 'function') refreshRef.current();
            setTimeout(() => setPullRefreshing(false), 1200);
        } else {
            setPullDistance(0);
        }
        pullStartRef.current = null;
    }, [isMobile, pullRefreshing, pullDistance]);

    const tabFadeMs = servicesTheme.custom?.motion?.contentFade?.durationMs ?? TAB_FADE_MS;
    const tabFadeTimerRef = useRef(null);
    const [contentVisible, setContentVisible] = useState(true);

    useEffect(() => {
        return () => {
            if (tabFadeTimerRef.current) {
                clearTimeout(tabFadeTimerRef.current);
                tabFadeTimerRef.current = null;
            }
        };
    }, []);
    const [rightTab, setRightTab] = useState(() => {
        // Read from sessionStorage so the panel doesn't flash from "discover" → "detail".
        try {
            const raw = sessionStorage.getItem("ll:services:cachedItems");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.rightTab) return parsed.rightTab;
            }
        } catch { /* ignore */ }
        return "discover";
    });

    /* ── Scroll save / restore for both tabs ── */
    const shouldRestoreRef = useRef(null);
    const savedScrollTopRef = useRef(0);
    const restoreTabRef = useRef(null);
    // Track whether we're in a restore cycle — suppresses the listFadeIn flash
    // and request-card stagger animation on back-navigation.
    const isRestoringRef = useRef(false);
    // Cached items for back-nav restore (passed to useServicesFeed as initialItems)
    const cachedItemsRef = useRef(null);
    const cachedTotalCountRef = useRef(null);
    const cachedRequestItemsRef = useRef(null);
    const cachedRequestsTotalCountRef = useRef(null);
    const cachedSelectedServiceRef = useRef(null);
    const cachedSelectedRequestRef = useRef(null);
    const cachedRightTabRef = useRef(null);
    if (shouldRestoreRef.current === null) {
        let restoreIntent = Boolean(loc?.state?.restoreServices);
        if (!restoreIntent) {
            try { restoreIntent = sessionStorage.getItem("ll:services:restore") === "1"; } catch { /* ignore */ }
        }
        if (!restoreIntent) {
            try { restoreIntent = sessionStorage.getItem("ll:services:navigatedToRequest") === "1"; } catch { /* ignore */ }
        }
        if (!restoreIntent) {
            try { restoreIntent = sessionStorage.getItem("ll:services:navigatedToService") === "1"; } catch { /* ignore */ }
        }
        shouldRestoreRef.current = restoreIntent;
        isRestoringRef.current = restoreIntent;
        if (restoreIntent) {
            try { savedScrollTopRef.current = Number(sessionStorage.getItem("ll:services:scrollTop") || 0); } catch { savedScrollTopRef.current = 0; }
            try { restoreTabRef.current = sessionStorage.getItem("ll:services:tab") || null; } catch { restoreTabRef.current = null; }
            // Load cached items so the hook can skip the initial fetch
            try {
                const raw = sessionStorage.getItem("ll:services:cachedItems");
                if (raw) {
                    const parsed = JSON.parse(raw);
                    cachedItemsRef.current = parsed.items || null;
                    cachedTotalCountRef.current = parsed.totalCount ?? null;
                    cachedRequestItemsRef.current = parsed.requestItems || null;
                    cachedRequestsTotalCountRef.current = parsed.requestsTotalCount ?? null;
                    cachedSelectedServiceRef.current = parsed.selectedService || null;
                    cachedSelectedRequestRef.current = parsed.selectedRequest || null;
                    cachedRightTabRef.current = parsed.rightTab || null;
                }
            } catch { /* ignore */ }
        }
    }
    useEffect(() => {
        try { sessionStorage.removeItem("ll:services:restore"); } catch { /* ignore */ }
        try { sessionStorage.removeItem("ll:services:navigatedToRequest"); } catch { /* ignore */ }
        try { sessionStorage.removeItem("ll:services:navigatedToService"); } catch { /* ignore */ }

        // Safety net: if scroll restore never fires (e.g. list too short, no
        // saved position), clear the suppress flag after a generous timeout so
        // future filter changes still get their fade transitions.
        if (suppressFadeRef.current) {
            const safetyTimer = setTimeout(() => {
                suppressFadeRef.current = false;
                isRestoringRef.current = false;
            }, 2000);
            return () => clearTimeout(safetyTimer);
        }
    }, []);

    // Requests tab filters
    const [requestsView, setRequestsView] = useState(() => _rf ? _rf.requestsView : "all");
    const [serviceView, setServiceView] = useState(() => _rf ? _rf.serviceView : "all");
    const [requestsSort, setRequestsSort] = useState(() => _rf ? _rf.requestsSort : "newest");
    const [requestsFilters, setRequestsFilters] = useState(() => _rf && _rf.requestsFilters ? _rf.requestsFilters : {
        category: "",
        priceModel: "any",
        city: "",
        county: "",
        statewideOnly: false,
        urgency: "",
        budgetType: "",
    });

    // When location filters change, clear overview-driven selections (category, urgency)
    const prevReqLocationRef = useRef({
        city: _rf && _rf.requestsFilters ? _rf.requestsFilters.city || "" : "",
        county: _rf && _rf.requestsFilters ? _rf.requestsFilters.county || "" : "",
        statewideOnly: _rf && _rf.requestsFilters ? _rf.requestsFilters.statewideOnly || false : false,
    });
    useEffect(() => {
        const prev = prevReqLocationRef.current;
        const curr = { city: requestsFilters.city, county: requestsFilters.county, statewideOnly: requestsFilters.statewideOnly };
        if (prev.city !== curr.city || prev.county !== curr.county || prev.statewideOnly !== curr.statewideOnly) {
            setRequestsFilters((f) => {
                // Only produce a new object when there is something to reset
                if (f.category === "" && f.urgency === "") return f;
                return { ...f, category: "", urgency: "" };
            });
        }
        prevReqLocationRef.current = curr;
    }, [requestsFilters.city, requestsFilters.county, requestsFilters.statewideOnly]);

    // Map hover & focus
    const [hoveredServiceId, setHoveredServiceId] = useState(null);
    const [focusServiceId, setFocusServiceId] = useState(null);
    const [focusRequestId, setFocusRequestId] = useState(null);

    // ── Fresh page loads start statewide (All Counties / All Cities) ──
    //
    // This used to auto-populate county on both `filters` and
    // `requestsFilters` from the viewer's home_county. Product decision
    // (2026-04): fresh loads should start statewide, and narrower
    // defaults should be opt-in via the "Apply automatically when I
    // open this tab" checkbox on a saved filter (see SavedFiltersMenu +
    // ServicesFilters' auto-apply effect).
    const appliedHomeDefaultRef = useRef(false);
    useEffect(() => {
        if (appliedHomeDefaultRef.current) return;
        if (!loggedInUser) return;
        appliedHomeDefaultRef.current = true;
    }, [loggedInUser]);

    // Stable callbacks for map focus-handled (prevents infinite re-render loops in ServicesMapTab)
    const handleFocusServiceHandled = useCallback(() => setFocusServiceId(null), []);
    const handleFocusRequestHandled = useCallback(() => setFocusRequestId(null), []);

    const [selectedService, setSelectedService] = useState(() => cachedSelectedServiceRef.current);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Quote request state
    const [quoteService, setQuoteService] = useState(null);
    const [quoteSending, setQuoteSending] = useState(false);
    const [quoteMessage, setQuoteMessage] = useState("");
    const [quoteError, setQuoteError] = useState("");
    const [quoteSuccess, setQuoteSuccess] = useState(false);
    const [quotePhotos, setQuotePhotos] = useState([]);
    const [quoteCooldown, setQuoteCooldown] = useState(0);
    const [quoteLimitOpen, setQuoteLimitOpen] = useState(false);

    // Request CRUD state
    const [createRequestOpen, setCreateRequestOpen] = useState(false);
    const [editingRequestItem, setEditingRequestItem] = useState(null);
    const [limitDialog, setLimitDialog] = useState({ open: false, title: "", message: "" });
    const [selectedRequest, setSelectedRequest] = useState(() => cachedSelectedRequestRef.current);
    const [deleteRequestTarget, setDeleteRequestTarget] = useState(null);
    const [isDeletingRequest, setIsDeletingRequest] = useState(false);
    const [deleteRequestError, setDeleteRequestError] = useState(null);

    // Response state
    const [respondModalOpen, setRespondModalOpen] = useState(false);
    const [responses, setResponses] = useState([]);
    const [responsesLoading, setResponsesLoading] = useState(false);
    const [myResponse, setMyResponse] = useState(null);
    const [isRequesterOfSelected, setIsRequesterOfSelected] = useState(false);
    const [responseActionLoading, setResponseActionLoading] = useState(null); // responseId being acted on
    const [requestDetailTab, setRequestDetailTab] = useState(0);
    const [requestDescExpanded, setRequestDescExpanded] = useState(false);

    // Accept/Decline confirmation
    const [acceptConfirm, setAcceptConfirm] = useState(null); // { id, name }
    const [declineConfirm, setDeclineConfirm] = useState(null); // { id, name }

    // Mark-as-filled review prompt
    const [filledDialogOpen, setFilledDialogOpen] = useState(false);

    const [serviceDetailTab, setServiceDetailTab] = useState(0);
    const [detailHoursExpanded, setDetailHoursExpanded] = useState(false);
    const [svcDescExpanded, setSvcDescExpanded] = useState(false);

    // ── Provider profile avatar (fetched fresh for the "Provided By" section) ──
    const [providerProfileAvatar, setProviderProfileAvatar] = useState(null);

    // ── Reviews state ──
    const [svcReviews, setSvcReviews] = useState([]);
    const [svcReviewsTotal, setSvcReviewsTotal] = useState(0);
    const [svcReviewsLoading, setSvcReviewsLoading] = useState(false);
    const [svcReviewProviderInfo, setSvcReviewProviderInfo] = useState(null);
    const [viewerIsOwner, setViewerIsOwner] = useState(false);
    const [svcReviewSort, setSvcReviewSort] = useState("newest");
    const [svcReviewFormOpen, setSvcReviewFormOpen] = useState(false);
    const [svcReviewIneligible, setSvcReviewIneligible] = useState({ open: false, reason: "" });
    const [svcReviewRating, setSvcReviewRating] = useState(0);
    const [svcReviewTitle, setSvcReviewTitle] = useState("");
    const [svcReviewText, setSvcReviewText] = useState("");
    const [svcReviewPhotos, setSvcReviewPhotos] = useState([]);
    const [svcReviewSubmitting, setSvcReviewSubmitting] = useState(false);
    const [svcReviewError, setSvcReviewError] = useState("");
    const [svcReviewEditing, setSvcReviewEditing] = useState(null); // review object when editing
    const [svcReviewDeleteTarget, setSvcReviewDeleteTarget] = useState(null); // review to delete
    const [svcReviewDeleting, setSvcReviewDeleting] = useState(false);
    const [svcReviewMenuAnchor, setSvcReviewMenuAnchor] = useState(null);
    const [svcReviewMenuReview, setSvcReviewMenuReview] = useState(null);
    const [svcRespondingId, setSvcRespondingId] = useState(null);
    const [svcRespondText, setSvcRespondText] = useState("");

    // ── Detail 3-dot menu + report ──
    const [detailMenuAnchor, setDetailMenuAnchor] = useState(null);
    const [reqDetailMenuAnchor, setReqDetailMenuAnchor] = useState(null);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    // Highlight a specific review (from notification navigation)
    const [svcHighlightReviewId, setSvcHighlightReviewId] = useState(null);

    // ── Open a specific service from notification navigation state ──
    const pendingServiceNavRef = useRef(null);
    useEffect(() => {
        const st = loc?.state;
        if (!st?.openServiceId) return;
        pendingServiceNavRef.current = {
            serviceId: Number(st.openServiceId),
            scrollToReviews: Boolean(st.scrollToReviews),
            highlightReviewId: Number(st.highlightReviewId || 0) || null,
        };
        // Clear navigation state so refresh/back doesn't re-trigger
        navigate(loc.pathname, { replace: true, state: null });
    }, [loc?.state, loc?.pathname, navigate]);

    useEffect(() => {
        const pending = pendingServiceNavRef.current;
        if (!pending) return;
        pendingServiceNavRef.current = null;
        let alive = true;
        (async () => {
            try {
                const data = await fetchServiceById(pending.serviceId);
                if (!alive) return;
                const svc = data?.service || data;
                if (!svc || !svc.id) return;
                setSelectedService(svc);
                setRightTab("detail");
                if (isMobile) setMobileDetailOpen(true);
                if (pending.scrollToReviews) {
                    setServiceDetailTab(3); // reviews tab
                    if (pending.highlightReviewId) {
                        setSvcHighlightReviewId(pending.highlightReviewId);
                    }
                }
            } catch { /* ignore */ }
        })();
        return () => { alive = false; };
    }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear highlight after it's been visible
    useEffect(() => {
        if (!svcHighlightReviewId) return;
        const timer = setTimeout(() => setSvcHighlightReviewId(null), 6500);
        return () => clearTimeout(timer);
    }, [svcHighlightReviewId]);
    const [reportTarget, setReportTarget] = useState("service"); // "service" | "service_request" | "review"
    const [reportTargetReview, setReportTargetReview] = useState(null); // review object when reportTarget === "review"
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSnack, setReportSnack] = useState("");
    const [reportConfirmed, setReportConfirmed] = useState(false);

    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const detailMenuOpen = Boolean(detailMenuAnchor);
    const reqDetailMenuOpen = Boolean(reqDetailMenuAnchor);

    // Helper: resolve the correct avatar for a service request, accounting for
    // account-type mismatches (e.g. viewing a business request from personal account).
    const resolveRequestAvatarSrc = (req) => {
        if (!isRequesterOfSelected || !req) return req?.requesterAvatar || "";
        const acctType = String(activeAccount?.type || "personal").toLowerCase();
        const reqType = String(req.requesterType || req.requester_type || "").toLowerCase();
        const reqIsBusiness = reqType === "business" || !!(req.requesterBusinessId || req.requester_business_id);
        const reqIsArtist = reqType === "artist" || reqType === "music" || reqType === "music_artist" || !!(req.requesterArtistId || req.requester_artist_id);
        if (acctType === "business" && reqIsBusiness) return (activeAccount?.avatar_url || activeAccount?.logo_url || "").trim() || req.requesterAvatar;
        if (acctType === "artist" && reqIsArtist) return (activeAccount?.avatar_url || "").trim() || req.requesterAvatar;
        if (acctType !== "business" && acctType !== "artist" && !reqIsBusiness && !reqIsArtist) return (activeAccount?.avatar_url || loggedInUser?.avatar_url || loggedInUser?.profile_picture || "").trim() || req.requesterAvatar;
        return req.requesterAvatar || "";
    };

    const feedFilters = useMemo(() => ({
        ...filters,
        counties: expandedCounties,
    }), [filters, expandedCounties]);

    // Memoize feed options so useServicesFeed doesn't see a new object reference
    // on every render (which would trigger infinite re-fetch loops inside the hook).
    const feedOptions = useMemo(() => ({
        search, sort, filters: feedFilters, mode: leftMode, myServicesStatus,
        view: serviceView,
        requestsView, requestsFilters, requestsSearch: search,
        requestsSort,
        accountCacheKey,
        // Back-nav restore: seed the hook with cached data so it skips the initial fetch
        initialItems: cachedItemsRef.current,
        initialTotalCount: cachedTotalCountRef.current,
        initialRequestItems: cachedRequestItemsRef.current,
        initialRequestsTotalCount: cachedRequestsTotalCountRef.current,
    }), [search, sort, feedFilters, leftMode, myServicesStatus, serviceView, requestsView, requestsFilters, requestsSort, accountCacheKey]);

    const {
        items, isLoading, isEmpty, error, refresh, loadMore, hasMore, totalCount,
        categories, categoriesLoading,
        locationCounts,
        requestLocationCounts,
        myServices, myServicesLoading, myServicesError, myServicesTotalCount,
        requestItems, requestsLoading, requestsError, requestsTotalCount, refreshRequests, allRequestItems,
        updateItemFavorite,
    } = useServicesFeed(feedOptions);

    // Keep the pull-to-refresh ref in sync with the latest refresh function.
    refreshRef.current = refresh;

    // Sync selectedRequest with fresh feed data so cached/stale avatar URLs
    // get replaced by the live-hydrated values from the API.
    useEffect(() => {
        if (!selectedRequest || !Array.isArray(requestItems) || requestItems.length === 0) return;
        const fresh = requestItems.find((r) => String(r.id) === String(selectedRequest.id));
        if (fresh) {
            setSelectedRequest((prev) => ({
                ...fresh,
                status: prev?.status || fresh.status,
            }));
        }
    }, [requestItems]);

    // When request items were seeded from cache, the feed hook skips the initial
    // fetch.  Schedule a background refresh so hydrated avatars replace stale data.
    const didScheduleReqRefreshRef = useRef(false);
    useEffect(() => {
        if (didScheduleReqRefreshRef.current) return;
        if (cachedRequestItemsRef.current && typeof refreshRequests === 'function') {
            didScheduleReqRefreshRef.current = true;
            const t = setTimeout(() => refreshRequests(), 400);
            return () => clearTimeout(t);
        }
    }, [refreshRequests]);

    // ── Derive request-specific categories with counts from actual request data ──
    const requestCategories = useMemo(() => {
        const items = Array.isArray(allRequestItems) ? allRequestItems : [];
        if (items.length === 0 && Array.isArray(requestItems) ? requestItems.length > 0 : false) {
            // Fallback to filtered requestItems if allRequestItems not ready
        }
        const pool = items.length > 0 ? items : (Array.isArray(requestItems) ? requestItems : []);
        const countMap = {};
        for (const req of pool) {
            const slug = req.categorySlug || req.category_slug;
            if (!slug) continue;
            countMap[slug] = (countMap[slug] || 0) + 1;
        }
        // Build category objects from SERVICE_CATEGORIES — always show ALL categories
        // so the dropdown is complete. Categories with 0 count will be grayed out / disabled
        // by ServicesFilters, matching the pattern used on every other page.
        return (Array.isArray(SERVICE_CATEGORIES) ? SERVICE_CATEGORIES : []).map((cat) => ({
            slug: cat.slug,
            value: cat.slug,
            name: cat.name,
            label: cat.name,
            count: countMap[cat.slug] || 0,
        }));
    }, [allRequestItems, requestItems]);

    // Cache items AND filter state to sessionStorage so back-nav can restore without re-fetch
    useEffect(() => {
        try {
            sessionStorage.setItem("ll:services:cachedItems", JSON.stringify({
                items: Array.isArray(items) ? items : [],
                totalCount,
                requestItems: Array.isArray(requestItems) ? requestItems : [],
                requestsTotalCount,
                selectedService: selectedService || null,
                selectedRequest: selectedRequest || null,
                rightTab,
                // ── Persist filter state so back-nav restores filters exactly ──
                search,
                sort,
                filters,
                serviceView,
                requestsView,
                requestsSort,
                requestsFilters,
                leftMode,
                myServicesStatus,
            }));
        } catch { /* ignore — quota exceeded etc. */ }
    }, [items, totalCount, requestItems, requestsTotalCount, selectedService, selectedRequest, rightTab, search, sort, filters, serviceView, requestsView, requestsSort, requestsFilters, leftMode, myServicesStatus]);

    // Clear cached refs after mount so they don't leak into feedOptions on re-renders
    useEffect(() => {
        cachedItemsRef.current = null;
        cachedTotalCountRef.current = null;
        cachedRequestItemsRef.current = null;
        cachedRequestsTotalCountRef.current = null;
        cachedSelectedServiceRef.current = null;
        cachedSelectedRequestRef.current = null;
        cachedRightTabRef.current = null;
    }, []);

    // Persist scroll position as user scrolls (whichever tab is active)
    useEffect(() => {
        const onRequests = leftMode === "requests";
        const attr = onRequests ? "[data-services-requests-scroll]" : "[data-services-scroll]";
        const el = document.querySelector(attr);
        if (!el) return undefined;
        const onScroll = () => {
            try {
                sessionStorage.setItem("ll:services:scrollTop", String(el.scrollTop || 0));
                sessionStorage.setItem("ll:services:tab", onRequests ? "requests" : "all");
            } catch { /* ignore */ }
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        if (!shouldRestoreRef.current) onScroll();
        return () => { el.removeEventListener("scroll", onScroll); };
    }, [leftMode]);

    // Restore scroll position after data finishes loading
    useEffect(() => {
        if (!shouldRestoreRef.current) return;
        const onRequests = leftMode === "requests";
        const loading = onRequests ? requestsLoading : isLoading;
        if (loading) return;
        const top = savedScrollTopRef.current;
        if (!top || top <= 0) {
            shouldRestoreRef.current = false;
            isRestoringRef.current = false;
            suppressFadeRef.current = false;
            return;
        }
        // Use a short setTimeout so the DOM can paint after listFadeIn clears
        const timer = setTimeout(() => {
            const attr = onRequests ? "[data-services-requests-scroll]" : "[data-services-scroll]";
            const tryRestore = (attempts) => {
                const el = document.querySelector(attr);
                if (el && el.scrollHeight > el.clientHeight) {
                    el.scrollTop = top;
                    shouldRestoreRef.current = false;
                    isRestoringRef.current = false;
                    suppressFadeRef.current = false;
                    savedScrollTopRef.current = 0;
                } else if (attempts > 0) {
                    setTimeout(() => tryRestore(attempts - 1), 50);
                } else {
                    shouldRestoreRef.current = false;
                    isRestoringRef.current = false;
                    suppressFadeRef.current = false;
                }
            };
            tryRestore(20);
        }, 100);
        return () => clearTimeout(timer);
    }, [requestsLoading, isLoading, leftMode]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setPageVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    // Inject request card fade-in keyframes once
    useEffect(() => { ensureReqKeyframes(); }, []);

    useLayoutEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const STYLE_ID = "ll-services-noshift-style";
        const BODY_CLASS = "ll-services-fixed-layout";

        let styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = STYLE_ID;
            styleEl.type = "text/css";
            styleEl.appendChild(
                document.createTextNode(
                    "body." + BODY_CLASS + " { padding-right: var(--ll-services-scrollbar-comp, 0px) !important; overflow: hidden !important; } " +
                    "html." + BODY_CLASS + " { padding-right: var(--ll-services-scrollbar-comp, 0px) !important; overflow: hidden !important; }"
                )
            );
            document.head.appendChild(styleEl);
        }

        body.classList.add(BODY_CLASS);
        html.classList.add(BODY_CLASS);

        const prevHtmlOverflow = html.style.overflow;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlPaddingRight = html.style.paddingRight;
        const prevBodyPaddingRight = body.style.paddingRight;
        const prevCssVarBody = body.style.getPropertyValue("--ll-services-scrollbar-comp");
        const prevCssVarHtml = html.style.getPropertyValue("--ll-services-scrollbar-comp");
        const scrollbarWidth = window.innerWidth - html.clientWidth;

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        const comp = scrollbarWidth > 0 ? scrollbarWidth + "px" : "0px";
        html.style.setProperty("--ll-services-scrollbar-comp", comp);
        body.style.setProperty("--ll-services-scrollbar-comp", comp);
        html.style.paddingRight = comp;
        body.style.paddingRight = comp;

        const measure = () => {
            const header =
                document.querySelector("header.MuiAppBar-root") ||
                document.querySelector("header") ||
                document.querySelector(".site-header") ||
                document.getElementById("header") ||
                null;
            setChromeTop(header ? header.getBoundingClientRect().bottom : 0);
        };

        measure();
        let raf2 = null;
        const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(measure); });
        window.addEventListener("resize", measure);

        return () => {
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
            window.removeEventListener("resize", measure);
            html.style.overflow = prevHtmlOverflow;
            body.style.overflow = prevBodyOverflow;
            html.style.paddingRight = prevHtmlPaddingRight;
            body.style.paddingRight = prevBodyPaddingRight;
            if (prevCssVarHtml) html.style.setProperty("--ll-services-scrollbar-comp", prevCssVarHtml);
            else html.style.removeProperty("--ll-services-scrollbar-comp");
            if (prevCssVarBody) body.style.setProperty("--ll-services-scrollbar-comp", prevCssVarBody);
            else body.style.removeProperty("--ll-services-scrollbar-comp");
            html.classList.remove(BODY_CLASS);
            body.classList.remove(BODY_CLASS);
        };
    }, []);

    // Fetch responses when a request is selected
    useEffect(() => {
        if (!selectedRequest) {
            setResponses([]);
            setMyResponse(null);
            setIsRequesterOfSelected(false);
            return;
        }
        let cancelled = false;
        setResponsesLoading(true);
        fetchRequestResponses(selectedRequest.id)
            .then((data) => {
                if (cancelled) return;
                setResponses(data.responses || []);
                setMyResponse(data.myResponse || null);
                setIsRequesterOfSelected(data.isRequester);
            })
            .catch(() => {
                if (!cancelled) {
                    setResponses([]);
                    setMyResponse(null);
                    setIsRequesterOfSelected(false);
                }
            })
            .finally(() => { if (!cancelled) setResponsesLoading(false); });
        return () => { cancelled = true; };
    }, [selectedRequest?.id]);

    const reloadResponses = () => {
        if (!selectedRequest) return;
        fetchRequestResponses(selectedRequest.id)
            .then((data) => {
                setResponses(data.responses || []);
                setMyResponse(data.myResponse || null);
                setIsRequesterOfSelected(data.isRequester);
            })
            .catch(() => {});
    };

    // ── Cross-account ownership for selected request (matches EventPostPage pattern) ──
    // isPersonalOwnerOfSelected: viewer's underlying user_id matches the requester,
    // regardless of which account is active. Hides the Respond button.
    const isPersonalOwnerOfSelected = Boolean(
        resolvedUserId && selectedRequest &&
        (selectedRequest.requesterId || selectedRequest.requester_id || selectedRequest.user_id || selectedRequest.owner_id) &&
        String(resolvedUserId) === String(selectedRequest.requesterId || selectedRequest.requester_id || selectedRequest.user_id || selectedRequest.owner_id)
    );

    // isOnCorrectAccountForSelected: personal owner AND on the matching account.
    // Only then show Edit / Delete in the three-dot menu.
    const isOnCorrectAccountForSelected = (() => {
        if (!isPersonalOwnerOfSelected || !selectedRequest) return false;
        const reqAccountType = String(
            selectedRequest.requesterAccountType || selectedRequest.requester_account_type ||
            selectedRequest.requesterType || selectedRequest.requester_type ||
            selectedRequest.accountType || selectedRequest.account_type || ""
        ).toLowerCase().trim();
        const reqHandle = String(
            selectedRequest.requesterHandle || selectedRequest.requester_handle || ""
        ).toLowerCase().trim();
        const reqIsBusiness = reqAccountType === "business" || !!(selectedRequest.requesterBusinessId || selectedRequest.requester_business_id);
        const reqIsArtist = reqAccountType === "artist" || reqAccountType === "music" || reqAccountType === "music_artist"
            || !!(selectedRequest.requesterArtistId || selectedRequest.requester_artist_id);

        const activeSlug = String(activeAccount?.slug || activeAccount?.handle || "").toLowerCase().trim();
        const activeType = String(activeAccount?.type || "").toLowerCase().trim();
        const isActiveBiz = activeType === "business" || Boolean(activeBusinessId);
        const isActiveArt = activeType === "artist" || activeType === "music" || Boolean(activeArtistId);

        // Personal request → must be on personal account
        if (!reqIsBusiness && !reqIsArtist) {
            return !isActiveBiz && !isActiveArt;
        }
        // Business request → must be on that business account
        if (reqIsBusiness) {
            if (!isActiveBiz) return false;
            if (activeSlug && reqHandle && activeSlug === reqHandle) return true;
            const reqBizId = selectedRequest.requesterBusinessId || selectedRequest.requester_business_id
                || (reqAccountType === "business" ? (selectedRequest.requesterProfileId || selectedRequest.requester_profile_id) : null);
            return Boolean(activeBusinessId && reqBizId && String(activeBusinessId) === String(reqBizId));
        }
        // Artist request → must be on that artist account
        if (reqIsArtist) {
            if (!isActiveArt) return false;
            if (activeSlug && reqHandle && activeSlug === reqHandle) return true;
            const reqArtId = selectedRequest.requesterArtistId || selectedRequest.requester_artist_id
                || ((reqAccountType === "artist" || reqAccountType === "music" || reqAccountType === "music_artist")
                    ? (selectedRequest.requesterProfileId || selectedRequest.requester_profile_id) : null);
            return Boolean(activeArtistId && reqArtId && String(activeArtistId) === String(reqArtId));
        }
        return false;
    })();

    const handleAcceptResponse = async (responseId) => {
        if (!selectedRequest) return;
        // Find the response to get the provider name
        const resp = responses.find((r) => r.id === responseId);
        setAcceptConfirm({ id: responseId, name: resp?.responderName || "this provider" });
    };

    const confirmAcceptResponse = async () => {
        if (!selectedRequest || !acceptConfirm) return;
        const responseId = acceptConfirm.id;
        setResponseActionLoading(responseId);
        setAcceptConfirm(null);
        try {
            await acceptRequestResponse(selectedRequest.id, responseId);
            reloadResponses();
        } catch { /* handled by UI */ }
        finally { setResponseActionLoading(null); }
    };

    const handleDeclineResponse = async (responseId) => {
        if (!selectedRequest) return;
        const resp = responses.find((r) => r.id === responseId);
        setDeclineConfirm({ id: responseId, name: resp?.responderName || "this provider" });
    };

    const confirmDeclineResponse = async () => {
        if (!selectedRequest || !declineConfirm) return;
        const responseId = declineConfirm.id;
        setResponseActionLoading(responseId);
        setDeclineConfirm(null);
        try {
            await declineRequestResponse(selectedRequest.id, responseId);
            reloadResponses();
        } catch { /* handled by UI */ }
        finally { setResponseActionLoading(null); }
    };

    const handleWithdrawResponse = async (responseId) => {
        if (!selectedRequest) return;
        setResponseActionLoading(responseId);
        try {
            await withdrawRequestResponse(selectedRequest.id, responseId);
            reloadResponses();
            setMyResponse(null);
            refreshRequests();
        } catch { /* handled by UI */ }
        finally { setResponseActionLoading(null); }
    };

    const handleCloseRequest = async () => {
        if (!selectedRequest) return;
        const wasFilled = selectedRequest.status === "filled";
        if (!wasFilled) {
            // Show the "Mark as Filled" confirmation with review option
            setFilledDialogOpen(true);
            return;
        }
        // Reopen — no confirmation needed
        try {
            const result = await closeServiceRequest(selectedRequest.id);
            setSelectedRequest((prev) => prev ? { ...prev, status: result.status } : prev);
            refreshRequests();
        } catch { /* handled by UI */ }
    };

    const confirmMarkAsFilled = async (shouldReview) => {
        setFilledDialogOpen(false);
        if (!selectedRequest) return;
        try {
            const result = await closeServiceRequest(selectedRequest.id);
            setSelectedRequest((prev) => prev ? { ...prev, status: result.status } : prev);
            refreshRequests();
            if (shouldReview) {
                // Find accepted response with a listing to review
                const acceptedResp = responses.find((r) => r.status === "accepted");
                if (acceptedResp?.listingId) {
                    // Navigate to the service listing page where they can write a review
                    window.location.assign(`/services/${acceptedResp.listingId}`);
                } else {
                    showSuccess("Request marked as filled! You can leave a review from the provider's service page.");
                }
            }
        } catch { /* handled by UI */ }
    };

    // ── Service Reviews ──
    const loadServiceReviews = React.useCallback(async () => {
        const svc = selectedService;
        if (!svc?.id) return null;
        setSvcReviewsLoading(true);
        try {
            const data = await fetchServiceReviews(svc.id, { sort: svcReviewSort, limit: 50, offset: 0 });
            setSvcReviews(data.reviews || []);
            setSvcReviewsTotal(data.total || 0);
            if (data.providerInfo) setSvcReviewProviderInfo(data.providerInfo);
            if (data.viewerIsOwner != null) setViewerIsOwner(Boolean(data.viewerIsOwner));
            return data;
        } catch { setSvcReviews([]); setSvcReviewsTotal(0); return null; }
        finally { setSvcReviewsLoading(false); }
    }, [selectedService?.id, svcReviewSort]);

    React.useEffect(() => { if (serviceDetailTab === 3 && selectedService?.id) loadServiceReviews(); }, [serviceDetailTab, loadServiceReviews]);

    // Listen for review changes from other components (e.g. ServiceDetailPage)
    React.useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || d._source === 'servicesPage') return;
            if (selectedService?.id && String(d.serviceId) === String(selectedService.id)) {
                // Refresh the reviews for the currently selected service
                loadServiceReviews().then((data) => { if (data) syncReviewStats(data); });
            }
            // Also update the card in the services feed list
            if (d.serviceId) {
                const patch = { reviewCount: d.reviewCount, review_count: d.reviewCount, reviewAvg: d.reviewAvg, review_avg: d.reviewAvg };
                updateItemFavorite(d.serviceId, patch);
            }
        };
        window.addEventListener('ll:service:review-changed', handler);
        return () => window.removeEventListener('ll:service:review-changed', handler);
    }, [selectedService?.id, loadServiceReviews]);

    // ── Fetch the provider's CURRENT profile avatar for the "Provided By" section ──
    // The listing stores a snapshot of provider_avatar at creation time, but the
    // provider may have changed their photo since then.  This mirrors the approach
    // used by UserCardPopover — fetch the real profile by handle/id.
    const _detailProviderType = selectedService?.providerType || selectedService?.provider_type || "";
    const _detailProviderHandle = selectedService?.providerHandle || selectedService?.provider_handle || "";
    const _detailProviderId = selectedService?.providerId || selectedService?.provider_id || "";
    const _detailServiceId = selectedService?.id;
    React.useEffect(() => {
        if (!_detailServiceId) { setProviderProfileAvatar(null); return undefined; }
        const pType = String(_detailProviderType).toLowerCase();
        const pHandle = String(_detailProviderHandle).trim();
        const pId = String(_detailProviderId).trim();
        if (!pHandle && !pId) return undefined;

        let cancelled = false;
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const signal = controller?.signal;
        const apiBase = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

        (async () => {
            try {
                let avatar = null;
                if (pType === "business") {
                    const url = apiBase ? `${apiBase}/api/business/${encodeURIComponent(pHandle || pId)}` : `/api/business/${encodeURIComponent(pHandle || pId)}`;
                    const res = await secureFetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                    if (res.ok) {
                        const data = await res.json();
                        const biz = data?.business || data;
                        avatar = biz?.logo_url || biz?.logoUrl || biz?.avatar_url || biz?.avatarUrl || null;
                    }
                } else if (pType === "music") {
                    const url = apiBase ? `${apiBase}/api/music/artists/${encodeURIComponent(pHandle || pId)}` : `/api/music/artists/${encodeURIComponent(pHandle || pId)}`;
                    const res = await secureFetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                    if (res.ok) {
                        const data = await res.json();
                        const art = data?.artist || data;
                        avatar = art?.avatar_url || art?.avatarUrl || null;
                    }
                } else {
                    // Personal user — fetch by handle or id
                    const key = pHandle.replace(/^@/, "") || pId;
                    if (key) {
                        const url = apiBase ? `${apiBase}/users/public/${encodeURIComponent(key)}` : `/users/public/${encodeURIComponent(key)}`;
                        const res = await secureFetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                        if (res.ok) {
                            const data = await res.json();
                            const prof = data?.profile || data;
                            avatar = prof?.avatar_url || prof?.avatarUrl || prof?.profile_picture || null;
                        }
                    }
                }
                if (!cancelled && avatar) setProviderProfileAvatar(avatar);
            } catch {
                // Silently ignore — we'll fall back to the snapshot avatar
            }
        })();

        return () => { cancelled = true; try { controller?.abort(); } catch { /* */ } };
    }, [_detailServiceId, _detailProviderType, _detailProviderHandle, _detailProviderId]);

    const openSvcReviewForm = async (existingReview = null) => {
        if (!loggedInUser) { openAuthPopup(); return; }
        // For new reviews, ask the backend if this user is eligible before showing the form
        if (!existingReview && selectedService?.id) {
            try {
                const elig = await checkReviewEligibility(selectedService.id);
                if (!elig.eligible) {
                    setSvcReviewIneligible({ open: true, reason: elig.reason || "You can't review this service." });
                    return;
                }
            } catch { /* if the check fails, fall through and let submit catch it */ }
        }
        if (existingReview) {
            setSvcReviewEditing(existingReview);
            setSvcReviewRating(existingReview.rating || 0);
            setSvcReviewTitle(existingReview.reviewTitle || existingReview.title || "");
            setSvcReviewText(existingReview.reviewText || existingReview.body || "");
            const existing = Array.isArray(existingReview.photoUrls) ? existingReview.photoUrls : [];
            setSvcReviewPhotos(existing.filter(Boolean).map((url) => ({ id: url, url, _existing: true })));
        } else {
            setSvcReviewEditing(null);
            setSvcReviewRating(0);
            setSvcReviewTitle("");
            setSvcReviewText("");
            setSvcReviewPhotos([]);
        }
        setSvcReviewError("");
        setSvcReviewFormOpen(true);
    };

    const closeSvcReviewForm = () => {
        if (!svcReviewSubmitting) {
            setSvcReviewFormOpen(false);
            setSvcReviewError("");
        }
    };

    // Helper: after review changes, sync review count/avg on both selectedService and the feed card
    const syncReviewStats = (data) => {
        if (!selectedService?.id) return;
        const newTotal = data?.total ?? 0;
        const revs = data?.reviews || [];
        const newAvg = revs.length ? Number((revs.reduce((s, r) => s + (r.rating || 0), 0) / revs.length).toFixed(2)) : null;
        const patch = { reviewCount: newTotal, review_count: newTotal, reviewAvg: newAvg, review_avg: newAvg };
        setSelectedService((prev) => prev ? { ...prev, ...patch } : prev);
        // Also update the card in the feed list
        updateItemFavorite(selectedService.id, patch);
        // Broadcast review stats change so other components (ServiceCard, ServiceDetailPage) can update
        try {
            window.dispatchEvent(new CustomEvent('ll:service:review-changed', {
                detail: { serviceId: selectedService.id, reviewCount: newTotal, reviewAvg: newAvg, _source: 'servicesPage' }
            }));
        } catch { /* */ }
    };

    const handleSubmitReview = async () => {
        if (!svcReviewRating) { setSvcReviewError("Please select a rating."); return; }
        setSvcReviewSubmitting(true); setSvcReviewError("");
        try {
            const loggedInUser = auth?.user;
            // Upload new photos via signed URLs, keep existing ones
            const pp = [];
            for (const p of svcReviewPhotos) {
                if (p._existing && p.url) {
                    pp.push({ url: p.url, objectPath: p.objectPath || "" });
                } else if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = Date.now() + "_review_" + (p.file.name || "photo.jpg");
                        const s = await getSignedUploadUrl({ folder: "services/reviews", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) {
                            await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct });
                            pp.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() });
                        }
                    } catch { /* skip failed upload */ }
                }
            }
            const payload = {
                rating: svcReviewRating,
                reviewTitle: svcReviewTitle,
                reviewText: svcReviewText,
                reviewerName: loggedInUser ? `${loggedInUser.first_name || ""} ${loggedInUser.last_name || ""}`.trim() || loggedInUser.handle || "User" : "User",
                reviewerAvatar: loggedInUser?.avatar_url || null,
                reviewerHandle: loggedInUser?.handle || null,
                photos: pp,
            };
            if (svcReviewEditing?.id) {
                await updateServiceReview(selectedService.id, svcReviewEditing.id, payload);
            } else {
                await createServiceReview(selectedService.id, payload);
            }
            setSvcReviewFormOpen(false);
            svcReviewPhotos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setSvcReviewPhotos([]);
            const data = await loadServiceReviews();
            syncReviewStats(data);
        } catch (err) { setSvcReviewError(err?.message || "Failed to submit review."); }
        finally { setSvcReviewSubmitting(false); }
    };

    const handleDeleteReview = async (reviewId) => {
        setSvcReviewDeleting(true);
        try {
            await deleteServiceReview(selectedService.id, reviewId);
            setSvcReviewDeleteTarget(null);
            setSvcReviewFormOpen(false);
            const data = await loadServiceReviews();
            syncReviewStats(data);
        } catch { /* ignore */ }
        finally { setSvcReviewDeleting(false); }
    };

    const handleRespondToReview = async (reviewId) => {
        if (!svcRespondText.trim()) return;
        try {
            await respondToReview(selectedService.id, reviewId, svcRespondText.trim());
            setSvcRespondingId(null); setSvcRespondText("");
            await loadServiceReviews();
        } catch { /* ignore */ }
    };

    const handleClickService = (service) => {
        if (!service || service.id === undefined || service.id === null) return;

        setSelectedService(service);
        setServiceDetailTab(0);
        setDetailHoursExpanded(false);
        setSvcDescExpanded(false);
        setSvcReviews([]);
        setSvcReviewsTotal(0);
        setSvcReviewFormOpen(false);
        setSvcReviewError("");
        setSvcReviewEditing(null);
        setSvcReviewDeleteTarget(null);
        setProviderProfileAvatar(null);
        setRightTab("detail");
        // On mobile, open the full-screen slide-in detail
        if (isMobile) setMobileDetailOpen(true);
        // Pre-set focus so switching to map tab will auto-open this service's popup (desktop only)
        // On mobile, focus is set explicitly by onLocationClick; setting it here would cause
        // stale zoom when switching tabs then opening the map.
        if (!isMobile && service.id) setFocusServiceId(String(service.id));
    };

    const handleOpenCreate = async () => {
        if (!loggedInUser) { openAuthPopup(); return; }
        try {
            const acctType = String(activeAccount?.type || "personal").toLowerCase();
            const providerType = acctType === "business" ? "business" : acctType === "artist" ? "music" : "user";
            const providerId = (acctType === "business" || acctType === "artist") ? activeAccount?.id : undefined;
            const limits = await fetchServiceLimits({ providerType, providerId });
            if (limits && !limits.canCreate) {
                const label = acctType === "business" ? "business" : acctType === "artist" ? "artist" : "personal";
                setLimitDialog({
                    open: true,
                    title: "Service Listing Limit Reached",
                    message: `You've reached the maximum of ${limits.maxAllowed} active service listing${limits.maxAllowed === 1 ? "" : "s"} for your ${label} account. Pause or delete an existing listing to create a new one.`,
                });
                return;
            }
        } catch { /* if check fails, let the form handle it */ }
        navigate("/services/create");
    };

    const handleEditService = (service) => { if (service?.id) navigate(`/services/edit/${service.id}`); };

    // ── Scroll list back to top when any filter changes ──
    const scrollServicesToTop = () => {
        requestAnimationFrame(() => {
            const attr = leftMode === "requests" ? "[data-services-requests-scroll]" : "[data-services-scroll]";
            const el = document.querySelector(attr);
            if (el) el.scrollTop = 0;
        });
    };

    const clearAllFilters = () => {
        setSearch(""); setSearchDraft(""); setSort("any");
        setFilters({ category: "", priceModel: "any", city: "", county: "", radius: STATEWIDE, statewideOnly: false });
        setRequestsFilters({ category: "", priceModel: "any", city: "", county: "", statewideOnly: false, urgency: "", budgetType: "" });
        setRequestsView("all");
        setRequestsSort("newest");
        setServiceView("all");
        // Sync the location-change ref so the effect doesn't see a stale → default diff
        prevReqLocationRef.current = { city: "", county: "", statewideOnly: false };
        // Force an explicit refresh so the list regenerates even when the
        // hook's memoised options haven't settled yet in this tick.
        // Use a microtask so the state updates above flush first.
        Promise.resolve().then(() => {
            if (typeof refresh === "function") refresh();
            if (typeof refreshRequests === "function") refreshRequests();
        });
        scrollServicesToTop();
    };

    // Saved filters restore: update BOTH the input (searchDraft) and the
    // committed term (search) so the input reflects the restored term
    // AND the fetch re-runs with it. Called by ServicesFilters' apply.
    const handleSavedSearchChange = useCallback((val) => {
        const next = String(val || "");
        setSearch(next);
        setSearchDraft(next);
    }, []);

    const handleServiceDeleted = (serviceId) => {
        if (selectedService && String(selectedService.id) === String(serviceId)) setSelectedService(null);
        refresh();
    };

    const handleCardDelete = (service) => { setDeleteTarget(service); setDeleteError(null); };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true); setDeleteError(null);
        try {
            await deleteService(deleteTarget.id);
            setDeleteTarget(null);
            handleServiceDeleted(deleteTarget.id);
        } catch (err) { setDeleteError(err); } finally { setIsDeleting(false); }
    };

    const handleOpenUserCard = (el, provider) => {
        setUserAnchor(el);
        setUserForCard({
            id: provider?.id, first_name: provider?.first_name || "", last_name: provider?.last_name || "",
            handle: provider?.handle, avatar_url: provider?.avatar_url, profilePath: provider?.profilePath || null,
            ...(provider?.account_type ? { account_type: provider.account_type } : {}),
            ...(provider?.business_id ? { business_id: provider.business_id } : {}),
            ...(provider?.business_name ? { business_name: provider.business_name } : {}),
            ...(provider?.business_slug ? { business_slug: provider.business_slug } : {}),
            ...(provider?.artist_id ? { artist_id: provider.artist_id } : {}),
            ...(provider?.artist_name ? { artist_name: provider.artist_name } : {}),
            ...(provider?.artist_handle ? { artist_handle: provider.artist_handle } : {}),
        });
    };

    const handleRequestQuote = (service) => {
        if (!loggedInUser) { openAuthPopup(); return; }
        if (service?.id && _isSvcQuoteLimited(_svcRecipientKey(service))) {
            setQuoteLimitOpen(true);
            return;
        }
        setQuoteService(service);
        setQuoteMessage("");
        setQuoteError("");
        setQuoteSuccess(false);
        setQuotePhotos([]);
        setQuoteCooldown(0);
    };

    const handleFavorite = (service, opts = {}) => {
        if (!loggedInUser) { openAuthPopup(); return; }
        if (!service?.id) return;

        const { fromCard, favorited: cardFavorited, favoritesCount: cardFavCount, source } = opts;

        // ── When called FROM ServiceCard with server-confirmed result,
        //    just sync the items list + detail panel — do NOT call the API again. ──
        if (fromCard && cardFavorited !== undefined) {
            updateItemFavorite(service.id, {
                favorited: cardFavorited,
                isFavorited: cardFavorited,
                favoritesCount: cardFavCount,
            });
            // Keep selectedService (detail panel) in sync
            setSelectedService((prev) => {
                if (!prev || String(prev.id) !== String(service.id)) return prev;
                return { ...prev, isFavorited: cardFavorited, is_favorited: cardFavorited, favorited: cardFavorited, favoritesCount: cardFavCount, favorites_count: cardFavCount };
            });
            return;
        }

        // ── Called from detail panel — make API call with optimistic update ──
        if (source === "detail" && selectedService && String(selectedService.id) === String(service.id)) {
            const curFav = Boolean(selectedService.isFavorited ?? selectedService.is_favorited ?? selectedService.favorited);
            const nextFav = !curFav;
            const curCount = Number(selectedService.favoritesCount || selectedService.favorites_count || 0);
            const nextCount = Math.max(0, curCount + (nextFav ? 1 : -1));
            setSelectedService((prev) => prev ? { ...prev, isFavorited: nextFav, is_favorited: nextFav, favorited: nextFav, favoritesCount: nextCount, favorites_count: nextCount } : prev);
        }

        // Pass activeAccount explicitly so the API sends the correct
        // x-account-type / x-business-id / x-artist-id headers.
        toggleServiceFavorite(service.id, activeAccount)
            .then((res) => {
                if (res && typeof res.favoritesCount === "number") {
                    const serverFav = Boolean(res.favorited);
                    const serverCount = res.favoritesCount;
                    updateItemFavorite(service.id, {
                        favorited: serverFav,
                        isFavorited: serverFav,
                        favoritesCount: serverCount,
                    });
                    setSelectedService((prev) => {
                        if (!prev || String(prev.id) !== String(service.id)) return prev;
                        return { ...prev, isFavorited: serverFav, is_favorited: serverFav, favorited: serverFav, favoritesCount: serverCount, favorites_count: serverCount };
                    });
                }
            })
            .catch(() => {
                if (source === "detail") {
                    setSelectedService((prev) => {
                        if (!prev || String(prev.id) !== String(service.id)) return prev;
                        const revFav = Boolean(service.isFavorited ?? service.is_favorited ?? service.favorited);
                        const revCount = Number(service.favoritesCount || service.favorites_count || 0);
                        return { ...prev, isFavorited: revFav, is_favorited: revFav, favorited: revFav, favoritesCount: revCount, favorites_count: revCount };
                    });
                }
            });
    };

    const handleSendQuote = async () => {
        if (!quoteService || quoteCooldown > 0) return;
        if (_isSvcQuoteLimited(_svcRecipientKey(quoteService))) { setQuoteLimitOpen(true); return; }
        setQuoteSending(true);
        setQuoteError("");
        try {
            const userName = [loggedInUser?.first_name, loggedInUser?.last_name].filter(Boolean).join(" ");

            // Upload photos to GCS via signed URLs
            const photoPayload = [];
            for (const p of quotePhotos) {
                if (p.file) {
                    try {
                        const contentType = p.file.type || "image/jpeg";
                        const safeName = `${Date.now()}_quote_${p.file.name || "photo.jpg"}`;
                        const signRes = await secureFetch("/api/uploads/signed-url", {
                            method: "POST", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ folder: "services/quotes", fileName: safeName, contentType }),
                        });
                        if (!signRes.ok) continue;
                        const signed = await signRes.json();
                        if (signed?.uploadUrl) {
                            const putRes = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: p.file });
                            if (putRes.ok) {
                                photoPayload.push({ url: String(signed.publicUrl || "").trim(), objectPath: String(signed.objectPath || "").trim() });
                            }
                        }
                    } catch {
                        // Skip failed photo upload
                    }
                }
            }

            await requestQuote(quoteService.id, {
                message: quoteMessage,
                requesterName: userName,
                requesterAvatar: loggedInUser?.avatar_url || loggedInUser?.profile_picture || null,
                requesterHandle: loggedInUser?.handle || null,
                photos: photoPayload,
            });

            _trackSvcQuoteMsg(_svcRecipientKey(quoteService));
            quotePhotos.forEach((p) => { if (p?.url) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setQuotePhotos([]);
            setQuoteSuccess(true);
        } catch (err) {
            const status = err?.response?.status || err?.status;
            const data = err?.response?.data || err?.data;
            if (status === 429) {
                const wait = Number(data?.retryAfterSeconds) || 15;
                setQuoteError(data?.message || data?.error || "You're sending messages too quickly. Please wait a moment.");
                setQuoteCooldown(wait);
                const timer = setInterval(() => {
                    setQuoteCooldown(prev => {
                        if (prev <= 1) { clearInterval(timer); setQuoteError(""); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setQuoteError(err?.message || "Failed to send quote request.");
            }
        } finally {
            setQuoteSending(false);
        }
    };

    // ─── Request handlers ───
    const handleOpenCreateRequest = async () => {
        if (!loggedInUser) { openAuthPopup(); return; }
        try {
            const data = await fetchServiceRequests({ mine: true, status: "open", limit: 1 });
            const openCount = Number(data?.total ?? 0);
            if (openCount >= 10) {
                setLimitDialog({
                    open: true,
                    title: "Request Limit Reached",
                    message: `You can have at most 10 open service requests at a time. Close or mark an existing request as filled to create a new one.`,
                });
                return;
            }
        } catch { /* if check fails, let the form handle it */ }
        setEditingRequestItem(null);
        setCreateRequestOpen(true);
    };
    const handleEditRequest = (request) => { setEditingRequestItem(request); setCreateRequestOpen(true); };
    const handleClickRequest = (request) => {
        if (!request || request.id === undefined || request.id === null) return;

        setSelectedRequest(request);
        setRequestDetailTab(0);
        setRequestDescExpanded(false);
        setRightTab("detail");
        // On mobile, open the full-screen slide-in detail
        if (isMobile) setMobileDetailOpen(true);
    };
    const handleCardDeleteRequest = (request) => { setDeleteRequestTarget(request); setDeleteRequestError(null); };
    const handleConfirmDeleteRequest = async () => {
        if (!deleteRequestTarget) return;
        setIsDeletingRequest(true); setDeleteRequestError(null);
        try {
            await deleteServiceRequest(deleteRequestTarget.id);
            setDeleteRequestTarget(null);
            if (selectedRequest && String(selectedRequest.id) === String(deleteRequestTarget.id)) {
                setSelectedRequest(null);
                // Close mobile detail slide-in so user returns to the list
                if (isMobile) setMobileDetailOpen(false);
            }
            refreshRequests();
            showSuccess("Request deleted successfully");
        } catch (err) { setDeleteRequestError(err); } finally { setIsDeletingRequest(false); }
    };
    const handleRequestSuccess = () => { refreshRequests(); showSuccess(editingRequestItem ? "Request updated successfully!" : "Request posted successfully!"); };

    // ── Listen for create actions from the global Header create (+) menu ──
    const handleOpenCreateRef = useRef(handleOpenCreate);
    handleOpenCreateRef.current = handleOpenCreate;
    const handleOpenCreateRequestRef = useRef(handleOpenCreateRequest);
    handleOpenCreateRequestRef.current = handleOpenCreateRequest;

    useEffect(() => {
        const handleHeaderCreate = (e) => {
            const { action, blocked, retryAfterSec, reason } = e.detail || {};
            if (action !== 'service' && action !== 'serviceRequest') return;

            if (blocked === 'rateLimit') {
                setLimitDialog({
                    open: true,
                    title: 'Too Many Requests',
                    message: `You're creating too fast. Please wait a moment and try again.`,
                });
                return;
            }

            if (action === 'service') {
                handleOpenCreateRef.current();
            } else if (action === 'serviceRequest') {
                handleOpenCreateRequestRef.current();
            }
        };

        window.addEventListener('ll:header:create', handleHeaderCreate);
        return () => window.removeEventListener('ll:header:create', handleHeaderCreate);
    }, []);

    const isRequestsMode = leftMode === "requests";

    // Mobile: full-screen detail slide-in state (portaled to body so it covers header + bottom nav)
    const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
    const closeMobileDetail = useCallback(() => {
        setCameFromMobileMap(false);
        setMobileDetailOpen(false);
    }, []);
    // After exit animation finishes, clear the selection
    const handleMobileDetailExited = useCallback(() => {
        // Only clear if the user closed the panel (not if they tapped another card)
        // We check mobileDetailOpen; if it's already true again, skip clearing
        setMobileDetailOpen((current) => {
            if (!current) {
                if (leftMode === "requests") setSelectedRequest(null);
                else setSelectedService(null);
            }
            return current;
        });
    }, [leftMode]);

    // Active filter chips for mobile
    const activeFilterChips = useMemo(() => {
        const chips = [];
        // Show applied search term as a removable chip
        const appliedTerm = String(search || "").trim();
        if (appliedTerm) {
            const truncated = appliedTerm.length > 24 ? appliedTerm.slice(0, 24) + "\u2026" : appliedTerm;
            chips.push({
                key: "search",
                label: `"${truncated}"`,
                onRemove: () => {
                    setSearchDraft("");
                    setSearch("");
                },
            });
        }
        if (isRequestsMode) {
            if (requestsFilters.category) chips.push({ key: 'category', label: requestsFilters.category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setRequestsFilters((p) => ({ ...p, category: "" })) });
            if (requestsFilters.county) chips.push({ key: 'county', label: `${requestsFilters.county} County`, onRemove: () => setRequestsFilters((p) => ({ ...p, county: "" })) });
            if (requestsFilters.city) chips.push({ key: 'city', label: requestsFilters.city, onRemove: () => setRequestsFilters((p) => ({ ...p, city: "" })) });
            if (requestsSort && requestsSort !== "newest") chips.push({ key: 'sort', label: `Sort: ${requestsSort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setRequestsSort("newest") });
            if (requestsView && requestsView !== "all") chips.push({ key: 'view', label: requestsView.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setRequestsView("all") });
        } else {
            if (filters.category) chips.push({ key: 'category', label: filters.category.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setFilters((p) => ({ ...p, category: "" })) });
            if (filters.county) chips.push({ key: 'county', label: `${filters.county} County`, onRemove: () => setFilters((p) => ({ ...p, county: "", radius: STATEWIDE })) });
            if (filters.county && !isCountyOnly(filters.radius)) chips.push({ key: 'radius', label: radiusLabel(filters.radius), onRemove: () => setFilters((p) => ({ ...p, radius: DEFAULT_RADIUS_WHEN_COUNTY_SELECTED })) });
            if (filters.city) chips.push({ key: 'city', label: filters.city, onRemove: () => setFilters((p) => ({ ...p, city: "" })) });
            if (sort && sort !== "any") chips.push({ key: 'sort', label: `Sort: ${sort.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`, onRemove: () => setSort("any") });
            if (serviceView && serviceView !== "all") chips.push({ key: 'view', label: serviceView.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setServiceView("all") });
        }
        return chips;
    }, [search, isRequestsMode, filters, requestsFilters, sort, requestsSort, serviceView, requestsView]);

    const isMyMode = false; // My Services is no longer a mode — use requests instead
    const displayItems = isRequestsMode ? requestItems : items;
    const displayLoading = isRequestsMode ? requestsLoading : isLoading;

    // ── Smooth fade-in when results change ──
    const [listFadeIn, setListFadeIn] = useState(false);
    const fadeTimerRef = useRef(null);
    // Suppress ALL fade transitions until the restore cycle is fully done.
    // This ref stays true until the scroll-restore effect clears it, which
    // happens AFTER the items have settled and DOM has painted — guaranteeing
    // no intermediate opacity dip.
    const suppressFadeRef = useRef(Boolean(isBackNavRef.current));
    // Time-based guard: after a back-nav, suppress ALL fades for a generous
    // window so late-arriving data from the feed hook can't trigger a flash.
    const backNavFadeUntilRef = useRef(isBackNavRef.current ? Date.now() + 3000 : 0);
    const itemKey = (Array.isArray(displayItems) ? displayItems : []).map((d) => d?.id).join(",");
    // Pre-seed prevItemKeyRef on back-nav so the cached → fresh data swap
    // is never treated as the "first real change" that bypasses the prev==="" guard.
    const prevItemKeyRef = useRef(isBackNavRef.current ? itemKey : "");

    useEffect(() => {
        const prev = prevItemKeyRef.current;
        const next = itemKey;
        // Trigger fade whenever results actually change (including transitions to empty)
        // Skip the fade during a back-nav restore to prevent the flash.
        if (prev !== next && prev !== "") {
            if (suppressFadeRef.current || isRestoringRef.current || Date.now() < backNavFadeUntilRef.current) {
                // Data arrived during or shortly after restore — suppress the opacity dip
            } else {
                if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
                setListFadeIn(true);
                // Brief opacity dip, then fade back in via CSS transition
                fadeTimerRef.current = setTimeout(() => {
                    setListFadeIn(false);
                }, 60);
            }
        }
        prevItemKeyRef.current = next;
        return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); };
    }, [itemKey]);
    const displayEmpty = isRequestsMode ? (!requestsLoading && requestItems.length === 0) : isEmpty;
    const displayTotal = isRequestsMode ? requestsTotalCount : (totalCount ?? items.length);

    const serviceEmptyMsg = getServiceEmptyStateMessages({
        view: serviceView, search, category: filters.category, priceModel: filters.priceModel,
        city: filters.city, county: filters.county,
    });
    const requestEmptyMsg = getRequestEmptyStateMessages({
        view: requestsView, search, category: requestsFilters.category,
        city: requestsFilters.city, county: requestsFilters.county,
        urgency: requestsFilters.urgency, budgetType: requestsFilters.budgetType,
    });

    const statusText = (() => {
        if (isRequestsMode) {
            if (requestsLoading && requestItems.length === 0) return "Loading\u2026";
            const shown = requestItems.length;
            const total = requestsTotalCount;
            if (shown === 0 && total > 0) return "Loading\u2026";
            if (shown === 0) return "No requests match your filters";
            return "Displaying " + shown + " out of " + total + " request" + (total !== 1 ? "s" : "");
        }
        if (displayLoading && displayItems.length === 0) return "Loading\u2026";
        const shown = displayItems.length;
        const total = displayTotal;
        if (shown === 0 && total > 0) return "Loading\u2026";
        if (shown === 0) return "No services match your filters";
        return "Displaying " + shown + " out of " + total + " service" + (total !== 1 ? "s" : "");
    })();

    // Detail panel helpers
    const detailService = selectedService;
    const detailCatInfo = detailService ? getServiceCategoryInfo(detailService.categorySlug || detailService.category_slug || "") : null;
    const detailPriceLabel = detailService ? formatPriceRange(
        detailService.priceModel || detailService.price_model,
        detailService.priceRangeMin || detailService.price_range_min,
        detailService.priceRangeMax || detailService.price_range_max,
    ) : "";
    const rawDetailLocation = detailService?.locationLabel || detailService?.location_label || "";
    const detailLocation = (() => {
        const lower = rawDetailLocation.toLowerCase().trim();
        if (!lower) return "Alabama (Statewide)";
        if (lower === "statewide" || lower === "alabama") return "Alabama (Statewide)";
        return rawDetailLocation;
    })();
    const detailProviderName = detailService?.providerName || detailService?.provider_name || "Provider";

    const detailIsOwnListing = (() => {
        if (!detailService) return false;
        // Trust backend isOwner if present (account-aware)
        if (detailService.isOwner != null) return detailService.isOwner;
        // Fallback to front-end checks — only match when the *active* account is the same identity
        const uid = resolvedUserId;
        if (!uid) return false;
        const pType = detailService.providerType || detailService.provider_type;
        const pId = String(detailService.providerId || detailService.provider_id);
        if (pType === "business" && activeBusinessId && String(activeBusinessId) === pId) return true;
        if (pType === "music" && activeArtistId && String(activeArtistId) === pId) return true;
        if ((pType === "user" || pType === "personal") && !activeBusinessId && !activeArtistId && pId === String(uid)) return true;
        return false;
    })();

    const detailAllowsReviews = detailService ? (detailService.allowReviews !== false && detailService.allow_reviews !== false) : true;
    const detailAllowsMessages = detailService ? (detailService.allowMessages !== false && detailService.allow_messages !== false) : true;

    const detailFav = Boolean(detailService?.isFavorited ?? detailService?.is_favorited ?? detailService?.favorited);
    const detailFavCount = Number(detailService?.favoritesCount || detailService?.favorites_count || 0);

    const handleDetailFavorite = () => {
        if (!detailService) return;
        handleFavorite(detailService, { source: "detail" });
    };

    // Map generic ReportDialog reason values to the ones the services API accepts
    // Backend REPORT_REASONS: spam, misleading, inappropriate, scam, duplicate, other
    const SERVICE_REASON_MAP = {
        spam: "spam",
        inappropriate: "inappropriate",
        harassment: "inappropriate",
        misinformation: "misleading",
        other: "other",
    };

    const handleReportSubmit = async ({ reason, details } = {}) => {
        const r = SERVICE_REASON_MAP[reason || reportReason] || reason || reportReason;
        const d = details || reportDetails;
        if (!r) return;
        try {
            if (reportTarget === "service_request") {
                const reqId = selectedRequest?.id;
                if (!reqId) return;
                await reportServiceRequest(reqId, { reason: r, details: d });
            } else if (reportTarget === "review") {
                // Report the specific review to service_review_reports
                const reviewId = reportTargetReview?.id;
                const svcId = detailService?.id;
                if (!reviewId || !svcId) return;
                await secureFetch(`/api/services/${encodeURIComponent(svcId)}/reviews/${encodeURIComponent(reviewId)}/report`, {
                    method: "POST", credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: r, details: d }),
                });
            } else {
                // "service" — report against the service listing itself
                if (!detailService) return;
                await reportService(detailService.id, { reason: r, details: d });
            }
        } catch (err) {
            setReportSnack(err?.message || "Failed to submit report.");
        }
    };

    const closeReportDialog = () => {
        setReportDialogOpen(false);
        setReportConfirmed(false);
        setReportReason("");
        setReportDetails("");
        setReportTargetReview(null);
    };

    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [shareRequest, setShareRequest] = useState(null);

    const handleShareService = () => {
        if (!detailService) return;
        setShareRequest(null);
        setShareDialogOpen(true);
    };

    const handleShareRequest = (req) => {
        const target = req || selectedRequest;
        if (!target) return;
        setShareRequest(target);
        setShareDialogOpen(true);
    };

    return (
        <Box sx={{
            position: "fixed",
            // Track global nav offset so the container expands to fill the
            // viewport as the app bar + bottom nav slide away. Mirrors
            // CommunityPage so the floating subheader fades in lockstep with
            // the AppBar via `--ll-nav-offset`.
            top: `calc(${chromeTop}px * (1 - var(--ll-nav-offset, 0)))`,
            left: 0,
            right: 0,
            bottom: `${BOTTOM_GUTTER_PX}px`,
            "@media (max-width: 899px)": {
                bottom: `calc(${MOBILE_BOTTOM_NAV_HEIGHT}px * (1 - var(--ll-nav-offset, 0)))`,
            },
            overflow: "hidden", display: "flex", flexDirection: "column",
            gap: 0, p: 0, pt: 0, boxSizing: "border-box", bgcolor: "background.paper",
            "@media (min-width: 1024px)": {
                p: 1.25, pt: 0.75, bgcolor: APP_BACKGROUND,
            },
            "@media (min-width: 1440px)": {
                flexDirection: "row", gap: 1.25, p: 1.25, pt: 0.75, bgcolor: APP_BACKGROUND,
            },
            opacity: pageVisible ? 1 : 0, transform: "none",
            transition: (t) => [
                `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
                `transform ${t.custom.motion.base}ms ${t.custom.motion.ease}`,
            ].join(", "),
        }}>
            {/* Left Panel */}
            <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1, height: "100%", overflow: "hidden", p: 0 }}>
                <Box sx={{
                    height: "100%", overflow: "hidden", display: "flex", flexDirection: "column",
                    borderRadius: 0, border: "none", borderColor: "transparent",
                    bgcolor: (t) => t.palette.background.paper,
                    "@media (min-width: 1024px)": {
                        borderRadius: 3, border: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                    },
                    "@media (min-width: 1440px)": {
                        borderRadius: 3, border: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.12),
                    }, backdropFilter: "none",
                    backgroundImage: "none", boxShadow: "none",
                }}>
                    {/* Header */}
                    <Box
                        ref={mobileHeaderRef}
                        sx={{
                            flexShrink: 0, px: 1.25, pt: 0.5, pb: 0.5,
                            display: "flex", flexDirection: "column",
                            alignItems: "stretch", justifyContent: "flex-start", gap: 1,
                            // Tablet/laptop (900–1439) + desktop (≥1440): flow as a row and wrap
                            // so search + chrome buttons sit inline next to the tabs.
                            "@media (min-width: 900px)": {
                                px: 1.5, pt: 0.5, pb: 0.5,
                                rowGap: 0.5,
                                flexDirection: "row", flexWrap: "wrap",
                                alignItems: "center",
                            },
                            "@media (min-width: 1440px)": {
                                pt: 0.45, pb: 0.45,
                            },
                            // Mobile (<1440px): fixed in viewport directly below the
                            // global header. Doesn't take layout space — the scroll
                            // container reserves space via padding-top. Fades via
                            // `--ll-nav-offset` in sync with the rest of the chrome.
                            ...(isMobile ? {
                                position: "fixed",
                                top: "var(--ll-nav-height, 52px)",
                                left: 0,
                                right: 0,
                                zIndex: (t) => t.zIndex.appBar,
                                opacity: "calc(1 - var(--ll-nav-offset, 0))",
                                pointerEvents: "var(--ll-nav-pointer-events, auto)",
                                transition: "none",
                                willChange: "opacity",
                                backdropFilter: "saturate(140%) blur(10px)",
                                WebkitBackdropFilter: "saturate(140%) blur(10px)",
                                backgroundColor: (t) => alpha(t.palette.background.paper, 0.85),
                            } : {}),
                        }}>
                        {/* Segment buttons */}
                        <Box role="tablist" aria-label="Services section" sx={{ flex: "0 0 auto", display: "flex", gap: 0.5, justifyContent: "flex-start", alignItems: "center", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, maxWidth: "100%", width: "100%", "@media (min-width: 900px)": { overflowX: "visible", width: "auto" }, "@media (min-width: 1440px)": { maxWidth: 520 } }}>
                            {/* Mobile: Discover / Overview tab */}
                            {isMobile && (
                                <Button
                                    role="tab"
                                    aria-selected={mobileView === "discover"}
                                    onClick={() => setMobileView((v) => v === "discover" ? "list" : "discover")}
                                    variant="text" disableElevation
                                    sx={(t) => ({
                                        borderRadius: 999, textTransform: "none", fontWeight: mobileView === "discover" ? 800 : 600,
                                        letterSpacing: "0.01em", fontSize: 11.5, lineHeight: 1,
                                        height: 28, minHeight: 28, px: 1.25, py: 0,
                                        // Tablet/laptop: match other pages at 38px, text-only pill.
                                        "@media (min-width: 900px)": {
                                            fontSize: 13.5,
                                            height: 38,
                                            minHeight: 38,
                                            px: 1.75,
                                            letterSpacing: "-0.01em",
                                            fontWeight: mobileView === "discover" ? 950 : 700,
                                        },
                                        flexDirection: "row", gap: 0,
                                        color: mobileView === "discover" ? t.palette.primary.main : t.palette.text.secondary,
                                        backgroundColor: mobileView === "discover" ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                        border: "1px solid",
                                        borderColor: mobileView === "discover" ? alpha(t.palette.primary.main, 0.18) : "transparent",
                                        boxShadow: "none", whiteSpace: "nowrap", flexShrink: 0,
                                        transition: `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        "& .MuiButton-startIcon": { display: "none" },
                                        "&:hover": { backgroundColor: mobileView === "discover" ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04), color: mobileView === "discover" ? t.palette.primary.main : t.palette.text.primary },
                                    })}
                                >{isRequestsMode ? "Overview" : "Discover"}</Button>
                            )}
                            <Button role="tab" aria-selected={leftMode === "all" && !(isMobile && mobileView === "discover")}
                                    onClick={() => {
                                        if (isMobile && mobileView === "discover") { setMobileView("list"); if (leftMode === "all") return; }
                                        if (leftMode === "all" && mobileView !== "discover") return;
                                        setContentVisible(false);
                                        if (tabFadeTimerRef.current) clearTimeout(tabFadeTimerRef.current);
                                        tabFadeTimerRef.current = setTimeout(() => {
                                            tabFadeTimerRef.current = null;
                                            setLeftMode("all"); setSelectedService(null); setSelectedRequest(null); setMobileDetailOpen(false); setRightTab((prev) => prev === "overview" ? "discover" : prev); setMobileView("list"); setFocusServiceId(null); setFocusRequestId(null);
                                            requestAnimationFrame(() => setContentVisible(true));
                                        }, tabFadeMs);
                                    }}
                                    variant="text" disableElevation
                                    sx={(t) => {
                                        const isActive = leftMode === "all" && !(isMobile && mobileView === "discover");
                                        return {
                                            borderRadius: 999, textTransform: "none", fontWeight: isActive ? (isMobile ? 800 : 950) : (isMobile ? 600 : 700),
                                            letterSpacing: isMobile ? "0.01em" : "-0.01em",
                                            fontSize: 11.5,
                                            height: 28,
                                            minHeight: 28,
                                            px: 1.25,
                                            // Tablet/laptop (900–1439) + desktop (≥1440): 38px pill matching other pages.
                                            '@media (min-width: 900px)': {
                                                fontSize: 13.5,
                                                height: 38,
                                                minHeight: 38,
                                                px: 1.75,
                                                letterSpacing: "-0.01em",
                                                fontWeight: isActive ? 950 : 700,
                                            },
                                            // Tab icons only appear at true desktop (≥1440). Tablet is text-only.
                                            "& .MuiButton-startIcon": { display: "none", marginRight: 0, marginLeft: 0, "@media (min-width: 1440px)": { display: "flex", marginRight: 0.9 } },
                                            flexDirection: "row", gap: 0,
                                            py: 0,
                                            color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                            backgroundColor: isActive ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                            border: "1px solid",
                                            borderColor: isActive ? alpha(t.palette.primary.main, isMobile ? 0.18 : 0.2) : "transparent",
                                            boxShadow: "none", whiteSpace: "nowrap", flexShrink: 0,
                                            transition: `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                            "&:hover": { backgroundColor: isActive ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04), color: isActive ? t.palette.primary.main : t.palette.text.primary },
                                            "&:focus-visible": { outline: "none", boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}` },
                                        };}}
                                    startIcon={<BuildRoundedIcon sx={(t) => { const isActive = leftMode === "all" && !(isMobile && mobileView === "discover"); return { fontSize: 18, '@media (min-width: 1440px)': { fontSize: 22 }, opacity: isActive ? 1 : 0.72, color: isActive ? t.palette.primary.main : t.palette.text.secondary }; }} />}
                            >Services</Button>
                            <Button role="tab" aria-selected={isRequestsMode && !(isMobile && mobileView === "discover")}
                                    onClick={() => {
                                        if (isMobile && mobileView === "discover") { setMobileView("list"); if (isRequestsMode) return; }
                                        if (isRequestsMode && mobileView !== "discover") return;
                                        setContentVisible(false);
                                        if (tabFadeTimerRef.current) clearTimeout(tabFadeTimerRef.current);
                                        tabFadeTimerRef.current = setTimeout(() => {
                                            tabFadeTimerRef.current = null;
                                            setLeftMode("requests"); setSelectedService(null); setSelectedRequest(null); setMobileDetailOpen(false); setRightTab((prev) => prev === "discover" ? "overview" : prev); setMobileView("list"); setFocusServiceId(null); setFocusRequestId(null);
                                            requestAnimationFrame(() => setContentVisible(true));
                                        }, tabFadeMs);
                                    }}
                                    variant="text" disableElevation
                                    sx={(t) => {
                                        const isActive = isRequestsMode && !(isMobile && mobileView === "discover");
                                        return {
                                            borderRadius: 999, textTransform: "none", fontWeight: isActive ? (isMobile ? 800 : 950) : (isMobile ? 600 : 700),
                                            letterSpacing: isMobile ? "0.01em" : "-0.01em",
                                            fontSize: 11.5,
                                            height: 28,
                                            minHeight: 28,
                                            px: 1.25,
                                            // Tablet/laptop (900–1439) + desktop (≥1440): 38px pill matching other pages.
                                            '@media (min-width: 900px)': {
                                                fontSize: 13.5,
                                                height: 38,
                                                minHeight: 38,
                                                px: 1.75,
                                                letterSpacing: "-0.01em",
                                                fontWeight: isActive ? 950 : 700,
                                            },
                                            // Tab icons only appear at true desktop (≥1440). Tablet is text-only.
                                            "& .MuiButton-startIcon": { display: "none", marginRight: 0, marginLeft: 0, "@media (min-width: 1440px)": { display: "flex", marginRight: 0.9 } },
                                            flexDirection: "row", gap: 0,
                                            py: 0,
                                            color: isActive ? t.palette.primary.main : t.palette.text.secondary,
                                            backgroundColor: isActive ? alpha(t.palette.primary.main, 0.08) : "transparent",
                                            border: "1px solid",
                                            borderColor: isActive ? alpha(t.palette.primary.main, isMobile ? 0.18 : 0.2) : "transparent",
                                            boxShadow: "none", whiteSpace: "nowrap", flexShrink: 0,
                                            transition: `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                            "&:hover": { backgroundColor: isActive ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04), color: isActive ? t.palette.primary.main : t.palette.text.primary },
                                            "&:focus-visible": { outline: "none", boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.20)}` },
                                        };}}
                                    startIcon={<FrontHandRoundedIcon sx={(t) => { const isActive = isRequestsMode && !(isMobile && mobileView === "discover"); return { fontSize: 18, '@media (min-width: 1440px)': { fontSize: 22 }, opacity: isActive ? 1 : 0.72, color: isActive ? t.palette.primary.main : t.palette.text.secondary }; }} />}
                            >Requests</Button>

                            {/* Phone: Map + Search icons pushed right.
                                Tablet/laptop promotes these to labeled buttons below. */}
                            {isPhoneServices && mobileView !== "discover" && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: "auto", flexShrink: 0 }}>
                                    <IconButton onClick={() => { setFocusServiceId(null); setFocusRequestId(null); setMobileMapOpen(true); }} size="small"
                                                sx={(t) => ({ width: 32, height: 32, color: t.palette.text.secondary, transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`, "&:hover": { color: "primary.main" } })}
                                                aria-label="Map">
                                        <MapOutlinedIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                    <IconButton onClick={() => setMobileFilterDrawerOpen(true)} size="small"
                                                sx={(t) => ({ width: 32, height: 32, color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.secondary, transition: `color 140ms cubic-bezier(0.2, 0.8, 0.2, 1)`, "&:hover": { color: "primary.main" } })}
                                                aria-label="Search & Filter">
                                        <SearchRoundedIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        {/* Search row — tablet/laptop + desktop (phone uses filter drawer).
                            Hidden at any width when Discover is active. */}
                        {mobileView !== "discover" && (
                            <Box sx={(t) => ({
                                flex: "1 1 auto", minWidth: 200, ml: 0.75,
                                display: "none", "@media (min-width: 900px)": { display: "flex" }, alignItems: "center", gap: 0.5,
                                "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled)": { color: t.palette.common.white },
                                "& .MuiButton-root.MuiButton-contained:not(.Mui-disabled):hover": { color: t.palette.common.white },
                            })}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <SearchInput placeholder="Search services..." value={searchDraft}
                                                 onChange={(e) => setSearchDraft(e?.target?.value ?? "")}
                                                 inputProps={{ maxLength: 120, autoComplete: "new-password", name: "ll-services-search", autoCorrect: "off", autoCapitalize: "none", spellCheck: "false", inputMode: "search" }}
                                                 onSearch={() => { setSearch(String(searchDraft || "").trim()); scrollServicesToTop(); }}
                                                 onClear={() => { setSearchDraft(""); setSearch(""); scrollServicesToTop(); }} />
                                </Box>
                            </Box>
                        )}

                        {/* Tablet/laptop (900–1439): labeled Filters + Map buttons.
                            At narrow tablet (900–1099) they collapse to icon-only.
                            Hidden at any width in Discover mode. */}
                        {isTabletServices && mobileView !== "discover" && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                {/* Filters */}
                                <Tooltip title={isNarrowTabletServices ? `Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}` : ''}>
                                    {isNarrowTabletServices ? (
                                        <IconButton
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                border: '1px solid',
                                                color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.primary,
                                                borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.text.primary, 0.18),
                                                bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                position: 'relative',
                                                '&:hover': {
                                                    bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.5) : alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label={`Filters${activeFilterChips.length > 0 ? ` (${activeFilterChips.length} active)` : ''}`}
                                        >
                                            <FilterListRoundedIcon sx={{ fontSize: 18 }} />
                                            {activeFilterChips.length > 0 && (
                                                <Box sx={(t) => ({
                                                    position: 'absolute',
                                                    top: -2, right: -2,
                                                    minWidth: 16, height: 16,
                                                    px: 0.5,
                                                    borderRadius: 999,
                                                    bgcolor: t.palette.primary.main,
                                                    color: t.palette.primary.contrastText,
                                                    fontSize: 10,
                                                    fontWeight: 900,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    lineHeight: 1,
                                                })}>
                                                    {activeFilterChips.length}
                                                </Box>
                                            )}
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => setMobileFilterDrawerOpen(true)}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<FilterListRoundedIcon sx={{ fontSize: '18px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                px: 1.75,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                color: activeFilterChips.length > 0 ? t.palette.primary.main : t.palette.text.primary,
                                                borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.4) : alpha(t.palette.text.primary, 0.18),
                                                bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.06) : 'transparent',
                                                '&:hover': {
                                                    bgcolor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.1) : alpha(t.palette.text.primary, 0.04),
                                                    borderColor: activeFilterChips.length > 0 ? alpha(t.palette.primary.main, 0.5) : alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Filters"
                                        >
                                            Filters{activeFilterChips.length > 0 ? ` (${activeFilterChips.length})` : ''}
                                        </Button>
                                    )}
                                </Tooltip>

                                {/* Map */}
                                <Tooltip title={isNarrowTabletServices ? 'Map' : ''}>
                                    {isNarrowTabletServices ? (
                                        <IconButton
                                            onClick={() => { setFocusServiceId(null); setFocusRequestId(null); setMobileMapOpen(true); }}
                                            size="small"
                                            sx={(t) => ({
                                                width: 38, height: 38, borderRadius: 999,
                                                border: '1px solid',
                                                color: t.palette.text.primary,
                                                borderColor: alpha(t.palette.text.primary, 0.18),
                                                bgcolor: 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                                    borderColor: alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Map"
                                        >
                                            <MapOutlinedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    ) : (
                                        <Button
                                            onClick={() => { setFocusServiceId(null); setFocusRequestId(null); setMobileMapOpen(true); }}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<MapOutlinedIcon sx={{ fontSize: '18px !important' }} />}
                                            sx={(t) => ({
                                                borderRadius: 999,
                                                textTransform: 'none',
                                                fontWeight: 800,
                                                fontSize: 13.5,
                                                px: 1.75,
                                                height: 38,
                                                whiteSpace: 'nowrap',
                                                color: t.palette.text.primary,
                                                borderColor: alpha(t.palette.text.primary, 0.18),
                                                bgcolor: 'transparent',
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.text.primary, 0.04),
                                                    borderColor: alpha(t.palette.text.primary, 0.28),
                                                },
                                            })}
                                            aria-label="Map"
                                        >
                                            Map
                                        </Button>
                                    )}
                                </Tooltip>
                            </Box>
                        )}

                        {/* Tablet/laptop + desktop: Offer Service / Request a Service button.
                            Icon-only at narrow tablet (900–1099), labeled at wider tablet and desktop.
                            Hidden at any width in Discover mode. */}
                        {mobileView !== "discover" && (
                            <Box sx={{ display: "none", "@media (min-width: 900px)": { display: "flex" }, alignItems: "center", gap: 1, flexShrink: 0, ml: "auto", justifyContent: "flex-end", mt: 0 }}>
                                {isRequestsMode ? (
                                    isNarrowTabletServices ? (
                                        <Tooltip title="Request a Service">
                                            <IconButton
                                                onClick={handleOpenCreateRequest}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 38, height: 38, borderRadius: 999,
                                                    bgcolor: t.palette.primary.main,
                                                    color: t.palette.common.white,
                                                    boxShadow: 'none',
                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' },
                                                })}
                                                aria-label="Request a Service"
                                            >
                                                <PostAddRoundedIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Button variant="contained" startIcon={<PostAddRoundedIcon />} size="small"
                                                onClick={handleOpenCreateRequest}
                                                sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 950, px: 1.35, height: 38, minWidth: { xs: 110, sm: 160 }, justifyContent: "center", whiteSpace: "nowrap", borderWidth: 1, borderColor: alpha(t.palette.primary.main, 0.18), color: t.palette.common.white, backgroundColor: t.palette.primary.main, boxShadow: "none", "&:hover": { borderColor: alpha(t.palette.primary.main, 0.22), backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" } })}>
                                            Request a Service
                                        </Button>
                                    )
                                ) : (
                                    isNarrowTabletServices ? (
                                        <Tooltip title="Offer Service">
                                            <IconButton
                                                onClick={handleOpenCreate}
                                                size="small"
                                                sx={(t) => ({
                                                    width: 38, height: 38, borderRadius: 999,
                                                    bgcolor: t.palette.primary.main,
                                                    color: t.palette.common.white,
                                                    boxShadow: 'none',
                                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: 'none' },
                                                })}
                                                aria-label="Offer Service"
                                            >
                                                <AddIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} size="small"
                                                sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 950, px: 1.35, height: 38, minWidth: { xs: 110, sm: 140 }, justifyContent: "center", whiteSpace: "nowrap", borderWidth: 1, borderColor: alpha(t.palette.primary.main, 0.18), color: t.palette.common.white, backgroundColor: t.palette.primary.main, boxShadow: "none", "&:hover": { borderColor: alpha(t.palette.primary.main, 0.22), backgroundColor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" } })}>
                                            Offer Service
                                        </Button>
                                    )
                                )}
                            </Box>
                        )}

                        {/* Active filter chips — nested inside mobileHeaderRef so they
                            slide with the subheader on scroll. Matches Marketplace/Music pattern. */}
                        {isMobile && mobileView !== "discover" && activeFilterChips.length > 0 && (
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, pb: 0.75, flexWrap: 'wrap',
                            }}>
                                {activeFilterChips.slice(0, 3).map((chip) => (
                                    <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                          sx={(t) => ({ height: 26, maxWidth: 160, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: '1px solid', borderColor: alpha(t.palette.primary.main, 0.2), '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, '& .MuiChip-deleteIcon': { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, '&:hover': { color: t.palette.primary.main } } })} />
                                ))}
                                {activeFilterChips.length > 3 && (
                                    <Chip label={`+${activeFilterChips.length - 3} more`} size="small" onClick={() => setMobileFilterDrawerOpen(true)}
                                          sx={(t) => ({ height: 26, borderRadius: 999, fontWeight: 700, fontSize: 11, bgcolor: alpha(t.palette.primary.main, 0.06), color: t.palette.primary.main, cursor: 'pointer' })} />
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Content (filters + list + footer): fades when switching tabs */}
                    <Fade in={contentVisible} timeout={tabFadeMs} appear={false}>
                        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>

                            {/* ── Mobile: inline Discover / Overview view ── */}
                            {isMobile && mobileView === "discover" && (
                                <>
                                    <Box sx={{
                                        flex: 1,
                                        minHeight: 0,
                                        overflow: "auto",
                                        WebkitOverflowScrolling: "touch",
                                        overscrollBehavior: "contain",
                                        position: "relative",
                                        zIndex: 1,
                                        bgcolor: "background.paper",
                                        // Reserve space for the floating AppBar + section header
                                        // so the cover image isn't hidden behind them on initial paint.
                                        "@media (max-width: 1439px)": {
                                            paddingTop: "var(--ll-subheader-height, 52px)",
                                        },
                                        "@media (max-width: 899px)": {
                                            paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                        },
                                    }}>
                                        {isRequestsMode ? (
                                            <RequestsOverviewPanel
                                                requestItems={allRequestItems}
                                                activeCategory={requestsFilters.category || ""}
                                                activeUrgency={requestsFilters.urgency || ""}
                                                locationCity={requestsFilters.city || ""}
                                                locationCounty={requestsFilters.county || ""}
                                                locationStatewide={Boolean(requestsFilters.statewideOnly)}
                                                onSelectCategory={(slug) => {
                                                    setRequestsFilters((prev) => ({ ...prev, category: slug }));
                                                    scrollServicesToTop();
                                                    setMobileView("list");
                                                }}
                                                onSelectUrgency={(urgency) => {
                                                    setRequestsFilters((prev) => ({ ...prev, urgency: urgency }));
                                                    scrollServicesToTop();
                                                    setMobileView("list");
                                                }}
                                            />
                                        ) : (
                                            <ServiceDiscoverTab />
                                        )}
                                    </Box>
                                </>
                            )}

                            {/* Content — hidden when mobile discover view is active */}
                            {(!isMobile || mobileView !== "discover") && !isRequestsMode && (
                                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                                    {/* Alerts — network errors are shown inline by ServicesList */}
                                    {((error && !isNetworkError(error)) || (myServicesError && !isNetworkError(myServicesError))) && (
                                        <Box sx={{ flexShrink: 0, p: 1, '@media (min-width: 1440px)': { p: 1.5 } }}>
                                            <Stack spacing={1}>
                                                {error && !isNetworkError(error) ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error.message || "Something went wrong loading services."}</Alert> : null}
                                                {myServicesError && !isNetworkError(myServicesError) ? <Alert severity="error" sx={{ borderRadius: 2 }}>{myServicesError.message || "Could not load your services."}</Alert> : null}
                                            </Stack>
                                        </Box>
                                    )}

                                    <Divider sx={{ borderColor: "divider" }} />

                                    <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                                        <Box data-services-scroll onTouchStart={isMobile ? handlePullTouchStart : undefined} onTouchMove={isMobile ? handlePullTouchMove : undefined} onTouchEnd={isMobile ? handlePullTouchEnd : undefined} sx={{
                                            height: "100%",
                                            overflowY: "scroll",
                                            scrollbarGutter: "stable",
                                            px: 0, py: 0,
                                            '@media (min-width: 1440px)': { px: 1.25, py: 1 },
                                            // Mobile/tablet: reserve space for floating chrome.
                                            "@media (max-width: 1439px)": {
                                                paddingTop: "var(--ll-subheader-height, 52px)",
                                            },
                                            "@media (max-width: 899px)": {
                                                paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                            },
                                            opacity: listFadeIn ? 0 : 1,
                                            transition: (t) => `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
                                            WebkitOverflowScrolling: "touch",
                                            overscrollBehavior: "contain"
                                        }}>
                                            {!isMobile && (
                                                <Box sx={{ px: 0, pt: 0, '@media (min-width: 1440px)': { px: 0.25, pt: 0.25 }, pb: 0.75 }}>
                                                    <ServicesFilters
                                                        filters={filters}
                                                        onChangeFilters={(v) => { setFilters(v); scrollServicesToTop(); }}
                                                        categories={categories}
                                                        categoriesLoading={categoriesLoading}
                                                        showAdvancedFilters={showFilters}
                                                        sort={sort}
                                                        onChangeSort={(v) => { setSort(v); scrollServicesToTop(); }}
                                                        view={serviceView}
                                                        onChangeView={(v) => { setServiceView(v); scrollServicesToTop(); }}
                                                        viewOptions={SERVICES_VIEW_OPTIONS}
                                                        hideCoverage
                                                        locationCounts={locationCounts}
                                                        viewer={loggedInUser}
                                                        search={search}
                                                        onSearchChange={handleSavedSearchChange}
                                                        onClearAll={clearAllFilters}
                                                        activeChips={activeFilterChips}
                                                    />
                                                </Box>
                                            )}
                                            {/* Pull-to-refresh indicator (mobile only) */}
                                            {isMobile && (pullDistance > 0 || pullRefreshing) && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: pullRefreshing ? 56 : Math.max(pullDistance, 0), overflow: 'hidden', transition: pullRefreshing ? 'height 0.2s ease' : 'none', flexShrink: 0 }}>
                                                    <CircularProgress size={24} thickness={4} sx={{ opacity: pullRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }} />
                                                </Box>
                                            )}
                                            {displayLoading && displayItems.length === 0 ? (
                                                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                                                    <PulsingDots />
                                                </Box>
                                            ) : displayEmpty && !displayLoading && !error ? (
                                                <Fade in timeout={350}>
                                                    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
                                                        <Box sx={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.1, textAlign: "center" }}>
                                                            <StorefrontRoundedIcon sx={{ fontSize: 64, color: "primary.main", mb: 0.5 }} />
                                                            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                                                                {serviceEmptyMsg.headline}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                                                {serviceEmptyMsg.subtitle}
                                                            </Typography>
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={<PostAddRoundedIcon />}
                                                                onClick={handleOpenCreate}
                                                                sx={{ mt: 1.5, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                                                            >
                                                                Post a Service
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </Fade>
                                            ) : (
                                                <ServicesList items={displayItems} isLoading={displayLoading} isEmpty={displayEmpty}
                                                              error={error}
                                                              emptyTitle={serviceEmptyMsg.headline}
                                                              emptyMessage={serviceEmptyMsg.subtitle}
                                                              onClickService={handleClickService} hasMore={hasMore} onLoadMore={loadMore}
                                                              selectedServiceId={selectedService?.id} showStatus={false}
                                                              onEditService={handleEditService} onDeleteService={handleCardDelete}
                                                              onLocationClick={(svc) => { if (isMobile) { const alreadyOpen = mobileMapOpen; setMobileMapOpen(true); if (svc?.id) { setFocusServiceId(String(svc.id)); if (!alreadyOpen) setTimeout(() => setFocusServiceId(String(svc.id)), 380); } } else { setRightTab("map"); if (svc?.id) setFocusServiceId(String(svc.id)); } }}
                                                              onHoverService={setHoveredServiceId}
                                                              onRequestQuote={handleRequestQuote}
                                                              onFavorite={handleFavorite}
                                                              user={loggedInUser} activeAccount={activeAccount} totalCount={displayTotal}
                                                              onCreateService={handleOpenCreate} isMyMode={false}
                                                              onRefresh={refresh}
                                                              skipStagger={Boolean(suppressFadeRef.current) || Date.now() < backNavFadeUntilRef.current} />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.12), px: 1.25, py: 1, '@media (min-width: 1440px)': { px: 1.5 }, display: "none", "@media (min-width: 1440px)": { display: "flex" }, alignItems: "center", justifyContent: "center", bgcolor: "background.paper", backgroundImage: "none", backdropFilter: "none" }}>
                                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.secondary", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: 22 }}>
                                            {statusText}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {/* ─── Requests Tab Content ─── */}
                            {(!isMobile || mobileView !== "discover") && isRequestsMode && (
                                <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
                                    {requestsError && (
                                        <Box sx={{ flexShrink: 0, p: 1, '@media (min-width: 1440px)': { p: 1.5 } }}>
                                            <Alert severity="error" sx={{ borderRadius: 2 }}>{requestsError.message || "Something went wrong loading requests."}</Alert>
                                        </Box>
                                    )}

                                    <Divider sx={{ borderColor: "divider" }} />

                                    <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                                        <Box data-services-requests-scroll sx={{
                                            height: "100%",
                                            overflowY: "auto",
                                            scrollbarGutter: "stable",
                                            px: 0, py: 0,
                                            '@media (min-width: 1440px)': { px: 1.25, py: 1 },
                                            // Mobile/tablet: reserve space for floating chrome.
                                            "@media (max-width: 1439px)": {
                                                paddingTop: "var(--ll-subheader-height, 52px)",
                                            },
                                            "@media (max-width: 899px)": {
                                                paddingBottom: "var(--ll-bottom-nav-height, 56px)",
                                            },
                                            opacity: listFadeIn ? 0 : 1,
                                            transition: (t) => `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}`
                                        }}>
                                            {!isMobile && (
                                                <Box sx={{ px: 0, pt: 0, '@media (min-width: 1440px)': { px: 0.25, pt: 0.25 }, pb: 0.75 }}>
                                                    <ServicesFilters
                                                        filters={requestsFilters}
                                                        onChangeFilters={(v) => { setRequestsFilters(v); scrollServicesToTop(); }}
                                                        categories={requestCategories}
                                                        categoriesLoading={requestsLoading && requestCategories.length === 0}
                                                        showAdvancedFilters={showFilters}
                                                        view={requestsView}
                                                        onChangeView={(v) => { setRequestsView(v); scrollServicesToTop(); }}
                                                        viewOptions={REQUESTS_VIEW_OPTIONS}
                                                        sort={requestsSort}
                                                        onChangeSort={(v) => { setRequestsSort(v); scrollServicesToTop(); }}
                                                        hidePricing
                                                        hideCoverage
                                                        isRequestsMode
                                                        locationCounts={requestLocationCounts}
                                                        viewer={loggedInUser}
                                                        search={search}
                                                        onSearchChange={handleSavedSearchChange}
                                                        onClearAll={clearAllFilters}
                                                        activeChips={activeFilterChips}
                                                    />
                                                </Box>
                                            )}
                                            {requestsLoading && requestItems.length === 0 ? (
                                                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "50vh" }}>
                                                    <PulsingDots />
                                                </Box>
                                            ) : displayEmpty ? (
                                                <Fade in timeout={350}>
                                                    <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
                                                        <Box sx={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.1, textAlign: "center" }}>
                                                            <InboxRoundedIcon sx={{ fontSize: 64, color: "primary.main", mb: 0.5 }} />
                                                            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                                                                {requestEmptyMsg.headline}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                                                {requestEmptyMsg.subtitle}
                                                            </Typography>
                                                            {(requestsView === "mine" || requestsView === "all") && (
                                                                <Button
                                                                    variant="outlined"
                                                                    startIcon={<PostAddRoundedIcon />}
                                                                    onClick={handleOpenCreateRequest}
                                                                    sx={{ mt: 1.5, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
                                                                >
                                                                    Post a Request
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Fade>
                                            ) : (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
                                                    {requestItems.map((req, idx) => (
                                                        <Box
                                                            key={req.id}
                                                            sx={{
                                                                display: "flex",
                                                                flex: { xs: "0 0 100%", sm: "0 0 100%", lg: "0 0 calc(50% - 16px)" },
                                                                mx: 0, my: 0, '@media (min-width: 1440px)': { mx: 1, my: 1 }, minWidth: 0, maxWidth: "100%",
                                                                ...(shouldRestoreRef.current ? {} : {
                                                                    animation: "reqCardFadeIn 320ms ease-out both",
                                                                    animationDelay: `${Math.min(idx * 40, 400)}ms`,
                                                                }),
                                                            }}
                                                        >
                                                            <ServiceRequestCard
                                                                request={req}
                                                                onClick={handleClickRequest}
                                                                selected={selectedRequest != null && String(req.id) === String(selectedRequest?.id)}
                                                                onEdit={handleEditRequest}
                                                                onDelete={handleCardDeleteRequest}
                                                                onOpenUserCard={handleOpenUserCard}
                                                                onShare={handleShareRequest}
                                                                onReport={(r) => { if (!loggedInUser) { openAuthPopup(); return; } setSelectedRequest(r); setReportTarget("service_request"); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }}
                                                                onLocationClick={(r) => { if (isMobile) { const alreadyOpen = mobileMapOpen; setMobileMapOpen(true); if (r?.id) { setFocusRequestId(String(r.id)); if (!alreadyOpen) setTimeout(() => setFocusRequestId(String(r.id)), 380); } } else { setRightTab("map"); if (r?.id) setFocusRequestId(String(r.id)); } }}
                                                                onViewResponses={(r) => { handleClickRequest(r); setRequestDetailTab(2); }}
                                                                onHover={setHoveredServiceId}
                                                                user={loggedInUser}
                                                                activeAccount={activeAccount}
                                                            />
                                                        </Box>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: (t) => alpha(t.palette.primary.main, 0.12), px: 1.25, py: 1, '@media (min-width: 1440px)': { px: 1.5 }, display: "none", "@media (min-width: 1440px)": { display: "flex" }, alignItems: "center", justifyContent: "center", bgcolor: "background.paper", backgroundImage: "none", backdropFilter: "none" }}>
                                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.secondary", width: "100%", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minHeight: 22 }}>
                                            {statusText}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                        </Box>
                    </Fade>
                </Box>
            </Box>

            {/* ═══ Right Panel — desktop only (mobile uses drawers) ═══ */}
            <Box sx={{ display: "none", "@media (min-width: 1440px)": { display: "block" }, width: RIGHT_WIDTH, flex: "0 0 auto", height: "100%" }}>
                <Box sx={(t) => ({ position: "relative", height: "100%", p: 0, overflow: "hidden", border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), borderRadius: 3, bgcolor: t.palette.background.paper, backdropFilter: "none", backgroundImage: "none", boxShadow: "0 14px 44px " + alpha(t.palette.text.primary, 0.08), display: "flex", flexDirection: "column" })}>
                    <Box sx={{ flexShrink: 0, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                        <Tabs value={isRequestsMode ? (rightTab === "discover" ? "overview" : rightTab) : rightTab} onChange={(_, v) => setRightTab(v)} variant="fullWidth"
                              sx={(t) => ({ minHeight: 42, bgcolor: t.palette.background.paper, "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontWeight: 700, fontSize: 13.5, py: 0, color: t.palette.text.secondary, "&.Mui-selected": { color: t.palette.primary.main, fontWeight: 950 } }, "& .MuiTabs-indicator": { height: 2.5, borderRadius: 999, bgcolor: t.palette.primary.main } })}>
                            {!isRequestsMode && <Tab value="discover" icon={<ExploreOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Discover" />}
                            {isRequestsMode && <Tab value="overview" icon={<ExploreOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />}
                            <Tab value="detail" icon={isRequestsMode ? <FrontHandRoundedIcon sx={{ fontSize: 18 }} /> : <BuildRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={isRequestsMode ? "Request Detail" : "Service Detail"} />
                            <Tab value="map" icon={<MapOutlinedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Map" />
                        </Tabs>
                    </Box>

                    <Box sx={{ flex: 1, minHeight: 0, position: "relative", overflow: "hidden" }}>
                        {/* ─── Discover (only in services mode) ─── */}
                        {!isRequestsMode && rightTab === "discover" && (
                            <Fade in timeout={280} key={`discover-${leftMode}`}>
                                <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                                    <ServiceDiscoverTab />
                                </Box>
                            </Fade>
                        )}

                        {/* ─── Overview (only in requests mode) ─── */}
                        {isRequestsMode && rightTab === "overview" && (
                            <Fade in timeout={280} key="overview-requests">
                                <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                                    <RequestsOverviewPanel
                                        requestItems={allRequestItems}
                                        activeCategory={requestsFilters.category || ""}
                                        activeUrgency={requestsFilters.urgency || ""}
                                        locationCity={requestsFilters.city || ""}
                                        locationCounty={requestsFilters.county || ""}
                                        locationStatewide={Boolean(requestsFilters.statewideOnly)}
                                        onSelectCategory={(slug) => {
                                            setRequestsFilters((prev) => ({ ...prev, category: slug }));
                                            scrollServicesToTop();
                                        }}
                                        onSelectUrgency={(urgency) => {
                                            setRequestsFilters((prev) => ({ ...prev, urgency: urgency }));
                                            scrollServicesToTop();
                                        }}
                                    />
                                </Box>
                            </Fade>
                        )}

                        {/* ─── Detail ─── */}
                        {rightTab === "detail" && (
                            <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
                                {/* Service Detail (when NOT in requests mode) */}
                                {!isRequestsMode && detailService ? (
                                    <ServiceDetailPanel
                                        detailService={detailService}
                                        detailCatInfo={detailCatInfo}
                                        detailLocation={detailLocation}
                                        detailProviderName={detailProviderName}
                                        detailPriceLabel={detailPriceLabel}
                                        detailIsOwnListing={detailIsOwnListing}
                                        detailAllowsReviews={detailAllowsReviews}
                                        detailAllowsMessages={detailAllowsMessages}
                                        detailFav={detailFav}
                                        detailFavCount={detailFavCount}
                                        detailMenuAnchor={detailMenuAnchor}
                                        detailMenuOpen={detailMenuOpen}
                                        detailHoursExpanded={detailHoursExpanded}
                                        setDetailHoursExpanded={setDetailHoursExpanded}
                                        setDetailMenuAnchor={setDetailMenuAnchor}
                                        providerProfileAvatar={providerProfileAvatar}
                                        serviceDetailTab={serviceDetailTab}
                                        setServiceDetailTab={setServiceDetailTab}
                                        svcDescExpanded={svcDescExpanded}
                                        setSvcDescExpanded={setSvcDescExpanded}
                                        svcReviews={svcReviews}
                                        svcReviewsTotal={svcReviewsTotal}
                                        svcReviewsLoading={svcReviewsLoading}
                                        svcHighlightReviewId={svcHighlightReviewId}
                                        svcReviewSort={svcReviewSort}
                                        setSvcReviewSort={setSvcReviewSort}
                                        svcRespondingId={svcRespondingId}
                                        setSvcRespondingId={setSvcRespondingId}
                                        svcRespondText={svcRespondText}
                                        setSvcRespondText={setSvcRespondText}
                                        setSvcReviewMenuAnchor={setSvcReviewMenuAnchor}
                                        setSvcReviewMenuReview={setSvcReviewMenuReview}
                                        resolvedUserId={resolvedUserId}
                                        loggedInUser={loggedInUser}
                                        navigate={navigate}
                                        auth={auth}
                                        handleDetailFavorite={handleDetailFavorite}
                                        handleShareService={handleShareService}
                                        handleRequestQuote={handleRequestQuote}
                                        handleRespondToReview={handleRespondToReview}
                                        openSvcReviewForm={openSvcReviewForm}
                                        setReportTarget={setReportTarget}
                                        setReportReason={setReportReason}
                                        setReportDetails={setReportDetails}
                                        setReportConfirmed={setReportConfirmed}
                                        setReportDialogOpen={setReportDialogOpen}
                                        setReportSnack={setReportSnack}
                                        onSuccess={showSuccess}
                                        setRightTab={setRightTab}
                                        setUserAnchor={setUserAnchor}
                                        setUserForCard={setUserForCard}
                                        setFocusServiceId={setFocusServiceId}
                                        formatDetailFavCount={formatDetailFavCount}
                                        providerInfo={svcReviewProviderInfo}
                                        viewerIsOwner={viewerIsOwner}
                                    />

                                ) : !isRequestsMode && !detailService ? (
                                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "100%", px: 2 }}>
                                        <Box sx={{ maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                                            <Box
                                                sx={(t) => ({
                                                    width: 76,
                                                    height: 76,
                                                    borderRadius: "18px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: alpha(t.palette.primary.main, 0.06),
                                                    border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                                                })}
                                            >
                                                <BuildRoundedIcon sx={{ fontSize: 40, color: "primary.main" }} />
                                            </Box>
                                            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Select a Service</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45, maxWidth: 300 }}>
                                                Click a service card on the left to view details or contact the provider.
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : isRequestsMode && selectedRequest ? (
                                    <Stack spacing={0} sx={{ p: 1.5, '@media (min-width: 1440px)': { p: 2 } }}>
                                        {/* ══ HEADER ══ */}
                                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1 }}>
                                            {(() => {
                                                const reqAvatarSrc = resolveRequestAvatarSrc(selectedRequest);
                                                const rType = (selectedRequest.requesterType || selectedRequest.requester_type || "").toLowerCase();
                                                const userPayload = {
                                                    id: selectedRequest.requesterId,
                                                    first_name: selectedRequest.requesterName?.split(" ")[0],
                                                    last_name: selectedRequest.requesterName?.split(" ").slice(1).join(" "),
                                                    handle: selectedRequest.requesterHandle,
                                                    avatar_url: reqAvatarSrc,
                                                    ...(rType === "business" ? {
                                                        account_type: "business",
                                                        business_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterBusinessId,
                                                        business_name: selectedRequest.requesterName,
                                                        business_slug: selectedRequest.requesterHandle,
                                                    } : rType === "artist" ? {
                                                        account_type: "artist",
                                                        artist_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterArtistId,
                                                        artist_name: selectedRequest.requesterName,
                                                        artist_handle: selectedRequest.requesterHandle,
                                                    } : {}),
                                                };
                                                return (
                                                    <AccountAvatar
                                                        src={reqAvatarSrc}
                                                        accountType={selectedRequest.requesterType || selectedRequest.requester_type || (selectedRequest.requesterBusinessId ? "business" : selectedRequest.requesterArtistId ? "artist" : "user")}
                                                        size={44}
                                                        onClick={(e) => handleOpenUserCard(e.currentTarget, userPayload)}
                                                        sx={{ cursor: "pointer", flexShrink: 0 }}
                                                    />
                                                );
                                            })()}
                                            <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                                                <Box
                                                    onClick={(e) => {
                                                        const reqAvatarSrc = resolveRequestAvatarSrc(selectedRequest);
                                                        const rType = (selectedRequest.requesterType || selectedRequest.requester_type || "").toLowerCase();
                                                        handleOpenUserCard(e.currentTarget, {
                                                            id: selectedRequest.requesterId,
                                                            first_name: selectedRequest.requesterName?.split(" ")[0],
                                                            last_name: selectedRequest.requesterName?.split(" ").slice(1).join(" "),
                                                            handle: selectedRequest.requesterHandle,
                                                            avatar_url: reqAvatarSrc,
                                                            ...(rType === "business" ? {
                                                                account_type: "business",
                                                                business_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterBusinessId,
                                                                business_name: selectedRequest.requesterName,
                                                                business_slug: selectedRequest.requesterHandle,
                                                            } : rType === "artist" ? {
                                                                account_type: "artist",
                                                                artist_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterArtistId,
                                                                artist_name: selectedRequest.requesterName,
                                                                artist_handle: selectedRequest.requesterHandle,
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
                                                        "&:hover .ll-requester-name-desktop": { textDecoration: "underline" },
                                                    }}
                                                >
                                                    <Typography className="ll-requester-name-desktop" sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {selectedRequest.requesterName || "Someone"}
                                                    </Typography>
                                                    {selectedRequest.requesterHandle && (
                                                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>@{selectedRequest.requesterHandle}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                            {/* 3-dot menu */}
                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                                                <IconButton size="small" onClick={(e) => setReqDetailMenuAnchor(e.currentTarget)}
                                                            sx={(t) => ({ width: 32, height: 32, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, bgcolor: "background.paper", color: 'text.secondary', "&:hover": { bgcolor: "action.hover", color: 'text.primary' } })}>
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                            <SmartMenu anchorEl={reqDetailMenuAnchor} open={reqDetailMenuOpen} onClose={() => setReqDetailMenuAnchor(null)}
                                                       disableScrollLock
                                                       onClick={(e) => e.stopPropagation()}
                                                       sx={{ zIndex: 10000 }}
                                                       anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                                                       PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200, py: 0.5 } }}>
                                                <MenuItem onClick={() => { setReqDetailMenuAnchor(null); navigator.clipboard?.writeText(`${window.location.origin}/services/requests/${selectedRequest.id}`); showSuccess("Link copied"); }} sx={{ py: 1 }}>
                                                    <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary="Copy link" />
                                                </MenuItem>
                                                {isOnCorrectAccountForSelected && <Divider sx={{ my: 0.5 }} />}
                                                {isOnCorrectAccountForSelected && (
                                                    <MenuItem onClick={() => { setReqDetailMenuAnchor(null); handleEditRequest(selectedRequest); }} sx={{ py: 1 }}>
                                                        <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary="Edit" />
                                                    </MenuItem>
                                                )}
                                                {isOnCorrectAccountForSelected && (
                                                    <MenuItem onClick={() => { setReqDetailMenuAnchor(null); handleCardDeleteRequest(selectedRequest); }} sx={{ py: 1, color: 'error.main' }}>
                                                        <ListItemIcon sx={{ color: 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                                        <ListItemText primary="Delete" />
                                                    </MenuItem>
                                                )}
                                                {!isOnCorrectAccountForSelected && loggedInUser && (
                                                    <>
                                                        <Divider sx={{ my: 0.5 }} />
                                                        <MenuItem onClick={() => { setReqDetailMenuAnchor(null); if (!loggedInUser) { openAuthPopup(); return; } setReportTarget("service_request"); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }} sx={{ py: 1 }}>
                                                            <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                            <ListItemText primary="Report" />
                                                        </MenuItem>
                                                    </>
                                                )}
                                            </SmartMenu>
                                        </Box>

                                        {/* ══ TITLE ══ */}
                                        <Typography sx={{ fontWeight: 950, fontSize: 22, lineHeight: 1.2, mb: 0.5, wordBreak: "break-word", overflowWrap: "break-word", letterSpacing: "-0.01em" }}>
                                            {selectedRequest.title}
                                        </Typography>
                                        {selectedRequest.categorySlug && (() => {
                                            const reqCatInfo = getServiceCategoryInfo(selectedRequest.categorySlug);
                                            return reqCatInfo ? (
                                                <Box sx={{ mb: 0.5 }}>
                                                    <Chip size="small" icon={reqCatInfo.Icon ? <reqCatInfo.Icon sx={{ fontSize: 13 }} /> : undefined} label={reqCatInfo.name}
                                                          sx={(t) => ({ height: 24, borderRadius: 999, fontWeight: 800, fontSize: 10.5, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2), "& .MuiChip-icon": { color: t.palette.primary.main } })} />
                                                </Box>
                                            ) : null;
                                        })()}

                                        {/* ─── Full-width action buttons ─── */}
                                        <Divider sx={{ mt: 1.5 }} />
                                        <Stack direction="row" spacing={1} sx={{ pt: 1.5, pb: 1 }}>
                                            {!isPersonalOwnerOfSelected && !isRequesterOfSelected && (
                                                (myResponse || selectedRequest?.viewerHasResponded) ? (
                                                    <Button variant="outlined" fullWidth startIcon={<CheckCircleRoundedIcon sx={{ fontSize: "18px !important" }} />} disabled
                                                            sx={(t) => ({
                                                                borderRadius: 2, textTransform: "none", fontWeight: 900, py: { xs: 0.75, md: 1 }, fontSize: { xs: "0.8rem", md: "0.85rem" },
                                                                color: t.palette.success.main,
                                                                borderColor: alpha(t.palette.success.main, 0.3),
                                                                "&.Mui-disabled": { color: t.palette.success.main, borderColor: alpha(t.palette.success.main, 0.3) },
                                                            })}>
                                                        Responded
                                                    </Button>
                                                ) : (
                                                    <Button variant="contained" fullWidth startIcon={<SendRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                                            onClick={() => { if (!auth?.user) { openAuthPopup(); return; } setRespondModalOpen(true); }}
                                                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, py: { xs: 0.75, md: 1 }, fontSize: { xs: "0.8rem", md: "0.85rem" } }}>
                                                        Respond to Request
                                                    </Button>
                                                )
                                            )}
                                            {isRequesterOfSelected && (
                                                <Button
                                                    variant={selectedRequest.status === "filled" ? "outlined" : "contained"}
                                                    color={selectedRequest.status === "filled" ? "inherit" : "success"}
                                                    fullWidth
                                                    startIcon={selectedRequest.status === "filled" ? <LockOpenRoundedIcon sx={{ fontSize: "18px !important" }} /> : <CheckCircleRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                                    onClick={handleCloseRequest}
                                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, py: { xs: 0.75, md: 1 }, fontSize: { xs: "0.8rem", md: "0.85rem" } }}
                                                >
                                                    {selectedRequest.status === "filled" ? "Reopen" : "Mark as Filled"}
                                                </Button>
                                            )}
                                            {!isMobile && (
                                                <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                                        onClick={() => {
                                                            try {
                                                                sessionStorage.setItem("ll:services:navigatedToRequest", "1");
                                                                sessionStorage.setItem("ll:services:tab", "requests");
                                                                const el = document.querySelector("[data-services-requests-scroll]");
                                                                if (el) sessionStorage.setItem("ll:services:scrollTop", String(el.scrollTop || 0));
                                                            } catch { /* ignore */ }
                                                            navigate(`/services/requests/${selectedRequest.id}`, { state: { fromServices: true } });
                                                        }}
                                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, py: 1, fontSize: "0.85rem", borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                                                    View Request Page
                                                </Button>
                                            )}
                                            <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                                    onClick={() => handleShareRequest()}
                                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, py: 1, fontSize: "0.85rem", borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                                                Share
                                            </Button>
                                        </Stack>

                                        {/* ─── Sticky Tabs Container (divider line before tabs) ─── */}
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

                                            {/* ══ TABS ══ */}
                                            <Tabs value={requestDetailTab} onChange={(_e, v) => setRequestDetailTab(v)} variant="fullWidth"
                                                  sx={(t) => ({
                                                      minHeight: 52, '@media (min-width: 1440px)': { minHeight: 38 },
                                                      flexShrink: 0,
                                                      borderRadius: 0,
                                                      padding: 0,
                                                      backgroundColor: "transparent",
                                                      border: "none",
                                                      boxShadow: "none",
                                                      borderBottom: "1px solid",
                                                      borderColor: alpha(t.palette.primary.main, 0.12),
                                                      "& .MuiTab-root": {
                                                          minHeight: 52, '@media (min-width: 1440px)': { minHeight: 38 },
                                                          textTransform: "none",
                                                          fontWeight: 700,
                                                          fontSize: 11, '@media (min-width: 1440px)': { fontSize: 13.5 },
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
                                                  })}>
                                                <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 18, '@media (min-width: 1440px)': { fontSize: 16 } }} />} iconPosition={isMobile ? "top" : "start"} label="About" value={0} />
                                                <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 18, '@media (min-width: 1440px)': { fontSize: 16 } }} />} iconPosition={isMobile ? "top" : "start"}
                                                     label={`Photos${Array.isArray(selectedRequest.photos) && selectedRequest.photos.length > 0 ? ` (${selectedRequest.photos.length})` : ""}`} value={1} />
                                                {isRequesterOfSelected && (
                                                    <Tab icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, '@media (min-width: 1440px)': { fontSize: 16 } }} />} iconPosition={isMobile ? "top" : "start"}
                                                         label={`Responses${responses.length > 0 ? ` (${responses.length})` : ""}`} value={2} />
                                                )}
                                            </Tabs>
                                        </Box>

                                        {/* ══ TAB 0: ABOUT ══ */}
                                        {requestDetailTab === 0 && (
                                            <Stack spacing={1.75} sx={{ pt: 2 }}>
                                                <Stack spacing={1.5}>
                                                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                        <LocationOnRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Location</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
                                                                {selectedRequest.locationLabel || [selectedRequest.city, selectedRequest.county ? `${selectedRequest.county} County` : ""].filter(Boolean).join(", ") || "Alabama (Statewide)"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                        <InfoRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Status</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                {selectedRequest.status === "filled" ? "Filled" : "Open"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                        <ScheduleRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Timeline</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                {selectedRequest.urgency === "asap" ? "ASAP" : selectedRequest.urgency === "within_week" ? "This Week" : selectedRequest.urgency === "within_month" ? "This Month" : "Flexible"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                        <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Posted</Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    {selectedRequest.contactPreference && (
                                                        <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                            {selectedRequest.contactPreference === "call" ? <PhoneRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                                : selectedRequest.contactPreference === "email" ? <EmailRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                                    : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />}
                                                            <Box sx={{ minWidth: 0 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Preferred Contact</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                                    {selectedRequest.contactPreference === "call" ? "Phone Call" : selectedRequest.contactPreference === "email" ? "Email" : "Message"}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Stack>
                                                <Divider />
                                                {selectedRequest.description && (
                                                    <Box sx={{ position: "relative" }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5, display: "block", mb: 0.5 }}>Description</Typography>
                                                        <Box sx={{ maxHeight: requestDescExpanded ? "none" : REQ_DESC_MAX_HEIGHT, overflowY: requestDescExpanded ? "visible" : "hidden", position: "relative" }}>
                                                            <RichTextDisplay html={selectedRequest.description} sx={{ color: "text.secondary" }} />
                                                        </Box>
                                                        {!requestDescExpanded && selectedRequest.description.length > 200 && (
                                                            <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`, pointerEvents: "none" })} />
                                                        )}
                                                        {selectedRequest.description.length > 200 && (
                                                            <Button size="small" onClick={() => setRequestDescExpanded((prev) => !prev)}
                                                                    sx={{ mt: requestDescExpanded ? 0.5 : -0.25, position: "relative", zIndex: 2, textTransform: "none", fontWeight: 850, fontSize: "0.78rem", px: 0, minWidth: 0, color: "primary.main", "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>
                                                                {requestDescExpanded ? "Show less" : "Show more"}
                                                            </Button>
                                                        )}
                                                    </Box>
                                                )}
                                                {(selectedRequest.budgetMin || selectedRequest.budgetMax || selectedRequest.budgetNotes || selectedRequest.budgetType) && (
                                                    <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.12) })}>
                                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                                                            <AttachMoneyRoundedIcon sx={{ fontSize: 16, color: "success.main" }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 900, color: "success.main", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Budget</Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 15, mb: 0.25 }}>
                                                            {selectedRequest.budgetMin && selectedRequest.budgetMax
                                                                ? `$${Number(selectedRequest.budgetMin).toLocaleString()}\u2013$${Number(selectedRequest.budgetMax).toLocaleString()}`
                                                                : selectedRequest.budgetMin ? `From $${Number(selectedRequest.budgetMin).toLocaleString()}`
                                                                    : selectedRequest.budgetMax ? `Up to $${Number(selectedRequest.budgetMax).toLocaleString()}`
                                                                        : selectedRequest.budgetNotes || (selectedRequest.budgetType === "flexible" ? "Flexible" : "Not specified")}
                                                            {selectedRequest.budgetType === "hourly" ? "/hr" : selectedRequest.budgetType === "flat" ? " (flat rate)" : ""}
                                                        </Typography>
                                                        {selectedRequest.budgetNotes && (selectedRequest.budgetMin || selectedRequest.budgetMax) && (
                                                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25, wordBreak: "break-word" }}>{selectedRequest.budgetNotes}</Typography>
                                                        )}
                                                    </Box>
                                                )}
                                                {selectedRequest.timelineNotes && (
                                                    <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.info.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.info.main, 0.12) })}>
                                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.5 }}>
                                                            <EventNoteRoundedIcon sx={{ fontSize: 16, color: "info.main" }} />
                                                            <Typography variant="caption" sx={{ fontWeight: 900, color: "info.main", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Timeline Notes</Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ lineHeight: 1.6, color: "text.secondary", wordBreak: "break-word" }}>{selectedRequest.timelineNotes}</Typography>
                                                    </Box>
                                                )}

                                                {/* ── Non-owner: "Your Response" display ── */}
                                                {!isRequesterOfSelected && myResponse && (() => {
                                                    return (
                                                        <Box sx={(t) => ({ p: 2, borderRadius: 2.5, border: "1px solid",
                                                            borderColor: myResponse.status === "accepted" ? alpha(t.palette.success.main, 0.25) : myResponse.status === "declined" ? alpha(t.palette.error.main, 0.2) : alpha(t.palette.primary.main, 0.12),
                                                            bgcolor: myResponse.status === "accepted" ? alpha(t.palette.success.main, 0.04) : t.palette.background.paper })}>
                                                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                                                                <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Your Response</Typography>
                                                                <Chip size="small" label={myResponse.status === "accepted" ? "Accepted!" : myResponse.status === "declined" ? "Declined" : "Pending Review"}
                                                                      color={myResponse.status === "accepted" ? "success" : myResponse.status === "declined" ? "error" : "warning"}
                                                                      variant={myResponse.status === "accepted" ? "filled" : "outlined"} sx={{ height: 22, fontSize: 10.5, fontWeight: 800 }} />
                                                            </Box>
                                                            <RichTextDisplay html={myResponse.message} sx={{ color: "text.secondary", mb: 1 }} />
                                                            <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 1 }}>
                                                                {(myResponse.quoteMin || myResponse.quoteMax || myResponse.quoteType === "free_estimate") && (
                                                                    <Chip size="small" icon={<AttachMoneyRoundedIcon sx={{ fontSize: 13 }} />}
                                                                          label={myResponse.quoteType === "free_estimate" ? "Free Estimate" : myResponse.quoteMin && myResponse.quoteMax ? `$${Number(myResponse.quoteMin).toLocaleString()}–$${Number(myResponse.quoteMax).toLocaleString()}${myResponse.quoteType === "hourly" ? "/hr" : ""}` : myResponse.quoteMin ? `From $${Number(myResponse.quoteMin).toLocaleString()}` : `Up to $${Number(myResponse.quoteMax).toLocaleString()}`}
                                                                          sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} color="success" variant="outlined" />
                                                                )}
                                                                {myResponse.estimatedTimeline && <Chip size="small" icon={<AccessTimeRoundedIcon sx={{ fontSize: 13 }} />} label={myResponse.estimatedTimeline} sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} variant="outlined" />}
                                                            </Stack>
                                                            {myResponse.listingId && myResponse.listingTitle && (
                                                                <Box
                                                                    onClick={() => navigate(`/services/${myResponse.listingId}`)}
                                                                    sx={(t) => ({
                                                                        mb: 0.75, p: 1.25, borderRadius: 2,
                                                                        bgcolor: alpha(t.palette.primary.main, 0.04),
                                                                        border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1),
                                                                        cursor: "pointer",
                                                                        transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                                                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                                                    })}
                                                                >
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 9.5, display: "block", mb: 0.5 }}>
                                                                        Service Provided By
                                                                    </Typography>
                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                        <StorefrontRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                                                        <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 800, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{myResponse.listingTitle}</Typography>
                                                                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "primary.main", flexShrink: 0 }}>View</Typography>
                                                                    </Box>
                                                                </Box>
                                                            )}
                                                            {myResponse.status === "accepted" && myResponse.requesterContact?.value && (
                                                                <Box sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.15), mb: 0.75 })}>
                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                                                        <LockOpenRoundedIcon sx={{ fontSize: 14, color: "success.main" }} />
                                                                        <Typography variant="caption" sx={{ fontWeight: 900, color: "success.main", textTransform: "uppercase", fontSize: 10 }}>Requester Contact Info</Typography>
                                                                    </Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                                                        {myResponse.requesterContact.preference === "call" ? "Phone: " : myResponse.requesterContact.preference === "email" ? "Email: " : "Preferred: Message "}
                                                                        {myResponse.requesterContact.value}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            {myResponse.status === "accepted" && !myResponse.requesterContact?.value && (
                                                                <Alert severity="success" icon={false} sx={{ borderRadius: 2, py: 0.5, mb: 0.5 }}>
                                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>Your response was accepted! The requester prefers to be contacted via message.</Typography>
                                                                </Alert>
                                                            )}
                                                            {myResponse.status === "pending" && (
                                                                <Button size="small" variant="outlined" color="inherit" disabled={responseActionLoading === myResponse.id}
                                                                        onClick={() => handleWithdrawResponse(myResponse.id)} startIcon={<ReplayRoundedIcon sx={{ fontSize: 15 }} />}
                                                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, alignSelf: "flex-start" }}>Withdraw Response</Button>
                                                            )}
                                                        </Box>
                                                    );
                                                })()}
                                            </Stack>
                                        )}

                                        {/* ══ TAB 1: PHOTOS (gallery like BusinessDetailPanel) ══ */}
                                        {requestDetailTab === 1 && (() => {
                                            const photos = Array.isArray(selectedRequest.photos) ? selectedRequest.photos.filter((p) => p && (p.url || typeof p === "string")) : [];
                                            if (photos.length === 0) return (
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
                                                        No photos have been attached to this request.
                                                    </Typography>
                                                </Box>
                                            );
                                            return <DetailPhotoGallery photos={photos} onReport={(pt, url, pid) => handlePhotoReportOpen(pt, url, pid, selectedRequest?.requesterId || selectedRequest?.requester_id || selectedRequest?.user_id)} isOwner={!!isRequesterOfSelected} />;
                                        })()}

                                        {/* ══ TAB 2: RESPONSES (owner only — tab hidden for non-requesters) ══ */}
                                        {isRequesterOfSelected && requestDetailTab === 2 && (() => {
                                            const isFilled = selectedRequest.status === "filled";
                                            return (
                                                <Stack spacing={1.75} sx={{ pt: 2 }}>
                                                    {isFilled && <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>This request has been marked as filled.</Alert>}

                                                    <Stack spacing={1.5}>
                                                        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Responses ({responses.length})</Typography>
                                                        {responsesLoading ? (
                                                            <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}><PulsingDots /></Box>
                                                        ) : responses.length === 0 ? (
                                                            <Box sx={(t) => ({ p: 2.5, borderRadius: 2, textAlign: "center", bgcolor: alpha(t.palette.grey[500], 0.04), border: "1px solid", borderColor: "divider" })}>
                                                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", mb: 0.5 }}>No responses yet</Typography>
                                                                <Typography variant="caption" sx={{ color: "text.disabled" }}>Service providers will appear here when they respond.</Typography>
                                                            </Box>
                                                        ) : (
                                                            <Stack spacing={1.25}>
                                                                {responses.map((resp) => {
                                                                    const isAccepted = resp.status === "accepted"; const isDeclined = resp.status === "declined";
                                                                    const isWithdrawn = resp.status === "withdrawn"; const isPending = resp.status === "pending";
                                                                    const acting = responseActionLoading === resp.id;
                                                                    return (
                                                                        <Box key={resp.id} sx={(t) => ({ p: 1.75, borderRadius: 2.5, border: "1px solid",
                                                                            borderColor: isAccepted ? alpha(t.palette.success.main, 0.3) : (isDeclined || isWithdrawn) ? alpha(t.palette.grey[400], 0.3) : alpha(t.palette.primary.main, 0.15),
                                                                            bgcolor: isAccepted ? alpha(t.palette.success.main, 0.04) : (isDeclined || isWithdrawn) ? alpha(t.palette.grey[400], 0.04) : t.palette.background.paper,
                                                                            opacity: isWithdrawn ? 0.6 : 1 })}>
                                                                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mb: 1 }}>
                                                                                <AccountAvatar src={resp.responderAvatar} accountType={resp.responderType || resp.responder_type || (resp.responderBusinessId ? "business" : resp.responderArtistId ? "artist" : "user")} size={36} />
                                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                    <Typography sx={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.2 }}>{resp.responderName || "Provider"}</Typography>
                                                                                    {resp.responderHandle && <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>@{resp.responderHandle}</Typography>}
                                                                                </Box>
                                                                                <Chip size="small" label={isAccepted ? "Accepted" : isDeclined ? "Declined" : isWithdrawn ? "Withdrawn" : "Pending"}
                                                                                      color={isAccepted ? "success" : isDeclined ? "default" : isWithdrawn ? "default" : "warning"}
                                                                                      variant={isAccepted ? "filled" : "outlined"}
                                                                                      sx={{ height: 22, fontSize: 10.5, fontWeight: 800, borderRadius: 999 }} />
                                                                            </Box>
                                                                            <RichTextDisplay html={resp.message} sx={{ color: "text.secondary", mb: 1 }} />
                                                                            <ResponsePhotoGrid photos={resp.photos} onReport={(pt, url, pid) => handlePhotoReportOpen(pt, url, pid, resp?.responderId || resp?.responder_id || resp?.user_id)} isOwner={false} />
                                                                            <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 1 }}>
                                                                                {(resp.quoteMin || resp.quoteMax || resp.quoteType === "free_estimate") && (
                                                                                    <Chip size="small" icon={<AttachMoneyRoundedIcon sx={{ fontSize: 13 }} />}
                                                                                          label={resp.quoteType === "free_estimate" ? "Free Estimate" : resp.quoteMin && resp.quoteMax ? `$${Number(resp.quoteMin).toLocaleString()}\u2013$${Number(resp.quoteMax).toLocaleString()}${resp.quoteType === "hourly" ? "/hr" : ""}` : resp.quoteMin ? `From $${Number(resp.quoteMin).toLocaleString()}${resp.quoteType === "hourly" ? "/hr" : ""}` : resp.quoteMax ? `Up to $${Number(resp.quoteMax).toLocaleString()}` : resp.quoteType === "flexible" ? "Flexible pricing" : "Quote provided"}
                                                                                          sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} color="success" variant="outlined" />
                                                                                )}
                                                                                {resp.estimatedTimeline && <Chip size="small" icon={<AccessTimeRoundedIcon sx={{ fontSize: 13 }} />} label={resp.estimatedTimeline} sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} variant="outlined" />}
                                                                            </Stack>
                                                                            {resp.listingId && resp.listingTitle && (
                                                                                <Box
                                                                                    onClick={() => navigate(`/services/${resp.listingId}`)}
                                                                                    sx={(t) => ({
                                                                                        mt: 0.5, mb: 0.75, p: 1.25, borderRadius: 2,
                                                                                        bgcolor: alpha(t.palette.primary.main, 0.04),
                                                                                        border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1),
                                                                                        cursor: "pointer",
                                                                                        transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                                                                        "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                                                                    })}
                                                                                >
                                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 9.5, display: "block", mb: 0.5 }}>
                                                                                        Service Provided By
                                                                                    </Typography>
                                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                                        <StorefrontRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                            <Typography sx={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resp.listingTitle}</Typography>
                                                                                            {resp.listingReviewCount > 0 && (
                                                                                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.15 }}>
                                                                                                    <StarRoundedIcon sx={{ fontSize: 11, color: "warning.main" }} />
                                                                                                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: "text.secondary" }}>
                                                                                                        {Number(resp.listingReviewAvg).toFixed(1)} ({resp.listingReviewCount})
                                                                                                    </Typography>
                                                                                                </Stack>
                                                                                            )}
                                                                                        </Box>
                                                                                        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "primary.main", flexShrink: 0 }}>View</Typography>
                                                                                    </Box>
                                                                                </Box>
                                                                            )}
                                                                            {isAccepted && resp.responderContact?.preference && (
                                                                                <Box sx={(t) => ({ p: 1.25, borderRadius: 2, mb: 0.75, bgcolor: alpha(t.palette.success.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.15) })}>
                                                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                                                                        <LockOpenRoundedIcon sx={{ fontSize: 14, color: "success.main" }} />
                                                                                        <Typography variant="caption" sx={{ fontWeight: 900, color: "success.main", textTransform: "uppercase", fontSize: 10 }}>Contact Info Revealed</Typography>
                                                                                    </Box>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                                                                        {resp.responderContact.preference === "call" ? "Phone: " : resp.responderContact.preference === "email" ? "Email: " : "Message: "}
                                                                                        {resp.responderContact.value || "Available via message"}
                                                                                    </Typography>
                                                                                </Box>
                                                                            )}
                                                                            {isPending && !isFilled && (
                                                                                <Stack direction="row" spacing={1}>
                                                                                    <Button size="small" variant="contained" color="success" disabled={acting} onClick={() => handleAcceptResponse(resp.id)}
                                                                                            startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 15 }} />} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, flex: 1 }}>Accept</Button>
                                                                                    <Button size="small" variant="outlined" color="inherit" disabled={acting} onClick={() => handleDeclineResponse(resp.id)}
                                                                                            startIcon={<CancelRoundedIcon sx={{ fontSize: 15 }} />} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, flex: 1 }}>Decline</Button>
                                                                                </Stack>
                                                                            )}
                                                                            <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.75, fontSize: 10.5 }}>
                                                                                {resp.createdAt ? new Date(resp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                                                                            </Typography>
                                                                        </Box>
                                                                    );
                                                                })}
                                                            </Stack>
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            );
                                        })()}
                                    </Stack>

                                ) : (
                                    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
                                        {/* Centered empty state */}
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, px: 2 }}>
                                            <Box sx={{ maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.1, textAlign: "center" }}>
                                                <Box
                                                    sx={(t) => ({
                                                        width: 76,
                                                        height: 76,
                                                        borderRadius: "18px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: alpha(t.palette.text.primary, 0.03),
                                                        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                                                        boxShadow: t.custom?.shadows?.xs || "0 1px 2px rgba(0,0,0,0.05)",
                                                    })}
                                                >
                                                    <FrontHandRoundedIcon sx={{ fontSize: 42, color: "primary.main", opacity: 0.9 }} />
                                                </Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>No Request Selected</Typography>
                                                <Typography color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45 }}>
                                                    Click a request card to view its details.
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {/* ─── Map ─── */}
                        {rightTab === "map" && (
                            <Box sx={{ position: "absolute", inset: 0 }}>
                                <ServicesMapTab
                                    mode={isRequestsMode ? "requests" : "services"}
                                    services={items}
                                    onSelectService={handleClickService}
                                    focusServiceId={focusServiceId}
                                    onFocusServiceHandled={handleFocusServiceHandled}
                                    hoveredCardId={hoveredServiceId}
                                    requests={requestItems}
                                    onSelectRequest={handleClickRequest}
                                    focusRequestId={focusRequestId}
                                    onFocusRequestHandled={handleFocusRequestHandled}
                                    onEditRequest={handleEditRequest}
                                    onDeleteRequest={handleCardDeleteRequest}
                                    onReportRequest={(req) => { if (!loggedInUser) { openAuthPopup(); return; } setReportTarget("service_request"); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }}
                                    user={loggedInUser}
                                    activeAccount={activeAccount}
                                    center={mapCenter}
                                    zoomLevel={mapZoom}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ═══ Mobile: Map drawer (slides from bottom) ═══ */}
            {isMobile && (
                <SwipeableBottomDrawer
                    open={mobileMapOpen}
                    onClose={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }}
                    transitionDuration={{ enter: 340, exit: 260 }}
                    PaperProps={{
                        sx: {
                            height: '100dvh',
                            '@supports not (height: 1dvh)': { height: '100vh' },
                            borderRadius: 0, overflow: "hidden", bottom: 0,
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bottom: 0 } } }}
                    sx={{ zIndex: (t) => t.zIndex.drawer + 2 }}
                >
                    <Box sx={(t) => ({
                        display: "flex", alignItems: "center", gap: 1, px: 0.5, py: 0.25, minHeight: 46,
                        borderBottom: activeFilterChips.length > 0 ? "none" : "1px solid",
                        borderColor: alpha(t.palette.divider, 0.1), bgcolor: t.palette.background.paper, flexShrink: 0,
                    })}>
                        <IconButton onClick={() => { setMobileMapOpen(false); setMobileMapFilterOpen(false); }} size="small" aria-label="Back" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1 }}>
                            {isRequestsMode ? "Requests Map" : "Services Map"}
                        </Typography>
                        <IconButton onClick={() => setMobileMapFilterOpen(true)} size="small" aria-label="Search & Filter"
                                    sx={(t) => ({ width: 36, height: 36, borderRadius: 999, bgcolor: alpha(t.palette.primary.main, 0.08), color: "primary.main", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.16) } })}>
                            <SearchRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {activeFilterChips.length > 0 && (
                        <Box sx={(t) => ({
                            display: "flex", alignItems: "center", gap: 0.5, px: 1.5, py: 0.5,
                            flexWrap: "nowrap", overflowX: "auto", flexShrink: 0,
                            bgcolor: t.palette.background.paper, borderBottom: "1px solid", borderColor: alpha(t.palette.divider, 0.1),
                            "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none",
                        })}>
                            {activeFilterChips.map((chip) => (
                                <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.onRemove}
                                      sx={(t) => ({ height: 26, maxWidth: 160, borderRadius: 999, fontWeight: 700, fontSize: 11, flexShrink: 0,
                                          bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main,
                                          border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2),
                                          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                                          "& .MuiChip-deleteIcon": { color: alpha(t.palette.primary.main, 0.5), fontSize: 16, "&:hover": { color: t.palette.primary.main } },
                                      })} />
                            ))}
                        </Box>
                    )}

                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        <ServicesMapTab
                            mode={isRequestsMode ? "requests" : "services"}
                            services={items}
                            onSelectService={(svc) => { setCameFromMobileMap(true); handleClickService(svc); }}
                            focusServiceId={focusServiceId}
                            onFocusServiceHandled={handleFocusServiceHandled}
                            hoveredCardId={hoveredServiceId}
                            requests={requestItems}
                            onSelectRequest={(req) => { setCameFromMobileMap(true); handleClickRequest(req); }}
                            focusRequestId={focusRequestId}
                            onFocusRequestHandled={handleFocusRequestHandled}
                            onEditRequest={handleEditRequest}
                            onDeleteRequest={handleCardDeleteRequest}
                            onReportRequest={(req) => { if (!loggedInUser) { openAuthPopup(); return; } setReportTarget("service_request"); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }}
                            user={loggedInUser}
                            activeAccount={activeAccount}
                            center={mapCenter}
                            zoomLevel={mapZoom}
                        />
                    </Box>

                    <Drawer anchor="bottom" open={mobileMapFilterOpen} onClose={() => setMobileMapFilterOpen(false)}
                            transitionDuration={{ enter: 280, exit: 220 }} ModalProps={{ keepMounted: false }}
                            PaperProps={{ sx: (t) => ({ maxHeight: "85dvh", "@supports not (max-height: 1dvh)": { maxHeight: "85vh" },
                                    borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: t.palette.background.paper,
                                    overflow: "hidden", display: "flex", flexDirection: "column" }) }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                            <TuneIcon sx={{ fontSize: 22, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 800, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                            <IconButton onClick={() => setMobileMapFilterOpen(false)} size="small" sx={{ width: 34, height: 34, borderRadius: 999 }}>
                                <CloseIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Box>
                        <Box sx={{ px: 2.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
                            <SearchInput
                                placeholder="Search services, providers, keywords"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e?.target?.value ?? "")}
                                inputProps={{ maxLength: 120, autoFocus: true }}
                                onSearch={() => { setSearch(String(searchDraft || "").trim()); scrollServicesToTop(); setMobileMapFilterOpen(false); }}
                                onClear={() => { setSearchDraft(""); setSearch(""); scrollServicesToTop(); }}
                            />
                        </Box>
                        <Box sx={{ flex: 1, overflow: "auto", px: 2.5, pt: 1, pb: 2 }}>
                            {isRequestsMode ? (
                                <ServicesFilters
                                    filters={requestsFilters}
                                    onChangeFilters={(v) => { setRequestsFilters(v); scrollServicesToTop(); }}
                                    categories={requestCategories}
                                    categoriesLoading={requestsLoading && requestCategories.length === 0}
                                    showAdvancedFilters
                                    view={requestsView}
                                    onChangeView={(v) => { setRequestsView(v); scrollServicesToTop(); }}
                                    viewOptions={REQUESTS_VIEW_OPTIONS}
                                    sort={requestsSort}
                                    onChangeSort={(v) => { setRequestsSort(v); scrollServicesToTop(); }}
                                    hidePricing hideCoverage isRequestsMode
                                    locationCounts={requestLocationCounts}
                                    viewer={loggedInUser}
                                    search={search}
                                    onSearchChange={handleSavedSearchChange}
                                    onClearAll={clearAllFilters}
                                    activeChips={activeFilterChips}
                                />
                            ) : (
                                <ServicesFilters
                                    filters={filters}
                                    onChangeFilters={(v) => { setFilters(v); scrollServicesToTop(); }}
                                    categories={categories}
                                    categoriesLoading={categoriesLoading}
                                    showAdvancedFilters
                                    sort={sort}
                                    onChangeSort={(v) => { setSort(v); scrollServicesToTop(); }}
                                    view={serviceView}
                                    onChangeView={(v) => { setServiceView(v); scrollServicesToTop(); }}
                                    viewOptions={SERVICES_VIEW_OPTIONS}
                                    hideCoverage
                                    locationCounts={locationCounts}
                                    viewer={loggedInUser}
                                    search={search}
                                    onSearchChange={handleSavedSearchChange}
                                    onClearAll={clearAllFilters}
                                    activeChips={activeFilterChips}
                                />
                            )}
                        </Box>
                        <Box sx={(t) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                            <Button onClick={clearAllFilters} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary", px: 2 }}>Reset</Button>
                            <Button variant="contained" onClick={() => { setSearch(String(searchDraft || "").trim()); scrollServicesToTop(); setMobileMapFilterOpen(false); }}
                                    sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, height: 42, bgcolor: t.palette.primary.main, color: t.palette.common.white, boxShadow: "none", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" } })}>
                                Show Results
                            </Button>
                        </Box>
                    </Drawer>
                </SwipeableBottomDrawer>
            )}

            {/* ═══ Mobile: Filter drawer (full-screen from bottom) ═══ */}
            {isMobile && (
                <SwipeableBottomDrawer
                    open={mobileFilterDrawerOpen}
                    onClose={() => setMobileFilterDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            height: '100%',
                            borderRadius: 0, overflow: "hidden",
                            display: "flex", flexDirection: "column",
                        },
                    }}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: {} } }}
                >
                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                        <IconButton onClick={() => setMobileFilterDrawerOpen(false)} size="small" sx={{ width: 36, height: 36 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>Search & Filter</Typography>
                    </Box>
                    {/* Search input */}
                    <Box sx={{ px: 2.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
                        <SearchInput
                            placeholder="Search services, providers, keywords"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e?.target?.value ?? "")}
                            inputProps={{ maxLength: 120, autoFocus: true }}
                            onSearch={() => { setSearch(String(searchDraft || "").trim()); scrollServicesToTop(); setMobileFilterDrawerOpen(false); }}
                            onClear={() => { setSearchDraft(""); setSearch(""); scrollServicesToTop(); }}
                        />
                    </Box>
                    {/* Filter controls — scrollable */}
                    <Box sx={{ flex: 1, overflow: "auto", px: 2.5, pt: 1, pb: 2 }}>
                        {isRequestsMode ? (
                            <ServicesFilters
                                filters={requestsFilters}
                                onChangeFilters={(v) => { setRequestsFilters(v); scrollServicesToTop(); }}
                                categories={requestCategories}
                                categoriesLoading={requestsLoading && requestCategories.length === 0}
                                showAdvancedFilters
                                view={requestsView}
                                onChangeView={(v) => { setRequestsView(v); scrollServicesToTop(); }}
                                viewOptions={REQUESTS_VIEW_OPTIONS}
                                sort={requestsSort}
                                onChangeSort={(v) => { setRequestsSort(v); scrollServicesToTop(); }}
                                hidePricing
                                hideCoverage
                                isRequestsMode
                                locationCounts={requestLocationCounts}
                                viewer={loggedInUser}
                                search={search}
                                onSearchChange={handleSavedSearchChange}
                                onClearAll={clearAllFilters}
                                activeChips={activeFilterChips}
                            />
                        ) : (
                            <ServicesFilters
                                filters={filters}
                                onChangeFilters={(v) => { setFilters(v); scrollServicesToTop(); }}
                                categories={categories}
                                categoriesLoading={categoriesLoading}
                                showAdvancedFilters
                                sort={sort}
                                onChangeSort={(v) => { setSort(v); scrollServicesToTop(); }}
                                view={serviceView}
                                onChangeView={(v) => { setServiceView(v); scrollServicesToTop(); }}
                                viewOptions={SERVICES_VIEW_OPTIONS}
                                hideCoverage
                                locationCounts={locationCounts}
                                viewer={loggedInUser}
                                search={search}
                                onSearchChange={handleSavedSearchChange}
                                onClearAll={clearAllFilters}
                                activeChips={activeFilterChips}
                            />
                        )}
                    </Box>
                    {/* Sticky bottom actions */}
                    <Box sx={(t) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider", bgcolor: t.palette.background.paper, flexShrink: 0 })}>
                        <Button onClick={clearAllFilters} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary", px: 2 }}>
                            Reset
                        </Button>
                        <Button variant="contained" onClick={() => { setSearch(String(searchDraft || "").trim()); scrollServicesToTop(); setMobileFilterDrawerOpen(false); }}
                                sx={(t) => ({ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, height: 42, bgcolor: t.palette.primary.main, color: t.palette.common.white, boxShadow: "none", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.92), boxShadow: "none" } })}>
                            Show Results
                        </Button>
                    </Box>
                </SwipeableBottomDrawer>
            )}

            {/* ═══ Modals ═══ */}
            {/* CreateServiceModal is replaced by CreateServicePage — navigated via /services/create */}

            {/* Delete Confirmation */}
            <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Service</Typography>
                    <IconButton aria-label="Close" onClick={() => setDeleteTarget(null)} disabled={isDeleting} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.</Typography>
                        {deleteError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{deleteError.message || "Failed to delete service."}</Alert> : null}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? "Deleting\u2026" : "Delete"}</Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Contact Provider Dialog */}
            <Dialog open={Boolean(quoteService)} onClose={() => { if (!quoteSending) { quotePhotos.forEach((p) => { if (p?.url) { try { URL.revokeObjectURL(p.url); } catch {} } }); setQuotePhotos([]); setQuoteService(null); } }} maxWidth="sm" fullWidth fullScreen={isMobile} disableScrollLock
                    PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? '100vh' : '85vh', ...(isMobile && { display: 'flex', flexDirection: 'column' }) } }}
                    sx={{ zIndex: (t) => t.zIndex.modal + 20 }}>
                <DialogTitle sx={{ pr: 6, ...(isMobile && { borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }) }}>
                    {!quoteSuccess && (
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Contact Provider</Typography>
                    )}
                    <IconButton aria-label="Close" onClick={() => { quotePhotos.forEach((p) => { if (p?.url) { try { URL.revokeObjectURL(p.url); } catch {} } }); setQuotePhotos([]); setQuoteService(null); }} disabled={quoteSending} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={isMobile ? { flex: 1, overflowY: 'auto', pb: 0, display: 'flex', flexDirection: 'column' } : undefined}>
                    {quoteSuccess ? (
                        <Stack spacing={2} sx={{ py: 2, ...(isMobile && { flex: 1, justifyContent: 'center' }) }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    The provider will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => setQuoteService(null)}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(isMobile && { py: 1.5, fontSize: '1rem' }) }}>
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
                                            const pType = (quoteService?.providerType || quoteService?.provider_type || "").toLowerCase();
                                            const provAvatarSrc = quoteService?.providerAvatar || quoteService?.provider_avatar;
                                            return (
                                                <Avatar
                                                    src={provAvatarSrc || undefined}
                                                    imgProps={{ referrerPolicy: "no-referrer" }}
                                                    sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main", width: 24, height: 24 }}
                                                >
                                                    {pType === "business" ? <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />
                                                        : pType === "music" ? <MusicNoteRoundedIcon sx={{ fontSize: 14 }} />
                                                            : <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                                </Avatar>
                                            );
                                        })()
                                    }
                                    label={quoteService?.providerName || quoteService?.provider_name || "Provider"}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            {/* Service context */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{quoteService?.title}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {quoteService?.providerName || quoteService?.provider_name || "Provider"}
                                </Typography>
                            </Box>
                            <TextField
                                label="Message"
                                placeholder="Describe what you need, timeline, budget, etc."
                                multiline
                                minRows={isMobile ? 4 : 5}
                                maxRows={isMobile ? 8 : 10}
                                value={quoteMessage}
                                onChange={(e) => setQuoteMessage(e.target.value.slice(0, 2000))}
                                inputProps={{ maxLength: 2000 }}
                                fullWidth
                                error={Boolean(quoteError)}
                                helperText={quoteError || `${quoteMessage.length} / 2,000`}
                                FormHelperTextProps={{ sx: { textAlign: quoteError ? "left" : "right", mr: 0.5, fontWeight: 600, fontSize: "0.75rem" } }}
                                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }}
                            />
                            <PhotosUploadSection
                                photos={quotePhotos}
                                setPhotos={setQuotePhotos}
                                disabled={quoteSending}
                                maxPhotos={4}
                                title="Photos (optional)"
                                helperText="Add up to 4 photos to help describe what you need."
                                addButtonText="Add photos"
                            />
                        </Stack>
                    )}
                </DialogContent>
                {/* Pinned bottom actions */}
                {!quoteSuccess && (
                    <Box sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', p: 2, pb: isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 16px)' : 2, bgcolor: 'background.paper' }}>
                        {quoteSending && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
                        <Stack direction="row" spacing={1.5} justifyContent={isMobile ? 'stretch' : 'flex-end'}>
                            <Button variant="outlined" onClick={() => { quotePhotos.forEach((p) => { if (p?.url) { try { URL.revokeObjectURL(p.url); } catch {} } }); setQuotePhotos([]); setQuoteService(null); }} disabled={quoteSending}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(isMobile && { flex: 1, py: 1.4, fontSize: '0.95rem' }) }}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSendQuote} disabled={quoteSending || quoteCooldown > 0}
                                    startIcon={quoteSending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(isMobile && { flex: 2, py: 1.4, fontSize: '0.95rem' }) }}>
                                {quoteCooldown > 0 ? `Wait ${quoteCooldown}s` : quoteSending ? "Sending\u2026" : "Send Message"}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Dialog>

            {/* Quote rate limit reached dialog */}
            <Dialog open={quoteLimitOpen} onClose={() => setQuoteLimitOpen(false)} maxWidth="xs" fullWidth
                    sx={{ zIndex: (t) => t.zIndex.modal + 20 }}
                    PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this provider recently. Give them a chance to respond before sending more.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center" }}>
                    <Button variant="contained" onClick={() => setQuoteLimitOpen(false)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 4 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* User Card Popover */}
            <UserCardPopover
                anchorEl={userAnchor}
                onClose={() => setUserAnchor(null)}
                user={userForCard}
            />

            {/* ═══ Create Service Request Modal ═══ */}
            <CreateServiceRequestModal
                open={createRequestOpen}
                onClose={() => { setCreateRequestOpen(false); setEditingRequestItem(null); }}
                onSuccess={handleRequestSuccess}
                editingRequest={editingRequestItem}
            />

            {/* Delete Request Confirmation */}
            <Dialog open={Boolean(deleteRequestTarget)} onClose={() => setDeleteRequestTarget(null)} maxWidth="xs" fullWidth sx={{ zIndex: 10001 }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Request</Typography>
                    <IconButton aria-label="Close" onClick={() => setDeleteRequestTarget(null)} disabled={isDeletingRequest} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Are you sure you want to delete &quot;{deleteRequestTarget?.title}&quot;? This cannot be undone.</Typography>
                        {deleteRequestError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{deleteRequestError.message || "Failed to delete request."}</Alert> : null}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setDeleteRequestTarget(null)} disabled={isDeletingRequest}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={handleConfirmDeleteRequest} disabled={isDeletingRequest}>{isDeletingRequest ? "Deleting\u2026" : "Delete"}</Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Respond to Request modal */}
            <RespondToRequestModal
                open={respondModalOpen}
                onClose={() => setRespondModalOpen(false)}
                request={selectedRequest}
                onSuccess={() => {
                    reloadResponses();
                    refreshRequests();
                }}
            />

            {/* ═══ Accept Response Confirmation ═══ */}
            <Dialog open={Boolean(acceptConfirm)} onClose={() => setAcceptConfirm(null)} maxWidth="xs" fullWidth sx={{ zIndex: 10001 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                    Accept This Response?
                    <IconButton onClick={() => setAcceptConfirm(null)} sx={{ position: "absolute", top: 8, right: 8 }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        You&rsquo;re accepting {acceptConfirm?.name || "this provider"}&rsquo;s response. Their contact information will be revealed to you, and your contact preference will be shared with them.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAcceptConfirm(null)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={confirmAcceptResponse} disabled={Boolean(responseActionLoading)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, boxShadow: "none" }}>
                        {responseActionLoading ? "Accepting…" : "Accept"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ Decline Response Confirmation ═══ */}
            <Dialog open={Boolean(declineConfirm)} onClose={() => setDeclineConfirm(null)} maxWidth="xs" fullWidth sx={{ zIndex: 10001 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                    Decline This Response?
                    <IconButton onClick={() => setDeclineConfirm(null)} sx={{ position: "absolute", top: 8, right: 8 }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        This will decline {declineConfirm?.name || "this provider"}&rsquo;s response. They won&rsquo;t be notified of the reason.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeclineConfirm(null)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={confirmDeclineResponse} disabled={Boolean(responseActionLoading)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, boxShadow: "none" }}>
                        {responseActionLoading ? "Declining…" : "Decline"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ Mark as Filled + Review Prompt ═══ */}
            <Dialog open={filledDialogOpen} onClose={() => setFilledDialogOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 10001 }} PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                    Mark Request as Filled?
                    <IconButton onClick={() => setFilledDialogOpen(false)} sx={{ position: "absolute", top: 8, right: 8 }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 1.5 }}>
                        This will mark your request as filled. Providers will no longer be able to respond.
                    </Typography>
                    {responses.some((r) => r.status === "accepted") && (
                        <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                            <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.25 }}>Leave a review?</Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4 }}>
                                Help others by reviewing the provider who helped you. You can also do this later from their service page.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, flexDirection: "column", gap: 1, alignItems: "stretch" }}>
                    {responses.some((r) => r.status === "accepted") && (
                        <Button variant="contained" color="success" fullWidth onClick={() => confirmMarkAsFilled(true)}
                                startIcon={<StarRoundedIcon />}
                                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, boxShadow: "none" }}>
                            Mark as Filled &amp; Leave Review
                        </Button>
                    )}
                    <Button variant={responses.some((r) => r.status === "accepted") ? "outlined" : "contained"} color={responses.some((r) => r.status === "accepted") ? "inherit" : "success"} fullWidth onClick={() => confirmMarkAsFilled(false)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, boxShadow: "none" }}>
                        {responses.some((r) => r.status === "accepted") ? "Mark as Filled Without Review" : "Mark as Filled"}
                    </Button>
                    <Button onClick={() => setFilledDialogOpen(false)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700, color: "text.secondary" }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* ═══ Service Review Write / Edit Dialog ═══ */}
            <Dialog open={svcReviewFormOpen} onClose={svcReviewSubmitting ? undefined : closeSvcReviewForm} maxWidth="sm" fullWidth
                    fullScreen={isMobile}
                    sx={{ zIndex: 10001 }}
                    PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}>
                {/* Header */}
                <Box sx={{ p: 2.5, pb: 0, position: "relative", flexShrink: 0 }}>
                    <IconButton onClick={closeSvcReviewForm} disabled={svcReviewSubmitting} sx={{ position: "absolute", top: 8, right: 8, width: 32, height: 32 }}>
                        <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", mb: 2, pr: 4 }}>
                        {svcReviewEditing ? "Edit Your Review" : "Write a Review"}
                    </Typography>
                </Box>
                {/* Scrollable form content */}
                <Box sx={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", px: 2.5, pb: 1 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>Your Rating *</Typography>
                        <Rating value={svcReviewRating} precision={1} onChange={(_e, val) => setSvcReviewRating(val || 0)} size="large" />
                    </Box>
                    <TextField fullWidth label="Review Title (optional)" value={svcReviewTitle} onChange={(e) => setSvcReviewTitle(e.target.value.slice(0, 160))}
                               size="small" inputProps={{ maxLength: 160 }} sx={{ mb: 1.5 }}
                    />
                    <TextField fullWidth label="Your Review" value={svcReviewText} onChange={(e) => setSvcReviewText(e.target.value)}
                               multiline minRows={3} maxRows={8} size="small" sx={{ mb: 1.5 }}
                    />
                    <Box sx={{ mb: 1.5 }}>
                        <PhotosUploadSection
                            photos={svcReviewPhotos}
                            setPhotos={setSvcReviewPhotos}
                            disabled={svcReviewSubmitting}
                            maxPhotos={4}
                            title="Photos (optional)"
                            helperText="Add up to 4 photos of your experience."
                            addButtonText="Add photos"
                        />
                    </Box>
                    {svcReviewError && <Typography sx={{ fontSize: "0.8rem", color: "error.main", fontWeight: 700, mb: 1 }}>{svcReviewError}</Typography>}
                </Box>
                {/* Sticky bottom buttons */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: "1px solid", borderColor: "divider", flexShrink: 0, bgcolor: "background.paper" }}>
                    {svcReviewSubmitting && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        {svcReviewEditing && (
                            <Button size="small" color="error" startIcon={<DeleteRoundedIcon sx={{ fontSize: "15px !important" }} />}
                                    onClick={() => setSvcReviewDeleteTarget(svcReviewEditing)} disabled={svcReviewSubmitting}
                                    sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem", mr: "auto" }}
                            >Delete</Button>
                        )}
                        <Button size="small" onClick={closeSvcReviewForm} disabled={svcReviewSubmitting} sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem" }}>Cancel</Button>
                        <Button variant="contained" size="small" onClick={handleSubmitReview} disabled={svcReviewSubmitting || !svcReviewRating}
                                sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem", borderRadius: 2, px: 2 }}
                        >{svcReviewSubmitting ? "Saving\u2026" : (svcReviewEditing ? "Update" : "Submit")}</Button>
                    </Stack>
                </Box>
            </Dialog>

            {/* ═══ Service Review Delete Confirmation Dialog ═══ */}
            <Dialog open={Boolean(svcReviewDeleteTarget)} onClose={() => { if (!svcReviewDeleting) setSvcReviewDeleteTarget(null); }} maxWidth="xs" fullWidth sx={{ zIndex: 10002 }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Review</Typography>
                    <IconButton aria-label="Close" onClick={() => setSvcReviewDeleteTarget(null)} disabled={svcReviewDeleting} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Are you sure you want to delete your review? This cannot be undone.
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setSvcReviewDeleteTarget(null)} disabled={svcReviewDeleting}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={() => handleDeleteReview(svcReviewDeleteTarget?.id)} disabled={svcReviewDeleting}>
                                {svcReviewDeleting ? "Deleting\u2026" : "Delete"}
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* ═══ Review Ineligibility Notice ═══ */}
            <Dialog open={svcReviewIneligible.open} onClose={() => setSvcReviewIneligible({ open: false, reason: "" })} maxWidth="xs" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <IconButton onClick={() => setSvcReviewIneligible({ open: false, reason: "" })} sx={{ position: "absolute", top: 8, right: 8, width: 32, height: 32 }}><CloseIcon sx={{ fontSize: 20 }} /></IconButton>
                    <RateReviewRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: "1.05rem", mb: 1 }}>Unable to Review</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 2.5 }}>
                        {svcReviewIneligible.reason}
                    </Typography>
                    <Button variant="contained" fullWidth onClick={() => setSvcReviewIneligible({ open: false, reason: "" })} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}>Got It</Button>
                </Box>
            </Dialog>

            {/* ══ SERVICE REVIEW 3-DOT MENU ══ */}
            <SmartMenu
                anchorEl={svcReviewMenuAnchor}
                open={Boolean(svcReviewMenuAnchor)}
                onClose={() => { setSvcReviewMenuAnchor(null); setSvcReviewMenuReview(null); }}
                disableScrollLock
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{ zIndex: 10002 }}
                PaperProps={{
                    sx: {
                        mt: 0.5,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        minWidth: 200,
                        py: 0.5,
                    },
                }}
            >
                {svcReviewMenuReview && resolvedUserId && svcReviewMenuReview.reviewerId === resolvedUserId && (
                    <MenuItem onClick={() => { const r = svcReviewMenuReview; setSvcReviewMenuAnchor(null); setSvcReviewMenuReview(null); openSvcReviewForm(r); }} sx={{ py: 1 }}>
                        <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Edit review" />
                    </MenuItem>
                )}
                {svcReviewMenuReview && resolvedUserId && svcReviewMenuReview.reviewerId === resolvedUserId && (
                    <MenuItem onClick={() => { const r = svcReviewMenuReview; setSvcReviewMenuAnchor(null); setSvcReviewMenuReview(null); setSvcReviewDeleteTarget(r); }} sx={{ py: 1, color: "error.main" }}>
                        <ListItemIcon sx={{ color: "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Delete review" />
                    </MenuItem>
                )}
                {svcReviewMenuReview && resolvedUserId && svcReviewMenuReview.reviewerId !== resolvedUserId && (
                    <MenuItem onClick={() => { const rv = svcReviewMenuReview; setSvcReviewMenuAnchor(null); setSvcReviewMenuReview(null); if (!loggedInUser) { openAuthPopup(); return; } setReportTarget("review"); setReportTargetReview(rv); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report review" />
                    </MenuItem>
                )}
            </SmartMenu>

            {/* ══ REPORT SERVICE DIALOG ══ */}
            {/* Force all dialogs above mobile slide panel (z-index 9999) when detail is open */}
            {mobileDetailOpen && (
                <style>{`.MuiDialog-root { z-index: 10001 !important; }`}</style>
            )}
            <ReportDialog
                open={reportDialogOpen}
                onClose={closeReportDialog}
                onSubmit={handleReportSubmit}
                title={reportTarget === "service_request" ? "Report Request" : reportTarget === "review" ? "Report Review" : "Report Service"}
            />

            {/* Photo report dialog */}
            <ReportDialog
                open={photoReportOpen}
                onClose={() => { setPhotoReportOpen(false); setPhotoReportTarget(null); }}
                onSubmit={handlePhotoReportSubmit}
                title="Report Photo"
            />

            {/* ══ SNACKBAR ══ */}
            <Snackbar open={Boolean(reportSnack)} autoHideDuration={3000} onClose={() => setReportSnack("")}
                      message={reportSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
            <SuccessSnackbar {...successSnackbarProps} />

            {/* ══ LIMIT REACHED DIALOG ══ */}
            <Dialog
                open={limitDialog.open}
                onClose={() => setLimitDialog({ open: false, title: "", message: "" })}
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: 10001 }}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontSize: 17, pb: 0.5, pr: 5 }}>
                    {limitDialog.title}
                    <IconButton
                        onClick={() => setLimitDialog({ open: false, title: "", message: "" })}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                        {limitDialog.message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => setLimitDialog({ open: false, title: "", message: "" })}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3, boxShadow: "none" }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ══ SHARE SERVICE DIALOG ══ */}
            <ShareServiceDialog
                open={shareDialogOpen}
                onClose={() => { setShareDialogOpen(false); setShareRequest(null); }}
                service={shareRequest ? undefined : detailService}
                request={shareRequest || undefined}
                viewer={user}
                sx={{ zIndex: 10001 }}
            />

            {/* ═══ Mobile: Full-screen detail slide-in from right (swipe right to dismiss) ═══ */}
            {isMobile && (
                <SwipeableRightDrawer
                    open={mobileDetailOpen}
                    onClose={closeMobileDetail}
                    ModalProps={{ keepMounted: true }}
                    slotProps={{ backdrop: { sx: { bgcolor: 'transparent' } } }}
                    transitionDuration={{ enter: 280, exit: 220 }}
                    SlideProps={{ onExited: handleMobileDetailExited }}
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            flexDirection: 'column',
                            pb: 0,
                            height: '100%',
                            top: 0,
                            zIndex: 9999,
                        },
                    }}
                >
                    {/* ── Back-arrow header ── */}
                    <Box
                        sx={(t) => ({
                            display: "flex", alignItems: "center", gap: 0.5, px: 0.5,
                            minHeight: 50, borderBottom: "1px solid",
                            borderColor: alpha(t.palette.divider, 0.12),
                            bgcolor: t.palette.background.paper, flexShrink: 0,
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            paddingTop: 'max(8px, env(safe-area-inset-top))',
                        })}
                    >
                        <IconButton onClick={closeMobileDetail} size="small" aria-label="Back" sx={{ width: 38, height: 38 }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        {cameFromMobileMap ? (
                            <Typography
                                sx={{ fontWeight: 800, fontSize: 14, color: "primary.main", cursor: "pointer", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                onClick={closeMobileDetail}
                            >
                                Return to Map
                            </Typography>
                        ) : null}
                    </Box>

                    {/* ── Scrollable detail content ── */}
                    <Box sx={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
                        {/* Service Detail */}
                        {!isRequestsMode && detailService && (
                            <ServiceDetailPanel
                                detailService={detailService}
                                detailCatInfo={detailCatInfo}
                                detailLocation={detailLocation}
                                detailProviderName={detailProviderName}
                                detailPriceLabel={detailPriceLabel}
                                detailIsOwnListing={detailIsOwnListing}
                                detailAllowsReviews={detailAllowsReviews}
                                detailAllowsMessages={detailAllowsMessages}
                                detailFav={detailFav}
                                detailFavCount={detailFavCount}
                                detailMenuAnchor={detailMenuAnchor}
                                detailMenuOpen={detailMenuOpen}
                                detailHoursExpanded={detailHoursExpanded}
                                setDetailHoursExpanded={setDetailHoursExpanded}
                                setDetailMenuAnchor={setDetailMenuAnchor}
                                providerProfileAvatar={providerProfileAvatar}
                                serviceDetailTab={serviceDetailTab}
                                setServiceDetailTab={setServiceDetailTab}
                                svcDescExpanded={svcDescExpanded}
                                setSvcDescExpanded={setSvcDescExpanded}
                                svcReviews={svcReviews}
                                svcReviewsTotal={svcReviewsTotal}
                                svcReviewsLoading={svcReviewsLoading}
                                svcHighlightReviewId={svcHighlightReviewId}
                                svcReviewSort={svcReviewSort}
                                setSvcReviewSort={setSvcReviewSort}
                                svcRespondingId={svcRespondingId}
                                setSvcRespondingId={setSvcRespondingId}
                                svcRespondText={svcRespondText}
                                setSvcRespondText={setSvcRespondText}
                                setSvcReviewMenuAnchor={setSvcReviewMenuAnchor}
                                setSvcReviewMenuReview={setSvcReviewMenuReview}
                                resolvedUserId={resolvedUserId}
                                loggedInUser={loggedInUser}
                                navigate={navigate}
                                auth={auth}
                                handleDetailFavorite={handleDetailFavorite}
                                handleShareService={handleShareService}
                                handleRequestQuote={handleRequestQuote}
                                handleRespondToReview={handleRespondToReview}
                                openSvcReviewForm={openSvcReviewForm}
                                setReportTarget={setReportTarget}
                                setReportReason={setReportReason}
                                setReportDetails={setReportDetails}
                                setReportConfirmed={setReportConfirmed}
                                setReportDialogOpen={setReportDialogOpen}
                                setReportSnack={setReportSnack}
                                onSuccess={showSuccess}
                                setRightTab={setRightTab}
                                setUserAnchor={setUserAnchor}
                                setUserForCard={setUserForCard}
                                setFocusServiceId={setFocusServiceId}
                                formatDetailFavCount={formatDetailFavCount}
                                providerInfo={svcReviewProviderInfo}
                                viewerIsOwner={viewerIsOwner}
                            />
                        )}

                        {/* Request Detail (mobile — full tabbed layout matching desktop) */}
                        {isRequestsMode && selectedRequest && (
                            <Stack spacing={0} sx={{ p: 2 }}>
                                {/* ── Header ── */}
                                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 1 }}>
                                    {(() => {
                                        const reqAvatarSrc = resolveRequestAvatarSrc(selectedRequest);
                                        const rType = (selectedRequest.requesterType || selectedRequest.requester_type || "").toLowerCase();
                                        const userPayload = {
                                            id: selectedRequest.requesterId,
                                            first_name: selectedRequest.requesterName?.split(" ")[0],
                                            last_name: selectedRequest.requesterName?.split(" ").slice(1).join(" "),
                                            handle: selectedRequest.requesterHandle,
                                            avatar_url: reqAvatarSrc,
                                            ...(rType === "business" ? {
                                                account_type: "business",
                                                business_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterBusinessId,
                                                business_name: selectedRequest.requesterName,
                                                business_slug: selectedRequest.requesterHandle,
                                            } : rType === "artist" ? {
                                                account_type: "artist",
                                                artist_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterArtistId,
                                                artist_name: selectedRequest.requesterName,
                                                artist_handle: selectedRequest.requesterHandle,
                                            } : {}),
                                        };
                                        return (
                                            <AccountAvatar
                                                src={reqAvatarSrc}
                                                accountType={selectedRequest.requesterType || selectedRequest.requester_type || (selectedRequest.requesterBusinessId ? "business" : selectedRequest.requesterArtistId ? "artist" : "user")}
                                                size={40}
                                                onClick={(e) => handleOpenUserCard(e.currentTarget, userPayload)}
                                                sx={{ cursor: "pointer", flexShrink: 0 }}
                                            />
                                        );
                                    })()}
                                    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                                        <Box
                                            onClick={(e) => {
                                                const reqAvatarSrc = resolveRequestAvatarSrc(selectedRequest);
                                                const rType = (selectedRequest.requesterType || selectedRequest.requester_type || "").toLowerCase();
                                                handleOpenUserCard(e.currentTarget, {
                                                    id: selectedRequest.requesterId,
                                                    first_name: selectedRequest.requesterName?.split(" ")[0],
                                                    last_name: selectedRequest.requesterName?.split(" ").slice(1).join(" "),
                                                    handle: selectedRequest.requesterHandle,
                                                    avatar_url: reqAvatarSrc,
                                                    ...(rType === "business" ? {
                                                        account_type: "business",
                                                        business_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterBusinessId,
                                                        business_name: selectedRequest.requesterName,
                                                        business_slug: selectedRequest.requesterHandle,
                                                    } : rType === "artist" ? {
                                                        account_type: "artist",
                                                        artist_id: selectedRequest.requesterProfileId || selectedRequest.requester_profile_id || selectedRequest.requesterArtistId,
                                                        artist_name: selectedRequest.requesterName,
                                                        artist_handle: selectedRequest.requesterHandle,
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
                                                "&:hover .ll-requester-name": { textDecoration: "underline" },
                                            }}
                                        >
                                            <Typography
                                                className="ll-requester-name"
                                                sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                            >
                                                {selectedRequest.requesterName || "Someone"}
                                            </Typography>
                                            {selectedRequest.requesterHandle && (
                                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: 11 }}>@{selectedRequest.requesterHandle}</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setReqDetailMenuAnchor(e.currentTarget); }}
                                                sx={(t) => ({ width: 32, height: 32, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, bgcolor: "background.paper", color: 'text.secondary', flexShrink: 0, "&:hover": { bgcolor: "action.hover", color: 'text.primary' } })}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                    <SmartMenu anchorEl={reqDetailMenuAnchor} open={reqDetailMenuOpen} onClose={() => setReqDetailMenuAnchor(null)}
                                               disableScrollLock
                                               onClick={(e) => e.stopPropagation()}
                                               sx={{ zIndex: 10000 }}
                                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                                               PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", boxShadow: '0 12px 40px rgba(0,0,0,0.15)', minWidth: 200, py: 0.5 } }}>
                                        <MenuItem onClick={() => { setReqDetailMenuAnchor(null); navigator.clipboard?.writeText(`${window.location.origin}/services/requests/${selectedRequest.id}`); showSuccess("Link copied"); }} sx={{ py: 1 }}>
                                            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Copy link" />
                                        </MenuItem>
                                        {isOnCorrectAccountForSelected && <Divider sx={{ my: 0.5 }} />}
                                        {isOnCorrectAccountForSelected && (
                                            <MenuItem onClick={() => { setReqDetailMenuAnchor(null); handleEditRequest(selectedRequest); }} sx={{ py: 1 }}>
                                                <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary="Edit" />
                                            </MenuItem>
                                        )}
                                        {isOnCorrectAccountForSelected && (
                                            <MenuItem onClick={() => { setReqDetailMenuAnchor(null); handleCardDeleteRequest(selectedRequest); }} sx={{ py: 1, color: 'error.main' }}>
                                                <ListItemIcon sx={{ color: 'error.main' }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary="Delete" />
                                            </MenuItem>
                                        )}
                                        {!isOnCorrectAccountForSelected && loggedInUser && (
                                            <>
                                                <Divider sx={{ my: 0.5 }} />
                                                <MenuItem onClick={() => { setReqDetailMenuAnchor(null); if (!loggedInUser) { openAuthPopup(); return; } setReportTarget("service_request"); setReportReason(""); setReportDetails(""); setReportConfirmed(false); setReportDialogOpen(true); }} sx={{ py: 1 }}>
                                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                    <ListItemText primary="Report" />
                                                </MenuItem>
                                            </>
                                        )}
                                    </SmartMenu>
                                </Box>

                                {/* ── Title ── */}
                                <Typography sx={{ fontWeight: 950, fontSize: 20, lineHeight: 1.2, mb: 0.25, wordBreak: "break-word", overflowWrap: "break-word", letterSpacing: "-0.01em" }}>
                                    {selectedRequest.title}
                                </Typography>
                                {selectedRequest.categorySlug && (() => {
                                    const reqCatInfo = getServiceCategoryInfo(selectedRequest.categorySlug);
                                    return reqCatInfo ? (
                                        <Box sx={{ mb: 0.25 }}>
                                            <Chip size="small" icon={reqCatInfo.Icon ? <reqCatInfo.Icon sx={{ fontSize: 12 }} /> : undefined} label={reqCatInfo.name}
                                                  sx={(t) => ({ height: 22, borderRadius: 999, fontWeight: 800, fontSize: 10, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.2), "& .MuiChip-icon": { color: t.palette.primary.main } })} />
                                        </Box>
                                    ) : null;
                                })()}

                                {/* ── CTA ── */}
                                <Divider sx={{ mt: 1 }} />
                                <Stack spacing={1} sx={{ pt: 1.25, pb: 0.75 }}>
                                    {/* Primary action — full width */}
                                    {isRequesterOfSelected && (
                                        <Button
                                            variant={selectedRequest.status === "filled" ? "outlined" : "contained"}
                                            color={selectedRequest.status === "filled" ? "inherit" : "success"}
                                            fullWidth
                                            startIcon={selectedRequest.status === "filled" ? <LockOpenRoundedIcon sx={{ fontSize: "16px !important" }} /> : <CheckCircleRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                            onClick={handleCloseRequest}
                                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, py: 0.6, fontSize: "0.78rem" }}>
                                            {selectedRequest.status === "filled" ? "Reopen" : "Mark as Filled"}
                                        </Button>
                                    )}
                                    {!isPersonalOwnerOfSelected && !isRequesterOfSelected && (
                                        (myResponse || selectedRequest?.viewerHasResponded) ? (
                                            <Button variant="outlined" fullWidth startIcon={<CheckCircleRoundedIcon sx={{ fontSize: "16px !important" }} />} disabled
                                                    sx={(t) => ({
                                                        borderRadius: 2, textTransform: "none", fontWeight: 900, py: 0.6, fontSize: "0.78rem",
                                                        color: t.palette.success.main, borderColor: alpha(t.palette.success.main, 0.3),
                                                        "&.Mui-disabled": { color: t.palette.success.main, borderColor: alpha(t.palette.success.main, 0.3) },
                                                    })}>
                                                Responded
                                            </Button>
                                        ) : (
                                            <Button variant="contained" fullWidth startIcon={<SendRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                                    onClick={() => { if (!auth?.user) { openAuthPopup(); return; } setRespondModalOpen(true); }}
                                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, py: 0.6, fontSize: "0.78rem" }}>
                                                Respond to Request
                                            </Button>
                                        )
                                    )}
                                    {/* Secondary actions — compact row */}
                                    <Stack direction="row" spacing={0.75}>
                                        {isRequesterOfSelected && (
                                            <Button variant="outlined" fullWidth size="small"
                                                    startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                                    onClick={() => {
                                                        try {
                                                            const el = document.querySelector("[data-services-left-scroll]");
                                                            if (el) sessionStorage.setItem("ll:services:scrollTop", String(el.scrollTop || 0));
                                                        } catch { /* ignore */ }
                                                        navigate(`/services/requests/${selectedRequest.id}`, { state: { fromServices: true } });
                                                    }}
                                                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, py: 0.4, fontSize: "0.72rem", borderColor: "divider", color: "text.secondary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                                                View Page
                                            </Button>
                                        )}
                                        <Button variant="outlined" fullWidth size="small"
                                                startIcon={<ShareRoundedIcon sx={{ fontSize: "14px !important" }} />}
                                                onClick={() => handleShareRequest()}
                                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800, py: 0.4, fontSize: "0.72rem", borderColor: "divider", color: "text.secondary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                                            Share
                                        </Button>
                                    </Stack>
                                </Stack>

                                {/* ─── Tabs ─── */}
                                <Divider />
                                <Tabs value={requestDetailTab} onChange={(_e, v) => setRequestDetailTab(v)} variant="fullWidth"
                                      sx={(t) => ({
                                          minHeight: 52,
                                          flexShrink: 0,
                                          borderRadius: 0,
                                          padding: 0,
                                          backgroundColor: "transparent",
                                          border: "none",
                                          boxShadow: "none",
                                          borderBottom: "1px solid",
                                          borderColor: alpha(t.palette.primary.main, 0.12),
                                          "& .MuiTab-root": {
                                              minHeight: 52,
                                              textTransform: "none",
                                              fontWeight: 700,
                                              fontSize: 11,
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
                                      })}>
                                    <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="top" label="About" value={0} />
                                    <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="top"
                                         label={`Photos${Array.isArray(selectedRequest.photos) && selectedRequest.photos.length > 0 ? ` (${selectedRequest.photos.length})` : ""}`} value={1} />
                                    {isRequesterOfSelected && (
                                        <Tab icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="top"
                                             label={`Responses${responses.length > 0 ? ` (${responses.length})` : ""}`} value={2} />
                                    )}
                                </Tabs>

                                {/* ══ TAB 0: ABOUT ══ */}
                                {requestDetailTab === 0 && (
                                    <Stack spacing={1.75} sx={{ pt: 2 }}>
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                <LocationOnRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Location</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
                                                        {selectedRequest.locationLabel || [selectedRequest.city, selectedRequest.county ? `${selectedRequest.county} County` : ""].filter(Boolean).join(", ") || "Alabama (Statewide)"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                <InfoRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Status</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {selectedRequest.status === "filled" ? "Filled" : "Open"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                <ScheduleRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Timeline</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {selectedRequest.urgency === "asap" ? "ASAP" : selectedRequest.urgency === "within_week" ? "This Week" : selectedRequest.urgency === "within_month" ? "This Month" : "Flexible"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                <AccessTimeRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Posted</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                        {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {selectedRequest.contactPreference && (
                                                <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                                                    {selectedRequest.contactPreference === "call" ? <PhoneRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                        : selectedRequest.contactPreference === "email" ? <EmailRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />
                                                            : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.15, flexShrink: 0 }} />}
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}>Preferred Contact</Typography>
                                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                            {selectedRequest.contactPreference === "call" ? "Phone Call" : selectedRequest.contactPreference === "email" ? "Email" : "Message"}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Stack>
                                        <Divider />
                                        {selectedRequest.description && (
                                            <Box sx={{ position: "relative" }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5, display: "block", mb: 0.5 }}>Description</Typography>
                                                <Box sx={{ maxHeight: requestDescExpanded ? "none" : REQ_DESC_MAX_HEIGHT, overflowY: requestDescExpanded ? "visible" : "hidden", position: "relative" }}>
                                                    <RichTextDisplay html={selectedRequest.description} sx={{ color: "text.secondary" }} />
                                                </Box>
                                                {!requestDescExpanded && selectedRequest.description.length > 200 && (
                                                    <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`, pointerEvents: "none" })} />
                                                )}
                                                {selectedRequest.description.length > 200 && (
                                                    <Button size="small" onClick={() => setRequestDescExpanded((p) => !p)} endIcon={requestDescExpanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                                                            sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, borderRadius: 999, mt: 0.5 }}>
                                                        {requestDescExpanded ? "Show less" : "Read more"}
                                                    </Button>
                                                )}
                                            </Box>
                                        )}

                                        {/* My response card (for providers who already responded) */}
                                        {(() => {
                                            if (!myResponse) return null;
                                            return (
                                                <Box sx={(t) => ({
                                                    p: 1.75, borderRadius: 2.5, border: "1px solid",
                                                    borderColor: myResponse.status === "accepted" ? alpha(t.palette.success.main, 0.3) : alpha(t.palette.primary.main, 0.15),
                                                    bgcolor: myResponse.status === "accepted" ? alpha(t.palette.success.main, 0.04) : t.palette.background.paper,
                                                })}>
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                                        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Your Response</Typography>
                                                        <Chip size="small" label={myResponse.status === "accepted" ? "Accepted" : myResponse.status === "declined" ? "Declined" : myResponse.status === "withdrawn" ? "Withdrawn" : "Pending"}
                                                              color={myResponse.status === "accepted" ? "success" : myResponse.status === "declined" ? "default" : myResponse.status === "withdrawn" ? "default" : "warning"}
                                                              variant={myResponse.status === "accepted" ? "filled" : "outlined"} sx={{ height: 22, fontSize: 10.5, fontWeight: 800 }} />
                                                    </Box>
                                                    <RichTextDisplay html={myResponse.message} sx={{ color: "text.secondary", mb: 1 }} />
                                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 1 }}>
                                                        {(myResponse.quoteMin || myResponse.quoteMax || myResponse.quoteType === "free_estimate") && (
                                                            <Chip size="small" icon={<AttachMoneyRoundedIcon sx={{ fontSize: 13 }} />}
                                                                  label={myResponse.quoteType === "free_estimate" ? "Free Estimate" : myResponse.quoteMin && myResponse.quoteMax ? `$${Number(myResponse.quoteMin).toLocaleString()}–$${Number(myResponse.quoteMax).toLocaleString()}${myResponse.quoteType === "hourly" ? "/hr" : ""}` : myResponse.quoteMin ? `From $${Number(myResponse.quoteMin).toLocaleString()}` : `Up to $${Number(myResponse.quoteMax).toLocaleString()}`}
                                                                  sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} color="success" variant="outlined" />
                                                        )}
                                                        {myResponse.estimatedTimeline && <Chip size="small" icon={<AccessTimeRoundedIcon sx={{ fontSize: 13 }} />} label={myResponse.estimatedTimeline} sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} variant="outlined" />}
                                                    </Stack>
                                                    {myResponse.listingId && myResponse.listingTitle && (
                                                        <Box
                                                            onClick={() => navigate(`/services/${myResponse.listingId}`)}
                                                            sx={(t) => ({
                                                                mb: 0.75, p: 1.25, borderRadius: 2,
                                                                bgcolor: alpha(t.palette.primary.main, 0.04),
                                                                border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1),
                                                                cursor: "pointer",
                                                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                                            })}
                                                        >
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 9.5, display: "block", mb: 0.5 }}>
                                                                Service Provided By
                                                            </Typography>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                <StorefrontRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                                                <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 800, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{myResponse.listingTitle}</Typography>
                                                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "primary.main", flexShrink: 0 }}>View</Typography>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {myResponse.status === "accepted" && myResponse.requesterContact?.value && (
                                                        <Box sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.15), mb: 0.75 })}>
                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                                                <LockOpenRoundedIcon sx={{ fontSize: 14, color: "success.main" }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 900, color: "success.main", textTransform: "uppercase", fontSize: 10 }}>Requester Contact Info</Typography>
                                                            </Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                                                                {myResponse.requesterContact.preference === "call" ? "Phone: " : myResponse.requesterContact.preference === "email" ? "Email: " : "Preferred: Message "}
                                                                {myResponse.requesterContact.value}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {myResponse.status === "accepted" && !myResponse.requesterContact?.value && (
                                                        <Alert severity="success" icon={false} sx={{ borderRadius: 2, py: 0.5, mb: 0.5 }}>
                                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>Your response was accepted! The requester prefers to be contacted via message.</Typography>
                                                        </Alert>
                                                    )}
                                                    {myResponse.status === "pending" && (
                                                        <Button size="small" variant="outlined" color="inherit" disabled={responseActionLoading === myResponse.id}
                                                                onClick={() => handleWithdrawResponse(myResponse.id)} startIcon={<ReplayRoundedIcon sx={{ fontSize: 15 }} />}
                                                                sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, alignSelf: "flex-start" }}>Withdraw Response</Button>
                                                    )}
                                                </Box>
                                            );
                                        })()}
                                    </Stack>
                                )}

                                {/* ══ TAB 1: PHOTOS ══ */}
                                {requestDetailTab === 1 && (() => {
                                    const photos = Array.isArray(selectedRequest.photos) ? selectedRequest.photos.filter((p) => p && (p.url || typeof p === "string")) : [];
                                    if (photos.length === 0) return (
                                        <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                            <PhotoLibraryRoundedIcon sx={{ fontSize: 48, color: "primary.main" }} />
                                            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>No photos yet</Typography>
                                            <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 260 }}>
                                                No photos have been attached to this request.
                                            </Typography>
                                        </Box>
                                    );
                                    return <DetailPhotoGallery photos={photos} onReport={(pt, url, pid) => handlePhotoReportOpen(pt, url, pid, selectedRequest?.requesterId || selectedRequest?.requester_id || selectedRequest?.user_id)} isOwner={!!isRequesterOfSelected} />;
                                })()}

                                {/* ══ TAB 2: RESPONSES (owner only) ══ */}
                                {isRequesterOfSelected && requestDetailTab === 2 && (() => {
                                    const isFilled = selectedRequest.status === "filled";
                                    return (
                                        <Stack spacing={1.75} sx={{ pt: 2 }}>
                                            {isFilled && <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>This request has been marked as filled.</Alert>}

                                            <Stack spacing={1.5}>
                                                <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Responses ({responses.length})</Typography>
                                                {responsesLoading ? (
                                                    <Box sx={{ py: 6, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}><PulsingDots /></Box>
                                                ) : responses.length === 0 ? (
                                                    <Box sx={(t) => ({ p: 2.5, borderRadius: 2, textAlign: "center", bgcolor: alpha(t.palette.grey[500], 0.04), border: "1px solid", borderColor: "divider" })}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", mb: 0.5 }}>No responses yet</Typography>
                                                        <Typography variant="caption" sx={{ color: "text.disabled" }}>Service providers will appear here when they respond.</Typography>
                                                    </Box>
                                                ) : (
                                                    <Stack spacing={1.25}>
                                                        {responses.map((resp) => {
                                                            const isAccepted = resp.status === "accepted"; const isDeclined = resp.status === "declined";
                                                            const isWithdrawn = resp.status === "withdrawn"; const isPending = resp.status === "pending";
                                                            const acting = responseActionLoading === resp.id;
                                                            return (
                                                                <Box key={resp.id} sx={(t) => ({ p: 1.75, borderRadius: 2.5, border: "1px solid",
                                                                    borderColor: isAccepted ? alpha(t.palette.success.main, 0.3) : (isDeclined || isWithdrawn) ? alpha(t.palette.grey[400], 0.3) : alpha(t.palette.primary.main, 0.15),
                                                                    bgcolor: isAccepted ? alpha(t.palette.success.main, 0.04) : (isDeclined || isWithdrawn) ? alpha(t.palette.grey[400], 0.04) : t.palette.background.paper,
                                                                    opacity: isWithdrawn ? 0.6 : 1 })}>
                                                                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mb: 1 }}>
                                                                        <AccountAvatar src={resp.responderAvatar} accountType={resp.responderType || resp.responder_type || (resp.responderBusinessId ? "business" : resp.responderArtistId ? "artist" : "user")} size={36} />
                                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                            <Typography sx={{ fontWeight: 800, fontSize: 13.5, lineHeight: 1.2 }}>{resp.responderName || "Provider"}</Typography>
                                                                            {resp.responderHandle && <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 11 }}>@{resp.responderHandle}</Typography>}
                                                                        </Box>
                                                                        <Chip size="small" label={isAccepted ? "Accepted" : isDeclined ? "Declined" : isWithdrawn ? "Withdrawn" : "Pending"}
                                                                              color={isAccepted ? "success" : isDeclined ? "default" : isWithdrawn ? "default" : "warning"}
                                                                              variant={isAccepted ? "filled" : "outlined"}
                                                                              sx={{ height: 22, fontSize: 10.5, fontWeight: 800, borderRadius: 999 }} />
                                                                    </Box>
                                                                    <RichTextDisplay html={resp.message} sx={{ color: "text.secondary", mb: 1 }} />
                                                                    <ResponsePhotoGrid photos={resp.photos} onReport={(pt, url, pid) => handlePhotoReportOpen(pt, url, pid, resp?.responderId || resp?.responder_id || resp?.user_id)} isOwner={false} />
                                                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 1 }}>
                                                                        {(resp.quoteMin || resp.quoteMax || resp.quoteType === "free_estimate") && (
                                                                            <Chip size="small" icon={<AttachMoneyRoundedIcon sx={{ fontSize: 13 }} />}
                                                                                  label={resp.quoteType === "free_estimate" ? "Free Estimate" : resp.quoteMin && resp.quoteMax ? `$${Number(resp.quoteMin).toLocaleString()}\u2013$${Number(resp.quoteMax).toLocaleString()}${resp.quoteType === "hourly" ? "/hr" : ""}` : resp.quoteMin ? `From $${Number(resp.quoteMin).toLocaleString()}${resp.quoteType === "hourly" ? "/hr" : ""}` : resp.quoteMax ? `Up to $${Number(resp.quoteMax).toLocaleString()}` : resp.quoteType === "flexible" ? "Flexible pricing" : "Quote provided"}
                                                                                  sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} color="success" variant="outlined" />
                                                                        )}
                                                                        {resp.estimatedTimeline && <Chip size="small" icon={<AccessTimeRoundedIcon sx={{ fontSize: 13 }} />} label={resp.estimatedTimeline} sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }} variant="outlined" />}
                                                                    </Stack>
                                                                    {resp.listingId && resp.listingTitle && (
                                                                        <Box
                                                                            onClick={() => navigate(`/services/${resp.listingId}`)}
                                                                            sx={(t) => ({
                                                                                mt: 0.5, mb: 0.75, p: 1.25, borderRadius: 2,
                                                                                bgcolor: alpha(t.palette.primary.main, 0.04),
                                                                                border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1),
                                                                                cursor: "pointer",
                                                                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                                                                "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.08) },
                                                                            })}
                                                                        >
                                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 9.5, display: "block", mb: 0.5 }}>
                                                                                Linked Service
                                                                            </Typography>
                                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                                                <StorefrontRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                                                                                <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 800, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resp.listingTitle}</Typography>
                                                                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "primary.main", flexShrink: 0 }}>View</Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    )}
                                                                    {isAccepted && resp.responderContact?.value && (
                                                                        <Box sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.success.main, 0.06), border: "1px solid", borderColor: alpha(t.palette.success.main, 0.15), mb: 0.75 })}>
                                                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                                                                                <LockOpenRoundedIcon sx={{ fontSize: 14, color: "success.main" }} />
                                                                                <Typography variant="caption" sx={{ fontWeight: 900, color: "success.main", textTransform: "uppercase", fontSize: 10 }}>Provider Contact</Typography>
                                                                            </Box>
                                                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>{resp.responderContact.value}</Typography>
                                                                        </Box>
                                                                    )}
                                                                    {isPending && !acting && (
                                                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                                            <Button size="small" variant="contained" color="success" startIcon={<ThumbUpAltRoundedIcon sx={{ fontSize: 15 }} />}
                                                                                    onClick={() => handleAcceptResponse(resp.id)}
                                                                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, flex: 1 }}>Accept</Button>
                                                                            <Button size="small" variant="outlined" color="inherit" startIcon={<ThumbDownAltRoundedIcon sx={{ fontSize: 15 }} />}
                                                                                    onClick={() => handleDeclineResponse(resp.id)}
                                                                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 12, flex: 1 }}>Decline</Button>
                                                                        </Stack>
                                                                    )}
                                                                    {acting && (
                                                                        <Box sx={{ textAlign: "center", py: 1 }}><CircularProgress size={20} /></Box>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Stack>
                                    );
                                })()}
                            </Stack>
                        )}
                    </Box>
                </SwipeableRightDrawer>
            )}
        </Box>
    );
}
