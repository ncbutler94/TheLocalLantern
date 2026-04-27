// src/pages/marketplace/components/MarketplaceListingDetailPanel.jsx
// Right-panel listing detail — professional styling matching JobDetailPanel.
// Preserves: photo gallery + lightbox, 3-dot menu (owner detection), save/repost/share,
// message seller, seller reviews, owner actions (edit/delete/mark sold/relist).

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
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
    Fade,
    IconButton,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    MenuItem as MuiMenuItem,
    Rating,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkIcon from "@mui/icons-material/Link";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import useListingDetail from "../hooks/useListingDetail";
import { getSellerReviews, submitSellerReview, deleteReview, replyToSellerReview, deleteSellerReviewReply, reportReview } from "../api/marketplace";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import UserCardPopover from "../../../components/UserCardPopover";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";

import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ChildFriendlyRoundedIcon from "@mui/icons-material/ChildFriendlyRounded";
import PedalBikeRoundedIcon from "@mui/icons-material/PedalBikeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import HikingRoundedIcon from "@mui/icons-material/HikingRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import CheckroomRoundedIcon from "@mui/icons-material/CheckroomRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import YardRoundedIcon from "@mui/icons-material/YardRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import ChairRoundedIcon from "@mui/icons-material/ChairRounded";
import FaceRetouchingNaturalRoundedIcon from "@mui/icons-material/FaceRetouchingNaturalRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DiamondRoundedIcon from "@mui/icons-material/DiamondRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import FitnessCenterRoundedIcon from "@mui/icons-material/FitnessCenterRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import SportsEsportsRoundedIcon from "@mui/icons-material/SportsEsportsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LocalMallRoundedIcon from "@mui/icons-material/LocalMallRounded";
import PulsingDots from "../../../components/PulsingDots";
import ShareListingDialog from "../../../components/ShareListingDialog";
import { ReportDialog } from "../../../components/ActionBar";
import RichTextDisplay from "../../../components/RichTextDisplay";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";

/* ── GCS upload helpers (same pattern as ServiceDetailPage) ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}

async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

const MAX_REVIEW_PHOTOS = 4;

const CATEGORY_ICONS = {
    Appliances: KitchenRoundedIcon,
    "Arts & Crafts": PaletteRoundedIcon,
    Automotive: DirectionsCarRoundedIcon,
    "Baby & Kids": ChildFriendlyRoundedIcon,
    "Bikes & Scooters": PedalBikeRoundedIcon,
    "Books & Media": MenuBookRoundedIcon,
    "Camping & Outdoors": HikingRoundedIcon,
    "Cell Phones": SmartphoneRoundedIcon,
    "Clothing & Shoes": CheckroomRoundedIcon,
    Collectibles: EmojiEventsRoundedIcon,
    "Computers & Tablets": LaptopRoundedIcon,
    Electronics: DevicesRoundedIcon,
    "Farm & Garden": YardRoundedIcon,
    "Free Stuff": VolunteerActivismRoundedIcon,
    Furniture: ChairRoundedIcon,
    "Health & Beauty": FaceRetouchingNaturalRoundedIcon,
    "Home Improvement": HandymanRoundedIcon,
    Household: HomeRoundedIcon,
    "Jewelry & Accessories": DiamondRoundedIcon,
    "Musical Instruments": MusicNoteRoundedIcon,
    "Office Supplies": BusinessCenterRoundedIcon,
    "Pet Supplies": PetsRoundedIcon,
    "Sporting Goods": FitnessCenterRoundedIcon,
    Tickets: ConfirmationNumberRoundedIcon,
    Tools: ConstructionRoundedIcon,
    "Toys & Games": SmartToyRoundedIcon,
    "Video Games": SportsEsportsRoundedIcon,
    "Yard Sales": LocalMallRoundedIcon,
    Other: CategoryRoundedIcon,
};

// Lantern gold — uses theme secondary.main
const FALLBACK_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-family='Arial' font-size='24'%3ENo photo%3C/text%3E%3C/svg%3E";

/* ── Helpers ── */

function formatPrice(priceCents, priceModel) {
    if (priceModel === "free") return "Free";
    if (priceModel === "trade") return "Trade Only";
    const cents = Number.isFinite(Number(priceCents)) ? Number(priceCents) : 0;
    if (priceModel === "negotiable" && cents === 0) return "Make Offer";
    const dollars = Math.round(cents) / 100;
    const formatted = dollars.toLocaleString(undefined, { style: "currency", currency: "USD" });
    if (priceModel === "negotiable") return `${formatted} OBO`;
    return formatted;
}

function pricingContextLabel(priceModel) {
    if (priceModel === "negotiable") return "Asking Price";
    if (priceModel === "trade") return "Trade";
    if (priceModel === "free") return "Free";
    return null;
}

function formatLocation(item) {
    if (item?.isStatewide) return "Statewide";
    const parts = [];
    if (item?.city) parts.push(item.city);
    if (item?.county) parts.push(`${item.county} County`);
    return parts.length ? parts.join(", ") : "No location";
}

function getPhotoList(item) {
    if (!item) return [];
    const photos = Array.isArray(item.photos) ? item.photos : [];
    return photos.map((p) => (typeof p === "string" ? p : p?.url)).filter(Boolean);
}

function getImageSrc(item) {
    if (!item) return FALLBACK_IMG;
    if (item.coverPhotoUrl) return item.coverPhotoUrl;
    if (item.photoUrl) return item.photoUrl;
    const photos = getPhotoList(item);
    return photos.length > 0 ? photos[0] : FALLBACK_IMG;
}

function timeAgo(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const dy = Math.floor(h / 24);
    if (dy < 7) return `${dy}d ago`;
    const w = Math.floor(dy / 7);
    if (w < 5) return `${w}wk ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Avatar validation — treat platform default avatars as "no avatar" ── */

/* ── Yard sale date/time helpers ── */

function parseYardSaleDateStored(stored) {
    if (!stored) return ["", ""];
    const raw = String(stored);
    if (raw.includes("|")) { const parts = raw.split("|"); return [parts[0] || "", parts[1] || ""]; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return [raw, ""];
    return [raw, ""];
}

function parseYardSaleHoursStored(stored) {
    if (!stored) return ["", ""];
    const raw = String(stored);
    if (raw.includes("|")) { const parts = raw.split("|"); return [parts[0] || "", parts[1] || ""]; }
    return [raw, ""];
}

function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const parts = String(dateStr).split("-").map(Number);
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return dateStr;
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTimeShort(timeStr) {
    if (!timeStr) return "";
    const [hRaw, mRaw] = String(timeStr).split(":").map(Number);
    if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return timeStr;
    const ampm = hRaw >= 12 ? "PM" : "AM";
    const h12 = hRaw === 0 ? 12 : hRaw > 12 ? hRaw - 12 : hRaw;
    return `${h12}:${String(mRaw).padStart(2, "0")} ${ampm}`;
}

function formatYardSaleDateLabel(storedDate) {
    const [startD, endD] = parseYardSaleDateStored(storedDate);
    if (!startD) return "";
    if (endD && endD !== startD) return `${formatDateShort(startD)} \u2013 ${formatDateShort(endD)}`;
    return formatDateShort(startD);
}

function formatYardSaleTimeLabel(storedHours) {
    const [startT, endT] = parseYardSaleHoursStored(storedHours);
    if (!startT) return "";
    if (endT) return `${formatTimeShort(startT)} \u2013 ${formatTimeShort(endT)}`;
    return formatTimeShort(startT);
}

function isYardSalePast(storedDate) {
    if (!storedDate) return false;
    const [startD, endD] = parseYardSaleDateStored(storedDate);
    const relevantDate = endD || startD;
    if (!relevantDate) return false;
    const parts = String(relevantDate).split("-").map(Number);
    if (parts.length !== 3) return false;
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d, 23, 59, 59);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
}

/* ── Avatar validation — treat platform default avatars as "no avatar" ── */

function isDefaultAvatar(url) {
    if (!url) return true;
    const s = String(url).trim();
    if (!s || s === "null" || s === "undefined") return true;
    if (s.includes("default_avatar") || s.includes("default_business") || s.includes("default_logo")) return true;
    return false;
}

/* ── Owner detection ── */

const fmtCount = (n = 0) => {
    const x = Number(n) || 0;
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(x % 1_000_000 ? 1 : 0).replace(/\.0$/, "")}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(x % 1_000 ? 1 : 0).replace(/\.0$/, "")}k`;
    return String(x);
};

function useIsOwner(item, viewer) {
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount } = useActiveAccount();
    return useMemo(() => {
        const none = { isOwner: false, isOwnerAnyAccount: false, needsAccountSwitch: false };
        if (!viewer || !item) return none;

        const isNonPersonalProfile = isBusinessAccount || isArtistAccount;
        const sellerHandle = String(item?.sellerHandle || item?.seller?.handle || "").toLowerCase().trim();

        // When on a business/artist profile, use ONLY that profile's identifier.
        const activeIdentifier = isNonPersonalProfile
            ? String(activeAccount?.slug || activeAccount?.handle || "").toLowerCase().trim()
            : String(viewer?.handle || "").toLowerCase().trim();

        const activeMatch = Boolean(activeIdentifier && sellerHandle && activeIdentifier === sellerHandle);

        // If backend returned isOwner, validate against active profile context.
        if (item?.isOwner != null) {
            const backendOwner = Boolean(item.isOwner);
            if (isNonPersonalProfile) {
                return { isOwner: activeMatch, isOwnerAnyAccount: backendOwner, needsAccountSwitch: backendOwner && !activeMatch };
            }
            return { isOwner: backendOwner, isOwnerAnyAccount: backendOwner, needsAccountSwitch: false };
        }

        // Client-side fallback
        return { isOwner: activeMatch, isOwnerAnyAccount: activeMatch, needsAccountSwitch: false };
    }, [viewer, item, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount]);
}

/* ── Sub-components ── */

function SectionLabel({ children }) {
    return <Typography sx={{ fontWeight: 900, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase", color: "text.secondary", mb: 1 }}>{children}</Typography>;
}

function MetaChip({ icon, label, colorKey = "primary" }) {
    return (
        <Chip size="small" icon={icon || undefined} label={label}
              sx={(t) => {
                  const isNeutral = colorKey === "neutral";
                  const base = isNeutral ? t.palette.text.primary : (colorKey === "success" ? t.palette.success.main : t.palette.primary.main);
                  const fg = isNeutral ? alpha(t.palette.text.primary, 0.72) : (colorKey === "success" ? t.palette.success.dark : t.palette.primary.main);
                  return { height: 26, borderRadius: 999, fontWeight: 800, fontSize: 11, color: fg, bgcolor: alpha(base, isNeutral ? 0.05 : 0.09), border: "1px solid", borderColor: alpha(base, isNeutral ? 0.1 : 0.22), "& .MuiChip-icon": { color: fg, ml: 0.3 }, "& .MuiChip-label": { px: 0.6, lineHeight: 1 }, maxWidth: 200 };
              }} />
    );
}

function DetailCard({ icon, label, value, highlight = false }) {
    return (
        <Box sx={(t) => ({ p: { xs: 1.5, sm: 1.25 }, borderRadius: 2, border: "1px solid", borderColor: highlight ? alpha(t.palette.success.main, 0.2) : alpha(t.palette.text.primary, 0.06), bgcolor: highlight ? alpha(t.palette.success.main, 0.04) : t.palette.background.paper, display: "flex", alignItems: "flex-start", gap: 1 })}>
            <Box sx={(t) => ({ mt: 0.1, flexShrink: 0, color: highlight ? t.palette.success.main : t.palette.primary.main, display: "flex" })}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: { xs: 11, sm: 10 }, fontWeight: 700, color: "text.secondary", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: 14, sm: 13 }, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere", mt: 0.1 }}>{value}</Typography>
            </Box>
        </Box>
    );
}

function EmptyState({ onClearSelection }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400, p: { xs: 1.5, md: 2 } }}>
            <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Box sx={(t) => ({ width: 76, height: 76, borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", background: alpha(t.palette.primary.main, 0.06), border: `1px solid ${alpha(t.palette.primary.main, 0.12)}` })}>
                    <ShoppingCartRoundedIcon sx={{ fontSize: 40, color: "primary.main" }} />
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Select a Listing</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.45, maxWidth: 300 }}>Click a listing on the left to view its details, photos, and seller info here.</Typography>
            </Box>
        </Box>
    );
}

