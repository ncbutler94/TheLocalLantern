// src/pages/services/modals/CreateServiceRequestModal.jsx
//
// Multi-step service request creation modal (create mode).
// Single scrollable layout (edit mode) — no stepper, everything visible at once.

import React, { useEffect, useRef, useState } from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Step,
    StepLabel,
    Stepper,
    TextField,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import CityCountySelect from "../../../components/CityCountySelect";
import PhotosUploadSection from "../../../components/PhotosUploadSection";
import { useAuth } from "../../../components/AuthModalContext";
import { useActiveAccount } from "../../../components/AccountContext";
import { createServiceRequest, updateServiceRequest } from "../api/servicesApi";

// ─── Local GeoJSON data for coordinate resolution ──────────
import cityData from "../../../data/alabamaCities.json";
import countyData from "../../../data/alabamaCounties.json";
import { SERVICE_CATEGORIES, getServiceCategoryInfo } from "../utils/serviceHelpers";
import RichTextEditor from "../../../components/RichTextEditor";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkFieldsProfanity } from '../../../utils/profanityCheck';
import { secureFetch } from '../../../utils/secureFetch';

// ─── Constants ────────────────────────────────────────────

const STEPS = ["What You Need", "Details", "Photos"];

const TITLE_MAX = 50;
const DESCRIPTION_MAX = 5000;
const BUDGET_NOTES_MAX = 300;
const TIMELINE_NOTES_MAX = 300;
const MAX_PHOTOS = 4;

const URGENCY_OPTIONS = [
    { value: "flexible", label: "Flexible / No Rush" },
    { value: "within_month", label: "Within a Month" },
    { value: "within_week", label: "Within a Week" },
    { value: "asap", label: "ASAP / Urgent" },
];

const BUDGET_TYPE_OPTIONS = [
    { value: "", label: "Not Sure Yet" },
    { value: "hourly", label: "Hourly Rate" },
    { value: "flat", label: "Flat Rate / Project" },
    { value: "flexible", label: "Flexible / Negotiable" },
];

const CONTACT_OPTIONS = [
    { value: "message", label: "In-app Message" },
    { value: "call", label: "Phone Call" },
    { value: "email", label: "Email" },
];

/* ── Theme-aware input styling (matches CreateEditEventModal) ── */
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

// Format a raw phone string like "2566896557" → "(256) 689-6557"
function formatPhoneNumber(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/* ── Stepper labels ── */
const STEPPER_LABEL_SX = {
    "& .MuiStepLabel-label": { fontSize: 12, fontWeight: 700 },
};

/* ── Dialog paper for create mode ── */
const DIALOG_PAPER_CREATE_SX = {
    borderRadius: 3,
    height: "85vh",
    maxHeight: 780,
    display: "flex",
    flexDirection: "column",
};

// ─── Geo helpers ──────────────────────────────────────────

function resolveLocationLabel(city, county) {
    const parts = [];
    if (city) parts.push(city);
    if (county) parts.push(`${county} County`);
    return parts.join(", ") || "Alabama (Statewide)";
}

const stripSuffix = (s) => String(s || "").replace(/ County$/i, "").trim();

/**
 * Extract [lat, lng] from a GeoJSON feature (Point, Polygon, or MultiPolygon).
 * GeoJSON coordinates are [lng, lat]; we return [lat, lng].
 */
function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;

    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }

    if (type === "Polygon" || type === "MultiPolygon") {
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        const rings = type === "Polygon" ? coordinates : coordinates.flat();
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

    return null;
}

