// src/pages/marketplace/pages/ListingDetail.jsx
//
// Full-page listing detail — professional styling matching JobDetail.
// Preserves all business logic: optimistic fav/repost, account-aware ownership,
// mark sold, delete, edit modal, 3-dot menu, copy link.
//
// SELLER REVIEWS: Now matches BusinessPublicPage review format —
// StarRating, RatingBreakdownCompact, full ReviewCard, WriteReviewDialog.
// Requires personal account login before leaving a review.
//
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Rating,
    Select,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StarIcon from "@mui/icons-material/Star";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import useListingDetail from "../hooks/useListingDetail";
import { deleteListing, markListingSold, toggleFavorite, toggleRepost, getSellerReviews, submitSellerReview, deleteReview, replyToSellerReview, deleteSellerReviewReply, reportReview } from "../api/marketplace";
import CreateListingModal from "../modals/CreateListingModal";
import DeleteListingConfirmDialog from "../components/DeleteListingConfirmDialog";
import ShareListingDialog from "../../../components/ShareListingDialog";
import { ReportDialog } from "../../../components/ActionBar";
import { useAuth } from "../../../components/AuthModalContext";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../../components/Header/Header";
import BlockedPostGate, { useBlockedPostGate } from "../../../components/BlockedPostGate";
import { useActiveAccount } from "../../../components/AccountContext";
import UserCardPopover from "../../../components/UserCardPopover";
import NetworkErrorState, { isNetworkError } from "../../../components/NetworkErrorState";
import SuccessSnackbar, { useSuccessSnackbar } from "../../../components/SuccessSnackbar";
import SmartMenu from "../../../components/SmartMenu";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import DOMPurify from "dompurify";
import PhotosUploadSection from "../../../components/PhotosUploadSection";

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
import useChromeTop from "../../../hooks/useChromeTop";

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

const FALLBACK_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-family='Arial' font-size='34'%3ENo photo%3C/text%3E%3C/svg%3E";

const MARKETPLACE_REFRESH_FLAG = "ll_marketplace_refresh";

/* ─── @mention rendering helper ─────────────────────────────────── */

const MENTION_RENDER_RE = /@([a-zA-Z0-9_]{1,30})/g;

function renderTextWithMentions(text, navigate) {
    if (!text) return null;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = MENTION_RENDER_RE.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const handle = match[1];
        parts.push(
            <Box
                key={`mention-${match.index}`}
                component="span"
                onClick={(e) => {
                    e.stopPropagation();
                    if (navigate) navigate(`/profile/${handle}`);
                }}
                sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                }}
            >
                @{handle}
            </Box>
        );
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
}

/* ────────────────────────────────────────────────────────────────── */

