// src/pages/jobs/modals/CreateJobModal.jsx
//
// Single-step create / edit job dialog.
// Uses useActiveAccount() + useAuth() to detect who is logged in.
// Category dropdown matches JobsFilterBar exactly (same slugs, icons, names).
//
// NEW FIELDS (v2):
//   • experienceLevel  — Entry / Mid / Senior / Lead / Executive / Any
//   • benefits         — free-text (perks, insurance, PTO, etc.)
//   • schedule         — free-text (Mon-Fri 8-5, rotating shifts, etc.)
//
import React, { useEffect, useMemo, useRef, useState } from "react";
import { alpha } from "@mui/material/styles";
import { themedInputSx, themedMultilineInputSx } from "../../../components/themedInputSx";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Slide,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";

// Category icons — same set as JobsFilterBar
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import HandymanRoundedIcon from "@mui/icons-material/HandymanRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import PrecisionManufacturingRoundedIcon from "@mui/icons-material/PrecisionManufacturingRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import AgricultureRoundedIcon from "@mui/icons-material/AgricultureRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CityCountySelect from "../../../components/CityCountySelect";
import { createJob, updateJob } from "../api/jobs";
import { useActiveAccount } from "../../../components/AccountContext";
import { useAuth } from "../../../components/AuthModalContext";
import cityData from "../../../data/alabamaCities.json";
import countyData from "../../../data/alabamaCounties.json";
import RichTextEditor from "../../../components/RichTextEditor";
import { stripHtml } from "../../../utils/richTextUtils";
import { checkProfanity } from '../../../utils/profanityCheck';

/* ── Categories — exact same list as JobsFilterBar ── */
const CATEGORIES = [
    { slug: "administrative-office", name: "Administrative & Office", Icon: BusinessCenterRoundedIcon },
    { slug: "accounting-finance", name: "Accounting & Finance", Icon: AccountBalanceRoundedIcon },
    { slug: "sales-business-development", name: "Sales & Business Development", Icon: TrendingUpRoundedIcon },
    { slug: "customer-service-support", name: "Customer Service & Support", Icon: SupportAgentRoundedIcon },
    { slug: "marketing-creative-communications", name: "Marketing, Creative & Communications", Icon: CampaignRoundedIcon },
    { slug: "technology-data", name: "Technology & Data", Icon: MemoryRoundedIcon },
    { slug: "healthcare", name: "Healthcare", Icon: LocalHospitalRoundedIcon },
    { slug: "education-childcare", name: "Education & Childcare", Icon: SchoolRoundedIcon },
    { slug: "skilled-trades-maintenance", name: "Skilled Trades & Maintenance", Icon: HandymanRoundedIcon },
    { slug: "construction-contracting", name: "Construction & Contracting", Icon: ConstructionRoundedIcon },
    { slug: "manufacturing-production", name: "Manufacturing & Production", Icon: PrecisionManufacturingRoundedIcon },
    { slug: "warehouse-transportation-logistics", name: "Warehouse, Transportation & Logistics", Icon: LocalShippingRoundedIcon },
    { slug: "hospitality-food-service", name: "Hospitality & Food Service", Icon: RestaurantRoundedIcon },
    { slug: "retail-merchandising", name: "Retail & Merchandising", Icon: StorefrontRoundedIcon },
    { slug: "cleaning-security-general-labor", name: "Cleaning, Security & General Labor", Icon: CleaningServicesRoundedIcon },
    { slug: "professional-services", name: "Professional Services", Icon: GavelRoundedIcon },
    { slug: "government-public-safety-community", name: "Government, Public Safety & Community", Icon: GppGoodRoundedIcon },
    { slug: "nonprofit-social-services", name: "Nonprofit & Social Services", Icon: VolunteerActivismRoundedIcon },
    { slug: "agriculture-outdoor-environmental", name: "Agriculture, Outdoor & Environmental", Icon: AgricultureRoundedIcon },
    { slug: "other", name: "Other", Icon: CategoryRoundedIcon },
];

/* ── Experience levels ── */
const EXPERIENCE_LEVELS = [
    { value: "", label: "Not specified" },
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "lead", label: "Lead / Manager" },
    { value: "executive", label: "Executive" },
    { value: "any", label: "Any Experience" },
];

/* ── Coordinate resolution from GeoJSON ── */
const stripSuffix = (s) => String(s || "").replace(/ County$/i, "").trim();

