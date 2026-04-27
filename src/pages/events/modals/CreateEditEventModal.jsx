// src/pages/events/components/CreateEditEventModal.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";

// Category icons matching EventsFilters
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import TheaterComedyRoundedIcon from "@mui/icons-material/TheaterComedyRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ChildCareRoundedIcon from "@mui/icons-material/ChildCareRounded";
import SportsSoccerRoundedIcon from "@mui/icons-material/SportsSoccerRounded";
import ParkRoundedIcon from "@mui/icons-material/ParkRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import SpaRoundedIcon from "@mui/icons-material/SpaRounded";
import ChurchRoundedIcon from "@mui/icons-material/ChurchRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CloseIcon from "@mui/icons-material/Close";

import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    ClickAwayListener,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    List,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Paper,
    Popper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { themedInputSx, themedMultilineInputSx } from "../../../components/themedInputSx";
import axios from "../../../api/axiosInstance";
import { secureFetch } from "../../../utils/secureFetch";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import CityCountySelect from "../../../components/CityCountySelect";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { createEvent, fetchEventById, fetchEventCategories, processEventMentions, updateEvent } from "../api/eventsApi";
import { checkGeocodeRateLimit, recordGeocodeResult } from "../../../utils/geocodeRateLimit";
import RichTextEditor from "../../../components/RichTextEditor";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkFieldsProfanity } from '../../../utils/profanityCheck';

// Local GeoJSON data for resolving city/county → lat/lng (same data the community forms use)
import cityData from "../../../data/alabamaCities.json";
import countyData from "../../../data/alabamaCounties.json";

/* ── Coordinate helpers (inlined from useBasePostForm / CreateArtistModal) ── */
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
                const [pLng, pLat] = pt;
                if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;
                if (pLat < minLat) minLat = pLat;
                if (pLat > maxLat) maxLat = pLat;
                if (pLng < minLng) minLng = pLng;
                if (pLng > maxLng) maxLng = pLng;
            }
        }
        if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
            return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        }
        return null;
    };

    if (type === "Polygon" && Array.isArray(coordinates)) return calcCentroid(coordinates);
    if (type === "MultiPolygon" && Array.isArray(coordinates)) {
        const flat = coordinates.flatMap((poly) => (Array.isArray(poly) ? poly : []));
        return calcCentroid(flat);
    }
    return null;
}