const fmtCount = (n = 0) => {
    const x = Number(n) || 0;
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(x % 1_000_000 ? 1 : 0).replace(/\.0$/, "")}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(x % 1_000 ? 1 : 0).replace(/\.0$/, "")}k`;
    return String(x);
};

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
    return "";
}

function formatLocation(listing) {
    if (listing?.isStatewide) return "Statewide";
    const parts = [];
    if (listing?.city) parts.push(listing.city);
    if (listing?.county) parts.push(`${listing.county} County`);
    return parts.length ? parts.join(", ") : "No location";
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

function signalMarketplaceRefresh() {
    try { sessionStorage.setItem(MARKETPLACE_REFRESH_FLAG, "1"); } catch { /* */ }
}

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

/* ═══════════════════════════════════════════════════════════════════
   REVIEW HELPER COMPONENTS — matches BusinessPublicPage exactly
   ═══════════════════════════════════════════════════════════════════ */

function StarRating({ value, size = "medium", showValue = true }) {
    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <Rating
                value={value}
                precision={0.5}
                readOnly
                size={size}
            />
            {showValue && (
                <Typography variant="body2" fontWeight={700} color="text.primary">
                    {value?.toFixed(1) || "0.0"}
                </Typography>
            )}
        </Stack>
    );
}

function RatingBreakdownCompact({ ratings }) {
    const total = ratings.reduce((sum, r) => sum + r.count, 0) || 1;
    return (
        <Box>
            {[5, 4, 3, 2, 1].map((stars) => {
                const item = ratings.find((r) => r.stars === stars) || { count: 0 };
                const percentage = (item.count / total) * 100;
                return (
                    <Stack key={stars} direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
                        <Typography variant="caption" sx={{ minWidth: 10, fontSize: "0.65rem" }}>{stars}</Typography>
                        <StarIcon sx={{ fontSize: 10, color: "warning.main" }} />
                        <Box sx={{ flex: 1 }}>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: "grey.200",
                                    "& .MuiLinearProgress-bar": { bgcolor: "warning.main", borderRadius: 3 },
                                }}
                            />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 16, fontSize: "0.65rem", textAlign: "right" }}>
                            {item.count}
                        </Typography>
                    </Stack>
                );
            })}
        </Box>
    );
}

function SellerReviewCard({ review, sellerId, isOwner, onReplyUpdate, viewer, viewerId: viewerIdProp, onEditReview, onDeleteReview, onReportReview }) {
    const navigate = useNavigate();
    const avatarSrc = review.reviewer_avatar || review.reviewerAvatar || review.reviewer?.avatarUrl || review.reviewer?.avatar_url || "";
    const firstName = review.reviewer_first_name || review.reviewerFirstName || review.reviewer?.firstName || "";
    const lastName = review.reviewer_last_name || review.reviewerLastName || review.reviewer?.lastName || "";
    const displayName = review.reviewer_name || review.reviewerName || review.reviewer?.name || "";
    const handle = review.reviewer_handle || review.reviewerHandle || review.reviewer?.handle || "";
    const reviewerId = review.reviewer_id || review.reviewer?.id || null;
    const name = [firstName, lastName].filter(Boolean).join(" ") || displayName || handle || "Anonymous";
    const rating = Number(review.rating) || 0;
    const comment = review.comment || "";
    const createdAt = review.created_at || review.createdAt || "";

    // Resolve viewer ID robustly
    const resolvedViewerId = viewerIdProp || Number(viewer?.id || viewer?.user_id || 0) || 0;
    const viewerIsReviewer = Boolean(resolvedViewerId && reviewerId && resolvedViewerId === Number(reviewerId));

    // Seller reply
    const sellerReply = review.seller_reply || review.sellerReply || null;
    const replyByFN = review.reply_by_first_name || "";
    const replyByLN = review.reply_by_last_name || "";
    const replyByDN = review.reply_by_name || "";
    const replyByHandle = review.reply_by_handle || "";
    const replyByName = [replyByFN, replyByLN].filter(Boolean).join(" ") || replyByDN || replyByHandle || "Seller";
    const replyByAvatar = review.reply_by_avatar || "";
    const replyAt = review.seller_reply_at || review.sellerReplyAt || "";

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

    // 3-dot menu state
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);

    // UserCardPopover state
    const [cardAnchor, setCardAnchor] = useState(null);
    const [cardUser, setCardUser] = useState(null);

    const openReviewerCard = (e) => {
        setCardAnchor(e.currentTarget);
        setCardUser({ id: reviewerId, handle, first_name: firstName, last_name: lastName, avatar_url: avatarSrc });
    };

    const openReplyByCard = (e) => {
        setCardAnchor(e.currentTarget);
        setCardUser({ handle: replyByHandle, first_name: replyByFN, last_name: replyByLN, avatar_url: replyByAvatar });
    };

    const handleOpenReply = () => {
        setReplyText(sellerReply || "");
        setReplyError("");
        // Load existing reply photos for editing
        const existingReplyPhotos = Array.isArray(review.reply_photo_urls) ? review.reply_photo_urls.filter(Boolean) : [];
        setReplyPhotos(existingReplyPhotos.map((u) => ({ id: u, url: u, _existing: true })));
        setReplyOpen(true);
    };
    const handleCancelReply = () => { if (replySaving) return; setReplyOpen(false); setReplyError(""); };

    const handleSaveReply = async () => {
        const body = replyText.trim();
        if (!body) { setReplyError("Reply cannot be empty."); return; }
        if (body.length > 2000) { setReplyError("Reply must be under 2000 characters."); return; }
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
            const resp = await replyToSellerReview(sellerId, review.id, body, uploadedPhotos);
            if (onReplyUpdate) onReplyUpdate(review.id, resp.sellerReply || body, resp.sellerReplyAt || new Date().toISOString(), resp.replyByName || null, resp.replyByHandle || null, resp.replyByAvatar || null, resp.replyPhotoUrls || uploadedPhotos.map((p) => p.url));
            setReplyOpen(false);
        } catch (err) { setReplyError(err?.message || "Failed to save reply."); }
        finally { setReplySaving(false); }
    };

    const handleDeleteReplyConfirmed = async () => {
        setReplySaving(true);
        try {
            await deleteSellerReviewReply(sellerId, review.id);
            if (onReplyUpdate) onReplyUpdate(review.id, null, null, null, null, null, []);
            setDeleteReplyConfirmOpen(false); setReplyOpen(false);
        } catch (err) { setReplyError(err?.message || "Failed to delete reply."); }
        finally { setReplySaving(false); }
    };

    return (
        <>
            <Box sx={{ py: 2.5, "&:last-child": { pb: 1 } }}>
                {/* Header row: avatar, name/handle, timestamp, 3-dot menu */}
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Avatar
                        src={avatarSrc || undefined}
                        sx={(t) => ({
                            width: 40, height: 40, flexShrink: 0, mt: 0.25, cursor: "pointer",
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                            fontSize: 16,
                            "& .MuiAvatar-img": { objectFit: "cover", transform: "scale(1.15)" },
                        })}
                        imgProps={{ referrerPolicy: "no-referrer" }}
                        onClick={openReviewerCard}
                    >
                        <PersonRoundedIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography
                                className="ll-reviewer-name"
                                sx={{ fontWeight: 800, fontSize: "0.85rem", lineHeight: 1.2, cursor: "pointer", "&:hover": { textDecoration: "underline" },
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%",
                                }}
                                onClick={openReviewerCard}
                            >
                                {name}
                            </Typography>
                            {viewerIsReviewer && <Chip label="You" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 900 }} />}
                        </Stack>
                        {handle && (
                            <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontWeight: 600, lineHeight: 1.2 }}>@{handle}</Typography>
                        )}
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                            <StarRating value={rating} size="small" showValue={false} />
                            <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600 }}>
                                {timeAgo(createdAt)}
                            </Typography>
                        </Stack>
                    </Box>
                    {resolvedViewerId > 0 && (
                        <IconButton
                            size="small"
                            onClick={(e) => setMenuAnchor(e.currentTarget)}
                            sx={(t) => ({ width: 32, height: 32, flexShrink: 0, border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } })}
                        >
                            <MoreVertRoundedIcon fontSize="small" />
                        </IconButton>
                    )}
                    <SmartMenu
                        anchorEl={menuAnchor}
                        open={menuOpen}
                        onClose={() => setMenuAnchor(null)}
                        disableScrollLock
                        onClick={(e) => e.stopPropagation()}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        sx={{ zIndex: (t) => t.zIndex.modal + 30 }}
                        PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => t.custom?.shadows?.lg || `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 180, py: 0.5 } }}
                    >
                        {viewerIsReviewer && (
                            <MenuItem onClick={() => { setMenuAnchor(null); if (onEditReview) onEditReview(review); }} sx={{ py: 1 }}>
                                <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Edit review" />
                            </MenuItem>
                        )}
                        {viewerIsReviewer && (
                            <MenuItem onClick={() => { setMenuAnchor(null); if (onDeleteReview) onDeleteReview(review); }} sx={{ py: 1, color: "error.main" }}>
                                <ListItemIcon><DeleteRoundedIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
                                <ListItemText primary="Delete review" />
                            </MenuItem>
                        )}
                        {!viewerIsReviewer && resolvedViewerId > 0 && (
                            <MenuItem onClick={() => { setMenuAnchor(null); if (onReportReview) onReportReview(review.id); }} sx={{ py: 1 }}>
                                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Report review" />
                            </MenuItem>
                        )}
                    </SmartMenu>
                </Stack>

                {/* Review content */}
                <Box sx={{ mt: 0.5 }}>
                    {comment && (
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "text.primary", mt: 0.5 }}>{comment}</Typography>
                    )}

                    {/* Review Photos */}
                    {(() => {
                        const reviewPhotos = Array.isArray(review.photo_urls) ? review.photo_urls.filter(Boolean)
                            : Array.isArray(review.photoUrls) ? review.photoUrls.filter(Boolean) : [];
                        if (!reviewPhotos.length) return null;
                        return (
                            <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                {reviewPhotos.map((url, i) => (
                                    <Box key={i} onClick={() => openReviewPhotoLightbox(reviewPhotos, i)} sx={{ position: "relative", width: 88, height: 88, flexShrink: 0, borderRadius: 2, overflow: "hidden", cursor: "pointer", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.05)" }, "&:hover .ll-zoom-icon": { opacity: 1 }, "&:hover": { boxShadow: (t) => t.custom?.shadows?.xs || "0 1px 4px rgba(0,0,0,0.1)" } }}>
                                        <Box component="img" src={url} alt={`Review photo ${i + 1}`} referrerPolicy="no-referrer"
                                             sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 250ms ease" }} />
                                        <Box className="ll-zoom-icon" sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: "opacity 200ms ease" }}>
                                            <ZoomInRoundedIcon sx={{ color: "common.white", fontSize: 22 }} />
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        );
                    })()}

                    {/* Seller reply display */}
                    {sellerReply && !replyOpen && (
                        <Box sx={(t) => ({ mt: 1.5, pl: 1.5, py: 1, borderLeft: "3px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 8px 8px 0" })}>
                            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.75 }}>
                                {/* Clickable avatar + name area — opens popover */}
                                <Box
                                    onClick={openReplyByCard}
                                    sx={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 1.25,
                                        cursor: replyByHandle ? "pointer" : "default",
                                        borderRadius: 1.5,
                                        px: 0.5,
                                        py: 0.25,
                                        mx: -0.5,
                                        transition: (t) => `background ${t.transitions.duration.shortest}ms`,
                                        "&:hover": replyByHandle ? {
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                            "& .ll-reply-name": { textDecoration: "underline" },
                                        } : {},
                                    }}
                                >
                                    <Avatar
                                        src={replyByAvatar || undefined}
                                        sx={(t) => ({
                                            width: 34, height: 34,
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            color: t.palette.primary.main,
                                            mt: 0.1, flexShrink: 0,
                                        })}
                                    >
                                        <PersonRoundedIcon sx={{ fontSize: 18 }} />
                                    </Avatar>
                                    <Box sx={{ minWidth: 0 }}>
                                        {/* Row 1: Name + Seller badge */}
                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                            <Typography className="ll-reply-name" variant="body2" fontWeight={800} color="primary.dark" sx={{ fontSize: 14, lineHeight: 1.3 }}>{replyByName}</Typography>
                                            <Chip label="Seller" size="small" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 800, bgcolor: "primary.main", color: "common.white" }} />
                                        </Stack>
                                        {/* Row 2: @handle */}
                                        {replyByHandle && (
                                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, fontSize: 12, display: "block" }}>@{replyByHandle}</Typography>
                                        )}
                                        {/* Row 3: Timestamp */}
                                        {replyAt && (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.2, mt: 0.15, display: "block" }}>{timeAgo(replyAt)}</Typography>
                                        )}
                                    </Box>
                                </Box>
                                {isOwner && (
                                    <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                        <IconButton size="small" onClick={handleOpenReply} sx={{ width: 28, height: 28 }}><EditRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                                        <IconButton size="small" onClick={() => setDeleteReplyConfirmOpen(true)} sx={{ width: 28, height: 28, color: "error.main" }}><DeleteRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                                    </Stack>
                                )}
                            </Stack>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: 13.5, pl: 5.5 }}>{sellerReply}</Typography>
                            {/* Reply Photos */}
                            {(() => {
                                const replyPhotoUrls = Array.isArray(review.reply_photo_urls) ? review.reply_photo_urls.filter(Boolean) : [];
                                if (!replyPhotoUrls.length) return null;
                                return (
                                    <Stack direction="row" spacing={0.75} sx={{ mt: 1, pl: 5.5, overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 4 }, "&::-webkit-scrollbar-thumb": { borderRadius: 2, bgcolor: (t) => alpha(t.palette.common.black, 0.12) } }}>
                                        {replyPhotoUrls.map((url, i) => (
                                            <Box key={i} onClick={() => openReviewPhotoLightbox(replyPhotoUrls, i)} sx={{ position: "relative", width: 76, height: 76, flexShrink: 0, borderRadius: 2, overflow: "hidden", cursor: "pointer", border: "1px solid", borderColor: "divider", "&:hover img": { transform: "scale(1.05)" }, "&:hover .ll-zoom-icon": { opacity: 1 }, "&:hover": { boxShadow: (t) => t.custom?.shadows?.xs || "0 1px 4px rgba(0,0,0,0.1)" } }}>
                                                <Box component="img" src={url} alt={`Reply photo ${i + 1}`} referrerPolicy="no-referrer"
                                                     sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 250ms ease" }} />
                                                <Box className="ll-zoom-icon" sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.35), opacity: 0, transition: "opacity 200ms ease" }}>
                                                    <ZoomInRoundedIcon sx={{ color: "common.white", fontSize: 20 }} />
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
                        <Box sx={(t) => ({ mt: 1.5, pl: 1.5, py: 1.5, borderLeft: "3px solid", borderColor: t.palette.primary.main, bgcolor: alpha(t.palette.primary.main, 0.04), borderRadius: "0 8px 8px 0" })}>
                            <Typography variant="body2" fontWeight={800} color="primary.dark" sx={{ mb: 1 }}>{sellerReply ? "Edit Response" : "Reply as Seller"}</Typography>
                            <TextField fullWidth multiline minRows={2} maxRows={6} placeholder="Write your response..." value={replyText}
                                       onChange={(e) => { setReplyText(e.target.value.slice(0, 2000)); if (replyError) setReplyError(""); }} disabled={replySaving} size="small"
                                       error={Boolean(replyError)}
                                       helperText={replyError || `${replyText.length}/2000`}
                                       FormHelperTextProps={{ sx: { fontWeight: replyError ? 700 : 400, fontSize: replyError ? "0.72rem" : "0.7rem" } }}
                                       sx={{ mb: 1, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.85rem" } }} />
                            <Box sx={{ mb: 1 }}>
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
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button size="small" onClick={handleCancelReply} disabled={replySaving} sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}>Cancel</Button>
                                <Button size="small" variant="contained" onClick={handleSaveReply} disabled={replySaving || !replyText.trim()}
                                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: 2 }}>
                                    {replySaving ? "Saving..." : (sellerReply ? "Update" : "Post Reply")}
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* Reply button for seller */}
                    {isOwner && !sellerReply && !replyOpen && (
                        <Button size="small" startIcon={<ReplyRoundedIcon sx={{ fontSize: 14 }} />} onClick={handleOpenReply}
                                sx={{ mt: 0.75, color: "text.secondary", textTransform: "none", fontWeight: 600, fontSize: "0.75rem", borderRadius: 2, px: 1, minHeight: 0, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } }}>
                            Reply
                        </Button>
                    )}

                    {/* Delete reply confirmation */}
                    <Dialog open={deleteReplyConfirmOpen} onClose={() => setDeleteReplyConfirmOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 100001 }}>
                        <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
                            Delete Response?
                            <IconButton onClick={() => setDeleteReplyConfirmOpen(false)} sx={{ position: "absolute", top: 8, right: 8 }}><CloseRoundedIcon /></IconButton>
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

/* ─── Write / Edit Seller Review Dialog ─────────────────────────── */