function LoadingSkeleton() {
    return (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, height: "100%" }}>
            <PulsingDots />
        </Box>
    );
}

function PhotoLightbox({ open, onClose, photos, activeIndex, onChangeIndex }) {
    const currentUrl = photos[activeIndex] || "";
    const total = photos.length;
    const hasPrev = activeIndex > 0;
    const hasNext = activeIndex < total - 1;
    const handleKeyDown = (e) => { if (e.key === "ArrowLeft" && hasPrev) onChangeIndex(activeIndex - 1); if (e.key === "ArrowRight" && hasNext) onChangeIndex(activeIndex + 1); if (e.key === "Escape") onClose(); };
    return (
        <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth={false} onKeyDown={handleKeyDown}
                slotProps={{ backdrop: { sx: { bgcolor: (t) => alpha(t.palette.common.black, 0.88) } } }}
                PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none", overflow: "visible", maxWidth: "92vw", maxHeight: "92vh", m: 1, borderRadius: 3, position: "relative" } }}
                sx={{ zIndex: 100001 }}>
            <IconButton onClick={onClose} aria-label="Close" sx={{ position: "absolute", top: -44, right: 0, color: "common.white", bgcolor: (t) => alpha(t.palette.background.paper, 0.12), "&:hover": { bgcolor: (t) => alpha(t.palette.background.paper, 0.22) }, zIndex: 10 }}><CloseRoundedIcon /></IconButton>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minWidth: { xs: 280, sm: 400, md: 520 }, minHeight: { xs: 280, sm: 400, md: 440 } }}>
                <Fade in key={currentUrl} timeout={200}>
                    <Box component="img" src={currentUrl} alt={`Photo ${activeIndex + 1}`} sx={{ maxWidth: "88vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 2.5, display: "block", userSelect: "none" }} />
                </Fade>
                {hasPrev && <IconButton onClick={() => onChangeIndex(activeIndex - 1)} sx={{ position: "absolute", left: { xs: 4, md: -52 }, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.45), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) }, width: 40, height: 40 }}><ChevronLeftRoundedIcon sx={{ fontSize: 28 }} /></IconButton>}
                {hasNext && <IconButton onClick={() => onChangeIndex(activeIndex + 1)} sx={{ position: "absolute", right: { xs: 4, md: -52 }, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.black, 0.45), "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) }, width: 40, height: 40 }}><ChevronRightRoundedIcon sx={{ fontSize: 28 }} /></IconButton>}
            </Box>
            {total > 1 && (
                <Stack spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <Typography sx={{ color: (t) => alpha(t.palette.common.white, 0.7), fontSize: 13, fontWeight: 700 }}>{activeIndex + 1} / {total}</Typography>
                    <Stack direction="row" spacing={0.75} justifyContent="center">
                        {photos.map((url, idx) => (
                            <Box key={url} onClick={() => onChangeIndex(idx)}
                                 sx={{ width: 48, height: 48, borderRadius: 1.5, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "2px solid", borderColor: idx === activeIndex ? "common.white" : (t) => alpha(t.palette.common.white, 0.25), opacity: idx === activeIndex ? 1 : 0.6, transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { opacity: 1 } }}>
                                <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Dialog>
    );
}

/* ═══════════════════════════════════════════════════════════════
   PANEL REVIEW CARD — compact with seller reply support
   ═══════════════════════════════════════════════════════════════ */

function PanelReviewCard({ rev, idx, sellerId, isOwner, onReplyUpdate, viewer, viewerId: viewerIdProp, onEditReview, onDeleteReview, onReportReview, isHighlighted }) {
    const navigate = useNavigate();
    const revAvatar = rev.reviewer_avatar || rev.reviewer?.avatarUrl || "";
    const revFirstName = rev.reviewer_first_name || rev.reviewer?.firstName || "";
    const revLastName = rev.reviewer_last_name || rev.reviewer?.lastName || "";
    const revDisplayName = rev.reviewer_name || rev.reviewer?.name || "";
    const revHandle = rev.reviewer_handle || rev.reviewer?.handle || "";
    const revId = rev.reviewer_id || rev.reviewer?.id || null;
    const revName = [revFirstName, revLastName].filter(Boolean).join(" ") || revDisplayName || revHandle || "Anonymous";
    const revCreated = rev.created_at || rev.createdAt || "";

    // Resolve viewer ID robustly
    const resolvedViewerId = viewerIdProp || Number(viewer?.id || viewer?.user_id || 0) || 0;

    const sellerReply = rev.seller_reply || rev.sellerReply || null;
    const replyByFN = rev.reply_by_first_name || "";
    const replyByLN = rev.reply_by_last_name || "";
    const replyByDN = rev.reply_by_name || "";
    const replyByHandle = rev.reply_by_handle || "";
    const replyByName = [replyByFN, replyByLN].filter(Boolean).join(" ") || replyByDN || replyByHandle || "Seller";
    const replyByAvatar = rev.reply_by_avatar || "";
    const replyAt = rev.seller_reply_at || rev.sellerReplyAt || "";

    const viewerIsReviewer = Boolean(resolvedViewerId && revId && resolvedViewerId === Number(revId));

    const [replyOpen, setReplyOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replySaving, setReplySaving] = useState(false);
    const [replyError, setReplyError] = useState("");
    const [deleteReplyConfirmOpen, setDeleteReplyConfirmOpen] = useState(false);
    const [replyPhotos, setReplyPhotos] = useState([]);

    // Review photo lightbox state
    const [reviewLightboxOpen, setReviewLightboxOpen] = useState(false);
    const [reviewLightboxPhotos, setReviewLightboxPhotos] = useState([]);
    const [reviewLightboxIndex, setReviewLightboxIndex] = useState(0);

    const openReviewPhotoLightbox = (photos, index) => {
        setReviewLightboxPhotos(photos);
        setReviewLightboxIndex(index);
        setReviewLightboxOpen(true);
    };

    // 3-dot menu state for review
    const [revMenuAnchor, setRevMenuAnchor] = useState(null);
    const revMenuOpen = Boolean(revMenuAnchor);

    // 3-dot menu state for reply
    const [replyMenuAnchor, setReplyMenuAnchor] = useState(null);
    const replyMenuOpen = Boolean(replyMenuAnchor);

    // Delete review confirmation
    const [deleteReviewConfirmOpen, setDeleteReviewConfirmOpen] = useState(false);
    const [deleteReviewSubmitting, setDeleteReviewSubmitting] = useState(false);

    // UserCardPopover state
    const [cardAnchor, setCardAnchor] = useState(null);
    const [cardUser, setCardUser] = useState(null);

    const openReviewerCard = (e) => {
        setCardAnchor(e.currentTarget);
        setCardUser({ id: revId, handle: revHandle, first_name: revFirstName, last_name: revLastName, avatar_url: revAvatar });
    };

    const openReplyByCard = (e) => {
        setCardAnchor(e.currentTarget);
        setCardUser({ handle: replyByHandle, first_name: replyByFN, last_name: replyByLN, avatar_url: replyByAvatar });
    };

    const handleOpenReply = () => {
        setReplyText(sellerReply || "");
        setReplyError("");
        const existingReplyPhotos = Array.isArray(rev.reply_photo_urls) ? rev.reply_photo_urls.filter(Boolean) : [];
        setReplyPhotos(existingReplyPhotos.map((u) => ({ id: u, url: u, _existing: true })));
        setReplyOpen(true);
    };
    const handleCancelReply = () => { if (replySaving) return; setReplyOpen(false); setReplyError(""); };

    const handleSaveReply = async () => {
        const body = replyText.trim();
        if (!body) { setReplyError("Reply cannot be empty."); return; }
        setReplySaving(true); setReplyError("");
        try {
            // Upload new reply photos via signed URLs
            const uploadedPhotos = [];
            for (const p of replyPhotos) {
                if (p._existing && p.url) {
                    uploadedPhotos.push({ url: p.url });
                } else if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_reply_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "marketplace/review-replies", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) {
                            await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct });
                            uploadedPhotos.push({ url: String(s.publicUrl || "").trim() });
                        }
                    } catch { /* skip failed upload */ }
                }
            }
            const resp = await replyToSellerReview(sellerId, rev.id, body, uploadedPhotos);
            if (onReplyUpdate) onReplyUpdate(rev.id, resp.sellerReply || body, resp.sellerReplyAt || new Date().toISOString(), resp.replyByName || null, resp.replyByHandle || null, resp.replyByAvatar || null, resp.replyPhotoUrls || uploadedPhotos.map((p) => p.url));
            setReplyOpen(false);
        } catch (err) { setReplyError(err?.message || "Failed to save reply."); }
        finally { setReplySaving(false); }
    };

    const handleDeleteReplyConfirmed = async () => {
        setReplySaving(true);
        try {
            await deleteSellerReviewReply(sellerId, rev.id);
            if (onReplyUpdate) onReplyUpdate(rev.id, null, null, null, null, null, []);
            setDeleteReplyConfirmOpen(false); setReplyOpen(false);
        } catch (err) { setReplyError(err?.message || "Failed to delete reply."); }
        finally { setReplySaving(false); }
    };

    const handleDeleteReviewConfirmed = async () => {
        if (!rev.id) return;
        setDeleteReviewSubmitting(true);
        try {
            await deleteReview(rev.id);
            setDeleteReviewConfirmOpen(false);
            if (onDeleteReview) onDeleteReview(rev.id);
        } catch {
            // silent
        } finally {
            setDeleteReviewSubmitting(false);
        }
    };

    return (
        <>
            <Box data-seller-review-id={rev.id}>            {idx > 0 && <Divider />}
                <Box sx={(t) => ({
                    py: 1.5,
                    ...(isHighlighted ? {
                        px: 1.5, mx: -1.5, borderRadius: 2,
                        border: '2px solid',
                        borderColor: alpha(t.custom?.brand?.brass || '#A87822', 0.70),
                        bgcolor: alpha(t.custom?.brand?.brass || '#A87822', 0.10),
                        boxShadow: `0 10px 30px ${alpha(t.custom?.brand?.brass || '#A87822', 0.18)}`,
                        transition: `background-color 600ms ease, box-shadow 600ms ease, border-color 600ms ease`,
                    } : {}),
                })}>
                    {/* Reviewer row: avatar + name + 3-dot menu */}
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Box
                            onClick={openReviewerCard}
                            sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 0.75,
                                cursor: "pointer",
                                borderRadius: 1,
                                px: 0.4,
                                py: 0.2,
                                mx: -0.4,
                                width: "fit-content",
                                transition: (t) => `background ${t.transitions.duration.shortest}ms`,
                                "&:hover": {
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    "& .ll-panel-reviewer-name": { textDecoration: "underline" },
                                },
                            }}
                        >
                            <Avatar src={revAvatar || undefined} alt={revName}
                                    sx={(t) => ({ width: 28, height: 28, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main, fontSize: 11, flexShrink: 0 })}>
                                <PersonRoundedIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography className="ll-panel-reviewer-name" variant="caption" sx={{ fontWeight: 800, fontSize: 11, lineHeight: 1.3, display: "block" }}>{revName}</Typography>
                                {revHandle && <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.1, display: "block" }}>@{revHandle}</Typography>}
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 9.5, display: "block", lineHeight: 1.1, mt: 0.1 }}>{timeAgo(revCreated)}</Typography>
                            </Box>
                        </Box>

                        {/* 3-dot menu for review */}
                        {resolvedViewerId > 0 && (
                            <IconButton size="small" onClick={(e) => setRevMenuAnchor(e.currentTarget)} sx={(t) => ({ width: 32, height: 32, flexShrink: 0, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } })}>
                                <MoreVertRoundedIcon fontSize="small" />
                            </IconButton>
                        )}
                        <SmartMenu anchorEl={revMenuAnchor} open={revMenuOpen} onClose={() => setRevMenuAnchor(null)}
                                   disableScrollLock
                                   onClick={(e) => e.stopPropagation()}
                                   anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                                   sx={{ zIndex: (t) => t.zIndex.modal + 30 }}
                                   PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 180, py: 0.5 } }}>
                            {viewerIsReviewer && (
                                <MuiMenuItem onClick={() => { setRevMenuAnchor(null); if (onEditReview) onEditReview(rev); }} sx={{ py: 1 }}>
                                    <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Edit review" />
                                </MuiMenuItem>
                            )}
                            {viewerIsReviewer && (
                                <MuiMenuItem onClick={() => { setRevMenuAnchor(null); setDeleteReviewConfirmOpen(true); }} sx={{ py: 1, color: "error.main" }}>
                                    <ListItemIcon><DeleteRoundedIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
                                    <ListItemText primary="Delete review" />
                                </MuiMenuItem>
                            )}
                            {!viewerIsReviewer && resolvedViewerId > 0 && (
                                <MuiMenuItem onClick={() => { setRevMenuAnchor(null); if (onReportReview) onReportReview(rev.id); }} sx={{ py: 1 }}>
                                    <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Report review" />
                                </MuiMenuItem>
                            )}
                        </SmartMenu>
                    </Stack>

                    {/* Review content — not part of the clickable user area */}
                    <Box sx={{ pl: 4.75 }}>
                        <Rating value={rev.rating} readOnly size="small" sx={{ "& .MuiRating-icon": { fontSize: 13 } }} />
                        {rev.comment && <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.45, mt: 0.25 }}>{rev.comment}</Typography>}

                        {/* Review Photos */}
                        {(() => {
                            const reviewPhotos = Array.isArray(rev.photo_urls) ? rev.photo_urls.filter(Boolean)
                                : Array.isArray(rev.photoUrls) ? rev.photoUrls.filter(Boolean) : [];
                            if (!reviewPhotos.length) return null;
                            return (
                                <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                    {reviewPhotos.map((url, i) => (
                                        <Box key={i} onClick={() => openReviewPhotoLightbox(reviewPhotos, i)} sx={{ position: "relative", width: 88, height: 88, flexShrink: 0, borderRadius: 2, overflow: "hidden", cursor: "pointer", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.05)" }, "&:hover .ll-zoom-icon": { opacity: 1 }, "&:hover": { boxShadow: (t) => t.custom?.shadows?.xs || "0 1px 4px rgba(0,0,0,0.1)" } }}>
                                            <Box component="img" src={url} alt={`Review photo ${i + 1}`} referrerPolicy="no-referrer"
                                                 sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 250ms ease" }} />
                                            <Box className="ll-zoom-icon" sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: "opacity 200ms ease" }}>
                                                <ZoomInRoundedIcon sx={{ color: "common.white", fontSize: 20 }} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            );
                        })()}

                        {/* Seller reply display */}
                        {sellerReply && !replyOpen && (
                            <Box sx={(t) => ({ mt: 1, pl: 1, py: 0.75, borderLeft: "2px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 6px 6px 0" })}>
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                    {/* Clickable avatar + name area — opens popover */}
                                    <Box
                                        onClick={openReplyByCard}
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 0.75,
                                            cursor: replyByHandle ? "pointer" : "default",
                                            borderRadius: 1,
                                            px: 0.4,
                                            py: 0.15,
                                            mx: -0.4,
                                            transition: (t) => `background ${t.transitions.duration.shortest}ms`,
                                            "&:hover": replyByHandle ? {
                                                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                                "& .ll-panel-reply-name": { textDecoration: "underline" },
                                            } : {},
                                        }}
                                    >
                                        <Avatar
                                            src={replyByAvatar || undefined}
                                            sx={(t) => ({
                                                width: 26, height: 26,
                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                color: t.palette.primary.main,
                                                mt: 0.1, flexShrink: 0,
                                            })}
                                        >
                                            <PersonRoundedIcon sx={{ fontSize: 14 }} />
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                            {/* Row 1: Name + Seller badge */}
                                            <Stack direction="row" alignItems="center" spacing={0.4}>
                                                <Typography className="ll-panel-reply-name" variant="caption" fontWeight={800} color="primary.dark" sx={{ fontSize: 12, lineHeight: 1.3 }}>{replyByName}</Typography>
                                                <Chip label="Seller" size="small" sx={{ height: 16, fontSize: "0.52rem", fontWeight: 800, bgcolor: "primary.main", color: "common.white" }} />
                                            </Stack>
                                            {/* Row 2: @handle */}
                                            {replyByHandle && (
                                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, fontSize: 10.5, display: "block" }}>@{replyByHandle}</Typography>
                                            )}
                                            {/* Row 3: Timestamp */}
                                            {replyAt && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.2, mt: 0.1, display: "block" }}>{timeAgo(replyAt)}</Typography>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* 3-dot menu for reply */}
                                    <IconButton size="small" onClick={(e) => setReplyMenuAnchor(e.currentTarget)} sx={{ width: 28, height: 28, flexShrink: 0, color: "text.secondary" }}>
                                        <MoreVertRoundedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <SmartMenu anchorEl={replyMenuAnchor} open={replyMenuOpen} onClose={() => setReplyMenuAnchor(null)}
                                               disableScrollLock
                                               onClick={(e) => e.stopPropagation()}
                                               anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                                               PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 180, py: 0.5 } }}>
                                        {isOwner && (
                                            <MuiMenuItem onClick={() => { setReplyMenuAnchor(null); handleOpenReply(); }} sx={{ py: 1 }}>
                                                <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary="Edit reply" />
                                            </MuiMenuItem>
                                        )}
                                        {isOwner && (
                                            <MuiMenuItem onClick={() => { setReplyMenuAnchor(null); setDeleteReplyConfirmOpen(true); }} sx={{ py: 1, color: "error.main" }}>
                                                <ListItemIcon><DeleteRoundedIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
                                                <ListItemText primary="Delete reply" />
                                            </MuiMenuItem>
                                        )}
                                        {!isOwner && resolvedViewerId > 0 && (
                                            <MuiMenuItem onClick={() => { setReplyMenuAnchor(null); if (onReportReview) onReportReview(rev.id); }} sx={{ py: 1 }}>
                                                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                                <ListItemText primary="Report reply" />
                                            </MuiMenuItem>
                                        )}
                                    </SmartMenu>
                                </Stack>
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.45, fontSize: 12, pl: 3.75 }}>{sellerReply}</Typography>
                                {/* Reply Photos */}
                                {(() => {
                                    const replyPhotoUrls = Array.isArray(rev.reply_photo_urls) ? rev.reply_photo_urls.filter(Boolean) : [];
                                    if (!replyPhotoUrls.length) return null;
                                    return (
                                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, pl: 3.75, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 3 }, "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                            {replyPhotoUrls.map((url, i) => (
                                                <Box key={i} onClick={() => openReviewPhotoLightbox(replyPhotoUrls, i)} sx={{ position: "relative", width: 68, height: 68, flexShrink: 0, borderRadius: 1.5, overflow: "hidden", cursor: "pointer", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.05)" }, "&:hover .ll-zoom-icon": { opacity: 1 }, "&:hover": { boxShadow: (t) => t.custom?.shadows?.xs || "0 1px 4px rgba(0,0,0,0.1)" } }}>
                                                    <Box component="img" src={url} alt={`Reply photo ${i + 1}`} referrerPolicy="no-referrer"
                                                         sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 250ms ease" }} />
                                                    <Box className="ll-zoom-icon" sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: "opacity 200ms ease" }}>
                                                        <ZoomInRoundedIcon sx={{ color: "common.white", fontSize: 18 }} />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    );
                                })()}
                            </Box>
                        )}

                        {/* Inline reply form */}
                        {replyOpen && (
                            <Box sx={(t) => ({ mt: 1, pl: 1, py: 1, borderLeft: "2px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 6px 6px 0" })}>
                                <Typography variant="caption" fontWeight={800} color="primary.dark" sx={{ mb: 0.75, display: "block", fontSize: 10.5 }}>{sellerReply ? "Edit Response" : "Reply as Seller"}</Typography>
                                <TextField fullWidth multiline minRows={2} maxRows={4} placeholder="Write your response..." value={replyText}
                                           onChange={(e) => { setReplyText(e.target.value.slice(0, 2000)); if (replyError) setReplyError(""); }} disabled={replySaving} size="small"
                                           error={Boolean(replyError)}
                                           helperText={replyError || `${replyText.length}/2000`}
                                           FormHelperTextProps={{ sx: { fontWeight: replyError ? 700 : 400, fontSize: replyError ? "0.68rem" : "0.65rem" } }}
                                           sx={{ mb: 0.75, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 12 } }} />
                                <Box sx={{ mb: 0.75 }}>
                                    <PhotosUploadSection
                                        photos={replyPhotos}
                                        setPhotos={setReplyPhotos}
                                        disabled={replySaving}
                                        maxPhotos={MAX_REVIEW_PHOTOS}
                                        title="Photos (optional)"
                                        helperText="Add up to 4 photos."
                                        addButtonText="Add photos"
                                    />
                                </Box>
                                <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                                    <Button size="small" onClick={handleCancelReply} disabled={replySaving} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.7rem", minHeight: 0, py: 0.25 }}>Cancel</Button>
                                    <Button size="small" variant="contained" onClick={handleSaveReply} disabled={replySaving || !replyText.trim()}
                                            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.7rem", borderRadius: 1.5, minHeight: 0, py: 0.25 }}>
                                        {replySaving ? "Saving..." : (sellerReply ? "Update" : "Post Reply")}
                                    </Button>
                                </Stack>
                            </Box>
                        )}

                        {/* Reply button for seller */}
                        {isOwner && !sellerReply && !replyOpen && (
                            <Button size="small" startIcon={<ReplyRoundedIcon sx={{ fontSize: 12 }} />} onClick={handleOpenReply}
                                    sx={{ mt: 0.5, color: "text.secondary", textTransform: "none", fontWeight: 600, fontSize: "0.7rem", borderRadius: 2, px: 0.75, minHeight: 0, py: 0.15, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}>
                                Reply
                            </Button>
                        )}

                        {/* Delete reply confirmation */}
                        <Dialog open={deleteReplyConfirmOpen} onClose={() => setDeleteReplyConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 100001 }}>
                            <DialogTitle sx={{ fontWeight: 700, pr: 6, fontSize: 16 }}>
                                Delete Response?
                                <IconButton onClick={() => setDeleteReplyConfirmOpen(false)} sx={{ position: "absolute", top: 8, right: 8 }}><CloseRoundedIcon fontSize="small" /></IconButton>
                            </DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" color="text.secondary">This will permanently remove your response to this review.</Typography>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, pb: 2 }}>
                                <Button onClick={() => setDeleteReplyConfirmOpen(false)} disabled={replySaving} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
                                <Button variant="contained" color="error" onClick={handleDeleteReplyConfirmed} disabled={replySaving}
                                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>{replySaving ? "Deleting..." : "Delete"}</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Delete review confirmation */}
                        <Dialog open={deleteReviewConfirmOpen} onClose={() => setDeleteReviewConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }} sx={{ zIndex: 100001 }}>
                            <Box sx={{ p: 3, textAlign: "center" }}>
                                <Box sx={(t) => ({ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(t.palette.error.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 })}>
                                    <DeleteRoundedIcon sx={{ fontSize: 28, color: "error.main" }} />
                                </Box>
                                <Typography variant="h6" fontWeight={900} sx={{ mb: 0.75 }}>Delete Your Review?</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: "auto" }}>
                                    This will permanently remove your review and rating.
                                </Typography>
                                <Stack direction="row" spacing={1.5} justifyContent="center">
                                    <Button variant="outlined" onClick={() => setDeleteReviewConfirmOpen(false)} disabled={deleteReviewSubmitting}
                                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>Cancel</Button>
                                    <Button variant="contained" color="error" onClick={handleDeleteReviewConfirmed} disabled={deleteReviewSubmitting}
                                            startIcon={deleteReviewSubmitting ? <CircularProgress size={16} color="inherit" /> : <DeleteRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>
                                        {deleteReviewSubmitting ? "Deleting\u2026" : "Delete Review"}
                                    </Button>
                                </Stack>
                            </Box>
                        </Dialog>
                    </Box>
                </Box>

                {/* UserCardPopover — shared for reviewer and reply-by */}
                <UserCardPopover
                    anchorEl={cardAnchor}
                    onClose={() => { setCardAnchor(null); setCardUser(null); }}
                    user={cardUser}
                    isSelf={Boolean(resolvedViewerId && cardUser && (
                        (cardUser.handle && viewer && String(viewer.handle || "").toLowerCase() === String(cardUser.handle).toLowerCase()) ||
                        (cardUser.id && resolvedViewerId === Number(cardUser.id))
                    ))}
                    following={false}
                    onViewProfile={(u) => { const h = u?.handle; if (h) window.location.assign(`/${h}`); }}
                />

                {/* Review / reply photo lightbox */}
                <PhotoLightbox
                    open={reviewLightboxOpen}
                    onClose={() => setReviewLightboxOpen(false)}
                    photos={reviewLightboxPhotos}
                    activeIndex={reviewLightboxIndex}
                    onChangeIndex={setReviewLightboxIndex}
                />
            </Box>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   WRITE / EDIT SELLER REVIEW DIALOG
   ═══════════════════════════════════════════════════════════════ */

function WriteSellerReviewDialog({ open, onClose, sellerId, sellerName, listingId, existingReview, onSaved, isOwnListing, isNonPersonalAccount }) {
    const _wTheme = useTheme();
    const _wMobile = useMediaQuery(_wTheme.breakpoints.down('md'));
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [commentError, setCommentError] = useState("");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    useEffect(() => {
        if (open && existingReview) {
            setRating(existingReview.rating || 0);
            setComment(existingReview.comment || "");
            setPhotos(
                (Array.isArray(existingReview.photo_urls) ? existingReview.photo_urls : [])
                    .filter(Boolean)
                    .map((u) => ({ id: u, url: u, _existing: true }))
            );
        } else if (open) {
            setRating(0);
            setComment("");
            setPhotos([]);
        }
        setError("");
        setCommentError("");
    }, [open, existingReview]);

    const handleClose = () => {
        photos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch { /* noop */ } } });
        setRating(0);
        setComment("");
        setPhotos([]);
        setError("");
        setCommentError("");
        setDeleteConfirmOpen(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (isOwnListing) { setError("You cannot review yourself."); return; }
        if (isNonPersonalAccount) { setError("Please switch to your personal account to leave a review."); return; }
        if (!rating) { setError("Please select a rating."); return; }
        setSubmitting(true);
        setError("");
        setCommentError("");
        try {
            // Upload new photos via signed URLs
            const uploadedPhotos = [];
            for (const p of photos) {
                if (p._existing && p.url) {
                    uploadedPhotos.push({ url: p.url });
                } else if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_review_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "marketplace/reviews", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) {
                            await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct });
                            uploadedPhotos.push({ url: String(s.publicUrl || "").trim() });
                        }
                    } catch { /* skip failed upload */ }
                }
            }
            await submitSellerReview(sellerId, { rating, comment: comment.trim(), listingId, photos: uploadedPhotos });
            handleClose();
            if (onSaved) onSaved();
        } catch (err) {
            const msg = err?.message || "Failed to submit review.";
            const field = err?.body?.field;
            if (field === "comment") {
                setCommentError(msg);
            } else {
                setError(msg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!existingReview?.id) return;
        setDeleteSubmitting(true);
        try {
            await deleteReview(existingReview.id);
            setDeleteConfirmOpen(false);
            handleClose();
            if (onSaved) onSaved();
        } catch (err) {
            setError(err?.message || "Failed to delete review.");
            setDeleteConfirmOpen(false);
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const showBlockedMessage = isOwnListing || isNonPersonalAccount;

    return (
        <>
            <Dialog open={open && !deleteConfirmOpen} onClose={(e, reason) => { if (reason === "backdropClick") return; if (!submitting) handleClose(); }} maxWidth="sm" fullWidth
                    fullScreen={_wMobile}
                    PaperProps={{ sx: { borderRadius: _wMobile ? 0 : undefined } }}
                    sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6" fontWeight={800}>{existingReview ? "Edit Your Review" : "Write a Review"}</Typography>
                    <IconButton onClick={handleClose} disabled={submitting} size="small"><CloseRoundedIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {showBlockedMessage ? (
                        <Box sx={{ py: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <Box sx={(t) => ({ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mb: 2, bgcolor: alpha(t.palette.primary.main, 0.08), color: "primary.main" })}>
                                <RateReviewRoundedIcon sx={{ fontSize: 30 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                                {isOwnListing ? "You cannot review yourself." : "Switch to your personal account"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                                {isOwnListing
                                    ? "Sellers cannot leave reviews on their own listings."
                                    : "Reviews must be left from your personal profile. Switch to your personal account to leave a seller review."}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Share your experience with {sellerName}</Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Your Rating *</Typography>
                                <Rating value={rating} precision={1} onChange={(_e, newVal) => setRating(newVal || 0)} size="large" />
                            </Box>
                            <TextField fullWidth multiline rows={4} label="Your Review" value={comment} onChange={(e) => { setComment(e.target.value); if (commentError) setCommentError(""); }}
                                       placeholder="How was your experience with this seller?" inputProps={{ maxLength: 1000 }}
                                       error={Boolean(commentError)}
                                       helperText={commentError || `${comment.length} / 1,000`}
                                       FormHelperTextProps={{ sx: { textAlign: commentError ? "left" : "right", mr: 0.5, fontWeight: commentError ? 700 : 600, fontSize: "0.72rem" } }}
                                       sx={{ mb: 2 }} />
                            <Box sx={{ mb: 1.5 }}>
                                <PhotosUploadSection
                                    photos={photos}
                                    setPhotos={setPhotos}
                                    disabled={submitting}
                                    maxPhotos={MAX_REVIEW_PHOTOS}
                                    title="Photos (optional)"
                                    helperText="Add up to 4 photos of your experience."
                                    addButtonText="Add photos"
                                />
                            </Box>
                            {error && <Typography variant="body2" color="error" fontWeight={700} sx={{ mt: 1 }}>{error}</Typography>}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, pt: 0, justifyContent: showBlockedMessage ? "flex-end" : existingReview ? "space-between" : "flex-end", flexDirection: "column", gap: 0 }}>
                    <Divider sx={{ width: "100%", mb: 1.5 }} />
                    <Box sx={{ display: "flex", width: "100%", justifyContent: showBlockedMessage ? "flex-end" : existingReview ? "space-between" : "flex-end", alignItems: "center" }}>
                        {!showBlockedMessage && existingReview && (
                            <Button color="error" startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                    onClick={() => setDeleteConfirmOpen(true)} disabled={submitting}
                                    sx={{ textTransform: "none", fontWeight: 700 }}>Delete</Button>
                        )}
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button onClick={handleClose} disabled={submitting}>Close</Button>
                            {!showBlockedMessage && (
                                <Button variant="contained" disabled={!rating || submitting} onClick={handleSubmit}>
                                    {submitting ? "Saving\u2026" : existingReview ? "Update Review" : "Submit Review"}
                                </Button>
                            )}
                        </Box>
                    </Box>
                    {submitting && <LinearProgress sx={{ width: "100%", mt: 1, borderRadius: 1 }} />}
                </DialogActions>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={deleteConfirmOpen} onClose={deleteSubmitting ? undefined : () => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 100001 }}>
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <Box sx={(t) => ({ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(t.palette.error.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 })}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 28, color: "error.main" }} />
                    </Box>
                    <Typography variant="h6" fontWeight={900} sx={{ mb: 0.75 }}>Delete Your Review?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: "auto" }}>
                        This will permanently remove your review and rating.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button variant="outlined" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteSubmitting} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={handleDeleteReview} disabled={deleteSubmitting}
                                startIcon={deleteSubmitting ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>
                            {deleteSubmitting ? "Deleting\u2026" : "Delete Review"}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

// Client-side per-seller message tracker
const _sellerMsgTracker = new Map();
const _SELLER_MSG_WINDOW = 10 * 60 * 1000;
const _SELLER_MSG_MAX = 5;

function _trackSellerMsg(sellerId) {
    const now = Date.now();
    const key = String(sellerId);
    const entries = (_sellerMsgTracker.get(key) || []).filter(t => now - t < _SELLER_MSG_WINDOW);
    entries.push(now);
    _sellerMsgTracker.set(key, entries);
}

function _isSellerLimited(sellerId) {
    const now = Date.now();
    const key = String(sellerId);
    const entries = (_sellerMsgTracker.get(key) || []).filter(t => now - t < _SELLER_MSG_WINDOW);
    return entries.length >= _SELLER_MSG_MAX;
}

export default function MarketplaceListingDetailPanel({
                                                          listingId, onClearSelection, user, onRequireAuth,
                                                          onFavorite, onRepost, onEdit, onDelete, onMarkSold, onRelist, onFlag, onUpdated,
                                                          initialTab, highlightReviewId, highlightReviewerId,
                                                          onSellerFilter,
                                                      }) {
    const auth = useAuth();
    const navigate = useNavigate();
    const mldpTheme = useTheme();
    const isMobile = useMediaQuery(mldpTheme.breakpoints.down("md"));
    const viewer = user?.user || user || auth?.user?.user || auth?.user || null;
    const { activeBusinessId, activeArtistId, accountCacheKey, isBusinessAccount, isArtistAccount, activeAccount } = useActiveAccount();
    const viewerId = useMemo(() => {
        const fromUser = user?.user?.id || user?.id;
        if (fromUser) return Number(fromUser);
        const fromAuth = auth?.user?.id || auth?.user?.user_id || auth?.user?.user?.id;
        if (fromAuth) return Number(fromAuth);
        const fromAcct = activeAccount?.user_id || activeAccount?.id;
        if (fromAcct) return Number(fromAcct);
        try { const raw = localStorage.getItem("ll:activeAccount"); const a = raw ? JSON.parse(raw) : null; return Number(a?.user_id || a?.id || 0) || 0; } catch { return 0; }
    }, [user, auth?.user, activeAccount]);
    const listingDetailOptions = useMemo(() => ({ activeBusinessId, activeArtistId }), [activeBusinessId, activeArtistId]);
    const { item, isLoading, error, refresh } = useListingDetail(listingId, listingDetailOptions);
    const { isOwner, isOwnerAnyAccount, needsAccountSwitch } = useIsOwner(item, viewer);

    const [activePhoto, setActivePhoto] = useState(0);
    const scrollRef = useRef(null);

    // Quick message dialog state
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [quickMsgBody, setQuickMsgBody] = useState("");
    const [quickMsgPhotos, setQuickMsgPhotos] = useState([]);
    const [quickMsgSending, setQuickMsgSending] = useState(false);
    const [quickMsgError, setQuickMsgError] = useState("");
    const [quickMsgSuccess, setQuickMsgSuccess] = useState(false);
    const [quickMsgSent, setQuickMsgSent] = useState(false);
    const [quickMsgCooldown, setQuickMsgCooldown] = useState(0);
    const [quickMsgLimitOpen, setQuickMsgLimitOpen] = useState(false);

    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const [copyToast, setCopyToast] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ avgRating: null, totalCount: 0 });
    const [sellerStats, setSellerStats] = useState({ totalListings: 0, soldListings: 0, activeListings: 0, memberSince: null });
    const [userReview, setUserReview] = useState(null);
    const [writeReviewOpen, setWriteReviewOpen] = useState(false);
    const [detailTab, setDetailTab] = useState(initialTab ?? 0);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [shareOpen, setShareOpen] = useState(false);

    // Review report dialog state
    const [reviewReportOpen, setReviewReportOpen] = useState(false);
    const [reviewReportTarget, setReviewReportTarget] = useState(null);

    // Listing report dialog state
    const [listingReportOpen, setListingReportOpen] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);

    // Mark as sold confirmation
    const [markSoldConfirmOpen, setMarkSoldConfirmOpen] = useState(false);

    // Relist confirmation
    const [relistConfirmOpen, setRelistConfirmOpen] = useState(false);

    // Account switch dialog — shown when non-personal account taps Repost
    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);

    const isNonPersonalAccount = isBusinessAccount || isArtistAccount;

    // Optimistic repost state (mirrors ListingCard pattern)
    const [acctGen, setAcctGen] = useState(0);
    const acctGenRef = useRef(0);
    const prevAcctKeyRef2 = useRef(accountCacheKey);
    const [optRepost, setOptRepost] = useState(null);
    const [optRepostDelta, setOptRepostDelta] = useState(0);

    useEffect(() => {
        if (prevAcctKeyRef2.current !== accountCacheKey) {
            prevAcctKeyRef2.current = accountCacheKey;
            const next = acctGenRef.current + 1;
            acctGenRef.current = next;
            setAcctGen(next);
            setOptRepost(null); setOptRepostDelta(0);
        }
    }, [accountCacheKey]);

    const localReposted = item ? ((optRepost !== null && optRepost.gen === acctGen) ? optRepost.value : Boolean(item?.isReposted)) : false;
    const localRepostCount = item ? Math.max(0, (Number(item?.repostsCount) || 0) + optRepostDelta) : 0;

    const prevRepostCountRef = useRef(null);
    useEffect(() => {
        if (prevRepostCountRef.current !== item?.repostsCount) {
            prevRepostCountRef.current = item?.repostsCount;
            setOptRepostDelta(0); setOptRepost(null);
        }
    }, [item?.repostsCount]);

    useEffect(() => {
        setActivePhoto(0);
        setQuickMsgOpen(false); setQuickMsgBody(""); setQuickMsgError(""); setQuickMsgSuccess(false); setQuickMsgSent(false);
        setReviews([]); setReviewStats({ avgRating: null, totalCount: 0 }); setUserReview(null);
        setWriteReviewOpen(false);
        setDetailTab(initialTab ?? 0); setMenuAnchor(null); setLightboxOpen(false); setLightboxIndex(0);
        setReviewReportOpen(false); setReviewReportTarget(null); setMarkSoldConfirmOpen(false); setRelistConfirmOpen(false); setListingReportOpen(false);
        setAccountSwitchOpen(false); setOptRepost(null); setOptRepostDelta(0);
        setSellerPopoverAnchor(null);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [listingId]);

    // Re-fetch when account changes so backend isOwner is recalculated
    const prevAccountKeyRef = useRef(accountCacheKey);
    useEffect(() => {
        if (prevAccountKeyRef.current !== accountCacheKey) {
            prevAccountKeyRef.current = accountCacheKey;
            refresh();
        }
    }, [accountCacheKey, refresh]);

    // Re-fetch detail when listing is updated (e.g. after edit in parent)
    useEffect(() => {
        const onListingUpdated = () => { refresh(); };
        window.addEventListener('ll:marketplace:listing:updated', onListingUpdated);
        return () => window.removeEventListener('ll:marketplace:listing:updated', onListingUpdated);
    }, [refresh]);

    const sellerIdForReviews = item?.sellerId || item?.seller?.id || item?.userId || null;

    const loadSellerReviews = useCallback(async () => {
        if (!sellerIdForReviews) return;
        try {
            const data = await getSellerReviews(sellerIdForReviews, { limit: 50 });
            setReviewStats({ avgRating: data?.avgRating ?? null, totalCount: data?.totalCount ?? 0 });
            if (data?.sellerStats) setSellerStats(data.sellerStats);
            const items = Array.isArray(data?.reviews) ? data.reviews : [];
            setReviews(items);
            if (viewerId > 0) {
                const own = items.find((r) => Number(r.reviewer_id || r.reviewerId) === viewerId);
                setUserReview(own || null);
            } else {
                setUserReview(null);
            }
        } catch {
            setReviews([]);
            setReviewStats({ avgRating: null, totalCount: 0 });
            setUserReview(null);
        }
    }, [sellerIdForReviews, viewerId]);

    const sellerIdKey = String(sellerIdForReviews || "");

    useEffect(() => {
        loadSellerReviews();
    }, [sellerIdKey, loadSellerReviews]);

    // Scroll to highlighted review once reviews are loaded and Seller Info tab is active
    useEffect(() => {
        if (!highlightReviewId || reviews.length === 0 || detailTab !== 1) return;
        const timer = setTimeout(() => {
            const el = document.querySelector(`[data-seller-review-id="${highlightReviewId}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        return () => clearTimeout(timer);
    }, [highlightReviewId, reviews.length, detailTab]);

    // Broadcast review stats changes so ListingCard can update its seller rating display
    const prevReviewStatsRef = useRef(reviewStats);
    useEffect(() => {
        const prev = prevReviewStatsRef.current;
        prevReviewStatsRef.current = reviewStats;
        // Only dispatch after an actual change (skip the initial load → first set)
        if (
            sellerIdForReviews &&
            prev !== reviewStats &&
            (prev.avgRating !== reviewStats.avgRating || prev.totalCount !== reviewStats.totalCount)
        ) {
            window.dispatchEvent(new CustomEvent("ll:marketplace:seller:reviewsChanged", {
                detail: {
                    sellerId: sellerIdForReviews,
                    avgRating: reviewStats.avgRating,
                    totalCount: reviewStats.totalCount,
                },
            }));
        }
    }, [reviewStats, sellerIdForReviews]);

    const handleMenuOpen = useCallback((e) => { setMenuAnchor(e.currentTarget); }, []);
    const handleMenuClose = useCallback(() => { setMenuAnchor(null); }, []);
    const handleCopyLink = useCallback(() => {
        handleMenuClose();
        const url = `${window.location.origin}/marketplace/${item?.id || ""}`;
        navigator.clipboard?.writeText(url).then(() => setCopyToast(true)).catch(() => setCopyToast(true));
    }, [item?.id]);

    const handleOpenWriteReview = () => {
        if (!viewerId) { auth?.requireAuth?.(); return; }
        setWriteReviewOpen(true);
    };

    const handleReviewSaved = () => {
        loadSellerReviews();
    };

    const handleOpenReviewReport = (reviewId) => {
        if (!viewerId) { auth?.requireAuth?.(); return; }
        setReviewReportTarget(reviewId);
        setReviewReportOpen(true);
    };

    const submitReviewReport = async ({ reason, details }) => {
        if (!reviewReportTarget) return;
        try {
            await reportReview(reviewReportTarget, { reason, details });
        } catch {
            // ReportDialog handles its own success state
        }
    };

    // Seller UserCardPopover state (hero header + seller info tab) — must be before early returns
    const [sellerPopoverAnchor, setSellerPopoverAnchor] = useState(null);
    const handleSellerClick = useCallback((e) => {
        e.stopPropagation();
        setSellerPopoverAnchor(e.currentTarget);
    }, []);
    const handleSellerPopoverClose = useCallback(() => setSellerPopoverAnchor(null), []);

    if (!listingId) return <EmptyState onClearSelection={onClearSelection} />;
    if (isLoading) return <LoadingSkeleton />;
    if (error) return (
        <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography color="error" variant="body2" sx={{ fontWeight: 700 }}>Could not load listing.</Typography>
            <Button variant="text" size="small" onClick={refresh} sx={{ mt: 1, textTransform: "none" }}>Retry</Button>
        </Box>
    );
    if (!item) return <EmptyState onClearSelection={onClearSelection} />;

    const isSold = item.status === "sold";
    const photos = getPhotoList(item);
    const mainImage = photos.length > 0 ? photos[activePhoto] || photos[0] : getImageSrc(item);
    const priceLabel = formatPrice(item.priceCents, item.priceModel);
    const contextLabel = pricingContextLabel(item.priceModel);
    const locationLabel = formatLocation(item);
    const sellerName = item.seller?.name || item.sellerName || "User";
    const rawSellerAvatar = item.seller?.avatarUrl || item.sellerAvatarUrl || "";
    const sellerAvatar = isDefaultAvatar(rawSellerAvatar) ? "" : rawSellerAvatar;
    const sellerHandle = item.seller?.handle || item.sellerHandle || "";
    const postedLabel = timeAgo(item.createdAt);
    const CatIcon = CATEGORY_ICONS[item.category] || CategoryRoundedIcon;
    const isFav = Boolean(item.isFavorited);

    const sellerIdVal = item?.sellerId || item?.seller?.id || item?.userId || null;
    const isSelf = Boolean(viewerId && sellerIdVal && viewerId === Number(sellerIdVal));

    /* ── Quick Message Dialog handlers ── */
    const openQuickMsg = () => {
        if (!viewer) { onRequireAuth?.(); return; }
        const recipientId = Number(item?.userId || item?.user_id || item?.seller?.id || item?.sellerId || 0);
        if (recipientId && _isSellerLimited(recipientId)) {
            setQuickMsgLimitOpen(true);
            return;
        }
        setQuickMsgBody("");
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
        if ((!quickMsgBody.trim() && quickMsgPhotos.length === 0) || !item || quickMsgCooldown > 0) return;
        setQuickMsgSending(true);
        setQuickMsgError("");
        try {
            const recipientId = Number(item.userId || item.user_id || item.seller?.id || item.sellerId || 0);
            if (!recipientId) throw new Error("Could not determine seller.");

            // Upload photos
            const photoPayload = [];
            for (const p of quickMsgPhotos) {
                if (p.file) {
                    try {
                        const ct = p.file.type || "image/jpeg";
                        const sn = `${Date.now()}_msg_${p.file.name || "photo.jpg"}`;
                        const s = await getSignedUploadUrl({ folder: "marketplace/messages", fileName: sn, contentType: ct });
                        if (s?.uploadUrl) { await uploadToSignedUrl({ uploadUrl: s.uploadUrl, file: p.file, contentType: ct }); photoPayload.push({ url: String(s.publicUrl || "").trim(), objectPath: String(s.objectPath || "").trim() }); }
                    } catch { /* skip */ }
                }
            }

            await axios.post("/api/messages/send", {
                recipient_type: "personal",
                recipient_id: recipientId,
                body: quickMsgBody.trim(),
                photos: photoPayload,
                listing_id: Number(item.id) || undefined,
            }, { withCredentials: true, headers: { ...getAccountHeaders() } });

            _trackSellerMsg(recipientId);
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

    return (
        <Box ref={scrollRef} sx={{ height: "100%", overflowY: "auto" }}>
            {photos.length > 0 && <PhotoLightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} photos={photos} activeIndex={lightboxIndex} onChangeIndex={setLightboxIndex} />}

            {/* ═══════════ PHOTO GALLERY ═══════════ */}
            {photos.length > 0 && (
                <Box sx={{ position: "relative", mx: { xs: 0, sm: 1.5 }, mt: { xs: 0, sm: 1.5 } }}>
                    <Box onClick={() => { setLightboxIndex(activePhoto); setLightboxOpen(true); }}
                         sx={{ position: "relative", cursor: "pointer", borderRadius: { xs: 0, sm: 2.5 }, overflow: "hidden", bgcolor: "background.default", "&:hover .zoom-hint": { opacity: 1 } }}>
                        <Box component="img" alt={item.title} src={mainImage}
                             sx={{ width: "100%", height: { xs: 220, md: 280 }, objectFit: "contain", display: "block", filter: isSold ? "grayscale(0.25)" : "none" }} />
                        <Box className="zoom-hint" sx={{ position: "absolute", inset: 0, bgcolor: (t) => alpha(t.palette.text.primary, 0.06), display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: (t) => `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}`, pointerEvents: "none" }}>
                            <Box sx={{ px: 1.5, py: 0.5, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 0.4 }}>
                                <ZoomInRoundedIcon sx={{ fontSize: 16, color: "common.white" }} />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white" }}>View full size</Typography>
                            </Box>
                        </Box>
                        {isSold && (
                            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.3), pointerEvents: "none" }}>
                                <Chip label="SOLD" size="small" sx={{ fontWeight: 950, fontSize: 14, height: 30, bgcolor: (t) => alpha(t.palette.background.paper, 0.95), color: "error.main", letterSpacing: "0.05em" }} />
                            </Box>
                        )}
                        {photos.length > 1 && (
                            <Box sx={{ position: "absolute", bottom: 8, right: 8, px: 1, py: 0.3, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(4px)" }}>
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white" }}>{activePhoto + 1} / {photos.length}</Typography>
                            </Box>
                        )}
                    </Box>
                    {photos.length > 1 && (
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1, overflowX: "auto", pb: 0.5 }}>
                            {photos.map((url, idx) => (
                                <Box key={url} onClick={() => setActivePhoto(idx)}
                                     sx={(t) => ({ width: 56, height: 56, borderRadius: 1.5, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "2.5px solid", borderColor: idx === activePhoto ? t.palette.primary.main : alpha(t.palette.text.primary, 0.08), opacity: idx === activePhoto ? 1 : 0.65, transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { opacity: 1, transform: "scale(1.05)" } })}>
                                    <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                </Box>
                            ))}
                        </Stack>
                    )}
                </Box>
            )}

            {/* ═══════════ HERO SECTION ═══════════ */}
            <Box sx={(t) => ({ mx: { xs: 0, sm: 1.5 }, mt: { xs: 0, sm: 1.5 }, borderRadius: { xs: 0, sm: 2.5 }, background: `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 45%, transparent 100%)`, border: { xs: "none", sm: "1px solid" }, borderBottom: { xs: "1px solid", sm: "1px solid" }, borderColor: alpha(t.palette.primary.main, 0.08), overflow: "hidden" })}>
                {/* Accent bar */}
                <Box sx={{ height: 3, bgcolor: isSold ? "error.main" : "primary.main" }} />

                <Box sx={{ px: { xs: 1.5, sm: 1.75 }, pt: { xs: 1.5, sm: 1.75 }, pb: 1.5 }}>
                    {/* Seller row + menu */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                        <Box
                            onClick={handleSellerClick}
                            sx={{
                                display: "inline-flex", alignItems: "center", gap: 1, minWidth: 0, flex: "0 1 auto",
                                cursor: "pointer", borderRadius: 2, p: 0.5, m: -0.5,
                                transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04), "& .ll-panel-seller-name": { textDecoration: "underline" } },
                            }}
                        >
                            <Avatar src={sellerAvatar || undefined} sx={(t) => ({ width: 36, height: 36, border: `2px solid ${alpha(t.palette.text.primary, 0.08)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}><PersonRoundedIcon sx={{ fontSize: 20 }} /></Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography className="ll-panel-seller-name" sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{sellerName}</Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                    <AccessTimeRoundedIcon sx={{ fontSize: 10, color: "text.disabled" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10.5 }}>{postedLabel}</Typography>
                                </Stack>
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1 }} />
                        <IconButton size="small" onClick={handleMenuOpen} sx={(t) => ({ width: 30, height: 30, flexShrink: 0, bgcolor: alpha(t.palette.text.primary, 0.04), "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.08) } })}>
                            <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>

                    {/* Title */}
                    <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.2, overflowWrap: "anywhere", wordBreak: "break-word", mb: 0.5 }}>
                        {item.title || "Untitled"}
                    </Typography>

                    {/* Price */}
                    {item.category !== "Yard Sales" && (
                        <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ mb: 1 }}>
                            {contextLabel && <Typography sx={{ fontSize: 10, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em" }}>{contextLabel}:</Typography>}
                            <Typography sx={(t) => ({ fontWeight: 950, fontSize: 20, color: isSold ? "text.disabled" : t.palette.success.dark, textDecoration: isSold ? "line-through" : "none" })}>{priceLabel}</Typography>
                            {isSold && <Chip label="Sold" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 900, bgcolor: "error.main", color: "common.white" }} />}
                        </Stack>
                    )}
                    {item.category === "Yard Sales" && isSold && (
                        <Box sx={{ mb: 1 }}>
                            <Chip label="Sold" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 900, bgcolor: "error.main", color: "common.white" }} />
                        </Box>
                    )}
                </Box>

                {/* Action bar */}
                <Box sx={(t) => ({ px: 1.5, py: 0.75, borderTop: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), display: "flex", alignItems: "center", gap: 0.25 })}>
                    <Tooltip title={isFav ? "Unsave" : "Save"}>
                        <Box onClick={() => onFavorite?.(item)}
                             sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999, cursor: "pointer", userSelect: "none", transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }, "&:active": { transform: "scale(0.97)" } }}>
                            {isFav ? <BookmarkRoundedIcon sx={{ fontSize: 22, color: "secondary.main" }} /> : <BookmarkBorderRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />}
                            {(item.favoritesCount || 0) > 0 && <Typography sx={{ fontSize: 13, fontWeight: 700, color: isFav ? "secondary.main" : "text.secondary", lineHeight: 1 }}>{item.favoritesCount}</Typography>}
                        </Box>
                    </Tooltip>
                    <Tooltip title={localReposted ? "Undo repost" : isNonPersonalAccount ? "Switch to personal account to repost" : "Repost"}>
                        <Box onClick={() => {
                            if (isSold) return;
                            if (isNonPersonalAccount) { setAccountSwitchOpen(true); return; }
                            const next = !localReposted;
                            setOptRepost({ gen: acctGenRef.current, value: next });
                            setOptRepostDelta((prev) => prev + (next ? 1 : -1));
                            onRepost?.(item);
                        }}
                             sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999, cursor: isSold ? "default" : "pointer", opacity: isSold ? 0.5 : 1, userSelect: "none", transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": !isSold ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } : {}, "&:active": !isSold ? { transform: "scale(0.97)" } : {} }}>
                            <RepeatRoundedIcon sx={{ fontSize: 22, color: localReposted ? "secondary.main" : "text.secondary" }} />
                            {localRepostCount > 0 && <Typography sx={{ fontSize: 13, fontWeight: 700, color: localReposted ? "secondary.main" : "text.secondary", lineHeight: 1 }}>{fmtCount(localRepostCount)}</Typography>}
                        </Box>
                    </Tooltip>
                    <Box sx={{ flex: 1 }} />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <VisibilityRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{item.viewsCount || 0}</Typography>
                    </Stack>
                </Box>

            </Box>

            {/* ─── Full-width action buttons ─── */}
            <Divider sx={{ mt: isMobile ? 0.5 : 1.5 }} />
            {!isOwner && !isSold && (
                <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isMobile ? 0.75 : 1.5, pb: isMobile ? 0.75 : 1 }}>
                    <Button variant="contained" fullWidth startIcon={<SendRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            onClick={openQuickMsg}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.8rem" : "0.85rem", py: isMobile ? 0.85 : 1, minHeight: isMobile ? 36 : "auto" }}>
                        Message
                    </Button>
                    {!isMobile && (
                        <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                        const scrollEl = document.querySelector("[data-marketplace-scroll]");
                                        sessionStorage.setItem("ll:marketplace:scrollTop", String(scrollEl?.scrollTop || 0));
                                        sessionStorage.setItem("ll:marketplace:selectedListingId", String(item?.id || listingId || ""));
                                    } catch { /* ignore */ }
                                    navigate(`/marketplace/${item?.id || listingId}`, { state: { from: "marketplace" } });
                                }}
                                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                            View Full Page
                        </Button>
                    )}
                    <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            onClick={() => setShareOpen(true)}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.8rem" : "0.85rem", py: isMobile ? 0.85 : 1, minHeight: isMobile ? 36 : "auto", borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                        Share
                    </Button>
                </Stack>
            )}

            {isOwner && !isSold && (
                <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isMobile ? 0.75 : 1.5, pb: isMobile ? 0.75 : 1 }}>
                    <Button variant="outlined" fullWidth startIcon={<EditRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => onEdit?.(item)}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.8rem" : "0.85rem", py: isMobile ? 0.85 : 1, minHeight: isMobile ? 36 : "auto", borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>Edit</Button>
                    <Button variant="contained" fullWidth color="success" startIcon={<SellRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => setMarkSoldConfirmOpen(true)}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.8rem" : "0.85rem", py: isMobile ? 0.85 : 1, minHeight: isMobile ? 36 : "auto" }}>Mark Sold</Button>
                    {!isMobile && (
                        <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                        const scrollEl = document.querySelector("[data-marketplace-scroll]");
                                        sessionStorage.setItem("ll:marketplace:scrollTop", String(scrollEl?.scrollTop || 0));
                                        sessionStorage.setItem("ll:marketplace:selectedListingId", String(item?.id || listingId || ""));
                                    } catch { /* ignore */ }
                                    navigate(`/marketplace/${item?.id || listingId}`, { state: { from: "marketplace" } });
                                }}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                            View Full Page
                        </Button>
                    )}
                </Stack>
            )}

            {isOwner && isSold && (
                <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isMobile ? 0.75 : 1.5, pb: isMobile ? 0.75 : 1 }}>
                    <Button variant="outlined" fullWidth startIcon={<ReplayRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => setRelistConfirmOpen(true)}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.8rem" : "0.85rem", py: isMobile ? 0.85 : 1, minHeight: isMobile ? 36 : "auto", borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>Relist This Item</Button>
                    {!isMobile && (
                        <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                        const scrollEl = document.querySelector("[data-marketplace-scroll]");
                                        sessionStorage.setItem("ll:marketplace:scrollTop", String(scrollEl?.scrollTop || 0));
                                        sessionStorage.setItem("ll:marketplace:selectedListingId", String(item?.id || listingId || ""));
                                    } catch { /* ignore */ }
                                    navigate(`/marketplace/${item?.id || listingId}`, { state: { from: "marketplace" } });
                                }}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                            View Full Page
                        </Button>
                    )}
                </Stack>
            )}

            {!isOwner && isSold && (
                <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isMobile ? 0.75 : 1.5, pb: isMobile ? 0.75 : 1 }}>
                    {!isMobile && (
                        <Button variant="outlined" fullWidth startIcon={<OpenInNewRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                        const scrollEl = document.querySelector("[data-marketplace-scroll]");
                                        sessionStorage.setItem("ll:marketplace:scrollTop", String(scrollEl?.scrollTop || 0));
                                        sessionStorage.setItem("ll:marketplace:selectedListingId", String(item?.id || listingId || ""));
                                    } catch { /* ignore */ }
                                    navigate(`/marketplace/${item?.id || listingId}`, { state: { from: "marketplace" } });
                                }}
                                sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: "0.85rem", py: 1, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                            View Full Page
                        </Button>
                    )}
                    <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            onClick={() => setShareOpen(true)}
                            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isMobile ? "0.8rem" : "0.85rem", py: isMobile ? 0.85 : 1, minHeight: isMobile ? 36 : "auto", borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                        Share
                    </Button>
                </Stack>
            )}

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
                <Tabs
                    value={detailTab}
                    onChange={(_e, v) => setDetailTab(v)}
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
                    <Tab label="Details" value={0} />
                    <Tab label="Seller Info" value={1} />
                </Tabs>
            </Box>

            {/* ═══════════ TAB: Details ═══════════ */}
            {detailTab === 0 && (
                <Box sx={{ px: { xs: 1.25, sm: 1.5 }, pt: 1.5, pb: 2 }}>
                    {/* Detail cards */}
                    <Box sx={{ mb: 1.5 }}>
                        <SectionLabel>Item Details</SectionLabel>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" }, gap: { xs: 0.5, sm: 0.75 } }}>
                            {item.category && <DetailCard icon={<CatIcon sx={{ fontSize: 18 }} />} label="Category" value={item.category} />}
                            {item.condition && <DetailCard icon={<StorefrontRoundedIcon sx={{ fontSize: 18 }} />} label="Condition" value={item.condition} />}
                            {locationLabel && <DetailCard icon={<LocationOnRoundedIcon sx={{ fontSize: 18 }} />} label="Location" value={locationLabel} />}
                            {item.category !== "Yard Sales" && priceLabel && <DetailCard icon={<LocalOfferRoundedIcon sx={{ fontSize: 18 }} />} label="Price" value={priceLabel} highlight />}
                        </Box>
                    </Box>

                    {/* Yard Sale: date, time, address, map */}
                    {item.category === "Yard Sales" && (() => {
                        const ysDateLabel = formatYardSaleDateLabel(item.yardSaleDate);
                        const ysTimeLabel = formatYardSaleTimeLabel(item.yardSaleHours);
                        const ysAddress = item.yardSaleAddress || "";
                        const ysPast = isYardSalePast(item.yardSaleDate);
                        const ysLat = item.latitude != null ? Number(item.latitude) : null;
                        const ysLng = item.longitude != null ? Number(item.longitude) : null;
                        const hasPin = ysLat != null && ysLng != null && Number.isFinite(ysLat) && Number.isFinite(ysLng);
                        const hasStreetAddress = Boolean(ysAddress);
                        const locationQuery = [ysAddress, item.city, item.county ? `${item.county} County` : "", "Alabama"].filter(Boolean).join(", ");
                        const directionsQuery = hasStreetAddress ? locationQuery : [item.city, item.county ? `${item.county} County` : "", "Alabama"].filter(Boolean).join(", ");

                        return (ysDateLabel || ysTimeLabel || ysAddress) ? (
                            <Box sx={{ mb: 1.5 }}>
                                <SectionLabel>Yard Sale Details</SectionLabel>
                                <Box sx={(t) => ({
                                    p: 1.5, borderRadius: 2, border: "1px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.08),
                                    bgcolor: alpha(t.palette.primary.main, 0.02),
                                })}>
                                    <Stack spacing={1.75}>
                                        {/* Date */}
                                        {ysDateLabel && (
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Box sx={(t) => ({ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(ysPast ? t.palette.text.disabled : t.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
                                                    <CalendarTodayRoundedIcon sx={{ color: ysPast ? "text.disabled" : "primary.main", fontSize: 18 }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 13, color: ysPast ? "text.disabled" : "text.primary" }}>{ysDateLabel}</Typography>
                                                    {ysTimeLabel && (
                                                        <Typography sx={{ fontSize: 12, color: ysPast ? "text.disabled" : "text.secondary", fontWeight: 600 }}>{ysTimeLabel}</Typography>
                                                    )}
                                                </Box>
                                                {ysPast && (
                                                    <Typography sx={(t) => ({ fontSize: 10, fontWeight: 800, color: t.palette.error.main, textTransform: "uppercase", letterSpacing: "0.03em", ml: "auto !important" })}>
                                                        Ended
                                                    </Typography>
                                                )}
                                            </Stack>
                                        )}

                                        {/* Address */}
                                        {ysAddress && (
                                            <>
                                                {ysDateLabel && <Divider sx={{ borderStyle: "dashed", opacity: 0.5 }} />}
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box sx={(t) => ({ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
                                                        <LocationOnRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.15 }}>
                                                        <Typography sx={{ fontWeight: 800, fontSize: 13, color: "text.primary" }}>{ysAddress}</Typography>
                                                        <Typography sx={{ fontSize: 12, color: "primary.main", fontWeight: 700 }}>{locationLabel}</Typography>
                                                    </Box>
                                                </Stack>
                                            </>
                                        )}
                                    </Stack>
                                </Box>

                                {/* Google Maps embed */}
                                {hasPin && (() => {
                                    const mapSrc = hasStreetAddress
                                        ? `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${encodeURIComponent(locationQuery)}&zoom=14`
                                        : `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${ysLat},${ysLng}&zoom=11`;
                                    return (
                                        <Box
                                            sx={{ mt: 1, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider", position: "relative", cursor: "pointer" }}
                                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`, "_blank")}
                                        >
                                            <Box
                                                component="iframe"
                                                src={mapSrc}
                                                sx={{ width: "100%", height: 160, border: 0, display: "block", pointerEvents: "none" }}
                                                loading="lazy"
                                                allowFullScreen
                                                title="Yard sale location"
                                            />
                                            <Box sx={(t) => ({
                                                position: "absolute", bottom: 8, right: 8,
                                                display: "flex", alignItems: "center", gap: 0.5,
                                                px: 1.25, py: 0.5, borderRadius: 999,
                                                bgcolor: alpha(t.palette.common.white, 0.95),
                                                boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.15)}`,
                                                cursor: "pointer",
                                            })}>
                                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "primary.main" }}>Get Directions</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })()}
                            </Box>
                        ) : null;
                    })()}

                    {/* Description */}
                    <Box sx={{ mb: 1.5 }}>
                        <SectionLabel>Description</SectionLabel>
                        <Box sx={(t) => ({ position: "relative", p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: t.palette.background.paper })}>
                            {item.description ? (
                                <>
                                    <Box sx={{ maxHeight: descExpanded ? "none" : 160, overflowY: descExpanded ? "visible" : "hidden", position: "relative" }}>
                                        <RichTextDisplay html={item.description} sx={{ fontSize: 12.5 }} />
                                    </Box>
                                    {!descExpanded && (item.description || "").length > 300 && (
                                        <Box sx={{
                                            position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
                                            background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                                            pointerEvents: "none", borderRadius: "0 0 8px 8px",
                                        }} />
                                    )}
                                    {(item.description || "").length > 300 && (
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
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: 12.5, color: "text.secondary", fontStyle: "italic" }}>
                                    No description provided.
                                </Typography>
                            )}
                        </Box>
                    </Box>


                </Box>
            )}

            {/* ═══════════ TAB: Seller Info ═══════════ */}
            {detailTab === 1 && (
                <Box sx={{ px: { xs: 1.25, sm: 1.5 }, pt: 1.5, pb: 2 }}>
                    {/* Seller card */}
                    <Box sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: t.palette.background.paper, mb: 1.5 })}>
                        <Box
                            onClick={handleSellerClick}
                            sx={{
                                display: "inline-flex", alignItems: "flex-start", gap: 1.25, width: "auto",
                                cursor: "pointer", borderRadius: 2, p: 0.5, m: -0.5,
                                transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04), "& .ll-panel-seller-tab-name": { textDecoration: "underline" } },
                            }}
                        >
                            <Avatar src={sellerAvatar || undefined} alt={sellerName} sx={(t) => ({ width: 48, height: 48, border: `2px solid ${alpha(t.palette.text.primary, 0.06)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}><PersonRoundedIcon sx={{ fontSize: 26 }} /></Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography className="ll-panel-seller-tab-name" sx={{ fontWeight: 800, fontSize: 14 }}>{sellerName}</Typography>
                                {sellerHandle && <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>@{sellerHandle}</Typography>}
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                                    {reviewStats.avgRating !== null ? (
                                        <>
                                            <Rating value={reviewStats.avgRating} precision={0.1} readOnly size="small" sx={{ "& .MuiRating-icon": { fontSize: 14 } }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{reviewStats.avgRating}</Typography>
                                            <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>({reviewStats.totalCount})</Typography>
                                        </>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>No reviews yet</Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </Box>

                    {/* Seller stats badges */}
                    {(() => {
                        const navToMarketplace = (statusFilter) => {
                            const sellerSearchQuery = sellerHandle ? `@${sellerHandle}` : sellerName;
                            if (onSellerFilter) {
                                onSellerFilter({ query: sellerSearchQuery, status: statusFilter });
                            } else {
                                navigate("/marketplace", {
                                    state: { sellerFilter: { query: sellerSearchQuery, status: statusFilter } },
                                });
                            }
                        };
                        return (
                            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0.75, mb: 1.5 }}>
                                <Box onClick={() => navToMarketplace("all")} sx={(t) => ({ p: 1, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), bgcolor: alpha(t.palette.primary.main, 0.04), textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.1), transform: "translateY(-1px)" } })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: "primary.main", lineHeight: 1.2 }}>{sellerStats.totalListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Total Listings</Typography>
                                </Box>
                                <Box onClick={() => navToMarketplace("sold")} sx={(t) => ({ p: 1, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.success.main, 0.12), bgcolor: alpha(t.palette.success.main, 0.04), textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: alpha(t.palette.success.main, 0.1), transform: "translateY(-1px)" } })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: "success.main", lineHeight: 1.2 }}>{sellerStats.soldListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Sold</Typography>
                                </Box>
                                <Box onClick={() => navToMarketplace("available")} sx={(t) => ({ p: 1, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.info.main, 0.12), bgcolor: alpha(t.palette.info.main, 0.04), textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: alpha(t.palette.info.main, 0.1), transform: "translateY(-1px)" } })}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 16, color: "info.main", lineHeight: 1.2 }}>{sellerStats.activeListings}</Typography>
                                    <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Active</Typography>
                                </Box>
                            </Box>
                        );
                    })()}

                    {/* Reviews header + write button */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <SectionLabel>Seller Reviews {reviewStats.totalCount > 0 ? `(${reviewStats.totalCount})` : ""}</SectionLabel>
                        {!isOwnerAnyAccount && viewerId > 0 && !isNonPersonalAccount && !userReview && (
                            <Button
                                variant="contained"
                                startIcon={<RateReviewRoundedIcon sx={{ fontSize: { xs: 16, md: 14 } }} />}
                                onClick={handleOpenWriteReview}
                                size="small"
                                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, fontSize: { xs: 13, md: 11 }, py: { xs: 0.75, md: 0.5 }, px: { xs: 2, md: 1.5 }, minHeight: 0 }}
                            >
                                Write a Review
                            </Button>
                        )}
                        {!isOwnerAnyAccount && viewerId > 0 && isNonPersonalAccount && (
                            <Tooltip title="Switch to your personal account to review">
                                <span>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                        onClick={handleOpenWriteReview}
                                        size="small"
                                        sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, fontSize: 11, py: 0.5, px: 1.5, minHeight: 0 }}
                                    >
                                        Review
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </Stack>

                    {/* Rating breakdown — matches BusinessDetailPanel */}
                    {reviews.length > 0 && reviewStats.avgRating !== null && (() => {
                        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                        reviews.forEach((r) => { const s = Math.round(Number(r.rating) || 0); if (s >= 1 && s <= 5) ratingCounts[s]++; });
                        const maxCount = Math.max(1, ...Object.values(ratingCounts));
                        return (
                            <Box sx={{ mb: 2 }}>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Box sx={{ textAlign: "center", minWidth: 72 }}>
                                        <Typography sx={{ fontWeight: 900, fontSize: "2rem", lineHeight: 1 }}>{(reviewStats.avgRating || 0).toFixed(1)}</Typography>
                                        <Box sx={{ display: "flex", justifyContent: "center", mt: 0.25 }}>
                                            <Rating value={reviewStats.avgRating || 0} precision={0.5} readOnly size="small" />
                                        </Box>
                                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontWeight: 700, mt: 0.25 }}>
                                            {reviewStats.totalCount} review{reviewStats.totalCount !== 1 ? "s" : ""}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <Stack key={star} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                                                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, width: 10, textAlign: "right" }}>{star}</Typography>
                                                <StarRoundedIcon sx={{ fontSize: 12, color: "warning.main" }} />
                                                <Box sx={(t) => ({ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(t.palette.divider, 0.3), overflow: "hidden" })}>
                                                    <Box sx={{ width: `${(ratingCounts[star] / maxCount) * 100}%`, height: "100%", borderRadius: 4, bgcolor: "warning.main", transition: (t) => `width ${t.custom.motion.slow}ms ${t.custom.motion.ease}` }} />
                                                </Box>
                                                <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: "text.secondary", width: 20, textAlign: "right" }}>{ratingCounts[star]}</Typography>
                                            </Stack>
                                        ))}
                                    </Box>
                                </Stack>
                            </Box>
                        );
                    })()}

                    {/* Review cards */}
                    {reviews.length > 0 ? (
                        <Stack spacing={0} sx={{ mb: 1 }}>
                            {reviews.map((rev, idx) => (
                                <PanelReviewCard
                                    key={rev.id || idx}
                                    rev={rev}
                                    idx={idx}
                                    sellerId={item?.sellerId || item?.seller?.id || item?.userId}
                                    isOwner={isOwner}
                                    viewer={viewer}
                                    viewerId={viewerId}
                                    isHighlighted={Boolean(highlightReviewId && Number(rev.id) === Number(highlightReviewId)) || Boolean(highlightReviewerId && Number(rev.reviewer_id || rev.reviewer?.id) === Number(highlightReviewerId))}
                                    onEditReview={(reviewToEdit) => {
                                        setUserReview(reviewToEdit);
                                        setWriteReviewOpen(true);
                                    }}
                                    onDeleteReview={() => {
                                        loadSellerReviews();
                                    }}
                                    onReportReview={(reviewId) => {
                                        handleOpenReviewReport(reviewId);
                                    }}
                                    onReplyUpdate={(reviewId, sellerReply, sellerReplyAt, rName, rHandle, rAvatar, rPhotos) => {
                                        setReviews((prev) => prev.map((r) =>
                                            r.id === reviewId
                                                ? { ...r, seller_reply: sellerReply, seller_reply_at: sellerReplyAt, reply_by_name: rName, reply_by_handle: rHandle, reply_by_avatar: rAvatar, reply_photo_urls: rPhotos || [] }
                                                : r
                                        ));
                                        // Re-fetch from server to confirm persistence
                                        setTimeout(() => loadSellerReviews(), 600);
                                    }}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Box sx={{ py: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                            <ReviewsRoundedIcon sx={{ fontSize: 44, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "primary.main" }}>
                                {isOwnerAnyAccount ? "No reviews on your seller profile yet" : "No reviews yet"}
                            </Typography>
                            <Typography color="text.secondary" sx={{ fontSize: "0.82rem", textAlign: "center", maxWidth: 280 }}>
                                {isOwnerAnyAccount
                                    ? "When buyers share their experience, their reviews will show up here."
                                    : "Be the first to share your experience with this seller."}
                            </Typography>

                        </Box>
                    )}
                </Box>
            )}

            {/* ═══════════ 3-DOT MENU ═══════════ */}
            <SmartMenu anchorEl={menuAnchor} open={menuOpen} onClose={handleMenuClose}
                       onClick={(e) => e.stopPropagation()} disableScrollLock
                       anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                       PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: (t) => t.custom?.shadows?.lg || `0 8px 24px ${alpha(t.palette.text.primary, 0.12)}`, minWidth: 200, py: 0.5 } }}>
                <MuiMenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MuiMenuItem>
                {isOwnerAnyAccount && <Divider sx={{ my: 0.5 }} />}
                {isOwnerAnyAccount && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to edit" : ""} placement="left" arrow><span>
                        <MuiMenuItem onClick={() => { if (!needsAccountSwitch) { handleMenuClose(); onEdit?.(item); } }} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                            <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Edit" />
                        </MuiMenuItem>
                    </span></Tooltip>
                )}
                {isOwnerAnyAccount && !isSold && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to mark sold" : ""} placement="left" arrow><span>
                        <MuiMenuItem onClick={() => { if (!needsAccountSwitch) { handleMenuClose(); setMarkSoldConfirmOpen(true); } }} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                            <ListItemIcon><SellRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Mark as sold" />
                        </MuiMenuItem>
                    </span></Tooltip>
                )}
                {isOwnerAnyAccount && isSold && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to relist" : ""} placement="left" arrow><span>
                        <MuiMenuItem onClick={() => { if (!needsAccountSwitch) { handleMenuClose(); setRelistConfirmOpen(true); } }} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                            <ListItemIcon><ReplayRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Relist" />
                        </MuiMenuItem>
                    </span></Tooltip>
                )}
                {isOwnerAnyAccount && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to delete" : ""} placement="left" arrow><span>
                        <MuiMenuItem onClick={() => { if (!needsAccountSwitch) { handleMenuClose(); onDelete?.(item); } }} disabled={needsAccountSwitch}
                                     sx={{ py: 1, color: needsAccountSwitch ? "text.disabled" : "error.main" }}>
                            <ListItemIcon sx={{ color: needsAccountSwitch ? "text.disabled" : "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Delete" />
                        </MuiMenuItem>
                    </span></Tooltip>
                )}
                {!isOwnerAnyAccount && <Divider sx={{ my: 0.5 }} />}
                {!isOwnerAnyAccount && (
                    <MuiMenuItem onClick={() => { handleMenuClose(); if (viewerId) { setListingReportOpen(true); } else { auth?.requireAuth?.(); } }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report" />
                    </MuiMenuItem>
                )}
            </SmartMenu>

            {/* ═══════════ QUICK MESSAGE DIALOG ═══════════ */}
            <Dialog
                open={quickMsgOpen}
                onClose={closeQuickMsg}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                disableScrollLock
                PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? "100vh" : "85vh", ...(isMobile && { display: "flex", flexDirection: "column" }) } }}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ pr: 6, ...(isMobile && { borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }) }}>
                    {!quickMsgSuccess && (
                        <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                            Message Seller
                        </Typography>
                    )}
                    <IconButton aria-label="Close" onClick={closeQuickMsg} disabled={quickMsgSending}
                                sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={isMobile ? { flex: 1, overflowY: "auto", pb: 0, display: "flex", flexDirection: "column" } : undefined}>
                    {quickMsgSuccess ? (
                        <Stack spacing={2} alignItems="center" sx={{ py: 2, ...(isMobile && { flex: 1, justifyContent: "center", alignItems: "center" }) }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    The seller will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { setQuickMsgOpen(false); }}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, maxWidth: 320, ...(isMobile && { py: 1.5, fontSize: "1rem" }) }}>Done</Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {/* Locked recipient */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={
                                        <Avatar src={sellerAvatar || undefined} imgProps={{ referrerPolicy: "no-referrer" }} sx={(t) => ({ width: 24, height: 24, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                            <PersonRoundedIcon sx={{ fontSize: 14 }} />
                                        </Avatar>
                                    }
                                    label={sellerName}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            {/* Listing context */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{item?.title || "Listing"}</Typography>
                                <Typography variant="caption" color="text.secondary">{priceLabel}</Typography>
                            </Box>
                            <TextField
                                label="Message"
                                placeholder={item?.priceModel === "negotiable" ? "Describe your offer, questions, timeline..." : "Ask about availability, meetup details, condition..."}
                                multiline
                                minRows={isMobile ? 4 : 5}
                                maxRows={isMobile ? 8 : 10}
                                value={quickMsgBody}
                                onChange={(e) => { setQuickMsgBody(e.target.value.slice(0, 2000)); if (quickMsgError) setQuickMsgError(""); }}
                                inputProps={{ maxLength: 2000 }}
                                fullWidth
                                error={Boolean(quickMsgError)}
                                helperText={quickMsgError || `${quickMsgBody.length} / 2,000`}
                                FormHelperTextProps={{ sx: { textAlign: quickMsgError ? "left" : "right", mr: 0.5, fontWeight: 600, fontSize: "0.75rem" } }}
                                sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }}
                            />
                            {/* Photos */}
                            <PhotosUploadSection photos={quickMsgPhotos} setPhotos={setQuickMsgPhotos} disabled={quickMsgSending}
                                                 maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos to help describe what you need."
                                                 addButtonText="Add photos" />
                        </Stack>
                    )}
                </DialogContent>
                {/* Pinned bottom actions — only show when not in success state */}
                {!quickMsgSuccess && (
                    <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider", p: 2, pb: isMobile ? "calc(env(safe-area-inset-bottom, 0px) + 16px)" : 2, bgcolor: "background.paper" }}>
                        {quickMsgSending && <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />}
                        <Stack direction="row" spacing={1.5} justifyContent={isMobile ? "stretch" : "flex-end"}>
                            <Button variant="outlined" onClick={closeQuickMsg} disabled={quickMsgSending}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(isMobile && { flex: 1, py: 1.4, fontSize: "0.95rem" }) }}>
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleQuickMsgSend} disabled={(!quickMsgBody.trim() && quickMsgPhotos.length === 0) || quickMsgSending || quickMsgCooldown > 0}
                                    startIcon={quickMsgSending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(isMobile && { flex: 2, py: 1.4, fontSize: "0.95rem" }) }}>
                                {quickMsgCooldown > 0 ? `Wait ${quickMsgCooldown}s` : quickMsgSending ? "Sending\u2026" : "Send Message"}
                            </Button>
                        </Stack>
                    </Box>
                )}
            </Dialog>

            <SuccessSnackbar open={copyToast} onClose={() => setCopyToast(false)} message="Link copied to clipboard" />

            <ShareListingDialog open={shareOpen} onClose={() => setShareOpen(false)} listing={item} viewer={viewer} sx={{ zIndex: 100001 }} />

            {/* Rate limit reached dialog */}
            <Dialog open={quickMsgLimitOpen} onClose={() => setQuickMsgLimitOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                    sx={{ zIndex: 100001 }}>
                <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
                    <AccessTimeRoundedIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1 }}>Slow down a bit!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        You've sent several messages to this seller recently. Give them a chance to respond before sending more.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "center" }}>
                    <Button variant="contained" onClick={() => setQuickMsgLimitOpen(false)}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, px: 4 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Account switch dialog — shown when non-personal account taps Repost */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                    sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800 }}>
                    <InfoOutlinedIcon color="primary" />
                    Personal account required
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ lineHeight: 1.5 }}>
                        This action is only available from a personal account. Please switch to your personal profile to continue.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setAccountSwitchOpen(false)} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}>
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══════════ WRITE SELLER REVIEW DIALOG ═══════════ */}
            <WriteSellerReviewDialog
                open={writeReviewOpen}
                onClose={() => setWriteReviewOpen(false)}
                sellerId={item?.sellerId || item?.seller?.id}
                sellerName={sellerName}
                listingId={item?.id}
                existingReview={userReview}
                onSaved={handleReviewSaved}
                isOwnListing={isOwnerAnyAccount}
                isNonPersonalAccount={isNonPersonalAccount}
            />

            {/* ═══════════ REPORT REVIEW DIALOG ═══════════ */}
            <ReportDialog
                open={reviewReportOpen}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setReviewReportOpen(false); setReviewReportTarget(null); }}
                onSubmit={submitReviewReport}
                title="Report Review"
                sx={{ zIndex: 100001 }}
            />

            {/* ═══════════ REPORT LISTING DIALOG ═══════════ */}
            <ReportDialog
                open={listingReportOpen}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setListingReportOpen(false); }}
                onSubmit={async ({ reason, details }) => {
                    try {
                        await axios.post(`/api/marketplace/listings/${item?.id}/report`, { reason, details }, { withCredentials: true, headers: { ...getAccountHeaders() } });
                    } catch { /* dialog handles success state */ }
                }}
                title="Report Listing"
                sx={{ zIndex: 100001 }}
            />

            {/* ═══════════ MARK AS SOLD CONFIRMATION ═══════════ */}
            <Dialog
                open={markSoldConfirmOpen}
                onClose={() => setMarkSoldConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
                sx={{ zIndex: 100001 }}
            >
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <Box sx={(t) => ({ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(t.palette.success.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 })}>
                        <SellRoundedIcon sx={{ fontSize: 28, color: "success.main" }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>Mark as Sold?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: "auto" }}>
                        This will mark your listing as sold. Buyers will no longer be able to message you about it. You can relist it later if needed.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            onClick={() => setMarkSoldConfirmOpen(false)}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={async () => { setMarkSoldConfirmOpen(false); await onMarkSold?.(item); refresh(); }}
                            startIcon={<SellRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            Mark as Sold
                        </Button>
                    </Stack>
                </Box>
                <IconButton
                    onClick={() => setMarkSoldConfirmOpen(false)}
                    aria-label="Close"
                    sx={{ position: "absolute", top: 8, right: 8 }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Dialog>

            {/* ═══════════ RELIST CONFIRMATION ═══════════ */}
            <Dialog
                open={relistConfirmOpen}
                onClose={() => setRelistConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
                sx={{ zIndex: 100001 }}
            >
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <Box sx={(t) => ({ width: 56, height: 56, borderRadius: "50%", bgcolor: alpha(t.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 })}>
                        <ReplayRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.75 }}>Relist This Item?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: "auto" }}>
                        This will mark your listing as active again. Buyers will be able to see and message you about it.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            onClick={() => setRelistConfirmOpen(false)}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={async () => { setRelistConfirmOpen(false); await onRelist?.(item); refresh(); }}
                            startIcon={<ReplayRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            Relist Item
                        </Button>
                    </Stack>
                </Box>
                <IconButton
                    onClick={() => setRelistConfirmOpen(false)}
                    aria-label="Close"
                    sx={{ position: "absolute", top: 8, right: 8 }}
                >
                    <CloseRoundedIcon fontSize="small" />
                </IconButton>
            </Dialog>

            {/* Seller UserCardPopover (hero header + seller info tab) */}
            <UserCardPopover
                anchorEl={sellerPopoverAnchor}
                onClose={handleSellerPopoverClose}
                user={sellerIdVal ? {
                    id: sellerIdVal,
                    handle: sellerHandle,
                    firstName: item?.seller?.firstName || sellerName?.split(" ")[0] || "",
                    lastName: item?.seller?.lastName || sellerName?.split(" ").slice(1).join(" ") || "",
                    profile_picture: sellerAvatar,
                    avatar_url: sellerAvatar,
                } : null}
                isSelf={isSelf}
                following={false}
                onViewProfile={(u) => { const h = u?.handle || sellerHandle || sellerIdVal; if (h) window.location.assign(`/${h}`); }}
            />
        </Box>
    );
}

MarketplaceListingDetailPanel.propTypes = {
    listingId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onClearSelection: PropTypes.func,
    user: PropTypes.object,
    onRequireAuth: PropTypes.func,
    onFavorite: PropTypes.func,
    onRepost: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onMarkSold: PropTypes.func,
    onRelist: PropTypes.func,
    onFlag: PropTypes.func,
    onUpdated: PropTypes.func,
    onSellerFilter: PropTypes.func,
};

MarketplaceListingDetailPanel.defaultProps = {
    listingId: null, onClearSelection: undefined, user: null, onRequireAuth: undefined,
    onFavorite: undefined, onRepost: undefined, onEdit: undefined, onDelete: undefined,
    onMarkSold: undefined, onRelist: undefined, onFlag: undefined, onUpdated: undefined,
    onSellerFilter: undefined,
};