/** Returns [lat, lng] for a city or county name, or null if not found. */
function coordsFromLocalData(cityName, countyName) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);

    if (cityName) {
        const norm = String(cityName).trim().toLowerCase();
        const hit = cityFeatures.find((f) => {
            const name = String(f?.properties?.NAME || f?.properties?.name || f?.name || "").trim().toLowerCase();
            return name === norm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    if (countyName) {
        const norm = stripSuffix(countyName).toLowerCase();
        const hit = countyFeatures.find((f) => {
            const name = stripSuffix(f?.properties?.NAME || f?.properties?.name || f?.name || "").toLowerCase();
            return name === norm;
        });
        if (hit) {
            const coords = getCoordinatesFromFeature(hit);
            if (coords) return coords;
        }
    }

    return null;
}

const isAllValue = (val) => {
    const v = String(val || "").trim().toLowerCase();
    return !v || v === "all counties" || v === "all cities" || v === "all" || v === "statewide";
};

// ─── Section heading helper (matches event edit modal pattern) ──

function SectionHeading({ icon, title, subtitle }) {
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

// ─── Component ───────────────────────────────────────────

export default function CreateServiceRequestModal({
                                                      open,
                                                      onClose,
                                                      onSuccess,
                                                      editingRequest = null,
                                                  }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
    const auth = useAuth();
    const { activeAccount, activeBusinessId, activeArtistId } = useActiveAccount();
    const isAuthed = Boolean(auth?.user?.id || auth?.user?.user_id);
    const isEdit = Boolean(editingRequest);

    // Step (create mode only)
    const [activeStep, setActiveStep] = useState(0);
    const [showValidation, setShowValidation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Step 1 fields
    const [title, setTitle] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [description, setDescription] = useState("");

    // Step 2 fields
    const [county, setCounty] = useState("");
    const [city, setCity] = useState("");
    const [urgency, setUrgency] = useState("flexible");
    const [budgetType, setBudgetType] = useState("");
    const [budgetMin, setBudgetMin] = useState("");
    const [budgetMax, setBudgetMax] = useState("");
    const [budgetNotes, setBudgetNotes] = useState("");
    const [timelineNotes, setTimelineNotes] = useState("");
    const [contactPreference, setContactPreference] = useState("message");
    const [contactValue, setContactValue] = useState("");

    // Step 3 fields
    const [photos, setPhotos] = useState([]);

    // Per-field moderation / validation errors (shown inline on inputs)
    const [fieldErrors, setFieldErrors] = useState({});

    const dialogContentRef = useRef(null);
    const scrollBoxRef = useRef(null);

    // Populate when editing
    useEffect(() => {
        if (!open) return;

        if (editingRequest) {
            setTitle(editingRequest.title || "");
            setCategorySlug(editingRequest.categorySlug || editingRequest.category_slug || "");
            setDescription(editingRequest.description || "");
            setCounty(editingRequest.county || "");
            setCity(editingRequest.city || "");
            setUrgency(editingRequest.urgency || "flexible");
            setBudgetType(editingRequest.budgetType || editingRequest.budget_type || "");
            setBudgetMin(editingRequest.budgetMin != null ? String(editingRequest.budgetMin) : "");
            setBudgetMax(editingRequest.budgetMax != null ? String(editingRequest.budgetMax) : "");
            setBudgetNotes(editingRequest.budgetNotes || editingRequest.budget_notes || "");
            setTimelineNotes(editingRequest.timelineNotes || editingRequest.timeline_notes || "");
            setContactPreference(editingRequest.contactPreference || editingRequest.contact_preference || "message");
            setContactValue(editingRequest.contactValue || editingRequest.contact_value || "");
            setPhotos(Array.isArray(editingRequest.photos) ? editingRequest.photos : []);
        } else {
            setTitle("");
            setCategorySlug("");
            setDescription("");
            setCounty("");
            setCity("");
            setUrgency("flexible");
            setBudgetType("");
            setBudgetMin("");
            setBudgetMax("");
            setBudgetNotes("");
            setTimelineNotes("");
            setContactPreference("message");
            setContactValue("");
            setPhotos([]);
        }

        setActiveStep(0);
        setShowValidation(false);
        setFieldErrors({});
        setIsSubmitting(false);
        setSubmitError("");
        setSubmitSuccess(false);
    }, [open, editingRequest]);

    // Scroll to top on step change (create mode)
    useEffect(() => {
        if (dialogContentRef.current) {
            dialogContentRef.current.scrollTop = 0;
        }
    }, [activeStep]);

    // Validation
    const titleValid = title.trim().length > 0 && title.trim().length <= TITLE_MAX;
    const categoryValid = Boolean(categorySlug);
    const locationValid = true;
    const contactValid = contactPreference === "message" || contactValue.trim().length > 0;

    const step1Valid = titleValid && categoryValid;
    const step2Valid = locationValid && contactValid;

    const canGoNext = () => {
        if (activeStep === 0) return step1Valid;
        if (activeStep === 1) return step2Valid;
        return true;
    };

    const handleClose = (_, reason) => {
        if (reason === "backdropClick") return;
        if (isSubmitting) return;
        if (typeof onClose === "function") onClose();
    };

    const clearFieldError = (key) => {
        setFieldErrors((prev) => {
            if (!prev || !prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const goNext = async () => {
        if (!canGoNext()) {
            setShowValidation(true);
            return;
        }

        // ── Per-step profanity / moderation checks ──
        const errs = {};

        if (activeStep === 0) {
            // Check title
            const titleCheck = checkFieldsProfanity({ title: title.trim() });
            if (!titleCheck.clean) {
                errs.title = "Title contains inappropriate language. Please revise.";
            }

            // Check description (if provided)
            const strippedDesc = stripHtml(description || "").trim();
            if (strippedDesc) {
                const descCheck = checkFieldsProfanity({ description: strippedDesc });
                if (!descCheck.clean) {
                    errs.description = "Description contains inappropriate language. Please revise.";
                }
            }
        }

        if (activeStep === 1) {
            // Check timeline notes
            const trimmedTimeline = (timelineNotes || "").trim();
            if (trimmedTimeline) {
                const timelineCheck = checkFieldsProfanity({ timelineNotes: trimmedTimeline });
                if (!timelineCheck.clean) {
                    errs.timelineNotes = "Timeline notes contain inappropriate language. Please revise.";
                }
            }

            // Check budget notes
            const trimmedBudget = (budgetNotes || "").trim();
            if (trimmedBudget) {
                const budgetCheck = checkFieldsProfanity({ budgetNotes: trimmedBudget });
                if (!budgetCheck.clean) {
                    errs.budgetNotes = "Budget notes contain inappropriate language. Please revise.";
                }
            }
        }

        if (activeStep === 2) {
            // Photos are uploaded (and moderated) server-side when the
            // request is submitted. We used to run a client-side NSFW scan
            // in a sequential for loop here just to advance the step, which
            // meant a 4-photo request took ~4 scan round-trips to hit Next.
            // The server check is authoritative; no need to duplicate it.
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }

        setFieldErrors({});
        setShowValidation(false);
        setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const goBack = () => {
        setShowValidation(false);
        setFieldErrors({});
        setActiveStep((s) => Math.max(s - 1, 0));
    };

    const handleSubmit = async () => {
        if (!step1Valid || !step2Valid) {
            setShowValidation(true);
            return;
        }

        // ── Client-side profanity check on all text fields before submit ──
        const errs = {};
        const titleCheck = checkFieldsProfanity({ title: title.trim() });
        if (!titleCheck.clean) {
            errs.title = "Title contains inappropriate language. Please revise.";
        }

        const strippedDesc = stripHtml(description || "").trim();
        if (strippedDesc) {
            const descCheck = checkFieldsProfanity({ description: strippedDesc });
            if (!descCheck.clean) {
                errs.description = "Description contains inappropriate language. Please revise.";
            }
        }

        const trimmedTimeline = (timelineNotes || "").trim();
        if (trimmedTimeline) {
            const timelineCheck = checkFieldsProfanity({ timelineNotes: trimmedTimeline });
            if (!timelineCheck.clean) {
                errs.timelineNotes = "Timeline notes contain inappropriate language. Please revise.";
            }
        }

        const trimmedBudget = (budgetNotes || "").trim();
        if (trimmedBudget) {
            const budgetCheck = checkFieldsProfanity({ budgetNotes: trimmedBudget });
            if (!budgetCheck.clean) {
                errs.budgetNotes = "Budget notes contain inappropriate language. Please revise.";
            }
        }

        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            setSubmitError("Your request contains inappropriate language. Please revise the flagged fields and try again.");
            return;
        }

        setFieldErrors({});
        setIsSubmitting(true);
        setSubmitError("");

        try {
            const personalName = [auth?.user?.first_name, auth?.user?.last_name].filter(Boolean).join(" ");
            const locationLabel = resolveLocationLabel(city, county);

            // Resolve requester identity from active account.
            let requesterType = "user";
            let requesterProfileId = null;
            let requesterName = personalName;
            let requesterAvatar = auth?.user?.avatar_url || auth?.user?.profile_picture || null;
            let requesterHandle = auth?.user?.handle || null;

            if (activeBusinessId) {
                requesterType = "business";
                requesterProfileId = activeBusinessId;
                requesterName = activeAccount?.name || activeAccount?.business_name || personalName;
                requesterAvatar = activeAccount?.avatar_url || activeAccount?.avatarUrl || activeAccount?.logo_url || activeAccount?.logoUrl || requesterAvatar;
                requesterHandle = activeAccount?.handle || activeAccount?.slug || activeAccount?.username || requesterHandle;
            } else if (activeArtistId) {
                requesterType = "artist";
                requesterProfileId = activeArtistId;
                requesterName = activeAccount?.name || activeAccount?.artist_name || personalName;
                requesterAvatar = activeAccount?.avatar_url || activeAccount?.avatarUrl || requesterAvatar;
                requesterHandle = activeAccount?.handle || activeAccount?.slug || activeAccount?.username || requesterHandle;
            }

            // Resolve coordinates from local GeoJSON data
            let latitude = null;
            let longitude = null;
            if (city || county) {
                const effectiveCity = isAllValue(city) ? "" : city;
                const effectiveCounty = isAllValue(county) ? "" : county;
                if (effectiveCity || effectiveCounty) {
                    const coords = coordsFromLocalData(effectiveCity, effectiveCounty);
                    if (coords) {
                        latitude = coords[0];
                        longitude = coords[1];
                    }
                }
            }

            const payload = {
                title: title.trim(),
                categorySlug,
                description: stripHtml(description).trim() ? description : null,
                county: county || null,
                city: city || null,
                locationLabel,
                latitude,
                longitude,
                urgency,
                budgetType: budgetType || null,
                budgetMin: budgetMin ? Number(budgetMin) : null,
                budgetMax: budgetMax ? Number(budgetMax) : null,
                budgetNotes: budgetNotes.trim() || null,
                timelineNotes: timelineNotes.trim() || null,
                contactPreference,
                contactValue: contactValue.trim() || null,
                requesterName: requesterName,
                requesterAvatar: requesterAvatar,
                requesterHandle: requesterHandle,
                requesterType: requesterType,
                requesterProfileId: requesterProfileId,
            };

            // Separate new file uploads from existing (kept) photo URLs
            const newFiles = photos
                .filter((p) => p && p.file)
                .map((p) => p.file);
            const existingUrls = photos
                .filter((p) => p && !p.file && p.url)
                .map((p) => p.url);

            // Photos are uploaded and moderated server-side by
            // createServiceRequest / updateServiceRequest. The old code ran
            // an additional sequential NSFW pre-scan here — removed, since
            // it duplicated the server check and made submits laggy.

            if (isEdit && editingRequest?.id) {
                await updateServiceRequest(editingRequest.id, payload, newFiles, existingUrls);
            } else {
                await createServiceRequest(payload, newFiles);
            }

            if (typeof onSuccess === "function") onSuccess();
            if (typeof onClose === "function") onClose();
        } catch (err) {
            setSubmitError(err?.message || "Failed to save request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Section divider (edit mode) ──
    const sectionDivider = (
        <Divider sx={{ my: { xs: 2.5, sm: 3 } }} />
    );

    /* ═══════════════════════════════════════════════════════════
       EDIT MODE — single scrollable layout, no stepper
       ═══════════════════════════════════════════════════════════ */
    if (isEdit) {
        return (
            <Dialog
                open={Boolean(open)}
                onClose={handleClose}
                fullWidth
                maxWidth="lg"
                fullScreen={fullScreen}
                sx={fullScreen ? {
                    // Ensure the dialog layers above BOTH the top AppBar and the
                    // bottom mobile nav so the edit form is truly fullscreen.
                    zIndex: (t) => t.zIndex.modal + 10,
                    '& .MuiDialog-container': {
                        alignItems: 'stretch',
                    },
                } : undefined}
                PaperProps={{
                    sx: {
                        bgcolor: "background.paper",
                        borderRadius: fullScreen ? 0 : 4,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        height: fullScreen ? "100dvh" : { xs: "92vh", md: "88vh" },
                        '@supports not (height: 1dvh)': fullScreen ? { height: '100vh' } : {},
                        maxHeight: fullScreen ? "none" : "95vh",
                        // On mobile fullscreen, pin to all edges so nothing peeks through
                        ...(fullScreen && {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            m: 0,
                            maxWidth: '100%',
                            maxHeight: '100%',
                            pt: 'env(safe-area-inset-top, 0px)',
                        }),
                    },
                }}
            >
                {/* ── HEADER ── */}
                <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                    <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.25, pb: 1.75, display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                            sx={{
                                width: 36, height: 36, borderRadius: 2.5,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                color: "primary.main", flexShrink: 0,
                            }}
                        >
                            <EditNoteRoundedIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 20 }, lineHeight: 1.15, letterSpacing: "-0.02em", color: "text.primary" }}>
                                Edit Request
                            </Typography>
                            <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.15, lineHeight: 1.3 }}>
                                Update your service request details below
                            </Typography>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            sx={{
                                color: "text.secondary",
                                bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
                                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) },
                            }}
                            aria-label="Close"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Divider />
                </DialogTitle>

                {/* ── AUTH GATE ── */}
                {!isAuthed && (
                    <Box sx={{ px: 3, py: 2 }}>
                        <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                            Please sign in to edit a service request.
                        </Alert>
                    </Box>
                )}

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
                        {submitError && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{submitError}</Alert>
                        )}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECTION 1 — WHAT YOU NEED                      */}
                        {/* ═══════════════════════════════════════════════ */}
                        <SectionHeading
                            icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="What You Need"
                            subtitle="Describe the service you're looking for"
                        />

                        {/* Title */}
                        <TextField
                            label="Title"
                            placeholder='e.g. "Need a plumber for kitchen sink"'
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); clearFieldError("title"); }}
                            error={(showValidation && !titleValid) || Boolean(fieldErrors.title)}
                            helperText={
                                fieldErrors.title
                                    ? fieldErrors.title
                                    : showValidation && !titleValid
                                        ? "Title is required (max 50 characters)."
                                        : `${title.length}/${TITLE_MAX}`
                            }
                            fullWidth
                            inputProps={{ maxLength: TITLE_MAX, style: { fontSize: 14 } }}
                            sx={{ ...INPUT_SX, mb: 2 }}
                        />

                        {/* Category */}
                        <FormControl
                            size="small"
                            fullWidth
                            error={showValidation && !categoryValid}
                            sx={{ ...INPUT_SX, mb: 2 }}
                        >
                            <InputLabel>Category</InputLabel>
                            <Select
                                label="Category"
                                value={categorySlug}
                                onChange={(e) => setCategorySlug(e.target.value)}
                                native={fullScreen}
                                {...(!fullScreen && {
                                    MenuProps: {
                                        PaperProps: {
                                            sx: { maxHeight: 260 },
                                        },
                                    },
                                })}
                            >
                                {fullScreen ? (
                                    <>
                                        <option value="" disabled />
                                        {SERVICE_CATEGORIES.map((cat) => (
                                            <option key={cat.slug} value={cat.slug}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </>
                                ) : (
                                    SERVICE_CATEGORIES.map((cat) => {
                                        const CatIcon = cat.Icon;
                                        return (
                                            <MenuItem key={cat.slug} value={cat.slug}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {CatIcon ? <CatIcon fontSize="small" sx={{ color: "primary.main" }} /> : null}
                                                    <Typography component="span">{cat.name}</Typography>
                                                </Box>
                                            </MenuItem>
                                        );
                                    })
                                )}
                            </Select>
                            {showValidation && !categoryValid && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    Please select a category.
                                </Typography>
                            )}
                        </FormControl>

                        {/* Description */}
                        <Box>
                            <RichTextEditor
                                label="Description"
                                placeholder="Describe the work needed, any specific requirements, preferred timeline, etc."
                                value={description}
                                onChange={(html) => { setDescription(html); clearFieldError("description"); }}
                                maxLength={DESCRIPTION_MAX}
                                minRows={6}
                                error={Boolean(fieldErrors.description)}
                            />
                            {fieldErrors.description && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: "block" }}>
                                    {fieldErrors.description}
                                </Typography>
                            )}
                        </Box>

                        {sectionDivider}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECTION 2 — LOCATION                           */}
                        {/* ═══════════════════════════════════════════════ */}
                        <SectionHeading
                            icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="Location"
                            subtitle="Where do you need this service?"
                        />

                        <Box sx={SELECT_WRAPPER_SX}>
                            <CityCountySelect
                                county={county}
                                setCounty={setCounty}
                                city={city}
                                setCity={setCity}
                            />
                        </Box>

                        {sectionDivider}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECTION 3 — URGENCY & TIMELINE                 */}
                        {/* ═══════════════════════════════════════════════ */}
                        <SectionHeading
                            icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                            title="Urgency & Timeline"
                            subtitle="How soon do you need the work done?"
                        />

                        <FormControl size="small" fullWidth sx={{ ...INPUT_SX, mb: 2 }}>
                            <InputLabel>How soon do you need this?</InputLabel>
                            <Select
                                label="How soon do you need this?"
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}
                            >
                                {URGENCY_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Timeline Details (optional)"
                            placeholder='e.g. "Need this done before Christmas" or "Flexible on dates"'
                            value={timelineNotes}
                            onChange={(e) => { setTimelineNotes(e.target.value); clearFieldError("timelineNotes"); }}
                            error={Boolean(fieldErrors.timelineNotes)}
                            helperText={fieldErrors.timelineNotes || ""}
                            fullWidth
                            inputProps={{ maxLength: TIMELINE_NOTES_MAX }}
                            sx={INPUT_SX}
                        />

                        {sectionDivider}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECTION 4 — BUDGET                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        <SectionHeading
                            icon={<AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />}
                            title="Budget"
                            subtitle="Give providers an idea of your budget (optional)"
                        />

                        <FormControl size="small" fullWidth sx={{ ...INPUT_SX, mb: 2 }}>
                            <InputLabel>Budget Type</InputLabel>
                            <Select
                                label="Budget Type"
                                value={budgetType}
                                onChange={(e) => setBudgetType(e.target.value)}
                            >
                                {BUDGET_TYPE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {budgetType && budgetType !== "flexible" && (
                            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                                <TextField
                                    label="Min"
                                    placeholder="0"
                                    value={budgetMin}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        if (v.length <= 10) setBudgetMin(v);
                                    }}
                                    size="small"
                                    inputProps={{ maxLength: 10 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ flex: 1, ...INPUT_SX }}
                                />
                                <TextField
                                    label="Max"
                                    placeholder="0"
                                    value={budgetMax}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        if (v.length <= 10) setBudgetMax(v);
                                    }}
                                    size="small"
                                    inputProps={{ maxLength: 10 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ flex: 1, ...INPUT_SX }}
                                />
                            </Stack>
                        )}

                        <TextField
                            label="Budget Notes (optional)"
                            placeholder='e.g. "Willing to pay more for quality"'
                            value={budgetNotes}
                            onChange={(e) => { setBudgetNotes(e.target.value); clearFieldError("budgetNotes"); }}
                            error={Boolean(fieldErrors.budgetNotes)}
                            helperText={fieldErrors.budgetNotes || ""}
                            fullWidth
                            inputProps={{ maxLength: BUDGET_NOTES_MAX }}
                            sx={INPUT_SX}
                        />

                        {sectionDivider}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECTION 5 — CONTACT PREFERENCE                 */}
                        {/* ═══════════════════════════════════════════════ */}
                        <SectionHeading
                            icon={<ContactMailOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="Contact Preference"
                            subtitle="How should providers reach you?"
                        />

                        <FormControl size="small" fullWidth sx={{ ...INPUT_SX, mb: 2 }}>
                            <InputLabel>How should providers reach you?</InputLabel>
                            <Select
                                label="How should providers reach you?"
                                value={contactPreference}
                                onChange={(e) => setContactPreference(e.target.value)}
                            >
                                {CONTACT_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {contactPreference !== "message" && (
                            <TextField
                                label={contactPreference === "call" ? "Phone Number" : "Email Address"}
                                placeholder={contactPreference === "call" ? "(205) 555-1234" : "you@example.com"}
                                value={contactPreference === "call" ? formatPhoneNumber(contactValue) : contactValue}
                                onChange={(e) => {
                                    if (contactPreference === "call") {
                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setContactValue(digits);
                                    } else {
                                        setContactValue(e.target.value);
                                    }
                                }}
                                fullWidth
                                required
                                error={showValidation && !contactValid}
                                helperText={showValidation && !contactValid ? (contactPreference === "call" ? "Phone number is required." : "Email address is required.") : ""}
                                inputProps={{ maxLength: 200 }}
                                sx={{ ...INPUT_SX, mb: 1 }}
                            />
                        )}

                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                            Your contact info stays private until you accept a provider&rsquo;s response.
                        </Typography>

                        {sectionDivider}

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECTION 6 — PHOTOS                             */}
                        {/* ═══════════════════════════════════════════════ */}
                        <SectionHeading
                            icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="Photos"
                            subtitle="Add up to 4 photos to help providers understand what you need"
                        />

                        <PhotosUploadSection
                            photos={photos}
                            setPhotos={setPhotos}
                            disabled={isSubmitting}
                            maxPhotos={MAX_PHOTOS}
                            title=""
                            helperText="Photos of the work area, issue, or reference images are helpful."
                            addButtonText="Add photos"
                        />

                        {/* Spacer for footer */}
                        <Box sx={{ height: 16 }} />
                    </Box>
                </DialogContent>

                {/* ── FIXED FOOTER ── */}
                <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider" }}>
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="flex-end"
                        spacing={1.25}
                        sx={{ px: { xs: 2.5, sm: 3 }, py: 1.75 }}
                    >
                        <Button
                            variant="outlined"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                borderRadius: 2,
                                px: 2.5,
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={!isAuthed || isSubmitting}
                            sx={{
                                textTransform: "none",
                                fontWeight: 900,
                                borderRadius: 2,
                                px: 3,
                                minWidth: 120,
                            }}
                        >
                            {isSubmitting ? "Saving\u2026" : "Save Changes"}
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        );
    }

    /* ═══════════════════════════════════════════════════════════
       CREATE MODE — stepper-based layout (mobile-friendly, matches event modal)
       ═══════════════════════════════════════════════════════════ */
    const isLastStep = activeStep === STEPS.length - 1;

    return (
        <Dialog
            open={Boolean(open)}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            PaperProps={{
                sx: {
                    ...DIALOG_PAPER_CREATE_SX,
                    borderRadius: fullScreen ? 0 : 3,
                    height: fullScreen ? "100%" : DIALOG_PAPER_CREATE_SX.height,
                    maxHeight: fullScreen ? "100%" : DIALOG_PAPER_CREATE_SX.maxHeight,
                    ...(fullScreen && { pt: 'env(safe-area-inset-top, 0px)' }),
                },
            }}
        >
            {/* ── TITLE ── */}
            <DialogTitle sx={{ display: "flex", alignItems: "center", pb: 1, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Request a Service
                </Typography>
            </DialogTitle>

            {/* ── STEPPER ── */}
            <Box sx={{ px: 3, pb: 1, flexShrink: 0 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={STEPPER_LABEL_SX}>
                    {STEPS.map((label, idx) => (
                        <Step
                            key={label}
                            completed={idx < activeStep}
                            sx={{ cursor: idx < activeStep ? "pointer" : "default" }}
                            onClick={() => { if (idx < activeStep) setActiveStep(idx); }}
                        >
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            {/* ── AUTH GATE ── */}
            {!isAuthed && (
                <Box sx={{ px: 3, py: 1 }}>
                    <Alert severity="info" sx={{ borderRadius: 2.5 }}>
                        Please sign in to post a service request.
                    </Alert>
                </Box>
            )}

            {/* ── CONTENT ── */}
            <DialogContent
                ref={dialogContentRef}
                sx={{ pt: 1.5, flex: 1, overflow: "auto" }}
            >
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>{submitError}</Alert>
                )}

                {/* ════════════ STEP 1: WHAT YOU NEED ════════════ */}
                {activeStep === 0 && (
                    <Stack spacing={2.5}>
                        <SectionHeading
                            icon={<DescriptionOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="What You Need"
                            subtitle="Describe what you're looking for"
                        />

                        {/* Title */}
                        <TextField
                            label="Title"
                            placeholder='e.g. "Need a plumber for kitchen sink"'
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); clearFieldError("title"); }}
                            error={(showValidation && !titleValid) || Boolean(fieldErrors.title)}
                            helperText={
                                fieldErrors.title
                                    ? fieldErrors.title
                                    : showValidation && !titleValid
                                        ? "Title is required (max 50 characters)."
                                        : `${title.length}/${TITLE_MAX}`
                            }
                            fullWidth
                            autoFocus
                            inputProps={{ maxLength: TITLE_MAX, autoComplete: "off", "data-form-type": "other", "data-lpignore": "true", style: { fontSize: 14 } }}
                            autoComplete="off"
                            name="service-title-field"
                            sx={INPUT_SX}
                        />

                        {/* Category */}
                        <FormControl
                            size="small"
                            fullWidth
                            error={showValidation && !categoryValid}
                            sx={INPUT_SX}
                        >
                            <InputLabel>Category</InputLabel>
                            <Select
                                label="Category"
                                value={categorySlug}
                                onChange={(e) => setCategorySlug(e.target.value)}
                                native={fullScreen}
                                {...(!fullScreen && {
                                    MenuProps: {
                                        PaperProps: {
                                            sx: { maxHeight: 260 },
                                        },
                                    },
                                })}
                            >
                                {fullScreen ? (
                                    <>
                                        <option value="" disabled />
                                        {SERVICE_CATEGORIES.map((cat) => (
                                            <option key={cat.slug} value={cat.slug}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </>
                                ) : (
                                    SERVICE_CATEGORIES.map((cat) => {
                                        const CatIcon = cat.Icon;
                                        return (
                                            <MenuItem key={cat.slug} value={cat.slug}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                    {CatIcon ? <CatIcon fontSize="small" sx={{ color: "primary.main" }} /> : null}
                                                    <Typography component="span">{cat.name}</Typography>
                                                </Box>
                                            </MenuItem>
                                        );
                                    })
                                )}
                            </Select>
                            {showValidation && !categoryValid && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                    Please select a category.
                                </Typography>
                            )}
                        </FormControl>

                        {/* Description */}
                        <Box>
                            <RichTextEditor
                                label="Description"
                                placeholder="Describe the work needed, any specific requirements, preferred timeline, etc."
                                value={description}
                                onChange={(html) => { setDescription(html); clearFieldError("description"); }}
                                maxLength={DESCRIPTION_MAX}
                                minRows={8}
                                error={Boolean(fieldErrors.description)}
                            />
                            {fieldErrors.description && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, display: "block" }}>
                                    {fieldErrors.description}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                )}

                {/* ════════════ STEP 2: DETAILS ════════════ */}
                {activeStep === 1 && (
                    <Stack spacing={2.5}>
                        {/* ── Location ── */}
                        <SectionHeading
                            icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="Location"
                            subtitle="Where do you need this service?"
                        />
                        <Box sx={SELECT_WRAPPER_SX}>
                            <CityCountySelect
                                county={county}
                                setCounty={setCounty}
                                city={city}
                                setCity={setCity}
                            />
                        </Box>

                        {/* ── Urgency & Timeline ── */}
                        <SectionHeading
                            icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                            title="Urgency & Timeline"
                            subtitle="How soon do you need the work done?"
                        />

                        <FormControl size="small" fullWidth sx={INPUT_SX}>
                            <InputLabel>How soon do you need this?</InputLabel>
                            <Select
                                label="How soon do you need this?"
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}
                            >
                                {URGENCY_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Timeline Details (optional)"
                            placeholder='e.g. "Need this done before Christmas" or "Flexible on dates"'
                            value={timelineNotes}
                            onChange={(e) => { setTimelineNotes(e.target.value); clearFieldError("timelineNotes"); }}
                            error={Boolean(fieldErrors.timelineNotes)}
                            helperText={fieldErrors.timelineNotes || ""}
                            fullWidth
                            inputProps={{ maxLength: TIMELINE_NOTES_MAX }}
                            sx={INPUT_SX}
                        />

                        {/* ── Budget ── */}
                        <SectionHeading
                            icon={<AttachMoneyRoundedIcon sx={{ fontSize: 18 }} />}
                            title="Budget"
                            subtitle="Give providers an idea of your budget (optional)"
                        />

                        <FormControl size="small" fullWidth sx={INPUT_SX}>
                            <InputLabel>Budget Type</InputLabel>
                            <Select
                                label="Budget Type"
                                value={budgetType}
                                onChange={(e) => setBudgetType(e.target.value)}
                            >
                                {BUDGET_TYPE_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {budgetType && budgetType !== "flexible" && (
                            <Stack direction="row" spacing={1.5}>
                                <TextField
                                    label="Min"
                                    placeholder="0"
                                    value={budgetMin}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        if (v.length <= 10) setBudgetMin(v);
                                    }}
                                    size="small"
                                    inputProps={{ maxLength: 10 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ flex: 1, ...INPUT_SX }}
                                />
                                <TextField
                                    label="Max"
                                    placeholder="0"
                                    value={budgetMax}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9.]/g, "");
                                        if (v.length <= 10) setBudgetMax(v);
                                    }}
                                    size="small"
                                    inputProps={{ maxLength: 10 }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    sx={{ flex: 1, ...INPUT_SX }}
                                />
                            </Stack>
                        )}

                        <TextField
                            label="Budget Notes (optional)"
                            placeholder='e.g. "Willing to pay more for quality" or "Looking for affordable options"'
                            value={budgetNotes}
                            onChange={(e) => { setBudgetNotes(e.target.value); clearFieldError("budgetNotes"); }}
                            error={Boolean(fieldErrors.budgetNotes)}
                            helperText={fieldErrors.budgetNotes || ""}
                            fullWidth
                            inputProps={{ maxLength: BUDGET_NOTES_MAX }}
                            sx={INPUT_SX}
                        />

                        {/* ── Contact ── */}
                        <SectionHeading
                            icon={<ContactMailOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="Contact Preference"
                            subtitle="How should providers reach you?"
                        />

                        <FormControl size="small" fullWidth sx={INPUT_SX}>
                            <InputLabel>How should providers reach you? *</InputLabel>
                            <Select
                                label="How should providers reach you? *"
                                value={contactPreference}
                                onChange={(e) => setContactPreference(e.target.value)}
                            >
                                {CONTACT_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {contactPreference !== "message" && (
                            <TextField
                                label={contactPreference === "call" ? "Phone Number" : "Email Address"}
                                placeholder={contactPreference === "call" ? "(205) 555-1234" : "you@example.com"}
                                value={contactPreference === "call" ? formatPhoneNumber(contactValue) : contactValue}
                                onChange={(e) => {
                                    if (contactPreference === "call") {
                                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setContactValue(digits);
                                    } else {
                                        setContactValue(e.target.value);
                                    }
                                }}
                                fullWidth
                                required
                                error={showValidation && !contactValid}
                                helperText={showValidation && !contactValid ? (contactPreference === "call" ? "Phone number is required." : "Email address is required.") : ""}
                                inputProps={{ maxLength: 200 }}
                                sx={INPUT_SX}
                            />
                        )}

                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            Your contact info stays private until you accept a provider&rsquo;s response.
                        </Typography>
                    </Stack>
                )}

                {/* ════════════ STEP 3: PHOTOS ════════════ */}
                {activeStep === 2 && (
                    <Stack spacing={2.5}>
                        <SectionHeading
                            icon={<PhotoLibraryOutlinedIcon sx={{ fontSize: 18 }} />}
                            title="Photos"
                            subtitle="Add up to 4 photos to help providers understand what you need. Photos of the work area, issue, or reference images are helpful."
                        />
                        <PhotosUploadSection
                            photos={photos}
                            setPhotos={(newPhotos) => { setPhotos(newPhotos); clearFieldError("photos"); }}
                            disabled={isSubmitting}
                            maxPhotos={MAX_PHOTOS}
                            title=""
                            helperText=""
                            addButtonText="Add photos"
                        />
                        {fieldErrors.photos && (
                            <Alert severity="error" sx={{ borderRadius: 2.5 }}>
                                {fieldErrors.photos}
                            </Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>

            {/* ── NAVIGATION FOOTER ── */}
            <DialogActions sx={{ p: 2, justifyContent: "space-between", gap: 1, flexShrink: 0, borderTop: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {activeStep > 0 ? (
                        <Button
                            variant="outlined"
                            onClick={goBack}
                            disabled={isSubmitting}
                            sx={{ minWidth: { xs: 0, sm: 64 }, px: { xs: 1.5, sm: 2 } }}
                            startIcon={<ArrowBackRoundedIcon />}
                        >
                            Back
                        </Button>
                    ) : null}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={isLastStep ? handleSubmit : goNext}
                        disabled={isSubmitting || !isAuthed}
                        sx={{ minWidth: { xs: 0, sm: 120 }, px: { xs: 2, sm: 3 } }}
                        endIcon={
                            isSubmitting
                                ? <CircularProgress size={16} color="inherit" />
                                : isLastStep
                                    ? <CheckRoundedIcon />
                                    : <ArrowForwardRoundedIcon />
                        }
                    >
                        {isSubmitting ? "Posting\u2026" : isLastStep ? "Post Request" : "Next"}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