function WriteSellerReviewDialog({
                                     open,
                                     onClose,
                                     sellerId,
                                     sellerName,
                                     listingId,
                                     existingReview,
                                     onSaved,
                                     isOwnListing,
                                     isNonPersonalAccount,
                                 }) {
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
        if (isOwnListing) {
            setError("You cannot review yourself.");
            return;
        }
        if (isNonPersonalAccount) {
            setError("Please switch to your personal account to leave a review.");
            return;
        }
        if (!rating) {
            setError("Please select a rating.");
            return;
        }
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
            await submitSellerReview(sellerId, {
                rating,
                comment: comment.trim(),
                listingId,
                photos: uploadedPhotos,
            });
            handleClose();
            if (onSaved) onSaved();
        } catch (err) {
            const msg = err?.message || "Failed to submit review.";
            const field = err?.body?.field;
            if (field === "comment") {
                setCommentError(msg);
            } else if (msg.includes("already reviewed")) {
                setError("You've already reviewed this seller. You can edit your existing review instead.");
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
            <Dialog
                open={open && !deleteConfirmOpen}
                onClose={(e, reason) => { if (reason === "backdropClick") return; if (!submitting) handleClose(); }}
                maxWidth="sm"
                fullWidth
                fullScreen={_wMobile}
                PaperProps={{ sx: { borderRadius: _wMobile ? 0 : undefined } }}
                sx={{ zIndex: 100001 }}
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6" fontWeight={800}>
                        {existingReview ? "Edit Your Review" : "Write a Review"}
                    </Typography>
                    <IconButton onClick={handleClose} disabled={submitting} size="small">
                        <CloseRoundedIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {showBlockedMessage ? (
                        <Box sx={{ py: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            <Box
                                sx={(t) => ({
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2,
                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                    color: "primary.main",
                                })}
                            >
                                <RateReviewRoundedIcon sx={{ fontSize: 30 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                                {isOwnListing
                                    ? "You cannot review yourself."
                                    : "Switch to your personal account"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
                                {isOwnListing
                                    ? "Sellers cannot leave reviews on their own listings."
                                    : "Reviews must be left from your personal profile. Switch to your personal account to leave a seller review."}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Share your experience with {sellerName}
                            </Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                    Your Rating *
                                </Typography>
                                <Rating
                                    value={rating}
                                    precision={1}
                                    onChange={(_e, newVal) => setRating(newVal || 0)}
                                    size="large"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Your Review"
                                value={comment}
                                onChange={(e) => { setComment(e.target.value); if (commentError) setCommentError(""); }}
                                placeholder="How was your experience with this seller?"
                                inputProps={{ maxLength: 1000 }}
                                error={Boolean(commentError)}
                                helperText={commentError || `${comment.length} / 1,000`}
                                FormHelperTextProps={{ sx: { textAlign: commentError ? "left" : "right", mr: 0.5, fontWeight: commentError ? 700 : 600, fontSize: "0.72rem" } }}
                                sx={{ mb: 2 }}
                            />
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
                            {error && (
                                <Typography variant="body2" color="error" fontWeight={700} sx={{ mt: 1 }}>
                                    {error}
                                </Typography>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions
                    sx={{
                        px: 3,
                        pb: 2,
                        pt: 0,
                        flexDirection: "column",
                        gap: 0,
                    }}
                >
                    <Divider sx={{ width: "100%", mb: 1.5 }} />
                    <Box sx={{ display: "flex", width: "100%", justifyContent: showBlockedMessage ? "flex-end" : existingReview ? "space-between" : "flex-end", alignItems: "center" }}>
                        {!showBlockedMessage && existingReview && (
                            <Button
                                color="error"
                                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: "18px !important" }} />}
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={submitting}
                                sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                                Delete
                            </Button>
                        )}
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button onClick={handleClose} disabled={submitting}>
                                Close
                            </Button>
                            {!showBlockedMessage && (
                                <Button
                                    variant="contained"
                                    disabled={!rating || submitting}
                                    onClick={handleSubmit}
                                >
                                    {submitting ? "Saving\u2026" : existingReview ? "Update Review" : "Submit Review"}
                                </Button>
                            )}
                        </Box>
                    </Box>
                    {submitting && <LinearProgress sx={{ width: "100%", mt: 1, borderRadius: 1 }} />}
                </DialogActions>
            </Dialog>

            {/* Delete Review Confirmation */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={deleteSubmitting ? undefined : () => setDeleteConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
                sx={{ zIndex: 100001 }}
            >
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <Box
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            bgcolor: alpha(t.palette.error.main, 0.1),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 2,
                        })}
                    >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 28, color: "error.main" }} />
                    </Box>
                    <Typography variant="h6" fontWeight={900} sx={{ mb: 0.75 }}>
                        Delete Your Review?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, mb: 2.5, maxWidth: 280, mx: "auto" }}>
                        This will permanently remove your review and rating. This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            variant="outlined"
                            onClick={() => setDeleteConfirmOpen(false)}
                            disabled={deleteSubmitting}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleDeleteReview}
                            disabled={deleteSubmitting}
                            startIcon={
                                deleteSubmitting ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    <DeleteOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />
                                )
                            }
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}
                        >
                            {deleteSubmitting ? "Deleting\u2026" : "Delete Review"}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_REVIEW_STATS = {
    average: 0,
    total: 0,
    breakdown: [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
    ],
};

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

