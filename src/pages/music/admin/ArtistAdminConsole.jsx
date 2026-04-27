// src/pages/music/admin/ArtistAdminConsole.jsx
/**
 * Artist Admin Console
 * --------------------
 * Dual-purpose: setup mode (new artist) and edit mode (published artist).
 *
 * Setup mode activated via:
 *   /music/artist/setup           → creates draft first (name dialog)
 *   /music/artist/setup?token=xxx → resumes existing draft
 *
 * Edit mode activated via:
 *   /music/artists/:artistId/admin → standard admin console
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { secureFetch } from "../../../utils/secureFetch";
import { alpha, ThemeProvider, createTheme } from "@mui/material/styles";
import { themedInputSx } from "../../../components/themedInputSx";
import useRateLimit from "../../../utils/useRateLimit";
import RateLimitDialog from "../../../components/RateLimitDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VerifiedIcon from "@mui/icons-material/Verified";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import LinkIcon from "@mui/icons-material/Link";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SaveIcon from "@mui/icons-material/Save";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CropIcon from "@mui/icons-material/Crop";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

import {
    Alert,
    Avatar,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Slider,
    Snackbar,
    Stack,
    TextField,
    Typography,
    useTheme,
    useMediaQuery,
} from "@mui/material";

import Cropper from "react-easy-crop";

import {
    getArtist,
    createArtistDraft,
    fetchArtistInviteDetails,
    saveArtistDraft,
    completeArtistSetup,
    deleteArtistDraft,
    checkArtistSlug,
    updateArtist,
} from "../api/artists";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import ProfileTab from "./tabs/ProfileTab";
import GenresTab from "./tabs/GenreTab";
import LinksTab from "./tabs/LinksTab";
import PhotosTab from "./tabs/PhotosTab";
import AboutTab from "./tabs/AboutTab";

import ArtistLivePreview from "../components/ArtistLivePreview";
import { useActiveAccount } from "../../../components/AccountContext";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../../components/Header/Header";
import NotFound from "../../../pages/NotFound";
import SuccessSnackbar, { useSuccessSnackbar } from '../../../components/SuccessSnackbar';
import NetworkErrorState, { isNetworkError } from '../../../components/NetworkErrorState';
import { checkFieldsProfanity } from '../../../utils/profanityCheck';
import { checkReservedUsername } from '../../../utils/reservedUsernames';
import { validateImageFile } from '../../../utils/validateImage';

// Alabama location data — used as an on-save fallback to geocode city/county
// into lat/lng when the ProfileTab didn't supply coordinates. Mirrors the
// pattern used by the community post forms (useBasePostForm.coordsFromLocalData).
import cityData from "../../../data/alabamaCities.json";
import countyData from "../../../data/alabamaCounties.json";
import useChromeTop from "../../../hooks/useChromeTop";

// ── Crop helpers (outside component) ──────────────────────────────
const AVATAR_ASPECT = 1;
const COVER_ASPECT = 3;

// ── Follow counts helper (mirrors ArtistDetailPanel) ──────────────
const FOLLOW_API_BASE = (() => {
    const raw = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
    return raw ? `${raw}/api` : "/api";
})();

async function fetchArtistFollowCounts(artistId, viewerUserId) {
    if (!artistId) return { followers: 0, following: 0 };
    try {
        if (viewerUserId) {
            const res = await secureFetch(
                `${FOLLOW_API_BASE}/follows/social/${encodeURIComponent(viewerUserId)}?account_type=artist&account_id=${artistId}`,
                { credentials: "include", headers: { Accept: "application/json" } }
            );
            if (res.ok) {
                const data = await res.json();
                const followersArr = Array.isArray(data?.followers) ? data.followers : [];
                const followingArr = Array.isArray(data?.following) ? data.following : [];
                return { followers: followersArr.length, following: followingArr.length };
            }
        }
        const res = await secureFetch(`${FOLLOW_API_BASE}/follows/counts/artist/${artistId}`, {
            credentials: "include",
        });
        if (!res.ok) return { followers: 0, following: 0 };
        const data = await res.json();
        return { followers: Number(data?.followers) || 0, following: Number(data?.following) || 0 };
    } catch {
        return { followers: 0, following: 0 };
    }
}

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", (e) => reject(e));
        img.crossOrigin = "anonymous";
        img.src = url;
    });

const createCroppedImage = async (imageSrc, pixelCrop, w, h) => {
    const img = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, w, h);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))), "image/jpeg", 0.92);
    });
};

async function uploadFileToGCS(file, folder) {
    const res = await secureFetch("/api/uploads/signed-url", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, fileName: `${Date.now()}_${file.name || "photo.jpg"}`, contentType: file.type || "image/jpeg", kind: "artist_photo" }),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let friendlyMsg = "Failed to get upload URL";
        try {
            const errData = JSON.parse(errText);
            if (errData?.error === "invalid_content_type") {
                friendlyMsg = "This file type isn\u2019t supported. Please upload a JPG, PNG, or WebP image.";
            } else if (errData?.error === "file_too_large") {
                friendlyMsg = "This file is too large. Please choose a smaller image (max 10 MB).";
            } else if (errData?.error) {
                friendlyMsg = errData.message || `Upload failed: ${errData.error.replace(/_/g, " ")}`;
            }
        } catch {
            if (errText) friendlyMsg = errText;
        }
        throw new Error(friendlyMsg);
    }
    const data = await res.json();
    const uploadUrl = data.signedUrl || data.signed_url || data.uploadUrl || data.upload_url || data.url || "";
    if (!uploadUrl) throw new Error("Missing upload URL");
    const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "image/jpeg" }, body: file });
    if (!putRes.ok) throw new Error("Upload failed");

    // The signed upload URL is the authoritative target for where this
    // file was actually PUT. Derive the object path from the URL itself
    // (strip the bucket prefix) and store THAT, so the path we send to
    // the backend matches what's actually in the bucket.
    //
    // Why prefer the URL over the endpoint's `objectPath` field: some
    // deployments of /api/uploads/signed-url mutate the filename between
    // generating the signed URL and assembling the response (e.g. by
    // prefixing an internal timestamp), so `data.objectPath` can point
    // at a different path than the one the PUT actually landed at. The
    // URL's pathname is immutable ground truth.
    //
    // Handles both host styles:
    //   - https://storage.googleapis.com/<bucket>/<path>
    //   - https://<bucket>.storage.googleapis.com/<path>
    try {
        const u = new URL(uploadUrl);
        if (u.hostname === "storage.googleapis.com") {
            const parts = u.pathname.replace(/^\/+/, "").split("/");
            if (parts.length >= 2) return decodeURIComponent(parts.slice(1).join("/"));
        } else if (u.hostname.endsWith(".storage.googleapis.com")) {
            return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
        }
    } catch { /* not a URL — fall through */ }

    // Fallback: explicit objectPath field if the URL couldn't be parsed.
    const objectPath = (data.objectPath || data.object_path || "").trim();
    if (objectPath) return objectPath;

    // Last resort: bare URL without query string.
    return uploadUrl.split("?")[0];
}

/**
 * Run server-side NSFW moderation on an image file before uploading to GCS.
 * Reuses the business moderation endpoint (auth + file buffer, no business-specific logic).
 */
async function moderateImageFile(file) {
    try {
        const form = new FormData();
        form.append('file', file);
        const res = await secureFetch('/api/music/moderate-image', {
            method: 'POST',
            credentials: 'include',
            body: form,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            return { safe: false, message: data?.message || 'This image doesn’t meet our community guidelines.' };
        }
        const data = await res.json().catch(() => ({ safe: true }));
        return data;
    } catch {
        return { safe: true };
    }
}

/**
 * Moderate then upload. Throws with err.isModeration = true on NSFW rejection.
 */
async function moderateAndUpload(file, folder) {
    const modResult = await moderateImageFile(file);
    if (!modResult.safe) {
        const err = new Error(modResult.message || 'This image was flagged for inappropriate content.');
        err.isModeration = true;
        throw err;
    }
    return uploadFileToGCS(file, folder);
}

/* ──────────────────────────────────────────────────────────────
   Location → coordinates helper
   --------------------------------
   Mirrors the coordsFromLocalData pattern used by useBasePostForm
   in the community post flow. When the user saves an artist
   profile with a city/county but no explicit lat/lng (the
   ProfileTab doesn't always populate coords), we look up the
   centroid from the local alabamaCities.json / alabamaCounties.json
   data. This ensures artist rows always get plottable coordinates
   — matching the behavior that already works for community posts.
   ────────────────────────────────────────────────────────────── */
const _stripCountySuffix = (s) => String(s || "").replace(/ County$/i, "").trim();

function _centroidFromFeature(feature) {
    const geom = feature?.geometry;
    if (!geom) return null;
    const { type, coordinates } = geom;

    // Point: [lng, lat] → return [lat, lng]
    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
    }

    // Polygon or MultiPolygon — bounding-box centroid.
    const rings = type === "Polygon"
        ? (Array.isArray(coordinates) ? coordinates : [])
        : type === "MultiPolygon"
            ? (Array.isArray(coordinates) ? coordinates.flat() : [])
            : [];

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const ring of rings) {
        if (!Array.isArray(ring)) continue;
        for (const pt of ring) {
            if (!Array.isArray(pt) || pt.length < 2) continue;
            const [lng, lat] = pt;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        }
    }
    if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
        return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    }
    return null;
}

/** Returns [lat, lng] for a city or county, or null if not found. */
function coordsFromLocalData(city, county) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);

    if (city) {
        const cityNorm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) => {
            const nm = String(f?.properties?.NAME || f?.properties?.name || f?.name || "").trim().toLowerCase();
            return nm === cityNorm;
        });
        if (hit) {
            const coords = _centroidFromFeature(hit);
            if (coords) return coords;
        }
    }
    if (county) {
        const countyNorm = _stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) => {
            const nm = _stripCountySuffix(f?.properties?.NAME || f?.properties?.name || f?.name || "").toLowerCase();
            return nm === countyNorm;
        });
        if (hit) {
            const coords = _centroidFromFeature(hit);
            if (coords) return coords;
        }
    }
    return null;
}