function getCoordinatesFromFeature(feature) {
    if (!feature?.geometry) return null;
    const { type, coordinates } = feature.geometry;
    if (type === "Point" && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
        return null;
    }
    if (type === "Polygon" || type === "MultiPolygon") {
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        const walk = (arr) => {
            for (const item of arr) {
                if (Array.isArray(item) && item.length >= 2 && typeof item[0] === "number") {
                    const [lng2, lat2] = item;
                    if (Number.isFinite(lat2) && Number.isFinite(lng2)) {
                        if (lat2 < minLat) minLat = lat2; if (lat2 > maxLat) maxLat = lat2;
                        if (lng2 < minLng) minLng = lng2; if (lng2 > maxLng) maxLng = lng2;
                    }
                } else if (Array.isArray(item)) walk(item);
            }
        };
        walk(coordinates);
        if (Number.isFinite(minLat) && Number.isFinite(maxLat))
            return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
        return null;
    }
    return null;
}

function coordsFromLocalData(city, county) {
    const cityFeatures = cityData?.features || (Array.isArray(cityData) ? cityData : []);
    const countyFeatures = countyData?.features || (Array.isArray(countyData) ? countyData : []);
    if (city) {
        const norm = String(city).trim().toLowerCase();
        const hit = cityFeatures.find((f) =>
            String(f?.properties?.NAME || f?.properties?.name || f?.name || "").trim().toLowerCase() === norm
        );
        if (hit) { const c = getCoordinatesFromFeature(hit); if (c) return c; }
    }
    if (county) {
        const norm = stripSuffix(county).toLowerCase();
        const hit = countyFeatures.find((f) =>
            stripSuffix(f?.properties?.NAME || f?.properties?.name || f?.name || "").toLowerCase() === norm
        );
        if (hit) { const c = getCoordinatesFromFeature(hit); if (c) return c; }
    }
    return null;
}

/* ── Limits ── */
const MAX_TITLE = 120;
const MAX_COMPANY = 100;
const MAX_PAY_NOTE = 60;
const MAX_SALARY = 9999999;
const MAX_HOW_TO_APPLY = 500;
const MAX_DESCRIPTION = 5000;
const MAX_BENEFITS = 1000;
const MAX_SCHEDULE = 200;

