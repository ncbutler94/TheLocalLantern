// src/pages/services/components/ServicePopupDialog.jsx
//
// Self-contained popup dialog that wraps ServiceDetailPanel.
// Drop into any profile page — just pass the service object + open/onClose.
// Manages all internal state (reviews, favorites, report, provider avatar, etc.)

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Rating,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

import ServiceDetailPanel from "./ServiceDetailPanel";
import { fetchServiceReviews, createServiceReview, updateServiceReview, deleteServiceReview, respondToReview, reportService, requestQuote } from "../api/servicesApi";
import { toggleServiceFavorite } from "../api/serviceFavoritesApi";
import { getServiceCategoryInfo } from "../utils/serviceHelpers";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { ReportDialog } from "../../../components/ActionBar";
import ShareServiceDialog from "../../../components/ShareServiceDialog";
import { secureFetch } from "../../../utils/secureFetch";

/* ── Price formatter (matches ServicesPage) ── */
function formatPriceRange(model, min, max) {
    const m = String(model || "").toLowerCase();
    if (!m || m === "contact" || m === "quote") return "Contact for pricing";
    if (m === "free") return "Free";
    const lo = min != null ? Number(min) : null;
    const hi = max != null ? Number(max) : null;
    if (lo != null && hi != null && lo > 0 && hi > 0) return `$${lo} – $${hi}`;
    if (lo != null && lo > 0) return `From $${lo}`;
    if (hi != null && hi > 0) return `Up to $${hi}`;
    return "";
}

function formatDetailFavCount(n) {
    if (n == null || n < 0) return "0";
    if (n < 1000) return String(n);
    const k = n / 1000;
    return k >= 100 ? `${Math.round(k)}k` : `${Math.round(k * 10) / 10}k`;
}