function ImageCropDialog({ open, onClose, imageSrc, aspect, title, onCropComplete, outputSize, cropShape }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing] = useState(false);

    const onCropChange = useCallback((c) => setCrop(c), []);
    const onZoomChange = useCallback((z) => setZoom(z), []);
    const onCropCompleteCallback = useCallback((_ca, px) => setCroppedAreaPixels(px), []);

    const handleSave = async () => {
        if (!croppedAreaPixels || !imageSrc) return;
        setProcessing(true);
        try {
            const blob = await createCroppedImage(imageSrc, croppedAreaPixels, outputSize.width, outputSize.height);
            onCropComplete(blob);
            onClose();
        } catch { /* silent */ } finally { setProcessing(false); }
    };

    const handleClose = () => { setCrop({ x: 0, y: 0 }); setZoom(1); onClose(); };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CropIcon sx={{ color: "primary.dark" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
                </Box>
                <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ position: "relative", width: "100%", height: { xs: 300, sm: 400 }, bgcolor: "grey.900" }}>
                    {imageSrc ? <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={aspect} cropShape={cropShape} showGrid={cropShape !== "round"} onCropChange={onCropChange} onZoomChange={onZoomChange} onCropComplete={onCropCompleteCallback} /> : null}
                </Box>
                <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <ZoomInIcon sx={{ color: "text.secondary" }} />
                    <Slider value={zoom} min={1} max={3} step={0.1} onChange={(_e, z) => setZoom(z)} sx={{ color: "primary.dark" }} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={processing} sx={{ textTransform: "none", fontWeight: 700, boxShadow: "none" }}>
                    {processing ? "Processing..." : "Apply Crop"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Stable empty defaults — OUTSIDE component to prevent re-creation each render
const EMPTY_GENRES = [];
const EMPTY_LINKS = {};
const EMPTY_PHOTOS = [];

/* --- FormSection --- */
function FormSection({ title, icon, defaultOpen = true, children }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Box sx={{ mb: 0.5 }}>
            <Box
                onClick={() => setOpen((v) => !v)}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: "pointer",
                    py: 1.25,
                    px: 0.5,
                    userSelect: "none",
                    "&:hover": { opacity: 0.8 },
                }}
            >
                {open ? (
                    <ExpandLessIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                ) : (
                    <ExpandMoreIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                )}
                {icon ? (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            color: "text.secondary",
                            "& .MuiSvgIcon-root": { fontSize: 17 },
                        }}
                    >
                        {icon}
                    </Box>
                ) : null}
                <Typography
                    sx={{
                        fontWeight: 900,
                        fontSize: 12.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "text.secondary",
                    }}
                >
                    {title}
                </Typography>
            </Box>
            <Collapse in={open} unmountOnExit={false}>
                <Box sx={{ pt: 0.5, pb: 1 }}>{children}</Box>
            </Collapse>
        </Box>
    );
}

/* ============================================================================
 * Admin desktop breakpoint
 * ----------------------------------------------------------------------------
 * The Business Hub page treats anything under 1440px as "mobile"
 * (see BusinessHubPage.jsx: `useMediaQuery('(max-width:1439px)')`). We mirror
 * that here so the admin console form switches layouts at the same point.
 *
 * Implementation: we locally remap the MUI `md` breakpoint to 1440. Every
 * existing `{ xs, md }` sx prop on this page keeps working unchanged —
 * only the effective threshold changes.
 *
 * The live preview is gated separately via the `xl` key so it only appears
 * on genuine-desktop widths (>=1536px).
 * ========================================================================== */
const ADMIN_DESKTOP_MIN = 1440;

function buildAdminTheme(baseTheme) {
    // The documented MUI pattern: pass breakpoints.values as part of a
    // SINGLE options object. MUI then runs its breakpoints pipeline fresh,
    // generating `up`/`down`/`between`/`only` methods closed over the new
    // values. If we instead passed breakpoints as a second-arg override,
    // MUI would merge the values in AFTER the methods were already baked —
    // leaving the `sx={{ md: ... }}` shorthand resolving at the old
    // thresholds.
    return createTheme({
        palette: baseTheme.palette,
        typography: baseTheme.typography,
        shape: baseTheme.shape,
        shadows: baseTheme.shadows,
        transitions: baseTheme.transitions,
        zIndex: baseTheme.zIndex,
        components: baseTheme.components,
        spacing: baseTheme.spacing,
        direction: baseTheme.direction,
        custom: baseTheme.custom,
        breakpoints: {
            values: {
                ...baseTheme.breakpoints.values,
                md: ADMIN_DESKTOP_MIN,
                lg: Math.max(baseTheme.breakpoints.values.lg, ADMIN_DESKTOP_MIN + 1),
                xl: Math.max(baseTheme.breakpoints.values.xl, ADMIN_DESKTOP_MIN + 96),
            },
        },
    });
}

