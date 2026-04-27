// src/pages/services/components/ServiceCard.jsx
//
// Card for service listings:
// - Top bar with service avatar, service name, tagline, reviews, 3-dot menu
// - Category chip underneath the name (matching BusinessDirectoryCard)
// - Clickable body with about/description preview
// - Footer with location (right)
// - Action bar with favorite, share, price, social links (right)
//
import React, { useEffect, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import {
    Avatar,
    Box,
    Card,
    Chip,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Rating,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import LinkIcon from "@mui/icons-material/Link";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Tooltip from "@mui/material/Tooltip";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ShareServiceDialog from "../../../components/ShareServiceDialog";
import {
    getServiceCategoryInfo,
} from "../utils/serviceHelpers";
import { toggleServiceFavorite } from "../api/serviceFavoritesApi";
import { useAuth } from "../../../components/AuthModalContext";
import { ReportDialog } from "../../../components/ActionBar";
import { secureFetch } from "../../../utils/secureFetch";

/* ── helpers (module-level, never recreated) ── */
const computeStatus = (service) => {
    const expRaw = service?.expiresAt || service?.expires_at;
    if (!expRaw) return null;
    const exp = new Date(expRaw).getTime();
    const now = Date.now();
    if (exp <= now) return { label: "Expired", color: "error" };
    const daysLeft = Math.ceil((exp - now) / 86400000);
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, color: "warning" };
    return { label: "Active", color: "success" };
};

/**
 * Resolve the SERVICE's own branding avatar (the picture uploaded specifically for this listing).
 * When this returns null, the card should show the CATEGORY ICON as fallback — not the provider's
 * personal profile picture, which is a separate concept.
 */
const resolveServiceAvatar = (service) => {
    if (service?.serviceAvatarUrl) return service.serviceAvatarUrl;
    if (service?.service_avatar_url) return service.service_avatar_url;
    return null;
};

/**
 * Resolve the PROVIDER's account profile picture (business logo, artist avatar, or personal profile pic).
 * This is shown in the "Provided by" section, NOT as the main service card avatar.
 */
const resolveProviderAvatar = (service) => {
    if (service?.providerAvatar) return service.providerAvatar;
    if (service?.provider_avatar) return service.provider_avatar;
    // Legacy / generic fallbacks
    if (service?.posterAvatar) return service.posterAvatar;
    if (service?.poster_avatar) return service.poster_avatar;
    if (service?.posterAvatarUrl) return service.posterAvatarUrl;
    if (service?.poster_avatar_url) return service.poster_avatar_url;
    return null;
};

const formatCount = (n) => {
    if (!n || n <= 0) return "0";
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
};

const DESC_WORD_LIMIT = 40;
const DESC_CHAR_LIMIT = 210;

const PILL_SX = {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    px: 1.25,
    py: 0.5,
    borderRadius: 999,
    cursor: "pointer",
    transition: (t) => `background ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
    "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
    "&:active": { transform: "scale(0.97)" },
};

// Fixed card height so every ServiceCard, ArtistCard, and BusinessDirectoryCard are the same size
const CARD_FIXED_HEIGHT = 288;

/**
 * Derive a stable cache key string from the activeAccount prop.
 * Mirrors ActionBar's getAccountCacheKey pattern.
 */
function deriveAccountCacheKey(activeAccount) {
    if (!activeAccount || typeof activeAccount !== "object" || !activeAccount.id) return "personal";
    const type = String(activeAccount.type || activeAccount.account_type || activeAccount.accountType || "personal").toLowerCase();
    if (type === "business") return `biz:${activeAccount.id}`;
    if (type === "artist") {
        const artId = activeAccount.artistId ?? activeAccount.artist_id ?? activeAccount.id;
        return `art:${artId}`;
    }
    return "personal";
}

export default function ServiceCard({
                                        service,
                                        onClick,
                                        selected = false,
                                        showStatus = false,
                                        onEdit,
                                        onDelete,
                                        onReport,
                                        onShare,
                                        onLocationClick,
                                        onFavorite,
                                        onHover,
                                        user,
                                        activeAccount,
                                    }) {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [copyToast, setCopyToast] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const shareJustClosedRef = useRef(false);
    const reportJustClosedRef = useRef(false);
    const menuOpen = Boolean(menuAnchor);

    const auth = useAuth();

    // ── Account-aware cache key (mirrors ActionBar pattern) ──
    const accountCacheKey = deriveAccountCacheKey(activeAccount);

    // ── Favorite state (self-contained optimistic → server-confirm) ──
    const backendFav = Boolean(service?.isFavorited ?? service?.is_favorited ?? service?.favorited);
    const backendCount = Number(service?.favoritesCount || service?.favorites_count || 0);

    // null = "not yet toggled locally, use backend value"
    const [localFav, setLocalFav] = useState(null);
    const [localCount, setLocalCount] = useState(null);
    const [favBusy, setFavBusy] = useState(false);

    // Cooldown ref: while true, the sync effect won't override local state
    // with stale backend props arriving from a parent re-render.
    const favCooldownRef = useRef(false);
    const cooldownTimerRef = useRef(null);
    // Track what the card's own API call confirmed, so we can detect
    // external changes (e.g. detail panel toggle) even during cooldown.
    const cardConfirmedFavRef = useRef(null);

    // Track account key so we can detect account swaps
    const prevAccountKeyRef = useRef(accountCacheKey);

    // Reset local favorite state when the active account changes.
    // This ensures that favorites from personal don't bleed into
    // business/artist views and vice versa.
    useEffect(() => {
        if (prevAccountKeyRef.current !== accountCacheKey) {
            prevAccountKeyRef.current = accountCacheKey;
            // Account changed → clear all local overrides so we use fresh
            // backend values (which should reflect the new account's state).
            favCooldownRef.current = false;
            cardConfirmedFavRef.current = null;
            if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
            setLocalFav(null);
            setLocalCount(null);
            setFavBusy(false);
        }
    }, [accountCacheKey]);

    // Sync from backend props. During cooldown we only skip if the
    // backend value still matches what the card's own API confirmed —
    // if it differs, something external (detail panel, another tab)
    // changed the favorite and we must accept the new value.
    useEffect(() => {
        if (favCooldownRef.current) {
            // Check if backend diverged from what the card confirmed
            if (cardConfirmedFavRef.current !== null && backendFav !== cardConfirmedFavRef.current) {
                // External change detected — accept it, clear cooldown
                favCooldownRef.current = false;
                cardConfirmedFavRef.current = null;
                if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
                setLocalFav(null);
                setLocalCount(null);
            }
            return;
        }
        setLocalFav(null);
        setLocalCount(null);
    }, [backendFav, backendCount]);

    // Derived display values
    const displayFav = localFav !== null ? localFav : backendFav;
    const displayFavCount = localCount !== null ? localCount : backendCount;

    // Keep a ref to activeAccount for async usage so the API call always
    // sends the account that was active at click-time, not at resolve-time.
    const activeAccountRef = useRef(activeAccount);
    activeAccountRef.current = activeAccount;

    const handleFavClick = async (e) => {
        e.stopPropagation();

        // Require auth
        if (!user) {
            try {
                if (auth && typeof auth.open === 'function') auth.open();
                else if (auth && typeof auth.openLoginPopup === 'function') auth.openLoginPopup();
                else if (auth && typeof auth.openLoginModal === 'function') auth.openLoginModal();
                else if (auth && typeof auth.openLogin === 'function') auth.openLogin();
            } catch { /* ignore */ }
            try {
                window.dispatchEvent(new CustomEvent('open-auth-modal'));
                window.dispatchEvent(new CustomEvent('open-login'));
                window.dispatchEvent(new CustomEvent('open-auth-dialog'));
                window.dispatchEvent(new CustomEvent('open-login-popup'));
            } catch { /* ignore */ }
            return;
        }

        if (favBusy) return;

        // Snapshot the account at click-time
        const clickAccount = activeAccountRef.current;

        // Optimistic toggle
        const nextFav = !displayFav;
        const nextCount = Math.max(0, displayFavCount + (nextFav ? 1 : -1));
        setLocalFav(nextFav);
        setLocalCount(nextCount);
        setFavBusy(true);

        // Protect optimistic state from stale parent re-renders
        favCooldownRef.current = true;
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);

        try {
            // Pass the explicit activeAccount so the API sends
            // the correct x-account-type / x-business-id / x-artist-id headers.
            const result = await toggleServiceFavorite(serviceId, clickAccount);
            // Server-confirmed state
            if (result) {
                const serverFav = Boolean(result.favorited);
                const serverCount = Number(result.favoritesCount ?? result.favorites_count ?? nextCount);
                setLocalFav(serverFav);
                setLocalCount(Math.max(0, serverCount));
                // Remember what we confirmed so the sync effect can detect
                // if the backend later diverges (external toggle).
                cardConfirmedFavRef.current = serverFav;

                // Notify parent with server-confirmed result so it can sync
                // detail panel / items list WITHOUT making another API call.
                if (typeof onFavorite === "function") {
                    onFavorite(service, { fromCard: true, favorited: serverFav, favoritesCount: serverCount });
                }
            }
        } catch {
            // Revert on error
            setLocalFav(displayFav === nextFav ? !nextFav : null);
            setLocalCount(null);
        } finally {
            setFavBusy(false);
            // Keep cooldown active briefly after API completes so any
            // stale parent re-render with old props doesn't stomp us.
            cooldownTimerRef.current = setTimeout(() => {
                favCooldownRef.current = false;
                cardConfirmedFavRef.current = null;
            }, 1500);
        }
    };

    // Local overrides from review-changed events
    const [localReviewAvg, setLocalReviewAvg] = useState(null);
    const [localReviewCount, setLocalReviewCount] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            const d = e.detail;
            if (!d || !service?.id || String(d.serviceId) !== String(service.id)) return;
            setLocalReviewAvg(d.reviewAvg != null ? Number(d.reviewAvg) : null);
            setLocalReviewCount(Number(d.reviewCount || 0));
        };
        window.addEventListener('ll:service:review-changed', handler);
        return () => window.removeEventListener('ll:service:review-changed', handler);
    }, [service?.id]);

    if (!service) return null;

    const serviceAvatarFromListing = resolveServiceAvatar(service);
    const providerAvatarFromListing = resolveProviderAvatar(service);
    const serviceName = service.title || "Untitled service";
    const serviceIsVerified = Boolean(
        service?.is_verified === true || service?.is_verified === 1 || service?.is_verified === "1" ||
        service?.isVerified === true || service?.isVerified === 1 || service?.isVerified === "1" ||
        service?.posterIsVerified === true || service?.posterIsVerified === 1 || service?.posterIsVerified === "1" ||
        service?.poster_is_verified === true || service?.poster_is_verified === 1 || service?.poster_is_verified === "1"
    );
    const tagline = String(service.summary || "").trim();
    const providerType = service.providerType || service.provider_type || "user";
    const statusBadge = showStatus ? computeStatus(service) : null;
    const baseReviewAvg = service.reviewAvg != null ? Number(service.reviewAvg) : (service.review_avg != null ? Number(service.review_avg) : null);
    const baseReviewCount = Number(service.reviewCount || service.review_count || 0);
    const providerAllowsReviews = service.allowReviews !== false && service.allow_reviews !== false;

    const reviewAvg = localReviewAvg != null ? localReviewAvg : baseReviewAvg;
    const reviewCount = localReviewCount != null ? localReviewCount : baseReviewCount;

    const categorySlug = service.categorySlug || service.category_slug || "";
    const catInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;

    const rawLocationLabel = service.locationLabel || service.location_label || "Alabama (Statewide)";
    const locationLabel = (() => {
        const lower = rawLocationLabel.toLowerCase().trim();
        if (!lower) return "Alabama (Statewide)";
        if (lower === "statewide" || lower === "alabama") return "Alabama (Statewide)";
        if (lower.includes("statewide")) return rawLocationLabel;
        if (rawLocationLabel.toLowerCase().includes("county")) return rawLocationLabel;
        const county = String(service.county || "").trim();
        if (county && rawLocationLabel.endsWith(county)) {
            return rawLocationLabel.slice(0, -county.length) + county + " County";
        }
        return rawLocationLabel;
    })();

    // Description preview (about text — separate from summary/tagline which goes in header)
    const descRaw = String(service.description || "").trim().replace(/\s+/g, " ");
    const descWords = descRaw.split(/\s+/).filter(Boolean);
    const descLongByWords = descWords.length > DESC_WORD_LIMIT;
    const descLongByChars = descRaw.length > DESC_CHAR_LIMIT;
    const descIsLong = descLongByWords || descLongByChars;
    const descPreview = !descRaw ? "" : !descIsLong ? descRaw
        : descLongByWords ? descWords.slice(0, DESC_WORD_LIMIT).join(" ")
            : descRaw.slice(0, DESC_CHAR_LIMIT).trimEnd();

    const isSelected = Boolean(selected);

    // Ownership check for menu
    const userId = user?.id || user?.user_id;
    const backendIsOwner = service.isOwner;
    const isPersonalOwner = providerType === "user" && userId && String(service.providerId || service.provider_id) === String(userId);
    const isBusinessOwner = providerType === "business" && activeAccount?.type === "business" && String(service.providerId || service.provider_id) === String(activeAccount?.id);
    const isMusicOwner = providerType === "music" && activeAccount?.type === "artist" && String(service.providerId || service.provider_id) === String(activeAccount?.id);
    const showOwnerActions = backendIsOwner != null ? backendIsOwner : (isPersonalOwner || isBusinessOwner || isMusicOwner);

    // The service card's main avatar shows the SERVICE's own branding image.
    // If the service has no branding avatar, the JSX falls back to the category icon.
    // When the viewer is the owner, prefer the service avatar they've set (if any).
    const avatarSrc = (() => {
        // Service's own branding avatar always takes priority
        if (serviceAvatarFromListing) return serviceAvatarFromListing;
        // No service avatar → return null so the category icon fallback renders
        return null;
    })();

    const serviceId = service.id || service.service_id || null;

    const handleShareClick = (e) => {
        e.stopPropagation();
        setShareOpen(true);
    };

    const submitReport = async ({ reason, details }) => {
        try {
            await secureFetch("/api/services/" + serviceId + "/report", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason, details }),
            });
        } catch { /* noop */ }
        if (typeof onReport === "function") onReport(service);
    };

    // Build social links array (stable per-render, no effect dependency)
    const ws = service.websiteUrl || service.website_url;
    const socials = [
        { url: service.facebookUrl || service.facebook_url, icon: <FacebookIcon sx={{ fontSize: 16 }} />, label: "Facebook", color: "#1877F2" },
        { url: service.instagramUrl || service.instagram_url, icon: <InstagramIcon sx={{ fontSize: 16 }} />, label: "Instagram", color: "#C13584" },
        { url: service.twitterUrl || service.twitter_url, icon: <XIcon sx={{ fontSize: 14 }} />, label: "X", color: "text.primary" },
        { url: service.youtubeUrl || service.youtube_url, icon: <YouTubeIcon sx={{ fontSize: 16 }} />, label: "YouTube", color: "#FF0000" },
        { url: service.tiktokUrl || service.tiktok_url, icon: <LinkIcon sx={{ fontSize: 16 }} />, label: "TikTok", color: "text.secondary" },
    ].filter((l) => l.url);
    const hasSocials = Boolean(ws || socials.length);

    return (
        <Card
            data-service-id={service.id}
            onClick={() => {
                if (shareJustClosedRef.current) return;
                if (reportJustClosedRef.current) return;
                if (typeof onClick === "function") onClick(service);
            }}
            onMouseEnter={() => { if (typeof onHover === "function") onHover(serviceId); }}
            onMouseLeave={() => { if (typeof onHover === "function") onHover(null); }}
            sx={(t) => {
                const mobile = t.breakpoints.down("md");
                return {
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: { xs: "auto", md: CARD_FIXED_HEIGHT },
                    position: "relative",
                    isolation: "isolate",
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: isSelected
                        ? t.palette.secondary.main
                        : alpha(t.palette.text.primary, 0.08),
                    bgcolor: t.palette.background.paper,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: isSelected
                        ? `0 8px 32px ${alpha(t.palette.text.primary, 0.12)}`
                        : `0 2px 8px ${alpha(t.palette.text.primary, 0.04)}`,
                    transition: "all 180ms ease",
                    transform: isSelected ? "none" : "translateY(0)",
                    "&:hover": isSelected ? {} : {
                        boxShadow: `0 6px 20px ${alpha(t.palette.text.primary, 0.08)}`,
                        transform: "none",
                    },
                    // Mobile: flat edge-to-edge with bottom divider only
                    [mobile]: {
                        borderRadius: 0,
                        border: "none",
                        borderBottom: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                        boxShadow: "none",
                        "&:hover": { boxShadow: "none" },
                    },
                };}}
        >
            {/* ═══ HEADER ═══ */}
            <Box sx={{ px: 2, pt: 2, pb: 0.75, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                {/* Left: service avatar + service name + tagline + reviews */}
                <Box
                    sx={{
                        display: "inline-flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        borderRadius: 2,
                        p: 0.75,
                        m: -0.75,
                        maxWidth: "fit-content",
                        minWidth: 0,
                    }}
                >
                    <Avatar
                        src={avatarSrc || undefined}
                        sx={(t) => ({
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            border: "2px solid",
                            borderColor: alpha(t.palette.text.primary, 0.06),
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            color: t.palette.primary.main,
                        })}
                    >
                        {CatIcon ? <CatIcon sx={{ fontSize: 28 }} /> : <PersonRoundedIcon sx={{ fontSize: 28 }} />}
                    </Avatar>

                    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                            <Typography sx={{ fontWeight: 750, fontSize: "1rem", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 220 }}>
                                {serviceName}
                            </Typography>
                            {serviceIsVerified ? (
                                <Tooltip title="Verified" arrow>
                                    <VerifiedRoundedIcon sx={{ fontSize: 15, color: "primary.main", flexShrink: 0 }} />
                                </Tooltip>
                            ) : null}
                        </Box>
                        {tagline && (
                            <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200, display: "block" }}>
                                {tagline}
                            </Typography>
                        )}
                        {/* Category chip — inline under the tagline on all breakpoints.
                            Previously split into a mobile-inline chip here plus a separate
                            desktop chip below the header; now unified into a single chip
                            that sits in the left column next to the name+tagline, which
                            keeps it visually anchored to the service identity instead of
                            floating at the card edge. */}
                        {catInfo && (
                            <Box sx={{ display: "flex", mt: 0.5 }}>
                                <Chip
                                    size="small"
                                    icon={CatIcon ? <CatIcon sx={{ fontSize: "13px !important" }} /> : undefined}
                                    label={catInfo.name}
                                    sx={(t) => ({
                                        height: 22,
                                        borderRadius: 999,
                                        fontWeight: 800,
                                        fontSize: 10.5,
                                        bgcolor: alpha(t.palette.primary.main, 0.08),
                                        color: t.custom?.primaryText || t.palette.primary.main,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.primary.main, 0.25),
                                        "& .MuiChip-icon": { color: t.custom?.primaryText || t.palette.primary.main, ml: 0.5 },
                                        "& .MuiChip-label": { px: 0.75, lineHeight: 1 },
                                    })}
                                />
                            </Box>
                        )}
                        {providerAllowsReviews && reviewCount > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                                <Rating
                                    value={reviewAvg || 0}
                                    precision={0.5}
                                    readOnly
                                    size="small"
                                    sx={{ "& .MuiRating-icon": { fontSize: 14 } }}
                                />
                                <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "text.secondary", lineHeight: 1 }}>
                                    ({reviewCount})
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Right: status badge + menu — aligned with name row (compensate for left side m: -0.75) */}
                <Box sx={{ flexShrink: 0, mt: -0.75, display: "flex", alignItems: "center", gap: 0.75 }}>
                    {statusBadge && (
                        <Chip
                            size="small"
                            label={statusBadge.label}
                            color={statusBadge.color}
                            sx={{ height: 22, fontWeight: 800, fontSize: 11, borderRadius: 999 }}
                        />
                    )}

                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
                        sx={{ border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.08)}`, borderRadius: 999, width: 32, height: 32 }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>

                    <Menu
                        disableScrollLock
                        anchorEl={menuAnchor}
                        open={menuOpen}
                        onClose={(e) => { if (e?.stopPropagation) e.stopPropagation(); setMenuAnchor(null); }}
                        onClick={(e) => e.stopPropagation()}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        PaperProps={{
                            sx: {
                                mt: 0.5,
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                                minWidth: 200,
                                py: 0.5,
                            },
                        }}
                    >
                        {/* Copy link */}
                        <MenuItem
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuAnchor(null);
                                const url = `${window.location.origin}/services/${service.id}`;
                                navigator.clipboard.writeText(url).then(() => setCopyToast(true)).catch(() => setCopyToast(true));
                            }}
                            sx={{ py: 1 }}
                        >
                            <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                            <ListItemText primary="Copy link" />
                        </MenuItem>

                        {/* Share */}
                        {typeof onShare === "function" && (
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuAnchor(null);
                                    onShare(service);
                                }}
                                sx={{ py: 1 }}
                            >
                                <ListItemIcon><ShareRoundedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Share" />
                            </MenuItem>
                        )}

                        {/* Owner actions */}
                        {showOwnerActions && typeof onEdit === "function" && (
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuAnchor(null);
                                    onEdit(service);
                                }}
                                sx={{ py: 1 }}
                            >
                                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Edit" />
                            </MenuItem>
                        )}

                        {showOwnerActions && typeof onDelete === "function" && (
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuAnchor(null);
                                    onDelete(service);
                                }}
                                sx={{ py: 1, color: 'error.main' }}
                            >
                                <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Delete" />
                            </MenuItem>
                        )}

                        {/* Report — only for non-owners */}
                        {!showOwnerActions && (
                            <MenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuAnchor(null);
                                    setReportOpen(true);
                                }}
                                sx={{ py: 1 }}
                            >
                                <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary="Report" />
                            </MenuItem>
                        )}
                    </Menu>

                    <Snackbar
                        open={copyToast}
                        autoHideDuration={2000}
                        onClose={() => setCopyToast(false)}
                        message="Link copied to clipboard"
                        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                    />
                </Box>
            </Box>

            {/* Category chip is rendered inline under the service name/tagline
                in the header (handles both mobile and desktop now). */}

            {/* ═══ BODY ═══ */}
            <Box
                sx={{
                    flex: 1,
                    px: 2,
                    pt: 1.5,
                    pb: 0,
                    overflow: "hidden",
                    position: "relative",
                    minHeight: 0,
                }}
            >
                {/* Description preview (about text) */}
                {descPreview && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: "text.secondary",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {descPreview}
                        {descIsLong && (
                            <Typography
                                component="span"
                                sx={{ fontSize: "inherit", fontWeight: 700, color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                                onClick={(e) => { e.stopPropagation(); if (typeof onClick === "function") onClick(service); }}
                            >
                                ...more
                            </Typography>
                        )}
                    </Typography>
                )}
            </Box>

            {/* ═══ FOOTER — location (right-aligned) ═══ */}
            <Box
                sx={{
                    px: 2,
                    pb: 1,
                    pt: 0.5,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    flexShrink: 0,
                }}
            >
                {/* Location — address on top, city/county below */}
                {locationLabel && (
                    <Box
                        sx={{
                            display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.15,
                            ...(typeof onLocationClick === "function" ? {
                                cursor: "pointer",
                                borderRadius: 1,
                                px: 0.5,
                                mx: -0.5,
                                transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                "&:hover .svc-loc-icon, &:hover .svc-loc-text": { color: "secondary.main" },
                            } : {}),
                        }}
                        onClick={typeof onLocationClick === "function" ? (e) => { e.stopPropagation(); onLocationClick(service); } : undefined}
                    >
                        {(() => {
                            const street = String(service.streetAddress || service.street_address || "").trim();
                            const city = String(service.city || "").trim();
                            const county = String(service.county || "").trim();
                            const scope = String(service.locationScope || service.location_scope || "").toLowerCase();

                            const cityCountyLabel = (() => {
                                if (scope === "statewide" || (!city && !county)) return "Alabama (Statewide)";
                                if (city && county) return `${city}, ${county} County`;
                                if (county) return `${county} County`;
                                return city;
                            })();

                            return (
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
                                    {street && (
                                        <Typography className="svc-loc-text" sx={{ fontSize: 12, color: "primary.main", fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.4, transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}>
                                            {street}
                                        </Typography>
                                    )}
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <LocationOnRoundedIcon className="svc-loc-icon" sx={{ fontSize: 15, color: "primary.main", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }} />
                                        <Typography className="svc-loc-text" sx={{ fontSize: 12, color: "primary.main", fontWeight: 700, whiteSpace: "nowrap", transition: (t) => `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }}>
                                            {cityCountyLabel}
                                        </Typography>
                                    </Stack>
                                </Box>
                            );
                        })()}
                    </Box>
                )}
            </Box>

            {/* ═══ ACTION BAR ═══ */}
            <Box
                sx={{
                    mt: "auto",
                    px: 1.5,
                    py: 0.75,
                    borderTop: { xs: "none", md: "1px solid" },
                    borderColor: { xs: "transparent", md: "divider" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 0.5,
                }}
            >
                {/* Left: Favorite + Share pills */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box onClick={handleFavClick} sx={{ ...PILL_SX, minWidth: 42, justifyContent: "center", cursor: "pointer" }}>
                        {displayFav
                            ? <StarRoundedIcon sx={{ fontSize: 22, color: "secondary.main" }} />
                            : <StarBorderRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />}
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: displayFav ? "secondary.main" : "text.secondary" }}>
                            {formatCount(displayFavCount)}
                        </Typography>
                    </Box>
                    <Box onClick={handleShareClick} sx={{ ...PILL_SX, minWidth: 42, justifyContent: "center" }}>
                        <ShareRoundedIcon sx={{ fontSize: 22, color: "text.secondary" }} />
                    </Box>
                </Stack>

                {/* Right: Social links */}
                {hasSocials && (
                    <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
                        {ws && (
                            <Tooltip title="Website" arrow>
                                <IconButton component="a" href={ws.startsWith("http") ? ws : `https://${ws}`}
                                            target="_blank" rel="noopener noreferrer" size="small"
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{ width: 26, height: 26, color: "info.main", "&:hover": { bgcolor: (t) => alpha(t.palette.info.main, 0.1) } }}>
                                    <LanguageRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {socials.map((l) => (
                            <Tooltip key={l.label} title={l.label} arrow>
                                <IconButton component="a" href={l.url.startsWith("http") ? l.url : `https://${l.url}`}
                                            target="_blank" rel="noopener noreferrer" size="small"
                                            onClick={(e) => e.stopPropagation()}
                                            sx={{ width: 26, height: 26, color: l.color, "&:hover": { bgcolor: alpha(typeof l.color === "string" && l.color.startsWith("#") ? l.color : "#000", 0.08) } }}>
                                    {l.icon}
                                </IconButton>
                            </Tooltip>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Share dialog — wrapped to stop portal clicks from bubbling to Card */}
            <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                <ShareServiceDialog
                    open={shareOpen}
                    onClose={() => {
                        setShareOpen(false);
                        shareJustClosedRef.current = true;
                        setTimeout(() => { shareJustClosedRef.current = false; }, 300);
                    }}
                    service={service}
                    viewer={user}
                />
            </Box>

            {/* Report dialog — only rendered for non-owners; wrapped to stop portal clicks from bubbling to Card */}
            {!showOwnerActions && (
                <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                    <ReportDialog
                        open={reportOpen}
                        onClose={() => {
                            setReportOpen(false);
                            reportJustClosedRef.current = true;
                            setTimeout(() => { reportJustClosedRef.current = false; }, 300);
                        }}
                        onSubmit={submitReport}
                        title="Report Service"
                    />
                </Box>
            )}
        </Card>
    );
}
