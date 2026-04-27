// src/pages/services/pages/CreateServicePage.jsx
//
// Full-page service creation / editing with live Discover-style preview.
// Left pane: form fields in collapsible sections.
// Right pane: real-time preview mimicking the ServiceDiscoverTab layout with tabs.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cropper from "react-easy-crop";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    LinearProgress,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Rating,
    Select,
    Slider,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
    ButtonBase,
} from "@mui/material";
import { alpha, ThemeProvider, createTheme } from "@mui/material/styles";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import CropIcon from "@mui/icons-material/Crop";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import FacebookRoundedIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import LinkIcon from "@mui/icons-material/Link";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ForestRoundedIcon from "@mui/icons-material/Forest";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivism";
import GroupsRoundedIcon from "@mui/icons-material/Groups";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { createService, updateService, fetchServiceById, deleteService } from "../api/servicesApi";
import { SERVICE_CATEGORIES, getServiceCategoryInfo } from "../utils/serviceHelpers";
import { checkGeocodeRateLimit, recordGeocodeResult } from "../../../utils/geocodeRateLimit";
import defaultAvatar from "../../../assets/profile/default_avatar.png";
import { MOBILE_BOTTOM_NAV_HEIGHT } from "../../../components/Header/Header";

import cityData from "../../../data/alabamaCities.json";
import countyData from "../../../data/alabamaCounties.json";
import { checkFieldsProfanity } from "../../../utils/profanityCheck";
import { secureFetch } from "../../../utils/secureFetch";
import useChromeTop from "../../../hooks/useChromeTop";

// ─── Constants ────────────────────────────────────────────

const SOCIAL_PREFIXES = {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    twitter: "https://x.com/",
    youtube: "https://youtube.com/",
    tiktok: "https://tiktok.com/",
};

function stripSocialPrefix(url, platform) {
    if (!url) return "";
    const prefixes = [
        SOCIAL_PREFIXES[platform],
        SOCIAL_PREFIXES[platform]?.replace("https://", "http://"),
        SOCIAL_PREFIXES[platform]?.replace("https://", ""),
        SOCIAL_PREFIXES[platform]?.replace("https://", "https://www."),
        SOCIAL_PREFIXES[platform]?.replace("https://", "http://www."),
        SOCIAL_PREFIXES[platform]?.replace("https://", "www."),
    ].filter(Boolean);
    for (const p of prefixes) {
        if (url.toLowerCase().startsWith(p.toLowerCase())) return url.slice(p.length);
    }
    return url;
}

function buildSocialUrl(handle, platform) {
    const trimmed = String(handle || "").trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return SOCIAL_PREFIXES[platform] + trimmed;
}

const TITLE_MAX = 200;
const SUMMARY_MAX = 75;
const DESCRIPTION_MAX = 5000;
const HL_SEC_TITLE_MAX = 100;
const HL_SEC_BODY_MAX = 2000;
const COVER_ASPECT = 3.5;
const COVER_OUTPUT = { width: 1400, height: 400 };
const MAX_PHOTOS = 12;
const IMAGE_MAX_DIMENSION = 1400;
const MAX_HIGHLIGHT_SECTIONS = 5;

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };

function buildEmptyHours() {
    const h = {};
    DAY_NAMES.forEach((d) => { h[d] = {}; });
    return h;
}

// ─── Highlight Section Icon Options ─────────────────────
const HL_ICONS = {
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
const HL_ICON_KEYS = Object.keys(HL_ICONS);
const HL_ICON_LABELS = {
    Star: "Star",
    Favorite: "Favorite",
    Forest: "Forest",
    Volunteer: "Volunteer",
    Groups: "Groups",
    CheckCircle: "Check Circle",
    Trophy: "Trophy",
    Shield: "Shield",
    Build: "Build",
};

function HlIconRender({ name, ...props }) {
    const Icon = HL_ICONS[name] || StarRoundedIcon;
    return <Icon {...props} />;
}

const EMPTY_HIGHLIGHT_SECTION = { icon: "Star", title: "", body: "", photoUrl: "", _photoFile: null, _photoPreview: "" };

// Category-specific placeholder examples for "Services Offered" input
const CATEGORY_SERVICE_EXAMPLES = {
    "land-clearing": "e.g. Forestry Mulching",
    "forestry-mulching": "e.g. Brush Clearing",
    "tree-service": "e.g. Tree Removal",
    "electrical": "e.g. Panel Upgrades",
    "plumbing": "e.g. Drain Cleaning",
    "hvac": "e.g. AC Repair",
    "roofing": "e.g. Shingle Replacement",
    "painting": "e.g. Interior Painting",
    "landscaping": "e.g. Lawn Maintenance",
    "fencing": "e.g. Privacy Fence Install",
    "concrete": "e.g. Driveway Pouring",
    "pressure-washing": "e.g. House Washing",
    "pest-control": "e.g. Termite Treatment",
    "septic": "e.g. Tank Pumping",
    "welding": "e.g. Custom Fabrication",
    "excavation": "e.g. Site Grading",
    "dumpster-rental": "e.g. 20-Yard Roll-Off",
    "home-repair": "e.g. Drywall Repair",
    "carpentry": "e.g. Deck Building",
    "cleaning": "e.g. Deep Cleaning",
    "moving": "e.g. Local Moving",
    "auto-repair": "e.g. Brake Service",
    "towing": "e.g. Flatbed Towing",
    "lawn-care": "e.g. Mowing & Edging",
    "pool-service": "e.g. Pool Cleaning",
    "flooring": "e.g. Hardwood Install",
    "window": "e.g. Window Replacement",
    "garage-door": "e.g. Spring Replacement",
    "appliance-repair": "e.g. Washer Repair",
    "locksmith": "e.g. Lock Rekey",
    "photography": "e.g. Event Photography",
    "catering": "e.g. Wedding Catering",
    "tutoring": "e.g. Math Tutoring",
    "fitness": "e.g. Personal Training",
    "pet-care": "e.g. Dog Walking",
    "notary": "e.g. Mobile Notary",
    "accounting": "e.g. Tax Preparation",
    "legal": "e.g. Estate Planning",
    "insurance": "e.g. Home Insurance",
    "real-estate": "e.g. Buyer Representation",
};

const OPAQUE_TEXTFIELD_SX = {
    "& .MuiOutlinedInput-root": (t) => {
        const isDark = t.palette.mode === "dark";
        const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
        return {
            backgroundColor: isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92),
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
        };
    },
    "& .MuiInputLabel-root": (t) => ({
        backgroundColor: t.palette.mode === "dark" ? "transparent" : alpha(t.palette.common.white, 0.92),
        paddingLeft: "6px",
        paddingRight: "6px",
        borderRadius: 6,
    }),
};

// ─── Geo helpers ──────────────────────────────────────────

const stripCountySuffix = (s) => String(s || "").replace(/ County$/i, "").trim();

function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;
    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }
    const calcCentroid = (rings) => {
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const ring of rings) {
            if (!Array.isArray(ring)) continue;
            for (const pt of ring) {
                if (!Array.isArray(pt) || pt.length < 2) continue;
                const [lng2, lat2] = pt;
                if (!Number.isFinite(lat2) || !Number.isFinite(lng2)) continue;
                if (lat2 < minLat) minLat = lat2;
                if (lat2 > maxLat) maxLat = lat2;
                if (lng2 < minLng) minLng = lng2;
                if (lng2 > maxLng) maxLng = lng2;
            }
        }
        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        return null;
    };
    if (type === "Polygon" && Array.isArray(coordinates)) return calcCentroid(coordinates);
    if (type === "MultiPolygon" && Array.isArray(coordinates)) return calcCentroid(coordinates.flat());
    return null;
}

function resolveLocationCoords(city, county) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);
    if (city) {
        const norm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) => String(f?.properties?.NAME || f?.properties?.name || f?.name || "").trim().toLowerCase() === norm);
        if (hit) { const c = getCoordinatesFromFeature(hit); if (c) return c; }
    }
    if (county) {
        const norm = stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) => stripCountySuffix(f?.properties?.NAME || f?.properties?.name || f?.name || "").toLowerCase() === norm);
        if (hit) { const c = getCoordinatesFromFeature(hit); if (c) return c; }
    }
    return null;
}

// ─── Image helpers ─────────────────────────────────────

function normalizeFileName(name) {
    return String(name || "image").trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-.]/g, "").slice(0, 80) || "image";
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read image."));
        img.crossOrigin = "anonymous";
        img.src = src;
    });
}

async function resizeImage(file) {
    if (!String(file.type || "").startsWith("image/")) return file;
    const url = URL.createObjectURL(file);
    try {
        const img = await loadImage(url);
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) return file;
        const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(w, h));
        const outW = Math.max(1, Math.round(w * scale));
        const outH = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(img, 0, 0, outW, outH);
        const preferJpeg = !String(file.type || "").includes("png");
        const outType = preferJpeg ? "image/jpeg" : "image/png";
        const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), outType, 0.86));
        if (!blob) return file;
        const outNameBase = normalizeFileName(file.name).replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
        const outName = preferJpeg ? `${outNameBase}.jpg` : `${outNameBase}.png`;
        return new File([blob], outName, { type: outType });
    } finally {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
}

async function getSignedUploadUrl({ folder, fileName, contentType }) {
    const res = await secureFetch("/api/uploads/signed-url", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ folder, fileName, contentType }),
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let friendlyMsg = "Failed to get upload URL.";
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
    return res.json();
}

async function uploadToSignedUrl({ uploadUrl, file, contentType }) {
    const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: file });
    if (!putRes.ok) throw new Error("Image upload failed.");
}

function createImageEl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", reject);
        img.crossOrigin = "anonymous";
        img.src = url;
    });
}

async function createCroppedImage(imageSrc, pixelCrop, outputWidth, outputHeight) {
    const image = await createImageEl(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight);
    return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9); });
}

async function uploadSinglePhoto(file, folder = "services") {
    const resized = await resizeImage(file);
    const contentType = resized.type || "image/jpeg";
    const safeName = `${Date.now()}_service_${normalizeFileName(resized.name)}`;
    const signed = await getSignedUploadUrl({ folder, fileName: safeName, contentType });
    if (!signed?.uploadUrl) throw new Error("Upload URL missing.");
    await uploadToSignedUrl({ uploadUrl: signed.uploadUrl, file: resized, contentType });
    return { url: String(signed.publicUrl || "").trim(), objectPath: String(signed.objectPath || "").trim() };
}

/**
 * Run server-side NSFW moderation on an image file before uploading to GCS.
 * Returns { safe: true } or { safe: false, message: '...' }.
 */
