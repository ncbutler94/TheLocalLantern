// src/pages/marketplace/components/ListingCard.jsx
//
// REDESIGNED: image-top hero layout with 4:3 product photo, overlaid price
// badge, floating save button & condition chip, hover zoom on image.
//
// All business logic preserved: optimistic fav/repost, account-aware
// ownership, 3-dot menu, copy link toast, UserCardPopover.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
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
    MenuItem,
    Rating,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DirectionsRoundedIcon from "@mui/icons-material/DirectionsRounded";

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

import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import UserCardPopover from "../../../components/UserCardPopover";
import ShareListingDialog from "../../../components/ShareListingDialog";
import ReportContentDialog from "../../../components/ReportContentDialog";
import SmartMenu from "../../../components/SmartMenu";
import SuccessSnackbar from "../../../components/SuccessSnackbar";
import { getAccountHeaders } from "../../../utils/getAccountHeadersStatic";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";
import PhotosUploadSection from "../../../components/PhotosUploadSection";

/* ── GCS upload helpers (same pattern as ListingDetail / MarketplaceListingDetailPanel) ── */
async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder, fileName, contentType }) });
    if (!res.ok) throw new Error("Failed to get upload URL");
    return res.json();
}

async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!res.ok) throw new Error("Upload failed");
}

const CATEGORY_ICONS = {
    Appliances: KitchenRoundedIcon, "Arts & Crafts": PaletteRoundedIcon,
    Automotive: DirectionsCarRoundedIcon, "Baby & Kids": ChildFriendlyRoundedIcon,
    "Bikes & Scooters": PedalBikeRoundedIcon, "Books & Media": MenuBookRoundedIcon,
    "Camping & Outdoors": HikingRoundedIcon, "Cell Phones": SmartphoneRoundedIcon,
    "Clothing & Shoes": CheckroomRoundedIcon, Collectibles: EmojiEventsRoundedIcon,
    "Computers & Tablets": LaptopRoundedIcon, Electronics: DevicesRoundedIcon,
    "Farm & Garden": YardRoundedIcon, "Free Stuff": VolunteerActivismRoundedIcon,
    Furniture: ChairRoundedIcon, "Health & Beauty": FaceRetouchingNaturalRoundedIcon,
    "Home Improvement": HandymanRoundedIcon, Household: HomeRoundedIcon,
    "Jewelry & Accessories": DiamondRoundedIcon, "Musical Instruments": MusicNoteRoundedIcon,
    "Office Supplies": BusinessCenterRoundedIcon, "Pet Supplies": PetsRoundedIcon,
    "Sporting Goods": FitnessCenterRoundedIcon, Tickets: ConfirmationNumberRoundedIcon,
    Tools: ConstructionRoundedIcon, "Toys & Games": SmartToyRoundedIcon,
    "Video Games": SportsEsportsRoundedIcon, Other: CategoryRoundedIcon,
    "Yard Sales": LocalMallRoundedIcon,
};

/* ── Yard sale date/time display helpers ── */

function parseYardSaleDateStored(stored) {
    if (!stored) return ["", ""];
    const raw = String(stored);
    if (raw.includes("|")) {
        const parts = raw.split("|");
        return [parts[0] || "", parts[1] || ""];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return [raw, ""];
    return [raw, ""];
}

function parseYardSaleHoursStored(stored) {
    if (!stored) return ["", ""];
    const raw = String(stored);
    if (raw.includes("|")) {
        const parts = raw.split("|");
        return [parts[0] || "", parts[1] || ""];
    }
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

function formatYardSaleDateDisplay(storedDate, storedHours) {
    const [startD, endD] = parseYardSaleDateStored(storedDate);
    const [startT, endT] = parseYardSaleHoursStored(storedHours);
    const datePart = startD
        ? (endD && endD !== startD ? `${formatDateShort(startD)} \u2013 ${formatDateShort(endD)}` : formatDateShort(startD))
        : String(storedDate || "");
    const timePart = startT
        ? (endT ? `${formatTimeShort(startT)} \u2013 ${formatTimeShort(endT)}` : formatTimeShort(startT))
        : String(storedHours || "");
    if (datePart && timePart) return `${datePart} \u2022 ${timePart}`;
    return datePart || timePart || "";
}

/** Returns true if the yard sale's latest date (end or start) is in the past. */
function isYardSalePast(storedDate) {
    if (!storedDate) return false;
    const [startD, endD] = parseYardSaleDateStored(storedDate);
    const relevantDate = endD || startD;
    if (!relevantDate) return false;
    const parts = String(relevantDate).split("-").map(Number);
    if (parts.length !== 3) return false;
    const [y, m, d] = parts;
    // End of that day (23:59:59)
    const dt = new Date(y, m - 1, d, 23, 59, 59);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() < Date.now();
}

/* ── Yard sale map helpers (for card hero when no photos — matches detail panel embed) ── */

function getYardSaleMapSrc(listing) {
    const lat = listing?.latitude != null ? Number(listing.latitude) : null;
    const lng = listing?.longitude != null ? Number(listing.longitude) : null;
    const hasPin = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);
    if (!hasPin) return null;
    const key = process.env.REACT_APP_GOOGLE_API_KEY || "";
    const hasAddress = Boolean(listing?.yardSaleAddress);
    if (hasAddress) {
        const locationQuery = [listing.yardSaleAddress, listing.city, listing.county ? `${listing.county} County` : "", "Alabama"].filter(Boolean).join(", ");
        return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(locationQuery)}&zoom=14`;
    }
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${lat},${lng}&zoom=11`;
}

function getYardSaleDirectionsUrl(listing) {
    const hasAddress = Boolean(listing?.yardSaleAddress);
    const parts = [hasAddress ? listing.yardSaleAddress : null, listing?.city, listing?.county ? `${listing.county} County` : "", "Alabama"].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}`;
}
const FALLBACK_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23bbb' font-family='Arial' font-size='18'%3ENo photo%3C/text%3E%3C/svg%3E";

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
    if (priceModel === "trade") return "Trade";
    if (priceModel === "free") return "Free";
    return null;
}

function formatLocation(listing) {
    if (listing?.isStatewide) return "Statewide";
    const parts = [];
    if (listing?.city) parts.push(listing.city);
    if (listing?.county) parts.push(`${listing.county} County`);
    return parts.length ? parts.join(", ") : "";
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

function getImageSrc(listing) {
    if (!listing) return FALLBACK_IMG;
    if (listing.coverPhotoUrl) return listing.coverPhotoUrl;
    if (listing.photoUrl) return listing.photoUrl;
    const fromPhotos = Array.isArray(listing.photos) ? listing.photos[0] : null;
    if (fromPhotos) return typeof fromPhotos === "string" ? fromPhotos : fromPhotos?.url || FALLBACK_IMG;
    return FALLBACK_IMG;
}

function getPhotoCount(listing) {
    if (!listing) return 0;
    if (Array.isArray(listing.photos)) return listing.photos.length;
    return listing.coverPhotoUrl || listing.photoUrl ? 1 : 0;
}

function isNewListing(isoString) {
    if (!isoString) return false;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return false;
    return (Date.now() - d.getTime()) < 48 * 60 * 60 * 1000;
}

const fmtCount = (n = 0) => {
    const x = Number(n) || 0;
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(x % 1_000_000 ? 1 : 0).replace(/\.0$/, "")}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(x % 1_000 ? 1 : 0).replace(/\.0$/, "")}k`;
    return String(x);
};