/* ── Mobile fullscreen category picker (matches CreateListingModal pattern) ── */
const SlideUpTransition = React.forwardRef(function SlideUp(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function MobileJobCategoryPicker({ open, onClose, categories, selectedCategory, onSelect }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            TransitionComponent={SlideUpTransition}
            PaperProps={{ sx: { bgcolor: "background.paper" } }}
        >
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1, flexShrink: 0 }}>
                <IconButton edge="start" onClick={onClose} aria-label="close" sx={{ mr: 0.5 }}>
                    <ArrowBackRoundedIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Select a Category
                </Typography>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
                <List disablePadding>
                    {categories.map((c) => {
                        const isSelected = c.slug === selectedCategory;
                        return (
                            <ListItemButton
                                key={c.slug}
                                onClick={() => onSelect(c.slug)}
                                selected={isSelected}
                                sx={{
                                    py: 1.5,
                                    px: 2.5,
                                    ...(isSelected && {
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    }),
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <c.Icon sx={{ fontSize: 22, color: "primary.main" }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={c.name}
                                    primaryTypographyProps={{
                                        fontSize: 15,
                                        fontWeight: isSelected ? 800 : 600,
                                    }}
                                />
                                {isSelected && (
                                    <CheckRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>
            </DialogContent>
        </Dialog>
    );
}

export default function CreateJobModal({ open, onClose, onCreated, editingJob }) {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const { user } = useAuth();
    const { activeAccount, isBusinessAccount } = useActiveAccount();

    const isArtist = activeAccount?.type === "artist";
    const isSpecial = isBusinessAccount || isArtist;

    // Resolve identity from active account
    const posterName = useMemo(() => {
        if (isSpecial) return activeAccount?.name || activeAccount?.display_name || "Unknown";
        return [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.handle || "You";
    }, [isSpecial, activeAccount, user]);

    const posterAvatarSrc = useMemo(() => {
        if (isBusinessAccount) return activeAccount?.avatar_url || activeAccount?.logo_url || '';
        if (isArtist) return activeAccount?.avatar_url || '';
        return user?.avatar_url || user?.profile_picture || '';
    }, [isBusinessAccount, isArtist, activeAccount, user]);

    const posterProfilePath = useMemo(() => {
        if (isBusinessAccount && activeAccount?.slug) return `/${activeAccount.slug}`;
        if (isArtist && activeAccount?.slug) return `/${activeAccount.slug}`;
        const handle = user?.handle || user?.public_id || user?.id;
        return handle ? `/${handle}` : null;
    }, [isBusinessAccount, isArtist, activeAccount, user]);

    const posterHandle = useMemo(() => {
        if (isArtist) return activeAccount?.handle || activeAccount?.slug || null;
        if (isBusinessAccount) return activeAccount?.slug || null;
        return user?.handle || null;
    }, [isArtist, isBusinessAccount, activeAccount, user]);

    const posterUsername = useMemo(() => {
        if (isArtist) return activeAccount?.handle || activeAccount?.slug || null;
        if (isBusinessAccount) return activeAccount?.slug || activeAccount?.handle || null;
        return user?.handle || null;
    }, [isArtist, isBusinessAccount, activeAccount, user]);

    const ownerType = isBusinessAccount ? "business" : "individual";
    const businessId = isBusinessAccount ? (activeAccount?.id || null) : null;

    // ── Form fields ──
    const [title, setTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [category, setCategory] = useState("");
    const [catPickerOpen, setCatPickerOpen] = useState(false);
    const [jobType, setJobType] = useState("FT");
    const [workMode, setWorkMode] = useState("On-site");
    const [salaryMin, setSalaryMin] = useState("");
    const [salaryMax, setSalaryMax] = useState("");
    const [payNote, setPayNote] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [benefits, setBenefits] = useState("");
    const [schedule, setSchedule] = useState("");
    const [county, setCounty] = useState("");
    const [city, setCity] = useState("");
    const [howToApply, setHowToApply] = useState("");
    const [description, setDescription] = useState("");
    const [expiresInDays, setExpiresInDays] = useState(30);
    const [submitError, setSubmitError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const contentRef = useRef(null);

    // Reset on open
    const prevOpenRef = React.useRef(false);
    const isEditMode = Boolean(editingJob);
    useEffect(() => {
        if (open && !prevOpenRef.current) {
            if (editingJob) {
                setTitle(editingJob.title || "");
                setCompanyName(editingJob.company || editingJob.companyName || editingJob.company_name || "");
                setCategory(editingJob.category || "");
                setJobType(editingJob.jobType || editingJob.job_type || "FT");
                setWorkMode(editingJob.workMode || editingJob.work_mode || "On-site");
                const rawMin = Number(editingJob.salaryMin || editingJob.salary_min || 0);
                const rawMax = Number(editingJob.salaryMax || editingJob.salary_max || 0);
                setSalaryMin(rawMin > 0 ? String(rawMin) : "");
                setSalaryMax(rawMax > 0 ? String(rawMax) : "");
                setPayNote(editingJob.pay || "");
                setExperienceLevel(editingJob.experienceLevel || editingJob.experience_level || "");
                setBenefits(editingJob.benefits || "");
                setSchedule(editingJob.schedule || "");
                setCounty(editingJob.county || "");
                setCity(editingJob.city || "");
                setHowToApply(editingJob.howToApply || editingJob.how_to_apply || "");
                setDescription(editingJob.description || "");
                const exAt = editingJob.expiresAt || editingJob.expires_at;
                if (exAt) {
                    const remaining = Math.max(1, Math.round((new Date(exAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                    const opts = [7, 14, 30, 60, 90];
                    const closest = opts.reduce((a, b) => Math.abs(b - remaining) < Math.abs(a - remaining) ? b : a);
                    setExpiresInDays(closest);
                } else {
                    setExpiresInDays(30);
                }
            } else {
                setTitle("");
                setCompanyName(isBusinessAccount ? (activeAccount?.name || "") : "");
                setCategory("");
                setJobType("FT");
                setWorkMode("On-site");
                setSalaryMin("");
                setSalaryMax("");
                setPayNote("");
                setExperienceLevel("");
                setBenefits("");
                setSchedule("");
                setCounty(user?.home_county || user?.county || "");
                setCity(user?.home_city || user?.city || "");
                setHowToApply("");
                setDescription("");
                setExpiresInDays(30);
            }
            setSubmitError(null);
            setFieldErrors({});
            setIsSubmitting(false);
        }
        prevOpenRef.current = open;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleClose = () => { if (!isSubmitting) onClose(); };

    const canSubmit =
        title.trim().length > 0 &&
        stripHtml(description).trim().length > 0 &&
        category.trim().length > 0 &&
        Boolean(county && county !== "All Counties");

    const computeLocationLabel = () => {
        const parts = [];
        if (city && city !== "All Cities") parts.push(city);
        if (county && county !== "All Counties") parts.push(county);
        return parts.length ? parts.join(", ") : "Statewide";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || isSubmitting) return;

        // Client-side profanity check — all text fields
        const strippedDesc = stripHtml(String(description || '')).trim();
        const fieldsToCheck = {
            title,
            companyName,
            schedule,
            benefits,
            howToApply,
            description: strippedDesc,
        };

        // The field order in the form — used to find the first offending field
        const fieldOrder = ['title', 'companyName', 'schedule', 'benefits', 'howToApply', 'description'];

        const newFieldErrors = {};
        for (const [fieldName, value] of Object.entries(fieldsToCheck)) {
            if (!value) continue;
            const result = checkProfanity(value);
            if (!result.clean) {
                newFieldErrors[fieldName] = 'Contains inappropriate language. Please revise.';
            }
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            setSubmitError(null);
            // Scroll to the first offending field in form order
            const firstBad = fieldOrder.find(f => newFieldErrors[f]);
            if (firstBad) {
                setTimeout(() => {
                    const el = contentRef.current?.querySelector(`[data-field="${firstBad}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            }
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);
        setFieldErrors({});

        const locationLabel = computeLocationLabel();
        const isStatewide = locationLabel === "Statewide";

        let latitude = null, longitude = null;
        if (!isStatewide) {
            const cleanCity = city && city !== "All Cities" ? city : "";
            const cleanCounty = county && county !== "All Counties" ? county : "";
            const coords = coordsFromLocalData(cleanCity, cleanCounty);
            if (coords) { latitude = coords[0]; longitude = coords[1]; }
        }

        const numMin = salaryMin ? Number(salaryMin) : null;
        const numMax = salaryMax ? Number(salaryMax) : null;

        // Auto-build a display pay string from the numeric values
        const fmtK = (n) => {
            if (!n) return "";
            if (n >= 1000) return `$${Math.round(n / 1000)}k`;
            return `$${n.toLocaleString()}`;
        };
        let autoPay = "";
        if (numMin && numMax && numMin !== numMax) {
            autoPay = `${fmtK(numMin)} – ${fmtK(numMax)}`;
        } else if (numMin) {
            autoPay = fmtK(numMin);
        } else if (numMax) {
            autoPay = fmtK(numMax);
        }
        const payDisplay = autoPay || null;

        const payload = {
            ownerType,
            businessId,
            title: title.trim(),
            companyName: (companyName.trim() || posterName).slice(0, MAX_COMPANY),
            category: category || null,
            jobType,
            workMode,
            pay: payDisplay,
            salaryMin: numMin || null,
            salaryMax: numMax || null,
            experienceLevel: experienceLevel || null,
            benefits: benefits.trim() || null,
            schedule: schedule.trim() || null,
            isStatewide,
            county: county && county !== "All Counties" ? county : null,
            city: city && city !== "All Cities" ? city : null,
            locationLabel,
            latitude,
            longitude,
            posterName,
            posterAvatar: posterAvatarSrc || null,
            posterHandle: posterHandle || null,
            posterProfilePath: posterProfilePath || null,
            howToApply: howToApply.trim() || null,
            description: description.trim(),
            expiresInDays,
        };

        try {
            if (isEditMode) {
                await updateJob(editingJob.id, payload);
            } else {
                await createJob(payload);
            }
            if (onCreated) onCreated();
            onClose();
        } catch (err) {
            // If backend returns a field-specific moderation error, show it inline
            if (err?.field) {
                setFieldErrors(prev => ({ ...prev, [err.field]: err.message || 'Contains inappropriate content. Please revise.' }));
                setTimeout(() => {
                    const el = contentRef.current?.querySelector(`[data-field="${err.field}"]`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            } else {
                setSubmitError(err);
            }
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={(_, reason) => { if (reason === 'backdropClick') return; handleClose(); }} fullWidth maxWidth="md" fullScreen={isMobile} sx={{ zIndex: (t) => t.zIndex.modal + 50 }} PaperProps={{ sx: { bgcolor: "background.paper", borderRadius: isMobile ? 0 : 3 } }}>
            <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                {isEditMode ? (
                    <>
                        <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.25, pb: 1.75, display: "flex", alignItems: "center", gap: 1.25 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: "primary.main", flexShrink: 0 }}>
                                <EditNoteRoundedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 900, fontSize: { xs: 18, sm: 20 }, lineHeight: 1.15, letterSpacing: "-0.02em", color: "text.primary" }}>Edit Job</Typography>
                                <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.15, lineHeight: 1.3 }}>Update your job details below</Typography>
                            </Box>
                            <IconButton size="small" onClick={handleClose} disabled={isSubmitting}
                                        sx={{ color: "text.secondary", bgcolor: (t) => alpha(t.palette.text.primary, 0.04), "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.08) } }} aria-label="Close">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Divider />
                    </>
                ) : (
                    <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 2.25, pb: 1.75 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <WorkOutlineRoundedIcon sx={{ fontSize: 22, color: "primary.main" }} />
                            <Typography sx={{ fontWeight: 900, fontSize: 16.5, lineHeight: 1.2 }}>Create a Job</Typography>
                        </Stack>
                    </Box>
                )}
            </DialogTitle>

            <DialogContent ref={contentRef} dividers sx={{ pt: 1 }}>
                <Box component="form" id="create-job-form" onSubmit={handleSubmit}>
                    <Stack spacing={{ xs: 2.75, sm: 2 }} sx={{ py: 1 }}>
                        {submitError ? (
                            <Alert severity="error">{submitError.message || "Failed to create job."}</Alert>
                        ) : null}

                        {/* Posting as */}
                        <Box sx={(t) => ({
                            borderRadius: 3, border: "1px solid",
                            borderColor: alpha(t.palette.text.primary, 0.10),
                            backgroundColor: "background.paper", p: 1.5,
                        })}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar src={posterAvatarSrc || undefined}
                                        sx={{ width: 38, height: 38, border: "2px solid", borderColor: (t) => alpha(t.palette.text.primary, 0.06), ...(!posterAvatarSrc ? { bgcolor: (t) => alpha(t.palette.primary.main, 0.08), color: 'primary.main' } : {}) }}>
                                    {!posterAvatarSrc ? <PersonRoundedIcon sx={{ fontSize: 22 }} /> : null}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{posterName}</Typography>
                                    {posterUsername ? (
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>@{posterUsername}</Typography>
                                    ) : null}
                                </Box>
                            </Stack>
                        </Box>

                        <TextField label="Job title" value={title} required data-field="title"
                                   onChange={(e) => { setTitle(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.title; return n; }); }} fullWidth
                                   error={Boolean(fieldErrors.title)}
                                   slotProps={{ htmlInput: { maxLength: MAX_TITLE }, input: { sx: themedInputSx } }}
                                   helperText={fieldErrors.title || `${title.length}/${MAX_TITLE}`}
                        />

                        <TextField
                            data-field="companyName"
                            label={isBusinessAccount ? "Company name" : "Company / Employer name"}
                            value={companyName}
                            onChange={(e) => { setCompanyName(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.companyName; return n; }); }}
                            fullWidth disabled={isBusinessAccount}
                            error={Boolean(fieldErrors.companyName)}
                            helperText={fieldErrors.companyName || undefined}
                            slotProps={{ htmlInput: { maxLength: MAX_COMPANY }, input: { sx: themedInputSx } }}
                            placeholder={isBusinessAccount ? "" : "Your business or employer"}
                        />

                        {/* Category */}
                        {isMobile ? (
                            <>
                                <Box
                                    onClick={() => setCatPickerOpen(true)}
                                    sx={(t) => ({
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.25,
                                        px: 1.75,
                                        py: 1.25,
                                        border: "1px solid",
                                        borderColor: alpha(t.palette.text.primary, 0.23),
                                        borderRadius: 1,
                                        cursor: "pointer",
                                        "&:hover": { borderColor: t.palette.text.primary },
                                    })}
                                >
                                    {(() => {
                                        const catObj = CATEGORIES.find((c) => c.slug === category);
                                        if (catObj) {
                                            const CatIcon = catObj.Icon;
                                            return <CatIcon sx={{ fontSize: 22, color: "primary.main" }} />;
                                        }
                                        return <CategoryRoundedIcon sx={{ fontSize: 22, color: "text.disabled" }} />;
                                    })()}
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            flex: 1,
                                            fontWeight: category ? 700 : 400,
                                            color: category ? "text.primary" : "text.secondary",
                                            fontSize: "0.875rem",
                                        }}
                                    >
                                        {category ? CATEGORIES.find((c) => c.slug === category)?.name || category : "Select a category *"}
                                    </Typography>
                                    <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                </Box>

                                <MobileJobCategoryPicker
                                    open={catPickerOpen}
                                    onClose={() => setCatPickerOpen(false)}
                                    categories={CATEGORIES}
                                    selectedCategory={category}
                                    onSelect={(val) => {
                                        setCategory(val);
                                        setCatPickerOpen(false);
                                    }}
                                />
                            </>
                        ) : (
                            <TextField label="Category" value={category} required
                                       onChange={(e) => setCategory(e.target.value)}
                                       size="small" select fullWidth
                                       SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 340, borderRadius: 2 } } } }}
                            >
                                <MenuItem value="">
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CategoryRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                                        <span>Select a category</span>
                                    </Box>
                                </MenuItem>
                                {CATEGORIES.map((c) => (
                                    <MenuItem key={c.slug} value={c.slug}>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <c.Icon sx={{ fontSize: 20, color: "primary.main" }} />
                                            <span>{c.name}</span>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        {/* Job type + Pay row */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField label="Job type" value={jobType}
                                       onChange={(e) => setJobType(e.target.value)}
                                       size="small" select sx={{ flex: 1 }}
                                       SelectProps={{ native: true }}>
                                <option value="FT">Full-time</option>
                                <option value="PT">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Temp">Temporary</option>
                                <option value="Internship">Internship</option>
                            </TextField>
                        </Stack>

                        {/* Salary range */}
                        <Box sx={(t) => ({
                            borderRadius: 3, border: "1px solid",
                            borderColor: alpha(t.palette.text.primary, 0.10),
                            backgroundColor: alpha(t.palette.background.default, 0.45), p: 1.5,
                        })}>
                            <Stack spacing={1.25}>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800 }}>
                                    Salary / Pay (optional)
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                    <TextField
                                        label="Min"
                                        value={salaryMin}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9]/g, "");
                                            if (raw === "" || (Number(raw) >= 0 && Number(raw) <= MAX_SALARY)) {
                                                setSalaryMin(raw);
                                            }
                                        }}
                                        size="small"
                                        sx={{ flex: 1 }}
                                        placeholder="e.g. 45000"
                                        slotProps={{
                                            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
                                            input: {
                                                sx: themedInputSx,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.secondary" }}>$</Typography>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                    <Typography sx={{ pt: 1, fontWeight: 700, color: "text.secondary", fontSize: 14 }}>–</Typography>
                                    <TextField
                                        label="Max"
                                        value={salaryMax}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9]/g, "");
                                            if (raw === "" || (Number(raw) >= 0 && Number(raw) <= MAX_SALARY)) {
                                                setSalaryMax(raw);
                                            }
                                        }}
                                        size="small"
                                        sx={{ flex: 1 }}
                                        placeholder="e.g. 60000"
                                        slotProps={{
                                            htmlInput: { inputMode: "numeric", pattern: "[0-9]*" },
                                            input: {
                                                sx: themedInputSx,
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "text.secondary" }}>$</Typography>
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Work mode + Experience level row */}
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <TextField label="Work mode" value={workMode}
                                       onChange={(e) => setWorkMode(e.target.value)}
                                       size="small" select sx={{ flex: 1 }}
                                       SelectProps={{ native: true }}>
                                <option value="On-site">On-site</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="Remote">Remote</option>
                            </TextField>

                            <TextField
                                label="Experience level"
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value)}
                                size="small" select sx={{ flex: 1 }}
                                SelectProps={{ native: true }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SchoolRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            >
                                {EXPERIENCE_LEVELS.map((lvl) => (
                                    <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
                                ))}
                            </TextField>
                        </Stack>

                        {/* Schedule */}
                        <TextField
                            data-field="schedule"
                            label="Schedule (optional)"
                            value={schedule}
                            onChange={(e) => { setSchedule(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.schedule; return n; }); }}
                            fullWidth
                            error={Boolean(fieldErrors.schedule)}
                            helperText={fieldErrors.schedule || undefined}
                            placeholder="Mon–Fri 8am–5pm, rotating weekends, flexible, etc."
                            slotProps={{
                                htmlInput: { maxLength: MAX_SCHEDULE },
                                input: {
                                    sx: themedInputSx,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EventNoteRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        {/* Benefits */}
                        <TextField
                            data-field="benefits"
                            label="Benefits & Perks (optional)"
                            value={benefits}
                            onChange={(e) => { setBenefits(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.benefits; return n; }); }}
                            fullWidth
                            multiline
                            minRows={2}
                            error={Boolean(fieldErrors.benefits)}
                            placeholder="Health insurance, PTO, 401k match, company vehicle, tuition reimbursement..."
                            slotProps={{
                                htmlInput: { maxLength: MAX_BENEFITS },
                                input: {
                                    sx: themedMultilineInputSx,
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ mt: "0 !important", alignSelf: "flex-start", pt: 1.25 }}>
                                            <CardGiftcardRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            helperText={fieldErrors.benefits || `${benefits.length}/${MAX_BENEFITS}`}
                        />

                        {/* Location */}
                        <Box sx={(t) => ({
                            borderRadius: 3, border: "1px solid",
                            borderColor: alpha(t.palette.text.primary, 0.10),
                            backgroundColor: alpha(t.palette.background.default, 0.45), p: 1.5,
                        })}>
                            <Stack spacing={1}>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800 }}>
                                    Location <Typography component="span" sx={{ color: "error.main", fontWeight: 800, fontSize: "inherit" }}>*</Typography>
                                </Typography>
                                <CityCountySelect
                                    city={city}
                                    setCity={(val) => setCity(typeof val === "string" ? val : "")}
                                    county={county}
                                    setCounty={(val) => setCounty(typeof val === "string" ? val : "")}
                                    countyRequired
                                    cityRequired={false}
                                    emptyCountyLabel="Select county"
                                    emptyCityLabel="Select city"
                                    allCountyValue="Select county"
                                    allCityValue="Select city"
                                    sx={{ m: 0, width: "100%" }}
                                    selectSx={{ width: "100%", "& .MuiInputBase-root": { backgroundColor: "background.paper" } }}
                                />
                            </Stack>
                        </Box>

                        {/* Listing duration */}
                        <TextField
                            select
                            label="Listing duration"
                            value={expiresInDays}
                            onChange={(e) => setExpiresInDays(Number(e.target.value))}
                            fullWidth
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ScheduleRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        >
                            <MenuItem value={7}>7 days</MenuItem>
                            <MenuItem value={14}>14 days</MenuItem>
                            <MenuItem value={30}>30 days (default)</MenuItem>
                            <MenuItem value={60}>60 days</MenuItem>
                            <MenuItem value={90}>90 days</MenuItem>
                        </TextField>

                        <TextField label="How to apply (optional)" value={howToApply} data-field="howToApply"
                                   onChange={(e) => { setHowToApply(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.howToApply; return n; }); }}
                                   fullWidth placeholder="Link, email, phone, or instructions"
                                   error={Boolean(fieldErrors.howToApply)}
                                   helperText={fieldErrors.howToApply || undefined}
                                   slotProps={{ htmlInput: { maxLength: MAX_HOW_TO_APPLY }, input: { sx: themedInputSx } }}
                        />

                        <Box data-field="description">
                            <RichTextEditor
                                label="Description"
                                value={description}
                                onChange={(html) => { setDescription(html); setFieldErrors(prev => { const n = {...prev}; delete n.description; return n; }); }}
                                required
                                error={Boolean(fieldErrors.description)}
                                helperText={fieldErrors.description || undefined}
                                maxLength={MAX_DESCRIPTION}
                                placeholder="Describe the role, responsibilities, qualifications, and anything else applicants should know…"
                                minRows={10}
                            />
                        </Box>

                    </Stack>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: "flex-end", gap: 1 }}>
                <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" form="create-job-form" variant="contained" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? (isEditMode ? "Saving..." : "Posting...") : (isEditMode ? "Save Changes" : "Post Job")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