async function moderateImageFile(file) {
    try {
        const form = new FormData();
        form.append('image', file);
        const res = await secureFetch('/api/community/moderate-image', {
            method: 'POST',
            credentials: 'include',
            body: form,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            return { safe: false, message: data?.message || 'This image doesn\u2019t meet our community guidelines.' };
        }
        const data = await res.json().catch(() => ({ safe: true }));
        return data;
    } catch {
        // Fail open — if the moderation endpoint is unreachable, allow the upload
        return { safe: true };
    }
}

/**
 * Moderate an image file, then upload to GCS if it passes.
 * Throws with err.isModeration = true on NSFW rejection.
 */
async function moderateAndUpload(file, folder = 'services') {
    const modResult = await moderateImageFile(file);
    if (!modResult.safe) {
        const err = new Error(modResult.message || 'This image doesn\u2019t meet our community guidelines.');
        err.isModeration = true;
        throw err;
    }
    return uploadSinglePhoto(file, folder);
}

// ─── Hours formatter ──────────────────────────────────────

function formatTime12(t) {
    if (!t) return "";
    const parts = t.split(":");
    const h = parseInt(parts[0], 10);
    const m = parts[1] || "00";
    if (!Number.isFinite(h)) return t;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

// ─── Collapsible Section ──────────────────────────────────

function FormSection({ title, defaultOpen = false, forceOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen);
    const prevForceRef = useRef(false);
    useEffect(() => {
        if (forceOpen && !prevForceRef.current) {
            setOpen(true);
        }
        prevForceRef.current = forceOpen;
    }, [forceOpen]);
    return (
        <Box sx={{ mb: 1 }}>
            <Box
                onClick={() => setOpen((v) => !v)}
                sx={{
                    display: "flex", alignItems: "center", gap: 0.75, cursor: "pointer",
                    py: 1.25, px: 0.5, userSelect: "none",
                    "&:hover": { opacity: 0.8 },
                }}
            >
                {open ? <ExpandLessRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />}
                <Typography sx={{ fontWeight: 900, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
                    {title}
                </Typography>
            </Box>
            <Collapse in={open} unmountOnExit={false}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
                    {children}
                </Box>
            </Collapse>
        </Box>
    );
}

// ─── Hours Editor ─────────────────────────

function ServiceHoursEditor({ hours, onChange }) {
    const handleDayChange = (day, updates) => {
        const newHours = { ...hours };
        if (!newHours[day]) newHours[day] = {};
        if (updates.closed) newHours[day] = { closed: true };
        else if (updates.allDay) newHours[day] = { allDay: true };
        else newHours[day] = { ...newHours[day], ...updates };
        onChange(newHours);
    };
    return (
        <Stack spacing={1}>
            {DAY_NAMES.map((day) => {
                const dh = hours?.[day] || {};
                const isClosed = dh.closed;
                const isAllDay = dh.allDay;
                return (
                    <Paper key={day} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5, bgcolor: "background.paper" }}>
                        <Stack spacing={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography sx={{ minWidth: { xs: 0, sm: 80 }, fontWeight: 600, fontSize: 13, flex: { xs: 1, sm: "none" } }}>{DAY_LABELS[day]}</Typography>
                                <Button size="small" variant={isClosed ? "contained" : "outlined"} color={isClosed ? "error" : "inherit"}
                                        onClick={() => handleDayChange(day, isClosed ? { closed: false, allDay: false } : { closed: true })}
                                        sx={{ minWidth: 60, textTransform: "none", fontSize: 11 }}>Closed</Button>
                                <Button size="small" variant={isAllDay ? "contained" : "outlined"} color={isAllDay ? "success" : "inherit"}
                                        onClick={() => handleDayChange(day, isAllDay ? { closed: false, allDay: false } : { allDay: true })}
                                        sx={{ minWidth: 60, textTransform: "none", fontSize: 11 }}>24hr</Button>
                            </Stack>
                            {!isClosed && !isAllDay && (
                                <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ pl: { xs: 0, sm: "88px" } }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600, minWidth: 36 }}>Open</Typography>
                                        <TextField size="small" type="time" value={dh.open || ""} onChange={(e) => handleDayChange(day, { open: e.target.value })}
                                                   sx={{ minWidth: 120, "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }} InputProps={{ sx: { fontSize: 12 } }} />
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600, minWidth: 36 }}>Close</Typography>
                                        <TextField size="small" type="time" value={dh.close || ""} onChange={(e) => handleDayChange(day, { close: e.target.value })}
                                                   sx={{ minWidth: 120, "& .MuiOutlinedInput-root": { backgroundColor: "background.paper" } }} InputProps={{ sx: { fontSize: 12 } }} />
                                    </Stack>
                                </Stack>
                            )}
                        </Stack>
                    </Paper>
                );
            })}
        </Stack>
    );
}

// ═══════════════════════════════════════════════════════════
//  LIVE PREVIEW (mirrors ServiceDiscoverTab / HighlightCard layout)
// ═══════════════════════════════════════════════════════════