export default function ListingDetail({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { listingId } = useParams();
    const chromeTop = useChromeTop();

    // ── Listen for auth:token-expired from secureFetch / axiosInstance ──
    useEffect(() => {
        const handleTokenExpired = () => navigate('/login', { replace: true });
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, accountCacheKey, activeAccount } = useActiveAccount();
    const isNonPersonalAccount = isBusinessAccount || isArtistAccount;
    const { item: listing, isLoading, error, refresh } = useListingDetail(listingId, { activeBusinessId, activeArtistId });

    const cameFromMarketplace = location?.state?.from === "marketplace";
    const fromNotifications = Boolean(location?.state?.fromNotifications);

    const fromUserProfile = Boolean(location?.state?.fromProfile);
    // Internal navigation = user came from marketplace hub or a profile page (not a direct link/notification)
    const isInternalNav = cameFromMarketplace || fromUserProfile;
    const isMdUp = useMediaQuery((theme) => theme.breakpoints.up("md"));
    const isMobile = !isMdUp;
    // Full-screen mobile mode: only when navigating internally from within the app
    const isFullscreenMobile = isMobile && isInternalNav;
    const backProfileName = location?.state?.backProfileName || "";
    const backProfileHandle = location?.state?.backProfileHandle || "";
    const backProfileId = location?.state?.backProfileId || "";
    const backToProfileUrl =
        location?.state?.backToProfileUrl ||
        (backProfileHandle ? `/${backProfileHandle}` : backProfileId ? `/${backProfileId}` : "");

    const [photoIndex, setPhotoIndex] = useState(0);
    const [isMarkingSold, setIsMarkingSold] = useState(false);
    const [markSoldError, setMarkSoldError] = useState("");
    const [markSoldConfirmOpen, setMarkSoldConfirmOpen] = useState(false);
    const [relistConfirmOpen, setRelistConfirmOpen] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    // ── Success confirmation snackbar ──
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [openDelete, setOpenDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const [descExpanded, setDescExpanded] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [visible, setVisible] = useState(false);
    const [detailTab, setDetailTab] = useState(0);

    // ── Seller reviews (business-style) ──
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(DEFAULT_REVIEW_STATS);
    const [sellerStats, setSellerStats] = useState({ totalListings: 0, soldListings: 0, activeListings: 0, memberSince: null });
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewSortBy, setReviewSortBy] = useState("newest");
    const [userReview, setUserReview] = useState(null);
    const [writeReviewOpen, setWriteReviewOpen] = useState(false);
    const [deleteReviewTarget, setDeleteReviewTarget] = useState(null);
    const [deleteReviewSubmitting, setDeleteReviewSubmitting] = useState(false);
    const [reportReviewOpen, setReportReviewOpen] = useState(false);
    const [reportReviewTarget, setReportReviewTarget] = useState(null);

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

    const auth = useAuth();
    const viewer = user?.user || user || auth?.user?.user || auth?.user || null;
    const viewerId = useMemo(() => {
        const fromUser = user?.user?.id || user?.id;
        if (fromUser) return Number(fromUser);
        const fromAuth = auth?.user?.id || auth?.user?.user_id || auth?.user?.user?.id;
        if (fromAuth) return Number(fromAuth);
        const fromAcct = activeAccount?.user_id || activeAccount?.id;
        if (fromAcct) return Number(fromAcct);
        try { const raw = localStorage.getItem("ll:activeAccount"); const a = raw ? JSON.parse(raw) : null; return Number(a?.user_id || a?.id || 0) || 0; } catch { return 0; }
    }, [user, auth?.user, activeAccount]);

    // ── Blocked / hidden content gate ──
    const gate = useBlockedPostGate({ content: listing, user: viewer, contentType: 'listing' });

    const [acctGen, setAcctGen] = useState(0);
    const acctGenRef = useRef(0);
    const prevAcctKeyForActionsRef = useRef(accountCacheKey);
    const [optFav, setOptFav] = useState(null);
    const [optFavDelta, setOptFavDelta] = useState(0);
    const [optRepost, setOptRepost] = useState(null);
    const [optRepostDelta, setOptRepostDelta] = useState(0);

    useEffect(() => {
        if (prevAcctKeyForActionsRef.current !== accountCacheKey) {
            prevAcctKeyForActionsRef.current = accountCacheKey;
            const next = acctGenRef.current + 1;
            acctGenRef.current = next;
            setAcctGen(next);
            setOptFav(null);
            setOptFavDelta(0);
            setOptRepost(null);
            setOptRepostDelta(0);
        }
    }, [accountCacheKey]);

    const localFav = (optFav !== null && optFav.gen === acctGen) ? optFav.value : Boolean(listing?.isFavorited);
    const localFavCount = Math.max(0, (Number(listing?.favoritesCount) || 0) + optFavDelta);
    const localReposted = (optRepost !== null && optRepost.gen === acctGen) ? optRepost.value : Boolean(listing?.isReposted);
    const localRepostCount = Math.max(0, (Number(listing?.repostsCount) || 0) + optRepostDelta);

    const prevFavCountRef = useRef(listing?.favoritesCount);
    const prevRepostCountRef = useRef(listing?.repostsCount);

    useEffect(() => {
        if (prevFavCountRef.current !== listing?.favoritesCount) {
            prevFavCountRef.current = listing?.favoritesCount;
            setOptFavDelta(0);
            setOptFav(null);
        }
        if (prevRepostCountRef.current !== listing?.repostsCount) {
            prevRepostCountRef.current = listing?.repostsCount;
            setOptRepostDelta(0);
            setOptRepost(null);
        }
    }, [listing?.favoritesCount, listing?.repostsCount]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    const handleToggleFav = useCallback(async () => {
        if (!viewerId || !listing?.id) return;
        const next = !localFav;
        setOptFav({ gen: acctGenRef.current, value: next });
        setOptFavDelta((prev) => prev + (next ? 1 : -1));
        try {
            await toggleFavorite(listing.id, { businessId: activeBusinessId, artistId: activeArtistId });
            refresh();
        } catch { /* silent */ }
    }, [viewerId, listing?.id, localFav, activeBusinessId, activeArtistId, refresh]);

    const handleToggleRepost = useCallback(async () => {
        if (!viewerId || !listing?.id) return;
        if (isNonPersonalAccount) { setAccountSwitchOpen(true); return; }
        const next = !localReposted;
        setOptRepost({ gen: acctGenRef.current, value: next });
        setOptRepostDelta((prev) => prev + (next ? 1 : -1));
        try {
            await toggleRepost(listing.id, { businessId: activeBusinessId, artistId: activeArtistId });
            refresh();
        } catch { /* silent */ }
    }, [viewerId, listing?.id, localReposted, activeBusinessId, activeArtistId, isNonPersonalAccount, refresh]);

    const { isOwnerAnyAccount, isActiveAccountOwner, needsAccountSwitch } = useMemo(() => {
        if (!viewerId || !listing) return { isOwnerAnyAccount: false, isActiveAccountOwner: false, needsAccountSwitch: false };

        const isNonPersonalProfile = isBusinessAccount || isArtistAccount;
        const sellerHandle = String(listing?.seller?.handle || listing?.sellerHandle || "").toLowerCase().trim();

        const activeIdentifier = isNonPersonalProfile
            ? String(activeAccount?.slug || activeAccount?.handle || "").toLowerCase().trim()
            : String(viewer?.handle || "").toLowerCase().trim();

        if (listing?.isOwner != null) {
            const backendOwner = Boolean(listing.isOwner);
            if (isNonPersonalProfile) {
                const isActiveAccountOwnerVal = Boolean(activeIdentifier && sellerHandle && activeIdentifier === sellerHandle);
                return { isOwnerAnyAccount: backendOwner, isActiveAccountOwner: isActiveAccountOwnerVal, needsAccountSwitch: backendOwner && !isActiveAccountOwnerVal };
            }
            return { isOwnerAnyAccount: backendOwner, isActiveAccountOwner: backendOwner, needsAccountSwitch: false };
        }

        const isOwner = Boolean(activeIdentifier && sellerHandle && activeIdentifier === sellerHandle);
        return { isOwnerAnyAccount: isOwner, isActiveAccountOwner: isOwner, needsAccountSwitch: false };
    }, [listing, viewer, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount]);

    const prevAccountKeyRef = useRef(accountCacheKey);
    useEffect(() => {
        if (prevAccountKeyRef.current !== accountCacheKey) {
            prevAccountKeyRef.current = accountCacheKey;
            refresh();
        }
    }, [accountCacheKey, refresh]);

    // Record a view when the full page is visited
    useEffect(() => {
        if (!listingId) return;
        const controller = new AbortController();
        secureFetch(`/api/marketplace/listings/${listingId}/view`, {
            method: "POST",
            credentials: "include",
            signal: controller.signal,
        }).catch(() => {});
        return () => controller.abort();
    }, [listingId]);

    // ── Fetch seller reviews (business-style) ──
    const sellerIdForReviews = listing?.sellerId || listing?.seller?.id || listing?.userId || null;

    const loadSellerReviews = useCallback(async () => {
        const sid = sellerIdForReviews;
        if (!sid) return;
        setReviewsLoading(true);
        try {
            const data = await getSellerReviews(sid, { limit: 50 });
            const items = Array.isArray(data?.reviews) ? data.reviews : [];
            if (data?.sellerStats) setSellerStats(data.sellerStats);

            // Sort client-side
            const sorted = [...items];
            if (reviewSortBy === "oldest") {
                sorted.sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0));
            } else if (reviewSortBy === "highest") {
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            } else if (reviewSortBy === "lowest") {
                sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            }
            // default "newest" — API already returns desc

            setReviews(sorted);

            const avg = Number(data?.avgRating) || 0;
            const tot = Number(data?.totalCount) || 0;

            // Build breakdown from items
            const countsByStars = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            items.forEach((r) => {
                const s = Math.round(Number(r.rating) || 0);
                if (s >= 1 && s <= 5) countsByStars[s] += 1;
            });

            setReviewStats({
                average: avg,
                total: tot,
                breakdown: [
                    { stars: 5, count: countsByStars[5] },
                    { stars: 4, count: countsByStars[4] },
                    { stars: 3, count: countsByStars[3] },
                    { stars: 2, count: countsByStars[2] },
                    { stars: 1, count: countsByStars[1] },
                ],
            });

            // Find user's own review
            if (viewerId > 0) {
                const own = items.find((r) => Number(r.reviewer_id || r.reviewerId) === viewerId);
                setUserReview(own || null);
            } else {
                setUserReview(null);
            }
        } catch {
            setReviews([]);
            setReviewStats(DEFAULT_REVIEW_STATS);
            setUserReview(null);
        } finally {
            setReviewsLoading(false);
        }
    }, [sellerIdForReviews, reviewSortBy, viewerId]);

    // Stable key for seller so we don't re-fetch on every render
    const sellerIdKey = String(sellerIdForReviews || "");

    useEffect(() => {
        loadSellerReviews();
    }, [sellerIdKey, reviewSortBy, loadSellerReviews]);

    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);
    const canWriteReview = Boolean(viewerId) && !isOwnerAnyAccount && !isNonPersonalAccount;

    const handleOpenWriteReview = () => {
        if (!viewerId) {
            auth?.requireAuth?.();
            return;
        }
        setWriteReviewOpen(true);
    };

    const handleEditReviewFromMenu = (review) => {
        // Set userReview so the dialog opens in edit mode
        setUserReview(review);
        setWriteReviewOpen(true);
    };

    const handleDeleteReviewFromMenu = async () => {
        if (!deleteReviewTarget?.id) return;
        setDeleteReviewSubmitting(true);
        try {
            await deleteReview(deleteReviewTarget.id);
            setDeleteReviewTarget(null);
            setUserReview(null);
            loadSellerReviews();
        } catch { /* silent */ }
        finally { setDeleteReviewSubmitting(false); }
    };

    const handleReportReviewSubmit = async ({ reason, details }) => {
        if (!reportReviewTarget) return;
        try {
            await reportReview(reportReviewTarget, { reason, details });
        } catch { /* ReportDialog handles its own success state */ }
    };

    const hasReviews = reviews.length > 0;

    const photos = useMemo(() => {
        const list = listing?.photos || listing?.images || null;
        if (Array.isArray(list) && list.length) {
            const urls = list
                .map((p) => (typeof p === "string" ? p : p?.url))
                .filter(Boolean);
            if (urls.length) return urls;
        }
        if (listing?.coverPhotoUrl) return [listing.coverPhotoUrl];
        if (listing?.photoUrl) return [listing.photoUrl];
        return [FALLBACK_IMG];
    }, [listing]);

    const isFallbackOnly = photos.length === 1 && photos[0] === FALLBACK_IMG;
    const canGoPrev = photoIndex > 0;
    const canGoNext = photoIndex < photos.length - 1;

    const seller = listing?.seller || null;
    const sellerId = seller?.id ?? listing?.sellerId ?? null;
    const sellerName = seller?.name || listing?.sellerName || "Seller";
    const sellerHandle = seller?.handle || listing?.sellerHandle || "";
    const sellerAvatarUrl = seller?.avatarUrl || listing?.sellerAvatarUrl || "";

    // Seller UserCardPopover state (hero header + seller info tab)
    const [sellerPopoverAnchor, setSellerPopoverAnchor] = useState(null);
    const handleSellerClick = useCallback((e) => {
        e.stopPropagation();
        setSellerPopoverAnchor(e.currentTarget);
    }, []);
    const handleSellerPopoverClose = useCallback(() => setSellerPopoverAnchor(null), []);
    const isSelf = Boolean(viewerId && sellerId && viewerId === Number(sellerId));

    const handleMarkSold = async () => {
        if (!listing?.id || !isActiveAccountOwner || listing.status === "sold") return;
        setIsMarkingSold(true);
        setMarkSoldError("");
        try { await markListingSold(listing.id); signalMarketplaceRefresh(); await refresh(); }
        catch (err) { setMarkSoldError(err?.message || "Could not mark as sold."); }
        finally { setIsMarkingSold(false); }
    };

    const handleRelist = async () => {
        if (!listing?.id || !isActiveAccountOwner || listing.status !== "sold") return;
        setIsMarkingSold(true);
        setMarkSoldError("");
        try { await markListingSold(listing.id); signalMarketplaceRefresh(); await refresh(); }
        catch (err) { setMarkSoldError(err?.message || "Could not relist."); }
        finally { setIsMarkingSold(false); }
    };

    const handleUpdated = async () => { signalMarketplaceRefresh(); await refresh(); showSuccess("Listing updated successfully"); };

    const handleConfirmDelete = async () => {
        if (!listing?.id || !isActiveAccountOwner || isDeleting) return;
        setIsDeleting(true);
        setDeleteError("");
        try {
            await deleteListing(listing.id);
            signalMarketplaceRefresh();
            setOpenDelete(false);
            try { sessionStorage.setItem('ll:marketplace:listingDeletedSuccess', '1'); } catch {}
            navigate("/marketplace");
        }
        catch (err) { setDeleteError(err?.message || "Could not delete."); }
        finally { setIsDeleting(false); }
    };

    const handleCopyLink = () => {
        setMenuAnchor(null);
        const url = `${window.location.origin}/marketplace/${listing?.id || listingId}`;
        navigator.clipboard.writeText(url).then(() => showSuccess("Link copied to clipboard")).catch(() => showSuccess("Link copied to clipboard"));
    };

    const handleBack = () => {
        if (fromUserProfile) {
            try {
                const rawKey = backProfileHandle || backProfileId;
                const norm = String(rawKey || "").replace(/^@/, "").trim();
                const candidates = [rawKey, norm, norm ? `@${norm}` : ""].filter(Boolean);
                candidates.forEach((k) => {
                    sessionStorage.setItem(`ll:profile:${k}:restore`, "1");
                });
            } catch { /* ignore */ }

            if (window.history.length > 1) {
                navigate(-1);
                return;
            }
            if (backToProfileUrl) {
                navigate(backToProfileUrl, { state: { restoreProfile: true, fromPostPage: true } });
            } else {
                navigate("/", { state: { restoreProfile: true, fromPostPage: true } });
            }
            return;
        }
        if (window.history.length > 1) navigate(-1); else navigate("/marketplace");
    };

    const isSold = listing?.status === "sold";
    const priceLabel = listing ? formatPrice(listing.priceCents, listing.priceModel) : "";
    const contextLabel = listing ? pricingContextLabel(listing.priceModel) : "";
    const locationLabel = listing ? formatLocation(listing) : "";
    const postedLabel = listing ? timeAgo(listing.createdAt) : "";
    const CatIcon = listing?.category ? (CATEGORY_ICONS[listing.category] || CategoryRoundedIcon) : CategoryRoundedIcon;
    const tooltipSx = { fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, maxWidth: 240 };

    /* ── Quick Message Dialog handlers ── */
    const openQuickMsg = () => {
        if (!viewer) { auth?.requireAuth?.(); return; }
        const recipientId = Number(listing?.userId || listing?.user_id || listing?.seller?.id || listing?.sellerId || 0);
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
        if ((!quickMsgBody.trim() && quickMsgPhotos.length === 0) || !listing || quickMsgCooldown > 0) return;
        setQuickMsgSending(true);
        setQuickMsgError("");
        try {
            const recipientId = Number(listing.userId || listing.user_id || listing.seller?.id || listing.sellerId || 0);
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
                listing_id: Number(listing.id) || undefined,
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

    const outerSx = {
        width: "100%",
        minHeight: isFullscreenMobile ? "100dvh" : "100vh",
        bgcolor: "background.default",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: (t) => `opacity ${t.custom.motion.slow}ms ${t.custom.motion.ease}, transform ${t.custom.motion.slow}ms ${t.custom.motion.ease}`,
        ...(isFullscreenMobile ? {
            position: "fixed",
            top: `${chromeTop}px`, left: 0, right: 0, bottom: 0,
            zIndex: (t) => t.zIndex.drawer + 3,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
        } : {
            pt: { xs: `${chromeTop}px`, md: 0 },
        }),
    };

    const innerSx = {
        maxWidth: isFullscreenMobile ? "100%" : 820,
        mx: "auto",
        px: isFullscreenMobile ? 0 : { xs: 1.25, sm: 2, md: 3 },
        py: isFullscreenMobile ? 0 : { xs: 1.5, sm: 3 },
    };

    const cardSx = (t) => ({
        borderRadius: isFullscreenMobile ? 0 : 4,
        border: isFullscreenMobile ? "none" : "1px solid",
        borderColor: isFullscreenMobile ? "transparent" : alpha(t.palette.text.primary, 0.08),
        bgcolor: t.palette.background.paper, backgroundImage: "none",
        boxShadow: isFullscreenMobile ? "none" : `0 12px 40px ${alpha(t.palette.text.primary, 0.06)}`,
        overflow: "hidden",
    });

    if (isLoading || (listing && viewer && gate.loading)) return <Box sx={outerSx}><Box sx={innerSx}><Paper variant="outlined" sx={cardSx}><DetailSkeleton /></Paper></Box></Box>;

    if (isNetworkError(error)) return (
        <Box sx={outerSx}>
            <Box sx={innerSx}>
                <NetworkErrorState onRetry={refresh} />
            </Box>
        </Box>
    );

    if (error) return (
        <Box sx={outerSx}>
            <Box sx={innerSx}>
                <Paper variant="outlined" sx={(t) => ({ ...cardSx(t), p: 3 })}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>{error?.message || "Could not load listing."}</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={refresh} sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999 }}>Retry</Button>
                        {!fromNotifications && (
                            <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ textTransform: "none", fontWeight: 800 }}>Back</Button>
                        )}
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );

    if (listing && gate.gated) return <BlockedPostGate gate={gate} />;

    if (!listing) return (
        <Box sx={outerSx}>
            <Box sx={innerSx}>
                <Paper variant="outlined" sx={(t) => ({ ...cardSx(t), p: 3 })}>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>This listing may have been removed or sold.</Typography>
                    {!fromNotifications && (
                        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ textTransform: "none", fontWeight: 800 }}>Back to Marketplace</Button>
                    )}
                </Paper>
            </Box>
        </Box>
    );

    return (
        <Box sx={outerSx}>
            <Box sx={innerSx}>

                <Paper variant="outlined" sx={cardSx}>
                    {/* Back to Marketplace */}
                    {(cameFromMarketplace || fromUserProfile) && (
                        <Box sx={(t) => ({
                            px: isFullscreenMobile ? 1 : { xs: 2, sm: 3 },
                            py: isFullscreenMobile ? 0.75 : 1.25,
                            borderBottom: "1px solid", borderColor: "divider",
                            ...(isFullscreenMobile ? {
                                position: "sticky", top: 0, zIndex: 10,
                                bgcolor: alpha(t.palette.background.paper, 0.92),
                                backdropFilter: "saturate(140%) blur(10px)",
                                display: "flex", alignItems: "center", gap: 0.5,
                                paddingTop: "max(6px, env(safe-area-inset-top))",
                            } : {}),
                        })}>
                            {isFullscreenMobile ? (
                                <>
                                    <IconButton onClick={handleBack} size="small" sx={{ width: 36, height: 36 }}>
                                        <ArrowBackIcon sx={{ fontSize: 22 }} />
                                    </IconButton>
                                    <Typography sx={{ fontWeight: 800, fontSize: 15, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {listing?.title || "Listing Details"}
                                    </Typography>
                                </>
                            ) : (
                                <Button onClick={handleBack} startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                                        sx={{ px: 1.5, py: 0.5, minWidth: 0, fontWeight: 800, fontSize: 13, textTransform: "none", borderRadius: 999, color: "primary.main", "&:hover": { bgcolor: "action.hover" } }}>
                                    {fromUserProfile
                                        ? backProfileName
                                            ? `Return to ${backProfileName}'s profile`
                                            : "Return to Profile"
                                        : "Return to Marketplace"}
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* Photo gallery */}
                    {!isFallbackOnly && (
                        <Box sx={{ position: "relative", bgcolor: "background.default" }}>
                            <Box onClick={() => { setLightboxIndex(photoIndex); setLightboxOpen(true); }}
                                 sx={{ position: "relative", cursor: "pointer", "&:hover .zoom-hint": { opacity: 1 } }}>
                                <Box component="img" src={photos[photoIndex] || FALLBACK_IMG} alt={listing.title || "Listing"}
                                     sx={{ width: "100%", height: { xs: 280, sm: 400 }, objectFit: "contain", display: "block", filter: isSold ? "grayscale(0.25)" : "none" }} />
                                <Box className="zoom-hint" sx={{ position: "absolute", inset: 0, bgcolor: (t) => alpha(t.palette.text.primary, 0.06), display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: (t) => `opacity ${t.custom.motion.base}ms ${t.custom.motion.ease}`, pointerEvents: "none" }}>
                                    <Box sx={{ px: 1.5, py: 0.6, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <ZoomInRoundedIcon sx={{ fontSize: 18, color: "common.white" }} />
                                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "common.white" }}>View full size</Typography>
                                    </Box>
                                </Box>
                                {isSold && (
                                    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.common.black, 0.3), pointerEvents: "none" }}>
                                        <Chip label="SOLD" size="small" sx={{ fontWeight: 950, fontSize: 14, height: 30, bgcolor: (t) => alpha(t.palette.background.paper, 0.95), color: "error.main", letterSpacing: "0.05em" }} />
                                    </Box>
                                )}
                                {photos.length > 1 && (
                                    <Box sx={{ position: "absolute", bottom: 10, right: 10, px: 1, py: 0.3, borderRadius: 999, bgcolor: (t) => alpha(t.palette.common.black, 0.55), backdropFilter: "blur(4px)" }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white" }}>{photoIndex + 1} / {photos.length}</Typography>
                                    </Box>
                                )}
                            </Box>
                            {canGoPrev && (
                                <IconButton onClick={() => setPhotoIndex((v) => v - 1)} aria-label="Previous"
                                            sx={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", bgcolor: (t) => alpha(t.palette.background.paper, 0.9), boxShadow: 1, "&:hover": { bgcolor: "background.paper" } }}>
                                    <ChevronLeftRoundedIcon />
                                </IconButton>
                            )}
                            {canGoNext && (
                                <IconButton onClick={() => setPhotoIndex((v) => v + 1)} aria-label="Next"
                                            sx={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", bgcolor: (t) => alpha(t.palette.background.paper, 0.9), boxShadow: 1, "&:hover": { bgcolor: "background.paper" } }}>
                                    <ChevronRightRoundedIcon />
                                </IconButton>
                            )}
                            {photos.length > 1 && (
                                <Stack direction="row" spacing={0.75} sx={{ px: 2, py: 1.25, overflowX: "auto" }} justifyContent="center">
                                    {photos.map((url, idx) => (
                                        <Box key={url} onClick={() => setPhotoIndex(idx)}
                                             sx={(t) => ({ width: 56, height: 56, borderRadius: 1.5, overflow: "hidden", cursor: "pointer", flexShrink: 0,
                                                 border: "2.5px solid", borderColor: idx === photoIndex ? t.palette.primary.main : alpha(t.palette.text.primary, 0.08),
                                                 opacity: idx === photoIndex ? 1 : 0.6, transition: `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { opacity: 1, transform: "scale(1.05)" } })}>
                                            <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Box>
                    )}

                    {/* Hero header — matches panel card style */}
                    <Box sx={(t) => ({ mx: { xs: 0, sm: 2, md: 3 }, mt: { xs: 0, sm: 2 }, borderRadius: { xs: 0, sm: 2.5 }, background: `linear-gradient(160deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(t.palette.primary.main, 0.02)} 45%, transparent 100%)`, border: { xs: "none", sm: "1px solid" }, borderBottom: { xs: "1px solid", sm: "1px solid" }, borderColor: alpha(t.palette.primary.main, 0.08), overflow: "hidden" })}>
                        {/* Accent bar */}
                        <Box sx={{ height: 3, bgcolor: isSold ? "error.main" : "primary.main" }} />

                        <Box sx={{ px: { xs: 1.75, sm: 2.5 }, pt: { xs: 1.75, sm: 2 }, pb: 1.5 }}>
                            {/* Seller row + menu */}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
                                <Box
                                    onClick={handleSellerClick}
                                    sx={{
                                        display: "inline-flex", alignItems: "center", gap: 1, minWidth: 0, flex: "0 1 auto",
                                        cursor: "pointer", borderRadius: 2, p: 0.5, m: -0.5,
                                        transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04), "& .ll-seller-name": { textDecoration: "underline" } },
                                    }}
                                >
                                    <Avatar src={sellerAvatarUrl || undefined} alt={sellerName}
                                            sx={(t) => ({ width: 36, height: 36, border: `2px solid ${alpha(t.palette.text.primary, 0.08)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}
                                            imgProps={{ referrerPolicy: "no-referrer" }}>
                                        <PersonRoundedIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography className="ll-seller-name" sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{sellerName}</Typography>
                                        {sellerHandle && <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: 10.5, lineHeight: 1.2 }}>@{sellerHandle}</Typography>}
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <AccessTimeRoundedIcon sx={{ fontSize: 10, color: "text.disabled" }} />
                                            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 10.5 }}>{postedLabel ? `Posted ${postedLabel}` : ""}</Typography>
                                        </Stack>
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1 }} />
                                <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}
                                            sx={(t) => ({ width: 30, height: 30, flexShrink: 0, bgcolor: alpha(t.palette.text.primary, 0.04), "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.08) } })}>
                                    <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Stack>

                            {/* Title */}
                            <Typography sx={{ fontWeight: 950, fontSize: { xs: 18, sm: 22 }, lineHeight: 1.2, wordBreak: "break-word", overflowWrap: "anywhere", mb: 0.5 }}>
                                {listing.title || "Untitled listing"}
                            </Typography>

                            {/* Price */}
                            {listing.category !== "Yard Sales" && (
                                <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ mb: 1 }}>
                                    {contextLabel && <Typography sx={{ fontSize: 10, fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.04em" }}>{contextLabel}:</Typography>}
                                    <Typography sx={(t) => ({ fontWeight: 950, fontSize: 20, color: isSold ? "text.disabled" : t.palette.success.dark, textDecoration: isSold ? "line-through" : "none" })}>{priceLabel}</Typography>
                                    {isSold && <Chip label="Sold" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 900, bgcolor: "error.main", color: "common.white" }} />}
                                </Stack>
                            )}
                            {listing.category === "Yard Sales" && isSold && (
                                <Box sx={{ mb: 1 }}>
                                    <Chip label="Sold" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 900, bgcolor: "error.main", color: "common.white" }} />
                                </Box>
                            )}
                        </Box>

                        {/* Action bar */}
                        <Box sx={(t) => ({ px: 1.5, py: 0.75, borderTop: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), display: "flex", alignItems: "center", gap: 0.25 })}>
                            <Tooltip title={localFav ? "Unsave" : "Save listing"}>
                                <Box onClick={handleToggleFav}
                                     sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999, cursor: "pointer", userSelect: "none",
                                         transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }, "&:active": { transform: "scale(0.97)" } }}>
                                    {localFav ? <BookmarkRoundedIcon sx={{ fontSize: 22, color: "secondary.main" }} /> : <BookmarkBorderRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />}
                                    {localFavCount > 0 && <Typography sx={{ fontSize: 13, fontWeight: 700, color: localFav ? "secondary.main" : "text.secondary", lineHeight: 1 }}>{fmtCount(localFavCount)}</Typography>}
                                </Box>
                            </Tooltip>
                            <Tooltip title={localReposted ? "Undo repost" : "Repost"}>
                                <Box onClick={!isSold ? handleToggleRepost : undefined}
                                     sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999,
                                         cursor: isSold ? "default" : "pointer", opacity: isSold ? 0.5 : 1, userSelect: "none",
                                         transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": !isSold ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) } : {}, "&:active": !isSold ? { transform: "scale(0.97)" } : {} }}>
                                    <RepeatRoundedIcon sx={{ fontSize: 22, color: localReposted ? "secondary.main" : "text.secondary" }} />
                                    {localRepostCount > 0 && <Typography sx={{ fontSize: 13, fontWeight: 700, color: localReposted ? "secondary.main" : "text.secondary", lineHeight: 1 }}>{fmtCount(localRepostCount)}</Typography>}
                                </Box>
                            </Tooltip>
                            <Box sx={{ flex: 1 }} />
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <VisibilityRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{listing.viewsCount || 0} views</Typography>
                            </Stack>
                        </Box>
                    </Box>

                    {/* ─── Full-width action buttons ─── */}
                    <Divider sx={{ mt: isFullscreenMobile ? 0.5 : 1.5 }} />
                    {!isActiveAccountOwner && !isSold && (
                        <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isFullscreenMobile ? 0.75 : 1.5, pb: isFullscreenMobile ? 0.75 : 1 }}>
                            <Button variant="contained" fullWidth startIcon={<SendRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                    onClick={openQuickMsg}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isFullscreenMobile ? "0.8rem" : { xs: "0.95rem", sm: "0.85rem" }, py: isFullscreenMobile ? 0.85 : { xs: 1.5, sm: 1 }, minHeight: isFullscreenMobile ? 36 : { xs: 48, sm: "auto" } }}>
                                Message
                            </Button>
                            <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                    onClick={() => setShareOpen(true)}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isFullscreenMobile ? "0.8rem" : { xs: "0.95rem", sm: "0.85rem" }, py: isFullscreenMobile ? 0.85 : { xs: 1.5, sm: 1 }, minHeight: isFullscreenMobile ? 36 : { xs: 48, sm: "auto" }, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                                Share
                            </Button>
                        </Stack>
                    )}

                    {!isActiveAccountOwner && isSold && (
                        <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isFullscreenMobile ? 0.75 : 1.5, pb: isFullscreenMobile ? 0.75 : 1 }}>
                            <Button variant="outlined" fullWidth startIcon={<ShareRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                    onClick={() => setShareOpen(true)}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isFullscreenMobile ? "0.8rem" : { xs: "0.95rem", sm: "0.85rem" }, py: isFullscreenMobile ? 0.85 : { xs: 1.5, sm: 1 }, minHeight: isFullscreenMobile ? 36 : { xs: 48, sm: "auto" }, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>
                                Share
                            </Button>
                        </Stack>
                    )}

                    {isActiveAccountOwner && !isSold && (
                        <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isFullscreenMobile ? 0.75 : 1.5, pb: isFullscreenMobile ? 0.75 : 1 }}>
                            {(markSoldError || deleteError) && <Alert severity="error" sx={{ mb: 1, borderRadius: 2, width: "100%" }}>{markSoldError || deleteError}</Alert>}
                            <Button variant="outlined" fullWidth startIcon={<EditRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => setOpenEdit(true)}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isFullscreenMobile ? "0.8rem" : { xs: "0.95rem", sm: "0.85rem" }, py: isFullscreenMobile ? 0.85 : { xs: 1.5, sm: 1 }, minHeight: isFullscreenMobile ? 36 : { xs: 48, sm: "auto" }, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>Edit</Button>
                            <Button variant="contained" fullWidth color="success" startIcon={<SellRoundedIcon sx={{ fontSize: "16px !important" }} />} disabled={isMarkingSold} onClick={() => setMarkSoldConfirmOpen(true)}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isFullscreenMobile ? "0.8rem" : { xs: "0.95rem", sm: "0.85rem" }, py: isFullscreenMobile ? 0.85 : { xs: 1.5, sm: 1 }, minHeight: isFullscreenMobile ? 36 : { xs: 48, sm: "auto" } }}>{isMarkingSold ? "Marking..." : "Mark Sold"}</Button>
                        </Stack>
                    )}

                    {isActiveAccountOwner && isSold && (
                        <Stack direction="row" spacing={1} sx={{ px: { xs: 1.25, sm: 2 }, pt: isFullscreenMobile ? 0.75 : 1.5, pb: isFullscreenMobile ? 0.75 : 1 }}>
                            <Button variant="outlined" fullWidth startIcon={<ReplayRoundedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => setRelistConfirmOpen(true)}
                                    sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 900, fontSize: isFullscreenMobile ? "0.8rem" : { xs: "0.95rem", sm: "0.85rem" }, py: isFullscreenMobile ? 0.85 : { xs: 1.5, sm: 1 }, minHeight: isFullscreenMobile ? 36 : { xs: 48, sm: "auto" }, borderColor: "divider", color: "text.primary", "&:hover": { borderColor: "primary.main", color: "primary.main" } }}>Relist This Item</Button>
                        </Stack>
                    )}

                    {/* Tabs */}
                    <Box sx={{ pt: 1.25, pb: 0.5 }}>
                        <Divider />
                        <Tabs value={detailTab} onChange={(_e, v) => setDetailTab(v)} variant="fullWidth"
                              sx={(t) => ({
                                  minHeight: 38, flexShrink: 0, borderRadius: 0, padding: 0,
                                  backgroundColor: "transparent", border: "none", boxShadow: "none",
                                  borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12),
                                  "& .MuiTab-root": {
                                      minHeight: 38, textTransform: "none", fontWeight: 700, fontSize: 13.5,
                                      letterSpacing: "-0.01em", py: 0, px: 1, minWidth: 0, borderRadius: 0, gap: 0.25,
                                      color: t.palette.text.secondary, "&:hover": { color: t.palette.text.primary },
                                  },
                                  "& .Mui-selected": { color: `${t.palette.primary.main} !important`, fontWeight: 950 },
                                  "& .MuiTabs-indicator": { bgcolor: t.palette.primary.main, height: 2.5, borderRadius: 0 },
                              })}>
                            <Tab label="Details" value={0} />
                            <Tab label={`Seller Info${reviewStats.total > 0 ? ` (${reviewStats.total})` : ""}`} value={1} />
                        </Tabs>
                    </Box>

                    {/* ═══ TAB: Details ═══ */}
                    {detailTab === 0 && (
                        <Box sx={{ px: { xs: 1.25, sm: 1.5 }, pt: 1.5, pb: 2 }}>

                            <Box sx={{ mb: 1.5 }}>
                                <SectionLabel>Item Details</SectionLabel>
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr" }, gap: { xs: 0.5, sm: 0.75 } }}>
                                    {listing.category && <DetailCard icon={<CatIcon sx={{ fontSize: 18 }} />} label="Category" value={listing.category} />}
                                    {listing.condition && <DetailCard icon={<StorefrontRoundedIcon sx={{ fontSize: 18 }} />} label="Condition" value={listing.condition} />}
                                    {locationLabel && <DetailCard icon={<LocationOnRoundedIcon sx={{ fontSize: 18 }} />} label="Location" value={locationLabel} />}
                                    {listing.category !== "Yard Sales" && priceLabel && <DetailCard icon={<LocalOfferRoundedIcon sx={{ fontSize: 18 }} />} label="Price" value={priceLabel} highlight />}
                                </Box>
                            </Box>

                            {/* Yard Sale: date, time, address, map */}
                            {listing.category === "Yard Sales" && (() => {
                                const ysDateLabel = formatYardSaleDateLabel(listing.yardSaleDate);
                                const ysTimeLabel = formatYardSaleTimeLabel(listing.yardSaleHours);
                                const ysAddress = listing.yardSaleAddress || "";
                                const ysPast = isYardSalePast(listing.yardSaleDate);
                                const ysLat = listing.latitude != null ? Number(listing.latitude) : null;
                                const ysLng = listing.longitude != null ? Number(listing.longitude) : null;
                                const hasPin = ysLat != null && ysLng != null && Number.isFinite(ysLat) && Number.isFinite(ysLng);
                                const hasStreetAddress = Boolean(ysAddress);
                                const ysLocationLabel = formatLocation(listing);
                                const locationQuery = [ysAddress, listing.city, listing.county ? `${listing.county} County` : "", "Alabama"].filter(Boolean).join(", ");
                                const directionsQuery = hasStreetAddress ? locationQuery : [listing.city, listing.county ? `${listing.county} County` : "", "Alabama"].filter(Boolean).join(", ");

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
                                                        <Box sx={(t) => ({ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(ysPast ? t.palette.text.disabled : t.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
                                                            <CalendarTodayRoundedIcon sx={{ color: ysPast ? "text.disabled" : "primary.main", fontSize: 20 }} />
                                                        </Box>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 800, fontSize: 14, color: ysPast ? "text.disabled" : "text.primary" }}>{ysDateLabel}</Typography>
                                                            {ysTimeLabel && (
                                                                <Typography sx={{ fontSize: 13, color: ysPast ? "text.disabled" : "text.secondary", fontWeight: 600 }}>{ysTimeLabel}</Typography>
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
                                                            <Box sx={(t) => ({ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
                                                                <LocationOnRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                                                            </Box>
                                                            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.15 }}>
                                                                <Typography sx={{ fontWeight: 800, fontSize: 14, color: "text.primary" }}>{ysAddress}</Typography>
                                                                <Typography sx={{ fontSize: 13, color: "primary.main", fontWeight: 700 }}>{ysLocationLabel}</Typography>
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
                                                        sx={{ width: "100%", height: 180, border: 0, display: "block", pointerEvents: "none" }}
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

                            <Box sx={{ mb: 1.5 }}>
                                <SectionLabel>Description</SectionLabel>
                                <Box sx={(t) => ({ position: "relative", p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: t.palette.background.paper })}>
                                    {listing.description ? (
                                        <>
                                            <Box sx={{ maxHeight: descExpanded ? "none" : 160, overflowY: descExpanded ? "visible" : "hidden", position: "relative" }}>
                                                {/<[a-z][\s\S]*>/i.test(listing.description) ? (
                                                    <Box
                                                        component="div"
                                                        sx={{ "& p": { m: 0, mb: 0.5 }, "& ul, & ol": { m: 0, pl: 2.5 }, "& li": { mb: 0.25 }, "& a": { color: "primary.main", textDecoration: "underline" }, lineHeight: 1.55, wordBreak: "break-word", overflowWrap: "anywhere", color: "text.primary", fontSize: 12.5 }}
                                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(listing.description) }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" component="div" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.55, wordBreak: "break-word", overflowWrap: "anywhere", fontSize: 12.5, color: "text.primary" }}>
                                                        {renderTextWithMentions(listing.description, navigate)}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {!descExpanded && (listing.description || "").length > 300 && (
                                                <Box sx={{
                                                    position: "absolute", bottom: 0, left: 0, right: 0, height: 64,
                                                    background: (t) => `linear-gradient(to bottom, ${alpha(t.palette.background.paper, 0)} 0%, ${t.palette.background.paper} 85%)`,
                                                    pointerEvents: "none", borderRadius: "0 0 8px 8px",
                                                }} />
                                            )}
                                            {(listing.description || "").length > 300 && (
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

                    {/* ═══ TAB: Seller Info + Reviews (Business-style) ═══ */}
                    {detailTab === 1 && (
                        <Box sx={{ px: { xs: 1.25, sm: 1.5 }, pt: 1.5, pb: 2 }}>
                            {/* Seller card */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.text.primary, 0.06), bgcolor: t.palette.background.paper, mb: 1.5 })}>
                                <Stack direction="row" spacing={1.75} alignItems="flex-start">
                                    <Box
                                        onClick={handleSellerClick}
                                        sx={{
                                            display: "inline-flex", alignItems: "flex-start", gap: 1.75, minWidth: 0, flex: "0 1 auto",
                                            cursor: "pointer", borderRadius: 2, p: 0.5, m: -0.5,
                                            transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                            "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04), "& .ll-seller-tab-name": { textDecoration: "underline" } },
                                        }}
                                    >
                                        <Avatar
                                            src={sellerAvatarUrl || undefined}
                                            alt={sellerName}
                                            sx={(t) => ({ width: 56, height: 56, border: `2px solid ${alpha(t.palette.text.primary, 0.06)}`, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}
                                            imgProps={{ referrerPolicy: "no-referrer" }}
                                        >
                                            <PersonRoundedIcon sx={{ fontSize: 28 }} />
                                        </Avatar>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                            <Typography className="ll-seller-tab-name" sx={{ fontWeight: 800, fontSize: 16 }}>{sellerName}</Typography>
                                            {sellerHandle && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                                                    @{sellerHandle}
                                                </Typography>
                                            )}
                                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                                {reviewStats.average > 0 ? (
                                                    <>
                                                        <StarRating value={reviewStats.average} size="small" showValue />
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                                                            ({reviewStats.total} {reviewStats.total === 1 ? "review" : "reviews"})
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                                                        No reviews yet
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleSellerClick}
                                        disabled={!sellerId}
                                        sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, flexShrink: 0 }}
                                    >
                                        View Profile
                                    </Button>
                                </Stack>
                            </Box>

                            {/* Seller stats badges */}
                            {(() => {
                                const navToMarketplace = (statusFilter) => {
                                    const sellerSearchQuery = sellerHandle ? `@${sellerHandle}` : sellerName;
                                    navigate("/marketplace", {
                                        state: { sellerFilter: { query: sellerSearchQuery, status: statusFilter } },
                                    });
                                };
                                return (
                                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, mb: 3 }}>
                                        <Box onClick={() => navToMarketplace("all")} sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12), bgcolor: alpha(t.palette.primary.main, 0.04), textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: alpha(t.palette.primary.main, 0.1), transform: "translateY(-1px)" } })}>
                                            <Typography sx={{ fontWeight: 900, fontSize: 20, color: "primary.main", lineHeight: 1.2 }}>{sellerStats.totalListings}</Typography>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Total Listings</Typography>
                                        </Box>
                                        <Box onClick={() => navToMarketplace("sold")} sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.success.main, 0.12), bgcolor: alpha(t.palette.success.main, 0.04), textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: alpha(t.palette.success.main, 0.1), transform: "translateY(-1px)" } })}>
                                            <Typography sx={{ fontWeight: 900, fontSize: 20, color: "success.main", lineHeight: 1.2 }}>{sellerStats.soldListings}</Typography>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Sold</Typography>
                                        </Box>
                                        <Box onClick={() => navToMarketplace("available")} sx={(t) => ({ p: 1.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.info.main, 0.12), bgcolor: alpha(t.palette.info.main, 0.04), textAlign: "center", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { bgcolor: alpha(t.palette.info.main, 0.1), transform: "translateY(-1px)" } })}>
                                            <Typography sx={{ fontWeight: 900, fontSize: 20, color: "info.main", lineHeight: 1.2 }}>{sellerStats.activeListings}</Typography>
                                            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>Active</Typography>
                                        </Box>
                                    </Box>
                                );
                            })()}

                            {/* ── Reviews Section (matches BusinessPublicPage) ── */}
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <RateReviewRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                    <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: 16, sm: 18 } }}>
                                        Seller Reviews
                                    </Typography>
                                </Stack>
                                {!isOwnerAnyAccount && viewerId > 0 && !isNonPersonalAccount && !userReview && (
                                    <Button
                                        variant="contained"
                                        startIcon={<RateReviewRoundedIcon />}
                                        onClick={handleOpenWriteReview}
                                        size="small"
                                        sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, fontSize: { xs: 13, sm: 14 }, py: { xs: 0.75, sm: 0.5 }, px: { xs: 2, sm: 1.5 } }}
                                    >
                                        Write Review
                                    </Button>
                                )}
                                {!isOwnerAnyAccount && viewerId > 0 && isNonPersonalAccount && (
                                    <Tooltip title="Switch to your personal account to leave a review">
                                        <span>
                                            <Button
                                                variant="outlined"
                                                startIcon={<PersonRoundedIcon />}
                                                onClick={handleOpenWriteReview}
                                                size="small"
                                                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999 }}
                                            >
                                                Review
                                            </Button>
                                        </span>
                                    </Tooltip>
                                )}
                            </Stack>

                            {hasReviews ? (
                                <>
                                    {/* Rating summary card */}
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 2, sm: 3 },
                                            mb: 3,
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                                            borderRadius: 3,
                                        }}
                                    >
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
                                            <Box sx={{ textAlign: "center", minWidth: 120 }}>
                                                <Typography variant="h2" fontWeight={800} color="primary.main">
                                                    {reviewStats.average.toFixed(1)}
                                                </Typography>
                                                <StarRating value={reviewStats.average} showValue={false} />
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {reviewStats.total} {reviewStats.total === 1 ? "review" : "reviews"}
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
                                            <Box sx={{ flex: 1, width: "100%" }}>
                                                <RatingBreakdownCompact ratings={reviewStats.breakdown} />
                                            </Box>
                                        </Stack>
                                    </Paper>

                                    {/* Sort */}
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                        <FormControl size="small" sx={{ minWidth: 140 }}>
                                            <InputLabel>Sort By</InputLabel>
                                            <Select
                                                value={reviewSortBy}
                                                label="Sort By"
                                                onChange={(e) => setReviewSortBy(e.target.value)}
                                                startAdornment={<SortRoundedIcon sx={{ fontSize: 18, mr: 0.5, color: "text.secondary" }} />}
                                                sx={{ fontSize: "0.85rem" }}
                                            >
                                                <MenuItem value="newest">Newest</MenuItem>
                                                <MenuItem value="oldest">Oldest</MenuItem>
                                                <MenuItem value="highest">Highest Rated</MenuItem>
                                                <MenuItem value="lowest">Lowest Rated</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    {/* Review list */}
                                    <Box
                                        sx={{
                                            opacity: reviewsLoading ? 0.35 : 1,
                                            transition: (t) => `opacity ${t.custom?.motion?.slow || 400}ms ${t.custom?.motion?.ease || "ease"}`,
                                            pointerEvents: reviewsLoading ? "none" : "auto",
                                        }}
                                    >
                                        {reviews.map((review, idx) => (
                                            <Box key={review.id || idx}>
                                                {idx > 0 && <Divider />}
                                                <SellerReviewCard
                                                    review={review}
                                                    sellerId={sellerIdForReviews}
                                                    isOwner={isOwnerAnyAccount}
                                                    viewer={viewer}
                                                    viewerId={viewerId}
                                                    onEditReview={handleEditReviewFromMenu}
                                                    onDeleteReview={(rv) => setDeleteReviewTarget(rv)}
                                                    onReportReview={(rvId) => { setReportReviewTarget(rvId); setReportReviewOpen(true); }}
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
                                            </Box>
                                        ))}
                                    </Box>
                                </>
                            ) : isOwnerAnyAccount ? (
                                <Box sx={(t) => ({ p: 3, borderRadius: 3, bgcolor: alpha(t.palette.text.primary, 0.02), border: "1px solid", borderColor: alpha(t.palette.divider, 0.6), textAlign: "center" })}>
                                    <RateReviewRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                    <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: 15 }}>No reviews on your listings yet</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                        When buyers leave reviews about their experience, they'll show up here.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={(t) => ({ p: 3, borderRadius: 3, bgcolor: alpha(t.palette.text.primary, 0.02), border: "1px solid", borderColor: alpha(t.palette.divider, 0.6), textAlign: "center" })}>
                                    <RateReviewRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                                    <Typography sx={{ fontWeight: 800, mb: 0.5, fontSize: 15 }}>No reviews yet</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                                        Be the first to review this seller and help others in your community!
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                </Paper>
            </Box>

            {/* 3-dot menu */}
            <SmartMenu disableScrollLock anchorEl={menuAnchor} open={menuOpen} onClose={() => setMenuAnchor(null)}
                       onClick={(e) => e.stopPropagation()}
                       anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}
                       PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: (t) => `0 12px 40px ${alpha(t.palette.text.primary, 0.15)}`, minWidth: 200, py: 0.5 } }}>
                <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                    <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy link" />
                </MenuItem>
                {isOwnerAnyAccount && <Divider sx={{ my: 0.5 }} />}
                {isOwnerAnyAccount && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to edit" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                        <MenuItem onClick={() => { if (!needsAccountSwitch) { setMenuAnchor(null); setOpenEdit(true); } }} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                            <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Edit" />
                        </MenuItem>
                    </span></Tooltip>
                )}
                {isOwnerAnyAccount && listing.status !== "sold" && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to mark sold" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                        <MenuItem onClick={() => { if (!needsAccountSwitch) { setMenuAnchor(null); setMarkSoldConfirmOpen(true); } }} disabled={needsAccountSwitch || isMarkingSold} sx={{ py: 1 }}>
                            <ListItemIcon><SellRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Mark as sold" />
                        </MenuItem>
                    </span></Tooltip>
                )}
                {isOwnerAnyAccount && listing.status === "sold" && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to relist" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                        <MenuItem onClick={() => { if (!needsAccountSwitch) { setMenuAnchor(null); setRelistConfirmOpen(true); } }} disabled={needsAccountSwitch || isMarkingSold} sx={{ py: 1 }}>
                            <ListItemIcon><ReplayRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Relist" />
                        </MenuItem>
                    </span></Tooltip>
                )}
                {isOwnerAnyAccount && (
                    <Tooltip title={needsAccountSwitch ? "Switch accounts to delete" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                        <MenuItem onClick={() => { if (!needsAccountSwitch) { setMenuAnchor(null); setOpenDelete(true); } }} disabled={needsAccountSwitch || isDeleting}
                                  sx={{ py: 1, color: needsAccountSwitch ? "text.disabled" : "error.main" }}>
                            <ListItemIcon sx={{ color: needsAccountSwitch ? "text.disabled" : "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Delete" />
                        </MenuItem>
                    </span></Tooltip>
                )}
                {!isOwnerAnyAccount && <Divider sx={{ my: 0.5 }} />}
                {!isOwnerAnyAccount && (
                    <MenuItem onClick={() => { setMenuAnchor(null); if (viewerId) { setReportOpen(true); } else { auth?.requireAuth?.(); } }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report" />
                    </MenuItem>
                )}
            </SmartMenu>

            <PhotoLightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} photos={isFallbackOnly ? [] : photos} activeIndex={lightboxIndex} onChangeIndex={setLightboxIndex} />
            <CreateListingModal open={openEdit} onClose={() => setOpenEdit(false)} onUpdated={handleUpdated} user={user} mode="edit" listingId={listing.id} initialListing={listing} sx={{ zIndex: 100001 }} />
            <DeleteListingConfirmDialog open={openDelete} onClose={() => setOpenDelete(false)} onConfirm={handleConfirmDelete} listingTitle={listing.title} sx={{ zIndex: 100001 }} />
            <ShareListingDialog open={shareOpen} onClose={() => setShareOpen(false)} listing={listing} viewer={viewer} sx={{ zIndex: 100001 }} />

            <ReportDialog
                open={reportOpen}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setReportOpen(false); }}
                onSubmit={async ({ reason, details }) => {
                    try {
                        await axios.post(`/api/marketplace/listings/${listing.id}/report`, { reason, details }, { withCredentials: true, headers: { ...getAccountHeaders() } });
                    } catch { /* dialog handles success state */ }
                }}
                title="Report Listing"
                sx={{ zIndex: 100001 }}
            />

            {/* Account switch dialog — shown when non-personal account taps Repost */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth sx={{ zIndex: 100001 }}>
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

            {/* Write Seller Review Dialog */}
            <WriteSellerReviewDialog
                open={writeReviewOpen}
                onClose={() => setWriteReviewOpen(false)}
                sellerId={sellerIdForReviews}
                sellerName={sellerName}
                listingId={listing?.id}
                existingReview={userReview}
                onSaved={loadSellerReviews}
                isOwnListing={isOwnerAnyAccount}
                isNonPersonalAccount={isNonPersonalAccount}
            />

            {/* Delete review confirmation dialog */}
            <Dialog open={Boolean(deleteReviewTarget)} onClose={() => { if (!deleteReviewSubmitting) setDeleteReviewTarget(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }} sx={{ zIndex: 100001 }}>
                <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
                    Delete Review?
                    <IconButton onClick={() => setDeleteReviewTarget(null)} disabled={deleteReviewSubmitting} sx={{ position: "absolute", top: 8, right: 8 }}><CloseRoundedIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">Are you sure you want to delete your review? This cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteReviewTarget(null)} disabled={deleteReviewSubmitting} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteReviewFromMenu} disabled={deleteReviewSubmitting}
                            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>{deleteReviewSubmitting ? "Deleting..." : "Delete"}</Button>
                </DialogActions>
            </Dialog>

            {/* Report review dialog */}
            <ReportDialog
                open={reportReviewOpen}
                onClose={(e, reason) => { if (reason === "backdropClick") return; setReportReviewOpen(false); setReportReviewTarget(null); }}
                onSubmit={handleReportReviewSubmit}
                title="Report Review"
                sx={{ zIndex: 100001 }}
            />

            <SuccessSnackbar {...successSnackbarProps} sx={{ position: 'fixed', zIndex: 1400 }} />

            {/* ═══ Quick Message Dialog ═══ */}
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
                <DialogContent sx={isMobile ? { flex: 1, overflowY: "auto", pb: 0 } : undefined}>
                    {quickMsgSuccess ? (
                        <Stack spacing={2} sx={{ py: 2, ...(isMobile && { flex: 1, justifyContent: "center" }) }}>
                            <Box sx={{ textAlign: "center" }}>
                                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                                <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.5 }}>Message Sent!</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    The seller will receive your message and get back to you soon.
                                </Typography>
                            </Box>
                            <Button variant="contained" fullWidth onClick={() => { setQuickMsgOpen(false); }}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, ...(isMobile && { py: 1.5, fontSize: "1rem" }) }}>Done</Button>
                        </Stack>
                    ) : (
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={
                                        <Avatar src={sellerAvatarUrl || undefined} imgProps={{ referrerPolicy: "no-referrer" }} sx={(t) => ({ width: 24, height: 24, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
                                            <PersonRoundedIcon sx={{ fontSize: 14 }} />
                                        </Avatar>
                                    }
                                    label={sellerName}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            {/* Listing context */}
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{listing?.title || "Listing"}</Typography>
                                <Typography variant="caption" color="text.secondary">{priceLabel}</Typography>
                            </Box>
                            <TextField
                                label="Message"
                                placeholder="Ask about availability, meetup details, condition..."
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
                            onClick={() => { setMarkSoldConfirmOpen(false); handleMarkSold(); }}
                            disabled={isMarkingSold}
                            startIcon={isMarkingSold ? <CircularProgress size={16} color="inherit" /> : <SellRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            {isMarkingSold ? "Marking\u2026" : "Mark as Sold"}
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
                            onClick={() => { setRelistConfirmOpen(false); handleRelist(); }}
                            disabled={isMarkingSold}
                            startIcon={isMarkingSold ? <CircularProgress size={16} color="inherit" /> : <ReplayRoundedIcon sx={{ fontSize: "16px !important" }} />}
                            sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2, px: 3 }}
                        >
                            {isMarkingSold ? "Relisting\u2026" : "Relist Item"}
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
                user={sellerId ? {
                    id: sellerId,
                    handle: sellerHandle,
                    firstName: seller?.firstName || sellerName?.split(" ")[0] || "",
                    lastName: seller?.lastName || sellerName?.split(" ").slice(1).join(" ") || "",
                    profile_picture: sellerAvatarUrl,
                    avatar_url: sellerAvatarUrl,
                } : null}
                isSelf={isSelf}
                following={false}
                onViewProfile={(u) => { const h = u?.handle || sellerHandle || sellerId; if (h) window.location.assign(`/${h}`); }}
            />
        </Box>
    );
}

ListingDetail.propTypes = { user: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) }) };
ListingDetail.defaultProps = { user: null };

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