export default function ServicePopupDialog({ service, open, onClose, user, activeAccount: externalActiveAccount, initialTab = 0, highlightReviewId = null, highlightReviewerId = null, onFavoriteChange = null, embedded = false }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const auth = useAuth();
    const accountCtx = useActiveAccount();
    const activeAccount = externalActiveAccount || accountCtx?.activeAccount;
    const activeBusinessId = accountCtx?.activeBusinessId;
    const activeArtistId = accountCtx?.activeArtistId;

    const loggedInUser = auth?.user || user || null;
    const resolvedUserId = loggedInUser?.id || loggedInUser?.user_id || null;

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

    // ── Detail tab ──
    const [serviceDetailTab, setServiceDetailTab] = useState(initialTab || 0);
    const [detailHoursExpanded, setDetailHoursExpanded] = useState(false);
    const [svcDescExpanded, setSvcDescExpanded] = useState(false);

    // ── Provider profile avatar (live-fetch) ──
    const [providerProfileAvatar, setProviderProfileAvatar] = useState(null);

    // ── Favorites (optimistic) ──
    const [favOptimistic, setFavOptimistic] = useState(null);
    const [favDelta, setFavDelta] = useState(0);

    // ── Reviews ──
    const [svcReviews, setSvcReviews] = useState([]);
    const [svcReviewsTotal, setSvcReviewsTotal] = useState(0);
    const [svcReviewsLoading, setSvcReviewsLoading] = useState(false);
    const [svcReviewSort, setSvcReviewSort] = useState("newest");
    const [svcReviewProviderInfo, setSvcReviewProviderInfo] = useState(null);
    const [viewerIsOwner, setViewerIsOwner] = useState(false);
    const [svcReviewFormOpen, setSvcReviewFormOpen] = useState(false);
    const [svcReviewRating, setSvcReviewRating] = useState(0);
    const [svcReviewTitle, setSvcReviewTitle] = useState("");
    const [svcReviewText, setSvcReviewText] = useState("");
    const [svcReviewPhotos, setSvcReviewPhotos] = useState([]);
    const [svcReviewSubmitting, setSvcReviewSubmitting] = useState(false);
    const [svcReviewError, setSvcReviewError] = useState("");
    const [svcReviewEditing, setSvcReviewEditing] = useState(null);
    const [svcReviewDeleteTarget, setSvcReviewDeleteTarget] = useState(null);
    const [svcReviewDeleting, setSvcReviewDeleting] = useState(false);
    const [svcReviewMenuAnchor, setSvcReviewMenuAnchor] = useState(null);
    const [svcReviewMenuReview, setSvcReviewMenuReview] = useState(null);
    const [svcRespondingId, setSvcRespondingId] = useState(null);
    const [svcRespondText, setSvcRespondText] = useState("");

    // ── Detail 3-dot menu + report ──
    const [detailMenuAnchor, setDetailMenuAnchor] = useState(null);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState("service");
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [reportConfirmed, setReportConfirmed] = useState(false);
    const [reportSnack, setReportSnack] = useState("");
    const detailMenuOpen = Boolean(detailMenuAnchor);

    // ── Share ──
    const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // ── Quick Message ──
    const [quickMsgOpen, setQuickMsgOpen] = useState(false);
    const [quickMsgBody, setQuickMsgBody] = useState("");
    const [quickMsgSending, setQuickMsgSending] = useState(false);
    const [quickMsgError, setQuickMsgError] = useState("");
    const [quickMsgSuccess, setQuickMsgSuccess] = useState(false);

    // ── UserCard popover (noop for popup context) ──
    const [userAnchor, setUserAnchor] = useState(null);
    const [userForCard, setUserForCard] = useState(null);

    // ── Reset state when service changes ──
    useEffect(() => {
        if (!service) return;
        setServiceDetailTab(initialTab || 0);
        setDetailHoursExpanded(false);
        setSvcDescExpanded(false);
        setSvcReviews([]);
        setSvcReviewsTotal(0);
        setSvcReviewFormOpen(false);
        setSvcReviewError("");
        setSvcReviewEditing(null);
        setSvcReviewDeleteTarget(null);
        setProviderProfileAvatar(null);
        setFavOptimistic(null);
        setFavDelta(0);
        setDetailMenuAnchor(null);
    }, [service?.id]);

    // ── Fetch provider's CURRENT profile avatar ──
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
                    const res = await secureFetch(`/api/business/${encodeURIComponent(pHandle || pId)}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                    if (res.ok) { const data = await res.json(); const biz = data?.business || data; avatar = biz?.logo_url || biz?.logoUrl || biz?.avatar_url || biz?.avatarUrl || null; }
                } else if (pType === "music") {
                    const res = await secureFetch(`/api/music/artists/${encodeURIComponent(pHandle || pId)}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                    if (res.ok) { const data = await res.json(); const art = data?.artist || data; avatar = art?.avatar_url || art?.avatarUrl || null; }
                } else {
                    const key = pHandle.replace(/^@/, "") || pId;
                    if (key) {
                        const res = await secureFetch(`/users/public/${encodeURIComponent(key)}`, { method: "GET", credentials: "include", headers: { Accept: "application/json" }, signal });
                        if (res.ok) { const data = await res.json(); const prof = data?.profile || data; avatar = prof?.avatar_url || prof?.avatarUrl || prof?.profile_picture || null; }
                    }
                }
                if (!cancelled && avatar) setProviderProfileAvatar(avatar);
            } catch { /* silently fall back */ }
        })();

        return () => { cancelled = true; try { controller?.abort(); } catch { /* */ } };
    }, [service?.id, service?.providerType, service?.provider_type, service?.providerHandle, service?.provider_handle, service?.providerId, service?.provider_id]);

    // ── Load reviews ──
    const loadServiceReviews = useCallback(async () => {
        if (!service?.id) return;
        setSvcReviewsLoading(true);
        try {
            const data = await fetchServiceReviews(service.id, { sort: svcReviewSort, limit: 50, offset: 0 });
            setSvcReviews(data.reviews || []);
            setSvcReviewsTotal(data.total || 0);
            if (data.providerInfo) setSvcReviewProviderInfo(data.providerInfo);
            if (data.viewerIsOwner != null) setViewerIsOwner(Boolean(data.viewerIsOwner));
        } catch { setSvcReviews([]); setSvcReviewsTotal(0); }
        finally { setSvcReviewsLoading(false); }
    }, [service?.id, svcReviewSort]);

    // Load reviews eagerly when popup opens (so count is visible on header + reviews tab)
    useEffect(() => { if (service?.id && open) loadServiceReviews(); }, [service?.id, open, loadServiceReviews]);

    // Persistent highlight: stays until the review is visible, then fades.
    // The actual boost-to-top sorting is handled by ServiceDetailPanel, which
    // receives highlightReviewId/highlightReviewerId as props.
    const hlObserverPopupRef = useRef(null);
    const [hlPopupDismissed, setHlPopupDismissed] = useState(false);

    useEffect(() => {
        setHlPopupDismissed(false);
        if (hlObserverPopupRef.current) { hlObserverPopupRef.current.disconnect(); hlObserverPopupRef.current = null; }
    }, [highlightReviewId, highlightReviewerId]);

    useEffect(() => {
        if (hlPopupDismissed || (!highlightReviewId && !highlightReviewerId) || serviceDetailTab !== 3) return;
        if (!svcReviews || svcReviews.length === 0) return;
        const timer = setTimeout(() => {
            let el = highlightReviewId ? document.querySelector(`[data-service-review-id="${highlightReviewId}"]`) : null;
            if (!el) el = document.querySelector('[data-service-review-id]');
            if (el) {
                if (hlObserverPopupRef.current) hlObserverPopupRef.current.disconnect();
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) {
                        observer.disconnect();
                        hlObserverPopupRef.current = null;
                        setTimeout(() => setHlPopupDismissed(true), 1800);
                    }
                }, { threshold: 0.3 });
                observer.observe(el);
                hlObserverPopupRef.current = observer;
            }
        }, 200);
        return () => { clearTimeout(timer); if (hlObserverPopupRef.current) { hlObserverPopupRef.current.disconnect(); hlObserverPopupRef.current = null; } };
    }, [highlightReviewId, highlightReviewerId, serviceDetailTab, svcReviews, hlPopupDismissed]);

    // ── Derived values ──
    const detailService = service;
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

    const detailIsOwnListing = useMemo(() => {
        if (!detailService) return false;
        // Trust backend isOwner when it says true (account-aware)
        if (detailService.isOwner === true) return true;
        const uid = resolvedUserId;
        if (!uid) return false;
        const pType = detailService.providerType || detailService.provider_type;
        const pId = String(detailService.providerId || detailService.provider_id);
        if (pType === "business" && activeBusinessId && String(activeBusinessId) === pId) return true;
        if (pType === "music" && activeArtistId && String(activeArtistId) === pId) return true;
        // For user-type services, match if the provider is the logged-in user
        // regardless of which account context is active — you still own your personal services
        if ((pType === "user" || pType === "personal") && pId === String(uid)) return true;
        return false;
    }, [detailService, resolvedUserId, activeBusinessId, activeArtistId]);

    const detailAllowsReviews = detailService ? (detailService.allowReviews !== false && detailService.allow_reviews !== false) : true;
    const detailAllowsMessages = detailService ? (detailService.allowMessages !== false && detailService.allow_messages !== false) : true;

    const detailFav = favOptimistic !== null ? favOptimistic : Boolean(detailService?.isFavorited || detailService?.is_favorited);
    const detailFavCount = Math.max(0, Number(detailService?.favoritesCount || detailService?.favorites_count || 0) + favDelta);

    // Sync favorite state when the service prop is updated externally (e.g. card toggle)
    const prevServiceFavRef = useRef(null);
    useEffect(() => {
        const propFav = Boolean(service?.isFavorited || service?.is_favorited);
        const propCount = Number(service?.favoritesCount || service?.favorites_count || 0);
        const key = `${propFav}:${propCount}`;
        if (prevServiceFavRef.current !== null && prevServiceFavRef.current !== key) {
            // Prop changed externally — reset local overrides to accept new values
            setFavOptimistic(null);
            setFavDelta(0);
        }
        prevServiceFavRef.current = key;
    }, [service?.isFavorited, service?.is_favorited, service?.favoritesCount, service?.favorites_count]);

    // ── Handlers ──
    const handleDetailFavorite = useCallback(() => {
        if (!detailService?.id) return;
        if (!loggedInUser) { openAuthPopup(); return; }
        const cur = detailFav;
        const next = !cur;
        setFavOptimistic(next);
        setFavDelta((p) => p + (next ? 1 : -1));
        toggleServiceFavorite(detailService.id).then((result) => {
            if (result) {
                const serverFav = Boolean(result.favorited);
                const serverCount = Number(result.favoritesCount ?? result.favorites_count ?? 0);
                setFavOptimistic(serverFav);
                setFavDelta(0);
                // Notify parent so it can update the service list / card
                if (onFavoriteChange) {
                    onFavoriteChange(detailService, { favorited: serverFav, favoritesCount: serverCount });
                }
            }
        }).catch(() => {
            setFavOptimistic(cur);
            setFavDelta((p) => p + (next ? -1 : 1));
        });
    }, [detailService?.id, detailFav, loggedInUser, auth, onFavoriteChange, detailService]);

    const handleShareService = useCallback(() => {
        setShareDialogOpen(true);
    }, []);

    const handleRequestQuote = useCallback(() => {
        if (!detailService?.id) return;
        setQuickMsgBody("");
        setQuickMsgError("");
        setQuickMsgSuccess(false);
        setQuickMsgOpen(true);
    }, [detailService]);

    const closeQuickMsg = () => {
        if (quickMsgSending) return;
        setQuickMsgOpen(false);
    };

    const handleQuickMsgSend = async () => {
        if (!quickMsgBody.trim() || !detailService?.id) return;
        setQuickMsgSending(true);
        setQuickMsgError("");
        try {
            const userName = [loggedInUser?.first_name, loggedInUser?.last_name].filter(Boolean).join(" ");
            await requestQuote(detailService.id, {
                message: quickMsgBody.trim(),
                requesterName: userName,
                requesterAvatar: loggedInUser?.avatar_url || loggedInUser?.profile_picture || null,
                requesterHandle: loggedInUser?.handle || null,
            });
            setQuickMsgSuccess(true);
        } catch (err) {
            setQuickMsgError(err?.message || "Failed to send message.");
        } finally {
            setQuickMsgSending(false);
        }
    };

    const handleRespondToReview = useCallback(async (reviewId) => {
        if (!svcRespondText.trim() || !detailService?.id) return;
        try {
            await respondToReview(detailService.id, reviewId, svcRespondText.trim());
            setSvcRespondingId(null);
            setSvcRespondText("");
            await loadServiceReviews();
        } catch { /* ignore */ }
    }, [detailService?.id, svcRespondText, loadServiceReviews]);

    const openSvcReviewForm = useCallback((existingReview = null) => {
        if (!loggedInUser) { openAuthPopup(); return; }
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
    }, [loggedInUser, auth]);

    const closeSvcReviewForm = useCallback(() => {
        if (!svcReviewSubmitting) {
            setSvcReviewFormOpen(false);
            setSvcReviewError("");
        }
    }, [svcReviewSubmitting]);

    const handleSubmitReview = useCallback(async () => {
        if (!svcReviewRating) { setSvcReviewError("Please select a rating."); return; }
        if (!detailService?.id) return;
        setSvcReviewSubmitting(true);
        setSvcReviewError("");
        try {
            const photoUrls = svcReviewPhotos
                .map((p) => ({ url: p.url || "", objectPath: p.objectPath || "", _existing: Boolean(p._existing) }))
                .filter((p) => p.url);
            const payload = {
                rating: svcReviewRating,
                reviewTitle: svcReviewTitle,
                reviewText: svcReviewText,
                reviewerName: loggedInUser ? `${loggedInUser.first_name || ""} ${loggedInUser.last_name || ""}`.trim() || loggedInUser.handle || "User" : "User",
                reviewerAvatar: loggedInUser?.avatar_url || null,
                reviewerHandle: loggedInUser?.handle || null,
                photos: photoUrls,
            };
            if (svcReviewEditing?.id) {
                await updateServiceReview(detailService.id, svcReviewEditing.id, payload);
            } else {
                await createServiceReview(detailService.id, payload);
            }
            setSvcReviewFormOpen(false);
            svcReviewPhotos.forEach((p) => { if (p?.url && !p._existing) { try { URL.revokeObjectURL(p.url); } catch {} } });
            setSvcReviewPhotos([]);
            await loadServiceReviews();
        } catch (err) { setSvcReviewError(err?.message || "Failed to submit review."); }
        finally { setSvcReviewSubmitting(false); }
    }, [detailService?.id, svcReviewRating, svcReviewTitle, svcReviewText, svcReviewPhotos, svcReviewEditing, loggedInUser, loadServiceReviews]);

    const handleDeleteReview = useCallback(async (reviewId) => {
        if (!detailService?.id) return;
        setSvcReviewDeleting(true);
        try {
            await deleteServiceReview(detailService.id, reviewId);
            setSvcReviewDeleteTarget(null);
            setSvcReviewFormOpen(false);
            await loadServiceReviews();
        } catch { /* ignore */ }
        finally { setSvcReviewDeleting(false); }
    }, [detailService?.id, loadServiceReviews]);

    const handleClose = useCallback(() => {
        if (onClose) onClose();
        setServiceDetailTab(0);
    }, [onClose]);

    // noop — no right tab concept in popup
    const setRightTab = useCallback(() => {}, []);
    const setFocusServiceId = useCallback(() => {}, []);

    if (!service) return null;

    /* ── Shared ServiceDetailPanel + sub-dialogs (used by both Dialog and embedded modes) ── */
    const serviceDetailContent = (
        <>
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
                setRightTab={setRightTab}
                setUserAnchor={setUserAnchor}
                setUserForCard={setUserForCard}
                setFocusServiceId={setFocusServiceId}
                formatDetailFavCount={formatDetailFavCount}
                providerInfo={svcReviewProviderInfo}
                viewerIsOwner={viewerIsOwner}
                highlightReviewId={highlightReviewId}
                highlightReviewerId={highlightReviewerId}
            />

            {/* ═══ Review Write/Edit Dialog ═══ */}
            <Dialog open={svcReviewFormOpen} onClose={closeSvcReviewForm} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>{svcReviewEditing ? "Edit Review" : "Write a Review"}</Typography>
                    <IconButton onClick={closeSvcReviewForm} disabled={svcReviewSubmitting} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>Your Rating *</Typography>
                        <Rating value={svcReviewRating} precision={0.5} onChange={(_e, v) => setSvcReviewRating(v || 0)} size="large" sx={{ "& .MuiRating-iconFilled": { color: "secondary.main" }, "& .MuiRating-iconHover": { color: "secondary.main" } }} />
                    </Box>
                    <TextField fullWidth label="Review Title (optional)" value={svcReviewTitle} onChange={(e) => setSvcReviewTitle(e.target.value.slice(0, 160))} size="small" inputProps={{ maxLength: 160 }} sx={{ mb: 1.5 }} />
                    <TextField fullWidth label="Your Review" value={svcReviewText} onChange={(e) => setSvcReviewText(e.target.value)} multiline minRows={3} maxRows={8} size="small" sx={{ mb: 1.5 }} />
                    <Box sx={{ mb: 1.5 }}>
                        <PhotosUploadSection photos={svcReviewPhotos} setPhotos={setSvcReviewPhotos} disabled={svcReviewSubmitting} maxPhotos={4} title="Photos (optional)" helperText="Add up to 4 photos." addButtonText="Add photos" />
                    </Box>
                    {svcReviewError && <Typography sx={{ fontSize: "0.8rem", color: "error.main", fontWeight: 700, mb: 1 }}>{svcReviewError}</Typography>}
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        {svcReviewEditing && (
                            <Button size="small" color="error" startIcon={<DeleteRoundedIcon sx={{ fontSize: "15px !important" }} />}
                                    onClick={() => setSvcReviewDeleteTarget(svcReviewEditing)} disabled={svcReviewSubmitting}
                                    sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem", mr: "auto" }}>Delete</Button>
                        )}
                        <Button size="small" onClick={closeSvcReviewForm} disabled={svcReviewSubmitting} sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem" }}>Cancel</Button>
                        <Button variant="contained" size="small" onClick={handleSubmitReview} disabled={svcReviewSubmitting || !svcReviewRating}
                                sx={{ textTransform: "none", fontWeight: 800, fontSize: "0.78rem", borderRadius: 2, px: 2 }}>
                            {svcReviewSubmitting ? "Saving\u2026" : (svcReviewEditing ? "Update" : "Submit")}
                        </Button>
                    </Stack>
                    {svcReviewSubmitting && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}
                </DialogContent>
            </Dialog>

            {/* ═══ Review Delete Confirmation Dialog ═══ */}
            <Dialog open={Boolean(svcReviewDeleteTarget)} onClose={() => { if (!svcReviewDeleting) setSvcReviewDeleteTarget(null); }} maxWidth="xs" fullWidth disableScrollLock>
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Delete Review</Typography>
                    <IconButton onClick={() => setSvcReviewDeleteTarget(null)} disabled={svcReviewDeleting} sx={{ position: "absolute", right: 12, top: 12 }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>Are you sure? This cannot be undone.</Typography>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button variant="outlined" onClick={() => setSvcReviewDeleteTarget(null)} disabled={svcReviewDeleting}>Cancel</Button>
                            <Button variant="contained" color="error" onClick={() => handleDeleteReview(svcReviewDeleteTarget?.id)} disabled={svcReviewDeleting}>
                                {svcReviewDeleting ? "Deleting\u2026" : "Delete"}
                            </Button>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* ═══ Review 3-dot Menu ═══ */}
            <Menu
                anchorEl={svcReviewMenuAnchor}
                open={Boolean(svcReviewMenuAnchor)}
                onClose={() => { setSvcReviewMenuAnchor(null); setSvcReviewMenuReview(null); }}
                disableScrollLock
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { mt: 0.5, borderRadius: 2.5, border: "1px solid", borderColor: "divider", boxShadow: "0 12px 40px rgba(0,0,0,0.15)", minWidth: 200, py: 0.5 } }}
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
                    <MenuItem onClick={() => { setSvcReviewMenuAnchor(null); setSvcReviewMenuReview(null); setReportDialogOpen(true); }} sx={{ py: 1 }}>
                        <ListItemIcon><FlagOutlinedIcon fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Report review" />
                    </MenuItem>
                )}
            </Menu>

            {/* ═══ Report Dialog ═══ */}
            <ReportDialog
                open={reportDialogOpen}
                onClose={() => { setReportDialogOpen(false); setReportReason(""); setReportDetails(""); }}
                onSubmit={async ({ reason, details }) => {
                    if (!detailService?.id) return;
                    try { await reportService(detailService.id, { reason, details }); } catch { /* ignore */ }
                }}
                title="Report Service"
            />

            {/* ═══ Quick Message Dialog ═══ */}
            <Dialog open={quickMsgOpen} onClose={closeQuickMsg} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    {!quickMsgSuccess && (
                        <Typography variant="h6" sx={{ fontWeight: 900, fontSize: "1rem" }}>
                            Message Provider
                        </Typography>
                    )}
                    <IconButton size="small" onClick={closeQuickMsg} aria-label="Close" disabled={quickMsgSending}
                                sx={quickMsgSuccess ? { ml: "auto" } : {}}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                    {quickMsgSuccess ? (
                        <Stack spacing={2} sx={{ py: 2, textAlign: "center", alignItems: "center" }}>
                            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 48, color: "success.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>Message Sent!</Typography>
                            <Typography variant="body2" color="text.secondary">
                                The provider will receive your message and get back to you soon.
                            </Typography>
                            <Button variant="contained" fullWidth onClick={() => setQuickMsgOpen(false)}
                                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>Done</Button>
                        </Stack>
                    ) : (
                        <>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>To:</Typography>
                                <Chip
                                    avatar={
                                        <Avatar src={providerProfileAvatar || detailService?.providerAvatar || detailService?.provider_avatar || detailService?.avatar_url} sx={{ width: 24, height: 24 }} />
                                    }
                                    label={detailService?.providerName || detailService?.provider_name || "Provider"}
                                    sx={{ fontWeight: 700, fontSize: "0.8rem" }}
                                />
                            </Box>
                            <Box sx={(t) => ({ p: 1.5, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.1) })}>
                                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{detailService?.name || detailService?.title || "Service"}</Typography>
                            </Box>
                            <TextField multiline minRows={4} maxRows={10}
                                       placeholder="Ask about availability, pricing, or details..."
                                       value={quickMsgBody} onChange={(e) => setQuickMsgBody(e.target.value.slice(0, 5000))}
                                       fullWidth autoFocus inputProps={{ maxLength: 5000 }}
                                       helperText={`${quickMsgBody.length} / 5,000`}
                                       FormHelperTextProps={{ sx: { textAlign: "right", mr: 0.5, fontWeight: 600, fontSize: "0.75rem" } }}
                                       sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                            {quickMsgError && (
                                <Typography variant="body2" sx={{ color: "error.main", fontWeight: 700, fontSize: "0.8rem" }}>{quickMsgError}</Typography>
                            )}
                        </>
                    )}
                </DialogContent>
                {!quickMsgSuccess && (
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={closeQuickMsg} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}>Cancel</Button>
                        <Button variant="contained" color="primary" disabled={!quickMsgBody.trim() || quickMsgSending}
                                onClick={handleQuickMsgSend}
                                startIcon={quickMsgSending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
                                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>
                            {quickMsgSending ? "Sending\u2026" : "Send Message"}
                        </Button>
                    </DialogActions>
                )}
                {quickMsgSending && <LinearProgress sx={{ borderRadius: "0 0 12px 12px" }} />}
            </Dialog>

            {/* ═══ Share Dialog ═══ */}
            <ShareServiceDialog
                open={shareDialogOpen}
                onClose={() => setShareDialogOpen(false)}
                service={detailService}
                viewer={user}
            />
        </>
    );

    /* ── Embedded mode: return content directly (no Dialog wrapper) ── */
    if (embedded) {
        return (
            <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                {serviceDetailContent}
            </Box>
        );
    }

    /* ── Normal mode: wrap in a Dialog ── */
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            fullScreen={isMobile}
            disableScrollLock
            slotProps={{ backdrop: { sx: { backdropFilter: "blur(6px)", bgcolor: "rgba(0,0,0,0.45)" } } }}
            PaperProps={{
                sx: {
                    borderRadius: isMobile ? 0 : 3,
                    height: isMobile ? "100%" : "92vh",
                    maxHeight: isMobile ? "100%" : "92vh",
                    overflow: "hidden",
                    width: isMobile ? "100%" : "min(780px, 90vw)",
                    position: "relative",
                },
            }}
        >
            {/* Frosted header bar with close button */}
            <Box
                sx={(t) => ({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    px: 1.5,
                    bgcolor: alpha(t.palette.background.paper, 0.95),
                    backdropFilter: "blur(8px)",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    zIndex: 10,
                })}
            >
                <IconButton size="small" onClick={handleClose} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Scrollable content */}
            <Box sx={{ position: "absolute", top: 48, left: 0, right: 0, bottom: 0, overflowY: "auto" }}>
                {serviceDetailContent}
            </Box>
        </Dialog>
    );
}