/* ── Avatar validation — treat platform default avatars as "no avatar" ── */

function isDefaultAvatar(url) {
    if (!url) return true;
    const s = String(url).trim();
    if (!s || s === "null" || s === "undefined") return true;
    if (s.includes("default_avatar") || s.includes("default_business") || s.includes("default_logo")) return true;
    return false;
}

/* ── Owner detection ── */

function useListingOwnership(listing, viewer) {
    const { isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount } = useActiveAccount();
    return useMemo(() => {
        if (!viewer || !listing) return { isOwnerAnyAccount: false, isActiveAccountOwner: false, needsAccountSwitch: false };

        const isNonPersonalProfile = isBusinessAccount || isArtistAccount;
        const sellerHandle = String(listing?.sellerHandle || listing?.seller?.handle || "").toLowerCase().trim();

        // When on a business/artist profile, use ONLY that profile's identifier.
        // Do NOT fall back to viewer.handle (the personal account) — if the active
        // profile didn't post this listing, the user is not the owner from this context.
        const activeIdentifier = isNonPersonalProfile
            ? String(activeAccount?.slug || activeAccount?.handle || "").toLowerCase().trim()
            : String(viewer?.handle || "").toLowerCase().trim();

        // If backend returned isOwner, validate against active profile context.
        // The backend may set isOwner based on the base user session rather than
        // the active profile, so we guard against that here.
        if (listing?.isOwner != null) {
            const backendOwner = Boolean(listing.isOwner);
            if (isNonPersonalProfile) {
                // On a non-personal profile: only trust backend isOwner if the
                // active profile handle actually matches the seller
                const isActiveAccountOwner = Boolean(activeIdentifier && sellerHandle && activeIdentifier === sellerHandle);
                return { isOwnerAnyAccount: backendOwner, isActiveAccountOwner, needsAccountSwitch: backendOwner && !isActiveAccountOwner };
            }
            return { isOwnerAnyAccount: backendOwner, isActiveAccountOwner: backendOwner, needsAccountSwitch: false };
        }

        // Client-side fallback
        let isActiveAccountOwner = false;
        if (activeIdentifier && sellerHandle && activeIdentifier === sellerHandle) {
            isActiveAccountOwner = true;
        }

        return { isOwnerAnyAccount: isActiveAccountOwner, isActiveAccountOwner, needsAccountSwitch: false };
    }, [viewer, listing, isBusinessAccount, isArtistAccount, activeBusinessId, activeArtistId, activeAccount]);
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

// Client-side per-seller message tracker — prevents opening the message
// dialog when the user has already hit the per-recipient limit.
const _sellerMsgTracker = new Map();
const _SELLER_MSG_WINDOW = 10 * 60 * 1000; // 10 min (matches backend)
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

export default function ListingCard({
                                        listing, onSelect, onFavorite, onRepost, onContact,
                                        onEdit, onDelete, onFlag, onMarkSold, onRelist, onShowOnMap, selected = false, user,
                                    }) {
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const auth = useAuth();
    const { accountCacheKey, isBusinessAccount, isArtistAccount } = useActiveAccount();
    const lcTheme = useTheme();
    const isMobile = useMediaQuery(lcTheme.breakpoints.down("md"));
    const viewer = user || auth?.user || null;
    const { isOwnerAnyAccount, needsAccountSwitch } = useListingOwnership(listing, viewer);
    const isNonPersonalAccount = isBusinessAccount || isArtistAccount;

    // Account switch dialog — shown when non-personal account taps Repost
    const [accountSwitchOpen, setAccountSwitchOpen] = useState(false);

    // Optimistic fav/repost
    const [acctGen, setAcctGen] = useState(0);
    const acctGenRef = useRef(0);
    const prevAcctKeyRef = useRef(accountCacheKey);
    const [optFav, setOptFav] = useState(null);
    const [optFavDelta, setOptFavDelta] = useState(0);
    const [optRepost, setOptRepost] = useState(null);
    const [optRepostDelta, setOptRepostDelta] = useState(0);

    // Optimistic view count — bumps +1 on first card click (detail open records a view)
    const [optViewDelta, setOptViewDelta] = useState(0);
    const viewBumpedRef = useRef(false);

    // Local seller review stats — updated via custom event when reviews change in the detail panel
    const [localReviewOverride, setLocalReviewOverride] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            const { sellerId: evtSellerId, avgRating, totalCount } = e.detail || {};
            const thisSellerId = listing?.sellerId || listing?.seller?.id || listing?.userId || listing?.user_id || null;
            if (thisSellerId && evtSellerId && String(thisSellerId) === String(evtSellerId)) {
                setLocalReviewOverride({ avgRating, totalCount });
            }
        };
        window.addEventListener("ll:marketplace:seller:reviewsChanged", handler);
        return () => window.removeEventListener("ll:marketplace:seller:reviewsChanged", handler);
    }, [listing?.sellerId, listing?.seller?.id, listing?.userId, listing?.user_id]);

    useEffect(() => {
        if (prevAcctKeyRef.current !== accountCacheKey) {
            prevAcctKeyRef.current = accountCacheKey;
            const next = acctGenRef.current + 1;
            acctGenRef.current = next;
            setAcctGen(next);
            setOptFav(null); setOptFavDelta(0); setOptRepost(null); setOptRepostDelta(0);
        }
    }, [accountCacheKey]);

    const localFav = (optFav !== null && optFav.gen === acctGen) ? optFav.value : Boolean(listing?.isFavorited);
    const localFavCount = Math.max(0, (Number(listing?.favoritesCount) || 0) + optFavDelta);
    const localReposted = (optRepost !== null && optRepost.gen === acctGen) ? optRepost.value : Boolean(listing?.isReposted);
    const localRepostCount = Math.max(0, (Number(listing?.repostsCount) || 0) + optRepostDelta);

    const prevFavCountRef = useRef(listing?.favoritesCount);
    const prevRepostCountRef = useRef(listing?.repostsCount);
    const prevViewCountRef = useRef(listing?.viewsCount);
    const prevSellerReviewCountRef = useRef(listing?.sellerReviewCount ?? listing?.seller?.reviewCount);
    useEffect(() => {
        if (prevFavCountRef.current !== listing?.favoritesCount) { prevFavCountRef.current = listing?.favoritesCount; setOptFavDelta(0); setOptFav(null); }
        if (prevRepostCountRef.current !== listing?.repostsCount) { prevRepostCountRef.current = listing?.repostsCount; setOptRepostDelta(0); setOptRepost(null); }
        if (prevViewCountRef.current !== listing?.viewsCount) { prevViewCountRef.current = listing?.viewsCount; setOptViewDelta(0); }
        const newSellerReviewCount = listing?.sellerReviewCount ?? listing?.seller?.reviewCount;
        if (prevSellerReviewCountRef.current !== newSellerReviewCount) { prevSellerReviewCountRef.current = newSellerReviewCount; setLocalReviewOverride(null); }
    }, [listing?.favoritesCount, listing?.repostsCount, listing?.viewsCount, listing?.sellerReviewCount, listing?.seller?.reviewCount]);

    const [menuAnchor, setMenuAnchor] = useState(null);
    const menuOpen = Boolean(menuAnchor);
    const [copyLinkToast, setCopyLinkToast] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

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

    // User card popover
    const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);

    const handleSellerClick = useCallback((e) => {
        e.stopPropagation();
        setPopoverAnchorEl(e.currentTarget);
    }, []);
    const handlePopoverClose = useCallback(() => setPopoverAnchorEl(null), []);
    const handleViewProfile = useCallback((u) => {
        handlePopoverClose();
        const profilePath = u?.handle || listing?.sellerHandle || listing?.seller?.handle || listing?.sellerId;
        if (profilePath) window.location.assign(`/${profilePath}`);
    }, [handlePopoverClose, listing]);

    const sellerId = listing?.sellerId || listing?.seller?.id || listing?.userId || listing?.user_id || null;
    const isSelf = Boolean(viewer && sellerId && Number(viewer.id) === Number(sellerId));

    const handleMenuOpen = useCallback((e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }, []);
    const handleMenuClose = useCallback((e) => { e?.stopPropagation?.(); setMenuAnchor(null); }, []);

    // Derived
    const imageSrc = imgError ? FALLBACK_IMG : getImageSrc(listing);
    const hasPhoto = !imgError && imageSrc !== FALLBACK_IMG;
    const photoCount = getPhotoCount(listing);
    const isSold = listing?.status === "sold";
    const locationLabel = formatLocation(listing);
    const priceLabel = formatPrice(listing?.priceCents, listing?.priceModel);
    const contextLabel = pricingContextLabel(listing?.priceModel);
    const postedLabel = timeAgo(listing?.createdAt);
    const viewCount = Math.max(0, (Number(listing?.viewsCount) || 0) + optViewDelta);
    const sellerHandle = listing?.sellerHandle || listing?.seller?.handle || "";
    const sellerIsVerified = Boolean(
        listing?.sellerIsVerified === true || listing?.sellerIsVerified === 1 || listing?.sellerIsVerified === "1" ||
        listing?.seller_is_verified === true || listing?.seller_is_verified === 1 || listing?.seller_is_verified === "1" ||
        listing?.seller?.is_verified === true || listing?.seller?.is_verified === 1 || listing?.seller?.is_verified === "1" ||
        listing?.seller?.isVerified === true || listing?.seller?.isVerified === 1 || listing?.seller?.isVerified === "1"
    );
    const sellerAvgRating = localReviewOverride ? localReviewOverride.avgRating : (listing?.sellerAvgRating ?? listing?.seller?.avgRating ?? null);
    const sellerReviewCount = localReviewOverride ? localReviewOverride.totalCount : (listing?.sellerReviewCount ?? listing?.seller?.reviewCount ?? 0);
    const isNew = !isSold && isNewListing(listing?.createdAt);
    const CatIcon = CATEGORY_ICONS[listing?.category] || CategoryRoundedIcon;
    const isYardSale = listing?.category === "Yard Sales";
    const yardSaleDateDisplay = isYardSale ? formatYardSaleDateDisplay(listing?.yardSaleDate, listing?.yardSaleHours) : "";
    const yardSalePast = isYardSale && isYardSalePast(listing?.yardSaleDate);
    const yardSaleMapSrc = isYardSale && !hasPhoto ? getYardSaleMapSrc(listing) : null;
    const yardSaleDirectionsUrl = isYardSale && !hasPhoto ? getYardSaleDirectionsUrl(listing) : null;
    const showYardSaleMap = Boolean(yardSaleMapSrc);
    const tooltipSx = { fontSize: 13, fontWeight: 600, px: 1.25, py: 0.75, maxWidth: 240 };

    const sellerName = listing?.sellerName || listing?.seller?.name || "Seller";
    const rawSellerAvatar = listing?.sellerAvatarUrl || listing?.seller?.avatarUrl || "";
    const sellerAvatarUrl = isDefaultAvatar(rawSellerAvatar) ? "" : rawSellerAvatar;

    /* ── Quick Message Dialog handlers ── */
    const openQuickMsg = (e) => {
        e?.stopPropagation?.();
        if (!viewer) { auth?.requireAuth?.(); return; }
        // Pre-check: if already at limit for this seller, show limit dialog instead
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

    const pillSx = {
        display: "inline-flex", alignItems: "center", gap: 0.5, px: 1, py: 0.4,
        borderRadius: 999, cursor: "pointer", userSelect: "none",
        transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}, transform ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
        "&:active": { transform: "scale(0.97)" },
    };
    const countSx = { fontSize: 12.5, fontWeight: 700, color: "text.secondary", lineHeight: 1 };

    // Menu handlers
    const handleCopyLink = useCallback((e) => {
        e?.stopPropagation?.(); handleMenuClose(e);
        const url = `${window.location.origin}/marketplace/${listing?.id}`;
        navigator.clipboard.writeText(url).then(() => setCopyLinkToast(true)).catch(() => setCopyLinkToast(true));
    }, [listing]);

    const handleEditClick = useCallback((e) => { e?.stopPropagation?.(); if (needsAccountSwitch) return; handleMenuClose(e); onEdit?.(listing); }, [listing, onEdit, needsAccountSwitch]);
    const handleDeleteClick = useCallback((e) => { e?.stopPropagation?.(); if (needsAccountSwitch) return; handleMenuClose(e); onDelete?.(listing); }, [listing, onDelete, needsAccountSwitch]);
    const handleFlagClick = useCallback((e) => { e?.stopPropagation?.(); handleMenuClose(e); onFlag?.(listing); }, [listing, onFlag]);
    const handleMarkSoldClick = useCallback((e) => { e?.stopPropagation?.(); if (needsAccountSwitch) return; handleMenuClose(e); onMarkSold?.(listing); }, [listing, onMarkSold, needsAccountSwitch]);
    const handleRelistClick = useCallback((e) => { e?.stopPropagation?.(); if (needsAccountSwitch) return; handleMenuClose(e); onRelist?.(listing); }, [listing, onRelist, needsAccountSwitch]);

    return (
        <>
            <Card
                elevation={0}
                onClick={() => {
                    if (onSelect) {
                        // Optimistically bump view count on first selection (detail page records a unique view)
                        if (!viewBumpedRef.current) {
                            viewBumpedRef.current = true;
                            setOptViewDelta(1);
                        }
                        onSelect(listing);
                    }
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={(e) => { if (onSelect && (e.key === "Enter" || e.key === " ")) onSelect(listing); }}
                sx={(t) => ({
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    isolation: "isolate",
                    borderRadius: { xs: 0, sm: "14px" },
                    border: {
                        xs: "none",
                        sm: `1px solid ${selected
                            ? alpha(t.palette.secondary.main, 0.55)
                            : alpha(t.palette.text.primary, 0.08)}`,
                    },
                    bgcolor: t.palette.background.paper,
                    overflow: "hidden",
                    cursor: onSelect ? "pointer" : "default",
                    boxShadow: { xs: "none", sm: selected ? t.custom.shadows.md : t.custom.shadows.xs },
                    transition: (t) => `box-shadow ${t.custom.motion.slow}ms cubic-bezier(0.4,0,0.2,1), border-color ${t.custom.motion.base}ms ${t.custom.motion.ease}, transform ${t.custom.motion.slow}ms cubic-bezier(0.4,0,0.2,1)`,
                    transform: "translateY(0)",
                    ...(isHovered && !selected ? {
                        boxShadow: { xs: "none", sm: `0 12px 36px ${alpha(t.palette.text.primary, 0.12)}` },
                    } : {}),
                    "&:focus-visible": { outline: `2px solid ${alpha(t.palette.primary.main, 0.45)}`, outlineOffset: 2 },
                    opacity: isSold ? 0.88 : 1,
                })}
            >
                {/* ═══════════ HERO IMAGE AREA ═══════════ */}
                <Box
                    sx={{
                        position: "relative",
                        aspectRatio: "4 / 3",
                        overflow: "hidden",
                        bgcolor: (t) => alpha(t.palette.secondary.main, 0.06),
                        flexShrink: 0,
                    }}
                >
                    {showYardSaleMap ? (
                        /* Yard sale with no photos — show Google Maps embed (same as detail panel) */
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                if (yardSaleDirectionsUrl) window.open(yardSaleDirectionsUrl, "_blank");
                            }}
                            sx={{ width: "100%", height: "100%", position: "relative", cursor: "pointer" }}
                        >
                            <Box
                                component="iframe"
                                src={yardSaleMapSrc}
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    border: 0,
                                    display: "block",
                                    pointerEvents: "none",
                                    filter: isSold ? "grayscale(0.35) brightness(0.92)" : "none",
                                }}
                                loading="lazy"
                                allowFullScreen
                                title="Yard sale location"
                            />
                            {/* "Get Directions" pill overlay */}
                            <Box sx={(t) => ({
                                position: "absolute", bottom: 10, right: 10,
                                display: "flex", alignItems: "center", gap: 0.5,
                                px: 1.25, py: 0.5, borderRadius: 999,
                                bgcolor: alpha(t.palette.common.white, 0.95),
                                boxShadow: `0 2px 8px ${alpha(t.palette.text.primary, 0.15)}`,
                                zIndex: 3,
                            })}>
                                <DirectionsRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                <Typography sx={{ fontSize: 11, fontWeight: 800, color: "primary.main" }}>Get Directions</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box
                            component="img"
                            src={imageSrc}
                            alt={listing?.title || "Listing"}
                            loading="lazy"
                            onError={() => setImgError(true)}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                transition: (t) => `transform ${t.custom.motion.slow}ms cubic-bezier(0.4,0,0.2,1)`,
                                transform: isHovered && hasPhoto ? "scale(1.04)" : "scale(1)",
                                filter: isSold ? "grayscale(0.35) brightness(0.92)" : "none",
                            }}
                        />
                    )}


                    {/* ── 3-dot menu button (top-right) ── */}

                    {/* ── Photo count badge (bottom-right on image) ── */}
                    {photoCount > 1 && (
                        <Stack
                            direction="row"
                            spacing={0.4}
                            alignItems="center"
                            sx={{
                                position: "absolute",
                                bottom: 10,
                                right: 10,
                                zIndex: 3,
                                bgcolor: (t) => alpha(t.palette.common.black, 0.55),
                                backdropFilter: "blur(4px)",
                                borderRadius: 999,
                                px: 0.9,
                                py: 0.3,
                            }}
                        >
                            <CameraAltRoundedIcon sx={{ fontSize: 13, color: "common.white" }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: "common.white", lineHeight: 1 }}>
                                {photoCount}
                            </Typography>
                        </Stack>
                    )}

                    {/* ── SOLD overlay ── */}
                    {isSold && (
                        <Box
                            sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: (t) => alpha(t.palette.common.black, 0.35),
                            }}
                        >
                            <Chip
                                label="SOLD"
                                sx={{
                                    fontWeight: 950,
                                    fontSize: 14,
                                    height: 32,
                                    px: 1,
                                    bgcolor: (t) => alpha(t.palette.background.paper, 0.95),
                                    color: "error.main",
                                    letterSpacing: "0.08em",
                                    boxShadow: (t) => `0 2px 12px ${alpha(t.palette.text.primary, 0.2)}`,
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* ═══════════ CARD BODY ═══════════ */}
                <Box sx={{ px: 1.75, pt: 1.25, pb: 1.5, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

                    {/* ── Price row ── */}
                    {!isYardSale && (
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
                            <Typography
                                sx={(t) => ({
                                    fontWeight: 950,
                                    fontSize: { xs: 17, sm: 19 },
                                    lineHeight: 1.2,
                                    color: isSold ? t.palette.text.disabled : t.palette.success.dark,
                                    textDecoration: isSold ? "line-through" : "none",
                                    letterSpacing: "-0.3px",
                                })}
                            >
                                {priceLabel}
                            </Typography>
                            {contextLabel && (
                                <Typography
                                    sx={{
                                        fontSize: 9.5,
                                        fontWeight: 800,
                                        color: "text.secondary",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                        lineHeight: 1,
                                    }}
                                >
                                    {contextLabel}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Title + 3-dot row */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                        <Typography
                            sx={{
                                fontWeight: 950,
                                color: "text.primary",
                                lineHeight: 1.2,
                                fontSize: { xs: 14, sm: 15 },
                                flex: 1,
                                minWidth: 0,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                overflowWrap: "anywhere",
                                wordBreak: "break-word",
                            }}
                        >
                            {listing?.title || "Untitled listing"}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            aria-label="More options"
                            sx={{ flexShrink: 0, mt: -0.5, mr: -0.75, color: "text.secondary" }}
                        >
                            <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Category chip — below title */}
                    {listing?.category && (
                        <Chip
                            icon={<CatIcon sx={{ fontSize: 13 }} />}
                            label={listing.category === "Yard Sales" ? "Yard Sale" : listing.category}
                            size="small"
                            sx={(t) => ({
                                alignSelf: "flex-start",
                                mt: 0.75,
                                height: 24,
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                color: "primary.main",
                                border: "1px solid",
                                borderColor: alpha(t.palette.primary.main, 0.16),
                                "& .MuiChip-icon": { color: "primary.main", ml: 0.3 },
                                "& .MuiChip-label": { px: 0.5, whiteSpace: "normal" },
                            })}
                        />
                    )}

                    {/* Condition + NEW indicator row */}
                    {(listing?.condition || isNew) && !isYardSale && (
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.6, flexWrap: "wrap" }}>
                            {listing?.condition && (
                                <Chip
                                    label={`Condition: ${listing.condition}`}
                                    size="small"
                                    sx={(t) => ({
                                        height: 22,
                                        fontSize: 10.5,
                                        fontWeight: 800,
                                        borderRadius: 999,
                                        bgcolor: alpha(t.palette.text.primary, 0.05),
                                        color: t.palette.text.secondary,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.text.primary, 0.1),
                                        "& .MuiChip-label": { px: 0.75 },
                                    })}
                                />
                            )}
                            {isNew && (
                                <Chip
                                    label="New Listing"
                                    size="small"
                                    sx={(t) => ({
                                        height: 22,
                                        fontSize: 10,
                                        fontWeight: 900,
                                        borderRadius: 999,
                                        letterSpacing: "0.03em",
                                        bgcolor: alpha(t.palette.success.main, 0.1),
                                        color: t.palette.success.dark,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.success.main, 0.22),
                                        "& .MuiChip-label": { px: 0.75 },
                                    })}
                                />
                            )}
                        </Stack>
                    )}

                    {/* Location — for non-yard-sales show city/county */}
                    {!isYardSale && locationLabel && (
                        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.6 }}>
                            <LocationOnRoundedIcon sx={{ fontSize: 13, color: "primary.main" }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "primary.main" }}>
                                {locationLabel}
                            </Typography>
                        </Stack>
                    )}

                    {/* Yard sale date/hours in body */}
                    {isYardSale && yardSaleDateDisplay && (
                        <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.4 }}>
                            <EventRoundedIcon sx={{ fontSize: 13, color: yardSalePast ? "text.disabled" : "info.main" }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: yardSalePast ? "text.disabled" : "info.main" }}>
                                {yardSaleDateDisplay}
                            </Typography>
                            {yardSalePast && (
                                <Typography sx={(t) => ({ fontSize: 10, fontWeight: 800, color: t.palette.error.main, textTransform: "uppercase", letterSpacing: "0.03em", ml: 0.25 })}>
                                    Ended
                                </Typography>
                            )}
                        </Stack>
                    )}

                    {/* Yard sale: single green clickable address row */}
                    {isYardSale && (listing?.yardSaleAddress || locationLabel) && (
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowOnMap?.(listing);
                            }}
                            sx={(t) => ({
                                display: "inline-flex",
                                alignItems: "center",
                                alignSelf: "flex-start",
                                gap: 0.4,
                                mt: 0.5,
                                px: 0.8,
                                py: 0.3,
                                borderRadius: 1,
                                bgcolor: alpha(t.palette.success.main, 0.08),
                                border: "1px solid",
                                borderColor: alpha(t.palette.success.main, 0.18),
                                cursor: "pointer",
                                transition: `background-color 150ms ease, border-color 150ms ease`,
                                "&:hover": {
                                    bgcolor: alpha(t.palette.success.main, 0.16),
                                    borderColor: alpha(t.palette.success.main, 0.35),
                                },
                            })}
                        >
                            <LocationOnRoundedIcon sx={{ fontSize: 13, color: "success.dark" }} />
                            <Typography
                                sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: "success.dark",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {listing?.yardSaleAddress
                                    ? `${listing.yardSaleAddress}${locationLabel ? `, ${locationLabel}` : ""}`
                                    : locationLabel
                                }
                            </Typography>
                        </Box>
                    )}

                    {/* Seller row — pushed to bottom of body */}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: "auto",
                            pt: 1.5,
                            gap: 1,
                        }}
                    >
                        <Box
                            onClick={handleSellerClick}
                            sx={{
                                display: "inline-flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: "0 1 auto",
                                cursor: "pointer", borderRadius: 2, p: 0.5, m: -0.5,
                                transition: (t) => `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.04) },
                            }}
                        >
                            <Avatar
                                src={sellerAvatarUrl || undefined}
                                alt={listing?.sellerName || ""}
                                sx={(t) => ({
                                    width: 30,
                                    height: 30,
                                    border: "2px solid",
                                    borderColor: alpha(t.palette.primary.main, 0.12),
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                    color: t.palette.primary.main,
                                    flexShrink: 0,
                                })}
                            >
                                <PersonRoundedIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={0.35} alignItems="center">
                                    <Typography
                                        sx={{
                                            fontWeight: 800,
                                            color: (t) => alpha(t.palette.text.primary, 0.78),
                                            lineHeight: 1.1,
                                            fontSize: 12,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 1,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {listing?.sellerName || "User"}
                                    </Typography>
                                    {sellerIsVerified ? (
                                        <Tooltip title="Verified" arrow>
                                            <VerifiedRoundedIcon sx={{ fontSize: 12, color: "primary.main", flexShrink: 0 }} />
                                        </Tooltip>
                                    ) : null}
                                </Stack>
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.1 }}>
                                    {sellerHandle && (
                                        <Typography sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.1 }}>
                                            @{sellerHandle}
                                        </Typography>
                                    )}
                                    {postedLabel && (
                                        <Stack direction="row" spacing={0.25} alignItems="center">
                                            <AccessTimeRoundedIcon sx={{ fontSize: 9, color: "text.disabled" }} />
                                            <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: "text.disabled", lineHeight: 1 }}>
                                                {postedLabel}
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>
                                {sellerAvgRating !== null && sellerReviewCount > 0 && (
                                    <Stack direction="row" spacing={0.3} alignItems="center" sx={{ mt: 0.1 }}>
                                        <Rating
                                            value={sellerAvgRating}
                                            precision={0.1}
                                            readOnly
                                            size="small"
                                            sx={{ "& .MuiRating-icon": { fontSize: 10 } }}
                                        />
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary" }}>
                                            ({sellerReviewCount})
                                        </Typography>
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* ═══════════ ACTION BAR ═══════════ */}
                <CardActions sx={(t) => ({ px: 1.5, pt: 0, pb: 0.75, mt: 0, borderTop: { xs: "none", sm: "1px solid" }, borderColor: { xs: "transparent", sm: alpha(t.palette.text.primary, 0.06) } })}>
                    <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 0.25 }}>
                        <Tooltip title={localFav ? "Unsave" : "Save listing"}>
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const next = !localFav;
                                    setOptFav({ gen: acctGenRef.current, value: next });
                                    setOptFavDelta((prev) => prev + (next ? 1 : -1));
                                    onFavorite?.(listing);
                                }}
                                sx={pillSx}
                            >
                                {localFav
                                    ? <BookmarkRoundedIcon sx={{ fontSize: 22, color: "secondary.main" }} />
                                    : <BookmarkBorderRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                }
                                {localFavCount > 0 && (
                                    <Typography sx={{ ...countSx, color: localFav ? "secondary.main" : "text.secondary" }}>
                                        {fmtCount(localFavCount)}
                                    </Typography>
                                )}
                            </Box>
                        </Tooltip>
                        <Tooltip title={localReposted ? "Undo repost" : isNonPersonalAccount ? "Switch to personal account to repost" : "Repost"}>
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSold) return;
                                    if (isNonPersonalAccount) { setAccountSwitchOpen(true); return; }
                                    const next = !localReposted;
                                    setOptRepost({ gen: acctGenRef.current, value: next });
                                    setOptRepostDelta((prev) => prev + (next ? 1 : -1));
                                    onRepost?.(listing);
                                }}
                                sx={{ ...pillSx, opacity: isSold ? 0.5 : 1, pointerEvents: isSold ? "none" : "auto" }}
                            >
                                <RepeatRoundedIcon sx={{ fontSize: 22, color: localReposted ? "secondary.main" : "text.secondary" }} />
                                {localRepostCount > 0 && (
                                    <Typography sx={{ ...countSx, color: localReposted ? "secondary.main" : "text.secondary" }}>
                                        {fmtCount(localRepostCount)}
                                    </Typography>
                                )}
                            </Box>
                        </Tooltip>
                        <Tooltip title="Share">
                            <Box
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShareOpen(true);
                                }}
                                sx={pillSx}
                            >
                                <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                            </Box>
                        </Tooltip>
                        {!isOwnerAnyAccount && !isSold && (
                            <Tooltip title="Message seller">
                                <Box onClick={openQuickMsg} sx={pillSx}>
                                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                                </Box>
                            </Tooltip>
                        )}
                        <Box sx={{ flexGrow: 1 }} />
                        {viewCount > 0 && (
                            <Stack direction="row" spacing={0.3} alignItems="center">
                                <VisibilityRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                                <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "text.disabled" }}>
                                    {fmtCount(viewCount)}
                                </Typography>
                            </Stack>
                        )}
                    </Box>
                </CardActions>

                {/* ═══════════ 3-DOT MENU ═══════════ */}
                <SmartMenu
                    anchorEl={menuAnchor}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{
                        sx: {
                            minWidth: 200,
                            borderRadius: 2.5,
                            boxShadow: (t) => `0 8px 24px ${alpha(t.palette.text.primary, 0.12)}`,
                            border: "1px solid",
                            borderColor: "divider",
                            py: 0.5,
                        },
                    }}
                >
                    <MenuItem onClick={handleCopyLink} sx={{ py: 1 }}>
                        <ListItemIcon><LinkRoundedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Copy link" />
                    </MenuItem>
                    {isOwnerAnyAccount && <Divider sx={{ my: 0.5 }} />}
                    {isOwnerAnyAccount && (
                        <Tooltip title={needsAccountSwitch ? "Switch accounts to edit" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                            <MenuItem onClick={handleEditClick} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                                <ListItemIcon><EditRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Edit" />
                            </MenuItem>
                        </span></Tooltip>
                    )}
                    {isOwnerAnyAccount && !isSold && !isYardSale && (
                        <Tooltip title={needsAccountSwitch ? "Switch accounts to mark sold" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                            <MenuItem onClick={handleMarkSoldClick} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                                <ListItemIcon><SellRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Mark as sold" />
                            </MenuItem>
                        </span></Tooltip>
                    )}
                    {isOwnerAnyAccount && isSold && !isYardSale && (
                        <Tooltip title={needsAccountSwitch ? "Switch accounts to relist" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                            <MenuItem onClick={handleRelistClick} disabled={needsAccountSwitch} sx={{ py: 1 }}>
                                <ListItemIcon><SellRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Relist" />
                            </MenuItem>
                        </span></Tooltip>
                    )}
                    {isOwnerAnyAccount && (
                        <Tooltip title={needsAccountSwitch ? "Switch accounts to delete" : ""} placement="left" arrow componentsProps={{ tooltip: { sx: tooltipSx } }}><span>
                            <MenuItem onClick={handleDeleteClick} disabled={needsAccountSwitch} sx={{ py: 1, color: needsAccountSwitch ? "text.disabled" : "error.main" }}>
                                <ListItemIcon sx={{ color: needsAccountSwitch ? "text.disabled" : "error.main" }}><DeleteRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Delete" />
                            </MenuItem>
                        </span></Tooltip>
                    )}
                    {!isOwnerAnyAccount && <Divider sx={{ my: 0.5 }} />}
                    {!isOwnerAnyAccount && (
                        <MenuItem onClick={(e) => { e?.stopPropagation?.(); handleMenuClose(e); setReportOpen(true); }} sx={{ py: 1 }}>
                            <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Report" />
                        </MenuItem>
                    )}
                </SmartMenu>

                <SuccessSnackbar open={copyLinkToast} onClose={() => setCopyLinkToast(false)} message="Link copied to clipboard" />
            </Card>

            {/* Account switch dialog — shown when non-personal account taps Repost */}
            <Dialog open={accountSwitchOpen} onClose={() => setAccountSwitchOpen(false)} maxWidth="xs" fullWidth
                    onClick={(e) => e.stopPropagation()}
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

            <UserCardPopover
                anchorEl={popoverAnchorEl}
                onClose={handlePopoverClose}
                user={sellerId ? {
                    id: sellerId,
                    handle: listing?.sellerHandle || listing?.seller?.handle || "",
                    firstName: listing?.seller?.firstName || listing?.sellerName?.split(" ")[0] || "",
                    lastName: listing?.seller?.lastName || listing?.sellerName?.split(" ").slice(1).join(" ") || "",
                    profile_picture: listing?.sellerAvatarUrl || listing?.seller?.avatarUrl || "",
                    avatar_url: listing?.sellerAvatarUrl || listing?.seller?.avatarUrl || "",
                } : null}
                isSelf={isSelf}
                following={false}
                onViewProfile={handleViewProfile}
            />

            <ShareListingDialog open={shareOpen} onClose={() => setShareOpen(false)} listing={listing} viewer={viewer} sx={{ zIndex: 100001 }} />

            <ReportContentDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                onSubmit={async ({ reason, details }) => {
                    try {
                        await axios.post(`/api/marketplace/listings/${listing?.id}/report`, { reason, details }, { withCredentials: true, headers: { ...getAccountHeaders() } });
                    } catch { /* dialog handles success state */ }
                }}
                title="Report listing"
                sx={{ zIndex: 100001 }}
            />

            {/* ═══════════ QUICK MESSAGE DIALOG ═══════════ */}
            <Dialog open={quickMsgOpen} onClose={closeQuickMsg} maxWidth="sm" fullWidth
                    fullScreen={isMobile}
                    disableScrollLock
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, maxHeight: isMobile ? "100vh" : "85vh", ...(isMobile && { display: "flex", flexDirection: "column" }) } }}
                    sx={{ zIndex: 100001 }}>
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
                                        <Avatar src={sellerAvatarUrl || undefined} sx={(t) => ({ width: 24, height: 24, bgcolor: alpha(t.palette.primary.main, 0.08), color: t.palette.primary.main })}>
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
                            {/* Body */}
                            <TextField
                                label="Message"
                                placeholder={listing?.priceModel === "negotiable" ? "Describe your offer, questions, timeline..." : "Ask about availability, meetup details, condition..."}
                                multiline
                                minRows={isMobile ? 4 : 5}
                                maxRows={isMobile ? 8 : 10}
                                value={quickMsgBody}
                                onChange={(e) => { setQuickMsgBody(e.target.value.slice(0, 5000)); if (quickMsgError) setQuickMsgError(""); }}
                                inputProps={{ maxLength: 5000 }}
                                fullWidth
                                error={Boolean(quickMsgError)}
                                helperText={quickMsgError || `${quickMsgBody.length} / 5,000`}
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
                            <Button variant="contained" color="primary" disabled={(!quickMsgBody.trim() && quickMsgPhotos.length === 0) || quickMsgSending || quickMsgCooldown > 0}
                                    onClick={handleQuickMsgSend}
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
                    onClick={(e) => e.stopPropagation()}
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
        </>
    );
}

ListingCard.propTypes = {
    listing: PropTypes.object.isRequired, onSelect: PropTypes.func, onFavorite: PropTypes.func,
    onRepost: PropTypes.func, onContact: PropTypes.func, onEdit: PropTypes.func,
    onDelete: PropTypes.func, onFlag: PropTypes.func, onMarkSold: PropTypes.func,
    onRelist: PropTypes.func, onShowOnMap: PropTypes.func, selected: PropTypes.bool, user: PropTypes.object,
};
ListingCard.defaultProps = {
    onSelect: undefined, onFavorite: undefined, onRepost: undefined, onContact: undefined,
    onEdit: undefined, onDelete: undefined, onFlag: undefined, onMarkSold: undefined,
    onRelist: undefined, onShowOnMap: undefined, selected: false, user: null,
};