function PhotoLightbox({ open, onClose, photos, activeIndex, onChangeIndex }) {
    if (!photos.length) return null;
    const currentUrl = photos[activeIndex] || "";
    const total = photos.length;
    const hasPrev = activeIndex > 0;
    const hasNext = activeIndex < total - 1;
    const isMobileLb = typeof window !== 'undefined' && window.innerWidth < 900;
    const handleKeyDown = (e) => { if (e.key === "ArrowLeft" && hasPrev) onChangeIndex(activeIndex - 1); if (e.key === "ArrowRight" && hasNext) onChangeIndex(activeIndex + 1); if (e.key === "Escape") onClose(); };
    return (
        <Dialog open={open} onClose={onClose} maxWidth={false} fullWidth={false} onKeyDown={handleKeyDown}
                fullScreen={isMobileLb}
                sx={{ zIndex: 100001 }}
                slotProps={{ backdrop: { sx: { bgcolor: (t) => alpha(t.palette.common.black, 0.88) } } }}
                PaperProps={{ sx: isMobileLb
                        ? { bgcolor: "#000", m: 0, borderRadius: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }
                        : { bgcolor: "transparent", boxShadow: "none", overflow: "visible", maxWidth: "92vw", maxHeight: "92vh", m: 1, borderRadius: 3, position: "relative" }
                }}>
            <IconButton onClick={onClose} aria-label="Close" sx={{ position: "absolute", top: isMobileLb ? 8 : -44, right: isMobileLb ? 8 : 0, color: "common.white", bgcolor: (t) => alpha(t.palette.common.white, 0.15), "&:hover": { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, zIndex: 10 }}><CloseRoundedIcon /></IconButton>
            {total > 1 && (
                <Typography sx={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700, zIndex: 2 }}>
                    {activeIndex + 1} / {total}
                </Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minWidth: isMobileLb ? undefined : { xs: 280, sm: 400, md: 520 }, minHeight: isMobileLb ? undefined : { xs: 280, sm: 400, md: 440 } }}>
                <Fade in key={currentUrl} timeout={200}>
                    <Box component="img" src={currentUrl} alt={`Photo ${activeIndex + 1}`} sx={{ maxWidth: isMobileLb ? "100vw" : "88vw", maxHeight: "80vh", objectFit: "contain", borderRadius: isMobileLb ? 0 : 2.5, display: "block", userSelect: "none" }} />
                </Fade>
                {hasPrev && <IconButton onClick={() => onChangeIndex(activeIndex - 1)} sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.white, 0.15), "&:hover": { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, width: 40, height: 40 }}><ChevronLeftRoundedIcon sx={{ fontSize: 28 }} /></IconButton>}
                {hasNext && <IconButton onClick={() => onChangeIndex(activeIndex + 1)} sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "common.white", bgcolor: (t) => alpha(t.palette.common.white, 0.15), "&:hover": { bgcolor: (t) => alpha(t.palette.common.white, 0.25) }, width: 40, height: 40 }}><ChevronRightRoundedIcon sx={{ fontSize: 28 }} /></IconButton>}
            </Box>
            {!isMobileLb && total > 1 && (
                <Stack spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <Stack direction="row" spacing={0.75} justifyContent="center">
                        {photos.map((url, idx) => (
                            <Box key={url} onClick={() => onChangeIndex(idx)}
                                 sx={{ width: 48, height: 48, borderRadius: 1.5, overflow: "hidden", cursor: "pointer", flexShrink: 0, border: "2px solid", borderColor: (t) => idx === activeIndex ? t.palette.common.white : alpha(t.palette.common.white, 0.25), opacity: idx === activeIndex ? 1 : 0.6, transition: (t) => `all ${t.custom.motion.fast}ms ${t.custom.motion.ease}`, "&:hover": { opacity: 1 } }}>
                                <Box component="img" src={url} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Dialog>
    );
}

function DetailSkeleton() {
    return (
        <Box>
            <Box sx={{ height: 4, bgcolor: "grey.200" }} />
            <Box sx={{ px: 3, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}><Skeleton height={32} width="30%" sx={{ borderRadius: 999 }} /></Box>
            <Skeleton variant="rectangular" height={360} />
            <Box sx={{ px: 3, py: 3 }}>
                <Stack spacing={2.5}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Skeleton variant="circular" width={52} height={52} />
                        <Box sx={{ flex: 1 }}><Skeleton height={18} width="35%" /><Skeleton height={14} width="20%" sx={{ mt: 0.5 }} /></Box>
                    </Stack>
                    <Skeleton height={30} width="65%" />
                    <Skeleton height={28} width="30%" />
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Skeleton variant="rounded" width={100} height={28} sx={{ borderRadius: 999 }} />
                        <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: 999 }} />
                        <Skeleton variant="rounded" width={120} height={28} sx={{ borderRadius: 999 }} />
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                        <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2.5 }} />
                        <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2.5 }} />
                        <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2.5 }} />
                        <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2.5 }} />
                    </Box>
                    <Skeleton variant="rounded" height={140} sx={{ borderRadius: 2.5 }} />
                </Stack>
            </Box>
        </Box>
    );
}