/* --- Main Component --- */
export default function ArtistAdminConsole({ user }) {
    const { artistId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const baseTheme = useTheme();
    // Local theme with `md` remapped to 1440 (the Business Hub page's
    // mobile threshold). Every `{ xs, md }` sx prop now flips at 1440.
    const theme = useMemo(() => buildAdminTheme(baseTheme), [baseTheme]);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const chromeTop = useChromeTop();

    // Track scroll direction so mobile bottom bar slides to bottom: 0 when nav hides
    const [bottomNavHidden, setBottomNavHidden] = useState(false);
    useEffect(() => {
        if (!isMobile) return;
        let lastY = window.scrollY;
        const THRESHOLD = 10;
        const onScroll = () => {
            const y = window.scrollY;
            if (Math.abs(y - lastY) < THRESHOLD) return;
            setBottomNavHidden(y > lastY && y > 50);
            lastY = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isMobile]);

    // -- Setup mode detection --
    // Matches both the new `/artists/setup` path and the legacy `/artist/setup`
    // path so any in-flight links keep working through the route rename.
    const isSetupRoute =
        location.pathname.includes("/artists/setup") ||
        location.pathname.includes("/artist/setup");
    const urlToken = searchParams.get("token") || "";
    // 'music' (default) or 'artist' — controls which sections render below.
    const rawUrlType = (searchParams.get("type") || "").toLowerCase();
    const urlProfileType = (rawUrlType === "artist") ? "artist" : "music";

    // -- Active account check (must be logged into artist account to access admin) --
    const { isArtistAccount, activeArtistId } = useActiveAccount();

    // Redirect to home if user switches accounts while on admin console
    // NOTE: Account switching navigation is now handled by the Header component,
    // which shows an elegant "Switching to..." overlay before navigating.
    // The old handler here did window.location.assign("/") immediately which
    // caused a white flash. Removed to let the Header handle it properly.

    // -- Setup mode state --
    const [setupMode, setSetupMode] = useState(isSetupRoute);
    const [setupToken, setSetupToken] = useState(urlToken);
    const [setupLoading, setSetupLoading] = useState(isSetupRoute);
    const [setupNameInput, setSetupNameInput] = useState("");
    const [setupNameDialogOpen, setSetupNameDialogOpen] = useState(false);
    const [setupNameSubmitting, setSetupNameSubmitting] = useState(false);
    const [setupNameProfanityError, setSetupNameProfanityError] = useState("");
    const [setupTransitioning, setSetupTransitioning] = useState(false);
    const [setupSubmitted, setSetupSubmitted] = useState(false);
    const [draftSaving, setDraftSaving] = useState(false);
    const [submittingForReview, setSubmittingForReview] = useState(false);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
    const [deletingDraft, setDeletingDraft] = useState(false);

    // ── Rate limiting: draft creation & submit-for-review ──
    const { checkLimit: checkDraftCreateLimit, recordAction: recordDraftCreate } = useRateLimit('artist-draft-create', {
        burstMax: 3,
        burstWindowMs: 60_000,      // max 3 drafts per minute
        maxPerHour: 10,
    });
    const { checkLimit: checkSubmitLimit, recordAction: recordSubmitAction } = useRateLimit('artist-submit-review', {
        burstMax: 2,
        burstWindowMs: 30_000,      // max 2 submissions per 30 s
        maxPerHour: 8,
    });
    const [draftLimitReached, setDraftLimitReached] = useState(false);
    const [rateLimitOpen, setRateLimitOpen] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState({ retryAfterSec: 0, reason: '', actionLabel: '' });

    // -- Handle/slug availability checking --
    const [handleError, setHandleError] = useState("");
    const [handleChecking, setHandleChecking] = useState(false);
    const [handleAvailable, setHandleAvailable] = useState(null);
    const handleCheckTimerRef = useRef(null);

    // -- Core state --
    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(!isSetupRoute);
    const [error, setError] = useState("");
    const [rawLoadError, setRawLoadError] = useState(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [userRole, setUserRole] = useState(null);

    // Effective profile type: 'music' (default) or 'artist' (visual artists).
    // Prefer the loaded artist row; during early setup (before the artist has
    // been fetched) fall back to the ?type= URL param so sections render
    // correctly on the very first paint. The serializer may expose the DB
    // column as either `profile_type` or `profileType` depending on its
    // current state, so we check both.
    // Resolve the artist's sub-type ('music' | 'artist'). The URL's explicit
    // ?type=... (from the header's "Create an Artist Profile" CTA, or a draft
    // link that carried it forward) is treated as authoritative when present
    // — this lets existing drafts with a stale profile_type get corrected on
    // the next save. When the URL is silent, we trust the stored value.
    const profileType = useMemo(() => {
        if (rawUrlType === "artist" || rawUrlType === "music") return rawUrlType;
        const fromArtist = (artist?.profile_type || artist?.profileType || "").toLowerCase();
        if (fromArtist === "artist" || fromArtist === "music") return fromArtist;
        return urlProfileType;
    }, [artist, rawUrlType, urlProfileType]);
    const isVisualArtist = profileType === "artist";
    const { showSuccess, snackbarProps: successSnackbarProps } = useSuccessSnackbar();
    const [globalSaving, setGlobalSaving] = useState(false);

    // Photo moderation error snackbar
    const [photoModerationError, setPhotoModerationError] = useState('');
    const showPhotoError = useCallback((msg) => setPhotoModerationError(msg), []);
    const clearPhotoError = useCallback(() => setPhotoModerationError(''), []);

    // Per-field profanity errors (inline on text fields instead of top banner)
    const [profanityFieldErrors, setProfanityFieldErrors] = useState({});

    // Follow counts for live preview
    const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

    // Avatar & Cover photo state (managed at console level, like business)
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [avatarRemoved, setAvatarRemoved] = useState(false);
    const [coverRemoved, setCoverRemoved] = useState(false);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [cropType, setCropType] = useState(null);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    // Live preview overrides
    const [previewOverrides, setPreviewOverrides] = useState({});

    // Save handler registry
    const saveHandlersRef = useRef({});
    // Data collector registry — tabs register getData() functions so save can
    // read their current state directly (not via async previewOverrides)
    const dataCollectorsRef = useRef({});
    const contentRef = useRef(null);

    const artistIdResolved = artist?.id || artistId;

    const registerSaveHandler = useCallback((handler) => {
        if (!handler || !handler.key) return undefined;
        saveHandlersRef.current[handler.key] = handler;
        return () => {
            delete saveHandlersRef.current[handler.key];
        };
    }, []);

    const registerDataCollector = useCallback((key, getDataFn) => {
        if (!key || typeof getDataFn !== "function") return undefined;
        dataCollectorsRef.current[key] = getDataFn;
        return () => {
            delete dataCollectorsRef.current[key];
        };
    }, []);

    /** Collect all current tab data synchronously from registered collectors */
    const collectTabData = useCallback(() => {
        const collected = {};
        Object.entries(dataCollectorsRef.current).forEach(([key, getData]) => {
            try {
                const data = getData();
                if (data && typeof data === "object") {
                    Object.assign(collected, data);
                }
            } catch { /* ignore */ }
        });
        return collected;
    }, []);

    const handleFieldChange = useCallback((fields) => {
        setPreviewOverrides((prev) => ({ ...prev, ...fields }));
    }, []);

    // ── Avatar & Cover handlers (matching business pattern) ──
    const handleAvatarSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === "image/gif") { showPhotoError("GIFs aren\u2019t supported for profile photos. Please upload a JPG, PNG, or WebP image."); e.target.value = ""; return; }
        const imgError = validateImageFile(file);
        if (imgError) { setError(imgError); e.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = () => { setCropImageSrc(reader.result); setCropType("avatar"); setCropDialogOpen(true); };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleCoverSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === "image/gif") { showPhotoError("GIFs aren\u2019t supported for cover photos. Please upload a JPG, PNG, or WebP image."); e.target.value = ""; return; }
        const imgError = validateImageFile(file);
        if (imgError) { setError(imgError); e.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = () => { setCropImageSrc(reader.result); setCropType("cover"); setCropDialogOpen(true); };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleCropComplete = async (croppedBlob) => {
        // Run NSFW moderation on the cropped image immediately
        const modResult = await moderateImageFile(croppedBlob);
        if (!modResult.safe) {
            showPhotoError(modResult.message || 'This image doesn’t meet our community guidelines.');
            setCropDialogOpen(false);
            setCropImageSrc(null);
            setCropType(null);
            return;
        }

        if (cropType === "avatar") {
            setAvatarFile(croppedBlob);
            setAvatarRemoved(false);
            const preview = URL.createObjectURL(croppedBlob);
            setAvatarPreview(preview);
            handleFieldChange({ avatarUrl: preview });
        } else if (cropType === "cover") {
            setCoverFile(croppedBlob);
            setCoverRemoved(false);
            const preview = URL.createObjectURL(croppedBlob);
            setCoverPreview(preview);
            handleFieldChange({ coverUrl: preview });
        }
    };

    // ── Remove Avatar / Cover handlers ──
    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarRemoved(true);
        handleFieldChange({ avatarUrl: "" });
    };

    const handleRemoveCover = () => {
        setCoverFile(null);
        setCoverPreview(null);
        setCoverRemoved(true);
        handleFieldChange({ coverUrl: "" });
    };

    const displayAvatarSrc = avatarRemoved ? "" : (avatarPreview || artist?.avatarUrl || artist?.avatar_url || "");
    const displayCoverSrc = coverRemoved ? "" : (coverPreview || artist?.coverUrl || artist?.cover_url || "");
    const hasCustomAvatar = Boolean(!avatarRemoved && (avatarPreview || artist?.avatarUrl || artist?.avatar_url));

    const checkHandleAvailability = useCallback(
        (value) => {
            if (handleCheckTimerRef.current) clearTimeout(handleCheckTimerRef.current);

            // Reserved username check (route conflicts + personally reserved)
            const reservedResult = checkReservedUsername(value);
            if (reservedResult.reserved) {
                setHandleError(reservedResult.message);
                setHandleAvailable(false);
                setHandleChecking(false);
                return;
            }
            // Client-side profanity check on handle
            if (value) {
                const profResult = checkFieldsProfanity({ username: value });
                if (!profResult.clean) {
                    setHandleError('Username contains inappropriate language. Please revise.');
                    setHandleAvailable(false);
                    setHandleChecking(false);
                    return;
                }
            }

            setHandleChecking(true);
            setHandleAvailable(null);
            handleCheckTimerRef.current = setTimeout(async () => {
                try {
                    const data = await checkArtistSlug(value, artistIdResolved || null);
                    setHandleAvailable(data.available);
                    setHandleError(data.available ? "" : data.message || "Handle is taken.");
                } catch {
                    setHandleError("Could not check handle.");
                    setHandleAvailable(null);
                } finally {
                    setHandleChecking(false);
                }
            }, 400);
        },
        [artistIdResolved]
    );

    // -- Fetch artist (edit mode) --
    const fetchArtistData = useCallback(
        async (isInitial) => {
            if (!artistId) {
                setError("No artist ID provided.");
                setLoading(false);
                return;
            }

            if (isInitial) setLoading(true);
            setError("");

            try {
                const data = await getArtist({ artistId });

                if (!data) {
                    setError("Artist not found.");
                    if (isInitial) setLoading(false);
                    return;
                }

                setArtist(data);

                const userId = user?.id || user?.user_id;
                if (!userId) {
                    setHasAccess(false);
                    setUserRole(null);
                } else if (data.ownerUserId === userId) {
                    setHasAccess(true);
                    setUserRole("owner");
                } else {
                    try {
                        const teamRes = await secureFetch(
                            `/api/music/artists/${artistId}/team`,
                            { credentials: "include" }
                        );
                        if (teamRes.ok) {
                            const teamData = await teamRes.json();
                            const members = Array.isArray(teamData?.members) ? teamData.members : [];
                            const membership = members.find(
                                (m) => m.userId === userId || m.user_id === userId
                            );
                            if (membership) {
                                setHasAccess(true);
                                setUserRole(membership.role || "admin");
                            } else {
                                setHasAccess(false);
                                setUserRole(null);
                            }
                        } else {
                            setHasAccess(false);
                            setUserRole(null);
                        }
                    } catch {
                        setHasAccess(data.ownerUserId === userId);
                        setUserRole(data.ownerUserId === userId ? "owner" : null);
                    }
                }

                if (isInitial) setLoading(false);
            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : "Could not load artist.";
                setRawLoadError(fetchError);
                setError(message);
                if (isInitial) setLoading(false);
            }
        },
        [artistId, user?.id, user?.user_id]
    );

    // -- Edit mode: load artist --
    useEffect(() => {
        if (isSetupRoute || setupMode) return;
        fetchArtistData(true);
    }, [fetchArtistData, isSetupRoute, setupMode]);

    // -- Fetch follow counts for live preview --
    useEffect(() => {
        const id = artist?.id;
        if (!id) { setFollowCounts({ followers: 0, following: 0 }); return; }
        let cancelled = false;
        const viewerId = user?.public_id || user?.id || user?.handle;
        fetchArtistFollowCounts(id, viewerId).then((c) => {
            if (!cancelled) setFollowCounts(c);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [artist?.id, user?.id, user?.public_id, user?.handle]);

    // -- Setup mode initialization --
    useEffect(() => {
        if (!isSetupRoute) return;
        let cancelled = false;

        async function initSetup() {
            setSetupLoading(true);
            setError("");

            if (urlToken) {
                setSetupNameDialogOpen(false);
                try {
                    const data = await fetchArtistInviteDetails(urlToken);
                    if (cancelled) return;

                    if (data?.redirect_to) {
                        navigate(data.redirect_to, { replace: true });
                        return;
                    }

                    const art = data?.artist || null;
                    if (!art) {
                        setError("Artist not found for this setup link.");
                        setSetupLoading(false);
                        return;
                    }

                    // Normalize backend data
                    if (!art.photos && Array.isArray(art.gallery)) {
                        art.photos = art.gallery.map((url) => typeof url === "string" ? { id: url, url } : url);
                        art.photoUrls = art.gallery;
                    }
                    // Parse genres — may be string OR already-parsed array
                    if (Array.isArray(art.genres_json)) {
                        art.genres = art.genres_json;
                    } else if (typeof art.genres_json === "string" && !Array.isArray(art.genres)) {
                        try { art.genres = JSON.parse(art.genres_json); } catch { art.genres = []; }
                    }
                    if (!Array.isArray(art.genres)) art.genres = [];

                    // Parse links — may be string OR already-parsed object
                    if (art.links_json && typeof art.links_json === "object" && !Array.isArray(art.links_json)) {
                        art.links = art.links_json;
                    } else if (typeof art.links_json === "string") {
                        try { art.links = JSON.parse(art.links_json); } catch { art.links = {}; }
                    }
                    if (!art.links || typeof art.links !== "object") art.links = {};

                    setArtist(art);
                    setSetupToken(urlToken);
                    setSetupMode(true);
                    setUserRole("owner");
                    setHasAccess(true);
                } catch (err) {
                    if (cancelled) return;
                    if (err.redirect_to) {
                        navigate(err.redirect_to, { replace: true });
                        return;
                    }
                    setRawLoadError(err);
                    setError(err.message || "Failed to load setup data.");
                } finally {
                    if (!cancelled) setSetupLoading(false);
                }
                return;
            }

            if (!cancelled) {
                setSetupNameDialogOpen(true);
                setSetupLoading(false);
            }
        }

        initSetup();
        return () => { cancelled = true; };
    }, [isSetupRoute, urlToken, navigate]);

    // -- Create draft from name dialog --
    const handleSetupCreateDraft = async () => {
        const name = setupNameInput.trim();
        if (!name) return;

        // Profanity check — block before creating the draft
        const profanityResult = checkFieldsProfanity({ name });
        if (!profanityResult.clean) {
            setSetupNameProfanityError('This name contains inappropriate language. Please choose a different name.');
            return;
        }
        setSetupNameProfanityError('');

        // Rate-limit check
        const rl = checkDraftCreateLimit();
        if (!rl.allowed) {
            setRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'artist drafts' });
            setRateLimitOpen(true);
            return;
        }

        setSetupNameSubmitting(true);
        setError("");
        try {
            // Pass the URL-derived profile type so the backend knows whether
            // this is a music artist (default) or a visual artist.
            const data = await createArtistDraft(name, urlProfileType);

            // Backend may return a draft-limit error (max 5 drafts)
            if (data?.draftLimitReached) {
                setDraftLimitReached(true);
                setError(data.message || 'You can only have up to 5 music page drafts at a time. Please delete an existing draft before creating a new one.');
                setSetupNameSubmitting(false);
                return;
            }

            recordDraftCreate();

            if (data?.token) {
                setSetupToken(data.token);
                setSetupMode(true);
                const details = await fetchArtistInviteDetails(data.token);
                setArtist(details?.artist || null);
                setUserRole("owner");
                setHasAccess(true);
                setSetupTransitioning(true);
                setTimeout(() => {
                    setSetupNameDialogOpen(false);
                    setSetupTransitioning(false);
                }, 350);
                // Preserve the profile type in the URL so a refresh during
                // setup still renders the right conditional sections.
                navigate(
                    `/artists/setup?token=${encodeURIComponent(data.token)}&type=${urlProfileType}`,
                    { replace: true }
                );
                try { window.dispatchEvent(new CustomEvent("ll:artist:accounts-updated")); } catch { /* ignore */ }
            }
        } catch (err) {
            // Catch draft-limit 429 from backend
            if (err?.status === 429 || err?.response?.status === 429 || String(err.message).toLowerCase().includes('draft limit')) {
                setDraftLimitReached(true);
                setError(err.message || 'You can only have up to 5 music page drafts at a time. Please delete an existing draft before creating a new one.');
            } else {
                setError(err.message || "Failed to create artist draft.");
            }
        } finally {
            setSetupNameSubmitting(false);
        }
    };

    /**
     * Upload pending avatar/cover blobs to GCS and return the URLs to include in the save payload.
     * Called by handleSaveDraft, handleSubmitForReview, and handleGlobalSave.
     * Returns { avatar_url, cover_url } — only the keys that should be set on the payload.
     */
    const uploadPendingPhotos = async () => {
        const result = {};

        // Avatar
        if (avatarRemoved) {
            result.avatar_url = null;
        } else if (avatarFile) {
            try {
                // Ensure blob has the correct type for GCS upload
                const file = avatarFile instanceof Blob && !avatarFile.type
                    ? new Blob([avatarFile], { type: "image/jpeg" })
                    : avatarFile;
                // NOTE: no moderation scan here — the blob was already scanned
                // inside handleCropComplete when the user confirmed the crop.
                // Scanning again here was just adding a redundant network
                // round-trip (~1s) to every save of an edited avatar.
                const url = await uploadFileToGCS(file, "artists/avatars");
                result.avatar_url = url;
                setAvatarFile(null);
                // Keep the existing blob: preview intact — the upload just
                // returned a bucket-relative object path (e.g. "artists/avatars/...")
                // which is NOT renderable directly as <img src>. The preview
                // stays on the blob URL (set when the user cropped the image)
                // until the save response comes back with a properly-hydrated
                // signed URL in artist.avatar_url. A post-save effect revokes
                // the blob URL and clears the preview so artist.avatarUrl takes
                // over. Previously this line set the preview to the raw path,
                // which the browser resolved as a relative URL against the
                // current page and 404'd on the dev server.
                // (No setAvatarPreview here — the blob preview from crop time
                // is still active and still correct.)
                handleFieldChange({ avatarUrl: url });
            } catch (uploadErr) {
                if (uploadErr?.isModeration) {
                    showPhotoError(uploadErr.message || 'Profile photo was flagged for inappropriate content.');
                }
                // Upload failed — leave avatarFile in state for next attempt
                // but propagate so the caller knows save was incomplete
                throw uploadErr;
            }
        }
        // No else — if nothing changed, leave avatar_url out of the payload
        // entirely. The backend PATCH treats "key absent" as "don't touch this
        // field". Previously we fell through here and copied artist.avatarUrl
        // (a freshly-hydrated SIGNED URL with an expiring ?X-Goog-Signature=…)
        // back into the payload. That wrote the signed URL verbatim into the
        // DB cover_url column AND tripped the change-detection in
        // getChangedSingleImageDeletePath (which does a string compare — and
        // signed URLs have different signatures every time), causing the
        // actual GCS object to be deleted. End result: the private-bucket
        // signed URL returned on the next read would 404.

        // Cover
        if (coverRemoved) {
            result.cover_url = null;
        } else if (coverFile) {
            try {
                const file = coverFile instanceof Blob && !coverFile.type
                    ? new Blob([coverFile], { type: "image/jpeg" })
                    : coverFile;
                // Same rationale as avatar above — handleCropComplete scanned
                // this blob already. Direct upload here.
                const url = await uploadFileToGCS(file, "artists/covers");
                result.cover_url = url;
                setCoverFile(null);
                // Preserve the blob: preview from crop time — the returned
                // object path isn't renderable directly. See avatar comment
                // above for the full rationale.
                handleFieldChange({ coverUrl: url });
            } catch (uploadErr) {
                if (uploadErr?.isModeration) {
                    showPhotoError(uploadErr.message || 'Cover photo was flagged for inappropriate content.');
                }
                throw uploadErr;
            }
        }
        // No else — same reasoning as avatar above. Unchanged cover stays
        // out of the payload so the backend doesn't think we're resetting it.

        return result;
    };

    // -- Save Draft handler --
    const handleSaveDraft = async () => {
        if (!setupToken) return;

        // Client-side profanity check
        const tabData = collectTabData();
        const profanityFields = {
            name: String(artist?.name || '').trim(),
            bio: String(tabData.bio || '').trim(),
        };
        // Include handle in profanity check (matches ProfileHeader / Register / CreateGroupModal)
        const draftHandle = String(tabData.handle || previewOverrides.handle || artist?.handle || '').trim();
        if (draftHandle) profanityFields.username = draftHandle;
        // Also check highlight section titles and bodies
        const hlSecs = Array.isArray(tabData.highlightSections) ? tabData.highlightSections : [];
        hlSecs.forEach((s, i) => {
            if (s.title?.trim()) profanityFields[`highlight section ${i + 1} title`] = s.title.trim();
            if (s.body?.trim()) profanityFields[`highlight section ${i + 1} content`] = s.body.trim();
        });
        const profanityResult = checkFieldsProfanity(profanityFields);
        if (!profanityResult.clean) {
            const failedField = profanityResult.field || 'content';
            setProfanityFieldErrors({ [failedField]: `Your ${failedField} contains inappropriate language. Please revise.` });
            return;
        }
        setProfanityFieldErrors({});

        // Reserved username check on handle (safety net at save)
        if (draftHandle) {
            const reservedCheck = checkReservedUsername(draftHandle);
            if (reservedCheck.reserved) {
                setHandleError(reservedCheck.message);
                setHandleAvailable(false);
                setError('That username is reserved and cannot be used. Please choose a different one.');
                return;
            }
        }

        setDraftSaving(true);
        setError("");
        try {
            // Collect current data directly from all tabs via registered getData() functions.
            // This is synchronous and reads the ACTUAL current tab state — no stale closures.
            const tabData = collectTabData();

            const payload = {};
            if (artist?.name) payload.name = artist.name;

            // Profile sub-type — 'music' or 'artist'. Backend whitelists this
            // so a draft created with the wrong sub-type (e.g. older drafts
            // pre-dating the visual-artist option) can be corrected on save.
            // Resolution: existing artist value wins (authoritative) → URL hint
            // → 'music' default. The `profileType` memo already implements
            // this logic.
            payload.profile_type = profileType;

            // Profile fields — from tab data collectors, fall back to previewOverrides, then artist
            payload.handle = tabData.handle || previewOverrides.handle || artist?.handle || "";
            payload.bio = tabData.bio !== undefined ? tabData.bio : (previewOverrides.bio !== undefined ? previewOverrides.bio : (artist?.bio || ""));
            payload.city = tabData.city || previewOverrides.city || artist?.city || "";
            payload.county = tabData.county || previewOverrides.county || artist?.county || "";

            // Geocoded coordinates. Backend only persists them when BOTH are
            // present and finite, so forward the pair together. Source order:
            //   1. explicit lat/lng from tabData / previewOverrides / existing
            //      artist row (each may be flat or under 'location.')
            //   2. centroid lookup from the selected city/county against the
            //      local alabamaCities.json / alabamaCounties.json — same
            //      pattern the community post forms use. This guarantees
            //      artist rows always get plottable coords when the user has
            //      picked a location, matching the community flow that
            //      already works and fixing the missing-map-pins symptom.
            {
                const pickLat = (src) => src?.latitude ?? src?.lat ?? src?.location?.latitude ?? null;
                const pickLng = (src) => src?.longitude ?? src?.lng ?? src?.location?.longitude ?? null;
                const rawLat = pickLat(tabData) ?? pickLat(previewOverrides) ?? pickLat(artist);
                const rawLng = pickLng(tabData) ?? pickLng(previewOverrides) ?? pickLng(artist);
                let nLat = (rawLat === null || rawLat === "" || rawLat === undefined) ? null : Number(rawLat);
                let nLng = (rawLng === null || rawLng === "" || rawLng === undefined) ? null : Number(rawLng);

                // Fallback: derive coords from the selected city/county when
                // no explicit pair was available.
                if (!(Number.isFinite(nLat) && Number.isFinite(nLng))) {
                    const fromLocal = coordsFromLocalData(payload.city, payload.county);
                    if (fromLocal) {
                        [nLat, nLng] = fromLocal;
                    }
                }

                if (Number.isFinite(nLat) && Number.isFinite(nLng)) {
                    payload.latitude = nLat;
                    payload.longitude = nLng;
                }
            }

            // About fields — highlight sections
            // Highlight sections → stored in settings_json
            const hlSections = Array.isArray(tabData.highlightSections) && tabData.highlightSections.length > 0
                ? tabData.highlightSections
                : (Array.isArray(previewOverrides.highlightSections) ? previewOverrides.highlightSections : []);
            const validHlSections = hlSections.filter((s) => s.title?.trim() || s.body?.trim() || s.photoUrl);
            if (validHlSections.length > 0) {
                const existingSettings = artist?.settings || {};
                payload.settings_json = { ...existingSettings, highlightSections: validHlSections };
            }

            // Avatar & Cover — upload pending blobs and resolve URLs
            const avatarCoverResult = await uploadPendingPhotos();
            if (avatarCoverResult.avatar_url !== undefined) payload.avatar_url = avatarCoverResult.avatar_url;
            if (avatarCoverResult.cover_url !== undefined) payload.cover_url = avatarCoverResult.cover_url;

            // Genres — from tab data collector (synchronous, always current)
            const genresArr = Array.isArray(tabData.genres) && tabData.genres.length > 0
                ? tabData.genres
                : (Array.isArray(previewOverrides.genres) && previewOverrides.genres.length > 0
                    ? previewOverrides.genres
                    : (Array.isArray(artist?.genres) && artist.genres.length > 0 ? artist.genres : []));
            if (genresArr.length > 0) {
                payload.genres = genresArr;
                payload.genres_json = JSON.stringify(genresArr);
            }

            // Links — from tab data collector
            const linksRaw = (tabData.links && typeof tabData.links === "object" && Object.keys(tabData.links).length > 0)
                ? tabData.links
                : (previewOverrides.links && typeof previewOverrides.links === "object" && Object.keys(previewOverrides.links).length > 0
                    ? previewOverrides.links
                    : (artist?.links && typeof artist.links === "object" && Object.keys(artist.links).length > 0 ? artist.links : {}));
            const linksFiltered = {};
            Object.entries(linksRaw).forEach(([k, v]) => { if (v) linksFiltered[k] = v; });
            if (Object.keys(linksFiltered).length > 0) {
                payload.links = linksFiltered;
                payload.links_json = JSON.stringify(linksFiltered);
            }

            // Photos — upload any blob: files to GCS first, then collect URLs
            const photoDataCollector = dataCollectorsRef.current["photos"];
            let photoUrls = [];
            if (photoDataCollector) {
                const rawPhotos = photoDataCollector();
                photoUrls = Array.isArray(rawPhotos?.photos) ? rawPhotos.photos : [];
            }
            // Also check gallery state for items with file objects that need uploading
            // The dataCollector returns URLs, but blob: URLs need to be uploaded to GCS
            const finalPhotoUrls = [];
            for (const url of photoUrls) {
                if (url && !url.startsWith("blob:")) {
                    finalPhotoUrls.push(url);
                }
                // blob URLs are skipped — we need the file object to upload
            }
            // Upload any pending file objects from the gallery.
            //
            // Uploads run in parallel via Promise.all — a gallery with 4 new
            // photos used to be 4 sequential moderate+upload rounds (~6–10s),
            // now it's one concurrent wave (~2s). Order is preserved via
            // Array#map. Failed uploads are skipped silently, matching the
            // original loop's behavior.
            const galleryCollector = dataCollectorsRef.current["photos_full"];
            if (galleryCollector) {
                const fullGallery = galleryCollector();
                if (Array.isArray(fullGallery?.gallery)) {
                    const results = await Promise.all(
                        fullGallery.gallery.map(async (item) => {
                            if (item.file && item.url && item.url.startsWith("blob:")) {
                                try {
                                    return await moderateAndUpload(item.file, "artists/gallery");
                                } catch {
                                    return null;
                                }
                            } else if (item.url && !item.url.startsWith("blob:")) {
                                return item.url;
                            }
                            return null;
                        })
                    );
                    for (const url of results) {
                        if (url && !finalPhotoUrls.includes(url)) {
                            finalPhotoUrls.push(url);
                        }
                    }
                }
            }
            if (finalPhotoUrls.length > 0) {
                payload.photos = finalPhotoUrls;
            }

            const result = await saveArtistDraft(setupToken, payload);
            if (result?.artist) {
                const merged = { ...result.artist };
                // genres_json/links_json may come back as already-parsed arrays/objects
                // (knex returns JSON columns pre-parsed in some configs)
                if (Array.isArray(merged.genres_json)) {
                    merged.genres = merged.genres_json;
                } else if (typeof merged.genres_json === "string") {
                    try { merged.genres = JSON.parse(merged.genres_json); } catch { merged.genres = []; }
                }
                if (!Array.isArray(merged.genres)) merged.genres = [];

                if (merged.links_json && typeof merged.links_json === "object" && !Array.isArray(merged.links_json)) {
                    merged.links = merged.links_json;
                } else if (typeof merged.links_json === "string") {
                    try { merged.links = JSON.parse(merged.links_json); } catch { merged.links = {}; }
                }
                if (!merged.links || typeof merged.links !== "object") merged.links = {};

                // Normalize gallery → photos
                if ((!merged.photos || (Array.isArray(merged.photos) && merged.photos.length === 0)) && Array.isArray(merged.gallery) && merged.gallery.length > 0) {
                    merged.photos = merged.gallery.map((url) => typeof url === "string" ? { id: url, url } : url);
                    merged.photoUrls = merged.gallery;
                }
                // Overlay what we just saved to prevent tabs from reverting
                if (genresArr.length > 0) merged.genres = genresArr;
                if (Object.keys(linksFiltered).length > 0) merged.links = linksFiltered;
                setArtist(merged);
            }

            // If artist is pending_approval, re-submit so admin sees updated data
            if (artist?.status === "pending_approval") {
                try {
                    await completeArtistSetup(setupToken, payload);
                } catch { /* non-critical */ }
            }

            showSuccess(
                artist?.status === "pending_approval"
                    ? "Changes saved. The updated version will be reviewed."
                    : "Draft saved successfully."
            );

            // Reset removal flags — the save has persisted the current state
            setAvatarRemoved(false);
            setCoverRemoved(false);

            // Clear the blob: previews — the merged artist now holds the
            // hydrated signed URL from the server, and displayAvatarSrc /
            // displayCoverSrc prefer avatarPreview / coverPreview when set.
            // Revoke the object URLs to release the blob memory. Guarded in
            // try/catch because revokeObjectURL throws on non-blob strings.
            try {
                if (avatarPreview && typeof avatarPreview === "string" && avatarPreview.startsWith("blob:")) {
                    URL.revokeObjectURL(avatarPreview);
                }
            } catch { /* ignore */ }
            try {
                if (coverPreview && typeof coverPreview === "string" && coverPreview.startsWith("blob:")) {
                    URL.revokeObjectURL(coverPreview);
                }
            } catch { /* ignore */ }
            setAvatarPreview(null);
            setCoverPreview(null);

            try { window.dispatchEvent(new CustomEvent("ll:artist:accounts-updated")); } catch { /* ignore */ }
        } catch (err) {
            if (err.redirect_to) {
                navigate(err.redirect_to, { replace: true });
                return;
            }
            if (err.isModeration) {
                showPhotoError(err.message);
            } else {
                setError(err.message || "Failed to save draft.");
            }
        } finally {
            setDraftSaving(false);
        }
    };

    // -- Submit for Review handler --
    const handleSubmitForReview = async () => {
        if (!setupToken) return;

        // Rate-limit check for submissions
        const rl = checkSubmitLimit();
        if (!rl.allowed) {
            setRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'submissions' });
            setRateLimitOpen(true);
            return;
        }

        // Client-side profanity check (matches handleSaveDraft)
        const reviewTabData = collectTabData();
        const reviewProfanityFields = {
            name: String(artist?.name || '').trim(),
            bio: String(reviewTabData.bio || '').trim(),
        };
        const reviewHandle = String(reviewTabData.handle || previewOverrides.handle || artist?.handle || '').trim();
        if (reviewHandle) reviewProfanityFields.username = reviewHandle;
        const reviewHlSecs = Array.isArray(reviewTabData.highlightSections) ? reviewTabData.highlightSections : [];
        reviewHlSecs.forEach((s, i) => {
            if (s.title?.trim()) reviewProfanityFields[`highlight section ${i + 1} title`] = s.title.trim();
            if (s.body?.trim()) reviewProfanityFields[`highlight section ${i + 1} content`] = s.body.trim();
        });
        const reviewProfanityResult = checkFieldsProfanity(reviewProfanityFields);
        if (!reviewProfanityResult.clean) {
            const failedField = reviewProfanityResult.field || 'content';
            setProfanityFieldErrors({ [failedField]: `Your ${failedField} contains inappropriate language. Please revise.` });
            return;
        }
        setProfanityFieldErrors({});

        // Reserved username check on handle (safety net at submit)
        if (reviewHandle) {
            const reservedCheck = checkReservedUsername(reviewHandle);
            if (reservedCheck.reserved) {
                setHandleError(reservedCheck.message);
                setHandleAvailable(false);
                setError('That username is reserved and cannot be used. Please choose a different one.');
                return;
            }
        }

        setSubmittingForReview(true);
        setError("");
        try {
            // Collect data directly from tabs
            const tabData = collectTabData();

            const payload = {};
            if (artist?.name) payload.name = artist.name;
            // Profile sub-type passed through on submit-for-review too so the
            // backend can canonicalize the draft's sub-type at submission time.
            payload.profile_type = profileType;
            payload.handle = tabData.handle || previewOverrides.handle || artist?.handle || "";
            payload.bio = tabData.bio !== undefined ? tabData.bio : (previewOverrides.bio !== undefined ? previewOverrides.bio : (artist?.bio || ""));
            payload.city = tabData.city || previewOverrides.city || artist?.city || "";
            payload.county = tabData.county || previewOverrides.county || artist?.county || "";

            // Same coordinate handling as the save-draft path above, with the
            // same city/county → centroid fallback.
            {
                const pickLat = (src) => src?.latitude ?? src?.lat ?? src?.location?.latitude ?? null;
                const pickLng = (src) => src?.longitude ?? src?.lng ?? src?.location?.longitude ?? null;
                const rawLat = pickLat(tabData) ?? pickLat(previewOverrides) ?? pickLat(artist);
                const rawLng = pickLng(tabData) ?? pickLng(previewOverrides) ?? pickLng(artist);
                let nLat = (rawLat === null || rawLat === "" || rawLat === undefined) ? null : Number(rawLat);
                let nLng = (rawLng === null || rawLng === "" || rawLng === undefined) ? null : Number(rawLng);
                if (!(Number.isFinite(nLat) && Number.isFinite(nLng))) {
                    const fromLocal = coordsFromLocalData(payload.city, payload.county);
                    if (fromLocal) {
                        [nLat, nLng] = fromLocal;
                    }
                }
                if (Number.isFinite(nLat) && Number.isFinite(nLng)) {
                    payload.latitude = nLat;
                    payload.longitude = nLng;
                }
            }

            // About fields — highlight sections
            const hlSections2 = Array.isArray(tabData.highlightSections) && tabData.highlightSections.length > 0
                ? tabData.highlightSections
                : (Array.isArray(previewOverrides.highlightSections) ? previewOverrides.highlightSections : []);
            const validHlSections2 = hlSections2.filter((s) => s.title?.trim() || s.body?.trim() || s.photoUrl);
            if (validHlSections2.length > 0) {
                const existingSettings2 = artist?.settings || {};
                payload.settings_json = { ...existingSettings2, highlightSections: validHlSections2 };
            }

            // Avatar & Cover — upload pending blobs and resolve URLs
            const photoUrls2 = await uploadPendingPhotos();
            if (photoUrls2.avatar_url !== undefined) payload.avatar_url = photoUrls2.avatar_url;
            if (photoUrls2.cover_url !== undefined) payload.cover_url = photoUrls2.cover_url;

            const genresArr2 = Array.isArray(tabData.genres) && tabData.genres.length > 0
                ? tabData.genres
                : (Array.isArray(artist?.genres) && artist.genres.length > 0 ? artist.genres : []);
            if (genresArr2.length > 0) { payload.genres = genresArr2; payload.genres_json = JSON.stringify(genresArr2); }

            const linksRaw2 = (tabData.links && typeof tabData.links === "object" && Object.keys(tabData.links).length > 0)
                ? tabData.links : (artist?.links && typeof artist.links === "object" && Object.keys(artist.links).length > 0 ? artist.links : {});
            const linksFiltered2 = {};
            Object.entries(linksRaw2).forEach(([k, v]) => { if (v) linksFiltered2[k] = v; });
            if (Object.keys(linksFiltered2).length > 0) { payload.links = linksFiltered2; payload.links_json = JSON.stringify(linksFiltered2); }

            // Photos — upload blobs to GCS first (parallel; see loop above for rationale)
            const finalPhotoUrls2 = [];
            const galleryCollector2 = dataCollectorsRef.current["photos_full"];
            if (galleryCollector2) {
                const fullGallery = galleryCollector2();
                if (Array.isArray(fullGallery?.gallery)) {
                    const results = await Promise.all(
                        fullGallery.gallery.map(async (item) => {
                            if (item.file && item.url && item.url.startsWith("blob:")) {
                                try {
                                    return await moderateAndUpload(item.file, "artists/gallery");
                                } catch {
                                    return null;
                                }
                            } else if (item.url && !item.url.startsWith("blob:")) {
                                return item.url;
                            }
                            return null;
                        })
                    );
                    for (const url of results) {
                        if (url) finalPhotoUrls2.push(url);
                    }
                }
            }
            if (finalPhotoUrls2.length > 0) payload.photos = finalPhotoUrls2;

            await saveArtistDraft(setupToken, payload);
            await completeArtistSetup(setupToken, payload);

            setSetupSubmitted(true);
            recordSubmitAction();
            showSuccess(isVisualArtist ? "Your artist page has been submitted for review!" : "Your music page has been submitted for review!");

            try { window.dispatchEvent(new CustomEvent("ll:artist:accounts-updated")); } catch { /* ignore */ }
            try { window.dispatchEvent(new CustomEvent("ll:notifications:refresh")); } catch { /* ignore */ }
        } catch (err) {
            if (err.redirect_to) {
                navigate(err.redirect_to, { replace: true });
                return;
            }
            if (err.isModeration) {
                showPhotoError(err.message);
            } else if (err?.status === 429 && (err?.data?.pendingLimitReached || String(err.message).toLowerCase().includes('waiting for review'))) {
                setError(err.message || 'You already have 5 music pages waiting for review. Please wait for some to be reviewed before submitting more.');
            } else {
                setError(err.message || "Failed to submit for review.");
            }
        } finally {
            setSubmittingForReview(false);
        }
    };

    // -- Delete Draft handler --
    const handleDeleteDraft = async () => {
        if (!setupToken) return;
        setDeletingDraft(true);
        try {
            await deleteArtistDraft(setupToken);
            try { window.dispatchEvent(new CustomEvent("ll:artist:accounts-updated")); } catch { /* ignore */ }
            navigate("/music", { replace: true });
        } catch (err) {
            setError(err.message || "Failed to delete draft.");
        } finally {
            setDeletingDraft(false);
            setDeleteConfirmDialogOpen(false);
        }
    };

    // -- Toast --
    const showSaveToast = useCallback((message) => {
        showSuccess(message || "Changes saved!");
    }, [showSuccess]);

    const refreshArtist = useCallback(async () => {
        if (setupMode && setupToken) {
            try {
                const details = await fetchArtistInviteDetails(setupToken);
                if (details?.artist) {
                    const art = details.artist;
                    if (!art.photos && Array.isArray(art.gallery)) {
                        art.photos = art.gallery.map((url) => typeof url === "string" ? { id: url, url } : url);
                        art.photoUrls = art.gallery;
                    }
                    if (Array.isArray(art.genres_json)) {
                        art.genres = art.genres_json;
                    } else if (typeof art.genres_json === "string" && !Array.isArray(art.genres)) {
                        try { art.genres = JSON.parse(art.genres_json); } catch { art.genres = []; }
                    }
                    if (!Array.isArray(art.genres)) art.genres = [];

                    if (art.links_json && typeof art.links_json === "object" && !Array.isArray(art.links_json)) {
                        art.links = art.links_json;
                    } else if (typeof art.links_json === "string") {
                        try { art.links = JSON.parse(art.links_json); } catch { art.links = {}; }
                    }
                    if (!art.links || typeof art.links !== "object") art.links = {};
                    setArtist(art);
                }
            } catch { /* ignore */ }
        } else {
            await fetchArtistData(false);
        }
        try {
            window.dispatchEvent(new CustomEvent("ll:artist:updated"));
        } catch { /* ignore */ }
    }, [fetchArtistData, setupMode, setupToken]);

    // -- Global Save (edit mode) --
    const handleGlobalSave = useCallback(async () => {
        const handlers = Object.values(saveHandlersRef.current);
        const withChanges = handlers.filter((h) => h.hasChanges);

        // Check if there are pending avatar/cover changes (not tracked by tab handlers)
        const hasPhotoChanges = Boolean(avatarFile || coverFile || avatarRemoved || coverRemoved);

        if (withChanges.length === 0 && !hasPhotoChanges) {
            showSaveToast("No changes to save.");
            return;
        }

        setGlobalSaving(true);
        let allSuccess = true;

        // Upload pending avatar/cover and persist via PATCH
        if (hasPhotoChanges && artist?.id) {
            try {
                const photoPayload = await uploadPendingPhotos();
                const patchPayload = {};
                if (photoPayload.avatar_url !== undefined) patchPayload.avatarUrl = photoPayload.avatar_url;
                if (photoPayload.cover_url !== undefined) patchPayload.coverUrl = photoPayload.cover_url;
                if (Object.keys(patchPayload).length > 0) {
                    await updateArtist({ artistId: artist.id, payload: patchPayload });
                    // Reset removal flags after successful save
                    setAvatarRemoved(false);
                    setCoverRemoved(false);

                    // Revoke any blob: previews from the crop step — the DB
                    // now holds the authoritative state and the next render
                    // should use the freshly-hydrated signed URL (or null,
                    // for a removal). Guarded because revokeObjectURL throws
                    // on non-blob strings.
                    try {
                        if (avatarPreview && typeof avatarPreview === "string" && avatarPreview.startsWith("blob:")) {
                            URL.revokeObjectURL(avatarPreview);
                        }
                    } catch { /* ignore */ }
                    try {
                        if (coverPreview && typeof coverPreview === "string" && coverPreview.startsWith("blob:")) {
                            URL.revokeObjectURL(coverPreview);
                        }
                    } catch { /* ignore */ }
                    setAvatarPreview(null);
                    setCoverPreview(null);

                    // Clear stale preview overrides for avatar/cover so
                    // displayAvatarSrc / displayCoverSrc fall through to the
                    // freshly-hydrated artist.avatarUrl / artist.coverUrl
                    // once the refresh below completes. Without this, a
                    // lingering override would keep the old URL on-screen.
                    setPreviewOverrides((prev) => {
                        const next = { ...prev };
                        if (patchPayload.avatarUrl !== undefined) delete next.avatarUrl;
                        if (patchPayload.coverUrl !== undefined) delete next.coverUrl;
                        return next;
                    });

                    // Refresh the artist state from the server. Without this
                    // the local `artist` still holds the pre-save avatarUrl,
                    // so removing the avatar "succeeds" on the backend but
                    // the old photo stays on-screen until a hard refresh.
                    await refreshArtist();
                }
                // Notify Header to refresh
                try { window.dispatchEvent(new CustomEvent("ll:artist:accounts-updated")); } catch { /* ignore */ }
                try { window.dispatchEvent(new CustomEvent("ll:artist:updated")); } catch { /* ignore */ }
            } catch (photoErr) {
                allSuccess = false;
                if (photoErr?.isModeration) {
                    showPhotoError(photoErr.message || 'Photo was flagged for inappropriate content.');
                } else {
                    setError(photoErr?.message || "Failed to upload profile/cover photo.");
                }
            }
        }

        for (const handler of withChanges) {
            try {
                const result = await handler.save();
                if (result === false) allSuccess = false;
            } catch {
                allSuccess = false;
            }
        }

        setGlobalSaving(false);
        if (allSuccess) {
            showSaveToast("All changes saved!");
        }
    }, [showSaveToast, avatarFile, coverFile, avatarRemoved, coverRemoved, artist?.id, showPhotoError, refreshArtist, avatarPreview, coverPreview]);

    const handleBackToProfile = useCallback(() => {
        if (setupMode) {
            navigate("/music");
            return;
        }
        if (artist?.handle) {
            navigate(`/${artist.handle}`);
            return;
        }
        if (artistId) {
            navigate(`/music/artists/${artistId}`);
            return;
        }
        navigate("/music");
    }, [artist?.handle, artistId, navigate, setupMode]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Disable page scroll when the setup name card is showing
    const showingNameCard = setupMode && setupNameDialogOpen && !artist;
    useEffect(() => {
        if (showingNameCard) {
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = ""; };
        }
    }, [showingNameCard]);

    // -- Render guards --

    if ((loading && !setupMode) || setupLoading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress />
            </Box>
        );
    }

    if (setupMode && setupNameDialogOpen && !artist) {
        return (
            <Box
                sx={{
                    minHeight: { xs: "100vh", sm: "calc(100vh - 73px)" },
                    height: { sm: "calc(100vh - 73px)" },
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "center",
                    bgcolor: "background.default",
                    overflow: { sm: "hidden" },
                    p: { xs: 0, sm: 2 },
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: { xs: "100%", sm: 480 },
                        width: "100%",
                        minHeight: { xs: "100vh", sm: "auto" },
                        p: { xs: 3, sm: 4 },
                        pt: { xs: 8, sm: 4 },
                        borderRadius: { xs: 0, sm: 3 },
                        border: { xs: "none", sm: "1px solid" },
                        borderColor: "divider",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: { xs: "flex-start", sm: "center" },
                        opacity: setupTransitioning ? 0 : 1,
                        transform: setupTransitioning ? "translateY(-24px)" : "translateY(0)",
                        transition: "opacity 350ms ease, transform 350ms ease",
                    }}
                >
                    <Box
                        sx={(t) => ({
                            width: 56,
                            height: 56,
                            borderRadius: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: alpha(t.palette.primary.main, 0.08),
                            mx: "auto",
                            mb: 2.5,
                        })}
                    >
                        {isVisualArtist
                            ? <PaletteRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />
                            : <MusicNoteIcon sx={{ fontSize: 28, color: "primary.main" }} />}
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 0.5 }}>
                        {isVisualArtist ? "Create Your Artist Page" : "Create Your Music Page"}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 3 }}>
                        {isVisualArtist
                            ? "Enter your name or the name you create under to get started."
                            : "Enter your artist or band name to get started."}
                    </Typography>

                    {error ? (
                        <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>{error}</Alert>
                    ) : null}

                    <TextField
                        fullWidth
                        label={isVisualArtist ? "Artist Name" : "Artist or Band Name"}
                        value={setupNameInput}
                        onChange={(e) => { setSetupNameInput(e.target.value.slice(0, 100)); if (setupNameProfanityError) setSetupNameProfanityError(''); }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && setupNameInput.trim() && !setupNameSubmitting) {
                                handleSetupCreateDraft();
                            }
                        }}
                        disabled={setupNameSubmitting || setupTransitioning}
                        error={Boolean(setupNameProfanityError)}
                        helperText={setupNameProfanityError || ''}
                        inputProps={{ maxLength: 100 }}
                        InputProps={{ sx: themedInputSx }}
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
                        <Button
                            onClick={() => navigate("/artists")}
                            disabled={setupNameSubmitting || setupTransitioning}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSetupCreateDraft}
                            disabled={!setupNameInput.trim() || setupNameSubmitting || setupTransitioning || Boolean(setupNameProfanityError)}
                            startIcon={setupNameSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{ borderRadius: 999, px: 3, fontWeight: 900, boxShadow: "none" }}
                        >
                            {setupNameSubmitting ? "Creating..." : "Get Started"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    if (setupMode && setupSubmitted) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "center",
                    bgcolor: "background.paper",
                    px: 3,
                    pt: { xs: 10, sm: 0 },
                    pb: { xs: 6, sm: 0 },
                }}
            >
                <Box sx={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
                    <Box
                        sx={(t) => ({
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: alpha(t.palette.success.main, 0.1),
                            mx: "auto",
                            mb: 2.5,
                        })}
                    >
                        <CheckCircleOutlineIcon sx={{ fontSize: 36, color: "success.main" }} />
                    </Box>
                    <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, sm: 24 }, mb: 1 }}>
                        Submitted for Review!
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 4, lineHeight: 1.6 }}>
                        Your {isVisualArtist ? "artist page" : "music page"} has been submitted and will be reviewed by our team. You will receive a notification when it is approved.
                    </Typography>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => { window.location.href = "/artists"; }}
                        sx={{ borderRadius: 999, py: 1.25, fontSize: 15, fontWeight: 900, boxShadow: "none" }}
                    >
                        Back to Music
                    </Button>
                </Box>
            </Box>
        );
    }

    if (error && !artist) {
        if (isNetworkError(rawLoadError)) {
            return (
                <Box sx={{ maxWidth: 600, mx: "auto", py: 4, px: 2 }}>
                    <NetworkErrorState onRetry={() => window.location.reload()} />
                </Box>
            );
        }
        return (
            <Box sx={{ maxWidth: 600, mx: "auto", py: 4, px: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <ButtonBase
                    onClick={() => navigate("/music")}
                    sx={{
                        display: "inline-flex", alignItems: "center", gap: 1,
                        px: 2.5, py: 1, borderRadius: 999, border: "1px solid",
                        borderColor: "divider", fontWeight: 700, fontSize: 14,
                        "&:hover": { bgcolor: "action.hover" },
                    }}
                >
                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                    Back to Music
                </ButtonBase>
            </Box>
        );
    }

    // ── Access gate: must be logged into the matching artist account ──
    // In edit mode (not setup), require the active account to match this artist.
    const hasConsoleAccess = Boolean(
        setupMode ||
        (isArtistAccount &&
            activeArtistId != null &&
            artistIdResolved != null &&
            String(activeArtistId) === String(artistIdResolved))
    );

    // If the user is not on an artist account at all (personal or business),
    // show the default Not Found page instead of the lock screen.
    if (!setupMode && !isArtistAccount && !loading) {
        return <NotFound />;
    }

    if (!setupMode && (!hasConsoleAccess || !hasAccess)) {
        const artistName = artist?.name || "this artist";
        return (
            <Box
                sx={{
                    minHeight: "80vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.default",
                    p: 2,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: 460,
                        width: "100%",
                        textAlign: "center",
                        p: { xs: 4, sm: 5 },
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Box
                        sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            bgcolor: (t) => alpha(t.palette.warning.main, 0.10),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mx: "auto",
                            mb: 2.5,
                        }}
                    >
                        <LockOutlinedIcon sx={{ fontSize: 30, color: "warning.dark" }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                        Admin Access Required
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5, lineHeight: 1.6 }}>
                        You need to be logged into the <strong>{artistName}</strong> account to manage this profile.
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                        Switch to the correct account using the menu in the top-right corner, then try again.
                    </Typography>
                    <Stack direction="row" spacing={1.5} justifyContent="center">
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                            onClick={handleBackToProfile}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 999,
                                px: 2.5,
                            }}
                        >
                            View Profile
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />}
                            onClick={() => navigate("/")}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 999,
                                px: 2.5,
                            }}
                        >
                            Go to Home
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    // -- Tab props --
    const tabProps = {
        artist,
        user,
        userRole,
        onRefresh: refreshArtist,
        onSaveToast: showSaveToast,
        registerSaveHandler,
        onFieldChange: handleFieldChange,
        registerDataCollector,
        setupMode,
        setupToken,
        profanityFieldErrors,
        setProfanityFieldErrors,
        onPhotoError: showPhotoError,
    };

    // -- Build preview data --
    const pv = previewOverrides;
    const previewName = pv.name !== undefined ? pv.name : artist?.name || "";
    const previewHandle = pv.handle !== undefined ? pv.handle : artist?.handle || "";
    const previewBio = pv.bio !== undefined ? pv.bio : artist?.bio || "";
    const previewCity = pv.city !== undefined ? pv.city : artist?.city || "";
    const previewCounty = pv.county !== undefined ? pv.county : artist?.county || "";
    const previewAvatarUrl = pv.avatarUrl !== undefined ? pv.avatarUrl : artist?.avatarUrl || artist?.avatar_url || "";
    const previewCoverUrl = pv.coverUrl !== undefined ? pv.coverUrl : artist?.coverUrl || artist?.cover_url || "";
    const previewGenres = pv.genres !== undefined ? pv.genres : (Array.isArray(artist?.genres) && artist.genres.length > 0 ? artist.genres : EMPTY_GENRES);
    const previewLinks = pv.links !== undefined ? pv.links : (artist?.links && typeof artist.links === "object" && Object.keys(artist.links).length > 0 ? artist.links : EMPTY_LINKS);
    const previewPhotos = pv.photos !== undefined ? pv.photos : (Array.isArray(artist?.photoUrls) && artist.photoUrls.length > 0 ? artist.photoUrls : EMPTY_PHOTOS);
    const previewHighlightSections = pv.highlightSections !== undefined ? pv.highlightSections : (artist?.settings?.highlightSections || artist?.highlightSections || []);

    const anyOperationInProgress = draftSaving || submittingForReview || deletingDraft || globalSaving;
    const artistStatus = String(artist?.status || "").toLowerCase();

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={(t) => {
                    const isDark = t.palette.mode === "dark";
                    const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
                    const inputBg = isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92);
                    return {
                        minHeight: { xs: `calc(100vh - ${chromeTop}px)`, md: "100vh" },
                        pt: { xs: `${chromeTop}px`, md: 0 },
                        bgcolor: "background.default",
                        // Fullscreen overlay on mobile in setup mode
                        ...(isMobile && setupMode ? {
                            position: "fixed",
                            top: `${chromeTop}px`,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1300,
                            minHeight: "unset",
                            height: `calc(100% - ${chromeTop}px)`,
                            overflow: "auto",
                            bgcolor: t.palette.background.paper,
                            pt: 0,
                        } : {}),
                        // Mobile input font size overrides
                        ...(isMobile ? {
                            "& .MuiInputBase-input": { fontSize: 14 },
                            "& .MuiInputLabel-root": { fontSize: 14 },
                            "& .MuiSelect-select": { fontSize: 14, bgcolor: inputBg },
                            "& .MuiFormHelperText-root": { fontSize: 11.5 },
                        } : {}),
                        "& .MuiOutlinedInput-root": {
                            bgcolor: inputBg,
                            backdropFilter: "saturate(140%) blur(10px)",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: alpha(t.palette.text.primary, isDark ? 0.18 : 0.14),
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: alpha(t.palette.text.primary, isDark ? 0.28 : 0.22),
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: alpha(t.palette.primary.main, 0.50),
                                boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.10)}`,
                            },
                            "& input, & textarea": {
                                fontWeight: 700,
                                letterSpacing: "-0.01em",
                                color: t.palette.text.primary,
                            },
                            "& input::placeholder, & textarea::placeholder": {
                                color: alpha(t.palette.text.secondary, isDark ? 0.85 : 1),
                                opacity: 1,
                            },
                        },
                        "& .MuiSelect-select": { bgcolor: inputBg },
                    };
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        gap: 2,
                        p: { xs: 0, md: 2.5 },
                        maxWidth: 1600,
                        mx: "auto",
                    }}
                >
                    {/* Left: Edit Form */}
                    <Box sx={{ flex: 1, minWidth: 0 }} ref={contentRef}>
                        {/* Sticky Header Bar */}
                        <Box
                            sx={{
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                px: { xs: 2, md: 2.5 },
                                py: 1.25,
                                bgcolor: "background.paper",
                                borderBottom: { xs: "1px solid", md: "none" },
                                borderColor: "divider",
                                borderRadius: { xs: 0, md: "10px 10px 0 0" },
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 1.5,
                                flexWrap: { xs: "wrap", sm: "nowrap" },
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
                                <ButtonBase
                                    onClick={handleBackToProfile}
                                    sx={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        border: "1px solid", borderColor: "divider",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, "&:hover": { bgcolor: "action.hover" },
                                    }}
                                >
                                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                                </ButtonBase>
                                {isVisualArtist
                                    ? <PaletteRoundedIcon sx={{ fontSize: 22, color: "primary.main", flexShrink: 0 }} />
                                    : <MusicNoteIcon sx={{ fontSize: 22, color: "primary.main", flexShrink: 0 }} />}
                                <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, md: 20 }, lineHeight: 1.15 }}>
                                        {setupMode ? "Setup Artist" : "Edit Profile"}
                                    </Typography>
                                    {artist?.isVerified ? <VerifiedIcon sx={{ fontSize: 18, color: "primary.main" }} /> : null}
                                </Box>
                            </Box>

                            {/* Header Buttons — hidden on mobile, shown in bottom bar instead */}
                            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, ml: { sm: 2 } }}>
                                {setupMode ? (
                                    <>
                                        <Button
                                            onClick={() => setDeleteConfirmDialogOpen(true)}
                                            disabled={anyOperationInProgress || setupSubmitted}
                                            sx={{
                                                borderRadius: 999, textTransform: "none", fontWeight: 800,
                                                color: "error.main", fontSize: 13,
                                            }}
                                        >
                                            Delete Draft
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleSaveDraft}
                                            disabled={anyOperationInProgress || setupSubmitted}
                                            startIcon={draftSaving ? <CircularProgress size={14} color="inherit" /> : null}
                                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, fontSize: 13 }}
                                        >
                                            {draftSaving ? "Saving..." : "Save Draft"}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleSubmitForReview}
                                            disabled={anyOperationInProgress || setupSubmitted}
                                            startIcon={submittingForReview ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />}
                                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, fontSize: 13, boxShadow: "none" }}
                                        >
                                            {setupSubmitted ? "Submitted!" : submittingForReview ? "Submitting..." : "Submit for Review"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleBackToProfile}
                                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={globalSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                            onClick={handleGlobalSave}
                                            disabled={globalSaving}
                                            sx={{ borderRadius: 999, px: 3, fontWeight: 900, boxShadow: "none", whiteSpace: "nowrap" }}
                                        >
                                            {globalSaving ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Form Body */}
                        <Box
                            sx={{
                                px: { xs: 2, md: 2.25 },
                                py: { xs: 1.5, md: 2 },
                                pb: { xs: setupMode ? "100px" : `${MOBILE_BOTTOM_NAV_HEIGHT + 80}px`, md: 2 },
                                bgcolor: "background.paper",
                                borderRadius: { xs: 0, md: "0 0 10px 10px" },
                            }}
                        >
                            {/* Status Banners */}
                            {setupMode && artistStatus === "draft" ? (
                                <Alert
                                    severity="info"
                                    icon={<InfoOutlinedIcon />}
                                    sx={{ mb: 2, borderRadius: 2 }}
                                >
                                    You are setting up a new {isVisualArtist ? "artist page" : "music page"}. Fill in your details, save drafts anytime, and submit for review when ready.
                                </Alert>
                            ) : null}

                            {artistStatus === "pending_approval" ? (
                                <Alert
                                    severity="warning"
                                    sx={{ mb: 2, borderRadius: 2 }}
                                >
                                    This {isVisualArtist ? "artist page" : "music page"} is awaiting verification. You can still make edits — any saved changes will be reflected in the review.
                                </Alert>
                            ) : null}

                            {error ? (
                                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>
                            ) : null}

                            {/* ── 1. PROFILE & COVER PHOTO ── */}
                            <FormSection title="Profile & Cover Photo" icon={<PhotoLibraryIcon />} defaultOpen>
                                <Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Cover Photo</Typography>
                                    <Box sx={{ position: "relative", width: "100%", paddingTop: `${100 / COVER_ASPECT}%`, bgcolor: "grey.200", borderRadius: 2, overflow: "hidden" }}>
                                        {displayCoverSrc ? <Box component="img" src={displayCoverSrc} sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                                        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<CloudUploadIcon />}
                                                onClick={() => coverInputRef.current?.click()}
                                                sx={{
                                                    textTransform: "none", fontWeight: 600, fontSize: 12,
                                                    bgcolor: (t) => alpha(t.palette.common.black, 0.60),
                                                    "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.80) },
                                                }}
                                            >
                                                {displayCoverSrc ? "Change Cover" : "Upload Cover"}
                                            </Button>
                                            {displayCoverSrc ? (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<DeleteOutlineIcon />}
                                                    onClick={handleRemoveCover}
                                                    sx={{
                                                        textTransform: "none", fontWeight: 600, fontSize: 12,
                                                        bgcolor: (t) => alpha(t.palette.error.main, 0.85),
                                                        "&:hover": { bgcolor: (t) => alpha(t.palette.error.main, 1) },
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            ) : null}
                                        </Box>
                                    </Box>
                                    <input type="file" ref={coverInputRef} onChange={handleCoverSelect} accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} />
                                </Box>
                                <Box sx={{ mt: 2.5 }}>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Profile Photo</Typography>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Avatar
                                            src={displayAvatarSrc || undefined}
                                            sx={{
                                                width: 100, height: 100,
                                                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                                color: "primary.main",
                                                border: "2px solid",
                                                borderColor: hasCustomAvatar ? "divider" : "primary.light",
                                            }}
                                            imgProps={{ style: { objectFit: "cover" } }}
                                        >
                                            {isVisualArtist
                                                ? <PaletteRoundedIcon sx={{ fontSize: 36 }} />
                                                : <MusicNoteRoundedIcon sx={{ fontSize: 36 }} />}
                                        </Avatar>
                                        <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => avatarInputRef.current?.click()} sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}>
                                            Change Photo
                                        </Button>
                                        {displayAvatarSrc ? (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteOutlineIcon />}
                                                onClick={handleRemoveAvatar}
                                                sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}
                                            >
                                                Remove
                                            </Button>
                                        ) : null}
                                        <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} />
                                    </Stack>
                                </Box>
                            </FormSection>

                            {/* ── 2. BASIC INFO (Profile) ── */}
                            <FormSection title="Basic Information" icon={<PersonOutlineIcon />} defaultOpen>
                                <ProfileTab {...tabProps} />
                            </FormSection>

                            {/* ── 3. ABOUT (Highlights) ── */}
                            <FormSection title="Highlight Sections" icon={<AutoAwesomeRoundedIcon />} defaultOpen={false}>
                                <AboutTab {...tabProps} />
                            </FormSection>

                            {/* ── 4. GENRES / ART CATEGORIES ──
                                Musicians see "Genres" with a music-note icon and the
                                DB-backed music genre picker. Visual artists see "Art
                                Categories" with a palette icon and a hardcoded list.
                                Both write to the same `genres_json` column — GenresTab
                                handles the branch internally based on artist.profile_type.
                                Placed immediately after About so the taxonomy the viewer
                                reads first (name/bio/category) stays co-located. */}
                            <FormSection
                                title={isVisualArtist ? "Art Categories" : "Genres"}
                                icon={isVisualArtist ? <PaletteRoundedIcon /> : <MusicNoteIcon />}
                                defaultOpen={false}
                            >
                                <GenresTab {...tabProps} maxGenres={3} />
                            </FormSection>

                            {/* ── 5. PHOTO GALLERY ── */}
                            <FormSection title="Photo Gallery" icon={<ImageOutlinedIcon />} defaultOpen={false}>
                                <PhotosTab {...tabProps} />
                            </FormSection>

                            {/* ── 6. LINKS ── */}
                            <FormSection title="Links" icon={<LinkIcon />} defaultOpen={false}>
                                <LinksTab {...tabProps} />
                            </FormSection>
                        </Box>
                    </Box>

                    {/* Right: Live Preview — only shown at >=1440px (admin theme remaps md to 1440) */}
                    <Box
                        sx={{
                            display: { xs: "none", md: "block" },
                            flex: "0 0 auto",
                            width: 780,
                            minWidth: 0,
                            position: "sticky",
                            top: 20,
                            alignSelf: "flex-start",
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                            <VisibilityIcon sx={{ fontSize: 16, color: "primary.main" }} />
                            <Typography
                                sx={{
                                    fontWeight: 900, fontSize: 12, color: "primary.main",
                                    textTransform: "uppercase", letterSpacing: "0.06em",
                                }}
                            >
                                Artist Detail Preview
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.75 }}>
                            This is how your profile will appear on the artist detail page.
                        </Typography>

                        <ArtistLivePreview
                            name={previewName}
                            handle={previewHandle}
                            bio={previewBio}
                            avatarUrl={previewAvatarUrl}
                            coverUrl={previewCoverUrl}
                            city={previewCity}
                            county={previewCounty}
                            genres={previewGenres}
                            links={previewLinks}
                            photos={previewPhotos}
                            highlightSections={previewHighlightSections}
                            settings={artist?.settings || {}}
                            followersCount={followCounts.followers}
                            followingCount={followCounts.following}
                            profileType={profileType}
                        />
                    </Box>
                </Box>

                {/* ── Mobile bottom action bar ── */}
                {isMobile && (
                    <Box
                        sx={{
                            position: setupMode ? "sticky" : "fixed",
                            bottom: setupMode ? 0 : (bottomNavHidden ? 0 : MOBILE_BOTTOM_NAV_HEIGHT),
                            left: 0,
                            right: 0,
                            zIndex: 1100,
                            bgcolor: "background.paper",
                            borderTop: "1px solid",
                            borderColor: "divider",
                            px: 2,
                            py: 1.5,
                            boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
                            transition: setupMode ? "none" : "bottom 0.3s ease",
                            flexShrink: 0,
                        }}
                    >
                        {setupMode ? (
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={handleSaveDraft}
                                        disabled={anyOperationInProgress || setupSubmitted}
                                        startIcon={draftSaving ? <CircularProgress size={16} color="inherit" /> : null}
                                        sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14 }}
                                    >
                                        {draftSaving ? "Saving..." : "Save Draft"}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        onClick={handleSubmitForReview}
                                        disabled={anyOperationInProgress || setupSubmitted}
                                        startIcon={submittingForReview ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                                        sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14, boxShadow: "none" }}
                                    >
                                        {setupSubmitted ? "Submitted!" : submittingForReview ? "Submitting..." : "Submit for Review"}
                                    </Button>
                                </Stack>
                                <Button
                                    size="small"
                                    onClick={() => setDeleteConfirmDialogOpen(true)}
                                    disabled={anyOperationInProgress || setupSubmitted}
                                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999, color: "error.main", fontSize: 12, alignSelf: "center" }}
                                >
                                    Delete Draft
                                </Button>
                            </Stack>
                        ) : (
                            <Stack direction="row" spacing={1}>
                                <Button
                                    fullWidth
                                    onClick={handleBackToProfile}
                                    disabled={globalSaving}
                                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, color: "text.secondary", py: 1.25, fontSize: 14, border: "1px solid", borderColor: "divider" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={handleGlobalSave}
                                    disabled={globalSaving}
                                    startIcon={globalSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                    sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14, boxShadow: "none" }}
                                >
                                    {globalSaving ? "Saving..." : "Save Changes"}
                                </Button>
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Image Crop Dialog */}
                <ImageCropDialog
                    open={cropDialogOpen}
                    onClose={() => { setCropDialogOpen(false); setCropImageSrc(null); setCropType(null); }}
                    imageSrc={cropImageSrc}
                    aspect={cropType === "avatar" ? AVATAR_ASPECT : COVER_ASPECT}
                    title={cropType === "avatar" ? "Crop Profile Photo" : "Crop Cover Photo"}
                    onCropComplete={handleCropComplete}
                    outputSize={cropType === "avatar" ? { width: 400, height: 400 } : { width: 1200, height: 400 }}
                    cropShape={cropType === "avatar" ? "round" : "rect"}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteConfirmDialogOpen}
                    onClose={() => setDeleteConfirmDialogOpen(false)}
                >
                    <DialogTitle sx={{ fontWeight: 900 }}>Delete Draft?</DialogTitle>
                    <DialogContent>
                        <Typography sx={{ color: "text.secondary" }}>
                            This will permanently delete your draft {isVisualArtist ? "artist page" : "music page"}. This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={() => setDeleteConfirmDialogOpen(false)}
                            disabled={deletingDraft}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteDraft}
                            disabled={deletingDraft}
                            variant="contained"
                            color="error"
                            startIcon={deletingDraft ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, boxShadow: "none" }}
                        >
                            {deletingDraft ? "Deleting..." : "Delete Draft"}
                        </Button>
                    </DialogActions>
                </Dialog>

                <SuccessSnackbar {...successSnackbarProps} />

                {/* Photo moderation error snackbar */}
                <Snackbar
                    open={Boolean(photoModerationError)}
                    autoHideDuration={8000}
                    onClose={clearPhotoError}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={clearPhotoError} severity="error" variant="filled" sx={{ width: '100%', fontWeight: 600 }}>
                        {photoModerationError}
                    </Alert>
                </Snackbar>

                {/* Rate Limit Dialog */}
                <RateLimitDialog
                    open={rateLimitOpen}
                    onClose={() => setRateLimitOpen(false)}
                    retryAfterSec={rateLimitInfo.retryAfterSec}
                    reason={rateLimitInfo.reason}
                    actionLabel={rateLimitInfo.actionLabel}
                />
            </Box>
        </ThemeProvider>
    );
}