function resolveLocationCoords(city, county) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);

    if (city) {
        const cityNorm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) => {
            const name = String(f?.properties?.NAME || f?.properties?.name || f?.name || "").trim().toLowerCase();
            return name === cityNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    if (county) {
        const countyNorm = stripCountySuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) => {
            const name = stripCountySuffix(f?.properties?.NAME || f?.properties?.name || f?.name || "").toLowerCase();
            return name === countyNorm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    return null;
}

const TITLE_MAX = 75;
const DESCRIPTION_MAX = 5000;
const ADDRESS_MAX = 255;
const MAX_PHOTOS = 8;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');
const ALLOWED_IMAGE_LABEL = 'JPEG, PNG, WebP, or HEIC';

function isAllowedImageType(file) {
    const type = String(file?.type || '').toLowerCase();
    if (ALLOWED_IMAGE_TYPES.includes(type)) return true;
    // Fallback: check extension for HEIC files (some browsers don't set MIME)
    const name = String(file?.name || '').toLowerCase();
    if (/\.(heic|heif)$/i.test(name)) return true;
    return false;
}

const ALL_COUNTIES = "All Counties";
const ALL_CITIES = "All Cities";

// Updated category icon map matching EventsFilters exactly
const EVENT_CATEGORY_ICON_COMPONENTS = {
    "music-nightlife": MusicNoteRoundedIcon,
    "arts-culture": TheaterComedyRoundedIcon,
    "food-drink": RestaurantRoundedIcon,
    "community-social": PeopleAltRoundedIcon,
    "family-kids": ChildCareRoundedIcon,
    "sports-recreation": SportsSoccerRoundedIcon,
    "outdoors-nature": ParkRoundedIcon,
    "education-workshops": SchoolRoundedIcon,
    "business-networking": BusinessCenterRoundedIcon,
    "health-wellness": SpaRoundedIcon,
    "faith-spiritual": ChurchRoundedIcon,
    "volunteer-fundraising": VolunteerActivismRoundedIcon,
    "government-civic": AccountBalanceRoundedIcon,
    "markets-shopping": StorefrontRoundedIcon,
    "holidays-seasonal": CelebrationRoundedIcon,
    other: CategoryRoundedIcon,
};

/* ── Stable sx objects (defined OUTSIDE the component to prevent re-renders) ── */
const INPUT_SX = {
    "& .MuiOutlinedInput-root": (t) => {
        const isDark = t.palette.mode === "dark";
        const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
        return {
            borderRadius: 2.5,
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
};

const SELECT_WRAPPER_SX = {
    "& .MuiOutlinedInput-root": (t) => {
        const isDark = t.palette.mode === "dark";
        const frost = t.custom?.brand?.frost || (isDark ? "#232D3D" : "#E7EBF1");
        return {
            bgcolor: isDark ? alpha(frost, 0.6) : alpha(t.palette.common.white, 0.92),
        };
    },
};

/* ── Stable name/id values for address field (prevents re-render from Date.now/Math.random) ── */
const ADDRESS_FIELD_NAME = "event-addr-field";
const ADDRESS_FIELD_ID = "event-addr-input";

/* ── Stepper labels for create mode ── */
const EVENT_STEP_LABELS = ["Details", "Description", "Category", "Photos"];

const STEPPER_LABEL_SX = {
    "& .MuiStepLabel-label": { fontSize: 12, fontWeight: 700 },
};

const DIALOG_PAPER_CREATE_SX = {
    borderRadius: 3,
    height: "85vh",
    maxHeight: 780,
    display: "flex",
    flexDirection: "column",
};

function pad2(n) {
    const s = String(n ?? "");
    return s.length === 1 ? `0${s}` : s;
}

function toDateParts(dateLike, timeZone = "America/Chicago") {
    if (!dateLike) return { date: "", time: "" };

    const raw = String(dateLike);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return { date: raw, time: "" };
    }

    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return { date: "", time: "" };

    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const parts = fmt.formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    const date = `${get("year")}-${get("month")}-${get("day")}`;
    const time = `${get("hour")}:${get("minute")}`;
    return { date, time };
}

function combineDateTime(dateStr, timeStr) {
    if (!dateStr) return null;
    if (!timeStr) return String(dateStr);
    return `${dateStr} ${timeStr}:00`;
}

function isBeforeToday(dateStr) {
    if (!dateStr) return false;
    const parts = String(dateStr).split("-").map((p) => Number(p));
    if (parts.length !== 3) return false;
    const [y, m, d] = parts;
    if (!y || !m || !d) return false;

    const selected = new Date(y, m - 1, d);
    if (Number.isNaN(selected.getTime())) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return selected.getTime() < today.getTime();
}

function todayDateInputValue() {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function compareDateStrings(a, b) {
    if (!a || !b) return 0;
    const aa = String(a);
    const bb = String(b);
    if (aa === bb) return 0;
    return aa < bb ? -1 : 1;
}

function compareTimeStrings(a, b) {
    if (!a || !b) return 0;
    const aa = String(a);
    const bb = String(b);
    if (aa === bb) return 0;
    return aa < bb ? -1 : 1;
}

async function fetchProfile() {
    try {
        const res = await secureFetch("/users/profile", { credentials: "include" });
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        const u = data?.user || data || null;
        if (u && (u.id || u.user_id || u.public_id || u.handle)) return u;
        return null;
    } catch {
        return null;
    }
}

/**
 * Upload a single File to GCS via the signed-url flow.
 *
 * Returns just the canonical `objectPath` — the caller is responsible for
 * creating an `URL.createObjectURL(file)` preview and registering it in
 * the component's blob-tracking ref for cleanup on unmount.
 *
 * We deliberately do NOT try to derive a public read URL here. That used
 * to be `signedUrl.split("?")[0]` and worked when the bucket was public;
 * with a private bucket those URLs 403, which broke image previews in
 * the create-event modal.
 */
async function uploadOneImageToBucket(file) {
    const safeName = String(file?.name || "photo")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "") || `photo-${Date.now()}.jpg`;
    const contentType = String(file?.type || "image/jpeg");

    // 1) Ask the server for a signed upload URL.
    let signRes;
    try {
        signRes = await axios.post(
            "/api/uploads/signed-url",
            {
                fileName: safeName,
                contentType,
                folder: "events",
            },
            { withCredentials: true }
        );
    } catch (err) {
        const status = err?.response?.status;
        const backendMsg = err?.response?.data?.message;
        const msg =
            backendMsg ||
            (status ? `Upload signing request failed (${status}).` : "") ||
            err?.message ||
            "Upload signing request failed.";
        const e = new Error(msg);
        e.original = err;
        throw e;
    }

    const data = signRes?.data || {};
    const uploadUrl =
        data.uploadUrl ||
        data.upload_url ||
        data.signedUrl ||
        data.signed_url ||
        data.putUrl ||
        data.put_url ||
        "";
    const objectPath =
        data.objectPath ||
        data.object_path ||
        data.path ||
        data.key ||
        "";

    if (!uploadUrl) {
        const keys = Object.keys(data || {}).join(", ");
        throw new Error(`Upload signing failed (missing upload URL). Keys: ${keys || "(none)"}`);
    }
    if (!objectPath) {
        throw new Error("Upload signing failed (missing objectPath).");
    }

    // 2) PUT the file straight to GCS.
    let putRes;
    try {
        putRes = await fetch(uploadUrl, {
            method: "PUT",
            mode: "cors",
            credentials: "omit",
            headers: { "Content-Type": contentType },
            body: file,
        });
    } catch (err) {
        const e = new Error(err?.message || "Photo upload failed (network).");
        e.original = err;
        throw e;
    }

    if (!putRes.ok) {
        const text = await putRes.text().catch(() => "");
        const msg = text ? `Photo upload failed (${putRes.status}): ${text}` : `Photo upload failed (${putRes.status}).`;
        throw new Error(msg);
    }

    return { objectPath };
}

/* ─────────────── @Mention helpers ─────────────── */
const MENTION_RE_MATCH = /(?:^|\s)@([a-zA-Z0-9_]{1,30})$/;

function getMentionMatch(text, cursorIndex) {
    if (!text || cursorIndex <= 0) return null;
    const before = text.slice(0, cursorIndex);
    const m = before.match(MENTION_RE_MATCH);
    if (!m) return null;
    const query = m[1];
    const start = before.lastIndexOf("@" + query);
    return { query, start, end: cursorIndex };
}

function getMentionAnchorVirtualEl(textareaEl, caretIndex) {
    if (!textareaEl) return null;
    const mirror = document.createElement("div");
    const cs = window.getComputedStyle(textareaEl);
    ["font","fontSize","fontFamily","fontWeight","fontStyle","letterSpacing","wordSpacing","lineHeight","textTransform","padding","paddingTop","paddingLeft","paddingRight","paddingBottom","border","borderWidth","boxSizing","width","whiteSpace","overflowWrap","wordWrap"].forEach((p) => { mirror.style[p] = cs[p]; });
    mirror.style.position = "absolute"; mirror.style.left = "-9999px"; mirror.style.top = "-9999px"; mirror.style.visibility = "hidden"; mirror.style.whiteSpace = "pre-wrap"; mirror.style.overflowWrap = "break-word";
    const textBefore = textareaEl.value.slice(0, caretIndex);
    mirror.textContent = textBefore;
    const span = document.createElement("span"); span.textContent = "|"; mirror.appendChild(span);
    document.body.appendChild(mirror);
    const spanRect = span.getBoundingClientRect(); const taRect = textareaEl.getBoundingClientRect();
    const offsetX = spanRect.left - mirror.getBoundingClientRect().left;
    const offsetY = spanRect.top - mirror.getBoundingClientRect().top;
    document.body.removeChild(mirror);
    const x = taRect.left + offsetX;
    const y = taRect.top + offsetY - textareaEl.scrollTop + 20;
    return { getBoundingClientRect: () => ({ top: y, bottom: y, left: x, right: x, width: 0, height: 0 }) };
}

function MentionAccountBadge({ item }) {
    if (!item) return null;
    const isVerified = item.is_verified === true || item.is_verified === 1;
    const type = String(item.account_type || "").toLowerCase();
    return (
        <>
            {isVerified && <VerifiedRoundedIcon sx={{ fontSize: 13, color: "primary.main", ml: 0.25 }} />}
            {type === "business" && <StorefrontRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
            {type === "artist" && <MusicNoteRoundedIcon sx={{ fontSize: 13, color: "text.secondary", ml: 0.25 }} />}
        </>
    );
}

/* ── Section heading helper (used throughout the form) ── */
function SectionHeading({ icon, title, subtitle }) {
    const theme = useTheme();
    return (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 2 }}>
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                    color: "primary.main",
                    flexShrink: 0,
                    mt: 0.25,
                }}
            >
                {icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    sx={{
                        fontWeight: 800,
                        fontSize: { xs: 15, sm: 16 },
                        lineHeight: 1.2,
                        color: "text.primary",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.25, lineHeight: 1.35 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

export default function CreateEditEventModal({ open, onClose, user, eventToEdit = null, onSaved, defaultCategorySlug = null }) {
    const theme = useTheme();
    // Full-screen on actual mobile phones (< sm / 600px), matching EditCommunityPostDialog.
    // Tablets and larger keep the centered dialog look.
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const auth = useAuth();
    const { activeAccount, activeAccountType, activeAccountId, activeBusinessId, activeArtistId } = useActiveAccount();

    // Resolve poster identity from active account (mirrors CreateJobModal pattern)
    const isBusinessAccount = activeAccountType === 'business';
    const isArtist = activeAccount?.type === 'artist';
    const isSpecialAccount = isBusinessAccount || isArtist;

    const [resolvedUser, setResolvedUser] = useState(user || auth?.user || null);

    const [authChecked, setAuthChecked] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    // ── Stable ref for user prop to avoid stale closure in effects ──
    const userRef = useRef(user);
    userRef.current = user;

    const authUserRef = useRef(auth?.user);
    authUserRef.current = auth?.user;

    useEffect(() => {
        if (user) setResolvedUser(user);
    }, [user]);

    useEffect(() => {
        if (auth?.user) setResolvedUser((prev) => prev || auth.user);
    }, [auth?.user]);

    useEffect(() => {
        if (!open) return;

        let mounted = true;

        const run = async () => {
            setAuthLoading(true);
            try {
                if (userRef.current && (userRef.current.id || userRef.current.user_id)) {
                    if (mounted) setResolvedUser(userRef.current);
                    return;
                }
                if (authUserRef.current && (authUserRef.current.id || authUserRef.current.user_id)) {
                    if (mounted) setResolvedUser(authUserRef.current);
                    return;
                }

                const me = await fetchProfile();
                if (!mounted) return;
                if (me) setResolvedUser(me);
            } finally {
                if (mounted) {
                    setAuthChecked(true);
                    setAuthLoading(false);
                }
            }
        };

        run();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const isAuthenticated = Boolean(resolvedUser && (resolvedUser.id || resolvedUser.user_id || resolvedUser.public_id || resolvedUser.handle));

    const isEdit = Boolean(eventToEdit && (eventToEdit.id || eventToEdit.event_id));
    const eventId = eventToEdit?.id || eventToEdit?.event_id || null;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");

    const photosFileInputRef = useRef(null);
    const scrollBoxRef = useRef(null);
    const contentRef = useRef(null);

    // Stepper state (create mode only)
    const [step, setStep] = useState(0);

    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");
    const [county, setCounty] = useState(ALL_COUNTIES);
    const [city, setCity] = useState(ALL_CITIES);

    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");

    const [photos, setPhotos] = useState([]); // ordered list: { url, objectPath, id }

    // Keep a ref to the latest photos array so the unmount cleanup effect can
    // read it without needing `photos` as a dep (which would re-register the
    // cleanup on every render). Fresh picks from PhotosUploadSection arrive
    // as { id, file, url: "blob:..." } — those blob URLs must be revoked when
    // the modal closes, or they stay pinned in memory until page navigation.
    const photosRef = useRef([]);
    useEffect(() => { photosRef.current = photos; }, [photos]);

    const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Edit-limit state
    const [limitReached, setLimitReached] = useState(false);
    const [limitMessage, setLimitMessage] = useState("");

    const [fieldErrors, setFieldErrors] = useState({});

    const [categoryStage, setCategoryStage] = useState("main"); // 'main' | 'sub'

    // Geocoding / map pin state
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeError, setGeocodeError] = useState("");
    const [mapPinConfirmed, setMapPinConfirmed] = useState(false);
    const [addressError, setAddressError] = useState("");
    const addressRef = useRef(null);

    // ── Description @mention state ──
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionResults, setMentionResults] = useState([]);
    const [mentionLoading, setMentionLoading] = useState(false);
    const [mentionActiveIdx, setMentionActiveIdx] = useState(0);
    const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
    const descriptionInputRef = useRef(null);
    const mentionCaretRef = useRef(0);
    const mentionStartRef = useRef(0);
    const mentionEndRef = useRef(0);
    const mentionAbortRef = useRef(null);

    const closeMention = () => { setMentionOpen(false); setMentionResults([]); setMentionQuery(""); setMentionActiveIdx(0); };

    const insertMention = (mentionUser) => {
        const handle = mentionUser.handle || mentionUser.username || "";
        const before = description.slice(0, mentionStartRef.current);
        const after = description.slice(mentionEndRef.current);
        const next = before + "@" + handle + " " + after;
        setDescription(next.length <= DESCRIPTION_MAX ? next : next.slice(0, DESCRIPTION_MAX));
        closeMention();
        setTimeout(() => { const el = descriptionInputRef.current; if (el) { const pos = before.length + handle.length + 2; el.selectionStart = pos; el.selectionEnd = pos; el.focus(); } }, 0);
    };

    useEffect(() => {
        if (!mentionOpen || !mentionQuery) { setMentionResults([]); return; }
        const ctrl = new AbortController();
        mentionAbortRef.current?.abort();
        mentionAbortRef.current = ctrl;
        const tid = setTimeout(async () => {
            try {
                setMentionLoading(true);
                const res = await axios.get("/api/community/users/search", { params: { q: mentionQuery, limit: 8 }, signal: ctrl.signal });
                if (!ctrl.signal.aborted) { setMentionResults(Array.isArray(res.data) ? res.data : []); setMentionActiveIdx(0); }
            } catch { if (!ctrl.signal.aborted) setMentionResults([]); }
            finally { if (!ctrl.signal.aborted) setMentionLoading(false); }
        }, 200);
        return () => { clearTimeout(tid); ctrl.abort(); };
    }, [mentionOpen, mentionQuery]);

    // Revoke every blob: URL we handed to an <img> preview when the modal
    // unmounts. Fresh picks from PhotosUploadSection arrive with url="blob:..."
    // and are swapped for real objectPaths only after a successful submit;
    // without this revoke, any blob URL still in state at close time would
    // stay pinned in memory until page navigation.
    useEffect(() => {
        return () => {
            const list = photosRef.current || [];
            list.forEach((p) => {
                const u = String(p?.url || "");
                if (u.startsWith("blob:")) {
                    try { URL.revokeObjectURL(u); } catch { /* ignore */ }
                }
            });
        };
    }, []);

    const handleDescriptionChange = (e) => {
        const next = e.target.value || "";
        const capped = next.length <= DESCRIPTION_MAX ? next : next.slice(0, DESCRIPTION_MAX);
        setDescription(capped);
        clearFieldError("description");
        const cursor = e.target.selectionStart || 0;
        mentionCaretRef.current = cursor;
        const match = getMentionMatch(capped, cursor);
        if (match) {
            mentionStartRef.current = match.start;
            mentionEndRef.current = match.end;
            setMentionQuery(match.query);
            setMentionAnchorEl(getMentionAnchorVirtualEl(e.target, cursor));
            if (!mentionOpen) setMentionOpen(true);
        } else { closeMention(); }
    };

    const handleDescriptionKeyDown = (e) => {
        if (mentionOpen && mentionResults.length > 0) {
            if (e.key === "ArrowDown") { e.preventDefault(); setMentionActiveIdx((i) => (i + 1) % mentionResults.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setMentionActiveIdx((i) => (i - 1 + mentionResults.length) % mentionResults.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionResults[mentionActiveIdx]); return; }
            if (e.key === "Escape") { e.preventDefault(); closeMention(); return; }
        }
    };

    const subcategoryOptions = useMemo(() => {
        const cat = (Array.isArray(categories) ? categories : []).find((c) => String(c?.id) === String(categoryId));
        return Array.isArray(cat?.subcategories) ? cat.subcategories : [];
    }, [categories, categoryId]);

    const resetAll = () => {
        setTitle("");
        setDescription("");
        setAddress("");
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
        setCounty(ALL_COUNTIES);
        setCity(ALL_CITIES);
        setCategoryId("");
        setSubcategoryId("");
        setPhotos([]);
        setIsUploadingPhotos(false);
        setIsSubmitting(false);
        setError("");
        setSuccess("");
        setLimitReached(false);
        setLimitMessage("");
        setFieldErrors({});
        setCategoryStage("main");
        setLatitude(null);
        setLongitude(null);
        setGeocoding(false);
        setGeocodeError("");
        setMapPinConfirmed(false);
        setAddressError("");
        closeMention();
        setStep(0);
    };

    useEffect(() => {
        if (!open) return;

        let mounted = true;

        const init = async () => {
            resetAll();

            // 1) Load categories first
            let loadedCategories = [];
            try {
                const data = await fetchEventCategories();
                if (!mounted) return;
                loadedCategories = Array.isArray(data?.categories) ? data.categories : [];
                setCategories(loadedCategories);
            } catch {
                if (!mounted) return;
                setCategories([]);
            }

            // Auto-select category when a default slug is provided
            if (!eventToEdit && defaultCategorySlug && loadedCategories.length > 0) {
                const match = loadedCategories.find(
                    (c) => String(c?.slug || "").toLowerCase() === String(defaultCategorySlug).toLowerCase()
                );
                if (match) {
                    setCategoryId(String(match.id));
                }
            }

            if (eventToEdit) {
                let evt = eventToEdit;
                try {
                    const fetched = await fetchEventById(eventId);
                    if (!mounted) return;
                    if (fetched && (fetched.id || fetched.event_id)) {
                        evt = fetched;
                    }
                } catch {
                    if (!mounted) return;
                }

                setTitle(String(evt?.title || ""));
                setDescription(String(evt?.description || ""));
                setAddress(String(evt?.address || evt?.street_address || evt?.venueAddress || evt?.venue_address || ""));

                const startParts = toDateParts(evt?.start_at || evt?.startAt || evt?.start);
                const endParts = toDateParts(evt?.end_at || evt?.endAt || evt?.end);

                setStartDate(startParts.date);

                const startHasTime = Boolean(
                    evt?.startHasTime ??
                    evt?.start_has_time ??
                    (startParts.time && startParts.time !== "00:00")
                );
                setStartTime(startHasTime ? startParts.time : "");

                setEndDate(endParts.date);
                const endHasTime = Boolean(
                    evt?.endHasTime ??
                    evt?.end_has_time ??
                    (endParts.time && endParts.time !== "00:00")
                );
                setEndTime(endHasTime ? endParts.time : "");

                const scope = String(evt?.location_scope || evt?.locationScope || evt?.scope || "");
                const isStatewide = scope === "statewide" || Boolean(evt?.is_statewide);

                if (isStatewide) {
                    setCounty(ALL_COUNTIES);
                    setCity(ALL_CITIES);
                } else {
                    setCounty(String(evt?.county || ALL_COUNTIES));
                    setCity(String(evt?.city || ALL_CITIES));
                }

                // 3) Resolve category / subcategory
                let catId = evt?.category_id || evt?.categoryId || "";
                let subId = evt?.subcategory_id || evt?.subcategoryId || "";

                if (!catId) {
                    const catSlug = String(evt?.category || evt?.categorySlug || evt?.category_slug || "").trim().toLowerCase();
                    if (catSlug && loadedCategories.length) {
                        const match = loadedCategories.find(
                            (c) => String(c?.slug || "").toLowerCase() === catSlug
                        );
                        if (match) catId = match.id;
                    }
                }

                if (!subId && catId) {
                    const subSlug = String(evt?.subcategory || evt?.subcategorySlug || evt?.subcategory_slug || "").trim().toLowerCase();
                    if (subSlug && loadedCategories.length) {
                        const parentCat = loadedCategories.find((c) => String(c?.id) === String(catId));
                        const subs = Array.isArray(parentCat?.subcategories) ? parentCat.subcategories : [];
                        const subMatch = subs.find(
                            (s) => String(s?.slug || "").toLowerCase() === subSlug
                        );
                        if (subMatch) subId = subMatch.id;
                    }
                }

                setCategoryId(catId ? String(catId) : "");
                setSubcategoryId(subId ? String(subId) : "");
                setCategoryStage(subId ? "sub" : "main");

                // 4) Load photos
                const existingPhotos = Array.isArray(evt?.photos) ? evt.photos : [];
                setPhotos(
                    existingPhotos
                        .filter((p) => p && (p.url || p.photo_url))
                        .slice(0, MAX_PHOTOS)
                        .map((p, idx) => ({
                            id: String(p?.id || `existing-${idx}`),
                            url: String(p?.url || p?.photo_url || ""),
                            objectPath: String(p?.object_path || p?.objectPath || ""),
                        }))
                );

                // 5) Load coordinates if they exist
                if (evt?.latitude != null && evt?.longitude != null) {
                    setLatitude(Number(evt.latitude));
                    setLongitude(Number(evt.longitude));
                    setMapPinConfirmed(true);
                }

                // 6) Check edit limit
                try {
                    const limitRes = await secureFetch(`/api/events/${encodeURIComponent(String(eventId))}/edit-limit`, { credentials: "include" });
                    if (limitRes.ok && mounted) {
                        const limitData = await limitRes.json();
                        if (limitData?.ok === false) {
                            setLimitReached(true);
                            setLimitMessage(limitData.message || "Edit limit reached. Try again later.");
                        } else {
                            setLimitReached(false);
                            setLimitMessage("");
                        }
                    }
                } catch {
                    // best effort
                }
            }
        };

        init();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, eventId]);

    // ── Geocoding / map pin ──
    const handleGetMapPin = async () => {
        const hasCity = city && city !== ALL_CITIES;
        const hasCounty = county && county !== ALL_COUNTIES;
        const hasAddress = address?.trim();

        if (!hasCity && !hasCounty) {
            setGeocodeError("Select a county or city first.");
            return;
        }

        // Persistent rate limit check (survives page refresh / modal close)
        const rateCheck = checkGeocodeRateLimit();
        if (!rateCheck.allowed) {
            setGeocodeError(rateCheck.message);
            return;
        }

        setGeocoding(true);
        setGeocodeError("");
        setAddressError("");
        setLatitude(null);
        setLongitude(null);
        setMapPinConfirmed(false);

        if (hasAddress) {
            try {
                const parts = [address.trim()];
                if (hasCity) parts.push(city);
                if (hasCounty) parts.push(`${county} County`);
                parts.push("Alabama");
                const fullAddress = parts.join(", ");

                const res = await secureFetch("/api/geocode", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: fullAddress }),
                });

                const data = await res.json().catch(() => null);

                if (res.ok && data?.lat && data?.lng) {
                    const isStateFallback =
                        Math.abs(data.lat - 32.318) < 0.1 &&
                        Math.abs(data.lng - (-86.902)) < 0.1;

                    if (isStateFallback) {
                        recordGeocodeResult(false);
                        setAddressError("This address could not be found. Please check it or remove it to use city/county location.");
                        setGeocoding(false);
                        addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                    }

                    const locType = String(data.location_type || "").toUpperCase();
                    if (locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER") {
                        recordGeocodeResult(false);
                        setAddressError("This address could not be verified. Please enter a valid street address or remove the address to use city/county.");
                        setGeocoding(false);
                        addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        return;
                    }

                    recordGeocodeResult(true);
                    setLatitude(data.lat);
                    setLongitude(data.lng);
                } else {
                    recordGeocodeResult(false);
                    setAddressError("This address could not be found. Please check it or remove it to use city/county location.");
                }
            } catch (_err) {
                recordGeocodeResult(false);
                setGeocodeError("Failed to get location. Please try again.");
            }

            setGeocoding(false);
            return;
        }

        const coords = resolveLocationCoords(hasCity ? city : "", hasCounty ? county : "");

        if (coords && Array.isArray(coords) && coords.length >= 2) {
            setLatitude(coords[0]);
            setLongitude(coords[1]);
        } else {
            setGeocodeError("No location found for this city/county. Try adding a street address for a more accurate pin.");
        }

        setGeocoding(false);
    };

    const handleConfirmMapPin = () => { setMapPinConfirmed(true); };
    const handleRemoveMapPin = () => { setLatitude(null); setLongitude(null); setMapPinConfirmed(false); };

    const clearFieldError = (key) => {
        setFieldErrors((prev) => {
            if (!prev || !prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validateAll = () => {
        const nextErrors = {};
        let general = "";

        if (authChecked && !isAuthenticated) {
            general = "Please sign in to create an event.";
        }

        // Details validation
        if (!String(title || "").trim()) nextErrors.title = "Title is required.";
        else if (String(title || "").trim().length > TITLE_MAX) nextErrors.title = `Title must be ${TITLE_MAX} characters or less.`;

        if (stripHtml(description || "").length > DESCRIPTION_MAX) nextErrors.description = `Description must be ${DESCRIPTION_MAX} characters or less.`;

        if (!startDate) nextErrors.startDate = "Start date is required.";
        else if (isBeforeToday(startDate)) nextErrors.startDate = "Start date must be today or a future date.";

        if (endDate && compareDateStrings(endDate, startDate) === -1) {
            nextErrors.endDate = "End date cannot be before the start date.";
        }

        if (endTime && !endDate) {
            nextErrors.endDate = "Please choose an end date if you set an end time.";
        }

        const sameDay = Boolean(startDate && endDate && String(startDate) === String(endDate));
        if (sameDay && startTime && endTime && compareTimeStrings(endTime, startTime) === -1) {
            nextErrors.endTime = "End time cannot be before the start time.";
        }

        // Category validation
        if (!categoryId) nextErrors.categoryId = "Please select a category.";

        // Photos validation
        if (photos.length > MAX_PHOTOS) nextErrors.photos = `Max ${MAX_PHOTOS} photos.`;

        setFieldErrors(nextErrors);
        setError(general);
        return { ok: !general && Object.keys(nextErrors).length === 0, general };
    };

    const scrollToFirstError = () => {
        setTimeout(() => {
            const container = isEdit ? scrollBoxRef.current : contentRef.current;
            if (!container) return;
            const errEl =
                container.querySelector("[aria-invalid='true']") ||
                container.querySelector(".Mui-error") ||
                container.querySelector(".MuiFormHelperText-root.Mui-error") ||
                container.querySelector(".MuiAlert-standardError");
            if (errEl) {
                errEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 80);
    };

    /* ── Step validation for create mode ── */
    const validateStep = (stepIdx) => {
        const errs = {};

        if (stepIdx === 0) {
            // Details: title, start date, location
            if (!String(title || "").trim()) errs.title = "Title is required.";
            else if (String(title || "").trim().length > TITLE_MAX) errs.title = `Title must be ${TITLE_MAX} characters or less.`;
            else {
                const titleCheck = checkFieldsProfanity({ title });
                if (!titleCheck.clean) errs.title = "Title contains inappropriate language. Please revise.";
            }

            if (!startDate) errs.startDate = "Start date is required.";
            else if (isBeforeToday(startDate)) errs.startDate = "Start date must be today or a future date.";

            if (endDate && compareDateStrings(endDate, startDate) === -1) {
                errs.endDate = "End date cannot be before the start date.";
            }
            if (endTime && !endDate) {
                errs.endDate = "Please choose an end date if you set an end time.";
            }
            const sameDay = Boolean(startDate && endDate && String(startDate) === String(endDate));
            if (sameDay && startTime && endTime && compareTimeStrings(endTime, startTime) === -1) {
                errs.endTime = "End time cannot be before the start time.";
            }
        }

        if (stepIdx === 1) {
            // Description — optional but enforce max length
            const strippedDesc = stripHtml(description || "").trim();
            if (strippedDesc.length > DESCRIPTION_MAX) errs.description = `Description must be ${DESCRIPTION_MAX} characters or less.`;
            else if (strippedDesc) {
                const descCheck = checkFieldsProfanity({ description: strippedDesc });
                if (!descCheck.clean) errs.description = "Description contains inappropriate language. Please revise.";
            }
        }

        if (stepIdx === 2) {
            // Category
            if (!categoryId) errs.categoryId = "Please select a category.";
        }

        // Step 3 (Photos) — no required validation, photos are optional

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const isLastStep = step === EVENT_STEP_LABELS.length - 1;

    const handleStepNext = async () => {
        const valid = validateStep(step);
        if (!valid) {
            scrollToFirstError();
            return;
        }

        // On step 0 (Details), if address is entered but not geocoded, auto-geocode before advancing
        if (step === 0) {
            const trimmedAddr = String(address || "").trim();
            const hasCity = city && city !== ALL_CITIES;
            const hasCounty = county && county !== ALL_COUNTIES;

            if (trimmedAddr && latitude == null && longitude == null) {
                const rateCheck = checkGeocodeRateLimit();
                if (!rateCheck.allowed) {
                    setAddressError(rateCheck.message);
                    setTimeout(() => scrollToFirstError(), 120);
                    return;
                }

                setGeocoding(true);
                setAddressError("");

                try {
                    const parts = [trimmedAddr];
                    if (hasCity) parts.push(city);
                    if (hasCounty) parts.push(`${county} County`);
                    parts.push("Alabama");
                    const fullAddress = parts.join(", ");

                    const res = await secureFetch("/api/geocode", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ address: fullAddress }),
                    });

                    const data = await res.json().catch(() => null);

                    if (res.ok && data?.lat && data?.lng) {
                        const isStateFallback =
                            Math.abs(data.lat - 32.318) < 0.1 &&
                            Math.abs(data.lng - (-86.902)) < 0.1;

                        if (isStateFallback) {
                            recordGeocodeResult(false);
                            setAddressError("This address could not be found. Please check it or remove it.");
                            setGeocoding(false);
                            setTimeout(() => scrollToFirstError(), 120);
                            return;
                        }

                        const locType = String(data.location_type || "").toUpperCase();
                        if (locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER") {
                            recordGeocodeResult(false);
                            setAddressError("This address could not be verified. Please enter a valid street address or remove it.");
                            setGeocoding(false);
                            setTimeout(() => scrollToFirstError(), 120);
                            return;
                        }

                        recordGeocodeResult(true);
                        setLatitude(data.lat);
                        setLongitude(data.lng);
                        setMapPinConfirmed(true);
                    } else {
                        recordGeocodeResult(false);
                        setAddressError("This address could not be found. Please check it or remove it.");
                        setGeocoding(false);
                        setTimeout(() => scrollToFirstError(), 120);
                        return;
                    }
                } catch {
                    recordGeocodeResult(false);
                    setAddressError("Failed to verify address. Please try again.");
                    setGeocoding(false);
                    setTimeout(() => scrollToFirstError(), 120);
                    return;
                }
                setGeocoding(false);
            }
        }

        if (isLastStep) {
            handleSubmit();
            return;
        }
        setStep((s) => Math.min(s + 1, EVENT_STEP_LABELS.length - 1));
        if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    const handleStepBack = () => {
        setFieldErrors({});
        setError("");
        setStep((s) => Math.max(s - 1, 0));
        if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    const handleClose = () => {
        if (isSubmitting || isUploadingPhotos) return;
        onClose?.();
    };

    /**
     * Upload any pending File objects in `photos` to GCS, and return an array
     * where every entry has a usable `objectPath`. Called once from the submit
     * handler, before buildPayload.
     *
     * PhotosUploadSection owns the file input and stores fresh picks as
     * { id, file, url: "blob:..." }. Those are local only — nothing has been
     * sent to the server yet. Existing photos loaded in edit mode arrive as
     * { id, url, objectPath } with no `file`, and pass through unchanged.
     *
     * Uploads run in parallel via Promise.all. For a typical 1–4 photo event
     * this collapses what used to be 1–4 sequential signed-URL + PUT pairs
     * (often 4–8 seconds) into a single concurrent round (usually ~1–2 s).
     * Preserves original photo order via Array#map.
     *
     * If any single upload fails, the whole submit fails — the caller catches
     * and surfaces the error. This matches the pre-existing behavior of the
     * sequential loop, which would also abort on first failure.
     */
    const materializePhotosForSubmit = async () => {
        if (!Array.isArray(photos) || photos.length === 0) return [];

        return Promise.all(
            photos.map(async (p) => {
                if (p && p.file instanceof File) {
                    // Fresh pick — upload now and collect the object path.
                    const res = await uploadOneImageToBucket(p.file);
                    return {
                        id: p.id,
                        url: "",
                        objectPath: res.objectPath,
                    };
                }
                if (p && (p.url || p.objectPath)) {
                    // Existing photo from server (edit mode) — keep as-is.
                    return {
                        id: p.id,
                        url: String(p.url || "").trim(),
                        objectPath: p.objectPath || null,
                    };
                }
                return null;
            })
        ).then((arr) => arr.filter(Boolean));
    };

    const buildPayload = (photosOverride = null) => {
        const cat = (Array.isArray(categories) ? categories : []).find((c) => String(c?.id) === String(categoryId));
        const sub = (Array.isArray(subcategoryOptions) ? subcategoryOptions : []).find(
            (s) => String(s?.id) === String(subcategoryId)
        );

        const start_at = combineDateTime(startDate, startTime);
        const end_at = endDate ? combineDateTime(endDate, endTime) : null;

        // Photos entries arrive in two shapes:
        //   - Fresh from PhotosUploadSection: { id, file, url: "blob:..." }
        //   - Round-tripped from the server (edit mode): { id, url, objectPath }
        // The submit flow uploads any `file`-bearing entries BEFORE calling
        // buildPayload and passes the resulting array in via photosOverride.
        // If no override is passed (callers outside submit), fall back to the
        // raw state — but strip blob URLs so we never ship one to the backend.
        const photosSource = Array.isArray(photosOverride) ? photosOverride : photos;

        return {
            title: String(title || "").trim(),
            description: String(description || ""),
            address: (() => {
                const a = String(address || "").trim();
                return a || null;
            })(),
            start_at,
            startTime: startTime ? String(startTime).trim() : null,
            end_at,
            endTime: endTime ? String(endTime).trim() : null,
            timezone: "America/Chicago",
            location_scope: (() => {
                const c = String(county || "").trim();
                const ci = String(city || "").trim();
                const hasCounty = c && c !== ALL_COUNTIES;
                const hasCity = ci && ci !== ALL_CITIES;
                if (!hasCounty && !hasCity) return "statewide";
                if (hasCity) return "city";
                return "county";
            })(),
            county: (() => {
                const c = String(county || "").trim();
                return c && c !== ALL_COUNTIES ? c : null;
            })(),
            city: (() => {
                const ci = String(city || "").trim();
                return ci && ci !== ALL_CITIES ? ci : null;
            })(),
            categoryId: categoryId ? Number(categoryId) : null,
            subcategoryId: subcategoryId ? Number(subcategoryId) : null,
            categorySlug: String(cat?.slug || ""),
            subcategorySlug: String(sub?.slug || ""),
            photos: photosSource
                .map((p) => {
                    const rawUrl = String(p?.url || "").trim();
                    const objectPath = p?.objectPath || null;
                    // blob: URLs are local previews only — never ship them to the
                    // backend. Fresh uploads go up as { objectPath } alone; the
                    // backend uses that as the canonical identifier and signs a
                    // read URL at response time.
                    const url = rawUrl.startsWith("blob:") ? "" : rawUrl;
                    return { url, objectPath };
                })
                .filter((p) => p.url || p.objectPath),
            latitude: (() => {
                if (mapPinConfirmed && latitude != null) return latitude;
                const trimCity = String(city || "").trim();
                const trimCounty = String(county || "").trim();
                const hasCity = trimCity && trimCity !== ALL_CITIES;
                const hasCounty = trimCounty && trimCounty !== ALL_COUNTIES;
                if (!hasCity && !hasCounty) return null;
                const coords = resolveLocationCoords(hasCity ? trimCity : "", hasCounty ? trimCounty : "");
                return Array.isArray(coords) && coords.length === 2 ? coords[0] : null;
            })(),
            longitude: (() => {
                if (mapPinConfirmed && longitude != null) return longitude;
                const trimCity = String(city || "").trim();
                const trimCounty = String(county || "").trim();
                const hasCity = trimCity && trimCity !== ALL_CITIES;
                const hasCounty = trimCounty && trimCounty !== ALL_COUNTIES;
                if (!hasCity && !hasCounty) return null;
                const coords = resolveLocationCoords(hasCity ? trimCity : "", hasCounty ? trimCounty : "");
                return Array.isArray(coords) && coords.length === 2 ? coords[1] : null;
            })(),
            ...(isBusinessAccount && activeBusinessId
                ? { businessAccountId: activeBusinessId }
                : {}),
            ...(isArtist && activeArtistId
                ? { artistAccountId: activeArtistId }
                : {}),
            posterName: isSpecialAccount
                ? (activeAccount?.name || activeAccount?.display_name || '')
                : [resolvedUser?.first_name, resolvedUser?.last_name].filter(Boolean).join(' ') || resolvedUser?.handle || '',
            posterAvatar: isSpecialAccount
                ? (activeAccount?.avatar_url || activeAccount?.logo_url || '')
                : (resolvedUser?.avatar_url || resolvedUser?.profile_picture || ''),
            posterHandle: isSpecialAccount
                ? (activeAccount?.slug || activeAccount?.handle || '')
                : (resolvedUser?.handle || ''),
            posterProfilePath: isSpecialAccount
                ? (activeAccount?.slug ? `/${activeAccount.slug}` : '')
                : (resolvedUser?.handle ? `/${resolvedUser.handle}` : ''),
        };
    };

    const handleSubmit = async () => {
        if (isEdit && limitReached) {
            setError(limitMessage || "Edit limit reached. Try again later.");
            return;
        }

        const m = validateAll();
        if (!m.ok) {
            scrollToFirstError();
            return;
        }

        // Client-side profanity check
        const strippedDesc = stripHtml(String(description || '')).trim();
        const profanityResult = checkFieldsProfanity({ title, description: strippedDesc });
        if (!profanityResult.clean) {
            const profanityFieldErrors = {};
            if (profanityResult.field === 'title') {
                profanityFieldErrors.title = "Title contains inappropriate language. Please revise.";
            } else if (profanityResult.field === 'description') {
                profanityFieldErrors.description = "Description contains inappropriate language. Please revise.";
            }
            setFieldErrors(profanityFieldErrors);
            setError(`Your ${profanityResult.field} contains inappropriate language. Please revise and try again.`);
            scrollToFirstError();
            return;
        }

        // If there is an address entered but not yet geocoded, attempt to verify it now
        const trimmedAddr = String(address || "").trim();
        const hasCity = city && city !== ALL_CITIES;
        const hasCounty = county && county !== ALL_COUNTIES;
        let submitGeocodedLat = null;
        let submitGeocodedLng = null;

        if (trimmedAddr && latitude == null && longitude == null) {
            // Rate limit check
            const rateCheck = checkGeocodeRateLimit();
            if (!rateCheck.allowed) {
                setAddressError(rateCheck.message);
                setTimeout(() => scrollToFirstError(), 120);
                return;
            }

            setIsSubmitting(true);
            setError("");
            setAddressError("");

            try {
                const parts = [trimmedAddr];
                if (hasCity) parts.push(city);
                if (hasCounty) parts.push(`${county} County`);
                parts.push("Alabama");
                const fullAddress = parts.join(", ");

                const res = await secureFetch("/api/geocode", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: fullAddress }),
                });

                const data = await res.json().catch(() => null);

                if (res.ok && data?.lat && data?.lng) {
                    const isStateFallback =
                        Math.abs(data.lat - 32.318) < 0.1 &&
                        Math.abs(data.lng - (-86.902)) < 0.1;

                    if (isStateFallback) {
                        recordGeocodeResult(false);
                        setAddressError("This address could not be found. Please check it or remove it.");
                        setIsSubmitting(false);
                        setTimeout(() => scrollToFirstError(), 120);
                        return;
                    }

                    const locType = String(data.location_type || "").toUpperCase();
                    if (locType === "APPROXIMATE" || locType === "GEOMETRIC_CENTER") {
                        recordGeocodeResult(false);
                        setAddressError("This address could not be verified. Please enter a valid street address or remove it.");
                        setIsSubmitting(false);
                        setTimeout(() => scrollToFirstError(), 120);
                        return;
                    }

                    recordGeocodeResult(true);
                    // Address verified — capture coords for payload and update state for UI
                    submitGeocodedLat = data.lat;
                    submitGeocodedLng = data.lng;
                    setLatitude(data.lat);
                    setLongitude(data.lng);
                    setMapPinConfirmed(true);
                } else {
                    recordGeocodeResult(false);
                    setAddressError("This address could not be found. Please check it or remove it.");
                    setIsSubmitting(false);
                    setTimeout(() => scrollToFirstError(), 120);
                    return;
                }
            } catch {
                recordGeocodeResult(false);
                setAddressError("Failed to verify address. Please try again.");
                setIsSubmitting(false);
                setTimeout(() => scrollToFirstError(), 120);
                return;
            }
        } else {
            setIsSubmitting(true);
            setError("");
            setSuccess("");
        }

        try {
            // Upload any freshly-picked photos to GCS first. This has to
            // happen before buildPayload so the payload carries real
            // objectPaths, not blob: URLs.
            let materializedPhotos;
            try {
                setIsUploadingPhotos(true);
                materializedPhotos = await materializePhotosForSubmit();
            } catch (uploadErr) {
                setError(uploadErr?.message || "Photo upload failed. Please try again.");
                setIsSubmitting(false);
                setIsUploadingPhotos(false);
                return;
            } finally {
                setIsUploadingPhotos(false);
            }

            const payload = buildPayload(materializedPhotos);
            // If we just geocoded the address inline, override the payload coords
            // (React state updates from setLatitude/setLongitude won't be reflected yet)
            if (submitGeocodedLat != null && submitGeocodedLng != null) {
                payload.latitude = submitGeocodedLat;
                payload.longitude = submitGeocodedLng;
            }
            const res = isEdit ? await updateEvent(eventId, payload) : await createEvent(payload);
            setSuccess(isEdit ? "Event updated!" : "Event created!");

            const createdId = isEdit ? eventId : (res?.id || res?.data?.id);
            if (createdId) processEventMentions(createdId).catch(() => {});

            if (isEdit && eventId) {
                try {
                    window.dispatchEvent(new CustomEvent("ll:event:edited", {
                        detail: { eventId, post: res },
                    }));
                } catch {
                    // ignore
                }
            }

            onSaved?.(res);
            onClose?.();
        } catch (e) {
            setError(e?.response?.data?.message || "Could not save event. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ── Section divider with spacing ── */
    const sectionDivider = (
        <Divider sx={{ my: { xs: 2.5, sm: 3 } }} />
    );

    /* ── Selected category label for inline display ── */
    const selectedCatObj = (Array.isArray(categories) ? categories : []).find((c) => String(c?.id) === String(categoryId));
    const SelectedCatIcon = selectedCatObj ? (EVENT_CATEGORY_ICON_COMPONENTS[selectedCatObj.slug] || CategoryRoundedIcon) : null;

    /* ===================================================================
       CREATE MODE — stepper-based render
       =================================================================== */
    if (!isEdit) {
        const renderCreateStep = () => {
            switch (step) {
                case 0:
                    return (
                        <Stack spacing={2.5}>
                            {/* ── TITLE ── */}
                            <TextField
                                label="Event Title *"
                                placeholder="Give your event a clear, catchy name"
                                value={title}
                                onChange={(e) => { setTitle(e.target.value.slice(0, TITLE_MAX)); clearFieldError("title"); }}
                                inputProps={{ maxLength: TITLE_MAX, autoComplete: "off", "data-form-type": "other", "data-lpignore": "true", style: { fontSize: 16 } }}
                                autoComplete="off"
                                name="event-title-field"
                                fullWidth
                                autoFocus
                                sx={INPUT_SX}
                                error={Boolean(fieldErrors.title)}
                                helperText={fieldErrors.title || `${String(title || "").length}/${TITLE_MAX}`}
                            />

                            {/* ── DATE & TIME ── */}
                            <SectionHeading icon={<AccessTimeIcon sx={{ fontSize: 18 }} />} title="Date & Time" subtitle="All times are in Central Time (CT)" />

                            {/* Start */}
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>Start</Typography>
                                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField label="Date *" type="date" value={startDate}
                                                   onChange={(e) => { const next = e.target.value; setStartDate(next); clearFieldError("startDate"); if (endDate && next && compareDateStrings(endDate, next) === -1) { setEndDate(next); clearFieldError("endDate"); } }}
                                                   fullWidth InputLabelProps={{ shrink: true }}
                                                   inputProps={{ min: todayDateInputValue(), autoComplete: "off", "data-form-type": "other", "data-lpignore": "true", style: { fontSize: 16 } }}
                                                   autoComplete="off" name="event-start-date-field" sx={INPUT_SX}
                                                   error={Boolean(fieldErrors.startDate)} helperText={fieldErrors.startDate || ""} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField label="Time" type="time" value={startTime}
                                                   onChange={(e) => { const next = e.target.value; setStartTime(next); if (startDate && endDate && String(startDate) === String(endDate) && next && endTime && compareTimeStrings(endTime, next) === -1) { setEndTime(""); } }}
                                                   inputProps={{ autoComplete: "off", "data-form-type": "other", "data-lpignore": "true", style: { fontSize: 16 } }}
                                                   autoComplete="off" name="event-start-time-field" fullWidth InputLabelProps={{ shrink: true }} sx={INPUT_SX} />
                                    </Box>
                                </Box>
                            </Box>

                            {/* End */}
                            <Box>
                                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>End</Typography>
                                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField label="Date" type="date" value={endDate}
                                                   onChange={(e) => { setEndDate(e.target.value); clearFieldError("endDate"); }}
                                                   inputProps={{ min: startDate || todayDateInputValue(), autoComplete: "off", "data-form-type": "other", "data-lpignore": "true", style: { fontSize: 16 } }}
                                                   autoComplete="off" name="event-end-date-field" fullWidth InputLabelProps={{ shrink: true }} sx={INPUT_SX}
                                                   error={Boolean(fieldErrors.endDate)} helperText={fieldErrors.endDate || ""} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField label="Time" type="time" value={endTime}
                                                   onChange={(e) => { setEndTime(e.target.value); clearFieldError("endTime"); }}
                                                   inputProps={{ min: startDate && endDate && String(startDate) === String(endDate) && startTime ? startTime : undefined, autoComplete: "off", "data-form-type": "other", "data-lpignore": "true", style: { fontSize: 16 } }}
                                                   autoComplete="off" name="event-end-time-field" fullWidth InputLabelProps={{ shrink: true }} sx={INPUT_SX}
                                                   error={Boolean(fieldErrors.endTime)} helperText={fieldErrors.endTime || ""} />
                                    </Box>
                                </Box>
                            </Box>

                            {/* ── LOCATION ── */}
                            <SectionHeading icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />} title="Location" subtitle="Select a county and/or city, optionally add a street address" />

                            <Box sx={SELECT_WRAPPER_SX}>
                                <CityCountySelect
                                    city={city || ALL_CITIES}
                                    setCity={(v) => { const next = v || ALL_CITIES; setCity(next); clearFieldError("city"); if (next === ALL_CITIES) { setAddress(""); } setLatitude(null); setLongitude(null); setMapPinConfirmed(false); setGeocodeError(""); setAddressError(""); }}
                                    county={county || ALL_COUNTIES}
                                    setCounty={(v) => { const next = v || ALL_COUNTIES; setCounty(next); clearFieldError("county"); if (next === ALL_COUNTIES) { setAddress(""); } setLatitude(null); setLongitude(null); setMapPinConfirmed(false); setGeocodeError(""); setAddressError(""); }}
                                    countyRequired={false} cityRequired={false} emptyCountyLabel={ALL_COUNTIES} emptyCityLabel={ALL_CITIES}
                                />
                            </Box>

                            <TextField
                                label="Address (optional)" value={address}
                                onChange={(e) => { setAddress(e.target.value.slice(0, ADDRESS_MAX)); if (addressError) setAddressError(""); if (fieldErrors?.address) setFieldErrors((p) => { const n = { ...p }; delete n.address; return n; }); if (latitude || longitude) { setLatitude(null); setLongitude(null); setMapPinConfirmed(false); setGeocodeError(""); } }}
                                inputRef={addressRef}
                                error={Boolean(addressError || fieldErrors?.address)}
                                inputProps={{ maxLength: ADDRESS_MAX, autoComplete: "new-password", autoCorrect: "off", autoCapitalize: "off", spellCheck: "false", "data-form-type": "other", "data-lpignore": "true", "data-1p-ignore": "true", style: { fontSize: 16 } }}
                                InputProps={{ autoComplete: "new-password" }}
                                autoComplete="new-password" name={ADDRESS_FIELD_NAME} id={ADDRESS_FIELD_ID}
                                fullWidth disabled={city === ALL_CITIES || !city}
                                placeholder={city === ALL_CITIES || !city ? "Select a city to add an address" : "Enter street address"}
                                sx={INPUT_SX}
                                helperText={addressError || fieldErrors?.address || (city === ALL_CITIES || !city ? "Select a city to enable address input" : (mapPinConfirmed ? "Address verified!" : "Enter an address and click Verify Address."))}
                                FormHelperTextProps={{ sx: { color: mapPinConfirmed && !addressError && !fieldErrors?.address ? "success.main" : undefined, fontWeight: 700 } }}
                            />

                            {/* Verify Address button (like ServiceAdminConsole) */}
                            {Boolean(address?.trim()) && (city !== ALL_CITIES || (county && county !== ALL_COUNTIES)) && (
                                <Button variant="outlined" size="small" onClick={handleGetMapPin}
                                        disabled={geocoding || mapPinConfirmed}
                                        startIcon={geocoding ? <CircularProgress size={14} /> : <CheckCircleOutlineIcon />}
                                        color={mapPinConfirmed ? "success" : "primary"}
                                        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, fontSize: 12, borderRadius: 999 }}>
                                    {geocoding ? "Verifying\u2026" : mapPinConfirmed ? "Address Verified" : "Verify Address"}
                                </Button>
                            )}

                            {/* Geocode error */}
                            {geocodeError && (
                                <Alert severity="error" sx={{ py: 0.5, borderRadius: 2 }} onClose={() => setGeocodeError("")}>
                                    {geocodeError}
                                </Alert>
                            )}

                            {/* City/County area map preview (no pin — view mode like ServiceAdminConsole) */}
                            {(() => {
                                const hasCity = city && city !== ALL_CITIES;
                                const hasCounty = county && county !== ALL_COUNTIES;
                                if (!hasCity && !hasCounty) return null;
                                const areaCoords = resolveLocationCoords(hasCity ? city : "", hasCounty ? county : "");
                                if (!areaCoords || areaCoords.length < 2) return null;
                                const hasAddr = Boolean(address?.trim());
                                // Only show the area preview when there's no address entered (address flow has its own map)
                                if (hasAddr && (latitude || longitude || mapPinConfirmed)) return null;
                                const areaLabel = [hasCity ? city : "", hasCounty ? county + " County" : "", "Alabama"].filter(Boolean).join(", ");
                                const mapSrc = `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${areaCoords[0]},${areaCoords[1]}&zoom=${hasCity ? 12 : 10}`;
                                return (
                                    <Box sx={(t) => ({ borderRadius: 2.5, overflow: "hidden", border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                        <Box component="iframe" src={mapSrc} sx={{ width: "100%", height: 160, border: 0, display: "block", pointerEvents: "none" }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Area preview" />
                                        <Box sx={{ px: 1.5, py: 1, bgcolor: "background.default" }}>
                                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", fontStyle: "italic" }}>
                                                Approximate area for {areaLabel}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })()}

                            {/* Address-based Map Pin Section (only when address is verified) */}
                            {(city !== ALL_CITIES || (county && county !== ALL_COUNTIES)) && (
                                <Box>
                                    {latitude && longitude && !mapPinConfirmed && (
                                        <Box sx={{ border: "2px solid", borderColor: "warning.main", borderRadius: 2.5, overflow: "hidden" }}>
                                            <Box sx={{ position: "relative", height: 160 }}>
                                                <Box component="iframe" src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${latitude},${longitude}&zoom=15`} sx={{ width: "100%", height: "100%", border: 0 }} loading="lazy" allowFullScreen title="Map preview" />
                                            </Box>
                                            <Box sx={{ p: 1.5, bgcolor: "background.default" }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Is this the correct location?</Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Button variant="contained" color="success" size="small" onClick={handleConfirmMapPin} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>Yes, Confirm</Button>
                                                    <Button variant="outlined" size="small" onClick={handleRemoveMapPin} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>No, Try Again</Button>
                                                </Stack>
                                            </Box>
                                        </Box>
                                    )}
                                    {latitude && longitude && mapPinConfirmed && (
                                        <Box sx={{ border: "2px solid", borderColor: "success.main", borderRadius: 2.5, overflow: "hidden" }}>
                                            <Box sx={{ position: "relative", height: 160 }}>
                                                <Box component="iframe" src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${latitude},${longitude}&zoom=15`} sx={{ width: "100%", height: "100%", border: 0 }} loading="lazy" allowFullScreen title="Map preview" />
                                                <Box sx={{ position: "absolute", top: 8, right: 8, bgcolor: "success.main", color: "white", px: 1, py: 0.5, borderRadius: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: "white" }}>Confirmed</Typography>
                                                </Box>
                                            </Box>
                                            <Box sx={{ p: 1.5, bgcolor: "background.default", display: "flex", justifyContent: "flex-end" }}>
                                                <Button variant="outlined" size="small" color="error" onClick={handleRemoveMapPin} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>Remove Pin</Button>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Stack>
                    );
                case 1:
                    return (
                        <Stack spacing={2.5}>
                            <SectionHeading icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />} title="Description" subtitle="Add details people should know" />
                            <RichTextEditor
                                label="Description"
                                value={description}
                                onChange={(html) => { setDescription(html); clearFieldError("description"); }}
                                maxLength={DESCRIPTION_MAX}
                                placeholder="What's your event about? Share the details..."
                                minRows={10}
                                error={Boolean(fieldErrors.description)}
                                helperText={fieldErrors.description}
                            />
                        </Stack>
                    );
                case 2:
                    return (
                        <Stack spacing={2.5}>
                            <SectionHeading icon={<CategoryOutlinedIcon sx={{ fontSize: 18 }} />} title="Category *" subtitle="Choose the best category for your event" />
                            {fieldErrors.categoryId && (
                                <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "error.main", mb: 1.5 }}>{fieldErrors.categoryId}</Typography>
                            )}
                            {categoryStage === "sub" && categoryId && subcategoryOptions.length > 0 ? (
                                <Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                        <IconButton size="small" onClick={() => { setCategoryStage("main"); setSubcategoryId(""); }} sx={{ color: "text.secondary" }}><ArrowBackIcon fontSize="small" /></IconButton>
                                        {SelectedCatIcon && (<Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: (t) => alpha(t.palette.success.main, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}><SelectedCatIcon sx={{ fontSize: 16, color: "success.dark" }} /></Box>)}
                                        <Typography sx={{ fontWeight: 800, fontSize: 14.5 }}>{selectedCatObj?.label || "Category"} — Subcategory</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>Select a subcategory (optional):</Typography>
                                    <Button variant="outlined" onClick={() => { setSubcategoryId(""); }} startIcon={!subcategoryId ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                            sx={(t) => ({ justifyContent: "flex-start", textTransform: "none", borderRadius: 2, py: 1, px: 1.25, fontWeight: 800, mb: 1, width: "100%", borderColor: !subcategoryId ? t.palette.success.main : t.palette.divider, backgroundColor: !subcategoryId ? alpha(t.palette.success.main, 0.06) : "transparent", "&:hover": { backgroundColor: !subcategoryId ? alpha(t.palette.success.main, 0.10) : "action.hover" } })}>
                                        <Typography sx={{ fontWeight: 800, fontSize: 13, textAlign: "left" }}>No subcategory (use &quot;{selectedCatObj?.label}&quot; only)</Typography>
                                    </Button>
                                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1 }}>
                                        {subcategoryOptions.map((s) => {
                                            const isSelectedSub = String(subcategoryId) === String(s?.id);
                                            return (
                                                <Button key={s?.id} onClick={() => { setSubcategoryId(String(s?.id)); clearFieldError("categoryId"); }} variant="outlined" startIcon={isSelectedSub ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                                        sx={(t) => ({ justifyContent: "flex-start", textTransform: "none", borderRadius: 2, py: 1, px: 1.25, fontWeight: 800, borderColor: isSelectedSub ? t.palette.success.main : t.palette.divider, backgroundColor: isSelectedSub ? alpha(t.palette.success.main, 0.06) : "transparent", "&:hover": { backgroundColor: isSelectedSub ? alpha(t.palette.success.main, 0.10) : "action.hover" } })}>
                                                    <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15, textAlign: "left" }}>{s?.label}</Typography>
                                                </Button>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1 }}>
                                    {(Array.isArray(categories) ? categories : []).map((cat) => {
                                        const CatIcon = EVENT_CATEGORY_ICON_COMPONENTS[cat?.slug] || CategoryRoundedIcon;
                                        const isSelected = String(categoryId) === String(cat?.id);
                                        const hasSubs = Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;
                                        return (
                                            <Button key={cat?.id} onClick={() => { setCategoryId(String(cat?.id)); clearFieldError("categoryId"); if (hasSubs) { setCategoryStage("sub"); setSubcategoryId(""); } else { setCategoryStage("main"); setSubcategoryId(""); } }} variant="outlined"
                                                    sx={(t) => ({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textTransform: "none", borderRadius: 2.5, py: 1.5, px: 1, gap: 0.5, fontWeight: 800, minHeight: 72, borderColor: isSelected ? t.palette.success.main : alpha(t.palette.text.primary, 0.1), backgroundColor: isSelected ? alpha(t.palette.success.main, 0.06) : "transparent", "&:hover": { backgroundColor: isSelected ? alpha(t.palette.success.main, 0.10) : alpha(t.palette.text.primary, 0.03), borderColor: isSelected ? t.palette.success.main : alpha(t.palette.text.primary, 0.18) } })}>
                                                <CatIcon sx={(t) => ({ fontSize: 22, color: isSelected ? t.palette.success.dark : t.palette.text.secondary })} />
                                                <Typography sx={{ fontWeight: 800, fontSize: 12, lineHeight: 1.15, textAlign: "center" }}>{cat?.label}</Typography>
                                                {isSelected && <CheckCircleIcon sx={{ fontSize: 16, color: "success.main", position: "absolute", top: 6, right: 6 }} />}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            )}
                        </Stack>
                    );
                case 3:
                    return (
                        <Stack spacing={2.5}>
                            <SectionHeading icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 18 }} />} title="Photos" subtitle={`Add up to ${MAX_PHOTOS} photos — the first is the cover image. Drag to reorder.`} />
                            {fieldErrors.photos && <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "error.main", mb: 1.5 }}>{fieldErrors.photos}</Typography>}

                            <PhotosUploadSection
                                photos={photos}
                                setPhotos={setPhotos}
                                disabled={isSubmitting}
                                maxPhotos={MAX_PHOTOS}
                                title=""
                                helperText=""
                                addButtonText="Add photos"
                            />
                        </Stack>
                    );
                default:
                    return null;
            }
        };

        return (
            <Dialog open={open} onClose={(_, reason) => { if (reason === 'backdropClick') return; handleClose(); }} fullWidth maxWidth="md" sx={{ zIndex: (t) => t.zIndex.modal + 50 }}
                    fullScreen={fullScreen}
                    PaperProps={{ sx: { ...DIALOG_PAPER_CREATE_SX, borderRadius: fullScreen ? 0 : 3, height: fullScreen ? '100%' : DIALOG_PAPER_CREATE_SX.height, maxHeight: fullScreen ? '100%' : DIALOG_PAPER_CREATE_SX.maxHeight } }}>
                <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                    <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.25, pb: 1.75, display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: "primary.main", flexShrink: 0 }}>
                            <CalendarMonthIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Create Event</Typography>
                    </Box>
                </DialogTitle>

                {/* Stepper */}
                <Box sx={{ px: 3, pb: 1, flexShrink: 0 }}>
                    <Stepper activeStep={step} alternativeLabel sx={STEPPER_LABEL_SX}>
                        {EVENT_STEP_LABELS.map((label, idx) => (
                            <Step key={label} completed={idx < step} sx={{ cursor: idx < step ? "pointer" : "default" }} onClick={() => { if (idx < step) setStep(idx); }}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                <DialogContent ref={contentRef} sx={{ pt: 1.5, flex: 1, overflow: "auto" }}>
                    {authChecked && !authLoading && !isAuthenticated && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5 }}>Please sign in to create events.</Alert>
                    )}
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>{success}</Alert>}
                    {renderCreateStep()}
                </DialogContent>

                {/* Navigation footer */}
                <DialogActions sx={{ p: 2, justifyContent: "space-between", gap: 1, flexShrink: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {step > 0 ? (
                            <Button variant="outlined" onClick={handleStepBack} disabled={isSubmitting}
                                    sx={{ minWidth: { xs: 0, sm: 64 }, px: { xs: 1.5, sm: 2 } }}
                                    startIcon={<ArrowBackRoundedIcon />}>
                                Back
                            </Button>
                        ) : null}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting || isUploadingPhotos}>Cancel</Button>
                        <Button variant="contained" onClick={handleStepNext}
                                disabled={isSubmitting || isUploadingPhotos || geocoding || (authChecked && !isAuthenticated)}
                                sx={{ minWidth: { xs: 0, sm: 120 }, px: { xs: 2, sm: 3 } }}
                                endIcon={isSubmitting || geocoding ? <CircularProgress size={16} color="inherit" /> : isLastStep ? <CheckRoundedIcon /> : <ArrowForwardRoundedIcon />}>
                            {isSubmitting ? "Saving..." : geocoding ? "Verifying..." : isLastStep ? "Create Event" : "Next"}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        );
    }

    /* ===================================================================
       EDIT MODE — single-page scrollable render (original layout)
       =================================================================== */
    return (
        <Dialog
            open={open}
            onClose={(_, reason) => { if (reason === "backdropClick") return; handleClose(); }}
            fullWidth maxWidth="lg" fullScreen={fullScreen}
            PaperProps={{
                sx: {
                    bgcolor: "background.paper",
                    borderRadius: fullScreen ? 0 : 4,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    // On mobile, occupy the entire viewport — no margin, no height cap.
                    // On desktop, keep the centered-dialog sizing.
                    m: fullScreen ? 0 : undefined,
                    width: fullScreen ? "100%" : undefined,
                    height: fullScreen ? "100%" : { xs: "92vh", md: "88vh" },
                    maxHeight: fullScreen ? "100%" : "95vh",
                    maxWidth: fullScreen ? "100%" : undefined,
                },
            }}
        >
            {/* ── HEADER ── */}
            <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.25, pb: 1.75, display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: "primary.main", flexShrink: 0 }}>
                        <EditNoteRoundedIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 20 }, lineHeight: 1.15, letterSpacing: "-0.02em", color: "text.primary" }}>Edit Event</Typography>
                        <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.15, lineHeight: 1.3 }}>Update your event details below</Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose} disabled={isSubmitting || isUploadingPhotos}
                                sx={{ color: "text.secondary", bgcolor: (t) => alpha(t.palette.text.primary, 0.04), "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) } }} aria-label="Close">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Divider />
            </DialogTitle>

            {/* ── SCROLLABLE CONTENT ── */}
            <DialogContent sx={{ p: 0, flex: 1, minHeight: 0, overflow: "hidden" }}>
                <Box
                    ref={scrollBoxRef}
                    sx={{
                        height: "100%",
                        overflowY: "auto",
                        px: { xs: 2.5, sm: 3 },
                        py: { xs: 2.5, sm: 3 },
                    }}
                >
                    {/* ── Alerts ── */}
                    {authLoading && (
                        <Alert severity="info" sx={{ mb: 2, borderRadius: 2.5 }}>
                            Checking your session...
                        </Alert>
                    )}
                    {authChecked && !authLoading && !isAuthenticated && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5 }}>
                            Please sign in to create or edit events.
                        </Alert>
                    )}
                    {isEdit && limitReached && (
                        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5 }}>
                            {limitMessage || "You've reached the edit limit (5 edits per 24 hours). Please try again later."}
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>
                            {success}
                        </Alert>
                    )}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECTION 1 — TITLE                              */}
                    {/* ═══════════════════════════════════════════════ */}
                    <TextField
                        label="Event Title *"
                        placeholder="Give your event a clear, catchy name"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value.slice(0, TITLE_MAX));
                            clearFieldError("title");
                        }}
                        inputProps={{
                            maxLength: TITLE_MAX,
                            autoComplete: "off",
                            "data-form-type": "other",
                            "data-lpignore": "true",
                            style: { fontSize: 16 },
                        }}
                        autoComplete="off"
                        name="event-title-field"
                        fullWidth
                        sx={INPUT_SX}
                        error={Boolean(fieldErrors.title)}
                        helperText={fieldErrors.title || `${String(title || "").length}/${TITLE_MAX}`}
                    />

                    {sectionDivider}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECTION 2 — DATE & TIME                        */}
                    {/* ═══════════════════════════════════════════════ */}
                    <SectionHeading
                        icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                        title="Date & Time"
                        subtitle="All times are in Central Time (CT)"
                    />

                    {/* Start */}
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>Start</Typography>
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Date *"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setStartDate(next);
                                        clearFieldError("startDate");
                                        if (endDate && next && compareDateStrings(endDate, next) === -1) {
                                            setEndDate(next);
                                            clearFieldError("endDate");
                                        }
                                    }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: todayDateInputValue(),
                                        autoComplete: "off",
                                        "data-form-type": "other",
                                        "data-lpignore": "true",
                                        style: { fontSize: 16 },
                                    }}
                                    autoComplete="off"
                                    name="event-start-date-field"
                                    sx={INPUT_SX}
                                    error={Boolean(fieldErrors.startDate)}
                                    helperText={fieldErrors.startDate || ""}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Time"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setStartTime(next);
                                        if (
                                            startDate &&
                                            endDate &&
                                            String(startDate) === String(endDate) &&
                                            next &&
                                            endTime &&
                                            compareTimeStrings(endTime, next) === -1
                                        ) {
                                            setEndTime(next);
                                            clearFieldError("endTime");
                                        }
                                    }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        autoComplete: "off",
                                        "data-form-type": "other",
                                        "data-lpignore": "true",
                                        style: { fontSize: 16 },
                                    }}
                                    autoComplete="off"
                                    name="event-start-time-field"
                                    sx={INPUT_SX}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {/* End */}
                    <Box>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "text.secondary", mb: 1, textTransform: "uppercase", letterSpacing: "0.04em" }}>End</Typography>
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setEndDate(next);
                                        clearFieldError("endDate");

                                        if (next && startDate && compareDateStrings(next, startDate) === -1) {
                                            setEndDate(startDate);
                                        }

                                        if (
                                            next &&
                                            startDate &&
                                            String(next) === String(startDate) &&
                                            startTime &&
                                            endTime &&
                                            compareTimeStrings(endTime, startTime) === -1
                                        ) {
                                            setEndTime(startTime);
                                            clearFieldError("endTime");
                                        }
                                    }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: startDate || todayDateInputValue(),
                                        autoComplete: "off",
                                        "data-form-type": "other",
                                        "data-lpignore": "true",
                                        style: { fontSize: 16 },
                                    }}
                                    autoComplete="off"
                                    name="event-end-date-field"
                                    sx={INPUT_SX}
                                    error={Boolean(fieldErrors.endDate)}
                                    helperText={fieldErrors.endDate || ""}
                                />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Time"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => {
                                        setEndTime(e.target.value);
                                        clearFieldError("endTime");
                                    }}
                                    inputProps={{
                                        min:
                                            startDate && endDate && String(startDate) === String(endDate) && startTime
                                                ? startTime
                                                : undefined,
                                        autoComplete: "off",
                                        "data-form-type": "other",
                                        "data-lpignore": "true",
                                        style: { fontSize: 16 },
                                    }}
                                    autoComplete="off"
                                    name="event-end-time-field"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={INPUT_SX}
                                    error={Boolean(fieldErrors.endTime)}
                                    helperText={fieldErrors.endTime || ""}
                                />
                            </Box>
                        </Box>
                    </Box>

                    {sectionDivider}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECTION 3 — LOCATION                           */}
                    {/* ═══════════════════════════════════════════════ */}
                    <SectionHeading
                        icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}
                        title="Location"
                        subtitle="Select a county and/or city, optionally add a street address"
                    />

                    <Box sx={SELECT_WRAPPER_SX}>
                        <CityCountySelect
                            city={city || ALL_CITIES}
                            setCity={(v) => {
                                const next = v || ALL_CITIES;
                                setCity(next);
                                clearFieldError("city");
                                if (next === ALL_CITIES) { setAddress(""); }
                                setLatitude(null); setLongitude(null); setMapPinConfirmed(false); setGeocodeError(""); setAddressError("");
                            }}
                            county={county || ALL_COUNTIES}
                            setCounty={(v) => {
                                const next = v || ALL_COUNTIES;
                                setCounty(next);
                                clearFieldError("county");
                                if (next === ALL_COUNTIES) { setAddress(""); }
                                setLatitude(null); setLongitude(null); setMapPinConfirmed(false); setGeocodeError(""); setAddressError("");
                            }}
                            countyRequired={false}
                            cityRequired={false}
                            emptyCountyLabel={ALL_COUNTIES}
                            emptyCityLabel={ALL_CITIES}
                        />
                    </Box>

                    <TextField
                        label="Address (optional)"
                        value={address}
                        onChange={(e) => {
                            setAddress(e.target.value.slice(0, ADDRESS_MAX));
                            if (addressError) setAddressError("");
                            if (fieldErrors?.address) setFieldErrors((p) => { const n = { ...p }; delete n.address; return n; });
                            if (latitude || longitude) {
                                setLatitude(null); setLongitude(null); setMapPinConfirmed(false); setGeocodeError("");
                            }
                        }}
                        inputRef={addressRef}
                        error={Boolean(addressError || fieldErrors?.address)}
                        inputProps={{
                            maxLength: ADDRESS_MAX,
                            autoComplete: "new-password",
                            autoCorrect: "off",
                            autoCapitalize: "off",
                            spellCheck: "false",
                            "data-form-type": "other",
                            "data-lpignore": "true",
                            "data-1p-ignore": "true",
                            style: { fontSize: 16 },
                        }}
                        InputProps={{
                            autoComplete: "new-password",
                        }}
                        autoComplete="new-password"
                        name={ADDRESS_FIELD_NAME}
                        id={ADDRESS_FIELD_ID}
                        fullWidth
                        disabled={city === ALL_CITIES || !city}
                        placeholder={
                            city === ALL_CITIES || !city
                                ? "Select a city to add an address"
                                : "Enter street address"
                        }
                        sx={{ ...INPUT_SX, mt: 1.5 }}
                        helperText={
                            addressError
                                ? addressError
                                : fieldErrors?.address
                                    ? fieldErrors.address
                                    : city === ALL_CITIES || !city
                                        ? "Select a city to enable address input"
                                        : mapPinConfirmed
                                            ? "Address verified!"
                                            : "Enter an address and click Verify Address."
                        }
                        FormHelperTextProps={{ sx: { color: mapPinConfirmed && !addressError && !fieldErrors?.address ? "success.main" : undefined, fontWeight: 700 } }}
                    />

                    {/* Verify Address button (like ServiceAdminConsole) */}
                    {Boolean(address?.trim()) && (city !== ALL_CITIES || (county && county !== ALL_COUNTIES)) && (
                        <Button variant="outlined" size="small" onClick={handleGetMapPin}
                                disabled={geocoding || mapPinConfirmed}
                                startIcon={geocoding ? <CircularProgress size={14} /> : <CheckCircleOutlineIcon />}
                                color={mapPinConfirmed ? "success" : "primary"}
                                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, fontSize: 12, borderRadius: 999, mt: 1 }}>
                            {geocoding ? "Verifying\u2026" : mapPinConfirmed ? "Address Verified" : "Verify Address"}
                        </Button>
                    )}

                    {/* Geocode error */}
                    {geocodeError && (
                        <Alert severity="error" sx={{ mt: 1.5, py: 0.5, borderRadius: 2 }} onClose={() => setGeocodeError("")}>
                            {geocodeError}
                        </Alert>
                    )}

                    {/* City/County area map preview (no pin — view mode like ServiceAdminConsole) */}
                    {(() => {
                        const hasCity = city && city !== ALL_CITIES;
                        const hasCounty = county && county !== ALL_COUNTIES;
                        if (!hasCity && !hasCounty) return null;
                        const areaCoords = resolveLocationCoords(hasCity ? city : "", hasCounty ? county : "");
                        if (!areaCoords || areaCoords.length < 2) return null;
                        const hasAddr = Boolean(address?.trim());
                        // Only show the area preview when there's no address entered (address flow has its own map)
                        if (hasAddr && (latitude || longitude || mapPinConfirmed)) return null;
                        const areaLabel = [hasCity ? city : "", hasCounty ? county + " County" : "", "Alabama"].filter(Boolean).join(", ");
                        const mapSrc = `https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&center=${areaCoords[0]},${areaCoords[1]}&zoom=${hasCity ? 12 : 10}`;
                        return (
                            <Box sx={(t) => ({ mt: 1.5, borderRadius: 2.5, overflow: "hidden", border: "1px solid", borderColor: alpha(t.palette.primary.main, 0.12) })}>
                                <Box component="iframe" src={mapSrc} sx={{ width: "100%", height: 180, border: 0, display: "block", pointerEvents: "none" }} allowFullScreen={false} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Area preview" />
                                <Box sx={{ px: 1.5, py: 1, bgcolor: "background.default" }}>
                                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", fontStyle: "italic" }}>
                                        Approximate area for {areaLabel}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })()}

                    {/* Address-based Map Pin Section (only when address is verified) */}
                    {(city !== ALL_CITIES || (county && county !== ALL_COUNTIES)) && (
                        <Box sx={{ mt: 2 }}>
                            {latitude && longitude && !mapPinConfirmed && (
                                <Box sx={{ border: "2px solid", borderColor: "warning.main", borderRadius: 2.5, overflow: "hidden" }}>
                                    <Box sx={{ position: "relative", height: 180 }}>
                                        <Box
                                            component="iframe"
                                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${latitude},${longitude}&zoom=15`}
                                            sx={{ width: "100%", height: "100%", border: 0 }}
                                            loading="lazy"
                                            allowFullScreen
                                            title="Map preview"
                                        />
                                    </Box>
                                    <Box sx={{ p: 1.5, bgcolor: "background.default" }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                            Is this the correct location?
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="contained" color="success" size="small" onClick={handleConfirmMapPin} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                                                Yes, Confirm
                                            </Button>
                                            <Button variant="outlined" size="small" onClick={handleRemoveMapPin} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                                                No, Try Again
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Box>
                            )}

                            {latitude && longitude && mapPinConfirmed && (
                                <Box sx={{ border: "2px solid", borderColor: "success.main", borderRadius: 2.5, overflow: "hidden" }}>
                                    <Box sx={{ position: "relative", height: 180 }}>
                                        <Box
                                            component="iframe"
                                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_API_KEY || ""}&q=${latitude},${longitude}&zoom=15`}
                                            sx={{ width: "100%", height: "100%", border: 0 }}
                                            loading="lazy"
                                            allowFullScreen
                                            title="Map preview"
                                        />
                                        <Box sx={{ position: "absolute", top: 8, right: 8, bgcolor: "success.main", color: "white", px: 1, py: 0.5, borderRadius: 1.5, display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: "white" }}>Confirmed</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ p: 1.5, bgcolor: "background.default", display: "flex", justifyContent: "flex-end" }}>
                                        <Button variant="outlined" size="small" color="error" onClick={handleRemoveMapPin} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>
                                            Remove Pin
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}

                    {sectionDivider}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECTION 4 — DESCRIPTION                        */}
                    {/* ═══════════════════════════════════════════════ */}
                    <SectionHeading
                        icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />}
                        title="Description"
                        subtitle="Add details people should know"
                    />

                    <RichTextEditor
                        label="Description"
                        value={description}
                        onChange={(html) => { setDescription(html); clearFieldError("description"); }}
                        maxLength={DESCRIPTION_MAX}
                        placeholder="What's your event about? Share the details..."
                        minRows={10}
                        error={Boolean(fieldErrors.description)}
                        helperText={fieldErrors.description}
                    />

                    {sectionDivider}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECTION 5 — CATEGORY                           */}
                    {/* ═══════════════════════════════════════════════ */}
                    <SectionHeading
                        icon={<CategoryOutlinedIcon sx={{ fontSize: 18 }} />}
                        title="Category *"
                        subtitle="Choose the best category for your event"
                    />

                    {fieldErrors.categoryId && (
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "error.main", mb: 1.5 }}>
                            {fieldErrors.categoryId}
                        </Typography>
                    )}

                    {/* Subcategory view */}
                    {categoryStage === "sub" && categoryId && subcategoryOptions.length > 0 ? (
                        <Box>
                            {/* Back to main categories */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setCategoryStage("main");
                                        setSubcategoryId("");
                                    }}
                                    sx={{ color: "text.secondary" }}
                                >
                                    <ArrowBackIcon fontSize="small" />
                                </IconButton>
                                {SelectedCatIcon && (
                                    <Box
                                        sx={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.5,
                                            bgcolor: (t) => alpha(t.palette.success.main, 0.12),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <SelectedCatIcon sx={{ fontSize: 16, color: "success.dark" }} />
                                    </Box>
                                )}
                                <Typography sx={{ fontWeight: 800, fontSize: 14.5 }}>
                                    {selectedCatObj?.label || "Category"} — Subcategory
                                </Typography>
                            </Box>

                            <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>
                                Select a subcategory (optional):
                            </Typography>

                            {/* Skip subcategory option */}
                            <Button
                                variant="outlined"
                                onClick={() => { setSubcategoryId(""); }}
                                startIcon={!subcategoryId ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                sx={(t) => ({
                                    justifyContent: "flex-start",
                                    textTransform: "none",
                                    borderRadius: 2,
                                    py: 1,
                                    px: 1.25,
                                    fontWeight: 800,
                                    mb: 1,
                                    width: "100%",
                                    borderColor: !subcategoryId ? t.palette.success.main : t.palette.divider,
                                    backgroundColor: !subcategoryId ? alpha(t.palette.success.main, 0.06) : "transparent",
                                    "&:hover": {
                                        backgroundColor: !subcategoryId ? alpha(t.palette.success.main, 0.10) : "action.hover",
                                    },
                                })}
                            >
                                <Typography sx={{ fontWeight: 800, fontSize: 13, textAlign: "left" }}>
                                    No subcategory (use &quot;{selectedCatObj?.label}&quot; only)
                                </Typography>
                            </Button>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                                    gap: 1,
                                }}
                            >
                                {subcategoryOptions.map((s) => {
                                    const isSelectedSub = String(subcategoryId) === String(s?.id);
                                    return (
                                        <Button
                                            key={s?.id}
                                            onClick={() => {
                                                setSubcategoryId(String(s?.id));
                                                clearFieldError("categoryId");
                                            }}
                                            variant="outlined"
                                            startIcon={isSelectedSub ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                                            sx={(t) => ({
                                                justifyContent: "flex-start",
                                                textTransform: "none",
                                                borderRadius: 2,
                                                py: 1,
                                                px: 1.25,
                                                fontWeight: 800,
                                                borderColor: isSelectedSub ? t.palette.success.main : t.palette.divider,
                                                backgroundColor: isSelectedSub ? alpha(t.palette.success.main, 0.06) : "transparent",
                                                "&:hover": {
                                                    backgroundColor: isSelectedSub ? alpha(t.palette.success.main, 0.10) : "action.hover",
                                                },
                                            })}
                                        >
                                            <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15, textAlign: "left" }}>
                                                {s?.label}
                                            </Typography>
                                        </Button>
                                    );
                                })}
                            </Box>
                        </Box>
                    ) : (
                        /* Main category grid */
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                                gap: 1,
                            }}
                        >
                            {(Array.isArray(categories) ? categories : []).map((cat) => {
                                const CatIcon = EVENT_CATEGORY_ICON_COMPONENTS[cat?.slug] || CategoryRoundedIcon;
                                const isSelected = String(categoryId) === String(cat?.id);
                                const hasSubs = Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;

                                return (
                                    <Button
                                        key={cat?.id}
                                        onClick={() => {
                                            setCategoryId(String(cat?.id));
                                            clearFieldError("categoryId");
                                            if (hasSubs) {
                                                setCategoryStage("sub");
                                                setSubcategoryId("");
                                            } else {
                                                setCategoryStage("main");
                                                setSubcategoryId("");
                                            }
                                        }}
                                        variant="outlined"
                                        sx={(t) => ({
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            textTransform: "none",
                                            borderRadius: 2.5,
                                            py: 1.5,
                                            px: 1,
                                            gap: 0.5,
                                            fontWeight: 800,
                                            minHeight: 72,
                                            borderColor: isSelected ? t.palette.success.main : alpha(t.palette.text.primary, 0.1),
                                            backgroundColor: isSelected ? alpha(t.palette.success.main, 0.06) : "transparent",
                                            "&:hover": {
                                                backgroundColor: isSelected ? alpha(t.palette.success.main, 0.10) : alpha(t.palette.text.primary, 0.03),
                                                borderColor: isSelected ? t.palette.success.main : alpha(t.palette.text.primary, 0.18),
                                            },
                                        })}
                                    >
                                        <CatIcon sx={(t) => ({
                                            fontSize: 22,
                                            color: isSelected ? t.palette.success.dark : t.palette.text.secondary,
                                        })} />
                                        <Typography sx={{ fontWeight: 800, fontSize: 12, lineHeight: 1.15, textAlign: "center" }}>
                                            {cat?.label}
                                        </Typography>
                                        {isSelected && (
                                            <CheckCircleIcon sx={{ fontSize: 16, color: "success.main", position: "absolute", top: 6, right: 6 }} />
                                        )}
                                    </Button>
                                );
                            })}
                        </Box>
                    )}

                    {sectionDivider}

                    {/* ═══════════════════════════════════════════════ */}
                    {/* SECTION 6 — PHOTOS                             */}
                    {/* ═══════════════════════════════════════════════ */}
                    <SectionHeading
                        icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 18 }} />}
                        title="Photos"
                        subtitle={`Add up to ${MAX_PHOTOS} photos — the first is the cover image. Drag to reorder.`}
                    />

                    {fieldErrors.photos && (
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "error.main", mb: 1.5 }}>{fieldErrors.photos}</Typography>
                    )}

                    <PhotosUploadSection
                        photos={photos}
                        setPhotos={setPhotos}
                        disabled={isSubmitting}
                        maxPhotos={MAX_PHOTOS}
                        title=""
                        helperText=""
                        addButtonText="Add photos"
                    />

                    {/* Spacer for footer */}
                    <Box sx={{ height: 16 }} />
                </Box>
            </DialogContent>

            {/* ── FIXED FOOTER ── */}
            <DialogActions sx={{ p: 2, justifyContent: "space-between", gap: 1, flexShrink: 0, borderTop: "1px solid", borderColor: "divider" }}>
                <Box />
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        disabled={isSubmitting || isUploadingPhotos}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploadingPhotos || (authChecked && !isAuthenticated) || (isEdit && limitReached)}
                    >
                        {isUploadingPhotos
                            ? "Uploading photos..."
                            : isSubmitting
                                ? "Saving..."
                                : isEdit ? "Save Changes" : "Create Event"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