function LivePreview({
                         title, subtitle, categorySlug, coverPreview, providerAvatar, providerName, providerHandle,
                         providerType,
                         locationLabel, licensedInsured, description,
                         servicesOffered, photos,
                         websiteUrl, facebookUrl, instagramUrl, twitterUrl, youtubeUrl, tiktokUrl,
                         contactPreference, phoneNumber, emailAddress, hours, certifications,
                         highlightSections,
                         validatedCoords, addressValidated,
                         serviceAvatarPreview,
                         isStatewide, city, county, streetAddress,
                     }) {
    const providerFallbackIcon = providerType === "business"
        ? <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
        : providerType === "music"
            ? <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />
            : <PersonRoundedIcon sx={{ fontSize: 28 }} />;
    const hasCover = Boolean(coverPreview);
    const descText = description || "";
    const DESC_COLLAPSE = 220;
    const descIsLong = descText.length > DESC_COLLAPSE;
    const [descExpanded, setDescExpanded] = useState(false);
    const [previewTab, setPreviewTab] = useState(0);
    const photoUrls = (photos || []).filter((p) => p && (p.url || p._gcsUrl)).map((p) => p.url || p._gcsUrl);
    const catInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
    const CatIcon = catInfo?.Icon || null;

    // Build social links array for icons
    const socialLinks = [
        websiteUrl ? { url: websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`, icon: <LanguageRoundedIcon sx={{ fontSize: 15 }} />, label: "Website", color: "text.secondary" } : null,
        facebookUrl ? { url: buildSocialUrl(facebookUrl, "facebook") || "#", icon: <FacebookRoundedIcon sx={{ fontSize: 15 }} />, label: "Facebook", color: "#1877F2" } : null,
        instagramUrl ? { url: buildSocialUrl(instagramUrl, "instagram") || "#", icon: <InstagramIcon sx={{ fontSize: 15 }} />, label: "Instagram", color: "#E1306C" } : null,
        twitterUrl ? { url: buildSocialUrl(twitterUrl, "twitter") || "#", icon: <XIcon sx={{ fontSize: 13 }} />, label: "X (Twitter)", color: "text.primary" } : null,
        youtubeUrl ? { url: buildSocialUrl(youtubeUrl, "youtube") || "#", icon: <YouTubeIcon sx={{ fontSize: 15 }} />, label: "YouTube", color: "#FF0000" } : null,
        tiktokUrl ? { url: buildSocialUrl(tiktokUrl, "tiktok") || "#", icon: <LinkIcon sx={{ fontSize: 15 }} />, label: "TikTok", color: "text.secondary" } : null,
    ].filter(Boolean);

    // Check if any hours are meaningfully set
    const hasHours = hours && DAY_NAMES.some((d) => {
        const dh = hours[d];
        return dh && (dh.closed || dh.allDay || dh.open || dh.close);
    });

    const hasCerts = Array.isArray(certifications) && certifications.some((c) => c.name?.trim());
    const validSections = Array.isArray(highlightSections) ? highlightSections.filter((s) => s.title?.trim() || s.body?.trim() || s._photoPreview || s.photoUrl) : [];
    const hasHighlights = validSections.length > 0;

    // Resolve map coords: validated address coords > city/county fallback coords
    const fallbackCoords = (!validatedCoords || validatedCoords.length !== 2)
        ? resolveLocationCoords(city && city !== "All Cities" ? city : null, county && county !== "All Counties" ? county : null)
        : null;
    const mapCoords = (validatedCoords?.length === 2) ? validatedCoords : (fallbackCoords || null);
    const hasMap = mapCoords != null;

    // All photo URLs for Photos tab
    const allPhotoUrls = [];
    photoUrls.forEach((u) => allPhotoUrls.push(u));
    // Include highlight section photos
    validSections.forEach((sec) => { if (sec._photoPreview || sec.photoUrl) allPhotoUrls.push(sec._photoPreview || sec.photoUrl); });

    return (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, overflow: "hidden" }}>
            {/* ── Cover Photo Hero (standalone, no overlap) ── */}
            {hasCover && (
                <Box sx={{ position: "relative", width: "100%", height: { xs: 140, sm: 180, md: 200 }, bgcolor: "grey.200", overflow: "hidden" }}>
                    <Box component="img" src={coverPreview} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </Box>
            )}

            {/* ── Header: Avatar + Title + Category + Badge (all below cover) ── */}
            <Box sx={{ px: 2, pt: 2, position: "relative" }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                        src={serviceAvatarPreview || undefined}
                        sx={{
                            width: 70, height: 70, flexShrink: 0,
                            border: "3px solid",
                            borderColor: (t) => alpha(t.palette.primary.main, 0.15),
                            boxShadow: (t) => `0 2px 10px ${alpha(t.palette.common.black, 0.1)}`,
                            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                            color: "primary.main",
                        }}
                    >
                        {CatIcon ? <CatIcon sx={{ fontSize: 34 }} /> : providerFallbackIcon}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                        <Typography sx={{ fontWeight: 950, fontSize: { xs: 17, sm: 19 }, lineHeight: 1.15, letterSpacing: "-0.02em", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                            {title || "Your Service Title"}
                        </Typography>
                        {/* Subtitle */}
                        {subtitle && (
                            <Typography sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary", mt: 0.15, lineHeight: 1.3, wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                {subtitle}
                            </Typography>
                        )}
                        {/* Category badge + Licensed & Insured on same row */}
                        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                            {catInfo && (
                                <Chip
                                    icon={CatIcon ? <CatIcon sx={{ fontSize: "13px !important", color: "primary.dark !important" }} /> : undefined}
                                    label={catInfo.name}
                                    size="small"
                                    sx={{
                                        fontWeight: 800, fontSize: 10.5, height: 22,
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                        color: "primary.dark",
                                        border: "1px solid",
                                        borderColor: (t) => alpha(t.palette.primary.main, 0.2),
                                        "& .MuiChip-icon": { color: "primary.dark" },
                                    }}
                                />
                            )}
                            {licensedInsured && (
                                <Chip
                                    icon={<VerifiedRoundedIcon sx={{ fontSize: "12px !important" }} />}
                                    label="Licensed & Insured"
                                    size="small"
                                    sx={{
                                        fontWeight: 800, fontSize: 10, height: 22,
                                        bgcolor: (t) => alpha(t.palette.success.main, 0.1),
                                        color: "success.dark",
                                        border: "1px solid",
                                        borderColor: (t) => alpha(t.palette.success.main, 0.25),
                                        "& .MuiChip-icon": { color: "success.main" },
                                    }}
                                />
                            )}
                        </Box>
                        {/* Location — own line matching business detail */}
                        {locationLabel && (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35 }}>
                                <LocationOnRoundedIcon sx={{ fontSize: 15, color: "primary.main" }} />
                                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "primary.main" }}>{locationLabel}</Typography>
                            </Stack>
                        )}
                        {/* Rating stars row (placeholder for preview) */}
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35 }}>
                            <Rating value={0} precision={0.5} readOnly size="small"
                                    sx={{ fontSize: 16, "& .MuiRating-iconFilled": { color: "secondary.main" }, "& .MuiRating-iconEmpty": { color: "action.disabled" } }} />
                            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary" }}>(0)</Typography>
                        </Stack>
                        {/* Phone & Email — matching ServiceDetailPanel header */}
                        {(phoneNumber?.trim() || emailAddress?.trim()) && (
                            <Stack spacing={0.25} sx={{ mt: 0.75 }}>
                                {phoneNumber?.trim() && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <PhoneRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                        <Typography sx={{ fontSize: 12, color: "text.primary", fontWeight: 700 }}>{phoneNumber.trim()}</Typography>
                                    </Stack>
                                )}
                                {emailAddress?.trim() && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <EmailRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                        <Typography sx={{ fontSize: 12, color: "text.primary", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emailAddress.trim()}</Typography>
                                    </Stack>
                                )}
                            </Stack>
                        )}
                        {/* Hours + Social icons row — matching ServiceDetailPanel */}
                        <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {hasHours && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <AccessTimeRoundedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                                        <Typography sx={{ fontSize: 12, fontWeight: 800, color: "success.main" }}>Hours set</Typography>
                                    </Stack>
                                )}
                            </Box>
                            {socialLinks.length > 0 && (
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                                    {socialLinks.map((sl) => (
                                        <Tooltip key={sl.label} title={sl.label} arrow placement="top">
                                            <Box
                                                component="a"
                                                href={sl.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.preventDefault()}
                                                sx={{
                                                    width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                                    bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
                                                    color: sl.color, cursor: "pointer", textDecoration: "none",
                                                    "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.12) },
                                                }}>
                                                {sl.icon}
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Stack>
                            )}
                        </Stack>
                    </Box>
                </Stack>
            </Box>

            <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />

            {/* ── CTAs side-by-side above tabs (decorative preview, not interactive) ── */}
            <Box sx={{ px: 2, pt: 2 }}>
                <Stack direction="row" spacing={1}>
                    <Box sx={(t) => ({
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75,
                        py: 0.85, borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: 12,
                        bgcolor: t.palette.primary.main, color: t.palette.primary.contrastText,
                        userSelect: "none",
                    })}>
                        <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                        View Service Page
                    </Box>
                    <Box sx={(t) => ({
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75,
                        py: 0.85, borderRadius: 2, textTransform: "none", fontWeight: 900, fontSize: 12,
                        border: "1px solid", borderColor: t.palette.divider, color: t.palette.text.primary,
                        userSelect: "none",
                    })}>
                        <ShareRoundedIcon sx={{ fontSize: 16 }} />
                        Share
                    </Box>
                </Stack>
            </Box>

            {/* ── Tabs: About | Photos | Reviews (matching ServiceDetailPanel) ── */}
            <Box sx={{ px: 2, pt: 1.5 }}>
                <Tabs value={previewTab} onChange={(_e, v) => setPreviewTab(v)}
                      variant="fullWidth"
                      sx={(t) => ({
                          minHeight: 38,
                          borderBottom: "1px solid",
                          borderColor: alpha(t.palette.primary.main, 0.12),
                          "& .MuiTab-root": { minHeight: 38, textTransform: "none", fontWeight: 700, fontSize: 13.5, letterSpacing: "-0.01em", px: 1, minWidth: 0, gap: 0.25, color: t.palette.text.secondary, "&:hover": { color: t.palette.text.primary } },
                          "& .Mui-selected": { color: `${t.palette.primary.main} !important`, fontWeight: 950 },
                          "& .MuiTabs-indicator": { bgcolor: t.palette.primary.main, height: 2.5, borderRadius: 0 },
                      })}>
                    <Tab icon={<DescriptionRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="About" value={0} />
                    {hasMap && <Tab icon={<LocationOnRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Location" value={1} />}
                    <Tab icon={<PhotoLibraryRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Photos${allPhotoUrls.length > 0 ? ` (${allPhotoUrls.length})` : ""}`} value={2} />
                    <Tab icon={<ReviewsRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Reviews" value={3} />
                </Tabs>
            </Box>

            {/* ══ TAB 0: ABOUT ══ */}
            {previewTab === 0 && (
                <Box>
                    {/* Provided By — top of About tab */}
                    <Box sx={{ px: 2, pt: 2 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.75 }}>
                            Provided By
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center"
                               sx={{ borderRadius: 2, p: 0.75, mx: -0.75, transition: "background 0.15s", "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) } }}>
                            <Avatar src={providerAvatar || undefined} sx={{ width: 36, height: 36, border: "1.5px solid", borderColor: "divider", bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main" }}>
                                {providerFallbackIcon}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{providerName || "Your Name"}</Typography>
                                {providerHandle && <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>@{providerHandle}</Typography>}
                            </Box>
                        </Stack>
                    </Box>

                    <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />

                    {/* About Section */}
                    {descText && (
                        <Box sx={{ px: 2, pt: 2 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>About {title || "Your Service"}</Typography>
                            <Box sx={{ position: "relative", maxHeight: (!descExpanded && descIsLong) ? 150 : "none", overflow: "hidden", transition: "max-height 0.3s ease" }}>
                                <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: "text.secondary", fontWeight: 500, whiteSpace: "pre-line", wordBreak: "break-word", overflowWrap: "anywhere" }}>
                                    {descText || "Your description will appear here…"}
                                </Typography>
                                {!descExpanded && descIsLong && (
                                    <Box sx={(t) => ({ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(transparent, ${t.palette.background.paper})` })} />
                                )}
                            </Box>
                            {descIsLong && (
                                <Button size="small" onClick={() => setDescExpanded((v) => !v)}
                                        sx={{ textTransform: "none", fontWeight: 800, fontSize: 12, color: "primary.main", mt: 0.5, pl: 0 }}>
                                    {descExpanded ? "Show less" : "Read more"}
                                </Button>
                            )}
                        </Box>
                    )}

                    {/* Highlight Sections (multi, like admin console) */}
                    {hasHighlights && validSections.map((sec, idx) => (
                        <Box key={idx} sx={{ px: 2, pt: 2 }}>
                            <Box sx={(t) => ({ borderRadius: 2.5, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.04), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                <Box sx={(t) => ({ px: 2, py: 1, bgcolor: alpha(t.palette.primary.main, 0.07), borderBottom: "1px solid", borderColor: alpha(t.palette.primary.main, 0.10), display: "flex", alignItems: "center", gap: 0.75 })}>
                                    <HlIconRender name={sec.icon} sx={{ fontSize: 17, color: "primary.main" }} />
                                    <Typography sx={{ fontWeight: 900, fontSize: 12, color: "primary.dark", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                        {sec.title || "Highlight"}
                                    </Typography>
                                </Box>
                                {(sec._photoPreview || sec.photoUrl || sec.body) && (
                                    <Box sx={{ p: 1.75, overflow: "hidden" }}>
                                        {(sec._photoPreview || sec.photoUrl) && (
                                            <Box component="img" src={sec._photoPreview || sec.photoUrl} alt={sec.title}
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
                    ))}

                    {/* Services Offered Chips */}
                    {servicesOffered.length > 0 && (
                        <>
                            <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />
                            <Box sx={{ px: 2, pt: 2 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1 }}>Services Offered</Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                                    {servicesOffered.map((svc) => (
                                        <Chip key={svc} label={svc} size="small" variant="outlined"
                                              sx={(t) => ({ fontWeight: 700, fontSize: 11.5, borderColor: alpha(t.palette.text.primary, 0.12) })} />
                                    ))}
                                </Box>
                            </Box>
                        </>
                    )}

                    {/* Certifications */}
                    {hasCerts && (
                        <>
                            <Divider sx={{ mx: 2, mt: 2, mb: 0 }} />
                            <Box sx={{ px: 2, pt: 2 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                                    <WorkspacePremiumRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} /> Certifications
                                </Typography>
                                <Stack spacing={0.75}>
                                    {certifications.filter((c) => c.name?.trim()).map((cert, idx) => (
                                        <Box key={idx} sx={(t) => ({ p: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.08) })}>
                                            <Typography sx={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1.2 }}>{cert.name}</Typography>
                                            {(cert.issuer || cert.year) && (
                                                <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 600, mt: 0.25 }}>
                                                    {[cert.issuer, cert.year].filter(Boolean).join(" · ")}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </>
                    )}

                    <Box sx={{ height: 16 }} />
                </Box>
            )}

            {/* ══ TAB 1: LOCATION ══ */}
            {previewTab === 1 && (
                <Box sx={{ px: 2, pt: 2, pb: 3 }}>
                    <Stack spacing={1.5}>
                        <Box sx={(t) => ({ borderRadius: 3, overflow: "hidden", bgcolor: alpha(t.palette.primary.main, 0.03), border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                            {hasMap && (() => {
                                const hasStreet = Boolean(streetAddress?.trim());
                                const hasVerifiedAddress = hasStreet && addressValidated;
                                const mLat = mapCoords[0];
                                const mLng = mapCoords[1];
                                const mapsQ = encodeURIComponent(
                                    streetAddress || [city && city !== "All Cities" ? city : "", county && county !== "All Counties" ? county + " County" : "", "Alabama"].filter(Boolean).join(", ") || "Alabama"
                                );
                                const mapMode = hasVerifiedAddress ? "place" : "view";
                                const mapZoom = hasVerifiedAddress ? 12 : 10;
                                const mapSrc = `https://www.google.com/maps/embed/v1/${mapMode}?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${mLat},${mLng}${mapMode === "place" ? "&q=" + mapsQ : ""}&zoom=${mapZoom}`;
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
                            <Box sx={{ p: 2, pt: hasMap ? 1.5 : 2 }}>
                                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                                    <LocationOnRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                    <Typography sx={{ fontWeight: 900, fontSize: "0.88rem" }}>Location</Typography>
                                </Stack>
                                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.secondary" }}>
                                    {locationLabel || "Set a location in the form"}
                                </Typography>
                                {hasMap && (!streetAddress?.trim() || !addressValidated) && (
                                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>
                                        {streetAddress?.trim() && !addressValidated
                                            ? "Verify your address to show an exact map pin"
                                            : "Location shown is approximate for the " + (county && county !== "All Counties" ? county + " County" : "selected") + " area"}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            )}

            {/* ══ TAB 2: PHOTOS ══ */}
            {previewTab === 2 && (
                <Box sx={{ px: 2, pt: 2, pb: 3 }}>
                    {allPhotoUrls.length > 0 ? (
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1 }}>
                            {allPhotoUrls.map((url, i) => (
                                <Box key={i} component="img" src={url} alt={`Photo ${i + 1}`}
                                     sx={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 2 }} />
                            ))}
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <PhotoLibraryRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Photos</Typography>
                            <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Any photos you add will appear here.</Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* ══ TAB 3: REVIEWS ══ */}
            {previewTab === 3 && (
                <Box sx={{ px: 2, pt: 2, pb: 3 }}>
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <ReviewsRoundedIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>Reviews</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.5 }}>Reviews will appear here once your service is live.</Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════
//  Admin desktop breakpoint
// ───────────────────────────────────────────────────────────
// The Business Hub page treats anything under 1440px as "mobile" (see
// BusinessHubPage.jsx: `useMediaQuery('(max-width:1439px)')`). We mirror that
// here so the admin console form switches layouts at the same point.
//
// Implementation: we locally remap the MUI `md` breakpoint to 1440. Every
// existing `{ xs, md }` sx prop on this page keeps working unchanged —
// only the effective threshold changes.
//
// The live preview is gated separately via the `xl` key so it only appears
// on genuine-desktop widths (>=1536px).
// ═══════════════════════════════════════════════════════════
const ADMIN_DESKTOP_MIN = 1440;

function buildAdminTheme(baseTheme) {
    // IMPORTANT: only pass `breakpoints.values` — don't spread
    // baseTheme.breakpoints itself. That object carries precomputed
    // `up`/`down`/`between`/`only` methods that reference the OLD values;
    // if they come through the merge, MUI keeps them and our new `md: 1440`
    // never takes effect for the sx shorthand (which goes through up/down).
    return createTheme(baseTheme, {
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

// ═══════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ServiceAdminConsole() {
    const navigate = useNavigate();
    const params = useParams();
    const baseTheme = useTheme();
    // Local theme with `md` remapped to 1440 (the Business Hub page's
    // mobile threshold). Every `{ xs, md }` sx prop now flips at 1440.
    const theme = useMemo(() => buildAdminTheme(baseTheme), [baseTheme]);
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const serviceId = params.serviceId || params.serviceProfileId || params.id;
    const isEdit = Boolean(serviceId);
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

    const { user } = useAuth();
    const { activeAccount, activeArtistId, activeBusinessId } = useActiveAccount();
    const isAuthed = Boolean(user && (user.id || user.user_id));

    // Provider identity — use activeBusinessId / activeArtistId as reliable signals
    const rawType = activeAccount?.type || "personal";
    const providerType = (activeBusinessId && (rawType === "business" || rawType === "personal"))
        ? "business"
        : (activeArtistId && (rawType === "artist" || rawType === "personal"))
            ? "music"
            : rawType === "business" ? "business"
                : rawType === "artist" ? "music"
                    : "user";
    const providerId = providerType === "music" ? (activeArtistId || activeAccount?.id || user?.id || user?.user_id)
        : providerType === "business" ? (activeBusinessId || activeAccount?.id || user?.id || user?.user_id)
            : (user?.id || user?.user_id);
    const personalName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Me";
    const providerName = providerType === "business"
        ? (activeAccount?.name || activeAccount?.business_name || "Business Account")
        : providerType === "music"
            ? (activeAccount?.name || activeAccount?.artist_name || "Artist Profile")
            : personalName;
    const providerAvatar = providerType !== "user"
        ? (activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || null)
        : (user?.avatar_url || user?.profile_picture || null);
    const providerHandle = providerType !== "user"
        ? (activeAccount?.handle || activeAccount?.slug || activeAccount?.username || null)
        : (user?.handle || null);
    const providerProfilePath = activeAccount?.profilePath || activeAccount?.profile_path || (activeAccount?.slug ? `/${activeAccount.slug}` : null);

    // Account-type-aware fallback icon for Avatars (matches UserCardPopover pattern)
    const providerFallbackIcon = providerType === "business"
        ? <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
        : providerType === "music"
            ? <MusicNoteRoundedIcon sx={{ fontSize: 26 }} />
            : <PersonRoundedIcon sx={{ fontSize: 28 }} />;

    // ── State ──
    const [loading, setLoading] = useState(isEdit);
    const [showValidation, setShowValidation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Two-step flow: intro screen (name + category) → full form (only for new services)
    const [introCompleted, setIntroCompleted] = useState(isEdit);
    const [introChecking, setIntroChecking] = useState(false);
    const [introError, setIntroError] = useState("");
    const [introFieldErrors, setIntroFieldErrors] = useState({});
    // Per-field profanity errors on the full form (scroll-to support)
    const [fieldProfanityErrors, setFieldProfanityErrors] = useState({});
    const titleInputRef = useRef(null);
    const descriptionInputRef = useRef(null);

    // Basics
    const [title, setTitle] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [licensedInsured, setLicensedInsured] = useState(false);
    const [certifications, setCertifications] = useState([]);
    const [faq, setFaq] = useState([]);

    // Services Offered
    const [servicesOffered, setServicesOffered] = useState([]);
    const [newServiceChip, setNewServiceChip] = useState("");

    // Details
    const [county, setCounty] = useState("All Counties");
    const [city, setCity] = useState("All Cities");
    const [streetAddress, setStreetAddress] = useState("");
    const [hours, setHours] = useState(null);
    const [contactPreference, setContactPreference] = useState("message");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [emailAddress, setEmailAddress] = useState("");

    // Address validation
    const [addressValidated, setAddressValidated] = useState(false);
    const [addressValidating, setAddressValidating] = useState(false);
    const [addressError, setAddressError] = useState("");
    const [validatedCoords, setValidatedCoords] = useState(null);
    const [showMap, setShowMap] = useState(false);

    // Links
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [tiktokUrl, setTiktokUrl] = useState("");

    // Photos
    const [photos, setPhotos] = useState([]);
    const [coverPreview, setCoverPreview] = useState("");
    const [coverFile, setCoverFile] = useState(null);
    const [coverCropSrc, setCoverCropSrc] = useState(null);
    const [coverCropOpen, setCoverCropOpen] = useState(false);
    const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
    const [coverZoom, setCoverZoom] = useState(1);
    const [coverCroppedArea, setCoverCroppedArea] = useState(null);
    const [coverCropProcessing, setCoverCropProcessing] = useState(false);
    const coverInputRef = useRef(null);

    // Service avatar (the service's own profile picture, separate from provider)
    const [serviceAvatarPreview, setServiceAvatarPreview] = useState("");
    const [serviceAvatarFile, setServiceAvatarFile] = useState(null);
    const serviceAvatarInputRef = useRef(null);
    const [avatarCropSrc, setAvatarCropSrc] = useState(null);
    const [avatarCropOpen, setAvatarCropOpen] = useState(false);
    const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
    const [avatarZoom, setAvatarZoom] = useState(1);
    const [avatarCroppedArea, setAvatarCroppedArea] = useState(null);
    const [avatarCropProcessing, setAvatarCropProcessing] = useState(false);

    // Highlight sections (multiple, like admin console)
    const [highlightSections, setHighlightSections] = useState([]);
    const hlPhotoInputRefs = useRef({});

    // NSFW / photo moderation error (Snackbar)
    const [photoModerationError, setPhotoModerationError] = useState('');
    const showPhotoError = useCallback((msg) => setPhotoModerationError(msg), []);
    const clearPhotoError = useCallback(() => setPhotoModerationError(''), []);

    // Refs for scroll-to-field on validation failure
    const locationSectionRef = useRef(null);

    const clamp = (val, max) => { const s = String(val || ""); return s.length > max ? s.slice(0, max) : s; };

    // ── Compute isStatewide from county/city ──
    const isStatewide = (county === "All Counties" || !county) && (city === "All Cities" || !city);

    // Location validation: county/city required when address is entered
    const hasAddress = Boolean(String(streetAddress || "").trim());
    const countyIsAll = county === "All Counties" || !county;
    const cityIsAll = city === "All Cities" || !city;
    const locationMissingForAddress = hasAddress && (countyIsAll || cityIsAll);

    // ── Fetch existing service for edit ──
    useEffect(() => {
        if (!isEdit || !serviceId) return;
        let cancelled = false;
        (async () => {
            try {
                const svc = await fetchServiceById(serviceId);
                if (cancelled || !svc) return;
                if (svc?.isOwner === false) {
                    setError("You do not have permission to edit this service profile.");
                    setLoading(false);
                    return;
                }
                setTitle(svc.title || "");
                setCategorySlug(svc.categorySlug || "");
                setSummary(svc.summary || "");
                setDescription(svc.description || "");
                setLicensedInsured(Boolean(svc.licensedInsured || svc.licensed_insured));
                setCertifications(Array.isArray(svc.certifications) ? svc.certifications : []);
                setFaq(Array.isArray(svc.faq) ? svc.faq : []);
                setServicesOffered(Array.isArray(svc.servicesOffered) ? svc.servicesOffered : []);
                setCounty(svc.county || (svc.isStatewide ? "All Counties" : "All Counties"));
                setCity(svc.city || (svc.isStatewide ? "All Cities" : "All Cities"));
                setStreetAddress(svc.streetAddress || "");
                setHours(svc.availabilityHours && typeof svc.availabilityHours === "object" && Object.keys(svc.availabilityHours).length > 0 ? svc.availabilityHours : null);
                setContactPreference(svc.contactPreference || "message");
                setPhoneNumber((() => { const d = (svc.phoneNumber || svc.contactValue || "").replace(/\D/g, '').slice(0, 10); if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`; if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`; if (d.length > 0) return `(${d}`; return svc.phoneNumber || svc.contactValue || ""; })());
                setEmailAddress(svc.emailAddress || "");
                setValidatedCoords(svc.latitude != null && svc.longitude != null ? [svc.latitude, svc.longitude] : null);
                if (svc.latitude != null && svc.longitude != null && svc.streetAddress) {
                    setAddressValidated(true);
                    setShowMap(true);
                }
                setPhotos(Array.isArray(svc.photos) ? svc.photos.map((p, idx) => ({ id: String(p.id || `existing-${idx}`), url: p.url, file: null, _gcsUrl: p.url, _objectPath: p.objectPath || "" })) : []);
                setCoverPreview(svc.coverUrl || "");
                // Load service avatar
                setServiceAvatarPreview(svc.serviceAvatarUrl || "");
                // Load highlight sections
                if (Array.isArray(svc.highlightSections) && svc.highlightSections.length > 0) {
                    setHighlightSections(svc.highlightSections.map((s) => ({
                        icon: s.icon || "Star",
                        title: s.title || "",
                        body: s.body || "",
                        photoUrl: s.photoUrl || s.photo_url || "",
                        _photoFile: null,
                        _photoPreview: s.photoUrl || s.photo_url || "",
                    })));
                }
                setWebsiteUrl(svc.websiteUrl || "");
                setFacebookUrl(stripSocialPrefix(svc.facebookUrl, "facebook"));
                setInstagramUrl(stripSocialPrefix(svc.instagramUrl, "instagram"));
                setTwitterUrl(stripSocialPrefix(svc.twitterUrl, "twitter"));
                setYoutubeUrl(stripSocialPrefix(svc.youtubeUrl, "youtube"));
                setTiktokUrl(stripSocialPrefix(svc.tiktokUrl, "tiktok"));
            } catch { setError("Failed to load service."); }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [isEdit, serviceId]);

    // ── Derived values ──
    const titleTrimmed = String(title || "").trim();
    const descriptionTrimmed = String(description || "").trim();
    const locationValid = isStatewide || Boolean(county && county !== "All Counties");
    const canSubmit = Boolean(titleTrimmed && categorySlug && descriptionTrimmed && locationValid) && !locationMissingForAddress;

    // Per-section validation error flags (used to force-open sections on submit)
    const basicsHasErrors = !titleTrimmed || !categorySlug || Boolean(fieldProfanityErrors.title);
    const aboutHasErrors = !descriptionTrimmed || Boolean(fieldProfanityErrors.description);
    const locationHasErrors = (!locationValid && !isStatewide) || locationMissingForAddress;

    const catInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
    const locationLabel = (() => {
        if (isStatewide) return "Alabama (Statewide)";
        const countyLabel = (county && county !== "All Counties") ? `${county} County` : "";
        const cityLabel2 = (city && city !== "All Cities") ? city : "";
        const parts = [streetAddress, cityLabel2, countyLabel].filter(Boolean);
        return parts.join(", ") || "";
    })();

    // ── Services Offered chips ──
    const handleAddServiceChip = () => {
        const trimmed = newServiceChip.trim();
        if (!trimmed || servicesOffered.includes(trimmed) || servicesOffered.length >= 30) return;
        setServicesOffered((prev) => [...prev, trimmed]);
        setNewServiceChip("");
    };

    const handleRemoveServiceChip = (chip) => {
        setServicesOffered((prev) => prev.filter((s) => s !== chip));
    };

    // ── About photo ──

    // ── Service avatar ──
    const handleServiceAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type === "image/gif") { showPhotoError("GIFs aren\u2019t supported for profile photos. Please upload a JPG, PNG, or WebP image."); e.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarCropSrc(reader.result);
            setAvatarCropOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleAvatarCropComplete = async () => {
        if (!avatarCroppedArea || !avatarCropSrc) return;
        setAvatarCropProcessing(true);
        try {
            const croppedBlob = await createCroppedImage(avatarCropSrc, avatarCroppedArea, 400, 400);
            // NSFW moderation scan
            const modResult = await moderateImageFile(croppedBlob);
            if (!modResult.safe) {
                showPhotoError(modResult.message || 'This image doesn\u2019t meet our community guidelines.');
                setAvatarCropOpen(false);
                setAvatarCropSrc(null);
                setAvatarCrop({ x: 0, y: 0 });
                setAvatarZoom(1);
                return;
            }
            setServiceAvatarFile(croppedBlob);
            setServiceAvatarPreview(URL.createObjectURL(croppedBlob));
            setAvatarCropOpen(false);
            setAvatarCropSrc(null);
            setAvatarCrop({ x: 0, y: 0 });
            setAvatarZoom(1);
        } catch { /* silent */ }
        finally { setAvatarCropProcessing(false); }
    };

    const handleRemoveServiceAvatar = () => {
        setServiceAvatarPreview("");
        setServiceAvatarFile(null);
    };

    // ── Highlight Sections helpers ──
    const handleAddHighlightSection = () => {
        if (highlightSections.length >= MAX_HIGHLIGHT_SECTIONS) return;
        setHighlightSections((prev) => [...prev, { ...EMPTY_HIGHLIGHT_SECTION }]);
    };

    const handleRemoveHighlightSection = (idx) => {
        setHighlightSections((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleUpdateHighlightSection = (idx, field, value) => {
        setHighlightSections((prev) => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], [field]: value };
            return arr;
        });
    };

    const handleHighlightSectionPhoto = async (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        if (file.type === "image/gif") { showPhotoError("GIFs aren\u2019t supported. Please upload a JPG, PNG, or WebP image."); return; }
        // NSFW moderation scan before staging
        const modResult = await moderateImageFile(file);
        if (!modResult.safe) {
            showPhotoError(modResult.message || 'This image doesn\u2019t meet our community guidelines.');
            return;
        }
        setHighlightSections((prev) => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], _photoFile: file, _photoPreview: URL.createObjectURL(file) };
            return arr;
        });
    };

    const handleRemoveHighlightSectionPhoto = (idx) => {
        setHighlightSections((prev) => {
            const arr = [...prev];
            arr[idx] = { ...arr[idx], _photoFile: null, _photoPreview: "", photoUrl: "" };
            return arr;
        });
    };

    // ── Address Verification with rate limiting ──
    const handleVerifyAddress = useCallback(async () => {
        setAddressError("");
        const trimmedStreet = String(streetAddress || "").trim();
        if (!trimmedStreet) { setAddressError("Please enter a street address first."); return; }
        if (countyIsAll || cityIsAll) { setAddressError("Please select a county and city before verifying the address."); return; }

        // Persistent rate limit check (survives page refresh / navigation)
        const rateCheck = checkGeocodeRateLimit();
        if (!rateCheck.allowed) { setAddressError(rateCheck.message); return; }

        setAddressValidating(true);
        try {
            const parts = [trimmedStreet];
            if (city && city !== "All Cities") parts.push(city);
            if (county && county !== "All Counties") parts.push(`${county} County`);
            parts.push("Alabama");
            const fullAddress = parts.join(", ");

            const res = await secureFetch("/api/geocode", {
                method: "POST", credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: fullAddress }),
            });
            const data = await res.json().catch(() => null);

            if (res.ok && data?.lat && data?.lng) {
                const isStateFallback = Math.abs(data.lat - 32.318) < 0.1 && Math.abs(data.lng - (-86.902)) < 0.1;
                if (isStateFallback) { recordGeocodeResult(false); setAddressError("This is not a valid address. Please check your entry and try again."); return; }
                const locType = String(data.location_type || "").toUpperCase();
                if (locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER") { recordGeocodeResult(false); setAddressError("This address could not be verified as a real street address."); return; }
                recordGeocodeResult(true);
                setValidatedCoords([data.lat, data.lng]);
                setAddressValidated(true);
                setAddressError("");
                setShowMap(true);
            } else {
                recordGeocodeResult(false);
                setAddressError("This is not a valid address. Please check your entry and try again.");
            }
        } catch {
            recordGeocodeResult(false);
            setAddressError("Address verification failed. Please try again.");
        } finally {
            setAddressValidating(false);
        }
    }, [streetAddress, county, city, countyIsAll, cityIsAll]);

    // ── Submit ──
    const handleDeleteService = async () => {
        setDeleteLoading(true);
        try {
            await deleteService(serviceId);
            navigate("/services", { replace: true });
        } catch (err) {
            console.error("Delete service failed:", err);
            setError(err?.message || "Failed to delete service.");
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    // ── Intro step: validate name + category, check profanity, then proceed ──
    const handleIntroNext = async () => {
        setIntroError("");
        setIntroFieldErrors({});
        const trimmedTitle = String(title || "").trim();
        const errors = {};
        if (!trimmedTitle) errors.title = "Service name is required.";
        if (!categorySlug) errors.category = "Please select a category.";
        if (Object.keys(errors).length > 0) {
            setIntroFieldErrors(errors);
            return;
        }
        // Profanity check on title
        setIntroChecking(true);
        try {
            const profResult = checkFieldsProfanity({ title: trimmedTitle });
            if (!profResult.clean) {
                setIntroFieldErrors({ title: "This name contains inappropriate language. Please choose a different name." });
                setIntroChecking(false);
                return;
            }
        } catch {
            // If profanity check fails for some reason, allow through
        }
        setIntroChecking(false);
        setIntroCompleted(true);
    };

    const handleSubmit = async () => {
        setShowValidation(true);
        setError("");
        setFieldProfanityErrors({});

        // Scroll to the first invalid required field on mobile
        if (!canSubmit) {
            const titleTrimmedCheck = String(title || "").trim();
            if (!titleTrimmedCheck && titleInputRef.current) {
                titleInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                const input = titleInputRef.current.querySelector?.("input, textarea");
                if (input) setTimeout(() => input.focus(), 350);
            } else if (!categorySlug && titleInputRef.current) {
                titleInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            } else if (!String(description || "").trim() && descriptionInputRef.current) {
                descriptionInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                const input = descriptionInputRef.current.querySelector?.("textarea");
                if (input) setTimeout(() => input.focus(), 350);
            } else if (locationSectionRef.current) {
                locationSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }

        // Client-side profanity check — per-field errors with scroll-to
        const profanityResult = checkFieldsProfanity({ title, description: String(description || '').trim() });
        if (!profanityResult.clean) {
            const fieldKey = profanityResult.field; // "title" or "description"
            const msg = `Your ${fieldKey} contains inappropriate language. Please revise and try again.`;
            setFieldProfanityErrors({ [fieldKey]: msg });
            // Scroll to the offending input
            const targetRef = fieldKey === "title" ? titleInputRef : descriptionInputRef;
            if (targetRef.current) {
                targetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                // Try to focus the input inside the ref container
                const input = targetRef.current.querySelector?.("input, textarea");
                if (input) setTimeout(() => input.focus(), 350);
            }
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            // Gallery photos: parallel upload (was sequential). Moderation
            // stays in the map callback because PhotosUploadSection doesn't
            // pre-scan, so this is the sole moderation pass for gallery files.
            // Note: setUploadProgress is intentionally pegged to 100 after the
            // parallel wave rather than stepped — individual upload completion
            // order is no longer meaningful.
            const safePhotos = Array.isArray(photos) ? photos : [];
            let galleryModerationError = null;
            const photoPayloadResults = await Promise.all(
                safePhotos.map(async (p) => {
                    if (p._gcsUrl) {
                        return { url: p._gcsUrl, objectPath: p._objectPath || "" };
                    }
                    if (p.file) {
                        const modResult = await moderateImageFile(p.file);
                        if (!modResult.safe) {
                            if (!galleryModerationError) {
                                galleryModerationError = modResult.message || 'This image doesn\u2019t meet our community guidelines.';
                            }
                            return null;
                        }
                        try {
                            return await uploadSinglePhoto(p.file);
                        } catch {
                            return null;
                        }
                    }
                    return null;
                })
            );
            if (galleryModerationError) {
                showPhotoError(galleryModerationError);
                setIsSubmitting(false);
                return;
            }
            const photoPayload = photoPayloadResults.filter(Boolean);
            setUploadProgress(100);

            let coverUrl = coverPreview || null;
            if (coverFile) {
                // No moderation scan here — the cover blob was already scanned
                // inside the crop-confirm handler when the user applied the
                // crop. Scanning again was just a second ~1s round-trip.
                try {
                    const covName = `${Date.now()}_service_cover.jpg`;
                    const signed = await getSignedUploadUrl({ folder: "services/covers", fileName: covName, contentType: "image/jpeg" });
                    if (signed?.uploadUrl) {
                        await uploadToSignedUrl({ uploadUrl: signed.uploadUrl, file: coverFile, contentType: "image/jpeg" });
                        coverUrl = String(signed.publicUrl || "").trim();
                    }
                } catch { /* skip */ }
            }

            // Upload service avatar — no custom avatar means category icon will show (no image URL needed)
            let svcAvatarUrl = serviceAvatarPreview || null;
            if (serviceAvatarFile) {
                try { const result = await uploadSinglePhoto(serviceAvatarFile, "services/avatars"); svcAvatarUrl = result.url; } catch { /* skip */ }
            }

            // Upload highlight section photos — in parallel, and without a
            // second moderation scan. handleHighlightSectionPhoto already
            // scans each file at pick time, so anything present in
            // sec._photoFile has already passed moderation.
            const highlightUploadedUrls = await Promise.all(
                highlightSections.map(async (sec) => {
                    if (!sec._photoFile) return sec.photoUrl || sec._photoPreview || "";
                    try {
                        const result = await uploadSinglePhoto(sec._photoFile, "services/highlights");
                        return result.url;
                    } catch {
                        return sec.photoUrl || sec._photoPreview || "";
                    }
                })
            );
            const hlSectionsPayload = [];
            highlightSections.forEach((sec, i) => {
                const photoUrl = highlightUploadedUrls[i] || "";
                if (sec.title?.trim() || sec.body?.trim() || photoUrl) {
                    hlSectionsPayload.push({
                        icon: sec.icon || "Star",
                        title: (sec.title || "").trim().slice(0, HL_SEC_TITLE_MAX),
                        body: (sec.body || "").trim().slice(0, HL_SEC_BODY_MAX),
                        photoUrl: photoUrl || null,
                    });
                }
            });

            const effectiveCounty = (county && county !== "All Counties") ? county : "";
            const effectiveCity = (city && city !== "All Cities") ? city : "";
            let lat = null, lng = null;
            if (!isStatewide) {
                const trimmedAddr = String(streetAddress || "").trim();
                // If address entered but not yet verified, auto-verify before saving
                if (trimmedAddr && !addressValidated) {
                    const rateCheck = checkGeocodeRateLimit();
                    if (!rateCheck.allowed) {
                        setAddressError(rateCheck.message);
                        setIsSubmitting(false);
                        return;
                    }
                    try {
                        const parts = [trimmedAddr];
                        if (effectiveCity) parts.push(effectiveCity);
                        if (effectiveCounty) parts.push(`${effectiveCounty} County`);
                        parts.push("Alabama");
                        const geoRes = await secureFetch("/api/geocode", {
                            method: "POST", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ address: parts.join(", ") }),
                        });
                        const geoData = await geoRes.json().catch(() => null);
                        if (geoRes.ok && geoData?.lat && geoData?.lng) {
                            const isStateFallback = Math.abs(geoData.lat - 32.318) < 0.1 && Math.abs(geoData.lng - (-86.902)) < 0.1;
                            const locType = String(geoData.location_type || "").toUpperCase();
                            if (isStateFallback || locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER") {
                                recordGeocodeResult(false);
                                setAddressError("This address could not be verified. Please check it or click Verify Address before saving.");
                                setIsSubmitting(false);
                                return;
                            }
                            recordGeocodeResult(true);
                            lat = geoData.lat;
                            lng = geoData.lng;
                            setValidatedCoords([geoData.lat, geoData.lng]);
                            setAddressValidated(true);
                        } else {
                            recordGeocodeResult(false);
                            setAddressError("This address could not be verified. Please check it or remove it before saving.");
                            setIsSubmitting(false);
                            return;
                        }
                    } catch {
                        recordGeocodeResult(false);
                        setAddressError("Address verification failed. Please try again.");
                        setIsSubmitting(false);
                        return;
                    }
                } else if (validatedCoords?.length === 2) {
                    lat = validatedCoords[0]; lng = validatedCoords[1];
                } else {
                    const coords = resolveLocationCoords(effectiveCity, effectiveCounty);
                    if (coords?.length === 2) { lat = coords[0]; lng = coords[1]; }
                }
            }

            const countyWithSuffix = effectiveCounty ? (effectiveCounty.toLowerCase().includes("county") ? effectiveCounty : effectiveCounty + " County") : "";
            const locParts = [streetAddress?.trim(), effectiveCity, countyWithSuffix].filter(Boolean);
            const locLabel = locParts.length > 0 ? locParts.join(", ") : (isStatewide ? "Statewide" : "");

            const payload = {
                providerType, providerId, providerName, providerAvatar, providerHandle, providerProfilePath,
                title: titleTrimmed.slice(0, TITLE_MAX), categorySlug,
                summary: String(summary || "").trim().slice(0, SUMMARY_MAX) || null,
                description: descriptionTrimmed.slice(0, DESCRIPTION_MAX),
                experience: licensedInsured ? "Licensed & Insured" : null,
                licensedInsured,
                certifications: certifications.filter((c) => c.name?.trim()).map((c) => ({ name: c.name.trim().slice(0, 150), issuer: (c.issuer || "").trim().slice(0, 150) || null, year: c.year || null })),
                faq: faq.filter((f) => f.question?.trim() && f.answer?.trim()).map((f) => ({ question: f.question.trim().slice(0, 300), answer: f.answer.trim().slice(0, 1000) })),
                servicesOffered: servicesOffered.slice(0, 30),
                isStatewide, county: isStatewide ? null : effectiveCounty || null, city: isStatewide ? null : effectiveCity || null,
                streetAddress: isStatewide ? null : streetAddress?.trim() || null,
                locationLabel: locLabel, latitude: lat, longitude: lng,
                availabilityHours: hours || null, contactPreference,
                phoneNumber: phoneNumber?.trim() || null, emailAddress: emailAddress?.trim() || null,
                photos: photoPayload, coverUrl,
                highlightSections: hlSectionsPayload.length > 0 ? hlSectionsPayload : [],
                serviceAvatarUrl: svcAvatarUrl || null,
                websiteUrl: websiteUrl?.trim() || null,
                facebookUrl: buildSocialUrl(facebookUrl, "facebook"), instagramUrl: buildSocialUrl(instagramUrl, "instagram"),
                twitterUrl: buildSocialUrl(twitterUrl, "twitter"), youtubeUrl: buildSocialUrl(youtubeUrl, "youtube"),
                tiktokUrl: buildSocialUrl(tiktokUrl, "tiktok"),
            };

            if (isEdit) {
                await updateService(serviceId, payload);
                navigate(`/services/${serviceId}`, { replace: true });
            } else {
                const created = await createService(payload);
                const newId = created?.id || created?.serviceId || created?.listing?.id;
                navigate(newId ? `/services/${newId}` : "/services", { replace: true });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not save service listing.");
        } finally { setIsSubmitting(false); }
    };

    if (!isAuthed) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 900, fontSize: 20, mb: 1 }}>Sign In Required</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>You need to be logged in to create a service listing.</Typography>
                <Button variant="contained" onClick={() => navigate("/services")} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900 }}>Back to Services</Button>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{ minHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: "100vh" }, pt: { xs: `${chromeTop}px`, sm: 0 }, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: { xs: "background.paper", sm: "background.default" } }}>
                <CircularProgress />
            </Box>
        );
    }

    // ── Intro Screen: name + category (new services only) ──
    if (!isEdit && !introCompleted) {
        const introTitleTrimmed = String(title || "").trim();
        const introCatInfo = categorySlug ? getServiceCategoryInfo(categorySlug) : null;
        const IntroCatIcon = introCatInfo?.Icon || null;
        return (
            <Box
                sx={{
                    minHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: "calc(100vh - 73px)" },
                    height: { xs: `calc(100vh - ${chromeTop}px)`, sm: "calc(100vh - 73px)" },
                    pt: { xs: `${chromeTop}px`, sm: 0 },
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "center",
                    bgcolor: { xs: "background.paper", sm: "background.default" },
                    overflow: { xs: "hidden", sm: "hidden" },
                    p: { xs: 0, sm: 2 },
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: { xs: "100%", sm: 480 },
                        width: "100%",
                        minHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: "auto" },
                        maxHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: "auto" },
                        p: { xs: 3, sm: 4 },
                        pt: { xs: 4, sm: 4 },
                        borderRadius: { xs: 0, sm: 3 },
                        border: { xs: "none", sm: "1px solid" },
                        borderColor: "divider",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: { xs: "flex-start", sm: "center" },
                        overflowY: { xs: "hidden", sm: "visible" },
                    }}
                >
                    {/* Category icon */}
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
                            transition: "all 0.25s ease",
                        })}
                    >
                        {IntroCatIcon ? <IntroCatIcon sx={{ fontSize: 28, color: "primary.main" }} /> : <BuildRoundedIcon sx={{ fontSize: 28, color: "primary.main" }} />}
                    </Box>

                    <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 0.5 }}>
                        Create Your Service
                    </Typography>
                    <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 3 }}>
                        Enter a name and choose a category to get started.
                    </Typography>

                    {introError && (
                        <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>{introError}</Alert>
                    )}

                    <Stack spacing={2.5} sx={{ textAlign: "left" }}>
                        {/* Name input */}
                        <TextField
                            label="Service Name"
                            placeholder="e.g. Richardson Landworks"
                            value={title}
                            onChange={(e) => {
                                setTitle(clamp(e.target.value, TITLE_MAX));
                                if (introFieldErrors.title) setIntroFieldErrors((prev) => ({ ...prev, title: "" }));
                            }}
                            fullWidth
                            autoFocus
                            error={Boolean(introFieldErrors.title)}
                            helperText={introFieldErrors.title || ""}
                            inputProps={{ maxLength: TITLE_MAX }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleIntroNext(); } }}
                            sx={OPAQUE_TEXTFIELD_SX}
                        />

                        {/* Category dropdown */}
                        <FormControl fullWidth error={Boolean(introFieldErrors.category)}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                label="Category"
                                value={categorySlug}
                                onChange={(e) => {
                                    setCategorySlug(e.target.value);
                                    if (introFieldErrors.category) setIntroFieldErrors((prev) => ({ ...prev, category: "" }));
                                }}
                                MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
                                sx={{ backgroundColor: "background.paper" }}
                                renderValue={(sel) => {
                                    if (!sel) return "";
                                    const i = getServiceCategoryInfo(sel);
                                    const IC = i.Icon;
                                    return <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{IC && <IC fontSize="small" sx={{ color: "primary.main" }} />}<span>{i.name}</span></Box>;
                                }}
                            >
                                {SERVICE_CATEGORIES.map((cat) => {
                                    const i = getServiceCategoryInfo(cat.slug);
                                    const IC = i.Icon;
                                    return (
                                        <MenuItem key={cat.slug} value={cat.slug}>
                                            <ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>{IC && <IC fontSize="small" />}</ListItemIcon>
                                            <ListItemText primary={i.name} />
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            {introFieldErrors.category && (
                                <Typography sx={{ color: "error.main", fontSize: 12, mt: 0.5, ml: 1.75, fontWeight: 700 }}>
                                    {introFieldErrors.category}
                                </Typography>
                            )}
                        </FormControl>
                    </Stack>

                    {/* Buttons */}
                    <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 3 }}>
                        <Button
                            onClick={() => navigate("/services")}
                            disabled={introChecking}
                            sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleIntroNext}
                            disabled={introChecking}
                            startIcon={introChecking ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{ borderRadius: 999, px: 3, fontWeight: 900, boxShadow: "none" }}
                        >
                            {introChecking ? "Checking…" : "Get Started"}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                minHeight: "100vh",
                bgcolor: isMobile ? "background.paper" : "background.default",
                "& .MuiOutlinedInput-root": { bgcolor: "background.paper" },
                "& .MuiSelect-select": { bgcolor: "background.paper" },
                // Mobile input font size overrides
                ...(isMobile ? {
                    "& .MuiInputBase-input": { fontSize: 14 },
                    "& .MuiInputLabel-root": { fontSize: 14 },
                    "& .MuiFormHelperText-root": { fontSize: 11.5 },
                    // Fullscreen overlay on mobile (sits below app top bar)
                    position: "fixed",
                    top: `${chromeTop}px`,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1300,
                    minHeight: "unset",
                    height: `calc(100% - ${chromeTop}px)`,
                    overflow: "auto",
                } : {}),
            }}>

                {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && <LinearProgress sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 20 }} variant="determinate" value={uploadProgress} />}

                {/* ── Mobile top header ── */}
                {isMobile && (
                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            position: "sticky",
                            top: 0,
                            zIndex: 1100,
                        }}
                    >
                        <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <ButtonBase
                                    onClick={() => navigate(serviceId ? `/services/${serviceId}` : "/services")}
                                    sx={{
                                        width: 40, height: 40, borderRadius: "50%",
                                        border: "1px solid", borderColor: "divider",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, "&:hover": { bgcolor: "action.hover" },
                                    }}
                                >
                                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                                </ButtonBase>
                                <BuildRoundedIcon sx={{ fontSize: 22, color: "primary.main", flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {isEdit ? "Edit Profile" : "Create Service"}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Box>
                )}

                {/* ── Main Content: Form + Preview ── */}
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 0, md: 2 }, p: { xs: 0, md: 2.5 }, maxWidth: 1400, mx: "auto" }}>

                    {/* ══ LEFT: FORM ══ */}
                    <Box sx={{ flex: 1, minWidth: 0, maxWidth: { md: "55%" }, width: { xs: "100%" } }}>
                        {/* ── Top Bar (hidden on mobile where outer mobile header is used) ── */}
                        <Box sx={{
                            position: "sticky", top: 0, zIndex: 10, px: { xs: 2, md: 2.5 }, py: 1.25,
                            bgcolor: "background.paper",
                            borderRadius: "10px 10px 0 0",
                            boxShadow: (t) => `0 2px 8px ${alpha(t.palette.text.primary, 0.06)}`,
                            display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "space-between",
                        }}>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                                <IconButton onClick={() => navigate("/services")} size="small"><ArrowBackIcon /></IconButton>
                                <BuildRoundedIcon sx={{ fontSize: 22, color: "primary.main" }} />
                                <Typography sx={{ fontWeight: 900, fontSize: { xs: 16, md: 18 } }}>
                                    {isEdit ? "Edit Profile" : "Create Service"}
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Button onClick={() => navigate(serviceId ? `/services/${serviceId}` : "/services")} sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800, color: "text.secondary" }} disabled={isSubmitting}>Cancel</Button>
                                <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}
                                        startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 900, px: 3 }}>
                                    {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Publish"}
                                </Button>
                            </Stack>
                        </Box>

                        <Box sx={{ p: { xs: 2, md: 3 }, pt: { xs: 1, md: 3 }, bgcolor: "background.paper", borderRadius: { xs: 0, md: "0 0 10px 10px" } }}>
                            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                            {/* Provider banner */}
                            <Box sx={(t) => ({ display: "flex", alignItems: "center", gap: 1.25, p: 1.25, mb: 2, borderRadius: 2, bgcolor: alpha(t.palette.primary.main, 0.06), border: `1px solid ${alpha(t.palette.primary.main, 0.12)}` })}>
                                <Avatar src={providerAvatar || undefined} sx={{ width: 36, height: 36, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main" }}>
                                    {providerFallbackIcon}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }} noWrap>{providerName}</Typography>
                                    <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: 700 }} noWrap>
                                        {providerHandle ? `@${providerHandle}` : providerName}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* ════ COVER PHOTO & SERVICE AVATAR ════ */}
                            <FormSection title="Cover Photo & Service Avatar" defaultOpen>
                                {/* Cover photo */}
                                <Box>
                                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>Cover Photo</Typography>
                                    <Box onClick={() => { if (!isSubmitting && coverInputRef.current) coverInputRef.current.click(); }}
                                         sx={(t) => ({
                                             position: "relative", width: "100%", paddingTop: `${100 / COVER_ASPECT}%`, borderRadius: 2, overflow: "hidden",
                                             bgcolor: coverPreview ? "transparent" : alpha(t.palette.primary.main, 0.04),
                                             border: "2px dashed", borderColor: coverPreview ? "transparent" : alpha(t.palette.primary.main, 0.2),
                                             cursor: isSubmitting ? "default" : "pointer",
                                             "&:hover": isSubmitting ? {} : { borderColor: t.palette.primary.main },
                                         })}>
                                        {coverPreview ? (
                                            <Box sx={{ position: "absolute", inset: 0, backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                                        ) : (
                                            <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                                <ImageOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                                                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>Click to add cover photo</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                    <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                                           onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.type === "image/gif") { showPhotoError("GIFs aren\u2019t supported for cover photos. Please upload a JPG, PNG, or WebP image."); e.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => { setCoverCropSrc(reader.result); setCoverCropOpen(true); }; reader.readAsDataURL(file); e.target.value = ""; }} />
                                    {coverPreview && (
                                        <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-start" }}>
                                            <Button size="small" onClick={() => {
                                                // Re-open crop dialog with current cover
                                                setCoverCropSrc(coverPreview);
                                                setCoverCropOpen(true);
                                            }}
                                                    startIcon={<CropIcon sx={{ fontSize: "16px !important" }} />}
                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}>Adjust cover</Button>
                                            <Button size="small" color="error" onClick={() => { setCoverPreview(""); setCoverFile(null); }}
                                                    startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}>Remove cover</Button>
                                        </Stack>
                                    )}
                                </Box>

                                {/* Service avatar */}
                                <Box>
                                    <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>Profile Photo</Typography>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: "wrap", gap: { xs: 1.5, md: 2 } }}>
                                        <Avatar
                                            src={serviceAvatarPreview || undefined}
                                            sx={{ width: { xs: 80, md: 100 }, height: { xs: 80, md: 100 }, bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: "primary.main", border: "2px solid", borderColor: serviceAvatarPreview ? "divider" : "primary.light" }}
                                            imgProps={{ style: { objectFit: "cover" } }}
                                        >
                                            {(() => { const ci = categorySlug ? getServiceCategoryInfo(categorySlug) : null; const CI = ci?.Icon; return CI ? <CI sx={{ fontSize: 44 }} /> : providerFallbackIcon; })()}
                                        </Avatar>
                                        <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => serviceAvatarInputRef.current?.click()} sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}>
                                            Change Photo
                                        </Button>
                                        {serviceAvatarPreview && serviceAvatarPreview !== providerAvatar && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteOutlineRoundedIcon />}
                                                onClick={handleRemoveServiceAvatar}
                                                sx={{ textTransform: "none", fontWeight: 600, fontSize: 12 }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                        <input ref={serviceAvatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleServiceAvatarChange} />
                                    </Stack>
                                </Box>
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ BASICS ════ */}
                            <FormSection title="Basics" defaultOpen={!isEdit} forceOpen={(showValidation && basicsHasErrors) || Boolean(fieldProfanityErrors.title)}>
                                <Box ref={titleInputRef}>
                                    <TextField label="Business / Title *" placeholder="e.g. Richardson Landworks" value={title}
                                               onChange={(e) => { setTitle(clamp(e.target.value, TITLE_MAX)); if (fieldProfanityErrors.title) setFieldProfanityErrors((prev) => ({ ...prev, title: "" })); }} fullWidth
                                               error={(showValidation && !titleTrimmed) || Boolean(fieldProfanityErrors.title)}
                                               helperText={fieldProfanityErrors.title || (showValidation && !titleTrimmed ? "Title is required." : `${titleTrimmed.length}/${TITLE_MAX}`)}
                                               FormHelperTextProps={fieldProfanityErrors.title ? { sx: { fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 } } : undefined}
                                               inputProps={{ maxLength: TITLE_MAX }} sx={OPAQUE_TEXTFIELD_SX} />
                                </Box>

                                <TextField label="Subtitle" placeholder="e.g. Land Clearing & Site Work" value={summary}
                                           onChange={(e) => setSummary(clamp(e.target.value, SUMMARY_MAX))} fullWidth multiline minRows={1} maxRows={2}
                                           inputProps={{ maxLength: SUMMARY_MAX }} helperText={`${String(summary || "").length}/${SUMMARY_MAX}`}
                                           sx={OPAQUE_TEXTFIELD_SX} />

                                <FormControl fullWidth required error={showValidation && !categorySlug}>
                                    <InputLabel>Category</InputLabel>
                                    <Select label="Category" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}
                                            MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }} sx={{ backgroundColor: "background.paper" }}
                                            renderValue={(sel) => { if (!sel) return ""; const i = getServiceCategoryInfo(sel); const IC = i.Icon; return <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{IC && <IC fontSize="small" sx={{ color: "primary.main" }} />}<span>{i.name}</span></Box>; }}>
                                        {SERVICE_CATEGORIES.map((cat) => { const i = getServiceCategoryInfo(cat.slug); const IC = i.Icon; return (
                                            <MenuItem key={cat.slug} value={cat.slug}><ListItemIcon sx={{ minWidth: 28, color: "primary.main" }}>{IC && <IC fontSize="small" />}</ListItemIcon><ListItemText primary={i.name} /></MenuItem>
                                        ); })}
                                    </Select>
                                    {showValidation && !categorySlug && <Typography sx={{ color: "error.main", fontSize: 12, mt: 0.5, ml: 1.75 }}>Category is required.</Typography>}
                                </FormControl>

                                <Box sx={{ mt: 0.5 }} />

                                <FormControlLabel
                                    control={<Checkbox checked={licensedInsured} onChange={(e) => setLicensedInsured(e.target.checked)} color="success" />}
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={0.75}>
                                            <GppGoodRoundedIcon sx={{ fontSize: 18, color: licensedInsured ? "success.main" : "text.disabled" }} />
                                            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Licensed & Insured</Typography>
                                        </Stack>
                                    }
                                    sx={{ ml: 0 }}
                                />
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ ABOUT SECTION ════ */}
                            <FormSection title="About Section" defaultOpen forceOpen={(showValidation && aboutHasErrors) || Boolean(fieldProfanityErrors.description)}>
                                <Box ref={descriptionInputRef}>
                                    <TextField label="About Description *" placeholder="Describe your service in detail…" value={description}
                                               onChange={(e) => { setDescription(clamp(e.target.value, DESCRIPTION_MAX)); if (fieldProfanityErrors.description) setFieldProfanityErrors((prev) => ({ ...prev, description: "" })); }} fullWidth multiline minRows={5} maxRows={10}
                                               error={(showValidation && !descriptionTrimmed) || Boolean(fieldProfanityErrors.description)}
                                               helperText={fieldProfanityErrors.description || (showValidation && !descriptionTrimmed ? "Description is required." : `${descriptionTrimmed.length.toLocaleString()}/${DESCRIPTION_MAX.toLocaleString()}`)}
                                               FormHelperTextProps={fieldProfanityErrors.description ? { sx: { fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 } } : undefined}
                                               inputProps={{ maxLength: DESCRIPTION_MAX }} sx={{ ...OPAQUE_TEXTFIELD_SX, "& textarea": { overflowY: "auto" } }} />
                                </Box>
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ HIGHLIGHT SECTIONS ════ */}
                            <FormSection title="Highlight Sections" defaultOpen={!isEdit && highlightSections.length > 0}>
                                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                                    Add multiple highlight sections with icons, text, and images. Great for showcasing what makes your service special.
                                </Typography>

                                {highlightSections.map((sec, idx) => (
                                    <Paper
                                        key={idx}
                                        variant="outlined"
                                        sx={(t) => ({
                                            p: 2, borderRadius: 2.5, position: "relative",
                                            borderColor: alpha(t.palette.primary.main, 0.15),
                                            bgcolor: alpha(t.palette.primary.main, 0.015),
                                        })}
                                    >
                                        <IconButton size="small" onClick={() => handleRemoveHighlightSection(idx)}
                                                    sx={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, bgcolor: "error.main", color: "white", "&:hover": { bgcolor: "error.dark" } }}>
                                            <CloseIcon sx={{ fontSize: 14 }} />
                                        </IconButton>

                                        <Stack spacing={2} sx={{ pt: 0.5 }}>
                                            {/* Icon picker + title */}
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pr: 4 }}>
                                                <FormControl size="small" sx={{ minWidth: 100 }}>
                                                    <InputLabel>Icon</InputLabel>
                                                    <Select label="Icon" value={sec.icon || "Star"} onChange={(e) => handleUpdateHighlightSection(idx, "icon", e.target.value)}
                                                            sx={{ backgroundColor: "background.paper" }}
                                                            renderValue={(val) => (
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                                    <HlIconRender name={val} sx={{ fontSize: 18, color: "primary.main" }} />
                                                                </Box>
                                                            )}>
                                                        {HL_ICON_KEYS.map((key) => (
                                                            <MenuItem key={key} value={key}>
                                                                <ListItemIcon sx={{ minWidth: 28 }}><HlIconRender name={key} sx={{ fontSize: 20, color: "primary.main" }} /></ListItemIcon>
                                                                <ListItemText primary={HL_ICON_LABELS[key] || key} />
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                                <TextField label="Section Title" size="small" fullWidth value={sec.title || ""}
                                                           onChange={(e) => handleUpdateHighlightSection(idx, "title", clamp(e.target.value, HL_SEC_TITLE_MAX))}
                                                           placeholder="e.g. Why Choose Us?" inputProps={{ maxLength: HL_SEC_TITLE_MAX }} sx={OPAQUE_TEXTFIELD_SX} />
                                            </Stack>

                                            {/* Body */}
                                            <TextField label="Section Content" size="small" fullWidth multiline minRows={2} maxRows={6}
                                                       value={sec.body || ""}
                                                       onChange={(e) => handleUpdateHighlightSection(idx, "body", clamp(e.target.value, HL_SEC_BODY_MAX))}
                                                       placeholder="Describe this highlight…"
                                                       inputProps={{ maxLength: HL_SEC_BODY_MAX }}
                                                       helperText={`${String(sec.body || "").length}/${HL_SEC_BODY_MAX}`}
                                                       sx={{ ...OPAQUE_TEXTFIELD_SX, "& textarea": { overflowY: "auto" } }} />

                                            {/* Photo upload */}
                                            <Box>
                                                <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.5, color: "text.secondary" }}>Section Image</Typography>
                                                {(sec._photoPreview || sec.photoUrl) ? (
                                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                                        <Box component="img" src={sec._photoPreview || sec.photoUrl} alt="" sx={{ width: 100, height: 75, objectFit: "cover", borderRadius: 2 }} />
                                                        <Stack spacing={0.5}>
                                                            <Button size="small" onClick={() => { const ref = hlPhotoInputRefs.current[idx]; if (ref) ref.click(); }}
                                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 11 }}>Replace</Button>
                                                            <Button size="small" color="error" onClick={() => handleRemoveHighlightSectionPhoto(idx)}
                                                                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 11 }}>Remove</Button>
                                                        </Stack>
                                                    </Stack>
                                                ) : (
                                                    <Button size="small" variant="outlined" onClick={() => { const ref = hlPhotoInputRefs.current[idx]; if (ref) ref.click(); }}
                                                            startIcon={<ImageOutlinedIcon />} sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}>Add image</Button>
                                                )}
                                                <input
                                                    ref={(el) => { hlPhotoInputRefs.current[idx] = el; }}
                                                    type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                                                    onChange={(e) => handleHighlightSectionPhoto(idx, e)} />
                                            </Box>
                                        </Stack>
                                    </Paper>
                                ))}

                                {highlightSections.length < MAX_HIGHLIGHT_SECTIONS && (
                                    <Button size="small" variant="outlined" onClick={handleAddHighlightSection}
                                            startIcon={<AddCircleOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, fontSize: 13, borderRadius: 999 }}>
                                        Add Highlight Section
                                    </Button>
                                )}
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ SERVICES OFFERED ════ */}
                            <FormSection title="Services Offered">
                                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>Add specific services you provide. These appear as chips on your listing and are searchable.</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField size="small" placeholder={CATEGORY_SERVICE_EXAMPLES[categorySlug] || "e.g. Add a service you offer"} value={newServiceChip}
                                               onChange={(e) => setNewServiceChip(e.target.value)}
                                               onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddServiceChip(); } }}
                                               sx={{ flex: 1, ...OPAQUE_TEXTFIELD_SX }} inputProps={{ maxLength: 80 }} />
                                    <Button size="small" variant="outlined" onClick={handleAddServiceChip} disabled={!newServiceChip.trim()}
                                            sx={{ textTransform: "none", fontWeight: 700, minWidth: 60 }}>Add</Button>
                                </Stack>
                                {servicesOffered.length > 0 && (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                                        {servicesOffered.map((chip) => (
                                            <Chip key={chip} label={chip} size="small" onDelete={() => handleRemoveServiceChip(chip)} sx={{ fontWeight: 700, fontSize: 12 }} />
                                        ))}
                                    </Box>
                                )}
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ CONTACT INFO ════ */}
                            <FormSection title="Contact Info">
                                <TextField label="Phone Number" value={phoneNumber}
                                           onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 10); let formatted = digits; if (digits.length > 6) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`; else if (digits.length > 3) formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`; else if (digits.length > 0) formatted = `(${digits}`; setPhoneNumber(formatted); }} fullWidth placeholder="(205) 555-0123"
                                           helperText={`Visible on your listing · ${(phoneNumber || '').replace(/\D/g, '').length}/10 digits`}
                                           inputProps={{ maxLength: 14 }}
                                           sx={OPAQUE_TEXTFIELD_SX} />
                                <TextField label="Email Address" value={emailAddress}
                                           onChange={(e) => setEmailAddress(e.target.value.slice(0, 254))} fullWidth placeholder="you@example.com"
                                           helperText="Visible on your listing's Contact tab"
                                           inputProps={{ maxLength: 254 }}
                                           sx={OPAQUE_TEXTFIELD_SX} />
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ LOCATION ════ */}
                            <Box ref={locationSectionRef}>
                                <FormSection title="Location" forceOpen={showValidation && locationHasErrors}>
                                    <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                                        Select your location. If all counties and all cities are selected, your listing will default to Statewide.
                                    </Typography>
                                    {isStatewide && (
                                        <Alert severity="info" sx={{ borderRadius: 2, py: 0.25 }}>
                                            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Your location is set to Statewide.</Typography>
                                        </Alert>
                                    )}
                                    <CityCountySelect
                                        county={county}
                                        setCounty={(v) => { setCounty(v); setAddressValidated(false); setShowMap(false); }}
                                        city={city}
                                        setCity={(v) => { setCity(v); setAddressValidated(false); setShowMap(false); }}
                                        includeAllOptions
                                        countyRequired={hasAddress}
                                        cityRequired={hasAddress}
                                        countyError={showValidation && locationMissingForAddress && countyIsAll ? "County is required when address is entered." : (showValidation && !locationValid && !isStatewide ? "County is required." : "")}
                                        cityError={showValidation && locationMissingForAddress && cityIsAll ? "City is required when address is entered." : ""}
                                    />

                                    <TextField label="Street Address (optional)" value={streetAddress}
                                               onChange={(e) => { setStreetAddress(e.target.value.slice(0, 200)); setAddressValidated(false); setShowMap(false); setAddressError(""); }}
                                               fullWidth placeholder="123 Main Street" sx={OPAQUE_TEXTFIELD_SX}
                                               inputProps={{ maxLength: 200 }}
                                               error={Boolean(addressError)}
                                               helperText={addressError || (addressValidated ? "Address verified!" : "")}
                                               FormHelperTextProps={{ sx: { color: addressValidated && !addressError ? "success.main" : undefined, fontWeight: 700 } }}
                                    />

                                    {hasAddress && (
                                        <Button variant="outlined" size="small" onClick={handleVerifyAddress}
                                                disabled={addressValidating || addressValidated}
                                                startIcon={addressValidating ? <CircularProgress size={14} /> : <CheckCircleRoundedIcon />}
                                                color={addressValidated ? "success" : "primary"}
                                                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, fontSize: 12, borderRadius: 999 }}>
                                            {addressValidating ? "Verifying…" : addressValidated ? "Address Verified" : "Verify Address"}
                                        </Button>
                                    )}

                                    {showMap && validatedCoords && validatedCoords.length === 2 && (
                                        <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider", mt: 0.5 }}>
                                            <Box component="iframe"
                                                 src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${validatedCoords[0]},${validatedCoords[1]}&zoom=15`}
                                                 sx={{ width: "100%", height: 180, border: 0, display: "block" }}
                                                 allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Verified address location" />
                                            <Box sx={{ py: 0.75, px: 1.25, bgcolor: "grey.50", display: "flex", alignItems: "center", gap: 0.5 }}>
                                                <LocationOnRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>Verified Location</Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </FormSection>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ HOURS ════ */}
                            <FormSection title="Availability Hours">
                                <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                                    Optional. Set your business hours so customers know when you're available.
                                </Typography>
                                {!hours ? (
                                    <Button size="small" variant="outlined" onClick={() => setHours(buildEmptyHours())}
                                            startIcon={<AccessTimeRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                            sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, fontSize: 13, borderRadius: 999 }}>
                                        Set Availability Hours
                                    </Button>
                                ) : (
                                    <>
                                        <ServiceHoursEditor hours={hours} onChange={setHours} />
                                        <Button size="small" color="error" onClick={() => setHours(null)}
                                                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700, fontSize: 12, mt: 0.5 }}>
                                            Clear Hours
                                        </Button>
                                    </>
                                )}
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ LINKS ════ */}
                            <FormSection title="Social Links">
                                <TextField label="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} fullWidth placeholder="https://yourwebsite.com"
                                           InputProps={{ startAdornment: <InputAdornment position="start"><LanguageRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment> }} sx={OPAQUE_TEXTFIELD_SX} />
                                <TextField label="Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} fullWidth placeholder="yourpage"
                                           InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><FacebookRoundedIcon sx={{ fontSize: 18, color: "#1877F2", mr: 0.75 }} /><Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>facebook.com/</Typography></InputAdornment> }} sx={OPAQUE_TEXTFIELD_SX} />
                                <TextField label="Instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} fullWidth placeholder="yourhandle"
                                           InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><InstagramIcon sx={{ fontSize: 18, color: "#E1306C", mr: 0.75 }} /><Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>instagram.com/</Typography></InputAdornment> }} sx={OPAQUE_TEXTFIELD_SX} />
                                <TextField label="X (Twitter)" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} fullWidth placeholder="yourhandle"
                                           InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><XIcon sx={{ fontSize: 16, mr: 0.75 }} /><Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>x.com/</Typography></InputAdornment> }} sx={OPAQUE_TEXTFIELD_SX} />
                                <TextField label="YouTube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} fullWidth placeholder="yourchannel"
                                           InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mr: 0 }}><YouTubeIcon sx={{ fontSize: 18, color: "#FF0000", mr: 0.75 }} /><Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500, whiteSpace: "nowrap" }}>youtube.com/</Typography></InputAdornment> }} sx={OPAQUE_TEXTFIELD_SX} />
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ PHOTOS ════ */}
                            <FormSection title="Service Photos">
                                <PhotosUploadSection photos={photos} setPhotos={setPhotos} disabled={isSubmitting} maxPhotos={MAX_PHOTOS}
                                                     title="" helperText="Add up to 4 photos to showcase your work." addButtonText="Add photos" />
                            </FormSection>

                            <Divider sx={{ my: 2 }} />

                            {/* ════ CERTIFICATIONS ════ */}
                            <FormSection title="Certifications">
                                <Stack spacing={1.5}>
                                    {certifications.map((cert, idx) => (
                                        <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                            <Stack spacing={1}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                    <Typography sx={{ fontWeight: 800, fontSize: 12, color: "text.secondary" }}>Cert #{idx + 1}</Typography>
                                                    <IconButton size="small" onClick={() => setCertifications((prev) => prev.filter((_, i) => i !== idx))}><DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                                                </Stack>
                                                <TextField size="small" label="Name" value={cert.name || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...u[idx], name: e.target.value.slice(0, 150) }; setCertifications(u); }} fullWidth inputProps={{ maxLength: 150 }} sx={OPAQUE_TEXTFIELD_SX} />
                                                <Stack direction="row" spacing={1}>
                                                    <TextField size="small" label="Issuer" value={cert.issuer || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...u[idx], issuer: e.target.value.slice(0, 150) }; setCertifications(u); }} fullWidth inputProps={{ maxLength: 150 }} sx={OPAQUE_TEXTFIELD_SX} />
                                                    <TextField size="small" label="Year" value={cert.year || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...u[idx], year: e.target.value.replace(/\D/g, "").slice(0, 4) }; setCertifications(u); }} inputProps={{ maxLength: 4 }} sx={{ ...OPAQUE_TEXTFIELD_SX, minWidth: 90, maxWidth: 110 }} />
                                                </Stack>
                                            </Stack>
                                        </Paper>
                                    ))}
                                    {certifications.length < 10 && (
                                        <Button size="small" startIcon={<AddCircleOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                                onClick={() => setCertifications((prev) => [...prev, { name: "", issuer: "", year: "" }])}
                                                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700, fontSize: 13 }}>Add certification</Button>
                                    )}
                                </Stack>
                            </FormSection>

                            {/* ════ DANGER ZONE (edit mode only) ════ */}
                            {isEdit && (
                                <Box sx={{ mt: 4, pt: 3, borderTop: "2px solid", borderColor: "error.main" }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: 13, color: "error.main", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                                        Danger Zone
                                    </Typography>
                                    <Box sx={(t) => ({ p: 2.5, borderRadius: 2.5, border: "1px solid", borderColor: alpha(t.palette.error.main, 0.25), bgcolor: alpha(t.palette.error.main, 0.03) })}>
                                        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1.5}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: 14, color: "text.primary" }}>Delete this service</Typography>
                                                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
                                                    Permanently remove this service listing, all reviews, and uploaded photos. This cannot be undone.
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: "16px !important" }} />}
                                                onClick={() => setDeleteDialogOpen(true)}
                                                disabled={isSubmitting}
                                                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.5, whiteSpace: "nowrap", flexShrink: 0 }}
                                            >
                                                Delete Service
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Box>
                            )}

                            <Box sx={{ height: isMobile ? 100 : 100 }} />
                        </Box>
                    </Box>

                    {/* ══ RIGHT: LIVE PREVIEW — only shown at >=1440px (admin theme remaps md to 1440) ══ */}
                    <Box sx={{ flex: "0 0 auto", width: { xs: "100%", md: "45%" }, display: { xs: "none", md: "block" }, position: { md: "sticky" }, top: { md: 20 }, alignSelf: { md: "flex-start" }, maxHeight: { md: "calc(100vh - 60px)" }, overflowY: { md: "auto" } }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                            <VisibilityRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 12, color: "primary.main", textTransform: "uppercase", letterSpacing: "0.06em" }}>Live Preview</Typography>
                        </Box>
                        <Box sx={(t) => ({ border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.15), borderRadius: 2.5, overflow: "hidden", boxShadow: `0 8px 30px ${alpha(t.palette.common.black, 0.08)}` })}>
                            <LivePreview
                                title={titleTrimmed || ""} subtitle={String(summary || "").trim()} categorySlug={categorySlug}
                                coverPreview={coverPreview} providerAvatar={providerAvatar} providerName={providerName} providerHandle={providerHandle}
                                providerType={providerType}
                                locationLabel={locationLabel} licensedInsured={licensedInsured} description={descriptionTrimmed}
                                servicesOffered={servicesOffered} photos={photos}
                                websiteUrl={websiteUrl} facebookUrl={facebookUrl} instagramUrl={instagramUrl} twitterUrl={twitterUrl} youtubeUrl={youtubeUrl} tiktokUrl={tiktokUrl}
                                contactPreference={contactPreference} phoneNumber={phoneNumber} emailAddress={emailAddress} hours={hours} certifications={certifications}
                                highlightSections={highlightSections}
                                validatedCoords={validatedCoords} addressValidated={addressValidated}
                                serviceAvatarPreview={serviceAvatarPreview}
                                isStatewide={isStatewide} city={city} county={county} streetAddress={streetAddress}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* ── Mobile bottom action bar ── */}
                {isMobile && (
                    <Box
                        sx={{
                            position: "sticky",
                            bottom: 0,
                            left: 0, right: 0, zIndex: 1100,
                            bgcolor: "background.paper",
                            borderTop: "1px solid", borderColor: "divider",
                            px: 2, py: 1.5,
                            boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
                            flexShrink: 0,
                        }}
                    >
                        <Stack direction="row" spacing={1}>
                            <Button fullWidth onClick={() => navigate(serviceId ? `/services/${serviceId}` : "/services")}
                                    disabled={isSubmitting}
                                    sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, color: "text.secondary", py: 1.25, fontSize: 14, border: "1px solid", borderColor: "divider" }}>
                                Cancel
                            </Button>
                            <Button variant="contained" fullWidth onClick={handleSubmit} disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                                    sx={{ textTransform: "none", fontWeight: 900, borderRadius: 999, py: 1.25, fontSize: 14 }}>
                                {isSubmitting ? "Saving\u2026" : isEdit ? "Save Changes" : "Publish"}
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* ── DELETE SERVICE CONFIRMATION ── */}
                <Dialog open={deleteDialogOpen} onClose={() => !deleteLoading && setDeleteDialogOpen(false)} maxWidth="xs" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>Delete Service?</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                            This will permanently delete <strong>{title || "this service"}</strong>, including all reviews, photos, and uploaded files. This action cannot be undone.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}>Cancel</Button>
                        <Button variant="contained" color="error" onClick={handleDeleteService} disabled={deleteLoading} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999, px: 2.5 }}>{deleteLoading ? "Deleting\u2026" : "Delete Forever"}</Button>
                    </DialogActions>
                </Dialog>

                {/* ── COVER CROP DIALOG ── */}
                <Dialog open={coverCropOpen} onClose={() => { if (!coverCropProcessing) { setCoverCropOpen(false); setCoverCropSrc(null); setCoverCrop({ x: 0, y: 0 }); setCoverZoom(1); } }}
                        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CropIcon sx={{ color: "primary.main" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Crop Cover Photo</Typography>
                        </Box>
                        <IconButton onClick={() => { setCoverCropOpen(false); setCoverCropSrc(null); }} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        <Box sx={{ position: "relative", width: "100%", height: { xs: 260, sm: 360 }, bgcolor: "common.black" }}>
                            {coverCropSrc && (
                                <Cropper image={coverCropSrc} crop={coverCrop} zoom={coverZoom} aspect={COVER_ASPECT} showGrid
                                         onCropChange={setCoverCrop} onZoomChange={setCoverZoom}
                                         onCropComplete={(_area, areaPixels) => setCoverCroppedArea(areaPixels)} />
                            )}
                        </Box>
                        <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
                            <ZoomInIcon sx={{ color: "text.secondary" }} />
                            <Slider value={coverZoom} min={1} max={3} step={0.1} onChange={(_e, z) => setCoverZoom(z)} sx={{ color: "primary.main" }} />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => { setCoverCropOpen(false); setCoverCropSrc(null); }} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
                        <Button variant="contained" disabled={coverCropProcessing}
                                onClick={async () => {
                                    if (!coverCroppedArea || !coverCropSrc) return;
                                    setCoverCropProcessing(true);
                                    try {
                                        const blob = await createCroppedImage(coverCropSrc, coverCroppedArea, COVER_OUTPUT.width, COVER_OUTPUT.height);
                                        const file = new File([blob], `cover_${Date.now()}.jpg`, { type: "image/jpeg" });
                                        // NSFW moderation scan
                                        const modResult = await moderateImageFile(file);
                                        if (!modResult.safe) {
                                            showPhotoError(modResult.message || 'This image doesn\u2019t meet our community guidelines.');
                                            setCoverCropOpen(false); setCoverCropSrc(null); setCoverCrop({ x: 0, y: 0 }); setCoverZoom(1);
                                            return;
                                        }
                                        setCoverFile(file);
                                        setCoverPreview(URL.createObjectURL(blob));
                                        setCoverCropOpen(false); setCoverCropSrc(null); setCoverCrop({ x: 0, y: 0 }); setCoverZoom(1);
                                    } catch { /* ignore */ }
                                    finally { setCoverCropProcessing(false); }
                                }}
                                sx={{ textTransform: "none", fontWeight: 800, borderRadius: 999, px: 3 }}>
                            {coverCropProcessing ? "Processing…" : "Apply"}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ═══ Avatar Crop Dialog ═══ */}
                <Dialog open={avatarCropOpen} onClose={() => { if (!avatarCropProcessing) { setAvatarCropOpen(false); setAvatarCropSrc(null); setAvatarCrop({ x: 0, y: 0 }); setAvatarZoom(1); } }}
                        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CropIcon sx={{ color: "primary.dark" }} />
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Crop Profile Photo</Typography>
                        </Box>
                        <IconButton onClick={() => { setAvatarCropOpen(false); setAvatarCropSrc(null); setAvatarCrop({ x: 0, y: 0 }); setAvatarZoom(1); }} size="small"><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 0 }}>
                        <Box sx={{ position: "relative", width: "100%", height: { xs: 300, sm: 400 }, bgcolor: "grey.900" }}>
                            {avatarCropSrc && (
                                <Cropper image={avatarCropSrc} crop={avatarCrop} zoom={avatarZoom} aspect={1} cropShape="round" showGrid={false}
                                         onCropChange={setAvatarCrop} onZoomChange={setAvatarZoom}
                                         onCropComplete={(_, croppedAreaPx) => setAvatarCroppedArea(croppedAreaPx)} />
                            )}
                        </Box>
                        <Box sx={{ px: 3, py: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <ZoomInIcon sx={{ color: "text.secondary" }} />
                                <Slider value={avatarZoom} min={1} max={3} step={0.1} onChange={(_, z) => setAvatarZoom(z)} sx={{ color: "primary.dark" }} />
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => { setAvatarCropOpen(false); setAvatarCropSrc(null); setAvatarCrop({ x: 0, y: 0 }); setAvatarZoom(1); }} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
                        <Button variant="contained" disabled={avatarCropProcessing} onClick={handleAvatarCropComplete}
                                sx={{ textTransform: "none", fontWeight: 700, bgcolor: "primary.dark", "&:hover": { bgcolor: "primary.main" } }}>
                            {avatarCropProcessing ? "Processing…" : "Apply Crop"}
                        </Button>
                    </DialogActions>
                </Dialog>

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
            </Box>
        </ThemeProvider>
    );
}
